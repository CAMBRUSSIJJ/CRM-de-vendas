/* CRM v63 — Garimpo como aba principal, Ligações avançadas, Agenda personalizável e Automações ampliadas */
(function(){
  'use strict';
  if(window.__CRM_V63_GARIMPO_LIGACOES_AGENDA_AUTOMACOES__) return;
  window.__CRM_V63_GARIMPO_LIGACOES_AGENDA_AUTOMACOES__ = true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const norm=(v)=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const digits=(v)=>String(v||'').replace(/\D/g,'');
  const today=()=>new Date().toISOString().slice(0,10);
  const addDays=(n)=>{const d=new Date();d.setDate(d.getDate()+Number(n||0));return d.toISOString().slice(0,10)};
  const dateBR=(v)=>{if(!v)return '—';try{return new Date(String(v).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR')}catch(e){return String(v)}};
  const dtBR=(v)=>{if(!v)return '—';try{return new Date(v).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return String(v)}};
  const money=(v)=>{try{return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0)}catch(e){return 'R$ '+(Number(v)||0)}};
  const daysDiff=(v)=>{if(!v)return 9999;const a=new Date(String(v).slice(0,10)+'T00:00:00');const b=new Date(today()+'T00:00:00');return Math.round((a-b)/86400000)};
  const load=(k,d)=>{try{const raw=localStorage.getItem(k);return raw?JSON.parse(raw):d}catch(e){return d}};
  const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  const toast=(msg,type='success')=>{try{window.crmToast?window.crmToast(msg,type):(window.showToast?window.showToast(msg,type):console.log(msg))}catch(e){console.log(msg)}};

  const LS_LEADS='outbounder_leads_v5';
  const LS_EVENTS='outbounder_agenda_v1';
  const LS_AGENDAS='outbounder_agendas_v63';
  const LS_UI='outbounder_agenda_v61_ui';
  const LS_AUTOS='outbounder_automations_v63';
  const LS_AUTO_LOG='outbounder_automations_v63_log';
  const LS_CALL_UI='crm_v63_call_ui';

  const icons={
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.25a2 2 0 0 1 2.1-.45c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z"/></svg>',
    zap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="17" rx="4"/><path d="M8 2v5M16 2v5M3 10h18"/></svg>',
    list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>'
  };

  function getLeads(){
    try{ if(typeof window.crmGetLeads==='function') return window.crmGetLeads(); }catch(e){}
    const arr=load(LS_LEADS,[]); return Array.isArray(arr)?arr:[];
  }
  function saveLeads(){
    try{ if(typeof window.crmSaveLeads==='function'){ window.crmSaveLeads(); return; } }catch(e){}
    save(LS_LEADS,getLeads());
  }
  function ensureLeadIds(){
    const arr=getLeads(); let changed=false;
    arr.forEach((l,i)=>{ if(!l.id){ l.id='lead_'+Date.now().toString(36)+'_'+i+'_'+Math.random().toString(36).slice(2,7); changed=true; } if(!Array.isArray(l.atividades)){ l.atividades=[]; changed=true; } });
    if(changed) saveLeads(); return arr;
  }
  function findLead(id){ return ensureLeadIds().find(l=>String(l.id||l.nome)===String(id)); }
  function openLead(id){ const l=findLead(id); if(!l) return; try{ if(typeof window.crmOpenLead==='function') return window.crmOpenLead(l.nome); }catch(e){} try{ if(typeof window.crmOpenLeadModal==='function') return window.crmOpenLeadModal(l); }catch(e){} }
  function scoreLead(l){ let s=25; if(l.prioridade==='Alta')s+=28; if(l.prioridade==='Média')s+=14; if(l.etapa==='Proposta')s+=24; if(l.followup){ const d=daysDiff(l.followup); if(d<0)s+=20; else if(d===0)s+=16; else if(d<=2)s+=7; } if(Number(l.valor)>10000)s+=10; if(digits(l.telefone).length>=8)s+=8; return Math.min(100,s); }
  function fullPhone(v){let d=digits(v); if(!d)return ''; if(d.startsWith('55')&&d.length>=12)return '+'+d; return '+55'+d;}
  function telHref(v){const f=fullPhone(v); return f?'tel:'+f:'';}
  function isOpen(l){ return !['Fechado','Perdido'].includes(String(l.etapa||'')); }
  function priorityClass(p){ return p==='Alta'?'high':p==='Baixa'?'low':'medium'; }

  function goView(view){
    if(!view) return;
    try{ if(typeof window.setView==='function') window.setView(view); else if(typeof window.crmV62GoView==='function') window.crmV62GoView(view); }catch(e){}
    $$('.view').forEach(sec=>{ const on=sec.id===view; sec.classList.toggle('active',on); if(on) sec.style.removeProperty('display'); });
    $$('[data-view],[data-v60-view],[data-v62-view],[data-v63-view]').forEach(btn=>{ const v=btn.dataset.view||btn.dataset.v60View||btn.dataset.v62View||btn.dataset.v63View; btn.classList.toggle('active',v===view); });
    afterView(view);
  }

  function afterView(view){
    updateV63Active(view);
    if(view==='ligacoes') setTimeout(renderCalls,30);
    if(view==='automacoes') setTimeout(renderAutomationPage,30);
    if(view==='agenda') setTimeout(enhanceAgendaManager,140);
    if(view==='garimpo') setTimeout(()=>{try{window.crmV62GoView && window.crmV62GoView('garimpo')}catch(e){}},20);
  }

  function installNavigationHooks(){
    const previous=window.setView;
    if(!window.__CRM_V63_SET_VIEW_WRAPPED__){
      window.__CRM_V63_SET_VIEW_WRAPPED__=true;
      window.setView=function(view){ const res=typeof previous==='function'?previous.apply(this,arguments):undefined; setTimeout(()=>afterView(view),80); return res; };
    }
    document.addEventListener('click',function(e){
      const b=e.target.closest('[data-v63-view]');
      if(!b) return;
      e.preventDefault(); e.stopPropagation();
      goView(b.dataset.v63View);
    },true);
    document.addEventListener('click',function(e){
      const b=e.target.closest('[data-v60-view],[data-v62-view]');
      if(!b) return;
      const view=b.dataset.v60View||b.dataset.v62View;
      if(['garimpo','ligacoes','automacoes','agenda'].includes(view)) setTimeout(()=>afterView(view),120);
    },true);
  }

  function injectGarimpoMainTab(){
    const nav=$('.sidebar-nav'); if(!nav) return;
    if(!$('.v63-garimpo-main-tab',nav)){
      const group=document.createElement('div');
      group.className='v60-nav-group v63-garimpo-main-tab';
      group.dataset.area='garimpo';
      group.innerHTML=`<button type="button" class="nav-item v60-nav-item" data-v63-view="garimpo" title="Garimpo" aria-label="Garimpo de Leads"><span class="v60-icon" aria-hidden="true">${icons.search}</span><span class="v60-nav-text">Garimpo</span></button><div class="v60-flyout" role="menu" aria-label="Sub-abas de Garimpo"><div class="v60-flyout-title"><span class="v60-sub-icon">${icons.search}</span><span>Garimpo</span></div><div class="v60-flyout-list"><button type="button" class="v60-subitem" data-v63-view="garimpo"><span class="v60-sub-icon">${icons.search}</span><span>Buscar leads</span></button><button type="button" class="v60-subitem" data-v63-view="garimpo"><span class="v60-sub-icon">${icons.plus}</span><span>Importar lista</span></button></div></div>`;
      const leadsGroup=$('.v60-nav-group[data-area="leads"]',nav);
      if(leadsGroup) leadsGroup.insertAdjacentElement('afterend',group); else nav.insertBefore(group,nav.children[2]||null);
    }
    const oldGar=$('.sidebar-nav [data-view="garimpo"]');
    if(oldGar) oldGar.classList.remove('crm-tab-hidden');
    updateV63Active($('.view.active')?.id||'inicio');
  }
  function updateV63Active(view){
    $$('.v63-garimpo-main-tab').forEach(g=>g.classList.toggle('v60-active',view==='garimpo'));
    $$('.v63-garimpo-main-tab .v60-nav-item').forEach(b=>b.classList.toggle('active',view==='garimpo'));
  }

  /* LIGAÇÕES */
  let callState=Object.assign({active:null,page:1,per:8,q:'',priority:'',resp:'',due:false,start:null,lastAttemptId:null},load(LS_CALL_UI,{}));
  function saveCallUI(){save(LS_CALL_UI,{active:callState.active,page:callState.page,per:callState.per,q:callState.q,priority:callState.priority,resp:callState.resp,due:callState.due});}
  function callActivities(l){ return (Array.isArray(l.atividades)?l.atividades:[]).filter(a=>String(a.tipo||'').toLowerCase().includes('liga') || /tentativa|discador|ligação|ligacao|atendeu|caixa postal/i.test(String(a.texto||''))); }
  function lastCall(l){ const a=callActivities(l)[0]; return a?dtBR(a.data):'Sem registro'; }
  function callCount(l){ return callActivities(l).filter(a=>String(a.tipo||'').toLowerCase().includes('liga') || /tentativa/i.test(String(a.texto||''))).length; }
  function callQueue(){
    ensureLeadIds();
    let arr=getLeads().filter(l=>isOpen(l)&&digits(l.telefone).length>=8);
    const q=norm(callState.q);
    arr=arr.filter(l=>{
      if(callState.priority && l.prioridade!==callState.priority) return false;
      if(callState.resp && String(l.responsavel||'')!==callState.resp) return false;
      if(callState.due && String(l.followup||'').slice(0,10)!==today()) return false;
      if(q && !norm([l.nome,l.segmento,l.responsavel,l.telefone,l.email,l.etapa,l.prioridade].join(' ')).includes(q)) return false;
      return true;
    });
    const pr={Alta:0,'Média':1,Baixa:2};
    arr.sort((a,b)=>(daysDiff(a.followup)-daysDiff(b.followup))||((pr[a.prioridade]??3)-(pr[b.prioridade]??3))||(scoreLead(b)-scoreLead(a)));
    return arr;
  }
  function ensureCallSection(){
    let sec=$('#ligacoes'); const main=$('main')||$('.main');
    if(!sec && main){ sec=document.createElement('section'); sec.id='ligacoes'; sec.className='view grid-view'; main.appendChild(sec); }
    return sec;
  }
  function renderCalls(){
    const sec=ensureCallSection(); if(!sec) return;
    sec.className='view grid-view v63-call-page active';
    const leads=ensureLeadIds();
    const respList=[...new Set(leads.map(l=>l.responsavel).filter(Boolean))].sort();
    const queue=callQueue();
    if(!callState.active || !queue.some(l=>String(l.id||l.nome)===String(callState.active))) callState.active=queue[0]?(queue[0].id||queue[0].nome):null;
    const active=findLead(callState.active);
    const totalPages=Math.max(1,Math.ceil(queue.length/callState.per)); callState.page=Math.min(Math.max(1,Number(callState.page)||1),totalPages);
    const page=queue.slice((callState.page-1)*callState.per,callState.page*callState.per);
    const callsToday=leads.reduce((n,l)=>n+callActivities(l).filter(a=>String(a.data||'').slice(0,10)===today()).length,0);
    const dueToday=leads.filter(l=>isOpen(l)&&String(l.followup||'').slice(0,10)===today()).length;
    const overdue=leads.filter(l=>isOpen(l)&&l.followup&&daysDiff(l.followup)<0).length;
    const noPhone=leads.filter(l=>isOpen(l)&&digits(l.telefone).length<8).length;
    sec.innerHTML=`<div class="section-header v63-call-hero"><div><div class="section-title-text">Ligações</div><div class="section-sub">Fila com contador real de tentativas, histórico no painel, filtros e atalhos de teclado.</div></div><div class="crm-report-actions v63-shortcut-hint"><span><span class="v63-key">L</span> ligar</span><span><span class="v63-key">N</span> próximo</span><span><span class="v63-key">A</span> atendeu</span><span><span class="v63-key">X</span> não atendeu</span></div></div>
      <div class="v63-call-kpis"><div class="v63-call-kpi"><b>${callsToday}</b><span>Ligações hoje</span><small>Baseado no histórico real</small></div><div class="v63-call-kpi"><b>${queue.length}</b><span>Na fila filtrada</span><small>Leads abertos com telefone</small></div><div class="v63-call-kpi"><b>${dueToday}</b><span>Vencem hoje</span><small>Filtro dedicado</small></div><div class="v63-call-kpi"><b>${overdue}</b><span>Atrasados</span><small>${noPhone} sem telefone</small></div></div>
      <div class="v63-call-grid"><div class="v63-card"><div class="v63-card-head"><div><div class="v63-card-title">Fila de chamadas</div><div class="v63-card-sub">Priorize por follow-up, prioridade, responsável e score.</div></div><button class="btn btn-sm" id="v63CallRefresh">Atualizar</button></div><div class="v63-card-body"><div class="v63-call-toolbar"><input id="v63CallSearch" placeholder="Buscar lead, telefone, etapa..." value="${esc(callState.q)}"><select id="v63CallPriority"><option value="">Prioridade</option>${['Alta','Média','Baixa'].map(p=>`<option ${callState.priority===p?'selected':''}>${p}</option>`).join('')}</select><select id="v63CallResp"><option value="">Responsável</option>${respList.map(r=>`<option ${callState.resp===r?'selected':''}>${esc(r)}</option>`).join('')}</select><label class="v63-toggle"><input id="v63CallDue" type="checkbox" ${callState.due?'checked':''}> vence hoje</label><select id="v63CallPer"><option ${callState.per==8?'selected':''}>8</option><option ${callState.per==12?'selected':''}>12</option><option ${callState.per==20?'selected':''}>20</option></select></div><div class="v63-call-list" id="v63CallList">${renderCallRows(page)}</div><div class="v63-pagination"><span>Mostrando ${queue.length?((callState.page-1)*callState.per+1):0}-${Math.min(callState.page*callState.per,queue.length)} de ${queue.length}</span><div class="v63-page-btns"><button class="v63-mini-btn" data-v63-call-page="prev" ${callState.page<=1?'disabled':''}>‹</button><span class="v63-pill">Página ${callState.page}/${totalPages}</span><button class="v63-mini-btn" data-v63-call-page="next" ${callState.page>=totalPages?'disabled':''}>›</button></div></div></div></div><aside class="v63-call-side">${renderCallPanel(active,queue)}</aside></div>`;
    bindCallControls(); saveCallUI();
  }
  function renderCallRows(arr){
    if(!arr.length) return '<div class="v63-empty"><b>Nenhum lead encontrado.</b><br>Ajuste os filtros ou cadastre telefones nos leads.</div>';
    return arr.map(l=>`<div class="v63-call-row ${String(callState.active)===String(l.id||l.nome)?'active':''}" data-v63-call-row="${esc(l.id||l.nome)}"><div><div class="v63-call-name">${esc(l.nome||'Lead sem nome')}</div><div class="v63-call-meta">${esc(l.segmento||'Sem segmento')} · ${esc(l.responsavel||'Sem responsável')} · ${esc(l.etapa||'Lead')}</div></div><div><span class="v63-pill ${priorityClass(l.prioridade)}">${esc(l.prioridade||'Média')}</span></div><div class="v63-mono">${esc(l.telefone||'')}</div><div><span class="v63-pill">${callCount(l)} tent.</span></div><div class="v63-call-meta">${esc(lastCall(l))}</div><div class="v63-actions"><button class="v63-mini-btn primary" data-v63-start-call="${esc(l.id||l.nome)}">Ligar</button><button class="v63-mini-btn" data-v63-select-call="${esc(l.id||l.nome)}">Selecionar</button></div></div>`).join('');
  }
  function renderCallPanel(l,queue){
    if(!l) return '<div class="v63-card"><div class="v63-card-body"><div class="v63-empty">Selecione um lead para ver o discador e histórico.</div></div></div>';
    const hist=callActivities(l);
    const nextDate=l.followup && daysDiff(l.followup)>=0 ? String(l.followup).slice(0,10) : addDays(1);
    return `<div class="v63-card"><div class="v63-card-body"><div class="v63-active-lead"><h3>${esc(l.nome||'Lead')}</h3><p>${esc(l.segmento||'Sem segmento')} · ${esc(l.etapa||'Lead')} · ${money(l.valor)}</p><div class="v63-phone-box"><div><small>Telefone</small><br><b>${esc(l.telefone||'Sem telefone')}</b></div><a class="v63-mini-btn primary" href="${esc(telHref(l.telefone))}" data-v63-start-call="${esc(l.id||l.nome)}">Abrir discador</a></div></div><div class="v63-panel-grid"><div class="v63-panel-field"><label>Tentativas reais</label><div class="v63-pill">${callCount(l)} registradas</div></div><div class="v63-panel-field"><label>Próxima tentativa</label><div class="v63-pill">Tentativa ${callCount(l)+1}</div></div><div class="v63-panel-field"><label>Reagendar para</label><input type="date" id="v63RescheduleDate" value="${esc(nextDate)}"></div><div class="v63-panel-field"><label>Follow-up atual</label><div class="v63-pill">${esc(dateBR(l.followup))}</div></div><div class="v63-panel-field full"><label>Observação da ligação</label><textarea id="v63CallNote" rows="3" placeholder="Ex: não atendeu, pediu retorno, decisor ausente..."></textarea></div></div><div class="v63-result-grid"><button class="v63-mini-btn primary" data-v63-call-result="Atendeu">✅ Atendeu</button><button class="v63-mini-btn" data-v63-call-result="Não atendeu">📵 Não atendeu</button><button class="v63-mini-btn" data-v63-call-result="Caixa postal">🎙️ Caixa postal</button><button class="v63-mini-btn" data-v63-call-result="Reunião marcada">📅 Reunião marcada</button><button class="v63-mini-btn" data-v63-call-result="WhatsApp enviado">💬 WhatsApp</button><button class="v63-mini-btn v63-danger" data-v63-call-result="Sem interesse">🚫 Sem interesse</button></div><div class="v63-actions"><button class="v63-mini-btn" data-v63-reschedule="${esc(l.id||l.nome)}">Reagendar com data escolhida</button><button class="v63-mini-btn" data-v63-open-lead="${esc(l.id||l.nome)}">Abrir lead</button><button class="v63-mini-btn" data-v63-next-call>Próximo da fila</button></div></div></div><div class="v63-card" style="margin-top:12px"><div class="v63-card-head"><div><div class="v63-card-title">Histórico de ligações</div><div class="v63-card-sub">Tudo que já foi registrado neste lead.</div></div></div><div class="v63-card-body"><div class="v63-history">${hist.length?hist.map((a,i)=>`<div class="v63-history-item"><div class="v63-history-icon">${hist.length-i}</div><div><div class="v63-history-text">${esc(a.texto||a.tipo||'Ligação registrada')}</div><div class="v63-history-date">${esc(dtBR(a.data))} · ${esc(a.autor||'Você')}</div></div></div>`).join(''):'<div class="v63-empty">Nenhuma ligação registrada ainda.</div>'}</div></div></div>`;
  }
  function bindCallControls(){
    $('#v63CallSearch')?.addEventListener('input',e=>{callState.q=e.target.value;callState.page=1;renderCalls();});
    $('#v63CallPriority')?.addEventListener('change',e=>{callState.priority=e.target.value;callState.page=1;renderCalls();});
    $('#v63CallResp')?.addEventListener('change',e=>{callState.resp=e.target.value;callState.page=1;renderCalls();});
    $('#v63CallDue')?.addEventListener('change',e=>{callState.due=e.target.checked;callState.page=1;renderCalls();});
    $('#v63CallPer')?.addEventListener('change',e=>{callState.per=Number(e.target.value)||8;callState.page=1;renderCalls();});
  }
  function startCall(id,openDial=true){
    const l=findLead(id); if(!l) return;
    if(!Array.isArray(l.atividades)) l.atividades=[];
    const n=callCount(l)+1;
    const act={id:'call_v63_'+Date.now(),tipo:'Ligação',texto:`Tentativa ${n}: discador aberto`,autor:'Discador do CRM',data:new Date().toISOString(),tentativa:n,status:'Aberta'};
    l.atividades.unshift(act); l.ultimaTentativaLigacaoId=act.id; l.ultimaAtualizacao=today(); callState.active=l.id||l.nome; callState.lastAttemptId=act.id;
    saveLeads(); runAutoEvent('call_opened',l,{attempt:n});
    if(openDial){ const href=telHref(l.telefone); if(href) { try{ window.location.href=href; }catch(e){} } }
    renderCalls(); toast(`Tentativa ${n} registrada para ${l.nome}.`,'success');
  }
  function selectedLead(){ return findLead(callState.active) || callQueue()[0]; }
  function recordCallResult(result){
    const l=selectedLead(); if(!l) return;
    if(!Array.isArray(l.atividades)) l.atividades=[];
    const note=$('#v63CallNote')?.value?.trim()||'';
    let act=l.atividades.find(a=>a.id===l.ultimaTentativaLigacaoId) || l.atividades.find(a=>String(a.status)==='Aberta');
    if(!act){ const n=callCount(l)+1; act={id:'call_v63_'+Date.now(),tipo:'Ligação',tentativa:n,data:new Date().toISOString(),autor:'Discador do CRM'}; l.atividades.unshift(act); }
    const n=act.tentativa || callCount(l);
    act.texto=`Tentativa ${n}: ${result}${note?' — '+note:''}`; act.status=result; act.data=new Date().toISOString(); act.autor=act.autor||'Discador do CRM';
    l.ultimaAtualizacao=today();
    const chosen=$('#v63RescheduleDate')?.value || '';
    if(result==='Atendeu' && l.etapa==='Lead') l.etapa='Contato';
    if(['Não atendeu','Caixa postal','WhatsApp enviado'].includes(result)){ if(chosen) l.followup=chosen; l.proximaAcao='Retornar ligação'; }
    if(result==='Reunião marcada'){ if(chosen) l.followup=chosen; l.etapa=l.etapa==='Lead'?'Contato':l.etapa; createEvent({title:`Reunião com ${l.nome}`,leadNome:l.nome,data:chosen||today(),hora:'09:00',tipo:'Reunião',prioridade:l.prioridade||'Média',agenda:'Reuniões',cor:'#2563EB',notas:note}); }
    if(result==='Sem interesse'){ l.prioridade='Baixa'; if(chosen) l.followup=chosen; }
    saveLeads(); runAutoEvent('call_result',l,{result}); renderCalls(); toast('Resultado registrado no histórico do lead.','success');
  }
  function rescheduleLead(id){ const l=findLead(id); const d=$('#v63RescheduleDate')?.value; if(!l||!d) return toast('Escolha uma data para reagendar.','warn'); l.followup=d; l.proximaAcao='Retornar ligação'; if(!Array.isArray(l.atividades))l.atividades=[]; l.atividades.unshift({id:'resch_v63_'+Date.now(),tipo:'Nota',texto:`Ligação reagendada para ${dateBR(d)}`,autor:'Discador do CRM',data:new Date().toISOString()}); saveLeads(); renderCalls(); toast('Ligação reagendada com a data escolhida.','success'); }
  function nextCall(){ const q=callQueue(); const idx=q.findIndex(l=>String(l.id||l.nome)===String(callState.active)); const next=q[idx+1]||q[0]; if(next){callState.active=next.id||next.nome; renderCalls();} }

  document.addEventListener('click',function(e){
    if(e.target.closest('#v63CallRefresh')){renderCalls();return;}
    const row=e.target.closest('[data-v63-call-row]'); if(row && !e.target.closest('button,a,input,select,textarea')){callState.active=row.dataset.v63CallRow;renderCalls();return;}
    const sel=e.target.closest('[data-v63-select-call]'); if(sel){callState.active=sel.dataset.v63SelectCall;renderCalls();return;}
    const st=e.target.closest('[data-v63-start-call]'); if(st){e.preventDefault();startCall(st.dataset.v63StartCall,true);return;}
    const res=e.target.closest('[data-v63-call-result]'); if(res){recordCallResult(res.dataset.v63CallResult);return;}
    const r=e.target.closest('[data-v63-reschedule]'); if(r){rescheduleLead(r.dataset.v63Reschedule);return;}
    const op=e.target.closest('[data-v63-open-lead]'); if(op){openLead(op.dataset.v63OpenLead);return;}
    if(e.target.closest('[data-v63-next-call]')){nextCall();return;}
    const pg=e.target.closest('[data-v63-call-page]'); if(pg){callState.page += pg.dataset.v63CallPage==='next'?1:-1; renderCalls(); return;}
  },true);
  document.addEventListener('keydown',function(e){
    if(!$('#ligacoes.active')) return;
    if(e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    const k=e.key.toLowerCase();
    if(k==='l'){ e.preventDefault(); const l=selectedLead(); if(l) startCall(l.id||l.nome,true); }
    if(k==='n'){ e.preventDefault(); nextCall(); }
    if(k==='a'){ e.preventDefault(); recordCallResult('Atendeu'); }
    if(k==='x'){ e.preventDefault(); recordCallResult('Não atendeu'); }
  },true);

  /* AGENDA PERSONALIZÁVEL */
  const defaultAgendas=[{id:'comercial',name:'Comercial',color:'#1D9E75',active:true},{id:'followups',name:'Follow-ups',color:'#9333EA',active:true},{id:'reunioes',name:'Reuniões',color:'#2563EB',active:true},{id:'pessoal',name:'Pessoal',color:'#64748B',active:true}];
  function agendaDefs(){ const arr=load(LS_AGENDAS,null); return Array.isArray(arr)&&arr.length?arr:defaultAgendas.slice(); }
  function saveAgendas(list){ save(LS_AGENDAS,list); const ui=load(LS_UI,{}); ui.visibleAgendas=list.filter(a=>a.active!==false).map(a=>a.name); save(LS_UI,ui); }
  function enhanceAgendaManager(){
    const root=$('#crmAgendaV61Root'); if(!root || $('#v63AgendaManager')) return;
    const side=$('.v61-cal-sidebar',root); if(!side) return;
    const panel=document.createElement('div'); panel.id='v63AgendaManager'; panel.className='v63-agenda-manager';
    panel.innerHTML=renderAgendaManagerHTML();
    const density=$$('.v61-side-block',side).find(x=>norm(x.textContent).includes('densidade'));
    if(density) density.insertAdjacentElement('beforebegin',panel); else side.appendChild(panel);
    bindAgendaManager(panel);
  }
  function renderAgendaManagerHTML(){
    const arr=agendaDefs();
    return `<h4>Editar agendas e cores</h4><p>Crie agendas, altere nomes e escolha cores. Os compromissos podem ter cor própria no formulário.</p><div id="v63AgendaRows">${arr.map(a=>`<div class="v63-agenda-row" data-v63-agenda-id="${esc(a.id)}"><input type="checkbox" data-v63-agenda-active ${a.active!==false?'checked':''}><input class="v63-agenda-input" data-v63-agenda-name value="${esc(a.name)}"><input type="color" data-v63-agenda-color value="${esc(a.color||'#1D9E75')}"><button class="v63-mini-btn v63-danger" data-v63-agenda-del title="Excluir">×</button></div>`).join('')}</div><div class="v63-agenda-add"><input class="v63-agenda-input" id="v63NewAgendaName" placeholder="Nova agenda"><input type="color" id="v63NewAgendaColor" value="#1D9E75"></div><div class="v63-actions" style="margin-top:8px"><button class="v63-mini-btn primary" id="v63AddAgenda">Adicionar</button><button class="v63-mini-btn" id="v63SaveAgendas">Salvar cores</button></div>`;
  }
  function bindAgendaManager(panel){
    $('#v63AddAgenda',panel)?.addEventListener('click',()=>{ const name=$('#v63NewAgendaName')?.value?.trim(); if(!name) return; const arr=agendaDefs(); arr.push({id:'agenda_'+Date.now(),name,color:$('#v63NewAgendaColor')?.value||'#1D9E75',active:true}); saveAgendas(arr); toast('Agenda criada.','success'); goView('agenda'); });
    $('#v63SaveAgendas',panel)?.addEventListener('click',()=>{ const arr=[]; $$('[data-v63-agenda-id]',panel).forEach(row=>arr.push({id:row.dataset.v63AgendaId,name:row.querySelector('[data-v63-agenda-name]').value.trim()||'Agenda',color:row.querySelector('[data-v63-agenda-color]').value||'#1D9E75',active:row.querySelector('[data-v63-agenda-active]').checked})); saveAgendas(arr); toast('Agendas atualizadas.','success'); goView('agenda'); });
    panel.addEventListener('click',e=>{ const del=e.target.closest('[data-v63-agenda-del]'); if(!del)return; const id=del.closest('[data-v63-agenda-id]')?.dataset.v63AgendaId; saveAgendas(agendaDefs().filter(a=>a.id!==id)); toast('Agenda removida.','warn'); goView('agenda'); });
  }
  function createEvent(ev){ const events=load(LS_EVENTS,[]); events.push(Object.assign({id:'ev_v63_'+Date.now(),title:'Compromisso',data:today(),hora:'09:00',fim:'09:45',tipo:'Tarefa',prioridade:'Média',agenda:'Comercial',status:'Agendado',notas:''},ev)); save(LS_EVENTS,events); }

  /* AUTOMAÇÕES AMPLIADAS */
  const autoTemplates=[
    {name:'Follow-up vence hoje → criar ligação',trigger:'followup_due',condition:'all',action:'create_event',eventType:'Ligação',dateMode:'same_day',note:'Ligar porque o follow-up vence hoje.'},
    {name:'Ligação não atendida → reagendar',trigger:'call_result',callResult:'Não atendeu',condition:'all',action:'set_followup',dateMode:'offset',offset:1,note:'Retornar ligação.'},
    {name:'Lead de alta prioridade → nota de ataque',trigger:'priority',priority:'Alta',condition:'all',action:'add_note',note:'Prioridade alta: revisar contexto e abordar hoje.'},
    {name:'Proposta parada → tarefa de revisão',trigger:'stage_is',stage:'Proposta',condition:'no_activity_days',days:3,action:'create_event',eventType:'Follow-up',dateMode:'same_day',note:'Revisar proposta parada há mais de 3 dias.'},
    {name:'Sem telefone → tarefa de enriquecimento',trigger:'missing_phone',condition:'all',action:'add_note',note:'Completar telefone antes de tentar contato.'},
    {name:'Fechado → onboarding',trigger:'stage_is',stage:'Fechado',condition:'all',action:'create_event',eventType:'Reunião',dateMode:'offset',offset:1,note:'Agendar onboarding/pós-venda.'}
  ];
  let autoTab='modelos';
  let editingRule=null;
  function getRules(){ const r=load(LS_AUTOS,[]); return Array.isArray(r)?r:[]; }
  function setRules(r){ save(LS_AUTOS,r); }
  function logAuto(rule,lead,msg){ const logs=load(LS_AUTO_LOG,[]); logs.unshift({id:'log_'+Date.now()+Math.random().toString(36).slice(2,5),rule:rule.name,lead:lead?.nome||'—',msg,date:new Date().toISOString()}); save(LS_AUTO_LOG,logs.slice(0,80)); }
  function renderAutomationPage(){
    let sec=$('#automacoes'); if(!sec) return;
    sec.className='view grid-view v63-auto-page active';
    sec.innerHTML=`<div class="section-header"><div><div class="section-title-text">Automações avançadas</div><div class="section-sub">Crie regras por gatilho, condição e ação para automatizar tarefas do CRM.</div></div><div class="crm-report-actions"><button class="btn btn-sm" id="v63RunAutos">Executar agora</button><button class="btn btn-sm btn-primary" id="v63NewAuto">Nova automação</button></div></div><div class="v63-card" style="margin-bottom:14px"><div class="v63-card-body"><div class="v63-auto-tabs">${[['modelos','Modelos prontos'],['criador','Criador visual'],['regras','Regras salvas'],['historico','Histórico']].map(([id,l])=>`<button class="v63-auto-tab ${autoTab===id?'active':''}" data-v63-auto-tab="${id}">${l}</button>`).join('')}</div></div></div><div id="v63AutoBody"></div>`;
    renderAutoBody();
  }
  function renderAutoBody(){
    const body=$('#v63AutoBody'); if(!body) return;
    if(autoTab==='modelos') body.innerHTML=`<div class="v63-auto-layout"><div class="v63-card"><div class="v63-card-head"><div><div class="v63-card-title">Modelos</div><div class="v63-card-sub">Clique para carregar no criador.</div></div></div><div class="v63-card-body"><div class="v63-template-list">${autoTemplates.map((t,i)=>`<div class="v63-template-card"><b>${esc(t.name)}</b><p>${esc(describeRule(t))}</p><button class="v63-mini-btn primary" data-v63-template="${i}">Usar modelo</button></div>`).join('')}</div></div></div><div class="v63-card"><div class="v63-card-head"><div><div class="v63-card-title">O que dá para automatizar agora</div><div class="v63-card-sub">Agenda, follow-up, prioridade, responsável, etapa e notas.</div></div></div><div class="v63-card-body"><div class="v63-empty" style="text-align:left">Você pode criar regras como: quando um follow-up vencer, criar ligação; quando uma ligação der “não atendeu”, reagendar; quando um lead estiver sem atividade por X dias, criar tarefa; quando estiver em Proposta, cobrar revisão; quando fechar, criar onboarding.</div></div></div></div>`;
    if(autoTab==='criador') body.innerHTML=builderHTML(editingRule);
    if(autoTab==='regras') body.innerHTML=rulesHTML();
    if(autoTab==='historico') body.innerHTML=logsHTML();
    bindAutoBody();
  }
  function describeRule(r){ return `${labelTrigger(r)} → ${labelCondition(r)} → ${labelAction(r)}`; }
  function labelTrigger(r){ const m={followup_due:'follow-up vence hoje',call_result:'resultado de ligação',priority:'prioridade do lead',stage_is:'lead está em etapa',missing_phone:'lead sem telefone',lead_created:'lead criado hoje'}; return m[r.trigger]||r.trigger||'gatilho'; }
  function labelCondition(r){ if(r.condition==='no_activity_days') return `sem atividade há ${r.days||3} dias`; if(r.condition==='value_above') return `valor acima de ${money(r.value||0)}`; if(r.condition==='owner') return `responsável ${r.owner||'definido'}`; return 'sem condição extra'; }
  function labelAction(r){ const m={create_event:'criar compromisso',set_followup:'definir follow-up',add_note:'adicionar nota',set_priority:'definir prioridade',move_stage:'mover etapa',assign_owner:'trocar responsável'}; return m[r.action]||r.action||'ação'; }
  function builderHTML(rule){
    const r=Object.assign({name:'',active:true,trigger:'followup_due',condition:'all',action:'create_event',stage:'Proposta',priority:'Alta',callResult:'Não atendeu',days:3,value:5000,owner:'',eventType:'Ligação',dateMode:'same_day',offset:1,exactDate:today(),newPriority:'Alta',newStage:'Contato',newOwner:'',note:''},rule||{});
    const owners=[...new Set(getLeads().map(l=>l.responsavel).filter(Boolean))].sort();
    return `<div class="v63-card"><div class="v63-card-head"><div><div class="v63-card-title">${editingRule?'Editar automação':'Criador visual'}</div><div class="v63-card-sub">Monte a regra no formato: quando → se → então.</div></div></div><div class="v63-card-body"><div class="v63-form-grid"><div class="full"><label class="v63-auto-label">Nome da regra</label><input class="v63-auto-input" id="v63AutoName" value="${esc(r.name)}" placeholder="Ex: Retornar ligação não atendida"></div></div><div class="v63-flow" style="margin-top:12px"><div class="v63-flow-step"><h4>Quando</h4><label class="v63-auto-label">Gatilho</label><select class="v63-auto-select" id="v63AutoTrigger"><option value="followup_due" ${r.trigger==='followup_due'?'selected':''}>Follow-up vence hoje</option><option value="call_result" ${r.trigger==='call_result'?'selected':''}>Ligação teve resultado</option><option value="stage_is" ${r.trigger==='stage_is'?'selected':''}>Lead está em etapa</option><option value="priority" ${r.trigger==='priority'?'selected':''}>Lead tem prioridade</option><option value="missing_phone" ${r.trigger==='missing_phone'?'selected':''}>Lead sem telefone</option><option value="lead_created" ${r.trigger==='lead_created'?'selected':''}>Lead criado hoje</option></select><div style="height:8px"></div><label class="v63-auto-label">Etapa / prioridade / resultado</label><select class="v63-auto-select" id="v63AutoStage">${['Lead','Contato','Proposta','Fechado','Perdido'].map(s=>`<option ${r.stage===s?'selected':''}>${s}</option>`).join('')}</select><select class="v63-auto-select" id="v63AutoPriority" style="margin-top:8px">${['Alta','Média','Baixa'].map(p=>`<option ${r.priority===p?'selected':''}>${p}</option>`).join('')}</select><select class="v63-auto-select" id="v63AutoCallResult" style="margin-top:8px">${['Atendeu','Não atendeu','Caixa postal','Reunião marcada','WhatsApp enviado','Sem interesse'].map(x=>`<option ${r.callResult===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="v63-flow-step"><h4>Se</h4><label class="v63-auto-label">Condição</label><select class="v63-auto-select" id="v63AutoCondition"><option value="all" ${r.condition==='all'?'selected':''}>Sem condição extra</option><option value="no_activity_days" ${r.condition==='no_activity_days'?'selected':''}>Sem atividade há X dias</option><option value="value_above" ${r.condition==='value_above'?'selected':''}>Valor acima de X</option><option value="owner" ${r.condition==='owner'?'selected':''}>Responsável específico</option></select><div style="height:8px"></div><label class="v63-auto-label">Dias / valor / responsável</label><input class="v63-auto-input" id="v63AutoDays" type="number" min="1" value="${esc(r.days)}" placeholder="Dias"><input class="v63-auto-input" id="v63AutoValue" type="number" min="0" value="${esc(r.value)}" placeholder="Valor" style="margin-top:8px"><select class="v63-auto-select" id="v63AutoOwner" style="margin-top:8px"><option value="">Qualquer</option>${owners.map(o=>`<option ${r.owner===o?'selected':''}>${esc(o)}</option>`).join('')}</select></div><div class="v63-flow-step"><h4>Então</h4><label class="v63-auto-label">Ação</label><select class="v63-auto-select" id="v63AutoAction"><option value="create_event" ${r.action==='create_event'?'selected':''}>Criar compromisso</option><option value="set_followup" ${r.action==='set_followup'?'selected':''}>Definir follow-up</option><option value="add_note" ${r.action==='add_note'?'selected':''}>Adicionar nota</option><option value="set_priority" ${r.action==='set_priority'?'selected':''}>Definir prioridade</option><option value="move_stage" ${r.action==='move_stage'?'selected':''}>Mover etapa</option><option value="assign_owner" ${r.action==='assign_owner'?'selected':''}>Trocar responsável</option></select><div style="height:8px"></div><label class="v63-auto-label">Parâmetros</label><select class="v63-auto-select" id="v63AutoEventType">${['Ligação','E-mail','WhatsApp','Reunião','Follow-up','Tarefa'].map(t=>`<option ${r.eventType===t?'selected':''}>${t}</option>`).join('')}</select><select class="v63-auto-select" id="v63AutoDateMode" style="margin-top:8px"><option value="same_day" ${r.dateMode==='same_day'?'selected':''}>No mesmo dia</option><option value="offset" ${r.dateMode==='offset'?'selected':''}>Daqui X dias</option><option value="exact" ${r.dateMode==='exact'?'selected':''}>Data escolhida</option></select><input class="v63-auto-input" id="v63AutoOffset" type="number" min="0" value="${esc(r.offset)}" style="margin-top:8px"><input class="v63-auto-input" id="v63AutoExact" type="date" value="${esc(r.exactDate||today())}" style="margin-top:8px"><select class="v63-auto-select" id="v63AutoNewPriority" style="margin-top:8px">${['Alta','Média','Baixa'].map(p=>`<option ${r.newPriority===p?'selected':''}>${p}</option>`).join('')}</select><select class="v63-auto-select" id="v63AutoNewStage" style="margin-top:8px">${['Lead','Contato','Proposta','Fechado','Perdido'].map(s=>`<option ${r.newStage===s?'selected':''}>${s}</option>`).join('')}</select><input class="v63-auto-input" id="v63AutoNewOwner" value="${esc(r.newOwner)}" placeholder="Novo responsável" style="margin-top:8px"></div></div><div style="margin-top:12px"><label class="v63-auto-label">Nota / descrição da ação</label><textarea class="v63-auto-textarea" id="v63AutoNote" rows="3" placeholder="Texto que será salvo na nota ou no compromisso...">${esc(r.note)}</textarea></div><div class="v63-builder-actions"><button class="v63-mini-btn" id="v63CancelAutoEdit">Cancelar</button><button class="v63-mini-btn primary" id="v63SaveAutoRule">Salvar automação</button></div></div></div>`;
  }
  function collectRule(){
    const name=$('#v63AutoName')?.value?.trim()||'Automação sem nome';
    return {id:editingRule?.id||'auto_v63_'+Date.now(),active:editingRule?.active!==false,name,trigger:$('#v63AutoTrigger')?.value||'followup_due',stage:$('#v63AutoStage')?.value||'Proposta',priority:$('#v63AutoPriority')?.value||'Alta',callResult:$('#v63AutoCallResult')?.value||'Não atendeu',condition:$('#v63AutoCondition')?.value||'all',days:Number($('#v63AutoDays')?.value)||3,value:Number($('#v63AutoValue')?.value)||0,owner:$('#v63AutoOwner')?.value||'',action:$('#v63AutoAction')?.value||'create_event',eventType:$('#v63AutoEventType')?.value||'Ligação',dateMode:$('#v63AutoDateMode')?.value||'same_day',offset:Number($('#v63AutoOffset')?.value)||0,exactDate:$('#v63AutoExact')?.value||today(),newPriority:$('#v63AutoNewPriority')?.value||'Alta',newStage:$('#v63AutoNewStage')?.value||'Contato',newOwner:$('#v63AutoNewOwner')?.value?.trim()||'',note:$('#v63AutoNote')?.value?.trim()||''};
  }
  function rulesHTML(){ const rules=getRules(); return `<div class="v63-card"><div class="v63-card-head"><div><div class="v63-card-title">Regras salvas</div><div class="v63-card-sub">Ative, edite, duplique ou exclua automações.</div></div></div><div class="v63-card-body"><div class="v63-rule-list">${rules.length?rules.map(r=>`<div class="v63-rule-card ${r.active===false?'disabled':''}"><div class="v63-rule-head"><div><b>${esc(r.name)}</b><p>${esc(describeRule(r))}</p><div class="v63-rule-meta"><span class="v63-pill">${esc(labelTrigger(r))}</span><span class="v63-pill">${esc(labelAction(r))}</span><span class="v63-pill ${r.active===false?'low':'medium'}">${r.active===false?'Inativa':'Ativa'}</span></div></div><div class="v63-rule-actions"><button class="v63-mini-btn" data-v63-auto-toggle="${esc(r.id)}">${r.active===false?'Ativar':'Pausar'}</button><button class="v63-mini-btn" data-v63-auto-edit="${esc(r.id)}">Editar</button><button class="v63-mini-btn" data-v63-auto-dup="${esc(r.id)}">Duplicar</button><button class="v63-mini-btn v63-danger" data-v63-auto-del="${esc(r.id)}">Excluir</button></div></div></div>`).join(''):'<div class="v63-empty">Nenhuma regra salva ainda. Use um modelo ou abra o criador visual.</div>'}</div></div></div>`; }
  function logsHTML(){ const logs=load(LS_AUTO_LOG,[]); return `<div class="v63-card"><div class="v63-card-head"><div><div class="v63-card-title">Histórico de execuções</div><div class="v63-card-sub">Registro das ações aplicadas pelas automações.</div></div></div><div class="v63-card-body"><div class="v63-log-list">${logs.length?logs.map(l=>`<div class="v63-log-item"><b>${esc(l.rule)} · ${esc(l.lead)}</b><p>${esc(l.msg)} · ${esc(dtBR(l.date))}</p></div>`).join(''):'<div class="v63-empty">Ainda não há execuções registradas.</div>'}</div></div></div>`; }
  function bindAutoBody(){
    $$('[data-v63-template]').forEach(b=>b.addEventListener('click',()=>{ editingRule=Object.assign({},autoTemplates[Number(b.dataset.v63Template)],{id:null}); autoTab='criador'; renderAutomationPage(); }));
    $('#v63SaveAutoRule')?.addEventListener('click',()=>{ const r=collectRule(); let arr=getRules(); const idx=arr.findIndex(x=>x.id===r.id); if(idx>=0) arr[idx]=r; else arr.unshift(r); setRules(arr); editingRule=null; autoTab='regras'; renderAutomationPage(); toast('Automação salva.','success'); });
    $('#v63CancelAutoEdit')?.addEventListener('click',()=>{ editingRule=null; autoTab='regras'; renderAutomationPage(); });
    $$('[data-v63-auto-toggle]').forEach(b=>b.addEventListener('click',()=>{ const arr=getRules(); const r=arr.find(x=>x.id===b.dataset.v63AutoToggle); if(r)r.active=!r.active; setRules(arr); renderAutomationPage(); }));
    $$('[data-v63-auto-edit]').forEach(b=>b.addEventListener('click',()=>{ editingRule=getRules().find(x=>x.id===b.dataset.v63AutoEdit); autoTab='criador'; renderAutomationPage(); }));
    $$('[data-v63-auto-dup]').forEach(b=>b.addEventListener('click',()=>{ const arr=getRules(); const r=arr.find(x=>x.id===b.dataset.v63AutoDup); if(r) arr.unshift(Object.assign({},r,{id:'auto_v63_'+Date.now(),name:r.name+' cópia'})); setRules(arr); renderAutomationPage(); }));
    $$('[data-v63-auto-del]').forEach(b=>b.addEventListener('click',()=>{ setRules(getRules().filter(x=>x.id!==b.dataset.v63AutoDel)); renderAutomationPage(); toast('Automação excluída.','warn'); }));
  }
  document.addEventListener('click',function(e){
    const tab=e.target.closest('[data-v63-auto-tab]'); if(tab){ autoTab=tab.dataset.v63AutoTab; editingRule=null; renderAutomationPage(); return; }
    if(e.target.closest('#v63NewAuto')){ autoTab='criador'; editingRule=null; renderAutomationPage(); return; }
    if(e.target.closest('#v63RunAutos')){ runAutomationsNow(); return; }
  },true);
  function lastActivityDate(l){ const a=(Array.isArray(l.atividades)?l.atividades:[])[0]; return a?.data || l.ultimaAtualizacao || l.dataEntrada; }
  function matchTrigger(r,l,event){
    if(r.trigger==='followup_due') return isOpen(l)&&l.followup&&daysDiff(l.followup)===0;
    if(r.trigger==='call_result') { const last=callActivities(l)[0]; return last && String(last.texto||'').includes(r.callResult||'Não atendeu') && (!event || event.type==='call_result'); }
    if(r.trigger==='stage_is') return String(l.etapa||'')===String(r.stage||'');
    if(r.trigger==='priority') return String(l.prioridade||'')===String(r.priority||'Alta');
    if(r.trigger==='missing_phone') return digits(l.telefone).length<8;
    if(r.trigger==='lead_created') return String(l.dataEntrada||'').slice(0,10)===today();
    return false;
  }
  function matchCondition(r,l){
    if(r.condition==='no_activity_days') return daysDiff(String(lastActivityDate(l)||today()).slice(0,10)) <= -Number(r.days||3);
    if(r.condition==='value_above') return Number(l.valor||0) >= Number(r.value||0);
    if(r.condition==='owner') return !r.owner || String(l.responsavel||'')===String(r.owner);
    return true;
  }
  function dateFromRule(r){ if(r.dateMode==='exact') return r.exactDate||today(); if(r.dateMode==='offset') return addDays(r.offset||0); return today(); }
  function applyRule(r,l){
    if(!Array.isArray(l.atividades)) l.atividades=[];
    let msg='';
    if(r.action==='create_event'){ const d=dateFromRule(r); createEvent({title:`${r.eventType||'Tarefa'} · ${l.nome}`,leadNome:l.nome,data:d,hora:'09:00',tipo:r.eventType||'Tarefa',prioridade:l.prioridade||'Média',agenda:(r.eventType==='Reunião'?'Reuniões':r.eventType==='Ligação'?'Comercial':'Follow-ups'),notas:r.note||r.name}); msg=`criou ${r.eventType||'compromisso'} em ${dateBR(d)}`; }
    if(r.action==='set_followup'){ const d=dateFromRule(r); l.followup=d; l.proximaAcao=r.note||'Follow-up automático'; msg=`definiu follow-up para ${dateBR(d)}`; }
    if(r.action==='add_note'){ l.atividades.unshift({id:'auto_note_v63_'+Date.now(),tipo:'Automação',texto:r.note||r.name,autor:'Automação CRM',data:new Date().toISOString()}); msg='adicionou nota no histórico'; }
    if(r.action==='set_priority'){ l.prioridade=r.newPriority||'Alta'; msg=`definiu prioridade ${l.prioridade}`; }
    if(r.action==='move_stage'){ l.etapa=r.newStage||'Contato'; msg=`moveu para ${l.etapa}`; }
    if(r.action==='assign_owner'){ l.responsavel=r.newOwner||l.responsavel; msg=`atribuiu responsável ${l.responsavel||'—'}`; }
    l.ultimaAtualizacao=today(); logAuto(r,l,msg); return msg;
  }
  function runAutomationsNow(){
    const rules=getRules().filter(r=>r.active!==false); const leads=ensureLeadIds(); let count=0;
    rules.forEach(r=>leads.forEach(l=>{ if(matchTrigger(r,l)&&matchCondition(r,l)){ applyRule(r,l); count++; } }));
    saveLeads(); renderAutomationPage(); toast(`${count} ação(ões) de automação executada(s).`,'success');
  }
  function runAutoEvent(type,lead,event={}){ const rules=getRules().filter(r=>r.active!==false); let count=0; rules.forEach(r=>{ if(matchTrigger(r,lead,Object.assign({type},event))&&matchCondition(r,lead)){ applyRule(r,lead); count++; } }); if(count) saveLeads(); }

  function boot(){
    document.body.classList.add('crm-v63-ready');
    installNavigationHooks();
    injectGarimpoMainTab();
    ensureCallSection();
    [120,420,1100,1900,2800].forEach(ms=>setTimeout(()=>{injectGarimpoMainTab(); if($('#agenda.active')) enhanceAgendaManager();},ms));
    const obs=new MutationObserver(()=>{injectGarimpoMainTab(); if($('#agenda.active')) enhanceAgendaManager();});
    try{obs.observe(document.body,{childList:true,subtree:true});}catch(e){}
    afterView($('.view.active')?.id||'inicio');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.addEventListener('pageshow',()=>setTimeout(boot,0));
})();
