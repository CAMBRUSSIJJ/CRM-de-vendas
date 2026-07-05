/* CRM v55 — agenda tipo calendário profissional, follow-ups em layout de pipeline,
   ligações clicáveis e sidebar sem setas. Esta versão substitui as camadas antigas
   de Agenda/Ligações/Follow-ups para evitar páginas sobrepostas. */
(function(){
  'use strict';
  if(window.__crmV55OfficialFix) return;
  window.__crmV55OfficialFix = true;

  const DOC = document;
  const $ = (s,r=DOC)=>r.querySelector(s);
  const $$ = (s,r=DOC)=>Array.from(r.querySelectorAll(s));
  const KEY_LEADS = 'outbounder_leads_v5';
  const KEY_EVENTS = 'outbounder_agenda_v1';
  const KEY_EVENTS_V41 = 'crm_v41_events';
  const KEY_CAL_DATE = 'crm_v55_calendar_date';
  const KEY_CAL_VIEW = 'crm_v55_calendar_view';
  const KEY_CAL_FILTERS = 'crm_v55_calendar_filters';
  const KEY_SIDEBAR = 'crm_v55_sidebar_collapsed';
  const KEY_CALL_CFG = 'outbounder_call_cfg_v9';
  const KEY_CALL_SEARCH = 'crm_v55_call_search';
  const KEY_CALL_FILTER = 'crm_v55_call_filter';
  const KEY_SELECTED_CALL = 'crm_v55_selected_call';
  const KEY_FU_VIEW = 'crm_v55_followup_view';
  const KEY_FU_SEARCH = 'crm_v55_followup_search';
  const KEY_FU_STAGE_FILTER = 'crm_v55_followup_stage_filter';
  const KEY_FU_STAGES = 'crm_v55_followup_stages';
  const KEY_FU_EXEC = 'crm_v55_followup_exec_index';

  const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const WEEKDAYS = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
  const WEEKDAYS_SHORT = ['dom','seg','ter','qua','qui','sex','sáb'];
  const DEFAULT_FU_STAGES = ['Primeiro contato','Tentativa 2','Nutrição','Proposta enviada','Negociação','Reativação','Break-up','Concluído'];
  const EVENT_TYPES = ['Reunião','Ligação','WhatsApp','E-mail','Follow-up','Proposta','Tarefa','Pessoal'];
  const PRIORITIES = ['Alta','Média','Baixa'];
  const AGENDA_LAYERS = [
    {id:'comercial', label:'Comercial'},
    {id:'followups', label:'Follow-ups'},
    {id:'pessoal', label:'Pessoal'},
    {id:'time', label:'Time'}
  ];
  const state = {
    activeView: '',
    rendering: false,
    calDate: parseDate(localStorage.getItem(KEY_CAL_DATE) || todayISO()),
    calView: localStorage.getItem(KEY_CAL_VIEW) || 'month',
    selectedCall: localStorage.getItem(KEY_SELECTED_CALL) || ''
  };

  function esc(v){return String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function readJSON(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f;}catch(e){return f;}}
  function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function todayISO(){return new Date().toISOString().slice(0,10);}
  function parseDate(v){const d=new Date(String(v||todayISO()).slice(0,10)+'T12:00:00');return isNaN(d)?new Date():d;}
  function toISO(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate(),12).toISOString().slice(0,10);}
  function pad(n){return String(n).padStart(2,'0');}
  function dateBR(v){try{return parseDate(v).toLocaleDateString('pt-BR');}catch(e){return v||'—';}}
  function monthLabel(d){return MONTHS[d.getMonth()]+' de '+d.getFullYear();}
  function addDays(base,n){const d=parseDate(base);d.setDate(d.getDate()+Number(n||0));return toISO(d);}
  function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function digits(v){return String(v||'').replace(/\D/g,'');}
  function money(v){const n=Number(v||0);return n? n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'R$ 0';}
  function initials(v){return String(v||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?';}
  function toast(msg,type='success'){try{(window.crmToast||window.showToast||window.toastV5||window.toast||console.log)(msg,type);}catch(e){console.log(msg);}}

  function getLeads(){
    try{ if(typeof window.crmGetLeads==='function') return window.crmGetLeads()||[]; }catch(e){}
    try{ if(Array.isArray(window.leads)) return window.leads; }catch(e){}
    const arr=readJSON(KEY_LEADS,[]); return Array.isArray(arr)?arr:[];
  }
  function saveLeads(arr){
    const list=Array.isArray(arr)?arr:getLeads();
    try{ if(Array.isArray(window.leads)){ window.leads.splice(0,window.leads.length,...list); } else window.leads=list; }catch(e){}
    try{ if(typeof window.crmSaveLeads==='function'){ window.crmSaveLeads(); return; } }catch(e){}
    try{ if(typeof window.saveLeads==='function'){ window.saveLeads(); return; } }catch(e){}
    writeJSON(KEY_LEADS,list);
    try{DOC.dispatchEvent(new CustomEvent('crm:leads-updated'));}catch(e){}
  }
  function leadId(l){return String(l?.id || l?.nome || '');}
  function findLead(ref){const r=String(ref||'');return getLeads().find(l=>String(l.id||'')===r || String(l.nome||'')===r || String(l.empresa||'')===r);}
  function openLead(ref){
    try{ if(typeof window.crmOpenLead==='function') return window.crmOpenLead(ref); }catch(e){}
    try{ if(typeof window.openDetail==='function') return window.openDetail(ref); }catch(e){}
    navigate('leads'); setTimeout(()=>toast('Abra o lead pela lista de Leads.'),120);
  }
  function isClosed(l){return ['Fechado','Perdido','Cliente'].includes(String(l?.etapa||''));}

  function normalizeEvent(raw,source){
    const id = String(raw.id || raw._id || raw.uuid || `${source||'ev'}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`);
    const data = String(raw.data || raw.date || raw.dia || todayISO()).slice(0,10);
    const hora = String(raw.hora || raw.time || raw.hour || '09:00').slice(0,5);
    const titulo = raw.titulo || raw.title || raw.leadNome || raw.lead || raw.nome || raw.tipo || 'Compromisso';
    const tipo = raw.tipo || raw.type || 'Reunião';
    const prioridade = raw.prioridade || raw.priority || 'Média';
    const leadNome = raw.leadNome || raw.lead || raw.leadName || '';
    const notas = raw.notas || raw.notes || raw.descricao || '';
    const agenda = raw.agenda || raw.layer || (tipo==='Pessoal'?'pessoal': tipo==='Follow-up'?'followups':'comercial');
    return {...raw,id,data,date:data,hora,time:hora,titulo,title:titulo,tipo,type:tipo,prioridade,priority:prioridade,leadNome,notas,notes:notas,agenda,layer:agenda,recurrence:raw.recurrence||raw.recorrencia||'Não repete',color:raw.color||''};
  }
  function getSavedEvents(){
    const main=readJSON(KEY_EVENTS,[]); const legacy=readJSON(KEY_EVENTS_V41,[]);
    const all=[]; const seen=new Set();
    [Array.isArray(main)?main:[], Array.isArray(legacy)?legacy:[]].flat().forEach((e,i)=>{
      const ev=normalizeEvent(e, e?.id?'':'legacy'+i);
      if(seen.has(ev.id)) return; seen.add(ev.id); all.push(ev);
    });
    return all;
  }
  function saveSavedEvents(arr){writeJSON(KEY_EVENTS,(arr||[]).map(normalizeEvent));}
  function virtualFollowups(){
    return getLeads().filter(l=>l && l.followup && !isClosed(l)).map(l=>normalizeEvent({
      id:'fu_'+leadId(l),data:String(l.followup).slice(0,10),hora:'09:00',titulo:'Follow-up: '+(l.nome||'Lead'),tipo:'Follow-up',prioridade:l.prioridade||'Média',leadNome:l.nome||'',notas:followupStage(l),agenda:'followups',virtual:true,leadId:leadId(l)
    },'fu'));
  }
  function allEvents(){
    const saved=getSavedEvents();
    const savedIds=new Set(saved.map(e=>e.id));
    return saved.concat(virtualFollowups().filter(e=>!savedIds.has(e.id))).sort((a,b)=>String(a.data+a.hora).localeCompare(String(b.data+b.hora)) || String(a.titulo).localeCompare(String(b.titulo),'pt-BR'));
  }
  function eventById(id){return allEvents().find(e=>String(e.id)===String(id));}
  function upsertEvent(patch){
    const arr=getSavedEvents().filter(e=>!e.virtual);
    const id=patch.id || 'ag_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
    const ev=normalizeEvent({...patch,id},'ag');
    const idx=arr.findIndex(e=>String(e.id)===String(id));
    if(idx>=0) arr[idx]={...arr[idx],...ev}; else arr.push(ev);
    saveSavedEvents(arr); return ev;
  }
  function deleteEvent(id){saveSavedEvents(getSavedEvents().filter(e=>String(e.id)!==String(id)));}

  function getCalFilters(){
    const def={q:'',types:Object.fromEntries(EVENT_TYPES.map(t=>[t,true])),layers:Object.fromEntries(AGENDA_LAYERS.map(a=>[a.id,true])),density:'comfortable'};
    return Object.assign(def,readJSON(KEY_CAL_FILTERS,{}));
  }
  function saveCalFilters(f){writeJSON(KEY_CAL_FILTERS,f);}
  function filteredEvents(){
    const f=getCalFilters(); const q=norm(f.q||'');
    return allEvents().filter(e=>{
      const typeOk=f.types?.[e.tipo]!==false;
      const layerOk=f.layers?.[e.agenda]!==false;
      const qOk=!q || norm([e.titulo,e.leadNome,e.tipo,e.prioridade,e.notas].join(' ')).includes(q);
      return typeOk && layerOk && qOk;
    });
  }
  function eventsOn(iso){return filteredEvents().filter(e=>e.data===iso);}

  function ensureViews(){
    const main=$('main.main')||$('.main')||DOC.body;
    if(!$('#ligacoes')) main.insertAdjacentHTML('beforeend','<section id="ligacoes" class="view grid-view"></section>');
    ensureNavButton('ligacoes','Ligações','#ic-phone','agenda');
    ensureDrawers();
  }
  function ensureNavButton(view,label,iconRef,afterView){
    const afterSel = afterView ? `[data-view="${afterView}"]` : null;
    if(!$(`.sidebar-nav [data-view="${view}"]`)){
      const btn=DOC.createElement('button'); btn.type='button'; btn.className='nav-item'; btn.dataset.view=view; btn.dataset.label=label; btn.title=label; btn.setAttribute('aria-label',label);
      btn.innerHTML=`<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><use href="${iconRef}"></use></svg><span>${esc(label)}</span>`;
      const ref=afterSel? $(`.sidebar-nav ${afterSel}`):null; (ref?.parentNode||$('.sidebar-nav'))?.insertBefore(btn, ref?.nextSibling||null);
    }
    if(!$(`.topbar-tabs [data-view="${view}"]`)){
      const t=DOC.createElement('button'); t.type='button'; t.className='tab'; t.dataset.view=view; t.textContent=label; t.title=label; t.setAttribute('aria-label',label);
      const ref=afterSel? $(`.topbar-tabs ${afterSel}`):null; (ref?.parentNode||$('.topbar-tabs'))?.insertBefore(t, ref?.nextSibling||null);
    }
  }

  function installSidebar(){
    DOC.body.classList.add('crm-v55');
    ['crm-v54','crm-v54-view-agenda','crm-v54-view-ligacoes','crm-v54-sidebar-collapsed','crm-v53-sidebar-collapsed','crm-v52-sidebar-collapsed','crm-v51-sidebar-collapsed','crm-sidebar-pinned','crm-v46-sidebar-fixed','crm-v46-sidebar-icons'].forEach(c=>DOC.body.classList.remove(c));
    $('#v54SidebarGrip')?.remove(); $('#v54SidebarEdge')?.remove(); $('#v53SidebarHandle')?.remove(); $('#v52SidebarToggle')?.remove(); $('#v51SidebarToggle')?.remove();
    $$('.v51-group-chevron,.crm-v49-chevron,.nav-chevron,.sidebar-chevron,[class*="chevron"]').forEach(x=>x.remove());
    $$('.nav-item,.v51-nav-main,.crm-v49-nav-main,.tab').forEach(b=>{const label=b.dataset.label||b.title||b.textContent.trim(); if(label){b.title=label;b.setAttribute('aria-label',label);b.dataset.v55Tooltip=label;}});
    const brand=$('.sidebar-brand');
    if(brand && !$('#v55SidebarControl')){
      brand.insertAdjacentHTML('beforeend','<button type="button" class="v55-sidebar-control" id="v55SidebarControl" aria-label="Recolher menu" title="Recolher menu"><span></span><span></span><span></span></button>');
    }
    if(!$('#v55SidebarHandle')) DOC.body.insertAdjacentHTML('beforeend','<button type="button" class="v55-sidebar-handle" id="v55SidebarHandle" aria-label="Recolher menu lateral" title="Recolher menu lateral"><span></span><span></span><span></span></button>');
    setSidebarCollapsed(localStorage.getItem(KEY_SIDEBAR)==='1',false);
  }
  function setSidebarCollapsed(collapsed,showToast){
    DOC.body.classList.toggle('crm-v55-sidebar-collapsed',collapsed);
    localStorage.setItem(KEY_SIDEBAR,collapsed?'1':'0');
    $$('#v55SidebarControl,#v55SidebarHandle').forEach(b=>{b.setAttribute('aria-label',collapsed?'Expandir menu lateral':'Recolher menu lateral');b.title=collapsed?'Expandir menu lateral':'Recolher menu lateral';});
    if(showToast) toast(collapsed?'Menu recolhido':'Menu expandido');
  }

  function activeView(){return $('.view.active')?.id || $$('.nav-item.active,.tab.active,.crm-v49-nav-main.active,.v51-nav-main.active').find(x=>x.dataset.view)?.dataset.view || state.activeView || 'inicio';}
  function navigate(view){
    try{if(typeof window.setView==='function'){window.setView(view); scheduleRender(); return;}}catch(e){}
    const b=$(`[data-view="${CSS.escape(view)}"]`); if(b) b.click(); scheduleRender();
  }
  function setTopbar(title,sub){const t=$('#topbarTitle'),s=$('#topbarSub'); if(t)t.textContent=title; if(s)s.textContent=sub;}
  function scheduleRender(){setTimeout(renderActive,40);setTimeout(renderActive,180);setTimeout(renderActive,420);}
  function renderActive(){
    ensureViews(); installSidebar();
    const v=activeView(); state.activeView=v;
    if(v==='agenda') {setTopbar('Agenda','Calendário profissional com mês, dia, ano e criação por clique.'); renderAgenda();}
    if(v==='ligacoes') {setTopbar('Ligações','Discagem pelo celular conectado ao PC com números clicáveis.'); renderCalls();}
    if(v==='cadencias') {setTopbar('Follow-ups','Layout de pipeline para organizar etapas de acompanhamento.'); renderFollowups();}
  }

  function agendaTitle(){
    const d=state.calDate;
    if(state.calView==='day') return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
    if(state.calView==='year') return String(d.getFullYear());
    if(state.calView==='list') return 'Lista de compromissos';
    return monthLabel(d);
  }
  function renderAgenda(){
    const page=$('#agenda'); if(!page) return;
    if(state.rendering) return; state.rendering=true;
    page.className='view grid-view active v55-page v55-agenda-page';
    page.dataset.v55Official='agenda';
    const f=getCalFilters();
    page.innerHTML=`
      <div class="v55-agenda-layout ${f.density==='compact'?'is-compact':''}">
        <aside class="v55-calendar-side">
          <button type="button" class="v55-primary-action" id="v55NewEventBtn">+ Criar evento</button>
          <div class="v55-side-card"><div class="v55-side-title">Mini calendário</div><div id="v55MiniCalendar">${miniCalendar(state.calDate.getFullYear(),state.calDate.getMonth())}</div></div>
          <div class="v55-side-card"><div class="v55-side-title">Minhas agendas</div><div class="v55-check-list">${AGENDA_LAYERS.map(a=>`<label><input type="checkbox" data-v55-layer="${a.id}" ${f.layers?.[a.id]!==false?'checked':''}> <span>${esc(a.label)}</span></label>`).join('')}</div></div>
          <div class="v55-side-card"><div class="v55-side-title">Tipos de evento</div><div class="v55-check-list v55-type-list">${EVENT_TYPES.map(t=>`<label><input type="checkbox" data-v55-type="${esc(t)}" ${f.types?.[t]!==false?'checked':''}> <span>${esc(t)}</span></label>`).join('')}</div></div>
          <div class="v55-side-card"><div class="v55-side-title">Personalização</div><div class="v55-field"><label>Densidade</label><select id="v55CalendarDensity"><option value="comfortable">Confortável</option><option value="compact">Compacta</option></select></div></div>
        </aside>
        <section class="v55-calendar-main">
          <div class="v55-calendar-top">
            <div class="v55-calendar-nav"><button type="button" class="v55-btn" id="v55CalToday">Hoje</button><button type="button" class="v55-icon-btn" id="v55CalPrev" aria-label="Anterior">‹</button><button type="button" class="v55-icon-btn" id="v55CalNext" aria-label="Próximo">›</button><h2 id="v55CalTitle">${esc(agendaTitle())}</h2></div>
            <div class="v55-calendar-actions"><div class="v55-search"><span>⌕</span><input id="v55AgendaSearch" placeholder="Buscar compromisso, lead, tipo..." value="${esc(f.q||'')}"></div><div class="v55-segment">${[['month','Mês'],['day','Dia'],['year','Ano'],['list','Lista']].map(([id,label])=>`<button type="button" data-v55-cal-view="${id}" class="${state.calView===id?'active':''}">${label}</button>`).join('')}</div></div>
          </div>
          <div class="v55-calendar-body">${calendarBody()}</div>
        </section>
      </div>`;
    const density=$('#v55CalendarDensity'); if(density) density.value=f.density||'comfortable';
    state.rendering=false;
  }
  function calendarBody(){
    if(state.calView==='day') return renderDayView();
    if(state.calView==='year') return renderYearView();
    if(state.calView==='list') return renderListView();
    return renderMonthView();
  }
  function miniCalendar(y,m){
    const first=new Date(y,m,1,12), start=new Date(first); start.setDate(first.getDate()-first.getDay());
    let html='<div class="v55-mini-week">'+WEEKDAYS_SHORT.map(w=>`<span>${w[0]}</span>`).join('')+'</div><div class="v55-mini-days">';
    for(let i=0;i<42;i++){const cur=new Date(start);cur.setDate(start.getDate()+i);const iso=toISO(cur);const n=eventsOn(iso).length;html+=`<button type="button" class="${cur.getMonth()===m?'':'muted'} ${iso===todayISO()?'today':''} ${n?'has':''}" data-v55-goto-date="${iso}">${cur.getDate()}</button>`;}
    return html+'</div>';
  }
  function renderMonthView(){
    const d=state.calDate, first=new Date(d.getFullYear(),d.getMonth(),1,12), start=new Date(first); start.setDate(first.getDate()-first.getDay());
    let cells='';
    for(let i=0;i<42;i++){
      const cur=new Date(start); cur.setDate(start.getDate()+i); const iso=toISO(cur); const evs=eventsOn(iso); const inMonth=cur.getMonth()===d.getMonth();
      cells+=`<div class="v55-day ${inMonth?'':'muted'} ${iso===todayISO()?'today':''}" data-v55-new-date="${iso}"><div class="v55-day-head"><button type="button" class="v55-day-number" data-v55-goto-date="${iso}">${cur.getDate()}</button><button type="button" class="v55-day-plus" data-v55-new-date="${iso}">+</button></div><div class="v55-day-events">${evs.slice(0,4).map(eventChip).join('')}${evs.length>4?`<button type="button" class="v55-more" data-v55-goto-date="${iso}">+${evs.length-4} mais</button>`:''}</div></div>`;
    }
    return `<div class="v55-week-row">${WEEKDAYS_SHORT.map(w=>`<span>${w}</span>`).join('')}</div><div class="v55-month-grid">${cells}</div>`;
  }
  function eventChip(e){return `<button type="button" class="v55-event-chip ${e.virtual?'virtual':''} ${norm(e.prioridade)}" data-v55-event="${esc(e.id)}"><time>${esc(e.hora)}</time><span>${esc(e.titulo)}</span></button>`;}
  function renderDayView(){
    const iso=toISO(state.calDate); const evs=eventsOn(iso); const byHour={}; evs.forEach(e=>{const h=Math.max(6,Math.min(22,Number(String(e.hora||'09:00').slice(0,2))||9)); (byHour[h] ||= []).push(e);});
    let rows='';
    for(let h=6;h<=22;h++) rows+=`<div class="v55-hour-label">${pad(h)}:00</div><div class="v55-hour-slot" data-v55-new-date="${iso}" data-v55-new-hour="${pad(h)}:00">${(byHour[h]||[]).map(e=>`<button type="button" class="v55-day-event ${e.virtual?'virtual':''}" data-v55-event="${esc(e.id)}"><b>${esc(e.titulo)}</b><span>${esc(e.hora)} • ${esc(e.tipo)} • ${esc(e.prioridade)}</span></button>`).join('') || '<span class="v55-slot-hint">Clique para criar evento</span>'}</div>`;
    return `<div class="v55-day-header"><b>${esc(WEEKDAYS[state.calDate.getDay()])}</b><strong>${state.calDate.getDate()}</strong><span>${esc(MONTHS[state.calDate.getMonth()])}</span></div><div class="v55-day-grid">${rows}</div>`;
  }
  function renderYearView(){
    const y=state.calDate.getFullYear();
    return `<div class="v55-year-grid">${Array.from({length:12},(_,m)=>`<button type="button" class="v55-year-month" data-v55-open-month="${m}"><div class="v55-year-title"><b>${MONTHS_SHORT[m]}</b><span>${filteredEvents().filter(e=>parseDate(e.data).getFullYear()===y && parseDate(e.data).getMonth()===m).length}</span></div>${miniCalendar(y,m)}</button>`).join('')}</div>`;
  }
  function renderListView(){
    const evs=filteredEvents();
    if(!evs.length) return '<div class="v55-empty">Nenhum compromisso encontrado.</div>';
    let current='';
    return `<div class="v55-list-events">${evs.map(e=>{const day=e.data; const head=day!==current?`<div class="v55-list-date">${dateBR(day)}</div>`:''; current=day; return head+`<button type="button" class="v55-list-event" data-v55-event="${esc(e.id)}"><div><b>${esc(e.titulo)}</b><span>${esc(e.hora)} • ${esc(e.tipo)} • ${esc(e.leadNome||'Sem lead')}</span></div><small>${esc(e.prioridade)}</small></button>`;}).join('')}</div>`;
  }
  function moveCalendar(delta){
    const d=new Date(state.calDate);
    if(state.calView==='day') d.setDate(d.getDate()+delta);
    else if(state.calView==='year') d.setFullYear(d.getFullYear()+delta);
    else d.setMonth(d.getMonth()+delta);
    state.calDate=d; localStorage.setItem(KEY_CAL_DATE,toISO(d)); renderAgenda();
  }
  function setCalView(v){state.calView=v; localStorage.setItem(KEY_CAL_VIEW,v); renderAgenda();}

  function ensureDrawers(){
    if(!$('#v55EventDrawer')) DOC.body.insertAdjacentHTML('beforeend',`<aside class="v55-drawer" id="v55EventDrawer" aria-hidden="true"><div class="v55-drawer-head"><div><h3 id="v55EventTitle">Evento</h3><p id="v55EventSub">Crie ou edite compromissos da agenda.</p></div><button type="button" class="v55-close" data-v55-close>×</button></div><div class="v55-drawer-body" id="v55EventBody"></div><div class="v55-drawer-foot"><button type="button" class="v55-btn danger" id="v55DeleteEvent">Excluir</button><button type="button" class="v55-btn primary" id="v55SaveEvent">Salvar evento</button></div></aside>`);
  }
  function openEventDrawer(seed){
    ensureDrawers();
    const ev=typeof seed==='string'?eventById(seed):seed;
    const isNew=!ev || ev.new; const isVirtual=!!ev?.virtual;
    const data=ev?.data || todayISO(), hora=ev?.hora || '09:00'; const leads=getLeads(); const leadName=ev?.leadNome||'';
    const drawer=$('#v55EventDrawer'); drawer.dataset.eventId=(isVirtual?'':(ev?.id||'')); drawer.dataset.virtual=isVirtual?'1':'0';
    $('#v55EventTitle').textContent=isNew?'Criar evento':(isVirtual?'Transformar follow-up em evento':'Editar evento');
    $('#v55EventSub').textContent=isNew?'Clique em salvar para aparecer no calendário.':'Altere os dados e salve.';
    $('#v55EventBody').innerHTML=`
      ${isVirtual?'<div class="v55-help">Este item veio de follow-up. Ao salvar, ele vira um evento real da agenda.</div>':''}
      <div class="v55-grid-2"><div class="v55-field"><label>Data</label><input id="v55EvDate" type="date" value="${esc(data)}"></div><div class="v55-field"><label>Hora</label><input id="v55EvTime" type="time" value="${esc(hora)}"></div></div>
      <div class="v55-field"><label>Título</label><input id="v55EvTitleInput" value="${esc(ev?.titulo||'Novo compromisso')}" placeholder="Ex: Reunião com lead"></div>
      <div class="v55-grid-2"><div class="v55-field"><label>Tipo</label><select id="v55EvType">${EVENT_TYPES.map(t=>`<option ${t===(ev?.tipo||'Reunião')?'selected':''}>${esc(t)}</option>`).join('')}</select></div><div class="v55-field"><label>Prioridade</label><select id="v55EvPriority">${PRIORITIES.map(p=>`<option ${p===(ev?.prioridade||'Média')?'selected':''}>${esc(p)}</option>`).join('')}</select></div></div>
      <div class="v55-grid-2"><div class="v55-field"><label>Agenda</label><select id="v55EvLayer">${AGENDA_LAYERS.map(a=>`<option value="${a.id}" ${a.id===(ev?.agenda||'comercial')?'selected':''}>${esc(a.label)}</option>`).join('')}</select></div><div class="v55-field"><label>Repetição</label><select id="v55EvRepeat">${['Não repete','Diário','Semanal','Mensal'].map(r=>`<option ${r===(ev?.recurrence||'Não repete')?'selected':''}>${esc(r)}</option>`).join('')}</select></div></div>
      <div class="v55-field"><label>Lead vinculado</label><select id="v55EvLead"><option value="">Sem lead</option>${leads.map(l=>`<option value="${esc(l.nome||'')}" ${String(l.nome||'')===String(leadName)?'selected':''}>${esc(l.nome||'Lead sem nome')}</option>`).join('')}</select></div>
      <div class="v55-field"><label>Notas</label><textarea id="v55EvNotes" rows="4" placeholder="Objetivo, preparação, próximo passo...">${esc(ev?.notas||'')}</textarea></div>
      <div class="v55-event-actions"><button type="button" class="v55-btn" data-v55-event-action="done">Concluir</button><button type="button" class="v55-btn" data-v55-event-action="delay1">Remarcar +1 dia</button><button type="button" class="v55-btn" data-v55-event-action="nextfu">Criar próximo follow-up</button></div>`;
    $('#v55DeleteEvent').style.display=(!isNew && !isVirtual)?'inline-flex':'none';
    drawer.classList.add('show'); drawer.setAttribute('aria-hidden','false');
  }
  function closeEventDrawer(){const d=$('#v55EventDrawer'); if(d){d.classList.remove('show'); d.setAttribute('aria-hidden','true');}}
  function saveEventFromDrawer(){
    const drawer=$('#v55EventDrawer'); if(!drawer) return;
    const id=drawer.dataset.virtual==='1'?'':drawer.dataset.eventId;
    const ev=upsertEvent({id:id||undefined,data:$('#v55EvDate')?.value||todayISO(),hora:$('#v55EvTime')?.value||'09:00',titulo:$('#v55EvTitleInput')?.value||'Compromisso',tipo:$('#v55EvType')?.value||'Reunião',prioridade:$('#v55EvPriority')?.value||'Média',agenda:$('#v55EvLayer')?.value||'comercial',recurrence:$('#v55EvRepeat')?.value||'Não repete',leadNome:$('#v55EvLead')?.value||'',notas:$('#v55EvNotes')?.value||''});
    closeEventDrawer(); renderAgenda(); toast('Evento salvo na agenda.'); return ev;
  }

  function callConfig(){return Object.assign({protocol:'tel',country:'+55'}, readJSON(KEY_CALL_CFG,{}));}
  function fullPhone(phone){let d=digits(phone); if(!d)return''; let cc=String(callConfig().country||'+55').replace(/[^\d+]/g,'')||'+55'; if(!cc.startsWith('+'))cc='+'+cc; if(d.startsWith('00'))d=d.slice(2); if(d.startsWith('55')&&d.length>=12)return '+'+d; return cc+d;}
  function telHref(phone){const cfg=callConfig(), full=fullPhone(phone), plain=full.replace(/\D/g,''); if(!plain)return '#'; if(cfg.protocol==='whatsapp')return 'https://wa.me/'+plain; if(cfg.protocol==='callto')return 'callto:'+full; if(cfg.protocol==='sip')return 'sip:'+full; return 'tel:'+full;}
  function scoreLead(l){let s=20;if(l.prioridade==='Alta')s+=24;if(Number(l.valor)>0)s+=10;if(Number(l.valor)>10000)s+=12;if(l.followup&&String(l.followup).slice(0,10)<=todayISO())s+=25;if(l.telefone)s+=12;return Math.min(100,s);}
  function callQueue(){
    const q=norm(localStorage.getItem(KEY_CALL_SEARCH)||''); const f=localStorage.getItem(KEY_CALL_FILTER)||'';
    let arr=getLeads().filter(l=>!isClosed(l));
    if(q) arr=arr.filter(l=>norm([l.nome,l.telefone,l.email,l.etapa,l.responsavel,l.segmento].join(' ')).includes(q));
    if(f==='hoje') arr=arr.filter(l=>l.followup && String(l.followup).slice(0,10)<=todayISO());
    if(f==='alta') arr=arr.filter(l=>l.prioridade==='Alta');
    if(f==='semfone') arr=arr.filter(l=>!digits(l.telefone));
    if(f==='proposta') arr=arr.filter(l=>String(l.etapa)==='Proposta');
    return arr.sort((a,b)=>scoreLead(b)-scoreLead(a)||String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
  }
  function callsToday(){const t=todayISO();let n=0;getLeads().forEach(l=>(l.atividades||[]).forEach(a=>{if(a.tipo==='Ligação'&&String(a.data||'').slice(0,10)===t)n++;}));return n;}
  function renderCalls(){
    const page=$('#ligacoes'); if(!page) return;
    page.className='view grid-view active v55-page v55-calls-page'; page.dataset.v55Official='ligacoes';
    const leads=getLeads().filter(l=>!isClosed(l)); const queue=callQueue(); const withPhone=leads.filter(l=>digits(l.telefone)).length;
    if(!state.selectedCall || !findLead(state.selectedCall)) state.selectedCall=leadId(queue[0]||{}); localStorage.setItem(KEY_SELECTED_CALL,state.selectedCall||'');
    page.innerHTML=`<div class="v55-page-head"><div><span>Ligações</span><h2>Discador pelo celular conectado ao PC</h2><p>Clique em qualquer número para abrir o discador do Windows usando <b>tel:+55...</b>.</p></div><div class="v55-head-actions"><button type="button" class="v55-btn" id="v55CallBest">Próximo melhor lead</button><button type="button" class="v55-btn primary" id="v55CallRefresh">Atualizar</button></div></div>
      <div class="v55-call-note">Use o aplicativo <b>Vincular ao Celular</b> no Windows como app padrão de chamadas. O CRM abre a ligação, mas não grava áudio.</div>
      <div class="v55-kpi-row"><div><b>${leads.length}</b><span>Leads abertos</span></div><div><b>${withPhone}</b><span>Com telefone</span></div><div><b>${leads.length-withPhone}</b><span>Sem telefone</span></div><div><b>${callsToday()}</b><span>Ligações hoje</span></div></div>
      <div class="v55-call-layout"><section class="v55-call-list-card"><div class="v55-call-tools"><input id="v55CallSearch" value="${esc(localStorage.getItem(KEY_CALL_SEARCH)||'')}" placeholder="Buscar lead, telefone, etapa ou responsável"><select id="v55CallFilter"><option value="">Todos</option><option value="hoje">Vencidos/hoje</option><option value="alta">Alta prioridade</option><option value="proposta">Propostas</option><option value="semfone">Sem telefone</option></select></div><div class="v55-call-list">${queue.length?queue.map(callRow).join(''):'<div class="v55-empty">Nenhum lead na fila.</div>'}</div></section><aside class="v55-dial-card">${dialPanel()}</aside></div>`;
    const filter=$('#v55CallFilter'); if(filter) filter.value=localStorage.getItem(KEY_CALL_FILTER)||'';
  }
  function callRow(l){const id=leadId(l), phone=digits(l.telefone), due=l.followup&&String(l.followup).slice(0,10)<=todayISO();return `<button type="button" class="v55-call-row ${state.selectedCall===id?'active':''}" data-v55-call-select="${esc(id)}"><div class="v55-avatar">${esc(initials(l.nome))}</div><div class="v55-call-info"><b>${esc(l.nome||'Lead sem nome')}</b><span>${esc([l.etapa,l.responsavel,l.segmento].filter(Boolean).join(' • ')||'Sem informações')}</span><div class="v55-tags"><em>${esc(l.prioridade||'Média')}</em>${due?'<em class="warn">Follow-up hoje</em>':''}${phone?'<em class="ok">Telefone ok</em>':'<em class="warn">Sem telefone</em>'}</div>${phone?`<a class="v55-phone" href="${esc(telHref(l.telefone))}" data-v55-call-link="${esc(id)}">${esc(l.telefone)}</a>`:''}</div><strong>${scoreLead(l)}</strong></button>`;}
  function dialPanel(){const l=findLead(state.selectedCall); if(!l)return '<div class="v55-empty">Selecione um lead para abrir o discador.</div>'; const phone=digits(l.telefone);return `<div class="v55-dial-head"><div class="v55-avatar big">${esc(initials(l.nome))}</div><div><h3>${esc(l.nome||'Lead')}</h3><p>${esc([l.etapa,l.responsavel,l.segmento].filter(Boolean).join(' • ')||'Sem informações')}</p></div></div><div class="v55-dial-actions">${phone?`<a class="v55-btn primary" href="${esc(telHref(l.telefone))}" data-v55-call-link="${esc(leadId(l))}">Ligar agora</a><a class="v55-phone" href="${esc(telHref(l.telefone))}" data-v55-call-link="${esc(leadId(l))}">${esc(l.telefone)}</a>`:'<button class="v55-btn primary" disabled>Sem telefone</button>'}<button type="button" class="v55-btn" data-v55-open-lead="${esc(leadId(l))}">Abrir lead</button></div><div class="v55-result-grid">${['Atendeu','Não atendeu','Reunião marcada','Enviar WhatsApp','Sem interesse','Caixa postal'].map(r=>`<button type="button" class="v55-btn" data-v55-call-result="${esc(r)}">${esc(r)}</button>`).join('')}</div><div class="v55-field"><label>Observação</label><textarea id="v55CallNote" rows="3" placeholder="Ex: pediu retorno amanhã..."></textarea></div><div class="v55-script"><b>Script rápido</b>\nOlá, falo com ${esc(l.responsavel||'o responsável')}? Vou ser breve. Hoje vocês conseguem acompanhar oportunidades e follow-ups sem perder retorno?</div>`;}
  function saveCallResult(result){const leads=getLeads(); const l=leads.find(x=>leadId(x)===String(state.selectedCall)); if(!l)return; if(!Array.isArray(l.atividades))l.atividades=[]; const note=($('#v55CallNote')?.value||'').trim(); l.atividades.unshift({id:'call_'+Date.now(),tipo:'Ligação',autor:'CRM',data:new Date().toISOString(),texto:`Resultado: ${result}.${note?' Observação: '+note:''}`}); l.ultimaAtualizacao=todayISO(); if(result==='Não atendeu'||result==='Caixa postal')l.followup=addDays(todayISO(),1); if(result==='Reunião marcada'){l.followup=addDays(todayISO(),2); upsertEvent({titulo:'Reunião: '+(l.nome||'Lead'),leadNome:l.nome||'',data:addDays(todayISO(),2),hora:'09:00',tipo:'Reunião',prioridade:l.prioridade||'Média',notas:'Criado a partir da ligação.'});} if(result==='Sem interesse'){l.prioridade='Baixa';l.followup=addDays(todayISO(),15);} if(result==='Enviar WhatsApp'&&digits(l.telefone)) window.open('https://wa.me/'+fullPhone(l.telefone).replace(/\D/g,''),'_blank'); saveLeads(leads); renderCalls(); toast('Resultado registrado.');}

  function fuStages(){const arr=readJSON(KEY_FU_STAGES,null);return Array.isArray(arr)&&arr.length?arr:DEFAULT_FU_STAGES.slice();}
  function followupStage(l){return l.followupStage || l.followupEtapa || l.cadenciaEtapa || (String(l.etapa)==='Proposta'?'Proposta enviada':'Primeiro contato');}
  function setFollowupStage(id,stage){const leads=getLeads(); const l=leads.find(x=>leadId(x)===String(id)); if(!l)return; l.followupStage=stage; l.followupEtapa=stage; l.ultimaAtualizacao=todayISO(); saveLeads(leads); renderFollowups();}
  function followupLeads(){const q=norm(localStorage.getItem(KEY_FU_SEARCH)||''), st=localStorage.getItem(KEY_FU_STAGE_FILTER)||''; let arr=getLeads().filter(l=>!isClosed(l)); if(q) arr=arr.filter(l=>norm([l.nome,l.etapa,l.responsavel,l.segmento,l.telefone,followupStage(l)].join(' ')).includes(q)); if(st) arr=arr.filter(l=>followupStage(l)===st); return arr.sort((a,b)=>String(a.followup||'9999').localeCompare(String(b.followup||'9999'))||scoreLead(b)-scoreLead(a));}
  function renderFollowups(){
    const page=$('#cadencias'); if(!page) return; page.className='view grid-view active v55-page v55-followups-page'; page.dataset.v55Official='followups';
    const stages=fuStages(), arr=followupLeads(), view=localStorage.getItem(KEY_FU_VIEW)||'board';
    page.innerHTML=`<div id="v50FollowupStages" hidden></div><div class="v55-page-head"><div><span>Follow-ups</span><h2>Pipeline de follow-ups</h2><p>O mesmo raciocínio visual do pipeline: cada lead fica em uma etapa de acompanhamento.</p></div><div class="v55-head-actions"><button type="button" class="v55-btn" id="v55FuAddStage">+ Etapa</button><button type="button" class="v55-btn primary" id="v55FuRoutine">Gerar rotina</button></div></div><div class="v55-fu-toolbar"><input id="v55FuSearch" value="${esc(localStorage.getItem(KEY_FU_SEARCH)||'')}" placeholder="Buscar lead, etapa, telefone ou responsável"><select id="v55FuStageFilter"><option value="">Todas as etapas</option>${stages.map(s=>`<option ${s===(localStorage.getItem(KEY_FU_STAGE_FILTER)||'')?'selected':''}>${esc(s)}</option>`).join('')}</select><div class="v55-segment">${[['board','Kanban'],['list','Lista'],['exec','Execução']].map(([id,label])=>`<button type="button" data-v55-fu-view="${id}" class="${view===id?'active':''}">${label}</button>`).join('')}</div></div><div class="v55-fu-kpis"><div><b>${arr.filter(l=>l.followup&&String(l.followup).slice(0,10)<todayISO()).length}</b><span>Atrasados</span></div><div><b>${arr.filter(l=>l.followup&&String(l.followup).slice(0,10)===todayISO()).length}</b><span>Hoje</span></div><div><b>${arr.filter(l=>String(l.etapa)==='Proposta').length}</b><span>Propostas</span></div><div><b>${arr.length}</b><span>Em acompanhamento</span></div></div><div class="v55-fu-body">${view==='list'?fuList(arr,stages):view==='exec'?fuExec(arr):fuBoard(arr,stages)}</div>`;
  }
  function fuBoard(arr,stages){return `<div class="v55-fu-board">${stages.map(stage=>{const list=arr.filter(l=>followupStage(l)===stage);return `<section class="v55-fu-col" data-v55-fu-drop="${esc(stage)}"><header><b>${esc(stage)}</b><span>${list.length}</span></header><div class="v55-fu-cards">${list.length?list.map(fuCard).join(''):'<div class="v55-empty small">Sem leads</div>'}</div></section>`;}).join('')}</div>`;}
  function fuCard(l){const id=leadId(l), phone=digits(l.telefone);return `<article class="v55-fu-card" draggable="true" data-v55-fu-card="${esc(id)}"><div class="v55-card-top"><b>${esc(l.nome||'Lead')}</b><span>${scoreLead(l)}</span></div><p>${esc([l.etapa,l.responsavel||'Sem responsável'].filter(Boolean).join(' • '))}</p><div class="v55-tags"><em>${esc(l.prioridade||'Média')}</em><em>${esc(l.followup?dateBR(l.followup):'Sem data')}</em></div><div class="v55-card-actions">${phone?`<a href="${esc(telHref(l.telefone))}" class="v55-mini-action">Ligar</a><a href="https://wa.me/${fullPhone(l.telefone).replace(/\D/g,'')}" target="_blank" class="v55-mini-action">WhatsApp</a>`:''}<button type="button" class="v55-mini-action" data-v55-open-lead="${esc(id)}">Lead</button></div><select data-v55-fu-stage-select="${esc(id)}">${fuStages().map(s=>`<option ${s===followupStage(l)?'selected':''}>${esc(s)}</option>`).join('')}</select></article>`;}
  function fuList(arr){return `<div class="v55-fu-list">${arr.length?arr.map(l=>`<div class="v55-fu-row"><div><b>${esc(l.nome||'Lead')}</b><span>${esc(followupStage(l))} • ${esc(dateBR(l.followup))}</span></div><select data-v55-fu-stage-select="${esc(leadId(l))}">${fuStages().map(s=>`<option ${s===followupStage(l)?'selected':''}>${esc(s)}</option>`).join('')}</select><button type="button" class="v55-btn" data-v55-open-lead="${esc(leadId(l))}">Abrir</button></div>`).join(''):'<div class="v55-empty">Nenhum follow-up.</div>'}</div>`;}
  function fuExec(arr){if(!arr.length)return '<div class="v55-empty">Nenhum lead na fila de execução.</div>'; let idx=Number(localStorage.getItem(KEY_FU_EXEC)||0); if(idx>=arr.length)idx=0; const l=arr[idx];return `<div class="v55-fu-exec"><div><span>${idx+1} de ${arr.length}</span><h3>${esc(l.nome||'Lead')}</h3><p>${esc(followupStage(l))} • ${esc(l.etapa||'Sem etapa')} • ${esc(dateBR(l.followup))}</p><div class="v55-script">Objetivo: fazer contato curto, confirmar interesse e definir o próximo passo claro.</div></div><div class="v55-dial-actions">${digits(l.telefone)?`<a class="v55-btn primary" href="${esc(telHref(l.telefone))}">Ligar</a><a class="v55-btn" href="https://wa.me/${fullPhone(l.telefone).replace(/\D/g,'')}" target="_blank">WhatsApp</a>`:''}<button type="button" class="v55-btn" data-v55-fu-next>Próximo</button><button type="button" class="v55-btn" data-v55-open-lead="${esc(leadId(l))}">Abrir lead</button></div></div>`;}
  function generateRoutine(){localStorage.setItem(KEY_FU_VIEW,'exec'); localStorage.setItem(KEY_FU_EXEC,'0'); renderFollowups(); toast('Modo execução aberto.');}

  function bind(){
    DOC.addEventListener('click',function(e){
      const side=e.target.closest('#v55SidebarControl,#v55SidebarHandle'); if(side){e.preventDefault(); e.stopPropagation(); setSidebarCollapsed(!DOC.body.classList.contains('crm-v55-sidebar-collapsed'),true); return;}
      const nav=e.target.closest('[data-view]'); if(nav){scheduleRender();}
      if(e.target.closest('#v55NewEventBtn')){e.preventDefault(); openEventDrawer({new:true,data:toISO(state.calDate),hora:'09:00',tipo:'Reunião',prioridade:'Média',titulo:'Novo compromisso',agenda:'comercial'}); return;}
      if(e.target.closest('#v55CalToday')){e.preventDefault(); state.calDate=parseDate(todayISO()); localStorage.setItem(KEY_CAL_DATE,todayISO()); renderAgenda(); return;}
      if(e.target.closest('#v55CalPrev')){e.preventDefault(); moveCalendar(-1); return;}
      if(e.target.closest('#v55CalNext')){e.preventDefault(); moveCalendar(1); return;}
      const cv=e.target.closest('[data-v55-cal-view]'); if(cv){e.preventDefault(); setCalView(cv.dataset.v55CalView); return;}
      const gm=e.target.closest('[data-v55-open-month]'); if(gm){e.preventDefault(); state.calDate=new Date(state.calDate.getFullYear(),Number(gm.dataset.v55OpenMonth),1,12); localStorage.setItem(KEY_CAL_DATE,toISO(state.calDate)); setCalView('month'); return;}
      const gd=e.target.closest('[data-v55-goto-date]'); if(gd){e.preventDefault(); state.calDate=parseDate(gd.dataset.v55GotoDate); localStorage.setItem(KEY_CAL_DATE,gd.dataset.v55GotoDate); setCalView('day'); return;}
      const ev=e.target.closest('[data-v55-event]'); if(ev){e.preventDefault(); e.stopPropagation(); openEventDrawer(ev.dataset.v55Event); return;}
      const nd=e.target.closest('[data-v55-new-date]'); if(nd){e.preventDefault(); openEventDrawer({new:true,data:nd.dataset.v55NewDate,hora:nd.dataset.v55NewHour||'09:00',tipo:'Reunião',prioridade:'Média',titulo:'Novo compromisso',agenda:'comercial'}); return;}
      if(e.target.closest('[data-v55-close]')){e.preventDefault(); closeEventDrawer(); return;}
      if(e.target.closest('#v55SaveEvent')){e.preventDefault(); saveEventFromDrawer(); return;}
      if(e.target.closest('#v55DeleteEvent')){e.preventDefault(); const id=$('#v55EventDrawer')?.dataset.eventId; if(id){deleteEvent(id); closeEventDrawer(); renderAgenda(); toast('Evento excluído.');} return;}
      const action=e.target.closest('[data-v55-event-action]'); if(action){e.preventDefault(); const a=action.dataset.v55EventAction; if(a==='delay1'){$('#v55EvDate').value=addDays($('#v55EvDate').value||todayISO(),1);} if(a==='done'){$('#v55EvNotes').value=($('#v55EvNotes').value||'')+'\nConcluído em '+dateBR(todayISO());} if(a==='nextfu'){$('#v55EvType').value='Follow-up'; $('#v55EvDate').value=addDays(todayISO(),2);} return;}
      if(e.target.closest('#v55CallBest')){e.preventDefault(); const q=callQueue().filter(l=>digits(l.telefone)); if(q[0]){state.selectedCall=leadId(q[0]);localStorage.setItem(KEY_SELECTED_CALL,state.selectedCall);renderCalls();} return;}
      if(e.target.closest('#v55CallRefresh')){e.preventDefault(); renderCalls(); return;}
      const row=e.target.closest('[data-v55-call-select]'); if(row && !e.target.closest('a')){e.preventDefault(); state.selectedCall=row.dataset.v55CallSelect; localStorage.setItem(KEY_SELECTED_CALL,state.selectedCall); renderCalls(); return;}
      const result=e.target.closest('[data-v55-call-result]'); if(result){e.preventDefault(); saveCallResult(result.dataset.v55CallResult); return;}
      const open=e.target.closest('[data-v55-open-lead]'); if(open){e.preventDefault(); openLead(open.dataset.v55OpenLead); return;}
      const fv=e.target.closest('[data-v55-fu-view]'); if(fv){e.preventDefault(); localStorage.setItem(KEY_FU_VIEW,fv.dataset.v55FuView); renderFollowups(); return;}
      if(e.target.closest('#v55FuRoutine')){e.preventDefault(); generateRoutine(); return;}
      if(e.target.closest('#v55FuAddStage')){e.preventDefault(); const name=prompt('Nome da nova etapa de follow-up:'); if(name){const s=fuStages(); if(!s.includes(name))s.splice(Math.max(0,s.length-1),0,name); writeJSON(KEY_FU_STAGES,s); renderFollowups();} return;}
      if(e.target.closest('[data-v55-fu-next]')){e.preventDefault(); const arr=followupLeads(); let idx=(Number(localStorage.getItem(KEY_FU_EXEC)||0)+1)%Math.max(arr.length,1); localStorage.setItem(KEY_FU_EXEC,String(idx)); renderFollowups(); return;}
    },true);
    DOC.addEventListener('input',function(e){
      if(e.target?.id==='v55AgendaSearch'){const f=getCalFilters();f.q=e.target.value;saveCalFilters(f);renderAgenda();}
      if(e.target?.id==='v55CallSearch'){localStorage.setItem(KEY_CALL_SEARCH,e.target.value);renderCalls();}
      if(e.target?.id==='v55FuSearch'){localStorage.setItem(KEY_FU_SEARCH,e.target.value);renderFollowups();}
    },true);
    DOC.addEventListener('change',function(e){
      if(e.target?.matches('[data-v55-layer]')){const f=getCalFilters();f.layers[e.target.dataset.v55Layer]=e.target.checked;saveCalFilters(f);renderAgenda();}
      if(e.target?.matches('[data-v55-type]')){const f=getCalFilters();f.types[e.target.dataset.v55Type]=e.target.checked;saveCalFilters(f);renderAgenda();}
      if(e.target?.id==='v55CalendarDensity'){const f=getCalFilters();f.density=e.target.value;saveCalFilters(f);renderAgenda();}
      if(e.target?.id==='v55CallFilter'){localStorage.setItem(KEY_CALL_FILTER,e.target.value);renderCalls();}
      if(e.target?.id==='v55FuStageFilter'){localStorage.setItem(KEY_FU_STAGE_FILTER,e.target.value);renderFollowups();}
      const stage=e.target?.closest?.('[data-v55-fu-stage-select]'); if(stage){setFollowupStage(stage.dataset.v55FuStageSelect,stage.value);}
      if(e.target?.id==='v55EvLead'){const l=findLead(e.target.value); const input=$('#v55EvTitleInput'); if(l && input && (!input.value || input.value==='Novo compromisso')) input.value='Compromisso: '+l.nome;}
    },true);
    DOC.addEventListener('dragstart',function(e){const card=e.target.closest('[data-v55-fu-card]'); if(card){e.dataTransfer.setData('text/plain',card.dataset.v55FuCard); e.dataTransfer.effectAllowed='move';}},true);
    DOC.addEventListener('dragover',function(e){const col=e.target.closest('[data-v55-fu-drop]'); if(col){e.preventDefault(); col.classList.add('drag-over');}},true);
    DOC.addEventListener('dragleave',function(e){const col=e.target.closest('[data-v55-fu-drop]'); if(col) col.classList.remove('drag-over');},true);
    DOC.addEventListener('drop',function(e){const col=e.target.closest('[data-v55-fu-drop]'); if(col){e.preventDefault(); col.classList.remove('drag-over'); const id=e.dataTransfer.getData('text/plain'); if(id)setFollowupStage(id,col.dataset.v55FuDrop);}},true);
    DOC.addEventListener('keydown',function(e){if(e.key==='Escape')closeEventDrawer();});
  }

  function observe(){
    let timer;
    new MutationObserver(()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>{
        installSidebar();
        const v=activeView();
        if(['agenda','ligacoes','cadencias'].includes(v)){
          const page=$('#'+v);
          const legacyOverlap = page && page.querySelector('#v51AgendaCommand,#v51AgendaKanban,#v51CallsCommand,#callTableV36,#v50FollowupStages:not([hidden])');
          if(!page?.dataset.v55Official || legacyOverlap) renderActive();
        }
      },260);
    }).observe(DOC.body,{childList:true,subtree:true});
  }
  function boot(){
    $('#v54AgendaApp')?.remove(); $('#v54CallsApp')?.remove(); $('#v54EventDrawer')?.remove();
    ensureViews(); installSidebar(); bind(); renderActive(); scheduleRender(); observe();
  }
  if(DOC.readyState==='loading') DOC.addEventListener('DOMContentLoaded',boot); else boot();
})();
