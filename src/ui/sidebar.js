import { icon } from '../assets/icons.js';

export const NAV_ITEMS = [
  { type:'group', label:'Operação' },
  { route:'home', label:'Início', icon:'home', title:'Início', subtitle:'Resumo operacional do CRM.' },
  { route:'leads', label:'Leads', icon:'users', title:'Leads', subtitle:'Cadastro, edição e filtros de leads.' },
  { route:'pipeline', label:'Pipeline', icon:'pipeline', title:'Pipeline', subtitle:'Funil comercial por etapa.' },
  { route:'followups', label:'Follow-ups', icon:'followups', title:'Follow-ups', subtitle:'Fila de próximos contatos.' },
  { route:'agenda', label:'Agenda', icon:'calendar', title:'Agenda', subtitle:'Eventos e compromissos.' },
  { type:'group', label:'Gestão' },
  { route:'automacoes', label:'Automações', icon:'zap', title:'Automações', subtitle:'Regras locais e gatilhos do CRM.' },
  { route:'metricas', label:'Métricas', icon:'chart', title:'Métricas', subtitle:'Indicadores e leitura do pipeline.' },
  { route:'metas', label:'Metas', icon:'target', title:'Metas', subtitle:'Ritmo diário e blocos de acompanhamento.' },
  { route:'playbook', label:'Playbook', icon:'book', title:'Playbook', subtitle:'Scripts, objeções e argumentos.' },
  { route:'configuracoes', label:'Configurações', icon:'settings', title:'Configurações', subtitle:'Dados locais, exportação e preferências.' }
];

export function getRouteMeta(route) {
  return NAV_ITEMS.find(item => item.route === route) || NAV_ITEMS.find(item => item.route === 'home');
}

export function renderSidebar(root, onNavigate) {
  root.innerHTML = `
    <div class="sidebar-brand">
      <div class="brand-mark">${icon('pipeline')}</div>
      <div class="brand-copy"><strong>Outbounder CRM</strong><span>Modular v48</span></div>
    </div>
    <nav class="sidebar-nav">
      ${NAV_ITEMS.map(item => item.type === 'group'
        ? `<div class="nav-group">${item.label}</div>`
        : `<button class="nav-item" type="button" data-route="${item.route}">${icon(item.icon)}<span>${item.label}</span></button>`
      ).join('')}
    </nav>
    <div class="sidebar-footer"><span>LocalStorage centralizado</span></div>
  `;
  root.querySelectorAll('[data-route]').forEach(button => {
    button.addEventListener('click', () => onNavigate(button.dataset.route));
  });
}

export function markActiveRoute(route) {
  document.querySelectorAll('.nav-item[data-route]').forEach(button => {
    button.classList.toggle('active', button.dataset.route === route);
  });
}
