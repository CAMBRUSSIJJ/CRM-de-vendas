/* Script original 17 */
(function(){
'use strict';
if(window.__crmGoalsV29)return;window.__crmGoalsV29=true;
const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>Array.from(r.querySelectorAll(q));
const GOAL_KEYS=['outbounder_goals_v5','crm_goals_v5'],LEAD_KEY='outbounder_leads_v5',AGENDA_KEY='outbounder_agenda_v1',DEFAULT_RESP='Time Comercial';
const goalTypes=['Ligação','WhatsApp','E-mail','Reunião','Proposta','Fechamento','Atividade'],stageTypes=['Lead','Contato','Proposta','Fechado','Perdido'];
const targetMap={Ligação:30,WhatsApp:40,'E-mail':25,Reunião:3,Proposta:2,Fechamento:1,Atividade:50};
const state={status:'todas',tipo:'',fonte:'',resp:'',q:''};
function esc(v){return String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
function readJSON(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch(e){return f}}
function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function runtimeLeads(){try{if(Array.isArray(leads))return leads}catch(e){}return readJSON(LEAD_KEY,[])}
function saveRuntimeLeads(list){try{if(Array.isArray(leads)){leads.length=0;list.forEach(x=>leads.push(x));if(typeof saveLeads==='function')saveLeads();else writeJSON(LEAD_KEY,leads);return}}catch(e){}writeJSON(LEAD_KEY,list)}
function getLeads(){const l=runtimeLeads();return Array.isArray(l)?l:[]}
function getAgenda(){try{if(Array.isArray(agEvents))return agEvents}catch(e){}const a=readJSON(AGENDA_KEY,[]);return Array.isArray(a)?a:[]}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function toDate(s){if(!s)return null;const [y,m,d]=String(s).slice(0,10).split('-').map(Number);return new Date(y||1970,(m||1)-1,d||1)}
function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function addDays(s,n){const d=toDate(s)||new Date();d.setDate(d.getDate()+Number(n||0));return iso(d)}
function startOfWeek(){const d=toDate(todayISO()),day=d.getDay()||7;d.setDate(d.getDate()-day+1);return iso(d)}
function endOfWeek(){return addDays(startOfWeek(),6)}
function startOfMonth(){const d=toDate(todayISO());return iso(new Date(d.getFullYear(),d.getMonth(),1))}
function endOfMonth(){const d=toDate(todayISO());return iso(new Date(d.getFullYear(),d.getMonth()+1,0))}
function dateBR(s){const d=toDate(s);return d?d.toLocaleDateString('pt-BR'):'—'}
function daysInc(a,b){const da=toDate(a),db=toDate(b);if(!da||!db)return 1;return Math.max(1,Math.floor((db-da)/86400000)+1)}
function pct(a,b){a=Number(a)||0;b=Number(b)||0;return b?Math.round(a*100/b):0}
function br(n){return new Intl.NumberFormat('pt-BR').format(Number(n)||0)}
function inRange(date,start,end){if(!date)return false;const d=String(date).slice(0,10);return(!start||d>=start)&&(!end||d<=end)}
function respMatch(l,resp){return!resp||String(l.responsavel||DEFAULT_RESP)===String(resp)}
function notify(msg,type){try{if(typeof showToast==='function')return showToast(msg,type||'success')}catch(e){}try{if(typeof toast==='function')return toast(msg,type||'success')}catch(e){}console.log(msg)}
function normalizeGoal(g){g=g||{};const tipo=goalTypes.includes(g.tipo)?g.tipo:'Ligação',ini=g.inicio||todayISO(),fim=g.fim||addDays(ini,6);return{id:g.id||('g_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6)),tipo,titulo:g.titulo||`${tipo} no período`,alvo:Number(g.alvo||1)||1,manualRealizado:Number(g.manualRealizado??g.realizado??0)||0,inicio:ini,fim,responsavel:g.responsavel||DEFAULT_RESP,fonte:g.fonte||'auto',obs:g.obs||'',updatedAt:g.updatedAt||new Date().toISOString()}}
function readGoals(){let arr=[];for(const k of GOAL_KEYS){const v=readJSON(k,null);if(Array.isArray(v)&&v.length){arr=v;break}}return arr.map(normalizeGoal).sort((a,b)=>(a.fim||'9999').localeCompare(b.fim||'9999'))}
function saveGoals(gs){const clean=gs.map(normalizeGoal);GOAL_KEYS.forEach(k=>writeJSON(k,clean));try{if(Array.isArray(goalsV5)){goalsV5.length=0;clean.forEach(g=>goalsV5.push(g))}}catch(e){}return clean}
function updateGoal(goal){const arr=readGoals(),idx=arr.findIndex(g=>g.id===goal.id),ng=normalizeGoal({...goal,updatedAt:new Date().toISOString()});idx>-1?arr.splice(idx,1,ng):arr.unshift(ng);saveGoals(arr)}
function actMatch(a,tipo){const t=String(a?.tipo||'');if(tipo==='Atividade')return t&&t!=='Etapa'&&t!=='Automação';return t===tipo||(tipo==='E-mail'&&/email|e-mail/i.test(t))||(tipo==='Ligação'&&/liga/i.test(t))}
function realByType(tipo,start,end,resp){const list=getLeads();let total=0;if(stageTypes.includes(tipo))return list.filter(l=>l.etapa===tipo&&inRange(l.ultimaAtualizacao||l.dataEntrada,start,end)&&respMatch(l,resp)).length;if(tipo==='Fechamento')return list.filter(l=>l.etapa==='Fechado'&&inRange(l.ultimaAtualizacao||l.dataEntrada,start,end)&&respMatch(l,resp)).length;if(tipo==='Proposta')return list.filter(l=>['Proposta','Fechado'].includes(l.etapa)&&inRange(l.ultimaAtualizacao||l.dataEntrada,start,end)&&respMatch(l,resp)).length;list.forEach(l=>{if(!respMatch(l,resp))return;(Array.isArray(l.atividades)?l.atividades:[]).forEach(a=>{if(actMatch(a,tipo)&&inRange(a.data,start,end))total++})});getAgenda().forEach(e=>{if((!resp||!e.responsavel||e.responsavel===resp)&&actMatch(e,tipo)&&inRange(e.data,start,end))total++});return total}
function realized(g){return g.fonte==='manual'?Number(g.manualRealizado||0):realByType(g.tipo,g.inicio,g.fim,g.responsavel&&g.responsavel!==DEFAULT_RESP?g.responsavel:'')}
function realizedToday(g){return g.fonte==='manual'?0:realByType(g.tipo,todayISO(),todayISO(),g.responsavel&&g.responsavel!==DEFAULT_RESP?g.responsavel:'')}
function statusOf(g,done,ideal){const t=todayISO(),alvo=Number(g.alvo)||1;if(done>=alvo)return{label:'Batida',cls:'ok',rank:0};if(g.fim&&g.fim<t)return{label:'Vencida',cls:'danger',rank:3};if(done>=ideal)return{label:'No ritmo',cls:'ok',rank:0};if(g.fim&&daysInc(t,g.fim)<=3)return{label:'Atrasada',cls:'danger',rank:3};return ideal-done>alvo*.15?{label:'Atrasada',cls:'danger',rank:3}:{label:'Atenção',cls:'warn',rank:2}}
function math(g){const t=todayISO(),start=g.inicio||t,end=g.fim||t,total=daysInc(start,end),elapsed=Math.max(1,Math.min(total,daysInc(start,t))),left=Math.max(1,daysInc(t,end)),done=realized(g),target=Number(g.alvo)||1,ideal=Math.ceil(target*(elapsed/total)),targetToday=Math.max(1,Math.ceil(target/total)),todayDone=realizedToday(g),remaining=Math.max(0,target-done),needDay=Math.ceil(remaining/left),status=statusOf(g,done,ideal);return{done,target,p:pct(done,target),ideal,targetToday,todayDone,remaining,needDay,left,total,elapsed,status}}
function activeGoals(gs=readGoals()){const t=todayISO();return gs.filter(g=>(!g.inicio||g.inicio<=t)&&(!g.fim||g.fim>=t))}
function reps(gs=readGoals()){const s=new Set([DEFAULT_RESP]);gs.forEach(g=>s.add(g.responsavel||DEFAULT_RESP));getLeads().forEach(l=>{if(l.responsavel)s.add(l.responsavel)});return Array.from(s).filter(Boolean).sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function filteredGoals(){let gs=readGoals();if(state.tipo)gs=gs.filter(g=>g.tipo===state.tipo);if(state.fonte)gs=gs.filter(g=>g.fonte===state.fonte);if(state.resp)gs=gs.filter(g=>(g.responsavel||DEFAULT_RESP)===state.resp);if(state.q){const q=state.q.toLowerCase();gs=gs.filter(g=>[g.titulo,g.tipo,g.responsavel,g.obs].join(' ').toLowerCase().includes(q))}if(state.status!=='todas')gs=gs.filter(g=>math(g).status.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')===state.status);return gs}
function ensurePage(){let page=$('#metas');if(!page){page=document.createElement('section');page.id='metas';page.className='view grid-view';($('.main')||document.body).appendChild(page)}page.classList.add('v29-goals-page');page.innerHTML=`<div class="section-header v29-top"><div><div class="section-title-text">Metas comerciais</div><div class="section-sub">Central de metas com ritmo diário, filtros, ranking e impacto direto no funil.</div></div><div class="v29-actions"><button class="btn btn-sm" id="v29Sync">Atualizar painel</button><button class="btn btn-primary btn-sm" id="v29New">Nova meta</button></div></div><div class="v29-command" id="v29Daily"></div><div class="v29-quick"><div><b>Metas rápidas prontas</b><p>Crie metas diárias, semanais ou mensais e ajuste o alvo depois.</p></div><div class="v29-templates" id="v29Tpl"></div></div><div class="v29-grid"><div class="v29-card v29-form-card"><div class="v29-card-head"><div><div class="v29-title">Cadastro de meta</div><div class="v29-sub">Automática conta atividades do CRM; manual acompanha qualquer indicador.</div></div></div><div class="v29-body"><form id="v29Form" class="v29-form" novalidate><input type="hidden" id="v29Id"><div class="v29-field"><label>Tipo</label><select id="v29Tipo">${goalTypes.map(x=>`<option>${x}</option>`).join('')}</select></div><div class="v29-field"><label>Apuração</label><select id="v29Fonte"><option value="auto">Automática pelo CRM</option><option value="manual">Manual</option></select></div><div class="v29-field full"><label>Título</label><input id="v29Titulo" placeholder="Ex: 150 ligações no mês"><div class="v29-error">Informe um título.</div></div><div class="v29-field"><label>Alvo</label><input id="v29Alvo" type="number" min="1"><div class="v29-error">Alvo maior que zero.</div></div><div class="v29-field"><label>Realizado manual</label><input id="v29Manual" type="number" min="0" value="0"></div><div class="v29-field"><label>Data inicial</label><input id="v29Inicio" type="date"><div class="v29-error">Informe a data inicial.</div></div><div class="v29-field"><label>Data final</label><input id="v29Fim" type="date"><div class="v29-error">Final deve ser após a inicial.</div></div><div class="v29-field full"><label>Responsável</label><input id="v29Resp" placeholder="Ex: SDR / Time Comercial"></div><div class="v29-field full"><label>Observações</label><textarea id="v29Obs" placeholder="Regras, foco ou observações da meta..."></textarea></div><div class="v29-field full"><div class="v29-row-actions" style="justify-content:flex-end"><button class="btn" type="button" id="v29Clear">Limpar</button><button class="btn btn-primary" type="submit">Salvar meta</button></div></div></form></div></div><div class="v29-card"><div class="v29-card-head"><div><div class="v29-title">Metas em andamento</div><div class="v29-sub">Filtre por status, tipo, responsável e apuração.</div></div></div><div class="v29-body"><div class="v29-toolbar" id="v29Filters"></div><div class="v29-list" id="v29List"></div></div></div></div><div class="v29-insights"><div class="v29-card"><div class="v29-card-head"><div><div class="v29-title">Ritmo ideal vs realizado</div><div class="v29-sub">Compara o que deveria ter sido feito até hoje com o realizado.</div></div></div><div class="v29-body"><div class="v29-table-wrap"><table class="v29-table"><thead><tr><th>Meta</th><th>Ideal</th><th>Realizado</th><th>Falta/dia</th><th>Status</th></tr></thead><tbody id="v29Pace"></tbody></table></div></div></div><div class="v29-card"><div class="v29-card-head"><div><div class="v29-title">Ranking por responsável</div><div class="v29-sub">Performance por pessoa, função ou time.</div></div></div><div class="v29-body"><div class="v29-table-wrap"><table class="v29-table"><thead><tr><th>Responsável</th><th>Metas</th><th>Realizado</th><th>Progresso</th><th>Status</th></tr></thead><tbody id="v29Rank"></tbody></table></div></div></div></div><div class="v29-insights"><div class="v29-card"><div class="v29-card-head"><div><div class="v29-title">Atividades x resultado no funil</div><div class="v29-sub">Mostra se volume comercial está virando reunião, proposta e fechamento.</div></div></div><div class="v29-body"><div id="v29Impact"></div></div></div><div class="v29-card"><div class="v29-card-head"><div><div class="v29-title">Evolução dos últimos 7 dias</div><div class="v29-sub">Histórico de atividades registradas.</div></div></div><div class="v29-body"><div class="v29-evolution" id="v29Evolution"></div></div></div></div><div class="v29-card"><div class="v29-card-head"><div><div class="v29-title">Alertas e próximos passos</div><div class="v29-sub">Recomendações para manter a rotina no ritmo.</div></div></div><div class="v29-body"><div class="v29-alerts" id="v29Alerts"></div></div></div>`;bindPage()}
function bindPage(){$('#v29Tpl').innerHTML=[['Ligação','dia','Ligações hoje'],['WhatsApp','dia','WhatsApp hoje'],['Reunião','semana','Reuniões semana'],['Proposta','semana','Propostas semana'],['Fechamento','mes','Fechamentos mês'],['Atividade','mes','Atividades mês']].map(([t,p,l])=>`<button class="v29-template" data-tpl="${t}|${p}">${l}</button>`).join('');$('#v29Tpl').onclick=e=>{const b=e.target.closest('[data-tpl]');if(!b)return;const[t,p]=b.dataset.tpl.split('|');applyTemplate(t,p)};$('#v29New').onclick=()=>{clearForm();$('#v29Titulo')?.focus()};$('#v29Clear').onclick=clearForm;$('#v29Sync').onclick=()=>{renderAllGoals();notify('Metas atualizadas pelo CRM','success')};$('#v29Form').onsubmit=e=>{e.preventDefault();saveForm()};renderFilters();clearForm();renderAllGoals()}
function renderFilters(){const cur={...state};$('#v29Filters').innerHTML=`<div class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="search-input" id="v29Search" placeholder="Buscar meta..."></div><button class="v29-chip active" data-status="todas">Todas</button><button class="v29-chip" data-status="no ritmo">No ritmo</button><button class="v29-chip" data-status="atencao">Atenção</button><button class="v29-chip" data-status="atrasada">Atrasadas</button><button class="v29-chip" data-status="batida">Batidas</button><select class="v29-select" id="v29FTipo"><option value="">Todos tipos</option>${goalTypes.map(x=>`<option>${x}</option>`).join('')}</select><select class="v29-select" id="v29FFonte"><option value="">Auto + manual</option><option value="auto">Automática</option><option value="manual">Manual</option></select><select class="v29-select" id="v29FResp"><option value="">Todos responsáveis</option>${reps().map(x=>`<option>${esc(x)}</option>`).join('')}</select>`;Object.assign(state,cur);$('#v29Search').value=state.q;$('#v29FTipo').value=state.tipo;$('#v29FFonte').value=state.fonte;$('#v29FResp').value=state.resp;$$('[data-status]').forEach(b=>b.classList.toggle('active',b.dataset.status===state.status));$('#v29Search').oninput=e=>{state.q=e.target.value;renderAllGoals()};$('#v29FTipo').onchange=e=>{state.tipo=e.target.value;renderAllGoals()};$('#v29FFonte').onchange=e=>{state.fonte=e.target.value;renderAllGoals()};$('#v29FResp').onchange=e=>{state.resp=e.target.value;renderAllGoals()};$$('[data-status]').forEach(b=>b.onclick=()=>{$$('[data-status]').forEach(x=>x.classList.toggle('active',x===b));state.status=b.dataset.status;renderAllGoals()})}
function clearInvalid(){$$('.v29-field.invalid').forEach(x=>x.classList.remove('invalid'))}
function markInvalid(id){$('#'+id)?.closest('.v29-field')?.classList.add('invalid')}
function formData(){return{id:$('#v29Id').value||undefined,tipo:$('#v29Tipo').value,fonte:$('#v29Fonte').value,titulo:$('#v29Titulo').value.trim(),alvo:Number($('#v29Alvo').value)||0,manualRealizado:Number($('#v29Manual').value)||0,inicio:$('#v29Inicio').value,fim:$('#v29Fim').value,responsavel:$('#v29Resp').value.trim()||DEFAULT_RESP,obs:$('#v29Obs').value.trim()}}
function saveForm(){clearInvalid();const g=formData();let ok=true;if(!g.titulo){markInvalid('v29Titulo');ok=false}if(g.alvo<=0){markInvalid('v29Alvo');ok=false}if(!g.inicio){markInvalid('v29Inicio');ok=false}if(!g.fim||g.fim<g.inicio){markInvalid('v29Fim');ok=false}if(!ok){notify('Revise os campos da meta','warn');return}updateGoal(g);clearForm();renderFilters();renderAllGoals();notify('Meta salva','success')}
function clearForm(){const t=todayISO();$('#v29Id').value='';$('#v29Tipo').value='Ligação';$('#v29Fonte').value='auto';$('#v29Titulo').value='';$('#v29Alvo').value='';$('#v29Manual').value='0';$('#v29Inicio').value=t;$('#v29Fim').value=addDays(t,6);$('#v29Resp').value=DEFAULT_RESP;$('#v29Obs').value='';clearInvalid()}
function fillForm(id){const g=readGoals().find(x=>x.id===id);if(!g)return;$('#v29Id').value=g.id;$('#v29Tipo').value=g.tipo;$('#v29Fonte').value=g.fonte;$('#v29Titulo').value=g.titulo;$('#v29Alvo').value=g.alvo;$('#v29Manual').value=g.manualRealizado;$('#v29Inicio').value=g.inicio;$('#v29Fim').value=g.fim;$('#v29Resp').value=g.responsavel||DEFAULT_RESP;$('#v29Obs').value=g.obs||'';$('.v29-form-card')?.scrollIntoView({behavior:'smooth',block:'start'})}
function applyTemplate(tipo,periodo){clearForm();let ini=todayISO(),fim=todayISO(),mult=1,label='hoje';if(periodo==='semana'){ini=startOfWeek();fim=endOfWeek();mult=5;label='na semana'}if(periodo==='mes'){ini=startOfMonth();fim=endOfMonth();mult=22;label='no mês'}$('#v29Tipo').value=tipo;$('#v29Fonte').value='auto';$('#v29Titulo').value=`${targetMap[tipo]*mult} ${tipo.toLowerCase()} ${label}`;$('#v29Alvo').value=targetMap[tipo]*mult;$('#v29Inicio').value=ini;$('#v29Fim').value=fim;$('#v29Resp').value=DEFAULT_RESP;$('#v29Obs').value='Criada a partir de modelo rápido. Ajuste conforme sua rotina.';$('.v29-form-card')?.scrollIntoView({behavior:'smooth',block:'start'})}
function renderAllGoals(){renderDaily();renderList();renderPace();renderRank();renderImpact();renderEvolution();renderAlerts()}
function renderDaily(){const data=activeGoals().map(g=>({g,m:math(g)})),target=data.reduce((s,x)=>s+x.m.targetToday,0),done=data.reduce((s,x)=>s+x.m.todayDone,0),miss=Math.max(0,target-done),avg=data.length?Math.round(data.reduce((s,x)=>s+x.m.p,0)/data.length):0,late=data.filter(x=>x.m.status.cls==='danger').length,status=late?'Atrasado':miss?'Atenção':'No ritmo';$('#v29Daily').innerHTML=`<div class="v29-command-head"><div><div class="v29-command-title">Painel de metas do dia</div><div class="v29-command-sub">Veja o que falta fazer hoje para manter a rotina comercial.</div></div><span class="v29-pill ${late?'danger':miss?'warn':'ok'}">${status}</span></div><div class="v29-command-body"><div class="v29-kpis"><div class="v29-kpi"><b>${br(target)}</b><span>Meta de hoje</span><small>Soma proporcional das metas ativas</small></div><div class="v29-kpi"><b>${br(done)}</b><span>Realizado hoje</span><small>Atividades registradas</small></div><div class="v29-kpi"><b>${br(miss)}</b><span>Falta hoje</span><small>${miss?Math.ceil(miss/8)+' por hora útil':'Em dia'}</small></div><div class="v29-kpi"><b>${avg}%</b><span>Progresso médio</span><small>Metas ativas</small></div><div class="v29-kpi"><b>${late}</b><span>Atrasadas</span><small>Precisam de recuperação</small></div></div><div class="v29-today-list">${data.slice(0,5).map(x=>`<div class="v29-today-row"><div><b>${esc(x.g.titulo)}</b><br><span>${esc(x.g.tipo)} · ${esc(x.g.responsavel)} · falta ${br(Math.max(0,x.m.targetToday-x.m.todayDone))} hoje</span></div><div class="v29-progress"><span style="width:${Math.min(100,pct(x.m.todayDone,x.m.targetToday))}%"></span></div><strong>${x.m.todayDone}/${x.m.targetToday}</strong></div>`).join('')||'<div class="v29-empty" style="background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);border-color:rgba(255,255,255,.18)">Nenhuma meta ativa para hoje.</div>'}</div></div>`}
function renderList(){const gs=filteredGoals(),box=$('#v29List');if(!gs.length){box.innerHTML='<div class="v29-empty">Nenhuma meta encontrada com os filtros atuais.</div>';return}box.innerHTML=gs.map(g=>{const m=math(g);return`<div class="v29-goal"><div class="v29-goal-head"><div><div class="v29-goal-name">${esc(g.titulo)}</div><div class="v29-meta"><span>${esc(g.tipo)}</span><span>•</span><span>${dateBR(g.inicio)} → ${dateBR(g.fim)}</span><span>•</span><span>${esc(g.responsavel)}</span><span>•</span><span>${g.fonte==='auto'?'automática':'manual'}</span></div></div><span class="v29-pill ${m.status.cls}">${m.status.label}</span></div><div class="v29-mini-grid"><div class="v29-mini"><b>${br(m.done)} / ${br(m.target)}</b><span>Realizado</span></div><div class="v29-mini"><b>${m.p}%</b><span>Progresso</span></div><div class="v29-mini"><b>${br(m.ideal)}</b><span>Ideal até hoje</span></div><div class="v29-mini"><b>${br(m.needDay)}</b><span>Necessário/dia</span></div></div><div class="v29-progress soft" style="margin-top:10px"><span style="width:${Math.min(100,m.p)}%"></span></div>${g.obs?`<div class="v29-sub" style="margin-top:9px">${esc(g.obs)}</div>`:''}<div class="v29-row-actions" style="margin-top:10px;justify-content:flex-end"><button class="btn btn-xs" data-plus="${esc(g.id)}">+1</button><button class="btn btn-xs" data-edit="${esc(g.id)}">Editar</button><button class="btn btn-xs btn-danger" data-del="${esc(g.id)}">Excluir</button></div></div>`}).join('');$$('[data-edit]').forEach(b=>b.onclick=()=>fillForm(b.dataset.edit));$$('[data-del]').forEach(b=>b.onclick=()=>{if(confirm('Excluir esta meta?')){saveGoals(readGoals().filter(g=>g.id!==b.dataset.del));renderFilters();renderAllGoals();notify('Meta excluída','warn')}});$$('[data-plus]').forEach(b=>b.onclick=()=>plusOne(b.dataset.plus))}
function plusOne(id){const g=readGoals().find(x=>x.id===id);if(!g)return;if(g.fonte==='auto'&&!confirm('Essa meta é automática. Somar +1 converte para manual para evitar contagem duplicada. Continuar?'))return;g.fonte='manual';g.manualRealizado=Number(g.manualRealizado||0)+1;updateGoal(g);renderFilters();renderAllGoals();notify('Realizado manual atualizado','success')}
function renderPace(){const rows=filteredGoals();$('#v29Pace').innerHTML=rows.map(g=>{const m=math(g);return`<tr><td><strong>${esc(g.titulo)}</strong><br><span class="muted">${esc(g.tipo)} · ${esc(g.responsavel)}</span></td><td>${br(m.ideal)}</td><td>${br(m.done)}</td><td>${br(m.needDay)}</td><td><span class="v29-pill ${m.status.cls}">${m.status.label}</span></td></tr>`}).join('')||'<tr><td colspan="5">Nenhuma meta para exibir.</td></tr>'}
function renderRank(){const gs=readGoals(),map={};gs.forEach(g=>{const r=g.responsavel||DEFAULT_RESP,m=math(g);map[r]=map[r]||{goals:0,done:0,target:0,pcts:[],worst:0};map[r].goals++;map[r].done+=m.done;map[r].target+=m.target;map[r].pcts.push(Math.min(100,m.p));map[r].worst=Math.max(map[r].worst,m.status.rank)});const rows=Object.entries(map).sort((a,b)=>pct(b[1].done,b[1].target)-pct(a[1].done,a[1].target));$('#v29Rank').innerHTML=rows.map(([r,v])=>{const p=v.pcts.length?Math.round(v.pcts.reduce((a,b)=>a+b,0)/v.pcts.length):0,cls=p>=100?'ok':v.worst>=3?'danger':p>=70?'warn':'danger',label=p>=100?'Meta batida':v.worst>=3?'Atrasado':p>=70?'Atenção':'Risco';return`<tr><td><strong>${esc(r)}</strong></td><td>${v.goals}</td><td>${br(v.done)} / ${br(v.target)}</td><td><div class="v29-progress soft"><span style="width:${Math.min(100,p)}%"></span></div><div class="muted" style="font-size:11px;margin-top:3px">${p}%</div></td><td><span class="v29-pill ${cls}">${label}</span></td></tr>`}).join('')||'<tr><td colspan="5">Nenhum responsável com meta.</td></tr>'}
function totalActivities(start,end){let n=0;getLeads().forEach(l=>(Array.isArray(l.atividades)?l.atividades:[]).forEach(a=>{if(inRange(a.data,start,end)&&a.tipo!=='Automação')n++}));return n}
function renderImpact(){const t=todayISO(),start=addDays(t,-30),calls=realByType('Ligação',start,t,''),whats=realByType('WhatsApp',start,t,''),emails=realByType('E-mail',start,t,''),meet=realByType('Reunião',start,t,''),props=getLeads().filter(l=>['Proposta','Fechado'].includes(l.etapa)).length,wins=getLeads().filter(l=>l.etapa==='Fechado').length,acts=totalActivities(start,t),adv=getLeads().reduce((s,l)=>s+(Array.isArray(l.atividades)?l.atividades.filter(a=>a.tipo==='Etapa'&&inRange(a.data,start,t)).length:0),0);const rows=[['Ligações → reuniões',meet,calls],['WhatsApp/E-mail → reuniões',meet,whats+emails],['Reuniões → propostas',props,meet],['Propostas → fechamentos',wins,props],['Atividades → avanço',adv,acts]];$('#v29Impact').innerHTML=`<div class="v29-impact">${rows.map(([label,a,b])=>{const p=pct(a,b);return`<div class="v29-impact-row"><b>${esc(label)}</b><div class="v29-progress soft"><span style="width:${Math.min(100,p)}%"></span></div><span>${p}%</span><div class="v29-sub" style="grid-column:1/-1;margin-top:-4px">${br(a)} resultado(s) sobre ${br(b)} ação/base.</div></div>`}).join('')}</div>`}
function renderEvolution(){const ds=[];for(let i=6;i>=0;i--){const d=addDays(todayISO(),-i);ds.push({d,n:totalActivities(d,d)})}const max=Math.max(1,...ds.map(x=>x.n));$('#v29Evolution').innerHTML=ds.map(x=>`<div class="v29-day"><div class="v29-day-bar" data-val="${x.n} atividade(s)" style="height:${Math.max(6,Math.round((x.n/max)*104))}px"></div><span>${dateBR(x.d).slice(0,5)}</span></div>`).join('')}
function renderAlerts(){const active=activeGoals().map(g=>({g,m:math(g)})),late=active.filter(x=>x.m.status.cls==='danger'),warn=active.filter(x=>x.m.status.cls==='warn'),noFollow=getLeads().filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&!l.followup).length,alerts=[];late.slice(0,3).forEach(x=>alerts.push(['danger',`Meta atrasada: ${x.g.titulo}`,`Faltam ${br(x.m.remaining)} para bater até ${dateBR(x.g.fim)}. Ritmo necessário: ${br(x.m.needDay)} por dia.`]));warn.slice(0,3).forEach(x=>alerts.push(['warn',`Meta em atenção: ${x.g.titulo}`,`Realizado ${br(x.m.done)} de ${br(x.m.target)}. Ideal até hoje: ${br(x.m.ideal)}.`]));if(noFollow)alerts.push(['warn','Leads sem próximo passo',`${noFollow} lead(s) abertos sem follow-up. Isso afeta reuniões e propostas.`]);if(!alerts.length)alerts.push(['ok','Rotina no ritmo','As metas ativas estão saudáveis. Continue registrando atividades.']);$('#v29Alerts').innerHTML=alerts.map(a=>`<div class="v29-alert ${a[0]}"><b>${esc(a[1])}</b><p>${esc(a[2])}</p></div>`).join('')}
function recordContactClick(e){const a=e.target.closest('a[href^="tel:"],a[href^="mailto:"],a[href*="wa.me"]');if(!a)return;const h=a.closest('[data-id],[data-nome],[data-lead],[data-lead-nome]');if(!h)return;const list=getLeads(),id=h.dataset.id,name=h.dataset.nome||h.dataset.lead||h.dataset.leadNome,lead=list.find(l=>(id&&String(l.id)===String(id))||(name&&String(l.nome)===String(name)));if(!lead)return;let tipo='Ligação';if(a.href.includes('wa.me'))tipo='WhatsApp';if(a.href.startsWith('mailto:'))tipo='E-mail';if(!Array.isArray(lead.atividades))lead.atividades=[];const last=lead.atividades[0];if(last&&last.tipo===tipo&&String(last.data||'').slice(0,10)===todayISO()&&String(last.texto||'').includes('Clique registrado'))return;lead.atividades.unshift({id:'at_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),tipo,texto:`Clique registrado pelo botão de ${tipo}.`,autor:'CRM',data:new Date().toISOString()});lead.ultimaAtualizacao=todayISO();saveRuntimeLeads(list);setTimeout(()=>{if($('#metas.active'))renderAllGoals()},80)}
function init(){ensurePage();document.addEventListener('click',e=>{const n=e.target.closest('[data-view="metas"],[data-go="metas"],[data-go-view="metas"]');if(n)setTimeout(()=>{if(!$('#v29Daily'))ensurePage();else renderAllGoals()},60)},true);document.addEventListener('click',recordContactClick,true);const main=$('.main')||document.body;new MutationObserver(()=>{if($('#metas.active'))setTimeout(()=>{if(!$('#v29Daily'))ensurePage();else renderAllGoals()},40)}).observe(main,{subtree:true,attributes:true,attributeFilter:['class']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
/* Script original 18 */
(function(){
'use strict';
if(window.__crmGoalsV30Routine)return;window.__crmGoalsV30Routine=true;
const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>Array.from(r.querySelectorAll(q));
const GOAL_KEYS=['outbounder_goals_v5','crm_goals_v5'],LEAD_KEY='outbounder_leads_v5',AGENDA_KEY='outbounder_agenda_v1',ROUTINE_KEY='crm_v30_daily_routine',DEFAULT_RESP='Time Comercial';
function esc(v){return String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
function readJSON(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch(e){return f}}
function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function getLeads(){try{if(Array.isArray(window.leads))return window.leads}catch(e){}const l=readJSON(LEAD_KEY,[]);return Array.isArray(l)?l:[]}
function getAgenda(){try{if(Array.isArray(window.agEvents))return window.agEvents}catch(e){}const a=readJSON(AGENDA_KEY,[]);return Array.isArray(a)?a:[]}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function toDate(s){if(!s)return null;const [y,m,d]=String(s).slice(0,10).split('-').map(Number);return new Date(y||1970,(m||1)-1,d||1)}
function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function addDays(s,n){const d=toDate(s)||new Date();d.setDate(d.getDate()+Number(n||0));return iso(d)}
function daysInc(a,b){const da=toDate(a),db=toDate(b);if(!da||!db)return 1;return Math.max(1,Math.floor((db-da)/86400000)+1)}
function ageDays(s){const d=toDate(s);if(!d)return 999;return Math.max(0,Math.floor((toDate(todayISO())-d)/86400000))}
function inRange(date,start,end){if(!date)return false;const d=String(date).slice(0,10);return(!start||d>=start)&&(!end||d<=end)}
function br(n){return new Intl.NumberFormat('pt-BR').format(Number(n)||0)}
function pct(a,b){a=Number(a)||0;b=Number(b)||0;return b?Math.min(100,Math.round(a*100/b)):0}
function notify(msg,type){try{if(typeof window.showToast==='function')return window.showToast(msg,type||'success')}catch(e){}try{if(typeof window.toast==='function')return window.toast(msg,type||'success')}catch(e){}console.log(msg)}
function readGoals(){let arr=[];for(const k of GOAL_KEYS){const v=readJSON(k,null);if(Array.isArray(v)&&v.length){arr=v;break}}return arr.map(g=>({id:g.id||('g_'+Date.now()),tipo:g.tipo||'Ligação',titulo:g.titulo||`${g.tipo||'Meta'} no período`,alvo:Number(g.alvo||1)||1,manualRealizado:Number(g.manualRealizado??g.realizado??0)||0,inicio:g.inicio||todayISO(),fim:g.fim||addDays(todayISO(),6),responsavel:g.responsavel||DEFAULT_RESP,fonte:g.fonte||'auto',obs:g.obs||''}))}
function respMatch(l,resp){return!resp||String(l.responsavel||DEFAULT_RESP)===String(resp)}
function actMatch(a,tipo){const t=String(a?.tipo||'');if(tipo==='Atividade')return t&&t!=='Etapa'&&t!=='Automação';return t===tipo||(tipo==='E-mail'&&/email|e-mail/i.test(t))||(tipo==='Ligação'&&/liga/i.test(t))||(tipo==='WhatsApp'&&/whats/i.test(t))||(tipo==='Reunião'&&/reuni/i.test(t))}
function realByType(tipo,start,end,resp){let total=0;const list=getLeads();if(tipo==='Fechamento')return list.filter(l=>l.etapa==='Fechado'&&inRange(l.ultimaAtualizacao||l.dataEntrada,start,end)&&respMatch(l,resp)).length;if(tipo==='Proposta')return list.filter(l=>['Proposta','Fechado'].includes(l.etapa)&&inRange(l.ultimaAtualizacao||l.dataEntrada,start,end)&&respMatch(l,resp)).length;list.forEach(l=>{if(!respMatch(l,resp))return;(Array.isArray(l.atividades)?l.atividades:[]).forEach(a=>{if(actMatch(a,tipo)&&inRange(a.data,start,end))total++})});getAgenda().forEach(e=>{if((!resp||!e.responsavel||e.responsavel===resp)&&actMatch(e,tipo)&&inRange(e.data||e.start,start,end))total++});return total}
function activeGoals(){const t=todayISO();return readGoals().filter(g=>(!g.inicio||g.inicio<=t)&&(!g.fim||g.fim>=t))}
function goalMath(g){const t=todayISO(),total=daysInc(g.inicio,g.fim),elapsed=Math.max(1,Math.min(total,daysInc(g.inicio,t))),left=Math.max(1,daysInc(t,g.fim)),done=g.fonte==='manual'?Number(g.manualRealizado||0):realByType(g.tipo,g.inicio,g.fim,g.responsavel!==DEFAULT_RESP?g.responsavel:''),todayDone=g.fonte==='manual'?0:realByType(g.tipo,t,t,g.responsavel!==DEFAULT_RESP?g.responsavel:''),target=Number(g.alvo)||1,targetToday=Math.max(1,Math.ceil(target/total)),ideal=Math.ceil(target*(elapsed/total)),remaining=Math.max(0,target-done),needDay=Math.ceil(remaining/left);return{done,todayDone,target,targetToday,ideal,remaining,needDay,p:pct(done,target),todayPct:pct(todayDone,targetToday)}}
function callStats(){const calls=activeGoals().filter(g=>g.tipo==='Ligação');const doneToday=realByType('Ligação',todayISO(),todayISO(),'');const targetToday=calls.reduce((s,g)=>s+goalMath(g).targetToday,0);const remaining=Math.max(0,targetToday-doneToday);const periodDone=calls.reduce((s,g)=>s+goalMath(g).done,0);const periodTarget=calls.reduce((s,g)=>s+(Number(g.alvo)||0),0);return{calls,doneToday,targetToday,remaining,periodDone,periodTarget,p:pct(doneToday,targetToday),periodPct:pct(periodDone,periodTarget)}}
function dueFollowups(){const t=todayISO();return getLeads().filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&l.followup&&String(l.followup).slice(0,10)<=t)}
function staleLeads(days){return getLeads().filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&ageDays(l.ultimaAtualizacao||l.dataEntrada||l.criadoEm)>=days)}
function proposalsStale(){return getLeads().filter(l=>l.etapa==='Proposta'&&ageDays(l.ultimaAtualizacao||l.dataEntrada||l.criadoEm)>=3)}
function noNextStep(){return getLeads().filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&!l.followup)}
function buildTasks(){const tasks=[];const cs=callStats();if(cs.calls.length&&cs.remaining>0)tasks.push({rank:1,prio:'alta',icon:'📞',title:`Fazer ${br(cs.remaining)} ligação(ões) pela aba Ligações`,desc:`A meta de ligação de hoje está em ${br(cs.doneToday)}/${br(cs.targetToday)}. O progresso é puxado dos registros do discador e do histórico dos leads.`,action:'ligacoes',tag:'Meta de ligações'});activeGoals().filter(g=>g.tipo!=='Ligação').forEach(g=>{const m=goalMath(g),miss=Math.max(0,m.targetToday-m.todayDone);if(miss>0)tasks.push({rank:g.tipo==='Fechamento'?1:g.tipo==='Proposta'?2:3,prio:g.tipo==='Fechamento'||g.tipo==='Proposta'?'alta':'media',icon:g.tipo==='WhatsApp'?'💬':g.tipo==='E-mail'?'✉️':g.tipo==='Reunião'?'🎯':g.tipo==='Fechamento'?'🏆':'✅',title:`Executar ${br(miss)} ação(ões) de ${g.tipo}`,desc:`Meta: ${esc(g.titulo)}. Hoje está em ${br(m.todayDone)}/${br(m.targetToday)}; no período está em ${br(m.done)}/${br(m.target)}.`,action:g.tipo==='WhatsApp'?'pipeline':g.tipo==='Reunião'?'agenda':'metas',tag:'Meta ativa'})});const due=dueFollowups();if(due.length)tasks.push({rank:1,prio:'alta',icon:'⏰',title:`Resolver ${br(due.length)} follow-up(s) vencido(s)`,desc:'Priorize os leads com próximo passo atrasado antes de prospectar novos contatos.',action:'agenda',tag:'Follow-up'});const prop=proposalsStale();if(prop.length)tasks.push({rank:1,prio:'alta',icon:'📄',title:`Fazer follow-up em ${br(prop.length)} proposta(s) parada(s)`,desc:'Propostas sem retorno recente costumam travar fechamento; retome com prazo e próximo passo claro.',action:'funil',tag:'Propostas'});const stale=staleLeads(7);if(stale.length)tasks.push({rank:3,prio:'media',icon:'🧊',title:`Reaquecer ${br(stale.length)} lead(s) parado(s)`,desc:'Leads sem atualização há 7 dias ou mais devem voltar para uma follow-up curta.',action:'pipeline',tag:'Leads parados'});const noNext=noNextStep();if(noNext.length)tasks.push({rank:4,prio:'media',icon:'🗓️',title:`Definir próximo passo para ${br(noNext.length)} lead(s)`,desc:'Todo lead aberto precisa de follow-up, reunião, proposta ou motivo de perda.',action:'pipeline',tag:'Organização'});if(!tasks.length)tasks.push({rank:9,prio:'baixa',icon:'✅',title:'Rotina no verde hoje',desc:'As metas e follow-ups principais estão no ritmo. Use a aba Ligações para manter volume e atualizar a base.',action:'ligacoes',tag:'Rotina saudável'});return tasks.sort((a,b)=>a.rank-b.rank).slice(0,8)}
function getRoutine(){const r=readJSON(ROUTINE_KEY,null);return r&&r.date===todayISO()?r:null}
function saveRoutine(){const r={date:todayISO(),createdAt:new Date().toISOString(),tasks:buildTasks()};writeJSON(ROUTINE_KEY,r);return r}
function go(view){try{if(typeof window.setView==='function'){window.setView(view);return}}catch(e){}const el=document.querySelector(`[data-view="${view}"],[data-go="${view}"],[data-go-view="${view}"]`);if(el)el.click()}
function createCallGoal(){const t=todayISO();const set=(id,v)=>{const el=$('#'+id);if(el)el.value=v};set('v29Tipo','Ligação');set('v29Fonte','auto');set('v29Titulo','Ligações de hoje');set('v29Alvo','30');set('v29Manual','0');set('v29Inicio',t);set('v29Fim',t);set('v29Resp',DEFAULT_RESP);set('v29Obs','Meta conectada com a aba Ligações: conta registros feitos pelo discador e histórico dos leads.');$('#v29Titulo')?.focus();$('#v29Form')?.scrollIntoView({behavior:'smooth',block:'center'});notify('Meta de ligação pronta para salvar','success')}
function ensureBlocks(){const page=$('#metas');if(!page)return false;const actions=page.querySelector('.v29-actions');if(actions&&!page.querySelector('#v30GenerateTop'))actions.insertAdjacentHTML('afterbegin','<button class="btn btn-primary btn-sm" id="v30GenerateTop" type="button">Gerar rotina</button>');const daily=page.querySelector('#v29Daily');if(daily&&!page.querySelector('#v30CallBridge'))daily.insertAdjacentHTML('afterend','<div id="v30CallBridge" class="v30-call-bridge"></div><div id="v30Routine" class="v30-routine-card"></div>');return true}
function renderCallBridge(){const box=$('#v30CallBridge');if(!box)return;const cs=callStats();const hasGoal=cs.calls.length>0;const label=hasGoal?(cs.remaining>0?'Conectado: faltam ligações':'Conectado: em dia'):'Sem meta de ligação ativa';const badgeCls=hasGoal?(cs.remaining>0?'warn':'ok'):'danger';box.innerHTML=`<div><span class="v30-badge ${badgeCls}">${label}</span><div class="v30-call-title">Progresso de ligações conectado ao discador</div><div class="v30-call-sub">A meta de <b>Ligação</b> conta as chamadas registradas na aba <b>Ligações</b>, além do histórico dos leads e agenda.</div><div class="v30-call-progress"><span style="width:${cs.p}%"></span></div><div class="v30-tiny">Hoje: ${br(cs.doneToday)} feita(s) de ${hasGoal?br(cs.targetToday):'—'} planejada(s).</div></div><div class="v30-call-numbers"><div class="v30-call-mini"><b>${br(cs.doneToday)}</b><span>Ligações hoje</span></div><div class="v30-call-mini"><b>${hasGoal?br(cs.targetToday):'—'}</b><span>Meta de hoje</span></div><div class="v30-call-mini"><b>${hasGoal?br(cs.remaining):'—'}</b><span>Faltam hoje</span></div></div><div class="v30-call-actions"><button class="btn btn-primary btn-sm" type="button" data-v30-go="ligacoes">Abrir ligações</button>${hasGoal?'<button class="btn btn-sm" type="button" data-v30-generate>Gerar rotina</button>':'<button class="btn btn-sm" type="button" data-v30-call-goal>Criar meta de ligação</button>'}</div>`}
function taskActionLabel(action){return action==='ligacoes'?'Abrir ligações':action==='agenda'?'Abrir agenda':action==='funil'?'Abrir funil':action==='pipeline'?'Abrir pipeline':'Ver metas'}
function renderRoutine(){const box=$('#v30Routine');if(!box)return;const routine=getRoutine();box.innerHTML=`<div class="v30-routine-head"><div><div class="v30-routine-title">Rotina comercial de hoje</div><div class="v30-routine-sub">Gere uma lista objetiva com base nas metas atrasadas, follow-ups, propostas e ligações do dia.</div></div><div class="v29-row-actions"><button class="btn btn-primary btn-sm" type="button" data-v30-generate>Gerar rotina</button></div></div><div class="v30-routine-body">${routine?routine.tasks.map(t=>`<div class="v30-task"><div class="v30-task-icon">${esc(t.icon)}</div><div><div class="v30-task-title">${esc(t.title)}</div><div class="v30-task-desc">${esc(t.desc)}</div><div class="v30-task-meta"><span class="v30-priority ${esc(t.prio)}">${esc(t.prio).toUpperCase()}</span><span class="v30-priority baixa">${esc(t.tag)}</span></div></div><div class="v30-task-actions"><button class="btn btn-xs" type="button" data-v30-go="${esc(t.action)}">${taskActionLabel(t.action)}</button></div></div>`).join(''):`<div class="v30-routine-empty"><div><b>Clique em “Gerar rotina” para criar seu plano do dia.</b><span>O CRM vai priorizar o que mais impacta as metas: ligações pendentes, follow-ups vencidos, propostas paradas e leads sem próximo passo.</span></div><button class="btn btn-primary btn-sm" type="button" data-v30-generate>Gerar rotina agora</button></div>`}</div>`}
let raf=0;function refresh(){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{if(!ensureBlocks())return;renderCallBridge();renderRoutine()})}
document.addEventListener('click',function(e){const gen=e.target.closest('[data-v30-generate],#v30GenerateTop');if(gen){e.preventDefault();saveRoutine();refresh();notify('Rotina de hoje gerada','success');return}const open=e.target.closest('[data-v30-go]');if(open){e.preventDefault();go(open.dataset.v30Go);return}if(e.target.closest('[data-v30-call-goal]')){e.preventDefault();createCallGoal();return}if(e.target.closest('[data-call-outcome],[data-call-dial-link],[data-call-start]'))setTimeout(refresh,500)},true);
const root=$('.main')||document.body;new MutationObserver(()=>{if($('#metas'))refresh()}).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,80));else setTimeout(refresh,80);
})();
/* Script original 19 */
(function(){
  'use strict';
  if(window.__crmV31NavigationHotfix) return;
  window.__crmV31NavigationHotfix = true;

  const $ = (q,r=document)=>r.querySelector(q);
  const $$ = (q,r=document)=>Array.from(r.querySelectorAll(q));
  const titles = {
    inicio:['Painel','Visão geral das suas oportunidades'],
    leads:['Gestão de leads','Base comercial principal'],
    pipeline:['Pipeline','Funil de oportunidades'],
    funil:['Funil de vendas','Conversão, forecast, comparativo mensal e motivos de perda'],
    clientes:['Clientes','Relacionamentos cadastrados'],
    playbooks:['Playbooks','Scripts, checklists e materiais de vendas'],
    objecoes:['Biblioteca de Objeções','Respostas prontas para superar objeções'],
    perdas:['Motivos de Perda','Análise e reativação de negócios perdidos'],
    dashboard:['Dashboard Comercial','Visão completa de indicadores e performance'],
    cadencias:['Follow-ups','Fluxos de prospecção'],
    automacoes:['Automações','Regras de funil'],
    agenda:['Agenda','Planejamento e follow-ups'],
    ligacoes:['Ligações pelo computador','Discagem, timer, script e registro de chamadas'],
    chat:['Chat','Conversas com leads e clientes via WhatsApp'],
    metricas:['Métricas','Indicadores de desempenho'],
    importar:['Importar / Exportar','Gerencie seus dados'],
    garimpo:['Garimpo de Leads','Prospecção inteligente, scoring e criação rápida de oportunidades'],
    metas:['Metas comerciais','Central de metas, rotina diária, ligações e ritmo comercial'],
    'novo-lead':['Novo lead','Cadastro rápido']
  };

  function openNewLeadModal(){
    try{
      if(typeof openModal === 'function') { openModal(null); return true; }
      if(window.openModal) { window.openModal(null); return true; }
    }catch(e){}
    return false;
  }

  function setActiveButton(view){
    $$('[data-view],[data-go],[data-go-view]').forEach(el=>{
      const key = el.dataset.view || el.dataset.go || el.dataset.goView;
      el.classList.toggle('active', key === view);
    });
  }

  function updateTopbar(view){
    const meta = titles[view] || [view || 'CRM',''];
    const tt = $('#topbarTitle'), ts = $('#topbarSub');
    if(tt) tt.textContent = meta[0];
    if(ts) ts.textContent = meta[1];
  }

  function showOnly(view){
    $$('.view').forEach(el=>{
      el.classList.remove('active');
      if(el.id === 'chat') el.style.display = 'none';
      else el.style.display = '';
    });

    const target = document.getElementById(view);
    if(target){
      target.classList.add('active');
      if(view === 'chat') target.style.display = 'block';
      else if(target.classList.contains('grid-view') || ['funil','metas','ligacoes','garimpo'].includes(view)) target.style.display = 'grid';
      else target.style.display = '';
    }

    // Garantia extra: Metas nunca fica visível se não for a aba ativa.
    const metas = $('#metas');
    if(metas && view !== 'metas'){
      metas.classList.remove('active');
      metas.style.display = 'none';
    }
  }

  function runViewRender(view){
    setTimeout(()=>{
      try{ if(view === 'agenda' && typeof renderAgenda === 'function') renderAgenda(); }catch(e){}
      try{ if(view === 'metricas' && typeof renderMetrics === 'function') renderMetrics(); }catch(e){}
      try{ if(view === 'dashboard' && typeof renderDashboard === 'function') renderDashboard(); }catch(e){}
      try{ if(view === 'chat' && typeof renderConversationList === 'function') renderConversationList(); }catch(e){}
      try{ if(view === 'chat' && typeof updateChatBadge === 'function') updateChatBadge(); }catch(e){}
      try{ if(view === 'ligacoes' && typeof window.renderCallCenterV9 === 'function') window.renderCallCenterV9(); }catch(e){}
      try{ if(view === 'funil' && typeof window.renderFunilPage === 'function') window.renderFunilPage(); }catch(e){}
      try{ if(view === 'garimpo' && typeof window.renderGarimpoLeadsV7 === 'function') window.renderGarimpoLeadsV7(); }catch(e){}
      try{ document.dispatchEvent(new CustomEvent('crm:viewchange',{detail:{view}})); }catch(e){}
    },40);
  }

  function stableSetView(view){
    view = String(view || '').trim();
    if(!view) return;
    if(view === 'novo-lead' && openNewLeadModal()) return;

    showOnly(view);
    setActiveButton(view);
    updateTopbar(view);
    document.body.dataset.currentView = view;
    try{ localStorage.setItem('crm_current_view', view); }catch(e){}
    runViewRender(view);
  }

  window.setView = stableSetView;
  try{ setView = stableSetView; }catch(e){}

  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-view],[data-go],[data-go-view]');
    if(!btn) return;
    const view = btn.dataset.view || btn.dataset.go || btn.dataset.goView;
    if(!view) return;

    e.preventDefault();
    e.stopPropagation();
    stableSetView(view);
  }, true);

  // Corrige imediatamente caso a página carregue com Metas aparecendo por cima.
  setTimeout(()=>{
    const active = $('.view.active');
    stableSetView(active && active.id ? active.id : 'inicio');
  },80);
})();
/* Script original 20 */
(function(){
  'use strict';
  if(window.__crmGoalsV32Organizer) return;
  window.__crmGoalsV32Organizer = true;

  const $=(q,r=document)=>r.querySelector(q);
  const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
  const GOAL_KEYS=['outbounder_goals_v5','crm_goals_v5'];
  const LEAD_KEY='outbounder_leads_v5';
  const AGENDA_KEY='outbounder_agenda_v1';
  const PREF_KEY='crm_v32_goals_blocks';
  const ROUTINE_KEY='crm_v30_daily_routine';
  const DEFAULT_RESP='Time Comercial';
  const goalTypes=['Ligação','WhatsApp','E-mail','Reunião','Proposta','Fechamento','Atividade'];
  const targetMap={Ligação:30,WhatsApp:40,'E-mail':25,Reunião:3,Proposta:2,Fechamento:1,Atividade:50};
  const blockDefs=[
    ['daily','Painel do dia','Resumo da meta de hoje, realizado, falta e atraso.'],
    ['calls','Ligações conectadas','Progresso da meta de ligação puxado do discador.'],
    ['routine','Rotina comercial','Plano automático com prioridades do dia.'],
    ['quick','Metas rápidas','Modelos prontos para criar metas em poucos cliques.'],
    ['form','Cadastro de meta','Formulário para criar ou editar metas.'],
    ['list','Metas em andamento','Cards de metas com filtros e ações.'],
    ['pace','Ritmo ideal','Comparação entre ideal, realizado e falta por dia.'],
    ['rank','Ranking','Performance por responsável ou função.'],
    ['impact','Impacto no funil','Conexão entre atividades e avanço comercial.'],
    ['evolution','Evolução 7 dias','Histórico visual de atividades registradas.'],
    ['alerts','Alertas','Próximos passos e riscos comerciais.']
  ];
  const defaultPrefs=Object.fromEntries(blockDefs.map(([k])=>[k,true]));

  function esc(v){return String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
  function readJSON(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch(e){return f}}
  function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function toast(msg,type){try{if(typeof showToast==='function')return showToast(msg,type||'success')}catch(e){}try{if(typeof window.toast==='function')return window.toast(msg,type||'success')}catch(e){}console.log(msg)}
  function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function toDate(s){if(!s)return null;const [y,m,d]=String(s).slice(0,10).split('-').map(Number);return new Date(y||1970,(m||1)-1,d||1)}
  function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function addDays(s,n){const d=toDate(s)||new Date();d.setDate(d.getDate()+Number(n||0));return iso(d)}
  function startOfWeek(){const d=toDate(todayISO()),day=d.getDay()||7;d.setDate(d.getDate()-day+1);return iso(d)}
  function endOfWeek(){return addDays(startOfWeek(),6)}
  function startOfMonth(){const d=toDate(todayISO());return iso(new Date(d.getFullYear(),d.getMonth(),1))}
  function endOfMonth(){const d=toDate(todayISO());return iso(new Date(d.getFullYear(),d.getMonth()+1,0))}
  function inRange(date,start,end){if(!date)return false;const d=String(date).slice(0,10);return(!start||d>=start)&&(!end||d<=end)}
  function br(n){return new Intl.NumberFormat('pt-BR').format(Number(n)||0)}
  function pct(a,b){a=Number(a)||0;b=Number(b)||0;return b?Math.round(a*100/b):0}
  function daysInc(a,b){const da=toDate(a),db=toDate(b);if(!da||!db)return 1;return Math.max(1,Math.floor((db-da)/86400000)+1)}
  function prefs(){return {...defaultPrefs,...(readJSON(PREF_KEY,{})||{})}}
  function savePrefs(p){writeJSON(PREF_KEY,{...defaultPrefs,...p})}
  function runtimeLeads(){try{if(Array.isArray(window.leads))return window.leads}catch(e){}const l=readJSON(LEAD_KEY,[]);return Array.isArray(l)?l:[]}
  function getAgenda(){try{if(Array.isArray(window.agEvents))return window.agEvents}catch(e){}const a=readJSON(AGENDA_KEY,[]);return Array.isArray(a)?a:[]}
  function normalizeGoal(g){g=g||{};const tipo=goalTypes.includes(g.tipo)?g.tipo:'Ligação',ini=g.inicio||todayISO(),fim=g.fim||addDays(ini,6);return{id:g.id||('g_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6)),tipo,titulo:g.titulo||`${tipo} no período`,alvo:Number(g.alvo||1)||1,manualRealizado:Number(g.manualRealizado??g.realizado??0)||0,inicio:ini,fim,responsavel:g.responsavel||DEFAULT_RESP,fonte:g.fonte||'auto',obs:g.obs||'',updatedAt:g.updatedAt||new Date().toISOString()}}
  function readGoals(){let arr=[];for(const k of GOAL_KEYS){const v=readJSON(k,null);if(Array.isArray(v)&&v.length){arr=v;break}}return arr.map(normalizeGoal).sort((a,b)=>(a.fim||'9999').localeCompare(b.fim||'9999'))}
  function saveGoals(gs){const clean=gs.map(normalizeGoal);GOAL_KEYS.forEach(k=>writeJSON(k,clean));try{if(Array.isArray(window.goalsV5)){window.goalsV5.length=0;clean.forEach(g=>window.goalsV5.push(g))}}catch(e){}return clean}
  function updateGoal(goal){const arr=readGoals(),idx=arr.findIndex(g=>g.id===goal.id),ng=normalizeGoal({...goal,updatedAt:new Date().toISOString()});idx>-1?arr.splice(idx,1,ng):arr.unshift(ng);saveGoals(arr)}
  function actMatch(a,tipo){const t=String(a?.tipo||'');if(tipo==='Atividade')return t&&t!=='Etapa'&&t!=='Automação';return t===tipo||(tipo==='E-mail'&&/email|e-mail/i.test(t))||(tipo==='Ligação'&&/liga/i.test(t))}
  function respMatch(l,resp){return!resp||String(l.responsavel||DEFAULT_RESP)===String(resp)}
  function realByType(tipo,start,end,resp){const list=runtimeLeads();let total=0;if(tipo==='Fechamento')return list.filter(l=>l.etapa==='Fechado'&&inRange(l.ultimaAtualizacao||l.dataEntrada,start,end)&&respMatch(l,resp)).length;if(tipo==='Proposta')return list.filter(l=>['Proposta','Fechado'].includes(l.etapa)&&inRange(l.ultimaAtualizacao||l.dataEntrada,start,end)&&respMatch(l,resp)).length;list.forEach(l=>{if(!respMatch(l,resp))return;(Array.isArray(l.atividades)?l.atividades:[]).forEach(a=>{if(actMatch(a,tipo)&&inRange(a.data,start,end))total++})});getAgenda().forEach(e=>{if((!resp||!e.responsavel||e.responsavel===resp)&&actMatch(e,tipo)&&inRange(e.data,start,end))total++});return total}
  function realized(g){return g.fonte==='manual'?Number(g.manualRealizado||0):realByType(g.tipo,g.inicio,g.fim,g.responsavel&&g.responsavel!==DEFAULT_RESP?g.responsavel:'')}
  function math(g){const t=todayISO(),start=g.inicio||t,end=g.fim||t,total=daysInc(start,end),elapsed=Math.max(1,Math.min(total,daysInc(start,t))),left=Math.max(1,daysInc(t,end)),done=realized(g),target=Number(g.alvo)||1,ideal=Math.ceil(target*(elapsed/total)),targetToday=Math.max(1,Math.ceil(target/total)),todayDone=g.fonte==='manual'?0:realByType(g.tipo,t,t,g.responsavel&&g.responsavel!==DEFAULT_RESP?g.responsavel:''),remaining=Math.max(0,target-done),needDay=Math.ceil(remaining/left);return{done,target,ideal,targetToday,todayDone,remaining,needDay,p:pct(done,target)}}
  function activeGoals(){const t=todayISO();return readGoals().filter(g=>(!g.inicio||g.inicio<=t)&&(!g.fim||g.fim>=t))}
  function setVal(id,v){const el=$('#'+id);if(el)el.value=v}
  function fillDefaults(){const t=todayISO();setVal('v29Id','');setVal('v29Tipo','Ligação');setVal('v29Fonte','auto');setVal('v29Titulo','');setVal('v29Alvo','');setVal('v29Manual','0');setVal('v29Inicio',t);setVal('v29Fim',addDays(t,6));setVal('v29Resp',DEFAULT_RESP);setVal('v29Obs','');$$('#metas .v29-field.invalid').forEach(x=>x.classList.remove('invalid'));}
  function collectForm(){return{id:$('#v29Id')?.value||undefined,tipo:$('#v29Tipo')?.value||'Ligação',fonte:$('#v29Fonte')?.value||'auto',titulo:($('#v29Titulo')?.value||'').trim(),alvo:Number($('#v29Alvo')?.value)||0,manualRealizado:Number($('#v29Manual')?.value)||0,inicio:$('#v29Inicio')?.value||todayISO(),fim:$('#v29Fim')?.value||todayISO(),responsavel:($('#v29Resp')?.value||DEFAULT_RESP).trim()||DEFAULT_RESP,obs:($('#v29Obs')?.value||'').trim()}}
  function markInvalid(id){$('#'+id)?.closest('.v29-field')?.classList.add('invalid')}
  function saveForm(){ $$('#metas .v29-field.invalid').forEach(x=>x.classList.remove('invalid')); const g=collectForm(); let ok=true; if(!g.titulo){markInvalid('v29Titulo');ok=false} if(g.alvo<=0){markInvalid('v29Alvo');ok=false} if(!g.inicio){markInvalid('v29Inicio');ok=false} if(!g.fim||g.fim<g.inicio){markInvalid('v29Fim');ok=false} if(!ok){toast('Revise os campos da meta','warn');return} updateGoal(g); fillDefaults(); refreshHard('Meta salva','success'); }
  function fillForm(id){const g=readGoals().find(x=>String(x.id)===String(id));if(!g)return;setVal('v29Id',g.id);setVal('v29Tipo',g.tipo);setVal('v29Fonte',g.fonte);setVal('v29Titulo',g.titulo);setVal('v29Alvo',g.alvo);setVal('v29Manual',g.manualRealizado);setVal('v29Inicio',g.inicio);setVal('v29Fim',g.fim);setVal('v29Resp',g.responsavel||DEFAULT_RESP);setVal('v29Obs',g.obs||'');showBlock('form');$('.v29-form-card')?.scrollIntoView({behavior:'smooth',block:'start'});}
  function applyTemplate(tipo,periodo){fillDefaults();let ini=todayISO(),fim=todayISO(),mult=1,label='hoje';if(periodo==='semana'){ini=startOfWeek();fim=endOfWeek();mult=5;label='na semana'}if(periodo==='mes'){ini=startOfMonth();fim=endOfMonth();mult=22;label='no mês'}setVal('v29Tipo',tipo);setVal('v29Fonte','auto');setVal('v29Titulo',`${targetMap[tipo]*mult} ${tipo.toLowerCase()} ${label}`);setVal('v29Alvo',targetMap[tipo]*mult);setVal('v29Inicio',ini);setVal('v29Fim',fim);setVal('v29Resp',DEFAULT_RESP);setVal('v29Obs','Criada a partir de modelo rápido. Ajuste conforme sua rotina.');showBlock('form');$('.v29-form-card')?.scrollIntoView({behavior:'smooth',block:'start'});toast('Modelo aplicado. Revise e salve a meta.','success')}
  function plusOne(id){const arr=readGoals(),g=arr.find(x=>String(x.id)===String(id));if(!g)return;if(g.fonte==='auto'&&!confirm('Essa meta é automática. Somar +1 converte para manual para evitar contagem duplicada. Continuar?'))return;g.fonte='manual';g.manualRealizado=Number(g.manualRealizado||0)+1;updateGoal(g);refreshHard('Realizado manual atualizado','success')}
  function deleteGoal(id){if(!confirm('Excluir esta meta?'))return;saveGoals(readGoals().filter(g=>String(g.id)!==String(id)));refreshHard('Meta excluída','warn')}
  function generateRoutine(){const goals=activeGoals();const tasks=[];const callGoals=goals.filter(g=>g.tipo==='Ligação');const doneCalls=realByType('Ligação',todayISO(),todayISO(),'');const targetCalls=callGoals.reduce((s,g)=>s+math(g).targetToday,0);const remCalls=Math.max(0,targetCalls-doneCalls);if(callGoals.length&&remCalls>0)tasks.push({rank:1,prio:'alta',icon:'📞',title:`Fazer ${br(remCalls)} ligação(ões) pela aba Ligações`,desc:`Hoje você registrou ${br(doneCalls)} de ${br(targetCalls)} ligações planejadas.`,action:'ligacoes',tag:'Meta de ligações'});goals.filter(g=>g.tipo!=='Ligação').forEach(g=>{const m=math(g),miss=Math.max(0,m.targetToday-m.todayDone);if(miss>0)tasks.push({rank:g.tipo==='Fechamento'?1:g.tipo==='Proposta'?2:3,prio:g.tipo==='Fechamento'||g.tipo==='Proposta'?'alta':'media',icon:g.tipo==='WhatsApp'?'💬':g.tipo==='E-mail'?'✉️':g.tipo==='Reunião'?'🎯':g.tipo==='Fechamento'?'🏆':'✅',title:`Executar ${br(miss)} ação(ões) de ${g.tipo}`,desc:`Meta: ${g.titulo}. No período: ${br(m.done)}/${br(m.target)}.`,action:g.tipo==='Reunião'?'agenda':g.tipo==='Proposta'?'funil':'pipeline',tag:'Meta ativa'})});const leads=runtimeLeads();const due=leads.filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&l.followup&&String(l.followup).slice(0,10)<=todayISO());if(due.length)tasks.push({rank:1,prio:'alta',icon:'⏰',title:`Resolver ${br(due.length)} follow-up(s) vencido(s)`,desc:'Priorize os leads com próximo passo atrasado.',action:'agenda',tag:'Follow-up'});if(!tasks.length)tasks.push({rank:9,prio:'baixa',icon:'✅',title:'Rotina no verde hoje',desc:'Metas e follow-ups principais estão sob controle.',action:'ligacoes',tag:'Rotina saudável'});writeJSON(ROUTINE_KEY,{date:todayISO(),createdAt:new Date().toISOString(),tasks:tasks.sort((a,b)=>a.rank-b.rank).slice(0,8)});refreshHard('Rotina de hoje gerada','success')}
  function createCallGoal(){const t=todayISO();showBlock('form');setVal('v29Tipo','Ligação');setVal('v29Fonte','auto');setVal('v29Titulo','Ligações de hoje');setVal('v29Alvo','30');setVal('v29Manual','0');setVal('v29Inicio',t);setVal('v29Fim',t);setVal('v29Resp',DEFAULT_RESP);setVal('v29Obs','Meta conectada com a aba Ligações: conta registros feitos pelo discador e histórico dos leads.');$('#v29Titulo')?.focus();$('.v29-form-card')?.scrollIntoView({behavior:'smooth',block:'center'});toast('Meta de ligação pronta para salvar','success')}
  function go(view){try{if(typeof window.setView==='function'){window.setView(view);return}}catch(e){}const el=document.querySelector(`[data-view="${view}"],[data-go="${view}"],[data-go-view="${view}"]`);if(el)el.click()}
  function refreshHard(msg,type){setTimeout(()=>{try{if(typeof window.setView==='function')window.setView('metas')}catch(e){}setTimeout(()=>{enhance();applyPrefs();},90);},20);if(msg)toast(msg,type||'success')}
  function showBlock(key){const p=prefs();p[key]=true;savePrefs(p);applyPrefs();renderChooser();}

  function ensureTopControls(){const page=$('#metas'); if(!page)return; const actions=page.querySelector('.v29-actions'); if(actions){actions.classList.add('v32-actionbar'); if(!$('#v32OpenBlocks')) actions.insertAdjacentHTML('beforeend','<button class="btn btn-sm" id="v32OpenBlocks" type="button">Organizar blocos</button>'); if(!$('#v32OpenCalls')) actions.insertAdjacentHTML('beforeend','<button class="btn btn-sm" id="v32OpenCalls" type="button" data-v32-go="ligacoes">Abrir ligações</button>'); const gen=$('#v30GenerateTop'); if(gen) actions.prepend(gen); const newBtn=$('#v29New'); if(newBtn) newBtn.classList.add('btn-primary'); }
    if(!$('#v32ControlCenter')){const top=page.querySelector('.v29-top'); top?.insertAdjacentHTML('afterend',`<div class="v32-control-center" id="v32ControlCenter"><div><div class="v32-control-title">⚙️ Controle da aba Metas <span class="v32-mini-pill" id="v32VisibleCount">— blocos ativos</span></div><div class="v32-control-sub">Escolha quais blocos aparecem, organize sua rotina e mantenha a tela limpa para usar no dia a dia.</div></div><div class="v32-control-actions"><button class="btn btn-primary btn-sm" type="button" data-v32-generate>Gerar rotina</button><button class="btn btn-sm" type="button" data-v32-open-blocks>Escolher blocos</button><button class="btn btn-sm" type="button" data-v32-go="ligacoes">Abrir ligações</button></div></div>`)} }
  function labelCard(el,key){if(!el||el.dataset.goalsBlock)return;el.dataset.goalsBlock=key;}
  function markBlocks(){const page=$('#metas'); if(!page)return; labelCard($('#v29Daily'),'daily'); labelCard($('#v30CallBridge'),'calls'); labelCard($('#v30Routine'),'routine'); labelCard(page.querySelector('.v29-quick'),'quick'); const grid=page.querySelector('.v29-grid'); if(grid){const cards=$$('.v29-card',grid); labelCard(cards[0],'form'); labelCard(cards[1],'list');}
    const insights=$$('.v29-insights .v29-card',page); labelCard(insights[0],'pace'); labelCard(insights[1],'rank'); labelCard(insights[2],'impact'); labelCard(insights[3],'evolution'); const alertCard=Array.from($$('.v29-card',page)).find(c=>c.querySelector('#v29Alerts')); labelCard(alertCard,'alerts');
    $$('[data-goals-block]',page).forEach(el=>{const key=el.dataset.goalsBlock; const def=blockDefs.find(b=>b[0]===key); if(!def)return; const title=el.querySelector('.v29-title,.v30-routine-title,.v29-command-title,.v30-call-title'); if(title&&!title.querySelector('.v32-block-label'))title.insertAdjacentHTML('beforeend',`<span class="v32-block-label">${esc(def[1])}</span>`);}); }
  function applyPrefs(){const p=prefs();let visible=0;$$('#metas [data-goals-block]').forEach(el=>{const on=p[el.dataset.goalsBlock]!==false;el.classList.toggle('v32-hidden-block',!on);if(on)visible++;});const count=$('#v32VisibleCount');if(count)count.textContent=`${visible} blocos ativos`;}
  function ensureModal(){if($('#v32GoalsModal'))return;document.body.insertAdjacentHTML('beforeend',`<div class="v32-goals-modal" id="v32GoalsModal" aria-hidden="true"><div class="v32-goals-panel" role="dialog" aria-modal="true"><div class="v32-goals-panel-head"><div><div class="v32-goals-panel-title">Organizar blocos da aba Metas</div><div class="v32-goals-panel-sub">Marque somente os blocos que você quer visualizar. A escolha fica salva neste navegador.</div></div><button class="modal-close" type="button" data-v32-close>×</button></div><div class="v32-goals-panel-body"><div class="v32-block-grid" id="v32BlockGrid"></div></div><div class="v32-goals-panel-foot"><button class="btn btn-sm" type="button" data-v32-all>Mostrar todos</button><button class="btn btn-sm" type="button" data-v32-focus>Modo foco</button><button class="btn btn-primary btn-sm" type="button" data-v32-close>Concluir</button></div></div></div>`)}
  function renderChooser(){ensureModal();const p=prefs();const box=$('#v32BlockGrid');if(!box)return;box.innerHTML=blockDefs.map(([k,t,d])=>`<label class="v32-block-option"><input type="checkbox" data-v32-block="${esc(k)}" ${p[k]!==false?'checked':''}><div><strong>${esc(t)}</strong><span>${esc(d)}</span></div></label>`).join('');}
  function openChooser(){renderChooser();$('#v32GoalsModal')?.classList.add('open');$('#v32GoalsModal')?.setAttribute('aria-hidden','false')}
  function closeChooser(){$('#v32GoalsModal')?.classList.remove('open');$('#v32GoalsModal')?.setAttribute('aria-hidden','true')}
  function enhance(){ensureTopControls();markBlocks();ensureModal();renderChooser();applyPrefs();}

  document.addEventListener('submit',function(e){if(e.target&&e.target.id==='v29Form'){e.preventDefault();e.stopImmediatePropagation();saveForm();}},true);
  document.addEventListener('click',function(e){const page=e.target.closest('#metas'); const modal=e.target.closest('#v32GoalsModal'); if(!page&&!modal)return;
    const openBlocks=e.target.closest('#v32OpenBlocks,[data-v32-open-blocks]'); if(openBlocks){e.preventDefault();e.stopImmediatePropagation();openChooser();return}
    if(e.target.closest('[data-v32-close]')){e.preventDefault();e.stopImmediatePropagation();closeChooser();return}
    if(e.target.closest('[data-v32-all]')){e.preventDefault();e.stopImmediatePropagation();savePrefs({...defaultPrefs});applyPrefs();renderChooser();return}
    if(e.target.closest('[data-v32-focus]')){e.preventDefault();e.stopImmediatePropagation();savePrefs({...defaultPrefs,quick:false,form:false,rank:false,impact:false,evolution:false,alerts:true});applyPrefs();renderChooser();return}
    const block=e.target.closest('[data-v32-block]'); if(block){const p=prefs();p[block.dataset.v32Block]=block.checked;savePrefs(p);applyPrefs();return}
    const gen=e.target.closest('[data-v32-generate],[data-v30-generate],#v30GenerateTop'); if(gen){e.preventDefault();e.stopImmediatePropagation();generateRoutine();return}
    const gv=e.target.closest('[data-v32-go],[data-v30-go]'); if(gv){e.preventDefault();e.stopImmediatePropagation();go(gv.dataset.v32Go||gv.dataset.v30Go);return}
    if(e.target.closest('[data-v30-call-goal]')){e.preventDefault();e.stopImmediatePropagation();createCallGoal();return}
    if(e.target.closest('#v29New')){e.preventDefault();e.stopImmediatePropagation();fillDefaults();showBlock('form');$('.v29-form-card')?.scrollIntoView({behavior:'smooth',block:'start'});$('#v29Titulo')?.focus();return}
    if(e.target.closest('#v29Clear')){e.preventDefault();e.stopImmediatePropagation();fillDefaults();toast('Formulário limpo','success');return}
    if(e.target.closest('#v29Sync')){e.preventDefault();e.stopImmediatePropagation();refreshHard('Metas atualizadas pelo CRM','success');return}
    const tpl=e.target.closest('[data-tpl]'); if(tpl){e.preventDefault();e.stopImmediatePropagation();const [t,p]=tpl.dataset.tpl.split('|');applyTemplate(t,p);return}
    const edit=e.target.closest('[data-edit]'); if(edit){e.preventDefault();e.stopImmediatePropagation();fillForm(edit.dataset.edit);return}
    const del=e.target.closest('[data-del]'); if(del){e.preventDefault();e.stopImmediatePropagation();deleteGoal(del.dataset.del);return}
    const plus=e.target.closest('[data-plus]'); if(plus){e.preventDefault();e.stopImmediatePropagation();plusOne(plus.dataset.plus);return}
  },true);

  document.addEventListener('crm:viewchange',function(e){if(e.detail&&e.detail.view==='metas')setTimeout(enhance,90)});
  const main=$('.main')||document.body;
  new MutationObserver(()=>{if($('#metas'))setTimeout(enhance,80)}).observe(main,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhance,180));else setTimeout(enhance,180);
})();
