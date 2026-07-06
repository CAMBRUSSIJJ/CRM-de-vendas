/* CRM V63 — Central profissional de Follow-ups com Cadências
   Módulo único da aba #cadencias. Substitui a renderização antiga v57/v6 sem criar aba duplicada. */
(function(){
  'use strict';
  if(window.__CRM_V63_FOLLOWUPS__) return;
  window.__CRM_V63_FOLLOWUPS__ = true;

  const DOC = document;
  const $ = (sel, root=DOC) => root.querySelector(sel);
  const $$ = (sel, root=DOC) => Array.from(root.querySelectorAll(sel));
  const LS_CAD = 'crm_v63_cadencias';
  const LS_STATE = 'crm_v63_followups_state';
  const LS_EVENTS = 'outbounder_agenda_v1';
  const LEGACY_CAD = 'crm_v6_cadences';
  const CLOSED = new Set(['Fechado','Perdido']);
  const CHANNELS = ['Ligação','WhatsApp','E-mail','Reunião','Proposta','Retorno','Break-up'];
  const STATUSES = ['todos','vencidos','hoje','semana','futuro','sem-data','alta'];

  const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const norm = v => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const today = () => new Date().toISOString().slice(0,10);
  const parseDate = s => { const [y,m,d] = String(s||today()).split('-').map(Number); return new Date(y||new Date().getFullYear(), (m||1)-1, d||1); };
  const dateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDays = (base, n) => { const d=parseDate(base||today()); d.setDate(d.getDate()+Number(n||0)); return dateKey(d); };
  const fmtDate = d => !d ? '—' : parseDate(d).toLocaleDateString('pt-BR');
  const money = v => { try { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0); } catch(e){ return 'R$ '+(Number(v)||0); } };
  const daysDiff = d => Math.round((parseDate(d).setHours(0,0,0,0)-parseDate(today()).setHours(0,0,0,0))/864e5);
  const toast = (msg,type='success') => { try{ window.crmToast ? window.crmToast(msg,type) : showToast(msg,type); }catch(e){ console.log(msg); } };
  const uid = (p='id') => p + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  const getJSON = (k,fb) => { try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fb; } catch(e){ return fb; } };
  const setJSON = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };
  const getLeads = () => { try { return window.crmGetLeads ? window.crmGetLeads() : (window.leads || leads || []); } catch(e){ return []; } };
  const saveLeadsOnly = () => { try { if(typeof saveLeads === 'function') saveLeads(); else if(window.crmSaveLeads) window.crmSaveLeads(); } catch(e){} };
  const openLead = (lead) => { try { window.crmOpenLead ? window.crmOpenLead(lead.nome || lead) : openDetail(lead.nome || lead); } catch(e){ try{ window.setView('leads'); }catch(_){} } };
  const phoneDigits = phone => {
    let d = String(phone||'').replace(/\D/g,'');
    if(!d) return '';
    if(d.startsWith('00')) d = d.slice(2);
    if(!d.startsWith('55')) d = '55' + d;
    return d;
  };
  const telHref = phone => phoneDigits(phone) ? 'tel:+' + phoneDigits(phone) : '#';
  const waHref = phone => phoneDigits(phone) ? 'https://wa.me/' + phoneDigits(phone) : '#';
  const initials = n => String(n||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();

  const state = Object.assign({tab:'execucao', filter:'todos', search:'', sort:'date', selectedCadence:'', activeLead:'', density:'comfort'}, getJSON(LS_STATE, {}));
  function saveState(){ setJSON(LS_STATE, state); }

  const defaultCadences = [
    {id:'cad_outbound_consultivo', nome:'Novo lead outbound', descricao:'Sequência curta para primeiro contato e qualificação sem parecer robótico.', tipo:'Prospecção', ativo:true, steps:[
      {dia:0, canal:'Ligação', titulo:'Primeira tentativa de ligação', mensagem:'Entender contexto, confirmar decisor e validar se existe dor real.'},
      {dia:1, canal:'WhatsApp', titulo:'Retomar com hipótese de dor', mensagem:'Oi [NOME], tentei falar contigo. Faz sentido eu te mandar uma ideia rápida sobre [DOR/OBJETIVO]? '},
      {dia:3, canal:'E-mail', titulo:'Enviar prova/benefício', mensagem:'Mostrar de forma objetiva o problema, consequência e próximo passo sugerido.'},
      {dia:7, canal:'Break-up', titulo:'Encerrar com porta aberta', mensagem:'Como não consegui retorno, vou pausar por aqui. Se fizer sentido retomar depois, fico à disposição.'}
    ]},
    {id:'cad_proposta_retorno', nome:'Proposta enviada', descricao:'Rotina para não deixar proposta morrer sem decisão clara.', tipo:'Proposta', ativo:true, steps:[
      {dia:0, canal:'WhatsApp', titulo:'Confirmar recebimento', mensagem:'Confirmar se a proposta chegou e se existe alguma dúvida inicial.'},
      {dia:2, canal:'Ligação', titulo:'Remover objeções', mensagem:'Perguntar o que precisa estar claro para avançar com segurança.'},
      {dia:5, canal:'E-mail', titulo:'Reforçar valor e prazo', mensagem:'Retomar impacto, próximos passos e prazo de decisão.'},
      {dia:10, canal:'Retorno', titulo:'Decisão ou replanejamento', mensagem:'Confirmar se segue agora, se precisa ajustar escopo ou se reativa depois.'}
    ]},
    {id:'cad_sem_resposta', nome:'Lead sem resposta', descricao:'Sequência educada para insistir sem desgastar.', tipo:'Recuperação', ativo:true, steps:[
      {dia:0, canal:'WhatsApp', titulo:'Retomada leve', mensagem:'Oi [NOME], passando para retomar nossa conversa. Ainda faz sentido falar sobre isso?'},
      {dia:2, canal:'Ligação', titulo:'Nova tentativa objetiva', mensagem:'Tentar contato curto e registrar motivo da ausência de resposta.'},
      {dia:5, canal:'WhatsApp', titulo:'Mensagem com escolha simples', mensagem:'Prefere que eu te mande os próximos passos por aqui ou marcamos 15 minutos?'},
      {dia:9, canal:'Break-up', titulo:'Pausar contato', mensagem:'Vou pausar meus contatos por aqui para não incomodar. Quando fizer sentido, fico à disposição.'}
    ]},
    {id:'cad_reativacao', nome:'Reativação de perdido', descricao:'Reabrir leads antigos com contexto e sem começar do zero.', tipo:'Reativação', ativo:true, steps:[
      {dia:0, canal:'WhatsApp', titulo:'Reabrir conversa', mensagem:'Oi [NOME], quando falamos antes o momento não era ideal. Mudou algo desse lado?'},
      {dia:3, canal:'Ligação', titulo:'Entender novo cenário', mensagem:'Descobrir se a dor continua, se mudou o responsável e qual seria o timing.'},
      {dia:7, canal:'E-mail', titulo:'Enviar atualização ou caso', mensagem:'Enviar prova social, melhoria ou nova condição que justifique a retomada.'},
      {dia:14, canal:'Retorno', titulo:'Decidir próxima janela', mensagem:'Definir se avança agora ou se programa reativação futura.'}
    ]}
  ];

  function migrateCadences(){
    const already = getJSON('crm_v63_cadencias_migrated', false);
    if(already) return;
    const current = getJSON(LS_CAD, null);
    if(current && current.length){ setJSON('crm_v63_cadencias_migrated', true); return; }
    const legacy = getJSON(LEGACY_CAD, []);
    const mapped = Array.isArray(legacy) ? legacy.map(c => ({
      id:c.id || uid('cad_'), nome:c.nome || 'Follow-up importado', descricao:'Migrado da camada antiga v6.', tipo:'Importado', ativo:true,
      steps:(c.steps||[]).map(s=>({dia:Number(s.dia)||0, canal:s.canal||'Ligação', titulo:s.desc||s.titulo||s.canal||'Contato', mensagem:s.mensagem||s.desc||''}))
    })) : [];
    setJSON(LS_CAD, mapped.length ? mapped.concat(defaultCadences) : defaultCadences);
    setJSON('crm_v63_cadencias_migrated', true);
  }
  function getCadences(){ migrateCadences(); const arr=getJSON(LS_CAD, defaultCadences); return Array.isArray(arr) && arr.length ? arr : defaultCadences; }
  function saveCadences(arr){ setJSON(LS_CAD, arr); }

  function ensureLeadShape(l){
    if(!Array.isArray(l.atividades)) l.atividades = [];
    if(!Array.isArray(l.cadenciaPassos)) l.cadenciaPassos = Array.isArray(l.cadenciaPassos) ? l.cadenciaPassos : [];
    return l;
  }
  function registerActivity(l, tipo, texto){
    ensureLeadShape(l);
    l.atividades.unshift({id:uid('at_'), tipo:tipo||'Follow-up', texto: texto||'Follow-up atualizado', autor:'Você', data:new Date().toISOString()});
  }
  function activeStep(l){
    const steps = Array.isArray(l.cadenciaPassos) ? l.cadenciaPassos : [];
    return steps.find(s=>s.status!=='feito' && s.status!=='cancelado') || null;
  }
  function lastStep(l){ const steps=Array.isArray(l.cadenciaPassos)?l.cadenciaPassos:[]; return steps[steps.length-1] || null; }
  function leadAction(l){
    const step = activeStep(l);
    if(step) return step.titulo || step.canal || 'Executar próximo contato';
    return l.proximaAcao || (l.followup ? 'Executar follow-up agendado' : 'Definir próximo passo');
  }
  function statusOf(l){
    if(CLOSED.has(l.etapa)) return l.etapa==='Fechado' ? 'concluido' : 'perdido';
    const step=activeStep(l);
    const d = step?.data || l.followup;
    if(!d) return 'sem-data';
    const diff=daysDiff(d);
    if(diff<0) return 'vencidos';
    if(diff===0) return 'hoje';
    if(diff<=7) return 'semana';
    return 'futuro';
  }
  function statusLabel(s){ return ({'vencidos':'Vencido','hoje':'Hoje','semana':'Próx. 7 dias','futuro':'Futuro','sem-data':'Sem data','concluido':'Concluído','perdido':'Perdido'})[s] || 'Todos'; }
  function statusClass(l){ return statusOf(l).replace('sem-data','nodate'); }
  function score(l){
    const st = statusOf(l);
    return (st==='vencidos'?80:st==='hoje'?60:st==='semana'?25:st==='sem-data'?15:0) + (l.prioridade==='Alta'?25:l.prioridade==='Média'?10:0) + (l.etapa==='Proposta'?20:0) + Math.min(20,(Number(l.valor)||0)/1000);
  }
  function filteredLeads(){
    const q = norm(state.search);
    let list = getLeads().map(ensureLeadShape).filter(l => {
      const text = norm([l.nome,l.segmento,l.responsavel,l.etapa,l.origem,l.prioridade,l.cadenciaAtual,leadAction(l),l.tags].join(' '));
      if(q && !text.includes(q)) return false;
      if(state.filter==='todos') return !CLOSED.has(l.etapa) || statusOf(l)==='concluido';
      if(state.filter==='alta') return l.prioridade==='Alta' && !CLOSED.has(l.etapa);
      return statusOf(l) === state.filter;
    });
    if(state.sort==='score') list.sort((a,b)=>score(b)-score(a));
    else if(state.sort==='value') list.sort((a,b)=>(Number(b.valor)||0)-(Number(a.valor)||0));
    else if(state.sort==='stage') list.sort((a,b)=>String(a.etapa||'').localeCompare(String(b.etapa||''),'pt-BR'));
    else list.sort((a,b)=>String((activeStep(a)?.data||a.followup||'9999-12-31')).localeCompare(String((activeStep(b)?.data||b.followup||'9999-12-31'))));
    return list;
  }
  function kpis(){
    const open=getLeads().filter(l=>!CLOSED.has(l.etapa));
    const overdue=open.filter(l=>statusOf(l)==='vencidos');
    const todayList=open.filter(l=>statusOf(l)==='hoje');
    const week=open.filter(l=>statusOf(l)==='semana');
    const noDate=open.filter(l=>statusOf(l)==='sem-data');
    const risk=overdue.reduce((s,l)=>s+(Number(l.valor)||0),0);
    return {open, overdue, todayList, week, noDate, risk};
  }

  function render(){
    const page = $('#cadencias');
    if(!page) return;
    page.classList.add('followups-view','v63-followups-view');
    page.innerHTML = `
      <div class="v63-fu-shell">
        ${heroHTML()}
        ${kpiHTML()}
        ${toolbarHTML()}
        <div id="v63FollowBody"></div>
      </div>`;
    bindBase();
    renderBody();
    saveState();
  }
  function heroHTML(){
    const cadCount=getCadences().length;
    return `<div class="v63-fu-hero">
      <div>
        <div class="v63-eyebrow">Central operacional V63</div>
        <h2>Follow-ups com cadências</h2>
        <p>Execute contatos do dia, aplique sequências prontas em leads, registre resultado e mantenha o próximo passo sempre visível na Central de Leads, Pipeline e Agenda.</p>
        <div class="v63-hero-tags"><span>${cadCount} cadência(s)</span><span>Sem renderizador antigo</span><span>Dados no lead principal</span></div>
      </div>
      <div class="v63-hero-actions">
        <button class="btn btn-primary" id="fuOpenQuickCreate" type="button">+ Novo follow-up</button>
        <button class="btn" id="fuGenerateRoutine" type="button">Gerar rotina de hoje</button>
        <button class="btn" id="v63FuOpenCadences" type="button">Cadências</button>
      </div>
    </div>`;
  }
  function kpiHTML(){
    const k=kpis();
    const items=[
      ['vencidos','Vencidos',k.overdue.length,'Precisam de contato imediato'],
      ['hoje','Hoje',k.todayList.length,'Atividades previstas para hoje'],
      ['semana','Próx. 7 dias',k.week.length,'Follow-ups programados'],
      ['sem-data','Sem próximo passo',k.noDate.length,'Leads abertos sem data'],
      ['risk','Valor em risco',money(k.risk),'Pipeline com atraso']
    ];
    return `<div class="followups-kpi-grid v63-kpi-grid">${items.map(([f,l,n,h])=>`<button class="followups-kpi v63-kpi" type="button" data-fu-kpi="${f}"><span>${l}</span><strong>${n}</strong><small>${h}</small></button>`).join('')}</div>`;
  }
  function toolbarHTML(){
    const filters=[['todos','Todos'],['vencidos','Vencidos'],['hoje','Hoje'],['semana','Semana'],['sem-data','Sem data'],['alta','Alta prioridade']];
    return `<div class="followups-toolbar card v63-toolbar">
      <div class="v63-tabs" role="tablist">
        ${[['execucao','Execução'],['kanban','Kanban'],['cadencias','Cadências'],['modelos','Modelos']].map(([id,label])=>`<button type="button" class="v63-tab ${state.tab===id?'active':''}" data-v63-tab="${id}">${label}</button>`).join('')}
      </div>
      <div class="search-wrap"><svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><use href="#ic-search"></use></svg><input class="search-input" id="fuSearch" placeholder="Buscar lead, etapa, cadência, responsável..." type="search" value="${esc(state.search)}"></div>
      <div class="filter-chips" id="fuFilters">${filters.map(([id,label])=>`<button class="chip ${state.filter===id?'active':''}" data-fu-filter="${id}" type="button">${label}</button>`).join('')}</div>
      <select class="followups-select" id="fuSort">
        <option value="date" ${state.sort==='date'?'selected':''}>Ordenar por data</option>
        <option value="score" ${state.sort==='score'?'selected':''}>Ordenar por prioridade</option>
        <option value="value" ${state.sort==='value'?'selected':''}>Ordenar por valor</option>
        <option value="stage" ${state.sort==='stage'?'selected':''}>Ordenar por etapa</option>
      </select>
    </div>`;
  }
  function renderBody(){
    const body=$('#v63FollowBody'); if(!body) return;
    if(state.tab==='kanban') return renderKanban(body);
    if(state.tab==='cadencias') return renderCadences(body);
    if(state.tab==='modelos') return renderTemplates(body);
    return renderExecution(body);
  }
  function leadCard(l, compact=false){
    const st=statusOf(l), step=activeStep(l), due=step?.data || l.followup, dLabel=due ? fmtDate(due) : 'Sem data';
    const cadence = l.cadenciaAtual ? `<span class="v63-pill blue">${esc(l.cadenciaAtual)}</span>` : '<span class="v63-pill muted">Sem cadência</span>';
    const contact = step?.canal || l.canalPreferido || 'Contato';
    return `<article class="v63-follow-card ${statusClass(l)} ${compact?'compact':''}" data-lead-name="${esc(l.nome)}">
      <div class="v63-avatar">${esc(initials(l.nome))}</div>
      <div class="v63-card-main">
        <div class="v63-card-title"><b>${esc(l.nome)}</b><span class="v63-pill ${st}">${esc(statusLabel(st))}</span>${cadence}</div>
        <div class="v63-card-meta"><span>${esc(l.segmento||'Sem segmento')}</span><span>${esc(l.responsavel||'Sem responsável')}</span><span>${esc(l.etapa||'Lead')}</span><span>${esc(l.prioridade||'Média')}</span>${l.valor?`<span>${money(l.valor)}</span>`:''}</div>
        <div class="v63-card-note"><strong>${esc(contact)}:</strong> ${esc(leadAction(l))}</div>
        ${step?.mensagem ? `<div class="v63-step-message">${esc(step.mensagem)}</div>` : ''}
        <div class="v63-card-meta"><span class="v63-date ${st}">📅 ${esc(dLabel)}</span>${lastStep(l)?`<span>${doneCount(l)}/${(l.cadenciaPassos||[]).length} passos feitos</span>`:''}</div>
      </div>
      <div class="v63-card-actions">
        <a class="fu-action" href="${telHref(l.telefone)}" data-v63-log="Ligação" data-lead-name="${esc(l.nome)}">Ligar</a>
        <a class="fu-action" href="${waHref(l.telefone)}" target="_blank" data-v63-log="WhatsApp" data-lead-name="${esc(l.nome)}">WhatsApp</a>
        <button class="fu-action" type="button" data-v63-done="${esc(l.nome)}">Concluir</button>
        <button class="fu-action" type="button" data-v63-snooze="${esc(l.nome)}">Adiar</button>
        <button class="fu-action" type="button" data-v63-open="${esc(l.nome)}">Lead</button>
      </div>
    </article>`;
  }
  function doneCount(l){ return (Array.isArray(l.cadenciaPassos)?l.cadenciaPassos:[]).filter(s=>s.status==='feito').length; }

  function renderExecution(body){
    const list=filteredLeads();
    const first=list[0];
    if(first && !state.activeLead) state.activeLead=first.nome;
    body.innerHTML = `<div class="followups-layout v63-layout">
      <div class="card followups-main-card v63-main-card">
        <div class="card-header"><div><div class="card-title">Fila de execução</div><div class="card-sub">Resolva vencidos primeiro, depois hoje e próximos contatos. Cada ação atualiza o lead principal.</div></div><span class="tag tag-neutro" id="fuListCount">${list.length} item(ns)</span></div>
        <div class="followups-list v63-list">${list.length ? list.map(l=>leadCard(l)).join('') : emptyHTML('Nenhum follow-up encontrado','Ajuste os filtros ou crie um próximo passo para um lead.')}</div>
      </div>
      <aside class="followups-side v63-side">
        ${quickCreateHTML()}
        ${routineHTML()}
        ${miniCadenceHTML()}
      </aside>
    </div>`;
    bindCards(); bindQuickCreate(); bindRoutine(); bindMiniCadence();
  }
  function quickCreateHTML(){
    const leads=getLeads().filter(l=>!CLOSED.has(l.etapa));
    return `<div class="card followups-create-card" id="fuQuickCreateCard">
      <div class="card-header"><div><div class="card-title">Criar follow-up rápido</div><div class="card-sub">Atualiza a data, ação e histórico do lead.</div></div></div>
      <div class="card-body followups-form">
        <div class="field"><label>Lead</label><select id="fuLeadSelect">${leads.map(l=>`<option value="${esc(l.nome)}">${esc(l.nome)}</option>`).join('')}</select></div>
        <div class="field"><label>Tipo de contato</label><select id="fuType">${CHANNELS.map(c=>`<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label>Data</label><input id="fuDate" type="date" value="${today()}"></div>
        <div class="field"><label>Observação</label><textarea id="fuNote" placeholder="Ex: confirmar recebimento da proposta e tirar dúvidas" rows="3"></textarea></div>
        <label class="v63-check"><input id="fuCreateAgenda" type="checkbox" checked> Também criar compromisso na agenda local</label>
        <button class="btn btn-primary" id="fuSaveQuick" type="button">Salvar follow-up</button>
      </div>
    </div>`;
  }
  function routineHTML(){
    const queue=getLeads().filter(l=>!CLOSED.has(l.etapa)).sort((a,b)=>score(b)-score(a)).slice(0,5);
    return `<div class="card"><div class="card-header"><div><div class="card-title">Rotina recomendada</div><div class="card-sub">Ordem sugerida para hoje.</div></div></div><div class="followups-routine" id="fuRoutine">${queue.length?queue.map((l,i)=>`<button class="routine-item" type="button" data-v63-open="${esc(l.nome)}"><span class="routine-rank">${i+1}</span><span><b>${esc(l.nome)}</b><p>${esc(statusLabel(statusOf(l)))} · ${esc(leadAction(l))}</p></span></button>`).join(''):emptyHTML('Sem rotina crítica','Nenhum lead aberto exigindo ação agora.')}</div></div>`;
  }
  function miniCadenceHTML(){
    const top=getCadences().slice(0,4);
    return `<div class="card"><div class="card-header"><div><div class="card-title">Cadências rápidas</div><div class="card-sub">Aplicar sequência em um lead.</div></div></div><div class="v63-mini-cadences">${top.map(c=>`<button type="button" data-v63-quick-cad="${esc(c.id)}"><strong>${esc(c.nome)}</strong><span>${c.steps.length} passos · ${esc(c.tipo||'Comercial')}</span></button>`).join('')}</div></div>`;
  }
  function renderKanban(body){
    const columns=[['vencidos','Vencidos'],['hoje','Hoje'],['semana','Semana'],['futuro','Futuro'],['sem-data','Sem data'],['concluido','Concluídos']];
    const all=filteredLeads();
    body.innerHTML = `<div class="v63-kanban">${columns.map(([id,label])=>{const items=all.filter(l=>statusOf(l)===id);return `<section class="v63-kanban-col" data-v63-status="${id}"><div class="v63-col-head"><strong>${label}</strong><span>${items.length}</span></div><div class="v63-col-body">${items.length?items.map(l=>leadCard(l,true)).join(''):'<div class="v63-empty-small">Nenhum lead aqui.</div>'}</div></section>`}).join('')}</div>`;
    bindCards(); bindDrag();
  }
  function renderCadences(body){
    const cadences=getCadences();
    const current=cadences.find(c=>c.id===state.selectedCadence) || cadences[0];
    state.selectedCadence=current?.id || '';
    body.innerHTML = `<div class="v63-cadence-layout">
      <div class="card v63-cadence-list-card"><div class="card-header"><div><div class="card-title">Cadências salvas</div><div class="card-sub">Modelos reutilizáveis de sequência comercial.</div></div><button class="btn btn-sm" id="v63NewCadence">Nova</button></div><div class="v63-cadence-list">${cadences.map(c=>cadenceListItem(c,current)).join('')}</div></div>
      <div class="card v63-cadence-editor"><div class="card-header"><div><div class="card-title">Editor de cadência</div><div class="card-sub">Altere passos, canais e mensagem base.</div></div><div class="v63-editor-actions"><button class="btn btn-sm" id="v63DuplicateCadence">Duplicar</button><button class="btn btn-sm btn-danger" id="v63DeleteCadence">Excluir</button><button class="btn btn-primary btn-sm" id="v63SaveCadence">Salvar</button></div></div>${cadenceEditorHTML(current)}</div>
      <aside class="card v63-apply-card"><div class="card-header"><div><div class="card-title">Aplicar cadência</div><div class="card-sub">Escolha um ou mais leads abertos.</div></div></div>${applyCadenceHTML(current)}</aside>
    </div>`;
    bindCadenceEditor();
  }
  function cadenceListItem(c,current){
    const active=current && c.id===current.id;
    const using=getLeads().filter(l=>l.cadenciaId===c.id || l.cadenciaAtual===c.nome).length;
    return `<button type="button" class="v63-cadence-row ${active?'active':''}" data-v63-cad-select="${esc(c.id)}"><strong>${esc(c.nome)}</strong><span>${esc(c.tipo||'Comercial')} · ${c.steps.length} passos · ${using} lead(s)</span></button>`;
  }
  function cadenceEditorHTML(c){
    c=c||{nome:'Nova cadência',descricao:'',tipo:'Comercial',steps:[]};
    return `<div class="v63-editor-body">
      <div class="v63-form-grid"><div class="field"><label>Nome</label><input id="v63CadName" value="${esc(c.nome)}"></div><div class="field"><label>Tipo</label><input id="v63CadType" value="${esc(c.tipo||'Comercial')}"></div><div class="field full"><label>Descrição</label><input id="v63CadDesc" value="${esc(c.descricao||'')}"></div></div>
      <div class="v63-steps-head"><strong>Passos</strong><button class="btn btn-sm" id="v63AddStep" type="button">+ Adicionar passo</button></div>
      <div id="v63CadSteps" class="v63-cad-steps">${(c.steps||[]).map((s,i)=>stepRowHTML(s,i)).join('')}</div>
    </div>`;
  }
  function stepRowHTML(s={},i=0){
    return `<div class="v63-step-row" data-step-index="${i}">
      <div class="field"><label>Dia</label><input type="number" min="0" value="${Number(s.dia)||0}" data-step="dia"></div>
      <div class="field"><label>Canal</label><select data-step="canal">${CHANNELS.map(c=>`<option ${String(s.canal||'Ligação')===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label>Título</label><input value="${esc(s.titulo||s.desc||'Contato') }" data-step="titulo"></div>
      <div class="field full"><label>Mensagem/objetivo</label><textarea rows="2" data-step="mensagem">${esc(s.mensagem||s.desc||'')}</textarea></div>
      <button type="button" class="v63-step-remove" data-v63-remove-step title="Remover passo">×</button>
    </div>`;
  }
  function applyCadenceHTML(c){
    const leads=getLeads().filter(l=>!CLOSED.has(l.etapa));
    return `<div class="v63-apply-body"><div class="field"><label>Selecionar lead</label><select id="v63CadLead">${leads.map(l=>`<option value="${esc(l.nome)}">${esc(l.nome)}</option>`).join('')}</select></div><button class="btn btn-primary" id="v63ApplyCadence" type="button">Aplicar em 1 lead</button><button class="btn" id="v63ApplyCadenceFiltered" type="button">Aplicar nos filtrados</button><div class="v63-apply-note">Cadência atual: <strong>${esc(c?.nome||'—')}</strong>. O primeiro passo vira o próximo follow-up do lead.</div></div>`;
  }
  function renderTemplates(body){
    const templates={
      whatsapp:`Oi [NOME], tudo bem? Estou passando para retomar nosso último contato. Você prefere que eu te envie os próximos passos por aqui ou marcamos 15 minutos?`,
      proposta:`Oi [NOME], confirmei aqui a proposta que te enviei. O que precisa estar claro para vocês avançarem com segurança?`,
      ligacao:`Roteiro rápido: 1) confirmar contexto; 2) perguntar prioridade; 3) entender decisor; 4) definir próximo passo com data.`,
      breakup:`Como não consegui retorno, vou pausar meus contatos por aqui para não incomodar. Se fizer sentido retomar depois, fico à disposição.`,
      reativacao:`Oi [NOME], quando falamos antes o momento não era ideal. Mudou algo desse lado ou ainda faz sentido deixar para depois?`,
      reuniao:`Passando para confirmar nossa reunião. Vou levar contexto, possíveis gargalos e próximos passos objetivos. Pode ser?`
    };
    body.innerHTML=`<div class="v63-template-grid">${Object.entries(templates).map(([k,v])=>`<article class="card v63-template-card"><div class="card-title">${esc(k[0].toUpperCase()+k.slice(1))}</div><p>${esc(v)}</p><div class="v63-template-actions"><button class="btn btn-sm" data-v63-copy-template="${esc(v)}">Copiar</button><button class="btn btn-sm" data-v63-template-to-follow="${esc(v)}">Usar no follow-up</button></div></article>`).join('')}</div>`;
    $$('[data-v63-copy-template]').forEach(b=>b.onclick=()=>copyText(b.dataset.v63CopyTemplate));
    $$('[data-v63-template-to-follow]').forEach(b=>b.onclick=()=>{state.tab='execucao';render();setTimeout(()=>{$('#fuNote')&&($('#fuNote').value=b.dataset.v63TemplateToFollow||'')},80)});
  }
  function emptyHTML(title,sub){ return `<div class="fu-empty"><b>${esc(title)}</b>${esc(sub||'')}</div>`; }

  function bindBase(){
    $$('[data-v63-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.v63Tab; saveState(); render();});
    $('#fuSearch')?.addEventListener('input',e=>{state.search=e.target.value; saveState(); renderBody();});
    $('#fuSort')?.addEventListener('change',e=>{state.sort=e.target.value; saveState(); renderBody();});
    $$('[data-fu-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.fuFilter; saveState(); render();});
    $$('[data-fu-kpi]').forEach(k=>k.onclick=()=>{const f=k.dataset.fuKpi;if(f&&f!=='risk'){state.filter=f;state.tab='execucao';render();}});
    $('#fuGenerateRoutine')?.addEventListener('click',()=>{state.tab='execucao';state.sort='score';state.filter='todos';toast('Rotina reorganizada por prioridade','success');render();});
    $('#fuOpenQuickCreate')?.addEventListener('click',()=>{state.tab='execucao';render();setTimeout(()=>$('#fuQuickCreateCard')?.scrollIntoView({behavior:'smooth',block:'center'}),80);});
    $('#v63FuOpenCadences')?.addEventListener('click',()=>{state.tab='cadencias';render();});
  }
  function bindCards(){
    $$('[data-v63-open]').forEach(b=>b.onclick=(e)=>{e.preventDefault();const l=getLeads().find(x=>x.nome===b.dataset.v63Open);if(l)openLead(l);});
    $$('[data-v63-done]').forEach(b=>b.onclick=(e)=>{e.preventDefault();const l=getLeads().find(x=>x.nome===b.dataset.v63Done);if(l)completeStep(l);});
    $$('[data-v63-snooze]').forEach(b=>b.onclick=(e)=>{e.preventDefault();const l=getLeads().find(x=>x.nome===b.dataset.v63Snooze);if(l)snooze(l,2);});
    $$('[data-v63-log]').forEach(a=>a.addEventListener('click',()=>{const l=getLeads().find(x=>x.nome===a.dataset.leadName);if(l){registerActivity(l,a.dataset.v63Log,`${a.dataset.v63Log} iniciado pela Central de Follow-ups`);l.ultimaAtualizacao=today();saveLeadsOnly();}}));
  }
  function bindQuickCreate(){
    $('#fuSaveQuick')?.addEventListener('click',()=>{
      const l=getLeads().find(x=>x.nome===$('#fuLeadSelect')?.value);
      if(!l) return toast('Selecione um lead','warn');
      const type=$('#fuType')?.value || 'Follow-up';
      const date=$('#fuDate')?.value || today();
      const note=$('#fuNote')?.value?.trim() || `Follow-up de ${type}`;
      ensureLeadShape(l);
      l.followup=date; l.proximaAcao=note; l.etapaFollowup=type; l.ultimaAtualizacao=today();
      registerActivity(l,'Follow-up',`${type} agendado para ${fmtDate(date)} — ${note}`);
      if($('#fuCreateAgenda')?.checked) createAgendaEvent(l,type,date,note);
      saveLeadsOnly(); toast('Follow-up salvo no lead','success'); render();
    });
  }
  function bindRoutine(){
    $$('#fuRoutine [data-v63-open]').forEach(b=>b.onclick=()=>{const l=getLeads().find(x=>x.nome===b.dataset.v63Open);if(l)openLead(l);});
  }
  function bindMiniCadence(){
    $$('[data-v63-quick-cad]').forEach(b=>b.onclick=()=>{state.selectedCadence=b.dataset.v63QuickCad;state.tab='cadencias';saveState();render();});
  }
  function bindDrag(){
    let dragged='';
    $$('.v63-follow-card').forEach(card=>{card.draggable=true;card.addEventListener('dragstart',()=>{dragged=card.dataset.leadName;card.classList.add('dragging');});card.addEventListener('dragend',()=>card.classList.remove('dragging'));});
    $$('.v63-kanban-col').forEach(col=>{col.addEventListener('dragover',e=>e.preventDefault());col.addEventListener('drop',e=>{e.preventDefault();const l=getLeads().find(x=>x.nome===dragged);if(l)moveLeadToStatus(l,col.dataset.v63Status);});});
  }
  function bindCadenceEditor(){
    $$('[data-v63-cad-select]').forEach(b=>b.onclick=()=>{state.selectedCadence=b.dataset.v63CadSelect;saveState();renderCadences($('#v63FollowBody'));});
    $('#v63NewCadence')?.addEventListener('click',()=>{const arr=getCadences();const c={id:uid('cad_'),nome:'Nova cadência',descricao:'',tipo:'Comercial',ativo:true,steps:[{dia:0,canal:'Ligação',titulo:'Primeiro contato',mensagem:''}]};arr.unshift(c);saveCadences(arr);state.selectedCadence=c.id;renderCadences($('#v63FollowBody'));});
    $('#v63AddStep')?.addEventListener('click',()=>{$('#v63CadSteps')?.insertAdjacentHTML('beforeend',stepRowHTML({dia:1,canal:'WhatsApp',titulo:'Novo passo',mensagem:''},$$('.v63-step-row').length));});
    $$('[data-v63-remove-step]').forEach(b=>b.onclick=()=>b.closest('.v63-step-row')?.remove());
    $('#v63SaveCadence')?.addEventListener('click',saveCurrentCadence);
    $('#v63DuplicateCadence')?.addEventListener('click',duplicateCurrentCadence);
    $('#v63DeleteCadence')?.addEventListener('click',deleteCurrentCadence);
    $('#v63ApplyCadence')?.addEventListener('click',()=>{const l=getLeads().find(x=>x.nome===$('#v63CadLead')?.value);if(l)applyCadenceToLead(l, currentCadence());});
    $('#v63ApplyCadenceFiltered')?.addEventListener('click',()=>{const cad=currentCadence();const list=filteredLeads().filter(l=>!CLOSED.has(l.etapa));list.forEach(l=>applyCadenceToLead(l,cad,true));saveLeadsOnly();toast(`Cadência aplicada em ${list.length} lead(s)`,'success');render();});
  }
  function currentCadence(){ return getCadences().find(c=>c.id===state.selectedCadence) || getCadences()[0]; }
  function readCurrentCadence(){
    const old=currentCadence() || {};
    return {id:old.id || uid('cad_'), nome:$('#v63CadName')?.value?.trim() || 'Cadência', tipo:$('#v63CadType')?.value?.trim() || 'Comercial', descricao:$('#v63CadDesc')?.value?.trim() || '', ativo:true, steps:$$('.v63-step-row').map(row=>({dia:Number($('[data-step="dia"]',row)?.value)||0, canal:$('[data-step="canal"]',row)?.value || 'Ligação', titulo:$('[data-step="titulo"]',row)?.value?.trim() || 'Contato', mensagem:$('[data-step="mensagem"]',row)?.value?.trim() || ''})).sort((a,b)=>a.dia-b.dia)};
  }
  function saveCurrentCadence(){
    const data=readCurrentCadence();
    const arr=getCadences(); const idx=arr.findIndex(c=>c.id===data.id);
    if(idx>=0) arr[idx]=data; else arr.unshift(data);
    saveCadences(arr); state.selectedCadence=data.id; toast('Cadência salva','success'); renderCadences($('#v63FollowBody'));
  }
  function duplicateCurrentCadence(){
    const c=readCurrentCadence(); c.id=uid('cad_'); c.nome=c.nome+' — cópia';
    const arr=getCadences(); arr.unshift(c); saveCadences(arr); state.selectedCadence=c.id; toast('Cadência duplicada','success'); renderCadences($('#v63FollowBody'));
  }
  function deleteCurrentCadence(){
    const c=currentCadence(); if(!c) return;
    const ok=confirm(`Excluir a cadência "${c.nome}"? Os leads que já receberam essa sequência não serão apagados.`);
    if(!ok) return;
    const arr=getCadences().filter(x=>x.id!==c.id); saveCadences(arr.length?arr:defaultCadences); state.selectedCadence=(arr[0]||defaultCadences[0]).id; toast('Cadência excluída','success'); renderCadences($('#v63FollowBody'));
  }

  function applyCadenceToLead(l,cad,silent=false){
    if(!l||!cad) return;
    ensureLeadShape(l);
    const steps=(cad.steps||[]).map((s,i)=>({id:uid('step_'), ordem:i+1, dia:Number(s.dia)||0, canal:s.canal||'Ligação', titulo:s.titulo||s.desc||s.canal||'Contato', mensagem:s.mensagem||s.desc||'', data:addDays(today(),Number(s.dia)||0), status:'pendente'}));
    l.cadenciaId=cad.id; l.cadenciaAtual=cad.nome; l.cadenciaPassos=steps; l.etapaFollowup=steps[0]?.titulo || cad.nome; l.followup=steps[0]?.data || today(); l.proximaAcao=steps[0]?.titulo || `Executar ${cad.nome}`; l.ultimaAtualizacao=today();
    registerActivity(l,'Follow-up',`Cadência aplicada: ${cad.nome} (${steps.length} passos)`);
    if(!silent){ saveLeadsOnly(); toast('Cadência aplicada ao lead','success'); render(); }
  }
  function completeStep(l){
    ensureLeadShape(l);
    const step=activeStep(l);
    if(step){ step.status='feito'; step.concluidoEm=new Date().toISOString(); registerActivity(l,'Follow-up',`Concluído: ${step.titulo || step.canal}`); }
    else registerActivity(l,'Follow-up','Follow-up concluído');
    const next=activeStep(l);
    if(next){ l.followup=next.data; l.proximaAcao=next.titulo || next.canal; l.etapaFollowup=next.titulo || next.canal; }
    else { l.followup=''; l.proximaAcao='Cadência concluída'; l.etapaFollowup='Concluído'; l.cadenciaStatus='concluida'; }
    l.ultimaAtualizacao=today(); saveLeadsOnly(); toast(next?'Passo concluído. Próximo contato agendado.':'Cadência concluída','success'); render();
  }
  function snooze(l,days){
    ensureLeadShape(l); const step=activeStep(l);
    if(step) step.data=addDays(step.data||today(),days); l.followup=addDays(l.followup||today(),days); l.ultimaAtualizacao=today();
    registerActivity(l,'Follow-up',`Follow-up adiado em ${days} dia(s)`); saveLeadsOnly(); toast('Follow-up adiado','success'); render();
  }
  function moveLeadToStatus(l,status){
    if(status==='concluido') return completeStep(l);
    if(status==='sem-data'){ l.followup=''; const step=activeStep(l); if(step) step.data=''; }
    if(status==='hoje') setDue(l,today());
    if(status==='semana') setDue(l,addDays(today(),3));
    if(status==='futuro') setDue(l,addDays(today(),10));
    if(status==='vencidos') setDue(l,addDays(today(),-1));
    l.ultimaAtualizacao=today(); registerActivity(l,'Follow-up',`Movido no Kanban para ${statusLabel(status)}`); saveLeadsOnly(); toast('Follow-up atualizado','success'); render();
  }
  function setDue(l,date){ const step=activeStep(l); if(step) step.data=date; l.followup=date; }
  function createAgendaEvent(l,type,date,note){
    const list=getJSON(LS_EVENTS,[]);
    list.push({id:uid('ev_'), title:`${type}: ${l.nome}`, data:date, hora:'09:00', tipo:type, prioridade:l.prioridade||'Média', leadNome:l.nome, notas:note});
    setJSON(LS_EVENTS,list);
  }
  function copyText(txt){ navigator.clipboard?.writeText(txt).then(()=>toast('Texto copiado','success')).catch(()=>toast('Copie manualmente o texto','warn')); }

  function patchSetView(){
    const prev=window.setView;
    if(typeof prev==='function' && !prev.__v63Followups){
      const wrapped=function(v){ const out=prev.apply(this,arguments); if(v==='cadencias') setTimeout(render,80); return out; };
      wrapped.__v63Followups=true; window.setView=wrapped; try{ setView=wrapped; }catch(e){}
    }
  }
  function boot(){
    migrateCadences(); patchSetView();
    window.CRMV63Followups = {render, setTab:(tab)=>{state.tab=tab||'execucao';render();}, setFilter:(filter)=>{state.filter=STATUSES.includes(filter)?filter:'todos';state.tab='execucao';render();}, applyCadenceToLead, getCadences};
    DOC.addEventListener('click', function(e){
      const ux=e.target.closest('[data-ux-fu-filter]'); if(ux){ e.preventDefault(); state.filter=ux.dataset.uxFuFilter || 'todos'; state.tab='execucao'; render(); }
    }, true);
    if($('.view.active')?.id==='cadencias') setTimeout(render,60);
  }
  if(DOC.readyState==='loading') DOC.addEventListener('DOMContentLoaded',boot); else boot();
})();
