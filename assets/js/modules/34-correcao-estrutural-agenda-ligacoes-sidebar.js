/* CRM v54 — correção estrutural: sidebar oficial, agenda oficial e ligações clicáveis.
   Esta camada evita que as versões antigas (v41/v51/v52/v53) sobrescrevam a Agenda e Ligações. */
(function(){
  'use strict';
  if(window.__crmV54StructuralFix) return;
  window.__crmV54StructuralFix = true;

  const DOC = document;
  const $ = (s,r=DOC)=>r.querySelector(s);
  const $$ = (s,r=DOC)=>Array.from(r.querySelectorAll(s));
  const KEY_EVENTS = 'outbounder_agenda_v1';
  const KEY_LEADS = 'outbounder_leads_v5';
  const KEY_CALL_CFG = 'outbounder_call_cfg_v9';
  const KEY_CAL_VIEW = 'crm_v54_calendar_view';
  const KEY_CAL_DATE = 'crm_v54_calendar_date';
  const KEY_COLLAPSE = 'crm_v54_sidebar_collapsed';
  const ptMonths = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const ptMonthsShort = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const ptWeekdays = ['dom','seg','ter','qua','qui','sex','sáb'];

  const state = {
    calView: localStorage.getItem(KEY_CAL_VIEW) || 'month',
    calDate: parseDate(localStorage.getItem(KEY_CAL_DATE) || todayISO()),
    selectedCall: localStorage.getItem('crm_v54_selected_call') || ''
  };

  function esc(v){return String(v ?? '').replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function readJSON(k,f){try{const raw=localStorage.getItem(k);return raw?JSON.parse(raw):f;}catch(e){return f;}}
  function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function todayISO(){return new Date().toISOString().slice(0,10);}
  function parseDate(v){const d=new Date(String(v||todayISO()).slice(0,10)+'T12:00:00');return isNaN(d)?new Date():d;}
  function toISO(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate(),12).toISOString().slice(0,10);}
  function pad(n){return String(n).padStart(2,'0');}
  function addDays(base,n){const d=parseDate(base);d.setDate(d.getDate()+Number(n||0));return toISO(d);}
  function dateBR(d){try{return parseDate(d).toLocaleDateString('pt-BR');}catch(e){return d||'—';}}
  function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function digits(v){return String(v||'').replace(/\D/g,'');}
  function initials(v){return String(v||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?';}
  function notify(msg,type='success'){try{(window.crmToast||window.showToast||window.toastV5||console.log)(msg,type);}catch(e){console.log(msg);}}

  function getLeads(){
    try{ if(typeof window.crmGetLeads === 'function') return window.crmGetLeads() || []; }catch(e){}
    try{ if(Array.isArray(window.leads)) return window.leads; }catch(e){}
    return readJSON(KEY_LEADS,[]) || [];
  }
  function saveLeads(arr){
    try{ if(Array.isArray(arr)) window.leads = arr; }catch(e){}
    try{ if(typeof window.crmSaveLeads === 'function') return window.crmSaveLeads(); }catch(e){}
    try{ if(typeof window.saveLeads === 'function') return window.saveLeads(); }catch(e){}
    writeJSON(KEY_LEADS, getLeads());
  }
  function findLead(ref){
    const r=String(ref||'');
    return getLeads().find(l=>String(l.id||'')===r || String(l.nome||'')===r || String(l.empresa||'')===r);
  }
  function openLead(ref){
    try{ if(typeof window.crmOpenLead === 'function') return window.crmOpenLead(ref); }catch(e){}
    try{ if(typeof window.openDetail === 'function') return window.openDetail(ref); }catch(e){}
    notify('Abra o lead pela aba Leads.', 'warn');
  }

  function getSavedEvents(){return (readJSON(KEY_EVENTS,[]) || []).filter(Boolean);}
  function saveSavedEvents(arr){writeJSON(KEY_EVENTS, arr || []); try{window.crmAgendaAPI?.render?.();}catch(e){} try{if(typeof window.renderAgenda==='function') window.renderAgenda();}catch(e){} }
  function eventId(ev){return String(ev.id || ev._id || ev.uuid || (ev.__v54id ||= 'v54_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)));}
  function eventDate(ev){return String(ev.data || ev.date || ev.dia || todayISO()).slice(0,10);}
  function eventTime(ev){return String(ev.hora || ev.time || ev.hour || '09:00').slice(0,5);}
  function eventTitle(ev){return ev.titulo || ev.title || ev.leadNome || ev.nome || ev.tipo || 'Compromisso';}
  function eventType(ev){return ev.tipo || ev.type || 'Compromisso';}
  function eventPriority(ev){return ev.prioridade || ev.priority || 'Média';}
  function eventNotes(ev){return ev.notas || ev.notes || ev.descricao || '';}  
  function eventLead(ev){return ev.leadNome || ev.lead || ev.leadName || '';}  
  function normalizeEvent(ev){
    const id=eventId(ev);
    const data=eventDate(ev), hora=eventTime(ev), titulo=eventTitle(ev), tipo=eventType(ev), prioridade=eventPriority(ev), leadNome=eventLead(ev), notas=eventNotes(ev);
    return {...ev,id,data,date:data,hora,time:hora,titulo,title:titulo,tipo,type:tipo,prioridade,priority:prioridade,leadNome,notas,notes:notas};
  }
  function virtualFollowups(){
    return getLeads().filter(l=>l && l.followup && !['Perdido','Fechado'].includes(l.etapa)).map(l=>({
      id:'fu_'+(l.id||l.nome), data:String(l.followup).slice(0,10), date:String(l.followup).slice(0,10), hora:'09:00', time:'09:00',
      titulo:'Follow-up: '+(l.nome||'Lead'), title:'Follow-up: '+(l.nome||'Lead'), leadNome:l.nome||'', tipo:'Follow-up', type:'Follow-up', prioridade:l.prioridade||'Média', notas:l.followupEtapa||'Follow-up do lead', virtual:true, leadId:l.id||l.nome
    }));
  }
  function allEvents(){
    const saved=getSavedEvents().map(normalizeEvent);
    const ids=new Set(saved.map(e=>e.id));
    return saved.concat(virtualFollowups().filter(e=>!ids.has(e.id))).sort((a,b)=>eventDate(a).localeCompare(eventDate(b)) || eventTime(a).localeCompare(eventTime(b)) || eventTitle(a).localeCompare(eventTitle(b),'pt-BR'));
  }
  function savedEventById(id){return getSavedEvents().map(normalizeEvent).find(e=>String(e.id)===String(id));}
  function anyEventById(id){return allEvents().find(e=>String(e.id)===String(id));}
  function upsertEvent(patch){
    const arr=getSavedEvents().map(normalizeEvent);
    const id=patch.id || 'ag_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
    const full=normalizeEvent({...patch,id});
    const idx=arr.findIndex(e=>String(e.id)===String(id));
    if(idx>=0) arr[idx]={...arr[idx],...full}; else arr.push(full);
    saveSavedEvents(arr);
    renderAgenda();
    return full;
  }
  function deleteEvent(id){
    saveSavedEvents(getSavedEvents().filter(e=>String(e.id)!==String(id)));
    renderAgenda();
  }

  let lastOfficialView = '';
  function setViewClass(shouldRender=false){
    const active=$('.view.active')?.id || inferActiveView();
    DOC.body.classList.toggle('crm-v54-view-agenda', active==='agenda');
    DOC.body.classList.toggle('crm-v54-view-ligacoes', active==='ligacoes');
    if(active==='agenda') setTopbar('Agenda','Calendário profissional com visão de mês, dia, ano e lista.');
    if(active==='ligacoes') setTopbar('Ligações','Clique no telefone para chamar pelo celular conectado ao PC.');
    const changed = active !== lastOfficialView;
    lastOfficialView = active;
    if((shouldRender || changed) && active==='agenda') renderAgenda();
    if((shouldRender || changed) && active==='ligacoes') renderCalls();
  }
  function inferActiveView(){
    const btn=$$('.nav-item.active,.crm-v49-nav-main.active,.v51-nav-main.active,.tab.active').find(x=>x.dataset.view);
    return btn?.dataset.view || 'inicio';
  }
  function setTopbar(title,sub){
    const t=$('#topbarTitle'), s=$('#topbarSub');
    if(t) t.textContent=title; if(s) s.textContent=sub;
  }
  function navigate(view){
    try{ if(typeof window.setView === 'function'){ window.setView(view); setTimeout(()=>setViewClass(true),80); return; } }catch(e){}
    const b=$(`[data-view="${CSS.escape(view)}"]`); if(b) b.click();
    setTimeout(()=>setViewClass(true),80);
  }

  function installSidebar(){
    DOC.body.classList.add('crm-v54');
    $('#v51SidebarToggle')?.remove(); $('#v52SidebarToggle')?.remove(); $('#v53SidebarToggle')?.remove(); $('#v53SidebarHandle')?.remove();
    $$('.v51-group-chevron').forEach(x=>x.remove());
    $$('.nav-item,.v51-nav-main,.crm-v49-nav-main').forEach(b=>{ if(!b.title) b.title=b.dataset.label || b.textContent.trim(); if(!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.title || 'Abrir'); });
    const brand=$('.sidebar-brand');
    if(brand && !$('#v54SidebarGrip')){
      brand.insertAdjacentHTML('beforeend','<button type="button" class="v54-sidebar-grip" id="v54SidebarGrip" aria-label="Recolher ou expandir menu" title="Recolher ou expandir menu"><span class="v54-grip-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>');
    }
    if(!$('#v54SidebarEdge')) DOC.body.insertAdjacentHTML('beforeend','<button type="button" class="v54-sidebar-edge" id="v54SidebarEdge" aria-label="Recolher ou expandir menu" title="Recolher ou expandir menu"></button>');
    const saved=localStorage.getItem(KEY_COLLAPSE);
    const collapsed=saved===null ? (localStorage.getItem('crm_v51_sidebar_collapsed')==='1' || localStorage.getItem('crm_v52_sidebar_collapsed')==='1' || localStorage.getItem('crm_v53_sidebar_collapsed')==='1') : saved==='1';
    setCollapsed(collapsed,false);
  }
  function setCollapsed(collapsed,toastIt){
    ['crm-v54-sidebar-collapsed','crm-v53-sidebar-collapsed','crm-v52-sidebar-collapsed','crm-v51-sidebar-collapsed','crm-sidebar-collapsed'].forEach(c=>DOC.body.classList.toggle(c,collapsed));
    localStorage.setItem(KEY_COLLAPSE, collapsed?'1':'0');
    localStorage.setItem('crm_v51_sidebar_collapsed', collapsed?'1':'0');
    localStorage.setItem('crm_v52_sidebar_collapsed', collapsed?'1':'0');
    localStorage.setItem('crm_v53_sidebar_collapsed', collapsed?'1':'0');
    $$('#v54SidebarGrip,#v54SidebarEdge').forEach(b=>{b.setAttribute('aria-label',collapsed?'Expandir menu lateral':'Recolher menu lateral'); b.title=collapsed?'Expandir menu lateral':'Recolher menu lateral';});
    if(toastIt) notify(collapsed?'Menu recolhido':'Menu expandido');
  }

  function ensureOfficialApps(){
    const main=$('main.main') || $('.main');
    if(!main) return;
    if(!$('#v54AgendaApp')) main.insertAdjacentHTML('beforeend','<section id="v54AgendaApp" aria-label="Agenda profissional v54"></section>');
    if(!$('#v54CallsApp')) main.insertAdjacentHTML('beforeend','<section id="v54CallsApp" aria-label="Ligações profissionais v54"></section>');
    if(!$('#v54EventDrawer')) DOC.body.insertAdjacentHTML('beforeend', eventDrawerHTML());
  }

  function renderAgenda(){
    ensureOfficialApps();
    const app=$('#v54AgendaApp'); if(!app) return;
    app.innerHTML=`
      <div class="v54-page-head">
        <div><div class="v54-page-eyebrow">Agenda</div><div class="v54-page-title">Calendário comercial</div><div class="v54-page-sub">Clique em qualquer dia ou horário para criar compromisso. Alterne entre mês, dia, ano e lista.</div></div>
        <div class="v54-actions"><button type="button" class="v54-btn primary" id="v54NewEventBtn">+ Novo compromisso</button><button type="button" class="v54-btn" id="v54AgendaRefresh">Atualizar</button></div>
      </div>
      <div class="v54-shell">
        <div class="v54-toolbar">
          <div class="v54-actions"><button type="button" class="v54-btn" id="v54CalToday">Hoje</button><button type="button" class="v54-btn" id="v54CalPrev">Anterior</button><button type="button" class="v54-btn" id="v54CalNext">Próximo</button><div class="v54-cal-title" id="v54CalTitle">${esc(calendarTitle())}</div></div>
          <div class="v54-actions"><div class="v54-segment" id="v54CalViews"><button type="button" data-v54-cal-view="month">Mês</button><button type="button" data-v54-cal-view="day">Dia</button><button type="button" data-v54-cal-view="year">Ano</button><button type="button" data-v54-cal-view="list">Lista</button></div></div>
        </div>
        <div class="v54-body" id="v54CalBody">${calendarBody()}</div>
      </div>`;
    $$('#v54CalViews [data-v54-cal-view]').forEach(b=>b.classList.toggle('active', b.dataset.v54CalView===state.calView));
  }
  function calendarTitle(){
    const d=state.calDate;
    if(state.calView==='day') return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
    if(state.calView==='year') return String(d.getFullYear());
    if(state.calView==='list') return 'Lista de compromissos';
    return ptMonths[d.getMonth()]+' de '+d.getFullYear();
  }
  function calendarBody(){
    if(state.calView==='day') return renderDay();
    if(state.calView==='year') return renderYear();
    if(state.calView==='list') return renderList();
    return renderMonth();
  }
  function eventsOn(iso){return allEvents().filter(e=>eventDate(e)===iso);}
  function renderMonth(){
    const d=state.calDate, first=new Date(d.getFullYear(),d.getMonth(),1,12), start=new Date(first); start.setDate(first.getDate()-first.getDay());
    const now=todayISO(), cells=[];
    for(let i=0;i<42;i++){
      const cur=new Date(start); cur.setDate(start.getDate()+i);
      const iso=toISO(cur), inMonth=cur.getMonth()===d.getMonth(), evs=eventsOn(iso);
      const list=evs.slice(0,3).map(e=>`<button type="button" class="v54-event ${e.virtual?'virtual':''}" data-v54-event="${esc(eventId(e))}"><time>${esc(eventTime(e))}</time>${esc(eventTitle(e))}</button>`).join('');
      cells.push(`<div class="v54-day-cell ${inMonth?'':'muted'} ${iso===now?'today':''}" data-v54-new-date="${iso}"><div class="v54-day-head"><span class="v54-day-number">${cur.getDate()}</span><span class="v54-day-add">+</span></div>${list}${evs.length>3?`<div class="v54-more">+${evs.length-3} compromissos</div>`:''}</div>`);
    }
    return `<div class="v54-weekdays">${ptWeekdays.map(w=>`<span>${w}</span>`).join('')}</div><div class="v54-month-grid">${cells.join('')}</div>`;
  }
  function renderDay(){
    const iso=toISO(state.calDate), evs=eventsOn(iso), byHour={};
    evs.forEach(e=>{const h=Math.max(7,Math.min(21,Number(eventTime(e).slice(0,2))||9));(byHour[h] ||= []).push(e);});
    let rows='';
    for(let h=7;h<=21;h++){
      const items=(byHour[h]||[]).map(e=>`<button type="button" class="v54-event ${e.virtual?'virtual':''}" data-v54-event="${esc(eventId(e))}"><time>${esc(eventTime(e))}</time>${esc(eventTitle(e))}<small>${esc([eventType(e),eventPriority(e)].filter(Boolean).join(' • '))}</small></button>`).join('');
      rows += `<div class="v54-hour-label">${pad(h)}:00</div><div class="v54-hour-slot" data-v54-new-date="${iso}" data-v54-new-hour="${pad(h)}:00">${items || '<span class="v54-hour-empty">Clique para criar compromisso</span>'}</div>`;
    }
    return `<div class="v54-day-view">${rows}</div>${!evs.length?'<div class="v54-empty">Nenhum compromisso neste dia. Clique em um horário para criar.</div>':''}`;
  }
  function renderYear(){
    const y=state.calDate.getFullYear(), now=todayISO();
    return `<div class="v54-year-grid">${Array.from({length:12},(_,m)=>miniMonth(y,m,now)).join('')}</div>`;
  }
  function miniMonth(y,m,now){
    const first=new Date(y,m,1,12), start=new Date(first); start.setDate(first.getDate()-first.getDay());
    const monthEvents=allEvents().filter(e=>{const d=parseDate(eventDate(e));return d.getFullYear()===y && d.getMonth()===m;});
    const has=new Set(monthEvents.map(eventDate));
    let days='';
    for(let i=0;i<42;i++){const cur=new Date(start);cur.setDate(start.getDate()+i);const iso=toISO(cur), inMonth=cur.getMonth()===m;days+=`<span class="${inMonth&&has.has(iso)?'has':''} ${iso===now?'today':''}" style="opacity:${inMonth?'1':'.24'}">${cur.getDate()}</span>`;}
    return `<button type="button" class="v54-mini-month" data-v54-open-month="${m}"><div class="v54-mini-title"><b>${ptMonthsShort[m]}</b><small>${monthEvents.length}</small></div><div class="v54-mini-grid">${days}</div></button>`;
  }
  function renderList(){
    const evs=allEvents();
    if(!evs.length) return '<div class="v54-empty">Nenhum compromisso cadastrado ainda.</div>';
    return `<div class="v54-list-view">${evs.map(e=>`<button type="button" class="v54-list-item" data-v54-event="${esc(eventId(e))}"><div><b>${esc(eventTitle(e))}</b><br><span>${esc(dateBR(eventDate(e)))} • ${esc(eventTime(e))} • ${esc(eventType(e))}${e.virtual?' • follow-up do lead':''}</span></div><span>Abrir</span></button>`).join('')}</div>`;
  }
  function moveCalendar(delta){
    const d=new Date(state.calDate);
    if(state.calView==='day') d.setDate(d.getDate()+delta);
    else if(state.calView==='year') d.setFullYear(d.getFullYear()+delta);
    else d.setMonth(d.getMonth()+delta);
    state.calDate=d; localStorage.setItem(KEY_CAL_DATE,toISO(d)); renderAgenda();
  }
  function setCalView(v){state.calView=v;localStorage.setItem(KEY_CAL_VIEW,v);renderAgenda();}
  function eventDrawerHTML(){
    return `<aside class="v54-drawer" id="v54EventDrawer" aria-hidden="true"><div class="v54-drawer-head"><div><h3 id="v54EventDrawerTitle">Compromisso</h3><p id="v54EventDrawerSub">Crie ou edite um compromisso.</p></div><button type="button" class="v54-close" data-v54-close-drawer>×</button></div><div class="v54-drawer-body" id="v54EventDrawerBody"></div><div class="v54-drawer-foot"><button type="button" class="v54-btn" id="v54DeleteEventBtn">Excluir</button><button type="button" class="v54-btn primary" id="v54SaveEventBtn">Salvar</button></div></aside>`;
  }
  function openEventDrawer(seed){
    ensureOfficialApps();
    const ev=typeof seed==='string'?anyEventById(seed):seed;
    const isVirtual=!!ev?.virtual;
    const isNew=!ev || !ev.id || seed?.new;
    const id=isVirtual?'':(ev?.id||'');
    const data=eventDate(ev||{}), hora=eventTime(ev||{});
    const leads=getLeads();
    const leadName=eventLead(ev||{});
    const drawer=$('#v54EventDrawer'); if(!drawer) return;
    drawer.dataset.eventId=id; drawer.dataset.virtual=isVirtual?'1':'0'; drawer.dataset.new=isNew?'1':'0';
    $('#v54EventDrawerTitle').textContent=isNew?'Novo compromisso':(isVirtual?'Follow-up do lead':eventTitle(ev));
    $('#v54EventDrawerSub').textContent=isVirtual?'Este item veio do follow-up do lead. Para transformar em compromisso, salve aqui.':(isNew?'Clique em salvar para criar na agenda.':'Edite os dados e salve.');
    const leadOptions=['<option value="">Compromisso livre / sem lead</option>'].concat(leads.map(l=>`<option value="${esc(l.nome||'')}" ${String(l.nome||'')===String(leadName)?'selected':''}>${esc(l.nome||'Lead sem nome')}</option>`)).join('');
    $('#v54EventDrawerBody').innerHTML=`
      ${isVirtual?'<div class="v54-help">Este item veio automaticamente do follow-up de um lead. Ao salvar, ele vira um compromisso real na agenda.</div>':''}
      <div class="v54-grid-2"><div class="v54-field"><label>Data</label><input id="v54EvDate" type="date" value="${esc(data)}"></div><div class="v54-field"><label>Hora</label><input id="v54EvTime" type="time" value="${esc(hora)}"></div></div>
      <div class="v54-field"><label>Título</label><input id="v54EvTitle" value="${esc(eventTitle(ev||{titulo:'Novo compromisso'}))}" placeholder="Ex: Reunião com lead"></div>
      <div class="v54-grid-2"><div class="v54-field"><label>Tipo</label><select id="v54EvType">${['Ligação','WhatsApp','E-mail','Reunião','Follow-up','Proposta','Tarefa','Pessoal'].map(t=>`<option ${t===eventType(ev||{})?'selected':''}>${t}</option>`).join('')}</select></div><div class="v54-field"><label>Prioridade</label><select id="v54EvPriority">${['Alta','Média','Baixa'].map(p=>`<option ${p===eventPriority(ev||{})?'selected':''}>${p}</option>`).join('')}</select></div></div>
      <div class="v54-field"><label>Lead vinculado</label><select id="v54EvLead">${leadOptions}</select></div>
      <div class="v54-field"><label>Notas</label><textarea id="v54EvNotes" rows="4" placeholder="Objetivo, contexto, preparação, próximo passo...">${esc(eventNotes(ev||{}))}</textarea></div>
      ${quickLeadActions(leadName)}
      <div class="v54-help">Dica: no modo mês, clique em qualquer quadradinho do dia. No modo dia, clique em um horário. O evento será salvo no mesmo armazenamento que o CRM já usa.</div>`;
    $('#v54DeleteEventBtn').style.display=(id && !isVirtual)?'inline-flex':'none';
    drawer.classList.add('show'); drawer.setAttribute('aria-hidden','false');
  }
  function quickLeadActions(leadName){
    const l=findLead(leadName); if(!l) return '';
    const phone=l.telefone||''; const href=telHref(phone);
    return `<div class="v54-actions">${phone?`<a class="v54-btn primary" href="${esc(href)}">Ligar pelo celular/PC</a><a class="v54-btn" target="_blank" href="https://wa.me/${esc(fullPhone(phone).replace(/\D/g,''))}">WhatsApp</a>`:''}<button type="button" class="v54-btn" data-v54-open-lead="${esc(l.id||l.nome)}">Abrir lead</button></div>`;
  }
  function saveEventFromDrawer(){
    const drawer=$('#v54EventDrawer'); if(!drawer) return;
    const id=drawer.dataset.virtual==='1' ? '' : drawer.dataset.eventId;
    const lead=$('#v54EvLead')?.value || '';
    const title=$('#v54EvTitle')?.value || lead || 'Compromisso';
    upsertEvent({
      id:id||undefined,
      data:$('#v54EvDate')?.value || todayISO(),
      hora:$('#v54EvTime')?.value || '09:00',
      titulo:title,
      tipo:$('#v54EvType')?.value || 'Compromisso',
      prioridade:$('#v54EvPriority')?.value || 'Média',
      leadNome:lead,
      notas:$('#v54EvNotes')?.value || ''
    });
    drawer.classList.remove('show'); drawer.setAttribute('aria-hidden','true');
    notify('Compromisso salvo na agenda.');
  }

  function callCfg(){return readJSON(KEY_CALL_CFG,{protocol:'tel',country:'+55'}) || {protocol:'tel',country:'+55'};}
  function saveCallCfg(c){writeJSON(KEY_CALL_CFG,c||{});}
  function fullPhone(phone){
    let d=digits(phone); if(!d) return '';
    let cc=String(callCfg().country||'+55').replace(/[^\d+]/g,'') || '+55'; if(cc[0]!=='+') cc='+'+cc;
    if(d.startsWith('00')) d=d.slice(2);
    if(d.startsWith('55') && d.length>=12) return '+'+d;
    return cc+d;
  }
  function telHref(phone){
    const cfg=callCfg(), full=fullPhone(phone), plain=full.replace(/\D/g,'');
    if(!plain) return '#';
    if(cfg.protocol==='whatsapp') return 'https://wa.me/'+plain;
    if(cfg.protocol==='callto') return 'callto:'+full;
    if(cfg.protocol==='sip') return 'sip:'+full;
    return 'tel:'+full;
  }
  function scoreLead(l){
    try{ if(typeof window.calcScore==='function') return window.calcScore(l); }catch(e){}
    let s=20; if(l.prioridade==='Alta') s+=25; if(Number(l.valor)>10000) s+=20; if(l.followup && String(l.followup).slice(0,10)<=todayISO()) s+=20; if(l.telefone) s+=15; return Math.min(100,s);
  }
  function isOpenLead(l){return !['Fechado','Perdido'].includes(l.etapa);}
  function callsToday(){
    const t=todayISO(); let n=0;
    getLeads().forEach(l=>(Array.isArray(l.atividades)?l.atividades:[]).forEach(a=>{if(a.tipo==='Ligação' && String(a.data||'').slice(0,10)===t) n++;}));
    return n;
  }
  function callQueue(){
    const q=norm($('#v54CallSearch')?.value || ''); const filter=$('#v54CallFilter')?.value || '';
    let arr=getLeads().filter(isOpenLead);
    if(q) arr=arr.filter(l=>norm([l.nome,l.segmento,l.responsavel,l.telefone,l.email,l.etapa].join(' ')).includes(q));
    if(filter==='hoje') arr=arr.filter(l=>l.followup && String(l.followup).slice(0,10)<=todayISO());
    if(filter==='alta') arr=arr.filter(l=>l.prioridade==='Alta');
    if(filter==='semfone') arr=arr.filter(l=>!digits(l.telefone));
    if(filter==='proposta') arr=arr.filter(l=>l.etapa==='Proposta');
    return arr.sort((a,b)=>scoreLead(b)-scoreLead(a) || String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
  }
  function renderCalls(){
    ensureOfficialApps();
    const app=$('#v54CallsApp'); if(!app) return;
    const leads=getLeads().filter(isOpenLead), queue=callQueue(), withPhone=leads.filter(l=>digits(l.telefone)).length;
    if(!state.selectedCall || !findLead(state.selectedCall)) state.selectedCall=(queue[0]?.id || queue[0]?.nome || '');
    app.innerHTML=`
      <div class="v54-page-head">
        <div><div class="v54-page-eyebrow">Ligações</div><div class="v54-page-title">Discagem pelo celular conectado ao PC</div><div class="v54-page-sub">Os números agora são links <b>tel:+55...</b>. Clique no telefone para abrir o app padrão de chamadas do Windows.</div></div>
        <div class="v54-actions"><button type="button" class="v54-btn" id="v54CallBest">Próximo melhor lead</button><button type="button" class="v54-btn primary" id="v54CallRefresh">Atualizar fila</button></div>
      </div>
      <div class="v54-note">Para funcionar com o celular conectado ao PC, deixe o aplicativo <b>Vincular ao Celular</b> como app padrão para links de telefone no Windows. O CRM não recebe o áudio da chamada; ele apenas abre o discador.</div>
      <div class="v54-kpis"><div class="v54-kpi"><strong>${leads.length}</strong><span>Leads abertos</span></div><div class="v54-kpi"><strong>${withPhone}</strong><span>Com telefone clicável</span></div><div class="v54-kpi"><strong>${leads.length-withPhone}</strong><span>Sem telefone</span></div><div class="v54-kpi"><strong>${callsToday()}</strong><span>Ligações hoje</span></div></div>
      <div class="v54-call-grid">
        <div class="v54-card"><div class="v54-card-head"><div><b>Fila de ligações</b><small>Priorizada por score, follow-up e prioridade.</small></div></div><div class="v54-call-toolbar"><input id="v54CallSearch" placeholder="Buscar lead, telefone, etapa ou responsável"><select id="v54CallFilter"><option value="">Todos</option><option value="hoje">Vencidos/hoje</option><option value="alta">Alta prioridade</option><option value="proposta">Propostas</option><option value="semfone">Sem telefone</option></select></div><div class="v54-call-list" id="v54CallList">${queue.length?queue.map(callRow).join(''):'<div class="v54-empty">Nenhum lead encontrado para esta fila.</div>'}</div></div>
        <aside class="v54-card"><div class="v54-card-head"><div><b>Discador e resultado</b><small>Selecione um lead e clique no telefone.</small></div></div><div class="v54-dial-body" id="v54DialPanel">${dialPanel()}</div></aside>
      </div>`;
    const search=$('#v54CallSearch'); if(search) search.value=localStorage.getItem('crm_v54_call_search')||'';
    const filter=$('#v54CallFilter'); if(filter) filter.value=localStorage.getItem('crm_v54_call_filter')||'';
  }
  function callRow(l){
    const id=String(l.id||l.nome||''), phone=digits(l.telefone), due=l.followup && String(l.followup).slice(0,10)<=todayISO();
    return `<button type="button" class="v54-call-row ${String(state.selectedCall)===id?'active':''}" data-v54-call-select="${esc(id)}"><div class="v54-avatar">${esc(initials(l.nome))}</div><div class="v54-call-main"><b>${esc(l.nome||'Lead sem nome')}</b><p>${esc([l.segmento,l.responsavel,l.etapa].filter(Boolean).join(' • ')||'Sem informações')}</p><div class="v54-tags"><span class="v54-tag ${phone?'good':'warn'}">${phone?'Telefone ok':'Sem telefone'}</span>${l.prioridade?`<span class="v54-tag">${esc(l.prioridade)}</span>`:''}${due?'<span class="v54-tag warn">Follow-up hoje</span>':''}</div>${phone?`<div style="margin-top:7px"><a class="v54-phone-link" href="${esc(telHref(l.telefone))}" data-v54-call-link="${esc(id)}">${esc(l.telefone)}</a></div>`:''}</div><div class="v54-score"><b>${scoreLead(l)}</b><span class="v54-tag">score</span></div></button>`;
  }
  function dialPanel(){
    const l=findLead(state.selectedCall); if(!l) return '<div class="v54-empty">Selecione um lead na fila para abrir o discador.</div>';
    const phone=digits(l.telefone), href=phone?telHref(l.telefone):'';
    return `<div><div class="v54-dial-name">${esc(l.nome||'Lead')}</div><div class="v54-dial-meta">${esc([l.segmento,l.responsavel,l.etapa].filter(Boolean).join(' • ')||'Sem informações')}</div></div>
      <div class="v54-actions">${phone?`<a class="v54-btn primary" href="${esc(href)}" data-v54-call-link="${esc(l.id||l.nome)}">☎ Ligar agora</a><a class="v54-phone-link" href="${esc(href)}" data-v54-call-link="${esc(l.id||l.nome)}">${esc(l.telefone)}</a>`:'<button class="v54-btn primary" disabled>Sem telefone</button>'}<button class="v54-btn" data-v54-open-lead="${esc(l.id||l.nome)}">Abrir lead</button></div>
      <div class="v54-result-grid"><button class="v54-btn" data-v54-call-result="Atendeu">✅ Atendeu</button><button class="v54-btn" data-v54-call-result="Não atendeu">📵 Não atendeu</button><button class="v54-btn" data-v54-call-result="Reunião marcada">📅 Reunião</button><button class="v54-btn" data-v54-call-result="Enviar WhatsApp">💬 WhatsApp</button><button class="v54-btn" data-v54-call-result="Sem interesse">🚫 Sem interesse</button><button class="v54-btn" data-v54-call-result="Caixa postal">🎙 Caixa postal</button></div>
      <div class="v54-field"><label>Observação da ligação</label><textarea id="v54CallNote" rows="3" placeholder="Ex: não atendeu, pediu retorno, reunião marcada..."></textarea></div>
      <div class="v54-script-box"><b>Script rápido</b>\nOlá, falo com ${esc(l.responsavel||'o responsável')}? Aqui é [seu nome]. Vi a ${esc(l.nome||'empresa')} e queria te fazer uma pergunta rápida. Hoje vocês conseguem acompanhar contatos, follow-ups e oportunidades sem perder retorno?</div>`;
  }
  function saveCallResult(result){
    const leads=getLeads(); const l=leads.find(x=>String(x.id||x.nome)===String(state.selectedCall)); if(!l) return;
    if(!Array.isArray(l.atividades)) l.atividades=[];
    const note=($('#v54CallNote')?.value||'').trim();
    l.atividades.unshift({id:'v54_call_'+Date.now(),tipo:'Ligação',autor:'CRM',data:new Date().toISOString(),texto:`Resultado: ${result}.${note?' Observação: '+note:''}`});
    l.ultimaAtualizacao=todayISO();
    if(result==='Não atendeu'||result==='Caixa postal') l.followup=addDays(todayISO(),1);
    if(result==='Reunião marcada') { l.followup=addDays(todayISO(),2); upsertEvent({titulo:'Reunião: '+(l.nome||'Lead'),leadNome:l.nome||'',data:addDays(todayISO(),2),hora:'09:00',tipo:'Reunião',prioridade:l.prioridade||'Média',notas:'Criado a partir de ligação.'}); }
    if(result==='Sem interesse') { l.prioridade='Baixa'; l.followup=addDays(todayISO(),15); }
    if(result==='Enviar WhatsApp' && digits(l.telefone)) window.open('https://wa.me/'+fullPhone(l.telefone).replace(/\D/g,''),'_blank');
    saveLeads(leads); notify('Resultado da ligação registrado.'); renderCalls();
  }

  function bind(){
    DOC.addEventListener('click', function(e){
      const side=e.target.closest('#v54SidebarGrip,#v54SidebarEdge');
      if(side){e.preventDefault();e.stopPropagation();setCollapsed(!DOC.body.classList.contains('crm-v54-sidebar-collapsed'),true);return;}
      const nav=e.target.closest('[data-view]');
      if(nav){setTimeout(()=>setViewClass(true),120);}
      const cv=e.target.closest('[data-v54-cal-view]');
      if(cv){e.preventDefault();setCalView(cv.dataset.v54CalView);return;}
      if(e.target.closest('#v54CalToday')){e.preventDefault();state.calDate=parseDate(todayISO());localStorage.setItem(KEY_CAL_DATE,todayISO());renderAgenda();return;}
      if(e.target.closest('#v54CalPrev')){e.preventDefault();moveCalendar(-1);return;}
      if(e.target.closest('#v54CalNext')){e.preventDefault();moveCalendar(1);return;}
      if(e.target.closest('#v54NewEventBtn')){e.preventDefault();openEventDrawer({new:true,data:toISO(state.calDate),hora:'09:00',tipo:'Reunião',prioridade:'Média',titulo:'Novo compromisso'});return;}
      if(e.target.closest('#v54AgendaRefresh')){e.preventDefault();renderAgenda();notify('Agenda atualizada.');return;}
      const mini=e.target.closest('[data-v54-open-month]');
      if(mini){e.preventDefault();state.calDate=new Date(state.calDate.getFullYear(),Number(mini.dataset.v54OpenMonth),1,12);localStorage.setItem(KEY_CAL_DATE,toISO(state.calDate));setCalView('month');return;}
      const ev=e.target.closest('[data-v54-event]');
      if(ev){e.preventDefault();e.stopPropagation();openEventDrawer(ev.dataset.v54Event);return;}
      const day=e.target.closest('[data-v54-new-date]');
      if(day){e.preventDefault();openEventDrawer({new:true,data:day.dataset.v54NewDate,hora:day.dataset.v54NewHour||'09:00',tipo:'Reunião',prioridade:'Média',titulo:'Novo compromisso'});return;}
      if(e.target.closest('[data-v54-close-drawer]')){$('#v54EventDrawer')?.classList.remove('show');return;}
      if(e.target.closest('#v54SaveEventBtn')){e.preventDefault();saveEventFromDrawer();return;}
      if(e.target.closest('#v54DeleteEventBtn')){e.preventDefault();const id=$('#v54EventDrawer')?.dataset.eventId;if(id){deleteEvent(id);$('#v54EventDrawer')?.classList.remove('show');notify('Compromisso excluído.');}return;}
      const open=e.target.closest('[data-v54-open-lead]');
      if(open){e.preventDefault();openLead(open.dataset.v54OpenLead);return;}
      const row=e.target.closest('[data-v54-call-select]');
      if(row && !e.target.closest('a')){e.preventDefault();state.selectedCall=row.dataset.v54CallSelect;localStorage.setItem('crm_v54_selected_call',state.selectedCall);renderCalls();return;}
      if(e.target.closest('#v54CallBest')){e.preventDefault();const q=callQueue().filter(l=>digits(l.telefone));if(q[0]){state.selectedCall=q[0].id||q[0].nome;localStorage.setItem('crm_v54_selected_call',state.selectedCall);renderCalls();notify('Próximo melhor lead selecionado.');}return;}
      if(e.target.closest('#v54CallRefresh')){e.preventDefault();renderCalls();return;}
      const result=e.target.closest('[data-v54-call-result]');
      if(result){e.preventDefault();saveCallResult(result.dataset.v54CallResult);return;}
      const callLink=e.target.closest('[data-v54-call-link]');
      if(callLink){setTimeout(()=>{try{const l=findLead(callLink.dataset.v54CallLink); if(l){ if(!Array.isArray(l.atividades)) l.atividades=[]; l.atividades.unshift({id:'v54_dial_'+Date.now(),tipo:'Ligação',autor:'CRM',data:new Date().toISOString(),texto:'Discador aberto pelo link de telefone.'}); l.ultimaAtualizacao=todayISO(); saveLeads(getLeads()); }}catch(err){}},250);}
    }, true);
    DOC.addEventListener('input', function(e){
      if(e.target?.id==='v54CallSearch'){localStorage.setItem('crm_v54_call_search',e.target.value);renderCalls();}
    });
    DOC.addEventListener('change', function(e){
      if(e.target?.id==='v54CallFilter'){localStorage.setItem('crm_v54_call_filter',e.target.value);renderCalls();}
      if(e.target?.id==='v54EvLead'){
        const l=findLead(e.target.value); const title=$('#v54EvTitle'); if(l && title && (!title.value || title.value==='Novo compromisso')) title.value='Compromisso: '+l.nome;
      }
    });
    DOC.addEventListener('keydown', function(e){
      if(e.key==='Escape') $('#v54EventDrawer')?.classList.remove('show');
    });
  }

  function boot(){
    installSidebar(); ensureOfficialApps(); bind(); setViewClass(true);
    setTimeout(()=>{installSidebar();setViewClass(true);},250);
    setTimeout(()=>{installSidebar();setViewClass(false);},1000);
    let timer;
    new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{installSidebar();setViewClass(false);},180);}).observe(DOC.body,{childList:true,subtree:true});
  }
  if(DOC.readyState==='loading') DOC.addEventListener('DOMContentLoaded', boot); else boot();
})();
