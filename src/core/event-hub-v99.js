/* CRM V99.0 — barramento explícito de eventos comerciais. */
(function(W,D){
  'use strict';
  if(W.CRMEventHub) return;
  const listeners=new Map();
  const aliases=Object.freeze({
    'crm:call-result-recorded':'call_registered',
    'crm:call-no-answer':'call_result_no_answer',
    'crm:call-answered':'call_result_answered',
    'crm:call-callback':'call_result_callback',
    'crm:pipeline-stage-changed':'pipeline_changed',
    'crm:pipeline-proposal':'pipeline_changed_to_proposal',
    'crm:pipeline-won':'pipeline_won',
    'crm:pipeline-lost':'pipeline_lost',
    'crm:lead-created':'lead_created',
    'crm:lead-updated':'lead_updated',
    'crm:garimpo-lead-saved':'lead_saved_from_garimpo'
  });
  function on(type,handler){if(typeof handler!=='function')return()=>{};const set=listeners.get(type)||new Set();set.add(handler);listeners.set(type,set);return()=>off(type,handler)}
  function off(type,handler){const set=listeners.get(type);if(!set)return;set.delete(handler);if(!set.size)listeners.delete(type)}
  function emit(type,payload={}){
    const detail=Object.freeze({type,payload,at:new Date().toISOString()});
    try{D.dispatchEvent(new CustomEvent(type,{detail}));D.dispatchEvent(new CustomEvent('crm:event',{detail}))}catch(_){ }
    const set=listeners.get(type);if(set)for(const fn of [...set]){try{fn(payload,detail)}catch(err){console.error('[CRM EventHub]',type,err)}}
    const automationType=aliases[type];
    if(automationType){try{W.CRMV952RuleEngine?.emit?.(automationType,payload)}catch(err){console.warn('[CRM EventHub] automação não processou',automationType,err)}}
    return detail;
  }
  W.CRMEventHub=Object.freeze({version:'V99.0',on,off,emit,aliases});
})(window,document);
