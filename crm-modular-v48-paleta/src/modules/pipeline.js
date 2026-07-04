import { getCollection, STAGES, updateItem } from '../core/storage.js';
import { pageHeader, esc, money } from '../core/dom.js';

let rootRef = null;

export async function render(root) { rootRef = root.querySelector('#page-pipeline') || root; draw(); }
export function refresh() { draw(); }

function draw() {
  const leads = getCollection('leads');
  rootRef.innerHTML = `
    ${pageHeader('Pipeline', 'Funil separado em módulo próprio. Mudar etapa aqui atualiza o mesmo dado usado em Leads, Métricas e Follow-ups.')}
    <div class="kanban">
      ${STAGES.map(stage => column(stage, leads.filter(l => l.etapa === stage))).join('')}
    </div>`;
  rootRef.querySelectorAll('[data-stage-select]').forEach(select => {
    select.addEventListener('change', () => updateItem('leads', select.dataset.stageSelect, { etapa: select.value }));
  });
}

function column(stage, items) {
  const total = items.reduce((sum,l) => sum + (Number(l.valor)||0), 0);
  return `<section class="kanban-col"><div class="kanban-head"><strong>${esc(stage)}</strong><span class="tag">${items.length} • ${money(total)}</span></div><div class="kanban-body">${items.map(card).join('') || '<div class="empty">Sem leads</div>'}</div></section>`;
}

function card(l) {
  return `<article class="lead-card"><strong>${esc(l.nome)}</strong><small>${esc(l.segmento || 'Sem segmento')} • ${money(l.valor)}</small><div style="margin-top:10px"><select class="select" data-stage-select="${esc(l.id)}"><option ${l.etapa==='Lead'?'selected':''}>Lead</option><option ${l.etapa==='Contato'?'selected':''}>Contato</option><option ${l.etapa==='Proposta'?'selected':''}>Proposta</option><option ${l.etapa==='Fechado'?'selected':''}>Fechado</option><option ${l.etapa==='Perdido'?'selected':''}>Perdido</option></select></div></article>`;
}
