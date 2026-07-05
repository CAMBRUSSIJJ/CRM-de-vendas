/* CRM v56 — acabamento de agenda e sidebar sem botões de recolher */
(function(){
  'use strict';
  if(window.__crmV56AgendaSidebarPolido) return;
  window.__crmV56AgendaSidebarPolido = true;

  const DOC = document;
  const $ = (s,r=DOC)=>r.querySelector(s);
  const $$ = (s,r=DOC)=>Array.from(r.querySelectorAll(s));
  let hoverCloseTimer = null;
  let enhanceTimer = null;

  const iconByView = {
    inicio:'#ic-home', leads:'#ic-users', pipeline:'#ic-columns', clientes:'#ic-icon-05',
    playbooks:'#ic-book', objecoes:'#ic-icon-07', perdas:'#ic-x-circle', dashboard:'#ic-grid',
    cadencias:'#ic-trending-up', automacoes:'#ic-zap', agenda:'#ic-calendar', chat:'#ic-message-square',
    metricas:'#ic-bar-chart', importar:'#ic-upload', 'novo-lead':'#ic-plus', ligacoes:'#ic-phone',
    metas:'#ic-icon-23', configuracoes:'#ic-grid', scripts:'#ic-book', materiais:'#ic-download'
  };

  function iconSvg(ref){
    return `<svg class="v56-sub-icon" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" aria-hidden="true"><use href="${ref||'#ic-grid'}"></use></svg>`;
  }

  function labelOf(el){
    return (el?.dataset?.label || el?.getAttribute('aria-label') || el?.title || el?.textContent || '').trim().replace(/\s+/g,' ');
  }

  function removeOldSidebarControls(){
    [
      '#v55SidebarControl','#v55SidebarHandle','.v55-sidebar-control','.v55-sidebar-handle',
      '#v54SidebarGrip','#v54SidebarEdge','#v53SidebarHandle','#v52SidebarToggle','#v51SidebarToggle'
    ].forEach(sel=> $$(sel).forEach(el=>el.remove()));
    $$('[class*="chevron"],.v51-group-chevron,.crm-v49-chevron,.nav-chevron,.sidebar-chevron').forEach(el=>el.remove());
  }

  function ensureNavIcons(){
    $$('.sidebar [data-view], .sidebar .v51-subnav button, .sidebar .crm-v49-nav-sub button, .sidebar .theme-toggle').forEach(el=>{
      const view = el.dataset.view || '';
      const label = labelOf(el) || view || 'Abrir';
      const ref = iconByView[view] || iconByView[(label||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')] || '#ic-grid';
      el.dataset.v56Tooltip = label;
      if(!el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
      if(!el.title) el.title = label;
      if(!el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', iconSvg(ref));
    });
  }

  function openSidebar(){
    clearTimeout(hoverCloseTimer);
    DOC.body.classList.add('crm-v56-sidebar-open');
  }
  function closeSidebarSoon(){
    clearTimeout(hoverCloseTimer);
    hoverCloseTimer = setTimeout(()=>{
      const sidebar = $('.sidebar');
      if(!sidebar) return;
      if(sidebar.matches(':hover') || sidebar.contains(DOC.activeElement)) return;
      DOC.body.classList.remove('crm-v56-sidebar-open');
    },120);
  }

  function installSidebar(){
    DOC.body.classList.add('crm-v56');
    DOC.body.classList.remove('crm-v54-sidebar-collapsed','crm-v53-sidebar-collapsed','crm-v52-sidebar-collapsed','crm-v51-sidebar-collapsed');
    removeOldSidebarControls();
    ensureNavIcons();
    const sidebar = $('.sidebar');
    if(!sidebar || sidebar.dataset.v56HoverReady === '1') return;
    sidebar.dataset.v56HoverReady = '1';
    sidebar.addEventListener('mouseenter', openSidebar, {passive:true});
    sidebar.addEventListener('mouseleave', closeSidebarSoon, {passive:true});
    sidebar.addEventListener('focusin', openSidebar);
    sidebar.addEventListener('focusout', closeSidebarSoon);
  }

  function activeView(){
    return $('.view.active')?.id || $$('.nav-item.active,.tab.active,.crm-v49-nav-main.active,.v51-nav-main.active').find(x=>x.dataset.view)?.dataset.view || '';
  }

  function ensureBackdrop(){
    if(!$('.v56-drawer-backdrop')){
      DOC.body.insertAdjacentHTML('beforeend','<div class="v56-drawer-backdrop" aria-hidden="true"></div>');
      $('.v56-drawer-backdrop')?.addEventListener('click',()=>{
        const close = $('#v55EventDrawer [data-v55-close]');
        if(close) close.click();
      });
    }
  }

  function polishAgenda(){
    const page = $('#agenda');
    if(!page) return;
    page.classList.add('v56-agenda-polida');

    const newBtn = $('#v55NewEventBtn');
    if(newBtn && !newBtn.dataset.v56Done){
      newBtn.dataset.v56Done = '1';
      newBtn.innerHTML = '<span class="v56-plus">+</span><span>Novo compromisso</span>';
      newBtn.setAttribute('aria-label','Criar novo compromisso na agenda');
      newBtn.title = 'Criar novo compromisso';
    }

    const top = $('.v55-calendar-top');
    if(top && !$('.v56-calendar-hint', top)){
      top.insertAdjacentHTML('beforeend','<div class="v56-calendar-hint">Clique em um dia ou horário para criar compromisso.</div>');
    }

    $$('.v55-day').forEach(day=>{
      if(day.dataset.v56Polished === '1') return;
      day.dataset.v56Polished = '1';
      const date = day.dataset.v55NewDate || '';
      day.setAttribute('role','button');
      day.setAttribute('tabindex','0');
      day.setAttribute('aria-label', date ? `Criar compromisso em ${date}` : 'Criar compromisso');
      day.title = 'Clique em uma área vazia para criar compromisso';
    });

    $$('.v55-day-number').forEach(btn=>{
      btn.title = 'Abrir visualização do dia';
      btn.setAttribute('aria-label','Abrir visualização do dia');
    });

    $$('.v55-hour-slot').forEach(slot=>{
      if(slot.dataset.v56Polished === '1') return;
      slot.dataset.v56Polished = '1';
      slot.setAttribute('role','button');
      slot.setAttribute('tabindex','0');
      slot.title = 'Clique para criar compromisso neste horário';
    });
  }

  function syncDrawerState(){
    ensureBackdrop();
    const drawer = $('#v55EventDrawer');
    DOC.body.classList.toggle('v56-drawer-open', !!drawer?.classList.contains('show'));
    if(drawer?.classList.contains('show')){
      const title = $('#v55EvTitleInput');
      if(title && !drawer.dataset.v56Focused){
        drawer.dataset.v56Focused = '1';
        setTimeout(()=>title.focus({preventScroll:true}),80);
      }
    } else if(drawer) {
      drawer.dataset.v56Focused = '';
    }
  }

  function scheduleEnhance(){
    clearTimeout(enhanceTimer);
    enhanceTimer = setTimeout(()=>{
      installSidebar();
      if(activeView()==='agenda' || $('#agenda.v55-agenda-page')) polishAgenda();
      syncDrawerState();
    },60);
  }

  function bindKeyboardFallback(){
    DOC.addEventListener('keydown', e=>{
      const day = e.target?.closest?.('.v55-day[data-v55-new-date], .v55-hour-slot[data-v55-new-date]');
      if(day && (e.key==='Enter' || e.key===' ')){
        e.preventDefault();
        day.click();
      }
    }, true);
  }

  function boot(){
    DOC.body.classList.add('crm-v56');
    installSidebar();
    bindKeyboardFallback();
    scheduleEnhance();
    setTimeout(scheduleEnhance,300);
    setTimeout(scheduleEnhance,900);

    new MutationObserver(scheduleEnhance).observe(DOC.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','data-v55-official']});
    DOC.addEventListener('click',()=>setTimeout(scheduleEnhance,90),true);
    DOC.addEventListener('input',()=>setTimeout(scheduleEnhance,90),true);
  }

  if(DOC.readyState === 'loading') DOC.addEventListener('DOMContentLoaded', boot); else boot();
})();
