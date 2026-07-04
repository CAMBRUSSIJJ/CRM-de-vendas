import { getData } from '../core/storage.js';
import { pageHeader, kpi, money, esc, dateBR } from '../core/dom.js';

let rootRef = null;

export async function render(root, ctx) {
  rootRef = root.querySelector('#page-home') || root;
  refresh(ctx);
}

export function refresh(ctx) {
  if (!rootRef) return;
  const data = getData();
  const open = data.leads.filter(l => !['Fechado','Perdido'].includes(l.etapa));
  const overdue = data.leads.filter(l => l.followup && l.followup < new Date().toISOString().slice(0,10));
  const pipe = open.reduce((sum, l) => sum + (Number(l.valor) || 0), 0);
  const proposals = data.leads.filter(l => l.etapa === 'Proposta');

  rootRef.innerHTML = `
    ${pageHeader('Painel operacional', 'Uma entrada limpa para enxergar o que precisa de atenção sem carregar todas as abas ao mesmo tempo.')}
    <div class="grid-kpis">
      ${kpi(open.length, 'Leads ativos')}
      ${kpi(proposals.length, 'Propostas')}
      ${kpi(overdue.length, 'Follow-ups vencidos')}
      ${kpi(money(pipe), 'Pipeline aberto')}
    </div>
    <div class="card">
      <div class="card-header"><div><div class="card-title">Fila de execução</div><div class="card-sub">Leads com follow-up mais urgente aparecem primeiro.</div></div></div>
      <div class="card-body">
        ${buildQueue(data.leads, ctx)}
      </div>
    </div>
  `;
}

function buildQueue(leads, ctx) {
  const list = leads
    .filter(l => !['Fechado','Perdido'].includes(l.etapa))
    .sort((a,b) => String(a.followup || '9999').localeCompare(String(b.followup || '9999')))
    .slice(0, 8);
  if (!list.length) return '<div class="empty">Nenhum lead ativo na fila.</div>';
  return `<div class="table-wrap"><table><thead><tr><th>Lead</th><th>Etapa</th><th>Prioridade</th><th>Follow-up</th><th>Valor</th></tr></thead><tbody>${list.map(l => `
    <tr>
      <td><strong>${esc(l.nome)}</strong><br><span class="muted">${esc(l.segmento || 'Sem segmento')}</span></td>
      <td>${esc(l.etapa)}</td>
      <td><span class="tag ${l.prioridade === 'Alta' ? 'danger' : l.prioridade === 'Média' ? 'warn' : 'success'}">${esc(l.prioridade)}</span></td>
      <td>${dateBR(l.followup)}</td>
      <td>${money(l.valor)}</td>
    </tr>`).join('')}</tbody></table></div>`;
}
