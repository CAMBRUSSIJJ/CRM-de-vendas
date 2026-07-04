export const CRM_STORAGE_KEY = 'outbounder_crm_v48_data';

export const LEGACY_KEYS = {
  leads: 'outbounder_leads_v5',
  agenda: 'outbounder_agenda_v1',
  notes: 'outbounder_notes',
  automacoes: 'outbounder_automations_v1',
  ui: 'crm_v47_ui_prefs'
};

export const STAGES = ['Lead', 'Contato', 'Proposta', 'Fechado', 'Perdido'];

const DEFAULT_LEADS = [
  { id:'lead_demo_1', nome:'Fazenda Aurora', segmento:'Agronegócio', responsavel:'Carlos Melo', telefone:'(53) 99871-2234', email:'carlos@fazendaaurora.com.br', etapa:'Proposta', prioridade:'Alta', valor:18000, origem:'Outbound', dataEntrada:'2026-06-10', followup:'2026-07-08', obs:'Avaliar pacote anual.' },
  { id:'lead_demo_2', nome:'Loja Horizonte', segmento:'Varejo', responsavel:'Ana Lima', telefone:'(51) 98765-4321', email:'ana@lojahorizonte.com', etapa:'Contato', prioridade:'Média', valor:6500, origem:'Inbound', dataEntrada:'2026-06-15', followup:'2026-07-06', obs:'Enviar apresentação comercial.' }
];

const DEFAULT_DATA = {
  version: 'v48-modular-local',
  createdAt: null,
  updatedAt: null,
  migratedFromLegacy: false,
  leads: DEFAULT_LEADS,
  agenda: [],
  notes: [],
  automacoes: [
    { id:'auto_demo_1', nome:'Follow-up vencido vira prioridade', area:'Follow-ups', trigger:'Follow-up vence', condition:'Data menor que hoje', action:'Marcar lead como Alta prioridade', active:true },
    { id:'auto_demo_2', nome:'Proposta cria reunião', area:'Pipeline', trigger:'Lead muda para Proposta', condition:'Etapa = Proposta', action:'Criar compromisso de reunião', active:false }
  ],
  metas: [],
  playbooks: [],
  ui: { theme:'light', lastRoute:'home' }
};

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
export function todayISO() { return new Date().toISOString().slice(0,10); }
export function uid(prefix='id') { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`; }

export function safeParse(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

export function readRaw(key, fallback = null) {
  try { return safeParse(localStorage.getItem(key), fallback); } catch { return fallback; }
}

export function writeRaw(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

function normalizeLead(lead, index = 0) {
  const clean = value => String(value ?? '').trim();
  const etapa = STAGES.includes(lead?.etapa) ? lead.etapa : 'Lead';
  return {
    id: clean(lead?.id) || uid('lead'),
    nome: clean(lead?.nome) || `Lead ${index + 1}`,
    segmento: clean(lead?.segmento),
    responsavel: clean(lead?.responsavel) || 'Não definido',
    telefone: clean(lead?.telefone),
    email: clean(lead?.email).toLowerCase(),
    etapa,
    prioridade: ['Alta','Média','Baixa'].includes(lead?.prioridade) ? lead.prioridade : 'Média',
    valor: Number(lead?.valor) || 0,
    origem: clean(lead?.origem) || 'Outro',
    dataEntrada: clean(lead?.dataEntrada || lead?.criadoEm) || todayISO(),
    ultimaAtualizacao: clean(lead?.ultimaAtualizacao) || todayISO(),
    followup: clean(lead?.followup),
    motivoPerda: clean(lead?.motivoPerda),
    obs: clean(lead?.obs),
    atividades: Array.isArray(lead?.atividades) ? lead.atividades : []
  };
}

function normalizeData(data) {
  const next = { ...clone(DEFAULT_DATA), ...(data || {}) };
  next.leads = Array.isArray(next.leads) ? next.leads.map(normalizeLead) : [];
  next.agenda = Array.isArray(next.agenda) ? next.agenda : [];
  next.notes = Array.isArray(next.notes) ? next.notes : [];
  next.automacoes = Array.isArray(next.automacoes) ? next.automacoes : [];
  next.metas = Array.isArray(next.metas) ? next.metas : [];
  next.playbooks = Array.isArray(next.playbooks) ? next.playbooks : [];
  next.ui = { ...DEFAULT_DATA.ui, ...(next.ui || {}) };
  return next;
}

export function migrateLegacyIfNeeded() {
  const current = readRaw(CRM_STORAGE_KEY, null);
  if (current) return normalizeData(current);

  const legacy = {
    ...clone(DEFAULT_DATA),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    migratedFromLegacy: false
  };

  const oldLeads = readRaw(LEGACY_KEYS.leads, null);
  const oldAgenda = readRaw(LEGACY_KEYS.agenda, null);
  const oldNotes = readRaw(LEGACY_KEYS.notes, null);
  const oldAutomacoes = readRaw(LEGACY_KEYS.automacoes, null);
  const oldUi = readRaw(LEGACY_KEYS.ui, null);

  if (Array.isArray(oldLeads)) { legacy.leads = oldLeads; legacy.migratedFromLegacy = true; }
  if (Array.isArray(oldAgenda)) { legacy.agenda = oldAgenda; legacy.migratedFromLegacy = true; }
  if (Array.isArray(oldNotes)) { legacy.notes = oldNotes; legacy.migratedFromLegacy = true; }
  if (Array.isArray(oldAutomacoes)) { legacy.automacoes = oldAutomacoes; legacy.migratedFromLegacy = true; }
  if (oldUi && typeof oldUi === 'object') { legacy.ui = { ...legacy.ui, ...oldUi }; legacy.migratedFromLegacy = true; }

  const normalized = normalizeData(legacy);
  saveData(normalized);
  return normalized;
}

export function getData() {
  return migrateLegacyIfNeeded();
}

export function saveData(data) {
  const normalized = normalizeData({ ...data, updatedAt: new Date().toISOString() });
  if (!normalized.createdAt) normalized.createdAt = new Date().toISOString();
  writeRaw(CRM_STORAGE_KEY, normalized);
  window.dispatchEvent(new CustomEvent('crm:data-changed', { detail: normalized }));
  return normalized;
}

export function updateData(mutator) {
  const current = getData();
  const result = mutator(clone(current)) || current;
  return saveData(result);
}

export function getCollection(name) {
  const data = getData();
  return Array.isArray(data[name]) ? data[name] : [];
}

export function setCollection(name, items) {
  return updateData(data => { data[name] = Array.isArray(items) ? items : []; return data; });
}

export function addItem(collection, item, prefix = 'item') {
  let created;
  updateData(data => {
    data[collection] = Array.isArray(data[collection]) ? data[collection] : [];
    created = { id: item.id || uid(prefix), ...item };
    data[collection].push(created);
    return data;
  });
  return created;
}

export function updateItem(collection, id, patch) {
  let updated = null;
  updateData(data => {
    data[collection] = (data[collection] || []).map(item => {
      if (item.id !== id) return item;
      updated = { ...item, ...patch, ultimaAtualizacao: todayISO() };
      return updated;
    });
    return data;
  });
  return updated;
}

export function removeItem(collection, id) {
  updateData(data => {
    data[collection] = (data[collection] || []).filter(item => item.id !== id);
    return data;
  });
}

export function exportData() {
  return JSON.stringify(getData(), null, 2);
}

export function importData(jsonText) {
  const parsed = JSON.parse(jsonText);
  return saveData(parsed);
}
