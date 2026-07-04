import { addItem, getCollection, removeItem, todayISO } from '../core/storage.js';
import { pageHeader, esc } from '../core/dom.js';
import { icon } from '../assets/icons.js';

let rootRef = null;
export async function render(root) { rootRef = root.querySelector('#page-metas') || root; draw(); }
export function refresh() { draw(); }

function draw() {
  const metas = getCollection('metas');
  rootRef.innerHTML = `
    ${pageHeader('Metas', 'Blocos de metas em arquivo próprio, prontos para evoluir sem quebrar outras abas.', `<button class="btn btn-primary" id="newGoalBtn">${icon('plus')} Nova meta</button>`)}
    <div class="card"><div class="card-body"><div class="table-wrap"><table><thead><tr><th>Meta</th><th>Data</th><th>Alvo</th><th>Atual</th><th>Progresso</th><th></th></tr></thead><tbody>${metas.map(row).join('') || '<tr><td colspan="6"><div class="empty">Nenhuma meta cadastrada.</div></td></tr>'}</tbody></table></div></div></div>`;
  rootRef.querySelector('#newGoalBtn')?.addEventListener('click', () => {
    const nome = prompt('Nome da meta:', 'Ligações do dia');
    if (!nome) return;
    const alvo = Number(prompt('Alvo numérico:', '30')) || 0;
    addItem('metas', { nome, data: todayISO(), alvo, atual:0 }, 'meta');
    draw();
  });
  rootRef.querySelectorAll('[data-del-goal]').forEach(btn => btn.addEventListener('click', () => { removeItem('metas', btn.dataset.delGoal); draw(); }));
}

function row(m) {
  const pct = m.alvo ? Math.min(100, Math.round((Number(m.atual || 0) / Number(m.alvo || 1)) * 100)) : 0;
  return `<tr><td><strong>${esc(m.nome)}</strong></td><td>${esc(m.data)}</td><td>${esc(m.alvo)}</td><td>${esc(m.atual || 0)}</td><td><div style="min-width:120px"><div class="muted">${pct}%</div><div style="height:8px;background:var(--surface-2);border-radius:999px;overflow:hidden"><div style="width:${pct}%;height:100%;background:var(--blue)"></div></div></div></td><td><button class="btn btn-sm btn-danger" data-del-goal="${esc(m.id)}">Excluir</button></td></tr>`;
}
