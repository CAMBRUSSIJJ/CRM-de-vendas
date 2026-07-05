/* CRM v59 — emergência: evita carregamento infinito e estabiliza sidebar sem loop */
(function(){
  'use strict';
  if(window.__CRM_V59_EMERGENCY__) return;
  window.__CRM_V59_EMERGENCY__ = true;

  const OLD_CLASSES = [
    'crm-sidebar-fixed','crm-sidebar-icons','crm-sidebar-pinned','crm-sidebar-collapsed',
    'crm-v46-sidebar-fixed','crm-v46-sidebar-icons','crm-v45-sidebar-fixed','crm-v45-sidebar-icons',
    'crm-v51-sidebar-collapsed','crm-v52-sidebar-collapsed','crm-v53-sidebar-collapsed','crm-v54-sidebar-collapsed',
    'crm-v52-sidebar-open','crm-v53-sidebar-open','crm-v56-sidebar-open','crm-v58-sidebar-auto'
  ];
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function forceReady(){
    try{
      document.documentElement.classList.add('crm-ready');
      document.body.classList.remove('loading','is-loading','app-loading');
      document.body.classList.add('crm-v59-stable','crm-ready');
      OLD_CLASSES.forEach(c => document.body.classList.remove(c));
      const app = $('#app');
      if(app){
        app.style.display = app.style.display === 'none' ? 'block' : app.style.display;
        app.style.visibility = 'visible';
        app.style.opacity = '1';
      }
      $$('.loading,.loader,.preloader,.splash,.loading-overlay,[data-loading],#loading,#loader,#preloader').forEach(el=>{
        el.style.display='none'; el.setAttribute('aria-hidden','true');
      });
    }catch(e){ console.warn('[CRM v59] forceReady', e); }
  }

  function stabilizeSidebar(){
    try{
      forceReady();
      const sidebar = $('.sidebar');
      if(!sidebar){ console.warn('[CRM v59] Sidebar não encontrada.'); return; }
      sidebar.removeAttribute('hidden');
      sidebar.setAttribute('aria-label','Navegação principal');
      ['display','visibility','opacity','transform','translate','left'].forEach(p=>sidebar.style.removeProperty(p));
      $$('.v56-sidebar-toggle,.sidebar-toggle,[data-sidebar-toggle]').forEach(el => el.remove());
      $$('.rail,.topbar-tabs').forEach(el => el.classList.add('v57-disabled-layer'));

      const iconMap = {inicio:'⌂',leads:'◉',pipeline:'▦',clientes:'◎',playbooks:'✦',objecoes:'?',perdas:'×',dashboard:'◍',cadencias:'↻',automacoes:'⚡',agenda:'□',ligacoes:'☎',chat:'✉',metricas:'▥',importar:'⚙','novo-lead':'+'};
      $$('.sidebar .nav-item').forEach(btn=>{
        const view = btn.dataset.view || '';
        const label = btn.dataset.label || btn.getAttribute('title') || btn.textContent.trim() || view || 'Menu';
        btn.setAttribute('title', label);
        btn.setAttribute('aria-label', label);
        if(!btn.querySelector('.v57-nav-icon, svg')){
          const icon=document.createElement('span');
          icon.className='v57-nav-icon';
          icon.textContent=iconMap[view] || '•';
          btn.prepend(icon);
        }
      });
    }catch(e){ console.warn('[CRM v59] stabilizeSidebar', e); }
  }

  function boot(){
    forceReady();
    stabilizeSidebar();
    // Passadas finitas: evita o loop que podia acontecer na v58 com MutationObserver.
    [80,250,700,1500].forEach(ms=>setTimeout(stabilizeSidebar,ms));
  }

  window.addEventListener('error', () => setTimeout(forceReady,0));
  window.addEventListener('unhandledrejection', () => setTimeout(forceReady,0));
  window.addEventListener('pageshow', () => setTimeout(boot,0));
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  // Failsafe: mesmo com erro em módulo antigo, libera a tela.
  setTimeout(forceReady, 2500);
})();
