/* EMBED: assets/js/modules/11-pipeline-dados-reais-v65.js */
/* CRM V65 — Pipeline com dados reais
   Substitui o pipeline antigo por uma única renderização oficial baseada diretamente na base outbounder_leads_v5. */
(function(){
  'use strict';
  if(window.__crmV65PipelineActive) return;
  window.__crmV65PipelineActive = true;

  const $=(q,r=document)=>r.querySelector(q);
  const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
  const STORAGE_STAGE='crm_pipeline_stage_config_v20';
  const VIEW_KEY='crm_v65_pipeline_view';
  const STALE_KEY='crm_v65_pipeline_stale_days';
  const DEFAULT_STAGES=['Lead','Contato','Proposta','Fechado','Perdido'];
  const DEFAULT_PROB={Lead:10,Contato:25,Proposta:60,Fechado:100,Perdido:0};
  const DEFAULT_COLORS={Lead:'#6366f1',Contato:'#f59e0b',Proposta:'#06b6d4',Fechado:'#22c55e',Perdido:'#ef4444'};
  let dragId=null;

  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  const today=()=>new Date().toISOString().slice(0,10);
  const addDays=(n)=>{const d=new Date(today()+'T12:00:00');d.setDate(d.getDate()+Number(n||0));return d.toISOString().slice(0,10)};
  const parseDate=v=>{if(!v)return null;const d=new Date(String(v).slice(0,10)+'T12:00:00');return isNaN(+d)?null:d};
  const dateKey=v=>v?String(v).slice(0,10):'';
  const brl=v=>{try{return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v)||0)}catch(e){return 'R$ '+(Number(v)||0)}};
  const fmtDate=v=>{if(!v)return '—';try{return new Date(String(v).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR')}catch(e){return String(v)}};
  const daysSince=v=>{const d=parseDate(v);if(!d)return 0;const base=parseDate(today());return Math.max(0,Math.floor((base-d)/86400000))};
  const isOverdue=v=>!!v && dateKey(v)<today();
  const isToday=v=>!!v && dateKey(v)===today();
  const isOpen=s=>!['Fechado','Perdido'].includes(s);

  function safeLeads(){
    try{if(Array.isArray(leads))return leads}catch(e){}
    try{if(Array.isArray(window.leads))return window.leads}catch(e){}
    try{if(typeof window.crmGetLeads==='function')return window.crmGetLeads()}catch(e){}
    try{return JSON.parse(localStorage.getItem('outbounder_leads_v5')||'[]')}catch(e){return []}
  }
  function saveLeadsSafe(){
    try{typeof saveLeads==='function'&&saveLeads()}catch(e){}
    try{typeof window.crmSaveLeads==='function'&&window.crmSaveLeads()}catch(e){}
    try{localStorage.setItem('outbounder_leads_v5',JSON.stringify(safeLeads()))}catch(e){}
  }
  function toast(msg,type){try{typeof showToast==='function'?showToast(msg,type):window.crmToast?.(msg,type)}catch(e){console.log(msg)}}
  function uid(){return 'lead_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
  function ensureIds(){let changed=false;safeLeads().forEach((l,i)=>{if(!l.id){l.id=uid()+'_'+i;changed=true}if(!l.etapa){l.etapa='Lead';changed=true}if(!l.ultimaAtualizacao){l.ultimaAtualizacao=l.dataEntrada||l.criadoEm||today();changed=true}if(!l.prioridade){l.prioridade='Média';changed=true}});if(changed)saveLeadsSafe()}
  function leadById(id){return safeLeads().find(l=>String(l.id||l.nome)===String(id)||String(l.nome)===String(id))}
  function leadDate(l){return l.dataFechamento||l.dataPerda||l.ultimaAtualizacao||l.dataEntrada||l.criadoEm||l.followup}
  function monthKey(d){const x=parseDate(d);return x?`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`:''}
  function thisMonth(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
  function prevMonth(){const d=new Date();d.setMonth(d.getMonth()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
  function score(l){try{if(typeof calcScore==='function')return calcScore(l)}catch(e){}const st={Lead:10,Contato:25,Proposta:55,Fechado:100,Perdido:0};const pr={Alta:30,'Média':15,Baixa:5};return Math.max(0,Math.min(100,(st[l.etapa]||10)+(pr[l.prioridade]||0)+Math.min(30,Math.round((Number(l.valor)||0)/1000))))}
  function scoreClass(s){return s>=75?'score-hi':s>=45?'score-md':'score-lo'}
  function nextAction(l){if(l.proximaAcao)return l.proximaAcao;if(isOverdue(l.followup))return 'Retomar follow-up vencido';if(isToday(l.followup))return 'Executar contato de hoje';if(l.etapa==='Lead')return 'Fazer primeiro contato';if(l.etapa==='Contato')return 'Qualificar necessidade';if(l.etapa==='Proposta')return 'Cobrar decisão da proposta';if(l.etapa==='Fechado')return 'Pós-venda / implantação';if(l.etapa==='Perdido')return 'Avaliar reativação';return 'Definir próximo passo'}
  function tags(l){return String(l.tags||'').split(',').map(s=>s.trim()).filter(Boolean)}
  function lossReason(l){return l.motivoPerda||l.perdaMotivo||l.lossReason||l.razaoPerda||(l.etapa==='Perdido'?'Sem motivo informado':'')}

  function loadStages(){
    let arr=[];
    try{arr=JSON.parse(localStorage.getItem(STORAGE_STAGE)||'[]')}catch(e){arr=[]}
    if(!Array.isArray(arr)||!arr.length){arr=DEFAULT_STAGES.map((name,i)=>({id:'st_'+i,name,color:DEFAULT_COLORS[name],prob:DEFAULT_PROB[name],visible:true,order:i}))}
    safeLeads().forEach(l=>{const name=l.etapa||'Lead';if(!arr.some(s=>s.name===name))arr.push({id:'st_custom_'+norm(name)+'_'+Date.now(),name,color:DEFAULT_COLORS[name]||'#2563eb',prob:DEFAULT_PROB[name]??20,visible:true,order:arr.length})});
    return arr.map((s,i)=>({id:s.id||'st_'+i,name:s.name||'Etapa',color:s.color||DEFAULT_COLORS[s.name]||'#2563eb',prob:Number(s.prob??DEFAULT_PROB[s.name]??20),visible:s.visible!==false,order:Number.isFinite(Number(s.order))?Number(s.order):i})).sort((a,b)=>a.order-b.order)
  }
  function visibleStages(){return loadStages().filter(s=>s.visible!==false)}
  function stageCfg(name){return loadStages().find(s=>s.name===name)||{name,prob:DEFAULT_PROB[name]??20,color:DEFAULT_COLORS[name]||'#2563eb'}}
  function uniques(field){const set=new Set();safeLeads().forEach(l=>{if(field==='tags')tags(l).forEach(t=>set.add(t));else if(l[field])set.add(String(l[field]))});return [...set].sort((a,b)=>a.localeCompare(b,'pt-BR'))}

  function ensureLayout(){
    const page=$('#pipeline'); if(!page)return;
    page.className='view grid-view pipeline-v65'+(page.classList.contains('active')?' active':'');
    if(page.dataset.v65Ready==='1')return;
    page.dataset.v65Ready='1';
    page.innerHTML=`
      <div class="v65-pipe-hero">
        <div><span>Pipeline V65 · dados reais</span><h2>Pipeline conectado à base de Leads</h2><p>Os números abaixo vêm dos leads salvos: etapa, valor, probabilidade, cidade, tag, follow-up, perdas e fechamentos. Nada é simulado.</p></div>
        <div class="v65-pipe-actions"><button class="btn btn-primary" id="v65PipeNewLead" type="button">+ Novo lead</button><button class="btn" id="v65PipeRefresh" type="button">Atualizar</button></div>
      </div>
      <div id="v65PipeKpis" class="v65-pipe-kpis"></div>
      <div class="v65-pipe-tools card">
        <div class="v65-pipe-topline">
          <div class="v65-search-block"><label>Buscar oportunidade</label><div class="search-wrap"><svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><use href="#ic-search"></use></svg><input id="v65PipeSearch" class="search-input" type="search" placeholder="Nome, telefone, cidade, tag, origem, observação..."></div></div>
          <div class="v65-view-switch"><button class="active" data-v65-pipe-view="kanban" type="button">Kanban</button><button data-v65-pipe-view="table" type="button">Tabela</button><button data-v65-pipe-view="funnel" type="button">Funil real</button></div>
        </div>
        <div class="v65-pipe-filter-grid">
          <label><span>Etapa</span><select id="v65PipeStage"><option value="">Todas etapas</option></select></label>
          <label><span>Prioridade</span><select id="v65PipePriority"><option value="">Todas</option><option>Alta</option><option>Média</option><option>Baixa</option></select></label>
          <label><span>Origem</span><select id="v65PipeOrigin"><option value="">Todas origens</option></select></label>
          <label><span>Responsável</span><select id="v65PipeOwner"><option value="">Todos responsáveis</option></select></label>
          <label><span>Cidade</span><select id="v65PipeCity"><option value="">Todas cidades</option></select></label>
          <label><span>Tag</span><select id="v65PipeTag"><option value="">Todas tags</option></select></label>
          <label><span>Situação</span><select id="v65PipeStatus"><option value="">Todas</option><option value="vencidos">Follow-up vencido</option><option value="hoje">Follow-up hoje</option><option value="sem_follow">Sem follow-up</option><option value="parados">Parados</option><option value="alto_valor">Alto valor</option><option value="ganhos_mes">Ganhos este mês</option><option value="perdidos_mes">Perdidos este mês</option></select></label>
          <label><span>Período</span><select id="v65PipePeriod"><option value="all">Toda base</option><option value="month">Mês atual</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select></label>
          <label><span>Parado após</span><input id="v65PipeStaleDays" type="number" min="1" max="90" value="7"></label>
          <button class="btn btn-sm" id="v65PipeClear" type="button">Limpar filtros</button>
        </div>
      </div>
      <div id="v65PipeInsights" class="v65-pipe-insights"></div>
      <div id="v65PipeKanban" class="v65-pipe-kanban"></div>
      <div id="v65PipeTable" class="v65-pipe-table-wrap hidden"></div>
      <div id="v65PipeFunnel" class="v65-pipe-funnel-wrap hidden"></div>
      <div id="v65PipeDrawer" class="v65-pipe-drawer hidden"></div>`;
  }

  function currentView(){return localStorage.getItem(VIEW_KEY)||'kanban'}
  function setViewMode(v){localStorage.setItem(VIEW_KEY,v);render()}
  function getStaleDays(){return Number($('#v65PipeStaleDays')?.value||localStorage.getItem(STALE_KEY)||7)||7}
  function setSelectOptions(id,items,placeholder){const el=$('#'+id);if(!el)return;const cur=el.value;const html='<option value="">'+E(placeholder)+'</option>'+items.map(v=>`<option value="${E(v)}">${E(v)}</option>`).join('');if(el.dataset.html!==html){el.innerHTML=html;el.dataset.html=html}if([...el.options].some(o=>o.value===cur))el.value=cur}
  function syncOptions(){
    setSelectOptions('v65PipeStage',visibleStages().map(s=>s.name),'Todas etapas');
    setSelectOptions('v65PipeOrigin',uniques('origem'),'Todas origens');
    setSelectOptions('v65PipeOwner',uniques('responsavel'),'Todos responsáveis');
    setSelectOptions('v65PipeCity',uniques('cidade'),'Todas cidades');
    setSelectOptions('v65PipeTag',uniques('tags'),'Todas tags');
    const st=$('#v65PipeStaleDays'); if(st){st.value=String(getStaleDays())}
  }
  function filters(){return{
    q:norm($('#v65PipeSearch')?.value||''),stage:$('#v65PipeStage')?.value||'',priority:$('#v65PipePriority')?.value||'',origin:$('#v65PipeOrigin')?.value||'',owner:$('#v65PipeOwner')?.value||'',city:$('#v65PipeCity')?.value||'',tag:$('#v65PipeTag')?.value||'',status:$('#v65PipeStatus')?.value||'',period:$('#v65PipePeriod')?.value||'all',stale:getStaleDays()
  }}
  function inPeriod(l,period){
    if(!period||period==='all')return true;
    const d=parseDate(leadDate(l)); if(!d)return false;
    const now=new Date(); now.setHours(12,0,0,0);
    if(period==='month')return monthKey(leadDate(l))===thisMonth();
    const days=Number(period)||0; const start=new Date(now); start.setDate(start.getDate()-days+1); return d>=start;
  }
  function filteredLeads(){
    const f=filters();
    return safeLeads().filter(l=>{
      const hay=[l.nome,l.segmento,l.responsavel,l.telefone,l.email,l.origem,l.cidade,l.tags,l.obs,l.proximaAcao,l.dorPrincipal,l.produtoInteresse,l.decisor].map(norm).join(' ');
      if(f.q && !hay.includes(f.q))return false;
      if(f.stage && (l.etapa||'Lead')!==f.stage)return false;
      if(f.priority && (l.prioridade||'Média')!==f.priority)return false;
      if(f.origin && (l.origem||'')!==f.origin)return false;
      if(f.owner && (l.responsavel||'')!==f.owner)return false;
      if(f.city && (l.cidade||'')!==f.city)return false;
      if(f.tag && !tags(l).map(norm).includes(norm(f.tag)))return false;
      if(!inPeriod(l,f.period))return false;
      if(f.status==='vencidos' && !isOverdue(l.followup))return false;
      if(f.status==='hoje' && !isToday(l.followup))return false;
      if(f.status==='sem_follow' && (!isOpen(l.etapa)||l.followup))return false;
      if(f.status==='parados' && (!isOpen(l.etapa)||daysSince(l.ultimaAtualizacao||l.dataEntrada)<f.stale))return false;
      if(f.status==='alto_valor' && (Number(l.valor)||0)<3000)return false;
      if(f.status==='ganhos_mes' && !((l.etapa||'')==='Fechado' && monthKey(leadDate(l))===thisMonth()))return false;
      if(f.status==='perdidos_mes' && !((l.etapa||'')==='Perdido' && monthKey(leadDate(l))===thisMonth()))return false;
      return true;
    });
  }
  function stageMetrics(list){
    const stages=visibleStages();
    const firstCount=Math.max(1,list.length);
    return stages.map((s,i)=>{
      const arr=list.filter(l=>(l.etapa||'Lead')===s.name);
      const next=stages[i+1]?.name;
      const nextCount=next?list.filter(l=>(l.etapa||'Lead')===next).length:0;
      const value=arr.reduce((a,l)=>a+(Number(l.valor)||0),0);
      const forecast=arr.reduce((a,l)=>a+(Number(l.valor)||0)*(Number(l.probabilidade||s.prob||0)/100),0);
      const stale=arr.filter(l=>isOpen(s.name)&&daysSince(l.ultimaAtualizacao||l.dataEntrada)>=getStaleDays()).length;
      const overdue=arr.filter(l=>isOverdue(l.followup)).length;
      const avg=arr.length?Math.round(arr.reduce((a,l)=>a+daysSince(l.ultimaAtualizacao||l.dataEntrada),0)/arr.length):0;
      return {...s,arr,count:arr.length,value,forecast,stale,overdue,avg,share:Math.round((arr.length/firstCount)*100),conversion:arr.length&&next?Math.round((nextCount/arr.length)*100):(s.name==='Fechado'?100:0)}
    })
  }
  function renderKpis(list){
    const open=list.filter(l=>isOpen(l.etapa));
    const valueOpen=open.reduce((a,l)=>a+(Number(l.valor)||0),0);
    const forecast=open.reduce((a,l)=>a+(Number(l.valor)||0)*(Number(l.probabilidade||stageCfg(l.etapa||'Lead').prob||0)/100),0);
    const won=list.filter(l=>l.etapa==='Fechado');
    const lost=list.filter(l=>l.etapa==='Perdido');
    const conv=list.length?Math.round((won.length/list.length)*100):0;
    const overdue=open.filter(l=>isOverdue(l.followup)).length;
    const noFollow=open.filter(l=>!l.followup).length;
    const box=$('#v65PipeKpis'); if(!box)return;
    const items=[['Oportunidades abertas',open.length,'Leads fora de ganho/perda'],['Valor aberto',brl(valueOpen),'Soma real dos valores'],['Forecast ponderado',brl(forecast),'Valor × probabilidade'],['Conversão geral',conv+'%',`${won.length} ganhos · ${lost.length} perdidos`],['Follow-ups vencidos',overdue,'Precisam de ação'],['Sem próximo contato',noFollow,'Oportunidades abertas sem data']];
    box.innerHTML=items.map((it,i)=>`<button class="v65-pipe-kpi" type="button" data-v65-kpi="${i}"><b>${E(it[1])}</b><span>${E(it[0])}</span><small>${E(it[2])}</small></button>`).join('')
  }
  function renderInsights(list,metrics){
    const box=$('#v65PipeInsights'); if(!box)return;
    const open=list.filter(l=>isOpen(l.etapa));
    const maxStage=metrics.filter(m=>isOpen(m.name)).sort((a,b)=>b.count-a.count)[0];
    const prop=metrics.find(m=>m.name==='Proposta');
    const losses=list.filter(l=>l.etapa==='Perdido');
    const lossMap={}; losses.forEach(l=>{const r=lossReason(l);lossMap[r]=(lossMap[r]||0)+1});
    const topLoss=Object.entries(lossMap).sort((a,b)=>b[1]-a[1])[0];
    const stale=open.filter(l=>daysSince(l.ultimaAtualizacao||l.dataEntrada)>=getStaleDays()).length;
    const chips=[];
    if(maxStage)chips.push(['Gargalo',`${maxStage.name}: ${maxStage.count} lead(s)`]);
    if(prop?.stale)chips.push(['Propostas paradas',`${prop.stale} sem atualização recente`]);
    if(topLoss)chips.push(['Maior motivo de perda',`${topLoss[0]} (${topLoss[1]})`]);
    chips.push(['Parados',`${stale} lead(s) acima do limite`]);
    box.innerHTML=chips.map(c=>`<div class="v65-insight"><span>${E(c[0])}</span><b>${E(c[1])}</b></div>`).join('')
  }
  function tagHtml(l){const t=tags(l).slice(0,3);return t.length?`<div class="v65-card-tags">${t.map(x=>`<span>${E(x)}</span>`).join('')}</div>`:''}
  function card(l){
    const tel=String(l.telefone||'').replace(/\D/g,'');
    const wa=tel?`https://wa.me/55${tel.replace(/^55/,'')}`:'';
    const sc=score(l);
    return `<article class="v65-pipe-card${isOverdue(l.followup)?' overdue':''}" draggable="true" data-v65-card="${E(l.id)}">
      <div class="v65-card-head"><div><b>${E(l.nome||'Lead')}</b><span>${E([l.segmento,l.cidade].filter(Boolean).join(' · ')||'Sem segmento/cidade')}</span></div><strong class="score-pill ${scoreClass(sc)}">${sc}</strong></div>
      <div class="v65-card-next">${E(nextAction(l))}</div>
      <div class="v65-card-meta"><span>${E(l.prioridade||'Média')}</span><span>${E(l.origem||'Sem origem')}</span><span>${E(brl(l.valor||0))}</span></div>
      ${tagHtml(l)}
      <div class="v65-card-foot"><span class="${isOverdue(l.followup)?'danger':''}">${l.followup?fmtDate(l.followup):'Sem follow-up'}</span><div>${wa?`<a href="${wa}" target="_blank" rel="noopener" title="WhatsApp">WA</a>`:''}<button type="button" data-v65-follow="${E(l.id)}">+1d</button><button type="button" data-v65-edit="${E(l.id)}">Editar</button></div></div>
    </article>`
  }
  function renderKanban(list,metrics){
    const board=$('#v65PipeKanban'); if(!board)return;
    board.innerHTML=metrics.map(m=>`<section class="v65-pipe-col" data-v65-stage="${E(m.name)}" style="--stage:${E(m.color)}">
      <header><div><span class="v65-stage-dot"></span><b>${E(m.name)}</b><small>${m.count} lead(s) · ${E(brl(m.value))}</small></div><button type="button" data-v65-open-stage="${E(m.name)}">Abrir</button></header>
      <div class="v65-col-metrics"><span>Forecast <b>${E(brl(m.forecast))}</b></span><span>Conv. <b>${m.conversion}%</b></span><span>Parados <b>${m.stale}</b></span></div>
      <div class="v65-pipe-col-body">${m.arr.length?m.arr.sort(sortCommercial).map(card).join(''):'<div class="v65-empty-col">Nenhum lead nesta etapa.</div>'}</div>
    </section>`).join('');
    bindDrag();
  }
  function sortCommercial(a,b){
    const ao=isOverdue(a.followup)?1:0,bo=isOverdue(b.followup)?1:0;if(ao!==bo)return bo-ao;
    const av=Number(a.valor)||0,bv=Number(b.valor)||0;if(av!==bv)return bv-av;
    return score(b)-score(a)
  }
  function renderTable(list){
    const box=$('#v65PipeTable'); if(!box)return;
    const rows=list.slice().sort(sortCommercial);
    box.innerHTML=`<table class="v65-pipe-table"><thead><tr><th>Lead</th><th>Etapa</th><th>Cidade</th><th>Tags</th><th>Responsável</th><th>Follow-up</th><th>Valor</th><th>Score</th><th>Ações</th></tr></thead><tbody>${rows.length?rows.map(l=>`<tr data-v65-open="${E(l.id)}"><td><b>${E(l.nome||'Lead')}</b><small>${E(l.segmento||'')}</small></td><td>${E(l.etapa||'Lead')}</td><td>${E(l.cidade||'—')}</td><td>${tags(l).slice(0,3).map(t=>`<span class="mini-tag">${E(t)}</span>`).join('')||'—'}</td><td>${E(l.responsavel||'—')}</td><td class="${isOverdue(l.followup)?'danger':''}">${fmtDate(l.followup)}</td><td>${E(brl(l.valor||0))}</td><td><span class="score-pill ${scoreClass(score(l))}">${score(l)}</span></td><td><button class="btn btn-xs" data-v65-edit="${E(l.id)}" type="button">Editar</button></td></tr>`).join(''):`<tr><td colspan="9" class="crm-empty">Nenhuma oportunidade encontrada.</td></tr>`}</tbody></table>`
  }
  function renderFunnel(list,metrics){
    const box=$('#v65PipeFunnel'); if(!box)return;
    const total=Math.max(1,metrics[0]?.count||list.length||1);
    const losses=list.filter(l=>l.etapa==='Perdido');
    const lossMap={}; losses.forEach(l=>{const r=lossReason(l);lossMap[r]=(lossMap[r]||0)+1});
    const cur=thisMonth(),prev=prevMonth();
    box.innerHTML=`<div class="v65-funnel-grid"><div class="v65-funnel-card"><div class="v65-card-title">Funil real por etapa</div><div class="v65-funnel-stack">${metrics.map((m,i)=>{const w=Math.max(32,Math.round((m.count/total)*100));return `<button type="button" class="v65-funnel-step" data-v65-open-stage="${E(m.name)}" style="--w:${w}%;--stage:${E(m.color)}"><b>${E(m.name)}</b><span>${m.count} · ${E(brl(m.value))} · ${m.conversion}% conv.</span></button>`}).join('')}</div></div><div class="v65-funnel-card"><div class="v65-card-title">Este mês vs mês passado</div><div class="v65-compare-list">${visibleStages().map(s=>{const c=safeLeads().filter(l=>(l.etapa||'Lead')===s.name&&monthKey(leadDate(l))===cur).length;const p=safeLeads().filter(l=>(l.etapa||'Lead')===s.name&&monthKey(leadDate(l))===prev).length;const d=c-p;return `<div><span>${E(s.name)}</span><b>${c}</b><small class="${d>=0?'ok':'danger'}">${d>=0?'+':''}${d}</small></div>`}).join('')}</div></div><div class="v65-funnel-card"><div class="v65-card-title">Perdas por motivo</div><div class="v65-loss-list">${Object.entries(lossMap).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div><span>${E(k)}</span><b>${v}</b></div>`).join('')||'<div class="crm-empty">Nenhuma perda registrada nos filtros.</div>'}</div></div></div>`
  }
  function renderDrawer(stage,list){
    const box=$('#v65PipeDrawer'); if(!box)return;
    const arr=list.filter(l=>(l.etapa||'Lead')===stage).sort(sortCommercial);
    box.classList.remove('hidden');
    box.innerHTML=`<div class="v65-drawer-head"><div><b>Leads em ${E(stage)}</b><span>${arr.length} oportunidade(s) nos filtros atuais.</span></div><button type="button" id="v65DrawerClose">×</button></div><div class="v65-drawer-list">${arr.length?arr.map(l=>`<button type="button" data-v65-open="${E(l.id)}"><div><b>${E(l.nome||'Lead')}</b><span>${E([l.cidade,l.responsavel,l.origem].filter(Boolean).join(' · '))}</span></div><strong>${E(brl(l.valor||0))}</strong></button>`).join(''):'<div class="crm-empty">Nenhum lead nessa etapa.</div>'}</div>`;
    $('#v65DrawerClose')?.addEventListener('click',()=>box.classList.add('hidden'))
  }
  function bindDrag(){
    $$('#v65PipeKanban [data-v65-card]').forEach(card=>{
      card.addEventListener('dragstart',e=>{dragId=card.dataset.v65Card;card.classList.add('dragging');try{e.dataTransfer.setData('text/plain',dragId)}catch(_){}});
      card.addEventListener('dragend',()=>{card.classList.remove('dragging');dragId=null});
      card.addEventListener('click',e=>{if(e.target.closest('a,button'))return;openLead(leadById(card.dataset.v65Card))});
    });
    $$('#v65PipeKanban [data-v65-stage]').forEach(col=>{
      col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('drop')});
      col.addEventListener('dragleave',e=>{if(!col.contains(e.relatedTarget))col.classList.remove('drop')});
      col.addEventListener('drop',e=>{e.preventDefault();col.classList.remove('drop');const id=dragId||e.dataTransfer.getData('text/plain');moveLead(id,col.dataset.v65Stage)})
    })
  }
  function moveLead(id,stage){
    const l=leadById(id); if(!l||!stage||l.etapa===stage)return;
    const old=l.etapa||'Lead';
    l.etapa=stage;l.probabilidade=stageCfg(stage).prob;l.ultimaAtualizacao=today();
    if(stage==='Fechado'&&!l.dataFechamento)l.dataFechamento=today();
    if(stage==='Perdido'&&!l.dataPerda)l.dataPerda=today();
    try{typeof addAtividade==='function'&&addAtividade(l.nome,'Etapa',`${old} → ${stage}`)}catch(e){}
    saveLeadsSafe();render();try{typeof renderLeadsTable==='function'&&renderLeadsTable()}catch(e){}try{window.CRMV64Agenda?.render?.()}catch(e){}
    toast(`${l.nome||'Lead'} movido para ${stage}`,'success')
  }
  function openLead(l){if(!l)return;try{typeof openDetail==='function'?openDetail(l.nome):window.crmOpenLead?.(l.nome)}catch(e){} }
  function editLead(l){if(!l)return;try{typeof openModal==='function'?openModal(l):window.crmOpenLeadModal?.(l)}catch(e){} }
  function quickFollow(id){const l=leadById(id);if(!l)return;l.followup=addDays(1);l.proximaAcao=l.proximaAcao||'Follow-up criado pelo Pipeline';l.ultimaAtualizacao=today();try{typeof addAtividade==='function'&&addAtividade(l.nome,'Nota','Follow-up criado pelo Pipeline para amanhã.')}catch(e){}saveLeadsSafe();render();try{typeof renderLeadsTable==='function'&&renderLeadsTable()}catch(e){}toast('Follow-up criado para amanhã','success')}

  function bind(){
    if(document.body.dataset.v65PipelineBound==='1')return;document.body.dataset.v65PipelineBound='1';
    document.addEventListener('input',e=>{if(e.target.closest('#pipeline #v65PipeSearch,#pipeline #v65PipeStaleDays')){if(e.target.id==='v65PipeStaleDays')localStorage.setItem(STALE_KEY,e.target.value);setTimeout(render,60)}},true);
    document.addEventListener('change',e=>{if(e.target.closest('#pipeline select'))render()},true);
    document.addEventListener('click',e=>{
      const view=e.target.closest('[data-v65-pipe-view]'); if(view){e.preventDefault();setViewMode(view.dataset.v65PipeView);return}
      if(e.target.closest('#v65PipeRefresh')){e.preventDefault();render();toast('Pipeline atualizado','success');return}
      if(e.target.closest('#v65PipeNewLead')){e.preventDefault();try{setView('novo-lead')}catch(err){}return}
      if(e.target.closest('#v65PipeClear')){e.preventDefault();['v65PipeSearch','v65PipeStage','v65PipePriority','v65PipeOrigin','v65PipeOwner','v65PipeCity','v65PipeTag','v65PipeStatus'].forEach(id=>{const el=$('#'+id);if(el)el.value=''});$('#v65PipePeriod')&&($('#v65PipePeriod').value='all');render();return}
      const edit=e.target.closest('[data-v65-edit]'); if(edit){e.preventDefault();e.stopPropagation();editLead(leadById(edit.dataset.v65Edit));return}
      const fol=e.target.closest('[data-v65-follow]'); if(fol){e.preventDefault();e.stopPropagation();quickFollow(fol.dataset.v65Follow);return}
      const open=e.target.closest('[data-v65-open]'); if(open){e.preventDefault();openLead(leadById(open.dataset.v65Open));return}
      const stage=e.target.closest('[data-v65-open-stage]'); if(stage){e.preventDefault();renderDrawer(stage.dataset.v65OpenStage,filteredLeads());return}
    },true);
  }
  function patch(){
    try{window.renderBoard=render}catch(e){}
    try{window.CRMV65Pipeline={render,filteredLeads,stageMetrics}}catch(e){}
    try{const old=window.setView||setView;if(typeof old==='function'&&!old.__pipelineV65){const w=function(v){const out=old.apply(this,arguments);if(v==='pipeline')setTimeout(render,80);return out};w.__pipelineV65=true;window.setView=w;try{setView=w}catch(e){} }}catch(e){}
    try{const old=window.renderAll||renderAll;if(typeof old==='function'&&!old.__pipelineV65){const w=function(){const out=old.apply(this,arguments);if(isActive())setTimeout(render,120);return out};w.__pipelineV65=true;window.renderAll=w;try{renderAll=w}catch(e){} }}catch(e){}
  }
  function render(){
    ensureIds();ensureLayout();syncOptions();
    const list=filteredLeads();const metrics=stageMetrics(list);const view=currentView();
    $$('#pipeline [data-v65-pipe-view]').forEach(b=>b.classList.toggle('active',b.dataset.v65PipeView===view));
    $('#v65PipeKanban')?.classList.toggle('hidden',view!=='kanban');
    $('#v65PipeTable')?.classList.toggle('hidden',view!=='table');
    $('#v65PipeFunnel')?.classList.toggle('hidden',view!=='funnel');
    renderKpis(list);renderInsights(list,metrics);renderKanban(list,metrics);renderTable(list);renderFunnel(list,metrics);
  }
  function isActive(){return !!$('#pipeline.active') || document.body?.dataset.currentView==='pipeline';}
  function init(){bind();patch();try{window.CRMV65Pipeline={render,filteredLeads,stageMetrics}}catch(e){};if(isActive()){ensureLayout();render();setTimeout(render,350)}}
  document.addEventListener('crm:viewchange',e=>{if(e.detail?.view==='pipeline')setTimeout(()=>{ensureLayout();render();},45)});
  document.addEventListener('crm:datachange',()=>{if(isActive())setTimeout(render,100)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
