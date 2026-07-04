export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}

export function money(value) {
  return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(Number(value) || 0);
}

export function dateBR(value) {
  if (!value) return '—';
  try { return new Date(String(value).slice(0,10) + 'T12:00:00').toLocaleDateString('pt-BR'); } catch { return value; }
}

export function daysBetween(dateA, dateB = new Date()) {
  if (!dateA) return 0;
  const a = new Date(String(dateA).slice(0,10) + 'T12:00:00');
  const b = dateB instanceof Date ? dateB : new Date(dateB);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.floor((b - a) / 86400000);
}

export function toast(message) {
  const root = $('#toastRoot');
  if (!root) return;
  const item = document.createElement('div');
  item.className = 'toast';
  item.textContent = message;
  root.appendChild(item);
  setTimeout(() => item.remove(), 3200);
}

export function pageHeader(title, desc, actions = '') {
  return `<div class="page-head"><div><h2 class="page-title">${esc(title)}</h2><p class="page-desc">${esc(desc)}</p></div><div class="page-actions">${actions}</div></div>`;
}

export function kpi(value, label) {
  return `<div class="kpi"><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
}
