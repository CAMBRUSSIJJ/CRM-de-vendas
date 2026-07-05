/* CRM v58 — garante sidebar visível e remove classes antigas conflitantes */
(function(){
  'use strict';
  if(window.__CRM_V58_SIDEBAR_FIX__) return;
  window.__CRM_V58_SIDEBAR_FIX__ = true;

  const OLD_CLASSES = [
    'crm-sidebar-fixed','crm-sidebar-icons','crm-sidebar-pinned',
    'crm-v46-sidebar-fixed','crm-v46-sidebar-icons',
    'crm-v45-sidebar-fixed','crm-v45-sidebar-icons',
    'crm-v52-sidebar-open','crm-v53-sidebar-open','crm-v56-sidebar-open'
  ];

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function hardResetSidebar(){
    document.body.classList.add('crm-v58-sidebar-auto');
    OLD_CLASSES.forEach(c => document.body.classList.remove(c));

    const sidebar = $('.sidebar');
    if(!sidebar){
      console.warn('[CRM v58] Sidebar não encontrada no HTML.');
      return;
    }

    sidebar.removeAttribute('hidden');
    sidebar.setAttribute('aria-label','Navegação principal');
    sidebar.style.removeProperty('display');
    sidebar.style.removeProperty('visibility');
    sidebar.style.removeProperty('opacity');
    sidebar.style.removeProperty('transform');
    sidebar.style.removeProperty('translate');
    sidebar.style.removeProperty('left');

    // Remove botões antigos de abrir/fechar que podiam esconder a lateral.
    $$('.v56-sidebar-toggle,.sidebar-toggle,[data-sidebar-toggle]').forEach(el => el.remove());
    $$('.rail,.topbar-tabs').forEach(el => el.classList.add('v57-disabled-layer'));

    // Garante ícone/texto em botões que podem ter ficado vazios por scripts antigos.
    const iconMap = {
      inicio:'⌂', leads:'◉', pipeline:'▦', clientes:'◎', playbooks:'✦', objecoes:'?', perdas:'×', dashboard:'◍', cadencias:'↻', automacoes:'⚡', agenda:'□', chat:'✉', metricas:'▥', importar:'⚙', 'novo-lead':'+'
    };
    $$('.sidebar .nav-item').forEach(btn => {
      const view = btn.dataset.view || '';
      if(!btn.getAttribute('title')) btn.setAttribute('title', btn.dataset.label || btn.textContent.trim() || view || 'Menu');
      if(!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', btn.getAttribute('title'));
      const hasIcon = btn.querySelector('.v57-nav-icon, svg');
      if(!hasIcon){
        const icon = document.createElement('span');
        icon.className = 'v57-nav-icon';
        icon.textContent = iconMap[view] || '•';
        btn.prepend(icon);
      }
    });
  }

  function watchConflicts(){
    const obs = new MutationObserver(() => {
      if(!document.body.classList.contains('crm-v58-sidebar-auto')) document.body.classList.add('crm-v58-sidebar-auto');
      OLD_CLASSES.forEach(c => document.body.classList.remove(c));
    });
    obs.observe(document.body, {attributes:true, attributeFilter:['class']});
  }

  function init(){
    hardResetSidebar();
    watchConflicts();
    // Segunda passada: alguns módulos antigos alteram layout depois do DOMContentLoaded.
    setTimeout(hardResetSidebar, 100);
    setTimeout(hardResetSidebar, 600);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
