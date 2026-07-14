/* Configuração opcional de implantação. Use somente Project URL e publishable/anon key. */
(function(W){
  'use strict';
  const defaults={url:'',publishableKey:'',tenantId:'',table:'crm_records',remember:true,autoConnect:false,autoSync:false};
  const incoming=W.__CRM_SUPABASE_CONFIG__||{};
  const tenantId=String(incoming.tenantId||incoming.workspaceId||defaults.tenantId).trim();
  W.__CRM_SUPABASE_CONFIG__=Object.freeze(Object.assign({},defaults,incoming,{tenantId,workspaceId:tenantId}));
})(window);
