/* CRM V62 — Central de Leads profissional
   Substitui a camada v19 sem criar segunda tabela, sem painel v6 concorrente e usando a mesma base de dados outbounder_leads_v5. */
(function(){
  'use strict';
  window.__crmV62LeadsActive = true;
  const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
  const $=(q,r=document)=>r.querySelector(q);
  const STAGES=['Lead','Contato','Proposta','Fechado','Perdido'];
  const PRIORITIES=['Alta','Média','Baixa'];
  const ORIGINS=['Inbound','Outbound','Indicação','Garimpo','Instagram','Google','Manual','Outro'];
  const COL_KEY='crm_v62_leads_columns';
  const FILTER_KEY='crm_v62_leads_filters';
  const PAGE_SIZE=50;
  let quickFilter='all';
  let page=0;
  let selected=new Set();
  let filters={q:'',stage:'',priority:'',origin:'',owner:'',special:''};
  let sort={key:'score',dir:-1};

  const fallbackEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const E=v=>{try{return typeof esc==='function'?esc(v):fallbackEsc(v)}catch(e){return fallbackEsc(v)}};
  const today=()=>{try{return typeof todayStr==='function'?todayStr():new Date().toISOString().slice(0,10)}catch(e){return new Date().toISOString().slice(0,10)}};
  const addDays=n=>{const d=new Date(today()+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
  const list=()=>{try{return Array.isArray(leads)?leads:[]}catch(e){return []}};
  const save=()=>{try{typeof saveLeads==='function'&&saveLeads()}catch(e){} try{syncLeadBadge()}catch(e){}};
  const toast=(m,t)=>{try{typeof showToast==='function'?showToast(m,t):console.log(m)}catch(e){console.log(m)}};
  const brl=v=>{try{return typeof money==='function'?money(Number(v)||0):new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v)||0)}catch(e){return 'R$ '+(Number(v)||0)}};
  const fmt=v=>{try{return v?(typeof fmtDate==='function'?fmtDate(v):new Date(String(v).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR')):'—'}catch(e){return v||'—'}};
  const overdue=v=>{try{return v&&typeof isOverdue==='function'?isOverdue(v):v&&String(v).slice(0,10)<today()}catch(e){return false}};
  const days=v=>{try{return v?Math.floor((new Date(today()+'T12:00:00')-new Date(String(v).slice(0,10)+'T12:00:00'))/86400000):0}catch(e){return 0}};
  const digits=v=>String(v||'').replace(/\D/g,'');
  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  const idOf=l=>{if(!l.id)l.id='lead_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);return l.id};
  const find=id=>list().find(l=>String(idOf(l))===String(id)||String(l.nome)===String(id));
  const score=l=>{try{return typeof calcScore==='function'?calcScore(l):localScore(l)}catch(e){return localScore(l)}};
  function localScore(l){
    const sp={Lead:10,Contato:25,Proposta:55,Fechado:100,Perdido:0};
    const pp={Alta:30,'Média':16,Baixa:6};
    let s=(sp[l.etapa]||0)+(pp[l.prioridade]||0)+Math.min(25,Math.round((Number(l.valor)||0)/1000));
    if(l.telefone||l.email)s+=8;
    if(l.followup&&!overdue(l.followup))s+=8;
    if(l.proximaAcao)s+=5;
    return Math.max(0,Math.min(100,s));
  }
  const scoreClass=s=>s>=75?'score-hi':s>=45?'score-md':'score-lo';

  function normalize(){
    let changed=false;
    list().forEach((l,i)=>{
      if(!l.id){l.id='lead_'+Date.now().toString(36)+'_'+i+'_'+Math.random().toString(36).slice(2,7);changed=true;}
      if(!l.etapa){l.etapa='Lead';changed=true;}
      if(!l.prioridade){l.prioridade='Média';changed=true;}
      if(!l.responsavel){l.responsavel='Não definido';changed=true;}
      if(l.origem==='Outbound' && l.garimpoOrigem){l.origem='Garimpo';changed=true;}
      if(!l.criadoEm && l.dataEntrada){l.criadoEm=l.dataEntrada;changed=true;}
    });
    if(changed)save();
  }
  function duplicateMap(){
    const map=new Map();
    list().forEach(l=>{
      const keys=[digits(l.telefone),norm(l.email),norm(l.nome)].filter(Boolean);
      keys.forEach(k=>{if(!map.has(k))map.set(k,[]);map.get(k).push(idOf(l));});
    });
    return map;
  }
  function isDuplicate(l){
    const dm=duplicateMap();
    return [digits(l.telefone),norm(l.email),norm(l.nome)].filter(Boolean).some(k=>(dm.get(k)||[]).length>1);
  }
  function quality(l){
    if(isDuplicate(l))return {t:'Possível duplicado',c:'warn'};
    if(!l.telefone&&!l.email)return {t:'Sem contato',c:'danger'};
    if(!l.followup&&!['Fechado','Perdido'].includes(l.etapa))return {t:'Sem próxima ação',c:'warn'};
    if(overdue(l.followup)&&!['Fechado','Perdido'].includes(l.etapa))return {t:'Follow-up vencido',c:'danger'};
    if(score(l)>=75&&!['Fechado','Perdido'].includes(l.etapa))return {t:'Quente',c:'blue'};
    return {t:'Saudável',c:'ok'};
  }
  function nextAction(l){
    if(l.proximaAcao)return l.proximaAcao;
    if(l.followup)return overdue(l.followup)?'Retomar contato atrasado':'Follow-up agendado';
    if(l.etapa==='Lead')return 'Fazer primeiro contato';
    if(l.etapa==='Contato')return 'Qualificar necessidade';
    if(l.etapa==='Proposta')return 'Cobrar retorno da proposta';
    if(l.etapa==='Fechado')return 'Acompanhar pós-venda';
    if(l.etapa==='Perdido')return 'Avaliar reativação';
    return 'Definir próxima ação';
  }
  function loadFilters(){try{filters=Object.assign(filters,JSON.parse(localStorage.getItem(FILTER_KEY)||'{}'))}catch(e){}}
  function saveFilters(){try{localStorage.setItem(FILTER_KEY,JSON.stringify(filters))}catch(e){}}
  const colDefs=[
    {key:'score',label:'Score',hint:'Pontuação comercial',sort:'score',default:true},
    {key:'lead',label:'Lead',hint:'Nome, origem e ID',sort:'nome',default:true},
    {key:'etapa',label:'Etapa',hint:'Editar direto',sort:'etapa',default:true},
    {key:'prioridade',label:'Prioridade',hint:'Editar direto',sort:'prioridade',default:true},
    {key:'responsavel',label:'Responsável',hint:'Dono do próximo passo',sort:'responsavel',default:true},
    {key:'origem',label:'Origem',hint:'Canal de entrada',sort:'origem',default:true},
    {key:'proxima',label:'Próxima ação',hint:'Ação e data de follow-up',sort:'followup',default:true},
    {key:'contato',label:'Contato',hint:'WhatsApp, ligação e e-mail',sort:'',default:true},
    {key:'valor',label:'Valor',hint:'Potencial da oportunidade',sort:'valor',default:true},
    {key:'qualidade',label:'Qualidade',hint:'Saúde do cadastro',sort:'qualidade',default:true},
    {key:'segmento',label:'Segmento',hint:'Nicho ou área',sort:'segmento',default:false},
    {key:'tags',label:'Tags',hint:'Marcadores rápidos',sort:'tags',default:false},
    {key:'atualizado',label:'Atualizado',hint:'Última movimentação',sort:'ultimaAtualizacao',default:false},
    {key:'acoes',label:'Ações',hint:'Abrir, editar e agendar',sort:'',default:true}
  ];
  function defaultPrefs(){return {order:colDefs.map(c=>c.key),visible:Object.fromEntries(colDefs.map(c=>[c.key,c.default!==false]))}}
  function loadPrefs(){try{const raw=JSON.parse(localStorage.getItem(COL_KEY)||'null');const d=defaultPrefs();if(!raw)return d;const order=[...(raw.order||[]).filter(k=>colDefs.some(c=>c.key===k)),...d.order.filter(k=>!(raw.order||[]).includes(k))];return {order,visible:Object.assign(d.visible,raw.visible||{})}}catch(e){return defaultPrefs()}}
  function savePrefs(p){try{localStorage.setItem(COL_KEY,JSON.stringify(p))}catch(e){}}
  function activeCols(){const p=loadPrefs();return p.order.map(k=>colDefs.find(c=>c.key===k)).filter(Boolean).filter(c=>p.visible[c.key]!==false)}

  function owners(){return [...new Set(list().map(l=>l.responsavel||'Não definido').filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
  function origins(){return [...new Set([...ORIGINS,...list().map(l=>l.origem).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
  function baseFiltered(){
    let arr=list().filter(l=>{
      const q=norm(filters.q);
      if(q && ![l.nome,l.segmento,l.responsavel,l.email,l.telefone,l.origem,l.tags,l.proximaAcao,l.cidade,l.produtoInteresse,l.decisor].some(v=>norm(v).includes(q)))return false;
      if(filters.stage && l.etapa!==filters.stage)return false;
      if(filters.priority && l.prioridade!==filters.priority)return false;
      if(filters.origin && l.origem!==filters.origin)return false;
      if(filters.owner && (l.responsavel||'Não definido')!==filters.owner)return false;
      if(filters.special==='sem_followup' && (l.followup||l.proximaAcao))return false;
      if(filters.special==='vencidos' && !overdue(l.followup))return false;
      if(filters.special==='parados' && days(l.ultimaAtualizacao||l.dataEntrada)<7)return false;
      if(filters.special==='duplicados' && !isDuplicate(l))return false;
      if(filters.special==='sem_contato' && (l.telefone||l.email))return false;
      return true;
    });
    if(quickFilter==='hot')arr=arr.filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&score(l)>=75);
    if(quickFilter==='overdue')arr=arr.filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&overdue(l.followup));
    if(quickFilter==='no_next')arr=arr.filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&!l.followup&&!l.proximaAcao);
    if(quickFilter==='proposal')arr=arr.filter(l=>l.etapa==='Proposta');
    if(quickFilter==='won')arr=arr.filter(l=>l.etapa==='Fechado');
    if(quickFilter==='duplicates')arr=arr.filter(isDuplicate);
    arr.sort((a,b)=>{
      let va,vb;
      if(sort.key==='score'){va=score(a);vb=score(b)}
      else if(sort.key==='valor'){va=Number(a.valor)||0;vb=Number(b.valor)||0}
      else if(sort.key==='qualidade'){va=quality(a).t;vb=quality(b).t}
      else{va=String(a[sort.key]||'').toLowerCase();vb=String(b[sort.key]||'').toLowerCase()}
      return va<vb?-sort.dir:va>vb?sort.dir:0;
    });
    return arr;
  }

  function clearLegacyLeadOverlays(){
    $('#v6LeadsPanel')?.remove();
    $('#v19LeadsHero')?.remove();
    $('#v19LeadKpis')?.remove();
    $('#v19ColsModal')?.remove();
    $('#v19ExportModal')?.remove();
    const st=$('#v6LeadColStyle'); if(st)st.textContent='';
  }
  function ensureLayout(){
    const pageEl=$('#leads'); if(!pageEl)return;
    clearLegacyLeadOverlays();
    const sectionTitle=pageEl.querySelector('.section-title-text'); if(sectionTitle)sectionTitle.textContent='Central de Leads';
    const sectionSub=pageEl.querySelector('.section-sub'); if(sectionSub)sectionSub.textContent='Ficha comercial, filtros, próximos passos e saúde da base';
    const card=pageEl.querySelector('.card'); if(card)card.id='v62LeadsCard';
    if(!$('#v62LeadsHero')){
      const hero=document.createElement('div');hero.id='v62LeadsHero';hero.innerHTML=`
        <div class="v62-hero-copy"><span>Central comercial</span><h2>Leads com ficha, ação e prioridade no mesmo lugar</h2><p>Use esta tela como base principal: qualifique, filtre, edite, acione e organize próximos passos sem abrir páginas duplicadas.</p></div>
        <div class="v62-hero-actions"><button class="btn btn-primary" id="v62HeroNewLead" type="button">Novo lead</button><button class="btn" id="v62HeroColumns" type="button">Colunas</button><button class="btn" id="v62HeroExport" type="button">Exportar</button></div>`;
      pageEl.querySelector('.section-header')?.insertAdjacentElement('afterend',hero);
    }
    if(!$('#v62LeadKpis')){
      const kpis=document.createElement('div');kpis.id='v62LeadKpis';kpis.innerHTML=`
        <button type="button" class="v62-lead-kpi active" data-v62-kpi="all"><b>0</b><span>Total</span><small>Base cadastrada</small></button>
        <button type="button" class="v62-lead-kpi" data-v62-kpi="hot"><b>0</b><span>Quentes</span><small>Score alto</small></button>
        <button type="button" class="v62-lead-kpi" data-v62-kpi="overdue"><b>0</b><span>Atrasados</span><small>Follow-ups vencidos</small></button>
        <button type="button" class="v62-lead-kpi" data-v62-kpi="no_next"><b>0</b><span>Sem ação</span><small>Precisam de próximo passo</small></button>
        <button type="button" class="v62-lead-kpi" data-v62-kpi="proposal"><b>0</b><span>Propostas</span><small>Negociação aberta</small></button>
        <button type="button" class="v62-lead-kpi" data-v62-kpi="won"><b>0</b><span>Ganhos</span><small>Clientes fechados</small></button>`;
      $('#v62LeadsHero')?.insertAdjacentElement('afterend',kpis);
    }
    const toolbar=pageEl.querySelector('.leads-toolbar');
    if(toolbar && toolbar.dataset.v62!=='1'){
      toolbar.dataset.v62='1';
      toolbar.innerHTML=`
        <div class="v62-toolbar-line">
          <div class="search-wrap"><svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><use href="#ic-search"></use></svg><input class="search-input" id="leadsSearch" placeholder="Buscar por nome, telefone, origem, responsável, tag..." type="search"/></div>
          <button class="btn btn-sm" id="v62ColumnsBtn" type="button">Colunas</button>
          <button class="btn btn-sm" id="v62ExportBtn" type="button">Exportar</button>
          <button class="btn btn-sm btn-primary" id="v62NewLeadBtn" type="button">Novo lead</button>
        </div>
        <div class="v62-filter-grid">
          <select id="v62StageFilter"><option value="">Todas etapas</option>${STAGES.map(s=>`<option>${E(s)}</option>`).join('')}</select>
          <select id="v62PriorityFilter"><option value="">Todas prioridades</option>${PRIORITIES.map(s=>`<option>${E(s)}</option>`).join('')}</select>
          <select id="v62OriginFilter"><option value="">Todas origens</option></select>
          <select id="v62OwnerFilter"><option value="">Todos responsáveis</option></select>
          <select id="v62SpecialFilter"><option value="">Todos leads</option><option value="sem_followup">Sem follow-up</option><option value="vencidos">Follow-up vencido</option><option value="parados">Parados há 7+ dias</option><option value="duplicados">Possíveis duplicados</option><option value="sem_contato">Sem telefone/e-mail</option></select>
          <button class="btn btn-sm" id="v62ClearFilters" type="button">Limpar filtros</button>
        </div>`;
    }
    const wrap=$('#leads table.data-table')?.parentElement; if(wrap)wrap.classList.add('v62-table-wrap');
    ensureModals();
  }
  function refreshFilterOptions(){
    const origin=$('#v62OriginFilter'); if(origin){const v=origin.value;origin.innerHTML='<option value="">Todas origens</option>'+origins().map(o=>`<option value="${E(o)}">${E(o)}</option>`).join('');origin.value=v;}
    const owner=$('#v62OwnerFilter'); if(owner){const v=owner.value;owner.innerHTML='<option value="">Todos responsáveis</option>'+owners().map(o=>`<option value="${E(o)}">${E(o)}</option>`).join('');owner.value=v;}
    $('#leadsSearch')&&($('#leadsSearch').value=filters.q||'');
    $('#v62StageFilter')&&($('#v62StageFilter').value=filters.stage||'');
    $('#v62PriorityFilter')&&($('#v62PriorityFilter').value=filters.priority||'');
    $('#v62OriginFilter')&&($('#v62OriginFilter').value=filters.origin||'');
    $('#v62OwnerFilter')&&($('#v62OwnerFilter').value=filters.owner||'');
    $('#v62SpecialFilter')&&($('#v62SpecialFilter').value=filters.special||'');
  }
  function ensureModals(){
    if(!$('#v62ColumnsModal')){
      const m=document.createElement('div');m.id='v62ColumnsModal';m.className='modal-overlay hidden';m.innerHTML=`<div class="modal-box"><div class="modal-head"><h3>Personalizar colunas da Central de Leads</h3><button class="modal-close" id="v62ColumnsClose" type="button">×</button></div><div class="modal-body"><div class="card-sub">Marque o que quer ver e arraste para reorganizar. Isso salva apenas a visualização, sem alterar seus leads.</div><div id="v62ColumnList" class="v62-column-list"></div></div><div class="modal-foot"><button class="btn" id="v62ColumnsReset" type="button">Restaurar padrão</button><button class="btn btn-primary" id="v62ColumnsSave" type="button">Salvar</button></div></div>`;document.body.appendChild(m);
    }
    if(!$('#v62ExportModal')){
      const m=document.createElement('div');m.id='v62ExportModal';m.className='modal-overlay hidden';m.innerHTML=`<div class="modal-box"><div class="modal-head"><h3>Exportar leads</h3><button class="modal-close" id="v62ExportClose" type="button">×</button></div><div class="modal-body"><div class="v62-export-options"><button type="button" data-v62-export="all"><b>Todos os leads</b><span>Exporta a base completa.</span></button><button type="button" data-v62-export="filtered"><b>Resultado filtrado</b><span>Exporta exatamente o que aparece na busca atual.</span></button><button type="button" data-v62-export="selected"><b>Selecionados</b><span>Exporta apenas os leads marcados.</span></button><button type="button" data-v62-export="hot"><b>Leads quentes</b><span>Oportunidades abertas com score alto.</span></button></div></div></div>`;document.body.appendChild(m);
    }
  }
  function renderColumnsModal(){
    const p=loadPrefs(),box=$('#v62ColumnList'); if(!box)return;
    box.innerHTML=p.order.map(k=>{const c=colDefs.find(x=>x.key===k);return c?`<div class="v62-column-item" draggable="true" data-col="${E(c.key)}"><span class="v62-drag">⋮⋮</span><div><b>${E(c.label)}</b><small>${E(c.hint)}</small></div><input type="checkbox" ${p.visible[c.key]!==false?'checked':''}></div>`:''}).join('');
    let drag=null;
    $$('.v62-column-item',box).forEach(item=>{
      item.addEventListener('dragstart',()=>{drag=item;item.classList.add('dragging')});
      item.addEventListener('dragend',()=>{item.classList.remove('dragging');drag=null});
      item.addEventListener('dragover',e=>{e.preventDefault();const after=[...box.querySelectorAll('.v62-column-item:not(.dragging)')].find(el=>e.clientY<=el.getBoundingClientRect().top+el.offsetHeight/2);if(after)box.insertBefore(drag,after);else box.appendChild(drag);});
    });
  }
  function saveColumnsModal(){
    const p=loadPrefs(),box=$('#v62ColumnList'); if(!box)return;
    p.order=$$('.v62-column-item',box).map(i=>i.dataset.col);
    $$('.v62-column-item',box).forEach(i=>p.visible[i.dataset.col]=!!i.querySelector('input')?.checked);
    if(!Object.values(p.visible).some(Boolean))p.visible.lead=true;
    savePrefs(p);$('#v62ColumnsModal')?.classList.add('hidden');render();
  }

  function renderKpis(){
    const data=list(); const open=data.filter(l=>!['Fechado','Perdido'].includes(l.etapa));
    const values={
      all:data.length,
      hot:open.filter(l=>score(l)>=75).length,
      overdue:open.filter(l=>overdue(l.followup)).length,
      no_next:open.filter(l=>!l.followup&&!l.proximaAcao).length,
      proposal:data.filter(l=>l.etapa==='Proposta').length,
      won:data.filter(l=>l.etapa==='Fechado').length,
      duplicates:data.filter(isDuplicate).length
    };
    Object.entries(values).forEach(([k,v])=>{const el=$(`[data-v62-kpi="${k}"] b`);if(el)el.textContent=v});
    $$('#v62LeadKpis [data-v62-kpi]').forEach(btn=>btn.classList.toggle('active',btn.dataset.v62Kpi===quickFilter));
  }
  function tagPills(tags){
    const arr=String(tags||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0,3);
    return arr.length?`<div class="v62-tags">${arr.map(t=>`<span>${E(t)}</span>`).join('')}</div>`:'<span class="muted">—</span>';
  }
  function renderCell(c,l){
    const id=E(idOf(l)),tel=l.telefone||'',em=l.email||'',wn=digits(tel),q=quality(l),sc=score(l);
    if(c.key==='score')return `<td class="v62-score-cell"><span class="score-pill ${scoreClass(sc)}">${sc}</span></td>`;
    if(c.key==='lead')return `<td><div class="v62-lead-main"><div class="v62-avatar">${E((l.nome||'?').charAt(0).toUpperCase())}</div><div><div class="v62-lead-name">${E(l.nome||'Lead')}</div><div class="v62-lead-meta"><span>${E(l.segmento||'Sem segmento')}</span><span>${E(l.cidade||l.origem||'Sem origem')}</span><span class="v62-id">${E(String(idOf(l)).slice(-6))}</span></div></div></div></td>`;
    if(c.key==='etapa')return `<td data-stop="1"><select class="v62-quick-select" data-v62-edit="etapa" data-id="${id}">${STAGES.map(s=>`<option value="${E(s)}" ${l.etapa===s?'selected':''}>${E(s)}</option>`).join('')}</select></td>`;
    if(c.key==='prioridade')return `<td data-stop="1"><select class="v62-quick-select" data-v62-edit="prioridade" data-id="${id}">${PRIORITIES.map(s=>`<option value="${E(s)}" ${l.prioridade===s?'selected':''}>${E(s)}</option>`).join('')}</select></td>`;
    if(c.key==='responsavel')return `<td data-stop="1"><input class="v62-quick-input" data-v62-edit="responsavel" data-id="${id}" value="${E(l.responsavel||'')}"></td>`;
    if(c.key==='origem')return `<td><span class="v62-origin">${E(l.origem||'Não informado')}</span></td>`;
    if(c.key==='proxima')return `<td data-stop="1"><div class="v62-next"><input class="v62-quick-input wide" data-v62-edit="proximaAcao" data-id="${id}" value="${E(nextAction(l))}"><input type="date" class="v62-quick-date" data-v62-edit="followup" data-id="${id}" value="${E(l.followup||'')}">${overdue(l.followup)?'<small class="danger">vencido</small>':''}</div></td>`;
    if(c.key==='contato')return `<td data-stop="1"><div class="v62-contact-actions">${tel?`<a href="https://wa.me/55${wn}" target="_blank" rel="noopener" class="row-action wa" title="WhatsApp">${typeof ICON_WHATSAPP!=='undefined'?ICON_WHATSAPP:'WA'}</a>`:''}${tel?`<a href="tel:${E(tel)}" class="row-action" title="Ligar">${typeof ICON_CALL!=='undefined'?ICON_CALL:'☎'}</a>`:''}${em?`<a href="mailto:${E(em)}" class="row-action" title="E-mail">${typeof ICON_MAIL!=='undefined'?ICON_MAIL:'@'}</a>`:''}${(!tel&&!em)?'<span class="muted">—</span>':''}</div></td>`;
    if(c.key==='valor')return `<td data-stop="1"><input type="number" class="v62-quick-value" data-v62-edit="valor" data-id="${id}" value="${Number(l.valor)||0}" min="0" step="100"></td>`;
    if(c.key==='qualidade')return `<td><span class="v62-quality ${q.c}">${E(q.t)}</span></td>`;
    if(c.key==='segmento')return `<td>${E(l.segmento||'—')}</td>`;
    if(c.key==='tags')return `<td>${tagPills(l.tags)}</td>`;
    if(c.key==='atualizado')return `<td>${fmt(l.ultimaAtualizacao||l.criadoEm||l.dataEntrada)}</td>`;
    if(c.key==='acoes')return `<td data-stop="1"><div class="v62-row-actions"><button class="row-action primary" data-v62-open="${id}" type="button">Abrir</button><button class="row-action" data-v62-edit-modal="${id}" type="button" title="Editar">${typeof ICON_EDIT!=='undefined'?ICON_EDIT:'✎'}</button><button class="row-action" data-v62-follow="${id}" type="button" title="Agendar +2 dias">+2d</button></div></td>`;
    return `<td>—</td>`;
  }
  function renderTable(){
    const tbody=$('#clientTable'),table=$('#leads table.data-table'); if(!tbody||!table)return;
    const cols=activeCols();
    const head=table.querySelector('thead');
    if(head)head.innerHTML=`<tr><th class="v62-select-col"><input type="checkbox" id="selectAll"></th>${cols.map(c=>`<th ${c.sort?`data-v62-sort="${E(c.sort)}"`:''}>${E(c.label)} ${c.sort?'<span class="sort-arrow">↕</span>':''}</th>`).join('')}</tr>`;
    const rows=baseFiltered(); const total=rows.length; const totalPages=Math.max(1,Math.ceil(total/PAGE_SIZE)); if(page>=totalPages)page=totalPages-1;
    const paged=rows.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
    tbody.innerHTML=paged.length?paged.map(l=>`<tr data-id="${E(idOf(l))}" class="${selected.has(idOf(l))?'selected-row':''}"><td data-stop="1" class="v62-select-col"><input type="checkbox" class="lead-cb" data-id="${E(idOf(l))}" ${selected.has(idOf(l))?'checked':''}></td>${cols.map(c=>renderCell(c,l)).join('')}</tr>`).join(''):`<tr><td colspan="${cols.length+1}" class="crm-empty">Nenhum lead encontrado com os filtros atuais.</td></tr>`;
    renderPagination(total,totalPages,paged.length);
    bindTable();
  }
  function renderPagination(total,totalPages,count){
    const wrap=$('#ltPaginationWrap'); if(!wrap)return;
    if(totalPages<=1){wrap.innerHTML=`<div class="v62-result-info">${total} lead(s) encontrados</div>`;return;}
    const start=total? page*PAGE_SIZE+1:0, end=Math.min((page+1)*PAGE_SIZE,total);
    wrap.innerHTML=`<div class="pagination"><span class="pg-info">${start}–${end} de ${total} leads</span><div class="pg-btns"><button class="pg-btn" data-v62-pg="first" ${page===0?'disabled':''}>«</button><button class="pg-btn" data-v62-pg="prev" ${page===0?'disabled':''}>‹</button><span class="pg-cur">Pág. ${page+1}/${totalPages}</span><button class="pg-btn" data-v62-pg="next" ${page>=totalPages-1?'disabled':''}>›</button><button class="pg-btn" data-v62-pg="last" ${page>=totalPages-1?'disabled':''}>»</button></div></div>`;
  }
  function bindTable(){
    $$('#clientTable tr[data-id]').forEach(tr=>tr.addEventListener('click',e=>{if(e.target.closest('[data-stop],button,a,input,select,textarea'))return;openLead(tr.dataset.id)}));
    $$('.lead-cb').forEach(cb=>cb.addEventListener('change',()=>{cb.checked?selected.add(cb.dataset.id):selected.delete(cb.dataset.id);cb.closest('tr')?.classList.toggle('selected-row',cb.checked);updateBulkBar()}));
    $('#selectAll')?.addEventListener('change',e=>{const ids=$$('#clientTable .lead-cb').map(c=>c.dataset.id);ids.forEach(id=>e.target.checked?selected.add(id):selected.delete(id));renderTable();updateBulkBar();});
    $$('[data-v62-sort]').forEach(th=>th.addEventListener('click',()=>{const k=th.dataset.v62Sort;if(sort.key===k)sort.dir*=-1;else{sort.key=k;sort.dir=1}page=0;render()}));
    $$('[data-v62-edit]').forEach(inp=>{
      inp.addEventListener('change',()=>saveQuick(inp));
      inp.addEventListener('blur',()=>saveQuick(inp));
      inp.addEventListener('click',e=>e.stopPropagation());
      inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();inp.blur();}});
    });
    $$('[data-v62-open]').forEach(b=>b.addEventListener('click',()=>openLead(b.dataset.v62Open)));
    $$('[data-v62-edit-modal]').forEach(b=>b.addEventListener('click',()=>editLead(b.dataset.v62EditModal)));
    $$('[data-v62-follow]').forEach(b=>b.addEventListener('click',()=>quickFollow(b.dataset.v62Follow,2)));
    $('#ltPaginationWrap')?.querySelectorAll('[data-v62-pg]').forEach(b=>b.addEventListener('click',()=>{const totalPages=Math.max(1,Math.ceil(baseFiltered().length/PAGE_SIZE));const a=b.dataset.v62Pg;if(a==='first')page=0;if(a==='prev')page=Math.max(0,page-1);if(a==='next')page=Math.min(totalPages-1,page+1);if(a==='last')page=totalPages-1;render()}));
    const ids=$$('#clientTable .lead-cb').map(c=>c.dataset.id); const sa=$('#selectAll'); if(sa)sa.checked=ids.length>0&&ids.every(id=>selected.has(id));
  }
  function saveQuick(inp){
    const l=find(inp.dataset.id); if(!l)return;
    const field=inp.dataset.v62Edit; let value=inp.value; const old=l[field];
    if(field==='valor')value=Number(value)||0;
    if(field==='etapa'){
      if(l.etapa!==value){try{typeof applyStageChange==='function'?applyStageChange(l,value):l.etapa=value}catch(e){l.etapa=value}}
    }else l[field]=value;
    l.ultimaAtualizacao=today();
    if(field==='followup' && value && !l.proximaAcao)l.proximaAcao='Follow-up agendado';
    try{if(field!=='etapa'&&typeof addAtividade==='function'&&String(old)!==String(value))addAtividade(l.nome,'Nota',`${labelField(field)} atualizado para ${value||'—'}.`)}catch(e){}
    save();
    try{typeof renderBoard==='function'&&renderBoard();typeof renderKPIs==='function'&&renderKPIs()}catch(e){}
    if(['etapa','prioridade','origem','responsavel'].includes(field))refreshFilterOptions();
    render();toast('Lead atualizado','success');
  }
  function labelField(f){return ({etapa:'Etapa',prioridade:'Prioridade',responsavel:'Responsável',followup:'Follow-up',valor:'Valor',proximaAcao:'Próxima ação'}[f]||f)}
  function openLead(id){const l=find(id); if(!l)return; try{typeof openDetail==='function'?openDetail(l.nome):window.crmOpenLead?.(l.nome)}catch(e){}}
  function editLead(id){const l=find(id); if(!l)return; try{typeof openModal==='function'?openModal(l):window.crmOpenLeadModal?.(l)}catch(e){}}
  function quickFollow(id,n){const l=find(id); if(!l)return;l.followup=addDays(n);l.proximaAcao=l.proximaAcao||'Retomar contato';l.ultimaAtualizacao=today();try{typeof addAtividade==='function'&&addAtividade(l.nome,'Nota',`Follow-up agendado para ${fmt(l.followup)}.`)}catch(e){}save();render();toast('Follow-up agendado','success')}
  function updateBulkBar(){const bar=$('#bulkBar');if(!bar)return;bar.classList.toggle('visible',selected.size>0);$('#bulkCount')&&($('#bulkCount').textContent=selected.size)}
  function bindBulk(){
    const clone=(id,fn)=>{const el=$('#'+id);if(!el)return;const c=el.cloneNode(true);el.parentNode.replaceChild(c,el);c.addEventListener('click',fn)};
    clone('bulkClearBtn',()=>{selected.clear();render();updateBulkBar()});
    clone('bulkDeleteBtn',()=>{if(!selected.size)return;if(!confirm(`Excluir ${selected.size} lead(s)?`))return;[...selected].forEach(id=>{const i=list().findIndex(l=>idOf(l)===id);if(i>-1)list().splice(i,1)});selected.clear();save();renderAllSafe();updateBulkBar();toast('Leads excluídos','warn')});
    clone('bulkStageBtn',()=>$('#bulkStageBackdrop')?.classList.remove('hidden'));
    clone('bulkRespBtn',()=>{const i=$('#bulkRespInput');if(i)i.value='';$('#bulkRespBackdrop')?.classList.remove('hidden')});
    clone('bulkStageConfirm',()=>{const s=$('#bulkStageSelect')?.value||'Lead';[...selected].forEach(id=>{const l=find(id);if(l){try{typeof applyStageChange==='function'?applyStageChange(l,s):l.etapa=s}catch(e){l.etapa=s};l.ultimaAtualizacao=today();}});selected.clear();save();$('#bulkStageBackdrop')?.classList.add('hidden');renderAllSafe();updateBulkBar();toast(`Movidos para ${s}`,'success')});
    clone('bulkRespConfirm',()=>{const r=($('#bulkRespInput')?.value||'').trim();if(!r)return;[...selected].forEach(id=>{const l=find(id);if(l){l.responsavel=r;l.ultimaAtualizacao=today();try{typeof addAtividade==='function'&&addAtividade(l.nome,'Nota',`Responsável alterado para ${r}.`)}catch(e){}}});selected.clear();save();$('#bulkRespBackdrop')?.classList.add('hidden');render();updateBulkBar();toast(`Responsável → ${r}`,'success')});
  }
  function bindGlobal(){
    if(document.body.dataset.v62LeadsBound)return;document.body.dataset.v62LeadsBound='1';
    document.addEventListener('click',e=>{
      if(e.target.closest('#v62HeroNewLead,#v62NewLeadBtn,#openNewLeadBtn,#openNewLeadBtn2')){e.preventDefault();e.stopImmediatePropagation();try{typeof setView==='function'?setView('novo-lead'):window.setView('novo-lead')}catch(err){};return;}
      if(e.target.closest('#v62HeroColumns,#v62ColumnsBtn')){e.preventDefault();renderColumnsModal();$('#v62ColumnsModal')?.classList.remove('hidden');return;}
      if(e.target.closest('#v62ColumnsClose')){$('#v62ColumnsModal')?.classList.add('hidden');return;}
      if(e.target.closest('#v62ColumnsSave')){saveColumnsModal();return;}
      if(e.target.closest('#v62ColumnsReset')){localStorage.removeItem(COL_KEY);renderColumnsModal();render();return;}
      if(e.target.closest('#v62HeroExport,#v62ExportBtn,#exportCsvBtn,#exportCsvBtn2')){e.preventDefault();e.stopImmediatePropagation();$('#v62ExportModal')?.classList.remove('hidden');return;}
      if(e.target.closest('#v62ExportClose')){$('#v62ExportModal')?.classList.add('hidden');return;}
      const ex=e.target.closest('[data-v62-export]'); if(ex){exportRows(ex.dataset.v62Export);return;}
      const k=e.target.closest('[data-v62-kpi]'); if(k){quickFilter=k.dataset.v62Kpi||'all';page=0;render();return;}
      if(e.target.id==='v62ColumnsModal'||e.target.id==='v62ExportModal')e.target.classList.add('hidden');
    },true);
    document.addEventListener('input',e=>{if(e.target?.id==='leadsSearch'){filters.q=e.target.value;quickFilter='all';page=0;saveFilters();render()}},true);
    document.addEventListener('change',e=>{
      if(e.target?.id==='v62StageFilter'){filters.stage=e.target.value;quickFilter='all';page=0;saveFilters();render()}
      if(e.target?.id==='v62PriorityFilter'){filters.priority=e.target.value;quickFilter='all';page=0;saveFilters();render()}
      if(e.target?.id==='v62OriginFilter'){filters.origin=e.target.value;quickFilter='all';page=0;saveFilters();render()}
      if(e.target?.id==='v62OwnerFilter'){filters.owner=e.target.value;quickFilter='all';page=0;saveFilters();render()}
      if(e.target?.id==='v62SpecialFilter'){filters.special=e.target.value;quickFilter='all';page=0;saveFilters();render()}
    },true);
    document.addEventListener('click',e=>{if(e.target?.id==='v62ClearFilters'){filters={q:'',stage:'',priority:'',origin:'',owner:'',special:''};quickFilter='all';page=0;saveFilters();render()}},true);
  }
  function exportRows(type){
    let rows=[];if(type==='all')rows=list();else if(type==='selected')rows=list().filter(l=>selected.has(idOf(l)));else if(type==='hot')rows=list().filter(l=>!['Fechado','Perdido'].includes(l.etapa)&&score(l)>=75);else rows=baseFiltered();
    if(!rows.length){toast('Nenhum lead para exportar','warn');return;}
    const headers=['ID','Nome','Segmento','Cidade','Etapa','Prioridade','Responsável','Origem','Telefone','Email','Follow-up','Próxima ação','Valor','Score','Qualidade','Tags','Produto','Decisor','Canal','Última atualização','Observações'];
    const csv=v=>{const s=String(v??'');return /[;"\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};
    const lines=[headers.join(';'),...rows.map(l=>[idOf(l),l.nome,l.segmento,l.cidade,l.etapa,l.prioridade,l.responsavel,l.origem,l.telefone,l.email,l.followup,nextAction(l),l.valor,score(l),quality(l).t,l.tags,l.produtoInteresse,l.decisor,l.canalPreferido,l.ultimaAtualizacao,l.obs].map(csv).join(';'))];
    const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`central-leads-${type}-${today()}.csv`;a.click();URL.revokeObjectURL(a.href);$('#v62ExportModal')?.classList.add('hidden');toast('CSV exportado','success');
  }
  function renderAllSafe(){try{typeof renderAll==='function'?renderAll():render()}catch(e){render()}}
  function patchCore(){
    try{filteredLeads=baseFiltered;window.filteredLeads=baseFiltered}catch(e){}
    try{renderLeadsTable=render;window.renderLeadsTable=render}catch(e){}
    try{const old=window.renderAll||renderAll;if(typeof old==='function'&&!old.__v62Leads){const w=function(){const r=old.apply(this,arguments);setTimeout(render,30);return r};w.__v62Leads=true;window.renderAll=w;try{renderAll=w}catch(e){}}}catch(e){}
    try{const oldSet=window.setView||setView;if(typeof oldSet==='function'&&!oldSet.__v62Leads){const w=function(v){const r=oldSet.apply(this,arguments);if(v==='leads')setTimeout(render,50);return r};w.__v62Leads=true;window.setView=w;try{setView=w}catch(e){}}}catch(e){}
  }
  function syncLeadBadge(){const n=list().length;$$('#navLeadsBadge').forEach(b=>b.textContent=n)}
  function render(){normalize();ensureLayout();refreshFilterOptions();renderKpis();renderTable();updateBulkBar();syncLeadBadge();}
  function init(){loadFilters();normalize();ensureLayout();refreshFilterOptions();bindGlobal();bindBulk();patchCore();render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  setTimeout(init,250);setTimeout(render,900);
})();
