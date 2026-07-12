/* EMBED: assets/js/modules/27-configuracoes-personalizacao-v71.js */
/* CRM V71 — Configurações e Personalização oficial
   Substitui a central V61 sem criar segunda área de configuração.
   Mantém compatibilidade com window.crmV61Settings e crm_v61_settings. */
(function(){
  'use strict';
  if(window.__CRM_V71_SETTINGS__) return;
  window.__CRM_V71_SETTINGS__ = true;
  window.__CRM_V61_SETTINGS__ = true;

  const doc=document;
  const STORE='crm_v71_settings';
  const LEGACY_STORE='crm_v61_settings';
  const OLD_STORE='crm_v46_settings';
  const $=(s,r=doc)=>r.querySelector(s);
  const $$=(s,r=doc)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const defaults={
    layout:'complete',
    sidebarMode:'auto',
    density:'comfort',
    theme:'light',
    tone:'dark',
    accent:'#1D9E75',
    hiddenTabs:[],
    tabOrder:[],
    showBadges:true,
    tooltips:true,
    centered:false,
    reducedMotion:false,
    lightMode:false,
    stickyFilters:false,
    workspaceWidth:'fluid',
    cardStyle:'soft',
    radius:'rounded',
    fontScale:'normal',
    tableDensity:'comfort',
    sidebarLabels:'auto',
    quickActions:true,
    quickActionItems:['novo-lead','leads','cadencias','agenda'],
    compactTopbar:false,
    showPerformanceBadge:true,
    safeMode:false,
    confirmDanger:true,
    leadRequiredFields:['nome','telefone'],
    defaultLeadOrigin:'Manual',
    defaultLeadPriority:'Média',
    defaultLeadOwner:'',
    defaultFollowupDays:2,
    dashboardPreset:'daily',
    lastPreset:'custom'
  };
  const palettes=['#1D9E75','#2563EB','#7C3AED','#F59E0B','#E11D48','#0EA5E9','#111827','#14B8A6','#16A34A','#9333EA'];
  const requiredFieldOptions=[
    ['nome','Nome'],['telefone','Telefone'],['email','E-mail'],['cidade','Cidade'],['origem','Origem'],['tags','Tags'],['proximaAcao','Próxima ação'],['followup','Data de follow-up']
  ];
  const quickActionOptions=[
    ['novo-lead','Novo lead'],['leads','Leads'],['garimpo','Garimpo'],['pipeline','Pipeline'],['cadencias','Follow-ups'],['agenda','Agenda'],['metas','Metas'],['importar','Importar/Exportar']
  ];

  function hexToRgb(hex){
    let h=String(hex||'').replace('#','').trim();
    if(h.length===3) h=h.split('').map(x=>x+x).join('');
    const n=parseInt(h||'1D9E75',16);
    return [(n>>16)&255,(n>>8)&255,n&255];
  }
  function normalizeArray(v){ return Array.isArray(v) ? Array.from(new Set(v.filter(Boolean).map(String))) : []; }
  function normalize(st){
    st=Object.assign({},defaults,st||{});
    if(!['complete','simple','compact','focus'].includes(st.layout)) st.layout=defaults.layout;
    if(!['auto','fixed','compact','icons'].includes(st.sidebarMode)) st.sidebarMode=defaults.sidebarMode;
    if(!['comfort','compact'].includes(st.density)) st.density=defaults.density;
    if(!['light','dark'].includes(st.theme)) st.theme=defaults.theme;
    if(!['dark','gradient','light','minimal'].includes(st.tone)) st.tone=defaults.tone;
    if(!['fluid','comfortable','wide','focus'].includes(st.workspaceWidth)) st.workspaceWidth=defaults.workspaceWidth;
    if(!['soft','flat','glass','outlined'].includes(st.cardStyle)) st.cardStyle=defaults.cardStyle;
    if(!['rounded','compact','pill'].includes(st.radius)) st.radius=defaults.radius;
    if(!['small','normal','large'].includes(st.fontScale)) st.fontScale=defaults.fontScale;
    if(!['comfort','compact'].includes(st.tableDensity)) st.tableDensity=defaults.tableDensity;
    if(!['auto','always','hidden'].includes(st.sidebarLabels)) st.sidebarLabels=defaults.sidebarLabels;
    if(!['daily','commercial','management','minimal'].includes(st.dashboardPreset)) st.dashboardPreset=defaults.dashboardPreset;
    if(!/^#[0-9A-Fa-f]{6}$/.test(st.accent)) st.accent=defaults.accent;
    st.hiddenTabs=normalizeArray(st.hiddenTabs);
    st.tabOrder=normalizeArray(st.tabOrder);
    st.quickActionItems=normalizeArray(st.quickActionItems).filter(id=>quickActionOptions.some(x=>x[0]===id));
    if(!st.quickActionItems.length) st.quickActionItems=defaults.quickActionItems.slice();
    st.leadRequiredFields=normalizeArray(st.leadRequiredFields).filter(id=>requiredFieldOptions.some(x=>x[0]===id));
    if(!st.leadRequiredFields.length) st.leadRequiredFields=defaults.leadRequiredFields.slice();
    st.defaultFollowupDays=Math.max(0,Math.min(30,Number(st.defaultFollowupDays)||defaults.defaultFollowupDays));
    return st;
  }
  function load(){
    try{
      const current=JSON.parse(localStorage.getItem(STORE)||'null');
      if(current) return normalize(current);
    }catch(e){}
    try{
      const legacy=JSON.parse(localStorage.getItem(LEGACY_STORE)||'null');
      if(legacy) return normalize(legacy);
    }catch(e){}
    try{
      const old=JSON.parse(localStorage.getItem(OLD_STORE)||'null');
      if(old){
        return normalize({
          layout:old.layout||defaults.layout,
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
  function save(st){
    st=normalize(st);
    localStorage.setItem(STORE,JSON.stringify(st));
    localStorage.setItem(LEGACY_STORE,JSON.stringify(st));
    return st;
  }
  function setAndApply(patch){ const st=save(Object.assign(load(),patch||{})); apply(st); return st; }
  function notify(msg,type='success'){
    try{ if(window.crmToast) return window.crmToast(msg,type); }catch(e){}
    try{ if(window.showToast) return window.showToast(msg,type); }catch(e){}
    console.log(`[CRM ${type}] ${msg}`);
  }
  function cls(name,on){doc.body.classList.toggle(name,!!on);}

  function addDaysISO(days){const d=new Date();d.setDate(d.getDate()+Number(days||0));return d.toISOString().slice(0,10);}
  function applyLeadFormDefaults(st=load()){
    try{
      const form=$('#leadForm'); if(!form) return;
      const map={nome:'nome',telefone:'telefone',email:'email',cidade:'cidade',origem:'origem',tags:'tags',proximaAcao:'proximaAcao',followup:'followup'};
      Object.values(map).forEach(name=>{const el=form.elements[name]; if(el) el.required=false;});
      (st.leadRequiredFields||[]).forEach(key=>{const el=form.elements[map[key]||key]; if(el) el.required=true;});
      const origem=form.elements.origem; if(origem && !origem.value && st.defaultLeadOrigin) origem.value=st.defaultLeadOrigin;
      const resp=form.elements.responsavel; if(resp && !resp.value && st.defaultLeadOwner) resp.value=st.defaultLeadOwner;
      const pri=form.elements.prioridade; if(pri && !pri.value && st.defaultLeadPriority) pri.value=st.defaultLeadPriority;
      const fu=form.elements.followup; if(fu && !fu.value && Number(st.defaultFollowupDays)>=0) fu.value=addDaysISO(st.defaultFollowupDays);
    }catch(e){}
  }

  function apply(st){
    st=normalize(st||load());
    const [r,g,b]=hexToRgb(st.accent);
    doc.documentElement.style.setProperty('--v61-accent',st.accent);
    doc.documentElement.style.setProperty('--v61-accent-rgb',`${r},${g},${b}`);
    doc.documentElement.style.setProperty('--v71-accent',st.accent);
    doc.documentElement.style.setProperty('--v71-accent-rgb',`${r},${g},${b}`);
    doc.documentElement.dataset.theme=st.theme;
    doc.documentElement.classList.add('crm-ready');
    doc.body.classList.add('crm-ready','crm-v61','crm-v71');
    const remove=[
      'crm-v61-sidebar-auto','crm-v61-sidebar-fixed','crm-v61-sidebar-compact','crm-v61-sidebar-icons',
      'crm-v61-density-compact','crm-v61-tone-dark','crm-v61-tone-gradient','crm-v61-tone-light','crm-v61-tone-minimal',
      'crm-v61-no-badges','crm-v61-no-tooltips','crm-v61-centered','crm-v61-reduce-motion','crm-v61-light-mode','crm-v61-filter-sticky',
      'crm-v71-width-fluid','crm-v71-width-comfortable','crm-v71-width-wide','crm-v71-width-focus',
      'crm-v71-card-soft','crm-v71-card-flat','crm-v71-card-glass','crm-v71-card-outlined',
      'crm-v71-radius-rounded','crm-v71-radius-compact','crm-v71-radius-pill',
      'crm-v71-font-small','crm-v71-font-normal','crm-v71-font-large','crm-v71-table-compact',
      'crm-v71-labels-auto','crm-v71-labels-always','crm-v71-labels-hidden','crm-v71-compact-topbar','crm-v71-safe-mode','crm-v71-hide-performance-badge'
    ];
    doc.body.classList.remove(...remove);
    doc.body.classList.add('crm-v61-sidebar-'+st.sidebarMode,'crm-v61-tone-'+st.tone);
    doc.body.classList.add('crm-v71-width-'+st.workspaceWidth,'crm-v71-card-'+st.cardStyle,'crm-v71-radius-'+st.radius,'crm-v71-font-'+st.fontScale,'crm-v71-labels-'+st.sidebarLabels);
    cls('crm-v61-density-compact',st.density==='compact');
    cls('crm-v61-no-badges',!st.showBadges);
    cls('crm-v61-no-tooltips',!st.tooltips);
    cls('crm-v61-centered',!!st.centered);
    cls('crm-v61-reduce-motion',!!st.reducedMotion || !!st.safeMode);
    cls('crm-v61-light-mode',!!st.lightMode || !!st.safeMode);
    cls('crm-v61-filter-sticky',!!st.stickyFilters);
    cls('crm-v71-table-compact',st.tableDensity==='compact');
    cls('crm-v71-compact-topbar',!!st.compactTopbar);
    cls('crm-v71-safe-mode',!!st.safeMode);
    cls('crm-v71-hide-performance-badge',!st.showPerformanceBadge);
    try{ if(typeof window.crmV45Layout==='function') window.crmV45Layout(st.layout); }catch(e){}
    updateUI(st);
    try{ if(typeof window.crmV61RenderSidebar==='function') window.crmV61RenderSidebar(); }catch(e){}
    try{ if(typeof window.crmV61ApplyTabVisibility==='function') window.crmV61ApplyTabVisibility(); }catch(e){}
    applyLeadFormDefaults(st);
    window.dispatchEvent(new CustomEvent('crm:settings-updated',{detail:{version:'v71',settings:st}}));
  }
  function iconFor(item){ if(window.crmV61Icon && item && item.icon) return window.crmV61Icon(item.icon); return '<span aria-hidden="true">•</span>'; }
  function getItems(){ if(typeof window.crmV61GetNavItems==='function') return window.crmV61GetNavItems(); return $$('[data-view]').map(el=>({id:el.dataset.view,label:el.dataset.label||el.title||el.textContent.trim()||el.dataset.view,group:'Abas',icon:'grid'})).filter((x,i,a)=>x.id&&a.findIndex(y=>y.id===x.id)===i); }
  function orderedItems(){
    const items=getItems().filter(x=>x.id&&x.id!=='configuracoes');
    const st=load(); const pos=new Map(st.tabOrder.map((id,i)=>[id,i]));
    return items.slice().sort((a,b)=>{
      const pa=pos.has(a.id)?pos.get(a.id):9999;
      const pb=pos.has(b.id)?pos.get(b.id):9999;
      if(pa!==pb) return pa-pb;
      return items.indexOf(a)-items.indexOf(b);
    });
  }
  function choice(key,value,title,desc){return `<button class="crm-v71-choice" type="button" data-v71-choice="${esc(key)}" data-v71-value="${esc(value)}"><b>${esc(title)}</b><span>${esc(desc)}</span></button>`;}
  function switchHTML(key,label,desc){return `<div class="crm-v71-row"><div class="crm-v71-row-label"><b>${esc(label)}</b><span>${esc(desc)}</span></div><button type="button" class="crm-v71-switch" data-v71-switch="${esc(key)}"></button></div>`;}
  function fieldChecks(list,type){return list.map(([id,label])=>`<button type="button" class="crm-v71-pill-toggle" data-v71-${type}="${esc(id)}"><span>${esc(label)}</span><i>✓</i></button>`).join('');}
  function modalHTML(){
    return `<div id="crmV71Settings" class="crm-v71-overlay hidden" aria-hidden="true">
      <div class="crm-v71-modal" role="dialog" aria-modal="true" aria-label="Configurações e personalização do CRM">
        <div class="crm-v71-head">
          <div>
            <div class="crm-v71-kicker">V71 · Central oficial</div>
            <div class="crm-v71-title">Configurações e Personalização</div>
            <div class="crm-v71-sub">Controle aparência, lateral, abas, botões, campos padrão e modo leve em uma única central, sem módulos duplicados.</div>
          </div>
          <button class="crm-v71-close" type="button" aria-label="Fechar">×</button>
        </div>
        <div class="crm-v71-nav" role="tablist">
          <button class="active" type="button" data-v71-tab="aparencia">Aparência</button>
          <button type="button" data-v71-tab="lateral">Aba lateral</button>
          <button type="button" data-v71-tab="abas">Abas visíveis</button>
          <button type="button" data-v71-tab="operacao">Operação</button>
          <button type="button" data-v71-tab="sistema">Sistema</button>
        </div>
        <div class="crm-v71-body">
          <section class="crm-v71-panel active" data-v71-panel="aparencia">
            <div class="crm-v71-grid two">
              <div class="crm-v71-card"><h3>Cores e tema</h3><p>Mude a cor principal e o tom geral do CRM.</p><div class="crm-v71-presets" id="crmV71ColorPresets"></div><label class="crm-v71-color-input">Cor personalizada <input type="color" id="crmV71CustomColor" value="#1D9E75"></label><div class="crm-v71-choice-grid">${choice('theme','light','Tema claro','Visual limpo para uso diário')}${choice('theme','dark','Tema escuro','Reduz brilho da tela')}${choice('tone','dark','Lateral escura','Mais contraste')}${choice('tone','gradient','Lateral gradiente','Mais destaque visual')}${choice('tone','light','Lateral clara','Visual mais leve')}${choice('tone','minimal','Minimalista','Mais discreto')}</div></div>
              <div class="crm-v71-card"><h3>Visual das páginas</h3><p>Ajusta densidade, cards, cantos e largura de trabalho.</p><div class="crm-v71-choice-grid">${choice('density','comfort','Confortável','Mais espaçamento')}${choice('density','compact','Compacto','Mais informação por tela')}${choice('workspaceWidth','fluid','Largura fluida','Usa bem telas grandes')}${choice('workspaceWidth','comfortable','Confortável','Limita leitura')}${choice('workspaceWidth','wide','Amplo','Mais espaço horizontal')}${choice('workspaceWidth','focus','Foco','Centraliza a operação')}</div><div class="crm-v71-choice-grid small">${choice('cardStyle','soft','Cards suaves','Sombra leve')}${choice('cardStyle','flat','Cards planos','Mais leve')}${choice('cardStyle','glass','Glass','Visual moderno')}${choice('cardStyle','outlined','Contornado','Mais limpo')}${choice('radius','rounded','Arredondado','Padrão')}${choice('radius','compact','Cantos menores','Mais corporativo')}${choice('radius','pill','Bem arredondado','Mais suave')}${choice('fontScale','normal','Fonte normal','Padrão')}</div></div>
            </div>
          </section>
          <section class="crm-v71-panel" data-v71-panel="lateral">
            <div class="crm-v71-grid two">
              <div class="crm-v71-card"><h3>Comportamento da lateral</h3><p>Escolha como a navegação deve aparecer.</p><div class="crm-v71-choice-grid">${choice('sidebarMode','auto','Automática','Compacta e expande ao passar')}${choice('sidebarMode','fixed','Fixa aberta','Mostra nomes sempre')}${choice('sidebarMode','compact','Compacta','Ícones com área média')}${choice('sidebarMode','icons','Só ícones','Máximo espaço para a tela')}</div><div class="crm-v71-choice-grid small">${choice('sidebarLabels','auto','Rótulos automáticos','Segue o modo lateral')}${choice('sidebarLabels','always','Sempre mostrar textos','Força nomes na lateral')}${choice('sidebarLabels','hidden','Ocultar textos','Ícones mais limpos')}</div></div>
              <div class="crm-v71-card"><h3>Botões rápidos</h3><p>Escolha atalhos que aparecem no rodapé da lateral.</p>${switchHTML('quickActions','Mostrar atalhos rápidos','Exibe botões menores no rodapé da sidebar.')}<div class="crm-v71-pills" id="crmV71QuickActions">${fieldChecks(quickActionOptions,'quick')}</div></div>
            </div>
          </section>
          <section class="crm-v71-panel" data-v71-panel="abas">
            <div class="crm-v71-card full"><h3>O que quero visualizar</h3><p>Oculte abas que não usa e reordene a lateral. A aba não é apagada, só fica escondida da navegação.</p><div class="crm-v71-tools"><button type="button" data-v71-preset="all">Mostrar tudo</button><button type="button" data-v71-preset="essential">Só essenciais</button><button type="button" data-v71-preset="operation">Operação comercial</button><button type="button" data-v71-preset="management">Gestão</button><button type="button" id="crmV71SaveOrder">Salvar ordem atual</button></div><div class="crm-v71-tabs-list" id="crmV71TabsList"></div></div>
          </section>
          <section class="crm-v71-panel" data-v71-panel="operacao">
            <div class="crm-v71-grid two">
              <div class="crm-v71-card"><h3>Padrões de novo lead</h3><p>Define como o cadastro entra por padrão.</p><label class="crm-v71-input">Origem padrão <input id="crmV71DefaultOrigin" type="text" placeholder="Manual"></label><label class="crm-v71-input">Responsável padrão <input id="crmV71DefaultOwner" type="text" placeholder="Opcional"></label><label class="crm-v71-input">Próximo follow-up em dias <input id="crmV71DefaultFollowupDays" type="number" min="0" max="30"></label><label class="crm-v71-input">Prioridade padrão <select id="crmV71DefaultPriority"><option>Alta</option><option>Média</option><option>Baixa</option></select></label><h4>Campos obrigatórios no cadastro</h4><div class="crm-v71-pills" id="crmV71RequiredFields">${fieldChecks(requiredFieldOptions,'required')}</div></div>
              <div class="crm-v71-card"><h3>Conforto de uso</h3><p>Melhorias visuais e operacionais globais.</p>${switchHTML('stickyFilters','Fixar filtros','Mantém filtros visíveis ao rolar.')}${switchHTML('compactTopbar','Topbar compacta','Reduz altura do topo.')}${switchHTML('showBadges','Mostrar contadores','Exibe badges na lateral.')}${switchHTML('tooltips','Mostrar dicas','Mostra nome da aba em modo compacto.')}<div class="crm-v71-choice-grid small">${choice('tableDensity','comfort','Tabelas confortáveis','Mais espaço entre linhas')}${choice('tableDensity','compact','Tabelas compactas','Mais linhas na tela')}${choice('dashboardPreset','daily','Dashboard diário','Ações do dia')}${choice('dashboardPreset','commercial','Comercial','Vendas e follow-up')}${choice('dashboardPreset','management','Gestão','Indicadores e metas')}${choice('dashboardPreset','minimal','Mínimo','Só essencial')}</div></div>
            </div>
          </section>
          <section class="crm-v71-panel" data-v71-panel="sistema">
            <div class="crm-v71-grid two">
              <div class="crm-v71-card"><h3>Desempenho e segurança</h3><p>Use quando o CRM estiver pesado ou quando quiser um modo mais estável.</p>${switchHTML('reducedMotion','Reduzir animações','Desliga transições pesadas.')}${switchHTML('lightMode','Modo leve','Remove sombras fortes.')}${switchHTML('safeMode','Modo seguro','Ativa modo leve, reduz animações e foca no básico.')}${switchHTML('showPerformanceBadge','Mostrar badge V70/V71','Exibe indicador técnico na topbar.')}${switchHTML('confirmDanger','Confirmar ações perigosas','Mantém confirmações antes de limpar dados.')}</div>
              <div class="crm-v71-card"><h3>Backup das configurações</h3><p>Exporte ou importe apenas as preferências visuais, sem mexer nos leads.</p><div class="crm-v71-actions"><button type="button" id="crmV71ExportSettings">Exportar configurações</button><label class="crm-v71-upload">Importar configurações<input type="file" id="crmV71ImportSettings" accept="application/json,.json"></label><button type="button" id="crmV71Reset">Restaurar padrão</button></div><div class="crm-v71-health" id="crmV71Health"></div></div>
            </div>
          </section>
        </div>
        <div class="crm-v71-foot"><span>As mudanças são salvas automaticamente no navegador.</span><button class="crm-v71-btn ghost" type="button" id="crmV71CloseFoot">Fechar</button><button class="crm-v71-btn primary" type="button" id="crmV71Done">Salvar e fechar</button></div>
      </div>
    </div>`;
  }
  function ensureSettings(){
    const old=$('#crmV61Settings'); if(old) old.remove();
    const old46=$('#crmV46Settings'); if(old46) old46.remove();
    const oldTop=$('#crmV46SettingsTopBtn'); if(oldTop) oldTop.remove();
    if(!$('#crmV71Settings')) doc.body.insertAdjacentHTML('beforeend',modalHTML());
    if(!$('#crmV61SettingsTopBtn')&&!$('#crmV71SettingsTopBtn')){
      const actions=$('.topbar-actions');
      if(actions){const b=doc.createElement('button');b.id='crmV71SettingsTopBtn';b.type='button';b.className='btn btn-sm';b.setAttribute('data-v71-open-settings','');b.innerHTML='⚙ Personalizar';actions.insertBefore(b,actions.firstChild);}
    }
  }
  function renderColorPresets(st){
    const box=$('#crmV71ColorPresets'); if(!box) return;
    box.innerHTML=palettes.map(c=>`<button type="button" class="crm-v71-color-dot ${c.toLowerCase()===st.accent.toLowerCase()?'active':''}" data-v71-color="${c}" title="${c}" style="background:${c}"></button>`).join('');
    const input=$('#crmV71CustomColor'); if(input) input.value=st.accent;
  }
  function renderTabsList(st){
    const box=$('#crmV71TabsList'); if(!box) return;
    const items=orderedItems();
    box.innerHTML=items.map((item,idx)=>{
      const visible=!st.hiddenTabs.includes(item.id);
      return `<div class="crm-v71-tab-row ${visible?'active':''}" data-v71-tab-row="${esc(item.id)}">
        <button type="button" class="crm-v71-order" data-v71-move="up" title="Subir">↑</button>
        <button type="button" class="crm-v71-order" data-v71-move="down" title="Descer">↓</button>
        <button type="button" class="crm-v71-tab-toggle" data-v71-tab-toggle="${esc(item.id)}">${iconFor(item)}<span><strong>${esc(item.label)}</strong><small>${esc(item.group||'Aba')}</small></span><i>✓</i></button>
      </div>`;
    }).join('');
  }
  function updateCheckButtons(st){
    $$('[data-v71-required]').forEach(b=>b.classList.toggle('active',st.leadRequiredFields.includes(b.dataset.v71Required)));
    $$('[data-v71-quick]').forEach(b=>b.classList.toggle('active',st.quickActionItems.includes(b.dataset.v71Quick)));
  }
  function updateInputs(st){
    const origin=$('#crmV71DefaultOrigin'); if(origin) origin.value=st.defaultLeadOrigin||'';
    const owner=$('#crmV71DefaultOwner'); if(owner) owner.value=st.defaultLeadOwner||'';
    const days=$('#crmV71DefaultFollowupDays'); if(days) days.value=st.defaultFollowupDays;
    const pri=$('#crmV71DefaultPriority'); if(pri) pri.value=st.defaultLeadPriority||'Média';
    const health=$('#crmV71Health'); if(health){
      const visible=orderedItems().filter(x=>!st.hiddenTabs.includes(x.id)).length;
      health.innerHTML=`<b>Resumo atual</b><span>${visible} abas visíveis · ${st.quickActionItems.length} atalhos rápidos · modo ${esc(st.sidebarMode)} · tema ${esc(st.theme)}</span>`;
    }
  }
  function updateUI(st){
    st=normalize(st||load());
    $$('[data-v71-choice]').forEach(b=>b.classList.toggle('active',String(st[b.dataset.v71Choice])===String(b.dataset.v71Value)));
    $$('[data-v71-switch]').forEach(b=>b.classList.toggle('on',!!st[b.dataset.v71Switch]));
    renderColorPresets(st); renderTabsList(st); updateCheckButtons(st); updateInputs(st);
  }
  function openSettings(){ensureSettings();updateUI(load());const m=$('#crmV71Settings');if(m){m.classList.remove('hidden');m.setAttribute('aria-hidden','false');}}
  function closeSettings(){const m=$('#crmV71Settings');if(m){m.classList.add('hidden');m.setAttribute('aria-hidden','true');}}
  function applyPreset(name){
    const ids=getItems().map(x=>x.id);
    const keep={
      essential:['inicio','leads','garimpo','pipeline','cadencias','agenda','novo-lead'],
      operation:['inicio','leads','garimpo','pipeline','funil','cadencias','agenda','ligacoes','chat','novo-lead'],
      management:['inicio','dashboard','metricas','metas','pipeline','funil','perdas','importar']
    }[name]||ids;
    const hidden=name==='all'?[]:ids.filter(id=>!keep.includes(id));
    setAndApply({hiddenTabs:hidden,lastPreset:name});
  }
  function moveTab(id,dir){
    const ids=orderedItems().map(x=>x.id);
    const i=ids.indexOf(id); if(i<0) return;
    const j=dir==='up'?i-1:i+1; if(j<0||j>=ids.length) return;
    [ids[i],ids[j]]=[ids[j],ids[i]];
    setAndApply({tabOrder:ids,lastPreset:'custom'});
  }
  function toggleArray(key,id,minOne=false){
    const st=load(); const set=new Set(st[key]||[]);
    if(set.has(id)) set.delete(id); else set.add(id);
    if(minOne && set.size<1){notify('Mantenha pelo menos um item selecionado.','warning');return;}
    setAndApply({[key]:Array.from(set),lastPreset:'custom'});
  }
  function toggleHiddenTab(id){
    const st=load(); const hidden=new Set(st.hiddenTabs);
    if(hidden.has(id)) hidden.delete(id); else hidden.add(id);
    const visible=getItems().filter(x=>!hidden.has(x.id)&&!x.action).length;
    if(visible<1){notify('Mantenha pelo menos uma aba visível.','warning');return;}
    setAndApply({hiddenTabs:Array.from(hidden),lastPreset:'custom'});
  }
  function countFilters(bar){let count=0;$$('input,select,textarea',bar).forEach(el=>{const v=(el.value||'').trim();if(v&&!/^(todos?|all|geral|7d)$/i.test(v))count++;});$$('.chip.active,.view-tab.active',bar).forEach((c,i)=>{const txt=(c.textContent||'').trim();if(i>0&&!/^todos?$/i.test(txt))count++;});return count;}
  function clearFilters(bar){$$('input,textarea',bar).forEach(el=>{if(el.type!=='button'&&el.type!=='submit'){el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}});$$('select',bar).forEach(el=>{el.selectedIndex=0;el.dispatchEvent(new Event('change',{bubbles:true}));});$$('.filter-chips,.view-tabs',bar).forEach(group=>{const first=group.querySelector('.chip,.view-tab');if(first&&!first.classList.contains('active')) first.click();});updateFilterCount(bar);}
  function updateFilterCount(bar){const c=$('.crm-v61-filter-count,.crm-v71-filter-count',bar);if(c)c.textContent=String(countFilters(bar));}
  function enhanceFilters(root=doc){
    const bars=$$('.pipeline-toolbar,.leads-toolbar,.agenda-toolbar,.followups-toolbar,.call-toolbar,.v6-toolbar,.crm-v36-filterbar,.v41-toolbar,.v29-toolbar,.v27-filters,.v65-toolbar,.v69-toolbar',root);
    bars.forEach(bar=>{
      if(bar.dataset.v71Enhanced==='1') return;
      bar.dataset.v71Enhanced='1';bar.classList.add('crm-v61-filterbar','crm-v71-filterbar');bar.classList.remove('crm-v46-filterbar');
      if(!$('.crm-v61-filter-title,.crm-v71-filter-title',bar)){const title=doc.createElement('span');title.className='crm-v71-filter-title crm-v61-filter-title';title.innerHTML='Filtros <span class="crm-v71-filter-count crm-v61-filter-count">0</span>';bar.insertBefore(title,bar.firstChild);}
      if(!$('.crm-v61-filter-clear,.crm-v71-filter-clear',bar)){const clear=doc.createElement('button');clear.type='button';clear.className='btn btn-sm crm-v71-filter-clear crm-v61-filter-clear';clear.textContent='Limpar filtros';clear.addEventListener('click',()=>clearFilters(bar));bar.appendChild(clear);}
      bar.addEventListener('input',()=>updateFilterCount(bar));bar.addEventListener('change',()=>updateFilterCount(bar));bar.addEventListener('click',()=>setTimeout(()=>updateFilterCount(bar),40));updateFilterCount(bar);
    });
  }
  function exportSettings(){
    const blob=new Blob([JSON.stringify({meta:{app:'Outbounder CRM',version:'V71',type:'settings',exportedAt:new Date().toISOString()},settings:load()},null,2)],{type:'application/json;charset=utf-8'});
    const a=doc.createElement('a');a.href=URL.createObjectURL(blob);a.download='outbounder_configuracoes_v71.json';doc.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);notify('Configurações exportadas.','success');
  }
  function importSettingsFile(file){
    if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const payload=JSON.parse(reader.result);const st=payload.settings||payload;setAndApply(st);notify('Configurações importadas.','success');}catch(e){notify('Arquivo de configurações inválido.','error');}};reader.readAsText(file);
  }
  function bind(){
    if(doc.__crmV71SettingsBound)return;doc.__crmV71SettingsBound=true;
    doc.addEventListener('click',ev=>{
      const open=ev.target.closest('#crmV71SettingsTopBtn,#crmV61SettingsTopBtn,#crmV71SettingsBtn,#crmV61SettingsBtn,[data-v71-open-settings],[data-v61-open-settings]');
      if(open){ev.preventDefault();openSettings();return;}
      if(ev.target.closest('.crm-v71-close,#crmV71Done,#crmV71CloseFoot')){ev.preventDefault();closeSettings();return;}
      if(ev.target.id==='crmV71Settings'){closeSettings();return;}
      const tabNav=ev.target.closest('[data-v71-tab]'); if(tabNav){$$('[data-v71-tab]').forEach(b=>b.classList.toggle('active',b===tabNav));$$('[data-v71-panel]').forEach(p=>p.classList.toggle('active',p.dataset.v71Panel===tabNav.dataset.v71Tab));return;}
      const choice=ev.target.closest('[data-v71-choice]'); if(choice){setAndApply({[choice.dataset.v71Choice]:choice.dataset.v71Value,lastPreset:'custom'});return;}
      const sw=ev.target.closest('[data-v71-switch]'); if(sw){const st=load();const k=sw.dataset.v71Switch;st[k]=!st[k];setAndApply(st);return;}
      const color=ev.target.closest('[data-v71-color]'); if(color){setAndApply({accent:color.dataset.v71Color,lastPreset:'custom'});return;}
      const tabToggle=ev.target.closest('[data-v71-tab-toggle]'); if(tabToggle){toggleHiddenTab(tabToggle.dataset.v71TabToggle);return;}
      const mover=ev.target.closest('[data-v71-move]'); if(mover){const row=mover.closest('[data-v71-tab-row]');if(row)moveTab(row.dataset.v71TabRow,mover.dataset.v71Move);return;}
      const preset=ev.target.closest('[data-v71-preset]'); if(preset){applyPreset(preset.dataset.v71Preset);return;}
      const req=ev.target.closest('[data-v71-required]'); if(req){toggleArray('leadRequiredFields',req.dataset.v71Required,true);return;}
      const quick=ev.target.closest('[data-v71-quick]'); if(quick){toggleArray('quickActionItems',quick.dataset.v71Quick,true);return;}
      if(ev.target.closest('#crmV71SaveOrder')){setAndApply({tabOrder:orderedItems().map(x=>x.id)});notify('Ordem salva.','success');return;}
      if(ev.target.closest('#crmV71ExportSettings')){exportSettings();return;}
      if(ev.target.closest('#crmV71Reset')){if(!confirm('Restaurar configurações visuais para o padrão?'))return;localStorage.removeItem(STORE);localStorage.removeItem(LEGACY_STORE);apply(save(defaults));notify('Configurações restauradas.','success');return;}
    });
    doc.addEventListener('input',ev=>{
      if(ev.target.id==='crmV71CustomColor') setAndApply({accent:ev.target.value,lastPreset:'custom'});
      if(ev.target.id==='crmV71DefaultOrigin') setAndApply({defaultLeadOrigin:ev.target.value});
      if(ev.target.id==='crmV71DefaultOwner') setAndApply({defaultLeadOwner:ev.target.value});
      if(ev.target.id==='crmV71DefaultFollowupDays') setAndApply({defaultFollowupDays:ev.target.value});
    });
    doc.addEventListener('change',ev=>{
      if(ev.target.id==='crmV71DefaultPriority') setAndApply({defaultLeadPriority:ev.target.value});
      if(ev.target.id==='crmV71ImportSettings') importSettingsFile(ev.target.files&&ev.target.files[0]);
    });
    doc.addEventListener('keydown',ev=>{if(ev.key==='Escape')closeSettings();});
    doc.addEventListener('crm:viewchange',()=>setTimeout(()=>applyLeadFormDefaults(load()),60));
  }
  function boot(){
    ensureSettings();bind();apply(load());enhanceFilters();applyLeadFormDefaults(load());
    let pending=false;
    /* V97.1: observer v71 desativado para evitar loop; funções rodam no boot e eventos. */
  }
  const api={load,save,apply,set:setAndApply,open:openSettings,close:closeSettings,enhanceFilters,defaults};
  window.crmV71Settings=api;
  window.crmV61Settings=api;
  window.crmV46Settings=api;
  if(doc.readyState==='loading') doc.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
