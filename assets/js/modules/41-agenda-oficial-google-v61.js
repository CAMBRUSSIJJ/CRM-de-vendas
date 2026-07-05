/* CRM v61 — Agenda oficial estilo Google Calendar, sem versões antigas sobrepostas */
(function(){
  'use strict';
  if(window.__CRM_V61_AGENDA_OFICIAL__) return;
  window.__CRM_V61_AGENDA_OFICIAL__ = true;

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const LS_EVENTS = 'outbounder_agenda_v1';
  const LS_UI = 'outbounder_agenda_v61_ui';
  const DOW = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const TYPES = ['Ligação','Reunião','Follow-up','Tarefa','Proposta','Pessoal'];
  const AGENDAS = ['Comercial','Follow-ups','Reuniões','Pessoal'];
  const HOURS = Array.from({length:15},(_,i)=>i+7);
  const pad = n => String(n).padStart(2,'0');
  const today = () => dateKey(new Date());
  const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const parseDate = s => { const [y,m,d] = String(s || today()).split('-').map(Number); return new Date(y || new Date().getFullYear(), (m || 1)-1, d || 1); };
  const addDays = (s,n)=>{ const d=parseDate(s); d.setDate(d.getDate()+n); return dateKey(d); };
  const monthName = d => d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^\w/,m=>m.toUpperCase());
  const esc = v => String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const norm = v => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  const state = Object.assign({
    view:'month',
    anchor:today(),
    miniAnchor:today(),
    visibleTypes:TYPES.slice(),
    visibleAgendas:AGENDAS.slice(),
    density:'comfort',
    drawer:null
  }, loadUI());

  function loadUI(){ try { return JSON.parse(localStorage.getItem(LS_UI)||'{}'); } catch(e){ return {}; } }
  function saveUI(){ try { localStorage.setItem(LS_UI, JSON.stringify({view:state.view,anchor:state.anchor,miniAnchor:state.miniAnchor,visibleTypes:state.visibleTypes,visibleAgendas:state.visibleAgendas,density:state.density})); } catch(e){} }
  function toast(msg,type='success'){ try { window.crmToast ? window.crmToast(msg,type) : (window.showToast ? window.showToast(msg,type) : console.log(msg)); } catch(e){ console.log(msg); } }
  function getLeads(){ try { return window.crmGetLeads ? window.crmGetLeads() : (window.leads || []); } catch(e){ return []; } }

  function rawEvents(){ try { const data=JSON.parse(localStorage.getItem(LS_EVENTS)||'[]'); return Array.isArray(data)?data:[]; } catch(e){ return []; } }
  function saveRawEvents(list){ try { localStorage.setItem(LS_EVENTS, JSON.stringify(list)); } catch(e){} }
  function normalizeEvent(e){
    const title = e.title || e.titulo || e.nome || e.leadNome || e.lead || 'Compromisso sem título';
    const leadNome = e.leadNome || e.lead || e.cliente || '';
    const data = e.data || e.date || e.dia || today();
    const hora = e.hora || e.start || e.inicio || '09:00';
    const fim = e.fim || e.end || e.termino || defaultEnd(hora);
    const tipo = e.tipo || e.type || 'Reunião';
    return {
      id: e.id || ('agv61_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)),
      title, leadNome, data, hora, fim,
      tipo: TYPES.includes(tipo) ? tipo : 'Tarefa',
      prioridade: e.prioridade || e.priority || 'Média',
      agenda: e.agenda || 'Comercial',
      status: e.status || 'Agendado',
      notas: e.notas || e.notes || e.objetivo || '',
      local: e.local || '',
      criadoEm: e.criadoEm || new Date().toISOString()
    };
  }
  function events(){ return rawEvents().map(normalizeEvent); }
  function persistEvent(ev){
    const list = events();
    const idx = list.findIndex(x=>x.id===ev.id);
    if(idx >= 0) list[idx] = normalizeEvent(ev); else list.push(normalizeEvent(ev));
    saveRawEvents(list);
  }
  function deleteEvent(id){ saveRawEvents(events().filter(e=>e.id!==id)); }
  function defaultEnd(h){ const [hh,mm]=String(h||'09:00').split(':').map(Number); const d=new Date(2020,0,1,hh||9,mm||0); d.setMinutes(d.getMinutes()+45); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
  function typeKey(t){ const n=norm(t); if(n.includes('liga')) return 'ligacao'; if(n.includes('reun')) return 'reuniao'; if(n.includes('follow')) return 'follow'; if(n.includes('prop')) return 'proposta'; if(n.includes('pessoal')) return 'pessoal'; return 'tarefa'; }
  function filteredEvents(){ return events().filter(e => state.visibleTypes.includes(e.tipo) && state.visibleAgendas.includes(e.agenda)); }
  function eventsForDate(ds){ return filteredEvents().filter(e=>e.data===ds).sort((a,b)=>String(a.hora).localeCompare(String(b.hora))); }

  function startOfWeek(d){ const x=new Date(d); x.setDate(x.getDate()-x.getDay()); x.setHours(0,0,0,0); return x; }
  function calendarDays(d){
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({length:42},(_,i)=>{ const x=new Date(start); x.setDate(start.getDate()+i); return x; });
  }
  function periodTitle(){
    const d=parseDate(state.anchor);
    if(state.view==='day') return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).replace(/^\w/,m=>m.toUpperCase());
    if(state.view==='week'){ const s=startOfWeek(d), e=new Date(s); e.setDate(e.getDate()+6); return `${s.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})} – ${e.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}`; }
    if(state.view==='year') return String(d.getFullYear());
    if(state.view==='list') return 'Próximos compromissos';
    return monthName(d);
  }

  function render(){
    const sec = $('#agenda');
    if(!sec) return;
    sec.classList.add('crm-v61-official-agenda');
    sec.innerHTML = `<div id="crmAgendaV61Root" class="v61-calendar-app">${shellMarkup()}</div>`;
    bind();
    renderBody();
    renderMiniCalendar();
    if(state.drawer) openDrawer(state.drawer, true);
  }
  function shellMarkup(){
    return `<div class="v61-cal-shell">
      <aside class="v61-cal-sidebar">
        <div class="v61-mini-head"><button class="v61-icon-btn" data-v61-mini-prev type="button" aria-label="Mês anterior">‹</button><div class="v61-mini-title" id="v61MiniTitle">Mini calendário</div><button class="v61-icon-btn" data-v61-mini-next type="button" aria-label="Próximo mês">›</button></div>
        <div class="v61-mini-grid" id="v61MiniCalendar"></div>
        <div class="v61-side-block"><div class="v61-side-title">Minhas agendas</div><div class="v61-check-list">${AGENDAS.map(a=>`<label class="v61-check"><input type="checkbox" data-v61-agenda-filter="${esc(a)}" ${state.visibleAgendas.includes(a)?'checked':''}/> ${esc(a)}</label>`).join('')}</div></div>
        <div class="v61-side-block"><div class="v61-side-title">Tipos de evento</div><div class="v61-check-list">${TYPES.map(t=>`<label class="v61-check"><input type="checkbox" data-v61-type-filter="${esc(t)}" ${state.visibleTypes.includes(t)?'checked':''}/> <span class="v61-type-dot v61-color-${typeKey(t)}"></span>${esc(t)}</label>`).join('')}</div></div>
        <div class="v61-side-block"><div class="v61-side-title">Densidade</div><div class="v61-seg" style="display:inline-flex"><button type="button" data-v61-density="comfort" class="${state.density==='comfort'?'active':''}">Conforto</button><button type="button" data-v61-density="compact" class="${state.density==='compact'?'active':''}">Compacto</button></div></div>
        <div class="v61-side-block"><div class="v61-hint"><strong>Dica:</strong> clique em qualquer dia, horário ou espaço vazio para criar um compromisso naquele ponto da agenda.</div></div>
      </aside>
      <main class="v61-cal-main">
        <header class="v61-cal-top">
          <div class="v61-cal-title-wrap"><div class="v61-cal-mark">${icon('calendar')}</div><div><div class="v61-cal-kicker">Agenda oficial</div><div class="v61-cal-title" id="v61CalTitle">${esc(periodTitle())}</div></div></div>
          <div class="v61-cal-actions">
            <button class="v61-btn" data-v61-today type="button">Hoje</button>
            <button class="v61-icon-btn" data-v61-prev type="button" aria-label="Anterior">‹</button>
            <button class="v61-icon-btn" data-v61-next type="button" aria-label="Próximo">›</button>
            <div class="v61-seg" role="tablist">${[['day','Dia'],['week','Semana'],['month','Mês'],['year','Ano'],['list','Lista']].map(([v,l])=>`<button type="button" data-v61-cal-view="${v}" class="${state.view===v?'active':''}">${l}</button>`).join('')}</div>
            <button class="v61-btn primary" data-v61-new type="button">${icon('plus')} Novo compromisso</button>
          </div>
        </header>
        <section class="v61-cal-content ${state.density==='compact'?'v61-density-compact':''}" id="v61CalendarBody"></section>
      </main>
      <div class="v61-backdrop" id="v61AgendaBackdrop" data-v61-close></div>
      <aside class="v61-drawer" id="v61AgendaDrawer" aria-live="polite"></aside>
    </div>`;
  }
  function icon(name){
    const icons={
      calendar:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="4"></rect><path d="M8 2v5M16 2v5M3 10h18"></path></svg>',
      plus:'<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16"><path d="M12 5v14M5 12h14"></path></svg>'
    };
    return icons[name]||'';
  }
  function bind(){
    $('[data-v61-today]')?.addEventListener('click',()=>{ state.anchor=today(); saveUI(); render(); });
    $('[data-v61-prev]')?.addEventListener('click',()=>move(-1));
    $('[data-v61-next]')?.addEventListener('click',()=>move(1));
    $('[data-v61-new]')?.addEventListener('click',()=>openDrawer({data:state.anchor,hora:'09:00',fim:'09:45',tipo:'Reunião'}));
    $$('[data-v61-cal-view]').forEach(b=>b.addEventListener('click',()=>{ state.view=b.dataset.v61CalView; saveUI(); render(); }));
    $('[data-v61-mini-prev]')?.addEventListener('click',()=>{ const d=parseDate(state.miniAnchor); d.setMonth(d.getMonth()-1); state.miniAnchor=dateKey(d); saveUI(); renderMiniCalendar(); });
    $('[data-v61-mini-next]')?.addEventListener('click',()=>{ const d=parseDate(state.miniAnchor); d.setMonth(d.getMonth()+1); state.miniAnchor=dateKey(d); saveUI(); renderMiniCalendar(); });
    $$('[data-v61-type-filter]').forEach(input=>input.addEventListener('change',()=>{ state.visibleTypes = $$('[data-v61-type-filter]').filter(x=>x.checked).map(x=>x.dataset.v61TypeFilter); saveUI(); renderBody(); renderMiniCalendar(); }));
    $$('[data-v61-agenda-filter]').forEach(input=>input.addEventListener('change',()=>{ state.visibleAgendas = $$('[data-v61-agenda-filter]').filter(x=>x.checked).map(x=>x.dataset.v61AgendaFilter); saveUI(); renderBody(); renderMiniCalendar(); }));
    $$('[data-v61-density]').forEach(b=>b.addEventListener('click',()=>{ state.density=b.dataset.v61Density; saveUI(); render(); }));
  }
  function move(delta){
    const d=parseDate(state.anchor);
    if(state.view==='day') d.setDate(d.getDate()+delta);
    else if(state.view==='week') d.setDate(d.getDate()+delta*7);
    else if(state.view==='year') d.setFullYear(d.getFullYear()+delta);
    else if(state.view==='list') d.setDate(d.getDate()+delta*30);
    else d.setMonth(d.getMonth()+delta);
    state.anchor=dateKey(d); state.miniAnchor=state.anchor; saveUI(); render();
  }
  function renderMiniCalendar(){
    const grid=$('#v61MiniCalendar'), title=$('#v61MiniTitle'); if(!grid) return;
    const d=parseDate(state.miniAnchor); if(title) title.textContent = monthName(d);
    const days=calendarDays(d);
    grid.innerHTML = DOW.map(x=>`<div class="v61-mini-dow">${x[0]}</div>`).join('') + days.map(day=>{
      const ds=dateKey(day), other=day.getMonth()!==d.getMonth(), active=ds===state.anchor;
      return `<button type="button" class="v61-mini-day ${other?'other':''} ${active?'active':''}" data-v61-mini-date="${ds}">${day.getDate()}</button>`;
    }).join('');
    $$('[data-v61-mini-date]',grid).forEach(b=>b.addEventListener('click',()=>{ state.anchor=b.dataset.v61MiniDate; state.miniAnchor=state.anchor; if(state.view==='year') state.view='month'; saveUI(); render(); }));
  }
  function renderBody(){
    const body=$('#v61CalendarBody'); if(!body) return;
    $('#v61CalTitle') && ($('#v61CalTitle').textContent = periodTitle());
    const d=parseDate(state.anchor);
    if(state.view==='month') body.innerHTML=monthView(d);
    if(state.view==='week') body.innerHTML=weekView(d);
    if(state.view==='day') body.innerHTML=dayView(d);
    if(state.view==='year') body.innerHTML=yearView(d);
    if(state.view==='list') body.innerHTML=listView(d);
    bindBody(body);
  }
  function monthView(d){
    const days=calendarDays(d);
    return `<div class="v61-month-wrap"><div class="v61-dow-row">${DOW.map(x=>`<div class="v61-dow">${x}</div>`).join('')}</div><div class="v61-month-grid">${days.map(day=>{
      const ds=dateKey(day), evs=eventsForDate(ds), other=day.getMonth()!==d.getMonth(), isToday=ds===today();
      return `<div class="v61-day-cell ${other?'other':''} ${isToday?'today':''}" data-v61-date="${ds}"><div class="v61-day-top"><div class="v61-day-number">${day.getDate()}</div><div class="v61-day-add">+</div></div><div class="v61-events">${evs.slice(0,3).map(eventChip).join('')}${evs.length>3?`<div class="v61-more">+${evs.length-3} compromissos</div>`:''}</div></div>`;
    }).join('')}</div></div>`;
  }
  function weekView(d){
    const start=startOfWeek(d); const days=Array.from({length:7},(_,i)=>{const x=new Date(start); x.setDate(start.getDate()+i); return x;});
    let html='<div class="v61-week-grid"><div class="v61-week-head"></div>'+days.map(x=>`<div class="v61-week-head"><div>${DOW[x.getDay()]}</div><div style="font-size:22px;margin-top:4px">${x.getDate()}</div></div>`).join('');
    HOURS.forEach(h=>{
      html+=`<div class="v61-time-col"><div class="v61-time-label">${pad(h)}:00</div></div>`;
      days.forEach(day=>{ const ds=dateKey(day), evs=eventsForDate(ds).filter(e=>Number(String(e.hora).slice(0,2))===h); html+=`<div class="v61-slot" data-v61-date="${ds}" data-v61-hour="${pad(h)}:00">${evs.map(eventChip).join('')}</div>`; });
    });
    return html+'</div>';
  }
  function dayView(d){
    const ds=dateKey(d);
    let html='<div class="v61-day-view">';
    HOURS.forEach(h=>{ const evs=eventsForDate(ds).filter(e=>Number(String(e.hora).slice(0,2))===h); html+=`<div class="v61-day-hour">${pad(h)}:00</div><div class="v61-day-slot" data-v61-date="${ds}" data-v61-hour="${pad(h)}:00">${evs.map(eventChip).join('')}</div>`; });
    return html+'</div>';
  }
  function yearView(d){
    const y=d.getFullYear();
    return `<div class="v61-year-grid">${Array.from({length:12},(_,m)=>{
      const md=new Date(y,m,1), monthEvents=filteredEvents().filter(e=>parseDate(e.data).getFullYear()===y && parseDate(e.data).getMonth()===m);
      const days=calendarDays(md).slice(0,35);
      return `<div class="v61-year-month" data-v61-year-month="${m}"><div class="v61-year-month-title">${md.toLocaleDateString('pt-BR',{month:'long'}).replace(/^\w/,x=>x.toUpperCase())}<span style="float:right;font-size:12px;color:rgba(44,44,42,.52)">${monthEvents.length}</span></div><div class="v61-year-mini">${days.map(day=>{ const ds=dateKey(day); return `<div class="v61-year-dot ${eventsForDate(ds).length?'has':''}">${day.getMonth()===m?day.getDate():''}</div>`; }).join('')}</div></div>`;
    }).join('')}</div>`;
  }
  function listView(d){
    const base=dateKey(d); const evs=filteredEvents().filter(e=>e.data>=base).sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora));
    if(!evs.length) return '<div class="v61-empty">Nenhum compromisso encontrado. Clique em “Novo compromisso” ou selecione um dia no calendário para começar.</div>';
    return `<div class="v61-list">${evs.slice(0,80).map(e=>`<div class="v61-list-row" data-v61-event="${esc(e.id)}"><div class="v61-list-date">${formatDate(e.data)}<br>${esc(e.hora)}–${esc(e.fim)}</div><div><div class="v61-list-title">${esc(e.title)}</div><div class="v61-list-meta">${esc(e.tipo)} · ${esc(e.leadNome || 'Sem lead vinculado')} · ${esc(e.agenda)}</div></div><span class="v61-status-pill">${esc(e.status)}</span></div>`).join('')}</div>`;
  }
  function formatDate(ds){ return parseDate(ds).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace('.', ''); }
  function eventChip(e){ return `<button type="button" class="v61-event-chip v61-color-${typeKey(e.tipo)}" data-v61-event="${esc(e.id)}"><span class="v61-event-time">${esc(e.hora)}</span>${esc(e.title)}</button>`; }
  function bindBody(root){
    $$('[data-v61-event]',root).forEach(el=>el.addEventListener('click',ev=>{ ev.preventDefault(); ev.stopPropagation(); const item=events().find(x=>x.id===el.dataset.v61Event); if(item) openDrawer(item); }));
    $$('[data-v61-date]',root).forEach(el=>el.addEventListener('click',ev=>{ if(ev.target.closest('[data-v61-event]')) return; const ds=el.dataset.v61Date; const hour=el.dataset.v61Hour || '09:00'; state.anchor=ds; saveUI(); openDrawer({data:ds,hora:hour,fim:defaultEnd(hour),tipo:'Reunião'}); }));
    $$('[data-v61-year-month]',root).forEach(el=>el.addEventListener('click',()=>{ const d=parseDate(state.anchor); d.setMonth(Number(el.dataset.v61YearMonth)); d.setDate(1); state.anchor=dateKey(d); state.miniAnchor=state.anchor; state.view='month'; saveUI(); render(); }));
  }
  function openDrawer(input={}, keepRender=false){
    const ev = input.id ? normalizeEvent(input) : normalizeEvent(Object.assign({title:'',leadNome:'',data:state.anchor,hora:'09:00',fim:'09:45',tipo:'Reunião',prioridade:'Média',agenda:'Comercial',status:'Agendado'}, input));
    state.drawer = ev;
    const drawer=$('#v61AgendaDrawer'), back=$('#v61AgendaBackdrop');
    if(!drawer || !back){ if(!keepRender) render(); return; }
    const leadNames=[...new Set(getLeads().map(l=>l.nome||l.name||l.empresa||l.company).filter(Boolean))];
    drawer.innerHTML = `<div class="v61-drawer-head"><div><div class="v61-drawer-title">${ev.id && events().some(x=>x.id===ev.id)?'Editar compromisso':'Novo compromisso'}</div><div class="v61-drawer-sub">Preencha os dados para aparecer na agenda.</div></div><button type="button" class="v61-close" data-v61-close aria-label="Fechar">×</button></div>
      <form class="v61-form" id="v61EventForm">
        <div class="v61-field full"><label>Título do compromisso *</label><input id="v61Title" value="${esc(ev.title==='Compromisso sem título'?'':ev.title)}" placeholder="Ex: Reunião de diagnóstico, retorno da proposta..." required></div>
        <div class="v61-form-grid">
          <div class="v61-field"><label>Data *</label><input id="v61Data" type="date" value="${esc(ev.data)}" required></div>
          <div class="v61-field"><label>Agenda</label><select id="v61Agenda">${AGENDAS.map(a=>`<option ${ev.agenda===a?'selected':''}>${esc(a)}</option>`).join('')}</select></div>
          <div class="v61-field"><label>Início</label><input id="v61Hora" type="time" value="${esc(ev.hora)}"></div>
          <div class="v61-field"><label>Fim</label><input id="v61Fim" type="time" value="${esc(ev.fim)}"></div>
          <div class="v61-field"><label>Tipo</label><select id="v61Tipo">${TYPES.map(t=>`<option ${ev.tipo===t?'selected':''}>${esc(t)}</option>`).join('')}</select></div>
          <div class="v61-field"><label>Prioridade</label><select id="v61Prioridade">${['Alta','Média','Baixa'].map(p=>`<option ${ev.prioridade===p?'selected':''}>${p}</option>`).join('')}</select></div>
          <div class="v61-field"><label>Status</label><select id="v61Status">${['Agendado','Concluído','Remarcado','Cancelado'].map(s=>`<option ${ev.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="v61-field"><label>Local / Link</label><input id="v61Local" value="${esc(ev.local)}" placeholder="Sala, Google Meet, endereço..."></div>
          <div class="v61-field full"><label>Lead vinculado</label><input id="v61Lead" list="v61LeadOptions" value="${esc(ev.leadNome)}" placeholder="Digite ou selecione um lead"><datalist id="v61LeadOptions">${leadNames.map(n=>`<option value="${esc(n)}"></option>`).join('')}</datalist></div>
          <div class="v61-field full"><label>Notas / objetivo</label><textarea id="v61Notas" placeholder="Objetivo, contexto, pontos para tratar, próxima ação...">${esc(ev.notas)}</textarea></div>
        </div>
      </form>
      <div class="v61-drawer-foot"><button type="button" class="v61-btn danger ${ev.id && events().some(x=>x.id===ev.id)?'':'hidden'}" data-v61-delete>Excluir</button><div class="v61-foot-right"><button type="button" class="v61-btn" data-v61-close>Cancelar</button><button type="button" class="v61-btn primary" data-v61-save>Salvar compromisso</button></div></div>`;
    back.classList.add('open'); drawer.classList.add('open');
    $$('[data-v61-close]').forEach(x=>x.addEventListener('click',closeDrawer));
    $('[data-v61-save]')?.addEventListener('click',saveDrawer);
    $('[data-v61-delete]')?.addEventListener('click',()=>{ deleteEvent(ev.id); closeDrawer(); render(); toast('Compromisso excluído','success'); });
    $('#v61Hora')?.addEventListener('change',()=>{ const end=$('#v61Fim'); if(end && (!end.value || end.value <= $('#v61Hora').value)) end.value=defaultEnd($('#v61Hora').value); });
    setTimeout(()=>$('#v61Title')?.focus(),60);
  }
  function closeDrawer(){ state.drawer=null; $('#v61AgendaBackdrop')?.classList.remove('open'); $('#v61AgendaDrawer')?.classList.remove('open'); }
  function saveDrawer(){
    const title=$('#v61Title')?.value?.trim();
    if(!title){ toast('Informe um título para o compromisso','error'); $('#v61Title')?.focus(); return; }
    const data=$('#v61Data')?.value || today();
    const hora=$('#v61Hora')?.value || '09:00';
    const ev=normalizeEvent(Object.assign({}, state.drawer || {}, {
      title, data, hora,
      fim: $('#v61Fim')?.value || defaultEnd(hora),
      tipo: $('#v61Tipo')?.value || 'Reunião',
      prioridade: $('#v61Prioridade')?.value || 'Média',
      agenda: $('#v61Agenda')?.value || 'Comercial',
      status: $('#v61Status')?.value || 'Agendado',
      local: $('#v61Local')?.value || '',
      leadNome: $('#v61Lead')?.value || '',
      notas: $('#v61Notas')?.value || ''
    }));
    persistEvent(ev); state.anchor=data; state.miniAnchor=data; saveUI(); closeDrawer(); render(); toast('Compromisso salvo na agenda','success');
  }

  function init(){
    // Evita que versões antigas da agenda reapareçam visualmente.
    document.body.classList.add('crm-v61-agenda-loaded');
    render();
    // Assume a agenda sempre que a navegação abrir a aba.
    const previousSetView = window.setView;
    window.setView = function(view){
      const result = typeof previousSetView === 'function' ? previousSetView.apply(this, arguments) : undefined;
      if(view === 'agenda') setTimeout(render, 35);
      return result;
    };
    document.addEventListener('click', function(e){
      const trigger = e.target.closest('[data-view="agenda"],[data-v60-view="agenda"]');
      if(trigger) setTimeout(render, 120);
    }, true);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
