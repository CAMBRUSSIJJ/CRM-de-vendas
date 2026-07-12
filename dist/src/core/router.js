(function(W){
  'use strict';
  if(W.CRMRouter) return;
  W.CRMRouter={
    go(view){if(typeof W.setView==='function')return W.setView(view);location.hash='#'+String(view||'inicio')},
    current(){return W.CRMState?.currentView||'inicio'}
  };
})(window);
