/* CRM v48 — ajustes de botões, lateral e experiência por área */
(function(){
  'use strict';
  if(window.__crmV48UxButtonsAreas) return;
  window.__crmV48UxButtonsAreas = true;

  const DOC = document;
  const $ = (s,r=DOC)=>r.querySelector(s);
  const $$ = (s,r=DOC)=>Array.from(r.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const VIEW_META = {
    inicio:['Painel','Rotina do dia, próximos contatos e atalhos principais'],
    leads:['Leads','Base comercial, filtros, edição rápida e ações em massa'],
    pipeline:['Pipeline','Kanban, funil, calendário e gargalos por etapa'],
    clientes:['Clientes','Relacionamentos cadastrados e oportunidades fechadas'],
    cadencias:['Follow-ups','Fila diária de contatos, atrasos e próximos passos'],
    automacoes:['Automações','Regras simples no formato quando acontecer → fazer isso'],
    agenda:['Agenda','Compromissos, follow-ups, reuniões e planejamento comercial'],
    ligacoes:['Ligações','Fila de discagem, timer, resultado e histórico de contatos'],
    metas:['Metas','Objetivos, ritmo comercial e progresso operacional'],
    playbooks:['Playbooks','Scripts, checklists e materiais para vender melhor'],
    objecoes:['Objeções','Respostas rápidas por tipo de objeção'],
    perdas:['Perdas','Motivos de perda, análise e reativação futura'],
    dashboard:['Dashboard','Visão rápida para decisão comercial'],
    metricas:['Métricas','Análise detalhada de conversão, produtividade e origem'],
    importar:['Importar/Exportar','Backup, CSV e manutenção dos dados'],
    chat:['Chat','Conversas, WhatsApp Web e respostas rápidas'],
    garimpo:['Garimpo','Prospecção e criação rápida de oportunidades'],
    funil:['Funil','Conversão, forecast e comparação comercial'],
    'novo-lead':['Novo lead','Cadastro rápido de oportunidade']
  };

  const ID_LABELS = {
    bulkClearBtn:'Limpar seleção',
    autoNewBtn:'Nova automação',
    autoEmptyNewBtn:'Criar primeira automação',
    autoModalClose:'Fechar automação',
    gcalClose:'Fechar Google Calendar',
    agDetailClose:'Fechar detalhes do compromisso',
    agEventClose:'Fechar compromisso',
    pbDetailClose:'Fechar playbook',
    pbModalClose:'Fechar playbook',
    objModalClose:'Fechar objeção',
    perdaModalClose:'Fechar perda',
    waConnectClose:'Fechar conexão WhatsApp',
    qrClose:'Fechar respostas rápidas',
    modalCancel:'Fechar lead',
    lossCancel:'Fechar perda',
    bulkStageClose:'Fechar mover etapa',
    bulkRespClose:'Fechar responsável',
    detailClose:'Fechar detalhes do lead',
    chatSendBtn:'Enviar mensagem',
    chatQuickReplies:'Respostas rápidas',
    dDeleteBtn:'Excluir lead',
    timerStart:'Iniciar timer',
    timerPause:'Pausar timer',
    timerStop:'Parar timer',
    calPrev:'Mês anterior',
    calNext:'Próximo mês',
    dashRefresh:'Atualizar dashboard',
    themeToggle:'Alternar tema',
    panelChooseWidgets:'Escolher quadros do painel',
    panelMoveWidgets:'Mover quadros do painel',
    panelShowAllWidgets:'Mostrar todos os quadros',
    panelStartRoutine:'Começar rotina comercial',
    panelNewLeadBtn:'Novo lead',
    fuOpenQuickCreate:'Novo follow-up',
    fuGenerateRoutine:'Gerar rotina de hoje',
    fuSaveQuick:'Salvar follow-up',
    gcalConnectBtn:'Google Calendar',
    gcalAuthBtn:'Autorizar com Google',
    gcalExportBtn:'Exportar compromissos',
    gcalDisconnectBtn:'Desconectar Google Calendar',
    agNewBtn:'Novo compromisso',
    agEventCancel:'Cancelar compromisso',
    agEventDelete:'Excluir compromisso',
    agEventSave:'Salvar compromisso',
    pbNewBtn:'Novo playbook',
    objNewBtn:'Nova objeção',
    perdaNewBtn:'Registrar perda',
    waConnectBtn:'Conectar WhatsApp',
    chatCallBtn:'Ligar para contato',
    chatViewLeadBtn:'Ver lead',
    clearAllBtn:'Limpar todos os dados',
    exportCsvBtn:'Exportar CSV',
    exportCsvBtn2:'Exportar CSV',
    exportJsonBtn:'Exportar JSON'
  };

  const CLOSE_IDS = new Set(['autoModalClose','gcalClose','agDetailClose','agEventClose','pbDetailClose','pbModalClose','objModalClose','perdaModalClose','waConnectClose','qrClose','modalCancel','lossCancel','bulkStageClose','bulkRespClose','detailClose','v19ColsClose','v19ExportClose']);

  function visibleText(el){ return (el.textContent || '').replace(/\s+/g,' ').trim(); }

  function ensureVisibleLabel(btn, label){
    if(!btn || !label) return;
    const text = visibleText(btn);
    if(text) return;
    if(CLOSE_IDS.has(btn.id) || btn.classList.contains('modal-close')){
      btn.innerHTML = '<span aria-hidden="true">×</span>';
      return;
    }
    if(btn.id === 'autoNewBtn'){
      btn.innerHTML = '<span aria-hidden="true">+</span><span>Nova automação</span>';
      btn.classList.add('crm-ux-text-btn');
      return;
    }
    if(btn.id === 'bulkClearBtn'){
      btn.innerHTML = '<span aria-hidden="true">×</span><span>Limpar seleção</span>';
      btn.classList.add('crm-ux-text-btn');
      return;
    }
    if(btn.id === 'chatSendBtn'){
      btn.innerHTML = '<span>Enviar</span>';
      btn.classList.add('crm-ux-text-btn');
      return;
    }
    if(btn.id === 'chatQuickReplies'){
      btn.innerHTML = '<span>Respostas rápidas</span>';
      btn.classList.add('crm-ux-text-btn');
      return;
    }
    if(btn.id === 'dDeleteBtn'){
      btn.insertAdjacentHTML('beforeend','<span>Excluir lead</span>');
      btn.classList.add('crm-ux-text-btn');
      return;
    }
    if(btn.classList.contains('panel-color-btn')){
      btn.classList.add('crm-ux-icon-only');
      return;
    }
    btn.insertAdjacentHTML('beforeend','<span class="crm-ux-sr-only">'+esc(label)+'</span>');
  }

  function labelFromButton(btn){
    if(btn.id && ID_LABELS[btn.id]) return ID_LABELS[btn.id];
    if(btn.classList.contains('modal-close')) return 'Fechar';
    if(btn.classList.contains('panel-color-btn')) return 'Mudar cor do quadro';
    if(btn.classList.contains('panel-hide-btn')) return 'Ocultar quadro';
    if(btn.dataset.view && VIEW_META[btn.dataset.view]) return VIEW_META[btn.dataset.view][0];
    if(btn.dataset.fuTemplate) return 'Usar modelo '+btn.dataset.fuTemplate;
    if(btn.dataset.v23View) return 'Ver '+btn.dataset.v23View;
    if(btn.dataset.v36AutoArea) return 'Filtrar automações de '+btn.dataset.v36AutoArea;
    if(btn.dataset.v41AgendaView) return 'Visualização '+btn.dataset.v41AgendaView;
    if(btn.dataset.v41AutoToggle) return 'Ativar ou desativar automação';
    if(btn.dataset.v41AutoEdit) return 'Editar automação';
    if(btn.dataset.v41AutoDelete) return 'Excluir automação';
    if(btn.dataset.panelColor) return 'Mudar cor do quadro';
    if(btn.dataset.panelHide) return 'Ocultar quadro';
    const text = visibleText(btn);
    return text || 'Botão de ação';
  }

  function normalizeButtons(root=DOC){
    $$('button', root).forEach(btn=>{
      if(!btn.getAttribute('type')) btn.type = 'button';
      const label = labelFromButton(btn);
      if(!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', label);
      if(!btn.getAttribute('title') && (visibleText(btn)==='' || btn.classList.contains('rail-btn') || btn.classList.contains('modal-close'))) btn.setAttribute('title', label);
      ensureVisibleLabel(btn,label);
    });
    $$('a.qa-btn,a.row-action,a[href^="tel:"],a[href^="mailto:"],a[href*="wa.me"]', root).forEach(a=>{
      const label = a.getAttribute('title') || visibleText(a) || (a.href.startsWith('tel:')?'Ligar':a.href.startsWith('mailto:')?'Enviar e-mail':'Abrir link');
      if(!a.getAttribute('aria-label')) a.setAttribute('aria-label', label);
      if(!a.getAttribute('title')) a.setAttribute('title', label);
    });
  }

  function setFirstText(el, label){
    if(!el || !label) return;
    let span = Array.from(el.children).find(c => c.tagName === 'SPAN' && !c.classList.contains('nav-badge'));
    if(span) span.textContent = label;
    else if(el.classList.contains('tab')) el.textContent = label;
    else el.insertAdjacentHTML('beforeend','<span>'+esc(label)+'</span>');
  }

  function normalizeSidebar(){
    $$('[data-view]').forEach(el=>{
      const view = el.dataset.view;
      const meta = VIEW_META[view];
      if(!meta) return;
      const label = meta[0];
      if(el.classList.contains('nav-item') || el.classList.contains('tab')) setFirstText(el,label);
      el.setAttribute('aria-label', label);
      if(!el.getAttribute('title') || el.classList.contains('rail-btn') || el.classList.contains('rail-logo')) el.setAttribute('title', label);
      el.dataset.label = label;
    });

    // Corrige visualmente o menu lateral quando os nomes ficam espremidos.
    $$('.nav-item').forEach(btn=>{
      btn.classList.add('crm-ux-nav-normalized');
      const view = btn.dataset.view;
      const isActive = btn.classList.contains('active');
      if(isActive) btn.setAttribute('aria-current','page'); else btn.removeAttribute('aria-current');
      if(view === 'novo-lead') btn.classList.add('crm-ux-new-lead-entry');
    });
  }

  function clickSelector(selector){ const el=$(selector); if(el){ el.click(); return true; } return false; }
  function go(view){ try{ if(typeof window.setView === 'function') window.setView(view); else clickSelector('[data-view="'+view+'"]'); }catch(e){ clickSelector('[data-view="'+view+'"]'); } }

  function btn(label, attrs='', cls='btn btn-sm'){
    return '<button class="'+cls+'" type="button" '+attrs+'>'+esc(label)+'</button>';
  }

  function ensureAfter(ref, id, html){
    if(!ref || $('#'+id)) return;
    ref.insertAdjacentHTML('afterend', html);
  }
  function ensureBefore(ref, id, html){
    if(!ref || $('#'+id)) return;
    ref.insertAdjacentHTML('beforebegin', html);
  }
  function ensureStart(container, id, html){
    if(!container || $('#'+id)) return;
    container.insertAdjacentHTML('afterbegin', html);
  }

  function homeUx(){
    const page=$('#inicio'); if(!page) return;
    const ref=$('#panelWidgetsGrid') || page.querySelector('.panel-pro-toolbar') || page.firstElementChild;
    ensureBefore(ref,'crmUxHomeStrip',
      '<div class="crm-ux-strip" id="crmUxHomeStrip"><div><strong>Rotina comercial do dia</strong><span>Comece pelo que move venda: atrasados, contatos de hoje, leads quentes e propostas abertas.</span></div><div class="crm-ux-actions">'+
      btn('Abrir follow-ups','data-ux-go="cadencias"','btn btn-sm btn-primary')+
      btn('Ver pipeline','data-ux-go="pipeline"')+
      btn('Novo lead','data-ux-new-lead')+
      '</div></div>'
    );
  }

  function leadsUx(){
    const page=$('#leads'); if(!page) return;
    const ref=$('#v19LeadKpis') || $('#v19LeadsHero') || page.querySelector('.section-header');
    ensureAfter(ref,'crmUxLeadsCommand',
      '<div class="crm-ux-command" id="crmUxLeadsCommand"><div><strong>Central de ação dos leads</strong><span>Use a tabela como operação: atualize etapa, prioridade, responsável, follow-up e valor direto na linha.</span></div><div class="crm-ux-actions">'+
      btn('Leads quentes','data-ux-kpi="hot"')+
      btn('Follow-ups vencidos','data-ux-kpi="overdue"')+
      btn('Propostas abertas','data-ux-kpi="proposal"')+
      btn('Novo lead','data-ux-new-lead','btn btn-sm btn-primary')+
      '</div></div>'
    );
  }

  function pipelineUx(){
    const page=$('#pipeline'); if(!page) return;
    const ref=$('#pipelineV23ViewBar') || $('#pipelineV20Hero') || page.querySelector('.section-header');
    ensureAfter(ref,'crmUxPipelineCommand',
      '<div class="crm-ux-strip" id="crmUxPipelineCommand"><div><strong>Pipeline operacional</strong><span>Alterne a visualização conforme a decisão: Kanban para operar, Gantt para follow-up e calendário para datas.</span><div class="crm-ux-tagline"><span>Valor por etapa</span><span>Tempo parado</span><span>Próxima ação</span></div></div><div class="crm-ux-actions">'+
      btn('Kanban','data-ux-pipe-view="kanban"')+
      btn('Gantt','data-ux-pipe-view="gantt"')+
      btn('Calendário','data-ux-pipe-view="calendar"')+
      btn('Novo lead','data-ux-new-lead','btn btn-sm btn-primary')+
      '</div></div>'
    );
  }

  function followUx(){
    const page=$('#cadencias'); if(!page) return;
    const ref=$('.followups-toolbar',page) || $('.followups-hero',page) || page.firstElementChild;
    ensureBefore(ref,'crmUxFollowCommand',
      '<div class="crm-ux-strip" id="crmUxFollowCommand"><div><strong>Modo execução de follow-ups</strong><span>Trabalhe em fila: resolva vencidos, execute hoje, agende os sem data e avance cada card.</span></div><div class="crm-ux-actions">'+
      btn('Vencidos','data-ux-fu-filter="vencidos"','btn btn-sm btn-primary')+
      btn('Hoje','data-ux-fu-filter="hoje"')+
      btn('Sem data','data-ux-fu-filter="sem-data"')+
      btn('Gerar rotina','data-ux-click="#fuGenerateRoutine"')+
      '</div></div>'
    );
  }

  function automationsUx(){
    const page=$('#automacoes'); if(!page) return;
    const ref=page.querySelector('.section-header') || page.querySelector('.v41-head') || page.firstElementChild;
    ensureAfter(ref,'crmUxAutomationBuilder',
      '<div class="crm-ux-area-card" id="crmUxAutomationBuilder" style="padding:16px;margin-bottom:16px"><div class="crm-ux-flow"><div class="crm-ux-flow-box"><strong>Quando acontecer</strong><span>Ex: lead entrou em proposta, follow-up venceu ou ficou parado.</span></div><div class="crm-ux-arrow">→</div><div class="crm-ux-flow-box"><strong>Fazer automaticamente</strong><span>Ex: criar tarefa, alterar prioridade, registrar atividade ou criar evento.</span></div></div></div>'+
      '<div class="crm-ux-mini-grid" id="crmUxAutomationTemplates">'+
      '<button class="crm-ux-mini-card" type="button" data-ux-auto-template="followup"><strong>Lead sem contato</strong><span>Criar follow-up após 7 dias sem avanço.</span></button>'+
      '<button class="crm-ux-mini-card" type="button" data-ux-auto-template="proposta"><strong>Proposta enviada</strong><span>Criar retorno em 2 dias e destacar prioridade.</span></button>'+
      '<button class="crm-ux-mini-card" type="button" data-ux-auto-template="perda"><strong>Lead perdido</strong><span>Pedir motivo da perda e agendar reativação.</span></button>'+
      '</div>'
    );
  }

  function agendaUx(){
    const page=$('#agenda'); if(!page) return;
    const ref=$('#agendaToolsV36') || page.querySelector('.section-header') || page.querySelector('.v41-head') || page.firstElementChild;
    ensureAfter(ref,'crmUxAgendaNotice',
      '<div class="crm-ux-notice" id="crmUxAgendaNotice"><div><strong>Agenda ligada à rotina comercial</strong><span>Use compromisso, reunião, ligação e follow-up como um mesmo fluxo. A conexão real com Google Calendar precisa de configuração técnica/OAuth; a exportação local continua segura.</span></div></div>'
    );
  }

  function playbooksUx(){
    const page=$('#playbooks'); if(!page) return;
    const ref=page.querySelector('.section-header') || page.firstElementChild;
    ensureAfter(ref,'crmUxPlaybookCommand',
      '<div class="crm-ux-command" id="crmUxPlaybookCommand"><div><strong>Playbook na hora da venda</strong><span>Use os scripts como ferramenta prática: copie, adapte para WhatsApp ou use como roteiro de ligação.</span></div><div class="crm-ux-actions">'+
      btn('Novo playbook','data-ux-click="#pbNewBtn"','btn btn-sm btn-primary')+
      btn('Outbound','data-ux-chip-text="Outbound"')+
      btn('Fechamento','data-ux-chip-text="Fechamento"')+
      '</div></div>'
    );
  }

  function objectionsUx(){
    const page=$('#objecoes'); if(!page) return;
    const ref=page.querySelector('.section-header') || page.firstElementChild;
    ensureAfter(ref,'crmUxObjectionCommand',
      '<div class="crm-ux-command" id="crmUxObjectionCommand"><div><strong>Resposta rápida de objeções</strong><span>Organize por preço, tempo, concorrência, necessidade e autoridade para responder sem improvisar.</span></div><div class="crm-ux-actions">'+
      btn('Nova objeção','data-ux-click="#objNewBtn"','btn btn-sm btn-primary')+
      btn('Preço','data-ux-chip-text="Preço"')+
      btn('Concorrência','data-ux-chip-text="Concorrência"')+
      btn('Tempo','data-ux-chip-text="Tempo"')+
      '</div></div>'
    );
  }

  function lossesUx(){
    const page=$('#perdas'); if(!page) return;
    const ref=page.querySelector('.section-header') || page.firstElementChild;
    ensureAfter(ref,'crmUxLossCommand',
      '<div class="crm-ux-command" id="crmUxLossCommand"><div><strong>Perdas virando aprendizado</strong><span>Registre motivo, concorrente, valor perdido e data de reativação para melhorar o processo comercial.</span></div><div class="crm-ux-actions">'+
      btn('Registrar perda','data-ux-click="#perdaNewBtn"','btn btn-sm btn-primary')+
      btn('Ver dashboard','data-ux-go="dashboard"')+
      btn('Métricas','data-ux-go="metricas"')+
      '</div></div>'
    );
  }

  function dashboardUx(){
    const page=$('#dashboard'); if(!page) return;
    const ref=page.querySelector('.section-header') || page.firstElementChild;
    ensureAfter(ref,'crmUxDashboardCommand',
      '<div class="crm-ux-strip" id="crmUxDashboardCommand"><div><strong>Dashboard para decisão rápida</strong><span>Use esta tela para enxergar resultado do mês, produtividade e gargalos. Para análise profunda, abra Métricas.</span></div><div class="crm-ux-actions">'+
      btn('Atualizar','data-ux-click="#dashRefresh"')+
      btn('Abrir métricas','data-ux-go="metricas"','btn btn-sm btn-primary')+
      '</div></div>'
    );
  }

  function metricsUx(){
    const page=$('#metricas'); if(!page) return;
    const ref=page.querySelector('.section-header') || page.firstElementChild;
    ensureAfter(ref,'crmUxMetricsCommand',
      '<div class="crm-ux-strip" id="crmUxMetricsCommand"><div><strong>Métricas para diagnóstico</strong><span>Aqui ficam conversão por etapa, origem dos leads, produtividade, perdas e comparativos. Dashboard continua sendo a visão rápida.</span></div><div class="crm-ux-actions">'+
      btn('Abrir dashboard','data-ux-go="dashboard"')+
      btn('Ver pipeline','data-ux-go="pipeline"','btn btn-sm btn-primary')+
      '</div></div>'
    );
  }

  function chatUx(){
    const page=$('#chat'); if(!page) return;
    const ref=$('#chatLayout') || page.firstElementChild;
    ensureBefore(ref,'crmUxChatNotice',
      '<div class="crm-ux-notice" id="crmUxChatNotice"><div><strong>Chat em dois modos</strong><span>Modo simples: abrir WhatsApp Web/manual. Modo profissional: conectar API/webhook. Deixe isso claro para não parecer que a API já está ativa sem configuração.</span></div></div>'
    );
  }

  function importUx(){
    const page=$('#importar'); if(!page) return;
    const ref=page.querySelector('.section-header') || page.firstElementChild;
    ensureAfter(ref,'crmUxImportNotice',
      '<div class="crm-ux-notice" id="crmUxImportNotice"><div><strong>Backup antes de grandes mudanças</strong><span>Antes de alterar estrutura, exporte JSON. CSV é melhor para planilha; JSON é melhor para restaurar o CRM.</span></div></div>'
    );
  }

  function areaUx(){
    homeUx(); leadsUx(); pipelineUx(); followUx(); automationsUx(); agendaUx(); playbooksUx(); objectionsUx(); lossesUx(); dashboardUx(); metricsUx(); chatUx(); importUx();
  }

  function applyAutomationTemplate(type){
    const templates={
      followup:{area:'Follow-ups',trigger:'Lead ficou 7 dias sem contato',action:'Criar follow-up de retorno',days:'7',name:'Reativar lead sem contato',stage:'Contato',acao:'compromisso',note:'Contato automático: lead sem avanço há 7 dias.'},
      proposta:{area:'Pipeline',trigger:'Lead entrou em Proposta',action:'Criar retorno em 2 dias e marcar prioridade alta',days:'2',name:'Retorno de proposta',stage:'Proposta',acao:'compromisso',note:'Confirmar recebimento da proposta e tirar dúvidas.'},
      perda:{area:'Perdas',trigger:'Lead marcado como Perdido',action:'Registrar motivo e criar reativação futura',days:'30',name:'Reativação de perdido',stage:'Perdido',acao:'nota',note:'Registrar motivo da perda e revisar reativação futura.'}
    };
    const t=templates[type]||templates.followup;
    clickSelector('#v41AutoNew') || clickSelector('#autoNewBtn') || clickSelector('#autoEmptyNewBtn');
    setTimeout(()=>{
      const set=(id,val)=>{const el=$('#'+id);if(el){el.value=val;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
      set('v41AutoArea',t.area); set('v41AutoTrigger',t.trigger); set('v41AutoAction',t.action); set('v41AutoDays',t.days);
      set('autoNome',t.name); set('autoEtapa',t.stage); set('autoAcao',t.acao); set('autoCompNota',t.note); set('autoNotaTexto',t.note);
    },120);
  }

  function bindUxActions(){
    if(DOC.body.dataset.crmV48UxBound) return;
    DOC.body.dataset.crmV48UxBound='1';
    DOC.addEventListener('click', function(e){
      const goBtn=e.target.closest('[data-ux-go]'); if(goBtn){ e.preventDefault(); go(goBtn.dataset.uxGo); return; }
      if(e.target.closest('[data-ux-new-lead]')){ e.preventDefault(); try{ if(typeof window.openModal === 'function') window.openModal(null); else go('novo-lead'); }catch(err){ go('novo-lead'); } return; }
      const click=e.target.closest('[data-ux-click]'); if(click){ e.preventDefault(); clickSelector(click.dataset.uxClick); return; }
      const kpi=e.target.closest('[data-ux-kpi]'); if(kpi){ e.preventDefault(); clickSelector('[data-v19-kpi="'+kpi.dataset.uxKpi+'"]'); return; }
      const fu=e.target.closest('[data-ux-fu-filter]'); if(fu){ e.preventDefault(); clickSelector('[data-fu-filter="'+fu.dataset.uxFuFilter+'"]'); return; }
      const pv=e.target.closest('[data-ux-pipe-view]'); if(pv){ e.preventDefault(); clickSelector('[data-v23-view="'+pv.dataset.uxPipeView+'"]') || clickSelector('[data-v41-agenda-view="'+pv.dataset.uxPipeView+'"]'); return; }
      const chip=e.target.closest('[data-ux-chip-text]'); if(chip){ e.preventDefault(); const txt=chip.dataset.uxChipText.toLowerCase(); const target=$$('.chip,.v41-chip').find(c=>(c.textContent||'').trim().toLowerCase()===txt); if(target) target.click(); return; }
      const auto=e.target.closest('[data-ux-auto-template]'); if(auto){ e.preventDefault(); applyAutomationTemplate(auto.dataset.uxAutoTemplate); return; }
    }, true);
  }

  function runAll(){
    normalizeSidebar();
    normalizeButtons();
    areaUx();
    normalizeButtons();
  }

  function boot(){
    bindUxActions();
    runAll();
    setTimeout(runAll,250);
    setTimeout(runAll,900);
    setTimeout(runAll,1800);
    DOC.addEventListener('crm:viewchange',()=>setTimeout(runAll,120));
    const prev = window.setView;
    if(typeof prev === 'function' && !prev.__crmV48Ux){
      const wrapped = function(){ const out = prev.apply(this,arguments); setTimeout(runAll,160); return out; };
      wrapped.__crmV48Ux = true;
      window.setView = wrapped;
      try{ setView = wrapped; }catch(e){}
    }
    const obs = new MutationObserver(()=>{ clearTimeout(window.__crmV48UxTick); window.__crmV48UxTick=setTimeout(runAll,100); });
    obs.observe(DOC.body,{childList:true,subtree:true});
  }

  if(DOC.readyState === 'loading') DOC.addEventListener('DOMContentLoaded',boot); else boot();
})();
