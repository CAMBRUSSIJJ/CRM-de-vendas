(function(){
  'use strict';
  if(window.__CRM_V921_FOLLOWUP_CLEAN_GUARD__) return;
  window.__CRM_V921_FOLLOWUP_CLEAN_GUARD__ = true;
  function clean(){
    const sec=document.getElementById('cadencias');
    if(!sec) return;
    sec.classList.remove('v82-followups-section','v91-followup-section');
    sec.classList.add('v92-followup-view');
  }
  function render(){
    clean();
    if(window.CRMV92FollowupActive && typeof window.CRMV92FollowupActive.render === 'function'){
      window.CRMV92FollowupActive.render();
    }
  }
  const oldSetView=window.setView;
  window.setView=function(view){
    const result=oldSetView?oldSetView.apply(this,arguments):undefined;
    if(view==='cadencias'){
      setTimeout(render,40);
      setTimeout(render,180);
    }
    return result;
  };
  try{ if(typeof setView!=='undefined') setView=window.setView; }catch(e){}
  document.addEventListener('click',function(e){
    const btn=e.target.closest('[data-view="cadencias"],[data-go="cadencias"],[data-v69-go="cadencias"],[data-v68-go="cadencias"],[data-ux-go="cadencias"]');
    if(btn){ setTimeout(render,50); setTimeout(render,200); }
  },true);
  document.addEventListener('DOMContentLoaded',function(){ clean(); if(document.getElementById('cadencias')?.classList.contains('active')) render(); });
  window.CRMV921FollowupClean={render,clean};
})();
