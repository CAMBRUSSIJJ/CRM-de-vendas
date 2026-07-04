/* Script original 01 */
/* ═══════════════════════════════════════════════════════════════
   CRM PRO PATCH — melhorias aplicadas sem backend externo
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const CRM_PATCH_VERSION='2026.06.29-pro';
const STAGE_PROB={Lead:10,Contato:30,Proposta:65,Fechado:100,Perdido:0};
const STAGE_COLORS={Lead:'#6366f1',Contato:'#f59e0b',Proposta:'#06b6d4',Fechado:'#22c55e',Perdido:'#ef4444'};
const VALID_PRI=['Alta','Média','Baixa'];
const clean=(v)=>String(v??'').trim();
const esc=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const onlyDigits=(v)=>String(v||'').replace(/\D/g,'');
const uid=()=> 'lead_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
const parseDate=(d)=>{if(!d)return null;const x=new Date(String(d).slice(0,10)+'T12:00:00');return Number.isNaN(x.getTime())?null:x;};
const daysBetween=(a,b)=>{const da=parseDate(a),db=parseDate(b);if(!da||!db)return 0;return Math.max(0,Math.round((db-da)/864e5));};
const leadBy=(ref)=>{if(!ref)return null;if(typeof ref==='object')return ref;return leads.find(l=>l.id===ref)||leads.find(l=>l.nome===ref)||null;};
const safeStageTag=(e)=>{const m={Lead:'tag-lead',Contato:'tag-contato',Proposta:'tag-proposta',Fechado:'tag-fechado',Perdido:'tag-perdido'};return `<span class="tag ${m[e]||'tag-neutro'}">${esc(e||'Lead')}</span>`;};
const safePriorityTag=(p)=>{const m={Alta:'tag-alta',Média:'tag-media',Baixa:'tag-baixa'};return `<span class="tag ${m[p]||'tag-neutro'}">${esc(p||'Média')}</span>`;};
const safeOriginTag=(o)=>{if(!o)return '';const m={Inbound:'tag-inbound',Outbound:'tag-outbound','Indicação':'tag-indicacao',Outro:'tag-neutro'};return `<span class="tag ${m[o]||'tag-neutro'}">${esc(o)}</span>`;};
function normalizeAll(){
  const used=new Set();
  leads.forEach((l,i)=>{
    if(!l || typeof l!=='object')return;
    l.nome=clean(l.nome)||`Lead ${i+1}`;
    l.segmento=clean(l.segmento);
    l.responsavel=clean(l.responsavel)||'Não definido';
    l.telefone=clean(l.telefone);
    l.email=clean(l.email).toLowerCase();
    l.etapa=stages.includes(l.etapa)?l.etapa:'Lead';
    l.prioridade=VALID_PRI.includes(l.prioridade)?l.prioridade:'Média';
    l.valor=Number(l.valor)||0;
    l.dataEntrada=l.dataEntrada||l.criadoEm||todayStr();
    l.criadoEm=l.criadoEm||l.dataEntrada||todayStr();
    l.ultimaAtualizacao=l.ultimaAtualizacao||l.dataEntrada||todayStr();
    l.origem=clean(l.origem)||'Outro';
    l.followup=l.followup||'';
    l.obs=clean(l.obs);
    l.motivoPerda=clean(l.motivoPerda);
    l.probabilidade=Number.isFinite(Number(l.probabilidade))?Number(l.probabilidade):STAGE_PROB[l.etapa];
    if(l.etapa==='Fechado'&&!l.dataFechamento)l.dataFechamento=l.ultimaAtualizacao||todayStr();
    if(!Array.isArray(l.atividades))l.atividades=[];
    l.atividades=l.atividades.map((a,idx)=>({
      id:a.id||('at_'+Date.now().toString(36)+'_'+idx),
      tipo:clean(a.tipo)||'Nota',
      texto:clean(a.texto),
      autor:clean(a.autor)||'Você',
      data:a.data||new Date().toISOString()
    }));
    let id=clean(l.id);
    if(!id||used.has(id)){id=uid();}
    l.id=id;used.add(id);
  });
  try{localStorage.setItem('outbounder_patch_version',CRM_PATCH_VERSION);}catch(e){}
  try{saveLeads();}catch(e){}
}
function replaceElement(id){const el=document.getElementById(id);if(!el)return null;const clone=el.cloneNode(true);el.parentNode.replaceChild(clone,el);return clone;}
function clearFieldErrors(root=document){root.querySelectorAll('.field.invalid').forEach(f=>f.classList.remove('invalid'));}
function fieldError(input,msg){const field=input?.closest?.('.field');if(!field)return;let e=field.querySelector('.field-error');if(!e){e=document.createElement('div');e.className='field-error';field.appendChild(e);}e.textContent=msg;field.classList.add('invalid');}
function validateLeadData(d,root=document){
  clearFieldErrors(root);let ok=true;
  const nome=root.querySelector('#mNome,[name="nome"]');const seg=root.querySelector('#mSegmento,[name="segmento"]');const email=root.querySelector('#mEmail,[name="email"]');
  if(!d.nome){fieldError(nome,'Informe o nome do lead.');ok=false;}
  if(!d.segmento){fieldError(seg,'Informe o segmento.');ok=false;}
  if(d.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)){fieldError(email,'E-mail inválido.');ok=false;}
  const duplicate=leads.find(l=>l.id!==d.id&&((d.email&&l.email===d.email)||(d.telefone&&onlyDigits(l.telefone)&&onlyDigits(l.telefone)===onlyDigits(d.telefone))));
  if(duplicate){showToast(`Possível duplicidade com ${duplicate.nome}`,'warn');}
  return ok;
}
function getModalDataPatched(){return{
  id:editingNome||'',
  nome:clean(document.getElementById('mNome')?.value),
  segmento:clean(document.getElementById('mSegmento')?.value),
  responsavel:clean(document.getElementById('mResponsavel')?.value)||'Não definido',
  telefone:clean(document.getElementById('mTelefone')?.value),
  email:clean(document.getElementById('mEmail')?.value).toLowerCase(),
  etapa:document.getElementById('mEtapa')?.value||'Lead',
  prioridade:document.getElementById('mPrioridade')?.value||'Média',
  valor:Number(document.getElementById('mValor')?.value)||0,
  dataEntrada:document.getElementById('mData')?.value||todayStr(),
  origem:document.getElementById('mOrigem')?.value||'Outro',
  followup:document.getElementById('mFollowup')?.value||'',
  obs:clean(document.getElementById('mObs')?.value)
};}
normalizeAll();

// Funções centrais reescritas com ID único e sanitização
try{calcScore=function(l){
  const base=STAGE_PROB[l.etapa]||0;
  const pri={Alta:22,Média:12,Baixa:4}[l.prioridade]||8;
  const valor=Math.min(24,Math.round((Number(l.valor)||0)/1000));
  const atraso=l.followup&&isOverdue(l.followup)?-15:0;
  const parado=Math.max(0,14-daysSince(l.ultimaAtualizacao||l.dataEntrada));
  return Math.max(0,Math.min(100,Math.round(base*.55+pri+valor+parado+atraso)));
};}catch(e){}
try{addAtividade=function(ref,tipo,texto,autor){
  const l=leadBy(ref);if(!l)return;
  if(!Array.isArray(l.atividades))l.atividades=[];
  l.atividades.unshift({id:'at_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),tipo:clean(tipo)||'Nota',texto:clean(texto),autor:clean(autor)||'Você',data:new Date().toISOString()});
};}catch(e){}
try{applyStageChange=function(ref,novaEtapa,extra){
  const lead=leadBy(ref);if(!lead||!stages.includes(novaEtapa))return;
  const antiga=lead.etapa;
  lead.etapa=novaEtapa;
  lead.probabilidade=STAGE_PROB[novaEtapa]??lead.probabilidade;
  lead.ultimaAtualizacao=todayStr();
  if(novaEtapa==='Fechado'&&!lead.dataFechamento)lead.dataFechamento=todayStr();
  if(novaEtapa!=='Fechado')delete lead.dataFechamento;
  if(extra)Object.assign(lead,extra);
  if(antiga!==novaEtapa){
    addAtividade(lead.id,'Etapa',`${antiga||'—'} → ${novaEtapa}`);
    if(typeof runAutomations==='function')runAutomations(lead,novaEtapa);
  }
};}catch(e){}

// Modal de lead com ID único
try{openModal=function(lead,defStage){
  const l=leadBy(lead?.id||lead?.nome||lead);
  editingNome=l?l.id:null;
  document.getElementById('modalTitle').textContent=l?'Editar lead':'Novo lead';
  document.getElementById('mNome').value=l?.nome||'';
  document.getElementById('mSegmento').value=l?.segmento||'';
  document.getElementById('mResponsavel').value=l?.responsavel||'';
  document.getElementById('mTelefone').value=l?.telefone||'';
  document.getElementById('mEmail').value=l?.email||'';
  document.getElementById('mEtapa').value=l?.etapa||defStage||'Lead';
  document.getElementById('mPrioridade').value=l?.prioridade||'Média';
  document.getElementById('mValor').value=l?.valor!==undefined?l.valor:'';
  document.getElementById('mData').value=l?.dataEntrada||todayStr();
  document.getElementById('mOrigem').value=l?.origem||'Outro';
  document.getElementById('mFollowup').value=l?.followup||'';
  document.getElementById('mObs').value=l?.obs||'';
  const del=document.getElementById('modalDelete');if(del)del.style.display=l?'inline-flex':'none';
  clearFieldErrors(document.getElementById('modalBackdrop'));
  document.getElementById('modalBackdrop').classList.remove('hidden');
  setTimeout(()=>document.getElementById('mNome')?.focus(),60);
};}catch(e){}
const modalSaveBtn=replaceElement('modalSave');
modalSaveBtn?.addEventListener('click',()=>{
  const d=getModalDataPatched();
  if(!validateLeadData(d,document.getElementById('modalBackdrop')))return;
  const l=editingNome?leadBy(editingNome):null;
  if(l){
    const oldStage=l.etapa;
    Object.assign(l,d,{id:l.id,criadoEm:l.criadoEm||d.dataEntrada});
    if(oldStage!==d.etapa)applyStageChange(l.id,d.etapa);else{l.ultimaAtualizacao=todayStr();addAtividade(l.id,'Nota','Cadastro atualizado.');}
    showToast('Lead atualizado','success');
  }else{
    const novo={...d,id:uid(),criadoEm:d.dataEntrada||todayStr(),ultimaAtualizacao:todayStr(),probabilidade:STAGE_PROB[d.etapa],motivoPerda:'',atividades:[]};
    if(novo.etapa==='Fechado')novo.dataFechamento=todayStr();
    leads.unshift(novo);addAtividade(novo.id,'Nota','Lead cadastrado.');showToast('Lead criado','success');
  }
  normalizeAll();saveLeads();document.getElementById('modalBackdrop').classList.add('hidden');renderAll();
});
const modalDelBtn=replaceElement('modalDelete');
modalDelBtn?.addEventListener('click',()=>{const l=leadBy(editingNome);if(!l)return;if(!confirm(`Excluir ${l.nome}?`))return;const i=leads.findIndex(x=>x.id===l.id);if(i>-1)leads.splice(i,1);saveLeads();document.getElementById('modalBackdrop').classList.add('hidden');renderAll();showToast('Lead excluído','warn');});

// Formulário de novo lead
const form=replaceElement('leadForm');
form?.addEventListener('submit',e=>{
  e.preventDefault();const fd=new FormData(e.target);
  const d={nome:clean(fd.get('nome')),segmento:clean(fd.get('segmento')),responsavel:clean(fd.get('responsavel'))||'Não definido',telefone:clean(fd.get('telefone')),email:clean(fd.get('email')).toLowerCase(),etapa:fd.get('etapa')||'Lead',prioridade:fd.get('prioridade')||'Média',valor:Number(fd.get('valor'))||0,dataEntrada:todayStr(),criadoEm:todayStr(),origem:fd.get('origem')||'Outro',followup:fd.get('followup')||'',obs:clean(fd.get('obs')),motivoPerda:'',atividades:[]};
  if(!validateLeadData(d,e.target))return;
  d.id=uid();d.ultimaAtualizacao=todayStr();d.probabilidade=STAGE_PROB[d.etapa];if(d.etapa==='Fechado')d.dataFechamento=todayStr();
  leads.unshift(d);addAtividade(d.id,'Nota','Lead cadastrado pelo formulário rápido.');saveLeads();e.target.reset();renderAll();setView('leads');showToast('Lead criado','success');
});

// Timeline e detalhe
try{renderTimeline=function(ref){
  const l=leadBy(ref);if(!l)return;const list=Array.isArray(l.atividades)?l.atividades:[];const tl=document.getElementById('tlList');if(!tl)return;
  if(!list.length){tl.innerHTML='<div class="tl-empty">Nenhuma atividade registrada ainda</div>';return;}
  tl.innerHTML=list.map(a=>{const isAuto=a.tipo==='Automação',isEtapa=a.tipo==='Etapa';const icon=ACT_ICONS[a.tipo]||ICON_NOTE;return `<div class="tl-item"><div class="tl-icon${isAuto?' tl-auto':''}${isEtapa?' tl-etapa':''}">${icon}</div><div class="tl-body"><div class="tl-row1"><span class="tl-type">${esc(a.tipo)}</span><span class="tl-time">${esc(timeAgo(a.data))}</span></div>${a.texto?`<div class="tl-text">${esc(a.texto)}</div>`:''}<div class="tl-author">${esc(a.autor||'Você')}</div></div></div>`;}).join('');
};}catch(e){}
try{openDetail=function(ref){
  const l=leadBy(ref);if(!l)return;detNome=l.id;detTlTipo='Nota';
  document.querySelectorAll('#tlQuickBtns .tl-qbtn').forEach(x=>x.classList.toggle('active',x.dataset.tlTipo==='Nota'));
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('dNome',l.nome);document.getElementById('dEtapaTag').innerHTML=safeStageTag(l.etapa);document.getElementById('dPriorityBadge').innerHTML=safePriorityTag(l.prioridade||'Média');
  set('dDataEntrada',l.dataEntrada?'Entrada: '+fmtDate(l.dataEntrada):'');set('dSegmento',l.segmento||'—');set('dResponsavel',l.responsavel||'—');set('dTelefone',l.telefone||'—');set('dEmail',l.email||'—');set('dValor',money(l.valor));set('dEtapa',l.etapa);set('dObs',l.obs||'—');
  const ex=document.getElementById('dExtra');if(ex){const prob=Number(l.probabilidade??STAGE_PROB[l.etapa]);ex.innerHTML=`${l.origem?`<div class="dp-field"><label>Origem</label><p>${safeOriginTag(l.origem)}</p></div>`:''}<div class="dp-field"><label>Probabilidade</label><p><span class="crm-prob"><span style="width:${prob}%"></span></span> ${prob}%</p></div>${l.followup?`<div class="dp-field"><label>Follow-up</label><p style="${isOverdue(l.followup)?'color:#dc2626;font-weight:600':''}">${ICON_CALENDAR} ${fmtDate(l.followup)}${isOverdue(l.followup)?' '+ICON_ALERT:''}</p></div>`:''}${l.motivoPerda?`<div class="dp-field full"><label>Motivo da perda</label><p style="color:#dc2626">${esc(l.motivoPerda)}</p></div>`:''}${l.ultimaAtualizacao?`<div class="dp-field"><label>Última atualização</label><p>${fmtDate(l.ultimaAtualizacao)}</p></div>`:''}`;}
  const ti=document.getElementById('tlInput');if(ti)ti.value='';renderTimeline(l.id);
  document.getElementById('dEditBtn').onclick=()=>{document.getElementById('detailBackdrop').classList.add('hidden');openModal(l);};
  document.getElementById('dDeleteBtn').onclick=()=>{if(!confirm(`Excluir ${l.nome}?`))return;const i=leads.findIndex(x=>x.id===l.id);if(i>-1)leads.splice(i,1);saveLeads();document.getElementById('detailBackdrop').classList.add('hidden');renderAll();showToast('Lead excluído','warn');};
  document.getElementById('detailBackdrop').classList.remove('hidden');
};}catch(e){}
const tlSend=replaceElement('tlSendBtn');if(tlSend){tlSend.innerHTML=ICON_PLUS;tlSend.addEventListener('click',()=>{const ta=document.getElementById('tlInput');const texto=clean(ta?.value);if(!detNome||!texto)return;addAtividade(detNome,detTlTipo,texto);saveLeads();ta.value='';renderTimeline(detNome);renderKPIs();showToast('Atividade registrada','success');});}
const tlInput=replaceElement('tlInput');tlInput?.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();tlSend?.click();}});

// Tabela de leads com ID e dados escapados
try{filteredLeads=function(){return leads.filter(l=>{
  if(ltPri&&l.prioridade!==ltPri)return false;if(ltStage&&l.etapa!==ltStage)return false;
  if(ltSearch){const q=ltSearch.toLowerCase();if(![l.nome,l.segmento,l.responsavel,l.email,l.telefone,l.origem].some(f=>String(f||'').toLowerCase().includes(q)))return false;}
  return true;
}).sort((a,b)=>{let va,vb;if(ltSort==='score'){va=calcScore(a);vb=calcScore(b);}else if(ltSort==='valor'){va=a.valor||0;vb=b.valor||0;}else{va=String(a[ltSort]||'').toLowerCase();vb=String(b[ltSort]||'').toLowerCase();}return va<vb?-ltDir:va>vb?ltDir:0;});};}catch(e){}
try{updateBulkBar=function(){const bar=document.getElementById('bulkBar');if(!bar)return;bar.classList.toggle('visible',selLeads.size>0);const c=document.getElementById('bulkCount');if(c)c.textContent=selLeads.size;};}catch(e){}
try{renderLeadsTable=function(){
  const fl=filteredLeads(),total=fl.length,totalPgs=Math.max(1,Math.ceil(total/PAGE));if(ltPage>=totalPgs)ltPage=totalPgs-1;
  const paged=fl.slice(ltPage*PAGE,(ltPage+1)*PAGE),tbody=document.getElementById('clientTable');if(!tbody)return;
  tbody.innerHTML=paged.map(l=>{const sc=calcScore(l),fu=l.followup&&isOverdue(l.followup),sel=selLeads.has(l.id),tel=l.telefone||'',em=l.email||'',wn=onlyDigits(tel);const prob=Number(l.probabilidade??STAGE_PROB[l.etapa]);return `<tr data-id="${esc(l.id)}" class="${sel?'selected-row':''}">
    <td style="width:36px" data-stop="1"><input type="checkbox" class="lead-cb" data-id="${esc(l.id)}" ${sel?'checked':''}></td>
    <td style="text-align:center"><span class="score-pill ${scoreCls(sc)}">${sc}</span></td>
    <td><div style="font-weight:700;font-size:13px;color:var(--text)">${esc(l.nome)}</div><div style="font-size:11px;color:var(--text-3);margin-top:2px">${safeOriginTag(l.origem)} <span class="crm-client-status">ID ${esc(l.id.slice(-6))}</span></div></td>
    <td>${esc(l.segmento||'—')}</td><td>${safeStageTag(l.etapa)}</td><td>${safePriorityTag(l.prioridade||'Média')}<div class="crm-prob" title="Probabilidade ${prob}%" style="margin-top:6px"><span style="width:${prob}%"></span></div></td>
    <td><div style="display:flex;gap:4px">${tel?`<a href="https://wa.me/55${wn}" target="_blank" rel="noopener" class="row-action wa" data-stop="1">${ICON_WHATSAPP}</a>`:''}${tel?`<a href="tel:${esc(tel)}" class="row-action" data-stop="1">${ICON_CALL}</a>`:''}${em?`<a href="mailto:${esc(em)}" class="row-action" data-stop="1">${ICON_MAIL}</a>`:''}</div></td>
    <td style="${fu?'color:#dc2626;font-weight:700':''}">${l.followup?ICON_CALENDAR+' '+fmtDate(l.followup)+(fu?' '+ICON_ALERT:''):'—'}</td>
    <td style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700">${money(l.valor)}</td>
    <td data-stop="1"><div class="row-actions" style="opacity:1"><button class="row-action primary edit-lead-btn" data-id="${esc(l.id)}">${ICON_EDIT}</button></div></td></tr>`;}).join('');
  if(!tbody.innerHTML)tbody.innerHTML=`<tr><td colspan="10" class="crm-empty">Nenhum lead encontrado</td></tr>`;
  tbody.querySelectorAll('tr[data-id]').forEach(r=>r.addEventListener('click',e=>{if(e.target.closest('[data-stop]'))return;openDetail(r.dataset.id);}));
  tbody.querySelectorAll('.edit-lead-btn').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openModal(leadBy(b.dataset.id));}));
  tbody.querySelectorAll('.lead-cb').forEach(cb=>cb.addEventListener('change',()=>{cb.checked?selLeads.add(cb.dataset.id):selLeads.delete(cb.dataset.id);updateBulkBar();cb.closest('tr')?.classList.toggle('selected-row',cb.checked);}));
  const pgW=document.getElementById('ltPaginationWrap');if(pgW){if(totalPgs<=1){pgW.innerHTML='';}else{const showing=Math.min((ltPage+1)*PAGE,total);pgW.innerHTML=`<div class="pagination"><span class="pg-info">${ltPage*PAGE+1}–${showing} de ${total} leads</span><div class="pg-btns"><button class="pg-btn" data-pg="first" ${ltPage===0?'disabled':''}>«</button><button class="pg-btn" data-pg="prev" ${ltPage===0?'disabled':''}>‹</button><span class="pg-cur">Pág. ${ltPage+1}/${totalPgs}</span><button class="pg-btn" data-pg="next" ${ltPage>=totalPgs-1?'disabled':''}>›</button><button class="pg-btn" data-pg="last" ${ltPage>=totalPgs-1?'disabled':''}>»</button></div></div>`;pgW.querySelectorAll('[data-pg]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.pg;if(a==='first')ltPage=0;if(a==='prev')ltPage=Math.max(0,ltPage-1);if(a==='next')ltPage=Math.min(totalPgs-1,ltPage+1);if(a==='last')ltPage=totalPgs-1;renderLeadsTable();}));}}
  const sa=document.getElementById('selectAll');if(sa)sa.checked=paged.length>0&&paged.every(l=>selLeads.has(l.id));
};}catch(e){}
const selectAll=replaceElement('selectAll');selectAll?.addEventListener('change',e=>{filteredLeads().forEach(l=>e.target.checked?selLeads.add(l.id):selLeads.delete(l.id));renderLeadsTable();updateBulkBar();});
replaceElement('bulkClearBtn')?.addEventListener('click',()=>{selLeads.clear();renderLeadsTable();updateBulkBar();});
replaceElement('bulkDeleteBtn')?.addEventListener('click',()=>{if(!selLeads.size)return;if(!confirm(`Excluir ${selLeads.size} lead(s)?`))return;[...selLeads].forEach(id=>{const i=leads.findIndex(l=>l.id===id);if(i>-1)leads.splice(i,1);});selLeads.clear();saveLeads();renderAll();updateBulkBar();showToast('Leads excluídos','warn');});
replaceElement('bulkStageBtn')?.addEventListener('click',()=>document.getElementById('bulkStageBackdrop')?.classList.remove('hidden'));
replaceElement('bulkRespBtn')?.addEventListener('click',()=>{const i=document.getElementById('bulkRespInput');if(i)i.value='';document.getElementById('bulkRespBackdrop')?.classList.remove('hidden');});
replaceElement('bulkStageConfirm')?.addEventListener('click',()=>{const s=document.getElementById('bulkStageSelect')?.value||'Lead';[...selLeads].forEach(id=>applyStageChange(id,s));selLeads.clear();saveLeads();document.getElementById('bulkStageBackdrop')?.classList.add('hidden');renderAll();updateBulkBar();showToast(`Movidos para ${s}`,'success');});
replaceElement('bulkRespConfirm')?.addEventListener('click',()=>{const r=clean(document.getElementById('bulkRespInput')?.value);if(!r)return;[...selLeads].forEach(id=>{const l=leadBy(id);if(l){l.responsavel=r;l.ultimaAtualizacao=todayStr();addAtividade(l.id,'Nota',`Responsável alterado para ${r}.`);}});selLeads.clear();saveLeads();document.getElementById('bulkRespBackdrop')?.classList.add('hidden');renderAll();updateBulkBar();showToast(`Responsável → ${r}`,'success');});

// Kanban com valor ponderado, tempo parado e ID
try{renderBoard=function(){
  const stgD=parseInt(document.getElementById('stagnationDays')?.value)||7;
  const board=document.getElementById('board');if(!board)return;
  board.innerHTML=stages.map(stage=>{const fl=leads.filter(l=>{if(l.etapa!==stage)return false;if(fPri&&l.prioridade!==fPri)return false;if(fOrig&&l.origem!==fOrig)return false;if(fSearch){const q=fSearch.toLowerCase();if(![l.nome,l.segmento,l.responsavel,l.email].some(f=>String(f||'').toLowerCase().includes(q)))return false;}return true;});const total=fl.reduce((a,l)=>a+(l.valor||0),0);const weighted=fl.reduce((a,l)=>a+(l.valor||0)*(Number(l.probabilidade??STAGE_PROB[l.etapa])/100),0);return `<div class="col" data-col="${esc(stage)}"><div class="col-header"><div><div class="col-name">${esc(stage)}</div><div class="col-total">${money(total)} · pond. ${money(weighted)}</div></div><span class="col-count">${fl.length}</span></div><div class="col-body">${fl.map(l=>{const stg=stage!=='Fechado'&&stage!=='Perdido'&&daysSince(l.ultimaAtualizacao)>=stgD;const sc=calcScore(l);const fu=l.followup&&isOverdue(l.followup);return `<div class="kanban-card ${stg?'stagnant':''}" draggable="true" data-id="${esc(l.id)}"><div class="kc-top"><div class="kc-name">${esc(l.nome)}</div><button class="kc-edit edit-btn" data-id="${esc(l.id)}">${ICON_EDIT}</button></div><div class="kc-meta"><div class="kc-meta-row">${esc(l.segmento||'Sem segmento')}</div><div class="kc-meta-row">Resp.: ${esc(l.responsavel||'—')}</div><div class="crm-prob" title="Probabilidade ${Number(l.probabilidade??STAGE_PROB[l.etapa])}%"><span style="width:${Number(l.probabilidade??STAGE_PROB[l.etapa])}%"></span></div>${stg?`<div class="stagnant-badge">${ICON_ALERT} ${daysSince(l.ultimaAtualizacao)} dias sem avanço</div>`:''}${l.followup?`<div class="followup-badge ${fu?'overdue':''}">${ICON_CALENDAR} ${fmtDate(l.followup)}${fu?' vencido':''}</div>`:''}</div><div class="kc-footer">${safePriorityTag(l.prioridade||'Média')}<span class="score-pill ${scoreCls(sc)}">${sc}</span><span class="kc-value">${money(l.valor)}</span></div></div>`;}).join('')}</div><button class="col-add-btn" data-add-stage="${esc(stage)}">${ICON_PLUS} Adicionar</button></div>`;}).join('');
  initDrag();board.querySelectorAll('.kanban-card').forEach(c=>c.addEventListener('click',()=>openDetail(c.dataset.id)));board.querySelectorAll('.edit-btn').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openModal(leadBy(b.dataset.id));}));board.querySelectorAll('.col-add-btn').forEach(b=>b.addEventListener('click',()=>openModal(null,b.dataset.addStage)));
};}catch(e){}
try{initDrag=function(){let dragLead=null,placeholder=null;document.querySelectorAll('.kanban-card').forEach(card=>{card.addEventListener('dragstart',()=>{dragLead=card.dataset.id;card.classList.add('dragging');placeholder=document.createElement('div');placeholder.className='col-drop-zone';setTimeout(()=>card.style.display='none',0);});card.addEventListener('dragend',()=>{card.classList.remove('dragging');card.style.display='';placeholder?.remove();placeholder=null;dragLead=null;});});document.querySelectorAll('.col').forEach(col=>{const body=col.querySelector('.col-body');col.addEventListener('dragover',e=>{e.preventDefault();if(!placeholder)return;body.appendChild(placeholder);});col.addEventListener('drop',e=>{e.preventDefault();const ns=col.dataset.col;const idx=leads.findIndex(l=>l.id===dragLead);if(idx===-1)return;const lead=leads[idx];if(ns==='Perdido'&&lead.etapa!=='Perdido'){openLoss(lead.id);return;}applyStageChange(lead.id,ns);const [moved]=leads.splice(idx,1);leads.push(moved);saveLeads();renderAll();showToast(`${lead.nome} → ${ns}`,'success');});});};}catch(e){}
try{openLoss=function(ref){const l=leadBy(ref);lossTarget=l?l.id:ref;selReason='';document.querySelectorAll('.loss-btn').forEach(b=>b.classList.remove('selected'));const o=document.getElementById('lossOther');if(o)o.value='';document.getElementById('lossBackdrop')?.classList.remove('hidden');};}catch(e){}
replaceElement('lossConfirm')?.addEventListener('click',()=>{const l=leadBy(lossTarget);if(!l)return;const r=selReason||clean(document.getElementById('lossOther')?.value)||'Não informado';applyStageChange(l.id,'Perdido',{motivoPerda:r});addAtividade(l.id,'Nota',`Motivo da perda: ${r}`);saveLeads();document.getElementById('lossBackdrop')?.classList.add('hidden');renderAll();showToast(`Perdido: ${r}`,'danger');});

// Clientes, KPIs e listas
function avg(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0;}
function periodStart(days){const d=new Date();d.setDate(d.getDate()-Number(days||30));d.setHours(0,0,0,0);return d;}
try{renderClientTable=function(){const tbody=document.getElementById('clientTable2');if(!tbody)return;const clients=leads.filter(l=>l.etapa==='Fechado');if(!clients.length){tbody.innerHTML='<tr><td colspan="5" class="crm-empty">Nenhum cliente fechado ainda. Quando um negócio for marcado como Fechado, ele aparece aqui.</td></tr>';return;}tbody.innerHTML=clients.map(l=>`<tr data-id="${esc(l.id)}"><td><div style="display:flex;align-items:center;gap:8px"><div class="client-avatar">${esc((l.nome||'?').charAt(0).toUpperCase())}</div><div><div style="font-weight:700;font-size:13px;color:var(--text)">${esc(l.nome)}</div><div style="font-size:11px;color:var(--text-3)">${esc(l.email||'')}</div></div></div></td><td>${esc(l.segmento||'—')}</td><td><span class="crm-safe-badge">Cliente ativo</span></td><td>${esc(l.responsavel||'—')}</td><td style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700">${money(l.valor)}</td></tr>`).join('');tbody.querySelectorAll('tr[data-id]').forEach(r=>r.addEventListener('click',()=>openDetail(r.dataset.id)));};}catch(e){}
try{renderKPIs=function(){const active=leads.filter(l=>l.etapa!=='Perdido');const open=leads.filter(l=>!['Fechado','Perdido'].includes(l.etapa));const prop=leads.filter(l=>l.etapa==='Proposta').length;const clos=leads.filter(l=>l.etapa==='Fechado').length;const perdidos=leads.filter(l=>l.etapa==='Perdido').length;const pipeVal=open.reduce((a,l)=>a+(l.valor||0),0);const closVal=leads.filter(l=>l.etapa==='Fechado').reduce((a,l)=>a+(l.valor||0),0);const conv=leads.length?Math.round((clos/leads.length)*100):0;const ticket=clos?closVal/clos:0;[['kpiLeads',open.length],['kpiPropostas',prop],['kpiFechamentos',clos],['kpiPipeline',money(pipeVal)],['mKpiLeads',open.length],['mKpiProp',prop],['mKpiClose',clos],['mKpiConv',conv+'%'],['mKpiPerdidos',perdidos],['mKpiValor',money(pipeVal)],['mKpiTicket',money(ticket)],['mKpiAtivs',(typeof agEvents!=='undefined'?agEvents.filter(e=>e.data>=todayStr()).length:0)+leads.reduce((s,l)=>s+(l.atividades?.length||0),0)],['homeLeadCount',open.length],['homePropCount',prop],['homeCloseCount',clos],['navLeadsBadge',open.length]].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=v;});};}catch(e){}
try{renderOverdueList=function(){const ol=document.getElementById('overdueList');if(!ol)return;const ov=leads.filter(l=>l.followup&&isOverdue(l.followup)&&!['Fechado','Perdido'].includes(l.etapa)).sort((a,b)=>a.followup.localeCompare(b.followup)).slice(0,8);if(!ov.length){ol.innerHTML=`<div class="crm-empty">${ICON_CHECK}<br>Nenhum follow-up vencido</div>`;return;}ol.innerHTML=ov.map(l=>`<div data-id="${esc(l.id)}" style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer;gap:8px">${safeStageTag(l.etapa)}<div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--text)">${esc(l.nome)}</div><div style="font-size:11px;color:#dc2626">${ICON_CALENDAR} ${fmtDate(l.followup)} · ${daysSince(l.followup)} dia(s) vencido</div></div>${safePriorityTag(l.prioridade||'Média')}</div>`).join('');ol.querySelectorAll('[data-id]').forEach(x=>x.addEventListener('click',()=>openDetail(x.dataset.id)));};}catch(e){}

// Métricas completas com dados reais
try{renderMetrics=function(){renderKPIs();const fc=document.getElementById('funnelChart');if(fc){const max=Math.max(1,...stages.map(s=>leads.filter(l=>l.etapa===s).length));const first=Math.max(1,leads.filter(l=>l.etapa!=='Perdido').length);fc.innerHTML=stages.map(s=>{const arr=leads.filter(l=>l.etapa===s),c=arr.length,val=arr.reduce((a,l)=>a+(l.valor||0),0),pond=arr.reduce((a,l)=>a+(l.valor||0)*(Number(l.probabilidade??STAGE_PROB[l.etapa])/100),0),pct=Math.round((c/max)*100),conv=Math.round((c/first)*100);return `<div style="padding:10px 0;border-bottom:1px solid var(--border)"><div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:5px"><div style="display:flex;align-items:center;gap:8px"><span style="width:10px;height:10px;border-radius:3px;background:${STAGE_COLORS[s]}"></span><strong>${esc(s)}</strong><span style="font-size:11px;color:var(--text-3)">${conv}% da base ativa</span></div><span style="font-weight:800">${c}</span></div><div class="funnel-bar-bg"><div class="funnel-bar-fill" style="width:${Math.max(4,pct)}%;background:${STAGE_COLORS[s]}"></div></div><div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-3);margin-top:5px"><span>Total ${money(val)}</span><span>Forecast ${money(pond)}</span></div></div>`;}).join('');}
const lc=document.getElementById('lossChart');if(lc){const lost=leads.filter(l=>l.etapa==='Perdido');if(!lost.length){lc.innerHTML='<div class="crm-empty">Nenhuma perda registrada</div>';}else{const m={};lost.forEach(l=>{const k=l.motivoPerda||'Não informado';m[k]=m[k]||{n:0,v:0};m[k].n++;m[k].v+=l.valor||0;});const mx=Math.max(...Object.values(m).map(x=>x.v||x.n));lc.innerHTML=Object.entries(m).sort((a,b)=>b[1].v-a[1].v).map(([k,o])=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:var(--text-2);font-weight:600">${esc(k)}</span><strong>${o.n} · ${money(o.v)}</strong></div><div class="funnel-bar-bg"><div class="funnel-bar-fill" style="width:${Math.max(6,Math.round(((o.v||o.n)/mx)*100))}%;background:#dc2626"></div></div></div>`).join('');}}
const oc=document.getElementById('originChart');if(oc){const m={};leads.forEach(l=>{const k=l.origem||'Outro';m[k]=m[k]||{n:0,v:0};m[k].n++;m[k].v+=l.valor||0;});const total=leads.length||1;oc.innerHTML=`<table class="crm-mini-table"><thead><tr><th>Origem</th><th>Leads</th><th>Valor</th><th>%</th></tr></thead><tbody>${Object.entries(m).sort((a,b)=>b[1].n-a[1].n).map(([k,o])=>`<tr><td>${safeOriginTag(k)}</td><td><strong>${o.n}</strong></td><td>${money(o.v)}</td><td>${Math.round((o.n/total)*100)}%</td></tr>`).join('')}</tbody></table>`;}}}catch(e){}

// Dashboard sem números aleatórios
try{renderDashboard=function(){const prd=Number(document.getElementById('dashPeriod')?.value||30),start=periodStart(prd);const inPeriod=(d)=>{const x=parseDate(d);return x&&x>=start;};const total=leads.length,ativos=leads.filter(l=>l.etapa!=='Perdido').length,novos=leads.filter(l=>inPeriod(l.criadoEm||l.dataEntrada)).length,perdidosN=leads.filter(l=>l.etapa==='Perdido').length,fechadosArr=leads.filter(l=>l.etapa==='Fechado'),fechados=fechadosArr.length,conv=total?((fechados/total)*100).toFixed(1):'0.0';const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};set('dkLeadsCad',total);set('dkLeadsAtivos',ativos);set('dkLeadsNovos',novos);set('dkLeadsPerdidos',perdidosN);set('dkConvGeral',conv+'%');set('dkLeadsCadD','Base total');set('dkLeadsAtivosD','Sem perdidos');set('dkLeadsNovosD','Últimos '+prd+' dias');set('dkLeadsPerdidosD','Com motivo de perda');set('dkConvGeralD','Fechados / Total');const propostas=leads.filter(l=>l.etapa==='Proposta').length,recPrev=leads.filter(l=>!['Perdido','Fechado'].includes(l.etapa)).reduce((s,l)=>s+(l.valor||0)*(Number(l.probabilidade??STAGE_PROB[l.etapa])/100),0),closVal=fechadosArr.reduce((s,l)=>s+(l.valor||0),0),ticket=fechados?closVal/fechados:0,temp=fechados?Math.round(avg(fechadosArr.map(l=>daysBetween(l.criadoEm||l.dataEntrada,l.dataFechamento||l.ultimaAtualizacao)))):0;set('dkPropostas',propostas);set('dkContratos',fechados);set('dkRecPrev',money(recPrev));set('dkTicket',money(ticket));set('dkTempFech',temp+'d');
const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],now=new Date();const data=[];for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1),key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');const val=fechadosArr.filter(l=>String(l.dataFechamento||l.ultimaAtualizacao||'').slice(0,7)===key).reduce((s,l)=>s+(l.valor||0),0);data.push({label:months[d.getMonth()],val});}const max=Math.max(1,...data.map(d=>d.val));const bc=document.getElementById('dashBarChart'),bl=document.getElementById('dashBarLabels');if(bc)bc.innerHTML=data.map(d=>`<div class="dash-bar-col"><div class="dash-bar" style="height:${Math.max(8,Math.round((d.val/max)*130))}px" data-val="${money(d.val)}"></div></div>`).join('');if(bl)bl.innerHTML=data.map(d=>`<span style="font-size:10px;color:var(--text-3);flex:1;text-align:center">${d.label}</span>`).join('');
const origins={};leads.forEach(l=>{const k=l.origem||'Outro';origins[k]=(origins[k]||0)+1;});const entries=Object.entries(origins).sort((a,b)=>b[1]-a[1]);const totO=entries.reduce((s,o)=>s+o[1],0)||1;const dnt=document.getElementById('dashDonut'),leg=document.getElementById('dashDonutLegend'),palette=['#2563eb','#16a34a','#7c3aed','#d97706','#6b7280','#0d9488'];if(dnt){let ang=-90;const cx=55,cy=55,r=40;dnt.innerHTML=entries.map(([lbl,n],i)=>{const a=(n/totO)*360,s=ang;ang+=a;const r1=s*Math.PI/180,r2=(s+a-.8)*Math.PI/180,x1=cx+r*Math.cos(r1),y1=cy+r*Math.sin(r1),x2=cx+r*Math.cos(r2),y2=cy+r*Math.sin(r2);return `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${a>180?1:0},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${palette[i%palette.length]}"/>`;}).join('')+`<circle cx="${cx}" cy="${cy}" r="24" fill="var(--surface)"/><text x="${cx}" y="${cy+4}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text)">${total}</text>`;}if(leg)leg.innerHTML=entries.map(([lbl,n],i)=>`<div class="dash-legend-item"><span class="dash-legend-dot" style="background:${palette[i%palette.length]}"></span>${esc(lbl)} <strong style="margin-left:auto">${Math.round((n/totO)*100)}%</strong></div>`).join('')||'<div class="crm-empty">Sem dados</div>';
const dp=document.getElementById('dashPipeline');if(dp){const mx=Math.max(1,...stages.map(e=>leads.filter(l=>l.etapa===e).length));dp.innerHTML=stages.map(e=>{const arr=leads.filter(l=>l.etapa===e),n=arr.length,v=arr.reduce((s,l)=>s+(l.valor||0),0),pond=arr.reduce((s,l)=>s+(l.valor||0)*(Number(l.probabilidade??STAGE_PROB[l.etapa])/100),0);return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span style="color:var(--text-2);font-weight:700">${e}</span><span style="font-weight:800">${n} <span style="font-weight:400;color:var(--text-3)">· ${money(v)}</span></span></div><div style="height:7px;border-radius:4px;background:var(--surface-3)"><div style="height:100%;border-radius:4px;background:${STAGE_COLORS[e]};width:${Math.max(5,Math.round((n/mx)*100))}%"></div></div><div class="crm-dashboard-note">Forecast: ${money(pond)}</div></div>`;}).join('');}
const act={Ligação:0,WhatsApp:0,'E-mail':0,Reunião:0,Nota:0,Etapa:0};leads.forEach(l=>(l.atividades||[]).forEach(a=>{if(!a.data||new Date(a.data)>=start)act[a.tipo]=(act[a.tipo]||0)+1;}));if(typeof agEvents!=='undefined')agEvents.filter(e=>inPeriod(e.data)).forEach(e=>{act[e.tipo]=(act[e.tipo]||0)+1;});const da=document.getElementById('dashAtividades');if(da)da.innerHTML=Object.entries(act).sort((a,b)=>b[1]-a[1]).map(([lbl,n])=>`<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)"><span style="flex:1;font-size:12.5px;color:var(--text-2)">${esc(lbl)}</span><strong style="color:var(--text)">${n}</strong></div>`).join('');
const dc=document.getElementById('dashConversao');if(dc){const active=leads.filter(l=>l.etapa!=='Perdido').length||1;const pairs=[['Lead→Contato+',leads.filter(l=>['Contato','Proposta','Fechado'].includes(l.etapa)).length],['Contato→Proposta+',leads.filter(l=>['Proposta','Fechado'].includes(l.etapa)).length],['Proposta→Fechado',fechados],['Ganho geral',fechados]];dc.innerHTML=pairs.map(([lbl,n])=>{const pct=Math.round((n/active)*100);return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:var(--text-2)">${lbl}</span><strong style="color:${pct>=60?'#16a34a':pct>=35?'#d97706':'#dc2626'}">${pct}%</strong></div><div style="height:6px;border-radius:3px;background:var(--surface-3)"><div style="height:100%;border-radius:3px;background:${pct>=60?'#16a34a':pct>=35?'#d97706':'#dc2626'};width:${Math.min(100,pct)}%"></div></div></div>`;}).join('');}
const dperf=document.getElementById('dashPerformance');if(dperf){const resp={};fechadosArr.forEach(l=>{const k=l.responsavel||'Não definido';resp[k]=resp[k]||{n:0,v:0};resp[k].n++;resp[k].v+=l.valor||0;});const topResp=Object.entries(resp).sort((a,b)=>b[1].v-a[1].v)[0];const topOrigin=entries[0];const seg={};leads.forEach(l=>{const k=l.segmento||'Sem segmento';seg[k]=(seg[k]||0)+(l.valor||0);});const topSeg=Object.entries(seg).sort((a,b)=>b[1]-a[1])[0];const hot=leads.filter(l=>!['Fechado','Perdido'].includes(l.etapa)).sort((a,b)=>calcScore(b)-calcScore(a))[0];const cards=[['🏆 Melhor responsável',topResp?topResp[0]:'—',topResp?`${topResp[1].n} venda(s) · ${money(topResp[1].v)}`:'Sem fechamentos','#fef9c3'],['🚀 Melhor origem',topOrigin?topOrigin[0]:'—',topOrigin?`${topOrigin[1]} lead(s)`:'Sem dados','#dbeafe'],['🎯 Segmento mais valioso',topSeg?topSeg[0]:'—',topSeg?money(topSeg[1]):'Sem dados','#dcfce7'],['⚡ Lead mais quente',hot?hot.nome:'—',hot?`Score ${calcScore(hot)} · ${money(hot.valor)}`:'Sem leads abertos','#ede9fe']];dperf.innerHTML=cards.map(i=>`<div style="background:${i[3]};border-radius:12px;padding:16px"><div style="font-size:11px;font-weight:800;color:#475569;margin-bottom:6px">${i[0]}</div><div style="font-size:16px;font-weight:800;color:#0f172a">${esc(i[1])}</div><div style="font-size:11.5px;color:#475569;margin-top:2px">${esc(i[2])}</div></div>`).join('');}
};}catch(e){}

// Importação / exportação profissional
function csvSplit(line){const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'&&line[i+1]==='"'){cur+='"';i++;continue;}if(ch==='"'){q=!q;continue;}if(ch===','&&!q){out.push(cur);cur='';continue;}cur+=ch;}out.push(cur);return out;}
try{processCSV=function(file){const reader=new FileReader();reader.onload=e=>{const lines=String(e.target.result||'').replace(/\r/g,'').split('\n').filter(l=>l.trim());if(lines.length<2){showToast('CSV inválido','danger');return;}const headers=csvSplit(lines[0]).map(h=>h.trim());let count=0,updated=0,dups=0;lines.slice(1).forEach(line=>{const vals=csvSplit(line),obj={};headers.forEach((h,i)=>obj[h]=clean(vals[i]));if(!obj.nome)return;const phone=onlyDigits(obj.telefone),email=clean(obj.email).toLowerCase();const ex=leads.find(l=>(email&&l.email===email)||(phone&&onlyDigits(l.telefone)===phone));const nl={id:ex?.id||uid(),nome:obj.nome,segmento:obj.segmento||'',responsavel:obj.responsavel||'Não definido',telefone:obj.telefone||'',email,etapa:stages.includes(obj.etapa)?obj.etapa:'Lead',prioridade:VALID_PRI.includes(obj.prioridade)?obj.prioridade:'Média',valor:Number(obj.valor)||0,dataEntrada:obj.dataEntrada||todayStr(),criadoEm:ex?.criadoEm||obj.criadoEm||obj.dataEntrada||todayStr(),origem:obj.origem||'Outro',followup:obj.followup||'',obs:obj.obs||'',ultimaAtualizacao:todayStr(),motivoPerda:obj.motivoPerda||'',atividades:ex?.atividades||[],probabilidade:STAGE_PROB[stages.includes(obj.etapa)?obj.etapa:'Lead']};if(ex){Object.assign(ex,nl);updated++;dups++;}else{leads.unshift(nl);count++;}});normalizeAll();saveLeads();renderAll();const ir=document.getElementById('importResult');if(ir)ir.innerHTML=`<div class="crm-alert success"><strong>${count}</strong> novo(s), <strong>${updated}</strong> atualizado(s), <strong>${dups}</strong> duplicidade(s) tratada(s).</div>`;showToast(`${count+updated} registros processados`,'success');};reader.readAsText(file,'utf-8');};}catch(e){}
try{exportCSV=function(){const cols=['id','nome','segmento','responsavel','telefone','email','etapa','prioridade','probabilidade','valor','dataEntrada','criadoEm','origem','followup','obs','motivoPerda','dataFechamento','ultimaAtualizacao'];const csv=[cols.join(','),...leads.map(l=>cols.map(k=>'"'+String(l[k]??'').replace(/"/g,'""')+'"').join(','))].join('\n');const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent('\uFEFF'+csv);a.download='outbounder_leads_profissional_'+todayStr()+'.csv';document.body.appendChild(a);a.click();a.remove();showToast('CSV profissional exportado','success');};}catch(e){}
function exportJSON(){const data={version:CRM_PATCH_VERSION,exportDate:new Date().toISOString(),leads,agenda:typeof agEvents!=='undefined'?agEvents:[],automations:typeof automations!=='undefined'?automations:[]};const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data,null,2));a.download='outbounder_backup_completo_'+todayStr()+'.json';document.body.appendChild(a);a.click();a.remove();showToast('Backup completo exportado','success');}
function printExecutiveReport(){
  const open=leads.filter(l=>!['Fechado','Perdido'].includes(l.etapa));
  const fech=leads.filter(l=>l.etapa==='Fechado');
  const perd=leads.filter(l=>l.etapa==='Perdido');
  const pipe=open.reduce((s,l)=>s+(Number(l.valor)||0),0);
  const forecast=open.reduce((s,l)=>s+(Number(l.valor)||0)*(Number(l.probabilidade??STAGE_PROB[l.etapa]??0)/100),0);
  const stageRows=stages.map(s=>{
    const arr=leads.filter(l=>l.etapa===s);
    const valor=arr.reduce((a,l)=>a+(Number(l.valor)||0),0);
    const pond=arr.reduce((a,l)=>a+(Number(l.valor)||0)*(Number(l.probabilidade??STAGE_PROB[l.etapa]??0)/100),0);
    return `<tr><td><span class="tag">${esc(s)}</span></td><td>${arr.length}</td><td>${money(valor)}</td><td>${money(pond)}</td></tr>`;
  }).join('');
  const priorityRows=(open.sort((a,b)=>calcScore(b)-calcScore(a)).slice(0,20).map(l=>`<tr><td>${esc(l.nome)}</td><td>${esc(l.etapa)}</td><td>${esc(l.prioridade||'Média')}</td><td>${esc(l.responsavel||'—')}</td><td>${l.followup?fmtDate(l.followup):'—'}</td><td class="right">${money(l.valor)}</td></tr>`).join('')) || '<tr><td colspan="6">Sem oportunidades abertas</td></tr>';
  const lossRows=(perd.map(l=>`<tr><td>${esc(l.nome)}</td><td>${esc(l.motivoPerda||'Não informado')}</td><td>${esc(l.responsavel||'—')}</td><td class="right">${money(l.valor)}</td></tr>`).join('')) || '<tr><td colspan="4">Nenhuma perda registrada</td></tr>';
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório Executivo CRM</title><style>body{font-family:Arial,sans-serif;color:#111;margin:32px}h1{margin:0 0 4px;font-size:24px}h2{font-size:15px;margin-top:26px;border-bottom:1px solid #ddd;padding-bottom:6px}.muted{color:#666;font-size:12px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:20px 0}.kpi{border:1px solid #ddd;border-radius:10px;padding:12px}.kpi b{display:block;font-size:20px;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{font-size:12px;text-align:left;border-bottom:1px solid #e5e7eb;padding:8px}th{background:#f8fafc;text-transform:uppercase;font-size:10px;color:#475569}.tag{display:inline-block;border-radius:99px;background:#eef2ff;padding:2px 7px;font-size:11px}.right{text-align:right}@media print{body{margin:18mm}.no-print{display:none}}</style></head><body><button class="no-print" onclick="print()" style="float:right;padding:8px 12px">Salvar como PDF</button><h1>Relatório Executivo — Outbounder CRM</h1><div class="muted">Gerado em ${new Date().toLocaleString('pt-BR')}</div><div class="grid"><div class="kpi"><b>${leads.length}</b>Total de leads</div><div class="kpi"><b>${open.length}</b>Oportunidades abertas</div><div class="kpi"><b>${money(pipe)}</b>Pipeline bruto</div><div class="kpi"><b>${money(forecast)}</b>Forecast ponderado</div><div class="kpi"><b>${fech.length}</b>Clientes fechados</div><div class="kpi"><b>${money(fech.reduce((s,l)=>s+(Number(l.valor)||0),0))}</b>Receita fechada</div><div class="kpi"><b>${perd.length}</b>Perdidos</div><div class="kpi"><b>${leads.length?Math.round((fech.length/leads.length)*100):0}%</b>Conversão geral</div></div><h2>Pipeline por etapa</h2><table><thead><tr><th>Etapa</th><th>Leads</th><th>Valor</th><th>Forecast</th></tr></thead><tbody>${stageRows}</tbody></table><h2>Oportunidades prioritárias</h2><table><thead><tr><th>Lead</th><th>Etapa</th><th>Prioridade</th><th>Responsável</th><th>Follow-up</th><th class="right">Valor</th></tr></thead><tbody>${priorityRows}</tbody></table><h2>Perdas registradas</h2><table><thead><tr><th>Lead</th><th>Motivo</th><th>Responsável</th><th class="right">Valor</th></tr></thead><tbody>${lossRows}</tbody></table></body></html>`;
  const w=window.open('','_blank');
  if(!w){showToast('Permita pop-ups para gerar o PDF','warn');return;}
  w.document.open();w.document.write(html);w.document.close();setTimeout(()=>w.print(),350);
}
function bindExportButtons(){['exportCsvBtn','exportCsvBtn2'].forEach(id=>{const b=replaceElement(id);b?.addEventListener('click',exportCSV);});replaceElement('exportJsonBtn')?.addEventListener('click',exportJSON);replaceElement('clearAllBtn')?.addEventListener('click',()=>{if(!confirm('Apagar TODOS os dados locais deste CRM?'))return;leads.length=0;saveLeads();renderAll();showToast('Dados limpos','warn');});}
bindExportButtons();
function injectProfessionalBlocks(){
  if(!document.getElementById('crmActionCenter')){const wrap=document.createElement('div');wrap.className='card';wrap.innerHTML=`<div class="card-header"><div><div class="card-title">Centro de prioridades</div><div class="card-sub">Ações comerciais calculadas com os dados reais do CRM</div></div><span class="crm-safe-badge">Dados locais</span></div><div class="card-body"><div class="crm-action-center" id="crmActionCenter"></div></div>`;const stats=document.querySelector('#inicio .stats-grid');stats?.insertAdjacentElement('afterend',wrap);} 
  if(!document.getElementById('pdfReportBtn')){const btn=document.createElement('button');btn.className='btn btn-primary';btn.id='pdfReportBtn';btn.textContent='Relatório PDF';btn.addEventListener('click',printExecutiveReport);document.querySelector('#dashboard .section-header')?.appendChild(btn.cloneNode(true));const dashBtn=document.querySelector('#dashboard #pdfReportBtn');dashBtn?.addEventListener('click',printExecutiveReport);const exportCard=document.querySelector('#importar .card:nth-child(2) .card-body');if(exportCard){const b=document.createElement('button');b.className='btn btn-primary';b.id='pdfReportBtnExport';b.style.justifyContent='flex-start';b.style.gap='12px';b.innerHTML='<div><div style="font-size:13px;font-weight:700">Gerar relatório PDF</div><div style="font-size:11px;color:rgba(255,255,255,.75)">Resumo executivo para imprimir ou salvar</div></div>';b.addEventListener('click',printExecutiveReport);exportCard.insertBefore(b,exportCard.firstChild);}}
  if(!document.getElementById('crmSecurityNote')){const note=document.createElement('div');note.id='crmSecurityNote';note.className='crm-alert warn';note.innerHTML='<strong>Aviso:</strong> esta versão salva os dados no navegador. Para operação real com equipe, use backend, login, permissões e banco seguro.';document.querySelector('#importar .card .card-body')?.appendChild(note);}
}
function renderActionCenter(){const box=document.getElementById('crmActionCenter');if(!box)return;const overdue=leads.filter(l=>l.followup&&isOverdue(l.followup)&&!['Fechado','Perdido'].includes(l.etapa));const stagnant=leads.filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&daysSince(l.ultimaAtualizacao)>=7);const hot=leads.filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&calcScore(l)>=70);const forecast=leads.filter(l=>!['Fechado','Perdido'].includes(l.etapa)).reduce((s,l)=>s+(l.valor||0)*(Number(l.probabilidade??STAGE_PROB[l.etapa])/100),0);const items=[[overdue.length,'Follow-ups vencidos','Resolver pendências de contato','leads'],[stagnant.length,'Negócios parados','Sem avanço há 7+ dias','pipeline'],[hot.length,'Leads quentes','Score acima de 70','leads'],[money(forecast),'Forecast ponderado','Valor estimado por probabilidade','dashboard']];box.innerHTML=items.map(([n,l,h,v])=>`<div class="crm-action-card" data-go-view="${v}"><div class="num">${n}</div><div class="lbl">${l}</div><div class="hint">${h}</div></div>`).join('');box.querySelectorAll('[data-go-view]').forEach(c=>c.addEventListener('click',()=>setView(c.dataset.goView)));}
const oldRenderAll=renderAll;renderAll=function(){normalizeAll();renderBoard();renderLeadsTable();renderClientTable();renderKPIs();renderOverdueList();renderActionCenter();if(document.getElementById('metricas')?.classList.contains('active'))renderMetrics();if(document.getElementById('dashboard')?.classList.contains('active'))renderDashboard();};
injectProfessionalBlocks();renderAll();
const oldSetView=setView;setView=function(v){oldSetView(v);injectProfessionalBlocks();if(v==='dashboard')renderDashboard();if(v==='metricas')renderMetrics();renderActionCenter();};window.setView=setView;
document.querySelectorAll('[data-view]').forEach(b=>{b.addEventListener('click',()=>setView(b.dataset.view));});
document.querySelectorAll('[data-go]').forEach(b=>{b.addEventListener('click',()=>setView(b.dataset.go));});
try{document.getElementById('dashPeriod')?.addEventListener('change',renderDashboard);document.getElementById('dashRefresh')?.addEventListener('click',()=>{renderDashboard();showToast('Dashboard atualizado com dados reais','success');});}catch(e){}
})();
