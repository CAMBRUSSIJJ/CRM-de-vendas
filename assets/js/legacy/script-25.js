/* Script original 25 */
/* CRM V41 — limpeza estrutural: abas estáveis + automações, agenda e ligações profissionais */
(function(){
  'use strict';
  if(window.__crmV41CleanFix) return;
  window.__crmV41CleanFix = true;

  const DOC = document;
  const $ = (sel, root=DOC) => root.querySelector(sel);
  const $$ = (sel, root=DOC) => Array.from(root.querySelectorAll(sel));
  const KEYS = {
    leads: 'outbounder_leads_v5',
    call: 'crm_v41_call_config',
    autos: 'crm_v41_automations',
    agendas: 'crm_v41_agendas',
    events: 'crm_v41_events',
    agendaView: 'crm_v41_agenda_view',
    autoArea: 'crm_v41_auto_area'
  };
  const OPEN_STAGES = ['Lead','Contato','Proposta'];
  const FU_STAGES = ['Primeiro contato','Segundo contato','Terceiro contato','Nutrição','Proposta enviada','Negociação','Reativação','Concluído'];
  const AREAS = ['Todas','Leads','Pipeline','Follow-ups','Ligações','Metas','Agenda','Playbooks','Clientes'];
  const viewLabels = {
    inicio:['Início','Painel principal e comandos rápidos'],
    leads:['Leads','Base comercial e oportunidades'],
    pipeline:['Pipeline','Kanban operacional de oportunidades'],
    clientes:['Clientes','Carteira ativa e pós-venda'],
    playbooks:['Playbooks','Scripts, materiais e processos'],
    objecoes:['Objeções','Respostas comerciais e padrões de perda'],
    perdas:['Perdas','Motivos de perda e reativação'],
    dashboard:['Dashboard','Indicadores comerciais consolidados'],
    cadencias:['Follow-ups','Fila, etapas e próximas ações'],
    automacoes:['Automações','Central para automatizar rotinas do CRM'],
    agenda:['Agenda','Múltiplas agendas, calendário, Kanban e banco de dados'],
    ligacoes:['Ligações','Fila de chamadas, discador e registro no histórico'],
    metricas:['Métricas','Relatórios e análise comercial'],
    importar:['Importar','Entrada e limpeza de dados'],
    'novo-lead':['Novo lead','Cadastro de oportunidade']
  };

  function esc(v){return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function brl(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);}
  function today(){return new Date().toISOString().slice(0,10);}
  function addDays(n){const d=new Date();d.setDate(d.getDate()+Number(n||0));return d.toISOString().slice(0,10);}
  function dateBR(v){if(!v)return 'Sem data';try{return new Date(String(v).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR');}catch(e){return String(v);}}
  function daysDiff(v){if(!v)return 9999;const d=new Date(String(v).slice(0,10)+'T12:00:00');const t=new Date();t.setHours(0,0,0,0);d.setHours(0,0,0,0);return Math.round((d-t)/86400000);}
  function read(key, fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}catch(e){return fallback;}}
  function write(key, val){try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}}
  function notify(msg,type='success'){
    try{ if(typeof showToast==='function') return showToast(msg,type); }catch(e){}
    try{ if(typeof toast==='function') return toast(msg,type); }catch(e){}
    const t=$('#toast');
    if(t){ t.textContent=msg; t.className='toast show '+type; setTimeout(()=>t.classList.remove('show'),2400); }
  }
  function leadArray(){
    try{ if(typeof leads !== 'undefined' && Array.isArray(leads)) return leads; }catch(e){}
    try{ if(Array.isArray(window.leads)) return window.leads; }catch(e){}
    const l=read(KEYS.leads,[]); return Array.isArray(l)?l:[];
  }
  function saveLeadArray(list){
    try{ if(typeof leads !== 'undefined' && Array.isArray(leads)){ leads.splice(0,leads.length,...list); if(typeof saveLeads==='function') saveLeads(); else write(KEYS.leads,leads); return; } }catch(e){}
    write(KEYS.leads,list);
  }
  function ensureLeadIds(){const arr=leadArray();let changed=false;arr.forEach((l,i)=>{if(!l.id){l.id='lead_'+Date.now().toString(36)+'_'+i+'_'+Math.random().toString(36).slice(2,7);changed=true;} if(!l.followupEtapa){l.followupEtapa=stageFromLead(l);changed=true;}});if(changed)saveLeadArray(arr);return arr;}
  function stageFromLead(l){if(l.followupEtapa)return l.followupEtapa;if(l.etapa==='Proposta')return 'Proposta enviada';if(l.etapa==='Contato')return 'Segundo contato';if(l.etapa==='Perdido')return 'Reativação';return 'Primeiro contato';}
  function findLead(id){return ensureLeadIds().find(l=>String(l.id||l.nome)===String(id));}
  function saveLead(lead){const arr=ensureLeadIds();const idx=arr.findIndex(l=>String(l.id||l.nome)===String(lead.id||lead.nome));if(idx>=0){arr[idx]=lead;saveLeadArray(arr);} }
  function isOpenLead(l){return !['Fechado','Perdido'].includes(String(l.etapa||''));}
  function scoreLead(l){let s=40;if(l.prioridade==='Alta')s+=25;if(l.etapa==='Proposta')s+=18;if(l.followup){const d=daysDiff(l.followup);if(d<0)s+=22;else if(d===0)s+=16;else if(d<=2)s+=8;}if(Number(l.valor)>10000)s+=8;return Math.max(0,Math.min(100,s));}
  function phoneDigits(v){return String(v||'').replace(/\D/g,'');}
  function fullPhone(v){let d=phoneDigits(v);if(!d)return '';if(d.startsWith('55')&&d.length>=12)return '+'+d;return '+55'+d;}
  function callConfig(){return Object.assign({protocol:'tel',countOnOpen:true,autoFollow:true},read(KEYS.call,{}));}
  function saveCallConfig(cfg){write(KEYS.call,Object.assign(callConfig(),cfg));}
  function dialURL(phone){const cfg=callConfig();const full=fullPhone(phone);if(!full)return '';const plain=full.replace(/\D/g,'');if(cfg.protocol==='whatsapp')return 'https://wa.me/'+plain;if(cfg.protocol==='callto')return 'callto:'+full;if(cfg.protocol==='sip')return 'sip:'+full;return 'tel:'+full;}
  function addActivity(lead,type,text){lead.atividades=Array.isArray(lead.atividades)?lead.atividades:[];lead.atividades.unshift({tipo:type,data:new Date().toISOString(),texto:text||type,autor:'CRM'});lead.ultimaAtualizacao=today();}
  function callsToday(){let n=0;ensureLeadIds().forEach(l=>(Array.isArray(l.atividades)?l.atividades:[]).forEach(a=>{if(String(a.tipo)==='Ligação'&&String(a.data||'').slice(0,10)===today()) n++;}));return n;}
  function lastCall(lead){const a=(Array.isArray(lead.atividades)?lead.atividades:[]).find(x=>String(x.tipo)==='Ligação');return a?dateBR(String(a.data).slice(0,10)):'Nunca';}
  function openLeadDetail(id){try{ if(typeof openDetail==='function') return openDetail(id); }catch(e){} const l=findLead(id); if(l) notify('Lead selecionado: '+(l.nome||'Sem nome'),'success'); }

  function cleanupDuplicateViews(){
    const seen=new Set();
    $$('section.view[id], div.view[id]').forEach(el=>{
      if(seen.has(el.id)){ el.remove(); return; }
      seen.add(el.id);
    });
  }
  function ensureNavButton(id,label){
    if(!$('.sidebar-nav [data-view="'+id+'"]')){
      const ref=$('.sidebar-nav [data-view="agenda"]') || $('.sidebar-nav [data-view="dashboard"]');
      const b=DOC.createElement('button'); b.className='nav-item'; b.dataset.view=id; b.innerHTML='<span>'+esc(label)+'</span>';
      ref && ref.parentNode ? ref.parentNode.insertBefore(b,ref.nextSibling) : $('.sidebar-nav')?.appendChild(b);
    }
    if(!$('.rail [data-view="'+id+'"]')){
      const ref=$('.rail [data-view="agenda"]') || $('.rail [data-view="dashboard"]');
      const b=DOC.createElement('button'); b.className='rail-btn'; b.dataset.view=id; b.title=label; b.textContent=label.charAt(0);
      ref && ref.parentNode ? ref.parentNode.insertBefore(b,ref.nextSibling) : $('.rail')?.appendChild(b);
    }
    if(!$('.topbar-tabs [data-view="'+id+'"]')){
      const b=DOC.createElement('button'); b.className='tab'; b.dataset.view=id; b.textContent=label;
      $('.topbar-tabs')?.appendChild(b);
    }
  }
  function ensureSection(id){
    let sec=DOC.getElementById(id);
    if(!sec){ sec=DOC.createElement('section'); sec.id=id; sec.className='view grid-view'; $('main,.main')?.appendChild(sec); }
    sec.classList.add('view','grid-view');
    return sec;
  }
  function cleanVisibility(){
    cleanupDuplicateViews();
    const active=$('.view.active');
    const target=active?.id || 'inicio';
    $$('.view[id]').forEach(v=>{ if(v.id!==target){v.classList.remove('active');v.style.display='none';} });
    const cur=DOC.getElementById(target); if(cur){cur.classList.add('active');cur.style.display='';}
  }
  function setViewV41(id){
    cleanupDuplicateViews();
    id = id || 'inicio';
    const el=DOC.getElementById(id);
    if(!el){ notify('Aba não encontrada: '+id,'warn'); return false; }
    $$('.view[id]').forEach(v=>{v.classList.toggle('active',v.id===id);v.style.display=v.id===id?'':'none';});
    $$('[data-view],[data-go]').forEach(b=>{const v=b.dataset.view||b.dataset.go;b.classList.toggle('active',v===id);});
    const t=viewLabels[id]; if(t){ const title=$('.topbar-title'); const sub=$('.topbar-sub'); if(title) title.textContent=t[0]; if(sub) sub.textContent=t[1]; }
    renderForView(id);
    DOC.dispatchEvent(new CustomEvent('crm:v41:view',{detail:{view:id}}));
    return true;
  }
  window.setView = setViewV41;

  function shell(title,sub,actions=''){
    return '<div class="section-header v41-head"><div><div class="section-title-text">'+esc(title)+'</div><div class="section-sub">'+esc(sub)+'</div></div><div class="v41-actions">'+actions+'</div></div>';
  }
  function kpi(value,label,hint=''){
    return '<div class="v41-kpi"><strong>'+esc(value)+'</strong><span>'+esc(label)+'</span>'+(hint?'<small>'+esc(hint)+'</small>':'')+'</div>';
  }
  function pill(text,cls='') {return '<span class="v41-pill '+cls+'">'+esc(text)+'</span>';}
  function scoreBar(v){return '<div class="v41-score"><span style="width:'+Math.max(4,Math.min(100,Number(v)||0))+'%"></span></div>';}

  function defaultAutomations(){return [
    {id:'auto_follow_vencido',active:true,area:'Follow-ups',name:'Follow-up vencido vira prioridade',trigger:'Quando follow-up passar da data',condition:'Lead aberto e sem atividade recente',action:'Marcar como prioridade alta e exibir na fila',target:'Follow-ups',delay:'Imediato'},
    {id:'auto_call_meta',active:true,area:'Ligações',name:'Ligação alimenta metas',trigger:'Ao abrir discador ou registrar resultado',condition:'Lead com telefone válido',action:'Registrar atividade e atualizar contador de metas',target:'Metas',delay:'Imediato'},
    {id:'auto_pipeline_proposta',active:true,area:'Pipeline',name:'Proposta gera próximo passo',trigger:'Lead entra em Proposta',condition:'Sem follow-up preenchido',action:'Criar follow-up de negociação',target:'Agenda',delay:'1 dia'},
    {id:'auto_agenda_share',active:false,area:'Agenda',name:'Reunião compartilhada',trigger:'Evento criado como reunião',condition:'Com responsável preenchido',action:'Preparar agendamento compartilhado',target:'Agenda',delay:'Imediato'}
  ];}
  function getAutomations(){const a=read(KEYS.autos,null);return Array.isArray(a)?a:defaultAutomations();}
  function setAutomations(a){write(KEYS.autos,a);}
  function automationTemplates(){return [
    ['Leads','Lead sem telefone','Quando um lead for cadastrado sem telefone','Criar pendência de enriquecimento','Leads'],
    ['Pipeline','Negócio parado','Quando ficar 7 dias sem avanço','Criar alerta e tarefa de retomada','Pipeline'],
    ['Follow-ups','Sequência comercial','Quando etapa de follow-up mudar','Criar próximo passo automático','Follow-ups'],
    ['Ligações','Discador + metas','Quando clicar em ligar','Registrar atividade e avançar meta','Metas'],
    ['Metas','Ritmo diário','Quando meta do dia estiver abaixo do ritmo','Gerar rotina comercial','Metas'],
    ['Agenda','Evento recorrente','Quando criar compromisso recorrente','Criar série no calendário escolhido','Agenda'],
    ['Playbooks','Script por objeção','Quando registrar objeção','Sugerir script do playbook','Playbooks'],
    ['Clientes','Pós-venda','Quando fechar cliente','Criar checklist de onboarding','Clientes']
  ];}
  function renderAutomacoes(){
    ensureNavButton('automacoes','Automações');
    const sec=ensureSection('automacoes');
    sec.dataset.v41='1';
    const list=getAutomations();
    const area=localStorage.getItem(KEYS.autoArea)||'Todas';
    const filtered=area==='Todas'?list:list.filter(a=>a.area===area);
    const active=list.filter(a=>a.active).length;
    sec.innerHTML=shell('Automações','Central para automatizar tudo que rege suas abas: leads, pipeline, follow-ups, ligações, metas, agenda, playbooks e clientes.','<button class="btn btn-primary" id="v41AutoNew">+ Nova automação</button><button class="btn" id="v41AutoSim">Simular impacto</button>')+
      '<div class="v41-shell">'+
      '<div class="v41-kpis">'+kpi(list.length,'Regras criadas')+kpi(active,'Ativas')+kpi(AREAS.length-1,'Áreas cobertas')+kpi('100%','Local e configurável','sem depender de backend')+'</div>'+
      '<div class="v41-card v41-builder"><div class="v41-card-head"><div><b>Construtor de automação</b><small>Monte a regra escolhendo área, gatilho, condição, ação e destino.</small></div></div><div class="v41-form-grid">'+
      '<label>Área<select id="v41AutoAreaInput">'+AREAS.filter(x=>x!=='Todas').map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label>'+
      '<label>Nome<input id="v41AutoName" placeholder="Ex: Follow-up vencido vira prioridade"></label>'+
      '<label>Gatilho<select id="v41AutoTrigger"><option>Novo lead criado</option><option>Lead muda de etapa</option><option>Follow-up vence</option><option>Clique no discador</option><option>Meta abaixo do ritmo</option><option>Evento criado</option><option>Objeção registrada</option></select></label>'+
      '<label>Condição<input id="v41AutoCondition" placeholder="Ex: prioridade alta, sem atividade em 3 dias"></label>'+
      '<label>Ação<select id="v41AutoAction"><option>Criar tarefa</option><option>Alterar prioridade</option><option>Registrar atividade</option><option>Atualizar meta</option><option>Criar evento na agenda</option><option>Mover etapa</option><option>Sugerir playbook</option></select></label>'+
      '<label>Destino<select id="v41AutoTarget">'+AREAS.filter(x=>x!=='Todas').map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label>'+
      '<label>Prazo<select id="v41AutoDelay"><option>Imediato</option><option>1 hora</option><option>1 dia</option><option>3 dias</option><option>7 dias</option></select></label>'+
      '<div class="v41-form-actions"><button class="btn btn-primary" id="v41AutoSave">Criar automação</button><button class="btn" id="v41AutoReset">Limpar</button></div></div></div>'+
      '<div class="v41-grid-2"><div class="v41-card"><div class="v41-card-head"><div><b>Áreas automatizáveis</b><small>Filtre e controle regras por aba.</small></div></div><div class="v41-chips">'+AREAS.map(x=>'<button class="v41-chip '+(x===area?'active':'')+'" data-v41-auto-area="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div><div class="v41-auto-list">'+(filtered.map(autoCard).join('')||'<div class="v41-empty">Nenhuma automação nesta área.</div>')+'</div></div>'+
      '<div class="v41-card"><div class="v41-card-head"><div><b>Modelos prontos</b><small>Use um modelo e ajuste depois.</small></div></div><div class="v41-template-list">'+automationTemplates().map((t,i)=>'<button class="v41-template" data-v41-template="'+i+'"><b>'+esc(t[1])+'</b><span>'+esc(t[0])+' · '+esc(t[3])+'</span></button>').join('')+'</div></div></div>'+
      '</div>';
  }
  function autoCard(a){return '<div class="v41-auto-card '+(a.active?'':'off')+'" data-auto-id="'+esc(a.id)+'"><div><b>'+esc(a.name)+'</b><p>'+esc(a.trigger)+' · '+esc(a.condition||'Sem condição')+'</p><div>'+pill(a.area,'blue')+pill(a.action,'green')+pill(a.delay||'Imediato','gray')+'</div></div><div class="v41-auto-actions"><button class="btn btn-xs" data-v41-auto-toggle="'+esc(a.id)+'">'+(a.active?'Pausar':'Ativar')+'</button><button class="btn btn-xs" data-v41-auto-dup="'+esc(a.id)+'">Duplicar</button><button class="btn btn-xs btn-danger" data-v41-auto-del="'+esc(a.id)+'">Excluir</button></div></div>';}

  function defaultAgendas(){return [
    {id:'comercial',name:'Comercial',color:'blue',active:true,shared:true},
    {id:'followups',name:'Follow-ups',color:'amber',active:true,shared:false},
    {id:'pessoal',name:'Pessoal',color:'green',active:true,shared:false},
    {id:'time',name:'Time compartilhado',color:'purple',active:true,shared:true}
  ];}
  function getAgendas(){const a=read(KEYS.agendas,null);return Array.isArray(a)?a:defaultAgendas();}
  function setAgendas(a){write(KEYS.agendas,a);}
  function getEvents(){const e=read(KEYS.events,null);return Array.isArray(e)?e:[];}
  function setEvents(e){write(KEYS.events,e);}
  function syncedFollowups(){return ensureLeadIds().filter(l=>isOpenLead(l)&&l.followup).map(l=>({id:'fu_'+l.id,title:'Follow-up: '+(l.nome||'Lead'),date:String(l.followup).slice(0,10),time:'09:00',agenda:'followups',type:'Follow-up',recurrence:'Não repete',shared:false,notes:l.followupEtapa||stageFromLead(l),leadId:l.id,fromLead:true}));}
  function activeAgendaIds(){return new Set(getAgendas().filter(a=>a.active).map(a=>a.id));}
  function allAgendaItems(){const active=activeAgendaIds();return getEvents().concat(syncedFollowups()).filter(e=>active.has(e.agenda));}
  function renderAgenda(){
    ensureNavButton('agenda','Agenda');
    const sec=ensureSection('agenda'); sec.dataset.v41='1';
    const ag=getAgendas(); const ev=allAgendaItems(); const view=localStorage.getItem(KEYS.agendaView)||'calendario';
    const todayN=ev.filter(e=>e.date===today()).length;
    const weekN=ev.filter(e=>daysDiff(e.date)>=0&&daysDiff(e.date)<=7).length;
    const sharedN=ev.filter(e=>e.shared).length;
    sec.innerHTML=shell('Agenda','Lida com múltiplas agendas, cores, eventos recorrentes, agendamento compartilhado, calendário, banco de dados e Kanban conforme seu fluxo.','<button class="btn btn-primary" id="v41AgendaAdd">+ Criar evento</button><button class="btn" id="v41AgendaSync">Sincronizar follow-ups</button>')+
      '<div class="v41-shell">'+
      '<div class="v41-kpis">'+kpi(ag.length,'Agendas')+kpi(todayN,'Hoje')+kpi(weekN,'Próximos 7 dias')+kpi(sharedN,'Compartilhados')+'</div>'+
      '<div class="v41-grid-agenda"><aside class="v41-card"><div class="v41-card-head"><div><b>Camadas de agenda</b><small>Ative, oculte e organize trabalho e vida pessoal.</small></div></div><div class="v41-layer-list">'+ag.map(a=>'<label class="v41-layer"><input type="checkbox" data-v41-agenda-toggle="'+esc(a.id)+'" '+(a.active?'checked':'')+'><span class="v41-dot '+esc(a.color)+'"></span><b>'+esc(a.name)+'</b><small>'+(a.shared?'Compartilhada':'Privada')+'</small></label>').join('')+'</div><div class="v41-card-head compact"><div><b>Novo evento</b><small>Crie compromissos com recorrência.</small></div></div>'+eventForm(ag)+'</aside>'+
      '<main class="v41-card"><div class="v41-card-head"><div><b>Visualização da agenda</b><small>Alterna entre calendário, lista, Kanban, banco de dados e modelos.</small></div><div class="v41-tabs">'+['calendario','lista','kanban','banco','modelos'].map(v=>'<button class="v41-tab '+(view===v?'active':'')+'" data-v41-agenda-view="'+v+'">'+({calendario:'Calendário',lista:'Lista',kanban:'Kanban',banco:'Banco de dados',modelos:'Modelos'}[v])+'</button>').join('')+'</div></div><div id="v41AgendaContent">'+agendaContent(view,ev,ag)+'</div></main></div>'+
      '</div>';
  }
  function eventForm(ag){return '<div class="v41-form-mini"><label>Título<input id="v41EventTitle" placeholder="Ex: Reunião com lead"></label><label>Agenda<select id="v41EventAgenda">'+ag.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join('')+'</select></label><label>Data<input id="v41EventDate" type="date" value="'+today()+'"></label><label>Hora<input id="v41EventTime" type="time" value="09:00"></label><label>Tipo<select id="v41EventType"><option>Reunião</option><option>Ligação</option><option>Follow-up</option><option>Planejamento</option><option>Pessoal</option></select></label><label>Recorrência<select id="v41EventRec"><option>Não repete</option><option>Diário</option><option>Semanal</option><option>Mensal</option></select></label><label class="v41-check"><input id="v41EventShared" type="checkbox"> Compartilhado</label><button class="btn btn-primary" id="v41EventSave">Salvar evento</button></div>';}
  function agendaContent(view,events,agendas){if(view==='lista')return agendaList(events,agendas);if(view==='kanban')return agendaKanban(events);if(view==='banco')return agendaDatabase(events,agendas);if(view==='modelos')return agendaModels();return agendaCalendar(events,agendas);}
  function agendaName(id,ag){return (ag.find(a=>a.id===id)||{}).name||id;}
  function agendaCalendar(events,ag){let html='<div class="v41-calendar-mini">';for(let i=0;i<14;i++){const d=addDays(i);const items=events.filter(e=>e.date===d).sort((a,b)=>String(a.time).localeCompare(String(b.time)));html+='<div class="v41-day"><div class="v41-day-title">'+(i===0?'Hoje':dateBR(d))+'</div>'+(items.slice(0,5).map(e=>'<button class="v41-event '+esc(e.agenda)+'" data-v41-open-event="'+esc(e.id)+'"><b>'+esc(e.time||'--:--')+'</b> '+esc(e.title)+'<small>'+esc(agendaName(e.agenda,ag))+'</small></button>').join('')||'<p>Sem eventos</p>')+'</div>';}return html+'</div>';}
  function agendaList(events,ag){const arr=events.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));return '<div class="v41-table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Hora</th><th>Evento</th><th>Agenda</th><th>Recorrência</th><th>Compart.</th></tr></thead><tbody>'+(arr.map(e=>'<tr><td>'+dateBR(e.date)+'</td><td>'+esc(e.time||'--:--')+'</td><td>'+esc(e.title)+'</td><td>'+esc(agendaName(e.agenda,ag))+'</td><td>'+esc(e.recurrence||'Não repete')+'</td><td>'+(e.shared?'Sim':'Não')+'</td></tr>').join('')||'<tr><td colspan="6">Sem eventos.</td></tr>')+'</tbody></table></div>';}
  function agendaKanban(events){const groups=[['hoje','Hoje',e=>e.date===today()],['semana','Esta semana',e=>daysDiff(e.date)>0&&daysDiff(e.date)<=7],['futuro','Depois',e=>daysDiff(e.date)>7],['semdata','Sem data',e=>!e.date]];return '<div class="v41-kanban">'+groups.map(g=>'<div class="v41-col"><div class="v41-col-head"><b>'+g[1]+'</b><span>'+events.filter(g[2]).length+'</span></div>'+events.filter(g[2]).map(e=>'<div class="v41-kan-card"><b>'+esc(e.title)+'</b><small>'+dateBR(e.date)+' · '+esc(e.time||'--:--')+'</small>'+pill(e.type||'Evento','blue')+'</div>').join('')+'</div>').join('')+'</div>';}
  function agendaDatabase(events,ag){return '<div class="v41-db-head">Banco de dados com campos editáveis: agenda, data, hora, tipo, recorrência, compartilhamento e observações.</div>'+agendaList(events,ag);}
  function agendaModels(){return '<div class="v41-model-grid">'+['Rotina diária comercial','Reunião recorrente semanal','Bloco de prospecção','Follow-up pós-proposta','Planejamento pessoal','Agenda compartilhada do time'].map((m,i)=>'<button class="v41-model" data-v41-agenda-model="'+i+'"><b>'+esc(m)+'</b><span>Aplicar modelo</span></button>').join('')+'</div>';}

  let activeCallId=null;
  function callQueue(){const q=String($('#v41CallSearch')?.value||'').toLowerCase();const filter=$('#v41CallFilter')?.value||'';let arr=ensureLeadIds().filter(isOpenLead);if(q)arr=arr.filter(l=>[l.nome,l.segmento,l.responsavel,l.telefone,l.email].some(x=>String(x||'').toLowerCase().includes(q)));if(filter==='hoje')arr=arr.filter(l=>daysDiff(l.followup)<=0);if(filter==='alta')arr=arr.filter(l=>l.prioridade==='Alta');if(filter==='semfone')arr=arr.filter(l=>!phoneDigits(l.telefone));if(filter==='proposta')arr=arr.filter(l=>l.etapa==='Proposta');arr.sort((a,b)=>scoreLead(b)-scoreLead(a));return arr;}
  function renderLigacoes(){
    ensureNavButton('ligacoes','Ligações');
    const sec=ensureSection('ligacoes'); sec.dataset.v41='1'; sec.classList.add('call-shell');
    const leadsAll=ensureLeadIds().filter(isOpenLead); const queue=callQueue(); const withPhone=leadsAll.filter(l=>phoneDigits(l.telefone)).length; const cfg=callConfig();
    if(!activeCallId && queue[0]) activeCallId=queue[0].id;
    sec.innerHTML=shell('Ligações','Fila profissional conectada aos leads, discador do computador, registro no histórico e avanço seguro para metas.','<button class="btn" id="v41CallRefresh">Atualizar fila</button><button class="btn btn-primary" data-view="novo-lead">+ Novo lead</button>')+
      '<div class="v41-shell">'+
      '<div class="v41-call-hero"><div><b>Discador configurável</b><p>O botão de ligar abre o aplicativo padrão do seu computador. Escolha tel, callto, sip ou WhatsApp. Leads sem telefone aparecem para correção, em vez de sumirem da fila.</p></div><div class="v41-call-config"><label>Protocolo<select id="v41CallProtocol"><option value="tel" '+(cfg.protocol==='tel'?'selected':'')+'>tel:</option><option value="callto" '+(cfg.protocol==='callto'?'selected':'')+'>callto:</option><option value="sip" '+(cfg.protocol==='sip'?'selected':'')+'>sip:</option><option value="whatsapp" '+(cfg.protocol==='whatsapp'?'selected':'')+'>WhatsApp Web</option></select></label><label class="v41-check"><input type="checkbox" id="v41CallCountOpen" '+(cfg.countOnOpen?'checked':'')+'> contar ao abrir discador</label></div></div>'+
      '<div class="v41-kpis">'+kpi(leadsAll.length,'Leads abertos')+kpi(withPhone,'Com telefone')+kpi(leadsAll.length-withPhone,'Sem telefone')+kpi(callsToday(),'Ligações hoje')+'</div>'+
      '<div class="v41-call-grid"><div class="v41-card"><div class="v41-card-head"><div><b>Fila de ligações</b><small>Priorizada por follow-up, etapa, prioridade e valor.</small></div></div><div class="v41-toolbar"><input id="v41CallSearch" placeholder="Buscar lead, segmento ou responsável"><select id="v41CallFilter"><option value="">Todos</option><option value="hoje">Vencidos/hoje</option><option value="alta">Alta prioridade</option><option value="proposta">Propostas</option><option value="semfone">Sem telefone</option></select></div><div id="v41CallQueue" class="v41-call-list">'+(queue.map(callCard).join('')||'<div class="v41-empty">Nenhum lead encontrado para esta fila.</div>')+'</div></div>'+
      '<aside class="v41-card"><div class="v41-card-head"><div><b>Discador e resultado</b><small>Escolha um lead na fila para agir.</small></div></div><div id="v41DialPanel">'+dialPanel(activeCallId)+'</div></aside></div>'+
      '</div>';
  }
  function callCard(l){const d=daysDiff(l.followup);const overdue=d<0;const hasPhone=!!phoneDigits(l.telefone);return '<div class="v41-call-card '+(String(l.id)===String(activeCallId)?'active':'')+'" data-v41-call-lead="'+esc(l.id)+'"><div class="v41-avatar">'+esc((l.nome||'?').slice(0,2).toUpperCase())+'</div><div class="v41-call-body"><b>'+esc(l.nome||'Lead sem nome')+'</b><p>'+esc(l.segmento||'Sem segmento')+' · '+esc(l.responsavel||'Sem responsável')+'</p><div>'+pill(l.etapa||'Lead','blue')+pill(l.followupEtapa||stageFromLead(l),'green')+pill(hasPhone?'Telefone ok':'Sem telefone',hasPhone?'':'red')+(l.followup?pill((overdue?'Vencido ':'')+dateBR(l.followup),overdue?'red':'gray'):'')+'</div></div><div class="v41-call-score"><b>'+scoreLead(l)+'</b>'+scoreBar(scoreLead(l))+'</div></div>';}
  function dialPanel(id){const l=id?findLead(id):null;if(!l)return '<div class="v41-empty">Selecione um lead para abrir o discador.</div>';const href=dialURL(l.telefone);return '<div class="v41-dial-lead"><b>'+esc(l.nome||'Lead')+'</b><p>'+esc(l.telefone||'Telefone não informado')+'</p><div>'+pill(l.etapa||'Lead','blue')+pill(l.followupEtapa||stageFromLead(l),'green')+'</div></div><label class="v41-field-label">Etapa do follow-up<select id="v41DialFollowStage" data-lead="'+esc(l.id)+'">'+FU_STAGES.map(s=>'<option '+(s===(l.followupEtapa||stageFromLead(l))?'selected':'')+'>'+esc(s)+'</option>').join('')+'</select></label><div class="v41-dial-actions">'+(href?'<button class="btn btn-primary" data-v41-dial="'+esc(l.id)+'">Abrir discador</button>':'<button class="btn btn-primary" disabled>Sem telefone</button>')+'<button class="btn" data-v41-open-lead="'+esc(l.id)+'">Abrir lead</button></div><div class="v41-result-grid"><button class="btn" data-v41-call-result="Atendeu">Atendeu</button><button class="btn" data-v41-call-result="Não atendeu">Não atendeu</button><button class="btn" data-v41-call-result="WhatsApp enviado">WhatsApp</button><button class="btn" data-v41-call-result="Reunião marcada">Reunião</button><button class="btn" data-v41-call-result="Sem interesse">Sem interesse</button><button class="btn" data-v41-call-result="Retornar depois">Retornar</button></div><div class="v41-script"><b>Script rápido</b><p>Oi, aqui é do time comercial. Vi que vocês podem estar avaliando melhorias no processo. Faz sentido eu te fazer duas perguntas rápidas para entender se existe oportunidade real?</p></div><small class="v41-muted">Última ligação: '+lastCall(l)+'</small>';}

  function renderForView(id){
    if(id==='automacoes') renderAutomacoes();
    if(id==='agenda') renderAgenda();
    if(id==='ligacoes') renderLigacoes();
  }

  function bindActions(){
    DOC.addEventListener('click',function(e){
      const nav=e.target.closest('[data-view],[data-go]');
      if(nav && !e.target.closest('[data-v41-template],[data-v41-auto-area],[data-v41-agenda-view],[data-v41-call-lead]')){ const v=nav.dataset.view||nav.dataset.go; if(v){ e.preventDefault(); e.stopPropagation(); setViewV41(v); return; } }
      const area=e.target.closest('[data-v41-auto-area]'); if(area){localStorage.setItem(KEYS.autoArea,area.dataset.v41AutoArea);renderAutomacoes();return;}
      const tmpl=e.target.closest('[data-v41-template]'); if(tmpl){const t=automationTemplates()[Number(tmpl.dataset.v41Template)];const arr=getAutomations();arr.push({id:'auto_'+Date.now(),active:true,area:t[0],name:t[1],trigger:t[2],condition:'Configurável',action:t[3],target:t[4],delay:'Imediato'});setAutomations(arr);renderAutomacoes();notify('Modelo adicionado às automações.');return;}
      const tog=e.target.closest('[data-v41-auto-toggle]'); if(tog){const arr=getAutomations();const a=arr.find(x=>String(x.id)===String(tog.dataset.v41AutoToggle));if(a)a.active=!a.active;setAutomations(arr);renderAutomacoes();return;}
      const dup=e.target.closest('[data-v41-auto-dup]'); if(dup){const arr=getAutomations();const a=arr.find(x=>String(x.id)===String(dup.dataset.v41AutoDup));if(a)arr.push(Object.assign({},a,{id:'auto_'+Date.now(),name:a.name+' cópia'}));setAutomations(arr);renderAutomacoes();return;}
      const del=e.target.closest('[data-v41-auto-del]'); if(del){setAutomations(getAutomations().filter(x=>String(x.id)!==String(del.dataset.v41AutoDel)));renderAutomacoes();return;}
      if(e.target.closest('#v41AutoSave')){const arr=getAutomations();arr.push({id:'auto_'+Date.now(),active:true,area:$('#v41AutoAreaInput')?.value||'Leads',name:$('#v41AutoName')?.value||'Nova automação',trigger:$('#v41AutoTrigger')?.value||'Gatilho',condition:$('#v41AutoCondition')?.value||'Sem condição',action:$('#v41AutoAction')?.value||'Criar tarefa',target:$('#v41AutoTarget')?.value||'Leads',delay:$('#v41AutoDelay')?.value||'Imediato'});setAutomations(arr);renderAutomacoes();notify('Automação criada.');return;}
      if(e.target.closest('#v41AutoSim')){const open=ensureLeadIds().filter(isOpenLead).length;const due=ensureLeadIds().filter(l=>isOpenLead(l)&&l.followup&&daysDiff(l.followup)<=0).length;notify('Simulação: '+open+' leads abertos e '+due+' follow-ups afetados.','success');return;}
      const av=e.target.closest('[data-v41-agenda-view]'); if(av){localStorage.setItem(KEYS.agendaView,av.dataset.v41AgendaView);renderAgenda();return;}
      if(e.target.closest('#v41EventSave')){const events=getEvents();events.push({id:'ev_'+Date.now(),title:$('#v41EventTitle')?.value||'Novo evento',agenda:$('#v41EventAgenda')?.value||'comercial',date:$('#v41EventDate')?.value||today(),time:$('#v41EventTime')?.value||'09:00',type:$('#v41EventType')?.value||'Reunião',recurrence:$('#v41EventRec')?.value||'Não repete',shared:!!$('#v41EventShared')?.checked,notes:''});setEvents(events);renderAgenda();notify('Evento criado na agenda.');return;}
      if(e.target.closest('#v41AgendaSync')){renderAgenda();notify('Follow-ups sincronizados com a agenda.');return;}
      const model=e.target.closest('[data-v41-agenda-model]'); if(model){const names=['Rotina diária comercial','Reunião recorrente semanal','Bloco de prospecção','Follow-up pós-proposta','Planejamento pessoal','Agenda compartilhada do time'];const events=getEvents();events.push({id:'ev_'+Date.now(),title:names[Number(model.dataset.v41AgendaModel)]||'Modelo de agenda',agenda:Number(model.dataset.v41AgendaModel)===4?'pessoal':'comercial',date:addDays(1),time:'09:00',type:'Planejamento',recurrence:Number(model.dataset.v41AgendaModel)===1?'Semanal':'Não repete',shared:Number(model.dataset.v41AgendaModel)===5,notes:'Criado por modelo'});setEvents(events);renderAgenda();notify('Modelo aplicado.');return;}
      const c=e.target.closest('[data-v41-call-lead]'); if(c){activeCallId=c.dataset.v41CallLead;renderLigacoes();return;}
      const d=e.target.closest('[data-v41-dial]'); if(d){const l=findLead(d.dataset.v41Dial);if(!l)return;const url=dialURL(l.telefone);if(!url){notify('Este lead está sem telefone.','warn');return;}if(callConfig().countOnOpen){addActivity(l,'Ligação','Discador aberto');saveLead(l);}try{ if(url.startsWith('http')) window.open(url,'_blank','noopener'); else window.location.href=url; }catch(_){ window.location.href=url; } notify('Discador aberto para '+(l.nome||'lead')+'.','success');setTimeout(renderLigacoes,120);return;}
      const res=e.target.closest('[data-v41-call-result]'); if(res){const l=findLead(activeCallId);if(!l)return;addActivity(l,'Ligação',res.dataset.v41CallResult);if(callConfig().autoFollow!==false && res.dataset.v41CallResult==='Não atendeu'){l.followup=addDays(1);l.followupEtapa=l.followupEtapa||'Segundo contato';}saveLead(l);renderLigacoes();notify('Resultado registrado no histórico.');return;}
      const open=e.target.closest('[data-v41-open-lead]'); if(open){openLeadDetail(open.dataset.v41OpenLead);return;}
      if(e.target.closest('#v41CallRefresh')){renderLigacoes();notify('Fila atualizada.');return;}
    },true);
    DOC.addEventListener('change',function(e){
      if(e.target.matches('[data-v41-agenda-toggle]')){const arr=getAgendas();const a=arr.find(x=>x.id===e.target.dataset.v41AgendaToggle);if(a)a.active=e.target.checked;setAgendas(arr);renderAgenda();return;}
      if(e.target.matches('#v41CallProtocol')){saveCallConfig({protocol:e.target.value});renderLigacoes();return;}
      if(e.target.matches('#v41CallCountOpen')){saveCallConfig({countOnOpen:e.target.checked});return;}
      if(e.target.matches('#v41DialFollowStage')){const l=findLead(e.target.dataset.lead);if(l){l.followupEtapa=e.target.value;saveLead(l);renderLigacoes();notify('Etapa do follow-up atualizada.');}return;}
      if(e.target.matches('#v41CallFilter')){renderLigacoes();return;}
    },true);
    DOC.addEventListener('input',function(e){ if(e.target.matches('#v41CallSearch')) renderLigacoes(); },true);
  }

  function installCSS(){ if($('#crmV41CleanStyle')) return; const st=DOC.createElement('style'); st.id='crmV41CleanStyle'; st.textContent=`
    .view:not(.active){display:none!important}.view.active.grid-view{display:grid!important;gap:20px}.view.active:not(.grid-view){display:block!important}.v41-head{margin-bottom:0}.v41-actions{display:flex;gap:8px;flex-wrap:wrap}.v41-shell{display:grid;gap:18px}.v41-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.v41-kpi{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:17px 18px;box-shadow:var(--shadow-xs)}.v41-kpi strong{display:block;font-family:'Inter Tight','Inter',sans-serif;font-size:25px;line-height:1;font-weight:800;color:var(--text);letter-spacing:-.03em}.v41-kpi span{display:block;font-size:12px;color:var(--text-3);margin-top:6px;font-weight:600}.v41-kpi small{display:block;font-size:11px;color:var(--text-3);margin-top:5px}.v41-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-xs);overflow:hidden}.v41-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid var(--border)}.v41-card-head.compact{border-top:1px solid var(--border);margin-top:8px}.v41-card-head b{display:block;font-size:14px;color:var(--text);letter-spacing:-.01em}.v41-card-head small{display:block;color:var(--text-3);font-size:12px;margin-top:2px}.v41-grid-2{display:grid;grid-template-columns:1.25fr .75fr;gap:18px}.v41-grid-agenda{display:grid;grid-template-columns:330px 1fr;gap:18px}.v41-form-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:18px}.v41-form-grid label,.v41-form-mini label,.v41-field-label,.v41-call-config label{display:grid;gap:5px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3)}.v41-form-grid input,.v41-form-grid select,.v41-form-mini input,.v41-form-mini select,.v41-field-label select,.v41-toolbar input,.v41-toolbar select,.v41-call-config select{height:38px;border:1px solid var(--border);background:var(--surface-2);border-radius:10px;padding:0 11px;color:var(--text);font-size:13px;text-transform:none;letter-spacing:0;font-weight:500;outline:none}.v41-form-actions{display:flex;align-items:end;gap:8px}.v41-chips{display:flex;gap:7px;flex-wrap:wrap;padding:15px 18px;border-bottom:1px solid var(--border)}.v41-chip,.v41-tab{border:1px solid var(--border);background:var(--surface);border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;color:var(--text-3);cursor:pointer}.v41-chip.active,.v41-tab.active{background:var(--navy);border-color:var(--navy);color:#fff}.v41-auto-list,.v41-template-list,.v41-layer-list{display:grid;gap:9px;padding:15px 18px}.v41-auto-card{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--border);background:var(--surface-2);border-radius:13px;padding:13px 14px}.v41-auto-card.off{opacity:.58}.v41-auto-card b{font-size:13.5px;color:var(--text)}.v41-auto-card p{font-size:12px;color:var(--text-3);margin:3px 0 7px}.v41-auto-actions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.v41-template,.v41-model{display:block;width:100%;text-align:left;border:1px solid var(--border);background:var(--surface-2);border-radius:13px;padding:13px 14px;cursor:pointer;transition:var(--transition)}.v41-template:hover,.v41-model:hover{background:var(--surface);box-shadow:var(--shadow-sm);transform:translateY(-1px)}.v41-template b,.v41-model b{display:block;font-size:13px;color:var(--text)}.v41-template span,.v41-model span{display:block;font-size:12px;color:var(--text-3);margin-top:3px}.v41-pill{display:inline-flex;align-items:center;margin:2px 4px 2px 0;border-radius:999px;padding:4px 9px;font-size:11px;font-weight:800;background:var(--surface-3);color:var(--text-3)}.v41-pill.blue{background:#eff6ff;color:#1d4ed8}.v41-pill.green{background:#f0fdf4;color:#166534}.v41-pill.red{background:#fef2f2;color:#b91c1c}.v41-pill.gray{background:var(--surface-3);color:var(--text-3)}.v41-empty{padding:24px;text-align:center;color:var(--text-3);font-size:13px}.v41-form-mini{display:grid;gap:10px;padding:15px 18px}.v41-check{display:flex!important;grid-template-columns:auto 1fr!important;align-items:center;gap:8px!important;text-transform:none!important;letter-spacing:0!important;font-size:12px!important;font-weight:700!important;color:var(--text-2)!important}.v41-layer{display:grid;grid-template-columns:auto auto 1fr auto;align-items:center;gap:9px;padding:10px 11px;border:1px solid var(--border);border-radius:12px;background:var(--surface-2);font-size:12px}.v41-layer b{font-size:13px}.v41-layer small{font-size:11px;color:var(--text-3)}.v41-dot{width:11px;height:11px;border-radius:50%;background:#2563eb}.v41-dot.amber{background:#f59e0b}.v41-dot.green{background:#16a34a}.v41-dot.purple{background:#7c3aed}.v41-tabs{display:flex;gap:5px;flex-wrap:wrap}.v41-calendar-mini{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;padding:16px}.v41-day{min-height:138px;border:1px solid var(--border);background:var(--surface-2);border-radius:13px;padding:10px}.v41-day-title{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:8px}.v41-event{display:block;width:100%;border:none;text-align:left;margin-bottom:6px;border-radius:8px;padding:7px 8px;background:#eff6ff;color:#1e40af;cursor:pointer;font-size:11.5px}.v41-event small{display:block;opacity:.75;margin-top:2px}.v41-kanban{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:16px}.v41-col{background:var(--surface-2);border:1px solid var(--border);border-radius:14px;min-height:240px}.v41-col-head{display:flex;justify-content:space-between;align-items:center;padding:12px 13px;border-bottom:1px solid var(--border)}.v41-col-head b{font-size:12.5px}.v41-col-head span{font-size:11px;color:var(--text-3);font-weight:800}.v41-kan-card{background:var(--surface);border:1px solid var(--border);border-radius:11px;padding:11px 12px;margin:9px}.v41-kan-card b{display:block;font-size:13px}.v41-kan-card small{display:block;font-size:11.5px;color:var(--text-3);margin:3px 0 6px}.v41-table-wrap{padding:14px}.v41-db-head{padding:14px 16px;color:var(--text-3);font-size:13px;border-bottom:1px solid var(--border)}.v41-model-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:16px}.v41-call-hero{display:flex;justify-content:space-between;gap:18px;align-items:center;background:linear-gradient(135deg,var(--surface),var(--surface-2));border:1px solid var(--border);border-radius:16px;padding:18px}.v41-call-hero b{font-size:16px;color:var(--text)}.v41-call-hero p{font-size:13px;color:var(--text-3);margin-top:4px;max-width:75ch}.v41-call-config{display:flex;gap:12px;align-items:end;flex-wrap:wrap}.v41-call-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:18px}.v41-toolbar{display:flex;gap:8px;flex-wrap:wrap;padding:14px 18px;border-bottom:1px solid var(--border)}.v41-toolbar input{min-width:280px;flex:1}.v41-call-list{display:grid;gap:8px;padding:12px}.v41-call-card{display:grid;grid-template-columns:42px 1fr 86px;gap:12px;align-items:center;border:1px solid var(--border);background:var(--surface-2);border-radius:14px;padding:12px;cursor:pointer;transition:var(--transition)}.v41-call-card:hover,.v41-call-card.active{background:var(--surface);border-color:var(--blue);box-shadow:var(--shadow-sm)}.v41-avatar{width:42px;height:42px;border-radius:12px;background:var(--blue-light);color:var(--blue);font-weight:900;display:flex;align-items:center;justify-content:center}.v41-call-body b{font-size:13.5px;color:var(--text)}.v41-call-body p{font-size:12px;color:var(--text-3);margin:2px 0 5px}.v41-call-score{text-align:right}.v41-call-score b{font-size:17px;color:var(--text)}.v41-score{height:6px;background:var(--surface-3);border-radius:99px;overflow:hidden;margin-top:5px}.v41-score span{display:block;height:100%;background:var(--blue);border-radius:99px}.v41-dial-lead{padding:18px;border-bottom:1px solid var(--border)}.v41-dial-lead b{display:block;font-size:18px;color:var(--text)}.v41-dial-lead p{color:var(--text-3);font-size:13px;margin:4px 0 8px}.v41-field-label{padding:14px 18px}.v41-dial-actions,.v41-result-grid{display:flex;gap:8px;flex-wrap:wrap;padding:0 18px 14px}.v41-result-grid{display:grid;grid-template-columns:1fr 1fr}.v41-script{margin:0 18px 14px;padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--surface-2)}.v41-script b{display:block;font-size:12px;text-transform:uppercase;color:var(--text-3);letter-spacing:.06em;margin-bottom:6px}.v41-script p{font-size:13px;color:var(--text-2);line-height:1.55}.v41-muted{display:block;padding:0 18px 18px;color:var(--text-3)}@media(max-width:1100px){.v41-grid-2,.v41-grid-agenda,.v41-call-grid{grid-template-columns:1fr}.v41-kpis{grid-template-columns:repeat(2,1fr)}.v41-calendar-mini{grid-template-columns:repeat(2,1fr)}.v41-kanban{grid-template-columns:1fr 1fr}.v41-form-grid{grid-template-columns:1fr 1fr}}@media(max-width:680px){.v41-kpis,.v41-calendar-mini,.v41-kanban,.v41-form-grid,.v41-model-grid{grid-template-columns:1fr}.v41-call-card{grid-template-columns:42px 1fr}.v41-call-score{display:none}}
  `; DOC.head.appendChild(st); }

  function boot(){
    installCSS(); ensureLeadIds(); ensureNavButton('ligacoes','Ligações'); ensureNavButton('automacoes','Automações'); ensureNavButton('agenda','Agenda'); cleanupDuplicateViews(); bindActions(); cleanVisibility();
    const current=$('.view.active')?.id || 'inicio'; setViewV41(current);
    let scheduled=false;
    new MutationObserver(()=>{ if(scheduled) return; scheduled=true; setTimeout(()=>{scheduled=false; cleanupDuplicateViews(); cleanVisibility(); const c=$('.view.active')?.id; if(['ligacoes','automacoes','agenda'].includes(c)) renderForView(c);},80); }).observe(DOC.body,{childList:true,subtree:true});
  }
  if(DOC.readyState==='loading') DOC.addEventListener('DOMContentLoaded',boot); else boot();
})();
