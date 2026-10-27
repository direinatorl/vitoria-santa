-- Additive schema for the dedicated Vitória Santa Supabase project.
create table public.chat_sessions (
  id uuid primary key,
  tipo_atendimento text not null check (tipo_atendimento in ('consorcios','saude')),
  status text not null default 'open',
  consent_version text not null,
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (length(content) <= 4000),
  created_at timestamptz not null default now()
);
create index chat_messages_session_time on public.chat_messages(session_id, created_at desc);
create table public.simulation_requests (
  id uuid primary key,
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  product_type text not null check (product_type in ('consorcios','saude')),
  insurer text,
  customer_name text not null,
  customer_phone text not null,
  city text not null,
  state text not null,
  simulation_parameters jsonb not null,
  consent_version text not null,
  consent_at timestamptz not null default now(),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  check (product_type <> 'consorcios' or insurer = 'Porto Seguro / Porto Bank')
);
create index simulation_requests_session on public.simulation_requests(session_id);
create table public.insurers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  product_type text not null check (product_type in ('consorcios','saude')),
  active boolean not null default false,
  verified_at timestamptz,
  unique (name, product_type)
);
create table public.product_knowledge (
  id uuid primary key default gen_random_uuid(),
  product_type text not null check (product_type in ('consorcios','saude')),
  insurer_id uuid references public.insurers(id),
  title text not null,
  content text not null,
  source text not null,
  updated_at timestamptz not null default now(),
  approved boolean not null default false
);
create index product_knowledge_insurer on public.product_knowledge(insurer_id);
create table public.chat_rate_limits (
  key text primary key,
  count integer not null,
  expires_at timestamptz not null
);
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.simulation_requests enable row level security;
alter table public.insurers enable row level security;
alter table public.product_knowledge enable row level security;
alter table public.chat_rate_limits enable row level security;
-- No anonymous/authenticated policies: clients have NO direct database access.
revoke all on public.chat_sessions, public.chat_messages, public.simulation_requests, public.insurers, public.product_knowledge, public.chat_rate_limits from anon, authenticated;
grant select, insert, update, delete on public.chat_sessions, public.chat_messages, public.simulation_requests, public.insurers, public.product_knowledge, public.chat_rate_limits to service_role;

create function public.chat_rate_limit(p_key text) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare v_count integer;
begin
  delete from public.chat_rate_limits where expires_at < now();
  insert into public.chat_rate_limits(key,count,expires_at) values(p_key,1,now()+interval '15 minutes')
    on conflict(key) do update set count=public.chat_rate_limits.count+1 returning count into v_count;
  return v_count <= 40;
end; $$;
revoke all on function public.chat_rate_limit(text) from public, anon, authenticated;
grant execute on function public.chat_rate_limit(text) to service_role;

create function public.submit_simulation(p_session uuid,p_request uuid,p_product text,p_data jsonb,p_consent_version text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare existing public.simulation_requests; v_session public.chat_sessions;
begin
  select * into v_session from public.chat_sessions where id=p_session for update;
  if v_session.id is null or v_session.tipo_atendimento <> p_product or v_session.consent_version <> p_consent_version then
    raise exception 'Invalid session';
  end if;
  select * into existing from public.simulation_requests where id=p_request;
  if existing.id is not null then
    if existing.session_id <> p_session or existing.simulation_parameters <> p_data then
      return jsonb_build_object('id',p_request,'conflict',true);
    end if;
    return jsonb_build_object('id',p_request,'duplicate',true);
  end if;
  insert into public.simulation_requests(id,session_id,product_type,insurer,customer_name,customer_phone,city,state,simulation_parameters,consent_version)
  values(p_request,p_session,p_product,case when p_product='consorcios' then 'Porto Seguro / Porto Bank' end,p_data->>'name',p_data->>'phone',p_data->>'city',p_data->>'state',p_data,p_consent_version);
  update public.chat_sessions set status='submitted',updated_at=now() where id=p_session;
  return jsonb_build_object('id',p_request,'duplicate',false);
end; $$;
revoke all on function public.submit_simulation(uuid,uuid,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.submit_simulation(uuid,uuid,text,jsonb,text) to service_role;

insert into public.insurers(name,product_type,active,verified_at)
values ('Porto Seguro / Porto Bank','consorcios',true,now());
-- Health insurers deliberately empty until the business verifies partnerships.

create function public.purge_chat_data() returns void
language plpgsql security invoker set search_path = '' as $$
begin
  delete from public.chat_messages where created_at < now()-interval '7 days';
  delete from public.chat_sessions where created_at < now()-interval '50 days';
  delete from public.chat_rate_limits where expires_at < now();
end; $$;
revoke all on function public.purge_chat_data() from public, anon, authenticated;
grant execute on function public.purge_chat_data() to service_role;

-- Retention approved by the owner: messages 7 days, sessions/requests 50 days.
create extension if not exists pg_cron;
select cron.schedule('vitoria-chat-retention','17 6 * * *','select public.purge_chat_data()');
