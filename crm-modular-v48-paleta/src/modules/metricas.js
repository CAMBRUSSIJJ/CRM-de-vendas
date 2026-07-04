import { getData, exportData } from '../core/storage.js';
import { pageHeader, kpi, money } from '../core/dom.js';
import { icon } from '../assets/icons.js';

let rootRef = null;
export async function render(root) { rootRef = root.querySelector('#page-metricas') || root; draw(); }
export function refresh() { draw(); }

function draw() {
  const data = getData();
  const leads = data.leads;
  const won = leads.filter(l => l.etapa === 'Fechado');
  const lost = leads.filter(l => l.etapa === 'Perdido');
  const open = leads.filter(l => !['Fechado','Perdido'].includes(l.etapa));
  const ticket = won.length ? won.reduce((s,l)=>s+(Number(l.valor)||0),0) / won.length : 0;
  rootRef.innerHTML = `
    ${pageHeader('Métricas', 'Indicadores calculados a partir do storage central, sem duplicar dados em cada aba.', `<button class="btn" id="metricasExportBtn">${icon('export')} Exportar JSON</button>`)}
    <div class="grid-kpis">${kpi(leads.length,'Leads totais')}${kpi(open.length,'Em aberto')}${kpi(won.length,'Fechados')}${kpi(money(ticket),'Ticket médio')}</div>
    <div class="card"><div class="card-header"><div><div class="card-title">Distribuição por etapa</div><div class="card-sub">Leitura simples antes de criar gráficos mais pesados.</div></div></div><div class="card-body">${stageBars(leads)}</div></div>`;
  rootRef.querySelector('#metricasExportBtn')?.addEventListener('click', () => download('crm-export.json', exportData()));
}

function stageBars(leads) {
  const stages = ['Lead','Contato','Proposta','Fechado','Perdido'];
  return stages.map(stage => {
    const n = leads.filter(l => l.etapa === stage).length;
    const pct = leads.length ? Math.round((n/leads.length)*100) : 0;
    return `<div style="margin-bottom:12px"><strong>${stage}</strong><div class="muted">${n} lead(s) • ${pct}%</div><div style="height:10px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin-top:6px"><div style="width:${pct}%;height:100%;background:var(--blue)"></div></div></div>`;
  }).join('');
}

function download(filename, text) {
  const blob = new Blob([text], { type:'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
