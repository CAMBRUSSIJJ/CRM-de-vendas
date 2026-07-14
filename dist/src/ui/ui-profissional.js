/* EMBED: assets/js/crm-ui-profissional.js */
/* CRM v47 — configurações, filtros globais e modo leve. Não altera seus dados. */
(function(){
  const KEY='crm_v47_ui_prefs';
  const DEFAULTS={layout:'complete',sidebar:'auto',centered:false,reducedMotion:false,lite:false,stickyFilters:false};
  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function read(){try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){return {...DEFAULTS}}}
  function write(p){localStorage.setItem(KEY,JSON.stringify(p))}
  let prefs=read();
  function cls(name,on){document.body.classList.toggle(name,!!on)}
  function apply(){
    document.body.classList.remove('crm-layout-simple','crm-layout-compact','crm-layout-focus','crm-sidebar-fixed','crm-sidebar-icons');
    if(prefs.layout==='simple')document.body.classList.add('crm-layout-simple');
    if(prefs.layout==='compact')document.body.classList.add('crm-layout-compact');
    if(prefs.layout==='focus')document.body.classList.add('crm-layout-focus');
    if(prefs.sidebar==='fixed')document.body.classList.add('crm-sidebar-fixed');
    if(prefs.sidebar==='icons')document.body.classList.add('crm-sidebar-icons');
    cls('crm-centered',prefs.centered);cls('crm-reduce-motion',prefs.reducedMotion);cls('crm-lite',prefs.lite);cls('crm-filters-sticky',prefs.stickyFilters);
    document.documentElement.dataset.crmLayout=prefs.layout;
    document.body.classList.add('crm-ui-ready');
    markActiveOptions();normalizeFilters();
  }
  function setPref(k,v){prefs={...prefs,[k]:v};write(prefs);apply();}
  function icon(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="17" height="17"><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.97 19.35a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.94a1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.08 4.17l.06.06A1.7 1.7 0 0 0 9.02 4.57 1.7 1.7 0 0 0 10.05 3V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z"/></svg>'}
  function ensureDrawer(){
    if($('#crmV47Drawer'))return;
    const backdrop=document.createElement('div');backdrop.className='crm-v47-drawer-backdrop';backdrop.id='crmV47Backdrop';
    const drawer=document.createElement('aside');drawer.className='crm-v47-drawer';drawer.id='crmV47Drawer';drawer.innerHTML=`
      <div class="crm-v47-drawer-head"><div><div class="crm-v47-drawer-title">Configurações</div><div class="crm-v47-drawer-sub">Layout, filtros, lateral e performance</div></div><button class="crm-v47-close" data-v47-close>×</button></div>
      <div class="crm-v47-section"><h4>Layout global</h4><div class="crm-v47-options" data-v47-layout>
        <button class="crm-v47-option" data-value="complete"><b>Completo</b><span>Mostra todas as informações e atalhos.</span></button>
        <button class="crm-v47-option" data-value="simple"><b>Simples</b><span>Remove ruído visual e textos longos.</span></button>
        <button class="crm-v47-option" data-value="compact"><b>Compacto</b><span>Menos espaçamento e mais dados por tela.</span></button>
        <button class="crm-v47-option" data-value="focus"><b>Foco comercial</b><span>Prioriza leads, pipeline e follow-ups.</span></button>
      </div></div>
      <div class="crm-v47-section"><h4>Aba lateral</h4><div class="crm-v47-options" data-v47-sidebar>
        <button class="crm-v47-option" data-value="auto"><b>Automática</b><span>Abre quando passa o mouse.</span></button>
        <button class="crm-v47-option" data-value="fixed"><b>Fixar lateral</b><span>Deixa o menu sempre aberto.</span></button>
        <button class="crm-v47-option" data-value="icons"><b>Apenas ícones</b><span>Mais espaço para trabalhar.</span></button>
      </div></div>
      <div class="crm-v47-section"><h4>Preferências</h4>
        ${toggle('centered','Centralizar área de trabalho','Mantém o conteúdo com largura máxima para leitura melhor.')}
        ${toggle('stickyFilters','Fixar filtros no topo','Filtros ficam visíveis enquanto você rola a página.')}
        ${toggle('reducedMotion','Reduzir animações','Remove movimentos para deixar a experiência mais leve.')}
        ${toggle('lite','Modo leve','Reduz sombras/animações e usa renderização mais econômica.')}
      </div>
      <div class="crm-v47-section"><h4>Manutenção</h4><div class="crm-v47-note"><b>Arquitetura modular:</b> esta versão separa CSS e JavaScript em arquivos, preservando suas funções antigas e reduzindo o risco de código aparecer na tela.</div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn btn-sm" data-v47-clean>Limpar textos soltos</button><button class="btn btn-sm" data-v47-reset>Restaurar layout</button></div></div>`;
    document.body.append(backdrop,drawer);
    backdrop.addEventListener('click',closeDrawer);drawer.addEventListener('click',handleDrawerClick);
  }
  function toggle(key,title,desc){return `<div class="crm-v47-toggle"><div><strong>${esc(title)}</strong><small>${esc(desc)}</small></div><button class="crm-v47-switch" data-v47-toggle="${esc(key)}" aria-label="${esc(title)}"></button></div>`}
  function handleDrawerClick(e){
    const c=e.target.closest('[data-v47-close]');if(c){closeDrawer();return}
    const layout=e.target.closest('[data-v47-layout] [data-value]');if(layout){setPref('layout',layout.dataset.value);return}
    const sidebar=e.target.closest('[data-v47-sidebar] [data-value]');if(sidebar){setPref('sidebar',sidebar.dataset.value);return}
    const tog=e.target.closest('[data-v47-toggle]');if(tog){setPref(tog.dataset.v47Toggle,!prefs[tog.dataset.v47Toggle]);return}
    if(e.target.closest('[data-v47-reset]')){prefs={...DEFAULTS};write(prefs);apply();return}
    if(e.target.closest('[data-v47-clean]')){cleanLooseCode();return}
  }
  function markActiveOptions(){
    $$('[data-v47-layout] [data-value]').forEach(b=>b.classList.toggle('active',b.dataset.value===prefs.layout));
    $$('[data-v47-sidebar] [data-value]').forEach(b=>b.classList.toggle('active',b.dataset.value===prefs.sidebar));
    $$('[data-v47-toggle]').forEach(b=>b.classList.toggle('on',!!prefs[b.dataset.v47Toggle]));
  }
  function openDrawer(){ensureDrawer();$('#crmV47Backdrop')?.classList.add('open');$('#crmV47Drawer')?.classList.add('open');markActiveOptions()}
  function closeDrawer(){$('#crmV47Backdrop')?.classList.remove('open');$('#crmV47Drawer')?.classList.remove('open')}
  function addSettingsButtons(){
    if($('#crmV47OpenSettings'))return;
    const btn=document.createElement('button');btn.id='crmV47OpenSettings';btn.className='nav-item crm-v47-settings-btn';btn.type='button';btn.innerHTML=icon()+'<span>Configurações</span>';btn.addEventListener('click',openDrawer);
    const nav=$('.sidebar-nav')||$('.sidebar-footer')||$('.sidebar')||document.body; nav.appendChild(btn);
    if(!$('#crmV47RailSettings')){const r=document.createElement('button');r.id='crmV47RailSettings';r.className='rail-btn';r.type='button';r.title='Configurações';r.innerHTML=icon();r.addEventListener('click',openDrawer);($('.rail-spacer')||$('.rail')||document.body).insertAdjacentElement('beforebegin',r)}
  }
  function filterContainers(){return $$('.pipeline-toolbar,.leads-toolbar,.agenda-toolbar,#v29Filters,#v37FollowupFilters,.v29-filters,[id*="Filters"],[id*="Toolbar"]').filter(el=>el && !el.closest('.crm-v47-drawer') && el.offsetParent!==null)}
  function countActiveFilters(el){
    let n=0;
    $$('input,select',el).forEach(x=>{const v=String(x.value||'').trim();if(v && !['todos','all',''].includes(v.toLowerCase()))n++});
    $$('.chip.active,.v29-chip.active,[data-status].active',el).forEach(c=>{const t=(c.dataset.status||c.textContent||'').trim().toLowerCase();if(t && !['todos','todas','all'].includes(t))n++});
    return n;
  }
  function clearFilters(el){
    $$('input',el).forEach(x=>{if(x.type==='checkbox'||x.type==='radio')return;x.value='';x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}))});
    $$('select',el).forEach(x=>{x.selectedIndex=0;x.dispatchEvent(new Event('change',{bubbles:true}))});
    const all=$$('.chip,.v29-chip,[data-status]',el).find(c=>/^(todos|todas|all)$/i.test((c.dataset.status||c.textContent||'').trim()));
    if(all) all.click();
    updateFilterCount(el);
  }
  function updateFilterCount(el){const c=el.querySelector(':scope > .crm-filter-count')||el.querySelector('.crm-filter-count');if(c)c.textContent=countActiveFilters(el)}
  let filterTick=0;
  function normalizeFilters(){clearTimeout(filterTick);filterTick=setTimeout(()=>{
    filterContainers().forEach(el=>{
      el.classList.add('crm-filterbar');
      if(!el.querySelector(':scope > .crm-filter-count')){const badge=document.createElement('span');badge.className='crm-filter-count';badge.title='Filtros ativos';el.appendChild(badge)}
      if(!el.querySelector(':scope > .crm-filter-clear')){const b=document.createElement('button');b.type='button';b.className='crm-filter-clear';b.textContent='Limpar filtros';b.addEventListener('click',()=>clearFilters(el));el.appendChild(b)}
      updateFilterCount(el);
    });
  },60)}
  function cleanLooseCode(){
    let removed=0;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(node){const s=node.nodeValue||'';return s.length>160 && /(function\s|const\s|let\s|window\.|document\.|=>)/.test(s)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{n.nodeValue='';removed++});
    try{typeof showToast==='function'?showToast(removed?`Texto técnico removido (${removed})`:'Nenhum texto técnico encontrado',removed?'success':'warn'):console.info(removed?`Textos removidos: ${removed}`:'Nenhum texto técnico encontrado')}catch(e){}
  }
  function patchNavigation(){
    document.addEventListener('crm:viewchange',()=>{apply();normalizeFilters();});
    document.addEventListener('input',e=>{const bar=e.target.closest('.crm-filterbar,.pipeline-toolbar,.leads-toolbar,.agenda-toolbar,[id*=\"Filters\"],[id*=\"Toolbar\"]');if(bar)updateFilterCount(bar)},true);
    document.addEventListener('change',e=>{const bar=e.target.closest('.crm-filterbar,.pipeline-toolbar,.leads-toolbar,.agenda-toolbar,[id*=\"Filters\"],[id*=\"Toolbar\"]');if(bar)updateFilterCount(bar)},true);
  }
  function boot(){ensureDrawer();addSettingsButtons();patchNavigation();apply();normalizeFilters();setTimeout(normalizeFilters,600);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
