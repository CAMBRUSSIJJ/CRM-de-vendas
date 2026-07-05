/* CRM v49 — unificação de layout, ferramentas globais e compactação */
(function(){
  'use strict';
  if(window.__crmV49LayoutUnificado) return;
  window.__crmV49LayoutUnificado = true;

  const DOC = document;
  const STORE_DENSITY = 'crm_v49_density';
  const $ = (s,r=DOC)=>r.querySelector(s);
  const $$ = (s,r=DOC)=>Array.from(r.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const todayISO = ()=>new Date().toISOString().slice(0,10);
  const addDays = n => { const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
  const brl = v => { try{return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);}catch(e){return 'R$ '+(Number(v)||0).toFixed(2);} };
  const fmt = d => { if(!d) return 'Sem data'; try{return new Date(d+'T12:00:00').toLocaleDateString('pt-BR');}catch(e){return d;} };
  const isOverdue = d => { if(!d) return false; const a=new Date(d+'T12:00:00'); a.setHours(0,0,0,0); const b=new Date(); b.setHours(0,0,0,0); return a < b; };
  const daysSince = d => { if(!d) return 0; try{return Math.floor((Date.now()-new Date(d+'T12:00:00').getTime())/864e5);}catch(e){return 0;} };
  const toast = (m,t='success')=>{ try{ if(typeof window.showToast==='function') window.showToast(m,t); else if(typeof showToast==='function') showToast(m,t); }catch(e){ console.log(m); } };

  function getLeads(){
    try{ if(Array.isArray(window.leads)) return window.leads; }catch(e){}
    try{ if(typeof leads !== 'undefined' && Array.isArray(leads)) return leads; }catch(e){}
    try{ return JSON.parse(localStorage.getItem('outbounder_leads_v5')||'[]'); }catch(e){ return []; }
  }
  function saveLeadsSafe(){
    try{ if(typeof window.saveLeads==='function') return window.saveLeads(); }catch(e){}
    try{ if(typeof saveLeads==='function') return saveLeads(); }catch(e){}
    try{ localStorage.setItem('outbounder_leads_v5', JSON.stringify(getLeads())); }catch(e){}
  }
  function renderSafe(){
    ['renderAll','renderLeadsTable','renderBoard','renderHome','renderMetrics','renderDashboard','renderFollowups','renderFuAll'].forEach(fn=>{
      try{ const f=window[fn] || globalThis[fn]; if(typeof f==='function') f(); }catch(e){}
    });
  }
  function openLead(ref){
    try{ if(typeof window.openDetail==='function') return window.openDetail(ref); }catch(e){}
    try{ if(typeof openDetail==='function') return openDetail(ref); }catch(e){}
    toast('Detalhe do lead não disponível agora.','warn');
  }
  function openCreateLead(){
    try{ if(typeof window.openModal==='function') return window.openModal(null); }catch(e){}
    try{ if(typeof openModal==='function') return openModal(null); }catch(e){}
    navigate('novo-lead');
  }
  function navigate(view){
    if(!view) return;
    if(view === 'novo-lead') return openCreateLead();
    try{ if(typeof window.setView==='function') return window.setView(view); }catch(e){}
    const el = $('[data-view="'+view+'"]'); if(el) el.click();
  }

  const GROUPS = [
    {kind:'section', label:'Operação'},
    {id:'inicio', label:'Painel', icon:'ic-home'},
    {id:'leads', label:'Leads', icon:'ic-users', group:['leads','clientes','novo-lead'], sub:[['clientes','Clientes'],['novo-lead','Novo lead']]},
    {id:'pipeline', label:'Pipeline', icon:'ic-columns', group:['pipeline','funil'], sub:[['funil','Funil real']]},
    {id:'cadencias', label:'Follow-ups', icon:'ic-trending-up'},
    {id:'agenda', label:'Agenda', icon:'ic-calendar'},
    {kind:'section', label:'Centrais'},
    {id:'chat', label:'Atendimento', icon:'ic-message-square', group:['chat','ligacoes'], sub:[['chat','Conversas'],['ligacoes','Ligações']]},
    {id:'playbooks', label:'Inteligência', icon:'ic-book', group:['playbooks','objecoes'], sub:[['playbooks','Playbooks'],['objecoes','Objeções']]},
    {id:'dashboard', label:'Gestão', icon:'ic-bar-chart', group:['dashboard','metricas','metas','perdas','funil'], sub:[['dashboard','Resumo'],['metricas','Métricas'],['metas','Metas'],['perdas','Perdas']]},
    {id:'automacoes', label:'Automações', icon:'ic-zap'},
    {id:'importar', label:'Configurações', icon:'ic-upload', group:['importar'], sub:[['importar','Importar/Exportar'],['density','Densidade']]}
  ];
  const TOP_TABS = [
    ['inicio','Painel'],['leads','Leads'],['pipeline','Pipeline'],['cadencias','Follow-ups'],['agenda','Agenda'],['chat','Atendimento'],['playbooks','Inteligência'],['dashboard','Gestão'],['automacoes','Automações'],['importar','Configurações']
  ];
  const VIEW_META = {
    inicio:['Painel','Rotina do dia, tarefas críticas e oportunidades quentes'],
    leads:['Leads','Base comercial, cadastro, filtros e visão compacta'],
    clientes:['Clientes','Contas fechadas e relacionamentos ativos'],
    pipeline:['Pipeline','Andamento visual, funil, gargalos e forecast'],
    funil:['Funil real','Conversão, perdas e comparação comercial'],
    cadencias:['Follow-ups','Central de execução da rotina de contato'],
    agenda:['Agenda','Compromissos, reuniões e próximos passos'],
    chat:['Atendimento','Conversas, WhatsApp, ligações e histórico de contato'],
    ligacoes:['Atendimento','Fila de ligações, scripts e registro de resultado'],
    playbooks:['Inteligência comercial','Scripts, playbooks, templates e materiais de venda'],
    objecoes:['Inteligência comercial','Objeções, respostas rápidas e argumentos de valor'],
    dashboard:['Gestão comercial','Resumo executivo, metas, métricas e perdas'],
    metricas:['Gestão comercial','Análise detalhada de conversão e produtividade'],
    metas:['Gestão comercial','Objetivos, ritmo e progresso da operação'],
    perdas:['Gestão comercial','Motivos de perda, aprendizados e reativação'],
    automacoes:['Automações','Templates e regras simples para acelerar o processo'],
    importar:['Configurações','Backup, importação, exportação e preferências do sistema']
  };

  function icon(id){ return '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><use href="#'+id+'"></use></svg>'; }

  function installDensity(){
    let d = localStorage.getItem(STORE_DENSITY) || 'compact';
    if(!['comfortable','compact','super-compact'].includes(d)) d='compact';
    DOC.documentElement.dataset.density = d;
  }
  function setDensity(d){
    if(!['comfortable','compact','super-compact'].includes(d)) return;
    DOC.documentElement.dataset.density = d;
    localStorage.setItem(STORE_DENSITY,d);
    updateDensityMenu();
    toast('Densidade alterada para '+({comfortable:'confortável',compact:'compacta','super-compact':'super compacta'}[d]),'success');
  }

  function buildSidebar(){
    const nav = $('.sidebar-nav');
    if(!nav || nav.dataset.v49Built) return;
    nav.dataset.v49Built='1';
    nav.innerHTML = GROUPS.map(item=>{
      if(item.kind==='section') return '<div class="crm-v49-nav-heading">'+esc(item.label)+'</div>';
      const sub = item.sub ? '<div class="crm-v49-nav-sub">'+item.sub.map(([id,label])=> id==='density'
        ? '<button type="button" data-ux-action="density">'+esc(label)+'</button>'
        : '<button type="button" data-view="'+esc(id)+'">'+esc(label)+'</button>').join('')+'</div>' : '';
      const cls = 'nav-item crm-v49-nav-main'+(item.group?' crm-v49-is-group':'');
      const group = item.group ? ' data-ux-group="'+esc(item.group.join(','))+'"' : '';
      const badge = item.id==='leads' ? '<span class="nav-badge" id="navLeadsBadgeV49">'+getLeads().length+'</span>' : '';
      return '<div class="crm-v49-nav-section"><button type="button" class="'+cls+'" data-view="'+esc(item.id)+'" data-label="'+esc(item.label)+'" aria-label="'+esc(item.label)+'" title="'+esc(item.label)+'"'+group+'>'+icon(item.icon)+'<span>'+esc(item.label)+'</span>'+badge+'</button>'+sub+'</div>';
    }).join('');
  }

  function buildRail(){
    const rail = $('.rail');
    if(!rail || rail.dataset.v49Built) return;
    rail.dataset.v49Built='1';
    rail.innerHTML = '<div aria-label="Painel" class="rail-logo" data-view="inicio" title="Painel">'+icon('ic-zap')+'</div><div class="rail-sep"></div>'+
      TOP_TABS.map(([id,label])=>'<button type="button" class="rail-btn" data-view="'+esc(id)+'" aria-label="'+esc(label)+'" title="'+esc(label)+'">'+icon({inicio:'ic-home',leads:'ic-users',pipeline:'ic-columns',cadencias:'ic-trending-up',agenda:'ic-calendar',chat:'ic-message-square',playbooks:'ic-book',dashboard:'ic-bar-chart',automacoes:'ic-zap',importar:'ic-upload'}[id]||'ic-grid')+'<span class="crm-ux-sr-only">'+esc(label)+'</span></button>').join('');
  }

  function buildTopTabs(){
    const tabs = $('.topbar-tabs');
    if(!tabs || tabs.dataset.v49Built) return;
    tabs.dataset.v49Built='1';
    tabs.innerHTML = TOP_TABS.map(([id,label])=>'<button type="button" class="tab" data-view="'+esc(id)+'" data-label="'+esc(label)+'" aria-label="'+esc(label)+'" title="'+esc(label)+'">'+esc(label)+'</button>').join('');
  }

  function installTopbarTools(){
    const actions = $('.topbar-actions');
    if(!actions || $('#crmV49Search')) return;
    const oldNewLead = $('#openNewLeadBtn');
    if(oldNewLead) oldNewLead.style.display='none';
    actions.insertAdjacentHTML('afterbegin',
      '<div class="crm-v49-search" id="crmV49Search">'+
        '<span class="crm-v49-search-icon">⌕</span><input id="crmV49SearchInput" type="search" placeholder="Buscar lead, telefone, tarefa, script ou tela..." autocomplete="off"/><span class="crm-v49-kbd">Ctrl K</span><div class="crm-v49-search-results" id="crmV49SearchResults"></div>'+
      '</div>'+
      '<div class="crm-v49-create-wrap"><button type="button" class="btn btn-primary btn-sm" id="crmV49CreateBtn">+ Criar</button><div class="crm-v49-create-menu" id="crmV49CreateMenu"></div></div>'+
      '<div class="crm-v49-density-wrap"><button type="button" class="btn btn-sm" id="crmV49DensityBtn" title="Densidade do layout">Layout</button><div class="crm-v49-density-menu" id="crmV49DensityMenu"></div></div>'
    );
    const createItems = [
      ['lead','Novo lead','Cadastrar oportunidade','leads'],
      ['followup','Novo follow-up','Próximo contato','cadencias'],
      ['call','Nova ligação','Abrir fila de atendimento','ligacoes'],
      ['event','Novo compromisso','Criar agenda/reunião','agenda'],
      ['automation','Nova automação','Regra quando → então','automacoes'],
      ['playbook','Novo playbook','Script ou checklist','playbooks'],
      ['objection','Nova objeção','Resposta comercial','objecoes'],
      ['loss','Registrar perda','Motivo e aprendizado','perdas']
    ];
    $('#crmV49CreateMenu').innerHTML = createItems.map(([act,label,hint])=>'<button type="button" class="crm-v49-menu-btn" data-ux-create="'+act+'"><span class="crm-v49-menu-ico">+</span><span>'+esc(label)+'<small>'+esc(hint)+'</small></span></button>').join('');
    updateDensityMenu();
  }

  function updateDensityMenu(){
    const menu = $('#crmV49DensityMenu'); if(!menu) return;
    const cur = DOC.documentElement.dataset.density || 'compact';
    const items = [
      ['comfortable','Confortável','Mais espaçamento e leitura calma'],
      ['compact','Compacto','Equilíbrio para rotina comercial'],
      ['super-compact','Super compacto','Máximo de informação na tela']
    ];
    menu.innerHTML = items.map(([id,label,hint])=>'<button type="button" class="crm-v49-menu-btn '+(cur===id?'active':'')+'" data-ux-density="'+id+'"><span class="crm-v49-menu-ico">◱</span><span>'+esc(label)+'<small>'+esc(hint)+'</small></span></button>').join('');
  }

  function currentView(){ return $('.view.active')?.id || 'inicio'; }
  function groupFor(view){
    return GROUPS.find(g=>g.group && g.group.includes(view))?.id || view;
  }
  function updateActiveUI(view){
    const active = view || currentView();
    const main = groupFor(active);
    $$('[data-view]').forEach(el=>{
      const v = el.dataset.view;
      const g = el.dataset.uxGroup ? el.dataset.uxGroup.split(',') : [];
      const on = v===active || v===main || g.includes(active);
      if(el.classList.contains('nav-item') || el.classList.contains('tab') || el.classList.contains('rail-btn') || el.classList.contains('rail-logo')) el.classList.toggle('active', on);
    });
    $$('.crm-v49-nav-sub button[data-view]').forEach(b=>b.classList.toggle('active', b.dataset.view===active));
    $$('.crm-v49-area-tabs button[data-view]').forEach(b=>b.classList.toggle('active', b.dataset.view===active));
    const m = VIEW_META[active] || VIEW_META[main];
    if(m){ $('#topbarTitle') && ($('#topbarTitle').textContent = m[0]); $('#topbarSub') && ($('#topbarSub').textContent = m[1]); }
    const badge = $('#navLeadsBadgeV49'); if(badge) badge.textContent = String(getLeads().length);
  }

  function wrapSetView(){
    if(window.__crmV49SetViewWrapped) return;
    window.__crmV49SetViewWrapped = true;
    const prev = window.setView || (typeof setView === 'function' ? setView : null);
    const next = function(view){
      if(view === 'density') return toggleDensityMenu();
      if(view === 'novo-lead') return openCreateLead();
      if(prev) prev(view); else { const target = $('#'+view); if(target){ $$('.view').forEach(v=>v.classList.remove('active')); target.classList.add('active'); } }
      setTimeout(()=>{ updateActiveUI(view); injectAreaNavs(); enhanceCurrentView(view); }, 30);
    };
    window.setView = next;
    try{ setView = next; }catch(e){}
  }

  function toggleCreateMenu(force){
    const menu=$('#crmV49CreateMenu'); if(!menu) return;
    menu.classList.toggle('show', force===undefined ? !menu.classList.contains('show') : !!force);
    $('#crmV49DensityMenu')?.classList.remove('show');
  }
  function toggleDensityMenu(force){
    const menu=$('#crmV49DensityMenu'); if(!menu) return;
    menu.classList.toggle('show', force===undefined ? !menu.classList.contains('show') : !!force);
    $('#crmV49CreateMenu')?.classList.remove('show');
  }

  function installEvents(){
    DOC.addEventListener('click', function(e){
      const action = e.target.closest('[data-ux-action]');
      if(action){
        e.preventDefault(); e.stopPropagation();
        if(action.dataset.uxAction === 'density') toggleDensityMenu(true);
        return;
      }
      const create = e.target.closest('#crmV49CreateBtn');
      if(create){ e.preventDefault(); e.stopPropagation(); toggleCreateMenu(); return; }
      const density = e.target.closest('#crmV49DensityBtn');
      if(density){ e.preventDefault(); e.stopPropagation(); toggleDensityMenu(); return; }
      const createItem = e.target.closest('[data-ux-create]');
      if(createItem){ e.preventDefault(); e.stopPropagation(); toggleCreateMenu(false); runCreate(createItem.dataset.uxCreate); return; }
      const dens = e.target.closest('[data-ux-density]');
      if(dens){ e.preventDefault(); e.stopPropagation(); toggleDensityMenu(false); setDensity(dens.dataset.uxDensity); return; }
      const res = e.target.closest('[data-ux-result]');
      if(res){ e.preventDefault(); e.stopPropagation(); selectSearchResult(res); return; }
      const viewChip = e.target.closest('[data-ux-saved-view]');
      if(viewChip){ e.preventDefault(); e.stopPropagation(); applySavedView(viewChip.dataset.uxSavedView); return; }
      const exec = e.target.closest('[data-ux-followup-exec]');
      if(exec){ e.preventDefault(); e.stopPropagation(); openFollowupExecution(); return; }
      const closeExec = e.target.closest('[data-ux-exec-close]');
      if(closeExec){ e.preventDefault(); e.stopPropagation(); closeFollowupExecution(); return; }
      const execAct = e.target.closest('[data-ux-exec-action]');
      if(execAct){ e.preventDefault(); e.stopPropagation(); handleExecAction(execAct.dataset.uxExecAction); return; }
      if(!e.target.closest('#crmV49CreateMenu,#crmV49CreateBtn,#crmV49DensityMenu,#crmV49DensityBtn,#crmV49Search')){ toggleCreateMenu(false); toggleDensityMenu(false); }
    }, true);

    DOC.addEventListener('input', function(e){ if(e.target && e.target.id==='crmV49SearchInput') renderSearch(e.target.value); }, true);
    DOC.addEventListener('keydown', function(e){
      if((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase()==='k'){
        e.preventDefault(); const input=$('#crmV49SearchInput'); if(input){input.focus(); input.select(); renderSearch(input.value || '');}
      }
      if(e.key==='Escape'){
        toggleCreateMenu(false); toggleDensityMenu(false); $('#crmV49SearchResults')?.classList.remove('show'); closeFollowupExecution();
      }
    });
  }

  function runCreate(act){
    if(act === 'lead') return openCreateLead();
    if(act === 'followup') { navigate('cadencias'); setTimeout(()=>$('#fuOpenQuickCreate')?.click(),120); return; }
    if(act === 'call') { navigate('ligacoes'); return; }
    if(act === 'event') { navigate('agenda'); setTimeout(()=>$('#agNewBtn')?.click(),120); return; }
    if(act === 'automation') { navigate('automacoes'); setTimeout(()=>$('#autoNewBtn')?.click(),120); return; }
    if(act === 'playbook') { navigate('playbooks'); setTimeout(()=>$('#pbNewBtn')?.click(),120); return; }
    if(act === 'objection') { navigate('objecoes'); setTimeout(()=>$('#objNewBtn')?.click(),120); return; }
    if(act === 'loss') { navigate('perdas'); setTimeout(()=>$('#perdaNewBtn')?.click(),120); return; }
  }

  function renderSearch(q){
    const box = $('#crmV49SearchResults'); if(!box) return;
    const query = String(q||'').trim().toLowerCase();
    if(!query){ box.innerHTML = '<div class="crm-v49-empty">Digite para buscar leads, telefones, tarefas, scripts ou telas do CRM.</div>'; box.classList.add('show'); return; }
    const views = Object.entries(VIEW_META).filter(([id,m])=> (m.join(' ')+' '+id).toLowerCase().includes(query)).slice(0,6);
    const leadsList = getLeads().filter(l=>[l.nome,l.segmento,l.responsavel,l.telefone,l.email,l.etapa,l.prioridade,l.obs,l.tags,l.proximaAcao].join(' ').toLowerCase().includes(query)).slice(0,8);
    let html = '';
    if(leadsList.length){
      html += '<div class="crm-v49-result-group">Leads e clientes</div>' + leadsList.map(l=>'<button type="button" class="crm-v49-result" data-ux-result="lead" data-ref="'+esc(l.id||l.nome)+'"><span class="ico">'+esc((l.nome||'?').charAt(0).toUpperCase())+'</span><span><b>'+esc(l.nome||'Sem nome')+'</b><span>'+esc([l.etapa,l.segmento,l.responsavel].filter(Boolean).join(' · ') || 'Lead')+'</span></span><small>'+esc(l.prioridade||'')+'</small></button>').join('');
    }
    if(views.length){
      html += '<div class="crm-v49-result-group">Telas e ferramentas</div>' + views.map(([id,m])=>'<button type="button" class="crm-v49-result" data-ux-result="view" data-ref="'+esc(id)+'"><span class="ico">↗</span><span><b>'+esc(m[0])+'</b><span>'+esc(m[1])+'</span></span><small>abrir</small></button>').join('');
    }
    if(!html) html = '<div class="crm-v49-empty">Nada encontrado. Tente buscar por nome, telefone, etapa ou ferramenta.</div>';
    box.innerHTML = html; box.classList.add('show');
  }
  function selectSearchResult(btn){
    const type=btn.dataset.uxResult, ref=btn.dataset.ref;
    $('#crmV49SearchResults')?.classList.remove('show');
    const input=$('#crmV49SearchInput'); if(input) input.value='';
    if(type==='lead') return openLead(ref);
    if(type==='view') return navigate(ref);
  }

  function injectAreaNavs(){
    const configs = [
      {views:['chat','ligacoes'], title:'Atendimento', mark:'☎', sub:'Conversas, ligações, WhatsApp e histórico centralizados', tabs:[['chat','Conversas'],['ligacoes','Ligações']]},
      {views:['playbooks','objecoes'], title:'Inteligência comercial', mark:'✦', sub:'Scripts, objeções, templates e materiais para converter melhor', tabs:[['playbooks','Playbooks'],['objecoes','Objeções']]},
      {views:['dashboard','metricas','metas','perdas','funil'], title:'Gestão comercial', mark:'▣', sub:'Resumo, métricas, metas, perdas e forecast em uma área única', tabs:[['dashboard','Resumo'],['metricas','Métricas'],['metas','Metas'],['perdas','Perdas'],['funil','Funil']]},
      {views:['importar'], title:'Configurações', mark:'⚙', sub:'Backup, importação/exportação, layout e preferências', tabs:[['importar','Importar/Exportar'],['density','Densidade']]}
    ];
    configs.forEach(cfg=>{
      cfg.views.forEach(view=>{
        const sec = $('#'+view); if(!sec || sec.querySelector(':scope > .crm-v49-area-nav')) return;
        sec.insertAdjacentHTML('afterbegin', '<div class="crm-v49-area-nav"><div class="crm-v49-area-title"><span class="mark">'+esc(cfg.mark)+'</span><span><b>'+esc(cfg.title)+'</b><span>'+esc(cfg.sub)+'</span></span></div><div class="crm-v49-area-tabs">'+cfg.tabs.map(([id,label])=> id==='density' ? '<button type="button" data-ux-action="density">'+esc(label)+'</button>' : '<button type="button" data-view="'+esc(id)+'">'+esc(label)+'</button>').join('')+'</div></div>');
      });
    });
    updateActiveUI();
  }

  function enhanceCurrentView(view){
    view = view || currentView();
    if(view === 'inicio') enhanceHome();
    if(view === 'leads') enhanceLeads();
    if(view === 'cadencias') enhanceFollowups();
    if(view === 'pipeline') enhancePipeline();
    if(view === 'agenda') enhanceAgenda();
    if(view === 'automacoes') enhanceAutomations();
    if(view === 'playbooks' || view === 'objecoes') enhanceIntelligence(view);
    if(view === 'dashboard' || view === 'metricas' || view === 'metas' || view === 'perdas') enhanceGestao(view);
    if(view === 'chat' || view === 'ligacoes') enhanceAtendimento(view);
    if(view === 'importar') enhanceSettings();
    enhanceLeadDetail();
  }

  function homeStats(){
    const list = getLeads();
    const today = todayISO();
    const open = list.filter(l=>!['Fechado','Perdido'].includes(l.etapa));
    return {
      today: open.filter(l=>l.followup===today).length,
      overdue: open.filter(l=>l.followup && isOverdue(l.followup)).length,
      hot: open.filter(l=> score(l)>=70).length,
      prop: open.filter(l=>l.etapa==='Proposta').length,
      goal: open.reduce((s,l)=>s+(Number(l.valor)||0),0)
    };
  }
  function score(l){
    try{ if(typeof window.calcScore==='function') return window.calcScore(l); }catch(e){}
    try{ if(typeof calcScore==='function') return calcScore(l); }catch(e){}
    const stage = {Lead:10,Contato:25,Proposta:55,Fechado:100,Perdido:0}[l.etapa]||0;
    const pri = {Alta:30,'Média':15,Baixa:5}[l.prioridade]||10;
    return stage+pri+Math.min(30,Math.round((Number(l.valor)||0)/1000));
  }
  function enhanceHome(){
    const sec=$('#inicio'); if(!sec || $('#crmV49Today')) return;
    const s=homeStats();
    sec.insertAdjacentHTML('afterbegin', '<div class="crm-v49-today" id="crmV49Today">'+
      '<div class="crm-v49-today-card" data-view="cadencias"><strong>'+s.today+'</strong><span>Follow-ups hoje</span></div>'+
      '<div class="crm-v49-today-card overdue" data-view="cadencias"><strong>'+s.overdue+'</strong><span>Atrasados</span></div>'+
      '<div class="crm-v49-today-card hot" data-view="leads"><strong>'+s.hot+'</strong><span>Leads quentes</span></div>'+
      '<div class="crm-v49-today-card" data-view="pipeline"><strong>'+s.prop+'</strong><span>Propostas abertas</span></div>'+
      '<div class="crm-v49-today-card" data-view="dashboard"><strong>'+brl(s.goal)+'</strong><span>Pipeline aberto</span></div>'+
    '</div>');
  }
  function enhanceLeads(){
    const sec=$('#leads'); if(!sec || $('#crmV49LeadViews')) return;
    const ref = sec.querySelector('.section-header') || sec.firstElementChild;
    ref?.insertAdjacentHTML('afterend','<div class="crm-v49-view-chips" id="crmV49LeadViews"><button type="button" data-ux-saved-view="hot-leads">Leads quentes</button><button type="button" data-ux-saved-view="no-contact">Sem próximo contato</button><button type="button" data-ux-saved-view="proposal-week">Propostas</button><button type="button" data-ux-saved-view="overdue-leads">Atrasados</button></div>');
  }
  function enhanceFollowups(){
    const sec=$('#cadencias'); if(!sec || $('#crmV49FollowupExecBar')) return;
    const stats = homeStats();
    sec.insertAdjacentHTML('afterbegin','<div class="crm-v49-execute-bar" id="crmV49FollowupExecBar"><div><b>Modo execução</b><span>Trabalhe um contato por vez: ligar, WhatsApp, concluir ou remarcar sem sair da rotina.</span></div><button type="button" class="btn btn-primary" data-ux-followup-exec="1">Executar fila ('+(stats.overdue+stats.today)+')</button></div>');
    ensureExecModal();
  }
  function enhancePipeline(){
    const sec=$('#pipeline'); if(!sec || $('#crmV49PipelineTools')) return;
    const ref = sec.querySelector('.section-header') || sec.firstElementChild;
    ref?.insertAdjacentHTML('afterend','<div class="crm-v49-view-chips" id="crmV49PipelineTools"><button type="button" data-view="pipeline">Kanban</button><button type="button" data-view="funil">Funil real</button><button type="button" data-ux-saved-view="stagnant">Parados 7+ dias</button><button type="button" data-ux-saved-view="proposal-week">Propostas abertas</button></div>');
  }
  function enhanceAgenda(){
    const sec=$('#agenda'); if(!sec || $('#crmV49AgendaTools')) return;
    const ref = sec.querySelector('.crm-v49-area-nav') || sec.querySelector('.section-header') || sec.firstElementChild;
    ref?.insertAdjacentHTML('afterend','<div class="crm-v49-tool-grid" id="crmV49AgendaTools"><div class="crm-v49-tool-card"><b>Compromisso → follow-up</b><span>Depois de uma reunião, crie uma próxima ação comercial para não perder o timing.</span><button type="button" class="btn btn-sm" data-view="cadencias">Ver follow-ups</button></div><div class="crm-v49-tool-card"><b>Follow-up → compromisso</b><span>Use a agenda quando o contato tiver horário marcado e precise bloquear tempo.</span><button type="button" class="btn btn-sm" id="crmV49GoAgendaNew">Novo compromisso</button></div><div class="crm-v49-tool-card"><b>Preparação da reunião</b><span>Abra o lead, revise objeções e escolha um script antes de ligar ou reunir.</span><button type="button" class="btn btn-sm" data-view="playbooks">Ver scripts</button></div></div>');
    $('#crmV49GoAgendaNew')?.addEventListener('click',()=>$('#agNewBtn')?.click());
  }
  function enhanceAutomations(){
    const sec=$('#automacoes'); if(!sec || $('#crmV49AutoTemplates')) return;
    const ref = sec.querySelector('.crm-v49-area-nav') || sec.querySelector('.section-header') || sec.firstElementChild;
    ref?.insertAdjacentHTML('afterend','<div class="crm-v49-tool-grid" id="crmV49AutoTemplates"><div class="crm-v49-tool-card"><b>Lead sem contato há 7 dias</b><span>Cria follow-up e destaca no painel.</span><button type="button" class="btn btn-sm" data-ux-create="automation">Usar template</button></div><div class="crm-v49-tool-card"><b>Proposta enviada</b><span>Agenda retorno automático em 2 dias.</span><button type="button" class="btn btn-sm" data-ux-create="automation">Usar template</button></div><div class="crm-v49-tool-card"><b>Lead perdido</b><span>Pede motivo da perda e cria reativação futura.</span><button type="button" class="btn btn-sm" data-ux-create="automation">Usar template</button></div></div>');
  }
  function enhanceIntelligence(view){
    const sec=$('#'+view); if(!sec || sec.querySelector('.crm-v49-intel-tools')) return;
    const ref = sec.querySelector('.crm-v49-area-nav') || sec.querySelector('.section-header') || sec.firstElementChild;
    ref?.insertAdjacentHTML('afterend','<div class="crm-v49-tool-grid crm-v49-intel-tools"><div class="crm-v49-tool-card"><b>Copiar e adaptar</b><span>Use scripts e objeções como resposta rápida para WhatsApp, ligação ou e-mail.</span><button type="button" class="btn btn-sm" data-view="chat">Usar no atendimento</button></div><div class="crm-v49-tool-card"><b>Salvar no lead</b><span>Ao abrir um lead, registre qual argumento foi usado no histórico comercial.</span><button type="button" class="btn btn-sm" data-view="leads">Abrir leads</button></div><div class="crm-v49-tool-card"><b>Criar próximo passo</b><span>Transforme uma objeção ou script em follow-up para não perder o timing.</span><button type="button" class="btn btn-sm" data-view="cadencias">Criar follow-up</button></div></div>');
  }
  function enhanceGestao(view){
    const sec=$('#'+view); if(!sec || sec.querySelector('.crm-v49-gestao-tools')) return;
    const ref = sec.querySelector('.crm-v49-area-nav') || sec.querySelector('.section-header') || sec.firstElementChild;
    ref?.insertAdjacentHTML('afterend','<div class="crm-v49-tool-grid crm-v49-gestao-tools"><div class="crm-v49-tool-card"><b>Resumo executivo</b><span>Veja decisões rápidas: resultado, pipeline, atrasos e forecast.</span><button type="button" class="btn btn-sm" data-view="dashboard">Abrir resumo</button></div><div class="crm-v49-tool-card"><b>Indicadores detalhados</b><span>Analise conversão, origem, produtividade, perdas e tempo de ciclo.</span><button type="button" class="btn btn-sm" data-view="metricas">Ver métricas</button></div><div class="crm-v49-tool-card"><b>Perdas e reativação</b><span>Use motivos de perda para ajustar abordagem e recuperar oportunidades.</span><button type="button" class="btn btn-sm" data-view="perdas">Analisar perdas</button></div></div>');
  }
  function enhanceAtendimento(view){
    const sec=$('#'+view); if(!sec || sec.querySelector('.crm-v49-atendimento-tools')) return;
    const ref = sec.querySelector('.crm-v49-area-nav') || sec.querySelector('.section-header') || sec.firstElementChild;
    ref?.insertAdjacentHTML('afterend','<div class="crm-v49-tool-grid crm-v49-atendimento-tools"><div class="crm-v49-tool-card"><b>WhatsApp Web</b><span>Modo simples: abre conversa com o número do lead sem API.</span><button type="button" class="btn btn-sm" data-view="chat">Conversas</button></div><div class="crm-v49-tool-card"><b>Fila de ligações</b><span>Priorize leads quentes, use script e registre resultado da chamada.</span><button type="button" class="btn btn-sm" data-view="ligacoes">Ligações</button></div><div class="crm-v49-tool-card"><b>Histórico unificado</b><span>Abra o lead para ver notas, etapas, follow-ups e atividades.</span><button type="button" class="btn btn-sm" data-view="leads">Abrir leads</button></div></div>');
  }
  function enhanceSettings(){
    const sec=$('#importar'); if(!sec || $('#crmV49SettingsTools')) return;
    const ref = sec.querySelector('.crm-v49-area-nav') || sec.querySelector('.section-header') || sec.firstElementChild;
    ref?.insertAdjacentHTML('afterend','<div class="crm-v49-tool-grid" id="crmV49SettingsTools"><div class="crm-v49-tool-card"><b>Densidade do layout</b><span>Escolha entre confortável, compacto e super compacto para caber mais informação.</span><button type="button" class="btn btn-sm" data-ux-action="density">Alterar layout</button></div><div class="crm-v49-tool-card"><b>Backup dos dados</b><span>Como ainda usa localStorage, exporte dados antes de limpar cache ou trocar de navegador.</span><button type="button" class="btn btn-sm" data-view="importar">Importar/Exportar</button></div><div class="crm-v49-tool-card"><b>Organização das áreas</b><span>Ferramentas parecidas agora ficam agrupadas em Atendimento, Inteligência e Gestão.</span><button type="button" class="btn btn-sm" data-view="inicio">Voltar ao painel</button></div></div>');
  }

  function applySavedView(id){
    if(id==='hot-leads'){ navigate('leads'); $('#leadsSearch') && ($('#leadsSearch').value=''); clickChip('#leadsPriorityFilters [data-lf-priority="Alta"]'); toast('Visualização: leads quentes/alta prioridade','success'); }
    if(id==='no-contact'){ navigate('leads'); $('#leadsSearch') && ($('#leadsSearch').value='sem contato'); toast('Dica: use a busca/filtros para revisar leads sem próximo contato.','success'); }
    if(id==='proposal-week'){ navigate('leads'); clickChip('#leadsStageFilters [data-lf-stage="Proposta"]'); toast('Visualização: propostas abertas','success'); }
    if(id==='overdue-leads'){ navigate('cadencias'); setTimeout(()=>clickChip('#fuFilters [data-fu-filter="vencidos"]'),100); }
    if(id==='stagnant'){ navigate('pipeline'); toast('Visualização: negócios parados 7+ dias.','success'); }
  }
  function clickChip(sel){ const el=$(sel); if(el) el.click(); }

  let execIndex = 0;
  function execQueue(){
    const today=todayISO();
    return getLeads().filter(l=>!['Fechado','Perdido'].includes(l.etapa) && l.followup && (isOverdue(l.followup) || l.followup===today)).sort((a,b)=>String(a.followup).localeCompare(String(b.followup)) || score(b)-score(a));
  }
  function ensureExecModal(){
    if($('#crmV49FollowupModal')) return;
    DOC.body.insertAdjacentHTML('beforeend','<div class="crm-v49-followup-modal" id="crmV49FollowupModal"><div class="crm-v49-exec-card"><div class="crm-v49-exec-head"><span><b>Modo execução de follow-ups</b><span>Um contato por vez para acelerar a rotina comercial</span></span><button type="button" data-ux-exec-close="1">×</button></div><div class="crm-v49-exec-body" id="crmV49ExecBody"></div></div></div>');
  }
  function openFollowupExecution(){ ensureExecModal(); execIndex=0; renderExecLead(); $('#crmV49FollowupModal')?.classList.add('show'); }
  function closeFollowupExecution(){ $('#crmV49FollowupModal')?.classList.remove('show'); }
  function renderExecLead(){
    const body=$('#crmV49ExecBody'); if(!body) return;
    const q=execQueue();
    if(!q.length){ body.innerHTML='<div class="crm-v49-empty">Nenhum follow-up vencido ou para hoje. Boa rotina!</div><div class="crm-v49-exec-actions"><button type="button" class="btn" data-ux-exec-close="1">Fechar</button></div>'; return; }
    if(execIndex>=q.length) execIndex=0;
    const l=q[execIndex];
    const tel=String(l.telefone||'').replace(/\D/g,'');
    const wa = tel ? 'https://wa.me/55'+tel.replace(/^55/,'') : '#';
    const overdue = isOverdue(l.followup);
    body.dataset.ref = l.id || l.nome;
    body.innerHTML = '<div><h3 style="margin:0;color:var(--text)">'+esc(l.nome||'Lead')+'</h3><p style="margin:4px 0 0;color:var(--text-3);font-size:13px">'+esc([l.etapa,l.segmento,l.responsavel].filter(Boolean).join(' · '))+'</p></div>'+
      '<div class="crm-v49-exec-kpis"><div><strong>'+esc(l.prioridade||'Média')+'</strong><span>Prioridade</span></div><div><strong>'+fmt(l.followup)+'</strong><span>'+(overdue?'Atrasado':'Hoje')+'</span></div><div><strong>'+brl(l.valor)+'</strong><span>Valor potencial</span></div></div>'+
      '<div class="crm-v49-script-box"><b>Script sugerido</b><br>Olá, '+esc((l.responsavel||l.nome||'').split(' ')[0])+'. Estou passando para retomar nosso próximo passo sobre '+esc(l.segmento||'sua demanda')+'. Faz sentido avançarmos hoje com uma definição?</div>'+
      '<div class="crm-v49-exec-actions"><a class="btn btn-primary" href="'+esc(tel?'tel:+'+('55'+tel.replace(/^55/,'')):'#')+'">Ligar</a><a class="btn" target="_blank" rel="noopener" href="'+esc(wa)+'">WhatsApp</a><button type="button" class="btn" data-ux-exec-action="open">Abrir lead</button><button type="button" class="btn" data-ux-exec-action="done">Concluir</button><button type="button" class="btn" data-ux-exec-action="3days">Remarcar 3 dias</button><button type="button" class="btn" data-ux-exec-action="next">Próximo</button></div>';
  }
  function handleExecAction(act){
    const q=execQueue(); const l=q[execIndex]; if(!l) return renderExecLead();
    if(act==='open') return openLead(l.id||l.nome);
    if(act==='next'){ execIndex++; return renderExecLead(); }
    if(act==='done'){ l.followup=''; l.ultimaAtualizacao=todayISO(); saveLeadsSafe(); renderSafe(); toast('Follow-up concluído','success'); return renderExecLead(); }
    if(act==='3days'){ l.followup=addDays(3); l.ultimaAtualizacao=todayISO(); saveLeadsSafe(); renderSafe(); toast('Follow-up remarcado para '+fmt(l.followup),'success'); return renderExecLead(); }
  }

  function enhanceLeadDetail(){
    const panel = $('.detail-panel'); if(!panel || panel.dataset.v49Enhanced) return;
    panel.dataset.v49Enhanced='1';
    const body = $('.dp-body', panel); if(!body) return;
    body.insertAdjacentHTML('afterbegin','<div class="crm-v49-detail-tabs"><button type="button" class="active">Resumo</button><button type="button">Histórico</button><button type="button">Follow-ups</button><button type="button">Scripts</button></div><div class="crm-v49-detail-quick" id="crmV49DetailQuick"><button type="button" data-ux-detail="call">Ligar</button><button type="button" data-ux-detail="whatsapp">WhatsApp</button><button type="button" data-view="cadencias">Follow-up</button><button type="button" data-view="playbooks">Script</button></div>');
    DOC.addEventListener('click', function(e){
      const btn=e.target.closest('[data-ux-detail]'); if(!btn) return;
      const name=$('#dNome')?.textContent?.trim(); const l=getLeads().find(x=>x.nome===name || String(x.id)===name); if(!l) return;
      const tel=String(l.telefone||'').replace(/\D/g,'');
      if(btn.dataset.uxDetail==='call' && tel) location.href='tel:+'+('55'+tel.replace(/^55/,''));
      if(btn.dataset.uxDetail==='whatsapp' && tel) window.open('https://wa.me/55'+tel.replace(/^55/,''),'_blank','noopener');
    }, true);
  }

  function start(){
    DOC.body.classList.add('crm-v49-unificado');
    installDensity();
    buildSidebar(); buildRail(); buildTopTabs(); installTopbarTools(); installEvents(); wrapSetView(); injectAreaNavs(); enhanceCurrentView(currentView()); updateActiveUI(currentView());
    setTimeout(()=>{ injectAreaNavs(); enhanceCurrentView(currentView()); updateActiveUI(currentView()); }, 250);
  }

  if(DOC.readyState === 'loading') DOC.addEventListener('DOMContentLoaded', start); else start();
  new MutationObserver(()=>{
    clearTimeout(window.__crmV49MutationT);
    window.__crmV49MutationT = setTimeout(()=>{ injectAreaNavs(); enhanceCurrentView(currentView()); updateActiveUI(currentView()); }, 120);
  }).observe(DOC.body,{childList:true,subtree:true});
})();
