import { addItem, getCollection, removeItem, todayISO } from '../core/storage.js';
import { pageHeader, esc, money, dateBR, toast } from '../core/dom.js';
import { icon } from '../assets/icons.js';

let rootRef = null;
let query = '';

export async function render(root) {
  rootRef = root.querySelector('#page-leads') || root;
  document.addEventListener('crm:new-lead', openLeadModal, { once: true });
  draw();
}

export function refresh() { draw(); }

function draw() {
  if (!rootRef) return;
  const leads = getCollection('leads').filter(l => {
    const hay = `${l.nome} ${l.segmento} ${l.responsavel} ${l.email} ${l.telefone}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });
  rootRef.innerHTML = `
    ${pageHeader('Gestão de Leads', 'Cadastro separado da lógica do funil. A aba lê e salva tudo pelo storage centralizado.', `<button class="btn btn-primary" id="newLeadBtn">${icon('plus')} Novo lead</button>`)}
    <div class="card"><div class="card-body toolbar"><input id="leadSearch" class="input" style="max-width:360px" placeholder="Buscar lead, segmento, telefone ou email" value="${esc(query)}"></div></div>
    <div class="table-wrap"><table><thead><tr><th>Lead</th><th>Contato</th><th>Etapa</th><th>Prioridade</th><th>Follow-up</th><th>Valor</th><th></th></tr></thead><tbody>
      ${leads.map(row).join('') || '<tr><td colspan="7"><div class="empty">Nenhum lead encontrado.</div></td></tr>'}
    </tbody></table></div>
  `;
  rootRef.querySelector('#newLeadBtn')?.addEventListener('click', openLeadModal);
  rootRef.querySelector('#leadSearch')?.addEventListener('input', event => { query = event.target.value; draw(); });
  rootRef.querySelectorAll('[data-delete-lead]').forEach(btn => btn.addEventListener('click', () => {
    removeItem('leads', btn.dataset.deleteLead);
    toast('Lead removido.');
    draw();
  }));
}

function row(l) {
  return `<tr>
    <td><strong>${esc(l.nome)}</strong><br><span class="muted">${esc(l.segmento || 'Sem segmento')}</span></td>
    <td>${esc(l.responsavel || '—')}<br><span class="muted">${esc(l.telefone || l.email || 'Sem contato')}</span></td>
    <td>${esc(l.etapa)}</td>
    <td><span class="tag ${l.prioridade === 'Alta' ? 'danger' : l.prioridade === 'Média' ? 'warn' : 'success'}">${esc(l.prioridade)}</span></td>
    <td>${dateBR(l.followup)}</td>
    <td>${money(l.valor)}</td>
    <td><button class="btn btn-sm btn-danger" data-delete-lead="${esc(l.id)}">${icon('trash', 14)} Excluir</button></td>
  </tr>`;
}

function openLeadModal() {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `
    <form class="modal" id="leadForm">
      <div class="modal-head"><strong>Novo lead</strong><button class="btn btn-sm" type="button" data-close>Fechar</button></div>
      <div class="modal-body form-grid">
        ${field('Nome', 'nome', 'Ex: Barbearia Central')}
        ${field('Segmento', 'segmento', 'Ex: Barbearia')}
        ${field('Responsável', 'responsavel', 'Nome do contato')}
        ${field('Telefone', 'telefone', '(00) 00000-0000')}
        ${field('Email', 'email', 'email@empresa.com')}
        ${field('Valor', 'valor', '0', 'number')}
        <div class="field"><label>Etapa</label><select class="select" name="etapa"><option>Lead</option><option>Contato</option><option>Proposta</option><option>Fechado</option><option>Perdido</option></select></div>
        <div class="field"><label>Prioridade</label><select class="select" name="prioridade"><option>Alta</option><option selected>Média</option><option>Baixa</option></select></div>
        ${field('Follow-up', 'followup', '', 'date')}
        <div class="field"><label>Origem</label><select class="select" name="origem"><option>Outbound</option><option>Inbound</option><option>Indicação</option><option>Outro</option></select></div>
        <div class="field" style="grid-column:1/-1"><label>Observação</label><textarea name="obs" rows="3" placeholder="Contexto do lead"></textarea></div>
      </div>
      <div class="modal-foot"><span class="muted">Será salvo no storage centralizado.</span><button class="btn btn-primary" type="submit">Salvar lead</button></div>
    </form>`;
  document.body.appendChild(wrap);
  wrap.querySelector('[data-close]').addEventListener('click', () => wrap.remove());
  wrap.addEventListener('click', e => { if (e.target === wrap) wrap.remove(); });
  wrap.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const lead = Object.fromEntries(fd.entries());
    lead.valor = Number(lead.valor) || 0;
    lead.dataEntrada = todayISO();
    addItem('leads', lead, 'lead');
    toast('Lead cadastrado.');
    wrap.remove();
    draw();
  });
}

function field(label, name, placeholder, type = 'text') {
  return `<div class="field"><label>${label}</label><input class="input" name="${name}" type="${type}" placeholder="${placeholder}"></div>`;
}
