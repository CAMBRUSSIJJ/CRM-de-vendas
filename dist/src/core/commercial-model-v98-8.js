/* CRM V99.0 — modelo comercial central: estágio, tipo, papel e sincronização da base. */
(function(W,D){
  'use strict';
  if(W.CRMCommercialModel) return;
  const store=()=>W.CRMData?.leads?{getLeads:W.CRMData.leads.all,saveLeads:W.CRMData.leads.save,updateLead:W.CRMData.leads.update,normalizeLead:W.CRMData.leads.normalize}:W.CRMCanonicalStore;
  const clone=v=>{try{return structuredClone(v)}catch(_){return JSON.parse(JSON.stringify(v))}};
  const legacyGetter=typeof W.crmGetLeads==='function'?W.crmGetLeads:null;
  let legacyArray=null;try{const v=legacyGetter?.();if(Array.isArray(v))legacyArray=v}catch(_){ }

  function stage(leadOrRef){return W.CRMStageRegistry?.resolveStage?.(leadOrRef,{create:true})||null}
  function role(leadOrRef){return stage(leadOrRef)?.role||'custom'}
  function type(leadOrRef){return stage(leadOrRef)?.type||'open'}
  function hasRole(leadOrRef,wanted){return role(leadOrRef)===wanted}
  function hasType(leadOrRef,wanted){return type(leadOrRef)===wanted}
  function isOpen(l){return hasType(l,'open')}
  function isWon(l){return hasType(l,'won')}
  function isLost(l){return hasType(l,'lost')}
  function isProposal(l){return hasRole(l,'proposal')||(!isWon(l)&&!isLost(l)&&Number(stage(l)?.prob||0)>=50)}
  function assign(lead,ref,opts){const result=W.CRMStageRegistry?.assignStage?.(lead,ref,opts||{});if(result?.stage){lead.pipelineType=result.stage.type;lead.pipelineRole=result.stage.role}return result}
  function normalize(list){const arr=(Array.isArray(list)?list:[]).map((l,i)=>store().normalizeLead(l,i));W.CRMStageRegistry?.migrateLeads?.(arr);arr.forEach(l=>{const s=stage(l);if(s){l.pipelineStageId=s.id;l.pipeline=s.name;l.etapa=s.name;l.pipelineType=s.type;l.pipelineRole=s.role;l.probabilidade=Number(l.probabilidade??s.prob)||0}});return arr}
  function syncLegacy(list){
    if(!Array.isArray(legacyArray))return;
    legacyArray.splice(0,legacyArray.length,...list.map(clone));
  }
  function getLeads(){const list=normalize(store().getLeads());syncLegacy(list);return list}
  function saveLeads(list,source='commercial-model'){const saved=store().saveLeads(normalize(list),source);syncLegacy(saved);return saved}
  function updateLead(id,changes,source='commercial-model'){const item=store().updateLead(id,changes,source);syncLegacy(store().getLeads());return item}
  function countByRole(list,wanted){return (list||getLeads()).filter(l=>hasRole(l,wanted)).length}
  function countByType(list,wanted){return (list||getLeads()).filter(l=>hasType(l,wanted)).length}
  function valueByType(list,wanted){return (list||getLeads()).filter(l=>hasType(l,wanted)).reduce((s,l)=>s+Number(l.valor||0),0)}

  W.CRMCommercialModel=Object.freeze({version:'V99.0',stage,role,type,hasRole,hasType,isOpen,isWon,isLost,isProposal,assign,normalize,getLeads,saveLeads,updateLead,countByRole,countByType,valueByType});
  W.crmGetLeads=getLeads;
  W.crmSaveLeads=function(list){return saveLeads(Array.isArray(list)?list:(Array.isArray(legacyArray)?legacyArray:getLeads()),'crmSaveLeads')};
  W.crmStageOf=stage;W.crmIsOpenLead=isOpen;W.crmIsWonLead=isWon;W.crmIsLostLead=isLost;W.crmIsProposalLead=isProposal;

  let syncing=false;
  D.addEventListener('crm:leads-updated',function(){if(syncing)return;syncing=true;try{const list=normalize(store().getLeads());store().saveLeads(list,'stage-migration');syncLegacy(list)}finally{queueMicrotask(()=>syncing=false)} });
  const canonicalAtBoot=store().getLeads();
  const bootLeads=canonicalAtBoot.length?canonicalAtBoot:(Array.isArray(legacyArray)?legacyArray:[]);
  saveLeads(bootLeads,'v99-boot-migration');
})(window,document);
