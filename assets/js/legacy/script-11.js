/* Script original 11 */
(function(){
  'use strict';
  const $=(q,r=document)=>r.querySelector(q);
  const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
  const STAGE_KEY='crm_pipeline_stage_config_v20';
  const MODE_KEY='crm_pipeline_mode_v20';
  const STATUS_KEY='crm_pipeline_status_v20';
  const defaultStageNames=['Lead','Contato','Proposta','Fechado','Perdido'];
  const defaultColors={Lead:'#6366f1',Contato:'#f59e0b',Proposta:'#06b6d4',Fechado:'#22c55e',Perdido:'#ef4444'};
  const defaultProb={Lead:10,Contato:25,Proposta:60,Fechado:100,Perdido:0};
  let dragId=null, placeholder=null, pendingMove=null, lastMove=null, undoTimer=null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=()=>('lead_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8));
  const today=()=>new Date().toISOString().slice(0,10);
  const addDays=n=>{const d=new Date();d.setDate(d.getDate()+Number(n||0));return d.toISOString().slice(0,10)};
  const brl=v=>{try{return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v)||0)}catch(e){return 'R$ '+(Number(v)||0)}};
  const dateBR=iso=>{if(!iso)return 'sem data';try{return new Date(String(iso).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR')}catch(e){return String(iso)}};
  const onlyDigits=v=>String(v||'').replace(/\D/g,'');
  function safeLeads(){try{return leads}catch(e){try{return window.leads||[]}catch(_){return []}}}
  function saveData(){try{typeof saveLeads==='function'&&saveLeads()}catch(e){}try{typeof saveAll==='function'&&saveAll()}catch(e){}try{localStorage.setItem('outbounder_leads_v5',JSON.stringify(safeLeads()))}catch(e){}}
  function ensureIds(){safeLeads().forEach((l,i)=>{if(!l.id)l.id=uid()+'_'+i;if(!l.ultimaAtualizacao)l.ultimaAtualizacao=l.dataEntrada||today();});saveData();}
  function leadById(id){return safeLeads().find(l=>String(l.id)===String(id));}
  function leadScore(l){try{if(typeof calcScore==='function')return calcScore(l)}catch(e){}const st={Lead:10,Contato:30,Proposta:65,Fechado:100,Perdido:0};const pr={Alta:25,'Média':12,Baixa:4};return (st[l.etapa]||20)+(pr[l.prioridade]||0)+Math.min(25,Math.round((Number(l.valor)||0)/1000));}
  function scoreClass(s){try{if(typeof scoreCls==='function')return scoreCls(s)}catch(e){}return s>=80?'score-hi':s>=40?'score-md':'score-lo'}
  function daysSinceSafe(d){if(!d)return 0;try{return Math.max(0,Math.floor((new Date(today()+'T12:00:00')-new Date(String(d).slice(0,10)+'T12:00:00'))/864e5))}catch(e){return 0}}
  function isOverdueSafe(d){if(!d)return false;return String(d).slice(0,10)<today();}
  function isTodaySafe(d){return !!d && String(d).slice(0,10)===today();}
  function isOpenStage(s){return !['Fechado','Perdido'].includes(s)}
  function loadStages(){
    let arr=[];try{arr=JSON.parse(localStorage.getItem(STAGE_KEY)||'[]')}catch(e){arr=[]}
    if(!Array.isArray(arr)||!arr.length){arr=defaultStageNames.map((name,i)=>({id:'st_'+name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_'),name,color:defaultColors[name]||'#2563eb',prob:defaultProb[name]??20,visible:true,order:i}))}
    safeLeads().forEach(l=>{const name=l.etapa||'Lead';if(!arr.some(s=>s.name===name)){arr.push({id:'st_custom_'+Date.now()+Math.random().toString(36).slice(2,5),name,color:defaultColors[name]||'#2563eb',prob:defaultProb[name]??20,visible:true,order:arr.length})}});
    arr=arr.map((s,i)=>({id:s.id||('st_'+i+'_'+Date.now()),name:s.name||'Etapa',color:s.color||defaultColors[s.name]||'#2563eb',prob:Number(s.prob??defaultProb[s.name]??20),visible:s.visible!==false,order:Number.isFinite(Number(s.order))?Number(s.order):i}));
    return arr.sort((a,b)=>a.order-b.order);
  }
  function saveStages(arr){localStorage.setItem(STAGE_KEY,JSON.stringify(arr.map((s,i)=>({...s,order:i}))));refreshLeadStageSelect();}
  function visibleStages(){return loadStages().filter(s=>s.visible!==false)}
  function stageCfg(name){return loadStages().find(s=>s.name===name)||{name,color:defaultColors[name]||'#2563eb',prob:defaultProb[name]??20,visible:true}}
  function refreshLeadStageSelect(){const sel=$('#mEtapa');if(!sel)return;const current=sel.value;sel.innerHTML=loadStages().filter(s=>s.name!=='Perdido').map(s=>`<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('');if(current)sel.value=current;}
  function stageValue(list,stage){return list.filter(l=>l.etapa===stage).reduce((a,l)=>a+(Number(l.valor)||0),0)}
  function stageForecast(list,stage){const cfg=stageCfg(stage);if(!isOpenStage(stage))return 0;return list.filter(l=>l.etapa===stage).reduce((a,l)=>a+(Number(l.valor)||0)*(Number(l.probabilidade||cfg.prob||0)/100),0)}
  function openLead(l){if(!l)return;try{if(typeof openDetail==='function')return openDetail(l.id||l.nome)}catch(e){}try{if(typeof window.openDetail==='function')return window.openDetail(l.id||l.nome)}catch(e){}}
  function editLead(l){if(!l)return;try{if(typeof openModal==='function')return openModal(l)}catch(e){} }
  function addActivity(l,tipo,texto){try{typeof addAtividade==='function'&&addAtividade(l.id||l.nome,tipo,texto)}catch(e){try{typeof addAtividade==='function'&&addAtividade(l.nome,tipo,texto)}catch(_){}} if(Array.isArray(l.atividades)){l.atividades.unshift({id:'at_'+Date.now(),tipo:tipo||'Nota',texto:texto||'',autor:'Você',data:new Date().toISOString()})}}
  function nextAction(l){
    if(l.proximaAcao)return l.proximaAcao;
    if(isOverdueSafe(l.followup))return 'Retornar follow-up vencido';
    if(isTodaySafe(l.followup))return 'Executar contato de hoje';
    if(l.etapa==='Proposta')return 'Cobrar decisão da proposta';
    if(!l.followup && isOpenStage(l.etapa))return 'Definir próximo passo';
    if(daysSinceSafe(l.ultimaAtualizacao||l.dataEntrada)>=7 && isOpenStage(l.etapa))return 'Reativar oportunidade parada';
    return 'Avançar oportunidade';
  }
  function matchesStatus(l,status,stgD){
    if(!status||status==='todos')return true;
    if(status==='vencidos')return isOverdueSafe(l.followup);
    if(status==='hoje')return isTodaySafe(l.followup);
    if(status==='parados')return isOpenStage(l.etapa)&&daysSinceSafe(l.ultimaAtualizacao||l.dataEntrada)>=stgD;
    if(status==='quentes')return leadScore(l)>=60;
    if(status==='propostas')return l.etapa==='Proposta';
    if(status==='sem_follow')return isOpenStage(l.etapa)&&!l.followup;
    return true;
  }
  function filteredLeads(){
    const q=($('#pipelineSearch')?.value||'').toLowerCase().trim();
    const pri=$('#priorityFilters .chip.active')?.dataset.filterPriority||'';
    const orig=$('#originFilters .chip.active')?.dataset.filterOrigin||'';
    const resp=$('#pipelineRespFilter')?.value||'';
    const status=$('#pipelineStatusFilters .chip.active')?.dataset.pipeStatus||localStorage.getItem(STATUS_KEY)||'todos';
    const stgD=Number($('#stagnationDays')?.value)||7;
    return safeLeads().filter(l=>{
      if(pri&&l.prioridade!==pri)return false;
      if(orig&&l.origem!==orig)return false;
      if(resp&&String(l.responsavel||'')!==resp)return false;
      if(q&&! [l.nome,l.segmento,l.responsavel,l.email,l.telefone,l.origem].some(x=>String(x||'').toLowerCase().includes(q)))return false;
      if(!matchesStatus(l,status,stgD))return false;
      return true;
    });
  }
  function ensureLayout(){
    const page=$('#pipeline');if(!page)return;page.classList.add('pipeline-v20');page.classList.toggle('pipeline-compact',localStorage.getItem(MODE_KEY)==='compact');
    const oldTitle=page.querySelector('.section-header'); if(oldTitle) oldTitle.style.display='none';
    if(!$('#pipelineV20Hero')){
      const hero=document.createElement('div');hero.id='pipelineV20Hero';hero.className='pipeline-v20-hero';hero.innerHTML=`<div class="pipeline-v20-hero-main"><div class="pipeline-v20-eyebrow">Pipeline comercial</div><h2>Avance os negócios certos, na ordem certa.</h2><p>Veja gargalos, valor aberto, forecast e próximas ações em uma tela única.</p></div><div class="pipeline-v20-hero-actions"><button class="btn btn-primary" type="button" id="pipelineNewLeadHero">Novo lead</button><button class="btn" type="button" id="pipelineConfigStages">Configurar etapas</button></div>`;
      page.prepend(hero);
    }
    if(!$('#pipelineV20Kpis')){$('#pipelineV20Hero')?.insertAdjacentHTML('afterend','<div id="pipelineV20Kpis" class="pipeline-v20-kpis"></div>')}
    if(!$('#pipelineProToolbar')){
      const toolbar=document.createElement('div');toolbar.id='pipelineProToolbar';toolbar.className='pipeline-v20-tools';toolbar.innerHTML=`<div class="pipeline-v20-status" id="pipelineStatusFilters"><button class="chip active" data-pipe-status="todos">Todos</button><button class="chip" data-pipe-status="vencidos">Vencidos</button><button class="chip" data-pipe-status="hoje">Hoje</button><button class="chip" data-pipe-status="parados">Parados</button><button class="chip" data-pipe-status="quentes">Quentes</button><button class="chip" data-pipe-status="propostas">Propostas</button><button class="chip" data-pipe-status="sem_follow">Sem follow-up</button></div><select id="pipelineRespFilter" class="pipeline-v20-select"><option value="">Todos responsáveis</option></select><span class="pipeline-v20-spacer"></span><button class="btn btn-sm" type="button" id="pipelineModeBtn">Modo detalhado</button><button class="btn btn-sm" type="button" id="pipelineRefreshBtn">Atualizar</button>`;
      const base=page.querySelector('.pipeline-toolbar');base?.insertAdjacentElement('afterend',toolbar);
    }
    ensureModals();ensureUndoToast();refreshLeadStageSelect();populateResp();syncModeBtn();
  }
  function populateResp(){const sel=$('#pipelineRespFilter');if(!sel)return;const cur=sel.value;const arr=[...new Set(safeLeads().map(l=>l.responsavel).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));sel.innerHTML='<option value="">Todos responsáveis</option>'+arr.map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('');sel.value=arr.includes(cur)?cur:'';}
  function renderSummary(list){
    const open=list.filter(l=>isOpenStage(l.etapa));const props=list.filter(l=>l.etapa==='Proposta');const stgD=Number($('#stagnationDays')?.value)||7;const stale=open.filter(l=>daysSinceSafe(l.ultimaAtualizacao||l.dataEntrada)>=stgD);const openVal=open.reduce((s,l)=>s+(Number(l.valor)||0),0);const forecast=open.reduce((s,l)=>s+(Number(l.valor)||0)*(Number(l.probabilidade||stageCfg(l.etapa).prob||0)/100),0);const hot=open.filter(l=>leadScore(l)>=60);
    const box=$('#pipelineV20Kpis');if(box)box.innerHTML=[['Abertas',open.length,'oportunidades em andamento'],['Valor aberto',brl(openVal),'sem fechados e perdidos'],['Forecast',brl(forecast),'ponderado por etapa'],['Propostas',props.length,brl(props.reduce((s,l)=>s+(Number(l.valor)||0),0))+' em negociação'],['Paradas',stale.length,hot.length+' lead(s) quentes no filtro']].map(k=>`<div class="pipeline-v20-kpi"><b>${esc(k[1])}</b><span>${esc(k[0])}</span><small>${esc(k[2])}</small></div>`).join('');
  }
  function renderBoardV20(){
    ensureIds();ensureLayout();const page=$('#pipeline');if(!page)return;const list=filteredLeads();renderSummary(list);const stgD=Number($('#stagnationDays')?.value)||7;const mode=localStorage.getItem(MODE_KEY)==='compact'?'compact':'detail';page.classList.toggle('pipeline-compact',mode==='compact');syncModeBtn();
    const stagesNow=visibleStages();const board=$('#board');if(!board)return;board.innerHTML=stagesNow.map(stage=>{
      const fl=list.filter(l=>(l.etapa||'Lead')===stage.name);const total=stageValue(fl,stage.name);const forecast=stageForecast(fl,stage.name);const stale=fl.filter(l=>isOpenStage(stage.name)&&daysSinceSafe(l.ultimaAtualizacao||l.dataEntrada)>=stgD);const alert=stale.length?`<div class="v20-col-alert">${stale.length} parado${stale.length>1?'s':''} há +${stgD} dias</div>`:'';
      return `<div class="col" data-col="${esc(stage.name)}" style="--stage-color:${esc(stage.color)}"><div class="col-header"><div class="v20-stage-bar" style="background:${esc(stage.color)}"></div><div class="v20-col-top"><div><div class="v20-col-name">${esc(stage.name)}</div><div class="v20-col-meta"><div class="v20-col-meta-row"><span>Valor aberto</span><strong>${esc(brl(total))}</strong></div><div class="v20-col-meta-row"><span>Forecast</span><strong>${esc(brl(forecast))}</strong></div></div></div><span class="v20-col-count">${fl.length}</span></div>${alert}</div><div class="col-body">${fl.map(l=>cardHTML(l,stage,stgD)).join('')}</div>${stage.name!=='Perdido'?`<button class="col-add-btn" data-add-stage="${esc(stage.name)}">+ Adicionar em ${esc(stage.name)}</button>`:''}</div>`;
    }).join('');
    initDragV20();
  }
  function cardHTML(l,stage,stgD){
    const sc=leadScore(l);const overdue=isOverdueSafe(l.followup);const stale=isOpenStage(l.etapa)&&daysSinceSafe(l.ultimaAtualizacao||l.dataEntrada)>=stgD;const tel=onlyDigits(l.telefone);const wa=tel?`https://wa.me/55${tel.replace(/^55/,'')}`:'';const call=tel?`tel:+55${tel.replace(/^55/,'')}`:'';const mail=l.email?`mailto:${esc(l.email)}`:'';
    return `<div class="kanban-card v20-card${stale?' stagnant':''}" draggable="true" data-id="${esc(l.id)}"><div class="v20-card-head"><div class="v20-card-title"><b>${esc(l.nome||'Lead sem nome')}</b><span>${esc([l.segmento,l.responsavel||'Sem responsável'].filter(Boolean).join(' · '))}</span></div><span class="v20-card-score ${scoreClass(sc)}">${sc}</span></div><div class="v20-next"><strong>Próxima ação:</strong> ${esc(nextAction(l))}</div><div class="v20-card-tags">${tagHTML('prioridade',l.prioridade||'Média')}${l.origem?tagHTML('origem',l.origem):''}<span class="v20-card-value">${esc(brl(l.valor||0))}</span></div>${l.followup?`<div class="followup-badge${overdue?' overdue':''}">${overdue?'⚠️':'📅'} ${dateBR(l.followup)}</div>`:''}${stale?`<div class="v20-stagnant-text">⏱ ${daysSinceSafe(l.ultimaAtualizacao||l.dataEntrada)} dias parado</div>`:''}<div class="v20-card-actions">${wa?`<a class="v20-act wa" href="${wa}" target="_blank" title="WhatsApp">${safeIcon('ICON_WHATSAPP','W')}</a>`:''}${call?`<a class="v20-act" href="${call}" title="Ligar">${safeIcon('ICON_CALL','☎')}</a>`:''}${mail?`<a class="v20-act" href="${mail}" title="E-mail">${safeIcon('ICON_MAIL','@')}</a>`:''}<button class="v20-act" data-v20-follow="${esc(l.id)}" title="Criar follow-up">📅</button><button class="v20-act" data-v20-edit="${esc(l.id)}" title="Editar">${safeIcon('ICON_EDIT','✎')}</button></div></div>`;
  }
  function safeIcon(name,fallback){try{return eval(name)||fallback}catch(e){return fallback}}
  function tagHTML(kind,val){try{if(kind==='prioridade'&&typeof priorityTag==='function')return priorityTag(val);if(kind==='origem'&&typeof originTag==='function')return originTag(val)}catch(e){}return `<span class="tag tag-neutro">${esc(val)}</span>`}
  function getDragAfter(container,y){return [...container.querySelectorAll('.kanban-card:not(.dragging)')].reduce((closest,child)=>{const box=child.getBoundingClientRect();const offset=y-box.top-box.height/2;return offset<0&&offset>closest.offset?{offset,element:child}:closest},{offset:Number.NEGATIVE_INFINITY,element:null}).element}
  function initDragV20(){
    $$('#pipeline .kanban-card.v20-card').forEach(card=>{
      card.addEventListener('click',e=>{if(e.target.closest('a,button'))return;openLead(leadById(card.dataset.id));});
      card.addEventListener('dragstart',e=>{dragId=card.dataset.id;card.classList.add('dragging');e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',dragId)}catch(_){ }placeholder=document.createElement('div');placeholder.className='col-drop-zone';setTimeout(()=>{card.style.display='none'},0);});
      card.addEventListener('dragend',()=>{card.style.display='';card.classList.remove('dragging');$$('#pipeline .col').forEach(c=>c.classList.remove('v20-drop-active'));if(placeholder){placeholder.remove();placeholder=null;}dragId=null;});
    });
    $$('#pipeline .col').forEach(col=>{const body=col.querySelector('.col-body');col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('v20-drop-active');if(!placeholder)return;const after=getDragAfter(body,e.clientY);after?body.insertBefore(placeholder,after):body.appendChild(placeholder);});col.addEventListener('dragleave',e=>{if(!col.contains(e.relatedTarget)){col.classList.remove('v20-drop-active')}});col.addEventListener('drop',e=>{e.preventDefault();col.classList.remove('v20-drop-active');const id=dragId||e.dataTransfer.getData('text/plain');const target=col.dataset.col;const after=placeholder?.nextElementSibling?.dataset?.id||'';handleDrop(id,target,after);});});
  }
  function handleDrop(id,targetStage,insertBeforeId){const l=leadById(id);if(!l||!targetStage)return;const oldStage=l.etapa; if(targetStage==='Fechado'){pendingMove={id,targetStage,insertBeforeId,oldStage};openCloseModal(l);return;} if(targetStage==='Perdido'){pendingMove={id,targetStage,insertBeforeId,oldStage};openLossModal(l);return;} moveLead(id,targetStage,insertBeforeId,true);}
  function moveLead(id,targetStage,insertBeforeId,allowUndo,extras={}){
    const arr=safeLeads();const idx=arr.findIndex(l=>String(l.id)===String(id));if(idx<0)return;const lead=arr[idx];const old={...lead,atividades:Array.isArray(lead.atividades)?[...lead.atividades]:lead.atividades};const oldIndex=idx;arr.splice(idx,1);const oldStage=lead.etapa;lead.etapa=targetStage;lead.probabilidade=stageCfg(targetStage).prob;lead.ultimaAtualizacao=today();Object.assign(lead,extras);if(oldStage!==targetStage)addActivity(lead,'Etapa',`Movido de ${oldStage||'—'} para ${targetStage}`);let targetIndex=insertBeforeId?arr.findIndex(l=>String(l.id)===String(insertBeforeId)):-1;if(targetIndex<0)arr.push(lead);else arr.splice(targetIndex,0,lead);saveData();if(allowUndo){lastMove={id,old,oldIndex};showUndo(`${lead.nome||'Lead'} movido para ${targetStage}`)}renderBoardV20();try{typeof renderAll==='function'&&setTimeout(()=>{try{renderLeadsTable&&renderLeadsTable()}catch(e){}},20)}catch(e){}
  }
  function showUndo(text){const box=$('#pipelineUndoToast');if(!box)return;box.querySelector('span').textContent=text;box.classList.add('show');clearTimeout(undoTimer);undoTimer=setTimeout(()=>box.classList.remove('show'),6500)}
  function undoMove(){if(!lastMove)return;const arr=safeLeads();const i=arr.findIndex(l=>String(l.id)===String(lastMove.id));if(i>-1)arr.splice(i,1);arr.splice(Math.min(lastMove.oldIndex,arr.length),0,lastMove.old);saveData();lastMove=null;$('#pipelineUndoToast')?.classList.remove('show');renderBoardV20();try{typeof showToast==='function'&&showToast('Movimento desfeito','success')}catch(e){}}
  function ensureUndoToast(){if($('#pipelineUndoToast'))return;document.body.insertAdjacentHTML('beforeend','<div id="pipelineUndoToast"><span>Movido</span><button type="button" id="pipelineUndoBtn">Desfazer</button></div>');$('#pipelineUndoBtn').addEventListener('click',undoMove)}
  function ensureModals(){
    if(!$('#pipelineCloseModal'))document.body.insertAdjacentHTML('beforeend',`<div class="modal-overlay hidden" id="pipelineCloseModal"><div class="modal-box"><div class="modal-head"><h3>Confirmar fechamento</h3><button class="modal-close" type="button" data-v20-close-modal="pipelineCloseModal">×</button></div><div class="modal-body"><p class="v20-modal-note">Complete os dados do fechamento antes de mandar para Fechado.</p><div class="modal-grid"><div class="field"><label>Valor final</label><input id="v20CloseValue" type="number" min="0" step="100"></div><div class="field"><label>Data de fechamento</label><input id="v20CloseDate" type="date"></div><div class="field full"><label>Próximo passo pós-venda</label><input id="v20CloseNext" placeholder="Ex: enviar contrato, onboarding, apresentação"></div><div class="field full"><label>Observação</label><textarea id="v20CloseObs" rows="3" placeholder="Detalhes do fechamento..."></textarea></div><label class="field full" style="display:flex;grid-template-columns:auto 1fr;align-items:center;gap:8px"><input id="v20CloseClient" type="checkbox" checked> Transformar em cliente / manter visível em Clientes</label></div></div><div class="modal-foot"><button class="btn" type="button" data-v20-close-modal="pipelineCloseModal">Cancelar</button><button class="btn btn-primary" type="button" id="v20CloseConfirm">Confirmar fechamento</button></div></div></div>`);
    if(!$('#pipelineLossModal'))document.body.insertAdjacentHTML('beforeend',`<div class="modal-overlay hidden" id="pipelineLossModal"><div class="modal-box"><div class="modal-head"><h3>Registrar perda</h3><button class="modal-close" type="button" data-v20-close-modal="pipelineLossModal">×</button></div><div class="modal-body"><p class="v20-modal-note">Registrar a perda ajuda a melhorar abordagem, preço e follow-up.</p><div class="modal-grid"><div class="field"><label>Motivo</label><select id="v20LossReason"><option>Preço</option><option>Concorrente</option><option>Sem fit</option><option>Timing errado</option><option>Sem resposta</option><option>Orçamento</option><option>Outro</option></select></div><div class="field"><label>Reativar em</label><select id="v20LossReact"><option value="">Não reativar</option><option value="30">30 dias</option><option value="60">60 dias</option><option value="90">90 dias</option></select></div><div class="field full"><label>Concorrente</label><input id="v20LossCompetitor" placeholder="Opcional"></div><div class="field full"><label>Aprendizado</label><textarea id="v20LossLearn" rows="3" placeholder="O que podemos melhorar na próxima abordagem?"></textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-v20-close-modal="pipelineLossModal">Cancelar</button><button class="btn btn-danger" type="button" id="v20LossConfirm">Registrar perda</button></div></div></div>`);
    if(!$('#pipelineStageModal'))document.body.insertAdjacentHTML('beforeend',`<div class="modal-overlay hidden" id="pipelineStageModal"><div class="modal-box" style="width:min(760px,100%)"><div class="modal-head"><h3>Configurar etapas do Pipeline</h3><button class="modal-close" type="button" data-v20-close-modal="pipelineStageModal">×</button></div><div class="modal-body"><p class="v20-modal-note">Arraste as linhas para ordenar. Ajuste nome, probabilidade, cor e visibilidade.</p><div class="v20-stage-list" id="v20StageList"></div><button class="btn btn-sm" type="button" id="v20AddStage">+ Nova etapa</button></div><div class="modal-foot"><button class="btn" type="button" id="v20ResetStages">Restaurar padrão</button><button class="btn btn-primary" type="button" id="v20SaveStages">Salvar etapas</button></div></div></div>`);
  }
  function openCloseModal(l){$('#v20CloseValue').value=Number(l.valor)||0;$('#v20CloseDate').value=today();$('#v20CloseNext').value='';$('#v20CloseObs').value='';$('#v20CloseClient').checked=true;$('#pipelineCloseModal').classList.remove('hidden')}
  function openLossModal(l){$('#v20LossReason').value='Preço';$('#v20LossReact').value='';$('#v20LossCompetitor').value='';$('#v20LossLearn').value='';$('#pipelineLossModal').classList.remove('hidden')}
  function closeModal(id){$('#'+id)?.classList.add('hidden');pendingMove=null;renderBoardV20()}
  function confirmClose(){if(!pendingMove)return;const l=leadById(pendingMove.id);if(!l)return;const obs=$('#v20CloseObs').value.trim();const next=$('#v20CloseNext').value.trim();const extras={valor:Number($('#v20CloseValue').value)||Number(l.valor)||0,dataFechamento:$('#v20CloseDate').value||today(),proximaAcao:next,cliente:$('#v20CloseClient').checked};if(obs)extras.obs=((l.obs||'')+'\nFechamento: '+obs).trim();$('#pipelineCloseModal').classList.add('hidden');moveLead(pendingMove.id,'Fechado',pendingMove.insertBeforeId,true,extras);pendingMove=null;try{typeof showToast==='function'&&showToast('Fechamento registrado','success')}catch(e){}}
  function confirmLoss(){if(!pendingMove)return;const l=leadById(pendingMove.id);if(!l)return;const react=Number($('#v20LossReact').value)||0;const reason=$('#v20LossReason').value;const learn=$('#v20LossLearn').value.trim();const comp=$('#v20LossCompetitor').value.trim();const extras={motivoPerda:reason,concorrente:comp,aprendizadoPerda:learn,followup:react?addDays(react):'',dataPerda:today()};if(learn)extras.obs=((l.obs||'')+'\nAprendizado da perda: '+learn).trim();$('#pipelineLossModal').classList.add('hidden');moveLead(pendingMove.id,'Perdido',pendingMove.insertBeforeId,true,extras);pendingMove=null;try{typeof showToast==='function'&&showToast('Perda registrada','success')}catch(e){}}
  function renderStageRows(){const box=$('#v20StageList');if(!box)return;box.innerHTML=loadStages().map(s=>`<div class="v20-stage-row" draggable="true" data-stage-id="${esc(s.id)}"><div class="v20-stage-handle">⋮⋮</div><input type="text" data-stage-field="name" value="${esc(s.name)}"><input type="number" data-stage-field="prob" value="${Number(s.prob)||0}" min="0" max="100"><input type="color" data-stage-field="color" value="${esc(s.color)}"><label class="v20-stage-visible"><input type="checkbox" data-stage-field="visible" ${s.visible!==false?'checked':''}> Ver</label><button class="btn btn-xs btn-danger" type="button" data-v20-remove-stage>Excluir</button></div>`).join('');initStageRowDrag();}
  function initStageRowDrag(){let row=null;$$('#v20StageList .v20-stage-row').forEach(r=>{r.addEventListener('dragstart',()=>{row=r;r.classList.add('dragging')});r.addEventListener('dragend',()=>{row?.classList.remove('dragging');row=null});r.addEventListener('dragover',e=>{e.preventDefault();const after=[...$('#v20StageList').querySelectorAll('.v20-stage-row:not(.dragging)')].find(el=>e.clientY<el.getBoundingClientRect().top+el.offsetHeight/2);after?$('#v20StageList').insertBefore(row,after):$('#v20StageList').appendChild(row);});});}
  function saveStageModal(){const previous=loadStages();const oldNameById={};previous.forEach(s=>oldNameById[s.id]=s.name);const rows=$$('#v20StageList .v20-stage-row');const arr=rows.map((r,i)=>({id:r.dataset.stageId||('st_'+Date.now()+i),name:$('[data-stage-field="name"]',r).value.trim()||'Etapa',prob:Number($('[data-stage-field="prob"]',r).value)||0,color:$('[data-stage-field="color"]',r).value||'#2563eb',visible:$('[data-stage-field="visible"]',r).checked,order:i}));arr.forEach(s=>{const old=oldNameById[s.id];if(old&&old!==s.name){safeLeads().forEach(l=>{if(l.etapa===old){l.etapa=s.name;l.probabilidade=s.prob;l.ultimaAtualizacao=today();}})}});saveStages(arr);saveData();$('#pipelineStageModal').classList.add('hidden');renderBoardV20();try{typeof showToast==='function'&&showToast('Etapas atualizadas','success')}catch(e){}}
  function openStageModal(){ensureModals();renderStageRows();$('#pipelineStageModal').classList.remove('hidden')}
  function syncModeBtn(){const btn=$('#pipelineModeBtn');if(btn)btn.textContent=localStorage.getItem(MODE_KEY)==='compact'?'Modo compacto':'Modo detalhado'}
  function bindOnce(){if(document.body.dataset.pipelineV20Bound)return;document.body.dataset.pipelineV20Bound='1';document.addEventListener('click',e=>{
      const status=e.target.closest('[data-pipe-status]');if(status){e.preventDefault();$$('#pipelineStatusFilters .chip').forEach(b=>b.classList.toggle('active',b===status));localStorage.setItem(STATUS_KEY,status.dataset.pipeStatus);renderBoardV20();return;}
      if(e.target.closest('#pipelineModeBtn')){e.preventDefault();localStorage.setItem(MODE_KEY,localStorage.getItem(MODE_KEY)==='compact'?'detail':'compact');renderBoardV20();return;}
      if(e.target.closest('#pipelineRefreshBtn')){e.preventDefault();renderBoardV20();return;}
      if(e.target.closest('#pipelineConfigStages')){e.preventDefault();openStageModal();return;}
      if(e.target.closest('#pipelineNewLeadHero')){e.preventDefault();try{openModal(null,'Lead')}catch(_){try{setView('novo-lead')}catch(e){}}return;}
      const edit=e.target.closest('[data-v20-edit]');if(edit){e.preventDefault();e.stopPropagation();editLead(leadById(edit.dataset.v20Edit));return;}
      const follow=e.target.closest('[data-v20-follow]');if(follow){e.preventDefault();e.stopPropagation();const l=leadById(follow.dataset.v20Follow);if(l){l.followup=addDays(1);l.proximaAcao='Follow-up criado pelo Pipeline';l.ultimaAtualizacao=today();saveData();renderBoardV20();try{typeof showToast==='function'&&showToast('Follow-up criado para amanhã','success')}catch(e){}}return;}
      const add=e.target.closest('#pipeline .col-add-btn');if(add){e.preventDefault();try{openModal(null,add.dataset.addStage)}catch(_){try{setView('novo-lead')}catch(e){}}return;}
      const closer=e.target.closest('[data-v20-close-modal]');if(closer){e.preventDefault();closeModal(closer.dataset.v20CloseModal);return;}
      if(e.target.closest('#v20CloseConfirm')){e.preventDefault();confirmClose();return;}
      if(e.target.closest('#v20LossConfirm')){e.preventDefault();confirmLoss();return;}
      if(e.target.closest('#v20AddStage')){e.preventDefault();const box=$('#v20StageList');box?.insertAdjacentHTML('beforeend',`<div class="v20-stage-row" draggable="true" data-stage-id="st_${Date.now()}"><div class="v20-stage-handle">⋮⋮</div><input type="text" data-stage-field="name" value="Nova etapa"><input type="number" data-stage-field="prob" value="20" min="0" max="100"><input type="color" data-stage-field="color" value="#2563eb"><label class="v20-stage-visible"><input type="checkbox" data-stage-field="visible" checked> Ver</label><button class="btn btn-xs btn-danger" type="button" data-v20-remove-stage>Excluir</button></div>`);initStageRowDrag();return;}
      if(e.target.closest('[data-v20-remove-stage]')){e.preventDefault();e.target.closest('.v20-stage-row')?.remove();return;}
      if(e.target.closest('#v20SaveStages')){e.preventDefault();saveStageModal();return;}
      if(e.target.closest('#v20ResetStages')){e.preventDefault();localStorage.removeItem(STAGE_KEY);renderStageRows();return;}
    },true);
    document.addEventListener('change',e=>{if(e.target.closest('#pipelineRespFilter'))renderBoardV20(); if(e.target.closest('#stagnationDays'))setTimeout(renderBoardV20,20);},true);
    document.addEventListener('input',e=>{if(e.target.closest('#pipelineSearch'))setTimeout(renderBoardV20,20);},true);
  }
  function patch(){try{window.renderBoard=renderBoardV20;renderBoard=renderBoardV20}catch(e){}try{window.initDrag=initDragV20;initDrag=initDragV20}catch(e){}try{const old=window.setView||setView;if(typeof old==='function'&&!old.__pipelineV20){const w=function(v){const out=old.apply(this,arguments);if(v==='pipeline')setTimeout(renderBoardV20,60);return out};w.__pipelineV20=true;window.setView=w;try{setView=w}catch(e){}}}catch(e){}try{const old=window.renderAll||renderAll;if(typeof old==='function'&&!old.__pipelineV20){const w=function(){const out=old.apply(this,arguments);setTimeout(renderBoardV20,80);return out};w.__pipelineV20=true;window.renderAll=w;try{renderAll=w}catch(e){}}}catch(e){}
  }
  function init(){ensureIds();ensureLayout();bindOnce();patch();const status=localStorage.getItem(STATUS_KEY)||'todos';$$('#pipelineStatusFilters .chip').forEach(b=>b.classList.toggle('active',b.dataset.pipeStatus===status));renderBoardV20();setTimeout(renderBoardV20,400)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.renderPipelineV20=renderBoardV20;
})();
