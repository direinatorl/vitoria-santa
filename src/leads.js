import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function openDatabase(path) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL;
    PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY, request_id TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL,
      service TEXT NOT NULL, created_at TEXT NOT NULL, name TEXT NOT NULL,
      phone TEXT NOT NULL, email TEXT, details TEXT NOT NULL, consent_version TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS leads_service_date ON leads(service, created_at);`);
  return db;
}
const clean = (v) => typeof v === 'string' ? v.trim().replace(/[\u0000-\u001f\u007f]/g, '') : '';
export function validateLead(raw) {
  const errors = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { errors: { form: 'Dados inválidos.' } };
  const service = clean(raw.service);
  const name = clean(raw.name);
  const phoneInput = clean(raw.phone);
  const phone = phoneInput.replace(/\D/g, '');
  const email = clean(raw.email).toLowerCase();
  const message = clean(raw.message);
  if (!['consorcios', 'saude', 'contato'].includes(service)) errors.service = 'Selecione um serviço válido.';
  if (name.length < 2 || name.length > 100) errors.name = 'Informe seu nome, entre 2 e 100 caracteres.';
  if (!/^[\d()+.\s-]+$/.test(phoneInput) || !/^(?:55)?[1-9]{2}\d{8,9}$/.test(phone)) errors.phone = 'Informe telefone com DDD, de 10 ou 11 dígitos.';
  if (email && (email.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.email = 'Informe um e-mail válido.';
  if (message.length > 1000) errors.message = 'Use até 1.000 caracteres.';
  if (raw.consent !== true) errors.consent = 'Autorize o uso dos dados para este atendimento.';
  if (clean(raw.website)) errors.form = 'Não foi possível enviar. Entre em contato pelos canais oficiais.';
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(clean(raw.requestId))) errors.form = 'Atualize a página e tente novamente.';
  const details = { message };
  if (service === 'consorcios') {
    details.asset = clean(raw.asset);
    details.credit = clean(raw.credit);
    if (!['imovel', 'veiculo'].includes(details.asset)) errors.asset = 'Escolha imóvel ou veículo.';
    if (details.credit.length > 80) errors.credit = 'Use até 80 caracteres.';
  }
  if (service === 'saude') {
    details.city = clean(raw.city);
    details.state = clean(raw.state);
    details.plan = clean(raw.plan);
    details.beneficiaries = clean(raw.beneficiaries);
    if (details.city.length < 2 || details.city.length > 100) errors.city = 'Informe a cidade.';
    if (!'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ').includes(details.state)) errors.state = 'Selecione a UF.';
    if (!['individual-familiar', 'empresarial'].includes(details.plan)) errors.plan = 'Selecione a modalidade de interesse.';
    if (details.beneficiaries && (!/^\d{1,5}$/.test(details.beneficiaries) || Number(details.beneficiaries) < 1)) errors.beneficiaries = 'Informe uma quantidade válida.';
  }
  return { errors, value: { service, name, phone, email, details, requestId: clean(raw.requestId) } };
}
export function saveLead(db, value) {
  const { requestId, ...payload } = value;
  const fingerprint = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const previous = db.prepare('SELECT id, fingerprint FROM leads WHERE request_id = ?').get(requestId);
  if (previous) return previous.fingerprint === fingerprint ? { id: previous.id, duplicate: true } : { conflict: true };
  const result = db.prepare(`INSERT INTO leads (request_id, fingerprint, service, created_at, name, phone, email, details, consent_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(requestId, fingerprint, value.service, new Date().toISOString(), value.name, value.phone, value.email, JSON.stringify(value.details), '2026-10-21');
  return { id: Number(result.lastInsertRowid), duplicate: false };
}
