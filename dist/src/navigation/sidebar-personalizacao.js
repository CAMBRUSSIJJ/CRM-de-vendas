/* EMBED: assets/js/modules/39-sidebar-personalizacao-v71.js */
/* CRM V71 — Sidebar profissional personalizada
   Substitui a sidebar V61, mantendo as APIs de compatibilidade. */
(function(){
  'use strict';
  if(window.__CRM_V71_SIDEBAR__) return;
  window.__CRM_V71_SIDEBAR__=true;
  window.__CRM_V61_SIDEBAR__=true;

  const doc=document;
  const $=(s,r=doc)=>r.querySelector(s);
  const $$=(s,r=doc)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const NAV=[
    {group:'Operação',id:'inicio',label:'Painel',icon:'home',badge:null},
    {group:'Operação',id:'leads',label:'Leads',icon:'users',badge:'navLeadsBadge'},
    {group:'Operação',id:'garimpo',label:'Garimpo de Leads',icon:'search'},
    {group:'Operação',id:'pipeline',label:'Pipeline',icon:'columns'},
    {group:'Operação',id:'funil',label:'Funil de vendas',icon:'funnel'},
    {group:'Operação',id:'cadencias',label:'Follow-ups',icon:'repeat'},
    {group:'Operação',id:'agenda',label:'Agenda',icon:'calendar'},
    {group:'Operação',id:'ligacoes',label:'Ligações',icon:'phone'},
    {group:'Operação',id:'chat',label:'Atendimento',icon:'message',badge:'navChatBadge'},
    {group:'Gestão',id:'dashboard',label:'Dashboard',icon:'grid'},
    {group:'Gestão',id:'metricas',label:'Métricas',icon:'bar'},
    {group:'Gestão',id:'metas',label:'Metas',icon:'target'},
    {group:'Gestão',id:'clientes',label:'Clientes',icon:'briefcase'},
    {group:'Gestão',id:'perdas',label:'Perdas',icon:'x-circle'},
    {group:'Inteligência',id:'playbooks',label:'Playbooks',icon:'book'},
    {group:'Inteligência',id:'objecoes',label:'Objeções',icon:'alert'},
    {group:'Inteligência',id:'automacoes',label:'Automações',icon:'zap'},
    {group:'Sistema',id:'importar',label:'Importar/Exportar',icon:'upload'},
    {group:'Sistema',id:'novo-lead',label:'Novo lead',icon:'plus',action:true}
  ];
  const PATHS={
    home:'<path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6M23 11h-6"></path>',
    search:'<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4.2-4.2"></path><path d="M8.5 11h5"></path>',
    columns:'<rect height="5" rx="1.3" width="7" x="3" y="5"></rect><rect height="5" rx="1.3" width="7" x="14" y="5"></rect><rect height="5" rx="1.3" width="7" x="3" y="14"></rect><rect height="5" rx="1.3" width="7" x="14" y="14"></rect>',
    funnel:'<path d="M3 5h18l-7 8v5l-4 2v-7L3 5z"></path>',
    repeat:'<path d="M17 2l4 4-4 4"></path><path d="M3 11V9a3 3 0 0 1 3-3h15"></path><path d="M7 22l-4-4 4-4"></path><path d="M21 13v2a3 3 0 0 1-3 3H3"></path>',
    calendar:'<rect height="18" rx="2" width="18" x="3" y="4"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>',
    phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.92.35 1.82.68 2.68a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.39-1.24a2 2 0 0 1 2.11-.45c.86.33 1.76.56 2.68.68A2 2 0 0 1 22 16.92z"></path>',
    message:'<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
    grid:'<rect height="8" rx="1.5" width="8" x="3" y="3"></rect><rect height="8" rx="1.5" width="8" x="13" y="3"></rect><rect height="8" rx="1.5" width="8" x="3" y="13"></rect><rect height="8" rx="1.5" width="8" x="13" y="13"></rect>',
    bar:'<path d="M4 20V10"></path><path d="M10 20V4"></path><path d="M16 20v-7"></path><path d="M22 20v-11"></path>',
    target:'<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>',
    briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M3 12h18"></path>',
    'x-circle':'<circle cx="12" cy="12" r="9"></circle><path d="m15 9-6 6M9 9l6 6"></path>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>',
    alert:'<circle cx="12" cy="12" r="9"></circle><path d="M12 8v4M12 16h.01"></path>',
    zap:'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"></path>',
    upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M17 8l-5-5-5 5"></path><path d="M12 3v12"></path>',
    plus:'<path d="M12 5v14M5 12h14"></path>',
    settings:'<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82V22h-3.34v-.18A1.65 1.65 0 0 0 9 20a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1H2v-4h2a1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 4.3l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6V2h4v2a1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 19.7 7.04l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.37.37.7.6 1h2v4h-2a1.65 1.65 0 0 0-.6 1z"></path>',
    sun:'<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>'
  };
  function icon(name){return '<svg class="v61-nav-svg v71-nav-svg" viewBox="0 0 24 24" aria-hidden="true">'+(PATHS[name]||PATHS.grid)+'</svg>';}
  window.crmV61Icon=icon;

  function getSettings(){
    try{if(window.crmV71Settings)return window.crmV71Settings.load();}catch(e){}
    try{if(window.crmV61Settings)return window.crmV61Settings.load();}catch(e){}
    try{return JSON.parse(localStorage.getItem('crm_v71_settings')||localStorage.getItem('crm_v61_settings')||'{}');}catch(e){return {};}
  }
  function navItems(){return NAV.slice();}
  function orderedNav(){
    const st=getSettings(); const order=Array.isArray(st.tabOrder)?st.tabOrder:[]; const pos=new Map(order.map((id,i)=>[id,i]));
    return NAV.slice().sort((a,b)=>{
      const pa=pos.has(a.id)?pos.get(a.id):9999;
      const pb=pos.has(b.id)?pos.get(b.id):9999;
      if(pa!==pb)return pa-pb;
      return NAV.indexOf(a)-NAV.indexOf(b);
    });
  }
  function visibleItems(){const st=getSettings();const hidden=new Set(Array.isArray(st.hiddenTabs)?st.hiddenTabs:[]);return orderedNav().filter(item=>!hidden.has(item.id));}
  function grouped(items){const groups=[];items.forEach(item=>{let g=groups.find(x=>x.name===item.group);if(!g){g={name:item.group,items:[]};groups.push(g);}g.items.push(item);});return groups;}
  function navButton(item){
    const badge=item.badge?'<span class="nav-badge" id="'+esc(item.badge)+'">'+(item.badge==='navChatBadge'?'0':'4')+'</span>':'';
    return '<button type="button" class="nav-item'+(item.action?' v61-action-item':'')+'" data-view="'+esc(item.id)+'" data-label="'+esc(item.label)+'" title="'+esc(item.label)+'" aria-label="'+esc(item.label)+'">'+icon(item.icon)+'<span class="v61-nav-text v71-nav-text">'+esc(item.label)+'</span>'+badge+'</button>';
  }
  function quickButton(id){const item=NAV.find(x=>x.id===id);if(!item)return '';return '<button type="button" class="v71-quick-action" data-view="'+esc(item.id)+'" data-label="'+esc(item.label)+'" title="'+esc(item.label)+'" aria-label="'+esc(item.label)+'">'+icon(item.icon)+'<span>'+esc(item.label)+'</span></button>';}
  function buildFooter(hidden,st){
    const hideNew=hidden.has('novo-lead');
    const quicks=st.quickActions===false?'':('<div class="v71-quick-actions">'+(Array.isArray(st.quickActionItems)?st.quickActionItems:[]).filter(id=>!hidden.has(id)).slice(0,5).map(quickButton).join('')+'</div>');
    return '<div class="sidebar-footer">'+quicks+
      (hideNew?'':'<button type="button" class="v61-sidebar-action primary" data-view="novo-lead" data-label="Novo lead" title="Novo lead" aria-label="Novo lead">'+icon('plus')+'<span>Novo lead</span></button>')+
      '<button type="button" class="crm-v61-settings-btn crm-v71-settings-btn" id="crmV71SettingsBtn" data-v71-open-settings aria-label="Configurações" title="Configurações">'+icon('settings')+'<span>Personalizar</span></button>'+
      '<button type="button" class="theme-toggle" id="themeToggle" data-v71-toggle-theme aria-label="Alternar tema" title="Alternar tema">'+icon('sun')+'<span>Alternar tema</span></button>'+
    '</div>';
  }
  function renderSidebar(){
    const sidebar=$('.sidebar');if(!sidebar)return;
    const st=getSettings();const hidden=new Set(Array.isArray(st.hiddenTabs)?st.hiddenTabs:[]);
    const items=visibleItems().filter(x=>!x.action);
    const active=$('.view.active')?.id||localStorage.getItem('crm_v45_current_view')||localStorage.getItem('crm_current_view')||'inicio';
    sidebar.setAttribute('aria-label','Navegação principal personalizada');sidebar.removeAttribute('hidden');
    sidebar.innerHTML='<div class="sidebar-brand"><div class="brand-icon">'+icon('zap')+'</div><div><div class="brand-name">Outbounder</div><div class="brand-sub">CRM · V71</div></div></div>'+
      '<nav class="sidebar-nav">'+grouped(items).map(group=>'<div class="v61-nav-section v71-nav-section"><div class="nav-label">'+esc(group.name)+'</div>'+group.items.map(navButton).join('')+'</div>').join('')+'</nav>'+buildFooter(hidden,st);
    $$('.sidebar .nav-item,.sidebar [data-view]').forEach(btn=>{const on=btn.dataset.view===active;btn.classList.toggle('active',on);if(on)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');});
    bindSidebar();applyTabVisibility();syncBadges();
  }
  function syncBadges(){
    try{const oldLead=$$('#navLeadsBadge').find(x=>!x.closest('.sidebar'));const newLead=$('.sidebar #navLeadsBadge');if(oldLead&&newLead)newLead.textContent=oldLead.textContent||newLead.textContent;const oldChat=$$('#navChatBadge').find(x=>!x.closest('.sidebar'));const newChat=$('.sidebar #navChatBadge');if(oldChat&&newChat)newChat.textContent=oldChat.textContent||newChat.textContent;}catch(e){}
  }
  function applyTabVisibility(){
    const st=getSettings();const hidden=new Set(Array.isArray(st.hiddenTabs)?st.hiddenTabs:[]);
    $$('[data-view]').forEach(el=>{if(el.closest('#crmV71Settings,#crmV61Settings'))return;const id=el.dataset.view;if(!id)return;el.classList.toggle('is-hidden-by-user',hidden.has(id));if((el.classList.contains('tab')||el.classList.contains('rail-btn')||el.classList.contains('rail-logo'))&&hidden.has(id))el.setAttribute('hidden','');else if(el.hasAttribute('hidden')&&(el.classList.contains('tab')||el.classList.contains('rail-btn')||el.classList.contains('rail-logo')))el.removeAttribute('hidden');});
    const active=$('.view.active')?.id;if(active&&hidden.has(active)){const next=visibleItems().find(x=>!x.action)?.id||'inicio';go(next);}
  }
  function forceReady(){doc.documentElement.classList.add('crm-ready');doc.body.classList.add('crm-ready','crm-v61','crm-v71');doc.body.classList.remove('loading','is-loading','app-loading');const app=$('#app');if(app){app.style.visibility='visible';app.style.opacity='1';if(app.style.display==='none')app.style.display='block';}$$('.loading,.loader,.preloader,.splash,.loading-overlay,[data-loading],#loading,#loader,#preloader').forEach(el=>{el.style.display='none';el.setAttribute('aria-hidden','true');});}
  function go(view){
    if(!view)return;
    try{if(typeof window.setView==='function')window.setView(view);}catch(e){$$('.view[id]').forEach(sec=>{const on=sec.id===view;sec.classList.toggle('active',on);sec.style.display=on?'':'none';});}
    localStorage.setItem('crm_v45_current_view',view);localStorage.setItem('crm_current_view',view);
    setTimeout(()=>{$$('.sidebar [data-view]').forEach(btn=>{const on=btn.dataset.view===($('.view.active')?.id||view);btn.classList.toggle('active',on);if(on)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');});},40);
  }
  function bindSidebar(){
    if(doc.__crmV71SidebarBound)return;doc.__crmV71SidebarBound=true;
    doc.addEventListener('click',ev=>{
      const theme=ev.target.closest('[data-v71-toggle-theme],[data-v61-toggle-theme]');
      if(theme){ev.preventDefault();try{const st=(window.crmV71Settings||window.crmV61Settings).load();st.theme=st.theme==='dark'?'light':'dark';(window.crmV71Settings||window.crmV61Settings).set(st);}catch(e){doc.documentElement.dataset.theme=doc.documentElement.dataset.theme==='dark'?'light':'dark';}return;}
      const btn=ev.target.closest('.sidebar [data-view],.v61-sidebar-action[data-view],.v71-quick-action[data-view]');if(!btn)return;const view=btn.dataset.view;if(!view)return;ev.preventDefault();go(view);
    });
  }
  function boot(){
    forceReady();$$('.v56-sidebar-toggle,.sidebar-toggle,[data-sidebar-toggle]').forEach(el=>el.remove());$$('.rail,.topbar-tabs').forEach(el=>el.classList.add('v57-disabled-layer'));
    try{const api=window.crmV71Settings||window.crmV61Settings;if(api)api.apply(api.load());}catch(e){}
    renderSidebar();[120,420,900,1600].forEach(ms=>setTimeout(()=>{forceReady();renderSidebar();},ms));
  }
  window.crmV61GetNavItems=navItems;
  window.crmV61RenderSidebar=renderSidebar;
  window.crmV61ApplyTabVisibility=applyTabVisibility;
  window.crmV71RenderSidebar=renderSidebar;
  window.addEventListener('crm:settings-updated',()=>setTimeout(renderSidebar,0));
  window.addEventListener('pageshow',()=>setTimeout(boot,0));
  window.addEventListener('error',()=>setTimeout(forceReady,0));
  window.addEventListener('unhandledrejection',()=>setTimeout(forceReady,0));
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
