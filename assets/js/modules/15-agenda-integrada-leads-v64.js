/* CRM v64 — Agenda integrada com Leads */
(function(){
  'use strict';
  if(window.__CRM_V64_AGENDA__) return;
  window.__CRM_V64_AGENDA__ = true;

  const DOC = document;
  const $ = (sel, root=DOC) => root.querySelector(sel);
  const $$ = (sel, root=DOC) => Array.from(root.querySelectorAll(sel));
  const LS_EVENTS = 'outbounder_agenda_v1';
  const LS_UI = 'outbounder_agenda_v64_ui';
  const CLOSED = new Set(['Fechado','Perdido']);
  const TYPES = ['Ligação','WhatsApp','E-mail','Reunião','Follow-up','Proposta','Tarefa','Pessoal'];
  const PRIORITIES = ['Alta','Média','Baixa'];
  const VIEW_MAP = {mês:'month',mes:'month',month:'month',dia:'day',day:'day',semana:'week',week:'week',ano:'year',year:'year',lista:'list',list:'list'};

  const state = Object.assign({
    view:'month',
    anchor:today(),
    search:'',
    type:'',
    priority:'',
    lead:'',
    responsible:'',
    onlyLinked:false,
    showLeadFollowups:true,
    density:'comfort'
  }, loadJSON(LS_UI,{}));

  function esc(v){return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function pad(n){return String(n).padStart(2,'0');}
  function today(){return new Date().toISOString().slice(0,10);}
  function dateKey(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
  function parseDate(s){const parts=String(s||today()).split('-').map(Number);const d=new Date(parts[0]||new Date().getFullYear(),(parts[1]||1)-1,parts[2]||1);return isNaN(d.getTime())?new Date():d;}
  function addDays(s,n){const d=parseDate(s);d.setDate(d.getDate()+Number(n||0));return dateKey(d);}
  function fmtDate(s,opts){if(!s)return '—';try{return parseDate(s).toLocaleDateString('pt-BR',opts||{day:'2-digit',month:'2-digit',year:'numeric'});}catch(e){return s;}}
  function fmtDateLong(s){return fmtDate(s,{weekday:'long',day:'numeric',month:'long',year:'numeric'}).replace(/^\w/,x=>x.toUpperCase());}
  function money(v){try{return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);}catch(e){return 'R$ '+(Number(v)||0);}}
  function loadJSON(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}catch(e){return fallback;}}
  function setJSON(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}}
  function saveUI(){setJSON(LS_UI,state);}
  function getLeads(){try{return window.crmGetLeads?window.crmGetLeads():(window.leads||[]);}catch(e){return [];}}
  function saveLeads(){try{window.crmSaveLeads?window.crmSaveLeads():null;}catch(e){}}
  function toast(msg,type='success'){try{window.crmToast?window.crmToast(msg,type):showToast(msg,type);}catch(e){console.log(msg);}}
  function openLead(name){try{window.crmOpenLead?window.crmOpenLead(name):openDetail(name);}catch(e){try{window.setView('leads');}catch(_){}}}
  function uid(prefix='ev_'){return prefix+Date.now()+Math.random().toString(36).slice(2,7);}
  function initials(name){return String(name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?';}
  function telHref(phone){let d=String(phone||'').replace(/\D/g,'');if(!d)return '#';if(d.startsWith('00'))d=d.slice(2);if(!d.startsWith('55'))d='55'+d;return 'tel:+'+d;}
  function waHref(phone){let d=String(phone||'').replace(/\D/g,'');if(!d)return '#';if(!d.startsWith('55'))d='55'+d;return 'https://wa.me/'+d;}
  function stageClass(s){return {'Lead':'lead','Contato':'contato','Proposta':'proposta','Fechado':'fechado','Perdido':'perdido'}[s]||'neutral';}
  function priorityClass(p){return {'Alta':'alta','Média':'media','Baixa':'baixa'}[p]||'media';}
  function typeClass(t){const x=norm(t);if(/lig|whats/.test(x))return 'call';if(/reun|demo/.test(x))return 'meeting';if(/follow|proposta/.test(x))return 'follow';if(/email|e-mail/.test(x))return 'mail';return 'task';}

  function normalizeEvent(e){
    const leadNome = e.leadNome || e.lead || e.nomeLead || '';
    const title = e.title || e.titulo || (leadNome ? `${e.tipo||'Compromisso'}: ${leadNome}` : 'Compromisso');
    return {
      id:e.id || uid(),
      title,
      leadNome,
      data:e.data || e.date || today(),
      hora:e.hora || e.start || '09:00',
      fim:e.fim || e.end || '',
      duracao:Number(e.duracao||e.duration||30),
      tipo:e.tipo || e.type || 'Reunião',
      prioridade:e.prioridade || e.priority || 'Média',
      notas:e.notas || e.notes || '',
      objetivo:e.objetivo || e.objective || '',
      resultado:e.resultado || '',
      status:e.status || 'pendente',
      agenda:e.agenda || 'Comercial',
      spin:e.spin || {s:'',p:'',i:'',n:''},
      createdAt:e.createdAt || new Date().toISOString(),
      updatedAt:e.updatedAt || new Date().toISOString()
    };
  }
  function loadEvents(){
    const raw=loadJSON(LS_EVENTS,[]);
    return Array.isArray(raw)?raw.map(normalizeEvent):[];
  }
  function saveEvents(list){
    setJSON(LS_EVENTS,(Array.isArray(list)?list:[]).map(normalizeEvent));
    syncAgendaAPI();
  }
  function seedEvents(){
    const events=loadEvents();
    if(events.length) return;
    const leads=getLeads();
    const lead1=leads[0]?.nome||'Fazenda Aurora';
    const lead2=leads[1]?.nome||'Loja Horizonte';
    saveEvents([
      {id:'v64_seed_1',title:'Retorno de proposta',leadNome:lead1,data:today(),hora:'09:00',tipo:'Ligação',prioridade:'Alta',notas:'Confirmar proposta e definir próximo passo.'},
      {id:'v64_seed_2',title:'Enviar apresentação',leadNome:lead2,data:today(),hora:'14:30',tipo:'Follow-up',prioridade:'Média',notas:'Enviar material e agendar reunião.'}
    ]);
  }

  function leadByName(name){const n=norm(name);return getLeads().find(l=>norm(l.nome)===n) || null;}
  function updateLeadFromEvent(ev,opts={}){
    if(!opts.syncLead || !ev.leadNome) return;
    const l=leadByName(ev.leadNome);
    if(!l) return;
    if(['Ligação','WhatsApp','E-mail','Reunião','Follow-up','Proposta'].includes(ev.tipo)){
      l.followup=ev.data;
      l.proximaAcao=ev.resultado ? `Resultado: ${ev.resultado}` : `${ev.tipo}: ${ev.title}`;
      l.ultimaAtualizacao=today();
      if(!l.prioridade) l.prioridade=ev.prioridade;
    }
    try{ if(typeof addAtividade==='function') addAtividade(l.nome,'Agenda',`${ev.status==='feito'?'Concluído':'Agendado'}: ${ev.tipo} em ${fmtDate(ev.data)} às ${ev.hora}${ev.resultado?' — '+ev.resultado:''}`); }catch(e){}
    saveLeads();
  }

  function eventExistsForLeadDate(leadName,date){
    const n=norm(leadName);
    return loadEvents().some(e=>e.data===date && norm(e.leadNome)===n && /follow|liga|whats|e-mail|email|reuni|proposta/i.test(e.tipo||''));
  }
  function syntheticFollowups(){
    if(!state.showLeadFollowups) return [];
    return getLeads().filter(l=>l.followup && !CLOSED.has(l.etapa) && !eventExistsForLeadDate(l.nome,l.followup)).map(l=>({
      id:'leadfu_'+norm(l.nome).replace(/[^a-z0-9]+/g,'_')+'_'+l.followup,
      source:'lead-followup',
      title:l.proximaAcao || `Follow-up: ${l.nome}`,
      leadNome:l.nome,
      data:l.followup,
      hora:'',
      tipo:'Follow-up',
      prioridade:l.prioridade || 'Média',
      notas:l.obs || '',
      status:'pendente',
      lead:l
    }));
  }
  function allItems(){
    const events=loadEvents().map(e=>Object.assign({source:'event'},e));
    return events.concat(syntheticFollowups()).sort((a,b)=>(a.data+(a.hora||'99:99')).localeCompare(b.data+(b.hora||'99:99')));
  }
  function filteredItems(){
    const q=norm(state.search);
    const leadQ=norm(state.lead);
    const respQ=norm(state.responsible);
    return allItems().filter(ev=>{
      const l=leadByName(ev.leadNome) || ev.lead;
      if(state.type && ev.tipo!==state.type) return false;
      if(state.priority && ev.prioridade!==state.priority) return false;
      if(state.onlyLinked && !ev.leadNome) return false;
      if(leadQ && norm(ev.leadNome)!==leadQ) return false;
      if(respQ && norm(l?.responsavel)!==respQ) return false;
      if(q){
        const hay=norm([ev.title,ev.leadNome,ev.tipo,ev.prioridade,ev.notas,ev.objetivo,l?.segmento,l?.responsavel,l?.cidade,l?.etapa].join(' '));
        if(!hay.includes(q)) return false;
      }
      return true;
    });
  }
  function eventsForDate(ds){return filteredItems().filter(e=>e.data===ds).sort((a,b)=>String(a.hora||'99:99').localeCompare(String(b.hora||'99:99')));}
  function kpis(){
    const items=allItems(); const t=today(); const week=addDays(t,7);
    const events=loadEvents();
    return {
      today:items.filter(e=>e.data===t && e.status!=='feito').length,
      overdue:items.filter(e=>e.data<t && e.status!=='feito').length,
      week:items.filter(e=>e.data>=t && e.data<=week && e.status!=='feito').length,
      meetings:items.filter(e=>e.data>=t && /reuni|demo/i.test(e.tipo||'')).length,
      linked:events.filter(e=>e.leadNome).length,
      done:events.filter(e=>e.status==='feito').length
    };
  }
  function headerTitle(){
    const d=parseDate(state.anchor);
    if(state.view==='day') return fmtDateLong(dateKey(d));
    if(state.view==='week'){const s=startOfWeek(d),end=new Date(s);end.setDate(end.getDate()+6);return `${s.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})} – ${end.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}`;}
    if(state.view==='year') return String(d.getFullYear());
    if(state.view==='list') return 'Lista de compromissos';
    return d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^\w/,x=>x.toUpperCase());
  }
  function startOfWeek(d){const s=new Date(d);s.setDate(s.getDate()-s.getDay());return s;}

  function render(){
    const sec=$('#agenda'); if(!sec) return;
    seedEvents();
    sec.classList.add('agenda-v64');
    sec.classList.toggle('agenda-v64-compact',state.density==='compact');
    const kp=kpis();
    sec.innerHTML=`<div class="v64-agenda-shell">
      <div class="v64-agenda-hero">
        <div>
          <div class="v64-eyebrow">Agenda comercial integrada</div>
          <h2>${esc(headerTitle())}</h2>
          <p>Compromissos, reuniões, ligações e follow-ups aparecem juntos. Cada evento pode atualizar a ficha do lead e manter a Central de Leads sincronizada.</p>
        </div>
        <div class="v64-hero-actions">
          <button class="v64-btn ghost" data-v64-today type="button">Hoje</button>
          <button class="v64-btn ghost" data-v64-prev type="button">‹</button>
          <button class="v64-btn ghost" data-v64-next type="button">›</button>
          <button class="v64-btn primary" data-v64-new type="button">+ Novo compromisso</button>
        </div>
      </div>
      <div class="v64-kpis">
        ${kpiBtn('hoje','Hoje',kp.today,'Ações pendentes para hoje')}
        ${kpiBtn('atrasados','Atrasados',kp.overdue,'Itens pendentes antes de hoje')}
        ${kpiBtn('semana','Próx. 7 dias',kp.week,'Compromissos e follow-ups')}
        ${kpiBtn('reunioes','Reuniões',kp.meetings,'Reuniões futuras')}
        ${kpiBtn('vinculados','Vinculados',kp.linked,'Eventos conectados a leads')}
        ${kpiBtn('concluidos','Concluídos',kp.done,'Eventos finalizados')}
      </div>
      <div class="v64-toolbar card">
        <div class="v64-tabs" role="tablist">${[['day','Dia'],['week','Semana'],['month','Mês'],['year','Ano'],['list','Lista']].map(([id,l])=>`<button type="button" data-v64-view="${id}" class="${state.view===id?'active':''}">${l}</button>`).join('')}</div>
        <label class="v64-search"><svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><use href="#ic-search"></use></svg><input id="v64AgendaSearch" type="search" placeholder="Buscar lead, tipo, responsável, cidade..." value="${esc(state.search)}"></label>
        <select id="v64TypeFilter"><option value="">Todos os tipos</option>${TYPES.map(t=>`<option ${state.type===t?'selected':''}>${t}</option>`).join('')}</select>
        <select id="v64PriorityFilter"><option value="">Prioridade</option>${PRIORITIES.map(p=>`<option ${state.priority===p?'selected':''}>${p}</option>`).join('')}</select>
      </div>
      <div class="v64-agenda-layout">
        <aside class="v64-side">
          ${miniCalendarHTML()}
          ${leadFiltersHTML()}
          ${todayQueueHTML()}
        </aside>
        <main class="v64-main card"><div id="v64AgendaBody"></div></main>
      </div>
      <div class="v64-drawer-backdrop" id="v64AgendaBackdrop"></div>
      <aside class="v64-drawer" id="v64AgendaDrawer"></aside>
    </div>`;
    bindShell();
    renderBody();
  }
  function kpiBtn(id,label,value,hint){return `<button class="v64-kpi" type="button" data-v64-kpi="${id}"><span>${label}</span><strong>${value}</strong><small>${hint}</small></button>`;}
  function miniCalendarHTML(){
    const d=parseDate(state.anchor), y=d.getFullYear(), m=d.getMonth();
    const first=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate();
    const days=['D','S','T','Q','Q','S','S'];
    let html=`<div class="card v64-mini"><div class="v64-mini-head"><strong>${d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^\w/,x=>x.toUpperCase())}</strong><span><button data-v64-mini-prev>‹</button><button data-v64-mini-next>›</button></span></div><div class="v64-mini-grid">${days.map(x=>`<div class="v64-mini-dow">${x}</div>`).join('')}`;
    for(let i=0;i<first;i++) html+='<div></div>';
    for(let day=1;day<=dim;day++){
      const ds=`${y}-${pad(m+1)}-${pad(day)}`; const count=allItems().filter(e=>e.data===ds).length;
      html+=`<button class="v64-mini-day ${ds===state.anchor?'active':''} ${ds===today()?'today':''}" data-v64-date="${ds}"><span>${day}</span>${count?`<em>${count}</em>`:''}</button>`;
    }
    return html+'</div></div>';
  }
  function leadFiltersHTML(){
    const leads=getLeads();
    const responsaveis=[...new Set(leads.map(l=>l.responsavel).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    return `<div class="card v64-filter-card"><div class="v64-card-title">Filtros de integração</div>
      <label>Lead vinculado<select id="v64LeadFilter"><option value="">Todos os leads</option>${leads.map(l=>`<option value="${esc(l.nome)}" ${state.lead===l.nome?'selected':''}>${esc(l.nome)}</option>`).join('')}</select></label>
      <label>Responsável<select id="v64RespFilter"><option value="">Todos</option>${responsaveis.map(r=>`<option ${state.responsible===r?'selected':''}>${esc(r)}</option>`).join('')}</select></label>
      <label class="v64-check"><input id="v64OnlyLinked" type="checkbox" ${state.onlyLinked?'checked':''}> Mostrar só eventos com lead</label>
      <label class="v64-check"><input id="v64ShowLeadFollowups" type="checkbox" ${state.showLeadFollowups?'checked':''}> Incluir follow-ups dos leads</label>
      <div class="v64-density"><button data-v64-density="comfort" class="${state.density==='comfort'?'active':''}">Conforto</button><button data-v64-density="compact" class="${state.density==='compact'?'active':''}">Compacto</button></div>
    </div>`;
  }
  function todayQueueHTML(){
    const t=today();
    const items=allItems().filter(e=>e.data<=t && e.status!=='feito').sort((a,b)=>(a.data+(a.hora||'99:99')).localeCompare(b.data+(b.hora||'99:99'))).slice(0,7);
    return `<div class="card v64-queue-card"><div class="v64-card-title">Fila do dia</div>${items.length?items.map(itemMini).join(''):'<div class="v64-empty-mini">Nenhuma ação crítica agora.</div>'}</div>`;
  }
  function itemMini(e){const l=leadByName(e.leadNome)||e.lead;return `<button type="button" class="v64-mini-item ${e.data<today()?'late':''}" data-v64-open="${esc(e.id)}" data-source="${esc(e.source)}"><span>${esc(e.hora||'—')}</span><b>${esc(e.leadNome||e.title)}</b><small>${esc(e.tipo)} · ${l?.responsavel?esc(l.responsavel):'Sem responsável'}</small></button>`;}

  function bindShell(){
    $('[data-v64-today]')?.addEventListener('click',()=>{state.anchor=today();saveUI();render();});
    $('[data-v64-prev]')?.addEventListener('click',()=>move(-1));
    $('[data-v64-next]')?.addEventListener('click',()=>move(1));
    $('[data-v64-new]')?.addEventListener('click',()=>openDrawer({data:state.anchor,hora:'09:00',tipo:'Reunião'},false));
    $$('[data-v64-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.v64View)));
    $('#v64AgendaSearch')?.addEventListener('input',e=>{state.search=e.target.value;saveUI();renderBody();});
    $('#v64TypeFilter')?.addEventListener('change',e=>{state.type=e.target.value;saveUI();renderBody();});
    $('#v64PriorityFilter')?.addEventListener('change',e=>{state.priority=e.target.value;saveUI();renderBody();});
    $('#v64LeadFilter')?.addEventListener('change',e=>{state.lead=e.target.value;saveUI();render();});
    $('#v64RespFilter')?.addEventListener('change',e=>{state.responsible=e.target.value;saveUI();render();});
    $('#v64OnlyLinked')?.addEventListener('change',e=>{state.onlyLinked=e.target.checked;saveUI();renderBody();});
    $('#v64ShowLeadFollowups')?.addEventListener('change',e=>{state.showLeadFollowups=e.target.checked;saveUI();render();});
    $$('[data-v64-density]').forEach(b=>b.addEventListener('click',()=>{state.density=b.dataset.v64Density;saveUI();render();}));
    $$('[data-v64-date]').forEach(b=>b.addEventListener('click',()=>{state.anchor=b.dataset.v64Date;saveUI();render();}));
    $('[data-v64-mini-prev]')?.addEventListener('click',()=>{const d=parseDate(state.anchor);d.setMonth(d.getMonth()-1);state.anchor=dateKey(d);saveUI();render();});
    $('[data-v64-mini-next]')?.addEventListener('click',()=>{const d=parseDate(state.anchor);d.setMonth(d.getMonth()+1);state.anchor=dateKey(d);saveUI();render();});
    $$('[data-v64-kpi]').forEach(b=>b.addEventListener('click',()=>applyKpi(b.dataset.v64Kpi)));
    $$('[data-v64-open]').forEach(b=>b.addEventListener('click',()=>openById(b.dataset.v64Open,b.dataset.source)));
  }
  function applyKpi(id){
    if(id==='hoje'){state.anchor=today();state.view='day';}
    if(id==='atrasados'){state.view='list';state.search='';}
    if(id==='semana'){state.view='week';state.anchor=today();}
    if(id==='reunioes'){state.type='Reunião';state.view='list';}
    if(id==='vinculados'){state.onlyLinked=true;state.view='list';}
    if(id==='concluidos'){state.view='list';state.search='concluído';}
    saveUI();render();
  }
  function setView(v){state.view=VIEW_MAP[v]||v||'month';saveUI();render();}
  function move(delta){const d=parseDate(state.anchor);if(state.view==='day')d.setDate(d.getDate()+delta);else if(state.view==='week')d.setDate(d.getDate()+delta*7);else if(state.view==='year')d.setFullYear(d.getFullYear()+delta);else d.setMonth(d.getMonth()+delta);state.anchor=dateKey(d);saveUI();render();}

  function renderBody(){
    const body=$('#v64AgendaBody'); if(!body) return;
    const d=parseDate(state.anchor);
    if(state.view==='day') body.innerHTML=dayHTML(d);
    else if(state.view==='week') body.innerHTML=weekHTML(d);
    else if(state.view==='year') body.innerHTML=yearHTML(d);
    else if(state.view==='list') body.innerHTML=listHTML();
    else body.innerHTML=monthHTML(d);
    bindBody();
  }
  function eventChip(e){const l=leadByName(e.leadNome)||e.lead;return `<button type="button" class="v64-event ${typeClass(e.tipo)} ${e.status==='feito'?'done':''} ${e.source==='lead-followup'?'synthetic':''}" data-v64-open="${esc(e.id)}" data-source="${esc(e.source)}" title="${esc(e.title)}"><span>${esc(e.hora||'Lead')}</span><b>${esc(e.leadNome||e.title)}</b>${l?`<em>${esc(l.etapa||'Lead')}</em>`:''}</button>`;}
  function monthHTML(d){
    const y=d.getFullYear(), m=d.getMonth(); const start=new Date(y,m,1);start.setDate(start.getDate()-start.getDay());
    let html='<div class="v64-month-grid">'+['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(x=>`<div class="v64-dow">${x}</div>`).join('');
    for(let i=0;i<42;i++){
      const cur=new Date(start);cur.setDate(start.getDate()+i);const ds=dateKey(cur);const evs=eventsForDate(ds);const other=cur.getMonth()!==m;
      html+=`<div class="v64-day ${other?'other':''} ${ds===today()?'today':''}" data-v64-new-date="${ds}"><div class="v64-day-top"><strong>${cur.getDate()}</strong><button type="button" data-v64-new-date="${ds}">+</button></div>${evs.slice(0,4).map(eventChip).join('')}${evs.length>4?`<div class="v64-more">+${evs.length-4} itens</div>`:''}</div>`;
    }
    return html+'</div>';
  }
  function weekHTML(d){
    const s=startOfWeek(d);const days=Array.from({length:7},(_,i)=>{const x=new Date(s);x.setDate(s.getDate()+i);return x;});
    let html='<div class="v64-week-grid"><div class="v64-time-head"></div>'+days.map(x=>`<div class="v64-week-head"><b>${x.toLocaleDateString('pt-BR',{weekday:'short'})}</b><span>${x.getDate()}/${x.getMonth()+1}</span></div>`).join('');
    for(let h=7;h<=21;h++){
      html+=`<div class="v64-time-label">${pad(h)}:00</div>`;
      days.forEach(day=>{const ds=dateKey(day);const evs=eventsForDate(ds).filter(e=>!e.hora||String(e.hora).startsWith(pad(h)));html+=`<div class="v64-slot" data-v64-new-date="${ds}" data-v64-new-hour="${pad(h)}:00">${evs.map(eventChip).join('')}</div>`;});
    }
    return html+'</div>';
  }
  function dayHTML(d){
    const ds=dateKey(d);let html='<div class="v64-day-view">';
    for(let h=7;h<=21;h++) html+=`<div class="v64-hour-label">${pad(h)}:00</div><div class="v64-hour-slot" data-v64-new-date="${ds}" data-v64-new-hour="${pad(h)}:00">${eventsForDate(ds).filter(e=>!e.hora||String(e.hora).startsWith(pad(h))).map(eventChip).join('')}</div>`;
    return html+'</div>';
  }
  function yearHTML(d){
    const y=d.getFullYear();return `<div class="v64-year-grid">${Array.from({length:12},(_,m)=>{const count=filteredItems().filter(e=>parseDate(e.data).getFullYear()===y&&parseDate(e.data).getMonth()===m).length;return `<button class="v64-year-month" type="button" data-v64-year-month="${m}"><strong>${new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long'}).replace(/^\w/,x=>x.toUpperCase())}</strong><span>${count} itens</span></button>`;}).join('')}</div>`;
  }
  function listHTML(){
    const rows=filteredItems();
    if(!rows.length)return '<div class="v64-empty">Nenhum compromisso ou follow-up encontrado para os filtros atuais.</div>';
    const groups={}; rows.forEach(e=>{(groups[e.data]||(groups[e.data]=[])).push(e);});
    return `<div class="v64-list">${Object.keys(groups).sort().map(ds=>`<section class="v64-list-day"><h3>${fmtDateLong(ds)}</h3>${groups[ds].map(listRow).join('')}</section>`).join('')}</div>`;
  }
  function listRow(e){const l=leadByName(e.leadNome)||e.lead;return `<article class="v64-list-row ${e.status==='feito'?'done':''}" data-v64-open="${esc(e.id)}" data-source="${esc(e.source)}"><div class="v64-row-time"><b>${esc(e.hora||'—')}</b><span>${esc(e.tipo)}</span></div><div class="v64-row-main"><strong>${esc(e.title)}</strong><p>${esc(e.leadNome||'Sem lead')} ${l?`· ${esc(l.etapa||'Lead')} · ${esc(l.responsavel||'Sem responsável')}`:''}</p>${e.notas?`<small>${esc(e.notas)}</small>`:''}</div><div class="v64-row-tags"><span class="v64-pill ${priorityClass(e.prioridade)}">${esc(e.prioridade)}</span>${e.source==='lead-followup'?'<span class="v64-pill muted">Vem do lead</span>':''}${e.status==='feito'?'<span class="v64-pill done">Concluído</span>':''}</div></article>`;}
  function bindBody(){
    $$('[data-v64-new-date]').forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('[data-v64-open]'))return;e.preventDefault();openDrawer({data:el.dataset.v64NewDate,hora:el.dataset.v64NewHour||'09:00',tipo:'Reunião'},false);}));
    $$('[data-v64-open]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();openById(el.dataset.v64Open,el.dataset.source);}));
    $$('[data-v64-year-month]').forEach(el=>el.addEventListener('click',()=>{const d=parseDate(state.anchor);d.setMonth(Number(el.dataset.v64YearMonth));d.setDate(1);state.anchor=dateKey(d);state.view='month';saveUI();render();}));
  }
  function openById(id,source){
    if(source==='lead-followup'){
      const item=syntheticFollowups().find(x=>x.id===id);if(item) openDrawer({title:item.title,leadNome:item.leadNome,data:item.data,hora:'09:00',tipo:'Follow-up',prioridade:item.prioridade,notas:item.notas},false,true);
      return;
    }
    const ev=loadEvents().find(e=>e.id===id); if(ev) openDrawer(ev,true,false);
  }
  function openDrawer(input={},editing=false,fromLeadFollowup=false){
    const ev=normalizeEvent(input);
    const drawer=$('#v64AgendaDrawer'),back=$('#v64AgendaBackdrop'); if(!drawer||!back)return;
    const leads=getLeads();const lead=leadByName(ev.leadNome);
    drawer.innerHTML=`<div class="v64-drawer-head"><div><strong>${editing?'Editar compromisso':'Novo compromisso'}</strong><span>${fromLeadFollowup?'Transforme o follow-up do lead em evento real na agenda.':'Conecte o compromisso ao lead e mantenha tudo sincronizado.'}</span></div><button type="button" data-v64-close>×</button></div>
      <div class="v64-drawer-body">
        <div class="v64-form-grid">
          <label class="full">Título<input id="v64EvTitle" value="${esc(ev.title||'')}"></label>
          <label>Data<input id="v64EvDate" type="date" value="${esc(ev.data)}"></label>
          <label>Hora<input id="v64EvHour" type="time" value="${esc(ev.hora||'09:00')}"></label>
          <label>Tipo<select id="v64EvType">${TYPES.map(t=>`<option ${ev.tipo===t?'selected':''}>${t}</option>`).join('')}</select></label>
          <label>Prioridade<select id="v64EvPriority">${PRIORITIES.map(p=>`<option ${ev.prioridade===p?'selected':''}>${p}</option>`).join('')}</select></label>
          <label class="full">Lead vinculado<select id="v64EvLead"><option value="">Sem lead vinculado</option>${leads.map(l=>`<option value="${esc(l.nome)}" ${ev.leadNome===l.nome?'selected':''}>${esc(l.nome)} · ${esc(l.etapa||'Lead')}</option>`).join('')}</select></label>
          <label class="full">Objetivo<input id="v64EvObjective" value="${esc(ev.objetivo||'') }" placeholder="Ex: confirmar interesse, fazer diagnóstico, negociar proposta"></label>
          <label class="full">Notas / preparação<textarea id="v64EvNotes" rows="4" placeholder="Contexto, perguntas, objeções, próximos passos...">${esc(ev.notas||'')}</textarea></label>
          <label class="full">Resultado<select id="v64EvResult"><option value="">Ainda pendente</option>${['Concluído sem avanço','Reunião realizada','Proposta enviada','Não atendeu','Remarcar','Ganho','Perdido'].map(r=>`<option ${ev.resultado===r?'selected':''}>${r}</option>`).join('')}</select></label>
          <label class="v64-check full"><input id="v64SyncLead" type="checkbox" checked> Atualizar próxima ação e histórico do lead vinculado</label>
        </div>
        <div id="v64LeadPreview">${leadPreviewHTML(lead)}</div>
      </div>
      <div class="v64-drawer-actions">
        ${editing?'<button class="v64-btn danger" data-v64-delete type="button">Excluir</button>':''}
        ${lead?'<button class="v64-btn ghost" data-v64-open-lead type="button">Abrir lead</button>':''}
        ${lead?.telefone?`<a class="v64-btn ghost" href="${waHref(lead.telefone)}" target="_blank">WhatsApp</a><a class="v64-btn ghost" href="${telHref(lead.telefone)}">Ligar</a>`:''}
        ${editing?'<button class="v64-btn" data-v64-complete type="button">Marcar feito</button>':''}
        <button class="v64-btn ghost" data-v64-close type="button">Cancelar</button>
        <button class="v64-btn primary" data-v64-save type="button">Salvar</button>
      </div>`;
    back.classList.add('open');drawer.classList.add('open');
    $('#v64EvLead')?.addEventListener('change',()=>{$('#v64LeadPreview').innerHTML=leadPreviewHTML(leadByName($('#v64EvLead').value));});
    $$('[data-v64-close]').forEach(b=>b.addEventListener('click',closeDrawer));
    $('[data-v64-save]')?.addEventListener('click',()=>saveDrawer(editing?ev.id:null));
    $('[data-v64-delete]')?.addEventListener('click',()=>deleteEvent(ev.id));
    $('[data-v64-complete]')?.addEventListener('click',()=>completeEvent(ev.id));
    $('[data-v64-open-lead]')?.addEventListener('click',()=>openLead($('#v64EvLead')?.value||ev.leadNome));
  }
  function leadPreviewHTML(l){
    if(!l)return '<div class="v64-lead-preview empty">Nenhum lead vinculado. Vincule um lead para salvar histórico, próxima ação e contato rápido.</div>';
    return `<div class="v64-lead-preview"><div class="v64-avatar">${esc(initials(l.nome))}</div><div><strong>${esc(l.nome)}</strong><p>${esc(l.segmento||'Sem segmento')} · ${esc(l.responsavel||'Sem responsável')}</p><div class="v64-preview-tags"><span class="v64-pill ${stageClass(l.etapa)}">${esc(l.etapa||'Lead')}</span><span class="v64-pill ${priorityClass(l.prioridade)}">${esc(l.prioridade||'Média')}</span>${l.valor?`<span class="v64-pill money">${money(l.valor)}</span>`:''}${l.followup?`<span class="v64-pill muted">Próx: ${fmtDate(l.followup)}</span>`:''}</div></div></div>`;
  }
  function drawerEvent(id){return normalizeEvent({
    id:id||uid(),
    title:$('#v64EvTitle')?.value?.trim()||'Compromisso',
    data:$('#v64EvDate')?.value||today(),
    hora:$('#v64EvHour')?.value||'09:00',
    tipo:$('#v64EvType')?.value||'Reunião',
    prioridade:$('#v64EvPriority')?.value||'Média',
    leadNome:$('#v64EvLead')?.value||'',
    objetivo:$('#v64EvObjective')?.value||'',
    notas:$('#v64EvNotes')?.value||'',
    resultado:$('#v64EvResult')?.value||'',
    status:$('#v64EvResult')?.value?'feito':'pendente',
    updatedAt:new Date().toISOString()
  });}
  function saveDrawer(id){
    const ev=drawerEvent(id);const list=loadEvents();const idx=list.findIndex(x=>x.id===id);if(idx>=0)list[idx]=ev;else list.push(ev);
    saveEvents(list);updateLeadFromEvent(ev,{syncLead:$('#v64SyncLead')?.checked});state.anchor=ev.data;saveUI();closeDrawer();render();toast(id?'Compromisso atualizado':'Compromisso criado','success');
  }
  function completeEvent(id){
    const list=loadEvents();const idx=list.findIndex(e=>e.id===id);if(idx<0)return;const ev=drawerEvent(id);ev.status='feito';ev.resultado=ev.resultado||'Concluído';list[idx]=ev;saveEvents(list);updateLeadFromEvent(ev,{syncLead:true});closeDrawer();render();toast('Compromisso concluído e histórico atualizado','success');
  }
  function deleteEvent(id){if(!id)return;saveEvents(loadEvents().filter(e=>e.id!==id));closeDrawer();render();toast('Compromisso excluído','success');}
  function closeDrawer(){$('#v64AgendaBackdrop')?.classList.remove('open');$('#v64AgendaDrawer')?.classList.remove('open');}
  function addEvent(ev,opts={}){const list=loadEvents();const next=normalizeEvent(ev);list.push(next);saveEvents(list);if(opts.syncLead!==false)updateLeadFromEvent(next,{syncLead:true});if(!opts.silent)toast('Compromisso criado na Agenda','success');return next;}

  function syncAgendaAPI(){
    window.crmAgendaAPI={
      get:()=>loadEvents(),
      set:(arr)=>{saveEvents(Array.isArray(arr)?arr:loadEvents());render();},
      save:()=>{saveEvents(loadEvents());render();},
      render:()=>render(),
      openDetail:(id)=>openById(id,'event'),
      openModal:(id)=>{const ev=id?loadEvents().find(e=>e.id===id):null;openDrawer(ev||{data:state.anchor,hora:'09:00'},!!ev);},
      add:addEvent
    };
  }

  function patchGlobals(){
    syncAgendaAPI();
    window.renderAgenda = render;
    window.CRMV64Agenda={render,setView,openEvent:(id)=>openById(id,'event'),addEvent,deleteEvent,getEvents:loadEvents,saveEvents};
  }
  function boot(){
    patchGlobals();
    DOC.addEventListener('click',function(e){
      const btn=e.target.closest('[data-v64-open-agenda-lead]');
      if(btn){e.preventDefault();const lead=leadByName(btn.dataset.v64OpenAgendaLead);state.lead=lead?.nome||'';state.view='list';saveUI();try{window.setView('agenda');}catch(_){render();}}
    },true);
    if($('.view.active')?.id==='agenda') setTimeout(render,50);
  }
  if(DOC.readyState==='loading') DOC.addEventListener('DOMContentLoaded',boot); else boot();
})();
