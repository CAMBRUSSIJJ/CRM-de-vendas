/* Script original 07 */
(function(){
  'use strict';
  if(window.__crmVisibilityHotfixV8) return;
  window.__crmVisibilityHotfixV8 = true;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function forceVisibility(activeView){
    $$('.view').forEach(el=>{
      if(el.id==='chat') return;
      if(el.id===activeView){el.classList.add('active');el.style.display='';}
      else{el.classList.remove('active');el.style.display=(el.classList.contains('funnel-shell')||el.classList.contains('gar-shell'))?'none':'';}
    });
  }
  const previousSetView=window.setView || (typeof setView==='function'?setView:null);
  window.setView=function(view){
    if(typeof previousSetView==='function') previousSetView(view);
    if(view && view!=='chat' && view!=='novo-lead') forceVisibility(view);
    if(view==='garimpo'){
      $('#topbarTitle') && ($('#topbarTitle').textContent='Garimpo de Leads');
      $('#topbarSub') && ($('#topbarSub').textContent='Prospecção inteligente, scoring e criação rápida de oportunidades');
      setTimeout(()=>{try{window.renderGarimpoLeadsV7&&window.renderGarimpoLeadsV7()}catch(e){}},30);
    }
    if(view==='funil'){
      $('#topbarTitle') && ($('#topbarTitle').textContent='Funil de vendas');
      $('#topbarSub') && ($('#topbarSub').textContent='Etapas, conversão, forecast e gargalos por lead');
      setTimeout(()=>{try{window.renderFunilPage&&window.renderFunilPage()}catch(e){}},30);
    }
  };
  try{setView=window.setView;}catch(e){}
  document.addEventListener('click',function(e){
    const btn=e.target.closest('[data-view],[data-go],[data-go-view]');
    if(!btn) return;
    const view=btn.dataset.view||btn.dataset.go||btn.dataset.goView;
    if(!view || view==='novo-lead') return;
    if(view==='chat' || document.getElementById(view)) setTimeout(()=>forceVisibility(view),0);
  },true);
  const current=$('.view.active');
  if(current && current.id) forceVisibility(current.id);
})();
