/* Script original 21 */
(function(){
  'use strict';
  if(window.__crmV33StabilityPatch) return;
  window.__crmV33StabilityPatch = true;
  const $=(q,r=document)=>r.querySelector(q);
  const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
  const titles={
    inicio:['Painel','Visão geral das suas oportunidades'],leads:['Gestão de leads','Base comercial principal'],pipeline:['Pipeline','Funil de oportunidades'],funil:['Funil de vendas','Conversão, forecast, comparativo mensal e motivos de perda'],clientes:['Clientes','Relacionamentos cadastrados'],playbooks:['Playbooks','Scripts, checklists e materiais de vendas'],objecoes:['Biblioteca de Objeções','Respostas prontas para superar objeções'],perdas:['Motivos de Perda','Análise e reativação de negócios perdidos'],dashboard:['Dashboard Comercial','Visão completa de indicadores e performance'],cadencias:['Follow-ups','Fluxos de prospecção'],automacoes:['Automações','Regras de funil'],agenda:['Agenda','Planejamento e follow-ups'],ligacoes:['Ligações pelo computador','Discagem, timer, script e registro de chamadas'],chat:['Chat','Conversas com leads e clientes via WhatsApp'],metricas:['Métricas','Indicadores de desempenho'],importar:['Importar / Exportar','Gerencie seus dados'],garimpo:['Garimpo de Leads','Prospecção inteligente, scoring e criação rápida de oportunidades'],metas:['Metas comerciais','Central de metas, rotina diária, ligações e ritmo comercial']
  };
  function ensureButtonTypes(){ $$('button:not([type])').forEach(b=>{try{b.type='button'}catch(e){}}); }
  function activateNav(view){ $$('[data-view],[data-go],[data-go-view]').forEach(el=>{const key=el.dataset.view||el.dataset.go||el.dataset.goView;el.classList.toggle('active',key===view);}); }
  function updateTopbar(view){const meta=titles[view]||[view||'CRM','']; const t=$('#topbarTitle'),s=$('#topbarSub'); if(t)t.textContent=meta[0]; if(s)s.textContent=meta[1];}
  function openLeadModal(){try{ if(typeof window.openModal==='function'){window.openModal(null);return true;} }catch(e){} try{ if(typeof openModal==='function'){openModal(null);return true;} }catch(e){} return false;}
  function showView(view){
    view=String(view||'inicio').trim();
    if(view==='novo-lead' && openLeadModal()) return;
    const target=document.getElementById(view)||document.getElementById('inicio');
    if(!target) return;
    $$('.view').forEach(v=>{v.classList.remove('active');v.style.display='none';});
    target.classList.add('active');
    if(target.id==='chat') target.style.display='block';
    else if(target.classList.contains('grid-view')||['metas','funil','ligacoes','garimpo'].includes(target.id)) target.style.display='grid';
    else target.style.display='';
    activateNav(target.id); updateTopbar(target.id); document.body.dataset.currentView=target.id;
    try{localStorage.setItem('crm_current_view',target.id)}catch(e){}
    setTimeout(()=>{
      try{ if(target.id==='agenda' && typeof renderAgenda==='function') renderAgenda(); }catch(e){}
      try{ if(target.id==='metricas' && typeof renderMetrics==='function') renderMetrics(); }catch(e){}
      try{ if(target.id==='dashboard' && typeof renderDashboard==='function') renderDashboard(); }catch(e){}
      try{ if(target.id==='chat' && typeof renderConversationList==='function') renderConversationList(); }catch(e){}
      try{ if(target.id==='chat' && typeof updateChatBadge==='function') updateChatBadge(); }catch(e){}
      try{ if(target.id==='ligacoes' && typeof window.renderCallCenterV9==='function') window.renderCallCenterV9(); }catch(e){}
      try{ if(target.id==='funil' && typeof window.renderFunilPage==='function') window.renderFunilPage(); }catch(e){}
      try{ if(target.id==='garimpo' && typeof window.renderGarimpoLeadsV7==='function') window.renderGarimpoLeadsV7(); }catch(e){}
      try{document.dispatchEvent(new CustomEvent('crm:viewchange',{detail:{view:target.id}}));}catch(e){}
    },30);
  }
  window.setView=showView;
  document.addEventListener('click',function(e){
    const nav=e.target.closest('[data-view],[data-go],[data-go-view]');
    if(nav){const view=nav.dataset.view||nav.dataset.go||nav.dataset.goView;if(view){e.preventDefault();e.stopPropagation();showView(view);return;}}
    const close=e.target.closest('.modal-close,[data-modal-close]');
    if(close){const ov=close.closest('.modal-overlay,.detail-overlay,.v32-goals-modal'); if(ov){ov.classList.add('hidden');ov.classList.remove('open');ov.setAttribute('aria-hidden','true');}}
  },true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')$$('.modal-overlay:not(.hidden),.detail-overlay:not(.hidden),.v32-goals-modal.open').forEach(ov=>{ov.classList.add('hidden');ov.classList.remove('open');ov.setAttribute('aria-hidden','true');});});
  function boot(){ensureButtonTypes();const active=$('.view.active');let view=(active&&active.id)||'';try{view=view||localStorage.getItem('crm_current_view')||'inicio'}catch(e){view=view||'inicio'};if(!document.getElementById(view))view='inicio';showView(view);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  new MutationObserver(()=>ensureButtonTypes()).observe(document.body,{subtree:true,childList:true});
})();
