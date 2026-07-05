/* CRM v60 — Sidebar compacta profissional
   Simplifica a navegação: 10 áreas principais, ícones lineares e sub-abas em flyout. */
(function(){
  'use strict';
  if(window.__CRM_V60_SIDEBAR_COMPACTA__) return;
  window.__CRM_V60_SIDEBAR_COMPACTA__ = true;

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const norm = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();

  const icons = {
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5h5v5"/></svg>',
    leads:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    pipeline:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="5" height="16" rx="2"/><rect x="9.5" y="4" width="5" height="16" rx="2"/><rect x="16" y="4" width="5" height="16" rx="2"/></svg>',
    follow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M3 12A9 9 0 0 1 18.5 5.8"/><path d="M18 2v4h4"/><path d="M6 22v-4H2"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M8 2.5v4"/><path d="M16 2.5v4"/><path d="M3 9h18"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/></svg>',
    phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.25a2 2 0 0 1 2.1-.45c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z"/></svg>',
    brain:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 3a3 3 0 0 0-3 3v1.1A3.5 3.5 0 0 0 4 13.5 3.5 3.5 0 0 0 7.5 17H9"/><path d="M15 3a3 3 0 0 1 3 3v1.1a3.5 3.5 0 0 1 2 6.4A3.5 3.5 0 0 1 16.5 17H15"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M9 8H7"/><path d="M15 8h2"/><path d="M9 14H6"/><path d="M15 14h3"/></svg>',
    chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="9" rx="1"/><rect x="17" y="5" width="3" height="12" rx="1"/></svg>',
    zap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z"/></svg>',
    settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.05.05a2.1 2.1 0 1 1-3 3l-.05-.05a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1.1 1.65V21a2.1 2.1 0 1 1-4.2 0v-.08A1.8 1.8 0 0 0 8.35 19.3a1.8 1.8 0 0 0-2 .36l-.05.05a2.1 2.1 0 1 1-3-3l.05-.05a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.65-1.1H2a2.1 2.1 0 1 1 0-4.2h.08A1.8 1.8 0 0 0 3.7 8.35a1.8 1.8 0 0 0-.36-2l-.05-.05a2.1 2.1 0 1 1 3-3l.05.05a1.8 1.8 0 0 0 2 .36h.02A1.8 1.8 0 0 0 9.45 2.1V2a2.1 2.1 0 1 1 4.2 0v.08a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 2-.36l.05-.05a2.1 2.1 0 1 1 3 3l-.05.05a1.8 1.8 0 0 0-.36 2v.02a1.8 1.8 0 0 0 1.65 1.1H22a2.1 2.1 0 1 1 0 4.2h-.08A1.8 1.8 0 0 0 19.4 15Z"/></svg>',
    dot:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
    list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>',
    kanban:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h6v16H4z"/><path d="M14 4h6v10h-6z"/></svg>',
    message:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>',
    upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3"/></svg>'
  };

  const AREAS = [
    {key:'painel', label:'Painel', view:'inicio', icon:'home', match:['inicio'], subs:[
      {label:'Visão de hoje', view:'inicio', icon:'home'},
      {label:'Rotina comercial', view:'cadencias', icon:'follow'},
      {label:'Metas do dia', view:'dashboard', icon:'chart'}
    ]},
    {key:'leads', label:'Leads', view:'leads', icon:'leads', match:['leads','clientes','novo-lead'], subs:[
      {label:'Gestão de Leads', view:'leads', icon:'leads'},
      {label:'Clientes', view:'clientes', icon:'leads'},
      {label:'Novo lead', view:'novo-lead', icon:'plus'}
    ]},
    {key:'pipeline', label:'Pipeline', view:'pipeline', icon:'pipeline', match:['pipeline'], subs:[
      {label:'Kanban', view:'pipeline', action:'kanban', icon:'kanban'},
      {label:'Funil', view:'pipeline', action:'funil', icon:'pipeline'},
      {label:'Gantt', view:'pipeline', action:'gantt', icon:'chart'},
      {label:'Configurar etapas', view:'pipeline', action:'etapas', icon:'settings'}
    ]},
    {key:'followups', label:'Follow-ups', view:'cadencias', icon:'follow', match:['cadencias'], subs:[
      {label:'Kanban', view:'cadencias', action:'kanban', icon:'kanban'},
      {label:'Lista', view:'cadencias', action:'lista', icon:'list'},
      {label:'Modo execução', view:'cadencias', action:'execucao', icon:'zap'},
      {label:'Etapas', view:'cadencias', action:'etapas', icon:'pipeline'}
    ]},
    {key:'agenda', label:'Agenda', view:'agenda', icon:'calendar', match:['agenda'], subs:[
      {label:'Dia', view:'agenda', action:'day', icon:'calendar'},
      {label:'Semana', view:'agenda', action:'week', icon:'calendar'},
      {label:'Mês', view:'agenda', action:'month', icon:'calendar'},
      {label:'Ano', view:'agenda', action:'year', icon:'calendar'},
      {label:'Lista', view:'agenda', action:'list', icon:'list'}
    ]},
    {key:'atendimento', label:'Atendimento', view:'ligacoes', icon:'phone', match:['ligacoes','chat'], subs:[
      {label:'Ligações', view:'ligacoes', icon:'phone'},
      {label:'Chat', view:'chat', icon:'message'},
      {label:'WhatsApp', view:'chat', action:'whatsapp', icon:'message'},
      {label:'Histórico', view:'leads', action:'historico', icon:'list'}
    ]},
    {key:'inteligencia', label:'Inteligência', view:'playbooks', icon:'brain', match:['playbooks','objecoes'], subs:[
      {label:'Playbooks', view:'playbooks', action:'playbooks', icon:'brain'},
      {label:'Scripts', view:'playbooks', action:'scripts', icon:'list'},
      {label:'Objeções', view:'objecoes', icon:'message'},
      {label:'Materiais', view:'playbooks', action:'materiais', icon:'upload'},
      {label:'IA local', view:'playbooks', action:'ia', icon:'zap'}
    ]},
    {key:'gestao', label:'Gestão', view:'dashboard', icon:'chart', match:['dashboard','metricas','perdas'], subs:[
      {label:'Resumo', view:'dashboard', icon:'chart'},
      {label:'Métricas', view:'metricas', icon:'chart'},
      {label:'Metas', view:'dashboard', action:'metas', icon:'dot'},
      {label:'Perdas', view:'perdas', icon:'list'},
      {label:'Forecast', view:'metricas', action:'forecast', icon:'pipeline'}
    ]},
    {key:'automacoes', label:'Automações', view:'automacoes', icon:'zap', match:['automacoes'], subs:[
      {label:'Modelos prontos', view:'automacoes', action:'modelos', icon:'zap'},
      {label:'Criador visual', view:'automacoes', action:'criador', icon:'settings'},
      {label:'Histórico', view:'automacoes', action:'historico', icon:'list'}
    ]},
    {key:'configuracoes', label:'Configurações', view:'importar', icon:'settings', match:['importar'], subs:[
      {label:'Importar / Exportar', view:'importar', icon:'upload'},
      {label:'Layout', view:'importar', action:'layout', icon:'settings'},
      {label:'Preferências', view:'importar', action:'preferencias', icon:'settings'},
      {label:'Backup e dados', view:'importar', action:'backup', icon:'upload'}
    ]}
  ];

  const baseSetView = window.setView;
  function viewExists(view){ return !!document.getElementById(view); }
  function ensureLigacoes(){
    if(viewExists('ligacoes')) return;
    const main = document.querySelector('main') || document.querySelector('.main');
    if(!main) return;
    const sec = document.createElement('section');
    sec.id = 'ligacoes';
    sec.className = 'view grid-view';
    main.appendChild(sec);
  }

  function goView(view, action){
    if(view === 'ligacoes') ensureLigacoes();
    try{
      if(typeof baseSetView === 'function') baseSetView(view);
      else if(typeof window.showView === 'function') window.showView(view);
      else {
        $$('.view').forEach(s => s.classList.toggle('active', s.id === view));
        $$('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
      }
    }catch(e){
      console.warn('[CRM v60] navegação fallback', e);
      $$('.view').forEach(s => s.classList.toggle('active', s.id === view));
    }
    setTimeout(() => {
      updateActive(view);
      applyAction(view, action);
    }, 80);
  }

  function clickByText(selectors, textIncludes){
    const wanted = norm(textIncludes);
    const els = selectors.flatMap(s => $$(s));
    const el = els.find(x => norm(x.textContent).includes(wanted) || norm(x.getAttribute('aria-label')).includes(wanted) || norm(x.title).includes(wanted));
    if(el){ el.click(); return true; }
    return false;
  }

  function applyAction(view, action){
    if(!action) return;
    const a = norm(action);
    try{
      if(view === 'agenda'){
        const map = {day:'dia', week:'semana', month:'mes', year:'ano', list:'lista'};
        const mode = map[a] || a;
        const buttons = ['[data-cal-view]','[data-v57-cal-view]','[data-agenda-view]','.v57-seg button','.v55-cal-view button','.v57-cal-toolbar button','.v57-cal-head button'];
        clickByText(buttons, mode) || $(`[data-cal-view="${a}"]`)?.click();
      }
      if(view === 'cadencias'){
        const labels = {kanban:'kanban', lista:'lista', execucao:'execução', etapas:'etapas'};
        clickByText(['#cadencias button','[data-follow-view]','[data-fu-view]'], labels[a] || a);
      }
      if(view === 'pipeline'){
        const labels = {kanban:'kanban', funil:'funil', gantt:'gantt', etapas:'etapas'};
        clickByText(['#pipeline button','[data-pipeline-view]','[data-pipe-view]'], labels[a] || a);
      }
      if(view === 'playbooks'){
        const labels = {scripts:'scripts', materiais:'materiais', ia:'ia', playbooks:'playbooks'};
        clickByText(['#playbooks button','[data-intel-tab]','[data-pb-tab]'], labels[a] || a);
      }
      if(view === 'automacoes'){
        const labels = {modelos:'modelos', criador:'criador', historico:'histórico'};
        clickByText(['#automacoes button','[data-auto-tab]'], labels[a] || a);
      }
    }catch(e){ console.warn('[CRM v60] ação de sub-aba', view, action, e); }
  }

  function areaForView(view){
    return AREAS.find(a => (a.match || []).includes(view)) || AREAS.find(a => a.view === view) || AREAS[0];
  }

  function updateActive(view){
    const activeId = (view || $('.view.active')?.id || 'inicio');
    const area = areaForView(activeId);
    $$('.v60-nav-group').forEach(g => g.classList.toggle('v60-active', g.dataset.area === area.key));
    $$('.v60-nav-item').forEach(b => b.classList.toggle('active', b.closest('.v60-nav-group')?.dataset.area === area.key));
  }

  function subButton(sub){
    return `<button type="button" class="v60-subitem" data-v60-view="${esc(sub.view)}" data-v60-action="${esc(sub.action || '')}" aria-label="${esc(sub.label)}">
      <span class="v60-sub-icon" aria-hidden="true">${icons[sub.icon] || icons.dot}</span>
      <span>${esc(sub.label)}</span>
    </button>`;
  }

  function areaMarkup(area){
    return `<div class="v60-nav-group" data-area="${esc(area.key)}">
      <button type="button" class="nav-item v60-nav-item" data-v60-view="${esc(area.view)}" title="${esc(area.label)}" aria-label="${esc(area.label)}">
        <span class="v60-icon" aria-hidden="true">${icons[area.icon] || icons.dot}</span>
        <span class="v60-nav-text">${esc(area.label)}</span>
      </button>
      <div class="v60-flyout" role="menu" aria-label="Sub-abas de ${esc(area.label)}">
        <div class="v60-flyout-title"><span class="v60-sub-icon" aria-hidden="true">${icons[area.icon] || icons.dot}</span><span>${esc(area.label)}</span></div>
        <div class="v60-flyout-list">${area.subs.map(subButton).join('')}</div>
      </div>
    </div>`;
  }

  function rebuildSidebar(){
    try{
      document.body.classList.add('crm-v60-sidebar-compacta','crm-ready');
      document.body.classList.remove('crm-sidebar-icons','crm-sidebar-fixed','crm-sidebar-pinned','crm-sidebar-collapsed','crm-v58-sidebar-auto');
      const sidebar = $('.sidebar');
      const nav = $('.sidebar-nav');
      if(!sidebar || !nav) return;
      sidebar.removeAttribute('hidden');
      sidebar.setAttribute('aria-label','Navegação compacta principal');
      sidebar.classList.add('v60-sidebar');
      nav.innerHTML = AREAS.map(areaMarkup).join('');
      $$('.rail,.topbar-tabs').forEach(el => el.classList.add('v57-disabled-layer'));
      $$('.sidebar-toggle,.v56-sidebar-toggle,[data-sidebar-toggle]').forEach(el => el.remove());

      $$('[data-v60-view]', nav).forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const view = btn.dataset.v60View;
          const action = btn.dataset.v60Action;
          goView(view, action);
        });
      });
      updateActive();
    }catch(e){ console.warn('[CRM v60] rebuildSidebar', e); }
  }

  function boot(){
    rebuildSidebar();
    // Passadas finitas para vencer scripts antigos que ainda mexem na sidebar durante o boot.
    [120, 420, 1000, 1800].forEach(ms => setTimeout(rebuildSidebar, ms));
  }

  document.addEventListener('click', (e) => {
    const old = e.target.closest('[data-view]');
    if(old && !e.target.closest('.sidebar')) setTimeout(() => updateActive(old.dataset.view), 80);
  }, true);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  window.addEventListener('pageshow', () => setTimeout(boot, 0));
})();
