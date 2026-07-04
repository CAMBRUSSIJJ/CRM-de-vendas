/* Script original 19 */
(function(){
  'use strict';
  if(window.__crmV31NavigationHotfix) return;
  window.__crmV31NavigationHotfix = true;

  const $ = (q,r=document)=>r.querySelector(q);
  const $$ = (q,r=document)=>Array.from(r.querySelectorAll(q));
  const titles = {
    inicio:['Painel','Visão geral das suas oportunidades'],
    leads:['Gestão de leads','Base comercial principal'],
    pipeline:['Pipeline','Funil de oportunidades'],
    funil:['Funil de vendas','Conversão, forecast, comparativo mensal e motivos de perda'],
    clientes:['Clientes','Relacionamentos cadastrados'],
    playbooks:['Playbooks','Scripts, checklists e materiais de vendas'],
    objecoes:['Biblioteca de Objeções','Respostas prontas para superar objeções'],
    perdas:['Motivos de Perda','Análise e reativação de negócios perdidos'],
    dashboard:['Dashboard Comercial','Visão completa de indicadores e performance'],
    cadencias:['Follow-ups','Fluxos de prospecção'],
    automacoes:['Automações','Regras de funil'],
    agenda:['Agenda','Planejamento e follow-ups'],
    ligacoes:['Ligações pelo computador','Discagem, timer, script e registro de chamadas'],
    chat:['Chat','Conversas com leads e clientes via WhatsApp'],
    metricas:['Métricas','Indicadores de desempenho'],
    importar:['Importar / Exportar','Gerencie seus dados'],
    garimpo:['Garimpo de Leads','Prospecção inteligente, scoring e criação rápida de oportunidades'],
    metas:['Metas comerciais','Central de metas, rotina diária, ligações e ritmo comercial'],
    'novo-lead':['Novo lead','Cadastro rápido']
  };

  function openNewLeadModal(){
    try{
      if(typeof openModal === 'function') { openModal(null); return true; }
      if(window.openModal) { window.openModal(null); return true; }
    }catch(e){}
    return false;
  }

  function setActiveButton(view){
    $$('[data-view],[data-go],[data-go-view]').forEach(el=>{
      const key = el.dataset.view || el.dataset.go || el.dataset.goView;
      el.classList.toggle('active', key === view);
    });
  }

  function updateTopbar(view){
    const meta = titles[view] || [view || 'CRM',''];
    const tt = $('#topbarTitle'), ts = $('#topbarSub');
    if(tt) tt.textContent = meta[0];
    if(ts) ts.textContent = meta[1];
  }

  function showOnly(view){
    $$('.view').forEach(el=>{
      el.classList.remove('active');
      if(el.id === 'chat') el.style.display = 'none';
      else el.style.display = '';
    });

    const target = document.getElementById(view);
    if(target){
      target.classList.add('active');
      if(view === 'chat') target.style.display = 'block';
      else if(target.classList.contains('grid-view') || ['funil','metas','ligacoes','garimpo'].includes(view)) target.style.display = 'grid';
      else target.style.display = '';
    }

    // Garantia extra: Metas nunca fica visível se não for a aba ativa.
    const metas = $('#metas');
    if(metas && view !== 'metas'){
      metas.classList.remove('active');
      metas.style.display = 'none';
    }
  }

  function runViewRender(view){
    setTimeout(()=>{
      try{ if(view === 'agenda' && typeof renderAgenda === 'function') renderAgenda(); }catch(e){}
      try{ if(view === 'metricas' && typeof renderMetrics === 'function') renderMetrics(); }catch(e){}
      try{ if(view === 'dashboard' && typeof renderDashboard === 'function') renderDashboard(); }catch(e){}
      try{ if(view === 'chat' && typeof renderConversationList === 'function') renderConversationList(); }catch(e){}
      try{ if(view === 'chat' && typeof updateChatBadge === 'function') updateChatBadge(); }catch(e){}
      try{ if(view === 'ligacoes' && typeof window.renderCallCenterV9 === 'function') window.renderCallCenterV9(); }catch(e){}
      try{ if(view === 'funil' && typeof window.renderFunilPage === 'function') window.renderFunilPage(); }catch(e){}
      try{ if(view === 'garimpo' && typeof window.renderGarimpoLeadsV7 === 'function') window.renderGarimpoLeadsV7(); }catch(e){}
      try{ document.dispatchEvent(new CustomEvent('crm:viewchange',{detail:{view}})); }catch(e){}
    },40);
  }

  function stableSetView(view){
    view = String(view || '').trim();
    if(!view) return;
    if(view === 'novo-lead' && openNewLeadModal()) return;

    showOnly(view);
    setActiveButton(view);
    updateTopbar(view);
    document.body.dataset.currentView = view;
    try{ localStorage.setItem('crm_current_view', view); }catch(e){}
    runViewRender(view);
  }

  window.setView = stableSetView;
  try{ setView = stableSetView; }catch(e){}

  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-view],[data-go],[data-go-view]');
    if(!btn) return;
    const view = btn.dataset.view || btn.dataset.go || btn.dataset.goView;
    if(!view) return;

    e.preventDefault();
    e.stopPropagation();
    stableSetView(view);
  }, true);

  // Corrige imediatamente caso a página carregue com Metas aparecendo por cima.
  setTimeout(()=>{
    const active = $('.view.active');
    stableSetView(active && active.id ? active.id : 'inicio');
  },80);
})();
