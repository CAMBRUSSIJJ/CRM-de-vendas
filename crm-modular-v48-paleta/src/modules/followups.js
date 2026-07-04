import { getCollection, updateItem, todayISO } from '../core/storage.js';
import { pageHeader, esc, dateBR } from '../core/dom.js';

let rootRef = null;
export async function render(root) { rootRef = root.querySelector('#page-followups') || root; draw(); }
export function refresh() { draw(); }

function draw() {
  const today = todayISO();
  const leads = getCollection('leads').filter(l => !['Fechado','Perdido'].includes(l.etapa)).sort((a,b) => String(a.followup || '9999').localeCompare(String(b.followup || '9999')));
  rootRef.innerHTML = `
    ${pageHeader('Follow-ups', 'Fila comercial organizada por data. A etapa do follow-up fica ligada ao lead e ao pipeline.')}
    <div class="table-wrap"><table><thead><tr><th>Lead</th><th>Etapa</th><th>Data</th><th>Status</th><th>Remarcar</th></tr></thead><tbody>${leads.map(l => row(l, today)).join('') || '<tr><td colspan="5"><div class="empty">Nenhum follow-up pendente.</div></td></tr>'}</tbody></table></div>`;
  rootRef.querySelectorAll('[data-followup-date]').forEach(input => input.addEventListener('change', () => updateItem('leads', input.dataset.followupDate, { followup: input.value })));
}

function row(l, today) {
  const status = !l.followup ? 'Sem data' : l.followup < today ? 'Vencido' : l.followup === today ? 'Hoje' : 'Agendado';
  const cls = status === 'Vencido' ? 'danger' : status === 'Hoje' ? 'warn' : 'success';
  return `<tr><td><strong>${esc(l.nome)}</strong><br><span class="muted">${esc(l.responsavel)}</span></td><td>${esc(l.etapa)}</td><td>${dateBR(l.followup)}</td><td><span class="tag ${cls}">${status}</span></td><td><input class="input" type="date" value="${esc(l.followup)}" data-followup-date="${esc(l.id)}"></td></tr>`;
}
