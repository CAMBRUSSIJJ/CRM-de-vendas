(function(){
  'use strict';
  if(window.__CRM_V932_FOLLOWUP_VISIBLE_GUARD__) return;
  window.__CRM_V932_FOLLOWUP_VISIBLE_GUARD__=true;
  const OFFICIAL=['garimpo','ligacoes','cadencias'];
  function followSection(){return document.getElementById('cadencias');}
  function renderFollow(){
    const sec=followSection();
    if(!sec) return;
    sec.classList.remove('v82-followups-section','v91-followup-section');
    sec.classList.add('v92-followup-view');
    try{
      if(window.CRMV92FollowupActive && typeof window.CRMV92FollowupActive.render==='function'){
        window.CRMV92FollowupActive.render();
      }else if(window.CRMV921FollowupClean && typeof window.CRMV921FollowupClean.render==='function'){
        window.CRMV921FollowupClean.render();
      }else{
        sec.innerHTML='<div class="v92-shell"><div class="v92-hero"><div><span class="v92-eyebrow">Follow-up</span><h2>Follow-ups e Relacionamento</h2><p>O motor do Follow-up ainda não carregou. Recarregue a página ou abra o HTML standalone atualizado.</p></div></div></div>';
      }
    }catch(e){
      console.warn('V93.2: falha ao renderizar Follow-up',e);
    }
  }
  function guard(){
    const sec=followSection();
    if(sec && sec.classList.contains('active') && !(sec.textContent||'').trim()) renderFollow();
  }
  const previousSetView=window.setView;
  window.setView=function(view){
    if(String(view)==='cadencias'){
      if(window.CRMV93Official && typeof window.CRMV93Official.route==='function') window.CRMV93Official.route('cadencias');
      else renderFollow();
      setTimeout(renderFollow,60);setTimeout(guard,240);
      return;
    }
    if(OFFICIAL.includes(String(view)) && window.CRMV93Official && typeof window.CRMV93Official.route==='function'){
      window.CRMV93Official.route(String(view));return;
    }
    if(typeof previousSetView==='function') return previousSetView.apply(this,arguments);
  };
  try{setView=window.setView}catch(e){}
  document.addEventListener('click',function(e){
    const btn=e.target.closest('[data-view="cadencias"],[data-go="cadencias"],[data-go-view="cadencias"],[data-v69-go="cadencias"],[data-v68-go="cadencias"],[data-ux-go="cadencias"],a[href="#cadencias"]');
    if(!btn) return;
    setTimeout(renderFollow,40);
    setTimeout(guard,220);
  },true);
  document.addEventListener('DOMContentLoaded',function(){
    const sec=followSection();
    if(sec){sec.classList.add('v92-followup-view');}
    if(sec && sec.classList.contains('active')) renderFollow();
    setTimeout(guard,300);setTimeout(guard,900);
  });
  window.CRMV932FollowupRepair={render:renderFollow,guard:guard};
})();
