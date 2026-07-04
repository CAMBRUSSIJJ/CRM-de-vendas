import { addItem, getCollection, removeItem } from '../core/storage.js';
import { pageHeader, esc, dateBR, toast } from '../core/dom.js';
import { icon } from '../assets/icons.js';

let rootRef = null;
export async function render(root) { rootRef = root.querySelector('#page-agenda') || root; draw(); }
export function refresh() { draw(); }

function draw() {
  const events = getCollection('agenda').sort((a,b) => `${a.data || ''}${a.hora || ''}`.localeCompare(`${b.data || ''}${b.hora || ''}`));
  rootRef.innerHTML = `
    ${pageHeader('Agenda', 'Compromissos carregados em módulo próprio, sem misturar com leads ou automações.', `<button class="btn btn-primary" id="agNewBtn">${icon('plus')} Novo evento</button>`)}
    <div class="table-wrap"><table><thead><tr><th>Data</th><th>Hora</th><th>Tipo</th><th>Lead</th><th>Notas</th><th></th></tr></thead><tbody>${events.map(row).join('') || '<tr><td colspan="6"><div class="empty">Nenhum evento cadastrado.</div></td></tr>'}</tbody></table></div>`;
  rootRef.querySelector('#agNewBtn')?.addEventListener('click', newEvent);
  rootRef.querySelectorAll('[data-del-event]').forEach(btn => btn.addEventListener('click', () => { removeItem('agenda', btn.dataset.delEvent); toast('Evento removido.'); draw(); }));
}

function row(e) { return `<tr><td>${dateBR(e.data)}</td><td>${esc(e.hora || '09:00')}</td><td>${esc(e.tipo || 'Follow-up')}</td><td>${esc(e.leadNome || '—')}</td><td>${esc(e.notas || '')}</td><td><button class="btn btn-sm btn-danger" data-del-event="${esc(e.id)}">Excluir</button></td></tr>`; }

function newEvent() {
  const leadNome = prompt('Lead ou título do compromisso:');
  if (!leadNome) return;
  const data = prompt('Data no formato AAAA-MM-DD:', new Date().toISOString().slice(0,10));
  if (!data) return;
  addItem('agenda', { leadNome, data, hora:'09:00', tipo:'Follow-up', notas:'' }, 'ev');
  toast('Evento criado.');
  draw();
}
