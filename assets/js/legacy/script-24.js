/* Script original 24 */
(function(){
  'use strict';
  if(window.__crmProV36Final) return;
  window.__crmProV36Final = true;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const KEYS={hidden:'crm_v36_hidden_views',blocks:'crm_v36_custom_blocks',filters:'crm_v36_filters',autos:'crm_v36_automations',seq:'crm_v36_followup_sequence',pin:'crm_v36_sidebar_pinned',call:'crm_v36_call_cfg',callPg:'crm_v36_call_page'};
  const LEAD_KEY='outbounder_leads_v5', EVENT_KEY='outbounder_agenda_v1', GOAL_KEY='outbounder_goals_v5';
  const FU_STAGES=['Novo follow-up','1º contato','2º contato','3º contato','Proposta enviada','Reativação','Concluído'];
  const VIEW_META={inicio:['Painel','Visão geral das oportunidades'],leads:['Gestão de leads','Base comercial principal'],pipeline:['Pipeline','Funil de oportunidades'],clientes:['Clientes','Relacionamentos cadastrados'],playbooks:['Playbooks','Scripts e materiais'],objecoes:['Objeções','Respostas e contornos'],perdas:['Motivos de perda','Análise de negócios perdidos'],dashboard:['Dashboard','Indicadores comerciais'],cadencias:['Follow-ups','Etapas, fila e automação de próximos contatos'],automacoes:['Automações','Regras separadas por abas e funções'],agenda:['Agenda','Planejamento profissional de compromissos'],ligacoes:['Ligações','Discador, contador, paginação e histórico'],metas:['Metas','Blocos organizáveis e progresso conectado'],metricas:['Métricas','Indicadores de desempenho'],funil:['Funil de vendas','Conversão e forecast'],garimpo:['Garimpo de leads','Prospecção e criação rápida'],importar:['Importar / Exportar','Gerencie os dados'],chat:['Chat','Conversas com leads'], 'novo-lead':['Novo lead','Cadastro rápido']};
  const VIEW_ORDER=['inicio','leads','pipeline','clientes','playbooks','objecoes','perdas','dashboard','cadencias','automacoes','agenda','ligacoes','metas','metricas','funil','garimpo','importar','chat','novo-lead'];
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function readJSON(k,f){try{const s=localStorage.getItem(k);return s?JSON.parse(s):f}catch(e){return f}}
  function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function toast(msg,type){try{if(typeof showToast==='function')showToast(msg,type||'success');else if(typeof toastV5==='function')toastV5(msg,type||'success');else console.log(msg);}catch(e){console.log(msg)}}
  function today(){return new Date().toISOString().slice(0,10)}
  function addDays(dateOrN,n){let d;if(typeof n==='undefined'){d=new Date();d.setDate(d.getDate()+Number(dateOrN||0));}else{d=new Date(String(dateOrN||today())+'T12:00:00');d.setDate(d.getDate()+Number(n||0));}return d.toISOString().slice(0,10)}
  function fmt(d){if(!d)return '—';try{return new Date(String(d).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR')}catch(e){return d}}
  function money(v){try{return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0)}catch(e){return 'R$ '+(Number(v)||0)}}
  function daysDiff(d){if(!d)return 9999;const a=new Date(String(d).slice(0,10)+'T00:00:00');const b=new Date(today()+'T00:00:00');return Math.round((a-b)/86400000)}
  function initials(s){return String(s||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?'}
  function getLeads(){try{if(Array.isArray(leads))return leads;}catch(e){}return readJSON(LEAD_KEY,[])}
  function persistLeads(){try{if(typeof saveLeads==='function'){saveLeads();return}}catch(e){}writeJSON(LEAD_KEY,getLeads())}
  function isOpen(l){return !['Fechado','Perdido'].includes(l.etapa)}
  function score(l){try{if(typeof calcScore==='function')return calcScore(l)}catch(e){}let s=20;if(l.prioridade==='Alta')s+=25;if(l.valor>10000)s+=25;if(l.followup&&daysDiff(l.followup)<=0)s+=20;if(l.telefone)s+=10;return Math.min(100,s)}
  function tag(txt,cls){return `<span class="tag ${cls||'tag-neutro'}">${esc(txt)}</span>`}
  function stageClass(s){return {Lead:'tag-lead',Contato:'tag-contato',Proposta:'tag-proposta',Fechado:'tag-fechado',Perdido:'tag-perdido'}[s]||'tag-neutro'}
  function fuStage(l){if(!l.followupStage){l.followupStage=l.etapa==='Proposta'?'Proposta enviada':'Novo follow-up'}return l.followupStage}
  function nextFuStage(cur){const i=FU_STAGES.indexOf(cur);return FU_STAGES[Math.min(FU_STAGES.length-1,(i<0?0:i)+1)]}
  function getSeq(){const def=FU_STAGES.map((s,i)=>({stage:s,delay:[0,1,2,3,2,7,0][i]||0,channel:['Ligação','WhatsApp','E-mail','WhatsApp','Ligação','WhatsApp','Nota'][i]||'Follow-up',active:s!=='Concluído'}));const saved=readJSON(KEYS.seq,null);return Array.isArray(saved)&&saved.length?saved:def}
  function saveSeq(arr){writeJSON(KEYS.seq,arr)}

  function icon(path){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">${path}</svg>`}
  const ICONS={ligacoes:icon('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.95.35 1.86.68 2.73a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.34-1.24a2 2 0 0 1 2.11-.45c.87.33 1.78.55 2.73.68A2 2 0 0 1 22 16.92z"/>'),metas:icon('<path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="9"/>'),settings:icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82V22a2 2 0 0 1-4 0v-.18A1.65 1.65 0 0 0 9 20.2a1.65 1.65 0 0 0-1.82-.33l-.16.07a2 2 0 1 1-2-3.46l.16-.09A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.82-.33H2a2 2 0 0 1 0-4h.18A1.65 1.65 0 0 0 3.8 9a1.65 1.65 0 0 0 .33-1.82l-.07-.16a2 2 0 1 1 3.46-2l.09.16A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1.82V2a2 2 0 0 1 4 0v.18A1.65 1.65 0 0 0 15 3.8a1.65 1.65 0 0 0 1.82.33l.16-.07a2 2 0 1 1 2 3.46l-.16.09A1.65 1.65 0 0 0 19.4 9c.2.3.43.57.7.8a1.65 1.65 0 0 0 1.82.33H22a2 2 0 0 1 0 4h-.18A1.65 1.65 0 0 0 20.2 15z"/>'),blocks:icon('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>')};

  function ensureCoreNav(){
    const sidebar=$('.sidebar-nav'), rail=$('.rail'), tabs=$('.topbar-tabs');
    function side(view,label,after){if(!sidebar||$(`.sidebar-nav [data-view="${view}"]`))return;const b=document.createElement('button');b.className='nav-item';b.dataset.view=view;b.innerHTML=(ICONS[view]||ICONS.blocks)+`<span>${label}</span>`;($(after)||sidebar.lastElementChild)?.insertAdjacentElement('afterend',b)}
    function railBtn(view,label,after){if(!rail||$(`.rail [data-view="${view}"]`))return;const b=document.createElement('button');b.className='rail-btn';b.dataset.view=view;b.title=label;b.innerHTML=ICONS[view]||ICONS.blocks;($(after)||$('.rail-spacer')||rail.lastElementChild)?.insertAdjacentElement('beforebegin',b)}
    function tabBtn(view,label,after){if(!tabs||$(`.topbar-tabs [data-view="${view}"]`))return;const b=document.createElement('button');b.className='tab';b.dataset.view=view;b.textContent=label;($(after)||tabs.lastElementChild)?.insertAdjacentElement('afterend',b)}
    side('ligacoes','Ligações','.sidebar-nav [data-view="agenda"]');railBtn('ligacoes','Ligações','.rail [data-view="agenda"]');tabBtn('ligacoes','Ligações','.topbar-tabs [data-view="agenda"]');
    side('metas','Metas','.sidebar-nav [data-view="automacoes"]');railBtn('metas','Metas','.rail [data-view="automacoes"]');tabBtn('metas','Metas','.topbar-tabs [data-view="cadencias"]');
  }

  function hiddenPrefs(){return readJSON(KEYS.hidden,{})||{}}
  function applyVisibility(){
    const hidden=hiddenPrefs();
    document.body.classList.toggle('crm-sidebar-pinned',readJSON(KEYS.pin,false)===true);
    $$('[data-view]').forEach(el=>{const v=el.dataset.view;if(!v)return;el.classList.toggle('crm-tab-hidden',!!hidden[v]);});
    $$('.nav-label').forEach(l=>{const next=[];let n=l.nextElementSibling;while(n&&!n.classList.contains('nav-label')){if(n.matches&&n.matches('[data-view]'))next.push(n);n=n.nextElementSibling}l.style.display=next.length&&next.every(x=>x.classList.contains('crm-tab-hidden'))?'none':'';});
  }
  function currentView(){return $('.view.active')?.id||'inicio'}
  function openTabManager(){
    ensureModal();
    const hidden=hiddenPrefs();
    $('#crmV36ModalTitle').textContent='Gerenciar abas do CRM';
    $('#crmV36ModalBody').innerHTML=`<div class="crm-v36-tabs-manager"><div class="crm-v36-modal-note">Marque as abas que você quer ver. Ao desmarcar, ela some da barra superior, da lateral expandida e da lateral compacta.</div>${VIEW_ORDER.filter(v=>document.getElementById(v)||$(`[data-view="${v}"]`)).map(v=>`<label class="crm-v36-check"><input type="checkbox" value="${esc(v)}" ${hidden[v]?'':'checked'}><div><strong>${esc(VIEW_META[v]?.[0]||v)}</strong><span>${esc(VIEW_META[v]?.[1]||'')}</span></div></label>`).join('')}</div>`;
    $('#crmV36ModalFoot').innerHTML='<button class="btn" data-v36-show-all>Mostrar tudo</button><button class="btn" data-v36-cancel>Cancelar</button><button class="btn btn-primary" data-v36-save-tabs>Salvar abas</button>';
    $('#crmV36Modal').classList.remove('hidden');
  }
  function ensureSidebarControls(){
    const foot=$('.sidebar-footer');if(!foot)return;
    if(!$('#crmV36TabsBtn')) foot.insertAdjacentHTML('afterbegin',`<button class="theme-toggle crm-v36-side-control" id="crmV36TabsBtn">${ICONS.settings}<span>Gerenciar abas</span></button>`);
    if(!$('#crmV36PinBtn')) foot.insertAdjacentHTML('afterbegin',`<button class="theme-toggle crm-v36-side-control" id="crmV36PinBtn">${ICONS.blocks}<span>${readJSON(KEYS.pin,false)?'Desfixar lateral':'Fixar lateral'}</span></button>`);
    const actions=$('.topbar-actions');
    if(actions&&!$('#crmV36TopTabs'))actions.insertAdjacentHTML('beforeend','<button class="btn btn-sm" id="crmV36TopTabs">Abas</button>');
    if(actions&&!$('#crmV36AddBlockTop'))actions.insertAdjacentHTML('beforeend','<button class="btn btn-sm btn-primary" id="crmV36AddBlockTop">+ Bloco</button>');
  }

  function ensureModal(){
    if($('#crmV36Modal'))return;
    document.body.insertAdjacentHTML('beforeend',`<div class="modal-overlay hidden" id="crmV36Modal"><div class="modal-box crm-v36-modal"><div class="modal-head"><h3 id="crmV36ModalTitle">Configuração</h3><button class="modal-close" data-v36-cancel>${icon('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div><div class="modal-body" id="crmV36ModalBody"></div><div class="modal-foot" id="crmV36ModalFoot"></div></div></div>`);
  }

  function ensureLeadFollowupFields(){
    if(!$('#mFollowStage')){
      const fu=$('#mFollowup')?.closest('.field');
      if(fu)fu.insertAdjacentHTML('afterend',`<div class="field"><label>Etapa do follow-up</label><select id="mFollowStage">${FU_STAGES.map(s=>`<option>${s}</option>`).join('')}</select></div>`);
    }
    const form=$('#leadForm');
    if(form&&!form.querySelector('[name="followupStage"]')){
      const fu=form.querySelector('[name="followup"]')?.closest('.field');
      if(fu)fu.insertAdjacentHTML('afterend',`<div class="field"><label>Etapa do follow-up</label><select name="followupStage">${FU_STAGES.map(s=>`<option>${s}</option>`).join('')}</select></div>`);
    }
    const oldOpen=window.openModal|| (typeof openModal==='function'?openModal:null);
    if(oldOpen&&!oldOpen.__v36Follow){
      const wrapped=function(lead,defStage){oldOpen(lead,defStage);setTimeout(()=>{const el=$('#mFollowStage');if(el)el.value=lead?.followupStage||lead?.followupEtapa||lead?.etapaFollowup||'Novo follow-up';},0)};
      wrapped.__v36Follow=true;window.openModal=wrapped;try{openModal=wrapped}catch(e){}
    }
    const oldGet=window.getModalData|| (typeof getModalData==='function'?getModalData:null);
    if(oldGet&&!oldGet.__v36Follow){
      const wrapped=function(){const d=oldGet();d.followupStage=$('#mFollowStage')?.value||'Novo follow-up';return d};
      wrapped.__v36Follow=true;window.getModalData=wrapped;try{getModalData=wrapped}catch(e){}
    }
    if(form&&!form.dataset.v36FollowBound){form.dataset.v36FollowBound='1';form.addEventListener('submit',()=>{const st=form.querySelector('[name="followupStage"]')?.value||'Novo follow-up';setTimeout(()=>{const arr=getLeads();const latest=arr[0];if(latest&&!latest.followupStage){latest.followupStage=st;persistLeads();try{typeof renderAll==='function'&&renderAll()}catch(e){}}},80)},true)}
  }

  function patchLeadCards(){
    $$('.kanban-card[data-id],.kanban-card').forEach(card=>{if(card.querySelector('.fu-stage-pill'))return;const name=card.dataset.id||card.dataset.nome||card.querySelector('.kc-name')?.textContent?.trim();const l=getLeads().find(x=>String(x.id||x.nome)===String(name)||x.nome===name);if(!l)return;const f=card.querySelector('.kc-footer')||card;f.insertAdjacentHTML('beforeend',`<span class="fu-stage-pill">${esc(fuStage(l))}</span>`)});
    const dExtra=$('#dExtra');if(dExtra&&$('#dNome')?.textContent&&!$('#dFuStageBox')){const l=getLeads().find(x=>x.nome===$('#dNome').textContent.trim());if(l)dExtra.insertAdjacentHTML('afterbegin',`<div class="dp-row" id="dFuStageBox"><div class="dp-field"><label>Etapa do follow-up</label><p>${esc(fuStage(l))}</p></div><div class="dp-field"><label>Próximo contato</label><p>${fmt(l.followup)}</p></div></div>`)}
  }

  function ensureFollowupPlus(){
    const page=$('#cadencias');if(!page)return;
    if(!$('#fuStageBoardV36')){
      const kpi=$('#fuKpiGrid');
      const html=`<div class="card crm-v36-fu-stage-card" id="fuStagePanelV36"><div class="card-header"><div><div class="card-title">Etapas do follow-up por lead</div><div class="card-sub">Veja em qual toque da cadência cada lead está e avance a etapa sem sair da tela.</div></div><button class="btn btn-sm" id="fuRunAutoV36">Executar automações</button></div><div class="card-body"><div class="crm-v36-fu-board" id="fuStageBoardV36"></div></div></div>`;
      (kpi||page.firstElementChild)?.insertAdjacentHTML('afterend',html);
    }
    if(!$('#fuStage')){const type=$('#fuType')?.closest('.field'); if(type)type.insertAdjacentHTML('afterend',`<div class="field"><label>Etapa do follow-up</label><select id="fuStage">${FU_STAGES.map(s=>`<option>${s}</option>`).join('')}</select></div>`)}
    renderFollowupPlus();
  }
  function statusLabel(l){const d=daysDiff(l.followup);if(!l.followup)return 'Sem data';if(d<0)return `${Math.abs(d)}d atrasado`;if(d===0)return 'Hoje';if(d===1)return 'Amanhã';return `${d} dias`}
  function renderFollowupPlus(){
    const board=$('#fuStageBoardV36');if(!board)return;
    const open=getLeads().filter(isOpen);
    board.innerHTML=FU_STAGES.map(st=>{const arr=open.filter(l=>fuStage(l)===st);return `<div class="crm-v36-fu-col"><div class="crm-v36-fu-col-head"><b>${esc(st)}</b><span>${arr.length}</span></div><div class="crm-v36-fu-col-body">${arr.slice(0,9).map(l=>`<div class="crm-v36-fu-card" data-v36-lead="${esc(l.id||l.nome)}"><div><strong>${esc(l.nome)}</strong><small>${esc(l.etapa||'Lead')} · ${statusLabel(l)} · Score ${score(l)}</small></div><button class="btn btn-xs" data-v36-next-fu="${esc(l.id||l.nome)}">Avançar</button></div>`).join('')||'<div class="crm-v36-empty-mini">Sem leads</div>'}</div></div>`}).join('');
  }
  function updateFollowupFromQuick(){
    const ref=$('#fuLeadSelect')?.value;const l=getLeads().find(x=>String(x.id||x.nome)===String(ref)||x.nome===ref);if(!l)return;
    l.followupStage=$('#fuStage')?.value||l.followupStage||'Novo follow-up';persistLeads();setTimeout(()=>{renderFollowupPlus();patchLeadCards()},80);
  }

  function ensureAutomationsPlus(){
    const page=$('#automacoes');if(!page)return;
    if(!$('#autoV36')){
      page.insertAdjacentHTML('afterbegin',`<div class="card auto-v36" id="autoV36"><div class="card-header"><div><div class="card-title">Automações por abas e funções</div><div class="card-sub">Separe regras de Follow-ups, Pipeline, Ligações, Agenda, Metas e Leads. As regras são locais e editáveis.</div></div><div class="crm-report-actions"><button class="btn btn-sm" id="autoV36Seq">Sequência de follow-up</button><button class="btn btn-sm btn-primary" id="autoV36Run">Executar agora</button></div></div><div class="card-body"><div class="auto-v36-tabs" id="autoV36Tabs"></div><div class="auto-v36-grid"><div><div id="autoV36List"></div></div><div class="auto-v36-builder"><div class="card-title">Nova regra</div><div class="field"><label>Aba/Função</label><select id="autoV36Area"><option>Follow-ups</option><option>Pipeline</option><option>Ligações</option><option>Agenda</option><option>Metas</option><option>Leads</option></select></div><div class="field"><label>Gatilho</label><input id="autoV36Trigger" placeholder="Ex: lead sem próximo passo"></div><div class="field"><label>Ação</label><input id="autoV36Action" placeholder="Ex: criar follow-up para amanhã"></div><div class="field"><label>Dias</label><input id="autoV36Days" type="number" value="1"></div><button class="btn btn-primary" id="autoV36Save">Salvar regra</button></div></div></div></div>`);
    }
    renderAutomationsPlus();
  }
  function defaultAutos(){return [
    {id:'auto_no_followup',area:'Follow-ups',trigger:'Lead aberto sem próximo passo',action:'Criar follow-up para hoje e colocar em Novo follow-up',days:0,active:true,kind:'no_followup'},
    {id:'auto_overdue',area:'Follow-ups',trigger:'Follow-up vencido',action:'Marcar prioridade alta e mover para Reativação',days:0,active:true,kind:'overdue'},
    {id:'auto_proposal',area:'Pipeline',trigger:'Lead entrou em Proposta',action:'Mover para Proposta enviada e criar retorno em 2 dias',days:2,active:true,kind:'proposal'},
    {id:'auto_call_missed',area:'Ligações',trigger:'Ligação sem atendimento',action:'Criar retorno para amanhã',days:1,active:true,kind:'custom'},
    {id:'auto_agenda_sync',area:'Agenda',trigger:'Lead com follow-up e sem evento',action:'Criar compromisso na agenda',days:0,active:true,kind:'agenda_from_followup'},
    {id:'auto_goal_call',area:'Metas',trigger:'Ligação registrada',action:'Atualizar progresso de meta automaticamente',days:0,active:true,kind:'goal_hint'}
  ]}
  function autos(){const a=readJSON(KEYS.autos,null);return Array.isArray(a)&&a.length?a:defaultAutos()}
  function saveAutos(a){writeJSON(KEYS.autos,a)}
  let autoArea='Follow-ups';
  function renderAutomationsPlus(){
    const tabs=$('#autoV36Tabs'),list=$('#autoV36List');if(!tabs||!list)return;
    const areas=['Follow-ups','Pipeline','Ligações','Agenda','Metas','Leads'];
    tabs.innerHTML=areas.map(a=>`<button class="chip ${a===autoArea?'active':''}" data-v36-auto-area="${esc(a)}">${esc(a)} <span>${autos().filter(r=>r.area===a).length}</span></button>`).join('');
    const arr=autos().filter(r=>r.area===autoArea);
    list.innerHTML=arr.map(r=>`<div class="auto-v36-rule ${r.active?'':'off'}"><div class="auto-v36-rule-main"><b>${esc(r.trigger)}</b><p>${esc(r.action)} ${r.days?`· ${r.days} dia(s)`:''}</p></div><div class="auto-v36-rule-actions"><button class="auto-toggle ${r.active?'on':''}" data-v36-auto-toggle="${esc(r.id)}">${r.active?'Ativa':'Pausada'}</button><button class="btn btn-xs" data-v36-auto-edit="${esc(r.id)}">Editar</button><button class="btn btn-xs btn-danger" data-v36-auto-del="${esc(r.id)}">Excluir</button></div></div>`).join('')||'<div class="crm-v36-empty-mini">Nenhuma regra nesta aba.</div>';
  }
  function runAutos(){
    const arr=autos().filter(r=>r.active),leadsArr=getLeads();let changed=0;
    arr.forEach(r=>{
      leadsArr.forEach(l=>{
        if(!isOpen(l))return;
        if(r.kind==='no_followup'&&!l.followup){l.followup=addDays(r.days||0);l.followupStage='Novo follow-up';l.proximaAcao=l.proximaAcao||'Automação: definir próximo contato';changed++;}
        if(r.kind==='overdue'&&l.followup&&daysDiff(l.followup)<0){l.prioridade='Alta';l.followupStage='Reativação';l.proximaAcao='Automação: retomar follow-up vencido';changed++;}
        if(r.kind==='proposal'&&l.etapa==='Proposta'){l.followupStage='Proposta enviada';if(!l.followup||daysDiff(l.followup)>Number(r.days||2))l.followup=addDays(r.days||2);changed++;}
      });
      if(r.kind==='agenda_from_followup')changed+=createAgendaFromFollowups(false);
    });
    if(changed){persistLeads();try{typeof renderAll==='function'&&renderAll()}catch(e){};renderFollowupPlus();renderAutomationsPlus();toast(`${changed} atualização(ões) aplicadas pelas automações`,'success')}else toast('Nada novo para automatizar agora','warn');
  }
  function openSeqModal(){
    ensureModal();const seq=getSeq();
    $('#crmV36ModalTitle').textContent='Sequência de follow-up';
    $('#crmV36ModalBody').innerHTML=`<div class="crm-v36-modal-note">Configure a etapa, canal e prazo sugerido. Essa sequência aparece na aba Follow-ups e nas automações.</div><div class="seq-v36-list">${seq.map((s,i)=>`<div class="seq-v36-row"><input value="${esc(s.stage)}" data-seq-stage="${i}"><select data-seq-channel="${i}"><option ${s.channel==='Ligação'?'selected':''}>Ligação</option><option ${s.channel==='WhatsApp'?'selected':''}>WhatsApp</option><option ${s.channel==='E-mail'?'selected':''}>E-mail</option><option ${s.channel==='Reunião'?'selected':''}>Reunião</option><option ${s.channel==='Nota'?'selected':''}>Nota</option></select><input type="number" value="${Number(s.delay)||0}" data-seq-delay="${i}"><label><input type="checkbox" ${s.active?'checked':''} data-seq-active="${i}"> ativa</label></div>`).join('')}</div>`;
    $('#crmV36ModalFoot').innerHTML='<button class="btn" data-v36-cancel>Cancelar</button><button class="btn btn-primary" data-v36-save-seq>Salvar sequência</button>';
    $('#crmV36Modal').classList.remove('hidden');
  }

  function createAgendaFromFollowups(show=true){
    const events=readJSON(EVENT_KEY,[]);const leadsArr=getLeads().filter(l=>isOpen(l)&&l.followup);let added=0;
    leadsArr.forEach(l=>{const exists=events.some(e=>e.leadNome===l.nome&&e.data===String(l.followup).slice(0,10)&&String(e.tipo||'').includes('Follow-up'));if(!exists){events.push({id:'ev_v36_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),leadNome:l.nome,data:String(l.followup).slice(0,10),hora:'09:00',tipo:'Follow-up',prioridade:l.prioridade||'Média',notas:l.proximaAcao||`Follow-up: ${fuStage(l)}`,spin:{s:'',p:'',i:'',n:''}});added++;}});
    if(added){writeJSON(EVENT_KEY,events);try{if(typeof agEvents!=='undefined'){agEvents.splice(0,agEvents.length,...events);}}catch(e){}}
    if(show)toast(added?`${added} compromisso(s) criados na agenda`:'Agenda já estava sincronizada',added?'success':'warn');
    return added;
  }
  function ensureAgendaTools(){
    const page=$('#agenda');if(!page)return;
    if(!$('#agendaToolsV36')){
      const header=page.querySelector('.section-header');
      header?.insertAdjacentHTML('afterend',`<div class="agenda-tools-v36" id="agendaToolsV36"><div><div class="agenda-tools-title">Ferramentas de agenda</div><div class="agenda-tools-sub">Sincronize follow-ups, veja atrasos e filtre a rotina comercial em um clique.</div></div><div class="agenda-tools-actions"><button class="btn btn-sm" data-agv36-filter="today">Hoje</button><button class="btn btn-sm" data-agv36-filter="overdue">Atrasados</button><button class="btn btn-sm" data-agv36-filter="high">Alta prioridade</button><button class="btn btn-sm" id="agendaSyncFuV36">Gerar agenda dos follow-ups</button><button class="btn btn-sm btn-primary" id="agendaExportV36">Exportar CSV</button></div><div class="agenda-tools-kpis" id="agendaToolsKpisV36"></div></div>`);
    }
    renderAgendaTools();
  }
  function renderAgendaTools(){
    const box=$('#agendaToolsKpisV36');if(!box)return;const events=readJSON(EVENT_KEY,[]),t=today();const leadsOpen=getLeads().filter(isOpen);const overdue=events.filter(e=>e.data<t).length,todayN=events.filter(e=>e.data===t).length,fu=leadsOpen.filter(l=>l.followup).length,hot=leadsOpen.filter(l=>l.prioridade==='Alta').length;
    box.innerHTML=[['Hoje',todayN],['Atrasados',overdue],['Leads com follow-up',fu],['Alta prioridade',hot]].map(x=>`<div><b>${x[1]}</b><span>${x[0]}</span></div>`).join('');
  }
  function exportAgenda(){const events=readJSON(EVENT_KEY,[]);const rows=[['data','hora','tipo','lead','prioridade','notas'],...events.map(e=>[e.data,e.hora,e.tipo,e.leadNome,e.prioridade,e.notas])];const csv=rows.map(r=>r.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(';')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='agenda-crm.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

  let callState={page:1,per:8,active:null,start:null,timer:null};
  function digits(v){return String(v||'').replace(/\D/g,'')}
  function fullPhone(v){let d=digits(v);if(d.startsWith('55')&&d.length>=12)return '+'+d;return '+55'+d}
  function dialHref(v){const cfg=readJSON(KEYS.call,{protocol:'tel'});const full=fullPhone(v),plain=full.replace(/\D/g,'');if(cfg.protocol==='whatsapp')return 'https://wa.me/'+plain;if(cfg.protocol==='callto')return 'callto:'+full;if(cfg.protocol==='sip')return 'sip:'+full;return 'tel:'+full}
  function callActivitiesToday(){let n=0;getLeads().forEach(l=>(Array.isArray(l.atividades)?l.atividades:[]).forEach(a=>{if(a.tipo==='Ligação'&&String(a.data||'').slice(0,10)===today())n++}));return n}
  function lastCall(l){const a=(Array.isArray(l.atividades)?l.atividades:[]).find(x=>x.tipo==='Ligação');return a?fmt(String(a.data).slice(0,10)):'Sem registro'}
  function callQueue(){const q=($('#callSearchV36')?.value||'').toLowerCase(),filter=$('#callFilterV36')?.value||'';let arr=getLeads().filter(l=>isOpen(l)&&digits(l.telefone).length>=8);arr=arr.filter(l=>{if(filter==='hoje'&&!(l.followup&&daysDiff(l.followup)<=0))return false;if(filter==='alta'&&l.prioridade!=='Alta')return false;if(filter==='sem-ligacao'&&lastCall(l)!=='Sem registro')return false;if(filter==='proposta'&&l.etapa!=='Proposta')return false;if(q&&!([l.nome,l.segmento,l.responsavel,l.telefone,l.etapa,l.prioridade].join(' ').toLowerCase().includes(q)))return false;return true});arr.sort((a,b)=>(daysDiff(a.followup)-daysDiff(b.followup))||(score(b)-score(a)));return arr}
  function ensureCallSection(){
    if(!$('#ligacoes')){$('main')?.insertAdjacentHTML('beforeend','<section id="ligacoes" class="view grid-view call-shell"></section>')}
    const sec=$('#ligacoes');if(!sec||sec.dataset.v36Ready)return;sec.dataset.v36Ready='1';
    sec.innerHTML=`<div class="section-header call-v36-hero"><div><div class="section-title-text">Ligações</div><div class="section-sub">Discador com contador corrigido, paginação, filtros, script e registro automático no histórico do lead.</div></div><div class="crm-report-actions"><button class="btn btn-sm" id="callRefreshV36">Atualizar</button><button class="btn btn-sm btn-primary" data-view="novo-lead">+ Novo lead</button></div></div><div class="call-kpi-grid" id="callKpisV36"></div><div class="call-main-grid"><div class="card"><div class="call-toolbar"><div class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="search-input" id="callSearchV36" placeholder="Buscar lead, responsável ou segmento..."></div><select id="callFilterV36" class="search-input" style="padding-left:12px;min-width:165px"><option value="">Todos</option><option value="hoje">Ligar hoje</option><option value="alta">Alta prioridade</option><option value="proposta">Propostas</option><option value="sem-ligacao">Sem ligação</option></select><select id="callPerPageV36" class="search-input" style="padding-left:12px;min-width:115px"><option>8</option><option>12</option><option>20</option></select><button class="btn btn-sm" id="callNextBestV36">Próximo melhor</button></div><div class="call-table-wrap"><table class="data-table"><thead><tr><th>Lead</th><th>Follow-up</th><th>Telefone</th><th>Última ligação</th><th>Score</th><th>Ações</th></tr></thead><tbody id="callTableV36"></tbody></table></div><div class="pagination" id="callPaginationV36"></div></div><aside class="call-side-v36"><div class="card call-dial-card"><div class="card-header"><div><div class="card-title">Discador</div><div class="card-sub">Abra o telefone e registre o resultado.</div></div></div><div class="card-body" id="callDialV36"></div></div><div class="card"><div class="card-header"><div><div class="card-title">Script inteligente</div><div class="card-sub">Roteiro consultivo adaptado ao lead.</div></div></div><div class="card-body"><div class="call-script" id="callScriptV36"></div></div></div></aside></div>`;
  }
  function renderCallCenterV36(){
    ensureCallSection();const q=callQueue();callState.per=Number($('#callPerPageV36')?.value)||8;const totalPages=Math.max(1,Math.ceil(q.length/callState.per));callState.page=Math.min(Math.max(1,callState.page),totalPages);const page=q.slice((callState.page-1)*callState.per,callState.page*callState.per);
    const phoneLeads=getLeads().filter(l=>isOpen(l)&&digits(l.telefone).length>=8).length,due=getLeads().filter(l=>isOpen(l)&&l.followup&&daysDiff(l.followup)<=0).length,noPhone=getLeads().filter(l=>isOpen(l)&&digits(l.telefone).length<8).length,callsToday=callActivitiesToday();
    $('#callKpisV36').innerHTML=[['Ligações hoje',callsToday,'Contador corrigido pelo histórico'],['Na fila',phoneLeads,'Leads abertos com telefone'],['Precisam ligar',due,'Follow-ups vencidos/hoje'],['Sem telefone',noPhone,'Completar cadastro']].map(x=>`<div class="call-kpi"><div class="v">${x[1]}</div><div class="l">${x[0]}</div><div class="call-note">${x[2]}</div></div>`).join('');
    const tb=$('#callTableV36');
    if(!page.length)tb.innerHTML='<tr><td colspan="6"><div class="call-empty"><b>Nenhum lead encontrado.</b><br>Ajuste os filtros ou cadastre telefones.</div></td></tr>';else tb.innerHTML=page.map(l=>`<tr class="${callState.active===(l.id||l.nome)?'selected-row':''}" data-call-v36="${esc(l.id||l.nome)}"><td><strong style="color:var(--text)">${esc(l.nome)}</strong><div class="muted" style="font-size:11.5px">${esc(l.segmento||'Sem segmento')} · ${esc(l.responsavel||'Sem responsável')} · ${esc(fuStage(l))}</div></td><td>${tag(statusLabel(l),l.followup&&daysDiff(l.followup)<=0?'tag-alta':'tag-neutro')}</td><td style="font-family:JetBrains Mono,monospace;font-size:12px">${esc(l.telefone)}</td><td>${esc(lastCall(l))}</td><td><span class="score-pill ${score(l)>=80?'score-hi':score(l)>=45?'score-md':'score-lo'}">${score(l)}</span></td><td><div class="row-actions" style="opacity:1"><button class="row-action primary" data-call-v36-start="${esc(l.id||l.nome)}">Ligar</button><button class="row-action" data-call-v36-select="${esc(l.id||l.nome)}">Selecionar</button><button class="row-action" data-call-v36-open="${esc(l.id||l.nome)}">Lead</button></div></td></tr>`).join('');
    $('#callPaginationV36').innerHTML=`<div class="pg-info">Mostrando ${q.length?((callState.page-1)*callState.per+1):0}-${Math.min(callState.page*callState.per,q.length)} de ${q.length}</div><div class="pg-btns"><button class="pg-btn" data-call-page="prev" ${callState.page<=1?'disabled':''}>‹</button><span class="pg-cur">Página ${callState.page}/${totalPages}</span><button class="pg-btn" data-call-page="next" ${callState.page>=totalPages?'disabled':''}>›</button></div>`;
    renderDialV36();
  }
  function activeLead(){const arr=getLeads();let l=arr.find(x=>String(x.id||x.nome)===String(callState.active));if(!l){l=callQueue()[0];callState.active=l?(l.id||l.nome):null}return l}
  function duration(){if(!callState.start)return '00:00';const s=Math.floor((Date.now()-callState.start)/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
  function renderDialV36(){const box=$('#callDialV36'),script=$('#callScriptV36');if(!box)return;const l=activeLead();if(!l){box.innerHTML='<div class="call-empty" style="color:rgba(255,255,255,.7)">Selecione um lead para ligar.</div>';if(script)script.textContent='Selecione um lead para montar o roteiro.';return}const target=(readJSON(KEYS.call,{protocol:'tel'}).protocol||'tel')==='whatsapp'?'_blank':'_self';box.innerHTML=`<div class="call-active-name">${esc(l.nome)}</div><div class="call-active-meta"><span>${esc(l.etapa||'Lead')}</span><span>•</span><span>${esc(fuStage(l))}</span><span>•</span><span>${money(l.valor)}</span></div><div class="call-number-box"><div><div style="font-size:11px;color:rgba(255,255,255,.58);font-weight:700;text-transform:uppercase;letter-spacing:.06em">Telefone</div><div class="call-number">${esc(l.telefone)}</div></div><button class="btn btn-sm" data-call-copy-v36="${esc(l.telefone)}">Copiar</button></div><div style="font-size:11px;color:rgba(255,255,255,.62);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Tempo</div><div class="call-timer" id="callTimerV36">${duration()}</div><div class="call-actions"><a class="btn btn-primary" href="${esc(dialHref(l.telefone))}" target="${target}" data-call-v36-start="${esc(l.id||l.nome)}">Abrir discador</a><button class="btn" data-call-stop-v36>Parar</button></div><div class="call-outcome-grid"><button class="call-outcome" data-call-outcome-v36="Atendeu">✅ Atendeu</button><button class="call-outcome" data-call-outcome-v36="Não atendeu">📵 Não atendeu</button><button class="call-outcome" data-call-outcome-v36="Caixa postal">🎙️ Caixa postal</button><button class="call-outcome" data-call-outcome-v36="Reunião marcada">📅 Reunião marcada</button><button class="call-outcome" data-call-outcome-v36="Enviar WhatsApp">💬 Enviar WhatsApp</button><button class="call-outcome" data-call-outcome-v36="Sem interesse">🚫 Sem interesse</button></div><div class="field" style="margin-top:12px"><label style="color:rgba(255,255,255,.65)">Observação</label><textarea id="callNoteV36" placeholder="Ex: decisor ausente, pediu retorno amanhã..." style="background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.18);color:#fff"></textarea></div><div class="call-config-grid" style="margin-top:12px"><div class="field"><label style="color:rgba(255,255,255,.65)">Protocolo</label><select id="callProtocolV36"><option value="tel">tel:</option><option value="callto">callto:</option><option value="sip">sip:</option><option value="whatsapp">WhatsApp</option></select></div></div>`;const cfg=readJSON(KEYS.call,{protocol:'tel'});$('#callProtocolV36').value=cfg.protocol||'tel';if(script)script.textContent=`Abertura:\nOlá, falo com ${l.responsavel||'o responsável'}? Aqui é [SEU NOME]. Vou ser breve.\n\nContexto:\nEstou falando com empresas de ${l.segmento||'serviços'} para entender se existe perda de oportunidades por falta de rotina de follow-up.\n\nDiagnóstico:\nHoje vocês conseguem ver quem precisa receber contato, em qual etapa está e qual próximo passo?\n\nPróximo passo:\nSe fizer sentido, eu te mostro em poucos minutos um diagnóstico simples para aumentar conversão e previsibilidade.`}
  function startCall(ref){callState.active=ref;callState.start=Date.now();clearInterval(callState.timer);callState.timer=setInterval(()=>{$('#callTimerV36')&&($('#callTimerV36').textContent=duration())},1000);renderCallCenterV36()}
  function stopCall(){clearInterval(callState.timer);callState.timer=null;callState.start=null;renderDialV36()}
  function saveOutcomeV36(out){const l=activeLead();if(!l)return;if(!Array.isArray(l.atividades))l.atividades=[];const sec=callState.start?Math.floor((Date.now()-callState.start)/1000):0;const note=$('#callNoteV36')?.value||'';l.atividades.unshift({id:'call_v36_'+Date.now(),tipo:'Ligação',texto:`Resultado: ${out}. Duração: ${Math.floor(sec/60)}m${sec%60}s.${note?'\nObservação: '+note:''}`,autor:'Discador do CRM',data:new Date().toISOString()});l.ultimaAtualizacao=today();if(out==='Atendeu'&&l.etapa==='Lead')l.etapa='Contato';if(out==='Não atendeu'||out==='Caixa postal'){l.followup=addDays(1);l.followupStage=nextFuStage(fuStage(l));l.proximaAcao='Retornar ligação'}if(out==='Reunião marcada'){l.followup=addDays(2);l.followupStage='Proposta enviada';l.proximaAcao='Preparar reunião/diagnóstico'}if(out==='Sem interesse'){l.prioridade='Baixa';l.followup=addDays(15);l.followupStage='Reativação'}if(out==='Enviar WhatsApp'){try{window.open('https://wa.me/'+fullPhone(l.telefone).replace(/\D/g,''),'_blank')}catch(e){}}persistLeads();stopCall();try{typeof renderAll==='function'&&renderAll()}catch(e){}renderCallCenterV36();toast('Ligação registrada e contador atualizado','success')}

  function ensureCustomBlockTools(view){if(!view||view==='chat')return;const page=$('#'+view);if(!page)return;if(!page.querySelector('.crm-v36-custom-area'))page.insertAdjacentHTML('beforeend','<div class="crm-v36-custom-area" data-v36-block-area></div>');renderCustomBlocks(view)}
  function blocks(){return readJSON(KEYS.blocks,[])}
  function saveBlocks(arr){writeJSON(KEYS.blocks,arr)}
  function openBlockModal(blockId){ensureModal();const b=blocks().find(x=>x.id===blockId)||{id:'',view:currentView(),title:'',type:'texto',content:'',width:'normal'};$('#crmV36ModalTitle').textContent=b.id?'Editar bloco':'Criar bloco personalizado';$('#crmV36ModalBody').innerHTML=`<div class="modal-grid"><div class="field"><label>Aba</label><select id="blockViewV36">${VIEW_ORDER.filter(v=>document.getElementById(v)).map(v=>`<option value="${esc(v)}" ${b.view===v?'selected':''}>${esc(VIEW_META[v]?.[0]||v)}</option>`).join('')}</select></div><div class="field"><label>Formato</label><select id="blockTypeV36"><option value="texto" ${b.type==='texto'?'selected':''}>Texto livre</option><option value="checklist" ${b.type==='checklist'?'selected':''}>Checklist</option><option value="metricas" ${b.type==='metricas'?'selected':''}>Métricas rápidas</option><option value="lista" ${b.type==='lista'?'selected':''}>Lista simples</option></select></div><div class="field"><label>Largura</label><select id="blockWidthV36"><option value="normal" ${b.width==='normal'?'selected':''}>Normal</option><option value="wide" ${b.width==='wide'?'selected':''}>Largo</option><option value="full" ${b.width==='full'?'selected':''}>Tela inteira</option></select></div><div class="field"><label>Título</label><input id="blockTitleV36" value="${esc(b.title)}" placeholder="Ex: Rotina de prospecção"></div><div class="field full"><label>Conteúdo</label><textarea id="blockContentV36" rows="6" placeholder="Uma linha por item quando usar checklist/lista/métricas">${esc(b.content)}</textarea></div></div>`;$('#crmV36ModalFoot').innerHTML=`${b.id?'<button class="btn btn-danger" data-v36-delete-block="'+esc(b.id)+'">Excluir</button>':''}<button class="btn" data-v36-cancel>Cancelar</button><button class="btn btn-primary" data-v36-save-block="${esc(b.id)}">Salvar bloco</button>`;$('#crmV36Modal').classList.remove('hidden')}
  function renderCustomBlocks(view){const area=$(`#${view} [data-v36-block-area]`);if(!area)return;const arr=blocks().filter(b=>b.view===view);area.innerHTML=arr.map(b=>`<div class="crm-v36-custom-block ${b.width==='full'?'full':b.width==='wide'?'wide':''}"><div class="crm-v36-custom-head"><div><b>${esc(b.title||'Bloco sem título')}</b><span>${esc(b.type||'texto')}</span></div><button class="btn btn-xs" data-v36-edit-block="${esc(b.id)}">Editar</button></div><div class="crm-v36-custom-content">${renderBlockContent(b)}</div></div>`).join('')}
  function renderBlockContent(b){const lines=String(b.content||'').split('\n').filter(x=>x.trim());if(b.type==='checklist')return lines.map(x=>`<label class="crm-v36-line"><input type="checkbox"> <span>${esc(x)}</span></label>`).join('')||'<span class="muted">Checklist vazio.</span>';if(b.type==='metricas')return `<div class="crm-v36-mini-metrics">${lines.map(x=>{const [a,c]=x.split(':');return `<div><b>${esc(c||'0')}</b><span>${esc(a||x)}</span></div>`}).join('')}</div>`;if(b.type==='lista')return `<ul>${lines.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;return `<p>${esc(b.content||'Sem conteúdo.').replace(/\n/g,'<br>')}</p>`}

  function ensureSmartFilters(view){
    if(!['leads','pipeline','cadencias','agenda','ligacoes'].includes(view))return;const page=$('#'+view);if(!page||page.querySelector('.crm-v36-filterbar'))return;
    const html=`<div class="crm-v36-filterbar"><div class="crm-v36-filter-label">Filtros</div><input class="crm-v36-filter-input" data-v36-filter-q placeholder="Buscar nesta aba..."><select data-v36-filter-stage><option value="">Todas as etapas</option><option>Lead</option><option>Contato</option><option>Proposta</option><option>Fechado</option><option>Perdido</option></select><select data-v36-filter-priority><option value="">Todas prioridades</option><option>Alta</option><option>Média</option><option>Baixa</option></select><button class="chip" data-v36-filter-clear>Limpar</button></div>`;
    const after=page.querySelector('.section-header')||page.firstElementChild;after?.insertAdjacentHTML('afterend',html);
  }
  function applySmartFilter(view){const page=$('#'+view);if(!page)return;const q=(page.querySelector('[data-v36-filter-q]')?.value||'').toLowerCase();const st=page.querySelector('[data-v36-filter-stage]')?.value||'';const pr=page.querySelector('[data-v36-filter-priority]')?.value||'';let items=[];if(view==='pipeline')items=$$('.kanban-card',page);else if(view==='cadencias')items=$$('.followup-item,.crm-v36-fu-card',page);else if(view==='agenda')items=$$('.ag-item',page);else if(view==='ligacoes')items=$$('#callTableV36 tr',page);else items=$$('tbody tr,.v19-row',page);items.forEach(el=>{const text=el.textContent.toLowerCase();const ok=(!q||text.includes(q))&&(!st||text.includes(st.toLowerCase()))&&(!pr||text.includes(pr.toLowerCase()));el.style.display=ok?'':'none'});}

  function afterView(view){
    if(!view)return;const m=VIEW_META[view];if(m){$('#topbarTitle')&&($('#topbarTitle').textContent=m[0]);$('#topbarSub')&&($('#topbarSub').textContent=m[1])}
    ensureCoreNav();applyVisibility();ensureLeadFollowupFields();ensureSmartFilters(view);ensureCustomBlockTools(view);patchLeadCards();
    if(view==='cadencias')setTimeout(ensureFollowupPlus,80);
    if(view==='automacoes')setTimeout(ensureAutomationsPlus,80);
    if(view==='agenda')setTimeout(ensureAgendaTools,80);
    if(view==='ligacoes')setTimeout(renderCallCenterV36,80);
    if(view==='metas')setTimeout(()=>{ensureCustomBlockTools('metas');},120);
  }
  function wrapSetView(){const prev=window.setView|| (typeof setView==='function'?setView:null);if(prev&&prev.__crmV36Wrapped)return;const wrapped=function(view){if(typeof prev==='function')prev(view);else{document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));document.getElementById(view)?.classList.add('active')}setTimeout(()=>afterView(view),0);try{document.dispatchEvent(new CustomEvent('crm:viewchange',{detail:{view}}))}catch(e){}};wrapped.__crmV36Wrapped=true;window.setView=wrapped;try{setView=wrapped}catch(e){}}

  function bind(){
    document.addEventListener('click',function(e){
      if(e.target.closest('#crmV36TabsBtn,#crmV36TopTabs')){e.preventDefault();openTabManager();return}
      if(e.target.closest('#crmV36PinBtn')){e.preventDefault();writeJSON(KEYS.pin,!(readJSON(KEYS.pin,false)===true));$('#crmV36PinBtn span')&&($('#crmV36PinBtn span').textContent=readJSON(KEYS.pin,false)?'Desfixar lateral':'Fixar lateral');applyVisibility();return}
      if(e.target.closest('#crmV36AddBlockTop')){e.preventDefault();openBlockModal();return}
      if(e.target.closest('[data-v36-cancel]')||e.target.id==='crmV36Modal'){if(e.target.id==='crmV36Modal'||e.target.closest('[data-v36-cancel]'))$('#crmV36Modal')?.classList.add('hidden')}
      if(e.target.closest('[data-v36-show-all]')){$$('#crmV36ModalBody input[type="checkbox"]').forEach(i=>i.checked=true)}
      if(e.target.closest('[data-v36-save-tabs]')){const hidden={};$$('#crmV36ModalBody input[type="checkbox"]').forEach(i=>{if(!i.checked)hidden[i.value]=true});writeJSON(KEYS.hidden,hidden);applyVisibility();$('#crmV36Modal')?.classList.add('hidden');toast('Abas atualizadas','success')}
      const saveBlock=e.target.closest('[data-v36-save-block]');if(saveBlock){const arr=blocks();const id=saveBlock.dataset.v36SaveBlock||('blk_'+Date.now());const b={id,view:$('#blockViewV36').value,title:$('#blockTitleV36').value,type:$('#blockTypeV36').value,width:$('#blockWidthV36').value,content:$('#blockContentV36').value};const idx=arr.findIndex(x=>x.id===id);if(idx>-1)arr[idx]=b;else arr.unshift(b);saveBlocks(arr);$('#crmV36Modal')?.classList.add('hidden');renderCustomBlocks(b.view);toast('Bloco salvo','success')}
      const editBlock=e.target.closest('[data-v36-edit-block]');if(editBlock){openBlockModal(editBlock.dataset.v36EditBlock)}
      const delBlock=e.target.closest('[data-v36-delete-block]');if(delBlock){saveBlocks(blocks().filter(b=>b.id!==delBlock.dataset.v36DeleteBlock));$('#crmV36Modal')?.classList.add('hidden');renderCustomBlocks(currentView());toast('Bloco excluído','warn')}
      const next=e.target.closest('[data-v36-next-fu]');if(next){const l=getLeads().find(x=>String(x.id||x.nome)===String(next.dataset.v36NextFu));if(l){l.followupStage=nextFuStage(fuStage(l));const seq=getSeq().find(s=>s.stage===l.followupStage);if(seq&&seq.active)l.followup=addDays(seq.delay||1);l.proximaAcao=`Próxima etapa: ${l.followupStage}`;persistLeads();renderFollowupPlus();toast('Etapa de follow-up avançada','success')}}
      if(e.target.closest('#fuSaveQuick'))setTimeout(updateFollowupFromQuick,100);
      if(e.target.closest('#fuRunAutoV36,#autoV36Run'))runAutos();
      if(e.target.closest('#autoV36Seq'))openSeqModal();
      const area=e.target.closest('[data-v36-auto-area]');if(area){autoArea=area.dataset.v36AutoArea;renderAutomationsPlus()}
      if(e.target.closest('#autoV36Save')){const arr=autos();arr.unshift({id:'auto_'+Date.now(),area:$('#autoV36Area').value,trigger:$('#autoV36Trigger').value||'Gatilho personalizado',action:$('#autoV36Action').value||'Ação personalizada',days:Number($('#autoV36Days').value)||0,active:true,kind:'custom'});saveAutos(arr);autoArea=$('#autoV36Area').value;renderAutomationsPlus();toast('Automação criada','success')}
      const tog=e.target.closest('[data-v36-auto-toggle]');if(tog){const arr=autos();const r=arr.find(x=>x.id===tog.dataset.v36AutoToggle);if(r)r.active=!r.active;saveAutos(arr);renderAutomationsPlus()}
      const del=e.target.closest('[data-v36-auto-del]');if(del){saveAutos(autos().filter(r=>r.id!==del.dataset.v36AutoDel));renderAutomationsPlus();toast('Automação excluída','warn')}
      const edit=e.target.closest('[data-v36-auto-edit]');if(edit){const r=autos().find(x=>x.id===edit.dataset.v36AutoEdit);if(r){$('#autoV36Area').value=r.area;$('#autoV36Trigger').value=r.trigger;$('#autoV36Action').value=r.action;$('#autoV36Days').value=r.days||0;toast('Regra carregada no editor','success')}}
      if(e.target.closest('[data-v36-save-seq]')){const seq=[];$$('[data-seq-stage]').forEach(inp=>{const i=inp.dataset.seqStage;seq.push({stage:inp.value,channel:$(`[data-seq-channel="${i}"]`).value,delay:Number($(`[data-seq-delay="${i}"]`).value)||0,active:$(`[data-seq-active="${i}"]`).checked})});saveSeq(seq);$('#crmV36Modal')?.classList.add('hidden');toast('Sequência salva','success')}
      if(e.target.closest('#agendaSyncFuV36'))createAgendaFromFollowups(true);
      if(e.target.closest('#agendaExportV36'))exportAgenda();
      const agf=e.target.closest('[data-agv36-filter]');if(agf){const f=agf.dataset.agv36Filter;const page=$('#agenda');if(f==='today'){$('#agSearch')&&($('#agSearch').value='');}$$('.ag-item',page).forEach(el=>{const txt=el.textContent.toLowerCase();let ok=true;if(f==='overdue')ok=el.classList.contains('overdue');if(f==='high')ok=txt.includes('alta');el.style.display=ok?'':'none'});}
      const selectBtn=e.target.closest('[data-call-v36-select]');if(selectBtn){e.preventDefault();callState.active=selectBtn.dataset.callV36Select;callState.start=null;renderCallCenterV36();return}
      const sel=e.target.closest('tr[data-call-v36]');if(sel&&($('#ligacoes.active')||e.target.closest('#ligacoes'))&&!e.target.closest('button,a,input,select')){callState.active=sel.dataset.callV36;callState.start=null;renderCallCenterV36()}
      const cs=e.target.closest('[data-call-v36-start]');if(cs){callState.active=cs.dataset.callV36Start;startCall(callState.active)}
      if(e.target.closest('[data-call-stop-v36]'))stopCall();
      const out=e.target.closest('[data-call-outcome-v36]');if(out)saveOutcomeV36(out.dataset.callOutcomeV36);
      const pg=e.target.closest('[data-call-page]');if(pg){if(pg.dataset.callPage==='prev')callState.page--;else callState.page++;renderCallCenterV36()}
      if(e.target.closest('#callNextBestV36')){const q=callQueue();if(q[0]){callState.active=q[0].id||q[0].nome;renderCallCenterV36();toast('Próximo melhor lead selecionado','success')}}
      if(e.target.closest('#callRefreshV36'))renderCallCenterV36();
      const op=e.target.closest('[data-call-v36-open]');if(op){const l=getLeads().find(x=>String(x.id||x.nome)===String(op.dataset.callV36Open));try{if(l&&typeof openDetail==='function')openDetail(l.nome);else if(l&&typeof openModal==='function')openModal(l)}catch(err){}}
      const cp=e.target.closest('[data-call-copy-v36]');if(cp){navigator.clipboard?.writeText(cp.dataset.callCopyV36);toast('Telefone copiado','success')}
      if(e.target.closest('[data-v36-filter-clear]')){const bar=e.target.closest('.crm-v36-filterbar');bar?.querySelectorAll('input,select').forEach(x=>x.value='');applySmartFilter(currentView())}
    },true);
    document.addEventListener('input',function(e){const page=e.target.closest('.view');if(e.target.matches('[data-v36-filter-q]'))applySmartFilter(page?.id);if(['callSearchV36'].includes(e.target.id)){callState.page=1;renderCallCenterV36()}},true);
    document.addEventListener('change',function(e){const page=e.target.closest('.view');if(e.target.matches('[data-v36-filter-stage],[data-v36-filter-priority]'))applySmartFilter(page?.id);if(['callFilterV36','callPerPageV36'].includes(e.target.id)){callState.page=1;renderCallCenterV36()}if(e.target.id==='callProtocolV36'){writeJSON(KEYS.call,{protocol:e.target.value});renderDialV36()}},true);
    document.addEventListener('crm:viewchange',e=>setTimeout(()=>afterView(e.detail?.view),60));
  }

  function boot(){ensureCoreNav();ensureSidebarControls();ensureModal();ensureLeadFollowupFields();wrapSetView();applyVisibility();bind();afterView(currentView());setTimeout(()=>{ensureCallSection();patchLeadCards();},300);new MutationObserver(()=>{applyVisibility();patchLeadCards()}).observe(document.body,{subtree:true,childList:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
