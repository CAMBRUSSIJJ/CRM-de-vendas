/* Script original 27 */
(function(){
  const doc=document;
  const STORE='crm_v46_settings';
  const $=(s,r)=>(r||doc).querySelector(s);
  const $$=(s,r)=>Array.from((r||doc).querySelectorAll(s));
  const defaults={layout:'complete',sidebar:'auto',density:'normal',centered:false,reducedMotion:false,lightMode:false,stickyFilters:false};
  function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(STORE)||'{}'));}catch(e){return Object.assign({},defaults);}}
  function save(st){localStorage.setItem(STORE,JSON.stringify(st));}
  function cls(list,on){list.split(' ').filter(Boolean).forEach(c=>doc.body.classList.toggle(c,on));}
  function apply(st){
    st=Object.assign({},defaults,st||load());
    doc.body.classList.add('crm-v46');
    doc.body.classList.remove('crm-v46-simple','crm-v46-compact','crm-v46-focus','crm-v46-sidebar-fixed','crm-v46-sidebar-icons');
    if(st.layout==='simple') doc.body.classList.add('crm-v46-simple');
    if(st.layout==='compact') doc.body.classList.add('crm-v46-simple','crm-v46-compact');
    if(st.layout==='focus') doc.body.classList.add('crm-v46-simple','crm-v46-focus');
    if(st.sidebar==='fixed') doc.body.classList.add('crm-v46-sidebar-fixed');
    if(st.sidebar==='icons') doc.body.classList.add('crm-v46-sidebar-icons');
    cls('crm-v46-centered',!!st.centered);
    cls('crm-v46-reduce-motion',!!st.reducedMotion);
    cls('crm-v46-light-mode',!!st.lightMode);
    cls('crm-v46-filter-sticky',!!st.stickyFilters);
    try{ if(typeof window.crmV45Layout==='function') window.crmV45Layout(st.layout); }catch(e){}
    updateUI(st);
  }
  function switchHTML(key,label,desc){return '<div class="crm-v46-row"><div class="crm-v46-row-label"><b>'+label+'</b><span>'+desc+'</span></div><button type="button" class="crm-v46-switch" data-v46-switch="'+key+'"></button></div>';}
  function modalHTML(){return '<div id="crmV46Settings" class="crm-v46-overlay hidden" aria-hidden="true"><div class="crm-v46-modal" role="dialog" aria-modal="true" aria-label="Configurações do CRM"><div class="crm-v46-modal-head"><div><div class="crm-v46-modal-title">Configurações do CRM</div><div class="crm-v46-modal-sub">Personalize layout, filtros e barra lateral sem apagar nenhuma função da v41.</div></div><button class="crm-v46-close" type="button" aria-label="Fechar">×</button></div><div class="crm-v46-modal-body"><section class="crm-v46-section"><div class="crm-v46-section-title">Layout das páginas</div><div class="crm-v46-section-desc">A configuração aplica em todas as abas do CRM.</div><div class="crm-v46-choice-grid"><button class="crm-v46-choice" data-v46-layout="complete"><b>Completo</b><span>Mostra tudo, ideal para configurar.</span></button><button class="crm-v46-choice" data-v46-layout="simple"><b>Simples</b><span>Reduz botões extras e ruído visual.</span></button><button class="crm-v46-choice" data-v46-layout="compact"><b>Compacto</b><span>Mais informação por tela.</span></button><button class="crm-v46-choice" data-v46-layout="focus"><b>Foco comercial</b><span>Prioriza leads, pipeline e rotina.</span></button></div></section><section class="crm-v46-section"><div class="crm-v46-section-title">Aba lateral</div><div class="crm-v46-section-desc">Escolha como a navegação deve se comportar.</div><div class="crm-v46-choice-grid"><button class="crm-v46-choice" data-v46-sidebar="auto"><b>Automática</b><span>Abre ao passar o mouse.</span></button><button class="crm-v46-choice" data-v46-sidebar="fixed"><b>Fixar lateral</b><span>Fica aberta o tempo todo.</span></button><button class="crm-v46-choice" data-v46-sidebar="icons"><b>Só ícones</b><span>Mais espaço para trabalhar.</span></button><button class="crm-v46-choice" data-v46-sidebar="auto"><b>Padrão CRM</b><span>Visual original preservado.</span></button></div></section><section class="crm-v46-section"> <div class="crm-v46-section-title">Conforto e desempenho</div>'+switchHTML('centered','Centralizar área de trabalho','Melhora leitura em telas grandes.')+switchHTML('reducedMotion','Reduzir animações','Ajuda quando o HTML fica pesado.')+switchHTML('lightMode','Modo leve','Menos sombras e transições para abrir mais rápido.')+'</section><section class="crm-v46-section"><div class="crm-v46-section-title">Filtros</div>'+switchHTML('stickyFilters','Fixar filtros no topo','Mantém a barra de filtros visível ao rolar.')+'<div class="crm-v46-note">Os filtros das abas foram padronizados com busca, chips, contador de filtros ativos e botão para limpar sem apagar dados.</div></section><section class="crm-v46-section full"><div class="crm-v46-section-title">Como deixar o HTML mais rápido</div><div class="crm-v46-note"><b>O modo leve ajuda visualmente, mas a solução definitiva é estrutural:</b> separar CSS e JS em arquivos próprios, carregar cada aba somente quando abrir, remover scripts antigos duplicados, usar tabelas paginadas/virtualizadas e transformar os dados em um único objeto central. Assim o navegador deixa de processar 1MB de HTML e vários renders ao mesmo tempo.</div></section></div></div></div>';}
  function ensureSettings(){
    if(!$('#crmV46Settings')) doc.body.insertAdjacentHTML('beforeend',modalHTML());
    if(!$('#crmV46SidebarBtn')){
      const footer=$('.sidebar-footer')||$('.sidebar-nav')||$('.sidebar');
      if(footer){
        const btn=doc.createElement('button');
        btn.id='crmV46SidebarBtn';btn.type='button';btn.className='crm-v46-settings-btn';
        btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82V22a2 2 0 0 1-4 0v-.18A1.65 1.65 0 0 0 8.6 20a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.82-.33H2a2 2 0 0 1 0-4h.18A1.65 1.65 0 0 0 4 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.6 4.6a1.65 1.65 0 0 0 1-.6A1.65 1.65 0 0 0 9.82 2h4.36A1.65 1.65 0 0 0 14 4a1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8.6a1.65 1.65 0 0 0 .6 1h.18a2 2 0 0 1 0 4H20a1.65 1.65 0 0 0-.6 1z"></path></svg><span>Configurações</span>';
        footer.appendChild(btn);
      }
    }
    if(!$('#crmV46SettingsTopBtn')){
      const actions=$('.topbar-actions');
      if(actions){const t=doc.createElement('button');t.id='crmV46SettingsTopBtn';t.type='button';t.className='btn btn-sm';t.textContent='Configurações';actions.insertBefore(t,actions.firstChild);}
    }
  }
  function openSettings(){const m=$('#crmV46Settings');if(m){m.classList.remove('hidden');m.setAttribute('aria-hidden','false');updateUI(load());}}
  function closeSettings(){const m=$('#crmV46Settings');if(m){m.classList.add('hidden');m.setAttribute('aria-hidden','true');}}
  function updateUI(st){
    $$('[data-v46-layout]').forEach(b=>b.classList.toggle('active',b.dataset.v46Layout===st.layout));
    $$('[data-v46-sidebar]').forEach(b=>b.classList.toggle('active',b.dataset.v46Sidebar===st.sidebar));
    $$('[data-v46-switch]').forEach(b=>b.classList.toggle('on',!!st[b.dataset.v46Switch]));
  }
  function bindSettings(){
    doc.addEventListener('click',ev=>{
      const open=ev.target.closest('#crmV46SidebarBtn,#crmV46SettingsTopBtn');
      if(open){ev.preventDefault();openSettings();return;}
      if(ev.target.closest('.crm-v46-close')){ev.preventDefault();closeSettings();return;}
      const overlay=ev.target.id==='crmV46Settings'; if(overlay){closeSettings();return;}
      const layout=ev.target.closest('[data-v46-layout]'); if(layout){const st=load();st.layout=layout.dataset.v46Layout;save(st);apply(st);return;}
      const side=ev.target.closest('[data-v46-sidebar]'); if(side){const st=load();st.sidebar=side.dataset.v46Sidebar;save(st);apply(st);return;}
      const sw=ev.target.closest('[data-v46-switch]'); if(sw){const st=load();const k=sw.dataset.v46Switch;st[k]=!st[k];save(st);apply(st);return;}
    });
    doc.addEventListener('keydown',ev=>{if(ev.key==='Escape')closeSettings();});
  }
  function countFilters(bar){
    let count=0;
    $$('input,select,textarea',bar).forEach(el=>{const v=(el.value||'').trim();if(v && !/^todos?|all|geral|7d$/i.test(v)) count++;});
    $$('.chip.active,.view-tab.active',bar).forEach((c,i)=>{const txt=(c.textContent||'').trim();if(i>0 && !/^todos?$/i.test(txt)) count++;});
    return count;
  }
  function clearFilters(bar){
    $$('input,textarea',bar).forEach(el=>{if(el.type!=='button'&&el.type!=='submit'){el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}});
    $$('select',bar).forEach(el=>{el.selectedIndex=0;el.dispatchEvent(new Event('change',{bubbles:true}));});
    $$('.filter-chips,.view-tabs',bar).forEach(group=>{const first=group.querySelector('.chip,.view-tab'); if(first && !first.classList.contains('active')) first.click();});
    updateFilterCount(bar);
  }
  function updateFilterCount(bar){const c=$('.crm-v46-filter-count',bar); if(c) c.textContent=String(countFilters(bar));}
  function enhanceFilters(root){
    const bars=$$('.pipeline-toolbar,.leads-toolbar,.agenda-toolbar,.followups-toolbar,.call-toolbar,.v6-toolbar,.crm-v36-filterbar,.v41-toolbar,.v29-toolbar,.v27-filters',root||doc);
    bars.forEach(bar=>{
      if(bar.dataset.v46Enhanced==='1') return;
      bar.dataset.v46Enhanced='1';bar.classList.add('crm-v46-filterbar');
      if(!$('.crm-v46-filter-title',bar)){const title=doc.createElement('span');title.className='crm-v46-filter-title';title.innerHTML='Filtros <span class="crm-v46-filter-count">0</span>';bar.insertBefore(title,bar.firstChild);}
      if(!$('.crm-v46-filter-clear',bar)){const clear=doc.createElement('button');clear.type='button';clear.className='btn btn-sm crm-v46-filter-clear';clear.textContent='Limpar filtros';clear.addEventListener('click',()=>clearFilters(bar));bar.appendChild(clear);}
      bar.addEventListener('input',()=>updateFilterCount(bar));bar.addEventListener('change',()=>updateFilterCount(bar));bar.addEventListener('click',()=>setTimeout(()=>updateFilterCount(bar),40));
      updateFilterCount(bar);
    });
  }
  function boot(){
    ensureSettings();bindSettings();apply(load());enhanceFilters();
    let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;ensureSettings();enhanceFilters();apply(load());},120);}).observe(doc.body,{childList:true,subtree:true});
  }
  window.crmV46Settings={load,save,apply,enhanceFilters,open:openSettings};
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot);else boot();
})();
