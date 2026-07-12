/* EMBED: assets/js/modules/09-dashboard-acoes-dia-v67.js */
/* CRM V67 — Dashboard inicial de ações do dia
   Substitui o painel antigo 09, reaproveitando a aba #inicio sem criar página duplicada. */
(function(){
  'use strict';
  if(window.__CRM_V67_DAILY_DASHBOARD__) return;
  window.__CRM_V67_DAILY_DASHBOARD__ = true;

  const DOC = document;
  const $ = (sel, root=DOC) => root.querySelector(sel);
  const $$ = (sel, root=DOC) => Array.from(root.querySelectorAll(sel));
  const LEADS_KEY = 'outbounder_leads_v5';
  const EVENTS_KEY = 'outbounder_agenda_v1';
  const NOTE_KEY = 'outbounder_notes';
  const PREF_KEY = 'crm_v67_dashboard_widgets';
  const COLOR_KEY = 'crm_v67_dashboard_colors';
  const ORDER_KEY = 'crm_v67_dashboard_order';
  const CLOSED = new Set(['Fechado','Perdido']);
  const COLORS = ['blue','green','amber','purple','rose','cyan','slate'];
  const COLOR_NAME = {blue:'Azul',green:'Verde',amber:'Âmbar',purple:'Roxo',rose:'Vermelho',cyan:'Ciano',slate:'Cinza'};
  const WIDGET_NAMES = {
    summary:'Resumo operacional',
    routine:'Rotina recomendada',
    agenda:'Agenda de hoje',
    overdue:'Follow-ups críticos',
    risk:'Pipeline em risco',
    hot:'Leads quentes',
    shortcuts:'Atalhos comerciais',
    note:'Nota rápida'
  };
  const DEFAULT_VISIBLE = {summary:true,routine:true,agenda:true,overdue:true,risk:true,hot:true,shortcuts:true,note:true};
  const DEFAULT_COLOR = {summary:'blue',routine:'green',agenda:'amber',overdue:'rose',risk:'purple',hot:'cyan',shortcuts:'slate',note:'slate'};

  function esc(v){return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function norm(v){return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function parseDate(s){const p=String(s||today()).slice(0,10).split('-').map(Number);const d=new Date(p[0]||new Date().getFullYear(),(p[1]||1)-1,p[2]||1);return isNaN(d.getTime())?new Date():d;}
  function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function addDays(s,n){const d=parseDate(s);d.setDate(d.getDate()+Number(n||0));return dateKey(d);}
  function daysDiff(s){const a=parseDate(s).setHours(0,0,0,0);const b=parseDate(today()).setHours(0,0,0,0);return Math.round((a-b)/864e5);}
  function daysSince(s){if(!s)return 0;return Math.max(0,Math.round((parseDate(today()).setHours(0,0,0,0)-parseDate(s).setHours(0,0,0,0))/864e5));}
  function fmtDate(s){if(!s)return 'Sem data';try{return parseDate(s).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});}catch(e){return String(s);}}
  function fmtShort(s){if(!s)return '—';try{return parseDate(s).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace('.', '');}catch(e){return String(s);}}
  function money(v){try{return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v)||0);}catch(e){return 'R$ '+(Number(v)||0).toLocaleString('pt-BR');}}
  function readJSON(k,fb){try{const raw=localStorage.getItem(k);return raw?JSON.parse(raw):fb;}catch(e){return fb;}}
  function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function toast(msg,type='success'){try{window.crmToast?window.crmToast(msg,type):showToast(msg,type);}catch(e){console.log(msg);}}

  function getLeads(){
    try{if(window.crmGetLeads && Array.isArray(window.crmGetLeads())) return window.crmGetLeads();}catch(e){}
    try{if(Array.isArray(window.leads)) return window.leads;}catch(e){}
    try{if(typeof leads !== 'undefined' && Array.isArray(leads)) return leads;}catch(e){}
    return readJSON(LEADS_KEY,[]);
  }
  function saveLeadsData(){
    try{if(typeof window.crmSaveLeads === 'function'){window.crmSaveLeads();return;}}catch(e){}
    try{if(typeof globalThis.saveLeads === 'function' && globalThis.saveLeads !== saveLeadsData){globalThis.saveLeads();return;}}catch(e){}
    writeJSON(LEADS_KEY,getLeads());
  }
  function getEvents(){
    const raw=readJSON(EVENTS_KEY,[]);
    if(!Array.isArray(raw)) return [];
    return raw.map(e=>({
      id:e.id || ('ev_'+Math.random().toString(36).slice(2)),
      title:e.title || e.titulo || e.nome || e.tipo || 'Compromisso',
      leadNome:e.leadNome || e.lead || e.nomeLead || '',
      data:String(e.data || e.date || today()).slice(0,10),
      hora:e.hora || e.start || '',
      tipo:e.tipo || e.type || 'Tarefa',
      prioridade:e.prioridade || e.priority || 'Média',
      status:e.status || 'pendente',
      notas:e.notas || e.notes || ''
    }));
  }
  function isOpen(l){return !CLOSED.has(l.etapa || 'Lead');}
  function leadId(l){return String(l.id || l.nome || '').trim();}
  function leadById(id){const n=norm(id);return getLeads().find(l=>norm(l.id)===n || norm(l.nome)===n) || null;}
  function openLead(id){
    const l=leadById(id) || id;
    try{if(window.crmOpenLead){window.crmOpenLead(l.nome || l);return;}}catch(e){}
    try{if(typeof openDetail === 'function'){openDetail(l.nome || l);return;}}catch(e){}
    go('leads');
  }
  function openNewLead(){
    try{if(window.crmOpenLeadModal){window.crmOpenLeadModal(null);return;}}catch(e){}
    try{if(typeof openModal === 'function'){openModal(null);return;}}catch(e){}
    go('novo-lead');
  }
  function go(view){try{if(typeof window.setView === 'function'){window.setView(view);return;}}catch(e){}try{if(typeof setView === 'function'){setView(view);return;}}catch(e){}}
  function phoneHref(l){let d=String(l?.telefone||'').replace(/\D/g,'');if(!d)return '#';if(!d.startsWith('55'))d='55'+d;return 'https://wa.me/'+d;}
  function score(l){
    try{if(typeof calcScore === 'function') return calcScore(l);}catch(e){}
    const stage={Lead:10,Contato:30,Proposta:65,Fechado:100,Perdido:0}[l.etapa] || 10;
    const pri={Alta:25,'Média':12,Baixa:4}[l.prioridade] || 8;
    const value=Math.min(25,Math.round((Number(l.valor)||0)/1000));
    const recency=Math.max(0,15-daysSince(l.ultimaAtualizacao||l.dataEntrada));
    return Math.max(0,Math.min(100,stage+pri+value+recency));
  }
  function statusBadge(l){
    if(!l.followup) return {txt:'Sem data', cls:'neutral'};
    const diff=daysDiff(l.followup);
    if(diff<0) return {txt:`Vencido ${Math.abs(diff)}d`, cls:'danger'};
    if(diff===0) return {txt:'Hoje', cls:'warning'};
    if(diff<=7) return {txt:`Em ${diff}d`, cls:'info'};
    return {txt:fmtShort(l.followup), cls:'neutral'};
  }

  function data(){
    const leads=getLeads();
    const active=leads.filter(isOpen);
    const t=today();
    const week=addDays(t,7);
    const events=getEvents();
    const agendaToday=events.filter(e=>e.data===t && e.status!=='feito');
    const agendaWeek=events.filter(e=>e.data>=t && e.data<=week && e.status!=='feito');
    const overdue=active.filter(l=>l.followup && daysDiff(l.followup)<0).sort((a,b)=>String(a.followup).localeCompare(String(b.followup)));
    const followToday=active.filter(l=>l.followup && daysDiff(l.followup)===0).sort((a,b)=>score(b)-score(a));
    const nextWeek=active.filter(l=>l.followup && l.followup>=t && l.followup<=week);
    const noNext=active.filter(l=>!l.followup && !l.proximaAcao);
    const stagnant=active.filter(l=>daysSince(l.ultimaAtualizacao||l.dataEntrada)>=7 && !l.followup);
    const risk=active.filter(l=>{
      if(l.etapa==='Proposta' && (!l.followup || daysDiff(l.followup)<=1)) return true;
      if(!l.followup && !l.proximaAcao) return true;
      if(daysSince(l.ultimaAtualizacao||l.dataEntrada)>=10) return true;
      if(l.followup && daysDiff(l.followup)<0) return true;
      return false;
    }).sort((a,b)=>(Number(b.valor)||0)-(Number(a.valor)||0));
    const hot=active.filter(l=>score(l)>=55).sort((a,b)=>score(b)-score(a));
    const proposals=active.filter(l=>l.etapa==='Proposta');
    const won=leads.filter(l=>l.etapa==='Fechado');
    const pipe=active.filter(l=>l.etapa!=='Fechado').reduce((s,l)=>s+(Number(l.valor)||0),0);
    const forecast=active.filter(l=>l.etapa!=='Fechado').reduce((s,l)=>s+(Number(l.valor)||0)*(Number(l.probabilidade || ({Lead:10,Contato:30,Proposta:65}[l.etapa]||20))/100),0);
    const actions=[
      ...overdue.map(l=>({kind:'overdue',lead:l,title:'Retornar follow-up vencido',sub:`Venceu em ${fmtDate(l.followup)} · ${l.etapa||'Lead'}`,badge:'Crítico',view:'cadencias'})),
      ...followToday.map(l=>({kind:'today',lead:l,title:l.proximaAcao||'Executar contato de hoje',sub:`Follow-up para hoje · ${l.etapa||'Lead'}`,badge:'Hoje',view:'cadencias'})),
      ...agendaToday.map(e=>({kind:'agenda',event:e,title:e.title||e.tipo,sub:`${e.hora?e.hora+' · ':''}${e.tipo}${e.leadNome?' · '+e.leadNome:''}`,badge:'Agenda',view:'agenda'})),
      ...noNext.map(l=>({kind:'no-next',lead:l,title:'Definir próximo passo',sub:`Sem follow-up marcado · ${l.etapa||'Lead'}`,badge:'Sem ação',view:'leads'})),
      ...hot.map(l=>({kind:'hot',lead:l,title:'Atacar lead quente',sub:`Score ${score(l)} · ${money(l.valor||0)}`,badge:'Quente',view:'leads'}))
    ];
    const seen=new Set();
    const queue=actions.filter(a=>{
      const id=a.lead?leadId(a.lead):('ev_'+a.event?.id);
      if(!id || seen.has(id)) return false;
      seen.add(id);return true;
    }).slice(0,8);
    return {leads,active,events,agendaToday,agendaWeek,overdue,followToday,nextWeek,noNext,stagnant,risk,hot,proposals,won,pipe,forecast,queue};
  }

  function widgetHeader(id,title,sub){return `<div class="panel-widget-head"><div><h3>${esc(title)}</h3><p>${esc(sub)}</p></div><div class="panel-widget-actions"><button aria-label="Mudar cor do quadro" class="panel-color-btn" data-v67-color="${esc(id)}" title="Mudar cor" type="button"></button><button aria-label="Ocultar quadro" class="panel-hide-btn" data-v67-hide="${esc(id)}" title="Ocultar" type="button">×</button></div></div>`;}
  function shell(){
    const home=$('#inicio');
    if(!home) return;
    if(home.dataset.v67Ready==='1') return;
    home.dataset.v67Ready='1';
    home.classList.add('panel-pro-page','v67-daily-page');
    home.innerHTML = `
      <div class="v67-hero" id="v67Hero">
        <div class="v67-hero-copy">
          <div class="panel-pro-eyebrow">Dashboard inicial</div>
          <h2 id="v67FocusTitle">Ações do dia</h2>
          <p id="v67FocusText">Priorize follow-ups, agenda, leads quentes e negócios em risco em uma única tela.</p>
          <div class="v67-hero-actions">
            <button class="btn btn-primary" id="v67StartRoutine" type="button">Começar pela prioridade</button>
            <button class="btn" id="v67NewLeadBtn" type="button">Novo lead</button>
            <button class="btn" data-v67-go="cadencias" type="button">Follow-ups</button>
            <button class="btn" data-v67-go="agenda" type="button">Agenda</button>
          </div>
        </div>
        <div class="v67-focus-card">
          <div class="v67-focus-top"><span>Saúde da rotina</span><strong id="v67HealthScore">0%</strong></div>
          <div class="v67-progress"><i id="v67HealthBar"></i></div>
          <div class="v67-focus-grid">
            <div><strong id="v67HeroOverdue">0</strong><span>vencidos</span></div>
            <div><strong id="v67HeroToday">0</strong><span>hoje</span></div>
            <div><strong id="v67HeroHot">0</strong><span>quentes</span></div>
          </div>
        </div>
      </div>
      <div class="panel-pro-toolbar v67-toolbar">
        <div><strong>Painel de ações do dia</strong><span>Escolha os quadros, mova a ordem e mantenha apenas o que quer visualizar.</span></div>
        <div class="panel-pro-toolbar-actions">
          <span class="panel-pro-count" id="v67WidgetCount">0 quadros visíveis</span>
          <button class="btn btn-sm" id="v67ChooseWidgets" type="button">Escolher quadros</button>
          <button class="btn btn-sm" id="v67MoveWidgets" type="button">Mover quadros</button>
          <button class="btn btn-sm" id="v67ShowAllWidgets" type="button">Mostrar todos</button>
          <button class="btn btn-sm btn-primary" id="v67Refresh" type="button">Atualizar</button>
        </div>
      </div>
      <div class="panel-pro-grid v67-grid" id="v67DashboardGrid">
        <div class="panel-widget v67-widget" data-color="blue" data-v67-widget="summary">${widgetHeader('summary','Resumo operacional','Números reais vindos de Leads, Pipeline, Agenda e Follow-ups.')}<div class="v67-kpi-grid" id="v67Kpis"></div></div>
        <div class="panel-widget v67-widget" data-color="green" data-v67-widget="routine">${widgetHeader('routine','Rotina recomendada','Ordem prática para executar o dia sem se perder.')}<div class="v67-routine" id="v67RoutineList"></div></div>
        <div class="panel-widget v67-widget" data-color="amber" data-v67-widget="agenda">${widgetHeader('agenda','Agenda de hoje','Compromissos e follow-ups ligados aos leads.')}<div class="v67-list" id="v67AgendaToday"></div></div>
        <div class="panel-widget v67-widget" data-color="rose" data-v67-widget="overdue">${widgetHeader('overdue','Follow-ups críticos','Pendências vencidas ou próximas de virar problema.')}<div class="v67-list" id="v67OverdueList"></div></div>
        <div class="panel-widget v67-widget" data-color="purple" data-v67-widget="risk">${widgetHeader('risk','Pipeline em risco','Oportunidades abertas sem próximo passo claro.')}<div class="v67-list" id="v67RiskList"></div></div>
        <div class="panel-widget v67-widget" data-color="cyan" data-v67-widget="hot">${widgetHeader('hot','Leads quentes','Melhores oportunidades para atacar agora.')}<div class="v67-list" id="v67HotList"></div></div>
        <div class="panel-widget v67-widget" data-color="slate" data-v67-widget="shortcuts">${widgetHeader('shortcuts','Atalhos comerciais','Acesso rápido às áreas que alimentam o dia.')}<div class="v67-shortcuts" id="v67Shortcuts"></div></div>
        <div class="panel-widget v67-widget" data-color="slate" data-v67-widget="note">${widgetHeader('note','Nota rápida','Anote algo importante sem sair do painel.')}<div class="nota-card panel-note-card v67-note"><textarea id="quickNote" placeholder="Registre uma observação rápida..."></textarea><div><button aria-label="Salvar nota" class="btn btn-sm btn-primary" id="saveNoteBtn" type="button">Salvar nota</button></div></div></div>
      </div>`;
  }

  function row(item,opts={}){
    const l=item.lead;
    const ev=item.event;
    const id=l?leadId(l):'';
    const title=item.title || l?.nome || ev?.title || 'Item';
    const sub=item.sub || '';
    const badge=item.badge || '';
    const value=l && Number(l.valor) ? money(l.valor) : '';
    const cls=opts.cls || '';
    return `<div class="v67-row ${cls}" ${id?`data-v67-lead="${esc(id)}"`:ev?`data-v67-go="agenda"`:''}>
      <div class="v67-row-main"><b>${esc(title)}${l?.nome && !String(title).includes(l.nome)?' · '+esc(l.nome):''}</b><span>${esc(sub)}</span></div>
      <div class="v67-row-side">${value?`<em>${esc(value)}</em>`:''}${badge?`<strong>${esc(badge)}</strong>`:''}</div>
    </div>`;
  }
  function empty(text){return `<div class="v67-empty">${esc(text)}</div>`;}
  function renderRows(id,arr,emptyText,mapper){const box=$('#'+id);if(!box)return;box.innerHTML=arr.length?arr.map(mapper||row).join(''):empty(emptyText);}

  function render(){
    shell();
    const d=data();
    const totalActions=d.queue.length;
    const health=Math.max(0,Math.min(100,100 - (d.overdue.length*18) - (d.noNext.length*7) - (d.stagnant.length*8)));
    const set=(id,val)=>{const el=$('#'+id);if(el)el.textContent=val;};
    set('v67HealthScore',health+'%');
    const bar=$('#v67HealthBar');if(bar)bar.style.width=health+'%';
    set('v67HeroOverdue',d.overdue.length);set('v67HeroToday',d.followToday.length+d.agendaToday.length);set('v67HeroHot',d.hot.length);
    const title=$('#v67FocusTitle'),txt=$('#v67FocusText');
    if(title&&txt){
      if(d.overdue.length){title.textContent=`Resolver ${d.overdue.length} follow-up${d.overdue.length>1?'s':''} vencido${d.overdue.length>1?'s':''}`;txt.textContent='Comece pelas pendências vencidas antes de abrir novas oportunidades.';}
      else if(d.followToday.length || d.agendaToday.length){title.textContent=`Executar ${d.followToday.length+d.agendaToday.length} ação${(d.followToday.length+d.agendaToday.length)>1?'ões':''} de hoje`;txt.textContent='A rotina do dia está pronta: siga a fila, registre o resultado e avance o funil.';}
      else if(d.risk.length){title.textContent='Organizar próximos passos';txt.textContent='Não há atraso crítico, mas existem oportunidades abertas sem ação clara.';}
      else{title.textContent='Painel limpo';txt.textContent='Sem urgências críticas. Aproveite para garimpar, cadastrar novos leads ou revisar o pipeline.';}
    }
    const kpis=[
      ['Ações agora',totalActions,'Fila priorizada','cadencias'],
      ['Follow-ups vencidos',d.overdue.length,'Precisam retorno','cadencias'],
      ['Agenda hoje',d.agendaToday.length,'Compromissos pendentes','agenda'],
      ['Pipeline aberto',money(d.pipe),'Valor bruto aberto','pipeline'],
      ['Forecast',money(d.forecast),'Valor ponderado','dashboard'],
      ['Sem próximo passo',d.noNext.length,'Leads abertos sem ação','leads']
    ];
    const kpibox=$('#v67Kpis');if(kpibox)kpibox.innerHTML=kpis.map(([lbl,val,sub,view])=>`<button class="v67-kpi" data-v67-go="${esc(view)}" type="button"><strong>${esc(val)}</strong><span>${esc(lbl)}</span><small>${esc(sub)}</small></button>`).join('');
    const routine=[
      {n:'1',title:d.overdue.length?'Resolver vencidos':'Revisar fila do dia',sub:d.overdue.length?`${d.overdue.length} follow-up(s) atrasado(s)`:`${d.followToday.length+d.agendaToday.length} ação(ões) para hoje`,view:'cadencias'},
      {n:'2',title:'Executar agenda',sub:`${d.agendaToday.length} compromisso(s) hoje · ${d.agendaWeek.length} na semana`,view:'agenda'},
      {n:'3',title:'Atacar leads quentes',sub:`${d.hot.length} oportunidade(s) com maior potencial`,view:'leads'},
      {n:'4',title:'Destravar pipeline',sub:`${d.risk.length} negócio(s) em risco ou sem próximo passo`,view:'pipeline'}
    ];
    const rbox=$('#v67RoutineList');if(rbox)rbox.innerHTML=routine.map(x=>`<button class="v67-step" data-v67-go="${esc(x.view)}" type="button"><i>${esc(x.n)}</i><span><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></span></button>`).join('');
    renderRows('v67AgendaToday',d.agendaToday.slice(0,7),'Nenhum compromisso para hoje.',e=>row({event:e,title:e.title||e.tipo,sub:`${e.hora?e.hora+' · ':''}${e.tipo}${e.leadNome?' · '+e.leadNome:''}`,badge:e.prioridade||'Agenda'},{cls:'is-agenda'}));
    renderRows('v67OverdueList',d.overdue.slice(0,7),'Nenhum follow-up vencido.',l=>{const b=statusBadge(l);return row({lead:l,title:l.proximaAcao||'Retornar contato',sub:`${l.nome} · ${fmtDate(l.followup)} · ${l.etapa||'Lead'}`,badge:b.txt},{cls:'is-danger'});});
    renderRows('v67RiskList',d.risk.slice(0,7),'Nenhuma oportunidade em risco agora.',l=>{const reason=l.followup&&daysDiff(l.followup)<0?'Follow-up vencido':!l.followup&&!l.proximaAcao?'Sem próximo passo':daysSince(l.ultimaAtualizacao||l.dataEntrada)>=10?'Parado há '+daysSince(l.ultimaAtualizacao||l.dataEntrada)+'d':'Atenção';return row({lead:l,title:l.nome,sub:`${reason} · ${l.etapa||'Lead'} · ${l.responsavel||'Sem responsável'}`,badge:l.prioridade||'Média'},{cls:'is-risk'});});
    renderRows('v67HotList',d.hot.slice(0,7),'Nenhum lead quente no momento.',l=>row({lead:l,title:l.nome,sub:`Score ${score(l)} · ${l.etapa||'Lead'} · ${l.cidade||l.origem||'Sem origem'}`,badge:money(l.valor||0)},{cls:'is-hot'}));
    const sbox=$('#v67Shortcuts');if(sbox)sbox.innerHTML=[
      ['Novo lead','novo-lead','primary'],['Leads','leads',''],['Garimpo','garimpo',''],['Follow-ups','cadencias',''],['Agenda','agenda',''],['Pipeline','pipeline',''],['Funil real','funil',''],['Dashboard comercial','dashboard','']
    ].map(([label,view,kind])=>`<button class="btn btn-sm ${kind==='primary'?'btn-primary':''}" data-v67-go="${esc(view)}" type="button">${esc(label)}</button>`).join('');
    const note=$('#quickNote');if(note && !note.dataset.v67Loaded){note.value=localStorage.getItem(NOTE_KEY)||'';note.dataset.v67Loaded='1';}
    applyPrefs();
  }

  function prefs(){return Object.assign({},DEFAULT_VISIBLE,readJSON(PREF_KEY,{}));}
  function colors(){return Object.assign({},DEFAULT_COLOR,readJSON(COLOR_KEY,{}));}
  function order(){const arr=readJSON(ORDER_KEY,[]);return Array.isArray(arr)?arr:[];}
  function applyPrefs(){
    const grid=$('#v67DashboardGrid');if(!grid)return;
    const p=prefs(),c=colors();
    order().forEach(id=>{const el=grid.querySelector(`[data-v67-widget="${CSS.escape(id)}"]`);if(el)grid.appendChild(el);});
    Object.keys(WIDGET_NAMES).forEach(id=>{const el=grid.querySelector(`[data-v67-widget="${id}"]`);if(!el)return;el.hidden=p[id]===false;el.dataset.color=c[id]||DEFAULT_COLOR[id]||'blue';});
    const n=Object.keys(WIDGET_NAMES).filter(id=>p[id]!==false).length;
    const count=$('#v67WidgetCount');if(count)count.textContent=`${n} quadro${n===1?'':'s'} visíveis`;
  }
  function ensureModal(){
    if($('#v67WidgetModal')) return;
    const modal=DOC.createElement('div');
    modal.id='v67WidgetModal';
    modal.className='modal-overlay hidden v67-widget-modal';
    modal.innerHTML=`<div class="modal-box"><div class="modal-head"><h3>Escolher quadros do dashboard</h3><button class="modal-close" id="v67WidgetClose" type="button">×</button></div><div class="modal-body"><p class="v67-modal-help">Marque o que quer ver na tela inicial e escolha a cor de cada quadro. Isso não cria abas novas; apenas personaliza a aba Painel.</p><div class="v67-modal-options" id="v67WidgetOptions"></div></div><div class="modal-foot"><button class="btn" id="v67WidgetClean" type="button">Modo foco</button><button class="btn" id="v67WidgetAll" type="button">Mostrar todos</button><button class="btn btn-primary" id="v67WidgetSave" type="button">Salvar</button></div></div>`;
    DOC.body.appendChild(modal);
  }
  function openModal(){
    ensureModal();
    const p=prefs(),c=colors();
    const opts=$('#v67WidgetOptions');
    if(opts)opts.innerHTML=Object.entries(WIDGET_NAMES).map(([id,name])=>`<label class="v67-modal-option"><input type="checkbox" value="${esc(id)}" ${p[id]!==false?'checked':''}><div><b>${esc(name)}</b><span>Mostrar este quadro no Dashboard inicial.</span></div><select data-v67-color-for="${esc(id)}">${COLORS.map(color=>`<option value="${color}" ${c[id]===color?'selected':''}>${COLOR_NAME[color]}</option>`).join('')}</select></label>`).join('');
    $('#v67WidgetModal')?.classList.remove('hidden');
  }
  function closeModal(){$('#v67WidgetModal')?.classList.add('hidden');}
  function saveModal(){
    const p=prefs(),c=colors();
    $$('#v67WidgetOptions input[type="checkbox"]').forEach(i=>p[i.value]=i.checked);
    if(!Object.values(p).some(Boolean)) p.routine=true;
    $$('#v67WidgetOptions select[data-v67-color-for]').forEach(s=>c[s.dataset.v67ColorFor]=s.value);
    writeJSON(PREF_KEY,p);writeJSON(COLOR_KEY,c);applyPrefs();closeModal();toast('Dashboard atualizado','success');
  }
  function cycleColor(id){
    const c=colors();const cur=c[id]||DEFAULT_COLOR[id]||'blue';c[id]=COLORS[(COLORS.indexOf(cur)+1)%COLORS.length];writeJSON(COLOR_KEY,c);applyPrefs();
  }
  function saveOrder(){const grid=$('#v67DashboardGrid');if(!grid)return;writeJSON(ORDER_KEY,$$('.v67-widget',grid).map(x=>x.dataset.v67Widget));}
  function setMove(on){const grid=$('#v67DashboardGrid');if(!grid)return;grid.classList.toggle('reordering',!!on);$$('.v67-widget',grid).forEach(w=>w.draggable=!!on);}
  function setupDrag(){
    let dragged=null;
    DOC.addEventListener('dragstart',e=>{const w=e.target.closest('.v67-widget');if(!w||!$('#v67DashboardGrid')?.classList.contains('reordering'))return;dragged=w;w.classList.add('is-dragging');try{e.dataTransfer.effectAllowed='move';}catch(_){};});
    DOC.addEventListener('dragend',()=>{if(dragged)dragged.classList.remove('is-dragging');dragged=null;saveOrder();});
    DOC.addEventListener('dragover',e=>{const grid=$('#v67DashboardGrid');if(!dragged||!grid?.classList.contains('reordering'))return;e.preventDefault();const after=[...grid.querySelectorAll('.v67-widget:not(.is-dragging)')].find(el=>e.clientY < el.getBoundingClientRect().top + el.offsetHeight/2);if(after)grid.insertBefore(dragged,after);else grid.appendChild(dragged);});
  }

  function bind(){
    if(DOC.body.dataset.v67DashboardBound==='1') return;
    DOC.body.dataset.v67DashboardBound='1';
    ensureModal();
    setupDrag();
    DOC.addEventListener('click',e=>{
      const goBtn=e.target.closest('[data-v67-go]');
      if(goBtn){e.preventDefault();const view=goBtn.dataset.v67Go;if(view==='novo-lead')openNewLead();else go(view);return;}
      const lead=e.target.closest('[data-v67-lead]');
      if(lead){e.preventDefault();openLead(lead.dataset.v67Lead);return;}
      if(e.target.closest('#v67StartRoutine')){e.preventDefault();const first=$('#v67DashboardGrid [data-v67-lead], #v67DashboardGrid [data-v67-go]');if(first)first.click();return;}
      if(e.target.closest('#v67NewLeadBtn')){e.preventDefault();openNewLead();return;}
      if(e.target.closest('#v67ChooseWidgets')){e.preventDefault();openModal();return;}
      if(e.target.closest('#v67MoveWidgets')){e.preventDefault();setMove(!$('#v67DashboardGrid')?.classList.contains('reordering'));return;}
      if(e.target.closest('#v67ShowAllWidgets')){e.preventDefault();writeJSON(PREF_KEY,Object.fromEntries(Object.keys(WIDGET_NAMES).map(k=>[k,true])));applyPrefs();return;}
      if(e.target.closest('#v67Refresh')){e.preventDefault();render();toast('Painel atualizado','success');return;}
      if(e.target.closest('#v67WidgetClose')){e.preventDefault();closeModal();return;}
      if(e.target.closest('#v67WidgetSave')){e.preventDefault();saveModal();return;}
      if(e.target.closest('#v67WidgetAll')){e.preventDefault();writeJSON(PREF_KEY,Object.fromEntries(Object.keys(WIDGET_NAMES).map(k=>[k,true])));openModal();applyPrefs();return;}
      if(e.target.closest('#v67WidgetClean')){e.preventDefault();writeJSON(PREF_KEY,{summary:true,routine:true,agenda:true,overdue:true,risk:false,hot:false,shortcuts:true,note:false});closeModal();applyPrefs();return;}
      const hide=e.target.closest('[data-v67-hide]');
      if(hide){e.preventDefault();const p=prefs();p[hide.dataset.v67Hide]=false;writeJSON(PREF_KEY,p);applyPrefs();return;}
      const color=e.target.closest('[data-v67-color]');
      if(color){e.preventDefault();cycleColor(color.dataset.v67Color);return;}
      if(e.target.closest('#saveNoteBtn')){e.preventDefault();localStorage.setItem(NOTE_KEY,$('#quickNote')?.value||'');toast('Nota salva','success');return;}
      const modal=e.target.closest('#v67WidgetModal');if(modal&&e.target===modal){closeModal();return;}
    },false);
  }

  function patch(){
    try{
      const old=window.renderAll || (typeof renderAll === 'function' ? renderAll : null);
      if(typeof old === 'function' && !old.__v67Dash){
        const wrapped=function(){const r=old.apply(this,arguments);if(isActive())setTimeout(render,30);return r;};
        wrapped.__v67Dash=true;window.renderAll=wrapped;try{renderAll=wrapped;}catch(e){}
      }
    }catch(e){}
    try{
      const prev=window.setView || (typeof setView === 'function' ? setView : null);
      if(typeof prev === 'function' && !prev.__v67Dash){
        const wrapped=function(view){const r=prev.apply(this,arguments);if(view==='inicio')setTimeout(render,40);return r;};
        wrapped.__v67Dash=true;window.setView=wrapped;try{setView=wrapped;}catch(e){}
      }
    }catch(e){}
  }
  function isActive(){return !!$('#inicio.active') || DOC.body?.dataset.currentView==='inicio';}
  function init(){
    bind();
    patch();
    window.CRMV67Dashboard={render,shell,applyPrefs};
    window.renderDashboardAcoesDiaV67=render;
    if(isActive()){shell();render();setTimeout(render,250);}
  }
  DOC.addEventListener('crm:viewchange',e=>{if(e.detail?.view==='inicio')setTimeout(()=>{shell();render();},40)});
  DOC.addEventListener('crm:datachange',()=>{if(isActive())setTimeout(render,100)});
  if(DOC.readyState==='loading') DOC.addEventListener('DOMContentLoaded',init); else init();
})();
