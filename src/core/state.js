(function(W,D){
  'use strict';
  if(W.CRMState) return;
  W.CRMState={
    version:'V98.1',
    get currentView(){return D.querySelector('.view.active')?.id||localStorage.getItem('crm_current_view')||'inicio'},
    get activeViews(){return Array.from(D.querySelectorAll('.view.active')).map(v=>v.id)},
    snapshot(){return {version:this.version,currentView:this.currentView,activeViews:this.activeViews,at:new Date().toISOString()}}
  };
})(window,document);
