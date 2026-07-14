/* Sidebar oficial — navegação consolidada com pesquisa e comandos. */
(function(){
  'use strict';
  if(window.__CRM_V985_SIDEBAR__)return;
  window.__CRM_V985_SIDEBAR__=true;
  window.__CRM_V71_SIDEBAR__=true;
  window.__CRM_V61_SIDEBAR__=true;

  const D=document;
  const $=(s,r=D)=>r.querySelector(s);
  const $$=(s,r=D)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

  const NAV=[
    {group:'Operação',id:'inicio',label:'Painel',icon:'home',keywords:'início dashboard rotina'},
    {group:'Operação',id:'leads',label:'Leads',icon:'users',badge:'navLeadsBadge',keywords:'clientes contatos base'},
    {group:'Operação',id:'garimpo',label:'Garimpo de Leads',icon:'search',keywords:'prospecção buscar empresas'},
    {group:'Operação',id:'pipeline',label:'Pipeline',icon:'columns',keywords:'kanban funil etapas oportunidades'},
    {group:'Operação',id:'cadencias',label:'Follow-ups',icon:'repeat',keywords:'cadência retorno próximos contatos'},
    {group:'Operação',id:'agenda',label:'Agenda',icon:'calendar',keywords:'calendário compromissos reuniões'},
    {group:'Operação',id:'ligacoes',label:'Ligações',icon:'phone',keywords:'telefone chamada rotina script'},
    {group:'Operação',id:'chat',label:'Atendimento',icon:'message',badge:'navChatBadge',keywords:'whatsapp conversa mensagens'},
    {group:'Gestão',id:'metricas',label:'Métricas',icon:'bar',keywords:'dashboard perdas indicadores relatórios'},
    {group:'Gestão',id:'metas',label:'Metas',icon:'target',keywords:'objetivos performance comercial'},
    {group:'Inteligência',id:'playbooks',label:'Playbooks',icon:'book',keywords:'scripts objeções roteiros'},
    {group:'Inteligência',id:'automacoes',label:'Automações',icon:'zap',keywords:'regras gatilhos fluxos'},
    {group:'Sistema',id:'configuracoes',label:'Configurações',icon:'settings',keywords:'personalização layout importar exportar backup'},
    {group:'Sistema',id:'novo-lead',label:'Novo lead',icon:'plus',keywords:'criar cadastrar oportunidade',action:true}
  ];
  const PATHS={
    home:'<path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6M23 11h-6"></path>',
    search:'<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4.2-4.2"></path><path d="M8.5 11h5"></path>',
    columns:'<rect height="5" rx="1.3" width="7" x="3" y="5"></rect><rect height="5" rx="1.3" width="7" x="14" y="5"></rect><rect height="5" rx="1.3" width="7" x="3" y="14"></rect><rect height="5" rx="1.3" width="7" x="14" y="14"></rect>',
    repeat:'<path d="M17 2l4 4-4 4"></path><path d="M3 11V9a3 3 0 0 1 3-3h15"></path><path d="M7 22l-4-4 4-4"></path><path d="M21 13v2a3 3 0 0 1-3 3H3"></path>',
    calendar:'<rect height="18" rx="2" width="18" x="3" y="4"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>',
    phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.92.35 1.82.68 2.68a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.39-1.24a2 2 0 0 1 2.11-.45c.86.33 1.76.56 2.68.68A2 2 0 0 1 22 16.92z"></path>',
    message:'<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
    bar:'<path d="M4 20V10"></path><path d="M10 20V4"></path><path d="M16 20v-7"></path><path d="M22 20v-11"></path>',
    target:'<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>',
    zap:'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"></path>',
    plus:'<path d="M12 5v14M5 12h14"></path>',
    settings:'<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82V22h-3.34v-.18A1.65 1.65 0 0 0 9 20a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1H2v-4h2a1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 4.3l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6V2h4v2a1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 19.7 7.04l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.37.37.7.6 1h2v4h-2a1.65 1.65 0 0 0-.6 1z"></path>',
    sun:'<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>'
  };
  function icon(name){return '<svg class="v61-nav-svg v71-nav-svg" viewBox="0 0 24 24" aria-hidden="true">'+(PATHS[name]||PATHS.settings)+'</svg>'}
  window.crmV61Icon=icon;

  function getSettings(){try{if(window.crmV71Settings)return window.crmV71Settings.load()}catch(e){}try{if(window.crmV61Settings)return window.crmV61Settings.load()}catch(e){}try{return JSON.parse(localStorage.getItem('crm_v71_settings')||localStorage.getItem('crm_v61_settings')||'{}')}catch(e){return {}}}
  function navItems(){return NAV.slice()}
  function orderedNav(){const st=getSettings(),order=Array.isArray(st.tabOrder)?st.tabOrder:[],pos=new Map(order.map((id,i)=>[id,i]));return NAV.slice().sort((a,b)=>(pos.has(a.id)?pos.get(a.id):9999)-(pos.has(b.id)?pos.get(b.id):9999)||NAV.indexOf(a)-NAV.indexOf(b))}
  function visibleItems(){const hidden=new Set(Array.isArray(getSettings().hiddenTabs)?getSettings().hiddenTabs:[]);return orderedNav().filter(i=>!hidden.has(i.id))}
  function grouped(items){const out=[];items.forEach(item=>{let g=out.find(x=>x.name===item.group);if(!g){g={name:item.group,items:[]};out.push(g)}g.items.push(item)});return out}
  function navButton(item){const badge=item.badge?'<span class="nav-badge" id="'+esc(item.badge)+'">0</span>':'';return `<button type="button" class="nav-item" data-view="${esc(item.id)}" data-label="${esc(item.label)}" data-search-text="${esc(norm(item.label+' '+item.group+' '+item.keywords))}" title="${esc(item.label)}">${icon(item.icon)}<span class="v61-nav-text v71-nav-text">${esc(item.label)}</span>${badge}</button>`}

  const COMMANDS=[
    ...NAV.filter(i=>!i.action).map(i=>({label:'Ir para '+i.label,detail:i.group,icon:i.icon,view:i.id,keywords:i.keywords})),
    {label:'Criar novo lead',detail:'Ação rápida',icon:'plus',view:'novo-lead',keywords:'novo cadastrar oportunidade'},
    {label:'Configurar etapas do Pipeline',detail:'Pipeline',icon:'columns',action:'pipeline-config',keywords:'kanban cores probabilidade prazo'},
    {label:'Começar rotina de ligações',detail:'Ligações',icon:'phone',action:'calls-start',keywords:'telefonar fila chamada'},
    {label:'Abrir personalização',detail:'Configurações',icon:'settings',action:'settings',keywords:'layout cores cards tema'},
    {label:'Alternar tema claro/escuro',detail:'Aparência',icon:'sun',action:'theme',keywords:'dark light aparência'}
  ];
  function commandResults(q){const n=norm(q);if(!n)return COMMANDS.slice(0,6);return COMMANDS.filter(c=>norm([c.label,c.detail,c.keywords].join(' ')).includes(n)).slice(0,8)}
  function commandResultHTML(c,i){return `<button type="button" data-command-index="${i}" ${c.view?`data-command-view="${esc(c.view)}"`:''} ${c.action?`data-command-action="${esc(c.action)}"`:''}>${icon(c.icon)}<span><b>${esc(c.label)}</b><small>${esc(c.detail)}</small></span><kbd>↵</kbd></button>`}
  function searchBox(){return `<div class="v985-sidebar-search"><div class="v985-sidebar-search-field">${icon('search')}<input id="crmCommandSearch" type="search" autocomplete="off" placeholder="Pesquisar ou digitar comando..." aria-label="Pesquisar páginas e comandos"><kbd>Ctrl K</kbd></div><div id="crmCommandResults" class="v985-command-results" hidden></div></div>`}
  function buildFooter(hidden){return `<div class="sidebar-footer">${hidden.has('novo-lead')?'':`<button type="button" class="v61-sidebar-action primary" data-view="novo-lead">${icon('plus')}<span>Novo lead</span></button>`}<button type="button" class="crm-v61-settings-btn crm-v71-settings-btn" id="crmV71SettingsBtn" data-v71-open-settings aria-label="Configurações" title="Configurações">${icon('settings')}<span>Configurações</span></button><button type="button" class="theme-toggle" id="themeToggle" data-v71-toggle-theme aria-label="Alternar tema" title="Alternar tema">${icon('sun')}<span>Alternar tema</span></button></div>`}

  function renderSidebar(){
    const sidebar=$('.sidebar');if(!sidebar)return;const st=getSettings(),hidden=new Set(Array.isArray(st.hiddenTabs)?st.hiddenTabs:[]),items=visibleItems().filter(i=>!i.action),active=$('.view.active')?.id||localStorage.getItem('crm_current_view')||'inicio';
    sidebar.setAttribute('aria-label','Navegação principal');sidebar.removeAttribute('hidden');
    sidebar.innerHTML=`<div class="sidebar-brand"><div class="brand-icon">${icon('zap')}</div><div><div class="brand-name">RealTalent CRM</div><div class="brand-sub">Operação comercial</div></div></div>${searchBox()}<nav class="sidebar-nav">${grouped(items).map(g=>`<div class="v61-nav-section v71-nav-section"><div class="nav-label">${esc(g.name)}</div>${g.items.map(navButton).join('')}</div>`).join('')}</nav>${buildFooter(hidden)}`;
    $$('.sidebar [data-view]').forEach(btn=>{const on=btn.dataset.view===active;btn.classList.toggle('active',on);if(on)btn.setAttribute('aria-current','page')});applyTabVisibility();syncBadges();
  }
  function syncBadges(){try{const oldLead=$$('#navLeadsBadge').find(x=>!x.closest('.sidebar')),newLead=$('.sidebar #navLeadsBadge');if(oldLead&&newLead)newLead.textContent=oldLead.textContent||'0';const oldChat=$$('#navChatBadge').find(x=>!x.closest('.sidebar')),newChat=$('.sidebar #navChatBadge');if(oldChat&&newChat)newChat.textContent=oldChat.textContent||'0'}catch(e){}}
  function applyTabVisibility(){const hidden=new Set(Array.isArray(getSettings().hiddenTabs)?getSettings().hiddenTabs:[]);$$('[data-view]').forEach(el=>{if(el.closest('#crmV71Settings,#crmV61Settings'))return;const id=el.dataset.view;if(id)el.classList.toggle('is-hidden-by-user',hidden.has(id))});const active=$('.view.active')?.id;if(active&&hidden.has(active))go(visibleItems().find(i=>!i.action)?.id||'inicio')}
  function forceReady(){D.documentElement.classList.add('crm-ready');D.body.classList.add('crm-ready','crm-v61','crm-v71');D.body.classList.remove('loading','is-loading','app-loading');const app=$('#app');if(app){app.style.visibility='visible';app.style.opacity='1';if(app.style.display==='none')app.style.display='block'}$$('.loading,.loader,.preloader,.splash,.loading-overlay,[data-loading],#loading,#loader,#preloader').forEach(el=>{el.style.display='none';el.setAttribute('aria-hidden','true')})}
  function go(view){if(!view)return;try{window.setView?.(view)}catch(e){$$('.view[id]').forEach(sec=>sec.classList.toggle('active',sec.id===view))}localStorage.setItem('crm_current_view',view);setTimeout(()=>{$$('.sidebar [data-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===($('.view.active')?.id||view)))},40)}
  function toggleTheme(){try{const api=window.crmV71Settings||window.crmV61Settings,st=api.load();st.theme=st.theme==='dark'?'light':'dark';api.set(st)}catch(e){D.documentElement.dataset.theme=D.documentElement.dataset.theme==='dark'?'light':'dark'}}
  function executeCommand(el){const view=el?.dataset.commandView,action=el?.dataset.commandAction;if(view){go(view);closeSearch();return}if(action==='pipeline-config'){go('pipeline');setTimeout(()=>window.CRMV65Pipeline?.openStageConfig?.(),100)}if(action==='calls-start'){go('ligacoes');setTimeout(()=>window.CRMV984Ligacoes?.start?.(),100)}if(action==='settings'){$('#crmV71SettingsBtn')?.click()}if(action==='theme')toggleTheme();closeSearch()}
  function updateSearch(q){const results=$('#crmCommandResults');if(!results)return;const n=norm(q);$$('.sidebar-nav .nav-item').forEach(btn=>btn.hidden=!!n&&!btn.dataset.searchText.includes(n));$$('.sidebar-nav .v71-nav-section').forEach(sec=>sec.hidden=!sec.querySelector('.nav-item:not([hidden])'));const cmds=commandResults(q);results.innerHTML=cmds.map(commandResultHTML).join('')||'<div class="v985-command-empty">Nenhum resultado.</div>';results.hidden=!q;results.dataset.open=q?'1':'0'}
  function closeSearch(){const input=$('#crmCommandSearch'),results=$('#crmCommandResults');if(input){input.value='';updateSearch('');input.blur()}if(results)results.hidden=true}

  function bind(){
    if(D.__crmV985SidebarBound)return;D.__crmV985SidebarBound=true;
    D.addEventListener('input',e=>{if(e.target.id==='crmCommandSearch')updateSearch(e.target.value)});
    D.addEventListener('click',e=>{const command=e.target.closest('[data-command-view],[data-command-action]');if(command){e.preventDefault();executeCommand(command);return}const theme=e.target.closest('[data-v71-toggle-theme],[data-v61-toggle-theme]');if(theme){e.preventDefault();toggleTheme();return}const btn=e.target.closest('.sidebar [data-view],.v61-sidebar-action[data-view]');if(btn){e.preventDefault();go(btn.dataset.view);closeSearch();return}if(!e.target.closest('.v985-sidebar-search')){$('#crmCommandResults')?.setAttribute('hidden','')}});
    D.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#crmCommandSearch')?.focus();$('#crmCommandSearch')?.select();return}if(e.key==='/'&&!['input','textarea','select'].includes(e.target?.tagName?.toLowerCase())){e.preventDefault();$('#crmCommandSearch')?.focus();return}if(e.target?.id==='crmCommandSearch'&&e.key==='Escape'){e.preventDefault();closeSearch();return}if(e.target?.id==='crmCommandSearch'&&e.key==='Enter'){const first=$('#crmCommandResults button');if(first){e.preventDefault();executeCommand(first)}}});
  }
  function boot(){forceReady();$$('.v56-sidebar-toggle,.sidebar-toggle,[data-sidebar-toggle]').forEach(el=>el.remove());$$('.rail,.topbar-tabs').forEach(el=>el.classList.add('v57-disabled-layer'));try{const api=window.crmV71Settings||window.crmV61Settings;if(api)api.apply(api.load())}catch(e){}renderSidebar();bind();[200,700].forEach(ms=>setTimeout(()=>{forceReady();renderSidebar()},ms))}

  window.crmV61GetNavItems=navItems;window.crmV61RenderSidebar=renderSidebar;window.crmV61ApplyTabVisibility=applyTabVisibility;window.crmV71RenderSidebar=renderSidebar;
  window.addEventListener('crm:settings-updated',()=>setTimeout(renderSidebar,0));window.addEventListener('pageshow',()=>setTimeout(boot,0));window.addEventListener('error',()=>setTimeout(forceReady,0));window.addEventListener('unhandledrejection',()=>setTimeout(forceReady,0));
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
