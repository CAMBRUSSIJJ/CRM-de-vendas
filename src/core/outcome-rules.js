/* Regras centrais V98.6 — identidade das etapas, resultados comerciais e ponte de ligações. */
(function(W,D){
  'use strict';
  if(W.CRMStageRegistry && W.CRMOutcomeRules && W.CRMCallsBridge) return;

  const PIPE_KEY='crm_pipeline_stage_config_v20';
  const FOLLOW_KEY='crm_v92_followup_stages';
  const AGENDA_KEY='outbounder_agenda_v1';
  const DEFAULT_STAGES=[
    {id:'st_lead',name:'Lead',color:'#6366f1',prob:10,type:'open',role:'lead',slaDays:1,description:'Novas oportunidades que ainda precisam do primeiro contato.',defaultAction:'Fazer o primeiro contato e qualificar a oportunidade.',visible:true},
    {id:'st_contato',name:'Contato',color:'#f59e0b',prob:25,type:'open',role:'contact',slaDays:2,description:'Leads que já tiveram contato e estão em qualificação.',defaultAction:'Confirmar necessidade, decisor, urgência e próximo passo.',visible:true},
    {id:'st_proposta',name:'Proposta',color:'#06b6d4',prob:60,type:'open',role:'proposal',slaDays:3,description:'Oportunidades com proposta ou condição comercial em andamento.',defaultAction:'Acompanhar decisão, objeções e prazo de fechamento.',visible:true},
    {id:'st_fechado',name:'Fechado',color:'#22c55e',prob:100,type:'won',role:'won',slaDays:0,description:'Negócios ganhos e prontos para pós-venda ou implantação.',defaultAction:'Confirmar entrega, onboarding e oportunidade de indicação.',visible:true},
    {id:'st_perdido',name:'Perdido',color:'#ef4444',prob:0,type:'lost',role:'lost',slaDays:0,description:'Oportunidades encerradas sem fechamento.',defaultAction:'Registrar motivo da perda e programar reativação quando fizer sentido.',visible:true}
  ];
  const read=(key,fb)=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fb}catch(e){return fb}};
  const write=(key,val)=>{try{localStorage.setItem(key,JSON.stringify(val));return true}catch(e){console.warn('[CRM V98.6] Falha ao salvar',key,e);return false}};
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const slug=v=>norm(v).replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'stage';
  const uid=p=>(p||'id')+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
  const today=()=>new Date().toISOString().slice(0,10);
  const nowTime=()=>new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const clone=v=>JSON.parse(JSON.stringify(v));

  function inferRole(s,i,list){
    if(['lead','contact','proposal','custom','won','lost'].includes(s?.role)) return s.role;
    const token=norm([s?.id,s?.name].join(' '));
    if(s?.type==='won'||/fechad|ganh|won|cliente/.test(token)) return 'won';
    if(s?.type==='lost'||/perdid|lost|descart/.test(token)) return 'lost';
    if(/propost|orcament|negocia|proposal/.test(token)) return 'proposal';
    if(/contat|qualifica|contact/.test(token)) return 'contact';
    if(/lead|novo|entrada|topo/.test(token)) return 'lead';
    const open=(list||[]).filter(x=>(x.type||'open')==='open');
    if(i===0||open[0]===s) return 'lead';
    return 'custom';
  }
  function normalizeStage(s={},i=0,list=[]){
    const fallback=DEFAULT_STAGES.find(x=>x.id===s.id)||DEFAULT_STAGES.find(x=>norm(x.name)===norm(s.name))||{};
    const type=['open','won','lost'].includes(s.type)?s.type:(fallback.type||'open');
    const base={
      id:s.id||fallback.id||('stage_'+slug(s.name)+'_'+i),
      name:String(s.name||fallback.name||('Etapa '+(i+1))).trim()||('Etapa '+(i+1)),
      color:s.color||fallback.color||'#64748b',
      prob:Math.max(0,Math.min(100,Number(s.prob??fallback.prob??20))),
      type,
      role:s.role||fallback.role||'',
      slaDays:Math.max(0,Number(s.slaDays??fallback.slaDays??2)),
      description:String(s.description??fallback.description??'Etapa do processo comercial.'),
      defaultAction:String(s.defaultAction??fallback.defaultAction??'Definir o próximo passo desta oportunidade.'),
      visible:s.visible!==false,
      order:Number.isFinite(Number(s.order))?Number(s.order):i
    };
    base.role=inferRole(Object.assign({},base,s,{role:s.role||fallback.role||base.role}),i,list);
    if(type==='won')base.role='won';
    if(type==='lost')base.role='lost';
    return base;
  }
  function getStages(){
    let raw=read(PIPE_KEY,[]);
    if(!Array.isArray(raw)||!raw.length)raw=clone(DEFAULT_STAGES);
    const stages=raw.map((s,i)=>normalizeStage(s,i,raw)).sort((a,b)=>a.order-b.order).map((s,i)=>Object.assign(s,{order:i}));
    if(JSON.stringify(raw)!==JSON.stringify(stages))write(PIPE_KEY,stages);
    return stages;
  }
  function saveStages(list){
    const input=Array.isArray(list)&&list.length?list:clone(DEFAULT_STAGES);
    const stages=input.map((s,i)=>normalizeStage(s,i,input)).map((s,i)=>Object.assign(s,{order:i}));
    write(PIPE_KEY,stages);return stages;
  }
  function resolveStage(ref,opts={}){
    const stages=getStages();
    if(ref&&typeof ref==='object'){
      const byId=stages.find(s=>s.id===ref.pipelineStageId||s.id===ref.stageId);
      if(byId)return byId;
      ref=ref.pipeline||ref.etapa||ref.stage||ref.name;
    }
    const n=norm(ref);
    let found=stages.find(s=>s.id===ref||norm(s.name)===n);
    if(!found&&opts.create&&ref){
      found=normalizeStage({id:'stage_'+slug(ref)+'_'+Date.now().toString(36),name:String(ref),type:'open',role:'custom',order:stages.length},stages.length,stages);
      stages.push(found);saveStages(stages);
    }
    return found||stages.find(s=>s.role==='lead')||stages[0];
  }
  function findByRole(role){
    const stages=getStages();
    const exact=stages.find(s=>s.role===role);
    if(exact)return exact;
    const open=stages.filter(s=>s.type==='open').sort((a,b)=>a.prob-b.prob);
    if(role==='lead')return open[0]||stages[0];
    if(role==='contact')return open[Math.min(1,open.length-1)]||open[0]||stages[0];
    if(role==='proposal')return open.filter(s=>s.prob<100).sort((a,b)=>b.prob-a.prob)[0]||open[open.length-1]||stages[0];
    if(role==='won')return stages.find(s=>s.type==='won');
    if(role==='lost')return stages.find(s=>s.type==='lost');
    return null;
  }
  function assignStage(lead,ref,opts={}){
    if(!lead)return null;
    const stage=typeof ref==='string'&&['lead','contact','proposal','won','lost'].includes(ref)?findByRole(ref):resolveStage(ref,{create:opts.create!==false});
    if(!stage)return null;
    const previous=resolveStage(lead,{create:true});
    lead.pipelineStageId=stage.id;
    lead.pipeline=stage.name;
    lead.etapa=stage.name;
    lead.probabilidade=stage.prob;
    lead.ultimaAtualizacao=today();
    if(stage.type==='won'&&!lead.dataFechamento)lead.dataFechamento=today();
    if(stage.type==='lost'&&!lead.dataPerda)lead.dataPerda=today();
    return {stage,previous,changed:!previous||previous.id!==stage.id};
  }
  function migrateLeads(list){
    if(!Array.isArray(list))return {list:[],changed:false};
    let changed=false;
    list.forEach(lead=>{
      const before=[lead.pipelineStageId,lead.pipeline,lead.etapa].join('|');
      const stage=resolveStage(lead,{create:true});
      if(stage){lead.pipelineStageId=stage.id;lead.pipeline=stage.name;lead.etapa=stage.name;}
      if(before!==[lead.pipelineStageId,lead.pipeline,lead.etapa].join('|'))changed=true;
    });
    return {list,changed};
  }
  function isOpenLead(lead){return resolveStage(lead,{create:true})?.type==='open'}
  function isTerminalLead(lead){return !isOpenLead(lead)}

  function phoneInfo(lead){
    const raw=String(lead?.telefone||lead?.phone||lead?.whatsapp||'').trim();
    let digits=raw.replace(/\D/g,'');
    if(!digits)return {valid:false,digits:'',href:'#',whatsapp:'#',reason:'Telefone não cadastrado'};
    if(raw.startsWith('00'))digits=digits.slice(2);
    const explicitInternational=raw.startsWith('+')||raw.startsWith('00');
    if(!explicitInternational&&!digits.startsWith('55')&&(digits.length===10||digits.length===11))digits='55'+digits;
    const valid=digits.length>=10&&digits.length<=15;
    return {valid,digits,href:valid?'tel:+'+digits:'#',whatsapp:valid?'https://wa.me/'+digits:'#',reason:valid?'':'Telefone inválido ou incompleto'};
  }

  function followStages(){
    try{const api=W.CRMV982Followups;if(api?.stages)return api.stages()}catch(e){}
    const raw=read(FOLLOW_KEY,[]);return Array.isArray(raw)?raw:[];
  }
  const FOLLOW_TARGETS={
    noanswer:{ids:['sem-resposta'],match:/sem resposta|tentativa/i},
    answered:{ids:['aguardando'],match:/aguardando/i},
    return:{ids:['retorno'],match:/retorno/i},
    interested:{ids:['proposta'],match:/proposta|orcamento/i},
    meeting:{ids:['aguardando','retorno'],match:/aguardando|retorno/i},
    proposal:{ids:['proposta'],match:/proposta|orcamento/i},
    reactivate:{ids:['reativacao'],match:/reativa/i}
  };
  function followStageFor(kind,current){
    const stages=followStages(),target=FOLLOW_TARGETS[kind]||{};
    return stages.find(s=>(target.ids||[]).includes(s.id))||stages.find(s=>target.match?.test(s.name||''))||stages.find(s=>s.id===current||s.name===current)||stages[0]||null;
  }
  function applyFollowup(lead,kind,schedule={}){
    const stage=followStageFor(kind,lead?.cadenciaStepId||lead?.followupEtapa||lead?.followup);
    let when={date:schedule.date||'',time:schedule.time||''};
    if(stage&&W.CRMV982Followups?.applyStage){
      const out=W.CRMV982Followups.applyStage(lead,stage,{action:schedule.action});
      when=out?.when||when;
    }else if(stage){
      lead.followup=stage.name;lead.followupEtapa=stage.name;lead.cadenciaStepId=stage.id;
      lead.proximaAcao=schedule.action||stage.action||('Executar '+stage.name);
    }
    if(schedule.date){lead.proximaData=schedule.date;lead.followupData=schedule.date;when.date=schedule.date;}
    if(schedule.time){lead.proximaHora=schedule.time;lead.followupHora=schedule.time;when.time=schedule.time;}
    if(schedule.action)lead.proximaAcao=schedule.action;
    return {stage,when};
  }

  function addAgendaEvent(lead,meeting={}){
    if(!meeting.date)return null;
    const event={
      id:'meeting_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),
      title:meeting.title||('Reunião com '+(lead.empresa||lead.nome||'lead')),
      leadNome:lead.nome||lead.empresa||'',leadId:lead.id||'',
      data:meeting.date,hora:meeting.time||'10:00',duracao:Number(meeting.duration||30),
      tipo:'Reunião',prioridade:lead.prioridade||'Média',
      notas:meeting.notes||'Reunião criada a partir do resultado de uma ligação.',
      objetivo:meeting.objective||'Avançar a oportunidade e definir próximos passos.',status:'pendente',agenda:'Comercial',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
    };
    try{if(W.CRMV64Agenda?.addEvent)return W.CRMV64Agenda.addEvent(event,{syncLead:false,silent:true})}catch(e){console.warn('[CRM V98.6] Agenda API indisponível',e)}
    const events=read(AGENDA_KEY,[]);events.push(event);write(AGENDA_KEY,events);return event;
  }
  function removeAgendaEvent(id){
    if(!id)return;
    try{if(W.CRMV64Agenda?.deleteEvent){W.CRMV64Agenda.deleteEvent(id);return}}catch(e){}
    write(AGENDA_KEY,(read(AGENDA_KEY,[])||[]).filter(e=>e.id!==id));
  }

  const OUTCOMES={
    'Não atendeu':{key:'noanswer',pipeline:null,action:'Retomar contato no horário agendado'},
    'Atendeu':{key:'answered',pipeline:'contact',onlyFrom:'lead',action:'Dar sequência à qualificação'},
    'Pediu retorno':{key:'return',pipeline:null,action:'Retornar no horário combinado'},
    'Interessado':{key:'interested',pipeline:'proposal',action:'Acompanhar interesse e preparar proposta'},
    'Marcou reunião':{key:'meeting',pipeline:'contact',onlyFrom:'lead',action:'Preparar a reunião e confirmar presença'},
    'Proposta enviada':{key:'proposal',pipeline:'proposal',action:'Acompanhar proposta e decisão'},
    'Reativação':{key:'reactivate',pipeline:null,action:'Retomar relacionamento'}
  };
  function applyOutcome({lead,result,schedule={},meeting=null,source='CRM'}={}){
    const cfg=OUTCOMES[result]||OUTCOMES[String(result||'')]||{key:norm(result),pipeline:null,action:'Definir próximo passo'};
    let pipelineResult=null;
    if(cfg.pipeline){
      const current=resolveStage(lead,{create:true});
      if(!cfg.onlyFrom||current?.role===cfg.onlyFrom)pipelineResult=assignStage(lead,cfg.pipeline);
    }
    const follow=applyFollowup(lead,cfg.key,Object.assign({action:schedule.action||cfg.action},schedule));
    let agendaEvent=null;
    if(cfg.key==='meeting'&&meeting)agendaEvent=addAgendaEvent(lead,meeting);
    lead.lastOutcomeKey=cfg.key;lead.lastOutcomeSource=source;lead.lastOutcomeAt=new Date().toISOString();
    return {lead,cfg,pipeline:pipelineResult,followup:follow,agendaEvent};
  }

  const readyWaiters=[];
  function resolveReady(api){while(readyWaiters.length){const w=readyWaiters.shift();clearTimeout(w.timer);w.resolve(api)}}
  D.addEventListener('crm:calls-ready',e=>resolveReady(e.detail?.api||W.CRMV984Ligacoes));
  const callsBridge={
    ready(timeout=3500){
      if(W.CRMV984Ligacoes?.openLead)return Promise.resolve(W.CRMV984Ligacoes);
      return new Promise((resolve,reject)=>{const item={resolve,reject,timer:setTimeout(()=>{const i=readyWaiters.indexOf(item);if(i>=0)readyWaiters.splice(i,1);reject(new Error('Módulo de Ligações não ficou pronto a tempo.'))},timeout)};readyWaiters.push(item)});
    },
    async openLead(id,options={}){
      try{W.setView?.('ligacoes')}catch(e){}
      const api=await this.ready();return api.openLead(id,options);
    }
  };

  W.CRMStageRegistry={version:'98.6',getStages,saveStages,normalizeStage,resolveStage,findByRole,assignStage,migrateLeads,isOpenLead,isTerminalLead,phoneInfo};
  W.CRMOutcomeRules={version:'98.6',apply:applyOutcome,followStageFor,applyFollowup,addAgendaEvent,removeAgendaEvent,outcomes:clone(OUTCOMES)};
  W.CRMCallsBridge=callsBridge;
})(window,document);
