/* Script original 16 */
(function(){
  'use strict';
  if(window.__crmFunilV28Stability) return;
  window.__crmFunilV28Stability = true;
  const $=(q,r=document)=>r.querySelector(q);
  const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));

  function markButtonLabel(){
    const page=$('#funil');
    if(!page) return;
    const bar=page.querySelector('.v27-viewbar-title b');
    if(bar) bar.textContent='Botão de mudar visualização do funil';
    const subtitle=page.querySelector('.v27-viewbar-title span');
    if(subtitle) subtitle.textContent='Troque entre Funil interativo, Visão limpa, Comparativo e Perdas sem recarregar a aba.';
    const actions=page.querySelector('.v27-actions');
    if(actions && !page.querySelector('#v28ToggleVisual')){
      actions.insertAdjacentHTML('afterbegin','<button class="btn btn-sm btn-primary" type="button" id="v28ToggleVisual">Mudar visualização</button>');
    }
  }

  function renderStable(){
    const page=$('#funil');
    if(!page) return;
    if(typeof window.renderFunilPage==='function'){
      try{ window.renderFunilPage(); }catch(e){ console.warn('Funil v28:', e); }
    }
    markButtonLabel();
    page.classList.add('funil-v27');
    if(page.classList.contains('active')) page.style.display='grid';
  }

  function activateFunil(){
    const page=$('#funil');
    if(!page) return;
    document.querySelectorAll('.view').forEach(v=>{
      if(v.id==='chat') v.classList.remove('active');
      else v.classList.toggle('active', v.id==='funil');
      if(v.id!=='funil' && v.id!=='chat') v.style.display='';
    });
    page.classList.add('active','grid-view','funil-v27');
    page.style.display='grid';
    const title=$('#topbarTitle'), sub=$('#topbarSub');
    if(title) title.textContent='Funil de vendas';
    if(sub) sub.textContent='Conversão, forecast, comparativo mensal e motivos de perda';
    document.querySelectorAll('[data-view],[data-go],[data-go-view]').forEach(el=>{
      const v=el.dataset.view||el.dataset.go||el.dataset.goView;
      el.classList.toggle('active', v==='funil');
    });
    renderStable();
  }

  function patchSetView(){
    const old=window.setView;
    if(typeof old==='function' && !old.__funilV28Stable){
      const wrapped=function(view){
        if(view==='funil'){
          activateFunil();
          return;
        }
        const out=old.apply(this,arguments);
        const page=$('#funil');
        if(page && view!=='funil') page.style.display='';
        return out;
      };
      wrapped.__funilV28Stable=true;
      window.setView=wrapped;
      try{ setView=wrapped; }catch(e){}
    }
  }

  function bind(){
    document.addEventListener('click',function(e){
      const btn=e.target.closest('[data-view="funil"],[data-go="funil"],[data-go-view="funil"]');
      if(!btn) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      activateFunil();
    },true);

    document.addEventListener('click',function(e){
      const quick=e.target.closest('#v28ToggleVisual');
      if(quick){
        e.preventDefault();
        const page=$('#funil');
        if(page){
          const order=['funnel','clean','compare','losses'];
          const current=page.dataset.v27Mode||localStorage.getItem('crm_funil_v27_mode')||'funnel';
          const next=order[(Math.max(0,order.indexOf(current))+1)%order.length];
          page.dataset.v27Mode=next;
          try{localStorage.setItem('crm_funil_v27_mode',next)}catch(_){ }
          $$('#funil [data-v27-mode]').forEach(b=>b.classList.toggle('active',b.dataset.v27Mode===next));
        }
        return;
      }
      const modeBtn=e.target.closest('#funil [data-v27-mode]');
      if(modeBtn){
        const page=$('#funil');
        if(page){
          page.dataset.v27Mode=modeBtn.dataset.v27Mode;
          try{localStorage.setItem('crm_funil_v27_mode',modeBtn.dataset.v27Mode)}catch(_){ }
          $$('#funil [data-v27-mode]').forEach(b=>b.classList.toggle('active',b===modeBtn));
        }
      }
    },true);
  }

  function init(){
    patchSetView();
    bind();
    const page=$('#funil');
    if(page && page.classList.contains('active')) renderStable();
    setTimeout(()=>{patchSetView(); if($('#funil.active')) renderStable();},120);
    setTimeout(()=>{patchSetView(); if($('#funil.active')) renderStable();},360);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
