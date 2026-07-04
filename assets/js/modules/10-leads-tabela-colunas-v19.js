/* Script original 10 */
(function(){
  'use strict';
  const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
  const $=(q,r=document)=>r.querySelector(q);
  const STAGES=['Lead','Contato','Proposta','Fechado','Perdido'];
  const PRIORITIES=['Alta','Média','Baixa'];
  const COL_KEY='crm_v19_leads_columns';
  let quickFilter='';
  const fallbackEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const E=v=>{try{return typeof esc==='function'?esc(v):fallbackEsc(v)}catch(e){return fallbackEsc(v)}};
  const today=()=>{try{return typeof todayStr==='function'?todayStr():new Date().toISOString().slice(0,10)}catch(e){return new Date().toISOString().slice(0,10)}};
  const leadList=()=>{try{return Array.isArray(leads)?leads:[]}catch(e){return []}};
  const getId=l=>{if(!l.id)l.id='lead_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);return l.id};
  const findLead=id=>leadList().find(l=>String(l.id)===String(id)||String(l.nome)===String(id));
  const digits=v=>String(v||'').replace(/\D/g,'');
  const brl=v=>{try{return typeof money==='function'?money(Number(v)||0):new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v)||0)}catch(e){return 'R$ '+(Number(v)||0)}};
  const fmt=v=>{try{return v?(typeof fmtDate==='function'?fmtDate(v):new Date(String(v).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR')):'—'}catch(e){return v||'—'}};
  const overdue=v=>{try{return v&&typeof isOverdue==='function'?isOverdue(v):v&&String(v).slice(0,10)<today()}catch(e){return false}};
  const score=l=>{try{return typeof calcScore==='function'?calcScore(l):0}catch(e){return 0}};
  const scoreClass=s=>{try{return typeof scoreCls==='function'?scoreCls(s):s>=70?'score-hi':s>=40?'score-md':'score-lo'}catch(e){return s>=70?'score-hi':s>=40?'score-md':'score-lo'}};
  function normalize(){leadList().forEach((l,i)=>{if(!l.id)l.id='lead_'+Date.now().toString(36)+'_'+i+'_'+Math.random().toString(36).slice(2,6);if(!l.responsavel)l.responsavel='Não definido';if(!l.prioridade)l.prioridade='Média';if(!l.etapa)l.etapa='Lead';});try{typeof saveLeads==='function'&&saveLeads()}catch(e){}}
  const colDefs=[
    {key:'score',label:'Score',hint:'Pontuação comercial',sort:'score',default:true},
    {key:'lead',label:'Lead',hint:'Nome, origem e ID',sort:'nome',default:true},
    {key:'segmento',label:'Segmento',hint:'Área ou nicho',sort:'segmento',default:true},
    {key:'etapa',label:'Etapa',hint:'Editar direto',sort:'etapa',default:true},
    {key:'prioridade',label:'Prioridade',hint:'Editar direto',sort:'prioridade',default:true},
    {key:'responsavel',label:'Responsável',hint:'Editar direto',sort:'responsavel',default:true},
    {key:'qualidade',label:'Qualidade',hint:'Status do cadastro',sort:'qualidade',default:true},
    {key:'contato',label:'Contato',hint:'WhatsApp, ligação e e-mail',sort:'',default:true},
    {key:'followup',label:'Follow-up',hint:'Editar data',sort:'followup',default:true},
    {key:'valor',label:'Valor',hint:'Editar valor',sort:'valor',default:true},
    {key:'atualizado',label:'Atualizado',hint:'Última atualização',sort:'ultimaAtualizacao',default:false},
    {key:'acoes',label:'Ações',hint:'Abrir e editar',sort:'',default:true}
  ];
  function defaultPrefs(){return {order:colDefs.map(c=>c.key),visible:Object.fromEntries(colDefs.map(c=>[c.key,c.default!==false]))}}
  function loadPrefs(){try{const raw=JSON.parse(localStorage.getItem(COL_KEY)||'null');const d=defaultPrefs();if(!raw)return d;const order=[...(raw.order||[]).filter(k=>colDefs.some(c=>c.key===k)),...d.order.filter(k=>!(raw.order||[]).includes(k))];return {order,visible:Object.assign(d.visible,raw.visible||{})}}catch(e){return defaultPrefs()}}
  function savePrefs(p){try{localStorage.setItem(COL_KEY,JSON.stringify(p))}catch(e){}}
  function activeCols(){const p=loadPrefs();return p.order.map(k=>colDefs.find(c=>c.key===k)).filter(Boolean).filter(c=>p.visible[c.key]!==false)}
  function quality(l){
    if(!l.telefone&&!l.email)return {t:'Sem contato',c:'danger'};
    if(!l.telefone)return {t:'Sem telefone',c:'warn'};
    if(!l.email)return {t:'Sem e-mail',c:'warn'};
    if(score(l)>=70)return {t:'Quente',c:'blue'};
    return {t:'Completo',c:'ok'};
  }
  function baseFiltered(){
    let arr=leadList().filter(l=>{
      if(typeof ltPri!=='undefined'&&ltPri&&l.prioridade!==ltPri)return false;
      if(typeof ltStage!=='undefined'&&ltStage&&l.etapa!==ltStage)return false;
      if(typeof ltSearch!=='undefined'&&ltSearch){const q=String(ltSearch).toLowerCase();if(![l.nome,l.segmento,l.responsavel,l.email,l.telefone,l.origem].some(f=>String(f||'').toLowerCase().includes(q)))return false;}
      return true;
    });
    if(quickFilter==='hot')arr=arr.filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&score(l)>=60);
    if(quickFilter==='overdue')arr=arr.filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&overdue(l.followup));
    if(quickFilter==='proposal')arr=arr.filter(l=>l.etapa==='Proposta');
    if(quickFilter==='won')arr=arr.filter(l=>l.etapa==='Fechado');
    return arr.sort((a,b)=>{let va,vb;const sortKey=typeof ltSort!=='undefined'?ltSort:'score';const dir=typeof ltDir!=='undefined'?ltDir:-1;if(sortKey==='score'){va=score(a);vb=score(b)}else if(sortKey==='valor'){va=Number(a.valor)||0;vb=Number(b.valor)||0}else if(sortKey==='qualidade'){va=quality(a).t;vb=quality(b).t}else{va=String(a[sortKey]||'').toLowerCase();vb=String(b[sortKey]||'').toLowerCase()}return va<vb?-dir:va>vb?dir:0;});
  }
  function installFilter(){try{filteredLeads=baseFiltered;window.filteredLeads=baseFiltered}catch(e){}}
  function renderCell(c,l){
    const id=E(getId(l));const tel=l.telefone||'',em=l.email||'',wn=digits(tel);const q=quality(l);const sc=score(l);
    if(c.key==='score')return `<td style="text-align:center"><span class="score-pill ${scoreClass(sc)}">${sc}</span></td>`;
    if(c.key==='lead')return `<td><div class="v19-lead-main"><div class="v19-avatar">${E((l.nome||'?').charAt(0).toUpperCase())}</div><div><div class="v19-lead-name">${E(l.nome||'Lead')}</div><div class="v19-lead-meta"><span>${E(l.origem||'Sem origem')}</span><span class="v19-id-pill">${E(String(getId(l)).slice(-6))}</span></div></div></div></td>`;
    if(c.key==='segmento')return `<td>${E(l.segmento||'—')}</td>`;
    if(c.key==='etapa')return `<td data-stop="1"><select class="v19-quick-select" data-v19-edit="etapa" data-id="${id}">${STAGES.map(s=>`<option value="${E(s)}" ${l.etapa===s?'selected':''}>${E(s)}</option>`).join('')}</select></td>`;
    if(c.key==='prioridade')return `<td data-stop="1"><select class="v19-quick-select" data-v19-edit="prioridade" data-id="${id}">${PRIORITIES.map(s=>`<option value="${E(s)}" ${l.prioridade===s?'selected':''}>${E(s)}</option>`).join('')}</select></td>`;
    if(c.key==='responsavel')return `<td data-stop="1"><input class="v19-quick-input" data-v19-edit="responsavel" data-id="${id}" value="${E(l.responsavel||'')}"></td>`;
    if(c.key==='qualidade')return `<td><span class="v19-quality ${q.c}">${E(q.t)}</span></td>`;
    if(c.key==='contato')return `<td data-stop="1"><div class="v19-contact-actions">${tel?`<a href="https://wa.me/55${wn}" target="_blank" rel="noopener" class="row-action wa" title="WhatsApp">${typeof ICON_WHATSAPP!=='undefined'?ICON_WHATSAPP:'WA'}</a>`:''}${tel?`<a href="tel:${E(tel)}" class="row-action" title="Ligar">${typeof ICON_CALL!=='undefined'?ICON_CALL:'☎'}</a>`:''}${em?`<a href="mailto:${E(em)}" class="row-action" title="E-mail">${typeof ICON_MAIL!=='undefined'?ICON_MAIL:'@'}</a>`:''}${(!tel&&!em)?'<span class="muted">—</span>':''}</div></td>`;
    if(c.key==='followup')return `<td data-stop="1"><input type="date" class="v19-quick-date" data-v19-edit="followup" data-id="${id}" value="${E(l.followup||'')}">${overdue(l.followup)?'<div style="font-size:10.5px;color:var(--danger);font-weight:800;margin-top:3px">vencido</div>':''}</td>`;
    if(c.key==='valor')return `<td data-stop="1"><input type="number" class="v19-quick-value" data-v19-edit="valor" data-id="${id}" value="${Number(l.valor)||0}" min="0" step="100"></td>`;
    if(c.key==='atualizado')return `<td>${fmt(l.ultimaAtualizacao||l.criadoEm||l.dataEntrada)}</td>`;
    if(c.key==='acoes')return `<td data-stop="1"><div class="v19-table-actions"><button class="row-action primary" data-v19-open="${id}" title="Abrir">Abrir</button><button class="row-action" data-v19-edit-modal="${id}" title="Editar">${typeof ICON_EDIT!=='undefined'?ICON_EDIT:'Editar'}</button></div></td>`;
    return `<td>—</td>`;
  }
  function renderLeadsV19(){
    try{const oldStyle=$('#v6LeadColStyle');if(oldStyle)oldStyle.textContent='';}catch(e){}
    normalize();
    const tbody=$('#clientTable'), table=$('#leads table.data-table'); if(!tbody||!table)return;
    const cols=activeCols();
    const head=table.querySelector('thead');
    if(head){head.innerHTML=`<tr><th style="width:38px"><input type="checkbox" id="selectAll" style="cursor:pointer"></th>${cols.map(c=>`<th ${c.sort?`data-v19-sort="${E(c.sort)}"`:''}>${E(c.label)} ${c.sort?'<span class="sort-arrow">↕</span>':''}</th>`).join('')}</tr>`;}
    const fl=baseFiltered(); const total=fl.length; const PAGE_SIZE=typeof PAGE!=='undefined'?PAGE:50; let page=typeof ltPage!=='undefined'?ltPage:0; const totalPgs=Math.max(1,Math.ceil(total/PAGE_SIZE)); if(page>=totalPgs){page=totalPgs-1; try{ltPage=page}catch(e){}};
    const paged=fl.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
    tbody.innerHTML=paged.length?paged.map(l=>`<tr data-id="${E(getId(l))}" class="${typeof selLeads!=='undefined'&&selLeads.has(getId(l))?'selected-row':''}"><td data-stop="1" style="width:38px"><input type="checkbox" class="lead-cb" data-id="${E(getId(l))}" ${typeof selLeads!=='undefined'&&selLeads.has(getId(l))?'checked':''}></td>${cols.map(c=>renderCell(c,l)).join('')}</tr>`).join(''):`<tr><td colspan="${cols.length+1}" class="crm-empty">Nenhum lead encontrado</td></tr>`;
    bindLeadRows();
    const pgW=$('#ltPaginationWrap'); if(pgW){if(totalPgs<=1){pgW.innerHTML=`<div class="pagination"><span class="pg-info">${total} lead${total!==1?'s':''}</span></div>`;}else{const showing=Math.min((page+1)*PAGE_SIZE,total);pgW.innerHTML=`<div class="pagination"><span class="pg-info">${page*PAGE_SIZE+1}–${showing} de ${total} leads</span><div class="pg-btns"><button class="pg-btn" data-v19-pg="first" ${page===0?'disabled':''}>«</button><button class="pg-btn" data-v19-pg="prev" ${page===0?'disabled':''}>‹</button><span class="pg-cur">Pág. ${page+1}/${totalPgs}</span><button class="pg-btn" data-v19-pg="next" ${page>=totalPgs-1?'disabled':''}>›</button><button class="pg-btn" data-v19-pg="last" ${page>=totalPgs-1?'disabled':''}>»</button></div></div>`;}}
    renderKpis();
  }
  function bindLeadRows(){
    $('#clientTable')?.querySelectorAll('tr[data-id]').forEach(r=>r.addEventListener('click',e=>{if(e.target.closest('[data-stop],a,button,input,select'))return;try{openDetail(r.dataset.id)}catch(err){}}));
    $$('#clientTable .lead-cb').forEach(cb=>cb.addEventListener('change',()=>{try{cb.checked?selLeads.add(cb.dataset.id):selLeads.delete(cb.dataset.id)}catch(e){};cb.closest('tr')?.classList.toggle('selected-row',cb.checked);try{typeof updateBulkBar==='function'&&updateBulkBar()}catch(e){};renderKpis();}));
    $$('[data-v19-open]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();try{openDetail(b.dataset.v19Open)}catch(err){}}));
    $$('[data-v19-edit-modal]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();try{openModal(findLead(b.dataset.v19EditModal))}catch(err){}}));
    $$('[data-v19-edit]').forEach(inp=>{
      const ev=inp.tagName==='INPUT'?'change':'change';
      inp.addEventListener(ev,e=>{e.stopPropagation();saveQuick(inp)});
      inp.addEventListener('click',e=>e.stopPropagation());
      inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();inp.blur();}});
    });
    $$('[data-v19-sort]').forEach(th=>th.addEventListener('click',()=>{try{const k=th.dataset.v19Sort;if(ltSort===k)ltDir*=-1;else{ltSort=k;ltDir=1}ltPage=0;renderLeadsV19();}catch(e){}}));
    $('#ltPaginationWrap')?.querySelectorAll('[data-v19-pg]').forEach(b=>b.addEventListener('click',()=>{try{const totalPgs=Math.max(1,Math.ceil(baseFiltered().length/(typeof PAGE!=='undefined'?PAGE:50)));const a=b.dataset.v19Pg;if(a==='first')ltPage=0;if(a==='prev')ltPage=Math.max(0,ltPage-1);if(a==='next')ltPage=Math.min(totalPgs-1,ltPage+1);if(a==='last')ltPage=totalPgs-1;renderLeadsV19();}catch(e){}}));
    const sa=$('#selectAll'); if(sa){const pageIds=$$('#clientTable .lead-cb').map(c=>c.dataset.id);try{sa.checked=pageIds.length>0&&pageIds.every(id=>selLeads.has(id))}catch(e){};sa.addEventListener('change',()=>{try{pageIds.forEach(id=>sa.checked?selLeads.add(id):selLeads.delete(id));renderLeadsV19();typeof updateBulkBar==='function'&&updateBulkBar()}catch(e){}});}
  }
  function saveQuick(inp){
    const l=findLead(inp.dataset.id); if(!l)return; const field=inp.dataset.v19Edit; const old=l[field]; let value=inp.value;
    if(field==='valor')value=Number(value)||0;
    if(field==='etapa'){
      try{typeof applyStageChange==='function'?applyStageChange(l.id,value):l.etapa=value}catch(e){l.etapa=value}
    }else{l[field]=value;}
    l.ultimaAtualizacao=today();
    try{if(typeof addAtividade==='function'&&String(old)!==String(value))addAtividade(l.id,'Nota',`${field} atualizado para ${value||'—'}.`)}catch(e){}
    try{typeof saveLeads==='function'&&saveLeads()}catch(e){}
    try{typeof renderBoard==='function'&&renderBoard();typeof renderKPIs==='function'&&renderKPIs()}catch(e){}
    if(field==='etapa'||field==='prioridade')setTimeout(renderLeadsV19,30);
    try{typeof showToast==='function'&&showToast('Lead atualizado','success')}catch(e){}
  }
  function renderKpis(){
    const list=leadList(); const open=list.filter(l=>!['Fechado','Perdido'].includes(l.etapa)); const hot=open.filter(l=>score(l)>=60); const venc=open.filter(l=>overdue(l.followup)); const prop=list.filter(l=>l.etapa==='Proposta'); const won=list.filter(l=>l.etapa==='Fechado');
    const data={all:list.length,hot:hot.length,overdue:venc.length,proposal:prop.length,won:won.length};
    Object.entries(data).forEach(([k,v])=>{const el=$(`[data-v19-kpi="${k}"] b`); if(el)el.textContent=v;});
    $$('[data-v19-kpi]').forEach(b=>b.classList.toggle('active',b.dataset.v19Kpi===quickFilter || (!quickFilter&&b.dataset.v19Kpi==='all')));
  }
  function ensureLayout(){
    const page=$('#leads'); if(!page)return;
    try{const oldStyle=$('#v6LeadColStyle');if(oldStyle)oldStyle.textContent='';}catch(e){}
    const mainCard=page.querySelector('.card'); if(mainCard)mainCard.id='v19LeadsCard';
    if(!$('#v19LeadsHero')){
      const hero=document.createElement('div'); hero.id='v19LeadsHero'; hero.innerHTML=`<div><h2>Gestão de Leads</h2><p>Organize, edite e acione sua base comercial em uma única tela. Use os cards para filtrar rápido e a tabela para atualizar informações sem abrir várias janelas.</p></div><div class="v19-hero-actions"><button class="btn btn-primary" id="v19NewLeadHero">Novo lead</button><button class="btn" id="v19ColsBtn">Colunas</button><button class="btn" id="v19ExportBtn">Exportar</button></div>`;
      page.querySelector('.section-header')?.insertAdjacentElement('afterend',hero);
    }
    if(!$('#v19LeadKpis')){
      const kpis=document.createElement('div'); kpis.id='v19LeadKpis'; kpis.innerHTML=`<button class="v19-lead-kpi active" data-v19-kpi="all"><b>0</b><span>Total de leads</span><small>Toda a base cadastrada</small></button><button class="v19-lead-kpi" data-v19-kpi="hot"><b>0</b><span>Leads quentes</span><small>Score alto e oportunidade aberta</small></button><button class="v19-lead-kpi" data-v19-kpi="overdue"><b>0</b><span>Follow-ups vencidos</span><small>Resolver primeiro</small></button><button class="v19-lead-kpi" data-v19-kpi="proposal"><b>0</b><span>Propostas abertas</span><small>Negócios em negociação</small></button><button class="v19-lead-kpi" data-v19-kpi="won"><b>0</b><span>Fechados</span><small>Clientes conquistados</small></button>`;
      $('#v19LeadsHero')?.insertAdjacentElement('afterend',kpis);
    }
    const toolbar=page.querySelector('.leads-toolbar');
    if(toolbar && !toolbar.dataset.v19){
      toolbar.dataset.v19='1';
      const search=toolbar.querySelector('.search-wrap');
      const pri=toolbar.querySelector('#leadsPriorityFilters');
      const stage=toolbar.querySelector('#leadsStageFilters');
      const actions=toolbar.querySelector('div[style*="margin-left:auto"]');
      toolbar.innerHTML='';
      const left=document.createElement('div');left.className='v19-toolbar-left'; if(search)left.appendChild(search);
      const right=document.createElement('div');right.className='v19-toolbar-right'; right.innerHTML=`<button class="btn btn-sm" id="v19TableColsBtn">Colunas</button><button class="btn btn-sm" id="v19TableExportBtn">Exportar CSV</button><button class="btn btn-sm btn-primary" id="v19TableNewLeadBtn">Novo lead</button>`;
      const row=document.createElement('div');row.className='v19-filter-row';
      const fg=document.createElement('div');fg.className='v19-filter-group'; if(pri)fg.appendChild(pri); if(stage)fg.appendChild(stage); row.appendChild(fg);
      const hint=document.createElement('div');hint.className='muted';hint.style.fontSize='12px';hint.textContent='Dica: altere etapa, prioridade, responsável, follow-up e valor direto na tabela.';row.appendChild(hint);
      toolbar.appendChild(left);toolbar.appendChild(right);toolbar.appendChild(row);
    }
    const wrap=$('#leads table.data-table')?.parentElement; if(wrap)wrap.classList.add('v19-table-wrap');
    ensureModals();
  }
  function ensureModals(){
    if(!$('#v19ColsModal')){
      const m=document.createElement('div');m.id='v19ColsModal';m.className='modal-overlay hidden';m.innerHTML=`<div class="modal-box"><div class="modal-head"><h3>Colunas da Gestão de Leads</h3><button class="modal-close" id="v19ColsClose" type="button">×</button></div><div class="modal-body"><div class="card-sub">Marque as colunas que quer ver. Arraste para reorganizar a ordem.</div><div id="v19ColList" class="v19-col-list"></div></div><div class="modal-foot"><button class="btn" id="v19ColsReset" type="button">Restaurar</button><button class="btn btn-primary" id="v19ColsSave" type="button">Salvar</button></div></div>`;document.body.appendChild(m);
    }
    if(!$('#v19ExportModal')){
      const m=document.createElement('div');m.id='v19ExportModal';m.className='modal-overlay hidden';m.innerHTML=`<div class="modal-box"><div class="modal-head"><h3>Exportar leads</h3><button class="modal-close" id="v19ExportClose" type="button">×</button></div><div class="modal-body"><div class="v19-export-options"><button class="v19-export-option" data-v19-export="all"><b>Todos os leads</b><span>Exporta a base completa.</span></button><button class="v19-export-option" data-v19-export="filtered"><b>Leads filtrados</b><span>Exporta apenas o resultado atual da busca/filtros/cards.</span></button><button class="v19-export-option" data-v19-export="selected"><b>Selecionados</b><span>Exporta apenas os leads marcados na tabela.</span></button><button class="v19-export-option" data-v19-export="hot"><b>Leads quentes</b><span>Exporta oportunidades abertas com score alto.</span></button></div></div></div>`;document.body.appendChild(m);
    }
  }
  function renderColModal(){
    const p=loadPrefs(); const box=$('#v19ColList'); if(!box)return;
    box.innerHTML=p.order.map(k=>{const c=colDefs.find(x=>x.key===k); if(!c)return ''; return `<div class="v19-col-item" draggable="true" data-col="${E(c.key)}"><span class="v19-drag-handle">⋮⋮</span><div><b>${E(c.label)}</b><small>${E(c.hint)}</small></div><input type="checkbox" ${p.visible[c.key]!==false?'checked':''}></div>`}).join('');
    let drag=null;
    $$('.v19-col-item',box).forEach(item=>{
      item.addEventListener('dragstart',()=>{drag=item;item.classList.add('dragging')});
      item.addEventListener('dragend',()=>{item.classList.remove('dragging');drag=null});
      item.addEventListener('dragover',e=>{e.preventDefault();const after=[...box.querySelectorAll('.v19-col-item:not(.dragging)')].find(el=>e.clientY<=el.getBoundingClientRect().top+el.offsetHeight/2); if(after)box.insertBefore(drag,after); else box.appendChild(drag);});
    });
  }
  function saveColModal(){const p=loadPrefs(); const box=$('#v19ColList'); if(!box)return; p.order=$$('.v19-col-item',box).map(i=>i.dataset.col); $$('.v19-col-item',box).forEach(i=>{p.visible[i.dataset.col]=!!i.querySelector('input')?.checked}); if(!Object.values(p.visible).some(Boolean))p.visible.lead=true; savePrefs(p); $('#v19ColsModal')?.classList.add('hidden'); renderLeadsV19();}
  function csvEscape(v){const s=String(v??'');return /[;"\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
  function exportRows(type){
    let rows=[]; if(type==='all')rows=leadList(); else if(type==='selected'){try{rows=leadList().filter(l=>selLeads.has(getId(l)))}catch(e){rows=[]}} else if(type==='hot')rows=leadList().filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&score(l)>=60); else rows=baseFiltered();
    if(!rows.length){try{showToast('Nenhum lead para exportar','warn')}catch(e){};return;}
    const headers=['ID','Nome','Segmento','Etapa','Prioridade','Responsável','Origem','Telefone','Email','Follow-up','Valor','Score','Qualidade','Última atualização','Observações'];
    const lines=[headers.join(';'),...rows.map(l=>[getId(l),l.nome,l.segmento,l.etapa,l.prioridade,l.responsavel,l.origem,l.telefone,l.email,l.followup,l.valor,score(l),quality(l).t,l.ultimaAtualizacao,l.obs].map(csvEscape).join(';'))];
    const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`leads-${type}-${today()}.csv`;a.click();URL.revokeObjectURL(a.href);$('#v19ExportModal')?.classList.add('hidden');try{showToast('CSV exportado','success')}catch(e){}
  }
  function bindStatic(){
    if(document.body.dataset.v19LeadsBound)return; document.body.dataset.v19LeadsBound='1';
    document.addEventListener('click',e=>{
      if(e.target.closest('#v19NewLeadHero,#v19TableNewLeadBtn,#openNewLeadBtn,#openNewLeadBtn2')){e.preventDefault();e.stopImmediatePropagation();try{typeof setView==='function'?setView('novo-lead'):window.setView('novo-lead')}catch(err){};return;}
      if(e.target.closest('#v19ColsBtn,#v19TableColsBtn')){e.preventDefault();e.stopImmediatePropagation();renderColModal();$('#v19ColsModal')?.classList.remove('hidden');return;}
      if(e.target.closest('#v19ColsClose')){$('#v19ColsModal')?.classList.add('hidden');return;}
      if(e.target.closest('#v19ColsSave')){saveColModal();return;}
      if(e.target.closest('#v19ColsReset')){localStorage.removeItem(COL_KEY);renderColModal();renderLeadsV19();return;}
      if(e.target.closest('#v19ExportBtn,#v19TableExportBtn,#exportCsvBtn,#exportCsvBtn2')){e.preventDefault();e.stopImmediatePropagation();$('#v19ExportModal')?.classList.remove('hidden');return;}
      if(e.target.closest('#v19ExportClose')){$('#v19ExportModal')?.classList.add('hidden');return;}
      const ex=e.target.closest('[data-v19-export]'); if(ex){exportRows(ex.dataset.v19Export);return;}
      const k=e.target.closest('[data-v19-kpi]'); if(k){quickFilter=k.dataset.v19Kpi==='all'?'':k.dataset.v19Kpi; try{ltPage=0}catch(err){};renderLeadsV19();return;}
      if(e.target.id==='v19ColsModal'||e.target.id==='v19ExportModal')e.target.classList.add('hidden');
    },true);
    document.addEventListener('input',e=>{if(e.target&&e.target.id==='leadsSearch'){try{ltSearch=e.target.value;ltPage=0;renderLeadsV19()}catch(err){}}},true);
    document.addEventListener('click',e=>{const b=e.target.closest('[data-lf-priority]'); if(b){quickFilter='';setTimeout(renderLeadsV19,20)} const s=e.target.closest('[data-lf-stage]'); if(s){quickFilter='';setTimeout(renderLeadsV19,20)}},true);
  }
  function patchBulk(){
    try{updateBulkBar=function(){const bar=$('#bulkBar');if(!bar)return;bar.classList.toggle('visible',selLeads.size>0);const c=$('#bulkCount');if(c)c.textContent=selLeads.size;};window.updateBulkBar=updateBulkBar}catch(e){}
    const cloneBind=(id,fn)=>{const el=$('#'+id);if(!el)return;const c=el.cloneNode(true);el.parentNode.replaceChild(c,el);c.addEventListener('click',fn)};
    cloneBind('bulkClearBtn',()=>{try{selLeads.clear();renderLeadsV19();updateBulkBar()}catch(e){}});
    cloneBind('bulkDeleteBtn',()=>{try{if(!selLeads.size)return;if(!confirm(`Excluir ${selLeads.size} lead(s)?`))return;[...selLeads].forEach(id=>{const i=leadList().findIndex(l=>getId(l)===id);if(i>-1)leadList().splice(i,1)});selLeads.clear();saveLeads();renderLeadsV19();updateBulkBar();showToast('Leads excluídos','warn')}catch(e){}});
    cloneBind('bulkStageBtn',()=>$('#bulkStageBackdrop')?.classList.remove('hidden'));
    cloneBind('bulkRespBtn',()=>{const i=$('#bulkRespInput');if(i)i.value='';$('#bulkRespBackdrop')?.classList.remove('hidden')});
    cloneBind('bulkStageConfirm',()=>{try{const s=$('#bulkStageSelect')?.value||'Lead';[...selLeads].forEach(id=>{const l=findLead(id);if(l){if(typeof applyStageChange==='function')applyStageChange(l.id,s);else l.etapa=s;l.ultimaAtualizacao=today()}});selLeads.clear();saveLeads();$('#bulkStageBackdrop')?.classList.add('hidden');renderLeadsV19();updateBulkBar();showToast(`Movidos para ${s}`,'success')}catch(e){}});
    cloneBind('bulkRespConfirm',()=>{try{const r=($('#bulkRespInput')?.value||'').trim();if(!r)return;[...selLeads].forEach(id=>{const l=findLead(id);if(l){l.responsavel=r;l.ultimaAtualizacao=today();try{addAtividade(l.id,'Nota',`Responsável alterado para ${r}.`)}catch(e){}}});selLeads.clear();saveLeads();$('#bulkRespBackdrop')?.classList.add('hidden');renderLeadsV19();updateBulkBar();showToast(`Responsável → ${r}`,'success')}catch(e){}});
  }
  function patchRenders(){
    try{renderLeadsTable=renderLeadsV19;window.renderLeadsTable=renderLeadsV19}catch(e){}
    try{const old=window.renderAll||renderAll;if(typeof old==='function'&&!old.__v19Leads){const w=function(){const r=old.apply(this,arguments);setTimeout(()=>{ensureLayout();installFilter();renderLeadsV19()},50);return r};w.__v19Leads=true;window.renderAll=w;try{renderAll=w}catch(e){}}}catch(e){}
    try{const prev=window.setView||setView;if(typeof prev==='function'&&!prev.__v19Leads){const w=function(v){const r=prev.apply(this,arguments);if(v==='leads')setTimeout(()=>{ensureLayout();installFilter();renderLeadsV19()},70);return r};w.__v19Leads=true;window.setView=w;try{setView=w}catch(e){}}}catch(e){}
  }
  function init(){normalize();ensureLayout();ensureModals();installFilter();bindStatic();patchBulk();patchRenders();renderLeadsV19();try{localStorage.setItem('crm_v6_lead_filters',JSON.stringify({resp:'',origem:'',special:''}))}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  setTimeout(init,250);setTimeout(init,900);
})();
