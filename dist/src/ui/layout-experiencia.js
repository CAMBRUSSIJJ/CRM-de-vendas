/* EMBED: assets/js/modules/36-layout-experiencia-visual-v72.js */
/* V72 — Layout e Experiência Visual
   Polimento não destrutivo: adiciona classes, wraps de tabela e microinterações. */
(function(){
  if(window.__crmV72LayoutExperience) return;
  window.__crmV72LayoutExperience=true;

  const VERSION='v72';
  const TABLE_SELECTOR='table.data-table, table.v65-pipe-table, table.v6-table';
  const EMPTY_SELECTOR='.crm-empty,.fu-empty,.v64-empty,.v65-empty-col,.v67-empty,.v68-empty,.v69-empty';
  let enhanceTimer=null;

  const $=(sel,root=document)=>root.querySelector(sel);
  const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));

  function activeView(){
    const active=$('.view.active');
    return active ? active.id : (document.body && document.body.dataset.currentView) || 'inicio';
  }

  function addVersionBadge(){
    if($('#crmV72VisualBadge')) return;
    const actions=$('.topbar-actions') || $('.topbar');
    if(!actions) return;
    const badge=document.createElement('span');
    badge.id='crmV72VisualBadge';
    badge.className='crm-v70-badge crm-v72-visual-badge';
    badge.textContent='V72 · visual';
    badge.title='Layout e experiência visual ativos';
    actions.appendChild(badge);
  }

  function wrapTables(root=document){
    $$(TABLE_SELECTOR,root).forEach(table=>{
      if(table.closest('.crm-v72-table-shell')) return;
      if(table.closest('.chart') || table.closest('svg')) return;
      const shell=document.createElement('div');
      shell.className='crm-v72-table-shell';
      table.parentNode.insertBefore(shell,table);
      shell.appendChild(table);
    });
  }

  function decorateEmptyStates(root=document){
    $$(EMPTY_SELECTOR,root).forEach(el=>{
      if(el.dataset.v72Empty) return;
      el.dataset.v72Empty='1';
      const text=(el.textContent||'').trim();
      if(!text) return;
      const isTableCell=el.tagName==='TD' || el.tagName==='TH';
      if(isTableCell) return;
      if(el.querySelector('.crm-v72-empty-icon')) return;
      const icon=document.createElement('span');
      icon.className='crm-v72-empty-icon';
      icon.textContent='•';
      el.prepend(icon);
    });
  }

  function normalizeActionGroups(root=document){
    $$('.section-header, .card-header, .v65-hero, .v67-hero, .v68-hero, .v69-hero',root).forEach(box=>{
      if(box.dataset.v72Header) return;
      box.dataset.v72Header='1';
      const buttons=$$('button,.btn,a[role="button"]',box);
      if(buttons.length>=2){
        const last=buttons[buttons.length-1].parentElement;
        if(last && last!==box) last.classList.add('crm-v72-action-row');
      }
    });
  }

  function addMicroInteractions(){
    if(document.body.dataset.v72Press) return;
    document.body.dataset.v72Press='1';
    document.addEventListener('click',ev=>{
      const btn=ev.target.closest('button,.btn,.nav-item,.tab,.deal-card,.v65-pipe-card,.v63-lead-card');
      if(!btn || btn.disabled) return;
      btn.classList.remove('crm-v72-press');
      void btn.offsetWidth;
      btn.classList.add('crm-v72-press');
      window.setTimeout(()=>btn.classList.remove('crm-v72-press'),300);
    },true);
  }

  function markView(){
    document.body.dataset.currentView=activeView();
  }

  function enhance(root=document){
    try{
      document.documentElement.classList.add('crm-ready');
      document.body.classList.add('crm-ready','crm-v72');
      markView();
      addVersionBadge();
      wrapTables(root);
      decorateEmptyStates(root);
      normalizeActionGroups(root);
      addMicroInteractions();
      window.dispatchEvent(new CustomEvent('crm:v72-enhanced',{detail:{view:activeView()}}));
    }catch(err){
      console.warn('[CRM V72] Falha ao aplicar polimento visual',err);
    }
  }

  function schedule(root=document){
    clearTimeout(enhanceTimer);
    enhanceTimer=setTimeout(()=>enhance(root),80);
  }

  function observeViews(){ /* V97.1: observer v72 desativado para evitar loop; schedule manual no boot/setView. */ const main=$('.main')||document.body; if(main) schedule(main); }

  function patchSetView(){
    try{
      const old=window.setView;
      if(typeof old==='function' && !old.__v72Visual){
        const wrapped=function(view){
          const out=old.apply(this,arguments);
          document.body.dataset.currentView=view || activeView();
          schedule(document);
          return out;
        };
        wrapped.__v72Visual=true;
        window.setView=wrapped;
        try{ setView=wrapped; }catch(e){}
      }
    }catch(e){}
  }

  function boot(){
    enhance(document);
    observeViews();
    patchSetView();
    window.addEventListener('crm:settings-updated',()=>schedule(document));
    window.addEventListener('crm:datachange',()=>schedule(document));
    window.addEventListener('crm:tab-rendered',()=>schedule(document));
    setTimeout(()=>schedule(document),500);
  }

  window.CRMV72Experience={
    version:VERSION,
    refresh:()=>enhance(document),
    report:()=>({version:VERSION,activeView:activeView(),tablesWrapped:$$('.crm-v72-table-shell').length,emptyStates:$$('[data-v72-empty="1"]').length,bodyClass:document.body.className})
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
