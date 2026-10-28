-- Only new inserts are notified. Existing requests are not sent retroactively.
create extension if not exists pg_net with schema extensions;
-- pg_net has platform-managed grants. Never put contact data or reusable secrets in it.
create schema if not exists private;
create table private.email_hook_config (singleton boolean primary key default true check(singleton), secret text not null);
alter table private.email_hook_config enable row level security;
revoke all on schema private from public, anon, authenticated;
revoke all on private.email_hook_config from public, anon, authenticated;
grant usage on schema private to service_role;
grant select on private.email_hook_config to service_role;
-- Provision a random secret here separately, and the same value as EMAIL_HOOK_SECRET on Vercel.
create table public.request_email_notifications (
  request_id uuid primary key references public.simulation_requests(id) on delete cascade,
  network_request_id bigint,
  status text not null check (status in ('queued','processing','accepted','activation_required','failed','unknown')),
  http_status integer,
  created_at timestamptz not null default now(),
  checked_at timestamptz
);
alter table public.request_email_notifications enable row level security;
revoke all on public.request_email_notifications from public, anon, authenticated;
grant select, insert, update on public.request_email_notifications to service_role;
grant usage on schema net to service_role;

create function public.request_email_payload(p_request uuid) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare r public.simulation_requests; d jsonb; summary text;
begin
  select * into r from public.simulation_requests where id=p_request;
  if not found then raise exception 'Request not found'; end if;
  d := r.simulation_parameters;
  if r.product_type='consorcios' then
    summary := format('%s procura um consórcio Porto Seguro / Porto Bank para adquirir %s. Deseja uma carta de crédito de R$ %s e pretende pagar cerca de R$ %s por mês. Prazo desejado: %s. Interesse em lance: %s.',
      r.customer_name, lower(d->>'asset'), d->>'credit', d->>'budget', d->>'term', d->>'bid');
  else
    summary := format('%s solicita uma cotação de plano de saúde na modalidade %s para %s beneficiário(s), com idades de %s ano(s). Acomodação: %s. Coparticipação: %s. Abrangência: %s. Orçamento mensal: %s.%s',
      r.customer_name, lower(d->>'plan'), d->>'lives', d->>'ages', d->>'accommodation', d->>'copay', d->>'coverage',
      case when d->>'budget'='Pular' then 'a confirmar com o cliente' else 'R$ ' || (d->>'budget') end,
      case when d->>'plan'='Empresarial' then ' Empresa: ' || (d->>'company') || '.' else '' end);
  end if;
  summary := summary || format(E'\n\nLocalidade: %s/%s.\nContato pelo WhatsApp: %s.\nProtocolo: %s.\n\nO cliente solicita orientação da equipe. Este pedido não constitui proposta aprovada, contratação ou garantia de preço, cobertura ou contemplação.', r.city, r.state, r.customer_phone, r.id);
  return jsonb_build_object('_subject', 'Vitória Santa — novo pedido de ' || case when r.product_type='consorcios' then 'consórcio' else 'plano de saúde' end || ' — ' || r.id::text,
    '_template','basic','origem','https://vitoriasanta.vercel.app/','protocolo',r.id::text,'resumo',summary);
end; $$;
revoke all on function public.request_email_payload(uuid) from public, anon, authenticated;
grant execute on function public.request_email_payload(uuid) to service_role;

create function public.queue_request_email() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare network_id bigint; stamp text; signing_key text;
begin
  begin
    stamp := floor(extract(epoch from now()))::bigint::text;
    select secret into strict signing_key from private.email_hook_config where singleton;
    select net.http_post(
      url := 'https://vitoriasanta.vercel.app/api/request-email',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('id',new.id,'timestamp',stamp,'signature',encode(extensions.hmac(new.id::text || ':' || stamp,signing_key,'sha256'),'hex')), timeout_milliseconds := 20000
    ) into network_id;
    insert into public.request_email_notifications(request_id,network_request_id,status) values(new.id,network_id,'queued');
  exception when others then
    -- Email must never roll back a successfully saved customer request.
    insert into public.request_email_notifications(request_id,status) values(new.id,'failed');
  end;
  return new;
end; $$;
revoke all on function public.queue_request_email() from public, anon, authenticated;
grant execute on function public.queue_request_email() to service_role;
create trigger simulation_request_email after insert on public.simulation_requests for each row execute function public.queue_request_email();

create function public.check_request_emails() returns void
language plpgsql security invoker set search_path = '' as $$
declare notification record; response record; payload jsonb;
begin
  for notification in select request_id,network_request_id,created_at from public.request_email_notifications where status in ('queued','processing') loop
    select * into response from net._http_response where id=notification.network_request_id;
    if found and notification.created_at < now()-interval '2 minutes' then
      begin payload := response.content::jsonb; exception when others then payload := '{}'::jsonb; end;
      update public.request_email_notifications set http_status=response.status_code,checked_at=now(),
        status=case
          when response.timed_out or response.status_code is null then 'unknown'
          when response.status_code between 200 and 299 then 'unknown'
          else 'failed' end
        where request_id=notification.request_id and status in ('queued','processing');
    elsif notification.created_at < now()-interval '10 minutes' then
      update public.request_email_notifications set status='unknown',checked_at=now() where request_id=notification.request_id;
    end if;
  end loop;
end; $$;
revoke all on function public.check_request_emails() from public, anon, authenticated;
select cron.schedule('vitoria-email-status','* * * * *','select public.check_request_emails()');

create function public.claim_request_email(p_request uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
begin
  update public.request_email_notifications set status='processing' where request_id=p_request and status='queued';
  return found;
end; $$;
revoke all on function public.claim_request_email(uuid) from public, anon, authenticated;
grant execute on function public.claim_request_email(uuid) to service_role;
