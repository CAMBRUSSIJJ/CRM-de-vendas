(function(){
'use strict';
if(window.CRMV982Followups) return;

const VERSION='V98.6';
const KEY='crm_v99_leads';
const LEGACY_KEY='crm_v99_leads';
const STAGE_KEY='crm_v92_followup_stages';
const TPL_KEY='crm_v92_followup_templates';
const UI_KEY='crm_v92_followup_ui';
const SETTINGS_KEY='crm_v982_followup_settings';

const DEFAULT_SETTINGS={workStart:'08:00',workEnd:'18:00',skipWeekends:true,autoSchedule:true};
const DEFAULT_STAGES=[
  {id:'primeiro',name:'Primeiro contato',color:'#1d9e75',delayValue:15,delayUnit:'minutes',time:'09:00',channel:'Ligação',businessHours:true,action:'Fazer o primeiro contato e registrar o resultado'},
  {id:'segundo',name:'Segundo contato',color:'#2563eb',delayValue:1,delayUnit:'days',time:'10:00',channel:'Ligação',businessHours:true,action:'Realizar a segunda tentativa de contato'},
  {id:'sem-resposta',name:'Tentativa sem resposta',color:'#f59e0b',delayValue:4,delayUnit:'hours',time:'15:00',channel:'WhatsApp',businessHours:true,action:'Enviar mensagem curta após a tentativa sem resposta'},
  {id:'retorno',name:'Retorno marcado',color:'#7c3aed',delayValue:1,delayUnit:'days',time:'15:00',channel:'Ligação',businessHours:true,action:'Retornar no horário combinado com o lead'},
  {id:'aguardando',name:'Aguardando resposta',color:'#0ea5e9',delayValue:2,delayUnit:'days',time:'14:00',channel:'WhatsApp',businessHours:true,action:'Confirmar se o lead conseguiu analisar a mensagem'},
  {id:'proposta',name:'Proposta em acompanhamento',color:'#16a34a',delayValue:2,delayUnit:'days',time:'10:00',channel:'Ligação',businessHours:true,action:'Acompanhar a proposta e alinhar a decisão'},
  {id:'reativacao',name:'Reativação',color:'#64748b',delayValue:7,delayUnit:'days',time:'10:00',channel:'WhatsApp',businessHours:true,action:'Retomar o contato com uma abordagem de reativação'},
  {id:'encerrado',name:'Encerrado',color:'#111827',delayValue:0,delayUnit:'days',time:'10:00',channel:'Nenhum',businessHours:false,action:'Nenhuma próxima ação'}
];
const DEFAULT_TEMPLATES=[
  {id:'nao-falei',title:'Não consegui falar',channel:'WhatsApp',body:'Oi, tudo bem? Tentei falar contigo agora há pouco sobre uma oportunidade rápida para melhorar o acompanhamento dos contatos que chegam até vocês. Posso te chamar por aqui?'},
  {id:'retorno',title:'Retorno combinado',channel:'WhatsApp',body:'Oi, combinado então. Vou te chamar no horário que combinamos para dar sequência e te mostrar o próximo passo.'},
  {id:'proposta',title:'Follow-up de proposta',channel:'WhatsApp',body:'Oi, tudo bem? Passando para saber se conseguiu olhar a proposta e se faz sentido avançarmos com uma reunião rápida para ajustar os próximos passos.'},
  {id:'reuniao',title:'Confirmação de reunião',channel:'WhatsApp',body:'Oi, tudo certo? Confirmando nossa reunião. Vou te mostrar de forma objetiva onde podemos melhorar o acompanhamento dos contatos e reduzir oportunidades perdidas.'},
  {id:'ultima',title:'Última tentativa',channel:'WhatsApp',body:'Oi, tentei contato algumas vezes e não quero ficar insistindo se agora não for prioridade. Posso deixar para retomar em outro momento?'},
  {id:'reativar',title:'Reativação',channel:'WhatsApp',body:'Oi, tudo bem? Retomando nosso contato porque a ideia que conversamos pode fazer sentido agora. Quer que eu te mostre em 10 minutos?'}
];

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const readJSON=(k,fb)=>{try{const raw=localStorage.getItem(k);return raw?JSON.parse(raw):fb}catch(e){return fb}};
const writeJSON=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){console.warn('CRM V98.2: erro ao salvar',k,e)}};
const pad=n=>String(n).padStart(2,'0');
const dateKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>dateKey(new Date());
const uid=(p='fu')=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
const isDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''));
const parseDateTime=(date,time='09:00')=>{const [y,m,d]=String(date||today()).split('-').map(Number);const [h,mi]=String(time||'09:00').split(':').map(Number);return new Date(y||new Date().getFullYear(),(m||1)-1,d||1,h||0,mi||0,0,0)};
const timeKey=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}`;
const nowStamp=()=>new Date().toLocaleDateString('pt-BR')+' '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});

function toast(msg,type='success'){
  try{if(window.crmToast)return window.crmToast(msg,type);if(window.showToast)return window.showToast(msg,type)}catch(e){}
  let old=$('.v982-toast');if(old)old.remove();const el=document.createElement('div');el.className='v982-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2600);
}
function settings(){return Object.assign({},DEFAULT_SETTINGS,readJSON(SETTINGS_KEY,{}));}
function saveSettings(s){writeJSON(SETTINGS_KEY,Object.assign({},DEFAULT_SETTINGS,s||{}));}
function slug(v){return String(v||'etapa').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||uid('etapa');}
function normalizeStage(s,i){
  s=s||{};
  const oldDays=Number(s.days);
  return {
    id:s.id||slug(s.name||('etapa-'+i)),
    name:s.name||('Etapa '+(i+1)),
    color:s.color||'#1d9e75',
    delayValue:Number.isFinite(Number(s.delayValue))?Math.max(0,Number(s.delayValue)):(Number.isFinite(oldDays)?Math.max(0,oldDays):1),
    delayUnit:['minutes','hours','days'].includes(s.delayUnit)?s.delayUnit:'days',
    time:s.time||s.hour||'10:00',
    channel:s.channel||'Ligação',
    businessHours:s.businessHours!==false,
    action:s.action||s.nextAction||('Executar '+(s.name||'follow-up')),
    order:Number.isFinite(Number(s.order))?Number(s.order):i,
    days:Number.isFinite(oldDays)?oldDays:undefined
  };
}
function stages(){
  let raw=readJSON(STAGE_KEY,null);
  if(!Array.isArray(raw)||!raw.length)raw=DEFAULT_STAGES;
  const normalized=raw.map(normalizeStage).sort((a,b)=>a.order-b.order).map((s,i)=>Object.assign(s,{order:i}));
  if(JSON.stringify(raw)!==JSON.stringify(normalized))writeJSON(STAGE_KEY,normalized);
  return normalized;
}
function saveStages(list){writeJSON(STAGE_KEY,list.map(normalizeStage).map((s,i)=>Object.assign(s,{order:i})));}
function templates(){let t=readJSON(TPL_KEY,null);if(!Array.isArray(t)||!t.length){t=DEFAULT_TEMPLATES;writeJSON(TPL_KEY,t)}return t;}
function ui(){return Object.assign({tab:'fila',filter:'todos',search:'',selected:null},readJSON(UI_KEY,{}));}
function saveUI(v){writeJSON(UI_KEY,v);}
function leadName(l){return l.nome||l.empresa||l.name||l.lead||'Lead sem nome';}
function leadId(l){if(!l.id)l.id='lead_'+slug(leadName(l))+'_'+Math.random().toString(36).slice(2,5);return l.id;}
function getFollowStage(l){const v=l.followupEtapa||l.followupStage||l.cadenciaEtapa||(isDate(l.followup)?'':l.followup);return v||'Primeiro contato';}
function getNextDate(l){return l.proximaData||l.nextDate||l.followupData||(isDate(l.followup)?l.followup:'')||'';}
function getNextTime(l){return l.proximaHora||l.nextTime||l.followupHora||'';}
function normalizeLead(l){
  l=Object.assign({},l||{});leadId(l);
  const pipeline=l.pipeline||l.etapa||l.pipelineEtapa||l.stage||'Lead';
  const followStage=getFollowStage(l);const nextDate=getNextDate(l);const nextTime=getNextTime(l);
  Object.assign(l,{nome:leadName(l),empresa:l.empresa||leadName(l),telefone:l.telefone||l.phone||l.whatsapp||'',cidade:l.cidade||l.city||'',segmento:l.segmento||l.segment||'',origem:l.origem||l.fonte||l.source||'',campanha:l.campanha||l.campaign||'',responsavel:l.responsavel||l.owner||'Time Comercial',pipeline,etapa:pipeline,followup:followStage,followupEtapa:followStage,proximaData:nextDate,followupData:nextDate,proximaHora:nextTime,followupHora:nextTime,prioridade:l.prioridade||l.priority||'Média',proximaAcao:l.proximaAcao||l.nextAction||l.acao||'Definir próximo contato',historico:Array.isArray(l.historico)?l.historico:(Array.isArray(l.history)?l.history:[])});
  l.contatos=Number(l.contatos||l.totalContatos||countEvents(l));
  return l;
}
function getLeads(){const arr=window.CRMData?.leads?.all?.()||window.CRMCommercialModel?.getLeads?.()||[];return Array.isArray(arr)?arr.map(normalizeLead):[];}
function saveLeads(list){const normalized=list.map(normalizeLead);return window.CRMData?.leads?.save?.(normalized,'followups')||normalized;}
function upsertLead(updated){const list=getLeads();const idx=list.findIndex(l=>l.id===updated.id);if(idx>=0)list[idx]=normalizeLead(updated);else list.push(normalizeLead(updated));saveLeads(list);}
function countEvents(l){return (Array.isArray(l.historico)?l.historico:[]).filter(e=>/ligação|whatsapp|email|reunião|follow/i.test(String(e.tipo||e.type||e.canal||''))).length;}
function leadEvents(l){return (Array.isArray(l.historico)?l.historico:[]).slice().reverse().slice(0,10);}
function addEvent(lead,ev){lead.historico=Array.isArray(lead.historico)?lead.historico:[];lead.historico.push(Object.assign({id:uid(),data:today(),hora:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),quando:nowStamp()},ev));lead.contatos=countEvents(lead);}
function stageBy(ref){const n=String(ref||'').toLowerCase();return stages().find(s=>s.id===ref||s.name===ref||s.id.toLowerCase()===n||s.name.toLowerCase()===n)||stages()[0];}
function nextStage(current){const list=stages();const s=stageBy(current);const i=list.findIndex(x=>x.id===s.id);return list[Math.min(list.length-1,i+1)]||s;}
function addBusinessDays(d,days,skip){let left=Math.max(0,Number(days)||0);while(left>0){d.setDate(d.getDate()+1);if(!skip||![0,6].includes(d.getDay()))left--;}return d;}
function clampBusinessTime(d,s){if(!s.businessHours)return d;const cfg=settings();if(cfg.skipWeekends){while([0,6].includes(d.getDay()))d.setDate(d.getDate()+(d.getDay()===6?2:1));}const start=parseDateTime(dateKey(d),cfg.workStart);const end=parseDateTime(dateKey(d),cfg.workEnd);if(d<start)d=start;if(d>end){d=addBusinessDays(parseDateTime(dateKey(d),cfg.workStart),1,cfg.skipWeekends);}return d;}
function scheduleForStage(stage,base=new Date()){
  const s=normalizeStage(stage,0);let d=new Date(base.getTime());
  if(s.delayUnit==='minutes')d.setMinutes(d.getMinutes()+s.delayValue);
  if(s.delayUnit==='hours')d.setHours(d.getHours()+s.delayValue);
  if(s.delayUnit==='days'){
    d=addBusinessDays(d,s.delayValue,settings().skipWeekends&&s.businessHours);
    const [h,m]=String(s.time||'10:00').split(':').map(Number);d.setHours(h||0,m||0,0,0);
  }
  d=clampBusinessTime(d,s);
  return {date:dateKey(d),time:timeKey(d),dateTime:d};
}
function applyStage(lead,stageRef,opts={}){
  const s=stageBy(stageRef);const when=scheduleForStage(s,opts.base||new Date());
  lead.followup=s.name;lead.followupEtapa=s.name;lead.proximaData=when.date;lead.followupData=when.date;lead.proximaHora=when.time;lead.followupHora=when.time;lead.proximaAcao=opts.action||s.action||('Executar '+s.name);lead.cadenciaStepId=s.id;lead.cadenciaUpdatedAt=new Date().toISOString();
  return {lead,stage:s,when};
}
function statusOf(l){const d=getNextDate(l);if(!d)return 'semacao';if(d<today())return 'vencido';if(d===today())return 'hoje';if(/retorno/i.test(getFollowStage(l)))return 'retorno';return 'futuro';}
function statusLabel(l){return {vencido:'Vencido',hoje:'Hoje',retorno:'Retorno',semacao:'Sem próxima ação',futuro:'Futuro'}[statusOf(l)]||'Aberto';}
function playbookFor(l){const st=getFollowStage(l).toLowerCase();const etapa=String(l.pipeline||'').toLowerCase();if(st.includes('segundo')||st.includes('sem resposta'))return 'Segundo contato — lead sem resposta';if(st.includes('proposta')||etapa.includes('proposta'))return 'Follow-up de proposta';if(st.includes('reativ'))return 'Reativação de lead frio';if(st.includes('retorno'))return 'Retorno combinado';return 'Primeiro contato — lead vindo do Garimpo';}
function filteredLeads(){const u=ui();const q=String(u.search||'').toLowerCase();const pri={'Alta':0,'Média':1,'Media':1,'Baixa':2};return getLeads().filter(l=>{const blob=[l.nome,l.telefone,l.cidade,l.segmento,l.campanha,getFollowStage(l),l.pipeline,l.responsavel].join(' ').toLowerCase();if(q&&!blob.includes(q))return false;const f=u.filter||'todos';if(f==='vencidos')return statusOf(l)==='vencido';if(f==='hoje')return statusOf(l)==='hoje';if(f==='semacao')return statusOf(l)==='semacao';if(f==='risco')return statusOf(l)==='vencido'||/sem resposta|reativ/i.test(getFollowStage(l));if(f==='retornos')return /retorno/i.test(getFollowStage(l));return true;}).sort((a,b)=>{const sa=statusOf(a)==='vencido'?-20:statusOf(a)==='hoje'?-10:0;const sb=statusOf(b)==='vencido'?-20:statusOf(b)==='hoje'?-10:0;const da=getNextDate(a)||'9999';const db=getNextDate(b)||'9999';return sa-sb||da.localeCompare(db)||(pri[a.prioridade]??1)-(pri[b.prioridade]??1);});}
function selectedLead(){const u=ui(),list=getLeads();return list.find(l=>l.id===u.selected)||filteredLeads()[0]||list[0]||null;}
function kpis(){const list=getLeads();return {today:list.filter(l=>statusOf(l)==='hoje').length,over:list.filter(l=>statusOf(l)==='vencido').length,no:list.filter(l=>statusOf(l)==='semacao').length,ret:list.filter(l=>/retorno/i.test(getFollowStage(l))).length,contacts:list.reduce((s,l)=>s+countEvents(l),0)};}
function formatDelay(s){const labels={minutes:'minuto(s)',hours:'hora(s)',days:'dia(s)'};return `${s.delayValue} ${labels[s.delayUnit]||s.delayUnit}`;}
function formatDateBR(v){if(!v)return 'Sem data';const [y,m,d]=v.split('-');return `${d}/${m}/${y}`;}

function doAction(id,action){
  const lead=getLeads().find(l=>l.id===id);if(!lead){toast('Lead não encontrado','warn');return;}
  const map={
    'no-response':{result:'Não atendeu',label:'Não respondeu',note:'Tentativa sem resposta registrada.'},
    answered:{result:'Atendeu',label:'Respondeu',note:'Lead respondeu ao contato.'},
    return:{result:'Pediu retorno',label:'Pediu retorno',note:'Retorno agendado conforme a cadência.'},
    meeting:{result:'Marcou reunião',label:'Marcou reunião',note:'Reunião marcada a partir do follow-up.'},
    proposal:{result:'Proposta enviada',label:'Proposta enviada',note:'Lead movido para acompanhamento de proposta.'},
    reactivate:{result:'Reativação',label:'Reativação',note:'Lead entrou na fila de reativação.'}
  };
  const cfg=map[action];if(!cfg)return;
  let meeting=null;
  if(action==='meeting'){
    const target=window.CRMOutcomeRules?.followStageFor?.('meeting')||stageBy(getFollowStage(lead));
    const when=scheduleForStage(target);
    meeting={date:when.date,time:when.time,duration:30,title:'Reunião com '+leadName(lead),notes:cfg.note};
  }
  const out=window.CRMOutcomeRules?.apply?.({lead,result:cfg.result,meeting,source:'Follow-up'});
  const target=out?.followup?.stage||stageBy(getFollowStage(lead));
  addEvent(lead,{tipo:'Follow-up',canal:target?.channel||'CRM',resultado:cfg.label,nota:cfg.note+(out?.agendaEvent?' Evento criado na Agenda.':'')});
  upsertLead(lead);try{window.CRMEventHub?.emit?.('crm:followup-action-recorded',{leadId:lead.id,lead,result:cfg.result,action});}catch(e){}const u=ui();u.selected=lead.id;saveUI(u);render();toast('Follow-up atualizado pela regra central');
}
function updateStage(id,stageRef){const lead=getLeads().find(l=>l.id===id);if(!lead)return;const {stage,when}=applyStage(lead,stageRef);addEvent(lead,{tipo:'Follow-up',canal:'Kanban',resultado:'Etapa alterada',nota:`Movido para ${stage.name}; próximo contato em ${formatDateBR(when.date)} às ${when.time}.`});upsertLead(lead);render();}

function hero(){return `<div class="v92-hero"><div><div class="v92-eyebrow">Cadência configurável</div><h2>Follow-ups e Relacionamento</h2><p>Configure quanto tempo o CRM deve aguardar, o horário, o canal e a próxima ação de cada etapa. A mesma cadência alimenta Ligações, Pipeline e Agenda.</p></div><div class="v92-actions"><button class="btn btn-primary" data-v92-routine>Iniciar fila de hoje</button><button class="btn" data-v92-modal="followup">Criar follow-up</button><button class="btn" data-v92-tab="cadencias">Configurar cadência</button><button class="btn" data-v92-filter="semacao">Ver sem próxima ação</button></div></div>`;}
function kpiHTML(){const d=kpis();return `<div class="v92-kpis"><button class="v92-kpi warn" data-v92-filter="hoje"><span>Hoje</span><strong>${d.today}</strong><small>Contatos programados para hoje</small></button><button class="v92-kpi danger" data-v92-filter="vencidos"><span>Vencidos</span><strong>${d.over}</strong><small>Precisam de ação imediata</small></button><button class="v92-kpi blue" data-v92-filter="semacao"><span>Sem próxima ação</span><strong>${d.no}</strong><small>Leads soltos no CRM</small></button><button class="v92-kpi" data-v92-filter="retornos"><span>Retornos marcados</span><strong>${d.ret}</strong><small>Contatos com horário combinado</small></button></div>`;}
function toolbar(){const u=ui();const opts=[['todos','Todos'],['hoje','Hoje'],['vencidos','Vencidos'],['semacao','Sem próxima ação'],['risco','Em risco'],['retornos','Retornos']];const tabs=[['fila','Fila'],['kanban','Kanban'],['cadencias','Cadências'],['contatos','Contatos'],['templates','Templates'],['metricas','Métricas']];return `<div class="v92-toolbar"><div class="search-wrap"><input class="v92-input" id="v92Search" placeholder="Buscar lead, cidade, campanha, etapa..." value="${esc(u.search)}"></div><select class="v92-select" id="v92Filter" style="max-width:190px">${opts.map(o=>`<option value="${o[0]}" ${u.filter===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select><div class="v92-tabs">${tabs.map(t=>`<button class="v92-tab ${u.tab===t[0]?'active':''}" data-v92-tab="${t[0]}">${t[1]}</button>`).join('')}</div></div>`;}
function leadRow(l){const st=stageBy(getFollowStage(l));return `<article class="v92-lead ${statusOf(l)}" data-v92-select="${esc(l.id)}"><div class="v92-avatar">${esc(leadName(l).slice(0,2).toUpperCase())}</div><div><div class="v92-title"><b>${esc(leadName(l))}</b><span class="v92-pill" style="--stage:${esc(st.color)}">${esc(st.name)}</span><span class="v92-pill ${statusOf(l)==='vencido'?'danger':statusOf(l)==='hoje'?'warn':''}">${esc(statusLabel(l))}</span></div><div class="v92-meta"><span>${esc(l.pipeline)}</span><span>${esc(l.cidade||'Sem cidade')}</span><span>${esc(l.responsavel)}</span><span>${esc(formatDateBR(getNextDate(l)))} ${esc(getNextTime(l))}</span></div><p class="v92-note">${esc(l.proximaAcao||st.action)}</p></div><div class="v92-lead-actions"><button class="v92-mini-btn" data-v92-action="no-response" data-id="${esc(l.id)}">Não respondeu</button><button class="v92-mini-btn" data-v92-action="return" data-id="${esc(l.id)}">Retorno</button><button class="v92-mini-btn" data-v92-action="proposal" data-id="${esc(l.id)}">Proposta</button></div></article>`;}
function listHTML(){const list=filteredLeads();return `<div class="v92-card"><div class="v92-card-head"><div><h3>Fila de próximos contatos</h3><p>Ordenada por vencimento, horário e prioridade. As ações usam os prazos configurados na cadência.</p></div><button class="btn btn-sm" data-v92-modal="followup">Criar follow-up</button></div><div class="v92-list">${list.length?list.map(leadRow).join(''):'<div class="v92-empty"><b>Nenhum lead encontrado</b>Crie um follow-up ou aplique uma cadência a um lead.</div>'}</div></div>`;}
function kanbanHTML(){const list=getLeads(),sts=stages();return `<div class="v92-card" style="padding:16px"><div class="v92-kanban" style="--v92-cols:${Math.max(sts.length,4)}">${sts.map(s=>{const col=list.filter(l=>stageBy(getFollowStage(l)).id===s.id);return `<section class="v92-col" data-v92-drop="${esc(s.id)}"><div class="v92-col-head"><b>${esc(s.name)}</b><span>${col.length}</span></div><div>${col.length?col.map(l=>`<article class="v92-kan-card" draggable="true" data-v92-drag="${esc(l.id)}" data-v92-select="${esc(l.id)}" style="border-left-color:${esc(s.color)}"><b>${esc(leadName(l))}</b><p>${esc(l.proximaAcao||s.action)}</p><span class="v92-pill">${esc(formatDateBR(getNextDate(l)))} ${esc(getNextTime(l))}</span> <span class="v92-pill ${statusOf(l)==='vencido'?'danger':''}">${esc(statusLabel(l))}</span></article>`).join(''):'<div class="v92-empty" style="padding:22px 10px">Sem leads nesta etapa</div>'}</div></section>`}).join('')}</div></div>`;}
function cadenceRow(s,i){return `<div class="v982-cad-row" data-v982-stage-row data-id="${esc(s.id)}"><div class="v982-order"><button type="button" data-v982-move="up" title="Subir">↑</button><span>${i+1}</span><button type="button" data-v982-move="down" title="Descer">↓</button></div><div class="v982-field"><label>Etapa</label><input data-stage-name value="${esc(s.name)}"></div><div class="v982-field"><label>Canal</label><select data-stage-channel>${['Ligação','WhatsApp','E-mail','Reunião','Nenhum'].map(c=>`<option ${s.channel===c?'selected':''}>${c}</option>`).join('')}</select></div><div class="v982-field small"><label>Aguardar</label><input type="number" min="0" data-stage-delay value="${esc(s.delayValue)}"></div><div class="v982-field"><label>Unidade</label><select data-stage-unit><option value="minutes" ${s.delayUnit==='minutes'?'selected':''}>Minutos</option><option value="hours" ${s.delayUnit==='hours'?'selected':''}>Horas</option><option value="days" ${s.delayUnit==='days'?'selected':''}>Dias</option></select></div><div class="v982-field"><label>Horário preferencial</label><input type="time" data-stage-time value="${esc(s.time)}"></div><div class="v982-field color"><label>Cor</label><input type="color" data-stage-color value="${esc(s.color)}"></div><div class="v982-field action"><label>Próxima ação</label><input data-stage-action value="${esc(s.action)}"></div><label class="v982-check"><input type="checkbox" data-stage-business ${s.businessHours?'checked':''}> Respeitar horário comercial</label><button class="v982-remove" type="button" data-v982-remove title="Remover">×</button></div>`;}
function cadencePreview(){let base=new Date();return stages().map((s,i)=>{const w=scheduleForStage(s,base);base=w.dateTime;return `<div class="v982-preview-step"><i style="background:${esc(s.color)}">${i+1}</i><div><b>${esc(s.name)}</b><span>${esc(s.channel)} · após ${esc(formatDelay(s))}</span><small>${esc(formatDateBR(w.date))} às ${esc(w.time)} · ${esc(s.action)}</small></div></div>`;}).join('');}
function cadencesHTML(){const cfg=settings();return `<div class="v982-cadence-layout"><section class="v92-card v982-cadence-editor"><div class="v92-card-head"><div><h3>Configuração da cadência</h3><p>Defina o tempo de resposta, o canal, o horário e a ação de cada etapa.</p></div><div class="v982-editor-actions"><button class="btn btn-sm" data-v982-add>Adicionar etapa</button><button class="btn btn-sm" data-v982-reset>Restaurar padrão</button><button class="btn btn-sm btn-primary" data-v982-save>Salvar cadência</button></div></div><div class="v982-business"><div class="v982-field"><label>Início do atendimento</label><input type="time" id="v982WorkStart" value="${esc(cfg.workStart)}"></div><div class="v982-field"><label>Fim do atendimento</label><input type="time" id="v982WorkEnd" value="${esc(cfg.workEnd)}"></div><label class="v982-check"><input type="checkbox" id="v982SkipWeekends" ${cfg.skipWeekends?'checked':''}> Pular sábados e domingos</label><label class="v982-check"><input type="checkbox" id="v982AutoSchedule" ${cfg.autoSchedule?'checked':''}> Agendar automaticamente ao mudar de etapa</label></div><div id="v982CadenceRows" class="v982-cad-rows">${stages().map(cadenceRow).join('')}</div></section><aside class="v92-card v982-cadence-preview"><div class="v92-card-head"><div><h3>Simulação da sequência</h3><p>Exemplo calculado a partir de agora.</p></div></div><div class="v982-preview-list" id="v982CadencePreview">${cadencePreview()}</div><div class="v982-apply"><label>Aplicar a um lead</label><select id="v982ApplyLead">${getLeads().map(l=>`<option value="${esc(l.id)}">${esc(leadName(l))}</option>`).join('')}</select><select id="v982ApplyStage">${stages().map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select><button class="btn btn-primary" data-v982-apply>Aplicar e agendar</button></div></aside></div>`;}
function contactsHTML(){const rows=getLeads().sort((a,b)=>countEvents(b)-countEvents(a));return `<div class="v92-card"><div class="v92-card-head"><div><h3>Contatos por lead</h3><p>Quantidade de tentativas e respostas registradas no histórico.</p></div></div><div class="v92-list">${rows.length?rows.map(l=>`<article class="v92-lead" data-v92-select="${esc(l.id)}"><div class="v92-avatar">${esc(leadName(l).slice(0,2).toUpperCase())}</div><div><div class="v92-title"><b>${esc(leadName(l))}</b><span class="v92-pill blue">${countEvents(l)} contatos</span></div><div class="v92-meta"><span>Último: ${esc(leadEvents(l)[0]?.resultado||leadEvents(l)[0]?.tipo||'Sem histórico')}</span><span>Follow-up: ${esc(getFollowStage(l))}</span><span>Pipeline: ${esc(l.pipeline)}</span></div></div><div class="v92-lead-actions"><button class="v92-mini-btn" data-v92-action="return" data-id="${esc(l.id)}">Criar retorno</button></div></article>`).join(''):'<div class="v92-empty">Sem contatos registrados.</div>'}</div></div>`;}
function templatesHTML(){return `<div class="v92-card"><div class="v92-card-head"><div><h3>Templates rápidos</h3><p>Copie mensagens para WhatsApp/e-mail e registre o contato no lead.</p></div></div><div class="v92-template-grid">${templates().map(t=>`<button class="v92-template" data-v92-copy-template="${esc(t.id)}"><b>${esc(t.title)}</b><p>${esc(t.channel)} · ${esc(t.body)}</p></button>`).join('')}</div></div>`;}
function metricsHTML(){const d=kpis();return `<div class="v92-card"><div class="v92-card-head"><div><h3>Métricas de relacionamento</h3><p>Execução, atrasos e distribuição da cadência.</p></div></div><div class="v92-template-grid"><div class="v92-template"><b>${d.contacts}</b><p>Contatos registrados no histórico.</p></div><div class="v92-template"><b>${d.over}</b><p>Follow-ups vencidos.</p></div><div class="v92-template"><b>${d.no}</b><p>Leads sem próxima ação.</p></div><div class="v92-template"><b>${d.ret}</b><p>Retornos marcados.</p></div></div><div class="v92-stages">${stages().map(s=>`<div class="v92-template"><b>${esc(s.name)}</b><p>${getLeads().filter(l=>stageBy(getFollowStage(l)).id===s.id).length} lead(s) · ${esc(formatDelay(s))} · ${esc(s.time)}</p></div>`).join('')}</div></div>`;}
function sideHTML(){const l=selectedLead();if(!l)return `<aside class="v92-side"><div class="v92-card"><div class="v92-empty"><b>Nenhum lead selecionado</b>Selecione um card para ver histórico, próxima ação e playbook sugerido.</div></div></aside>`;const evs=leadEvents(l),s=stageBy(getFollowStage(l));return `<aside class="v92-side"><div class="v92-card"><div class="v92-detail"><div class="v92-detail-title"><div><h3>${esc(leadName(l))}</h3><span class="v92-pill ${statusOf(l)==='vencido'?'danger':statusOf(l)==='hoje'?'warn':'ok'}">${esc(statusLabel(l))}</span></div><button class="v92-mini-btn" data-v92-modal="followup" data-lead="${esc(l.id)}">Editar</button></div><div class="v92-detail-grid"><div class="v92-info"><span>Pipeline</span><b>${esc(l.pipeline)}</b></div><div class="v92-info"><span>Follow-up</span><b>${esc(s.name)}</b></div><div class="v92-info"><span>Canal</span><b>${esc(s.channel)}</b></div><div class="v92-info"><span>Próximo</span><b>${esc(formatDateBR(getNextDate(l)))} ${esc(getNextTime(l))}</b></div></div><div class="v92-info"><span>Regra da etapa</span><b>Responder após ${esc(formatDelay(s))}${s.delayUnit==='days'?' às '+esc(s.time):''}</b></div><div class="v92-info"><span>Playbook sugerido</span><b>${esc(playbookFor(l))}</b></div><div class="v92-info"><span>Próxima ação</span><b>${esc(l.proximaAcao||s.action)}</b></div><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="v92-mini-btn" data-v92-action="no-response" data-id="${esc(l.id)}">Não respondeu</button><button class="v92-mini-btn" data-v92-action="return" data-id="${esc(l.id)}">Pediu retorno</button><button class="v92-mini-btn" data-v92-action="proposal" data-id="${esc(l.id)}">Enviar proposta</button><button class="v92-mini-btn" data-view="ligacoes">Abrir Ligações</button></div></div></div><div class="v92-card"><div class="v92-card-head"><div><h3>Timeline</h3><p>Histórico conectado deste lead.</p></div></div><div class="v92-detail v92-timeline">${evs.length?evs.map(e=>`<div class="v92-event"><span class="v92-dot"></span><div><b>${esc(e.resultado||e.tipo||'Contato')}</b><p>${esc(e.quando||e.data||'')} · ${esc(e.canal||e.tipo||'CRM')}<br>${esc(e.nota||e.obs||'Sem observação')}</p></div></div>`).join(''):'<div class="v92-empty" style="padding:18px">Sem histórico ainda.</div>'}</div></div></aside>`;}
function currentMain(){const tab=ui().tab;if(tab==='kanban')return kanbanHTML();if(tab==='cadencias')return cadencesHTML();if(tab==='contatos')return contactsHTML();if(tab==='templates')return templatesHTML();if(tab==='metricas')return metricsHTML();return listHTML();}
function render(){const sec=$('#cadencias');if(!sec)return;sec.className='view grid-view v92-followup-view'+(sec.classList.contains('active')?' active':'');sec.innerHTML=`<div class="v92-shell">${hero()}${kpiHTML()}${toolbar()}${ui().tab==='cadencias'?currentMain():`<div class="v92-layout"><main>${currentMain()}</main>${sideHTML()}</div>`}</div>${modalHTML()}`;bind();updateTopbar();}
function updateTopbar(){if(!$('#cadencias.active'))return;const t=$('#topbarTitle'),s=$('#topbarSub');if(t)t.textContent='Follow-ups e Relacionamento';if(s)s.textContent='Cadências configuráveis por prazo, horário, canal e próxima ação';}

function readEditorStages(){return $$('#v982CadenceRows [data-v982-stage-row]').map((r,i)=>normalizeStage({id:r.dataset.id||slug($('[data-stage-name]',r)?.value),name:$('[data-stage-name]',r)?.value,color:$('[data-stage-color]',r)?.value,delayValue:$('[data-stage-delay]',r)?.value,delayUnit:$('[data-stage-unit]',r)?.value,time:$('[data-stage-time]',r)?.value,channel:$('[data-stage-channel]',r)?.value,businessHours:$('[data-stage-business]',r)?.checked,action:$('[data-stage-action]',r)?.value,order:i},i)).filter(s=>s.name.trim());}
function saveCadenceEditor(){const list=readEditorStages();if(!list.length){toast('Mantenha pelo menos uma etapa','warn');return;}saveStages(list);saveSettings({workStart:$('#v982WorkStart')?.value||'08:00',workEnd:$('#v982WorkEnd')?.value||'18:00',skipWeekends:!!$('#v982SkipWeekends')?.checked,autoSchedule:!!$('#v982AutoSchedule')?.checked});render();toast('Cadência salva e pronta para uso');}
function moveStageRow(row,dir){const parent=row?.parentElement;if(!parent)return;const sibling=dir==='up'?row.previousElementSibling:row.nextElementSibling;if(!sibling)return;if(dir==='up')parent.insertBefore(row,sibling);else parent.insertBefore(sibling,row);$$('#v982CadenceRows [data-v982-stage-row]').forEach((r,i)=>{const n=$('.v982-order span',r);if(n)n.textContent=i+1;});}
function applyCadenceToLead(){const id=$('#v982ApplyLead')?.value,stageId=$('#v982ApplyStage')?.value;const lead=getLeads().find(l=>l.id===id);if(!lead)return toast('Escolha um lead','warn');const {stage,when}=applyStage(lead,stageId);addEvent(lead,{tipo:'Cadência',canal:stage.channel,resultado:'Cadência aplicada',nota:`${stage.name} agendado para ${formatDateBR(when.date)} às ${when.time}.`});upsertLead(lead);try{window.CRMEventHub?.emit?.('crm:followup-action-recorded',{leadId:lead.id,lead,result:cfg.result,action});}catch(e){}const u=ui();u.selected=id;u.tab='fila';saveUI(u);render();toast('Cadência aplicada ao lead');}

function bind(){
  $('#v92Search')?.addEventListener('input',e=>{const n=ui();n.search=e.target.value;saveUI(n);render();});
  $('#v92Filter')?.addEventListener('change',e=>{const n=ui();n.filter=e.target.value;saveUI(n);render();});
  $$('[data-v92-tab]').forEach(b=>b.addEventListener('click',()=>{const n=ui();n.tab=b.dataset.v92Tab;saveUI(n);render();}));
  $$('[data-v92-filter]').forEach(b=>b.addEventListener('click',()=>{const n=ui();n.filter=b.dataset.v92Filter||'todos';n.tab='fila';saveUI(n);render();}));
  $$('[data-v92-select]').forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('button'))return;const n=ui();n.selected=el.dataset.v92Select;saveUI(n);render();}));
  $$('[data-v92-action]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();doAction(b.dataset.id||ui().selected,b.dataset.v92Action);}));
  $$('[data-v92-modal]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.v92Modal,b.dataset.lead)));
  $('[data-v92-routine]')?.addEventListener('click',()=>{const next=filteredLeads()[0];if(!next)return toast('Nenhum lead na fila','warn');const n=ui();n.selected=next.id;n.tab='fila';saveUI(n);render();window.CRMCallsBridge?.openLead(next.id,{origin:{view:'cadencias',context:{selectedId:next.id,tab:'fila'}}}).catch(e=>toast(e.message||'Não foi possível abrir Ligações','warn'));});
  $$('[data-v92-copy-template]').forEach(b=>b.addEventListener('click',()=>{const t=templates().find(x=>x.id===b.dataset.v92CopyTemplate);if(!t)return;navigator.clipboard?.writeText(t.body);toast('Template copiado');}));
  $$('[data-v92-drag]').forEach(el=>{el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',el.dataset.v92Drag);el.classList.add('dragging')});el.addEventListener('dragend',()=>el.classList.remove('dragging'));});
  $$('[data-v92-drop]').forEach(col=>{col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('dragover')});col.addEventListener('dragleave',()=>col.classList.remove('dragover'));col.addEventListener('drop',e=>{e.preventDefault();col.classList.remove('dragover');const id=e.dataTransfer.getData('text/plain');if(id)updateStage(id,col.dataset.v92Drop);});});
  $('[data-v982-save]')?.addEventListener('click',saveCadenceEditor);
  $('[data-v982-add]')?.addEventListener('click',()=>{$('#v982CadenceRows')?.insertAdjacentHTML('beforeend',cadenceRow(normalizeStage({id:uid('etapa'),name:'Nova etapa',color:'#1d9e75',delayValue:1,delayUnit:'days',time:'10:00',channel:'Ligação',businessHours:true,action:'Executar nova etapa'},stages().length),$$('#v982CadenceRows [data-v982-stage-row]').length));});
  $('[data-v982-reset]')?.addEventListener('click',()=>{window.CRMDialog?.confirm('Restaurar a cadência padrão?',{title:'Restaurar cadência'}).then(ok=>{if(ok){saveStages(DEFAULT_STAGES);saveSettings(DEFAULT_SETTINGS);render();toast('Cadência padrão restaurada')}});});
  $$('[data-v982-move]').forEach(b=>b.addEventListener('click',()=>moveStageRow(b.closest('[data-v982-stage-row]'),b.dataset.v982Move)));
  $$('[data-v982-remove]').forEach(b=>b.addEventListener('click',()=>b.closest('[data-v982-stage-row]')?.remove()));
  $('[data-v982-apply]')?.addEventListener('click',applyCadenceToLead);
}

function modalHTML(){return `<div class="v92-modal hidden" id="v92Modal"><div class="v92-dialog"><div class="v92-dialog-head"><h3 id="v92ModalTitle">Modal</h3><button class="v92-close" data-v92-close>×</button></div><div id="v92ModalBody"></div></div></div>`;}
function openModal(type,leadId){const m=$('#v92Modal'),title=$('#v92ModalTitle'),body=$('#v92ModalBody');if(!m||!body)return;m.classList.remove('hidden');if(type==='stages'){const n=ui();n.tab='cadencias';saveUI(n);closeModal();render();return;}title.textContent='Criar / editar follow-up';body.innerHTML=followupFormHTML(leadId||ui().selected);bindModal();}
function closeModal(){$('#v92Modal')?.classList.add('hidden');}
function followupFormHTML(selected){const leads=getLeads(),sts=stages(),l=leads.find(x=>x.id===selected)||leads[0],current=stageBy(l?getFollowStage(l):sts[0]?.id),when=l?{date:getNextDate(l)||today(),time:getNextTime(l)||current.time}:scheduleForStage(current);return `<div class="v92-form"><div class="v92-form-row"><div><div class="v92-label">Lead</div><select class="v92-select" id="v92FormLead">${leads.map(x=>`<option value="${esc(x.id)}" ${l&&x.id===l.id?'selected':''}>${esc(leadName(x))}</option>`).join('')}</select></div><div><div class="v92-label">Etapa da cadência</div><select class="v92-select" id="v92FormStage">${sts.map(s=>`<option value="${esc(s.id)}" ${current.id===s.id?'selected':''}>${esc(s.name)} · ${esc(formatDelay(s))}</option>`).join('')}</select></div></div><div class="v982-schedule-summary" id="v982FormRule">Canal: ${esc(current.channel)} · prazo: ${esc(formatDelay(current))} · horário: ${esc(current.time)}</div><div class="v92-form-row"><div><div class="v92-label">Data</div><input class="v92-input" id="v92FormDate" type="date" value="${esc(when.date)}"></div><div><div class="v92-label">Horário</div><input class="v92-input" id="v92FormHour" type="time" value="${esc(when.time)}"></div></div><div class="v92-form-row full"><div><div class="v92-label">Próxima ação</div><textarea class="v92-textarea" id="v92FormNote">${esc(l?.proximaAcao||current.action)}</textarea></div></div><div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn" data-v92-close>Cancelar</button><button class="btn btn-primary" id="v92SaveFollowup">Salvar e agendar</button></div></div>`;}
function bindModal(){ $$('[data-v92-close]').forEach(b=>b.addEventListener('click',closeModal));$('#v92SaveFollowup')?.addEventListener('click',createFollowupFromForm);$('#v92FormStage')?.addEventListener('change',e=>{const s=stageBy(e.target.value),w=scheduleForStage(s);$('#v92FormDate').value=w.date;$('#v92FormHour').value=w.time;$('#v92FormNote').value=s.action;$('#v982FormRule').textContent=`Canal: ${s.channel} · prazo: ${formatDelay(s)} · horário: ${s.time}`;});}
function createFollowupFromForm(){const id=$('#v92FormLead')?.value,lead=getLeads().find(l=>l.id===id);if(!lead)return toast('Escolha um lead','warn');const stage=stageBy($('#v92FormStage')?.value),date=$('#v92FormDate')?.value||today(),time=$('#v92FormHour')?.value||stage.time,note=$('#v92FormNote')?.value||stage.action;lead.followup=stage.name;lead.followupEtapa=stage.name;lead.proximaData=date;lead.followupData=date;lead.proximaHora=time;lead.followupHora=time;lead.proximaAcao=note;lead.cadenciaStepId=stage.id;addEvent(lead,{tipo:'Follow-up',canal:stage.channel,resultado:'Agendado',nota:`${note} · ${formatDateBR(date)} às ${time}`});upsertLead(lead);try{window.CRMEventHub?.emit?.('crm:followup-action-recorded',{leadId:lead.id,lead,result:cfg.result,action});}catch(e){}const u=ui();u.selected=lead.id;saveUI(u);closeModal();render();toast('Follow-up agendado');}

window.CRMV982Followups={version:VERSION,render,stages,settings,scheduleForStage,applyStage,getFollowStage,getNextDate,getNextTime,setTab(tab){const n=ui();n.tab=tab||'fila';saveUI(n);render();},action:doAction};
window.CRMV92FollowupActive=window.CRMV982Followups;
window.CRMV63Followups=window.CRMV982Followups;
document.addEventListener('click',e=>{const btn=e.target.closest('[data-view="cadencias"],[data-v69-go="cadencias"],[data-v68-go="cadencias"],[data-ux-go="cadencias"]');if(btn){setTimeout(render,40);setTimeout(render,180);}},true);
document.addEventListener('crm:datachange',()=>{if($('#cadencias.active'))render();});
document.addEventListener('DOMContentLoaded',()=>{if($('#cadencias.active'))render();});
setTimeout(()=>{if($('#cadencias.active'))render();},300);
})();
