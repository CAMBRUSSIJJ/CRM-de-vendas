import { addItem, getCollection, removeItem } from '../core/storage.js';
import { pageHeader, esc } from '../core/dom.js';
import { icon } from '../assets/icons.js';

let rootRef = null;
export async function render(root) { rootRef = root.querySelector('#page-playbook') || root; draw(); }
export function refresh() { draw(); }

function draw() {
  const scripts = getCollection('playbooks');
  rootRef.innerHTML = `
    ${pageHeader('Playbook', 'Scripts separados da aba de automações. Aqui ficam abordagens, objeções e respostas.', `<button class="btn btn-primary" id="newScriptBtn">${icon('plus')} Novo script</button>`)}
    <div class="card"><div class="card-body" style="display:grid;gap:12px">${scripts.map(card).join('') || '<div class="empty">Nenhum script salvo ainda.</div>'}</div></div>`;
  rootRef.querySelector('#newScriptBtn')?.addEventListener('click', () => {
    const titulo = prompt('Título do script:');
    if (!titulo) return;
    const texto = prompt('Texto do script:') || '';
    addItem('playbooks', { titulo, texto, categoria:'Geral' }, 'pb');
    draw();
  });
  rootRef.querySelectorAll('[data-del-script]').forEach(btn => btn.addEventListener('click', () => { removeItem('playbooks', btn.dataset.delScript); draw(); }));
}

function card(s) {
  return `<article class="lead-card"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px"><div><strong>${esc(s.titulo)}</strong><small>${esc(s.categoria || 'Geral')}</small></div><button class="btn btn-sm btn-danger" data-del-script="${esc(s.id)}">Excluir</button></div><p class="muted" style="white-space:pre-wrap">${esc(s.texto || '')}</p></article>`;
}
