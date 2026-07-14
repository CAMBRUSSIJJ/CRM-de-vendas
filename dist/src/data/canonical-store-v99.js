/* CRM V99.0 — repositório canônico de leads sem sobrescrever Storage.prototype. */
(function(W,D){
  'use strict';
  if(W.CRMCanonicalStore?.version==='V99.0')return;
  const CANONICAL='crm_v99_leads';
  const ALIASES=Object.freeze(['outbounder_leads_v5','crm_v62_leads','crm_v94_leads','crm_leads','leads','realtalent_leads']);
  const clone=v=>{try{return structuredClone(v)}catch(_){return JSON.parse(JSON.stringify(v))}};
  const parse=(raw,fb)=>{try{return raw==null?fb:JSON.parse(raw)}catch(_){return fb}};
  const text=v=>String(v??'').trim();
  const digits=v=>text(v).replace(/\D/g,'');
  const norm=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const hash=input=>{let h=2166136261;for(const c of String(input)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)};
  const updated=l=>Date.parse(l?.updatedAt||l?.ultimaAtualizacao||l?.dataEntrada||l?.criadoEm||0)||0;
  const quality=l=>Object.values(l||{}).reduce((n,v)=>n+(v!==''&&v!=null&&!(Array.isArray(v)&&!v.length)?1:0),0);
  function stableId(l,i=0){if(l?.id||l?.leadId)return text(l.id||l.leadId);return 'lead_'+hash([digits(l?.telefone||l?.phone),norm(l?.email),norm(l?.empresa||l?.nome||l?.name),i].join('|'))}
  function normalizeLead(input,i=0){
    const l=Object.assign({},input||{});l.id=stableId(l,i);l.empresa=text(l.empresa||l.nome||l.name)||'Lead sem empresa';l.nome=text(l.nome||l.empresa||l.name)||l.empresa;l.telefone=text(l.telefone||l.phone||l.whatsapp);l.email=text(l.email);l.cidade=text(l.cidade||l.city);l.segmento=text(l.segmento||l.segment)||'Comercial';l.origem=text(l.origem||l.origin)||'CRM';l.campanha=text(l.campanha);l.responsavel=text(l.responsavel)||'Você';l.prioridade=text(l.prioridade)||'Média';l.valor=Number(l.valor||l.ticket||0)||0;l.pipeline=text(l.pipeline||l.etapa||l.stage)||'Lead';l.etapa=l.pipeline;l.followup=text(l.followup||l.followupStage||l.etapaFollowup)||'Primeiro contato';l.proximaData=text(l.proximaData||l.nextDate||l.followupData||( /^\d{4}-\d{2}-\d{2}/.test(text(l.followup))?l.followup:''));l.proximaHora=text(l.proximaHora||l.nextTime)||'10:00';l.contatos=Number(l.contatos||l.tentativas||0)||0;l.ligacoes=Number(l.ligacoes||0)||0;l.whatsapps=Number(l.whatsapps||0)||0;l.historico=Array.isArray(l.historico)?l.historico:(Array.isArray(l.history)?l.history:[]);l.tags=Array.isArray(l.tags)?l.tags:text(l.tags||l.tag).split(',').map(x=>x.trim()).filter(Boolean);l.ultimaAtualizacao=text(l.ultimaAtualizacao||l.updatedAt||l.dataEntrada||l.criadoEm)||new Date().toISOString().slice(0,10);
    try{const stage=W.CRMStageRegistry?.resolveStage?.(l,{create:true});if(stage){l.pipelineStageId=stage.id;l.pipeline=stage.name;l.etapa=stage.name;l.pipelineType=stage.type;l.pipelineRole=stage.role;l.probabilidade=Number(l.probabilidade??stage.prob)||0}}catch(_){ }
    return l;
  }
  function identity(l){const p=digits(l.telefone||l.phone);if(p.length>=8)return'p:'+p;const e=norm(l.email);if(e)return'e:'+e;return'n:'+norm(l.empresa||l.nome)+'|'+norm(l.cidade)}
  function mergeRecord(a,b){const newer=updated(b)>=updated(a)?b:a,older=newer===b?a:b,out=Object.assign({},older,newer);for(const[k,v]of Object.entries(older||{})){const current=out[k];if((current===''||current==null||(Array.isArray(current)&&!current.length))&&(v!==''&&v!=null))out[k]=clone(v)}const history=[...(Array.isArray(a?.historico)?a.historico:[]),...(Array.isArray(b?.historico)?b.historico:[])],seen=new Set();out.historico=history.filter(h=>{const k=text(h?.id)||[h?.tipo,h?.resultado,h?.data,h?.hora].join('|');if(seen.has(k))return false;seen.add(k);return true});out.tags=[...new Set([...(Array.isArray(a?.tags)?a.tags:[]),...(Array.isArray(b?.tags)?b.tags:[])].map(text).filter(Boolean))];return quality(out)>=quality(newer)?out:newer}
  function rawList(key){const list=parse(localStorage.getItem(key),[]);return Array.isArray(list)?list:[]}
  function migrate(){const sources=[CANONICAL,...ALIASES].map(rawList).filter(x=>x.length),map=new Map();let order=0;for(const list of sources)for(const raw of list){const lead=normalizeLead(raw,order++),key=identity(lead);map.set(key,map.has(key)?mergeRecord(map.get(key),lead):lead)}const list=[...map.values()].map(normalizeLead);return persist(list,'migration',{emit:false})}
  function mirror(raw){ALIASES.forEach(key=>localStorage.setItem(key,raw))}
  function persist(list,source='canonical-store',{emit=true}={}){const normalized=(Array.isArray(list)?list:[]).map(normalizeLead);try{W.CRMStageRegistry?.migrateLeads?.(normalized)}catch(_){ }const raw=JSON.stringify(normalized);localStorage.setItem(CANONICAL,raw);mirror(raw);if(emit){const detail={source,total:normalized.length,canonicalKey:CANONICAL,version:'V99.0'};try{D.dispatchEvent(new CustomEvent('crm:leads-updated',{detail}));D.dispatchEvent(new CustomEvent('crm:datachange',{detail}));W.CRMEventHub?.emit?.('crm:leads-saved',detail)}catch(_){ }}return normalized}
  function getLeads(){const list=rawList(CANONICAL);return(list.length||localStorage.getItem(CANONICAL)!==null?list:migrate()).map(normalizeLead)}
  function updateLead(id,changes,source='canonical-store'){const list=getLeads(),index=list.findIndex(l=>String(l.id)===String(id));if(index<0)return null;const current=clone(list[index]),next=typeof changes==='function'?(changes(current)||current):Object.assign({},current,changes||{});list[index]=normalizeLead(next,index);persist(list,source);return clone(list[index])}
  function upsertLead(lead,source='canonical-store'){const list=getLeads(),item=normalizeLead(lead,list.length),key=identity(item),index=list.findIndex(l=>l.id===item.id||identity(l)===key);if(index>=0)list[index]=mergeRecord(list[index],item);else list.push(item);const saved=persist(list,source);return clone(index>=0?saved[index]:saved[saved.length-1])}
  function deleteLead(id,source='canonical-store'){const list=getLeads(),next=list.filter(l=>String(l.id)!==String(id));if(next.length===list.length)return false;persist(next,source);return true}
  const api=Object.freeze({version:'V99.0',canonicalKey:CANONICAL,aliases:ALIASES,getLeads,saveLeads:(list,source)=>persist(list,source),updateLead,upsertLead,deleteLead,normalizeLead,consolidate:migrate,identity});
  W.CRMCanonicalStore=api;
  W.CRMData=Object.freeze({version:'V99.0',leads:Object.freeze({all:getLeads,save:api.saveLeads,update:updateLead,upsert:upsertLead,remove:deleteLead,normalize:normalizeLead})});
  Object.assign(W.CRMStore||{}, {version:'V99.0',mode:'local-canonical',getLeadsSync:getLeads,saveLeadsSync:api.saveLeads,updateLeadSync:updateLead,upsertLeadSync:upsertLead,deleteLeadSync:deleteLead});
  migrate();
})(window,document);
