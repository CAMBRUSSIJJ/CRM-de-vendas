(function(){
  'use strict';
  const KEY = 'crm_v97_2_settings';
  const BACKUP_PREFIX = 'realtalent-crm-backup-';
  const CRITICAL_SECTIONS = ['inicio','leads','garimpo','pipeline','ligacoes','cadencias','agenda','chat','playbooks','metas','automacoes','metricas','configuracoes'];
  const ARCHIVE_SECTIONS = ['funil','clientes','objecoes','dashboard','perdas','importar'];
  const DEFAULTS = {
    workspace:'RealTalent CRM', empresa:'RealTalent', cidade:'Porto Alegre', moeda:'BRL', formatoData:'pt-BR', expedienteInicio:'08:00', expedienteFim:'18:00', responsavel:'',
    tema:'premium', densidade:'padrao', filtros:'recolhidos', fichaLead:'painel', modoLigacao:'tela-cheia',
    resumoDiario:true, notificacoesInternas:true, notificacoesNavegador:false, avisoMinutos:'15', toastSegundos:'6', som:false,
    automacoesConfirmar:false, permitirDesfazer:true, historicoSempre:true, limiteExecucoes:'200', horarioPadrao:'10:00',
    visible:{}, aliases:{cadencias:'Follow-ups', metricas:'Métricas', automacoes:'Automações'}
  };
  const NAV_META = [
    {group:'Operação', items:[['inicio','Painel','Rotina e atalhos do dia'],['leads','Leads','Base principal de contatos'],['garimpo','Garimpo','Entrada de novos leads'],['pipeline','Pipeline','Kanban, funil e perdas']]},
    {group:'Relacionamento', items:[['ligacoes','Ligações','Modo ligação e scripts'],['cadencias','Follow-ups','Próximas ações e cadências'],['agenda','Agenda','Compromissos e retornos'],['chat','Atendimento','Conversas e suporte']]},
    {group:'Estratégia', items:[['playbooks','Playbooks','Scripts, objeções e templates'],['metas','Metas','Objetivos e rotina'],['automacoes','Automações','Regras, lembretes e notificações']]},
    {group:'Gestão', items:[['metricas','Métricas','Dashboard, indicadores e perdas'],['configuracoes','Configurações','Personalização e manutenção']]}
  ];
  const CONSOLIDATED = [
    ['funil','Pipeline','Funil passa a ser uma visão interna do Pipeline.'],
    ['clientes','Leads','Clientes passa a ser um filtro/segmento dentro de Leads.'],
    ['objecoes','Playbooks','Objeções ficam junto dos scripts e templates.'],
    ['dashboard','Métricas','Dashboard executivo vira subaba de Métricas.'],
    ['perdas','Métricas/Pipeline','Perdas entra em análise de Métricas e etapa do Pipeline.'],
    ['importar','Configurações','Importação e backup ficam em Configurações.']
  ];
  function deepMerge(a,b){ const out=Object.assign({},a||{}); Object.keys(b||{}).forEach(k=>{ out[k] = (b[k] && typeof b[k]==='object' && !Array.isArray(b[k])) ? deepMerge(out[k],b[k]) : b[k]; }); return out; }
  function load(){ try{ return deepMerge(DEFAULTS, JSON.parse(localStorage.getItem(KEY)||'{}')); }catch(e){ return deepMerge(DEFAULTS,{}); } }
  function save(data){ localStorage.setItem(KEY, JSON.stringify(deepMerge(load(), data||{}))); applySafePreferences(); }
  function allNavIds(){ return NAV_META.flatMap(g=>g.items.map(i=>i[0])).concat(CONSOLIDATED.map(i=>i[0])); }
  function getVisible(id){ const cfg=load(); if(id==='inicio'||id==='configuracoes') return true; return cfg.visible[id] !== false; }
  function applySafePreferences(){
    const cfg = load();
    try{ document.documentElement.setAttribute('data-crm-v972-theme', cfg.tema||'premium'); }catch(e){}
    try{ document.documentElement.setAttribute('data-crm-v972-density', cfg.densidade||'padrao'); }catch(e){}
    allNavIds().forEach(id=>{
      document.querySelectorAll('[data-view="'+CSS.escape(id)+'"]').forEach(btn=>{
        const isNav = btn.classList.contains('nav-item') || btn.closest('.v97-archive-list');
        if(isNav) btn.style.display = getVisible(id) ? '' : 'none';
      });
    });
    // rename only visible nav labels that contain a span and preserve badges
    Object.entries(cfg.aliases||{}).forEach(([id,label])=>{
      document.querySelectorAll('.nav-item[data-view="'+CSS.escape(id)+'"] span:first-of-type').forEach(span=>{ if(label) span.textContent = label; });
    });
  }
  function toast(msg){
    const root=document.getElementById('configuracoes'); if(!root) return;
    let t=root.querySelector('.v972-toast'); if(!t){ t=document.createElement('div'); t.className='v972-toast'; root.appendChild(t); }
    t.textContent=msg; t.classList.add('show'); window.setTimeout(()=>t.classList.remove('show'),2200);
  }
  function field(name, value, label, type='text', hint=''){
    return '<div class="v972-field"><label>'+escapeHtml(label)+'</label><input data-v972-field="'+escapeHtml(name)+'" type="'+type+'" value="'+escapeAttr(value||'')+'">'+(hint?'<div class="v972-muted">'+escapeHtml(hint)+'</div>':'')+'</div>';
  }
  function select(name, value, label, opts){
    return '<div class="v972-field"><label>'+escapeHtml(label)+'</label><select data-v972-field="'+escapeHtml(name)+'">'+opts.map(o=>'<option value="'+escapeAttr(o[0])+'" '+(String(value)===String(o[0])?'selected':'')+'>'+escapeHtml(o[1])+'</option>').join('')+'</select></div>';
  }
  function check(name, checked, title, desc){
    return '<label class="v972-check"><span><strong>'+escapeHtml(title)+'</strong><span>'+escapeHtml(desc||'')+'</span></span><input data-v972-check="'+escapeHtml(name)+'" type="checkbox" '+(checked?'checked':'')+'></label>';
  }
  function panel(title, desc, body, actions=''){
    return '<div class="v972-panel"><div class="v972-panel-head"><div><h3>'+escapeHtml(title)+'</h3><p>'+escapeHtml(desc)+'</p></div>'+actions+'</div>'+body+'</div>';
  }
  function currentTab(){ return document.getElementById('configuracoes')?.getAttribute('data-v972-tab') || 'geral'; }
  function render(){
    const root=document.getElementById('configuracoes'); if(!root) return;
    const cfg=load();
    const tab=currentTab();
    root.classList.add('v972-config-section');
    root.innerHTML = '<div class="v972-config-shell">'+hero()+ '<div class="v972-layout">'+tabs(tab)+renderPanel(tab,cfg)+'</div><div class="v972-toast"></div></div>';
  }
  function hero(){
    return '<div class="v972-config-hero"><div><span class="v972-eyebrow">V97.2 · Navegação + Configurações Seguras</span><h2>Configurações do CRM</h2><p>Controle navegação, preferências, notificações, backup e diagnóstico sem criar páginas novas e sem bloquear botões das outras abas.</p></div><div class="v972-hero-actions"><button type="button" class="v972-btn primary" data-v972-action="save">Salvar</button><button type="button" class="v972-btn soft" data-v972-action="diagnostics">Diagnóstico</button></div></div>';
  }
  function tabs(active){
    const data=[['geral','Geral','base'],['aparencia','Aparência','tema'],['layout','Layout','ux'],['abas','Abas','nav'],['notificacoes','Notificações','alertas'],['automacoes','Automações','regras'],['backup','Backup','dados'],['diagnostico','Diagnóstico','check'],['manutencao','Manutenção','safe']];
    return '<div class="v972-tabs">'+data.map(t=>'<button type="button" class="v972-tab '+(active===t[0]?'is-active':'')+'" data-v972-tab="'+t[0]+'"><span>'+t[1]+'</span><small>'+t[2]+'</small></button>').join('')+'</div>';
  }
  function renderPanel(tab,cfg){
    switch(tab){
      case 'aparencia': return panel('Aparência','Preferências visuais salvas de forma segura. A aplicação global completa fica preparada para a próxima etapa visual.', '<div class="v972-grid">'+select('tema',cfg.tema,'Tema',[['premium','Premium RealTalent'],['claro','Claro minimalista'],['escuro','Escuro executivo']])+select('densidade',cfg.densidade,'Densidade',[['compacta','Compacta'],['padrao','Padrão'],['confortavel','Confortável']])+select('filtros',cfg.filtros,'Filtros por padrão',[['recolhidos','Recolhidos'],['abertos','Abertos']])+select('fichaLead',cfg.fichaLead,'Ficha do lead',[['painel','Painel lateral'],['modal','Modal central']])+'</div><div class="v972-card"><h4>Seguro nesta versão</h4><p>Essas preferências são salvas no localStorage, mas não aplicam uma camada global agressiva. Isso evita repetir os bugs da V96.</p></div>');
      case 'layout': return panel('Layout','Defina comportamento visual sem mexer no roteador principal.', '<div class="v972-grid">'+select('modoLigacao',cfg.modoLigacao,'Modo ligação',[['tela-cheia','Tela cheia operacional'],['painel','Painel lateral']])+select('filtros',cfg.filtros,'Filtros nas abas',[['recolhidos','Recolhidos por padrão'],['abertos','Abertos por padrão']])+select('densidade',cfg.densidade,'Densidade da interface',[['compacta','Compacta'],['padrao','Padrão'],['confortavel','Confortável']])+'</div><div class="v972-card"><h4>Próxima etapa visual</h4><p>A V97.3 pode aplicar esses padrões por CSS seguro, sem criar novos listeners globais.</p></div>');
      case 'abas': return renderAbas(cfg);
      case 'notificacoes': return panel('Notificações','Controle os avisos internos, navegador e resumo diário.', '<div class="v972-grid">'+check('notificacoesInternas',cfg.notificacoesInternas,'Notificações internas','Mostra alertas dentro do CRM.')+check('notificacoesNavegador',cfg.notificacoesNavegador,'Notificações do navegador','Usa permissão do navegador quando disponível.')+check('resumoDiario',cfg.resumoDiario,'Resumo diário','Mostra resumo do dia ao abrir o CRM.')+check('som',cfg.som,'Som de aviso','Preparado para avisos sonoros leves.')+field('avisoMinutos',cfg.avisoMinutos,'Avisar quantos minutos antes','number')+field('toastSegundos',cfg.toastSegundos,'Duração do toast em segundos','number')+'</div><div class="v972-actions"><button type="button" class="v972-btn soft" data-v972-action="test-internal">Testar aviso interno</button><button type="button" class="v972-btn" data-v972-action="request-notifications">Permitir navegador</button></div>');
      case 'automacoes': return panel('Automações','Preferências gerais do motor de regras interno.', '<div class="v972-grid">'+check('automacoesConfirmar',cfg.automacoesConfirmar,'Confirmar antes de executar','Pede confirmação antes de ações automáticas sensíveis.')+check('permitirDesfazer',cfg.permitirDesfazer,'Permitir desfazer','Mantém histórico para desfazer última execução quando possível.')+check('historicoSempre',cfg.historicoSempre,'Registrar histórico sempre','Toda automação deixa rastro no lead e no log.')+field('limiteExecucoes',cfg.limiteExecucoes,'Limite diário de execuções','number')+field('horarioPadrao',cfg.horarioPadrao,'Horário padrão de ações','time')+'</div>');
      case 'backup': return renderBackup();
      case 'diagnostico': return renderDiagnostico();
      case 'manutencao': return renderManutencao();
      default: return panel('Geral','Dados básicos do workspace e padrões do CRM.', '<div class="v972-grid">'+field('workspace',cfg.workspace,'Nome do workspace')+field('empresa',cfg.empresa,'Empresa')+field('cidade',cfg.cidade,'Cidade padrão')+field('responsavel',cfg.responsavel,'Responsável padrão')+select('moeda',cfg.moeda,'Moeda',[['BRL','Real brasileiro — R$'],['USD','Dólar — US$'],['EUR','Euro — €']])+select('formatoData',cfg.formatoData,'Formato de data',[['pt-BR','Brasil'],['en-US','Estados Unidos'],['es-ES','Espanha/LatAm']])+field('expedienteInicio',cfg.expedienteInicio,'Início do expediente','time')+field('expedienteFim',cfg.expedienteFim,'Fim do expediente','time')+'</div>');
    }
  }
  function renderAbas(cfg){
    const groups = NAV_META.map(g=>'<div class="v972-card"><h4>'+escapeHtml(g.group)+'</h4><div class="v972-option-list">'+g.items.map(i=>check('visible.'+i[0], getVisible(i[0]), i[1], i[2])).join('')+'</div></div>').join('');
    const cons = '<div class="v972-card"><h4>Módulos consolidados</h4><p>Continuam existindo, mas ficam como subáreas/filtros para reduzir a sidebar principal.</p><div class="v972-status-list">'+CONSOLIDATED.map(i=>'<div class="v972-status-row"><span><strong>'+escapeHtml(i[0])+'</strong><br><small class="v972-muted">'+escapeHtml(i[2])+'</small></span><span class="v972-badge">'+escapeHtml(i[1])+'</span></div>').join('')+'</div></div>';
    return panel('Abas e navegação','Organização segura da sidebar em módulos principais, com funções antigas consolidadas.', '<div class="v972-grid">'+groups+cons+'</div><div class="v972-actions"><button type="button" class="v972-btn" data-v972-action="show-all-tabs">Mostrar todas</button><button type="button" class="v972-btn soft" data-v972-action="safe-tabs">Usar navegação recomendada</button></div>');
  }
  function renderBackup(){
    return panel('Backup e restauração','Exporta e importa os dados do localStorage. Use antes de grandes alterações.', '<div class="v972-grid"><div class="v972-card"><h4>Exportar backup</h4><p>Baixa um JSON com os dados locais do CRM neste navegador.</p><button type="button" class="v972-btn primary" data-v972-action="export-backup">Baixar backup JSON</button></div><div class="v972-card"><h4>Importar backup</h4><p>Cole aqui um backup JSON exportado pelo CRM.</p><div class="v972-field"><textarea data-v972-backup-input placeholder="Cole o JSON do backup aqui"></textarea></div><button type="button" class="v972-btn" data-v972-action="import-backup">Importar backup</button></div></div><div class="v972-card"><h4>Tamanho aproximado do armazenamento</h4><p>'+escapeHtml(storageSize())+'</p></div>');
  }
  function renderDiagnostico(){
    const d = diagnostics();
    return panel('Diagnóstico','Verificação visual e estrutural do CRM no navegador.', '<div class="v972-grid-3"><div class="v972-card"><h4>Seções principais</h4><p><span class="v972-badge '+(d.sectionsOk?'ok':'bad')+'">'+(d.sectionsOk?'OK':'Atenção')+'</span></p></div><div class="v972-card"><h4>IDs duplicados</h4><p><span class="v972-badge '+(d.duplicateIds.length?'bad':'ok')+'">'+d.duplicateIds.length+'</span></p></div><div class="v972-card"><h4>MutationObserver</h4><p><span class="v972-badge ok">sem criação nova V97.2</span></p></div></div><div class="v972-code">'+escapeHtml(JSON.stringify(d,null,2))+'</div><div class="v972-actions"><button type="button" class="v972-btn soft" data-v972-action="diagnostics">Atualizar diagnóstico</button><button type="button" class="v972-btn" data-v972-action="copy-diagnostics">Copiar diagnóstico</button></div>');
  }
  function renderManutencao(){
    return panel('Manutenção segura','Ações para corrigir ambiente sem apagar módulos ou criar páginas novas.', '<div class="v972-grid"><div class="v972-card"><h4>Reaplicar preferências</h4><p>Reaplica navegação visível e nomes personalizados.</p><button type="button" class="v972-btn soft" data-v972-action="apply-settings">Reaplicar agora</button></div><div class="v972-card"><h4>Limpar apenas preferências V97.2</h4><p>Remove configurações desta aba, sem apagar leads/automações.</p><button type="button" class="v972-btn danger" data-v972-action="reset-v972">Limpar preferências V97.2</button></div><div class="v972-card"><h4>Relatório rápido</h4><p>Gera um resumo para conferência antes de novas alterações.</p><button type="button" class="v972-btn" data-v972-action="copy-diagnostics">Copiar relatório</button></div><div class="v972-card"><h4>Dados do CRM</h4><p>Para apagar todos os dados locais, use backup antes. Esta ação fica protegida.</p><button type="button" class="v972-btn danger" data-v972-action="clear-all-storage">Limpar todo localStorage</button></div></div>');
  }
  function readForm(root){
    const patch={};
    root.querySelectorAll('[data-v972-field]').forEach(el=>{ patch[el.dataset.v972Field]=el.value; });
    root.querySelectorAll('[data-v972-check]').forEach(el=>{
      const name=el.dataset.v972Check;
      if(name.startsWith('visible.')){ patch.visible = patch.visible || Object.assign({}, load().visible||{}); patch.visible[name.split('.')[1]] = !!el.checked; }
      else patch[name]=!!el.checked;
    });
    return patch;
  }
  function diagnostics(){
    const ids={}; Array.from(document.querySelectorAll('[id]')).forEach(el=>{ ids[el.id]=(ids[el.id]||0)+1; });
    const duplicateIds=Object.entries(ids).filter(([,n])=>n>1).map(([id,n])=>({id,count:n}));
    const sections={}; CRITICAL_SECTIONS.concat(ARCHIVE_SECTIONS).forEach(id=>sections[id]=document.querySelectorAll('#'+CSS.escape(id)).length);
    return {version:'V97.2', timestamp:new Date().toISOString(), sections, sectionsOk:Object.values(sections).every(n=>n===1), duplicateIds, navButtons:document.querySelectorAll('[data-view]').length, visibleNav:Array.from(document.querySelectorAll('.nav-item[data-view]')).filter(b=>b.style.display!=='none').map(b=>b.dataset.view), localStorage:storageSize()};
  }
  function storageSize(){ let total=0; try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); total += (k||'').length + (localStorage.getItem(k)||'').length; } }catch(e){} return Math.round(total/1024)+' KB em localStorage'; }
  function exportBackup(){
    const data={version:'V97.2', exportedAt:new Date().toISOString(), localStorage:{}};
    for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); data.localStorage[k]=localStorage.getItem(k); }
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=BACKUP_PREFIX+(new Date().toISOString().slice(0,10))+'.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
    toast('Backup gerado.');
  }
  function importBackup(root){
    const box=root.querySelector('[data-v972-backup-input]'); const raw=box?box.value.trim():'';
    if(!raw) return toast('Cole um JSON de backup primeiro.');
    try{ const data=JSON.parse(raw); const store=data.localStorage || data; if(!store || typeof store!=='object') throw new Error('JSON sem localStorage'); if(!confirm('Importar backup e sobrescrever chaves existentes?')) return; Object.entries(store).forEach(([k,v])=>localStorage.setItem(k,String(v))); toast('Backup importado. Recarregue o CRM.'); }
    catch(e){ toast('Backup inválido.'); }
  }
  function escapeHtml(v){ return String(v==null?'':v).replace(/[&<>"]/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }
  function escapeAttr(v){ return escapeHtml(v).replace(/'/g,'&#39;'); }
  function bind(){
    const root=document.getElementById('configuracoes'); if(!root || root.dataset.v972Bound==='1') return;
    root.dataset.v972Bound='1';
    root.addEventListener('click', function(e){
      const tabBtn=e.target.closest('[data-v972-tab]');
      if(tabBtn && root.contains(tabBtn)){ e.preventDefault(); save(readForm(root)); root.setAttribute('data-v972-tab', tabBtn.dataset.v972Tab); render(); return; }
      const btn=e.target.closest('[data-v972-action]'); if(!btn || !root.contains(btn)) return;
      e.preventDefault();
      const action=btn.dataset.v972Action;
      if(action==='save'){ save(readForm(root)); toast('Configurações salvas.'); render(); }
      if(action==='diagnostics'){ root.setAttribute('data-v972-tab','diagnostico'); render(); toast('Diagnóstico atualizado.'); }
      if(action==='show-all-tabs'){ const cfg=load(); const visible={}; allNavIds().forEach(id=>visible[id]=true); save({visible}); render(); toast('Todas as abas foram mostradas.'); }
      if(action==='safe-tabs'){ const visible={}; allNavIds().forEach(id=>visible[id]=!ARCHIVE_SECTIONS.includes(id)); visible.inicio=true; visible.configuracoes=true; save({visible}); render(); toast('Navegação recomendada aplicada.'); }
      if(action==='test-internal'){ toast('Teste de notificação interna funcionando.'); }
      if(action==='request-notifications'){ if('Notification' in window){ Notification.requestPermission().then(p=>toast('Permissão do navegador: '+p)); } else toast('Este navegador não suporta Notification API.'); }
      if(action==='export-backup'){ exportBackup(); }
      if(action==='import-backup'){ importBackup(root); }
      if(action==='apply-settings'){ applySafePreferences(); toast('Preferências reaplicadas.'); }
      if(action==='reset-v972'){ if(confirm('Limpar apenas as preferências V97.2?')){ localStorage.removeItem(KEY); applySafePreferences(); render(); } }
      if(action==='clear-all-storage'){ if(confirm('Tem certeza? Isso apaga dados locais deste CRM neste navegador. Faça backup antes.')){ localStorage.clear(); toast('localStorage limpo. Recarregue a página.'); } }
      if(action==='copy-diagnostics'){ const txt=JSON.stringify(diagnostics(),null,2); navigator.clipboard?.writeText(txt).then(()=>toast('Diagnóstico copiado.')).catch(()=>toast('Não consegui copiar automaticamente.')); }
    });
  }
  function init(){ const root=document.getElementById('configuracoes'); if(!root) return; bind(); applySafePreferences(); render(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
  window.CRMV972Settings = Object.freeze({render, load, save, diagnostics, applySafePreferences});
})();
