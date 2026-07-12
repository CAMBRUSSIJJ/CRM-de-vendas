(function(){
  'use strict';
  const VERSION = 'V97.1 Boot/Botões';
  function $(s,r){ return (r||document).querySelector(s); }
  function $$(s,r){ return Array.from((r||document).querySelectorAll(s)); }
  function visible(view){
    $$('.view').forEach(v => v.classList.toggle('active', v.id === view));
    $$('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    try { localStorage.setItem('crm_current_view', view); } catch(e) {}
  }
  function safeRender(view){
    try {
      if(view === 'automacoes' && window.CRMV954Notifications && typeof window.CRMV954Notifications.patchAutomationsPage === 'function') window.CRMV954Notifications.patchAutomationsPage();
      if(view === 'cadencias' && window.CRMV92FollowupActive && typeof window.CRMV92FollowupActive.render === 'function') window.CRMV92FollowupActive.render();
      if(view === 'ligacoes' && window.CRMV914LigacoesPolished && typeof window.CRMV914LigacoesPolished.render === 'function') window.CRMV914LigacoesPolished.render();
      if(view === 'garimpo' && window.CRMV93Garimpo && typeof window.CRMV93Garimpo.render === 'function') window.CRMV93Garimpo.render();
      if(view === 'playbooks' && window.CRMV94Playbooks && typeof window.CRMV94Playbooks.render === 'function') window.CRMV94Playbooks.render();
      if(view === 'metricas' && window.CRMV94Metricas && typeof window.CRMV94Metricas.render === 'function') window.CRMV94Metricas.render();
    } catch(e) { console.warn('[V97.1] render seguro falhou em', view, e); }
  }
  function bindNav(){
    if(window.__crmV971NavBound) return;
    window.__crmV971NavBound = true;
    document.addEventListener('click', function(e){
      const btn = e.target && e.target.closest && e.target.closest('[data-view]');
      if(!btn) return;
      const view = btn.dataset.view;
      const sec = document.getElementById(view);
      if(!sec) return;
      // não bloqueia outros handlers; apenas garante navegação mínima caso o handler antigo falhe
      setTimeout(function(){
        const active = document.querySelector('.view.active');
        if(!active || active.id !== view) visible(view);
        safeRender(view);
      }, 0);
    }, false);
  }
  function removeStuckLoading(){
    $$('.view').forEach(sec => {
      const txt = (sec.textContent || '').trim().toLowerCase();
      if(sec.classList.contains('active') && txt && /^carregando( módulo)?/.test(txt)) {
        sec.innerHTML = '<section class="card"><h2>Módulo pronto para recarregar</h2><p>O carregamento antigo foi interrompido pela correção V97.1. Clique novamente na aba ou use o botão abaixo.</p><button class="btn primary" type="button" data-view="'+sec.id+'">Recarregar módulo</button></section>';
      }
    });
  }
  function health(){
    bindNav();
    removeStuckLoading();
    window.CRMV971Health = {
      version: VERSION,
      active: document.querySelector('.view.active') && document.querySelector('.view.active').id,
      hasAgEvents: typeof window.agEvents !== 'undefined',
      hasPlaybooks: typeof window.playbooks !== 'undefined',
      stopImmediateBlocksRemoved: true,
      v954ObserverRemoved: true
    };
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', health, {once:true}); else health();
  setTimeout(health, 800);
})();
