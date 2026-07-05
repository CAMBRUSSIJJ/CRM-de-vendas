/* CRM v52 — sidebar profissional, agenda estilo calendário e telefones clicáveis */
(function(){
  'use strict';
  if(window.__crmV52SidebarCalendarCalls) return;
  window.__crmV52SidebarCalendarCalls = true;

  const DOC = document;
  const $ = (s,r=DOC)=>r.querySelector(s);
  const $$ = (s,r=DOC)=>Array.from(r.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const pad = n => String(n).padStart(2,'0');
  const ptMonths = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const ptMonthsShort = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const ptWeekdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const parseDate = v => { const s=String(v||todayISO()).slice(0,10); const [y,m,d]=s.split('-').map(Number); return new Date(y||new Date().getFullYear(), (m||1)-1, d||1, 12,0,0,0); };
  const normalize = v => String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  const state = {
    calView: localStorage.getItem('crm_v52_calendar_view') || 'month',
    calDate: parseDate(localStorage.getItem('crm_v52_calendar_date') || todayISO())
  };

  function toast(msg,type='success'){
    try{ (window.crmToast || window.showToast || showToast)(msg,type); }catch(e){ console.log(msg); }
  }
  function getAgenda(){
    try{ if(window.crmAgendaAPI?.get) return window.crmAgendaAPI.get() || []; }catch(e){}
    try{ return JSON.parse(localStorage.getItem('outbounder_agenda_v1') || '[]') || []; }catch(e){ return []; }
  }
  function saveAgenda(arr){
    try{ if(window.crmAgendaAPI?.set) return window.crmAgendaAPI.set(arr); }catch(e){}
    try{ localStorage.setItem('outbounder_agenda_v1', JSON.stringify(arr || [])); }catch(e){}
  }
  function getLeads(){
    try{ if(typeof window.crmGetLeads === 'function') return window.crmGetLeads() || []; }catch(e){}
    try{ if(Array.isArray(window.leads)) return window.leads; }catch(e){}
    try{ return JSON.parse(localStorage.getItem('outbounder_leads_v5') || '[]') || []; }catch(e){ return []; }
  }
  function getLead(ref){
    const key = normalize(ref);
    return getLeads().find(l => normalize(l.id)===key || normalize(l.nome)===key || normalize(l.empresa)===key);
  }
  function openLead(ref){
    try{ if(typeof window.crmOpenLead === 'function') return window.crmOpenLead(ref); }catch(e){}
    try{ if(typeof window.openDetail === 'function') return window.openDetail(ref); }catch(e){}
  }
  function eventId(ev){ return String(ev.id || ev.evid || `${ev.data}_${ev.hora}_${ev.leadNome}_${ev.tipo}`); }
  function sortedEvents(){
    return getAgenda().slice().sort((a,b)=>String(a.data||'').localeCompare(String(b.data||'')) || String(a.hora||'').localeCompare(String(b.hora||'')) || String(a.leadNome||'').localeCompare(String(b.leadNome||'')));
  }
  function eventsOn(iso){ return sortedEvents().filter(e => String(e.data||'').slice(0,10) === iso); }
  function eventTitle(ev){ return ev.titulo || ev.title || ev.leadNome || ev.tipo || 'Compromisso'; }
  function eventMeta(ev){ return [ev.hora, ev.tipo, ev.prioridade].filter(Boolean).join(' • ') || 'Sem horário'; }

  function fullPhone(v){
    let d = String(v||'').replace(/\D/g,'');
    if(!d) return '';
    if(d.startsWith('00')) d = d.slice(2);
    if(d.length <= 11 && !d.startsWith('55')) d = '55' + d;
    return d;
  }
  function telHref(v){ const d=fullPhone(v); return d ? `tel:+${d}` : '#'; }
  function formatPhoneText(v){ return String(v||'').trim() || '+55'; }

  function installSidebar(){
    DOC.body.classList.add('crm-v52');
    const saved = localStorage.getItem('crm_v52_sidebar_collapsed') === '1' || localStorage.getItem('crm_v51_sidebar_collapsed') === '1';
    setSidebarCollapsed(saved, false);
    const brand = $('.sidebar-brand');
    if(brand && !$('#v52SidebarToggle')){
      $('#v51SidebarToggle')?.setAttribute('aria-hidden','true');
      brand.insertAdjacentHTML('beforeend', `<button type="button" class="v52-sidebar-toggle" id="v52SidebarToggle" aria-label="Recolher menu lateral" title="Recolher/expandir menu"><svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"></path></svg></button>`);
    }
    $$('.v51-nav-group').forEach(g=>{
      const sub = g.querySelector('.v51-subnav');
      if(sub && !g.classList.contains('v51-open')) g.classList.add('v51-open');
    });
  }
  function setSidebarCollapsed(collapsed, notify=true){
    DOC.body.classList.toggle('crm-v52-sidebar-collapsed', collapsed);
    DOC.body.classList.toggle('crm-v51-sidebar-collapsed', collapsed);
    DOC.body.classList.toggle('crm-sidebar-collapsed', collapsed);
    localStorage.setItem('crm_v52_sidebar_collapsed', collapsed ? '1' : '0');
    localStorage.setItem('crm_v51_sidebar_collapsed', collapsed ? '1' : '0');
    const btn=$('#v52SidebarToggle');
    if(btn){ btn.setAttribute('aria-label', collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'); btn.title = collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'; }
    if(notify) toast(collapsed ? 'Menu recolhido' : 'Menu expandido','success');
  }

  function installCalendar(){
    const page = $('#agenda'); if(!page) return;
    page.classList.add('v52-agenda');
    if(!$('#v52CalendarApp')){
      const ref = $('#v51AgendaCommand') || page.querySelector('.section-header') || page.firstElementChild;
      const shell = `<section class="v52-calendar-shell" id="v52CalendarApp" aria-label="Calendário profissional">
        <div class="v52-cal-top">
          <div class="v52-cal-left">
            <button type="button" class="v52-cal-btn" id="v52CalToday">Hoje</button>
            <button type="button" class="v52-cal-btn icon" id="v52CalPrev" aria-label="Anterior">‹</button>
            <button type="button" class="v52-cal-btn icon" id="v52CalNext" aria-label="Próximo">›</button>
            <div class="v52-cal-title" id="v52CalTitle">Agenda</div>
          </div>
          <div class="v52-cal-right">
            <div class="v52-cal-segment" id="v52CalViews">
              <button type="button" data-v52-cal-view="month">Mês</button>
              <button type="button" data-v52-cal-view="day">Dia</button>
              <button type="button" data-v52-cal-view="year">Ano</button>
              <button type="button" data-v52-cal-view="list">Lista</button>
            </div>
            <button type="button" class="v52-cal-btn" id="v52CalFilters">Filtros</button>
            <button type="button" class="v52-cal-btn primary" id="v52CalNew">+ Criar</button>
          </div>
        </div>
        <div class="v52-cal-body" id="v52CalBody"></div>
      </section>`;
      ref?.insertAdjacentHTML('afterend', shell);
    }
    ensureEventDrawer();
    renderCalendar();
  }

  function setCalendarView(view){
    state.calView = view;
    localStorage.setItem('crm_v52_calendar_view', view);
    renderCalendar();
  }
  function moveCalendar(delta){
    const d = new Date(state.calDate);
    if(state.calView === 'day') d.setDate(d.getDate() + delta);
    else if(state.calView === 'year') d.setFullYear(d.getFullYear() + delta);
    else d.setMonth(d.getMonth() + delta);
    state.calDate = d; localStorage.setItem('crm_v52_calendar_date', toISO(d)); renderCalendar();
  }
  function calendarTitle(){
    const d=state.calDate;
    if(state.calView==='day') return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
    if(state.calView==='year') return String(d.getFullYear());
    if(state.calView==='list') return 'Lista de compromissos';
    return `${ptMonths[d.getMonth()]} de ${d.getFullYear()}`;
  }
  function renderCalendar(){
    const app=$('#v52CalendarApp'), body=$('#v52CalBody'); if(!app||!body) return;
    $('#v52CalTitle') && ($('#v52CalTitle').textContent = calendarTitle());
    $$('#v52CalViews button').forEach(b=>b.classList.toggle('active', b.dataset.v52CalView === state.calView));
    const agenda=$('#agenda');
    agenda?.classList.toggle('v52-list-mode', state.calView==='list');
    if(state.calView==='list'){
      try{ $('#agViewList')?.click(); }catch(e){}
      body.innerHTML='';
      return;
    }
    try{ $('#agViewList')?.click(); }catch(e){}
    if(state.calView==='day') body.innerHTML = renderDayView();
    else if(state.calView==='year') body.innerHTML = renderYearView();
    else body.innerHTML = renderMonthView();
  }
  function renderMonthView(){
    const d = state.calDate;
    const first = new Date(d.getFullYear(), d.getMonth(), 1, 12);
    const start = new Date(first); start.setDate(first.getDate() - first.getDay());
    const cells=[]; const now=todayISO();
    for(let i=0;i<42;i++){
      const cur = new Date(start); cur.setDate(start.getDate()+i);
      const iso=toISO(cur); const evs=eventsOn(iso); const inMonth=cur.getMonth()===d.getMonth();
      const list=evs.slice(0,3).map(ev=>`<button type="button" class="v52-event" data-v52-event="${esc(eventId(ev))}"><time>${esc(ev.hora||'--:--')}</time>${esc(eventTitle(ev))}</button>`).join('');
      cells.push(`<div class="v52-day-cell ${inMonth?'':'muted'} ${iso===now?'today':''}" data-v52-day="${iso}"><div class="v52-day-number"><b>${cur.getDate()}</b><button type="button" class="v52-day-add" data-v52-new-day="${iso}" title="Novo compromisso">+</button></div>${list}${evs.length>3?`<div class="v52-more-events">+${evs.length-3} compromissos</div>`:''}</div>`);
    }
    return `<div class="v52-weekdays">${ptWeekdays.map(w=>`<span>${w}</span>`).join('')}</div><div class="v52-month-grid">${cells.join('')}</div>`;
  }
  function renderDayView(){
    const iso=toISO(state.calDate); const evs=eventsOn(iso); const byHour={};
    evs.forEach(ev=>{ const h = Math.max(7, Math.min(21, Number(String(ev.hora||'09:00').slice(0,2)) || 9)); (byHour[h] ||= []).push(ev); });
    let rows='';
    for(let h=7; h<=21; h++){
      const items=(byHour[h]||[]).map(ev=>`<button type="button" class="v52-event" data-v52-event="${esc(eventId(ev))}"><time>${esc(ev.hora||pad(h)+':00')}</time>${esc(eventTitle(ev))}<small>${esc([ev.tipo,ev.prioridade].filter(Boolean).join(' • '))}</small></button>`).join('');
      rows += `<div class="v52-hour-label">${pad(h)}:00</div><div class="v52-hour-slot" data-v52-hour="${h}">${items || ''}</div>`;
    }
    return `<div class="v52-day-view">${rows}</div>${!evs.length?'<div class="v52-calendar-empty">Nenhum compromisso neste dia. Clique em + Criar para adicionar.</div>':''}`;
  }
  function renderYearView(){
    const y=state.calDate.getFullYear(); const now=todayISO();
    return `<div class="v52-year-grid">${Array.from({length:12},(_,m)=>renderMiniMonth(y,m,now)).join('')}</div>`;
  }
  function renderMiniMonth(y,m,now){
    const first=new Date(y,m,1,12); const start=new Date(first); start.setDate(first.getDate()-first.getDay());
    const monthEvents=sortedEvents().filter(e=>{const d=parseDate(e.data); return d.getFullYear()===y && d.getMonth()===m;});
    const has=new Set(monthEvents.map(e=>String(e.data).slice(0,10)));
    let spans='';
    for(let i=0;i<42;i++){
      const cur=new Date(start); cur.setDate(start.getDate()+i); const iso=toISO(cur); const inMonth=cur.getMonth()===m;
      spans += `<span class="${inMonth&&has.has(iso)?'has':''} ${iso===now?'today':''}" style="opacity:${inMonth?'1':'.24'}">${cur.getDate()}</span>`;
    }
    return `<button type="button" class="v52-mini-month" data-v52-open-month="${m}"><div class="v52-mini-title"><b>${ptMonthsShort[m]}</b><small>${monthEvents.length}</small></div><div class="v52-mini-grid">${spans}</div></button>`;
  }
  function ensureEventDrawer(){
    if($('#v52AgendaEventDrawer')) return;
    DOC.body.insertAdjacentHTML('beforeend', `<aside class="v51-drawer" id="v52AgendaEventDrawer" aria-hidden="true"><div class="v51-drawer-head"><div><h3 id="v52EventTitle">Compromisso</h3><p id="v52EventSub">Detalhes e ações rápidas.</p></div><button type="button" class="v51-drawer-close" data-v52-close-drawer="v52AgendaEventDrawer">×</button></div><div class="v51-drawer-body" id="v52EventBody"></div><div class="v51-drawer-foot"><button type="button" class="v51-pill-btn" data-v52-event-delay="1">Remarcar +1 dia</button><button type="button" class="v51-pill-btn primary" data-v52-event-done>Concluir</button></div></aside>`);
  }
  function openEventDrawer(id){
    const ev=sortedEvents().find(e=>eventId(e)===String(id)); if(!ev) return;
    const lead=getLead(ev.leadNome); const phone=lead?.telefone || ev.telefone || '';
    const drawer=$('#v52AgendaEventDrawer'); if(!drawer) return;
    drawer.dataset.eventId = eventId(ev);
    $('#v52EventTitle').textContent = eventTitle(ev);
    $('#v52EventSub').textContent = eventMeta(ev);
    $('#v52EventBody').innerHTML = `<div class="v51-grid-2"><div class="v51-field"><label>Data</label><input data-v52-event-field="data" value="${esc(String(ev.data||todayISO()).slice(0,10))}" type="date"></div><div class="v51-field"><label>Hora</label><input data-v52-event-field="hora" value="${esc(ev.hora||'09:00')}" type="time"></div></div><div class="v51-grid-2"><div class="v51-field"><label>Tipo</label><input data-v52-event-field="tipo" value="${esc(ev.tipo||'Compromisso')}"></div><div class="v51-field"><label>Prioridade</label><select data-v52-event-field="prioridade"><option ${ev.prioridade==='Alta'?'selected':''}>Alta</option><option ${ev.prioridade==='Média'?'selected':''}>Média</option><option ${ev.prioridade==='Baixa'?'selected':''}>Baixa</option></select></div></div><div class="v51-field"><label>Lead vinculado</label><input data-v52-event-field="leadNome" value="${esc(ev.leadNome||'')}"></div><div class="v51-field"><label>Notas</label><textarea rows="4" data-v52-event-field="notas">${esc(ev.notas||ev.descricao||'')}</textarea></div><div class="v51-actions" style="justify-content:flex-start"><button type="button" class="v51-pill-btn" data-v52-open-lead>Abrir lead</button>${phone?`<a class="v51-pill-btn primary" href="${esc(telHref(phone))}">Ligar pelo celular/PC</a>`:''}${phone?`<a class="v51-pill-btn" target="_blank" href="https://wa.me/${esc(fullPhone(phone))}">WhatsApp</a>`:''}</div><div class="v51-field"><label>Checklist de preparação</label><div class="v51-checklist"><label class="v51-checkitem"><input type="checkbox"> Revisar histórico do lead</label><label class="v51-checkitem"><input type="checkbox"> Definir objetivo do contato</label><label class="v51-checkitem"><input type="checkbox"> Preparar pergunta SPIN principal</label><label class="v51-checkitem"><input type="checkbox"> Sair com próximo passo claro</label></div></div>`;
    drawer.classList.add('show'); drawer.setAttribute('aria-hidden','false');
  }
  function updateEvent(id, patch){
    const arr=getAgenda(); const idx=arr.findIndex(e=>eventId(e)===String(id)); if(idx<0) return;
    arr[idx] = {...arr[idx], ...patch}; saveAgenda(arr);
    try{ window.crmAgendaAPI?.render?.(); }catch(e){}
    renderCalendar();
  }
  function newEventForDay(iso){
    try{ $('#agNewBtn')?.click(); setTimeout(()=>{ const date=$('#agDate,#agData,#eventDate'); if(date) date.value=iso; },120); return; }catch(e){}
  }

  function enhanceCallPhones(root=DOC){
    const scope = root.nodeType === 1 ? root : DOC;
    $$('#ligacoes #callTable tbody tr', scope).forEach(row=>{
      const td = row.children?.[2]; if(!td || td.querySelector('a')) return;
      const txt = td.textContent.trim(); if(fullPhone(txt)) td.innerHTML = `<a class="v52-phone-link" href="${esc(telHref(txt))}" title="Ligar pelo celular conectado ao PC">${esc(txt)}</a>`;
    });
    $$('#ligacoes .call-number', scope).forEach(el=>{
      if(el.querySelector('a')) return;
      const txt=el.textContent.trim(); if(fullPhone(txt)) el.innerHTML = `<a class="v52-phone-link" href="${esc(telHref(txt))}" title="Ligar pelo celular conectado ao PC">${esc(txt)}</a>`;
    });
    const detailPhone=$('#dTelefone');
    if(detailPhone && !detailPhone.querySelector('a')){ const txt=detailPhone.textContent.trim(); if(fullPhone(txt)) detailPhone.innerHTML = `<a class="v52-phone-link" href="${esc(telHref(txt))}" title="Ligar pelo celular conectado ao PC">${esc(txt)}</a>`; }
    const cmd=$('#v51CallsCommand');
    if(cmd && !$('#v52PhoneLinkNote')) cmd.insertAdjacentHTML('afterend', '<div class="v52-call-phone-note" id="v52PhoneLinkNote">Com o celular conectado ao Windows, clique diretamente no número do lead ou no botão “Abrir discador”. O link usa <b>tel:</b>, então o Windows abre o aplicativo padrão de chamadas.</div>');
  }
  function patchCallConfigNote(){
    const body=$('#v51CallConfigDrawer .v51-drawer-body');
    if(body && !$('#v52RecordingNote')) body.insertAdjacentHTML('beforeend', '<div class="v51-help" id="v52RecordingNote"><b>Gravação:</b> com tel:/Vincular ao Celular o CRM não consegue gravar a ligação automaticamente. Para gravação real seria necessário VoIP/API com suporte a gravação e consentimento.</div>');
  }

  function bind(){
    DOC.addEventListener('click', function(e){
      const toggle=e.target.closest('#v52SidebarToggle');
      if(toggle){ e.preventDefault(); e.stopImmediatePropagation(); setSidebarCollapsed(!DOC.body.classList.contains('crm-v52-sidebar-collapsed')); return; }
      const viewBtn=e.target.closest('[data-v52-cal-view]');
      if(viewBtn){ e.preventDefault(); setCalendarView(viewBtn.dataset.v52CalView); return; }
      if(e.target.closest('#v52CalPrev')){ e.preventDefault(); moveCalendar(-1); return; }
      if(e.target.closest('#v52CalNext')){ e.preventDefault(); moveCalendar(1); return; }
      if(e.target.closest('#v52CalToday')){ e.preventDefault(); state.calDate=parseDate(todayISO()); localStorage.setItem('crm_v52_calendar_date',todayISO()); renderCalendar(); return; }
      if(e.target.closest('#v52CalNew')){ e.preventDefault(); newEventForDay(toISO(state.calDate)); return; }
      if(e.target.closest('#v52CalFilters')){ e.preventDefault(); $('#v51AgendaFilters')?.click(); $('#v51AgendaFilterDrawer')?.classList.add('show'); return; }
      const month=e.target.closest('[data-v52-open-month]');
      if(month){ e.preventDefault(); state.calDate=new Date(state.calDate.getFullYear(), Number(month.dataset.v52OpenMonth), 1, 12); setCalendarView('month'); return; }
      const ev=e.target.closest('[data-v52-event]');
      if(ev){ e.preventDefault(); openEventDrawer(ev.dataset.v52Event); return; }
      const dayAdd=e.target.closest('[data-v52-new-day]');
      if(dayAdd){ e.preventDefault(); newEventForDay(dayAdd.dataset.v52NewDay); return; }
      const close=e.target.closest('[data-v52-close-drawer]');
      if(close){ const d=$('#'+close.dataset.v52CloseDrawer); d?.classList.remove('show'); d?.setAttribute('aria-hidden','true'); return; }
      const delay=e.target.closest('[data-v52-event-delay]');
      if(delay){ const id=$('#v52AgendaEventDrawer')?.dataset.eventId; const evObj=sortedEvents().find(x=>eventId(x)===id); if(evObj){ const d=parseDate(evObj.data); d.setDate(d.getDate()+Number(delay.dataset.v52EventDelay||1)); updateEvent(id,{data:toISO(d)}); openEventDrawer(id); toast('Compromisso remarcado','success'); } return; }
      if(e.target.closest('[data-v52-event-done]')){ const id=$('#v52AgendaEventDrawer')?.dataset.eventId; if(id){ updateEvent(id,{status:'concluido'}); $('#v52AgendaEventDrawer')?.classList.remove('show'); toast('Compromisso concluído','success'); } return; }
      if(e.target.closest('[data-v52-open-lead]')){ const id=$('#v52AgendaEventDrawer')?.dataset.eventId; const evObj=sortedEvents().find(x=>eventId(x)===id); if(evObj) openLead(evObj.leadNome); return; }
    }, true);
    DOC.addEventListener('input', function(e){
      const field=e.target.closest('[data-v52-event-field]');
      if(field){ const id=$('#v52AgendaEventDrawer')?.dataset.eventId; if(id) updateEvent(id,{[field.dataset.v52EventField]:field.value}); }
    });
  }

  function refreshAll(){
    installSidebar();
    installCalendar();
    enhanceCallPhones();
    patchCallConfigNote();
  }
  function boot(){
    DOC.body.classList.add('crm-v52');
    installSidebar();
    installCalendar();
    enhanceCallPhones();
    patchCallConfigNote();
    setTimeout(refreshAll, 350);
    setTimeout(refreshAll, 1200);
    const mo = new MutationObserver(()=>{ clearTimeout(window.__crmV52Timer); window.__crmV52Timer=setTimeout(refreshAll,90); });
    mo.observe(DOC.body,{subtree:true,childList:true,characterData:true});
  }

  if(DOC.readyState === 'loading') DOC.addEventListener('DOMContentLoaded', boot); else boot();
})();
