/* CRM v51 — implementação das melhorias: lateral, agenda, ligações, inteligência e automações */
(function(){
  'use strict';
  if(window.__crmV51AgendaLigacoesPlaybookAutomacoes) return;
  window.__crmV51AgendaLigacoesPlaybookAutomacoes = true;

  const DOC = document;
  const $ = (s,r=DOC)=>r.querySelector(s);
  const $$ = (s,r=DOC)=>Array.from(r.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const today = () => new Date().toISOString().slice(0,10);
  const addDays = (base,n) => { const d = base ? new Date(String(base).slice(0,10)+'T12:00:00') : new Date(); d.setDate(d.getDate()+Number(n||0)); return d.toISOString().slice(0,10); };
  const fmt = d => { if(!d) return 'Sem data'; try { return new Date(String(d).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR'); } catch(e){ return d; } };
  const toast = (m,t='success') => { try{ (window.crmToast || window.showToast || showToast)(m,t); } catch(e){ console.log(m); } };
  const digits = v => String(v||'').replace(/\D/g,'');

  function icon(id){ return '<svg fill="none" stroke="currentColor" stroke-width="1.85" viewBox="0 0 24 24"><use href="#'+id+'"></use></svg>'; }
  function getLeads(){
    try{ if(typeof window.crmGetLeads === 'function') return window.crmGetLeads(); }catch(e){}
    try{ if(Array.isArray(window.leads)) return window.leads; }catch(e){}
    try{ return JSON.parse(localStorage.getItem('outbounder_leads_v5') || '[]') || []; }catch(e){ return []; }
  }
  function saveLeads(){
    try{ if(typeof window.crmSaveLeads === 'function') return window.crmSaveLeads(); }catch(e){}
    try{ localStorage.setItem('outbounder_leads_v5', JSON.stringify(getLeads())); }catch(e){}
  }
  function getLead(ref){ return getLeads().find(l => String(l.id||l.nome)===String(ref) || String(l.nome)===String(ref)); }
  function openLead(ref){
    try{ if(typeof window.crmOpenLead === 'function') return window.crmOpenLead(ref); }catch(e){}
    try{ if(typeof window.openDetail === 'function') return window.openDetail(ref); }catch(e){}
  }
  function openLeadModal(){
    try{ if(typeof window.crmOpenLeadModal === 'function') return window.crmOpenLeadModal(null); }catch(e){}
    try{ if(typeof window.openModal === 'function') return window.openModal(null); }catch(e){}
    navigate('novo-lead');
  }
  function normalize(v){ return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function activeView(){ return $('.view.active')?.id || 'inicio'; }
  const VIEW_META = {
    inicio:['Painel','Rotina do dia e oportunidades críticas'],
    leads:['Leads','Base comercial, cadastro e qualificação'],
    clientes:['Clientes','Relacionamentos ativos e contas fechadas'],
    pipeline:['Pipeline','Oportunidades em andamento e gargalos'],
    funil:['Funil de vendas','Conversão por etapa e perdas comerciais'],
    cadencias:['Follow-ups','Rotina de contatos e etapas de cadência'],
    agenda:['Agenda','Compromissos, reuniões e próximos passos'],
    ligacoes:['Ligações','Fila de discagem, script e registro de resultados'],
    chat:['Chat','Conversas e atendimento pelo WhatsApp'],
    playbooks:['Inteligência comercial','Playbooks, scripts, materiais e IA local'],
    objecoes:['Inteligência comercial','Objeções e respostas rápidas de venda'],
    automacoes:['Automações','Modelos prontos, construtor visual e simulação'],
    dashboard:['Gestão comercial','Resumo executivo e indicadores'],
    metricas:['Métricas','Análise detalhada de performance'],
    metas:['Metas','Ritmo de execução e objetivos comerciais'],
    perdas:['Perdas','Motivos, aprendizados e reativação'],
    importar:['Configurações','Importação, exportação e backup']
  };
  function setTopbar(view){ const m=VIEW_META[view]||[view,'']; const t=$('#topbarTitle'), s=$('#topbarSub'); if(t) t.textContent=m[0]; if(s) s.textContent=m[1]; }
  function navigate(view){
    if(!view) return;
    if(view === 'novo-lead') return openLeadModal();
    try{ if(typeof window.setView === 'function') window.setView(view); else if(typeof setView === 'function') setView(view); }catch(e){}
    setTopbar(view); setTimeout(()=>{ updateSidebarActive(view); if(view==='ligacoes') initCalls(); if(view==='agenda') initAgenda(); if(view==='playbooks'||view==='objecoes') initIntelligence(); if(view==='automacoes') initAutomations(); },60);
    try{ document.dispatchEvent(new CustomEvent('crm:viewchange',{detail:{view}})); }catch(e){}
  }

  const NAV_GROUPS = [
    {label:'Principal'},
    {id:'inicio',label:'Painel',icon:'ic-home'},
    {id:'leads',label:'Leads',icon:'ic-users',sub:[['leads','Base de leads'],['clientes','Clientes'],['novo-lead','Novo lead']]},
    {id:'pipeline',label:'Pipeline',icon:'ic-columns',sub:[['pipeline','Quadro'],['funil','Funil real']]},
    {id:'cadencias',label:'Follow-ups',icon:'ic-trending-up'},
    {label:'Execução'},
    {id:'agenda',label:'Agenda',icon:'ic-calendar',sub:[['agenda','Calendário'],['agenda','Lista de compromissos']]},
    {id:'ligacoes',label:'Ligações',icon:'ic-phone',sub:[['ligacoes','Fila de discagem'],['ligacoes','Modo execução']]},
    {id:'chat',label:'Chat',icon:'ic-message-square'},
    {label:'Inteligência'},
    {id:'playbooks',label:'Playbooks',icon:'ic-book',sub:[['playbooks','Playbooks'],['playbooks','Scripts'],['objecoes','Objeções'],['playbooks','Materiais']]},
    {id:'automacoes',label:'Automações',icon:'ic-zap',sub:[['automacoes','Modelos prontos'],['automacoes','Minhas regras'],['automacoes','Simulação']]},
    {label:'Gestão'},
    {id:'dashboard',label:'Dashboard',icon:'ic-grid',sub:[['dashboard','Resumo'],['metricas','Métricas'],['metas','Metas'],['perdas','Perdas']]},
    {id:'importar',label:'Configurações',icon:'ic-upload',sub:[['importar','Importar/Exportar']]}
  ];

  function buildSidebar(){
    const nav = $('.sidebar-nav'); if(!nav) return;
    const wasBuilt = nav.dataset.v51Built === '1';
    if(!wasBuilt){
      nav.innerHTML = NAV_GROUPS.map(item=>{
        if(!item.id) return '<div class="v51-nav-label">'+esc(item.label)+'</div>';
        const sub = item.sub ? '<div class="v51-subnav">'+item.sub.map(([id,label])=>'<button type="button" data-v51-sub data-view="'+esc(id)+'">'+esc(label)+'</button>').join('')+'</div>' : '';
        const chevron = item.sub ? '<button type="button" class="v51-group-chevron" aria-label="Abrir sub-abas" title="Abrir sub-abas">⌄</button>' : '';
        return '<div class="v51-nav-group'+(item.sub?' v51-has-sub v51-open':'')+'" data-v51-group="'+esc([item.id].concat((item.sub||[]).map(x=>x[0])).join(','))+'"><button type="button" class="v51-nav-main" data-view="'+esc(item.id)+'" title="'+esc(item.label)+'">'+icon(item.icon)+'<span>'+esc(item.label)+'</span>'+chevron+'</button>'+sub+'</div>';
      }).join('');
      nav.dataset.v51Built = '1';
    }
    const brand=$('.sidebar-brand');
    $('#v50SidebarToggle')?.remove();
    if(brand && !$('#v51SidebarToggle')) brand.insertAdjacentHTML('beforeend','<button type="button" class="v51-sidebar-toggle" id="v51SidebarToggle" aria-label="Recolher/expandir lateral" title="Recolher/expandir lateral">☰</button>');
    const saved = localStorage.getItem('crm_v51_sidebar_collapsed') === '1';
    DOC.body.classList.toggle('crm-v51-sidebar-collapsed', saved);
    DOC.body.classList.toggle('crm-sidebar-collapsed', saved);
    updateSidebarActive(activeView());
  }
  function updateSidebarActive(view){
    $$('.v51-nav-main,.v51-subnav button').forEach(b=>b.classList.toggle('active', b.dataset.view === view));
    $$('.v51-nav-group').forEach(g=>{
      const views=(g.dataset.v51Group||'').split(',');
      const on=views.includes(view);
      g.classList.toggle('active', on);
      const main=g.querySelector('.v51-nav-main'); if(main) main.classList.toggle('active', on);
      if(on) g.classList.add('v51-open');
    });
  }
  function bindSidebar(){
    DOC.addEventListener('click', e=>{
      const tog = e.target.closest('#v51SidebarToggle');
      if(tog){ e.preventDefault(); e.stopPropagation(); const next=!DOC.body.classList.contains('crm-v51-sidebar-collapsed'); DOC.body.classList.toggle('crm-v51-sidebar-collapsed',next); DOC.body.classList.toggle('crm-sidebar-collapsed',next); localStorage.setItem('crm_v51_sidebar_collapsed', next?'1':'0'); return; }
      const chevron = e.target.closest('.v51-group-chevron');
      if(chevron){ e.preventDefault(); e.stopPropagation(); chevron.closest('.v51-nav-group')?.classList.toggle('v51-open'); return; }
      const nav = e.target.closest('.v51-nav-main,.v51-subnav button');
      if(nav && nav.dataset.view){ e.preventDefault(); e.stopPropagation(); navigate(nav.dataset.view); return; }
    }, true);
  }

  function addActivity(lead,text,type='Nota'){
    if(!lead) return;
    if(!Array.isArray(lead.atividades)) lead.atividades=[];
    lead.atividades.unshift({id:'v51_'+Date.now()+Math.random().toString(36).slice(2,5),tipo,autor:'CRM',texto,data:new Date().toISOString()});
  }

  function getAgenda(){
    try{ if(window.crmAgendaAPI?.get) return window.crmAgendaAPI.get(); }catch(e){}
    try{ return JSON.parse(localStorage.getItem('outbounder_agenda_v1')||'[]')||[]; }catch(e){ return []; }
  }
  function saveAgenda(arr){
    try{ if(window.crmAgendaAPI?.set) return window.crmAgendaAPI.set(arr); }catch(e){}
    try{ localStorage.setItem('outbounder_agenda_v1',JSON.stringify(arr)); }catch(e){}
  }
  function agendaEvent(id){ return getAgenda().find(e=>String(e.id)===String(id)); }
  function renderAgendaKanban(){
    const page=$('#agenda'); const host=$('#v51AgendaKanban'); if(!page||!host) return;
    const arr=getAgenda().slice().sort((a,b)=>String(a.data).localeCompare(String(b.data))||String(a.hora||'').localeCompare(String(b.hora||'')));
    const todayStr=today();
    const cols=[['Atrasados',e=>e.status!=='concluido' && e.data<todayStr],['Hoje',e=>e.status!=='concluido' && e.data===todayStr],['Próximos',e=>e.status!=='concluido' && e.data>todayStr],['Concluídos',e=>e.status==='concluido']];
    host.innerHTML=cols.map(([name,fn])=>{const list=arr.filter(fn);return '<div class="v51-ag-col"><div class="v51-ag-col-head"><span>'+esc(name)+'</span><b>'+list.length+'</b></div><div class="v51-ag-col-body">'+(list.map(ev=>'<div class="v51-ag-mini" data-v51-ag-open="'+esc(ev.id)+'"><b>'+esc(ev.leadNome||'Compromisso')+'</b><span>'+esc((ev.tipo||'Evento')+' · '+fmt(ev.data)+' '+(ev.hora||''))+'</span><div class="row"><small>'+esc(ev.prioridade||'Média')+'</small><small>'+esc(ev.status==='concluido'?'Concluído':'Aberto')+'</small></div></div>').join('')||'<div class="v51-muted">Sem eventos aqui.</div>')+'</div></div>'}).join('');
  }
  function initAgenda(){
    const page=$('#agenda'); if(!page) return;
    page.classList.add('v51-agenda-mode-lista');
    if(!$('#v51AgendaCommand')){
      const ref=page.querySelector('.section-header')||page.firstElementChild;
      ref?.insertAdjacentHTML('afterend','<div class="v51-command" id="v51AgendaCommand"><div><b>Agenda profissional</b><span>Planeje compromissos por tipo, prioridade e momento. O detalhe do evento abre em painel lateral com ações rápidas.</span></div><div class="v51-actions"><div class="v51-segmented" id="v51AgendaViewBtns"><button type="button" class="active" data-v51-ag-view="lista">Lista</button><button type="button" data-v51-ag-view="hoje">Hoje</button><button type="button" data-v51-ag-view="kanban">Kanban</button><button type="button" data-v51-ag-view="calendario">Calendário</button></div><button type="button" class="v51-pill-btn" id="v51AgendaFilters">Filtros</button><button type="button" class="v51-pill-btn primary" id="v51AgendaNew">+ Compromisso</button></div></div>');
    }
    const listView=$('#agListView');
    if(listView && !$('#v51AgendaKanban')) listView.insertAdjacentHTML('afterend','<div id="v51AgendaKanban"></div>');
    ensureAgendaDrawers();
    renderAgendaKanban();
  }
  function ensureAgendaDrawers(){
    if(!$('#v51AgendaDrawer')) DOC.body.insertAdjacentHTML('beforeend','<aside class="v51-drawer" id="v51AgendaDrawer" aria-hidden="true"><div class="v51-drawer-head"><div><h3 id="v51AgTitle">Detalhe do compromisso</h3><p id="v51AgSub">Ações rápidas, preparação e próximo passo.</p></div><button type="button" class="v51-drawer-close" data-v51-close-drawer="v51AgendaDrawer">×</button></div><div class="v51-drawer-body" id="v51AgendaDrawerBody"></div><div class="v51-drawer-foot"><button type="button" class="v51-pill-btn" data-v51-ag-edit>Editar</button><button type="button" class="v51-pill-btn primary" data-v51-ag-next>Criar próximo follow-up</button></div></aside>');
    if(!$('#v51AgendaFilterDrawer')) DOC.body.insertAdjacentHTML('beforeend','<aside class="v51-drawer" id="v51AgendaFilterDrawer" aria-hidden="true"><div class="v51-drawer-head"><div><h3>Filtros da agenda</h3><p>Use filtros sem ocupar espaço visual na página.</p></div><button type="button" class="v51-drawer-close" data-v51-close-drawer="v51AgendaFilterDrawer">×</button></div><div class="v51-drawer-body"><div class="v51-field"><label>Buscar</label><input id="v51AgSearch" placeholder="Lead, tipo ou nota"></div><div class="v51-grid-2"><div class="v51-field"><label>Prioridade</label><select id="v51AgPriority"><option value="">Todas</option><option>Alta</option><option>Média</option><option>Baixa</option></select></div><div class="v51-field"><label>Tipo</label><select id="v51AgType"><option value="">Todos</option><option>Ligação</option><option>WhatsApp</option><option>E-mail</option><option>Reunião</option><option>Follow-up</option></select></div></div><div class="v51-field"><label>Camadas</label><div class="v51-checklist"><label class="v51-checkitem"><input type="checkbox" checked> Comercial</label><label class="v51-checkitem"><input type="checkbox" checked> Follow-ups</label><label class="v51-checkitem"><input type="checkbox" checked> Reuniões</label></div></div><div class="v51-help">A busca e prioridade também controlam a lista antiga da agenda. O tipo filtra as visualizações novas.</div></div><div class="v51-drawer-foot"><button type="button" class="v51-pill-btn" id="v51AgClearFilters">Limpar</button><button type="button" class="v51-pill-btn primary" data-v51-close-drawer="v51AgendaFilterDrawer">Aplicar</button></div></aside>');
  }
  function openAgendaDrawer(id){
    const ev=agendaEvent(id); if(!ev) return;
    const lead=getLead(ev.leadNome);
    const drawer=$('#v51AgendaDrawer'), body=$('#v51AgendaDrawerBody');
    if(!drawer||!body) return;
    drawer.dataset.evid=ev.id;
    $('#v51AgTitle').textContent=ev.leadNome||'Compromisso';
    $('#v51AgSub').textContent=(ev.tipo||'Evento')+' · '+fmt(ev.data)+' '+(ev.hora||'');
    const tel=digits(lead?.telefone||'');
    body.innerHTML='<div class="v51-grid-2"><div class="v51-field"><label>Data</label><input value="'+esc(ev.data||'')+'" data-v51-ag-field="data" type="date"></div><div class="v51-field"><label>Hora</label><input value="'+esc(ev.hora||'')+'" data-v51-ag-field="hora" type="time"></div></div><div class="v51-grid-2"><div class="v51-field"><label>Tipo</label><select data-v51-ag-field="tipo">'+['Ligação','WhatsApp','E-mail','Reunião','Follow-up','Tarefa'].map(x=>'<option '+(x===(ev.tipo||'')?'selected':'')+'>'+x+'</option>').join('')+'</select></div><div class="v51-field"><label>Prioridade</label><select data-v51-ag-field="prioridade">'+['Alta','Média','Baixa'].map(x=>'<option '+(x===(ev.prioridade||'Média')?'selected':'')+'>'+x+'</option>').join('')+'</select></div></div><div class="v51-field"><label>Notas</label><textarea data-v51-ag-field="notas" rows="4">'+esc(ev.notas||'')+'</textarea></div><div class="v51-panel-card"><b>Lead vinculado</b><span>'+esc([lead?.etapa,lead?.responsavel,lead?.telefone].filter(Boolean).join(' · ')||'Sem dados extras do lead')+'</span></div><div class="v51-actions" style="justify-content:flex-start"><button class="v51-pill-btn" type="button" data-v51-ag-done>Concluir</button><button class="v51-pill-btn" type="button" data-v51-ag-delay="1">Remarcar +1d</button><button class="v51-pill-btn" type="button" data-v51-ag-delay="3">+3d</button><button class="v51-pill-btn" type="button" data-v51-ag-open-lead>Abrir lead</button>'+(tel?'<a class="v51-pill-btn primary" href="tel:+'+tel+'">Ligar</a><a class="v51-pill-btn" target="_blank" href="https://wa.me/55'+tel.replace(/^55/,'')+'">WhatsApp</a>':'')+'</div><div class="v51-field"><label>Checklist antes da reunião</label><div class="v51-checklist"><label class="v51-checkitem"><input type="checkbox"> Confirmar objetivo do contato</label><label class="v51-checkitem"><input type="checkbox"> Revisar etapa do lead</label><label class="v51-checkitem"><input type="checkbox"> Separar pergunta SPIN principal</label><label class="v51-checkitem"><input type="checkbox"> Definir próximo passo claro</label></div></div>';
    drawer.classList.add('show');
  }
  function updateAgendaEvent(id, patch){
    const arr=getAgenda(); const idx=arr.findIndex(e=>String(e.id)===String(id)); if(idx<0) return;
    arr[idx]={...arr[idx],...patch}; saveAgenda(arr); setTimeout(()=>{ try{ window.crmAgendaAPI?.render?.(); }catch(e){} renderAgendaKanban(); },50);
  }

  function callConfig(){ try{return JSON.parse(localStorage.getItem('outbounder_call_cfg_v9')||'{}')}catch(e){return{}} }
  function saveCallConfig(c){ try{localStorage.setItem('outbounder_call_cfg_v9',JSON.stringify(c));}catch(e){} }
  function initCalls(){
    try{ window.renderCallCenterV9?.(); }catch(e){}
    const page=$('#ligacoes'); if(!page) return;
    page.classList.add('v51-call-mode');
    if(!$('#v51CallsCommand')){
      const ref=page.querySelector('.section-header')||page.firstElementChild;
      ref?.insertAdjacentHTML('afterend','<div class="v51-command" id="v51CallsCommand"><div><b>Central de ligações</b><span>Fila compacta, modo execução, discador fixo e ações inteligentes pós-ligação.</span></div><div class="v51-actions"><button type="button" class="v51-pill-btn primary" id="v51CallModeBtn">Modo discagem</button><button type="button" class="v51-pill-btn" id="v51CallBestBtn">Próximo melhor lead</button><button type="button" class="v51-pill-btn" id="v51CallConfigBtn">Configurar discador</button></div></div><div class="v51-call-note">Dica: marque o resultado da ligação e o CRM já sugere follow-up, WhatsApp, reunião ou reativação.</div>');
    }
    const dialCard=$('.call-dial-card');
    if(dialCard && !$('#v51CallSmartActions')) dialCard.insertAdjacentHTML('beforeend','<div class="v51-call-smart" id="v51CallSmartActions"><div class="v51-smart-action" data-call-outcome="Não atendeu"><div>📵</div><div><b>Não atendeu</b><span>Cria retorno para amanhã e avança a tentativa.</span></div></div><div class="v51-smart-action" data-call-outcome="Reunião marcada"><div>📅</div><div><b>Reunião marcada</b><span>Registra atividade e sugere compromisso na agenda.</span></div></div><div class="v51-smart-action" data-call-outcome="Enviar WhatsApp"><div>💬</div><div><b>Enviar WhatsApp</b><span>Abre WhatsApp com o número do lead selecionado.</span></div></div><div class="v51-smart-action" data-call-outcome="Sem interesse"><div>♻️</div><div><b>Sem interesse</b><span>Baixa prioridade e programa reativação futura.</span></div></div></div>');
    ensureCallDrawer();
  }
  function ensureCallDrawer(){
    if($('#v51CallConfigDrawer')) return;
    const c=callConfig();
    DOC.body.insertAdjacentHTML('beforeend','<aside class="v51-drawer" id="v51CallConfigDrawer"><div class="v51-drawer-head"><div><h3>Configurar discador</h3><p>Escolha como o CRM deve abrir chamadas no computador.</p></div><button type="button" class="v51-drawer-close" data-v51-close-drawer="v51CallConfigDrawer">×</button></div><div class="v51-drawer-body"><div class="v51-field"><label>Protocolo</label><select id="v51CallProtocol"><option value="tel">tel: padrão do computador</option><option value="callto">callto: softphone</option><option value="sip">sip: VoIP/SIP</option><option value="whatsapp">WhatsApp Web</option></select></div><div class="v51-field"><label>DDI padrão</label><input id="v51CallCountry" value="'+esc(c.country||'+55')+'"></div><div class="v51-help">Para chip/app do Windows, normalmente use tel:. Para PABX/VoIP, teste callto: ou sip:.</div></div><div class="v51-drawer-foot"><button type="button" class="v51-pill-btn primary" id="v51SaveCallConfig">Salvar</button></div></aside>');
    const proto=$('#v51CallProtocol'); if(proto) proto.value=c.protocol||'tel';
  }

  function playbooks(){ try{return JSON.parse(localStorage.getItem('outbounder_playbooks')||'[]')||[]}catch(e){return[]} }
  function savePlaybooks(arr){ try{localStorage.setItem('outbounder_playbooks',JSON.stringify(arr)); document.dispatchEvent(new CustomEvent('crm:playbookupdate')); }catch(e){} }
  function getPb(id){ return playbooks().find(p=>String(p.id)===String(id)); }
  function firstScript(pb){ const s=pb?.scripts||{}; return s.ligacao||s.whatsapp||s.email||Object.values(s)[0]||pb?.objetivo||''; }
  function initIntelligence(){
    const page=$('#playbooks'); if(!page) return;
    page.classList.add('v51-intel','v51-intel-mode-playbooks');
    if(!$('#v51IntelCommand')){
      const ref=page.querySelector('.section-header')||page.firstElementChild;
      ref?.insertAdjacentHTML('afterend','<div class="v51-command" id="v51IntelCommand"><div><b>Inteligência comercial</b><span>Unifique playbooks, scripts, objeções, materiais e IA local em uma área de execução.</span></div><div class="v51-actions"><button type="button" class="v51-pill-btn primary" id="v51IntelNewScript">Gerar script</button><button type="button" class="v51-pill-btn" data-view="objecoes">Objeções</button><button type="button" class="v51-pill-btn" id="v51IntelMaterialsBtn">Materiais</button></div></div><div class="v51-intel-tabs" id="v51IntelTabs"><button type="button" class="active" data-v51-intel="playbooks">Playbooks</button><button type="button" data-v51-intel="scripts">Scripts</button><button type="button" data-v51-intel="objecoes">Objeções</button><button type="button" data-v51-intel="materiais">Materiais</button><button type="button" data-v51-intel="ia">IA local</button></div><div class="v51-script-studio" id="v51ScriptStudio"><div class="v51-script-card"><h4>Gerador rápido de abordagem</h4><p>Crie variações para ligação, WhatsApp, e-mail, reunião e objeção sem API.</p><div class="v51-field"><label>Cliente/persona</label><input id="v51ScriptPersona" placeholder="Ex: dono de clínica, gestor comercial"></div><div class="v51-field"><label>Dor principal</label><input id="v51ScriptDor" placeholder="Ex: perde leads por falta de follow-up"></div><div class="v51-grid-2"><div class="v51-field"><label>Canal</label><select id="v51ScriptCanal"><option value="ligacao">Ligação</option><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="objecao">Objeção</option></select></div><div class="v51-field"><label>Tom</label><select id="v51ScriptTom"><option>Consultivo</option><option>Direto</option><option>Próximo</option><option>Executivo</option></select></div></div><button class="v51-pill-btn primary" id="v51GenerateScript">Gerar variação</button></div><div class="v51-script-card"><h4>Script gerado</h4><div class="v51-script-output" id="v51ScriptOutput">Preencha os campos e clique em gerar variação.</div><div class="v51-actions" style="justify-content:flex-start"><button class="v51-pill-btn" id="v51CopyScript">Copiar</button><button class="v51-pill-btn" id="v51SaveScriptPb">Salvar como playbook</button></div></div></div><div class="v51-objection-board" id="v51ObjectionBoard"><div class="v51-panel-grid"><div class="v51-panel-card"><b>Resposta curta</b><span>Texto rápido para WhatsApp e contato inicial.</span></div><div class="v51-panel-card"><b>Resposta consultiva</b><span>Conecta objeção com pergunta de diagnóstico.</span></div><div class="v51-panel-card"><b>Prova/argumento</b><span>Use dados, cases e consequência da dor.</span></div><div class="v51-panel-card"><b>Ação</b><span>Salvar no lead ou criar próximo follow-up.</span></div></div></div><div class="v51-materials-hub" id="v51MaterialsHub"><div class="v51-panel-grid"><div class="v51-panel-card"><b>PDF</b><span>Propostas, apresentações e estudos de caso.</span></div><div class="v51-panel-card"><b>Vídeo</b><span>Demonstrações, tutoriais e prova social.</span></div><div class="v51-panel-card"><b>Link</b><span>Links rápidos para enviar ao lead.</span></div><div class="v51-panel-card"><b>Momento da venda</b><span>Organize por contato, proposta, negociação e fechamento.</span></div></div></div>');
    }
    decoratePlaybookCards();
  }
  function setIntelMode(mode){
    const page=$('#playbooks'); if(!page) return;
    ['playbooks','scripts','objecoes','materiais','ia'].forEach(m=>page.classList.remove('v51-intel-mode-'+m));
    page.classList.add('v51-intel-mode-'+mode);
    $$('#v51IntelTabs [data-v51-intel]').forEach(b=>b.classList.toggle('active',b.dataset.v51Intel===mode));
    if(mode==='ia'){ const lab=$('#pbAiScriptLabV34'); if(lab) lab.scrollIntoView({behavior:'smooth',block:'start'}); }
    if(mode==='objecoes') navigate('objecoes');
  }
  function generateScript(){
    const persona=$('#v51ScriptPersona')?.value.trim()||'decisor comercial';
    const dor=$('#v51ScriptDor')?.value.trim()||'falta de previsibilidade no follow-up';
    const canal=$('#v51ScriptCanal')?.value||'ligacao';
    const tom=$('#v51ScriptTom')?.value||'Consultivo';
    const lines={
      ligacao:`Abertura (${tom}):\nOlá, [NOME]. Aqui é [SEU NOME]. Vou ser breve: tenho conversado com ${persona}s que enfrentam ${dor}.\n\nPergunta-chave:\nHoje vocês conseguem acompanhar todos os leads, próximos passos e motivos de perda sem depender de memória ou planilha?\n\nPróximo passo:\nSe fizer sentido, posso te mostrar em 15 minutos como organizar isso de forma simples.`,
      whatsapp:`Oi [NOME], tudo bem? Sou [SEU NOME].\n\nTenho ajudado ${persona}s que estão lidando com ${dor}. A ideia não é te mandar apresentação genérica — queria entender se essa dor acontece aí também.\n\nFaz sentido conversarmos 15 min essa semana?`,
      email:`Assunto: Ideia rápida sobre ${dor}\n\nOlá [NOME], tudo bem?\n\nTenho conversado com ${persona}s que enfrentam ${dor}. Quando isso acontece, boas oportunidades ficam paradas e o funil perde previsibilidade.\n\nPosso te mandar um diagnóstico simples com 2 ou 3 melhorias para organizar esse processo?`,
      objecao:`Objeção provável: “Agora não tenho tempo.”\n\nResposta:\nEntendo. Justamente por isso eu queria ser objetivo. Se ${dor} não for prioridade, eu encerro o assunto. Mas se isso estiver custando oportunidades, pode valer olhar antes que vire perda. Posso te fazer duas perguntas rápidas?`
    };
    $('#v51ScriptOutput').textContent=lines[canal]||lines.ligacao;
    toast('Script gerado localmente','success');
  }
  function decoratePlaybookCards(){
    $$('#pbGrid .pb-card').forEach(card=>{
      if(card.querySelector('.v51-pb-actions')) return;
      const id=card.dataset.pbCardId || card.querySelector('[data-pb-open]')?.dataset.pbOpen || card.querySelector('[data-pb-edit]')?.dataset.pbEdit;
      const foot=card.querySelector('.pb-card-foot') || card;
      foot.insertAdjacentHTML('beforeend','<div class="v51-pb-actions"><button type="button" class="btn btn-sm" data-v51-pb-copy="'+esc(id||'')+'">Copiar script</button><button type="button" class="btn btn-sm" data-v51-pb-whats="'+esc(id||'')+'">WhatsApp</button><button type="button" class="btn btn-sm" data-v51-pb-call="'+esc(id||'')+'">Usar em ligação</button><button type="button" class="btn btn-sm" data-v51-pb-fu="'+esc(id||'')+'">Criar follow-up</button></div>');
    });
  }

  function getAutos(){
    try{ if(window.crmAutomationAPI?.get) return window.crmAutomationAPI.get(); }catch(e){}
    try{ return JSON.parse(localStorage.getItem('outbounder_automations_v1')||'[]') || []; }catch(e){ return []; }
  }
  function saveAutos(arr){
    try{ if(window.crmAutomationAPI?.set) return window.crmAutomationAPI.set(arr); }catch(e){}
    try{ localStorage.setItem('outbounder_automations_v1',JSON.stringify(arr)); }catch(e){}
  }
  const AUTO_TEMPLATES=[
    {key:'proposta',nome:'Proposta enviada',desc:'Criar retorno 2 dias depois da proposta.',etapa:'Proposta',acao:'compromisso',params:{tipo:'Follow-up',prazo:2,nota:'Confirmar recebimento da proposta e tirar dúvidas.'}},
    {key:'semcontato',nome:'Lead novo sem contato',desc:'Criar tarefa de ligação no dia seguinte.',etapa:'Lead',acao:'compromisso',params:{tipo:'Ligação',prazo:1,nota:'Primeira tentativa de contato.'}},
    {key:'contato',nome:'Entrou em contato',desc:'Priorizar lead que respondeu.',etapa:'Contato',acao:'prioridade',params:{valor:'Alta'}},
    {key:'fechado',nome:'Cliente fechado',desc:'Criar próximo passo de onboarding.',etapa:'Fechado',acao:'compromisso',params:{tipo:'Reunião',prazo:1,nota:'Onboarding e próximos passos.'}},
    {key:'perdido',nome:'Lead perdido',desc:'Registrar nota para reativação futura.',etapa:'Perdido',acao:'nota',params:{texto:'Avaliar reativação em 30 dias e revisar motivo da perda.'}}
  ];
  function initAutomations(){
    const page=$('#automacoes'); if(!page) return;
    page.classList.add('v51-auto');
    if(!$('#v51AutoLayout')){
      const ref=page.querySelector('.section-header')||page.firstElementChild;
      ref?.insertAdjacentHTML('afterend','<div class="v51-command" id="v51AutoCommand"><div><b>Automações visuais</b><span>Use modelos prontos, simule impacto e crie regras com linguagem simples.</span></div><div class="v51-actions"><button type="button" class="v51-pill-btn primary" id="v51AutoOpenBuilder">Criar regra visual</button><button type="button" class="v51-pill-btn" id="v51AutoSimulate">Simular impacto</button></div></div><div class="v51-auto-layout" id="v51AutoLayout"><div class="v51-script-card"><h4>Modelos prontos</h4><p>Escolha um objetivo e o CRM cria a regra.</p><div class="v51-template-list" id="v51AutoTemplates"></div></div><div class="v51-script-card"><h4>Criador visual</h4><div class="v51-flow"><div class="v51-flow-step"><strong>Quando acontecer</strong><p>Lead entrar na etapa <select id="v51AutoStage"><option>Lead</option><option>Contato</option><option>Proposta</option><option>Fechado</option><option>Perdido</option></select></p></div><div class="v51-flow-step"><strong>Então fazer</strong><p><select id="v51AutoAction"><option value="compromisso">Criar compromisso</option><option value="prioridade">Definir prioridade</option><option value="nota">Adicionar nota</option></select></p></div><div class="v51-grid-2"><div class="v51-field"><label>Prazo em dias</label><input id="v51AutoDays" type="number" value="2"></div><div class="v51-field"><label>Tipo</label><select id="v51AutoType"><option>Follow-up</option><option>Ligação</option><option>WhatsApp</option><option>Reunião</option></select></div></div><div class="v51-field"><label>Mensagem/nota</label><textarea id="v51AutoNote" rows="3" placeholder="Ex: confirmar recebimento da proposta"></textarea></div><button type="button" class="v51-pill-btn primary" id="v51AutoSaveVisual">Salvar regra visual</button></div></div></div><div class="v51-panel-grid" id="v51AutoStats"></div><div class="v51-script-card"><h4>Histórico e simulação</h4><div class="v51-auto-history" id="v51AutoHistory"></div></div>');
    }
    renderAutoTemplates(); renderAutoStats(); renderAutoHistory(); decorateAutoCards();
  }
  function renderAutoTemplates(){
    const host=$('#v51AutoTemplates'); if(!host) return;
    host.innerHTML=AUTO_TEMPLATES.map(t=>'<button type="button" class="v51-template-btn" data-v51-template="'+esc(t.key)+'"><b>'+esc(t.nome)+'</b><span>'+esc(t.desc)+'</span></button>').join('');
  }
  function addAuto(template){
    const arr=getAutos();
    arr.unshift({id:'v51auto_'+Date.now(),nome:template.nome,ativo:true,etapa:template.etapa,acao:template.acao,params:template.params});
    saveAutos(arr); addAutoHistory('Criada regra: '+template.nome); toast('Automação criada','success'); setTimeout(()=>{renderAutoStats();renderAutoHistory();decorateAutoCards();},80);
  }
  function addAutoHistory(text){
    let h=[]; try{h=JSON.parse(localStorage.getItem('crm_v51_auto_history')||'[]')||[]}catch(e){}
    h.unshift({text,date:new Date().toISOString()}); localStorage.setItem('crm_v51_auto_history',JSON.stringify(h.slice(0,20)));
  }
  function renderAutoStats(){
    const host=$('#v51AutoStats'); if(!host) return;
    const autos=getAutos(), leads=getLeads();
    host.innerHTML=[['Ativas',autos.filter(a=>a.ativo).length],['Pausadas',autos.filter(a=>!a.ativo).length],['Leads afetáveis',leads.filter(l=>autos.some(a=>a.ativo&&a.etapa===l.etapa)).length],['Modelos',AUTO_TEMPLATES.length]].map(([a,b])=>'<div class="v51-panel-card"><b>'+esc(a)+'</b><span>'+esc(b)+' item(ns)</span></div>').join('');
  }
  function renderAutoHistory(){
    const host=$('#v51AutoHistory'); if(!host) return;
    let h=[]; try{h=JSON.parse(localStorage.getItem('crm_v51_auto_history')||'[]')||[]}catch(e){}
    host.innerHTML=h.length?h.map(x=>'<div class="v51-history-row"><b>'+esc(x.text)+'</b><span>'+esc(new Date(x.date).toLocaleString('pt-BR'))+'</span></div>').join(''):'<div class="v51-muted">Nenhuma automação executada ou criada nesta sessão.</div>';
  }
  function decorateAutoCards(){
    $$('#autoList .auto-card').forEach(card=>{
      if(card.querySelector('.v51-tag')) return;
      const name=card.querySelector('.auto-name');
      if(name) name.insertAdjacentHTML('afterend','<span class="v51-tag">status claro</span>');
    });
  }
  function simulateAutoImpact(){
    const autos=getAutos().filter(a=>a.ativo), leads=getLeads();
    const affected=leads.filter(l=>autos.some(a=>a.etapa===l.etapa));
    addAutoHistory('Simulação: '+affected.length+' lead(s) afetável(is)');
    renderAutoHistory(); toast('Simulação: '+affected.length+' lead(s) seriam afetados','success');
  }

  function bindGlobal(){
    DOC.addEventListener('click', e=>{
      const close=e.target.closest('[data-v51-close-drawer]'); if(close){ e.preventDefault(); $('#'+close.dataset.v51CloseDrawer)?.classList.remove('show'); return; }

      const agView=e.target.closest('[data-v51-ag-view]');
      if(agView){ e.preventDefault(); const mode=agView.dataset.v51AgView; const page=$('#agenda'); if(!page) return; ['lista','hoje','kanban'].forEach(m=>page.classList.remove('v51-agenda-mode-'+m)); $$('#v51AgendaViewBtns button').forEach(b=>b.classList.toggle('active',b===agView)); if(mode==='calendario'){ $('#agViewCal')?.click(); page.classList.add('v51-agenda-mode-lista'); } else { $('#agViewList')?.click(); page.classList.add('v51-agenda-mode-'+mode); } renderAgendaKanban(); return; }
      if(e.target.closest('#v51AgendaNew')){ e.preventDefault(); $('#agNewBtn')?.click(); return; }
      if(e.target.closest('#v51AgendaFilters')){ e.preventDefault(); ensureAgendaDrawers(); $('#v51AgendaFilterDrawer')?.classList.add('show'); return; }
      const agOpen=e.target.closest('[data-v51-ag-open]'); if(agOpen){ e.preventDefault(); openAgendaDrawer(agOpen.dataset.v51AgOpen); return; }
      const agItem=e.target.closest('.ag-item[data-evid]'); if(agItem && !e.target.closest('a,button,input,select,textarea')){ e.preventDefault(); e.stopPropagation(); openAgendaDrawer(agItem.dataset.evid); return; }
      if(e.target.closest('[data-v51-ag-edit]')){ const id=$('#v51AgendaDrawer')?.dataset.evid; if(id){ try{ window.crmAgendaAPI?.openModal?.(id); }catch(_){ $('.edit-ev-btn[data-evid="'+CSS.escape(id)+'"]')?.click(); } } return; }
      if(e.target.closest('[data-v51-ag-done]')){ const id=$('#v51AgendaDrawer')?.dataset.evid; updateAgendaEvent(id,{status:'concluido'}); toast('Compromisso concluído','success'); renderAgendaKanban(); return; }
      const agDelay=e.target.closest('[data-v51-ag-delay]'); if(agDelay){ const id=$('#v51AgendaDrawer')?.dataset.evid; const ev=agendaEvent(id); if(ev){updateAgendaEvent(id,{data:addDays(ev.data,Number(agDelay.dataset.v51AgDelay))}); toast('Compromisso remarcado','success'); openAgendaDrawer(id);} return; }
      if(e.target.closest('[data-v51-ag-open-lead]')){ const id=$('#v51AgendaDrawer')?.dataset.evid; const ev=agendaEvent(id); if(ev) openLead(ev.leadNome); return; }
      if(e.target.closest('[data-v51-ag-next]')){ const id=$('#v51AgendaDrawer')?.dataset.evid; const ev=agendaEvent(id); if(ev){const arr=getAgenda(); arr.push({id:'v51ev_'+Date.now(),leadNome:ev.leadNome,data:addDays(ev.data,3),hora:ev.hora||'09:00',tipo:'Follow-up',prioridade:ev.prioridade||'Média',notas:'Próximo follow-up criado a partir do compromisso anterior.',spin:{s:'',p:'',i:'',n:''}}); const lead=getLead(ev.leadNome); if(lead){lead.followup=addDays(ev.data,3); addActivity(lead,'Próximo follow-up criado pela agenda.','Agenda'); saveLeads();} saveAgenda(arr); toast('Próximo follow-up criado','success'); renderAgendaKanban();} return; }
      if(e.target.closest('#v51AgClearFilters')){ $('#v51AgSearch').value=''; $('#v51AgPriority').value=''; $('#v51AgType').value=''; $('#agSearch').value=''; $('#agSearch')?.dispatchEvent(new Event('input',{bubbles:true})); $$('[data-ag-priority]').forEach((b,i)=>b.click && i===0 && b.click()); return; }

      if(e.target.closest('#v51CallModeBtn')){ e.preventDefault(); $('#ligacoes')?.classList.toggle('v51-call-dial-mode'); toast($('#ligacoes')?.classList.contains('v51-call-dial-mode')?'Modo discagem ativado':'Modo discagem desativado','success'); return; }
      if(e.target.closest('#v51CallBestBtn')){ e.preventDefault(); $('#callQueueTopBtn')?.click(); return; }
      if(e.target.closest('#v51CallConfigBtn')){ e.preventDefault(); ensureCallDrawer(); $('#v51CallConfigDrawer')?.classList.add('show'); return; }
      if(e.target.closest('#v51SaveCallConfig')){ const c={protocol:$('#v51CallProtocol')?.value||'tel',country:$('#v51CallCountry')?.value||'+55'}; saveCallConfig(c); $('#callProtocol') && ($('#callProtocol').value=c.protocol); $('#callCountry') && ($('#callCountry').value=c.country); $('#v51CallConfigDrawer')?.classList.remove('show'); toast('Discador configurado','success'); return; }

      const intel=e.target.closest('[data-v51-intel]'); if(intel){ e.preventDefault(); setIntelMode(intel.dataset.v51Intel); return; }
      if(e.target.closest('#v51IntelNewScript')){ e.preventDefault(); setIntelMode('scripts'); return; }
      if(e.target.closest('#v51IntelMaterialsBtn')){ e.preventDefault(); setIntelMode('materiais'); return; }
      if(e.target.closest('#v51GenerateScript')){ e.preventDefault(); generateScript(); return; }
      if(e.target.closest('#v51CopyScript')){ navigator.clipboard?.writeText($('#v51ScriptOutput')?.textContent||''); toast('Script copiado','success'); return; }
      if(e.target.closest('#v51SaveScriptPb')){ const arr=playbooks(); arr.unshift({id:'v51pb_'+Date.now(),nome:'Script rápido — '+($('#v51ScriptPersona')?.value||'lead'),objetivo:$('#v51ScriptDor')?.value||'Abordagem comercial',categoria:'Outbound',responsavel:'Time Comercial',etapa:'Lead',scripts:{[$('#v51ScriptCanal')?.value||'ligacao']:$('#v51ScriptOutput')?.textContent||''},checklist:[{titulo:'Executar script e registrar resposta',prazo:0}],materiais:[],automacoes:[]}); savePlaybooks(arr); toast('Script salvo como playbook','success'); try{ window.renderPB?.(); }catch(_){} setTimeout(()=>{decoratePlaybookCards();},200); return; }
      const copy=e.target.closest('[data-v51-pb-copy]'); if(copy){ const pb=getPb(copy.dataset.v51PbCopy); navigator.clipboard?.writeText(firstScript(pb)); toast('Script do playbook copiado','success'); return; }
      const whats=e.target.closest('[data-v51-pb-whats]'); if(whats){ const pb=getPb(whats.dataset.v51PbWhats); const txt=encodeURIComponent(firstScript(pb)); window.open('https://wa.me/?text='+txt,'_blank'); return; }
      const call=e.target.closest('[data-v51-pb-call]'); if(call){ navigate('ligacoes'); toast('Playbook pronto para usar na central de ligações','success'); return; }
      const fu=e.target.closest('[data-v51-pb-fu]'); if(fu){ const leadName=prompt('Nome exato do lead para criar follow-up:'); const lead=getLead(leadName); if(lead){lead.followup=addDays(today(),2); addActivity(lead,'Follow-up criado com apoio do playbook.','Playbook'); saveLeads(); toast('Follow-up criado para '+lead.nome,'success');} else if(leadName){toast('Lead não encontrado','warn');} return; }

      const template=e.target.closest('[data-v51-template]'); if(template){ const t=AUTO_TEMPLATES.find(x=>x.key===template.dataset.v51Template); if(t) addAuto(t); return; }
      if(e.target.closest('#v51AutoSaveVisual')){ const stage=$('#v51AutoStage')?.value||'Lead', action=$('#v51AutoAction')?.value||'compromisso', days=Number($('#v51AutoDays')?.value||0), type=$('#v51AutoType')?.value||'Follow-up', note=$('#v51AutoNote')?.value||'Ação criada pelo construtor visual'; const tpl={nome:'Regra visual — '+stage+' → '+(action==='compromisso'?type:action),etapa:stage,acao:action,params:action==='compromisso'?{tipo:type,prazo:days,nota:note}:action==='prioridade'?{valor:'Alta'}:{texto:note}}; addAuto(tpl); return; }
      if(e.target.closest('#v51AutoSimulate')){ simulateAutoImpact(); return; }
      if(e.target.closest('#v51AutoOpenBuilder')){ $('#v51AutoLayout')?.scrollIntoView({behavior:'smooth',block:'start'}); return; }
    }, true);

    DOC.addEventListener('input', e=>{
      if(e.target && e.target.id==='v51AgSearch'){ const ag=$('#agSearch'); if(ag){ag.value=e.target.value; ag.dispatchEvent(new Event('input',{bubbles:true}));} }
    });
    DOC.addEventListener('change', e=>{
      if(e.target && e.target.id==='v51AgPriority'){ const val=e.target.value; const b=$$('[data-ag-priority]').find(x=>String(x.dataset.agPriority||'')===String(val)); b?.click(); }
      if(e.target && e.target.matches('[data-v51-ag-field]')){ const id=$('#v51AgendaDrawer')?.dataset.evid; if(!id) return; updateAgendaEvent(id,{[e.target.dataset.v51AgField]:e.target.value}); }
    });
  }

  function boot(){
    DOC.body.classList.add('crm-v51');
    buildSidebar(); bindSidebar(); bindGlobal();
    setTimeout(()=>{initAgenda();initCalls();initIntelligence();initAutomations();updateSidebarActive(activeView());},400);
    setTimeout(()=>{initAgenda();initCalls();initIntelligence();initAutomations();updateSidebarActive(activeView());},1300);
    const mo=new MutationObserver(()=>{ clearTimeout(window.__crmV51MoTimer); window.__crmV51MoTimer=setTimeout(()=>{buildSidebar();decoratePlaybookCards();decorateAutoCards(); if(activeView()==='agenda') renderAgendaKanban();},180); });
    mo.observe(DOC.body,{childList:true,subtree:true});
  }

  if(DOC.readyState==='loading') DOC.addEventListener('DOMContentLoaded',boot); else boot();
})();
