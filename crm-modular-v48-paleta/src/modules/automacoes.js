import { addItem, getCollection, updateItem } from '../core/storage.js';
import { pageHeader, esc } from '../core/dom.js';
import { icon } from '../assets/icons.js';

let rootRef = null;
export async function render(root) { rootRef = root.querySelector('#page-automacoes') || root; draw(); }
export function refresh() { draw(); }

function draw() {
  const list = getCollection('automacoes');
  rootRef.innerHTML = `
    ${pageHeader('Automações locais', 'Regras ainda sem backend: tudo salvo no navegador, mas já separado em módulo próprio.', `<button class="btn btn-primary" id="autoNewBtn">${icon('plus')} Nova automação</button>`)}
    <div class="card"><div class="card-body"><div class="table-wrap"><table><thead><tr><th>Nome</th><th>Área</th><th>Gatilho</th><th>Ação</th><th>Status</th></tr></thead><tbody>${list.map(row).join('') || '<tr><td colspan="5"><div class="empty">Nenhuma automação cadastrada.</div></td></tr>'}</tbody></table></div></div></div>`;
  rootRef.querySelector('#autoNewBtn')?.addEventListener('click', () => {
    const nome = prompt('Nome da automação:');
    if (!nome) return;
    addItem('automacoes', { nome, area:'Follow-ups', trigger:'Manual', condition:'', action:'Criar próximo passo', active:true }, 'auto');
    draw();
  });
  rootRef.querySelectorAll('[data-toggle-auto]').forEach(btn => btn.addEventListener('click', () => updateItem('automacoes', btn.dataset.toggleAuto, { active: btn.dataset.active !== 'true' })));
}

function row(a) {
  return `<tr><td><strong>${esc(a.nome)}</strong></td><td>${esc(a.area || 'Geral')}</td><td>${esc(a.trigger || '—')}</td><td>${esc(a.action || '—')}</td><td><button class="btn btn-sm" data-toggle-auto="${esc(a.id)}" data-active="${a.active}"><span class="tag ${a.active ? 'success' : ''}">${a.active ? 'Ativa' : 'Pausada'}</span></button></td></tr>`;
}
