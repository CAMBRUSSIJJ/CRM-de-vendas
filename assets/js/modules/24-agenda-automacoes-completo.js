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
/* Script original 25 */
/* CRM V41 — limpeza estrutural: abas estáveis + automações, agenda e ligações profissionais */
(function(){
  'use strict';
  if(window.__crmV41CleanFix) return;
  window.__crmV41CleanFix = true;

  const DOC = document;
  const $ = (sel, root=DOC) => root.querySelector(sel);
  const $$ = (sel, root=DOC) => Array.from(root.querySelectorAll(sel));
  const KEYS = {
    leads: 'outbounder_leads_v5',
    call: 'crm_v41_call_config',
    autos: 'crm_v41_automations',
    agendas: 'crm_v41_agendas',
    events: 'crm_v41_events',
    agendaView: 'crm_v41_agenda_view',
    autoArea: 'crm_v41_auto_area'
  };
  const OPEN_STAGES = ['Lead','Contato','Proposta'];
  const FU_STAGES = ['Primeiro contato','Segundo contato','Terceiro contato','Nutrição','Proposta enviada','Negociação','Reativação','Concluído'];
  const AREAS = ['Todas','Leads','Pipeline','Follow-ups','Ligações','Metas','Agenda','Playbooks','Clientes'];
  const viewLabels = {
    inicio:['Início','Painel principal e comandos rápidos'],
    leads:['Leads','Base comercial e oportunidades'],
    pipeline:['Pipeline','Kanban operacional de oportunidades'],
    clientes:['Clientes','Carteira ativa e pós-venda'],
    playbooks:['Playbooks','Scripts, materiais e processos'],
    objecoes:['Objeções','Respostas comerciais e padrões de perda'],
    perdas:['Perdas','Motivos de perda e reativação'],
    dashboard:['Dashboard','Indicadores comerciais consolidados'],
    cadencias:['Follow-ups','Fila, etapas e próximas ações'],
    automacoes:['Automações','Central para automatizar rotinas do CRM'],
    agenda:['Agenda','Múltiplas agendas, calendário, Kanban e banco de dados'],
    ligacoes:['Ligações','Fila de chamadas, discador e registro no histórico'],
    metricas:['Métricas','Relatórios e análise comercial'],
    importar:['Importar','Entrada e limpeza de dados'],
    'novo-lead':['Novo lead','Cadastro de oportunidade']
  };

  function esc(v){return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function brl(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);}
  function today(){return new Date().toISOString().slice(0,10);}
  function addDays(n){const d=new Date();d.setDate(d.getDate()+Number(n||0));return d.toISOString().slice(0,10);}
  function dateBR(v){if(!v)return 'Sem data';try{return new Date(String(v).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR');}catch(e){return String(v);}}
  function daysDiff(v){if(!v)return 9999;const d=new Date(String(v).slice(0,10)+'T12:00:00');const t=new Date();t.setHours(0,0,0,0);d.setHours(0,0,0,0);return Math.round((d-t)/86400000);}
  function read(key, fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}catch(e){return fallback;}}
  function write(key, val){try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}}
  function notify(msg,type='success'){
    try{ if(typeof showToast==='function') return showToast(msg,type); }catch(e){}
    try{ if(typeof toast==='function') return toast(msg,type); }catch(e){}
    const t=$('#toast');
    if(t){ t.textContent=msg; t.className='toast show '+type; setTimeout(()=>t.classList.remove('show'),2400); }
  }
  function leadArray(){
    try{ if(typeof leads !== 'undefined' && Array.isArray(leads)) return leads; }catch(e){}
    try{ if(Array.isArray(window.leads)) return window.leads; }catch(e){}
    const l=read(KEYS.leads,[]); return Array.isArray(l)?l:[];
  }
  function saveLeadArray(list){
    try{ if(typeof leads !== 'undefined' && Array.isArray(leads)){ leads.splice(0,leads.length,...list); if(typeof saveLeads==='function') saveLeads(); else write(KEYS.leads,leads); return; } }catch(e){}
    write(KEYS.leads,list);
  }
  function ensureLeadIds(){const arr=leadArray();let changed=false;arr.forEach((l,i)=>{if(!l.id){l.id='lead_'+Date.now().toString(36)+'_'+i+'_'+Math.random().toString(36).slice(2,7);changed=true;} if(!l.followupEtapa){l.followupEtapa=stageFromLead(l);changed=true;}});if(changed)saveLeadArray(arr);return arr;}
  function stageFromLead(l){if(l.followupEtapa)return l.followupEtapa;if(l.etapa==='Proposta')return 'Proposta enviada';if(l.etapa==='Contato')return 'Segundo contato';if(l.etapa==='Perdido')return 'Reativação';return 'Primeiro contato';}
  function findLead(id){return ensureLeadIds().find(l=>String(l.id||l.nome)===String(id));}
  function saveLead(lead){const arr=ensureLeadIds();const idx=arr.findIndex(l=>String(l.id||l.nome)===String(lead.id||lead.nome));if(idx>=0){arr[idx]=lead;saveLeadArray(arr);} }
  function isOpenLead(l){return !['Fechado','Perdido'].includes(String(l.etapa||''));}
  function scoreLead(l){let s=40;if(l.prioridade==='Alta')s+=25;if(l.etapa==='Proposta')s+=18;if(l.followup){const d=daysDiff(l.followup);if(d<0)s+=22;else if(d===0)s+=16;else if(d<=2)s+=8;}if(Number(l.valor)>10000)s+=8;return Math.max(0,Math.min(100,s));}
  function phoneDigits(v){return String(v||'').replace(/\D/g,'');}
  function fullPhone(v){let d=phoneDigits(v);if(!d)return '';if(d.startsWith('55')&&d.length>=12)return '+'+d;return '+55'+d;}
  function callConfig(){return Object.assign({protocol:'tel',countOnOpen:true,autoFollow:true},read(KEYS.call,{}));}
  function saveCallConfig(cfg){write(KEYS.call,Object.assign(callConfig(),cfg));}
  function dialURL(phone){const cfg=callConfig();const full=fullPhone(phone);if(!full)return '';const plain=full.replace(/\D/g,'');if(cfg.protocol==='whatsapp')return 'https://wa.me/'+plain;if(cfg.protocol==='callto')return 'callto:'+full;if(cfg.protocol==='sip')return 'sip:'+full;return 'tel:'+full;}
  function addActivity(lead,type,text){lead.atividades=Array.isArray(lead.atividades)?lead.atividades:[];lead.atividades.unshift({tipo:type,data:new Date().toISOString(),texto:text||type,autor:'CRM'});lead.ultimaAtualizacao=today();}
  function callsToday(){let n=0;ensureLeadIds().forEach(l=>(Array.isArray(l.atividades)?l.atividades:[]).forEach(a=>{if(String(a.tipo)==='Ligação'&&String(a.data||'').slice(0,10)===today()) n++;}));return n;}
  function lastCall(lead){const a=(Array.isArray(lead.atividades)?lead.atividades:[]).find(x=>String(x.tipo)==='Ligação');return a?dateBR(String(a.data).slice(0,10)):'Nunca';}
  function openLeadDetail(id){try{ if(typeof openDetail==='function') return openDetail(id); }catch(e){} const l=findLead(id); if(l) notify('Lead selecionado: '+(l.nome||'Sem nome'),'success'); }

  function cleanupDuplicateViews(){
    const seen=new Set();
    $$('section.view[id], div.view[id]').forEach(el=>{
      if(seen.has(el.id)){ el.remove(); return; }
      seen.add(el.id);
    });
  }
  function ensureNavButton(id,label){
    if(!$('.sidebar-nav [data-view="'+id+'"]')){
      const ref=$('.sidebar-nav [data-view="agenda"]') || $('.sidebar-nav [data-view="dashboard"]');
      const b=DOC.createElement('button'); b.className='nav-item'; b.dataset.view=id; b.innerHTML='<span>'+esc(label)+'</span>';
      ref && ref.parentNode ? ref.parentNode.insertBefore(b,ref.nextSibling) : $('.sidebar-nav')?.appendChild(b);
    }
    if(!$('.rail [data-view="'+id+'"]')){
      const ref=$('.rail [data-view="agenda"]') || $('.rail [data-view="dashboard"]');
      const b=DOC.createElement('button'); b.className='rail-btn'; b.dataset.view=id; b.title=label; b.textContent=label.charAt(0);
      ref && ref.parentNode ? ref.parentNode.insertBefore(b,ref.nextSibling) : $('.rail')?.appendChild(b);
    }
    if(!$('.topbar-tabs [data-view="'+id+'"]')){
      const b=DOC.createElement('button'); b.className='tab'; b.dataset.view=id; b.textContent=label;
      $('.topbar-tabs')?.appendChild(b);
    }
  }
  function ensureSection(id){
    let sec=DOC.getElementById(id);
    if(!sec){ sec=DOC.createElement('section'); sec.id=id; sec.className='view grid-view'; $('main,.main')?.appendChild(sec); }
    sec.classList.add('view','grid-view');
    return sec;
  }
  function cleanVisibility(){
    cleanupDuplicateViews();
    const active=$('.view.active');
    const target=active?.id || 'inicio';
    $$('.view[id]').forEach(v=>{ if(v.id!==target){v.classList.remove('active');v.style.display='none';} });
    const cur=DOC.getElementById(target); if(cur){cur.classList.add('active');cur.style.display='';}
  }
  function setViewV41(id){
    cleanupDuplicateViews();
    id = id || 'inicio';
    const el=DOC.getElementById(id);
    if(!el){ notify('Aba não encontrada: '+id,'warn'); return false; }
    $$('.view[id]').forEach(v=>{v.classList.toggle('active',v.id===id);v.style.display=v.id===id?'':'none';});
    $$('[data-view],[data-go]').forEach(b=>{const v=b.dataset.view||b.dataset.go;b.classList.toggle('active',v===id);});
    const t=viewLabels[id]; if(t){ const title=$('.topbar-title'); const sub=$('.topbar-sub'); if(title) title.textContent=t[0]; if(sub) sub.textContent=t[1]; }
    renderForView(id);
    DOC.dispatchEvent(new CustomEvent('crm:v41:view',{detail:{view:id}}));
    return true;
  }
  window.setView = setViewV41;

  function shell(title,sub,actions=''){
    return '<div class="section-header v41-head"><div><div class="section-title-text">'+esc(title)+'</div><div class="section-sub">'+esc(sub)+'</div></div><div class="v41-actions">'+actions+'</div></div>';
  }
  function kpi(value,label,hint=''){
    return '<div class="v41-kpi"><strong>'+esc(value)+'</strong><span>'+esc(label)+'</span>'+(hint?'<small>'+esc(hint)+'</small>':'')+'</div>';
  }
  function pill(text,cls='') {return '<span class="v41-pill '+cls+'">'+esc(text)+'</span>';}
  function scoreBar(v){return '<div class="v41-score"><span style="width:'+Math.max(4,Math.min(100,Number(v)||0))+'%"></span></div>';}

  function defaultAutomations(){return [
    {id:'auto_follow_vencido',active:true,area:'Follow-ups',name:'Follow-up vencido vira prioridade',trigger:'Quando follow-up passar da data',condition:'Lead aberto e sem atividade recente',action:'Marcar como prioridade alta e exibir na fila',target:'Follow-ups',delay:'Imediato'},
    {id:'auto_call_meta',active:true,area:'Ligações',name:'Ligação alimenta metas',trigger:'Ao abrir discador ou registrar resultado',condition:'Lead com telefone válido',action:'Registrar atividade e atualizar contador de metas',target:'Metas',delay:'Imediato'},
    {id:'auto_pipeline_proposta',active:true,area:'Pipeline',name:'Proposta gera próximo passo',trigger:'Lead entra em Proposta',condition:'Sem follow-up preenchido',action:'Criar follow-up de negociação',target:'Agenda',delay:'1 dia'},
    {id:'auto_agenda_share',active:false,area:'Agenda',name:'Reunião compartilhada',trigger:'Evento criado como reunião',condition:'Com responsável preenchido',action:'Preparar agendamento compartilhado',target:'Agenda',delay:'Imediato'}
  ];}
  function getAutomations(){const a=read(KEYS.autos,null);return Array.isArray(a)?a:defaultAutomations();}
  function setAutomations(a){write(KEYS.autos,a);}
  function automationTemplates(){return [
    ['Leads','Lead sem telefone','Quando um lead for cadastrado sem telefone','Criar pendência de enriquecimento','Leads'],
    ['Pipeline','Negócio parado','Quando ficar 7 dias sem avanço','Criar alerta e tarefa de retomada','Pipeline'],
    ['Follow-ups','Sequência comercial','Quando etapa de follow-up mudar','Criar próximo passo automático','Follow-ups'],
    ['Ligações','Discador + metas','Quando clicar em ligar','Registrar atividade e avançar meta','Metas'],
    ['Metas','Ritmo diário','Quando meta do dia estiver abaixo do ritmo','Gerar rotina comercial','Metas'],
    ['Agenda','Evento recorrente','Quando criar compromisso recorrente','Criar série no calendário escolhido','Agenda'],
    ['Playbooks','Script por objeção','Quando registrar objeção','Sugerir script do playbook','Playbooks'],
    ['Clientes','Pós-venda','Quando fechar cliente','Criar checklist de onboarding','Clientes']
  ];}
  function renderAutomacoes(){
    ensureNavButton('automacoes','Automações');
    const sec=ensureSection('automacoes');
    sec.dataset.v41='1';
    const list=getAutomations();
    const area=localStorage.getItem(KEYS.autoArea)||'Todas';
    const filtered=area==='Todas'?list:list.filter(a=>a.area===area);
    const active=list.filter(a=>a.active).length;
    sec.innerHTML=shell('Automações','Central para automatizar tudo que rege suas abas: leads, pipeline, follow-ups, ligações, metas, agenda, playbooks e clientes.','<button class="btn btn-primary" id="v41AutoNew">+ Nova automação</button><button class="btn" id="v41AutoSim">Simular impacto</button>')+
      '<div class="v41-shell">'+
      '<div class="v41-kpis">'+kpi(list.length,'Regras criadas')+kpi(active,'Ativas')+kpi(AREAS.length-1,'Áreas cobertas')+kpi('100%','Local e configurável','sem depender de backend')+'</div>'+
      '<div class="v41-card v41-builder"><div class="v41-card-head"><div><b>Construtor de automação</b><small>Monte a regra escolhendo área, gatilho, condição, ação e destino.</small></div></div><div class="v41-form-grid">'+
      '<label>Área<select id="v41AutoAreaInput">'+AREAS.filter(x=>x!=='Todas').map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label>'+
      '<label>Nome<input id="v41AutoName" placeholder="Ex: Follow-up vencido vira prioridade"></label>'+
      '<label>Gatilho<select id="v41AutoTrigger"><option>Novo lead criado</option><option>Lead muda de etapa</option><option>Follow-up vence</option><option>Clique no discador</option><option>Meta abaixo do ritmo</option><option>Evento criado</option><option>Objeção registrada</option></select></label>'+
      '<label>Condição<input id="v41AutoCondition" placeholder="Ex: prioridade alta, sem atividade em 3 dias"></label>'+
      '<label>Ação<select id="v41AutoAction"><option>Criar tarefa</option><option>Alterar prioridade</option><option>Registrar atividade</option><option>Atualizar meta</option><option>Criar evento na agenda</option><option>Mover etapa</option><option>Sugerir playbook</option></select></label>'+
      '<label>Destino<select id="v41AutoTarget">'+AREAS.filter(x=>x!=='Todas').map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label>'+
      '<label>Prazo<select id="v41AutoDelay"><option>Imediato</option><option>1 hora</option><option>1 dia</option><option>3 dias</option><option>7 dias</option></select></label>'+
      '<div class="v41-form-actions"><button class="btn btn-primary" id="v41AutoSave">Criar automação</button><button class="btn" id="v41AutoReset">Limpar</button></div></div></div>'+
      '<div class="v41-grid-2"><div class="v41-card"><div class="v41-card-head"><div><b>Áreas automatizáveis</b><small>Filtre e controle regras por aba.</small></div></div><div class="v41-chips">'+AREAS.map(x=>'<button class="v41-chip '+(x===area?'active':'')+'" data-v41-auto-area="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div><div class="v41-auto-list">'+(filtered.map(autoCard).join('')||'<div class="v41-empty">Nenhuma automação nesta área.</div>')+'</div></div>'+
      '<div class="v41-card"><div class="v41-card-head"><div><b>Modelos prontos</b><small>Use um modelo e ajuste depois.</small></div></div><div class="v41-template-list">'+automationTemplates().map((t,i)=>'<button class="v41-template" data-v41-template="'+i+'"><b>'+esc(t[1])+'</b><span>'+esc(t[0])+' · '+esc(t[3])+'</span></button>').join('')+'</div></div></div>'+
      '</div>';
  }
  function autoCard(a){return '<div class="v41-auto-card '+(a.active?'':'off')+'" data-auto-id="'+esc(a.id)+'"><div><b>'+esc(a.name)+'</b><p>'+esc(a.trigger)+' · '+esc(a.condition||'Sem condição')+'</p><div>'+pill(a.area,'blue')+pill(a.action,'green')+pill(a.delay||'Imediato','gray')+'</div></div><div class="v41-auto-actions"><button class="btn btn-xs" data-v41-auto-toggle="'+esc(a.id)+'">'+(a.active?'Pausar':'Ativar')+'</button><button class="btn btn-xs" data-v41-auto-dup="'+esc(a.id)+'">Duplicar</button><button class="btn btn-xs btn-danger" data-v41-auto-del="'+esc(a.id)+'">Excluir</button></div></div>';}

  function defaultAgendas(){return [
    {id:'comercial',name:'Comercial',color:'blue',active:true,shared:true},
    {id:'followups',name:'Follow-ups',color:'amber',active:true,shared:false},
    {id:'pessoal',name:'Pessoal',color:'green',active:true,shared:false},
    {id:'time',name:'Time compartilhado',color:'purple',active:true,shared:true}
  ];}
  function getAgendas(){const a=read(KEYS.agendas,null);return Array.isArray(a)?a:defaultAgendas();}
  function setAgendas(a){write(KEYS.agendas,a);}
  function getEvents(){const e=read(KEYS.events,null);return Array.isArray(e)?e:[];}
  function setEvents(e){write(KEYS.events,e);}
  function syncedFollowups(){return ensureLeadIds().filter(l=>isOpenLead(l)&&l.followup).map(l=>({id:'fu_'+l.id,title:'Follow-up: '+(l.nome||'Lead'),date:String(l.followup).slice(0,10),time:'09:00',agenda:'followups',type:'Follow-up',recurrence:'Não repete',shared:false,notes:l.followupEtapa||stageFromLead(l),leadId:l.id,fromLead:true}));}
  function activeAgendaIds(){return new Set(getAgendas().filter(a=>a.active).map(a=>a.id));}
  function allAgendaItems(){const active=activeAgendaIds();return getEvents().concat(syncedFollowups()).filter(e=>active.has(e.agenda));}
  function renderAgenda(){
    ensureNavButton('agenda','Agenda');
    const sec=ensureSection('agenda'); sec.dataset.v41='1';
    const ag=getAgendas(); const ev=allAgendaItems(); const view=localStorage.getItem(KEYS.agendaView)||'calendario';
    const todayN=ev.filter(e=>e.date===today()).length;
    const weekN=ev.filter(e=>daysDiff(e.date)>=0&&daysDiff(e.date)<=7).length;
    const sharedN=ev.filter(e=>e.shared).length;
    sec.innerHTML=shell('Agenda','Lida com múltiplas agendas, cores, eventos recorrentes, agendamento compartilhado, calendário, banco de dados e Kanban conforme seu fluxo.','<button class="btn btn-primary" id="v41AgendaAdd">+ Criar evento</button><button class="btn" id="v41AgendaSync">Sincronizar follow-ups</button>')+
      '<div class="v41-shell">'+
      '<div class="v41-kpis">'+kpi(ag.length,'Agendas')+kpi(todayN,'Hoje')+kpi(weekN,'Próximos 7 dias')+kpi(sharedN,'Compartilhados')+'</div>'+
      '<div class="v41-grid-agenda"><aside class="v41-card"><div class="v41-card-head"><div><b>Camadas de agenda</b><small>Ative, oculte e organize trabalho e vida pessoal.</small></div></div><div class="v41-layer-list">'+ag.map(a=>'<label class="v41-layer"><input type="checkbox" data-v41-agenda-toggle="'+esc(a.id)+'" '+(a.active?'checked':'')+'><span class="v41-dot '+esc(a.color)+'"></span><b>'+esc(a.name)+'</b><small>'+(a.shared?'Compartilhada':'Privada')+'</small></label>').join('')+'</div><div class="v41-card-head compact"><div><b>Novo evento</b><small>Crie compromissos com recorrência.</small></div></div>'+eventForm(ag)+'</aside>'+
      '<main class="v41-card"><div class="v41-card-head"><div><b>Visualização da agenda</b><small>Alterna entre calendário, lista, Kanban, banco de dados e modelos.</small></div><div class="v41-tabs">'+['calendario','lista','kanban','banco','modelos'].map(v=>'<button class="v41-tab '+(view===v?'active':'')+'" data-v41-agenda-view="'+v+'">'+({calendario:'Calendário',lista:'Lista',kanban:'Kanban',banco:'Banco de dados',modelos:'Modelos'}[v])+'</button>').join('')+'</div></div><div id="v41AgendaContent">'+agendaContent(view,ev,ag)+'</div></main></div>'+
      '</div>';
  }
  function eventForm(ag){return '<div class="v41-form-mini"><label>Título<input id="v41EventTitle" placeholder="Ex: Reunião com lead"></label><label>Agenda<select id="v41EventAgenda">'+ag.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join('')+'</select></label><label>Data<input id="v41EventDate" type="date" value="'+today()+'"></label><label>Hora<input id="v41EventTime" type="time" value="09:00"></label><label>Tipo<select id="v41EventType"><option>Reunião</option><option>Ligação</option><option>Follow-up</option><option>Planejamento</option><option>Pessoal</option></select></label><label>Recorrência<select id="v41EventRec"><option>Não repete</option><option>Diário</option><option>Semanal</option><option>Mensal</option></select></label><label class="v41-check"><input id="v41EventShared" type="checkbox"> Compartilhado</label><button class="btn btn-primary" id="v41EventSave">Salvar evento</button></div>';}
  function agendaContent(view,events,agendas){if(view==='lista')return agendaList(events,agendas);if(view==='kanban')return agendaKanban(events);if(view==='banco')return agendaDatabase(events,agendas);if(view==='modelos')return agendaModels();return agendaCalendar(events,agendas);}
  function agendaName(id,ag){return (ag.find(a=>a.id===id)||{}).name||id;}
  function agendaCalendar(events,ag){let html='<div class="v41-calendar-mini">';for(let i=0;i<14;i++){const d=addDays(i);const items=events.filter(e=>e.date===d).sort((a,b)=>String(a.time).localeCompare(String(b.time)));html+='<div class="v41-day"><div class="v41-day-title">'+(i===0?'Hoje':dateBR(d))+'</div>'+(items.slice(0,5).map(e=>'<button class="v41-event '+esc(e.agenda)+'" data-v41-open-event="'+esc(e.id)+'"><b>'+esc(e.time||'--:--')+'</b> '+esc(e.title)+'<small>'+esc(agendaName(e.agenda,ag))+'</small></button>').join('')||'<p>Sem eventos</p>')+'</div>';}return html+'</div>';}
  function agendaList(events,ag){const arr=events.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));return '<div class="v41-table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Hora</th><th>Evento</th><th>Agenda</th><th>Recorrência</th><th>Compart.</th></tr></thead><tbody>'+(arr.map(e=>'<tr><td>'+dateBR(e.date)+'</td><td>'+esc(e.time||'--:--')+'</td><td>'+esc(e.title)+'</td><td>'+esc(agendaName(e.agenda,ag))+'</td><td>'+esc(e.recurrence||'Não repete')+'</td><td>'+(e.shared?'Sim':'Não')+'</td></tr>').join('')||'<tr><td colspan="6">Sem eventos.</td></tr>')+'</tbody></table></div>';}
  function agendaKanban(events){const groups=[['hoje','Hoje',e=>e.date===today()],['semana','Esta semana',e=>daysDiff(e.date)>0&&daysDiff(e.date)<=7],['futuro','Depois',e=>daysDiff(e.date)>7],['semdata','Sem data',e=>!e.date]];return '<div class="v41-kanban">'+groups.map(g=>'<div class="v41-col"><div class="v41-col-head"><b>'+g[1]+'</b><span>'+events.filter(g[2]).length+'</span></div>'+events.filter(g[2]).map(e=>'<div class="v41-kan-card"><b>'+esc(e.title)+'</b><small>'+dateBR(e.date)+' · '+esc(e.time||'--:--')+'</small>'+pill(e.type||'Evento','blue')+'</div>').join('')+'</div>').join('')+'</div>';}
  function agendaDatabase(events,ag){return '<div class="v41-db-head">Banco de dados com campos editáveis: agenda, data, hora, tipo, recorrência, compartilhamento e observações.</div>'+agendaList(events,ag);}
  function agendaModels(){return '<div class="v41-model-grid">'+['Rotina diária comercial','Reunião recorrente semanal','Bloco de prospecção','Follow-up pós-proposta','Planejamento pessoal','Agenda compartilhada do time'].map((m,i)=>'<button class="v41-model" data-v41-agenda-model="'+i+'"><b>'+esc(m)+'</b><span>Aplicar modelo</span></button>').join('')+'</div>';}

  let activeCallId=null;
  function callQueue(){const q=String($('#v41CallSearch')?.value||'').toLowerCase();const filter=$('#v41CallFilter')?.value||'';let arr=ensureLeadIds().filter(isOpenLead);if(q)arr=arr.filter(l=>[l.nome,l.segmento,l.responsavel,l.telefone,l.email].some(x=>String(x||'').toLowerCase().includes(q)));if(filter==='hoje')arr=arr.filter(l=>daysDiff(l.followup)<=0);if(filter==='alta')arr=arr.filter(l=>l.prioridade==='Alta');if(filter==='semfone')arr=arr.filter(l=>!phoneDigits(l.telefone));if(filter==='proposta')arr=arr.filter(l=>l.etapa==='Proposta');arr.sort((a,b)=>scoreLead(b)-scoreLead(a));return arr;}
  function renderLigacoes(){
    ensureNavButton('ligacoes','Ligações');
    const sec=ensureSection('ligacoes'); sec.dataset.v41='1'; sec.classList.add('call-shell');
    const leadsAll=ensureLeadIds().filter(isOpenLead); const queue=callQueue(); const withPhone=leadsAll.filter(l=>phoneDigits(l.telefone)).length; const cfg=callConfig();
    if(!activeCallId && queue[0]) activeCallId=queue[0].id;
    sec.innerHTML=shell('Ligações','Fila profissional conectada aos leads, discador do computador, registro no histórico e avanço seguro para metas.','<button class="btn" id="v41CallRefresh">Atualizar fila</button><button class="btn btn-primary" data-view="novo-lead">+ Novo lead</button>')+
      '<div class="v41-shell">'+
      '<div class="v41-call-hero"><div><b>Discador configurável</b><p>O botão de ligar abre o aplicativo padrão do seu computador. Escolha tel, callto, sip ou WhatsApp. Leads sem telefone aparecem para correção, em vez de sumirem da fila.</p></div><div class="v41-call-config"><label>Protocolo<select id="v41CallProtocol"><option value="tel" '+(cfg.protocol==='tel'?'selected':'')+'>tel:</option><option value="callto" '+(cfg.protocol==='callto'?'selected':'')+'>callto:</option><option value="sip" '+(cfg.protocol==='sip'?'selected':'')+'>sip:</option><option value="whatsapp" '+(cfg.protocol==='whatsapp'?'selected':'')+'>WhatsApp Web</option></select></label><label class="v41-check"><input type="checkbox" id="v41CallCountOpen" '+(cfg.countOnOpen?'checked':'')+'> contar ao abrir discador</label></div></div>'+
      '<div class="v41-kpis">'+kpi(leadsAll.length,'Leads abertos')+kpi(withPhone,'Com telefone')+kpi(leadsAll.length-withPhone,'Sem telefone')+kpi(callsToday(),'Ligações hoje')+'</div>'+
      '<div class="v41-call-grid"><div class="v41-card"><div class="v41-card-head"><div><b>Fila de ligações</b><small>Priorizada por follow-up, etapa, prioridade e valor.</small></div></div><div class="v41-toolbar"><input id="v41CallSearch" placeholder="Buscar lead, segmento ou responsável"><select id="v41CallFilter"><option value="">Todos</option><option value="hoje">Vencidos/hoje</option><option value="alta">Alta prioridade</option><option value="proposta">Propostas</option><option value="semfone">Sem telefone</option></select></div><div id="v41CallQueue" class="v41-call-list">'+(queue.map(callCard).join('')||'<div class="v41-empty">Nenhum lead encontrado para esta fila.</div>')+'</div></div>'+
      '<aside class="v41-card"><div class="v41-card-head"><div><b>Discador e resultado</b><small>Escolha um lead na fila para agir.</small></div></div><div id="v41DialPanel">'+dialPanel(activeCallId)+'</div></aside></div>'+
      '</div>';
  }
  function callCard(l){const d=daysDiff(l.followup);const overdue=d<0;const hasPhone=!!phoneDigits(l.telefone);return '<div class="v41-call-card '+(String(l.id)===String(activeCallId)?'active':'')+'" data-v41-call-lead="'+esc(l.id)+'"><div class="v41-avatar">'+esc((l.nome||'?').slice(0,2).toUpperCase())+'</div><div class="v41-call-body"><b>'+esc(l.nome||'Lead sem nome')+'</b><p>'+esc(l.segmento||'Sem segmento')+' · '+esc(l.responsavel||'Sem responsável')+'</p><div>'+pill(l.etapa||'Lead','blue')+pill(l.followupEtapa||stageFromLead(l),'green')+pill(hasPhone?'Telefone ok':'Sem telefone',hasPhone?'':'red')+(l.followup?pill((overdue?'Vencido ':'')+dateBR(l.followup),overdue?'red':'gray'):'')+'</div></div><div class="v41-call-score"><b>'+scoreLead(l)+'</b>'+scoreBar(scoreLead(l))+'</div></div>';}
  function dialPanel(id){const l=id?findLead(id):null;if(!l)return '<div class="v41-empty">Selecione um lead para abrir o discador.</div>';const href=dialURL(l.telefone);return '<div class="v41-dial-lead"><b>'+esc(l.nome||'Lead')+'</b><p>'+esc(l.telefone||'Telefone não informado')+'</p><div>'+pill(l.etapa||'Lead','blue')+pill(l.followupEtapa||stageFromLead(l),'green')+'</div></div><label class="v41-field-label">Etapa do follow-up<select id="v41DialFollowStage" data-lead="'+esc(l.id)+'">'+FU_STAGES.map(s=>'<option '+(s===(l.followupEtapa||stageFromLead(l))?'selected':'')+'>'+esc(s)+'</option>').join('')+'</select></label><div class="v41-dial-actions">'+(href?'<button class="btn btn-primary" data-v41-dial="'+esc(l.id)+'">Abrir discador</button>':'<button class="btn btn-primary" disabled>Sem telefone</button>')+'<button class="btn" data-v41-open-lead="'+esc(l.id)+'">Abrir lead</button></div><div class="v41-result-grid"><button class="btn" data-v41-call-result="Atendeu">Atendeu</button><button class="btn" data-v41-call-result="Não atendeu">Não atendeu</button><button class="btn" data-v41-call-result="WhatsApp enviado">WhatsApp</button><button class="btn" data-v41-call-result="Reunião marcada">Reunião</button><button class="btn" data-v41-call-result="Sem interesse">Sem interesse</button><button class="btn" data-v41-call-result="Retornar depois">Retornar</button></div><div class="v41-script"><b>Script rápido</b><p>Oi, aqui é do time comercial. Vi que vocês podem estar avaliando melhorias no processo. Faz sentido eu te fazer duas perguntas rápidas para entender se existe oportunidade real?</p></div><small class="v41-muted">Última ligação: '+lastCall(l)+'</small>';}

  function renderForView(id){
    if(id==='automacoes') renderAutomacoes();
    if(id==='agenda') renderAgenda();
    if(id==='ligacoes') renderLigacoes();
  }

  function bindActions(){
    DOC.addEventListener('click',function(e){
      const nav=e.target.closest('[data-view],[data-go]');
      if(nav && !e.target.closest('[data-v41-template],[data-v41-auto-area],[data-v41-agenda-view],[data-v41-call-lead]')){ const v=nav.dataset.view||nav.dataset.go; if(v){ e.preventDefault(); e.stopPropagation(); setViewV41(v); return; } }
      const area=e.target.closest('[data-v41-auto-area]'); if(area){localStorage.setItem(KEYS.autoArea,area.dataset.v41AutoArea);renderAutomacoes();return;}
      const tmpl=e.target.closest('[data-v41-template]'); if(tmpl){const t=automationTemplates()[Number(tmpl.dataset.v41Template)];const arr=getAutomations();arr.push({id:'auto_'+Date.now(),active:true,area:t[0],name:t[1],trigger:t[2],condition:'Configurável',action:t[3],target:t[4],delay:'Imediato'});setAutomations(arr);renderAutomacoes();notify('Modelo adicionado às automações.');return;}
      const tog=e.target.closest('[data-v41-auto-toggle]'); if(tog){const arr=getAutomations();const a=arr.find(x=>String(x.id)===String(tog.dataset.v41AutoToggle));if(a)a.active=!a.active;setAutomations(arr);renderAutomacoes();return;}
      const dup=e.target.closest('[data-v41-auto-dup]'); if(dup){const arr=getAutomations();const a=arr.find(x=>String(x.id)===String(dup.dataset.v41AutoDup));if(a)arr.push(Object.assign({},a,{id:'auto_'+Date.now(),name:a.name+' cópia'}));setAutomations(arr);renderAutomacoes();return;}
      const del=e.target.closest('[data-v41-auto-del]'); if(del){setAutomations(getAutomations().filter(x=>String(x.id)!==String(del.dataset.v41AutoDel)));renderAutomacoes();return;}
      if(e.target.closest('#v41AutoSave')){const arr=getAutomations();arr.push({id:'auto_'+Date.now(),active:true,area:$('#v41AutoAreaInput')?.value||'Leads',name:$('#v41AutoName')?.value||'Nova automação',trigger:$('#v41AutoTrigger')?.value||'Gatilho',condition:$('#v41AutoCondition')?.value||'Sem condição',action:$('#v41AutoAction')?.value||'Criar tarefa',target:$('#v41AutoTarget')?.value||'Leads',delay:$('#v41AutoDelay')?.value||'Imediato'});setAutomations(arr);renderAutomacoes();notify('Automação criada.');return;}
      if(e.target.closest('#v41AutoSim')){const open=ensureLeadIds().filter(isOpenLead).length;const due=ensureLeadIds().filter(l=>isOpenLead(l)&&l.followup&&daysDiff(l.followup)<=0).length;notify('Simulação: '+open+' leads abertos e '+due+' follow-ups afetados.','success');return;}
      const av=e.target.closest('[data-v41-agenda-view]'); if(av){localStorage.setItem(KEYS.agendaView,av.dataset.v41AgendaView);renderAgenda();return;}
      if(e.target.closest('#v41EventSave')){const events=getEvents();events.push({id:'ev_'+Date.now(),title:$('#v41EventTitle')?.value||'Novo evento',agenda:$('#v41EventAgenda')?.value||'comercial',date:$('#v41EventDate')?.value||today(),time:$('#v41EventTime')?.value||'09:00',type:$('#v41EventType')?.value||'Reunião',recurrence:$('#v41EventRec')?.value||'Não repete',shared:!!$('#v41EventShared')?.checked,notes:''});setEvents(events);renderAgenda();notify('Evento criado na agenda.');return;}
      if(e.target.closest('#v41AgendaSync')){renderAgenda();notify('Follow-ups sincronizados com a agenda.');return;}
      const model=e.target.closest('[data-v41-agenda-model]'); if(model){const names=['Rotina diária comercial','Reunião recorrente semanal','Bloco de prospecção','Follow-up pós-proposta','Planejamento pessoal','Agenda compartilhada do time'];const events=getEvents();events.push({id:'ev_'+Date.now(),title:names[Number(model.dataset.v41AgendaModel)]||'Modelo de agenda',agenda:Number(model.dataset.v41AgendaModel)===4?'pessoal':'comercial',date:addDays(1),time:'09:00',type:'Planejamento',recurrence:Number(model.dataset.v41AgendaModel)===1?'Semanal':'Não repete',shared:Number(model.dataset.v41AgendaModel)===5,notes:'Criado por modelo'});setEvents(events);renderAgenda();notify('Modelo aplicado.');return;}
      const c=e.target.closest('[data-v41-call-lead]'); if(c){activeCallId=c.dataset.v41CallLead;renderLigacoes();return;}
      const d=e.target.closest('[data-v41-dial]'); if(d){const l=findLead(d.dataset.v41Dial);if(!l)return;const url=dialURL(l.telefone);if(!url){notify('Este lead está sem telefone.','warn');return;}if(callConfig().countOnOpen){addActivity(l,'Ligação','Discador aberto');saveLead(l);}try{ if(url.startsWith('http')) window.open(url,'_blank','noopener'); else window.location.href=url; }catch(_){ window.location.href=url; } notify('Discador aberto para '+(l.nome||'lead')+'.','success');setTimeout(renderLigacoes,120);return;}
      const res=e.target.closest('[data-v41-call-result]'); if(res){const l=findLead(activeCallId);if(!l)return;addActivity(l,'Ligação',res.dataset.v41CallResult);if(callConfig().autoFollow!==false && res.dataset.v41CallResult==='Não atendeu'){l.followup=addDays(1);l.followupEtapa=l.followupEtapa||'Segundo contato';}saveLead(l);renderLigacoes();notify('Resultado registrado no histórico.');return;}
      const open=e.target.closest('[data-v41-open-lead]'); if(open){openLeadDetail(open.dataset.v41OpenLead);return;}
      if(e.target.closest('#v41CallRefresh')){renderLigacoes();notify('Fila atualizada.');return;}
    },true);
    DOC.addEventListener('change',function(e){
      if(e.target.matches('[data-v41-agenda-toggle]')){const arr=getAgendas();const a=arr.find(x=>x.id===e.target.dataset.v41AgendaToggle);if(a)a.active=e.target.checked;setAgendas(arr);renderAgenda();return;}
      if(e.target.matches('#v41CallProtocol')){saveCallConfig({protocol:e.target.value});renderLigacoes();return;}
      if(e.target.matches('#v41CallCountOpen')){saveCallConfig({countOnOpen:e.target.checked});return;}
      if(e.target.matches('#v41DialFollowStage')){const l=findLead(e.target.dataset.lead);if(l){l.followupEtapa=e.target.value;saveLead(l);renderLigacoes();notify('Etapa do follow-up atualizada.');}return;}
      if(e.target.matches('#v41CallFilter')){renderLigacoes();return;}
    },true);
    DOC.addEventListener('input',function(e){ if(e.target.matches('#v41CallSearch')) renderLigacoes(); },true);
  }

  function installCSS(){ if($('#crmV41CleanStyle')) return; const st=DOC.createElement('style'); st.id='crmV41CleanStyle'; st.textContent=`
    .view:not(.active){display:none!important}.view.active.grid-view{display:grid!important;gap:20px}.view.active:not(.grid-view){display:block!important}.v41-head{margin-bottom:0}.v41-actions{display:flex;gap:8px;flex-wrap:wrap}.v41-shell{display:grid;gap:18px}.v41-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.v41-kpi{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:17px 18px;box-shadow:var(--shadow-xs)}.v41-kpi strong{display:block;font-family:'Inter Tight','Inter',sans-serif;font-size:25px;line-height:1;font-weight:800;color:var(--text);letter-spacing:-.03em}.v41-kpi span{display:block;font-size:12px;color:var(--text-3);margin-top:6px;font-weight:600}.v41-kpi small{display:block;font-size:11px;color:var(--text-3);margin-top:5px}.v41-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-xs);overflow:hidden}.v41-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid var(--border)}.v41-card-head.compact{border-top:1px solid var(--border);margin-top:8px}.v41-card-head b{display:block;font-size:14px;color:var(--text);letter-spacing:-.01em}.v41-card-head small{display:block;color:var(--text-3);font-size:12px;margin-top:2px}.v41-grid-2{display:grid;grid-template-columns:1.25fr .75fr;gap:18px}.v41-grid-agenda{display:grid;grid-template-columns:330px 1fr;gap:18px}.v41-form-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:18px}.v41-form-grid label,.v41-form-mini label,.v41-field-label,.v41-call-config label{display:grid;gap:5px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3)}.v41-form-grid input,.v41-form-grid select,.v41-form-mini input,.v41-form-mini select,.v41-field-label select,.v41-toolbar input,.v41-toolbar select,.v41-call-config select{height:38px;border:1px solid var(--border);background:var(--surface-2);border-radius:10px;padding:0 11px;color:var(--text);font-size:13px;text-transform:none;letter-spacing:0;font-weight:500;outline:none}.v41-form-actions{display:flex;align-items:end;gap:8px}.v41-chips{display:flex;gap:7px;flex-wrap:wrap;padding:15px 18px;border-bottom:1px solid var(--border)}.v41-chip,.v41-tab{border:1px solid var(--border);background:var(--surface);border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;color:var(--text-3);cursor:pointer}.v41-chip.active,.v41-tab.active{background:var(--navy);border-color:var(--navy);color:#fff}.v41-auto-list,.v41-template-list,.v41-layer-list{display:grid;gap:9px;padding:15px 18px}.v41-auto-card{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--border);background:var(--surface-2);border-radius:13px;padding:13px 14px}.v41-auto-card.off{opacity:.58}.v41-auto-card b{font-size:13.5px;color:var(--text)}.v41-auto-card p{font-size:12px;color:var(--text-3);margin:3px 0 7px}.v41-auto-actions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.v41-template,.v41-model{display:block;width:100%;text-align:left;border:1px solid var(--border);background:var(--surface-2);border-radius:13px;padding:13px 14px;cursor:pointer;transition:var(--transition)}.v41-template:hover,.v41-model:hover{background:var(--surface);box-shadow:var(--shadow-sm);transform:translateY(-1px)}.v41-template b,.v41-model b{display:block;font-size:13px;color:var(--text)}.v41-template span,.v41-model span{display:block;font-size:12px;color:var(--text-3);margin-top:3px}.v41-pill{display:inline-flex;align-items:center;margin:2px 4px 2px 0;border-radius:999px;padding:4px 9px;font-size:11px;font-weight:800;background:var(--surface-3);color:var(--text-3)}.v41-pill.blue{background:#eff6ff;color:#1d4ed8}.v41-pill.green{background:#f0fdf4;color:#166534}.v41-pill.red{background:#fef2f2;color:#b91c1c}.v41-pill.gray{background:var(--surface-3);color:var(--text-3)}.v41-empty{padding:24px;text-align:center;color:var(--text-3);font-size:13px}.v41-form-mini{display:grid;gap:10px;padding:15px 18px}.v41-check{display:flex!important;grid-template-columns:auto 1fr!important;align-items:center;gap:8px!important;text-transform:none!important;letter-spacing:0!important;font-size:12px!important;font-weight:700!important;color:var(--text-2)!important}.v41-layer{display:grid;grid-template-columns:auto auto 1fr auto;align-items:center;gap:9px;padding:10px 11px;border:1px solid var(--border);border-radius:12px;background:var(--surface-2);font-size:12px}.v41-layer b{font-size:13px}.v41-layer small{font-size:11px;color:var(--text-3)}.v41-dot{width:11px;height:11px;border-radius:50%;background:#2563eb}.v41-dot.amber{background:#f59e0b}.v41-dot.green{background:#16a34a}.v41-dot.purple{background:#7c3aed}.v41-tabs{display:flex;gap:5px;flex-wrap:wrap}.v41-calendar-mini{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;padding:16px}.v41-day{min-height:138px;border:1px solid var(--border);background:var(--surface-2);border-radius:13px;padding:10px}.v41-day-title{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:8px}.v41-event{display:block;width:100%;border:none;text-align:left;margin-bottom:6px;border-radius:8px;padding:7px 8px;background:#eff6ff;color:#1e40af;cursor:pointer;font-size:11.5px}.v41-event small{display:block;opacity:.75;margin-top:2px}.v41-kanban{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:16px}.v41-col{background:var(--surface-2);border:1px solid var(--border);border-radius:14px;min-height:240px}.v41-col-head{display:flex;justify-content:space-between;align-items:center;padding:12px 13px;border-bottom:1px solid var(--border)}.v41-col-head b{font-size:12.5px}.v41-col-head span{font-size:11px;color:var(--text-3);font-weight:800}.v41-kan-card{background:var(--surface);border:1px solid var(--border);border-radius:11px;padding:11px 12px;margin:9px}.v41-kan-card b{display:block;font-size:13px}.v41-kan-card small{display:block;font-size:11.5px;color:var(--text-3);margin:3px 0 6px}.v41-table-wrap{padding:14px}.v41-db-head{padding:14px 16px;color:var(--text-3);font-size:13px;border-bottom:1px solid var(--border)}.v41-model-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:16px}.v41-call-hero{display:flex;justify-content:space-between;gap:18px;align-items:center;background:linear-gradient(135deg,var(--surface),var(--surface-2));border:1px solid var(--border);border-radius:16px;padding:18px}.v41-call-hero b{font-size:16px;color:var(--text)}.v41-call-hero p{font-size:13px;color:var(--text-3);margin-top:4px;max-width:75ch}.v41-call-config{display:flex;gap:12px;align-items:end;flex-wrap:wrap}.v41-call-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:18px}.v41-toolbar{display:flex;gap:8px;flex-wrap:wrap;padding:14px 18px;border-bottom:1px solid var(--border)}.v41-toolbar input{min-width:280px;flex:1}.v41-call-list{display:grid;gap:8px;padding:12px}.v41-call-card{display:grid;grid-template-columns:42px 1fr 86px;gap:12px;align-items:center;border:1px solid var(--border);background:var(--surface-2);border-radius:14px;padding:12px;cursor:pointer;transition:var(--transition)}.v41-call-card:hover,.v41-call-card.active{background:var(--surface);border-color:var(--blue);box-shadow:var(--shadow-sm)}.v41-avatar{width:42px;height:42px;border-radius:12px;background:var(--blue-light);color:var(--blue);font-weight:900;display:flex;align-items:center;justify-content:center}.v41-call-body b{font-size:13.5px;color:var(--text)}.v41-call-body p{font-size:12px;color:var(--text-3);margin:2px 0 5px}.v41-call-score{text-align:right}.v41-call-score b{font-size:17px;color:var(--text)}.v41-score{height:6px;background:var(--surface-3);border-radius:99px;overflow:hidden;margin-top:5px}.v41-score span{display:block;height:100%;background:var(--blue);border-radius:99px}.v41-dial-lead{padding:18px;border-bottom:1px solid var(--border)}.v41-dial-lead b{display:block;font-size:18px;color:var(--text)}.v41-dial-lead p{color:var(--text-3);font-size:13px;margin:4px 0 8px}.v41-field-label{padding:14px 18px}.v41-dial-actions,.v41-result-grid{display:flex;gap:8px;flex-wrap:wrap;padding:0 18px 14px}.v41-result-grid{display:grid;grid-template-columns:1fr 1fr}.v41-script{margin:0 18px 14px;padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--surface-2)}.v41-script b{display:block;font-size:12px;text-transform:uppercase;color:var(--text-3);letter-spacing:.06em;margin-bottom:6px}.v41-script p{font-size:13px;color:var(--text-2);line-height:1.55}.v41-muted{display:block;padding:0 18px 18px;color:var(--text-3)}@media(max-width:1100px){.v41-grid-2,.v41-grid-agenda,.v41-call-grid{grid-template-columns:1fr}.v41-kpis{grid-template-columns:repeat(2,1fr)}.v41-calendar-mini{grid-template-columns:repeat(2,1fr)}.v41-kanban{grid-template-columns:1fr 1fr}.v41-form-grid{grid-template-columns:1fr 1fr}}@media(max-width:680px){.v41-kpis,.v41-calendar-mini,.v41-kanban,.v41-form-grid,.v41-model-grid{grid-template-columns:1fr}.v41-call-card{grid-template-columns:42px 1fr}.v41-call-score{display:none}}
  `; DOC.head.appendChild(st); }

  function boot(){
    installCSS(); ensureLeadIds(); ensureNavButton('ligacoes','Ligações'); ensureNavButton('automacoes','Automações'); ensureNavButton('agenda','Agenda'); cleanupDuplicateViews(); bindActions(); cleanVisibility();
    const current=$('.view.active')?.id || 'inicio'; setViewV41(current);
    let scheduled=false;
    new MutationObserver(()=>{ if(scheduled) return; scheduled=true; setTimeout(()=>{scheduled=false; cleanupDuplicateViews(); cleanVisibility(); const c=$('.view.active')?.id; if(['ligacoes','automacoes','agenda'].includes(c)) renderForView(c);},80); }).observe(DOC.body,{childList:true,subtree:true});
  }
  if(DOC.readyState==='loading') DOC.addEventListener('DOMContentLoaded',boot); else boot();
})();
