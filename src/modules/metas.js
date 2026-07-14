/* EMBED: assets/js/modules/17-metas-conectadas-v68.js */
/* CRM V68 — Metas conectadas com Ligações e Follow-ups
   Módulo único oficial da aba #metas. Substitui 17-metas-modulo-completo.js sem criar segunda tela. */
(function(){
  'use strict';
  if(window.__CRM_V68_GOALS__) return;
  window.__CRM_V68_GOALS__ = true;

  const DOC=document;
  const $=(sel,root=DOC)=>root.querySelector(sel);
  const $$=(sel,root=DOC)=>Array.from(root.querySelectorAll(sel));
  const GOAL_KEYS=['outbounder_goals_v5','crm_goals_v5'];
  const LEAD_KEY='crm_v99_leads';
  const AGENDA_KEY='outbounder_agenda_v1';
  const ROUTINE_KEY='outbounder_metas_rotina_v68';
  const PREF_KEY='outbounder_metas_v68_prefs';
  const DEFAULT_RESP='Time Comercial';
  const CLOSED=new Set(['Fechado','Perdido']);
  const goalTypes=['Ligação','Follow-up','WhatsApp','E-mail','Reunião','Proposta','Fechamento','Atividade'];
  const defaultTargets={'Ligação':30,'Follow-up':20,'WhatsApp':40,'E-mail':25,'Reunião':3,'Proposta':2,'Fechamento':1,'Atividade':50};
  const state={q:'',tipo:'',status:'todas',resp:'',editing:null};

  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const readJSON=(k,fb)=>{try{const raw=localStorage.getItem(k);return raw?JSON.parse(raw):fb}catch(e){return fb}};
  const writeJSON=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  const today=()=>new Date().toISOString().slice(0,10);
  const toDate=s=>{const d=String(s||today()).slice(0,10).split('-').map(Number);return new Date(d[0]||new Date().getFullYear(),(d[1]||1)-1,d[2]||1)};
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDays=(s,n)=>{const d=toDate(s||today());d.setDate(d.getDate()+Number(n||0));return iso(d)};
  const startOfWeek=()=>{const d=toDate(today()),day=d.getDay()||7;d.setDate(d.getDate()-day+1);return iso(d)};
  const endOfWeek=()=>addDays(startOfWeek(),6);
  const startOfMonth=()=>{const d=toDate(today());return iso(new Date(d.getFullYear(),d.getMonth(),1))};
  const endOfMonth=()=>{const d=toDate(today());return iso(new Date(d.getFullYear(),d.getMonth()+1,0))};
  const daysInc=(a,b)=>Math.max(1,Math.floor((toDate(b)-toDate(a))/86400000)+1);
  const ageDays=s=>Math.max(0,Math.floor((toDate(today())-toDate(s||today()))/86400000));
  const inRange=(d,start,end)=>{if(!d)return false;const x=String(d).slice(0,10);return(!start||x>=start)&&(!end||x<=end)};
  const br=n=>new Intl.NumberFormat('pt-BR').format(Number(n)||0);
  const money=v=>{try{return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v)||0)}catch(e){return 'R$ '+br(v)}};
  const pct=(a,b)=>{a=Number(a)||0;b=Number(b)||0;return b?Math.min(100,Math.round(a*100/b)):0};
  const toast=(msg,type='success')=>{try{if(window.crmToast)return window.crmToast(msg,type);if(window.showToast)return window.showToast(msg,type);if(window.toast)return window.toast(msg,type)}catch(e){}console.log(msg)};
  const uid=(p='g_')=>p+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);

  function getLeads(){try{return window.CRMData?.leads?.all?.()||[]}catch(e){return[]}}
  function saveLeads(list){return window.CRMData?.leads?.save?.(list,'metas')||list}
  function getAgenda(){try{if(Array.isArray(window.agEvents))return window.agEvents}catch(e){}const arr=readJSON(AGENDA_KEY,[]);return Array.isArray(arr)?arr:[]}
  function getActivities(l){return Array.isArray(l?.atividades)?l.atividades:[]}
  function activityText(a){return [a?.tipo,a?.texto,a?.title,a?.descricao,a?.canal].join(' ')}
  function actMatch(a,tipo){
    const raw=activityText(a), t=norm(raw), typ=norm(a?.tipo||'');
    if(tipo==='Atividade') return typ && !/etapa|automacao|automação/.test(typ);
    if(tipo==='Ligação') return /liga|call|telefone/.test(t);
    if(tipo==='WhatsApp') return /whats|wpp|mensagem/.test(t);
    if(tipo==='E-mail') return /email|e-mail/.test(t);
    if(tipo==='Reunião') return /reuni|meeting|diagnostico|diagnóstico/.test(t);
    if(tipo==='Follow-up') return /follow|retorno|cadencia|cadência/.test(t) && /conclu|feito|finaliz|realiz/.test(t);
    return norm(tipo)===typ;
  }
  function eventMatch(e,tipo){const t=norm([e?.tipo,e?.title,e?.titulo,e?.notas].join(' '));if(tipo==='Ligação')return /liga|call|telefone/.test(t);if(tipo==='WhatsApp')return /whats|wpp|mensagem/.test(t);if(tipo==='E-mail')return /email|e-mail/.test(t);if(tipo==='Reunião')return /reuni|meeting|diagnostico|diagnóstico/.test(t);if(tipo==='Follow-up')return /follow|retorno/.test(t);if(tipo==='Atividade')return !!t;return false}
  function respMatch(l,resp){return !resp || String(l?.responsavel||DEFAULT_RESP)===String(resp)}

  function normalizeGoal(g){
    g=g||{};const tipo=goalTypes.includes(g.tipo)?g.tipo:'Ligação';const ini=g.inicio||today();const fim=g.fim||addDays(ini,6);
    return {id:g.id||uid(),tipo,titulo:g.titulo||`${tipo} no período`,alvo:Number(g.alvo||defaultTargets[tipo]||1)||1,manualRealizado:Number(g.manualRealizado??g.realizado??0)||0,inicio:ini,fim,responsavel:g.responsavel||DEFAULT_RESP,fonte:g.fonte||'auto',obs:g.obs||'',updatedAt:g.updatedAt||new Date().toISOString()};
  }
  function readGoals(){let arr=[];for(const k of GOAL_KEYS){const v=readJSON(k,null);if(Array.isArray(v)&&v.length){arr=v;break}}return arr.map(normalizeGoal).sort((a,b)=>(a.fim||'9999').localeCompare(b.fim||'9999'))}
  function saveGoals(arr){const clean=arr.map(normalizeGoal);GOAL_KEYS.forEach(k=>writeJSON(k,clean));try{window.goalsV5=clean}catch(e){}return clean}
  function updateGoal(g){const arr=readGoals(),idx=arr.findIndex(x=>x.id===g.id),ng=normalizeGoal({...g,updatedAt:new Date().toISOString()});idx>-1?arr.splice(idx,1,ng):arr.unshift(ng);saveGoals(arr);emitChange('metas');return ng}
  function deleteGoal(id){saveGoals(readGoals().filter(g=>g.id!==id));emitChange('metas')}
  function emitChange(source){try{DOC.dispatchEvent(new CustomEvent('crm:datachange',{detail:{source}}))}catch(e){}}

  function realizedAuto(tipo,start,end,resp){
    const leads=getLeads();let total=0;
    if(tipo==='Fechamento')return leads.filter(l=>(window.CRMCommercialModel?window.CRMCommercialModel.isWon(l):l.etapa==='Fechado')&&inRange(l.dataFechamento||l.ultimaAtualizacao||l.dataEntrada,start,end)&&respMatch(l,resp)).length;
    if(tipo==='Proposta')return leads.filter(l=>(window.CRMCommercialModel?(window.CRMCommercialModel.isProposal(l)||window.CRMCommercialModel.isWon(l)):['Proposta','Fechado'].includes(l.etapa))&&inRange(l.dataProposta||l.ultimaAtualizacao||l.dataEntrada,start,end)&&respMatch(l,resp)).length;
    leads.forEach(l=>{if(!respMatch(l,resp))return;getActivities(l).forEach(a=>{if(actMatch(a,tipo)&&inRange(a.data||a.createdAt,start,end))total++})});
    getAgenda().forEach(e=>{if(resp && e.responsavel && e.responsavel!==resp)return;const d=e.data||e.start||e.inicio;if(eventMatch(e,tipo)&&inRange(d,start,end))total++});
    return total;
  }
  function realized(g){return g.fonte==='manual'?Number(g.manualRealizado||0):realizedAuto(g.tipo,g.inicio,g.fim,g.responsavel!==DEFAULT_RESP?g.responsavel:'')}
  function realizedToday(g){return g.fonte==='manual'?0:realizedAuto(g.tipo,today(),today(),g.responsavel!==DEFAULT_RESP?g.responsavel:'')}
  function statusFor(g,m){if(m.done>=m.target)return{label:'Batida',cls:'ok',rank:0};if(g.fim<today())return{label:'Vencida',cls:'danger',rank:4};if(m.done>=m.ideal)return{label:'No ritmo',cls:'ok',rank:1};if(m.needDay>m.targetToday*1.6)return{label:'Atrasada',cls:'danger',rank:3};return{label:'Atenção',cls:'warn',rank:2}}
  function goalMath(g){const total=daysInc(g.inicio,g.fim),elapsed=Math.max(1,Math.min(total,daysInc(g.inicio,today()))),left=Math.max(1,daysInc(today(),g.fim));const done=realized(g),target=Number(g.alvo)||1,ideal=Math.ceil(target*(elapsed/total)),targetToday=Math.max(1,Math.ceil(target/total)),todayDone=realizedToday(g),remaining=Math.max(0,target-done),needDay=Math.ceil(remaining/left);const m={done,target,ideal,targetToday,todayDone,remaining,needDay,left,total,elapsed,p:pct(done,target),todayPct:pct(todayDone,targetToday)};m.status=statusFor(g,m);return m}
  function activeGoals(){const t=today();return readGoals().filter(g=>(!g.inicio||g.inicio<=t)&&(!g.fim||g.fim>=t))}
  function reps(){const s=new Set([DEFAULT_RESP]);readGoals().forEach(g=>s.add(g.responsavel||DEFAULT_RESP));getLeads().forEach(l=>{if(l.responsavel)s.add(l.responsavel)});return Array.from(s).filter(Boolean).sort((a,b)=>a.localeCompare(b,'pt-BR'))}

  function followStats(start=today(),end=today()){
    const leads=getLeads().filter(l=>window.CRMCommercialModel?window.CRMCommercialModel.isOpen(l):!CLOSED.has(l.etapa));
    let overdue=0,dueToday=0,dueWeek=0,without=0,done=0,created=0;
    leads.forEach(l=>{
      const due=(Array.isArray(l.cadenciaPassos)?(l.cadenciaPassos.find(s=>s.status!=='feito'&&s.status!=='cancelado')?.data):'') || l.followup;
      if(!due) without++; else if(String(due).slice(0,10)<today()) overdue++; else if(String(due).slice(0,10)===today()) dueToday++; else if(String(due).slice(0,10)<=addDays(today(),7)) dueWeek++;
      getActivities(l).forEach(a=>{const text=norm(activityText(a));const d=a.data||a.createdAt;if(!inRange(d,start,end))return;if(/follow|retorno|cadencia|cadência/.test(text)&&/conclu|feito|finaliz|realiz/.test(text))done++;if(/follow|retorno|cadencia|cadência/.test(text)&&/criad|aplicad|agendad|salv/.test(text))created++;});
    });
    return {overdue,dueToday,dueWeek,without,done,created,totalOpen:leads.length};
  }
  function callStats(){const goals=activeGoals().filter(g=>g.tipo==='Ligação'),doneToday=realizedAuto('Ligação',today(),today(),''),targetToday=goals.reduce((s,g)=>s+goalMath(g).targetToday,0),periodDone=goals.reduce((s,g)=>s+goalMath(g).done,0),periodTarget=goals.reduce((s,g)=>s+goalMath(g).target,0);return{goals,doneToday,targetToday,remaining:Math.max(0,targetToday-doneToday),p:pct(doneToday,targetToday),periodDone,periodTarget,periodPct:pct(periodDone,periodTarget)}}
  function metaSummary(){const goals=activeGoals();const ms=goals.map(goalMath);return{active:goals.length,ok:ms.filter(m=>m.status.cls==='ok').length,warn:ms.filter(m=>m.status.cls==='warn').length,danger:ms.filter(m=>m.status.cls==='danger').length,avg:ms.length?Math.round(ms.reduce((s,m)=>s+m.p,0)/ms.length):0}}
  function callQueue(){return getLeads().filter(l=>!CLOSED.has(l.etapa)&&String(l.telefone||'').replace(/\D/g,'').length>=8).sort((a,b)=>callScore(b)-callScore(a)).slice(0,5)}
  function callScore(l){return (l.followup&&String(l.followup).slice(0,10)<=today()?80:0)+(l.prioridade==='Alta'?35:l.prioridade==='Média'?15:0)+((window.CRMCommercialModel?window.CRMCommercialModel.isProposal(l):l.etapa==='Proposta')?25:0)+(Number(l.valor)||0)/1000-ageDays(l.ultimaAtualizacao||l.dataEntrada||today())}
  function nextFollowups(){return getLeads().filter(l=>!CLOSED.has(l.etapa)&&l.followup&&String(l.followup).slice(0,10)<=today()).sort((a,b)=>String(a.followup).localeCompare(String(b.followup))).slice(0,5)}

  function ensureNav(){
    const label='<span class="nav-icon" aria-hidden="true">🎯</span><span>Metas</span>';
    if(!$('.sidebar [data-view="metas"]')){$('.sidebar-nav,.nav-list,.sidebar')?.insertAdjacentHTML('beforeend',`<button class="nav-item" data-view="metas" type="button">${label}</button>`)}
  }
  function ensurePage(){let page=$('#metas');if(!page){page=DOC.createElement('section');page.id='metas';page.className='view grid-view';($('.main')||DOC.body).appendChild(page)}const wasActive=page.classList.contains('active');page.className='view grid-view v68-goals-page'+(wasActive?' active':'');return page}

  function kpiHTML(){const cs=callStats(),fs=followStats(),ms=metaSummary();const items=[
    ['Ligações hoje',`${br(cs.doneToday)} / ${cs.targetToday?br(cs.targetToday):'—'}`,cs.remaining>0?`Faltam ${br(cs.remaining)}`:'No ritmo','ligacoes'],
    ['Follow-ups vencidos',br(fs.overdue),fs.overdue?'Prioridade máxima':'Sem atraso','cadencias'],
    ['Follow-ups feitos hoje',br(fs.done),`${br(fs.dueToday)} para hoje`,'cadencias'],
    ['Metas ativas',br(ms.active),`${br(ms.ok)} no ritmo · média ${ms.avg}%`,'metas'],
    ['Sem próximo passo',br(fs.without),'Leads abertos sem ação','pipeline'],
    ['Pipeline conectado',money(getLeads().filter(l=>!CLOSED.has(l.etapa)).reduce((s,l)=>s+Number(l.valor||0),0)),'Valor aberto nos leads','pipeline']
  ];return `<div class="v68-kpi-grid">${items.map(([t,v,s,go])=>`<button type="button" class="v68-kpi" data-v68-go="${go}"><span>${t}</span><strong>${v}</strong><small>${s}</small></button>`).join('')}</div>`}

  function connectedOpsHTML(){const cs=callStats(),fs=followStats();const queue=callQueue();const fus=nextFollowups();return `<div class="v68-connected-grid">
    <section class="v68-card v68-op-card"><div class="v68-card-head"><div><h3>📞 Ligações conectadas</h3><p>Metas do tipo Ligação contam registros feitos na aba Ligações, histórico dos leads e agenda.</p></div><span class="v68-pill ${cs.remaining>0?'warn':'ok'}">${cs.targetToday?cs.p+'% hoje':'sem meta'}</span></div><div class="v68-progress"><span style="width:${cs.p}%"></span></div><div class="v68-op-numbers"><div><b>${br(cs.doneToday)}</b><span>feitas hoje</span></div><div><b>${cs.targetToday?br(cs.targetToday):'—'}</b><span>meta hoje</span></div><div><b>${cs.targetToday?br(cs.remaining):'—'}</b><span>faltam</span></div></div><div class="v68-mini-list">${queue.length?queue.map(l=>`<button type="button" data-v68-open-lead="${esc(l.id||l.nome)}"><strong>${esc(l.nome)}</strong><span>${esc(l.telefone||'Sem telefone')} · ${esc(l.etapa||'Lead')}</span></button>`).join(''):'<div class="v68-empty">Nenhum lead com telefone na fila.</div>'}</div><div class="v68-card-actions"><button class="btn btn-primary btn-sm" data-v68-go="ligacoes">Abrir Ligações</button><button class="btn btn-sm" data-v68-template="Ligação|day">Criar meta de hoje</button></div></section>
    <section class="v68-card v68-op-card"><div class="v68-card-head"><div><h3>⏰ Follow-ups conectados</h3><p>Metas do tipo Follow-up contam passos concluídos nas cadências e retornos registrados nos leads.</p></div><span class="v68-pill ${fs.overdue?'danger':'ok'}">${fs.overdue?fs.overdue+' vencidos':'em dia'}</span></div><div class="v68-follow-grid"><div><b>${br(fs.overdue)}</b><span>vencidos</span></div><div><b>${br(fs.dueToday)}</b><span>hoje</span></div><div><b>${br(fs.done)}</b><span>feitos hoje</span></div></div><div class="v68-mini-list">${fus.length?fus.map(l=>`<button type="button" data-v68-open-lead="${esc(l.id||l.nome)}"><strong>${esc(l.nome)}</strong><span>${esc(l.proximaAcao||'Executar follow-up')} · ${esc(l.followup||'—')}</span></button>`).join(''):'<div class="v68-empty">Nenhum follow-up vencido ou de hoje.</div>'}</div><div class="v68-card-actions"><button class="btn btn-primary btn-sm" data-v68-go="cadencias">Abrir Follow-ups</button><button class="btn btn-sm" data-v68-template="Follow-up|week">Criar meta semanal</button></div></section>
  </div>`}

  function templatesHTML(){const items=[['Ligação','day','30 ligações hoje'],['Ligação','week','150 ligações na semana'],['Follow-up','day','20 follow-ups hoje'],['Follow-up','week','80 follow-ups na semana'],['Reunião','week','8 reuniões na semana'],['Proposta','month','12 propostas no mês'],['Fechamento','month','4 fechamentos no mês']];return `<div class="v68-card v68-templates"><div><h3>Metas rápidas conectadas</h3><p>Crie metas já ligadas aos dados reais do CRM.</p></div><div>${items.map(([tipo,period,label])=>`<button class="v68-template" type="button" data-v68-template="${tipo}|${period}">${esc(label)}</button>`).join('')}</div></div>`}
  function toolbarHTML(){return `<div class="v68-toolbar v68-card"><input id="v68GoalSearch" placeholder="Buscar meta, responsável ou observação" value="${esc(state.q)}"><select id="v68GoalType"><option value="">Todos os tipos</option>${goalTypes.map(t=>`<option ${state.tipo===t?'selected':''}>${t}</option>`).join('')}</select><select id="v68GoalStatus"><option value="todas">Todos status</option>${['batida','no ritmo','atenção','atrasada','vencida'].map(s=>`<option value="${s}" ${state.status===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select><select id="v68GoalResp"><option value="">Todos responsáveis</option>${reps().map(r=>`<option ${state.resp===r?'selected':''}>${esc(r)}</option>`).join('')}</select><button class="btn btn-sm" type="button" id="v68ClearFilters">Limpar</button></div>`}
  function filteredGoals(){let arr=readGoals();if(state.tipo)arr=arr.filter(g=>g.tipo===state.tipo);if(state.resp)arr=arr.filter(g=>g.responsavel===state.resp);if(state.q){const q=norm(state.q);arr=arr.filter(g=>norm([g.titulo,g.tipo,g.responsavel,g.obs].join(' ')).includes(q))}if(state.status!=='todas'){arr=arr.filter(g=>norm(goalMath(g).status.label)===norm(state.status))}return arr}
  function goalsHTML(){const list=filteredGoals();return `<section class="v68-card v68-goals-list"><div class="v68-card-head"><div><h3>Plano de metas</h3><p>Progresso puxado automaticamente de Ligações, Follow-ups, Agenda e Leads.</p></div><button class="btn btn-primary btn-sm" type="button" id="v68NewGoal">Nova meta</button></div>${list.length?`<div class="v68-goal-rows">${list.map(goalRow).join('')}</div>`:'<div class="v68-empty big">Nenhuma meta encontrada. Crie uma meta rápida ou limpe os filtros.</div>'}</section>`}
  function goalRow(g){const m=goalMath(g);return `<article class="v68-goal-row ${m.status.cls}"><div class="v68-goal-main"><div class="v68-goal-title"><strong>${esc(g.titulo)}</strong><span class="v68-pill ${m.status.cls}">${esc(m.status.label)}</span></div><div class="v68-goal-meta"><span>${esc(g.tipo)}</span><span>${esc(g.fonte==='auto'?'Automática pelo CRM':'Manual')}</span><span>${esc(g.responsavel||DEFAULT_RESP)}</span><span>${esc(g.inicio)} → ${esc(g.fim)}</span></div>${g.obs?`<p>${esc(g.obs)}</p>`:''}<div class="v68-progress"><span style="width:${m.p}%"></span></div><div class="v68-goal-foot"><span>${br(m.done)} / ${br(m.target)} no período</span><span>Hoje: ${br(m.todayDone)} / ${br(m.targetToday)}</span><span>Ritmo necessário: ${br(m.needDay)}/dia</span></div></div><div class="v68-goal-actions"><strong>${m.p}%</strong><button class="btn btn-xs" data-v68-plus="${esc(g.id)}">+1</button><button class="btn btn-xs" data-v68-edit="${esc(g.id)}">Editar</button><button class="btn btn-xs btn-danger" data-v68-del="${esc(g.id)}">Excluir</button></div></article>`}
  function routineHTML(){const r=readJSON(ROUTINE_KEY,null);const tasks=(r&&r.date===today()?r.tasks:buildTasks()).slice(0,6);return `<section class="v68-card v68-routine"><div class="v68-card-head"><div><h3>Rotina recomendada do dia</h3><p>Gerada a partir das metas, ligações faltantes e follow-ups vencidos.</p></div><button class="btn btn-sm" id="v68GenerateRoutine" type="button">Gerar rotina</button></div><div class="v68-task-list">${tasks.map((t,i)=>`<button type="button" data-v68-go="${esc(t.go)}" class="v68-task ${esc(t.prio)}"><span>${i+1}</span><div><strong>${esc(t.title)}</strong><small>${esc(t.desc)}</small></div><em>${esc(t.tag)}</em></button>`).join('')}</div></section>`}
  function buildTasks(){const tasks=[];const cs=callStats(),fs=followStats();if(cs.remaining>0)tasks.push({prio:'alta',go:'ligacoes',tag:'Ligações',title:`Fazer ${br(cs.remaining)} ligação(ões)`,desc:`Meta de hoje: ${br(cs.doneToday)}/${br(cs.targetToday)}.`});if(fs.overdue>0)tasks.push({prio:'alta',go:'cadencias',tag:'Follow-up',title:`Resolver ${br(fs.overdue)} follow-up(s) vencido(s)`,desc:'Comece pelos leads com maior valor ou prioridade.'});activeGoals().filter(g=>g.tipo!=='Ligação').forEach(g=>{const m=goalMath(g),miss=Math.max(0,m.targetToday-m.todayDone);if(miss>0)tasks.push({prio:g.tipo==='Follow-up'?'alta':'media',go:g.tipo==='Follow-up'?'cadencias':g.tipo==='Reunião'?'agenda':'pipeline',tag:g.tipo,title:`Executar ${br(miss)} ação(ões) de ${g.tipo}`,desc:`Meta ${g.titulo}: ${br(m.done)}/${br(m.target)} no período.`})});const noNext=followStats().without;if(noNext>0)tasks.push({prio:'media',go:'pipeline',tag:'Organização',title:`Definir próximo passo para ${br(noNext)} lead(s)`,desc:'Todo lead aberto precisa ter follow-up ou motivo de perda.'});if(!tasks.length)tasks.push({prio:'baixa',go:'inicio',tag:'Rotina saudável',title:'Metas e follow-ups estão no verde',desc:'Use a fila de Ligações para manter volume e atualizar histórico.'});return tasks.slice(0,8)}
  function generateRoutine(){const r={date:today(),createdAt:new Date().toISOString(),tasks:buildTasks()};writeJSON(ROUTINE_KEY,r);toast('Rotina conectada gerada','success');render()}

  function formHTML(){const g=state.editing?readGoals().find(x=>x.id===state.editing):null;const data=g||normalizeGoal({tipo:'Ligação',inicio:today(),fim:today(),titulo:'',alvo:30});return `<section class="v68-card v68-form-card" id="v68GoalFormCard"><div class="v68-card-head"><div><h3>${g?'Editar meta':'Nova meta conectada'}</h3><p>Automática conta dados reais; manual serve para indicadores externos.</p></div><button class="btn btn-sm" id="v68CloseForm" type="button">Fechar</button></div><form id="v68GoalForm" class="v68-form"><input type="hidden" id="v68GoalId" value="${esc(data.id||'')}"><label>Tipo<select id="v68Tipo">${goalTypes.map(t=>`<option ${data.tipo===t?'selected':''}>${t}</option>`).join('')}</select></label><label>Apuração<select id="v68Fonte"><option value="auto" ${data.fonte==='auto'?'selected':''}>Automática pelo CRM</option><option value="manual" ${data.fonte==='manual'?'selected':''}>Manual</option></select></label><label class="span2">Título<input id="v68Titulo" value="${esc(data.titulo||'')}" placeholder="Ex: 30 ligações hoje"></label><label>Alvo<input id="v68Alvo" type="number" min="1" value="${esc(data.alvo||1)}"></label><label>Realizado manual<input id="v68Manual" type="number" min="0" value="${esc(data.manualRealizado||0)}"></label><label>Início<input id="v68Inicio" type="date" value="${esc(data.inicio||today())}"></label><label>Final<input id="v68Fim" type="date" value="${esc(data.fim||today())}"></label><label class="span2">Responsável<input id="v68Resp" value="${esc(data.responsavel||DEFAULT_RESP)}" placeholder="Time Comercial"></label><label class="span2">Observações<textarea id="v68Obs" placeholder="Regras da meta, foco ou observações">${esc(data.obs||'')}</textarea></label><div class="v68-form-actions span2"><button class="btn" id="v68CancelForm" type="button">Limpar</button><button class="btn btn-primary" type="submit">Salvar meta</button></div></form></section>`}
  function insightsHTML(){return `<section class="v68-card v68-insights"><h3>Como a conexão funciona</h3><div class="v68-insight-grid"><div><b>Ligação</b><span>Conta chamadas registradas na aba Ligações, no histórico dos leads e eventos de ligação da Agenda.</span></div><div><b>Follow-up</b><span>Conta passos concluídos nas cadências e retornos marcados como feitos no histórico do lead.</span></div><div><b>Reunião/WhatsApp/E-mail</b><span>Conta atividades registradas nos leads e compromissos da Agenda com o mesmo tipo.</span></div><div><b>Proposta/Fechamento</b><span>Conta leads nas etapas Proposta e Fechado, usando datas do próprio pipeline.</span></div></div></section>`}

  function render(){ensureNav();const page=ensurePage();page.innerHTML=`<div class="v68-hero"><div><span class="v68-eyebrow">Metas conectadas</span><h2>Metas comerciais ligadas a Ligações e Follow-ups</h2><p>Controle ritmo diário, metas do período e execução real sem preencher duas vezes.</p></div><div class="v68-hero-actions"><button class="btn btn-primary" id="v68NewGoalTop" type="button">Nova meta</button><button class="btn" id="v68GenerateRoutineTop" type="button">Gerar rotina</button><button class="btn" data-v68-go="ligacoes" type="button">Abrir Ligações</button><button class="btn" data-v68-go="cadencias" type="button">Abrir Follow-ups</button></div></div>${kpiHTML()}${connectedOpsHTML()}${templatesHTML()}${toolbarHTML()}<div class="v68-main-grid"><div>${goalsHTML()}${routineHTML()}</div><aside>${formHTML()}${insightsHTML()}</aside></div>`;bindFields();}
  function bindFields(){const map=[['#v68GoalSearch','q'],['#v68GoalType','tipo'],['#v68GoalStatus','status'],['#v68GoalResp','resp']];map.forEach(([id,key])=>{$(id)?.addEventListener('input',e=>{state[key]=e.target.value;render()});$(id)?.addEventListener('change',e=>{state[key]=e.target.value;render()})})}
  function go(view){try{if(window.setView){window.setView(view);return}}catch(e){}$(`[data-view="${view}"],[data-go="${view}"],[data-go-view="${view}"]`)?.click()}
  function openLead(id){const l=getLeads().find(x=>String(x.id||x.nome)===String(id)||String(x.nome)===String(id));try{if(window.crmOpenLead)return window.crmOpenLead(l||id);if(window.openDetail)return window.openDetail(l?.id||l?.nome||id)}catch(e){}go('leads')}
  function collectForm(){return normalizeGoal({id:$('#v68GoalId')?.value||state.editing||uid(),tipo:$('#v68Tipo')?.value,titulo:$('#v68Titulo')?.value,alvo:$('#v68Alvo')?.value,manualRealizado:$('#v68Manual')?.value,inicio:$('#v68Inicio')?.value,fim:$('#v68Fim')?.value,responsavel:$('#v68Resp')?.value,fonte:$('#v68Fonte')?.value,obs:$('#v68Obs')?.value})}
  function quickTemplate(tipo,period){const t=today();const start=period==='week'?startOfWeek():period==='month'?startOfMonth():t;const end=period==='week'?endOfWeek():period==='month'?endOfMonth():t;const alvo=period==='day'?(tipo==='Ligação'?30:tipo==='Follow-up'?20:defaultTargets[tipo]||10):period==='week'?(tipo==='Ligação'?150:tipo==='Follow-up'?80:defaultTargets[tipo]*5):period==='month'?(tipo==='Proposta'?12:tipo==='Fechamento'?4:(defaultTargets[tipo]||10)*20):defaultTargets[tipo];const label=period==='day'?'hoje':period==='week'?'na semana':'no mês';state.editing=null;render();$('#v68Tipo').value=tipo;$('#v68Fonte').value='auto';$('#v68Titulo').value=`${tipo}s ${label}`;$('#v68Alvo').value=alvo;$('#v68Manual').value=0;$('#v68Inicio').value=start;$('#v68Fim').value=end;$('#v68Resp').value=DEFAULT_RESP;$('#v68Obs').value=`Meta automática conectada com ${tipo==='Ligação'?'a aba Ligações':tipo==='Follow-up'?'a Central de Follow-ups':'os dados reais do CRM'}.`;$('#v68GoalFormCard')?.scrollIntoView({behavior:'smooth',block:'start'});toast('Meta rápida preparada para salvar','success')}

  DOC.addEventListener('click',function(e){const root=e.target.closest('#metas,.v68-goals-page');if(!root)return;const goBtn=e.target.closest('[data-v68-go]');if(goBtn){e.preventDefault();go(goBtn.dataset.v68Go);return}const tpl=e.target.closest('[data-v68-template]');if(tpl){e.preventDefault();const [tipo,period]=tpl.dataset.v68Template.split('|');quickTemplate(tipo,period);return}const edit=e.target.closest('[data-v68-edit]');if(edit){e.preventDefault();state.editing=edit.dataset.v68Edit;render();$('#v68GoalFormCard')?.scrollIntoView({behavior:'smooth',block:'start'});return}const del=e.target.closest('[data-v68-del]');if(del){e.preventDefault();window.CRMDialog?.confirm('Excluir esta meta?',{title:'Excluir meta',danger:true,confirmLabel:'Excluir'}).then(ok=>{if(ok){deleteGoal(del.dataset.v68Del);toast('Meta excluída','success');render()}});return}const plus=e.target.closest('[data-v68-plus]');if(plus){e.preventDefault();const arr=readGoals();const g=arr.find(x=>x.id===plus.dataset.v68Plus);if(g){g.fonte='manual';g.manualRealizado=Number(g.manualRealizado||0)+1;saveGoals(arr);toast('Realizado manual atualizado','success');render()}return}const open=e.target.closest('[data-v68-open-lead]');if(open){e.preventDefault();openLead(open.dataset.v68OpenLead);return}if(e.target.closest('#v68ClearFilters')){e.preventDefault();Object.assign(state,{q:'',tipo:'',status:'todas',resp:''});render();return}if(e.target.closest('#v68NewGoal,#v68NewGoalTop')){e.preventDefault();state.editing=null;render();$('#v68GoalFormCard')?.scrollIntoView({behavior:'smooth',block:'start'});$('#v68Titulo')?.focus();return}if(e.target.closest('#v68CloseForm,#v68CancelForm')){e.preventDefault();state.editing=null;render();return}if(e.target.closest('#v68GenerateRoutine,#v68GenerateRoutineTop')){e.preventDefault();generateRoutine();return}},true);
  DOC.addEventListener('submit',function(e){if(e.target&&e.target.id==='v68GoalForm'){e.preventDefault();const g=collectForm();if(!g.titulo){toast('Informe o título da meta','warn');return}if(g.alvo<=0){toast('O alvo precisa ser maior que zero','warn');return}if(g.fim<g.inicio){toast('A data final precisa ser após a inicial','warn');return}updateGoal(g);state.editing=null;toast('Meta salva e conectada ao CRM','success');render()}},true);
  DOC.addEventListener('crm:viewchange',e=>{if(e.detail?.view==='metas')setTimeout(render,30)});
  DOC.addEventListener('crm:datachange',()=>{if(DOC.body.dataset.currentView==='metas'||$('#metas.active'))setTimeout(render,80)});
  window.CRMV68Goals={render,realizedAuto,readGoals,goalMath,followStats,callStats,generateRoutine};
  window.renderMetasConectadasV68=render;
  function isActiveV68(){return !!$('#metas.active') || DOC.body?.dataset.currentView==='metas';}
  if(DOC.readyState==='loading')DOC.addEventListener('DOMContentLoaded',()=>{if(isActiveV68())setTimeout(render,120)});else if(isActiveV68())setTimeout(render,120);
})();
