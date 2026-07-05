/* CRM v64 — navegação única sem sobreposição + configurações profissionais da agenda */
(function(){
  'use strict';
  if(window.__CRM_V64_ROUTER_AGENDA_PRO__) return;
  window.__CRM_V64_ROUTER_AGENDA_PRO__ = true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const load=(k,d)=>{try{const raw=localStorage.getItem(k);return raw?JSON.parse(raw):d}catch(e){return d}};
  const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  const toast=(msg,type='success')=>{try{window.crmToast?window.crmToast(msg,type):(window.showToast?window.showToast(msg,type):console.log(msg))}catch(e){console.log(msg)}};

  const LS_VIEW='crm_current_view';
  const LS_AGENDAS='outbounder_agendas_v63';
  const LS_UI='outbounder_agenda_v61_ui';
  const DEFAULT_AGENDAS=[
    {id:'comercial',name:'Comercial',color:'#1D9E75',active:true},
    {id:'followups',name:'Follow-ups',color:'#9333EA',active:true},
    {id:'reunioes',name:'Reuniões',color:'#2563EB',active:true},
    {id:'pessoal',name:'Pessoal',color:'#64748B',active:true}
  ];

  const icons={
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5h5v5"/></svg>',
    leads:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    pipeline:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="5" height="16" rx="2"/><rect x="9.5" y="4" width="5" height="16" rx="2"/><rect x="16" y="4" width="5" height="16" rx="2"/></svg>',
    follow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M3 12A9 9 0 0 1 18.5 5.8"/><path d="M18 2v4h4"/><path d="M6 22v-4H2"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 9h18"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/></svg>',
    phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.25a2 2 0 0 1 2.1-.45c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z"/></svg>',
    brain:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 3a3 3 0 0 0-3 3v1.1A3.5 3.5 0 0 0 7.5 17H9"/><path d="M15 3a3 3 0 0 1 3 3v1.1a3.5 3.5 0 0 1-1.5 9.9H15"/><path d="M9 3v18M15 3v18"/></svg>',
    chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="9" rx="1"/><rect x="17" y="5" width="3" height="12" rx="1"/></svg>',
    zap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z"/></svg>',
    settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.05.05a2.1 2.1 0 1 1-3 3l-.05-.05a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1.1 1.65V21a2.1 2.1 0 1 1-4.2 0v-.08A1.8 1.8 0 0 0 8.35 19.3a1.8 1.8 0 0 0-2 .36l-.05.05a2.1 2.1 0 1 1-3-3l.05-.05a1.8 1.8 0 0 0 .36-2A1.8 1.8 0 0 0 2.1 13.6H2a2.1 2.1 0 1 1 0-4.2h.08A1.8 1.8 0 0 0 3.7 8.35a1.8 1.8 0 0 0-.36-2l-.05-.05a2.1 2.1 0 1 1 3-3l.05.05a1.8 1.8 0 0 0 2 .36 1.8 1.8 0 0 0 1.1-1.65V2a2.1 2.1 0 1 1 4.2 0v.08a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 2-.36l.05-.05a2.1 2.1 0 1 1 3 3l-.05.05a1.8 1.8 0 0 0-.36 2 1.8 1.8 0 0 0 1.65 1.1H22a2.1 2.1 0 1 1 0 4.2h-.08A1.8 1.8 0 0 0 19.4 15Z"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>',
    list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    kanban:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h6v16H4zM14 4h6v10h-6z"/></svg>',
    upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3"/></svg>',
    dot:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/></svg>'
  };

  const AREAS=[
    {key:'painel',label:'Painel',view:'inicio',icon:'home',match:['inicio'],subs:[['Visão de hoje','inicio','home'],['Rotina comercial','cadencias','follow'],['Metas do dia','dashboard','chart']]},
    {key:'leads',label:'Leads',view:'leads',icon:'leads',match:['leads','clientes','novo-lead'],subs:[['Gestão de Leads','leads','leads'],['Clientes','clientes','leads'],['Novo lead','novo-lead','plus']]},
    {key:'garimpo',label:'Garimpo',view:'garimpo',icon:'search',match:['garimpo'],subs:[['Buscar leads','garimpo','search'],['Validar oportunidades','garimpo','list'],['Enviar para CRM','garimpo','plus']]},
    {key:'pipeline',label:'Pipeline',view:'pipeline',icon:'pipeline',match:['pipeline'],subs:[['Kanban','pipeline','kanban','kanban'],['Funil','pipeline','pipeline','funil'],['Gantt','pipeline','chart','gantt'],['Configurar etapas','pipeline','settings','etapas']]},
    {key:'followups',label:'Follow-ups',view:'cadencias',icon:'follow',match:['cadencias'],subs:[['Kanban','cadencias','kanban','kanban'],['Lista','cadencias','list','lista'],['Modo execução','cadencias','zap','execucao'],['Etapas','cadencias','pipeline','etapas']]},
    {key:'agenda',label:'Agenda',view:'agenda',icon:'calendar',match:['agenda'],subs:[['Dia','agenda','calendar','day'],['Semana','agenda','calendar','week'],['Mês','agenda','calendar','month'],['Ano','agenda','calendar','year'],['Lista','agenda','list','list'],['Configurações da agenda','agenda','settings','settings']]},
    {key:'atendimento',label:'Atendimento',view:'ligacoes',icon:'phone',match:['ligacoes','chat'],subs:[['Ligações','ligacoes','phone'],['Chat','chat','list'],['Histórico','leads','list','historico']]},
    {key:'inteligencia',label:'Inteligência',view:'playbooks',icon:'brain',match:['playbooks','objecoes'],subs:[['Playbooks','playbooks','brain','playbooks'],['Scripts','playbooks','list','scripts'],['Objeções','objecoes','list'],['IA local','playbooks','zap','ia']]},
    {key:'gestao',label:'Gestão',view:'dashboard',icon:'chart',match:['dashboard','metricas','perdas'],subs:[['Resumo','dashboard','chart'],['Métricas','metricas','chart'],['Perdas','perdas','list'],['Metas','dashboard','dot','metas']]},
    {key:'automacoes',label:'Automações',view:'automacoes',icon:'zap',match:['automacoes'],subs:[['Modelos prontos','automacoes','zap','modelos'],['Criador visual','automacoes','settings','criador'],['Regras salvas','automacoes','list','regras'],['Histórico','automacoes','list','historico']]},
    {key:'configuracoes',label:'Configurações',view:'importar',icon:'settings',match:['importar'],subs:[['Importar / Exportar','importar','upload'],['Aparência e cores','importar','settings','aparencia'],['Backup e dados','importar','upload','backup']]}
  ];

  const legacySetView=window.setView;
  let routing=false;
  let navTimer=null;

  function validView(view){ return document.getElementById(view) ? view : (view==='ligacoes' ? 'ligacoes' : 'inicio'); }
  function ensureSection(view){
    if(view==='ligacoes' && !$('#ligacoes')){
      const main=$('main')||$('.main');
      if(main){ const sec=document.createElement('section'); sec.id='ligacoes'; sec.className='view grid-view'; main.appendChild(sec); }
    }
    if(view==='garimpo' && !$('#garimpo')){
      const main=$('main')||$('.main');
      if(main){ const sec=document.createElement('section'); sec.id='garimpo'; sec.className='view grid-view v62-garimpo-page'; main.appendChild(sec); }
    }
  }
  function preferredDisplay(sec){
    if(!sec) return 'block';
    if(sec.classList.contains('grid-view') || ['inicio','leads','pipeline','clientes','cadencias','automacoes','agenda','metricas','playbooks','objecoes','perdas','dashboard','chat','importar','novo-lead','ligacoes','garimpo'].includes(sec.id)) return 'grid';
    return 'block';
  }
  function hardShow(view){
    ensureSection(view);
    const id=validView(view);
    $$('.view').forEach(sec=>{
      const on=sec.id===id;
      sec.classList.toggle('active',on);
      sec.setAttribute('aria-hidden',on?'false':'true');
      sec.style.display=on?preferredDisplay(sec):'none';
      if(!on) sec.classList.remove('v63-call-page','v63-auto-page');
    });
    try{localStorage.setItem(LS_VIEW,id)}catch(e){}
    updateTopbar(id);
    updateNav(id);
    return id;
  }
  function safeGarimpoRender(){
    if(typeof window.crmV62GoView!=='function') return;
    const currentSet=window.setView;
    try{
      window.setView=function(){};
      window.crmV62GoView('garimpo');
    }catch(e){}
    finally{ window.setView=currentSet; }
  }
  function route(view,action){
    view=view||'inicio';
    ensureSection(view);
    if(routing){ const id=hardShow(view); runAction(id,action); return id; }
    routing=true;
    let id=view;
    try{
      if(view==='garimpo') safeGarimpoRender();
      else if(typeof legacySetView==='function') legacySetView(view);
    }catch(e){ console.warn('[CRM v64] legado ignorado em navegação',e); }
    id=hardShow(view);
    runAction(id,action);
    [60,180,420].forEach(ms=>setTimeout(()=>{ hardShow(id); if(id==='agenda') enhanceAgenda(); },ms));
    if(id==='agenda') setTimeout(enhanceAgenda,90);
    routing=false;
    return id;
  }
  function areaFor(view){ return AREAS.find(a=>(a.match||[]).includes(view)) || AREAS.find(a=>a.view===view) || AREAS[0]; }
  function updateTopbar(view){
    const titles={inicio:['Painel','Resumo do dia e próximos passos'],leads:['Leads','Gestão de leads cadastrados'],garimpo:['Garimpo de Leads','Buscar, validar e enviar oportunidades para o CRM'],pipeline:['Pipeline','Funil e oportunidades'],clientes:['Clientes','Relacionamentos cadastrados'],cadencias:['Follow-ups','Rotina de acompanhamento comercial'],agenda:['Agenda','Compromissos com agendas, cores e visualizações'],ligacoes:['Ligações','Fila de chamadas e histórico por lead'],chat:['Chat','Conversas e WhatsApp'],playbooks:['Playbooks','Scripts, objeções e IA local'],objecoes:['Objeções','Respostas e argumentos'],perdas:['Perdas','Motivos e análise de perdas'],dashboard:['Dashboard','Indicadores comerciais'],metricas:['Métricas','Análises e evolução'],automacoes:['Automações','Regras, modelos e histórico'],importar:['Configurações','Importar, exportar, tema e backup'],['novo-lead']:['Novo lead','Cadastro rápido']};
    const [t,s]=titles[view]||[view,''];
    const topTitle=$('.topbar-title'), topSub=$('.topbar-sub');
    if(topTitle) topTitle.textContent=t;
    if(topSub) topSub.textContent=s;
  }
  function updateNav(view){
    const area=areaFor(view);
    $$('.v64-nav-group').forEach(g=>g.classList.toggle('v64-active',g.dataset.area===area.key));
    $$('[data-v64-view]').forEach(b=>{
      const v=b.dataset.v64View;
      const a=b.dataset.v64Action||'';
      b.classList.toggle('active',v===view && (!a || a===($('.v61-seg button.active')?.dataset.v61CalView||'')));
    });
    // Mantém qualquer botão antigo visualmente sincronizado, mas sem permitir sobreposição.
    $$('[data-view],[data-v60-view],[data-v62-view],[data-v63-view]').forEach(btn=>{
      const v=btn.dataset.view||btn.dataset.v60View||btn.dataset.v62View||btn.dataset.v63View;
      btn.classList.toggle('active',v===view);
    });
  }
  function icon(name){ return icons[name]||icons.dot; }
  function subMarkup(sub){
    const [label,view,ic,action]=sub;
    return `<button type="button" class="v64-subitem" data-v64-view="${esc(view)}" data-v64-action="${esc(action||'')}" aria-label="${esc(label)}"><span class="v64-sub-icon">${icon(ic)}</span><span>${esc(label)}</span></button>`;
  }
  function areaMarkup(a){
    return `<div class="v64-nav-group" data-area="${esc(a.key)}"><button type="button" class="nav-item v64-nav-item" data-v64-view="${esc(a.view)}" aria-label="${esc(a.label)}" title="${esc(a.label)}"><span class="v64-icon">${icon(a.icon)}</span><span class="v64-label">${esc(a.label)}</span></button><div class="v64-flyout" role="menu" aria-label="Sub-abas de ${esc(a.label)}"><div class="v64-flyout-title"><span class="v64-sub-icon">${icon(a.icon)}</span><span>${esc(a.label)}</span></div><div class="v64-flyout-list">${a.subs.map(subMarkup).join('')}</div></div></div>`;
  }
  function rebuildSidebar(){
    const sidebar=$('.sidebar'), nav=$('.sidebar-nav');
    if(!sidebar||!nav) return;
    document.body.classList.add('crm-v64-router-ready','crm-ready');
    document.body.classList.remove('crm-sidebar-icons','crm-sidebar-fixed','crm-sidebar-pinned','crm-sidebar-collapsed','crm-v58-sidebar-auto');
    sidebar.classList.add('v64-sidebar');
    nav.className='sidebar-nav v64-sidebar-nav';
    nav.innerHTML=AREAS.map(areaMarkup).join('')+'<div class="v64-nav-note">V64 ativo: cada clique abre só uma página, sem aba antiga por cima.</div>';
    updateNav($('.view.active')?.id || load(LS_VIEW,'inicio'));
  }
  function cleanupLayers(){
    $$('.v63-garimpo-main-tab,.v62-garimpo-subitem,#v63AgendaManager').forEach(el=>el.remove());
    $$('.rail,.topbar-tabs').forEach(el=>{el.classList.add('v57-disabled-layer'); el.setAttribute('aria-hidden','true');});
  }
  function scheduleRebuild(){ clearTimeout(navTimer); navTimer=setTimeout(()=>{cleanupLayers(); const nav=$('.sidebar-nav'); if(nav && !nav.classList.contains('v64-sidebar-nav')) rebuildSidebar(); updateNav($('.view.active')?.id||load(LS_VIEW,'inicio'));},60); }

  document.addEventListener('click',function(e){
    const btn=e.target.closest('[data-v64-view]');
    if(!btn) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const view=btn.dataset.v64View, action=btn.dataset.v64Action||'';
    route(view,action);
  },true);

  document.addEventListener('click',function(e){
    const old=e.target.closest('.sidebar [data-view],.sidebar [data-v60-view],.sidebar [data-v62-view],.sidebar [data-v63-view]');
    if(!old || old.closest('[data-v64-view]')) return;
    const view=old.dataset.view||old.dataset.v60View||old.dataset.v62View||old.dataset.v63View;
    const action=old.dataset.v60Action||old.dataset.v63Action||'';
    if(view){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); route(view,action); }
  },true);

  function runAction(view,action){
    if(!action) return;
    const a=norm(action);
    setTimeout(()=>{
      try{
        if(view==='agenda'){
          if(a==='settings'){ openAgendaSettings(); return; }
          const map={day:'Dia',week:'Semana',month:'Mês',year:'Ano',list:'Lista'};
          const label=map[action]||action;
          const btn=$$('[data-v61-cal-view],.v61-seg button').find(x=>norm(x.textContent)===norm(label)||x.dataset.v61CalView===action);
          btn?.click();
        }
        if(view==='automacoes'){
          const label={modelos:'Modelos prontos',criador:'Criador visual',regras:'Regras salvas',historico:'Histórico'}[a]||a;
          $$('[data-v63-auto-tab],#automacoes button').find(x=>norm(x.textContent).includes(norm(label)))?.click();
        }
        if(view==='pipeline'){
          const label={kanban:'kanban',funil:'funil',gantt:'gantt',etapas:'etapas'}[a]||a;
          $$('#pipeline button,[data-pipeline-view],[data-pipe-view]').find(x=>norm(x.textContent).includes(norm(label)))?.click();
        }
        if(view==='cadencias'){
          const label={kanban:'kanban',lista:'lista',execucao:'execução',etapas:'etapas'}[a]||a;
          $$('#cadencias button,[data-follow-view],[data-fu-view]').find(x=>norm(x.textContent).includes(norm(label)))?.click();
        }
        if(view==='playbooks'){
          const label={scripts:'scripts',ia:'ia',playbooks:'playbooks'}[a]||a;
          $$('#playbooks button,[data-intel-tab],[data-pb-tab]').find(x=>norm(x.textContent).includes(norm(label)))?.click();
        }
        if(view==='novo-lead'){
          $('#openNewLeadBtn,#openNewLeadBtn2')?.click();
        }
      }catch(err){ console.warn('[CRM v64] ação ignorada',action,err); }
    },160);
  }

  function agendaDefs(){
    const arr=load(LS_AGENDAS,null);
    if(Array.isArray(arr)&&arr.length) return arr.map((a,i)=>({id:a.id||('agenda_'+i),name:a.name||a.nome||'Agenda',color:a.color||a.cor||'#1D9E75',active:a.active!==false,default:a.default===true}));
    return DEFAULT_AGENDAS.slice();
  }
  function persistAgendas(list){
    const cleaned=list.filter(a=>String(a.name||'').trim()).map((a,i)=>({id:a.id||('agenda_'+Date.now()+'_'+i),name:String(a.name||'Agenda').trim(),color:a.color||'#1D9E75',active:a.active!==false,default:a.default===true}));
    if(!cleaned.some(a=>a.default) && cleaned[0]) cleaned[0].default=true;
    save(LS_AGENDAS,cleaned);
    const ui=load(LS_UI,{});
    ui.visibleAgendas=cleaned.filter(a=>a.active!==false).map(a=>a.name);
    save(LS_UI,ui);
  }
  function agendaCounts(){
    const ev=load('outbounder_agenda_v1',[]);
    const counts={};
    if(Array.isArray(ev)) ev.forEach(e=>{ const name=e.agenda||'Comercial'; counts[name]=(counts[name]||0)+1; });
    return counts;
  }
  function enhanceAgenda(){
    cleanupLayers();
    const root=$('#crmAgendaV61Root'); if(!root) return;
    const actions=$('.v61-cal-actions',root);
    if(actions && !$('#v64AgendaSettingsBtn',root)){
      const btn=document.createElement('button');
      btn.type='button'; btn.id='v64AgendaSettingsBtn'; btn.className='v61-btn v64-agenda-settings-btn';
      btn.dataset.v64AgendaSettings='true';
      btn.innerHTML=`${icons.settings}<span>Configurações da agenda</span>`;
      const newBtn=actions.querySelector('[data-v61-new]');
      actions.insertBefore(btn,newBtn||null);
    }
    ensureAgendaSettingsShell();
  }
  function ensureAgendaSettingsShell(){
    if($('#v64AgendaBackdrop') && $('#v64AgendaDrawer')) return;
    const back=document.createElement('div'); back.id='v64AgendaBackdrop'; back.className='v64-agenda-backdrop'; back.dataset.v64AgendaClose='true';
    const drawer=document.createElement('aside'); drawer.id='v64AgendaDrawer'; drawer.className='v64-agenda-drawer'; drawer.setAttribute('aria-live','polite');
    document.body.appendChild(back); document.body.appendChild(drawer);
  }
  function renderAgendaSettings(){
    ensureAgendaSettingsShell();
    const drawer=$('#v64AgendaDrawer'); if(!drawer) return;
    const arr=agendaDefs(); const counts=agendaCounts();
    const defaultName=(arr.find(a=>a.default)||arr[0]||{}).name||'Comercial';
    drawer.innerHTML=`<div class="v64-agenda-head"><div><div class="v64-agenda-kicker">Personalização</div><div class="v64-agenda-title">Configurações da agenda</div><div class="v64-agenda-sub">Crie agendas, escolha cores, oculte agendas que não usa e defina a agenda padrão para novos compromissos.</div></div><button type="button" class="v64-agenda-close" data-v64-agenda-close aria-label="Fechar">×</button></div><div class="v64-agenda-body"><div class="v64-agenda-tip"><strong>Como usar:</strong> cada compromisso pode ter uma agenda e uma cor própria. A cor da agenda funciona como padrão visual, mas você ainda pode mudar a cor individual ao criar ou editar o compromisso.</div><div class="v64-agenda-section"><div class="v64-agenda-section-head"><div><b>Minhas agendas</b><br><span>Ative, renomeie e edite as cores.</span></div><span>${arr.length} agenda(s)</span></div><div class="v64-agenda-rows" id="v64AgendaRows">${arr.map(a=>`<div class="v64-agenda-row" data-v64-agenda-id="${esc(a.id)}"><input type="checkbox" data-v64-agenda-active ${a.active!==false?'checked':''} title="Mostrar agenda"><input type="text" data-v64-agenda-name value="${esc(a.name)}" aria-label="Nome da agenda"><input type="color" data-v64-agenda-color value="${esc(a.color||'#1D9E75')}" aria-label="Cor da agenda"><button type="button" class="v64-danger" data-v64-agenda-delete title="Excluir">×</button><small style="grid-column:2/-1;color:var(--text-3);font-size:11px">${counts[a.name]||0} compromisso(s) nesta agenda</small></div>`).join('')}</div><div class="v64-agenda-add"><input type="text" id="v64NewAgendaName" placeholder="Nova agenda. Ex: Prospecção"><input type="color" id="v64NewAgendaColor" value="#1D9E75"><button type="button" class="primary" id="v64AddAgenda">Adicionar agenda</button></div></div><div class="v64-agenda-section"><div class="v64-agenda-section-head"><div><b>Padrão de criação</b><br><span>Escolha qual agenda aparece primeiro ao criar compromisso.</span></div></div><div class="v64-agenda-default"><select id="v64DefaultAgenda">${arr.map(a=>`<option ${a.name===defaultName?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div></div></div><div class="v64-agenda-footer"><button type="button" data-v64-agenda-close>Cancelar</button><button type="button" class="primary" id="v64SaveAgendaSettings">Salvar configurações</button></div>`;
  }
  function openAgendaSettings(){
    renderAgendaSettings();
    $('#v64AgendaBackdrop')?.classList.add('open');
    $('#v64AgendaDrawer')?.classList.add('open');
  }
  function closeAgendaSettings(){
    $('#v64AgendaBackdrop')?.classList.remove('open');
    $('#v64AgendaDrawer')?.classList.remove('open');
  }
  function collectAgendaSettings(){
    const rows=$$('[data-v64-agenda-id]',$('#v64AgendaDrawer')||document);
    const defaultName=$('#v64DefaultAgenda')?.value||'';
    return rows.map(row=>({
      id:row.dataset.v64AgendaId,
      name:row.querySelector('[data-v64-agenda-name]')?.value?.trim()||'Agenda',
      color:row.querySelector('[data-v64-agenda-color]')?.value||'#1D9E75',
      active:!!row.querySelector('[data-v64-agenda-active]')?.checked,
      default:(row.querySelector('[data-v64-agenda-name]')?.value?.trim()||'Agenda')===defaultName
    }));
  }
  document.addEventListener('click',function(e){
    if(e.target.closest('[data-v64-agenda-settings]')){ e.preventDefault(); e.stopPropagation(); openAgendaSettings(); return; }
    if(e.target.closest('[data-v64-agenda-close]')){ e.preventDefault(); closeAgendaSettings(); return; }
    if(e.target.closest('#v64AddAgenda')){
      const name=$('#v64NewAgendaName')?.value?.trim();
      if(!name){ toast('Digite o nome da nova agenda.','warn'); return; }
      const arr=collectAgendaSettings();
      arr.push({id:'agenda_'+Date.now(),name,color:$('#v64NewAgendaColor')?.value||'#1D9E75',active:true,default:arr.length===0});
      persistAgendas(arr); renderAgendaSettings(); toast('Agenda criada.','success'); return;
    }
    const del=e.target.closest('[data-v64-agenda-delete]');
    if(del){
      const id=del.closest('[data-v64-agenda-id]')?.dataset.v64AgendaId;
      const arr=collectAgendaSettings().filter(a=>a.id!==id);
      if(!arr.length){ toast('Deixe pelo menos uma agenda ativa.','warn'); return; }
      persistAgendas(arr); renderAgendaSettings(); toast('Agenda removida.','warn'); return;
    }
    if(e.target.closest('#v64SaveAgendaSettings')){
      const arr=collectAgendaSettings();
      if(!arr.some(a=>a.active)){ toast('Deixe pelo menos uma agenda marcada como visível.','warn'); return; }
      persistAgendas(arr); closeAgendaSettings(); toast('Configurações da agenda salvas.','success'); route('agenda'); return;
    }
  },true);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeAgendaSettings(); },true);

  function boot(){
    cleanupLayers();
    rebuildSidebar();
    const stored=load(LS_VIEW,'inicio');
    const active=$('.view.active')?.id || stored || 'inicio';
    route(active);
    [120,360,820,1500,2400,3400].forEach(ms=>setTimeout(()=>{cleanupLayers(); rebuildSidebar(); hardShow($('.view.active')?.id||stored||'inicio'); if($('#agenda.active')) enhanceAgenda();},ms));
    try{ new MutationObserver(scheduleRebuild).observe(document.body,{childList:true,subtree:true}); }catch(e){}
  }
  window.setView=function(view,action){ return route(view,action); };
  window.showView=window.setView;
  window.crmGoView=window.setView;
  window.crmV64GoView=window.setView;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.addEventListener('pageshow',()=>setTimeout(boot,0));
})();
