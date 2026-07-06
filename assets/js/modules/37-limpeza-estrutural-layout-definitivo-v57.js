/* CRM v57 — limpeza estrutural e layout definitivo */
(function(){
  'use strict';
  if(window.__CRM_V57_FINAL__) return;
  window.__CRM_V57_FINAL__ = true;

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const LS_EVENTS = 'outbounder_agenda_v1';
  const LS_AUTOS = 'outbounder_automations_visual_v57';
  const LS_UI = 'outbounder_ui_v57';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const norm = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const today = () => new Date().toISOString().slice(0,10);
  const pad = n => String(n).padStart(2,'0');
  const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const parseDate = s => { const [y,m,d] = String(s||today()).split('-').map(Number); return new Date(y||new Date().getFullYear(), (m||1)-1, d||1); };
  const addDays = (s,n) => { const d=parseDate(s); d.setDate(d.getDate()+n); return dateKey(d); };
  const money = v => { try { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0); } catch(e){ return 'R$ '+(Number(v)||0); } };
  const notify = (msg,type='success') => { try{ window.crmToast ? window.crmToast(msg,type) : showToast(msg,type); }catch(e){ console.log(msg); } };
  const getLeads = () => { try { return window.crmGetLeads ? window.crmGetLeads() : (window.leads || []); } catch(e){ return []; } };
  const saveLeads = () => { try { if(window.crmSaveLeads) window.crmSaveLeads(); else if(typeof saveLeads === 'function') saveLeads(); } catch(e){} };
  const openLead = (name) => { try { window.crmOpenLead ? window.crmOpenLead(name) : openDetail(name); } catch(e) { try{ window.setView('leads'); }catch(_){} } };
  const telHref = phone => {
    let d = String(phone||'').replace(/\D/g,'');
    if(!d) return '#';
    if(d.startsWith('00')) d = d.slice(2);
    if(!d.startsWith('55')) d = '55' + d;
    return 'tel:+' + d;
  };
  const waHref = phone => {
    let d = String(phone||'').replace(/\D/g,'');
    if(!d) return '#';
    if(!d.startsWith('55')) d = '55' + d;
    return 'https://wa.me/' + d;
  };

  const VIEWS = [
    {id:'inicio', label:'Painel', icon:'⌂', subs:[['Hoje','inicio'],['Rotina','cadencias'],['Metas','dashboard']]},
    {id:'leads', label:'Leads', icon:'◉', subs:[['Base','leads'],['Novo lead','novo-lead'],['Clientes','clientes']]},
    {id:'garimpo', label:'Garimpo', icon:'⌕', subs:[['Buscar leads','garimpo'],['Base de leads','leads'],['Novo lead','novo-lead']]},
    {id:'pipeline', label:'Pipeline', icon:'▦', subs:[['Kanban','pipeline'],['Funil','funil'],['Configurar etapas','pipeline']]},
    {id:'cadencias', label:'Follow-ups', icon:'↻', subs:[['Kanban','cadencias'],['Lista','cadencias'],['Execução','cadencias']]},
    {id:'agenda', label:'Agenda', icon:'□', subs:[['Mês','agenda'],['Semana','agenda'],['Dia','agenda'],['Ano','agenda']]},
    {id:'ligacoes', label:'Ligações', icon:'☎', subs:[['Fila','ligacoes'],['Discador','ligacoes'],['Resultados','ligacoes']]},
    {id:'chat', label:'Atendimento', icon:'✉', subs:[['Chat','chat'],['WhatsApp','chat'],['Ligações','ligacoes']]},
    {id:'playbooks', label:'Inteligência', icon:'✦', subs:[['Playbooks','playbooks'],['Scripts','playbooks'],['Objeções','objecoes'],['IA local','playbooks']]},
    {id:'automacoes', label:'Automações', icon:'⚡', subs:[['Modelos','automacoes'],['Criador','automacoes'],['Histórico','automacoes']]},
    {id:'dashboard', label:'Gestão', icon:'◍', subs:[['Resumo','dashboard'],['Métricas','metricas'],['Perdas','perdas']]},
    {id:'importar', label:'Configurações', icon:'⚙', subs:[['Importar/Exportar','importar'],['Layout','importar'],['Dados','importar']]}
  ];

  function ensureSection(id, afterId='agenda'){
    let el = $('#'+id);
    if(el) return el;
    el = document.createElement('section');
    el.id = id;
    el.className = 'view grid-view';
    const after = $('#'+afterId) || $('.main .view:last-child');
    if(after) after.insertAdjacentElement('afterend', el); else $('.main')?.appendChild(el);
    return el;
  }

  function buildSidebar(){
    const nav = $('.sidebar-nav');
    if(!nav) return;
    nav.innerHTML = `<div class="nav-label">Operação</div>` + VIEWS.map((v,i)=>{
      const subs = (v.subs||[]).map(s=>`<button type="button" class="v57-subitem" data-view="${s[1]}" data-sub-label="${esc(s[0])}"><span class="v57-mini-icon">${esc(v.icon)}</span>${esc(s[0])}</button>`).join('');
      const label = `<span class="v57-nav-icon">${esc(v.icon)}</span><span class="v57-nav-text">${esc(v.label)}</span>`;
      return `<div class="v57-nav-group ${i<5?'open':''}"><button type="button" class="nav-item" data-view="${v.id}" title="${esc(v.label)}" aria-label="${esc(v.label)}">${label}</button>${subs?`<div class="v57-sublist">${subs}</div>`:''}</div>`;
    }).join('');
    $('.rail')?.classList.add('v57-disabled-layer');
    $('.topbar-tabs')?.classList.add('v57-disabled-layer');
    bindNav();
  }

  function bindNav(){
    $$('[data-view]').forEach(btn=>{
      if(btn.__v57Bound) return;
      btn.__v57Bound = true;
      btn.addEventListener('click', (e)=>{
        const v = btn.dataset.view;
        if(!v) return;
        e.preventDefault();
        goView(v);
        const sub = btn.dataset.subLabel;
        if(sub) handleSubAction(v, sub);
      });
    });
  }

  const originalSetView = window.setView;
  function goView(v){
    if(v === 'ligacoes') ensureSection('ligacoes','agenda');
    try { if(originalSetView && originalSetView !== goView) originalSetView(v); }
    catch(e){
      $$('.view').forEach(s=>s.classList.toggle('active', s.id===v));
      $$('[data-view]').forEach(b=>b.classList.toggle('active', b.dataset.view===v));
    }
    setTimeout(()=>renderOfficial(v), 15);
  }
  window.setView = goView;

  function handleSubAction(view,label){
    setTimeout(()=>{
      if(view==='agenda') setAgendaView(label.toLowerCase());
      if(view==='cadencias') setFollowView(label.toLowerCase());
      if(view==='ligacoes') renderCalls(label.toLowerCase());
      if(view==='playbooks') setIntelTab(label.toLowerCase());
      if(view==='automacoes') setAutoTab(label.toLowerCase());
    },30);
  }

  function renderOfficial(view){
    bindNav();
    updateActiveNav(view);
    if(view === 'agenda') renderAgenda();
    if(view === 'cadencias') renderFollowups();
    if(view === 'ligacoes') renderCalls();
    if(view === 'playbooks' || view === 'objecoes') renderIntelligence(view === 'objecoes' ? 'objeções' : null);
    if(view === 'automacoes') renderAutomations();
  }
  function updateActiveNav(view){
    $$('.sidebar .nav-item').forEach(b=>b.classList.toggle('active', b.dataset.view===view));
    $$('[data-view]').forEach(b=>{ if(!b.closest('.v57-sublist')) b.classList.toggle('active', b.dataset.view===view); });
  }

  /* ===== Agenda definitiva ===== */
  const agendaState = Object.assign({view:'month', anchor:today(), types:['Ligação','Reunião','Follow-up','Tarefa','Proposta','Pessoal'], density:'comfort', editing:null}, loadUI().agenda || {});
  function loadUI(){ try { return JSON.parse(localStorage.getItem(LS_UI)||'{}'); } catch(e){ return {}; } }
  function saveUI(){ const ui=loadUI(); ui.agenda=agendaState; try{localStorage.setItem(LS_UI,JSON.stringify(ui));}catch(e){} }
  function loadEvents(){
    try{
      const raw = JSON.parse(localStorage.getItem(LS_EVENTS)||'[]');
      return Array.isArray(raw) ? raw.map(normalizeEvent) : [];
    }catch(e){ return []; }
  }
  function saveEvents(list){ localStorage.setItem(LS_EVENTS, JSON.stringify(list.map(normalizeEvent))); }
  function normalizeEvent(e){
    return {
      id:e.id || ('ev'+Date.now()+Math.random().toString(36).slice(2,7)),
      title:e.title || e.titulo || e.leadNome || 'Compromisso',
      leadNome:e.leadNome || e.lead || '',
      data:e.data || today(),
      hora:e.hora || e.start || '09:00',
      fim:e.fim || e.end || '',
      tipo:e.tipo || 'Reunião',
      prioridade:e.prioridade || 'Média',
      notas:e.notas || e.notes || '',
      agenda:e.agenda || 'Comercial',
      color:e.color || ''
    };
  }
  function seedEventsIfEmpty(){
    const events = loadEvents();
    if(events.length) return;
    saveEvents([
      {id:'v57e1', title:'Retorno proposta', leadNome:'Fazenda Aurora', data:today(), hora:'09:00', tipo:'Ligação', prioridade:'Alta', notas:'Confirmar proposta e próximo passo.'},
      {id:'v57e2', title:'Enviar apresentação', leadNome:'Loja Horizonte', data:today(), hora:'14:30', tipo:'Follow-up', prioridade:'Média', notas:'Enviar material e agendar reunião.'},
      {id:'v57e3', title:'Reunião diagnóstico', leadNome:'Franquia Delta', data:addDays(today(),1), hora:'10:00', tipo:'Reunião', prioridade:'Alta', notas:'Preparar perguntas SPIN.'}
    ]);
  }
  function setAgendaView(v){
    const map={mês:'month',mes:'month',month:'month',dia:'day',day:'day',semana:'week',week:'week',ano:'year',year:'year',lista:'list',list:'list'};
    const next = map[v] || v || 'month';
    // Agenda assumida pela V64. Mantemos esta função apenas como ponte para os submenus antigos.
    if(window.CRMV64Agenda && typeof window.CRMV64Agenda.setView === 'function') return window.CRMV64Agenda.setView(next);
    setTimeout(()=>window.CRMV64Agenda?.setView?.(next),80);
  }
  function renderAgenda(){
    // V57 não renderiza mais a agenda para evitar duas implementações disputando o mesmo DOM.
    if(window.CRMV64Agenda && typeof window.CRMV64Agenda.render === 'function') return window.CRMV64Agenda.render();
    setTimeout(()=>window.CRMV64Agenda?.render?.(),80);
  }
  function buildAgendaShell(){
    const d=parseDate(agendaState.anchor);
    return `<div class="v57-shell">
      <div class="v57-card v57-cal-top">
        <div>
          <div class="v57-cal-title" id="v57CalTitle">Agenda</div>
          <div class="v57-cal-sub">Clique em qualquer dia ou horário para criar compromisso. Arrume sua rotina com visualizações de mês, semana, dia, ano e lista.</div>
        </div>
        <div class="v57-cal-actions">
          <button class="v57-btn ghost" data-cal-today>Hoje</button>
          <button class="v57-btn ghost" data-cal-prev>‹</button>
          <button class="v57-btn ghost" data-cal-next>›</button>
          <div class="v57-seg" role="tablist">
            ${[['day','Dia'],['week','Semana'],['month','Mês'],['year','Ano'],['list','Lista']].map(x=>`<button type="button" data-cal-view="${x[0]}" class="${agendaState.view===x[0]?'active':''}">${x[1]}</button>`).join('')}
          </div>
          <button class="v57-btn primary" data-new-event>+ Novo compromisso</button>
        </div>
      </div>
      <div class="v57-cal">
        <aside class="v57-card v57-cal-sidebar">
          <div class="v57-mini-cal"><div class="v57-mini-head"><span id="v57MiniTitle"></span><div><button class="v57-mini-btn" data-mini-prev>‹</button><button class="v57-mini-btn" data-mini-next>›</button></div></div><div class="v57-mini-grid" id="v57MiniGrid"></div></div>
          <div class="v57-soft-card" style="padding:14px"><div style="font-weight:950;color:var(--v57-green);margin-bottom:10px">Camadas</div><div class="v57-type-list">
            ${['Comercial','Follow-ups','Pessoal','Time'].map((x,i)=>`<label class="v57-type-row"><span class="v57-type-dot" style="background:${['#1D9E75','#f59e0b','#6366f1','#04342C'][i]}"></span><input type="checkbox" checked data-layer="${x}"> ${x}</label>`).join('')}
          </div></div>
          <div class="v57-soft-card" style="padding:14px"><div style="font-weight:950;color:var(--v57-green);margin-bottom:10px">Tipos de evento</div><div class="v57-type-list">
            ${['Ligação','Reunião','Follow-up','Tarefa','Proposta','Pessoal'].map(t=>`<label class="v57-type-row"><span class="v57-type-dot ${eventClass(t)}"></span><input type="checkbox" checked data-type-filter="${t}"> ${t}</label>`).join('')}
          </div></div>
          <div class="v57-soft-card" style="padding:14px"><div style="font-weight:950;color:var(--v57-green);margin-bottom:10px">Densidade</div><div class="v57-seg"><button data-density="comfort" class="${agendaState.density==='comfort'?'active':''}">Conforto</button><button data-density="compact" class="${agendaState.density==='compact'?'active':''}">Compacto</button></div></div>
        </aside>
        <main class="v57-card v57-cal-main"><div class="v57-cal-body" id="v57CalBody"></div></main>
      </div>
      <div class="v57-drawer-backdrop" id="v57AgendaBackdrop"></div>
      <aside class="v57-drawer" id="v57AgendaDrawer"></aside>
    </div>`;
  }
  function eventClass(t){
    if(/lig|whats/i.test(t)) return 'call'; if(/reuni|demo/i.test(t)) return 'meeting'; if(/follow|proposta/i.test(t)) return 'follow'; return 'task';
  }
  function filteredEvents(){
    const checked = $$('[data-type-filter]').filter(x=>x.checked).map(x=>x.dataset.typeFilter);
    return loadEvents().filter(e => !checked.length || checked.includes(e.tipo));
  }
  function bindAgendaEvents(){
    $('[data-cal-today]')?.addEventListener('click',()=>{agendaState.anchor=today(); saveUI(); renderAgenda();});
    $('[data-cal-prev]')?.addEventListener('click',()=>moveAgenda(-1));
    $('[data-cal-next]')?.addEventListener('click',()=>moveAgenda(1));
    $('[data-new-event]')?.addEventListener('click',()=>openEventDrawer({data:agendaState.anchor,hora:'09:00'}));
    $('[data-mini-prev]')?.addEventListener('click',()=>{ const d=parseDate(agendaState.anchor); d.setMonth(d.getMonth()-1); agendaState.anchor=dateKey(d); saveUI(); renderAgenda(); });
    $('[data-mini-next]')?.addEventListener('click',()=>{ const d=parseDate(agendaState.anchor); d.setMonth(d.getMonth()+1); agendaState.anchor=dateKey(d); saveUI(); renderAgenda(); });
    $$('[data-cal-view]').forEach(b=>b.addEventListener('click',()=>setAgendaView(b.dataset.calView)));
    $$('[data-density]').forEach(b=>b.addEventListener('click',()=>{agendaState.density=b.dataset.density; saveUI(); renderAgenda();}));
    $$('[data-type-filter]').forEach(c=>c.addEventListener('change',renderAgendaBody));
  }
  function moveAgenda(delta){
    const d=parseDate(agendaState.anchor);
    if(agendaState.view==='day') d.setDate(d.getDate()+delta);
    else if(agendaState.view==='week') d.setDate(d.getDate()+delta*7);
    else if(agendaState.view==='year') d.setFullYear(d.getFullYear()+delta);
    else d.setMonth(d.getMonth()+delta);
    agendaState.anchor=dateKey(d); saveUI(); renderAgenda();
  }
  function renderMiniCalendar(){
    const grid=$('#v57MiniGrid'), title=$('#v57MiniTitle'); if(!grid) return;
    const d=parseDate(agendaState.anchor), y=d.getFullYear(), m=d.getMonth();
    if(title) title.textContent = d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^\w/,s=>s.toUpperCase());
    const dows=['D','S','T','Q','Q','S','S'];
    let html=dows.map(x=>`<div class="v57-mini-dow">${x}</div>`).join('');
    const first = new Date(y,m,1).getDay(), dim = new Date(y,m+1,0).getDate();
    for(let i=0;i<first;i++) html += `<div></div>`;
    for(let day=1; day<=dim; day++){
      const ds=`${y}-${pad(m+1)}-${pad(day)}`;
      html += `<button class="v57-mini-day ${ds===agendaState.anchor?'active':''}" data-mini-date="${ds}">${day}</button>`;
    }
    grid.innerHTML=html;
    $$('[data-mini-date]',grid).forEach(b=>b.addEventListener('click',()=>{agendaState.anchor=b.dataset.miniDate; saveUI(); renderAgenda();}));
  }
  function renderAgendaBody(){
    const body=$('#v57CalBody'); if(!body) return;
    const d=parseDate(agendaState.anchor);
    const title=$('#v57CalTitle'); if(title) title.textContent = titleText();
    if(agendaState.view==='month') body.innerHTML = renderMonth(d);
    if(agendaState.view==='week') body.innerHTML = renderWeek(d);
    if(agendaState.view==='day') body.innerHTML = renderDay(d);
    if(agendaState.view==='year') body.innerHTML = renderYear(d);
    if(agendaState.view==='list') body.innerHTML = renderList(d);
    bindAgendaBodyClicks();
  }
  function titleText(){
    const d=parseDate(agendaState.anchor);
    if(agendaState.view==='year') return String(d.getFullYear());
    if(agendaState.view==='day') return d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).replace(/^\w/,s=>s.toUpperCase());
    if(agendaState.view==='week'){ const start=startOfWeek(d), end=new Date(start); end.setDate(end.getDate()+6); return `${start.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})} – ${end.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}`; }
    return d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^\w/,s=>s.toUpperCase());
  }
  function eventsForDate(ds){ return filteredEvents().filter(e=>e.data===ds).sort((a,b)=>String(a.hora).localeCompare(String(b.hora))); }
  function renderEventChip(e){ return `<div class="v57-event ${eventClass(e.tipo)}" data-event-id="${esc(e.id)}" title="${esc(e.title)}"><span>${esc(e.hora||'')}</span><span>${esc(e.title||e.leadNome||'Compromisso')}</span></div>`; }
  function renderMonth(d){
    const y=d.getFullYear(), m=d.getMonth();
    let html='<div class="v57-month-grid">'+['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(x=>`<div class="v57-dow">${x}</div>`).join('');
    const start = new Date(y,m,1); start.setDate(start.getDate()-start.getDay());
    for(let i=0;i<42;i++){
      const cur=new Date(start); cur.setDate(start.getDate()+i); const ds=dateKey(cur); const evs=eventsForDate(ds); const other=cur.getMonth()!==m;
      html += `<div class="v57-day ${other?'other':''} ${ds===today()?'today':''}" data-new-date="${ds}"><button class="v57-day-add" data-new-date="${ds}" title="Criar compromisso">+</button><div class="v57-day-num">${cur.getDate()}</div>${evs.slice(0,4).map(renderEventChip).join('')}${evs.length>4?`<div class="v57-more">+${evs.length-4} compromissos</div>`:''}</div>`;
    }
    return html+'</div>';
  }
  function startOfWeek(d){ const s=new Date(d); s.setDate(s.getDate()-s.getDay()); return s; }
  function renderWeek(d){
    const s=startOfWeek(d); const days=Array.from({length:7},(_,i)=>{const x=new Date(s); x.setDate(s.getDate()+i); return x;});
    let html='<div class="v57-week-grid"><div class="v57-week-head"></div>'+days.map(x=>`<div class="v57-week-head"><b>${x.toLocaleDateString('pt-BR',{weekday:'short'})}</b><span>${x.getDate()}/${x.getMonth()+1}</span></div>`).join('');
    for(let h=7;h<=20;h++){
      html += `<div class="v57-time-label">${pad(h)}:00</div>`;
      days.forEach(day=>{ const ds=dateKey(day); const evs=eventsForDate(ds).filter(e=>String(e.hora||'').startsWith(pad(h))); html += `<div class="v57-week-slot" data-new-date="${ds}" data-new-hour="${pad(h)}:00">${evs.map(renderEventChip).join('')}</div>`; });
    }
    return html+'</div>';
  }
  function renderDay(d){
    const ds=dateKey(d); let html='<div class="v57-day-view">';
    for(let h=7;h<=21;h++) html += `<div class="v57-hour">${pad(h)}:00</div><div class="v57-hour-slot" data-new-date="${ds}" data-new-hour="${pad(h)}:00">${eventsForDate(ds).filter(e=>String(e.hora||'').startsWith(pad(h))).map(renderEventChip).join('')}</div>`;
    return html+'</div>';
  }
  function renderYear(d){
    const y=d.getFullYear();
    return `<div class="v57-year-grid">${Array.from({length:12},(_,m)=>{
      const count=filteredEvents().filter(e=>parseDate(e.data).getFullYear()===y && parseDate(e.data).getMonth()===m).length;
      return `<div class="v57-card v57-year-month" data-year-month="${m}"><div class="v57-year-title">${new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long'}).replace(/^\w/,s=>s.toUpperCase())}</div><div class="v57-pill">${count} compromissos</div><div style="margin-top:10px;font-size:12px;color:rgba(44,44,42,.55);font-weight:700">Clique para abrir o mês</div></div>`;
    }).join('')}</div>`;
  }
  function renderList(){
    const evs=filteredEvents().sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora));
    if(!evs.length) return `<div class="v57-empty">Nenhum compromisso encontrado. Clique em <b>Novo compromisso</b> ou escolha um dia no calendário.</div>`;
    return `<div class="v57-list">${evs.map(e=>`<div class="v57-list-row" data-event-id="${esc(e.id)}"><div class="v57-list-time">${esc(e.data)}<br>${esc(e.hora||'')}</div><div><b>${esc(e.title)}</b><div style="font-size:12px;color:rgba(44,44,42,.58);font-weight:700;margin-top:3px">${esc(e.tipo)} • ${esc(e.leadNome||'Sem lead vinculado')}</div></div><span class="v57-pill">${esc(e.prioridade)}</span></div>`).join('')}</div>`;
  }
  function bindAgendaBodyClicks(){
    $$('[data-new-date]').forEach(el=>el.addEventListener('click',(e)=>{ if(e.target.closest('[data-event-id]')) return; e.preventDefault(); openEventDrawer({data:el.dataset.newDate, hora:el.dataset.newHour || '09:00'}); }));
    $$('[data-event-id]').forEach(el=>el.addEventListener('click',(e)=>{ e.stopPropagation(); const ev=loadEvents().find(x=>x.id===el.dataset.eventId); if(ev) openEventDrawer(ev); }));
    $$('[data-year-month]').forEach(el=>el.addEventListener('click',()=>{ const d=parseDate(agendaState.anchor); d.setMonth(Number(el.dataset.yearMonth)); d.setDate(1); agendaState.anchor=dateKey(d); agendaState.view='month'; saveUI(); renderAgenda(); }));
  }
  function openEventDrawer(input={}){
    const ev = normalizeEvent(input.id ? input : Object.assign({id:null,title:'',tipo:'Reunião',prioridade:'Média',data:agendaState.anchor,hora:'09:00'}, input));
    agendaState.editing = input.id || null;
    const drawer=$('#v57AgendaDrawer'), back=$('#v57AgendaBackdrop'); if(!drawer||!back) return;
    const leads=getLeads();
    drawer.innerHTML = `<div class="v57-drawer-head"><div><div class="v57-drawer-title">${input.id?'Editar compromisso':'Novo compromisso'}</div><div class="v57-drawer-sub">Organize data, horário, tipo e próximo passo comercial.</div></div><button class="v57-x" data-close-drawer>×</button></div>
      <div class="v57-drawer-body"><div class="v57-form-grid">
        <div class="v57-field full"><label>Título</label><input class="v57-input" id="v57EvTitle" value="${esc(ev.title||'')}" placeholder="Ex: Reunião de diagnóstico"></div>
        <div class="v57-field"><label>Data</label><input class="v57-input" id="v57EvDate" type="date" value="${esc(ev.data)}"></div>
        <div class="v57-field"><label>Hora</label><input class="v57-input" id="v57EvHour" type="time" value="${esc(ev.hora||'09:00')}"></div>
        <div class="v57-field"><label>Tipo</label><select class="v57-select" id="v57EvType">${['Ligação','Reunião','Follow-up','Tarefa','Proposta','Pessoal'].map(t=>`<option ${ev.tipo===t?'selected':''}>${t}</option>`).join('')}</select></div>
        <div class="v57-field"><label>Prioridade</label><select class="v57-select" id="v57EvPriority">${['Baixa','Média','Alta'].map(t=>`<option ${ev.prioridade===t?'selected':''}>${t}</option>`).join('')}</select></div>
        <div class="v57-field full"><label>Lead vinculado</label><select class="v57-select" id="v57EvLead"><option value="">Sem lead vinculado</option>${leads.map(l=>`<option ${ev.leadNome===l.nome?'selected':''}>${esc(l.nome)}</option>`).join('')}</select></div>
        <div class="v57-field full"><label>Notas / preparação</label><textarea class="v57-textarea" id="v57EvNotes" placeholder="Objetivo, contexto, perguntas SPIN, combinados...">${esc(ev.notas||'')}</textarea></div>
      </div></div>
      <div class="v57-drawer-actions">${input.id?'<button class="v57-btn ghost" data-delete-event>Excluir</button>':''}<button class="v57-btn ghost" data-close-drawer>Cancelar</button><button class="v57-btn primary" data-save-event>${input.id?'Salvar alterações':'Salvar compromisso'}</button></div>`;
    back.classList.add('open'); drawer.classList.add('open');
    $$('[data-close-drawer]').forEach(b=>b.addEventListener('click',closeEventDrawer));
    $('[data-save-event]')?.addEventListener('click',()=>saveEvent(input.id));
    $('[data-delete-event]')?.addEventListener('click',()=>deleteEvent(input.id));
  }
  function closeEventDrawer(){ $('#v57AgendaBackdrop')?.classList.remove('open'); $('#v57AgendaDrawer')?.classList.remove('open'); }
  function saveEvent(id){
    const list=loadEvents();
    const ev={id:id || ('ev'+Date.now()), title:$('#v57EvTitle')?.value?.trim() || 'Compromisso', data:$('#v57EvDate')?.value || today(), hora:$('#v57EvHour')?.value || '09:00', tipo:$('#v57EvType')?.value || 'Reunião', prioridade:$('#v57EvPriority')?.value || 'Média', leadNome:$('#v57EvLead')?.value || '', notas:$('#v57EvNotes')?.value || ''};
    const idx=list.findIndex(x=>x.id===id); if(idx>=0) list[idx]=normalizeEvent(ev); else list.push(normalizeEvent(ev));
    saveEvents(list); agendaState.anchor=ev.data; saveUI(); closeEventDrawer(); renderAgenda(); notify('Compromisso salvo','success');
  }
  function deleteEvent(id){ if(!id) return; saveEvents(loadEvents().filter(e=>e.id!==id)); closeEventDrawer(); renderAgenda(); notify('Compromisso excluído','success'); }

  /* ===== Follow-ups delegados para CRM V63 ===== */
  let followView='execucao';
  function setFollowView(v){
    const txt=String(v||'').toLowerCase();
    if(/kanban/.test(txt)) followView='kanban';
    else if(/lista|exec/.test(txt)) followView='execucao';
    else if(/cad/.test(txt)) followView='cadencias';
    else followView='execucao';
    if(window.CRMV63Followups && typeof window.CRMV63Followups.setTab === 'function') window.CRMV63Followups.setTab(followView);
    else setTimeout(()=>window.CRMV63Followups?.setTab?.(followView),80);
  }
  function renderFollowups(){
    if(window.CRMV63Followups && typeof window.CRMV63Followups.render === 'function') window.CRMV63Followups.render();
    else setTimeout(()=>window.CRMV63Followups?.render?.(),80);
  }

  /* ===== Ligações definitiva ===== */
  let callSearch='', callActive='';
  function renderCalls(){
    const sec=ensureSection('ligacoes','agenda');
    const leads=getLeads().filter(l=>String(l.telefone||'').replace(/\D/g,'').length>=8);
    if(!callActive && leads[0]) callActive = leads[0].nome;
    sec.innerHTML = `<div class="v57-shell"><div class="v57-card v57-board-toolbar"><div><div class="v57-cal-title">Ligações</div><div class="v57-cal-sub">Clique no telefone ou em Ligar agora para abrir o celular conectado ao PC pelo protocolo <b>tel:+55</b>.</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="v57CallSearch" class="v57-input" style="width:260px" placeholder="Buscar lead ou telefone" value="${esc(callSearch)}"><button class="v57-btn" data-best-call>Próximo melhor lead</button></div></div><div class="v57-call-grid"><div class="v57-card"><div class="v57-kpi-grid" style="padding:14px"><div class="v57-soft-card" style="padding:14px"><b>${leads.length}</b><br><span style="font-size:12px;color:rgba(44,44,42,.58);font-weight:700">Com telefone</span></div><div class="v57-soft-card" style="padding:14px"><b>${leads.filter(l=>l.followup && l.followup<=today()).length}</b><br><span style="font-size:12px;color:rgba(44,44,42,.58);font-weight:700">Para ligar hoje</span></div><div class="v57-soft-card" style="padding:14px"><b>${leads.filter(l=>l.prioridade==='Alta').length}</b><br><span style="font-size:12px;color:rgba(44,44,42,.58);font-weight:700">Alta prioridade</span></div></div><div id="v57CallRows"></div></div><aside class="v57-call-panel" id="v57CallPanel"></aside></div></div>`;
    $('#v57CallSearch')?.addEventListener('input',e=>{callSearch=e.target.value; renderCallRows();});
    $('[data-best-call]')?.addEventListener('click',()=>{ const q=callQueue(); if(q[0]){callActive=q[0].nome; renderCalls(); notify('Próximo melhor lead selecionado','success');} });
    renderCallRows(); renderCallPanel(); bindNav();
  }
  function callQueue(){ const q=norm(callSearch); return getLeads().filter(l=>String(l.telefone||'').replace(/\D/g,'').length>=8).filter(l=>!q || norm([l.nome,l.telefone,l.segmento,l.responsavel].join(' ')).includes(q)).sort((a,b)=>scoreCall(b)-scoreCall(a)); }
  function scoreCall(l){ return (l.followup&&l.followup<=today()?60:0)+(l.prioridade==='Alta'?30:l.prioridade==='Média'?12:0)+(l.etapa==='Proposta'?25:0)+(Number(l.valor)||0)/1000; }
  function renderCallRows(){
    const box=$('#v57CallRows'); if(!box) return; const rows=callQueue();
    box.innerHTML = rows.length ? rows.map(l=>`<div class="v57-call-row" data-call-select="${esc(l.nome)}"><div><b>${esc(l.nome)}</b><div style="font-size:12px;color:rgba(44,44,42,.56);font-weight:700;margin-top:2px">${esc(l.segmento||'Sem segmento')} • ${esc(l.etapa||'Lead')}</div></div><span class="v57-pill">${esc(l.prioridade||'Média')}</span><a class="v57-phone-link" href="${telHref(l.telefone)}">☎ ${esc(l.telefone)}</a><span class="v57-pill">${Math.round(scoreCall(l))}</span><div class="v57-card-actions"><a class="v57-mini-btn" href="${telHref(l.telefone)}" data-call-now="${esc(l.nome)}">Ligar</a><a class="v57-mini-btn" href="${waHref(l.telefone)}" target="_blank">WhatsApp</a></div></div>`).join('') : '<div class="v57-empty">Nenhum lead com telefone encontrado.</div>';
    $$('[data-call-select]').forEach(r=>r.addEventListener('click',e=>{ if(e.target.closest('a')) return; callActive=r.dataset.callSelect; renderCallPanel(); }));
    $$('[data-call-now]').forEach(a=>a.addEventListener('click',()=>{ callActive=a.dataset.callNow; registerCall('Ligação iniciada'); }));
  }
  function renderCallPanel(){
    const box=$('#v57CallPanel'); if(!box) return; const l=getLeads().find(x=>x.nome===callActive) || callQueue()[0];
    if(!l){ box.innerHTML='<div class="v57-empty" style="color:#fff">Selecione um lead.</div>'; return; }
    box.innerHTML = `<div class="v57-call-name">${esc(l.nome)}</div><div style="opacity:.75;font-weight:700;margin-top:4px">${esc(l.segmento||'Sem segmento')} • ${esc(l.responsavel||'Sem responsável')}</div><div class="v57-call-phone">${esc(l.telefone||'Sem telefone')}</div><div class="v57-card-actions"><a class="v57-btn primary" href="${telHref(l.telefone)}" data-call-now="${esc(l.nome)}">Ligar agora</a><a class="v57-btn" href="${waHref(l.telefone)}" target="_blank">WhatsApp</a><button class="v57-btn" data-open-lead="${esc(l.nome)}">Abrir lead</button></div><div style="margin-top:18px;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;opacity:.58">Resultado da ligação</div><div class="v57-outcomes">${['Atendeu','Não atendeu','Reunião marcada','Sem interesse','Número errado','Caixa postal'].map(o=>`<button class="v57-btn" data-call-outcome="${o}">${o}</button>`).join('')}</div><div class="v57-field" style="margin-top:14px"><label style="color:rgba(255,255,255,.68)">Observação</label><textarea id="v57CallNote" class="v57-textarea" placeholder="Ex: pediu retorno amanhã..." style="background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.20);color:#fff"></textarea></div>`;
    $$('[data-open-lead]',box).forEach(b=>b.addEventListener('click',()=>openLead(b.dataset.openLead)));
    $$('[data-call-outcome]',box).forEach(b=>b.addEventListener('click',()=>registerCall(b.dataset.callOutcome)));
    $$('[data-call-now]',box).forEach(a=>a.addEventListener('click',()=>registerCall('Ligação iniciada')));
  }
  function registerCall(outcome){
    const l=getLeads().find(x=>x.nome===callActive); if(!l) return;
    l.atividades = Array.isArray(l.atividades) ? l.atividades : [];
    l.atividades.unshift({id:'call'+Date.now(),tipo:'Ligação',texto:`${outcome}${$('#v57CallNote')?.value ? ' — '+$('#v57CallNote').value : ''}`,data:new Date().toISOString(),autor:'Você'});
    if(outcome==='Não atendeu' || outcome==='Caixa postal') { l.etapaFollowup='Tentativa 2'; l.followup=addDays(today(),1); }
    if(outcome==='Reunião marcada') { l.etapaFollowup='Negociação'; l.followup=addDays(today(),2); }
    l.ultimaAtualizacao=today(); saveLeads(); notify('Ligação registrada no histórico do lead','success');
  }

  /* ===== Inteligência Comercial ===== */
  let intelTab='playbooks';
  function setIntelTab(t){ if(/obje/.test(t)) intelTab='objeções'; else if(/script/.test(t)) intelTab='scripts'; else if(/material/.test(t)) intelTab='materiais'; else if(/ia/.test(t)) intelTab='ia'; else intelTab='playbooks'; renderIntelligence(); }
  const scripts={
    abertura:'Oi, tudo bem? Vi que vocês podem estar buscando melhorar previsibilidade comercial. Posso te fazer uma pergunta rápida para entender se faz sentido?',
    proposta:'Queria retomar a proposta pensando no impacto prático. O que precisa estar claro para vocês avançarem com segurança?',
    breakup:'Como não consegui retorno, vou encerrar por aqui por enquanto. Se fizer sentido retomar depois, fico à disposição.'
  };
  function renderIntelligence(forceTab){ if(forceTab) intelTab=forceTab; const sec=$('#playbooks'); if(!sec) return; sec.innerHTML=`<div class="v57-shell"><div class="v57-card v57-board-toolbar"><div><div class="v57-cal-title">Inteligência Comercial</div><div class="v57-cal-sub">Playbooks, scripts, objeções, materiais e IA local em uma área única de execução.</div></div><div class="v57-tabs">${['playbooks','scripts','objeções','materiais','ia'].map(t=>`<button data-intel-tab="${t}" class="${intelTab===t?'active':''}">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div></div><div id="v57IntelBody"></div></div>`; $$('[data-intel-tab]').forEach(b=>b.addEventListener('click',()=>{intelTab=b.dataset.intelTab; renderIntelligence();})); renderIntelBody(); }
  function renderIntelBody(){ const b=$('#v57IntelBody'); if(!b) return; if(intelTab==='scripts') b.innerHTML=`<div class="v57-template-grid">${Object.entries(scripts).map(([k,v])=>`<div class="v57-card v57-template"><div style="font-weight:950;color:var(--v57-green);margin-bottom:8px">Script ${k}</div><p style="font-size:13px;line-height:1.55;color:rgba(44,44,42,.70)">${esc(v)}</p><div class="v57-card-actions"><button class="v57-mini-btn" data-copy="${esc(v)}">Copiar</button><button class="v57-mini-btn">Usar no WhatsApp</button><button class="v57-mini-btn">Criar follow-up</button></div></div>`).join('')}</div>`; else if(intelTab==='objeções') b.innerHTML=`<div class="v57-template-grid">${['Está caro','Vou pensar','Já tenho fornecedor','Sem tempo agora'].map(o=>`<div class="v57-card v57-template"><div style="font-weight:950;color:var(--v57-green)">${o}</div><p style="font-size:13px;color:rgba(44,44,42,.70);line-height:1.55">Resposta consultiva, pergunta de diagnóstico e próximo passo prático para continuar a conversa.</p><div class="v57-card-actions"><button class="v57-mini-btn">Copiar</button><button class="v57-mini-btn">Salvar no lead</button></div></div>`).join('')}</div>`; else if(intelTab==='ia') b.innerHTML=`<div class="v57-card" style="padding:18px;max-width:820px"><div class="v57-form-grid"><div class="v57-field"><label>Segmento</label><input class="v57-input" id="v57IaSeg" placeholder="Ex: restaurantes"></div><div class="v57-field"><label>Canal</label><select class="v57-select" id="v57IaCanal"><option>WhatsApp</option><option>Ligação</option><option>E-mail</option></select></div><div class="v57-field full"><label>Dor principal</label><textarea class="v57-textarea" id="v57IaDor" placeholder="Qual problema vamos abordar?"></textarea></div></div><button class="v57-btn primary" style="margin-top:12px" data-generate-script>Gerar script local</button><div id="v57IaOut" class="v57-soft-card" style="padding:14px;margin-top:14px;display:none"></div></div>`; else b.innerHTML=`<div class="v57-template-grid">${['Prospecção consultiva','Proposta enviada','Reativação','Negociação final'].map(p=>`<div class="v57-card v57-template"><div style="font-weight:950;color:var(--v57-green);margin-bottom:6px">${p}</div><p style="font-size:13px;color:rgba(44,44,42,.68);line-height:1.55">Checklist, abordagem, script e automações sugeridas para esta etapa.</p><div class="v57-card-actions"><button class="v57-mini-btn">Aplicar em lead</button><button class="v57-mini-btn">Usar em ligação</button><button class="v57-mini-btn">WhatsApp</button></div></div>`).join('')}</div>`; bindIntel(); }
  function bindIntel(){ $$('[data-copy]').forEach(b=>b.addEventListener('click',()=>{navigator.clipboard?.writeText(b.dataset.copy); notify('Script copiado','success');})); $('[data-generate-script]')?.addEventListener('click',()=>{ const seg=$('#v57IaSeg')?.value||'seu segmento'; const dor=$('#v57IaDor')?.value||'melhorar resultados comerciais'; const canal=$('#v57IaCanal')?.value||'WhatsApp'; const out=$('#v57IaOut'); if(out){ out.style.display='block'; out.innerHTML=`<b>Script para ${esc(canal)}</b><p style="font-size:13px;line-height:1.6">Oi, tudo bem? Estou falando com empresas de ${esc(seg)} que querem ${esc(dor)}. Posso te fazer duas perguntas rápidas para entender se existe oportunidade de melhorar isso aí?</p>`; }}); }

  /* ===== Automações visuais ===== */
  let autoTab='modelos';
  function setAutoTab(t){ if(/cria/.test(t)) autoTab='criador'; else if(/hist/.test(t)) autoTab='historico'; else autoTab='modelos'; renderAutomations(); }
  function renderAutomations(){ const sec=$('#automacoes'); if(!sec) return; sec.innerHTML=`<div class="v57-shell"><div class="v57-card v57-board-toolbar"><div><div class="v57-cal-title">Automações</div><div class="v57-cal-sub">Regras simples no formato: quando acontecer isso → se tiver condição → então executar ação.</div></div><div class="v57-tabs">${['modelos','criador','historico'].map(t=>`<button data-auto-tab="${t}" class="${autoTab===t?'active':''}">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div></div><div id="v57AutoBody"></div></div>`; $$('[data-auto-tab]').forEach(b=>b.addEventListener('click',()=>{autoTab=b.dataset.autoTab; renderAutomations();})); renderAutoBody(); }
  function renderAutoBody(){ const b=$('#v57AutoBody'); if(!b) return; if(autoTab==='criador') b.innerHTML=`<div class="v57-auto-flow"><div class="v57-step"><div class="v57-step-label">Quando</div><select class="v57-select"><option>Lead entrar em Proposta</option><option>Follow-up vencer</option><option>Ligação não atendida</option></select></div><div class="v57-step"><div class="v57-step-label">Se</div><select class="v57-select"><option>Não tiver próximo follow-up</option><option>Prioridade for Alta</option><option>Valor acima de R$ 5.000</option></select></div><div class="v57-step"><div class="v57-step-label">Então</div><select class="v57-select"><option>Criar follow-up em 2 dias</option><option>Marcar prioridade alta</option><option>Criar compromisso na agenda</option></select></div><button class="v57-btn primary" data-save-auto>Salvar automação</button></div>`; else if(autoTab==='historico') b.innerHTML=`<div class="v57-card" style="padding:18px"><div class="v57-empty">Histórico preparado para mostrar execuções futuras: regra, lead afetado, data e alteração realizada.</div></div>`; else b.innerHTML=`<div class="v57-template-grid">${['Recuperar follow-ups vencidos','Criar rotina diária','Avançar proposta parada','Pós-ligação não atendida','Reativar leads antigos','Onboarding após fechamento'].map(t=>`<div class="v57-card v57-template"><div style="font-weight:950;color:var(--v57-green);margin-bottom:6px">${t}</div><p style="font-size:13px;color:rgba(44,44,42,.68)">Modelo pronto com gatilho, condição e ação sugerida.</p><button class="v57-mini-btn" data-use-template="${t}">Usar modelo</button></div>`).join('')}</div>`; $$('[data-use-template]').forEach(x=>x.addEventListener('click',()=>{autoTab='criador'; renderAutomations(); notify('Modelo carregado no criador visual','success');})); $('[data-save-auto]')?.addEventListener('click',()=>notify('Automação salva como modelo visual','success')); }

  function init(){
    buildSidebar();
    ensureSection('ligacoes','agenda');
    // Esconde resquícios visuais de camadas antigas que criavam topbars/rails extras.
    $$('.topbar-tabs,.rail,.v51-top-tabs,.v52-rail,.v53-rail,.v56-sidebar-toggle,.sidebar-toggle,[data-sidebar-toggle]').forEach(el=>el.classList.add('v57-disabled-layer'));
    bindNav();
    setTimeout(()=>renderOfficial($('.view.active')?.id || 'inicio'),60);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
