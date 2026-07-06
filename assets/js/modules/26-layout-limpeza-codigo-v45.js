/* Script original 26 */
(function(){
  const doc = document;
  const STORE_MODE = 'crm_v45_layout_mode';
  const STORE_CENTER = 'crm_v45_centered';
  const STORE_VIEW = 'crm_v45_current_view';
  const TITLES = {
    inicio:['Painel','Visão geral das oportunidades'],
    leads:['Leads','Base comercial e cadastros'],
    garimpo:['Garimpo','Prospecção e enriquecimento'],
    pipeline:['Pipeline','Kanban operacional de oportunidades'],
    funil:['Funil','Conversão comercial'],
    agenda:['Agenda','Múltiplas agendas, cores, recorrência e compartilhamento'],
    ligacoes:['Ligações','Fila de discagem e registro comercial'],
    chat:['Chat','Conversas e mensagens'],
    dashboard:['Dashboard','Análise comercial consolidada'],
    metricas:['Métricas','Indicadores de desempenho'],
    cadencias:['Follow-ups','Fila, etapas e cadências comerciais'],
    followups:['Follow-ups','Fila, etapas e cadências comerciais'],
    metas:['Metas','Objetivos e ritmo comercial'],
    automacoes:['Automações','Regras por área para automatizar o CRM'],
    playbooks:['Playbooks','Scripts e padrões comerciais'],
    objecoes:['Objeções','Biblioteca de respostas'],
    perdas:['Perdas','Motivos de perda e reativação'],
    importar:['Importar / Exportar','Gerencie seus dados'],
    'novo-lead':['Novo lead','Cadastro rápido']
  };
  const $ = (s,r) => (r||doc).querySelector(s);
  const $$ = (s,r) => Array.from((r||doc).querySelectorAll(s));

  function currentView(){ return $('.view.active')?.id || localStorage.getItem(STORE_VIEW) || 'inicio'; }

  function updateTitle(id){
    const t = TITLES[id]; if(!t) return;
    const title = $('#topbarTitle') || $('.topbar-title');
    const sub = $('#topbarSub') || $('.topbar-sub');
    if(title) title.textContent = t[0];
    if(sub) sub.textContent = t[1];
  }

  function safeShow(id){
    if(id === 'followups' && !doc.getElementById('followups') && doc.getElementById('cadencias')) id = 'cadencias';
    if(id === 'novo-lead'){
      try{ if(typeof window.openModal === 'function'){ window.openModal(null); return true; } }catch(e){}
      id = currentView();
    }
    const target = doc.getElementById(id) || doc.getElementById('inicio') || $('.view[id]');
    if(!target) return false;
    id = target.id;
    $$('.view[id]').forEach(v => {
      const on = v.id === id;
      v.classList.toggle('active', on);
      if(on){ v.style.display = ''; v.removeAttribute('aria-hidden'); }
      else { v.style.display = 'none'; v.setAttribute('aria-hidden','true'); }
    });
    $$('[data-view],[data-go],[data-go-view]').forEach(btn => {
      const targetId = btn.dataset.view || btn.dataset.go || btn.dataset.goView;
      btn.classList.toggle('active', targetId === id || (id === 'cadencias' && targetId === 'followups'));
    });
    localStorage.setItem(STORE_VIEW, id);
    updateTitle(id);
    try{
      const renderers = {
        inicio:['renderAll','renderKPIs'],
        leads:['renderLeadsTable','renderLeads','renderClientTable'],
        pipeline:['renderBoard','renderPipelineV23','renderBoardV20'],
        funil:['renderFunnel','renderFunnelReal'],
        agenda:['renderAgenda','renderAgendaPro'],
        ligacoes:['renderLigacoes','renderCalls'],
        cadencias:['renderFollowups','renderCadencias','renderCadenciasPro'],
        followups:['renderFollowups','renderCadencias','renderCadenciasPro'],
        metas:['renderMetas','renderGoals'],
        automacoes:['renderAutomacoes','renderAutomationLab'],
        dashboard:['renderDashboard','renderDashboardPro'],
        metricas:['renderMetrics','renderMetricas']
      };
      (renderers[id]||[]).forEach(name => { try{ if(typeof window[name] === 'function') window[name](); }catch(e){} });
    }catch(e){}
    return true;
  }

  function bindTabs(){
    // V60: a navegação fica centralizada no módulo 21.
    // Este módulo mantém apenas o painel de layout/limpeza para não duplicar roteadores.
    if(doc.__crmV45TabsBound) return;
    doc.__crmV45TabsBound = true;
  }

  function layoutPanel(){
    return '<div id="crmV45LayoutPanel" aria-hidden="true">'+
      '<div class="crm-v45-panel-title">Personalizar layout</div>'+
      '<div class="crm-v45-panel-sub">Escolha um visual mais simples sem apagar funções do CRM.</div>'+
      '<div class="crm-v45-layout-grid">'+
        '<button class="crm-v45-choice" data-crm-v45-mode="complete"><b>Completo</b><span>Mostra todas as ações e blocos.</span></button>'+
        '<button class="crm-v45-choice" data-crm-v45-mode="simple"><b>Simples</b><span>Limpa botões extras e reduz ruído.</span></button>'+
        '<button class="crm-v45-choice" data-crm-v45-mode="compact"><b>Compacto</b><span>Menos espaço e mais dados por tela.</span></button>'+
        '<button class="crm-v45-choice" data-crm-v45-mode="focus"><b>Foco</b><span>Prioriza operação comercial.</span></button>'+
      '</div>'+
      '<div class="crm-v45-option"><span>Centralizar área de trabalho</span><button class="crm-v45-switch" id="crmV45CenterSwitch" type="button"></button></div>'+
      '<div class="crm-v45-option"><span>Limpar textos de código vazado</span><button class="btn btn-sm" id="crmV45CleanBtn" type="button">Limpar</button></div>'+
      '<div class="crm-v45-note">Esta versão não apaga o app inteiro. Ela apenas esconde textos soltos que pareçam código, mantendo as abas e funções da v41.</div>'+
    '</div>';
  }

  function applyMode(mode){
    mode = mode || localStorage.getItem(STORE_MODE) || 'complete';
    doc.body.classList.remove('crm-v45-simple','crm-v45-compact','crm-v45-focus');
    if(mode === 'simple') doc.body.classList.add('crm-v45-simple');
    if(mode === 'compact') doc.body.classList.add('crm-v45-simple','crm-v45-compact');
    if(mode === 'focus') doc.body.classList.add('crm-v45-simple','crm-v45-focus');
    localStorage.setItem(STORE_MODE, mode);
    $$('.crm-v45-choice').forEach(b => b.classList.toggle('active', b.dataset.crmV45Mode === mode));
  }

  function cleanLooseCode(root){
    root = root || $('.main') || doc.body;
    if(!root) return 0;
    const patterns = [/function\s+[A-Za-z0-9_$]*\s*\(/,/\b(?:const|let|var)\s+[A-Za-z0-9_$]+\s*=/,/document\.(querySelector|getElementById|createElement|addEventListener)/,/window\.[A-Za-z0-9_$]+/,/\.innerHTML\s*=/,/MutationObserver/,/localStorage\.(getItem|setItem)/,/querySelectorAll\(/,/render[A-Z][A-Za-z0-9_$]*\s*\(/];
    function looks(txt){
      const t = String(txt || '').replace(/\s+/g,' ').trim();
      if(t.length < 80) return false;
      let hits = 0; patterns.forEach(rx => { if(rx.test(t)) hits++; });
      return hits >= 2 || (t.length > 450 && /[{};=()]/.test(t) && /(function|document|window|const|let|var|return)/.test(t));
    }
    let removed = 0;
    try{
      const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node){
          const p = node.parentElement;
          if(!p) return NodeFilter.FILTER_REJECT;
          if(['SCRIPT','STYLE','TEXTAREA','INPUT','CODE','PRE'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
          if(['BODY','HTML'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
          return looks(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      const bad = []; let n; while((n = walker.nextNode())) bad.push(n);
      bad.forEach(n => { try{ n.nodeValue=''; removed++; }catch(e){} });
    }catch(e){}
    return removed;
  }

  function installLayout(){
    if($('#crmV45LayoutBtn')) return;
    const actions = $('.topbar-actions') || $('.topbar');
    if(!actions) return;
    const btn = doc.createElement('button');
    btn.id = 'crmV45LayoutBtn'; btn.type = 'button'; btn.className = 'btn'; btn.textContent = 'Layout';
    actions.insertBefore(btn, actions.firstChild);
    doc.body.insertAdjacentHTML('beforeend', layoutPanel());
    const panel = $('#crmV45LayoutPanel');
    btn.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); panel.classList.toggle('open'); panel.setAttribute('aria-hidden', panel.classList.contains('open')?'false':'true'); });
    doc.addEventListener('click', function(ev){ if(panel && !panel.contains(ev.target) && ev.target !== btn) panel.classList.remove('open'); });
    $$('.crm-v45-choice', panel).forEach(b => b.addEventListener('click', () => applyMode(b.dataset.crmV45Mode)));
    const sw = $('#crmV45CenterSwitch');
    const centered = localStorage.getItem(STORE_CENTER) === '1';
    doc.body.classList.toggle('crm-v45-centered', centered); if(sw) sw.classList.toggle('on', centered);
    sw && sw.addEventListener('click', () => { const on = !doc.body.classList.contains('crm-v45-centered'); doc.body.classList.toggle('crm-v45-centered', on); sw.classList.toggle('on', on); localStorage.setItem(STORE_CENTER, on?'1':'0'); });
    $('#crmV45CleanBtn')?.addEventListener('click', () => { const n = cleanLooseCode(); try{ if(typeof window.showToast === 'function') window.showToast(n ? 'Textos de código removidos.' : 'Nenhum código visível encontrado.','success'); }catch(e){} });
    applyMode(localStorage.getItem(STORE_MODE) || 'complete');
  }

  function boot(){
    doc.body.classList.add('crm-v45');
    bindTabs();
    installLayout();
    cleanLooseCode();
    // V60: não força a aba inicial por uma chave antiga; evita reabrir uma tela obsoleta.
    setTimeout(() => { cleanLooseCode(); }, 300);
  }

  window.crmV45Show = safeShow;
  window.crmV45CleanLooseCode = cleanLooseCode;
  window.crmV45Layout = applyMode;
  if(doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
