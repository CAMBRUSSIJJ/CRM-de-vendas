/* CRM v61 — configurações unificadas: layout, cores, sidebar e abas visíveis */
(function(){
  'use strict';
  if(window.__CRM_V61_SETTINGS__) return;
  window.__CRM_V61_SETTINGS__ = true;

  const doc = document;
  const STORE = 'crm_v61_settings';
  const OLD_STORE = 'crm_v46_settings';
  const $ = (s,r=doc)=>r.querySelector(s);
  const $$ = (s,r=doc)=>Array.from(r.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const defaults = {
    layout:'complete',
    sidebarMode:'auto',
    density:'comfort',
    theme:'light',
    tone:'dark',
    accent:'#1D9E75',
    hiddenTabs:[],
    showBadges:true,
    tooltips:true,
    centered:false,
    reducedMotion:false,
    lightMode:false,
    stickyFilters:false
  };
  const palettes = ['#1D9E75','#2563EB','#7C3AED','#F59E0B','#E11D48','#0EA5E9','#111827','#14B8A6'];

  function hexToRgb(hex){
    let h=String(hex||'').replace('#','').trim();
    if(h.length===3) h=h.split('').map(x=>x+x).join('');
    const n=parseInt(h || '1D9E75',16);
    return [(n>>16)&255,(n>>8)&255,n&255];
  }
  function load(){
    try{
      const current = JSON.parse(localStorage.getItem(STORE)||'null');
      if(current) return normalize(current);
      const old = JSON.parse(localStorage.getItem(OLD_STORE)||'null');
      if(old){
        return normalize({
          layout:old.layout || defaults.layout,
          sidebarMode:old.sidebar==='fixed'?'fixed':old.sidebar==='icons'?'icons':'auto',
          centered:!!old.centered,
          reducedMotion:!!old.reducedMotion,
          lightMode:!!old.lightMode,
          stickyFilters:!!old.stickyFilters,
          density:old.density==='compact'?'compact':'comfort'
        });
      }
    }catch(e){}
    return normalize({});
  }
  function normalize(st){
    st = Object.assign({}, defaults, st||{});
    if(!['complete','simple','compact','focus'].includes(st.layout)) st.layout='complete';
    if(!['auto','fixed','compact','icons'].includes(st.sidebarMode)) st.sidebarMode='auto';
    if(!['comfort','compact'].includes(st.density)) st.density='comfort';
    if(!['light','dark'].includes(st.theme)) st.theme='light';
    if(!['dark','gradient','light','minimal'].includes(st.tone)) st.tone='dark';
    if(!/^#[0-9A-Fa-f]{6}$/.test(st.accent)) st.accent=defaults.accent;
    if(!Array.isArray(st.hiddenTabs)) st.hiddenTabs=[];
    st.hiddenTabs = Array.from(new Set(st.hiddenTabs.filter(Boolean)));
    return st;
  }
  function save(st){ st=normalize(st); localStorage.setItem(STORE, JSON.stringify(st)); return st; }
  function setAndApply(patch){ const st=save(Object.assign(load(),patch||{})); apply(st); return st; }
  function notify(msg,type='success'){
    try{ if(window.crmToast) window.crmToast(msg,type); else if(window.showToast) window.showToast(msg,type); }
    catch(e){}
  }
  function cls(name,on){ doc.body.classList.toggle(name,!!on); }
  function apply(st){
    st = normalize(st||load());
    const [r,g,b] = hexToRgb(st.accent);
    doc.documentElement.style.setProperty('--v61-accent', st.accent);
    doc.documentElement.style.setProperty('--v61-accent-rgb', r+','+g+','+b);
    doc.documentElement.dataset.theme = st.theme;
    doc.documentElement.classList.add('crm-ready');
    doc.body.classList.add('crm-v61','crm-ready');
    doc.body.classList.remove('crm-v61-sidebar-auto','crm-v61-sidebar-fixed','crm-v61-sidebar-compact','crm-v61-sidebar-icons','crm-v61-density-compact','crm-v61-tone-dark','crm-v61-tone-gradient','crm-v61-tone-light','crm-v61-tone-minimal','crm-v61-no-badges','crm-v61-no-tooltips','crm-v61-centered','crm-v61-reduce-motion','crm-v61-light-mode','crm-v61-filter-sticky');
    doc.body.classList.add('crm-v61-sidebar-'+st.sidebarMode,'crm-v61-tone-'+st.tone);
    cls('crm-v61-density-compact', st.density==='compact');
    cls('crm-v61-no-badges', !st.showBadges);
    cls('crm-v61-no-tooltips', !st.tooltips);
    cls('crm-v61-centered', !!st.centered);
    cls('crm-v61-reduce-motion', !!st.reducedMotion);
    cls('crm-v61-light-mode', !!st.lightMode);
    cls('crm-v61-filter-sticky', !!st.stickyFilters);
    // Compatibilidade: mantém o motor antigo de layout, sem exibir o painel antigo.
    try{ if(typeof window.crmV45Layout === 'function') window.crmV45Layout(st.layout); }catch(e){}
    updateUI(st);
    try{ if(typeof window.crmV61RenderSidebar === 'function') window.crmV61RenderSidebar(); }catch(e){}
    try{ if(typeof window.crmV61ApplyTabVisibility === 'function') window.crmV61ApplyTabVisibility(); }catch(e){}
  }

  function iconFor(item){
    if(window.crmV61Icon && item && item.icon) return window.crmV61Icon(item.icon);
    return '<span aria-hidden="true">•</span>';
  }
  function getItems(){
    if(typeof window.crmV61GetNavItems === 'function') return window.crmV61GetNavItems();
    return $$('[data-view]').map(el=>({id:el.dataset.view,label:el.dataset.label||el.getAttribute('title')||el.textContent.trim()||el.dataset.view,group:'Abas',icon:'circle'})).filter((x,i,a)=>x.id && a.findIndex(y=>y.id===x.id)===i);
  }
  function switchHTML(key,label,desc){
    return '<div class="crm-v61-row"><div class="crm-v61-row-label"><b>'+esc(label)+'</b><span>'+esc(desc)+'</span></div><button type="button" class="crm-v61-switch" data-v61-switch="'+esc(key)+'"></button></div>';
  }
  function modalHTML(){
    return '<div id="crmV61Settings" class="crm-v61-overlay hidden" aria-hidden="true">'+
      '<div class="crm-v61-modal" role="dialog" aria-modal="true" aria-label="Configurações do CRM">'+
        '<div class="crm-v61-modal-head"><div><div class="crm-v61-modal-kicker">Central do sistema</div><div class="crm-v61-modal-title">Configurações do CRM</div><div class="crm-v61-modal-sub">Personalize a aba lateral, cores, densidade, abas visíveis e desempenho sem criar uma segunda navegação por cima da antiga.</div></div><button class="crm-v61-close" type="button" aria-label="Fechar">×</button></div>'+
        '<div class="crm-v61-modal-body">'+
          '<section class="crm-v61-section"><div class="crm-v61-section-title">Aba lateral</div><div class="crm-v61-section-desc">Escolha o comportamento da navegação principal.</div><div class="crm-v61-choice-grid">'+
            choice('sidebarMode','auto','Automática','Compacta e abre ao passar o mouse.')+
            choice('sidebarMode','fixed','Fixa aberta','Mostra nomes o tempo todo.')+
            choice('sidebarMode','compact','Compacta','Mantém só ícones em uma barra maior.')+
            choice('sidebarMode','icons','Só ícones','Máximo espaço para as páginas.')+
          '</div></section>'+
          '<section class="crm-v61-section"><div class="crm-v61-section-title">Layout das páginas</div><div class="crm-v61-section-desc">Ajusta ruído visual e quantidade de informação.</div><div class="crm-v61-choice-grid">'+
            choice('layout','complete','Completo','Mostra todos os blocos e ações.')+
            choice('layout','simple','Simples','Reduz botões extras.')+
            choice('layout','compact','Compacto','Mais conteúdo por tela.')+
            choice('layout','focus','Foco comercial','Prioriza operação diária.')+
          '</div></section>'+
          '<section class="crm-v61-section"><div class="crm-v61-section-title">Cores e aparência</div><div class="crm-v61-section-desc">Mude a cor principal e o tom da lateral.</div><div class="crm-v61-color-row"><div class="crm-v61-presets" id="crmV61ColorPresets"></div><label class="crm-v61-custom-color">Cor personalizada <input type="color" id="crmV61CustomColor" value="#1D9E75"></label></div><div class="crm-v61-choice-grid" style="margin-top:12px">'+
            choice('tone','dark','Escuro','Lateral sólida e profissional.')+
            choice('tone','gradient','Gradiente','Mais destaque visual.')+
            choice('tone','light','Claro','Lateral leve e limpa.')+
            choice('tone','minimal','Minimalista','Escuro discreto.')+
          '</div><div class="crm-v61-choice-grid" style="margin-top:10px">'+
            choice('theme','light','Tema claro','Interface clara.')+
            choice('theme','dark','Tema escuro','Interface escura.')+
          '</div></section>'+
          '<section class="crm-v61-section"><div class="crm-v61-section-title">Conforto e desempenho</div><div class="crm-v61-section-desc">Ferramentas para deixar o HTML mais leve no uso diário.</div><div class="crm-v61-choice-grid" style="margin-bottom:8px">'+
            choice('density','comfort','Confortável','Mais respiro visual.')+
            choice('density','compact','Denso','Mais dados por tela.')+
          '</div>'+switchHTML('centered','Centralizar área de trabalho','Melhora leitura em telas grandes.')+switchHTML('reducedMotion','Reduzir animações','Útil se o navegador estiver pesado.')+switchHTML('lightMode','Modo leve','Remove sombras para carregar mais rápido.')+switchHTML('stickyFilters','Fixar filtros','Mantém filtros visíveis ao rolar.')+switchHTML('showBadges','Mostrar contadores','Exibe badges de leads, chat e alertas.')+switchHTML('tooltips','Mostrar dicas da lateral','Mostra nome da aba quando a lateral está compacta.')+'</section>'+
          '<section class="crm-v61-section full"><div class="crm-v61-section-title">O que quero visualizar na lateral</div><div class="crm-v61-section-desc">Desative abas que não usa. A aba não é apagada; ela só fica escondida da navegação.</div><div class="crm-v61-tab-tools"><button class="crm-v61-mini-btn" type="button" data-v61-preset="all">Mostrar tudo</button><button class="crm-v61-mini-btn" type="button" data-v61-preset="essential">Só essenciais</button><button class="crm-v61-mini-btn" type="button" data-v61-preset="operation">Operação comercial</button></div><div class="crm-v61-tabs-list" id="crmV61TabsList"></div></section>'+
        '</div><div class="crm-v61-modal-foot"><button class="crm-v61-btn" type="button" id="crmV61Reset">Restaurar padrão</button><button class="crm-v61-btn primary" type="button" id="crmV61Done">Salvar e fechar</button></div>'+ 
      '</div></div>';
  }
  function choice(key,value,title,desc){ return '<button class="crm-v61-choice" type="button" data-v61-choice="'+esc(key)+'" data-v61-value="'+esc(value)+'"><b>'+esc(title)+'</b><span>'+esc(desc)+'</span></button>'; }
  function ensureSettings(){
    if(!$('#crmV61Settings')) doc.body.insertAdjacentHTML('beforeend', modalHTML());
    const old = $('#crmV46Settings'); if(old) old.remove();
    const oldTop = $('#crmV46SettingsTopBtn'); if(oldTop) oldTop.remove();
    if(!$('#crmV61SettingsTopBtn')){
      const actions=$('.topbar-actions');
      if(actions){
        const b=doc.createElement('button');
        b.id='crmV61SettingsTopBtn'; b.type='button'; b.className='btn btn-sm'; b.innerHTML='⚙ Configurações';
        actions.insertBefore(b, actions.firstChild);
      }
    }
  }
  function renderColorPresets(st){
    const box=$('#crmV61ColorPresets'); if(!box) return;
    box.innerHTML=palettes.map(c=>'<button type="button" class="crm-v61-color-dot '+(c.toLowerCase()===st.accent.toLowerCase()?'active':'')+'" data-v61-color="'+c+'" title="'+c+'" style="background:'+c+'"></button>').join('');
    const input=$('#crmV61CustomColor'); if(input) input.value=st.accent;
  }
  function renderTabsList(st){
    const box=$('#crmV61TabsList'); if(!box) return;
    const items=getItems().filter(x=>x.id && x.id!=='configuracoes');
    box.innerHTML=items.map(item=>{
      const visible = !st.hiddenTabs.includes(item.id);
      return '<button type="button" class="crm-v61-tab-toggle '+(visible?'active':'')+'" data-v61-tab="'+esc(item.id)+'">'+iconFor(item)+'<span><strong>'+esc(item.label)+'</strong><small>'+esc(item.group||'Aba')+'</small></span><span class="crm-v61-check">✓</span></button>';
    }).join('');
  }
  function updateUI(st){
    st=normalize(st||load());
    $$('[data-v61-choice]').forEach(b=>b.classList.toggle('active', String(st[b.dataset.v61Choice])===String(b.dataset.v61Value)));
    $$('[data-v61-switch]').forEach(b=>b.classList.toggle('on', !!st[b.dataset.v61Switch]));
    renderColorPresets(st);
    renderTabsList(st);
  }
  function openSettings(){ ensureSettings(); updateUI(load()); const m=$('#crmV61Settings'); if(m){m.classList.remove('hidden');m.setAttribute('aria-hidden','false');} }
  function closeSettings(){ const m=$('#crmV61Settings'); if(m){m.classList.add('hidden');m.setAttribute('aria-hidden','true');} }
  function applyPreset(name){
    const ids = getItems().map(x=>x.id);
    const keep = {
      essential:['inicio','leads','garimpo','pipeline','cadencias','agenda','novo-lead'],
      operation:['inicio','leads','garimpo','pipeline','funil','cadencias','agenda','ligacoes','chat','novo-lead']
    }[name] || ids;
    const hidden = name==='all' ? [] : ids.filter(id=>!keep.includes(id));
    setAndApply({hiddenTabs:hidden});
  }
  function countFilters(bar){
    let count=0;
    $$('input,select,textarea',bar).forEach(el=>{const v=(el.value||'').trim();if(v && !/^(todos?|all|geral|7d)$/i.test(v)) count++;});
    $$('.chip.active,.view-tab.active',bar).forEach((c,i)=>{const txt=(c.textContent||'').trim();if(i>0 && !/^todos?$/i.test(txt)) count++;});
    return count;
  }
  function clearFilters(bar){
    $$('input,textarea',bar).forEach(el=>{if(el.type!=='button'&&el.type!=='submit'){el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}});
    $$('select',bar).forEach(el=>{el.selectedIndex=0;el.dispatchEvent(new Event('change',{bubbles:true}));});
    $$('.filter-chips,.view-tabs',bar).forEach(group=>{const first=group.querySelector('.chip,.view-tab'); if(first && !first.classList.contains('active')) first.click();});
    updateFilterCount(bar);
  }
  function updateFilterCount(bar){const c=$('.crm-v61-filter-count',bar); if(c) c.textContent=String(countFilters(bar));}
  function enhanceFilters(root=doc){
    const bars=$$('.pipeline-toolbar,.leads-toolbar,.agenda-toolbar,.followups-toolbar,.call-toolbar,.v6-toolbar,.crm-v36-filterbar,.v41-toolbar,.v29-toolbar,.v27-filters',root);
    bars.forEach(bar=>{
      if(bar.dataset.v61Enhanced==='1') return;
      bar.dataset.v61Enhanced='1'; bar.classList.add('crm-v61-filterbar'); bar.classList.remove('crm-v46-filterbar');
      if(!$('.crm-v61-filter-title',bar)){const title=doc.createElement('span');title.className='crm-v61-filter-title';title.innerHTML='Filtros <span class="crm-v61-filter-count">0</span>';bar.insertBefore(title,bar.firstChild);}
      if(!$('.crm-v61-filter-clear',bar)){const clear=doc.createElement('button');clear.type='button';clear.className='btn btn-sm crm-v61-filter-clear';clear.textContent='Limpar filtros';clear.addEventListener('click',()=>clearFilters(bar));bar.appendChild(clear);}
      bar.addEventListener('input',()=>updateFilterCount(bar));bar.addEventListener('change',()=>updateFilterCount(bar));bar.addEventListener('click',()=>setTimeout(()=>updateFilterCount(bar),40));
      updateFilterCount(bar);
    });
  }
  function bind(){
    if(doc.__crmV61SettingsBound) return; doc.__crmV61SettingsBound=true;
    doc.addEventListener('click', ev=>{
      const open=ev.target.closest('#crmV61SettingsTopBtn,#crmV61SettingsBtn,[data-v61-open-settings]');
      if(open){ev.preventDefault();openSettings();return;}
      if(ev.target.closest('.crm-v61-close,#crmV61Done')){ev.preventDefault();closeSettings();return;}
      if(ev.target.id==='crmV61Settings'){closeSettings();return;}
      const choice=ev.target.closest('[data-v61-choice]');
      if(choice){const key=choice.dataset.v61Choice; const val=choice.dataset.v61Value; setAndApply({[key]:val}); return;}
      const sw=ev.target.closest('[data-v61-switch]');
      if(sw){const st=load(); const key=sw.dataset.v61Switch; st[key]=!st[key]; setAndApply(st); return;}
      const color=ev.target.closest('[data-v61-color]');
      if(color){setAndApply({accent:color.dataset.v61Color}); return;}
      const tab=ev.target.closest('[data-v61-tab]');
      if(tab){
        const st=load(); const id=tab.dataset.v61Tab; const hidden=new Set(st.hiddenTabs);
        if(hidden.has(id)) hidden.delete(id); else hidden.add(id);
        if(getItems().filter(x=>!hidden.has(x.id) && x.id!=='novo-lead').length < 1){ notify('Mantenha pelo menos uma aba visível.','warning'); return; }
        setAndApply({hiddenTabs:Array.from(hidden)}); return;
      }
      const preset=ev.target.closest('[data-v61-preset]'); if(preset){applyPreset(preset.dataset.v61Preset);return;}
      if(ev.target.closest('#crmV61Reset')){localStorage.removeItem(STORE); apply(save(defaults)); notify('Configurações restauradas.','success'); return;}
    });
    doc.addEventListener('input', ev=>{
      if(ev.target && ev.target.id==='crmV61CustomColor') setAndApply({accent:ev.target.value});
    });
    doc.addEventListener('keydown', ev=>{ if(ev.key==='Escape') closeSettings(); });
  }
  function boot(){
    ensureSettings(); bind(); apply(load()); enhanceFilters();
    let pending=false;
    new MutationObserver(()=>{ if(pending) return; pending=true; setTimeout(()=>{ pending=false; ensureSettings(); enhanceFilters(); },160); }).observe(doc.body,{childList:true,subtree:true});
  }
  window.crmV61Settings={load,save,apply,set:setAndApply,open:openSettings,close:closeSettings,enhanceFilters};
  window.crmV46Settings=window.crmV61Settings;
  if(doc.readyState==='loading') doc.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
