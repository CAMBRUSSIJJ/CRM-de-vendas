/* CRM v53 — corrige sidebar sem setas, agenda clicável estilo Google Calendar e telefones tel: */
(function(){
  'use strict';
  if(window.__crmV53SidebarAgendaLigacoes) return;
  window.__crmV53SidebarAgendaLigacoes = true;

  const DOC = document;
  const $ = (s,r=DOC)=>r.querySelector(s);
  const $$ = (s,r=DOC)=>Array.from(r.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const pad = n => String(n).padStart(2,'0');
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const monthsShort = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const weekdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const parseDate = v => { const s=String(v||todayISO()).slice(0,10); const [y,m,d]=s.split('-').map(Number); return new Date(y||new Date().getFullYear(),(m||1)-1,d||1,12); };
  const norm = v => String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  const state = {
    view: localStorage.getItem('crm_v53_calendar_view') || 'month',
    date: parseDate(localStorage.getItem('crm_v53_calendar_date') || todayISO())
  };

  function toast(msg,type='success'){
    try{ (window.crmToast || window.showToast || showToast)(msg,type); }catch(e){ console.log(msg); }
  }
  function getAgenda(){
    try{ if(window.crmAgendaAPI?.get) return window.crmAgendaAPI.get() || []; }catch(e){}
    try{ return JSON.parse(localStorage.getItem('outbounder_agenda_v1') || '[]') || []; }catch(e){ return []; }
  }
  function saveAgenda(arr){
    try{ if(window.crmAgendaAPI?.set) return window.crmAgendaAPI.set(arr || []); }catch(e){}
    try{ localStorage.setItem('outbounder_agenda_v1', JSON.stringify(arr || [])); }catch(e){}
  }
  function getLeads(){
    try{ if(typeof window.crmGetLeads === 'function') return window.crmGetLeads() || []; }catch(e){}
    try{ if(Array.isArray(window.leads)) return window.leads; }catch(e){}
    try{ return JSON.parse(localStorage.getItem('outbounder_leads_v5') || '[]') || []; }catch(e){ return []; }
  }
  function findLead(ref){ const k=norm(ref); return getLeads().find(l => norm(l.id)===k || norm(l.nome)===k || norm(l.empresa)===k); }
  function eventId(ev){ return String(ev.id || ev.evid || `${ev.data}_${ev.hora}_${ev.leadNome}_${ev.tipo}`); }
  function sortedEvents(){ return getAgenda().slice().sort((a,b)=>String(a.data||'').localeCompare(String(b.data||'')) || String(a.hora||'').localeCompare(String(b.hora||'')) || String(a.leadNome||a.titulo||'').localeCompare(String(b.leadNome||b.titulo||''))); }
  function eventsOn(iso){ return sortedEvents().filter(e => String(e.data||'').slice(0,10) === iso); }
  function title(ev){ return ev.titulo || ev.title || ev.leadNome || ev.tipo || 'Compromisso'; }
  function meta(ev){ return [ev.hora, ev.tipo, ev.prioridade].filter(Boolean).join(' • ') || 'Sem horário'; }
  function fullPhone(v){ let d=String(v||'').replace(/\D/g,''); if(!d) return ''; if(d.startsWith('00')) d=d.slice(2); if(d.length<=11 && !d.startsWith('55')) d='55'+d; return d; }
  function telHref(v){ const d=fullPhone(v); return d ? `tel:+${d}` : '#'; }

  function setCollapsed(collapsed, notify=false){
    DOC.body.classList.toggle('crm-v53-sidebar-collapsed', collapsed);
    DOC.body.classList.toggle('crm-v52-sidebar-collapsed', collapsed);
    DOC.body.classList.toggle('crm-v51-sidebar-collapsed', collapsed);
    DOC.body.classList.toggle('crm-sidebar-collapsed', collapsed);
    localStorage.setItem('crm_v53_sidebar_collapsed', collapsed ? '1' : '0');
    localStorage.setItem('crm_v52_sidebar_collapsed', collapsed ? '1' : '0');
    localStorage.setItem('crm_v51_sidebar_collapsed', collapsed ? '1' : '0');
    $$('#v53SidebarToggle,#v53SidebarHandle').forEach(btn=>{
      btn.setAttribute('aria-label', collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral');
      btn.title = collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral';
    });
    if(notify) toast(collapsed ? 'Menu recolhido' : 'Menu expandido');
  }

  function installSidebar(){
    DOC.body.classList.add('crm-v53');
    $$('.v51-group-chevron').forEach(btn => btn.remove());
    $('#v51SidebarToggle')?.remove();
    $('#v52SidebarToggle')?.remove();
    const brand = $('.sidebar-brand');
    if(brand && !$('#v53SidebarToggle')){
      brand.insertAdjacentHTML('beforeend','<button type="button" class="v53-sidebar-toggle" id="v53SidebarToggle" aria-label="Recolher menu lateral" title="Recolher/expandir menu"><span class="v53-lines" aria-hidden="true"><i></i><i></i><i></i></span></button>');
    }
    if(!$('#v53SidebarHandle')){
      DOC.body.insertAdjacentHTML('beforeend','<button type="button" class="v53-sidebar-handle" id="v53SidebarHandle" aria-label="Recolher menu lateral" title="Recolher/expandir menu"><span aria-hidden="true"></span></button>');
    }
    $$('.v51-nav-group.v51-has-sub').forEach(g => g.classList.add('v51-open'));
    const saved = localStorage.getItem('crm_v53_sidebar_collapsed');
    const collapsed = saved === null ? (localStorage.getItem('crm_v52_sidebar_collapsed') === '1' || localStorage.getItem('crm_v51_sidebar_collapsed') === '1') : saved === '1';
    setCollapsed(collapsed, false);
  }

  function setView(view){
    state.view = view;
    localStorage.setItem('crm_v53_calendar_view', view);
    renderCalendar();
  }
  function move(delta){
    const d = new Date(state.date);
    if(state.view === 'day') d.setDate(d.getDate()+delta);
    else if(state.view === 'year') d.setFullYear(d.getFullYear()+delta);
    else d.setMonth(d.getMonth()+delta);
    state.date = d;
    localStorage.setItem('crm_v53_calendar_date', toISO(d));
    renderCalendar();
  }
  function calTitle(){
    const d=state.date;
    if(state.view==='day') return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
    if(state.view==='year') return String(d.getFullYear());
    if(state.view==='list') return 'Lista de compromissos';
    return `${months[d.getMonth()]} de ${d.getFullYear()}`;
  }

  function installCalendar(){
    const page = $('#agenda'); if(!page) return;
    page.classList.add('v53-agenda');
    if(!$('#v53CalendarApp')){
      const ref = page.querySelector('.section-header') || page.firstElementChild;
      ref?.insertAdjacentHTML('afterend', `<section class="v53-calendar-shell" id="v53CalendarApp" aria-label="Calendário da agenda">
        <div class="v53-cal-top">
          <div class="v53-cal-left">
            <button type="button" class="v53-cal-btn" id="v53CalToday">Hoje</button>
            <button type="button" class="v53-cal-btn" id="v53CalPrev">Anterior</button>
            <button type="button" class="v53-cal-btn" id="v53CalNext">Próximo</button>
            <div class="v53-cal-title" id="v53CalTitle">Agenda</div>
          </div>
          <div class="v53-cal-right">
            <div class="v53-cal-segment" id="v53CalViews">
              <button type="button" data-v53-cal-view="month">Mês</button>
              <button type="button" data-v53-cal-view="day">Dia</button>
              <button type="button" data-v53-cal-view="year">Ano</button>
              <button type="button" data-v53-cal-view="list">Lista</button>
            </div>
            <button type="button" class="v53-cal-btn" id="v53CalFilters">Filtros</button>
            <button type="button" class="v53-cal-btn primary" id="v53CalNew">+ Criar</button>
          </div>
        </div>
        <div class="v53-cal-body" id="v53CalBody"></div>
      </section>`);
    }
    ensureDrawer();
    renderCalendar();
  }

  function renderCalendar(){
    const body = $('#v53CalBody'); if(!body) return;
    $('#v53CalTitle') && ($('#v53CalTitle').textContent = calTitle());
    $$('#v53CalViews [data-v53-cal-view]').forEach(b=>b.classList.toggle('active', b.dataset.v53CalView === state.view));
    $('#agenda')?.classList.toggle('v53-calendar-mode', state.view !== 'list');
    if(state.view === 'day') body.innerHTML = renderDay();
    else if(state.view === 'year') body.innerHTML = renderYear();
    else if(state.view === 'list') body.innerHTML = renderList();
    else body.innerHTML = renderMonth();
  }
  function renderMonth(){
    const d=state.date; const first=new Date(d.getFullYear(),d.getMonth(),1,12); const start=new Date(first); start.setDate(first.getDate()-first.getDay()); const now=todayISO(); const cells=[];
    for(let i=0;i<42;i++){
      const cur=new Date(start); cur.setDate(start.getDate()+i); const iso=toISO(cur); const evs=eventsOn(iso); const inMonth=cur.getMonth()===d.getMonth();
      const list=evs.slice(0,3).map(ev=>`<button type="button" class="v53-event" data-v53-event="${esc(eventId(ev))}"><time>${esc(ev.hora||'--:--')}</time>${esc(title(ev))}</button>`).join('');
      cells.push(`<div class="v53-day-cell ${inMonth?'':'muted'} ${iso===now?'today':''}" data-v53-new-day="${iso}"><div class="v53-day-head"><span class="v53-day-number">${cur.getDate()}</span><span class="v53-day-hint">+</span></div>${list}${evs.length>3?`<div class="v53-more-events">+${evs.length-3} compromissos</div>`:''}</div>`);
    }
    return `<div class="v53-weekdays">${weekdays.map(w=>`<span>${w}</span>`).join('')}</div><div class="v53-month-grid">${cells.join('')}</div>`;
  }
  function renderDay(){
    const iso=toISO(state.date); const evs=eventsOn(iso); const byHour={};
    evs.forEach(ev=>{ const h=Math.max(7,Math.min(21,Number(String(ev.hora||'09:00').slice(0,2))||9)); (byHour[h] ||= []).push(ev); });
    let rows='';
    for(let h=7;h<=21;h++){
      const items=(byHour[h]||[]).map(ev=>`<button type="button" class="v53-event" data-v53-event="${esc(eventId(ev))}"><time>${esc(ev.hora||pad(h)+':00')}</time>${esc(title(ev))}<small>${esc([ev.tipo,ev.prioridade].filter(Boolean).join(' • '))}</small></button>`).join('');
      rows += `<div class="v53-hour-label">${pad(h)}:00</div><div class="v53-hour-slot" data-v53-new-day="${iso}" data-v53-hour="${pad(h)}:00">${items || '<span class="v53-hour-empty">Clique para criar compromisso</span>'}</div>`;
    }
    return `<div class="v53-day-view">${rows}</div>${!evs.length?'<div class="v53-calendar-empty">Nenhum compromisso neste dia. Clique em um horário para criar.</div>':''}`;
  }
  function renderYear(){
    const y=state.date.getFullYear(); const now=todayISO();
    return `<div class="v53-year-grid">${Array.from({length:12},(_,m)=>miniMonth(y,m,now)).join('')}</div>`;
  }
  function miniMonth(y,m,now){
    const first=new Date(y,m,1,12); const start=new Date(first); start.setDate(first.getDate()-first.getDay());
    const monthEvents=sortedEvents().filter(e=>{ const d=parseDate(e.data); return d.getFullYear()===y && d.getMonth()===m; });
    const has=new Set(monthEvents.map(e=>String(e.data||'').slice(0,10)));
    let days='';
    for(let i=0;i<42;i++){ const cur=new Date(start); cur.setDate(start.getDate()+i); const iso=toISO(cur); const inMonth=cur.getMonth()===m; days += `<span class="${inMonth&&has.has(iso)?'has':''} ${iso===now?'today':''}" style="opacity:${inMonth?'1':'.23'}">${cur.getDate()}</span>`; }
    return `<button type="button" class="v53-mini-month" data-v53-open-month="${m}"><div class="v53-mini-title"><b>${monthsShort[m]}</b><small>${monthEvents.length}</small></div><div class="v53-mini-grid">${days}</div></button>`;
  }
  function renderList(){
    const evs=sortedEvents();
    if(!evs.length) return '<div class="v53-calendar-empty">Nenhum compromisso cadastrado ainda.</div>';
    return `<div class="v53-list-view">${evs.map(ev=>`<button type="button" class="v53-list-item" data-v53-event="${esc(eventId(ev))}"><div><b>${esc(title(ev))}</b><br><span>${esc(String(ev.data||'').slice(0,10))} • ${esc(meta(ev))}</span></div><span>Abrir</span></button>`).join('')}</div>`;
  }

  function ensureDrawer(){
    if($('#v53AgendaDrawer')) return;
    DOC.body.insertAdjacentHTML('beforeend', `<aside class="v51-drawer" id="v53AgendaDrawer" aria-hidden="true">
      <div class="v51-drawer-head"><div><h3 id="v53EventTitle">Compromisso</h3><p id="v53EventSub">Detalhes do compromisso.</p></div><button type="button" class="v51-drawer-close" data-v53-close-drawer="v53AgendaDrawer">×</button></div>
      <div class="v51-drawer-body" id="v53EventBody"></div>
      <div class="v51-drawer-foot"><button type="button" class="v51-pill-btn" data-v53-event-delay="1">Remarcar +1 dia</button><button type="button" class="v51-pill-btn primary" data-v53-event-done>Concluir</button></div>
    </aside>`);
  }
  function openEvent(id){
    const ev=sortedEvents().find(e=>eventId(e)===String(id)); if(!ev) return;
    const lead=findLead(ev.leadNome); const phone=lead?.telefone || ev.telefone || '';
    const drawer=$('#v53AgendaDrawer'); if(!drawer) return;
    drawer.dataset.eventId=eventId(ev);
    $('#v53EventTitle').textContent=title(ev);
    $('#v53EventSub').textContent=meta(ev);
    $('#v53EventBody').innerHTML = `<div class="v51-grid-2"><div class="v51-field"><label>Data</label><input data-v53-event-field="data" type="date" value="${esc(String(ev.data||todayISO()).slice(0,10))}"></div><div class="v51-field"><label>Hora</label><input data-v53-event-field="hora" type="time" value="${esc(ev.hora||'09:00')}"></div></div><div class="v51-grid-2"><div class="v51-field"><label>Tipo</label><input data-v53-event-field="tipo" value="${esc(ev.tipo||'Compromisso')}"></div><div class="v51-field"><label>Prioridade</label><select data-v53-event-field="prioridade"><option ${ev.prioridade==='Alta'?'selected':''}>Alta</option><option ${ev.prioridade==='Média'?'selected':''}>Média</option><option ${ev.prioridade==='Baixa'?'selected':''}>Baixa</option></select></div></div><div class="v51-field"><label>Lead vinculado</label><input data-v53-event-field="leadNome" value="${esc(ev.leadNome||'')}"></div><div class="v51-field"><label>Notas</label><textarea rows="4" data-v53-event-field="notas">${esc(ev.notas||ev.descricao||'')}</textarea></div><div class="v51-actions" style="justify-content:flex-start"><button type="button" class="v51-pill-btn" data-v53-open-lead>Abrir lead</button>${phone?`<a class="v51-pill-btn primary" href="${esc(telHref(phone))}">Ligar pelo celular/PC</a>`:''}${phone?`<a class="v51-pill-btn" target="_blank" href="https://wa.me/${esc(fullPhone(phone))}">WhatsApp</a>`:''}</div><div class="v51-field"><label>Checklist antes do compromisso</label><div class="v51-checklist"><label class="v51-checkitem"><input type="checkbox"> Revisar histórico do lead</label><label class="v51-checkitem"><input type="checkbox"> Definir objetivo do contato</label><label class="v51-checkitem"><input type="checkbox"> Preparar pergunta principal</label><label class="v51-checkitem"><input type="checkbox"> Sair com próximo passo claro</label></div></div>`;
    drawer.classList.add('show'); drawer.setAttribute('aria-hidden','false');
  }
  function updateEvent(id, patch){
    const arr=getAgenda(); const idx=arr.findIndex(e=>eventId(e)===String(id)); if(idx<0) return;
    arr[idx] = {...arr[idx], ...patch}; saveAgenda(arr);
    try{ window.crmAgendaAPI?.render?.(); }catch(e){}
    renderCalendar();
  }
  function ensureFreeLeadOption(){
    const sel=$('#agEvLead'); if(!sel) return;
    if(!Array.from(sel.options).some(o=>o.value==='Compromisso livre')) sel.insertAdjacentHTML('beforeend','<option value="Compromisso livre">Compromisso livre / sem lead</option>');
  }
  function openNewEvent(iso, hour){
    try{ $('#agNewBtn')?.click(); }catch(e){}
    setTimeout(()=>{
      ensureFreeLeadOption();
      const back=$('#agEventBackdrop'); if(back) back.classList.remove('hidden');
      const data=$('#agEvData'); if(data) data.value=iso || todayISO();
      const hora=$('#agEvHora'); if(hora) hora.value=hour || '09:00';
      const titleEl=$('#agEventTitle'); if(titleEl) titleEl.textContent='Novo compromisso';
      if($('#agEvLead') && !$('#agEvLead').value) $('#agEvLead').value='Compromisso livre';
    },80);
  }

  function enhancePhones(root=DOC){
    const scope = root.nodeType === 1 ? root : DOC;
    // Tabela principal de ligações v36
    $$('#callTableV36 tr', scope).forEach(row=>{
      const ref=row.dataset.callV36 || row.querySelector('[data-call-v36-start]')?.dataset.callV36Start;
      const lead=findLead(ref);
      const td=row.children?.[2];
      if(td && lead?.telefone && !td.querySelector('a')) td.innerHTML = `<a class="v53-phone-link" href="${esc(telHref(lead.telefone))}" title="Ligar com celular conectado ao PC">${esc(lead.telefone)}</a>`;
      const btn=row.querySelector('[data-call-v36-start]');
      if(btn && lead?.telefone && btn.tagName !== 'A' && !btn.dataset.v53DialReady){
        btn.dataset.v53DialReady='1';
        btn.title='Ligar com celular conectado ao PC';
      }
    });
    // Discador lateral
    $$('#ligacoes .call-number', scope).forEach(el=>{
      if(el.querySelector('a')) return;
      const txt=el.textContent.trim(); if(fullPhone(txt)) el.innerHTML = `<a class="v53-phone-link" href="${esc(telHref(txt))}" title="Ligar com celular conectado ao PC">${esc(txt)}</a>`;
    });
    // Qualquer telefone de detalhe de lead que esteja visível
    ['#dTelefone','#leadPhone','#leadTelefone'].forEach(sel=>{ const el=$(sel); if(el && !el.querySelector('a')){ const txt=el.textContent.trim() || el.value; if(fullPhone(txt)) el.innerHTML=`<a class="v53-phone-link" href="${esc(telHref(txt))}" title="Ligar com celular conectado ao PC">${esc(txt)}</a>`; }});
    const page=$('#ligacoes');
    if(page && !$('#v53CallNote')){
      const ref=$('#v51CallsCommand') || page.querySelector('.section-header') || page.firstElementChild;
      ref?.insertAdjacentHTML('afterend','<div class="v53-call-note" id="v53CallNote">Celular conectado ao PC: clique no número do lead ou em <b>Abrir discador</b>. O CRM usa links <b>tel:+55...</b>, então o Windows abre o aplicativo padrão de chamadas.</div>');
    }
  }
  function dialFromRef(ref){ const l=findLead(ref); if(l?.telefone){ try{ window.location.href = telHref(l.telefone); }catch(e){} } }

  function bind(){
    DOC.addEventListener('click', function(e){
      const tog=e.target.closest('#v53SidebarToggle,#v53SidebarHandle');
      if(tog){ e.preventDefault(); e.stopImmediatePropagation(); setCollapsed(!DOC.body.classList.contains('crm-v53-sidebar-collapsed'), true); return; }
      const view=e.target.closest('[data-v53-cal-view]');
      if(view){ e.preventDefault(); setView(view.dataset.v53CalView); return; }
      if(e.target.closest('#v53CalPrev')){ e.preventDefault(); move(-1); return; }
      if(e.target.closest('#v53CalNext')){ e.preventDefault(); move(1); return; }
      if(e.target.closest('#v53CalToday')){ e.preventDefault(); state.date=parseDate(todayISO()); localStorage.setItem('crm_v53_calendar_date',todayISO()); renderCalendar(); return; }
      if(e.target.closest('#v53CalNew')){ e.preventDefault(); openNewEvent(toISO(state.date),'09:00'); return; }
      if(e.target.closest('#v53CalFilters')){ e.preventDefault(); $('#v51AgendaFilters')?.click(); $('#v51AgendaFilterDrawer')?.classList.add('show'); return; }
      const month=e.target.closest('[data-v53-open-month]');
      if(month){ e.preventDefault(); state.date=new Date(state.date.getFullYear(),Number(month.dataset.v53OpenMonth),1,12); setView('month'); return; }
      const ev=e.target.closest('[data-v53-event]');
      if(ev){ e.preventDefault(); e.stopPropagation(); openEvent(ev.dataset.v53Event); return; }
      const day=e.target.closest('[data-v53-new-day]');
      if(day){ e.preventDefault(); const iso=day.dataset.v53NewDay; const hour=day.dataset.v53Hour || '09:00'; openNewEvent(iso,hour); return; }
      const close=e.target.closest('[data-v53-close-drawer]');
      if(close){ const d=$('#'+close.dataset.v53CloseDrawer); d?.classList.remove('show'); d?.setAttribute('aria-hidden','true'); return; }
      const delay=e.target.closest('[data-v53-event-delay]');
      if(delay){ const id=$('#v53AgendaDrawer')?.dataset.eventId; const evObj=sortedEvents().find(x=>eventId(x)===id); if(evObj){ const d=parseDate(evObj.data); d.setDate(d.getDate()+Number(delay.dataset.v53EventDelay||1)); updateEvent(id,{data:toISO(d)}); openEvent(id); toast('Compromisso remarcado'); } return; }
      if(e.target.closest('[data-v53-event-done]')){ const id=$('#v53AgendaDrawer')?.dataset.eventId; if(id){ updateEvent(id,{status:'concluido'}); $('#v53AgendaDrawer')?.classList.remove('show'); toast('Compromisso concluído'); } return; }
      if(e.target.closest('[data-v53-open-lead]')){ const id=$('#v53AgendaDrawer')?.dataset.eventId; const evObj=sortedEvents().find(x=>eventId(x)===id); if(evObj){ try{ window.crmOpenLead?.(evObj.leadNome); }catch(err){ try{ window.openDetail?.(evObj.leadNome); }catch(_){} } } return; }
      const callBtn=e.target.closest('[data-call-v36-start]');
      if(callBtn){ dialFromRef(callBtn.dataset.callV36Start); setTimeout(()=>enhancePhones(),120); }
    }, true);
    DOC.addEventListener('input', function(e){
      const f=e.target.closest('[data-v53-event-field]');
      if(f){ const id=$('#v53AgendaDrawer')?.dataset.eventId; if(id) updateEvent(id,{[f.dataset.v53EventField]:f.value}); }
    }, true);
    DOC.addEventListener('click', function(e){
      if(e.target.closest('#agEventSave,#agEventDelete')) setTimeout(()=>{ ensureFreeLeadOption(); renderCalendar(); },180);
    }, true);
  }

  function refresh(){
    installSidebar();
    installCalendar();
    ensureFreeLeadOption();
    enhancePhones();
  }
  function boot(){
    DOC.body.classList.add('crm-v53');
    refresh(); bind();
    setTimeout(refresh,250); setTimeout(refresh,900); setTimeout(refresh,1800);
    const mo = new MutationObserver(()=>{ clearTimeout(window.__crmV53Timer); window.__crmV53Timer=setTimeout(refresh,90); });
    mo.observe(DOC.body,{subtree:true,childList:true,characterData:true});
  }
  if(DOC.readyState==='loading') DOC.addEventListener('DOMContentLoaded', boot); else boot();
})();
