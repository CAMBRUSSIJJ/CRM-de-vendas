(function(W,D){
  'use strict';
  D.title='RealTalent CRM';
  D.body?.classList.add('crm-v987-premium');
  const project={
    version:'V99.0 Núcleo Modular e Supabase Ready',
    architecture:'classic-modular',
    storage:'local-compatible',
    bootedAt:new Date().toISOString(),
    health(){
      const active=Array.from(D.querySelectorAll('.view.active')).map(v=>v.id);
      return {ok:active.length<=1,activeViews:active,store:W.CRMStore?.mode||'unknown'};
    }
  };
  W.CRMProject=Object.freeze(project);
  try{D.dispatchEvent(new CustomEvent('crm:project-ready',{detail:project.health()}))}catch(_){ }
})(window,document);
