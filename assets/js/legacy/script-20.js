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
