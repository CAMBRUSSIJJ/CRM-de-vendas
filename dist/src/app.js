(function(W,D){
  'use strict';
  const project={
    version:'V98.1 Modularização Estrutural',
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
