/* CRM V99.0 — único proprietário de navegação e renderização. */
(function(W,D){
  'use strict';
  const aliases=Object.freeze({funil:'pipeline',clientes:'leads',objecoes:'playbooks',dashboard:'metricas',perdas:'metricas',importar:'configuracoes'});
  const allowed=new Set(['inicio','leads','novo-lead','garimpo','pipeline','cadencias','automacoes','agenda','ligacoes','chat','metas','playbooks','metricas','configuracoes']);
  const titles={inicio:['Painel','Ações, oportunidades e prioridades do dia'],leads:['Leads','Base comercial e clientes'],'novo-lead':['Novo lead','Cadastro de uma oportunidade'],garimpo:['Garimpo','Prospecção e qualificação de oportunidades'],pipeline:['Pipeline','Kanban, tabela e funil comercial'],cadencias:['Follow-ups','Fila, cadências e próximos contatos'],automacoes:['Automações','Regras, lembretes e notificações'],agenda:['Agenda','Compromissos e follow-ups'],ligacoes:['Ligações','Fila e ligação em foco'],chat:['Atendimento','Conversas com leads'],metas:['Metas','Ritmo e resultados comerciais'],playbooks:['Playbooks','Scripts, objeções e cadências'],metricas:['Métricas','Dashboard, desempenho e perdas'],configuracoes:['Configurações','Preferências, dados e personalização']};
  const $=(s,r=D)=>r.querySelector(s),$$=(s,r=D)=>Array.from(r.querySelectorAll(s));
  let current='inicio',navToken=0,rendering=false,lastRenderAt=0;
  function normalize(v){v=String(v||'inicio').replace(/^#/,'');v=aliases[v]||v;return allowed.has(v)?v:'inicio'}
  function activate(view){
    $$('.view[id]').forEach(el=>{const on=el.id===view;el.classList.toggle('active',on);el.setAttribute('aria-hidden',on?'false':'true');if(!on&&el.id!=='chat')el.style.display='';if(el.id==='chat')el.style.display=on?'block':'none'});
    $$('[data-view],[data-go],[data-go-view]').forEach(el=>{const target=normalize(el.dataset.view||el.dataset.go||el.dataset.goView);el.classList.toggle('active',target===view);if(target===view)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
    D.body.dataset.currentView=view;const meta=titles[view]||[view,''];if($('#topbarTitle'))$('#topbarTitle').textContent=meta[0];if($('#topbarSub'))$('#topbarSub').textContent=meta[1];
  }
  function render(view,original){
    const api={inicio:()=>{W.CRMV67Dashboard?.shell?.();return W.CRMV67Dashboard?.render?.()},leads:()=>W.CRMV94Official?.renderLeads?.(false),'novo-lead':()=>W.CRMV94Official?.renderLeads?.(true),garimpo:()=>W.CRMV93Official?.renderGarimpo?.(),pipeline:()=>{if(original==='funil')localStorage.setItem('crm_v65_pipeline_view','funnel');return W.CRMV65Pipeline?.render?.()},cadencias:()=>W.CRMV982Followups?.render?.(),automacoes:()=>W.CRMV952RuleEngine?.render?.(),agenda:()=>W.CRMV64Agenda?.render?.(),ligacoes:()=>W.CRMV990Ligacoes?.render?.(),metas:()=>W.CRMV68Goals?.render?.(),playbooks:()=>W.CRMPlaybookStudio?.render?.(),metricas:()=>W.CRMV94Official?.renderMetricas?.(),configuracoes:()=>W.CRMV972Settings?.render?.(),chat:()=>W.renderConversationList?.()};
    try{return api[view]?.()}catch(error){console.error('[CRM V99.0] Falha ao renderizar',view,error);W.crmToast?.('Não foi possível abrir esta área.','error')}
  }
  function ensureSingle(view=current){$$('.view.active').forEach(el=>{if(el.id!==view)el.classList.remove('active')});D.getElementById(view)?.classList.add('active')}
  function go(requested,options={}){
    const original=String(requested||'inicio').replace(/^#/,'');const view=normalize(original),now=performance.now();
    if(view===current&&!options.force&&now-lastRenderAt<180)return view;
    current=view;lastRenderAt=now;const token=++navToken;activate(view);
    try{localStorage.setItem('crm_current_view',view);if(options.hash!==false&&location.hash!=='#'+view)history.replaceState(null,'','#'+view)}catch(_){ }
    rendering=true;render(view,original);ensureSingle(view);rendering=false;try{D.dispatchEvent(new CustomEvent('crm:viewchange',{detail:{view,original,source:'navigation-v99'}}))}catch(_){ }requestAnimationFrame(()=>{if(token!==navToken)return;try{W.CRMV983LayoutStudio?.apply?.(view);W.CRMV988PremiumCleanup?.apply?.(D.getElementById(view))}catch(_){ }});return view;
  }
  function onNavigationClick(e){const nav=e.target.closest?.('[data-view],[data-go],[data-go-view],a[href^="#"]');if(!nav)return;const raw=nav.dataset?.view||nav.dataset?.go||nav.dataset?.goView||(nav.getAttribute?.('href')||'').slice(1);if(!raw||!allowed.has(normalize(raw)))return;e.preventDefault();e.stopImmediatePropagation();go(raw)}
  W.addEventListener('click',onNavigationClick,true);
  W.addEventListener('hashchange',()=>go(location.hash.slice(1),{hash:false}));
  let raf=0;const guard=new MutationObserver(m=>{if(rendering||!m.some(x=>x.type==='attributes'&&x.attributeName==='class'))return;cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>ensureSingle(current))});guard.observe(D.getElementById('app')||D.body,{subtree:true,attributes:true,attributeFilter:['class']});
  const router=Object.freeze({version:'V99.0',go,current:()=>current,normalize,aliases});
  Object.defineProperty(W,'setView',{value:go,writable:false,configurable:false,enumerable:true});
  W.CRMRouter=router;W.CRMNavigationV988=router;W.CRMNavigationV989=router;W.CRMNavigationV990=router;
  const initial=normalize(location.hash.slice(1)||localStorage.getItem('crm_current_view')||D.querySelector('.view.active')?.id||'inicio');queueMicrotask(()=>go(initial,{hash:false,force:true}));
})(window,document);
