/* Script original 00 */
// ══ DATA ══
const DEFAULT_LEADS=[
  {nome:'Fazenda Aurora',segmento:'Agronegócio',responsavel:'Carlos Melo',telefone:'(53) 99871-2234',email:'carlos@fazendaaurora.com.br',etapa:'Proposta',prioridade:'Alta',valor:18000,dataEntrada:'2026-06-10',origem:'Outbound',followup:'2026-07-02',obs:'Avaliar pacote anual. Interessado em consultoria de longo prazo.',ultimaAtualizacao:'2026-06-22',motivoPerda:''},
  {nome:'Loja Horizonte',segmento:'Varejo',responsavel:'Ana Lima',telefone:'(51) 98765-4321',email:'ana@lojahorizonte.com',etapa:'Contato',prioridade:'Média',valor:6500,dataEntrada:'2026-06-15',origem:'Inbound',followup:'2026-06-30',obs:'Enviar apresentação comercial até sexta.',ultimaAtualizacao:'2026-06-15',motivoPerda:''},
  {nome:'AgroSul',segmento:'Consultoria Rural',responsavel:'Pedro Souza',telefone:'(54) 99234-5678',email:'pedro@agrosul.com.br',etapa:'Fechado',prioridade:'Baixa',valor:12000,dataEntrada:'2026-05-28',origem:'Indicação',followup:'',obs:'Implantação em julho. Contrato assinado.',ultimaAtualizacao:'2026-06-18',motivoPerda:''},
  {nome:'Franquia Delta',segmento:'Franquias',responsavel:'Mariana Costa',telefone:'(51) 91234-8765',email:'mariana@franquiadelta.com',etapa:'Lead',prioridade:'Alta',valor:4300,dataEntrada:'2026-06-20',origem:'Outbound',followup:'2026-06-29',obs:'Primeiro contato no WhatsApp. Aguardando retorno.',ultimaAtualizacao:'2026-06-20',motivoPerda:''}
];
const SK='outbounder_leads_v5',EK='outbounder_agenda_v1',NK='outbounder_notes',AK='outbounder_automations_v1';
function loadLeads(){try{const s=localStorage.getItem(SK);return s?JSON.parse(s):JSON.parse(JSON.stringify(DEFAULT_LEADS));}catch(e){return JSON.parse(JSON.stringify(DEFAULT_LEADS));}}
function saveLeads(){try{localStorage.setItem(SK,JSON.stringify(leads));}catch(e){}}
const leads=loadLeads();
// API leve para módulos posteriores sem duplicar estado.
window.crmGetLeads=()=>leads;
window.crmSaveLeads=()=>{try{saveLeads();}catch(e){} try{renderAll();}catch(e){}};
window.crmOpenLead=(ref)=>{try{return openDetail(ref);}catch(e){}};
window.crmOpenLeadModal=(lead,stage)=>{try{return openModal(lead,stage);}catch(e){}};
window.crmToast=(msg,type)=>{try{return showToast(msg,type);}catch(e){console.log(msg);}};
const stages=['Lead','Contato','Proposta','Fechado','Perdido'];

// ══ HELPERS ══
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const fmtDate=d=>{if(!d) return '—';try{return new Date(d+'T12:00:00').toLocaleDateString('pt-BR');}catch(e){return d;}};
const daysSince=d=>{if(!d) return 0;return Math.floor((Date.now()-new Date(d+'T12:00:00'))/(864e5));};
const isOverdue=d=>{if(!d) return false;const dt=new Date(d+'T12:00:00');dt.setHours(0,0,0,0);const t=new Date();t.setHours(0,0,0,0);return dt<t;};
const todayStr=()=>new Date().toISOString().slice(0,10);
const stageTag=e=>{const m={Lead:'tag-lead',Contato:'tag-contato',Proposta:'tag-proposta',Fechado:'tag-fechado',Perdido:'tag-perdido'};return `<span class="tag ${m[e]||'tag-neutro'}">${e}</span>`;};
const priorityTag=p=>{const m={Alta:'tag-alta',Média:'tag-media',Baixa:'tag-baixa'};return `<span class="tag ${m[p]||'tag-neutro'}">${p||'Média'}</span>`;};
const originTag=o=>{if(!o) return '';const m={Inbound:'tag-inbound',Outbound:'tag-outbound','Indicação':'tag-indicacao'};return `<span class="tag ${m[o]||'tag-neutro'}">${o}</span>`;};
const scoreCls=s=>s>=80?'score-hi':s>=40?'score-md':'score-lo';

// ══ ICONS ══
const ICON_WHATSAPP='<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M17.6 6.32A8.86 8.86 0 0 0 12.05 4C7.27 4 3.4 7.85 3.4 12.6c0 1.55.41 3.02 1.16 4.29L3 21l4.27-1.51a8.93 8.93 0 0 0 4.78 1.36c4.78 0 8.65-3.85 8.65-8.6a8.5 8.5 0 0 0-3.1-6.13zm-5.55 13.2a7.4 7.4 0 0 1-3.78-1.04l-.27-.16-2.81 1 .94-2.74-.18-.28a7.16 7.16 0 0 1-1.12-3.8c0-3.95 3.24-7.16 7.23-7.16 1.93 0 3.74.75 5.11 2.11a7.1 7.1 0 0 1 2.12 5.06c0 3.96-3.24 7.17-7.24 7.01zm3.96-5.37c-.22-.11-1.28-.63-1.48-.7-.2-.07-.34-.11-.49.11-.14.22-.56.7-.69.84-.13.14-.25.16-.47.05-.22-.11-.92-.34-1.74-1.08-.64-.57-1.08-1.27-1.2-1.49-.13-.22-.01-.34.11-.45.11-.11.25-.27.37-.41.12-.14.16-.24.24-.4.08-.16.04-.3-.04-.41-.07-.11-.43-1.04-.59-1.43-.16-.39-.32-.34-.44-.34-.11-.01-.25-.01-.38-.01-.13 0-.34.05-.52.25-.18.2-.69.68-.69 1.65 0 .97.7 1.91.8 2.04.1.13 1.36 2.08 3.31 2.83 1.64.62 1.97.5 2.32.47.35-.04 1.12-.46 1.28-.9.16-.45.16-.83.11-.91-.05-.08-.2-.13-.42-.24z"/></svg>';
const ICON_CALL='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
const ICON_MAIL='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
const ICON_EDIT='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
const ICON_CALENDAR='<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-1.5px"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
const ICON_ALERT='<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" style="vertical-align:-1.5px"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>';
const ICON_CLOCK='<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" style="vertical-align:-1.5px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
const ICON_CHECK='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.6" style="vertical-align:-1.5px"><path d="M20 6 9 17l-5-5"/></svg>';
const ICON_NOTE='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>';
const ICON_MEETING='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
const ICON_MOVE='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const ICON_BOLT='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>';
const ICON_PLUS='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>';
const ICON_TRASH='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
const ICON_TOGGLE_ON='<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><rect x="1" y="6" width="22" height="12" rx="6"/><circle cx="16" cy="12" r="4.5" fill="#fff"/></svg>';
const ICON_TOGGLE_OFF='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="1" y="6" width="22" height="12" rx="6"/><circle cx="8" cy="12" r="4.5" fill="currentColor" stroke="none"/></svg>';
const ACT_ICONS={'Ligação':ICON_CALL,'E-mail':ICON_MAIL,'WhatsApp':ICON_WHATSAPP,'Reunião':ICON_MEETING,'Nota':ICON_NOTE,'Etapa':ICON_MOVE,'Automação':ICON_BOLT};
function timeAgo(iso){
  if(!iso) return '';
  const diff=Math.max(0,Date.now()-new Date(iso).getTime());
  const min=Math.floor(diff/60000),hr=Math.floor(min/60),day=Math.floor(hr/24);
  if(min<1) return 'agora';
  if(min<60) return `há ${min}min`;
  if(hr<24) return `há ${hr}h`;
  if(day===1) return 'ontem';
  if(day<7) return `há ${day}d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}
function addAtividade(nomeLead,tipo,texto,autor){
  const l=leads.find(x=>x.nome===nomeLead);if(!l) return;
  if(!Array.isArray(l.atividades)) l.atividades=[];
  l.atividades.unshift({id:'at'+Date.now()+Math.random().toString(36).slice(2,6),tipo,texto,autor:autor||'Você',data:new Date().toISOString()});
}
document.getElementById('tlQuickBtns').innerHTML=[
  ['Nota',ICON_NOTE,true],['Ligação',ICON_CALL,false],['E-mail',ICON_MAIL,false],['WhatsApp',ICON_WHATSAPP,false],['Reunião',ICON_MEETING,false]
].map(([tipo,icon,active])=>`<button class="tl-qbtn${active?' active':''}" data-tl-tipo="${tipo}">${icon} ${tipo}</button>`).join('');
document.getElementById('tlSendBtn').innerHTML=ICON_PLUS;
function applyStageChange(lead,novaEtapa,extra){
  const antiga=lead.etapa;
  lead.etapa=novaEtapa;lead.ultimaAtualizacao=todayStr();
  if(extra) Object.assign(lead,extra);
  if(antiga!==novaEtapa){
    addAtividade(lead.nome,'Etapa',`${antiga||'—'} → ${novaEtapa}`);
    if(typeof runAutomations==='function') runAutomations(lead,novaEtapa);
  }
}

function calcScore(l){
  const sp={Lead:10,Contato:25,Proposta:50,Fechado:100,Perdido:0};
  const pp={Alta:30,Média:15,Baixa:5};
  return (sp[l.etapa]||0)+(pp[l.prioridade]||0)+Math.min(40,Math.round((l.valor||0)/1000))+Math.max(0,20-daysSince(l.ultimaAtualizacao||l.dataEntrada)*2);
}
function showToast(msg,type=''){
  const t=document.getElementById('toast');
  t.innerHTML=(type==='success'?ICON_CHECK:type==='danger'?ICON_ALERT:'')+`<span>${msg}</span>`;t.className='toast show';
  if(type) t.classList.add(type);
  clearTimeout(t._t);t._t=setTimeout(()=>{t.classList.remove('show');},2600);
}

// ══ NAV ══
const viewMeta={inicio:{title:'Painel',sub:'Visão geral das suas oportunidades'},leads:{title:'Gestão de leads',sub:'Base comercial principal'},pipeline:{title:'Pipeline',sub:'Funil de oportunidades'},clientes:{title:'Clientes',sub:'Relacionamentos cadastrados'},cadencias:{title:'Follow-ups',sub:'Rotina de próximos contatos'},automacoes:{title:'Automações',sub:'Regras de funil'},agenda:{title:'Agenda',sub:'Planejamento e follow-ups'},metricas:{title:'Métricas',sub:'Indicadores de desempenho'},importar:{title:'Importar / Exportar',sub:'Gerencie seus dados'},'novo-lead':{title:'Novo lead',sub:'Cadastro rápido'},chat:{title:'Chat',sub:'Conversas com leads e clientes via WhatsApp'}};
function setView(v){
  // Esconde todas as views normais (grid-view)
  document.querySelectorAll('.view').forEach(el=>{
    el.classList.remove('active');
    if(el.id!=='chat') el.style.display='';
  });
  // Trata o chat separadamente (não usa grid-view)
  const chatEl=document.getElementById('chat');
  if(v==='chat'){
    if(chatEl){chatEl.style.display='block';chatEl.classList.add('active');}
  } else {
    if(chatEl){chatEl.style.display='none';chatEl.classList.remove('active');}
    const el=document.getElementById(v);if(el) el.classList.add('active');
  }
  document.querySelectorAll('[data-view],[data-go]').forEach(b=>b.classList.toggle('active',(b.dataset.view||b.dataset.go)===v));
  const m=viewMeta[v]||{};
  const tt=document.getElementById('topbarTitle'),ts=document.getElementById('topbarSub');
  if(tt) tt.textContent=m.title||v;if(ts) ts.textContent=m.sub||'';
  if(v==='agenda') setTimeout(()=>window.CRMV64Agenda?.render?.(),60);
  if(v==='metricas') setTimeout(renderMetrics,60);
  if(v==='chat'){renderConversationList();updateChatBadge();}
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.go)));
document.getElementById('themeToggle').addEventListener('click',()=>{const r=document.documentElement;r.setAttribute('data-theme',r.getAttribute('data-theme')==='dark'?'light':'dark');});
document.getElementById('openNewLeadBtn').addEventListener('click',()=>openModal(null));
document.getElementById('openNewLeadBtn2').addEventListener('click',()=>openModal(null));

// ══ QUICK NOTE ══
document.getElementById('quickNote').value=localStorage.getItem(NK)||'';
document.getElementById('saveNoteBtn').addEventListener('click',()=>{localStorage.setItem(NK,document.getElementById('quickNote').value);showToast('Nota salva','success');});

// ══ LEAD MODAL ══
let editingNome=null;
const backdrop=document.getElementById('modalBackdrop');
const mNome=document.getElementById('mNome'),mSeg=document.getElementById('mSegmento'),mResp=document.getElementById('mResponsavel');
const mTel=document.getElementById('mTelefone'),mEmail=document.getElementById('mEmail'),mEtapa=document.getElementById('mEtapa');
const mPri=document.getElementById('mPrioridade'),mVal=document.getElementById('mValor'),mData=document.getElementById('mData');
const mOrig=document.getElementById('mOrigem'),mFu=document.getElementById('mFollowup'),mObs=document.getElementById('mObs');
const mCidade=document.getElementById('mCidade'),mProduto=document.getElementById('mProduto'),mDecisor=document.getElementById('mDecisor');
const mCanal=document.getElementById('mCanal'),mProbabilidade=document.getElementById('mProbabilidade'),mTags=document.getElementById('mTags'),mProximaAcao=document.getElementById('mProximaAcao'),mDor=document.getElementById('mDor');
const mDel=document.getElementById('modalDelete');
function openModal(lead,defStage){
  editingNome=lead?lead.nome:null;
  document.getElementById('modalTitle').textContent=lead?'Editar lead':'Novo lead';
  mNome.value=lead?.nome||'';mSeg.value=lead?.segmento||'';mResp.value=lead?.responsavel||'';
  mTel.value=lead?.telefone||'';mEmail.value=lead?.email||'';mEtapa.value=lead?.etapa||defStage||stages[0];
  mPri.value=lead?.prioridade||'Média';mVal.value=lead?.valor!==undefined?lead.valor:'';
  mData.value=lead?.dataEntrada||todayStr();mOrig.value=lead?.origem||'';mFu.value=lead?.followup||'';mObs.value=lead?.obs||'';
  if(mCidade)mCidade.value=lead?.cidade||'';if(mProduto)mProduto.value=lead?.produtoInteresse||'';if(mDecisor)mDecisor.value=lead?.decisor||'';
  if(mCanal)mCanal.value=lead?.canalPreferido||'';if(mProbabilidade)mProbabilidade.value=lead?.probabilidade!==undefined?lead.probabilidade:'';if(mTags)mTags.value=lead?.tags||'';
  if(mProximaAcao)mProximaAcao.value=lead?.proximaAcao||'';if(mDor)mDor.value=lead?.dorPrincipal||'';
  mDel.style.display=lead?'inline-flex':'none';backdrop.classList.remove('hidden');setTimeout(()=>mNome.focus(),80);
}
function closeModal(){backdrop.classList.add('hidden');}
function getModalData(){return{nome:mNome.value.trim(),segmento:mSeg.value.trim(),responsavel:mResp.value.trim(),telefone:mTel.value.trim(),email:mEmail.value.trim(),etapa:mEtapa.value,prioridade:mPri.value,valor:Number(mVal.value)||0,dataEntrada:mData.value,origem:mOrig.value,followup:mFu.value,obs:mObs.value.trim(),cidade:mCidade?.value?.trim()||'',produtoInteresse:mProduto?.value?.trim()||'',decisor:mDecisor?.value?.trim()||'',canalPreferido:mCanal?.value||'',probabilidade:Number(mProbabilidade?.value)||0,tags:mTags?.value?.trim()||'',proximaAcao:mProximaAcao?.value?.trim()||'',dorPrincipal:mDor?.value?.trim()||''};}
document.getElementById('modalCancel').addEventListener('click',closeModal);
document.getElementById('modalCancelBtn').addEventListener('click',closeModal);
backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeModal();});
document.getElementById('modalSave').addEventListener('click',()=>{
  const d=getModalData();if(!d.nome){mNome.focus();return;}
  if(editingNome){
    const l=leads.find(x=>x.nome===editingNome);
    if(l){
      const novaEtapa=d.etapa,resto={...d};delete resto.etapa;
      Object.assign(l,resto);
      if(l.etapa!==novaEtapa) applyStageChange(l,novaEtapa); else l.ultimaAtualizacao=todayStr();
    }
    saveLeads();closeModal();renderAll();showToast('Lead atualizado','success');
  }
  else{leads.unshift({...d,criadoEm:todayStr(),ultimaAtualizacao:todayStr(),motivoPerda:'',atividades:[]});saveLeads();closeModal();renderAll();showToast('Lead criado','success');}
});
mDel.addEventListener('click',()=>{if(!editingNome)return;leads.splice(leads.findIndex(l=>l.nome===editingNome),1);saveLeads();closeModal();renderAll();showToast('Lead excluído');});

// ══ LOSS MODAL ══
let lossTarget=null,selReason='';
const lossBack=document.getElementById('lossBackdrop');
function openLoss(nome){lossTarget=nome;selReason='';document.querySelectorAll('.loss-btn').forEach(b=>b.classList.remove('selected'));document.getElementById('lossOther').value='';lossBack.classList.remove('hidden');}
function closeLoss(){lossBack.classList.add('hidden');lossTarget=null;}
document.getElementById('lossCancel').addEventListener('click',closeLoss);
document.getElementById('lossCancelBtn').addEventListener('click',closeLoss);
lossBack.addEventListener('click',e=>{if(e.target===lossBack)closeLoss();});
document.getElementById('lossReasonBtns').addEventListener('click',e=>{const b=e.target.closest('.loss-btn');if(!b)return;document.querySelectorAll('.loss-btn').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');selReason=b.dataset.reason;});
document.getElementById('lossConfirm').addEventListener('click',()=>{
  if(!lossTarget)return;
  const r=selReason||document.getElementById('lossOther').value.trim()||'Não informado';
  const l=leads.find(x=>x.nome===lossTarget);if(l){applyStageChange(l,'Perdido',{motivoPerda:r});addAtividade(l.nome,'Nota',`Motivo da perda: ${r}`);}
  saveLeads();closeLoss();renderAll();showToast(`Perdido: ${r}`,'danger');
});

// ══ LEAD FORM ══
document.getElementById('leadForm').addEventListener('submit',e=>{
  e.preventDefault();const d=new FormData(e.target);
  leads.unshift({nome:d.get('nome'),segmento:d.get('segmento'),responsavel:d.get('responsavel')||'',telefone:d.get('telefone')||'',email:d.get('email')||'',etapa:d.get('etapa'),prioridade:d.get('prioridade'),valor:Number(d.get('valor'))||0,dataEntrada:todayStr(),criadoEm:todayStr(),origem:d.get('origem')||'',followup:d.get('followup')||'',cidade:d.get('cidade')||'',produtoInteresse:d.get('produtoInteresse')||'',decisor:d.get('decisor')||'',canalPreferido:d.get('canalPreferido')||'',probabilidade:Number(d.get('probabilidade'))||0,tags:d.get('tags')||'',proximaAcao:d.get('proximaAcao')||'',dorPrincipal:d.get('dorPrincipal')||'',obs:d.get('obs')||'',ultimaAtualizacao:todayStr(),motivoPerda:'',atividades:[]});
  saveLeads();e.target.reset();renderAll();setView('leads');showToast('Lead criado','success');
});

// ══ DETAIL PANEL ══
const detBack=document.getElementById('detailBackdrop');
let detTlTipo='Nota',detNome=null;
function renderTimeline(nome){
  const l=leads.find(x=>x.nome===nome);if(!l) return;
  const list=Array.isArray(l.atividades)?l.atividades:[];
  const tl=document.getElementById('tlList');
  if(!list.length){tl.innerHTML='<div class="tl-empty">Nenhuma atividade registrada ainda</div>';return;}
  tl.innerHTML=list.map(a=>{
    const isAuto=a.tipo==='Automação',isEtapa=a.tipo==='Etapa';
    const icon=ACT_ICONS[a.tipo]||ICON_NOTE;
    return `<div class="tl-item">
      <div class="tl-icon${isAuto?' tl-auto':''}${isEtapa?' tl-etapa':''}">${icon}</div>
      <div class="tl-body">
        <div class="tl-row1"><span class="tl-type">${a.tipo}</span><span class="tl-time">${timeAgo(a.data)}</span></div>
        ${a.texto?`<div class="tl-text">${a.texto}</div>`:''}
        <div class="tl-author">${a.autor||'Você'}</div>
      </div>
    </div>`;
  }).join('');
}
document.getElementById('tlQuickBtns').addEventListener('click',e=>{
  const b=e.target.closest('[data-tl-tipo]');if(!b) return;
  detTlTipo=b.dataset.tlTipo;
  document.querySelectorAll('#tlQuickBtns .tl-qbtn').forEach(x=>x.classList.toggle('active',x===b));
});
function submitTlActivity(){
  if(!detNome) return;
  const ta=document.getElementById('tlInput');
  const texto=ta.value.trim();
  if(!texto) return;
  addAtividade(detNome,detTlTipo,texto);
  saveLeads();ta.value='';renderTimeline(detNome);
}
document.getElementById('tlSendBtn').addEventListener('click',submitTlActivity);
document.getElementById('tlInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();submitTlActivity();}});
function openDetail(nome){
  const l=leads.find(x=>x.nome===nome);if(!l)return;
  detNome=nome;detTlTipo='Nota';
  document.querySelectorAll('#tlQuickBtns .tl-qbtn').forEach(x=>x.classList.toggle('active',x.dataset.tlTipo==='Nota'));
  document.getElementById('tlInput').value='';
  document.getElementById('dNome').textContent=l.nome;
  document.getElementById('dEtapaTag').innerHTML=stageTag(l.etapa);
  document.getElementById('dPriorityBadge').innerHTML=priorityTag(l.prioridade||'Média');
  document.getElementById('dDataEntrada').textContent=l.dataEntrada?'Entrada: '+fmtDate(l.dataEntrada):'';
  document.getElementById('dSegmento').textContent=l.segmento||'—';
  document.getElementById('dResponsavel').textContent=l.responsavel||'—';
  document.getElementById('dTelefone').textContent=l.telefone||'—';
  document.getElementById('dEmail').textContent=l.email||'—';
  document.getElementById('dValor').textContent=money(l.valor);
  document.getElementById('dEtapa').textContent=l.etapa;
  document.getElementById('dObs').textContent=l.obs||'—';
  const ex=document.getElementById('dExtra');
  if(ex) ex.innerHTML=`${l.origem?`<div class="dp-field"><label>Origem</label><p>${originTag(l.origem)}</p></div>`:''}${l.cidade?`<div class="dp-field"><label>Cidade</label><p>${l.cidade}</p></div>`:''}${l.produtoInteresse?`<div class="dp-field"><label>Produto/serviço</label><p>${l.produtoInteresse}</p></div>`:''}${l.decisor?`<div class="dp-field"><label>Decisor</label><p>${l.decisor}</p></div>`:''}${l.canalPreferido?`<div class="dp-field"><label>Canal preferido</label><p>${l.canalPreferido}</p></div>`:''}${l.probabilidade?`<div class="dp-field"><label>Probabilidade</label><p>${l.probabilidade}%</p></div>`:''}${l.followup?`<div class="dp-field"><label>Follow-up</label><p style="${isOverdue(l.followup)?'color:#dc2626;font-weight:600':''}">${ICON_CALENDAR} ${fmtDate(l.followup)}${isOverdue(l.followup)?' '+ICON_ALERT:''}</p></div>`:''}${l.proximaAcao?`<div class="dp-field full"><label>Próxima ação</label><p>${l.proximaAcao}</p></div>`:''}${l.dorPrincipal?`<div class="dp-field full"><label>Dor principal</label><p>${l.dorPrincipal}</p></div>`:''}${l.tags?`<div class="dp-field full"><label>Tags</label><p>${l.tags}</p></div>`:''}${l.motivoPerda?`<div class="dp-field full"><label>Motivo da perda</label><p style="color:#dc2626">${l.motivoPerda}</p></div>`:''}${l.ultimaAtualizacao?`<div class="dp-field"><label>Última atualização</label><p>${fmtDate(l.ultimaAtualizacao)}</p></div>`:''}`;
  renderTimeline(nome);
  document.getElementById('dEditBtn').onclick=()=>{closeDetail();openModal(l);};
  document.getElementById('dDeleteBtn').onclick=()=>{leads.splice(leads.findIndex(x=>x.nome===l.nome),1);saveLeads();closeDetail();renderAll();showToast('Lead excluído');};
  detBack.classList.remove('hidden');
}
function closeDetail(){detBack.classList.add('hidden');}
document.getElementById('detailClose').addEventListener('click',closeDetail);
detBack.addEventListener('click',e=>{if(e.target===detBack)closeDetail();});

// ══ LEADS TABLE ══
let ltSearch='',ltPri='',ltStage='',ltSort='score',ltDir=-1,ltPage=0;
const PAGE=50;let selLeads=new Set();
function filteredLeads(){
  return leads.filter(l=>{
    if(ltPri&&l.prioridade!==ltPri)return false;
    if(ltStage&&l.etapa!==ltStage)return false;
    if(ltSearch){const q=ltSearch.toLowerCase();if(![l.nome,l.segmento,l.responsavel,l.email].some(f=>(f||'').toLowerCase().includes(q)))return false;}
    return true;
  }).sort((a,b)=>{
    let va,vb;
    if(ltSort==='score'){va=calcScore(a);vb=calcScore(b);}
    else if(ltSort==='valor'){va=a.valor||0;vb=b.valor||0;}
    else{va=(a[ltSort]||'').toLowerCase();vb=(b[ltSort]||'').toLowerCase();}
    return va<vb?-ltDir:va>vb?ltDir:0;
  });
}
function updateBulkBar(){const bar=document.getElementById('bulkBar');bar.classList.toggle('visible',selLeads.size>0);document.getElementById('bulkCount').textContent=selLeads.size;}
function bindTableEvents(){
  document.querySelectorAll('#clientTable tr[data-nome]').forEach(r=>r.addEventListener('click',()=>openDetail(r.dataset.nome)));
  document.querySelectorAll('.edit-lead-btn').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openModal(leads.find(l=>l.nome===b.dataset.nome));}));
  document.querySelectorAll('.lead-cb').forEach(cb=>cb.addEventListener('change',()=>{cb.checked?selLeads.add(cb.dataset.nome):selLeads.delete(cb.dataset.nome);updateBulkBar();cb.closest('tr').classList.toggle('selected-row',cb.checked);}));
}
function renderLeadsTable(){
  const fl=filteredLeads(),total=fl.length,totalPgs=Math.max(1,Math.ceil(total/PAGE));
  if(ltPage>=totalPgs)ltPage=totalPgs-1;
  const paged=fl.slice(ltPage*PAGE,(ltPage+1)*PAGE);
  const tbody=document.getElementById('clientTable');
  tbody.innerHTML=paged.map(l=>{
    const sc=calcScore(l),fu=l.followup&&isOverdue(l.followup),sel=selLeads.has(l.nome);
    const tel=l.telefone||'',em=l.email||'',wn=tel.replace(/[^0-9]/g,'');
    return `<tr data-nome="${l.nome}" class="${sel?'selected-row':''}">
      <td style="width:36px" onclick="event.stopPropagation()"><input type="checkbox" class="lead-cb" data-nome="${l.nome}" ${sel?'checked':''}></td>
      <td style="text-align:center"><span class="score-pill ${scoreCls(sc)}">${sc}</span></td>
      <td><div style="font-weight:600;font-size:13px">${l.nome}</div><div style="font-size:11px;color:var(--text-3);margin-top:2px">${l.origem?originTag(l.origem):''}</div></td>
      <td>${l.segmento||'—'}</td>
      <td>${stageTag(l.etapa)}</td>
      <td>${priorityTag(l.prioridade||'Média')}</td>
      <td><div style="display:flex;gap:4px">
        ${tel?`<a href="https://wa.me/55${wn}" target="_blank" onclick="event.stopPropagation()" class="row-action wa">${ICON_WHATSAPP}</a>`:''}
        ${tel?`<a href="tel:${tel}" onclick="event.stopPropagation()" class="row-action">${ICON_CALL}</a>`:''}
        ${em?`<a href="mailto:${em}" onclick="event.stopPropagation()" class="row-action">${ICON_MAIL}</a>`:''}
      </div></td>
      <td style="${fu?'color:#dc2626;font-weight:600':''}">${l.followup?ICON_CALENDAR+' '+fmtDate(l.followup)+(fu?' '+ICON_ALERT:''):'—'}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600">${money(l.valor)}</td>
      <td onclick="event.stopPropagation()"><div class="row-actions"><button class="row-action primary edit-lead-btn" data-nome="${l.nome}">${ICON_EDIT}</button></div></td>
    </tr>`;
  }).join('');
  if(!tbody.innerHTML) tbody.innerHTML=`<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--text-3)">Nenhum lead encontrado</td></tr>`;
  // Pagination
  const pgW=document.getElementById('ltPaginationWrap');
  if(totalPgs<=1){pgW.innerHTML='';bindTableEvents();return;}
  const showing=Math.min((ltPage+1)*PAGE,total);
  pgW.innerHTML=`<div class="pagination"><span class="pg-info">${ltPage*PAGE+1}–${showing} de ${total} leads</span><div class="pg-btns"><button class="pg-btn" id="pgFirst" ${ltPage===0?'disabled':''}>«</button><button class="pg-btn" id="pgPrev" ${ltPage===0?'disabled':''}>‹</button><span class="pg-cur">Pág. ${ltPage+1}/${totalPgs}</span><button class="pg-btn" id="pgNext" ${ltPage>=totalPgs-1?'disabled':''}>›</button><button class="pg-btn" id="pgLast" ${ltPage>=totalPgs-1?'disabled':''}>»</button></div></div>`;
  pgW.querySelector('#pgFirst')?.addEventListener('click',()=>{ltPage=0;renderLeadsTable();});
  pgW.querySelector('#pgPrev')?.addEventListener('click',()=>{ltPage=Math.max(0,ltPage-1);renderLeadsTable();});
  pgW.querySelector('#pgNext')?.addEventListener('click',()=>{ltPage=Math.min(totalPgs-1,ltPage+1);renderLeadsTable();});
  pgW.querySelector('#pgLast')?.addEventListener('click',()=>{ltPage=totalPgs-1;renderLeadsTable();});
  const sa=document.getElementById('selectAll');
  if(sa) sa.checked=paged.length>0&&paged.every(l=>selLeads.has(l.nome));
  bindTableEvents();
}
// Filters
document.getElementById('leadsSearch').addEventListener('input',e=>{ltSearch=e.target.value;ltPage=0;renderLeadsTable();});
document.getElementById('leadsPriorityFilters').addEventListener('click',e=>{const b=e.target.closest('[data-lf-priority]');if(!b)return;ltPri=b.dataset.lfPriority;document.querySelectorAll('[data-lf-priority]').forEach(x=>x.classList.toggle('active',x===b));renderLeadsTable();});
document.getElementById('leadsStageFilters').addEventListener('click',e=>{const b=e.target.closest('[data-lf-stage]');if(!b)return;ltStage=b.dataset.lfStage;document.querySelectorAll('[data-lf-stage]').forEach(x=>x.classList.toggle('active',x===b));renderLeadsTable();});
document.querySelectorAll('[data-sort]').forEach(th=>th.addEventListener('click',()=>{ltSort===th.dataset.sort?ltDir*=-1:(ltSort=th.dataset.sort,ltDir=1);renderLeadsTable();}));
document.getElementById('selectAll').addEventListener('change',e=>{filteredLeads().forEach(l=>e.target.checked?selLeads.add(l.nome):selLeads.delete(l.nome));renderLeadsTable();updateBulkBar();});
// Bulk
document.getElementById('bulkClearBtn').addEventListener('click',()=>{selLeads.clear();renderLeadsTable();updateBulkBar();});
document.getElementById('bulkDeleteBtn').addEventListener('click',()=>{if(!confirm(`Excluir ${selLeads.size} lead(s)?`))return;selLeads.forEach(nome=>{const i=leads.findIndex(l=>l.nome===nome);if(i>-1)leads.splice(i,1);});selLeads.clear();saveLeads();renderAll();updateBulkBar();showToast('Leads excluídos');});
const bsb=document.getElementById('bulkStageBackdrop');
document.getElementById('bulkStageBtn').addEventListener('click',()=>bsb.classList.remove('hidden'));
document.getElementById('bulkStageClose').addEventListener('click',()=>bsb.classList.add('hidden'));
document.getElementById('bulkStageCancelBtn').addEventListener('click',()=>bsb.classList.add('hidden'));
bsb.addEventListener('click',e=>{if(e.target===bsb)bsb.classList.add('hidden');});
document.getElementById('bulkStageConfirm').addEventListener('click',()=>{const s=document.getElementById('bulkStageSelect').value;selLeads.forEach(nome=>{const l=leads.find(x=>x.nome===nome);if(l) applyStageChange(l,s);});selLeads.clear();saveLeads();bsb.classList.add('hidden');renderAll();updateBulkBar();showToast(`Movidos para ${s}`,'success');});
const brb=document.getElementById('bulkRespBackdrop');
document.getElementById('bulkRespBtn').addEventListener('click',()=>{document.getElementById('bulkRespInput').value='';brb.classList.remove('hidden');});
document.getElementById('bulkRespClose').addEventListener('click',()=>brb.classList.add('hidden'));
document.getElementById('bulkRespCancelBtn').addEventListener('click',()=>brb.classList.add('hidden'));
brb.addEventListener('click',e=>{if(e.target===brb)brb.classList.add('hidden');});
document.getElementById('bulkRespConfirm').addEventListener('click',()=>{const r=document.getElementById('bulkRespInput').value.trim();if(!r)return;selLeads.forEach(nome=>{const l=leads.find(x=>x.nome===nome);if(l)l.responsavel=r;});selLeads.clear();saveLeads();brb.classList.add('hidden');renderLeadsTable();updateBulkBar();showToast(`Responsável → ${r}`,'success');});

// ══ KANBAN ══
let fSearch='',fPri='',fOrig='';
function renderBoard(){
  const stgD=parseInt(document.getElementById('stagnationDays')?.value)||7;
  const valMap={};stages.forEach(s=>{valMap[s]=leads.filter(l=>l.etapa===s).reduce((a,l)=>a+(l.valor||0),0);});
  document.getElementById('board').innerHTML=stages.map(stage=>{
    const fl=leads.filter(l=>{
      if(l.etapa!==stage)return false;
      if(fPri&&l.prioridade!==fPri)return false;
      if(fOrig&&l.origem!==fOrig)return false;
      if(fSearch){const q=fSearch.toLowerCase();if(![l.nome,l.segmento,l.responsavel].some(f=>(f||'').toLowerCase().includes(q)))return false;}
      return true;
    });
    return `<div class="col" data-col="${stage}">
      <div class="col-header"><div><div class="col-name">${stage}</div><div class="col-total">${money(valMap[stage]||0)}</div></div><span class="col-count">${fl.length}</span></div>
      <div class="col-body">${fl.map(l=>{
        const stg=stage!=='Fechado'&&stage!=='Perdido'&&daysSince(l.ultimaAtualizacao)>=stgD;
        const sc=calcScore(l);const fu=l.followup&&isOverdue(l.followup);
        return `<div class="kanban-card${stg?' stagnant':''}" draggable="true" data-nome="${l.nome}">
          <div class="kc-top"><div class="kc-name">${l.nome}</div><button class="kc-edit edit-btn" data-nome="${l.nome}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></div>
          <div class="kc-meta">${l.segmento?`<div class="kc-meta-row"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>${l.segmento}</div>`:''} ${l.responsavel?`<div class="kc-meta-row"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${l.responsavel}</div>`:''}</div>
          <div class="kc-footer">${priorityTag(l.prioridade||'Média')} ${l.origem?originTag(l.origem):''} <span class="score-pill ${scoreCls(sc)}" style="font-size:10px">${sc}</span><span class="kc-value">${money(l.valor)}</span></div>
          ${l.followup?`<div class="followup-badge${fu?' overdue':''}">${ICON_CALENDAR} ${fmtDate(l.followup)}${fu?' '+ICON_ALERT:''}</div>`:''}
          ${stg?`<div class="stagnant-badge">${ICON_CLOCK} ${daysSince(l.ultimaAtualizacao)}d parado</div>`:''}
        </div>`;
      }).join('')}</div>
      ${stage!=='Perdido'?`<button class="col-add-btn" data-add-stage="${stage}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> Adicionar</button>`:''}
    </div>`;
  }).join('');
  initDrag();
}
document.getElementById('pipelineSearch').addEventListener('input',e=>{fSearch=e.target.value;renderBoard();});
document.getElementById('priorityFilters').addEventListener('click',e=>{const b=e.target.closest('[data-filter-priority]');if(!b)return;fPri=b.dataset.filterPriority;document.querySelectorAll('[data-filter-priority]').forEach(x=>x.classList.toggle('active',x===b));renderBoard();});
document.getElementById('originFilters').addEventListener('click',e=>{const b=e.target.closest('[data-filter-origin]');if(!b)return;fOrig=b.dataset.filterOrigin;document.querySelectorAll('[data-filter-origin]').forEach(x=>x.classList.toggle('active',x===b));renderBoard();});
document.getElementById('stagnationDays').addEventListener('change',renderBoard);

// ══ DRAG & DROP ══
let dragLead=null,placeholder=null;
function getDragAfter(cont,y){return[...cont.querySelectorAll('.kanban-card:not(.dragging)')].reduce((cl,el)=>{const b=el.getBoundingClientRect(),o=y-b.top-b.height/2;return(o<0&&o>cl.offset)?{offset:o,element:el}:cl;},{offset:Number.NEGATIVE_INFINITY}).element;}
function initDrag(){
  document.querySelectorAll('.kanban-card').forEach(c=>{
    c.addEventListener('click',e=>{if(e.target.closest('.edit-btn'))return;openDetail(c.dataset.nome);});
    c.addEventListener('dragstart',e=>{dragLead=c.dataset.nome;c.classList.add('dragging');e.dataTransfer.effectAllowed='move';placeholder=document.createElement('div');placeholder.className='col-drop-zone';setTimeout(()=>c.style.display='none',0);});
    c.addEventListener('dragend',()=>{c.style.display='';c.classList.remove('dragging');if(placeholder){placeholder.remove();placeholder=null;}});
  });
  document.querySelectorAll('.col').forEach(col=>{
    const body=col.querySelector('.col-body');
    col.addEventListener('dragover',e=>{e.preventDefault();if(!placeholder)return;const after=getDragAfter(body,e.clientY);after?body.insertBefore(placeholder,after):body.appendChild(placeholder);});
    col.addEventListener('dragleave',e=>{if(!col.contains(e.relatedTarget)&&placeholder?.parentNode===body)body.removeChild(placeholder);});
    col.addEventListener('drop',e=>{
      e.preventDefault();const ns=col.dataset.col;
      const idx=leads.findIndex(l=>l.nome===dragLead);if(idx===-1)return;
      if(ns==='Perdido'){openLoss(dragLead);return;}
      const[lead]=leads.splice(idx,1);applyStageChange(lead,ns);
      const after=placeholder?.nextElementSibling,afterNome=after?.dataset.nome;
      const ai=afterNome?leads.findIndex(l=>l.nome===afterNome):-1;
      ai>-1?leads.splice(ai,0,lead):leads.push(lead);
      saveLeads();renderAll();showToast(`"${lead.nome}" → ${ns}`,'success');
    });
  });
  document.querySelectorAll('.edit-btn').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openModal(leads.find(l=>l.nome===b.dataset.nome));}));
  document.querySelectorAll('.col-add-btn').forEach(b=>b.addEventListener('click',()=>openModal(null,b.dataset.addStage)));
}

// ══ CLIENT TABLE ══
function renderClientTable(){
  document.getElementById('clientTable2').innerHTML=leads.map(l=>`<tr>
    <td><div style="display:flex;align-items:center;gap:8px"><div class="client-avatar">${(l.nome||'?').charAt(0).toUpperCase()}</div><div><div style="font-weight:600;font-size:13px">${l.nome}</div><div style="font-size:11px;color:var(--text-3)">${l.email||''}</div></div></div></td>
    <td>${l.segmento||'—'}</td><td>${stageTag(l.etapa)}</td><td>${l.responsavel||'—'}</td>
    <td style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600">${money(l.valor)}</td>
  </tr>`).join('');
}

// ══ KPIs & OVERDUE ══
function renderKPIs(){
  const active=leads.filter(l=>l.etapa!=='Perdido');
  const prop=active.filter(l=>l.etapa==='Proposta').length;
  const clos=active.filter(l=>l.etapa==='Fechado').length;
  const perdidos=leads.filter(l=>l.etapa==='Perdido').length;
  const pipeVal=active.filter(l=>l.etapa!=='Fechado').reduce((a,l)=>a+(l.valor||0),0);
  const closVal=active.filter(l=>l.etapa==='Fechado').reduce((a,l)=>a+(l.valor||0),0);
  const conv=active.length?Math.round((clos/active.length)*100):0;
  const ticket=clos?closVal/clos:0;
  [['kpiLeads',active.length],['kpiPropostas',prop],['kpiFechamentos',clos],['kpiPipeline',money(pipeVal)],
   ['mKpiLeads',active.length],['mKpiProp',prop],['mKpiClose',clos],['mKpiConv',conv+'%'],
   ['mKpiPerdidos',perdidos],['mKpiValor',money(pipeVal)],['mKpiTicket',money(ticket)],
   ['mKpiAtivs',typeof agEvents!=='undefined'?agEvents.filter(e=>e.data>=todayStr()).length:0],
   ['homeLeadCount',active.length],['homePropCount',prop],['homeCloseCount',clos],
   ['navLeadsBadge',active.length]
  ].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=v;});
}
function renderOverdueList(){
  const ol=document.getElementById('overdueList');if(!ol)return;
  const ov=leads.filter(l=>l.followup&&isOverdue(l.followup)&&l.etapa!=='Fechado'&&l.etapa!=='Perdido').slice(0,8);
  if(!ov.length){ol.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:28px 0;color:var(--text-3)">${ICON_CHECK}<p style="font-size:13px">Nenhum follow-up vencido</p></div>`;return;}
  ol.innerHTML=ov.map(l=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer;gap:8px" onclick="openDetail('${l.nome.replace(/'/g,"\\'")}')">${stageTag(l.etapa)}<div style="flex:1"><div style="font-size:13px;font-weight:600">${l.nome}</div><div style="font-size:11px;color:#dc2626">${ICON_CALENDAR} ${fmtDate(l.followup)}</div></div>${priorityTag(l.prioridade||'Média')}</div>`).join('');
}

// ══ METRICS ══
function renderMetrics(){
  renderKPIs();
  const fc=document.getElementById('funnelChart');
  if(fc){
    const sc={Lead:0,Contato:0,Proposta:0,Fechado:0,Perdido:0};leads.forEach(l=>{if(sc[l.etapa]!==undefined)sc[l.etapa]++;});
    const mx=Math.max(1,...Object.values(sc));
    const colors={Lead:'#6366f1',Contato:'#f59e0b',Proposta:'#06b6d4',Fechado:'#22c55e',Perdido:'#ef4444'};
    fc.innerHTML=Object.entries(sc).map(([s,c])=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:8px"><div style="width:10px;height:10px;border-radius:3px;background:${colors[s]}"></div><span style="font-size:13px;font-weight:600;color:var(--text)">${s}</span></div>
      <div style="display:flex;align-items:center;gap:10px"><div style="width:120px"><div class="funnel-bar-bg"><div class="funnel-bar-fill" style="width:${Math.round((c/mx)*100)}%;background:${colors[s]}"></div></div></div><span style="font-size:13px;font-weight:700;color:var(--text);min-width:20px;text-align:right">${c}</span></div>
    </div>`).join('');
  }
  const lc=document.getElementById('lossChart');
  if(lc){
    const lost=leads.filter(l=>l.etapa==='Perdido'&&l.motivoPerda);
    if(!lost.length){lc.innerHTML='<p style="color:var(--text-3);font-size:13px;text-align:center;padding:20px 0">Nenhuma perda registrada</p>';}
    else{const r={};lost.forEach(l=>{r[l.motivoPerda]=(r[l.motivoPerda]||0)+1;});const mx=Math.max(...Object.values(r));lc.innerHTML=Object.entries(r).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="font-size:12px;color:var(--text-2);min-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${k}</div><div class="funnel-bar-bg" style="flex:1"><div class="funnel-bar-fill" style="width:${Math.round((v/mx)*100)}%;background:#dc2626"></div></div><span style="font-size:12px;font-weight:700;color:var(--text);min-width:16px;text-align:right">${v}</span></div>`).join('');}
  }
  const oc=document.getElementById('originChart');
  if(oc){
    const orgs={Inbound:0,Outbound:0,'Indicação':0,Outro:0};leads.forEach(l=>{const o=l.origem||'Outro';orgs[o]=(orgs[o]||0)+1;});
    const total=leads.length||1;const oc2={Inbound:'#22c55e',Outbound:'#6366f1','Indicação':'#a855f7',Outro:'#94a3b8'};
    oc.innerHTML=`<div style="display:flex;gap:8px;align-items:flex-end;height:100px">${Object.entries(orgs).filter(([,v])=>v>0).map(([o,v])=>{const p=Math.round((v/total)*100);return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="font-size:11px;font-weight:700;color:var(--text-2)">${v}</div><div style="width:100%;border-radius:5px 5px 0 0;background:${oc2[o]||'#6366f1'};height:${Math.max(8,p)}px"></div><div style="font-size:10px;color:var(--text-3);text-align:center">${o}</div></div>`;}).join('')}</div>`;
  }
}

// ══ EXPORT/IMPORT ══
function exportCSV(){
  const cols=['nome','segmento','responsavel','telefone','email','etapa','prioridade','valor','dataEntrada','origem','followup','obs','motivoPerda'];
  const csv=[cols.join(','),...leads.map(l=>cols.map(k=>'"'+String(l[k]??'').replace(/"/g,'""')+'"').join(','))].join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent('\uFEFF'+csv);a.download='outbounder_leads_'+todayStr()+'.csv';document.body.appendChild(a);a.click();a.remove();showToast('CSV exportado','success');
}
document.getElementById('exportCsvBtn').addEventListener('click',exportCSV);
document.getElementById('exportCsvBtn2').addEventListener('click',exportCSV);
document.getElementById('exportJsonBtn').addEventListener('click',()=>{
  const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify({leads,exportDate:todayStr()},null,2));a.download='outbounder_backup_'+todayStr()+'.json';document.body.appendChild(a);a.click();a.remove();showToast('JSON exportado','success');
});
document.getElementById('clearAllBtn').addEventListener('click',()=>{if(!confirm('Apagar TODOS os leads?'))return;leads.length=0;saveLeads();renderAll();showToast('Dados limpos','warn');});
const iz=document.getElementById('importZone'),cfi=document.getElementById('csvFileInput');
iz.addEventListener('click',()=>cfi.click());
iz.addEventListener('dragover',e=>{e.preventDefault();iz.classList.add('dragover');});
iz.addEventListener('dragleave',()=>iz.classList.remove('dragover'));
iz.addEventListener('drop',e=>{e.preventDefault();iz.classList.remove('dragover');if(e.dataTransfer.files[0])processCSV(e.dataTransfer.files[0]);});
cfi.addEventListener('change',e=>{if(e.target.files[0])processCSV(e.target.files[0]);});
function processCSV(file){
  const reader=new FileReader();
  reader.onload=e=>{
    const lines=e.target.result.replace(/\r/g,'').split('\n').filter(l=>l.trim());
    if(lines.length<2){showToast('CSV inválido','danger');return;}
    const headers=lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));
    let count=0;
    lines.slice(1).forEach(line=>{
      const vals=line.match(/(".*?"|[^,]+)/g)||[];
      const obj={};headers.forEach((h,i)=>{obj[h]=(vals[i]||'').replace(/^"|"$/g,'').trim();});
      if(obj.nome){const ex=leads.findIndex(l=>l.nome===obj.nome);const nl={nome:obj.nome,segmento:obj.segmento||'',responsavel:obj.responsavel||'',telefone:obj.telefone||'',email:obj.email||'',etapa:stages.includes(obj.etapa)?obj.etapa:'Lead',prioridade:['Alta','Média','Baixa'].includes(obj.prioridade)?obj.prioridade:'Média',valor:Number(obj.valor)||0,dataEntrada:obj.dataEntrada||todayStr(),origem:obj.origem||'',followup:obj.followup||'',obs:obj.obs||'',ultimaAtualizacao:todayStr(),motivoPerda:obj.motivoPerda||''};if(ex>-1)leads[ex]=nl;else leads.unshift(nl);count++;}
    });
    saveLeads();renderAll();
    const ir=document.getElementById('importResult');
    if(ir)ir.innerHTML=`<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;font-size:13px;color:#16a34a;display:flex;align-items:center;gap:7px">${ICON_CHECK}${count} leads importados</div>`;
    showToast(`${count} leads importados`,'success');
  };
  reader.readAsText(file,'utf-8');
}

// ══ AGENDA ══
function loadEvents(){try{const s=localStorage.getItem(EK);return s?JSON.parse(s):[];}catch(e){return[];}}
function saveEvents(){localStorage.setItem(EK,JSON.stringify(agEvents));}
let agEvents=loadEvents();
window.crmAgendaAPI={
  get:()=>agEvents,
  set:(arr)=>{agEvents=Array.isArray(arr)?arr:agEvents;try{saveEvents();renderAgenda();renderKPIs();}catch(e){}},
  save:()=>{try{saveEvents();renderAgenda();renderKPIs();}catch(e){}},
  render:()=>{try{renderAgenda();}catch(e){}},
  openDetail:(id)=>{try{return openAgDetail(id);}catch(e){}},
  openModal:(id)=>{try{return openAgEventModal(id);}catch(e){}}
};
if(!agEvents.length){
  const t=todayStr(),tom=new Date();tom.setDate(tom.getDate()+1);const ts=tom.toISOString().slice(0,10);
  agEvents=[
    {id:'e1',leadNome:'Fazenda Aurora',data:t,hora:'09:00',tipo:'Ligação',prioridade:'Alta',notas:'Confirmar proposta de R$18k.',spin:{s:'',p:'',i:'',n:''}},
    {id:'e2',leadNome:'Loja Horizonte',data:t,hora:'14:30',tipo:'E-mail',prioridade:'Média',notas:'Enviar apresentação comercial.',spin:{s:'',p:'',i:'',n:''}},
    {id:'e3',leadNome:'Franquia Delta',data:ts,hora:'10:00',tipo:'Reunião',prioridade:'Alta',notas:'Primeira reunião.',spin:{s:'',p:'',i:'',n:''}},
  ];saveEvents();
}
let agView='list',agPF='',agSS='',calY=new Date().getFullYear(),calM=new Date().getMonth(),editEvId=null;
let tiInt=null,tiSec=0,tiRun=false;
const timeFmt=s=>[Math.floor(s/3600),Math.floor((s%3600)/60),s%60].map(v=>String(v).padStart(2,'0')).join(':');
document.getElementById('timerStart').addEventListener('click',()=>{if(tiRun)return;tiRun=true;tiInt=setInterval(()=>{tiSec++;document.getElementById('agTimer').textContent=timeFmt(tiSec);},1000);});
document.getElementById('timerPause').addEventListener('click',()=>{tiRun=false;clearInterval(tiInt);});
document.getElementById('timerStop').addEventListener('click',()=>{tiRun=false;clearInterval(tiInt);tiSec=0;document.getElementById('agTimer').textContent='00:00:00';});
document.querySelector('.agenda-filters').addEventListener('click',e=>{const b=e.target.closest('[data-ag-priority]');if(!b)return;agPF=b.dataset.agPriority;document.querySelectorAll('[data-ag-priority]').forEach(x=>x.classList.toggle('active',x===b));renderAgenda();});
document.getElementById('agSearch').addEventListener('input',e=>{agSS=e.target.value.toLowerCase();renderAgenda();});
document.getElementById('agViewList').addEventListener('click',()=>{agView='list';document.getElementById('agViewList').classList.add('active');document.getElementById('agViewCal').classList.remove('active');document.getElementById('agListView').classList.remove('hidden');document.getElementById('agCalView').classList.add('hidden');});
document.getElementById('agViewCal').addEventListener('click',()=>{agView='cal';document.getElementById('agViewCal').classList.add('active');document.getElementById('agViewList').classList.remove('active');document.getElementById('agCalView').classList.remove('hidden');document.getElementById('agListView').classList.add('hidden');renderCalendar();});
function getFilteredEvents(){return agEvents.filter(ev=>{if(agPF&&ev.prioridade!==agPF)return false;if(agSS&&!ev.leadNome.toLowerCase().includes(agSS)&&!(ev.tipo||'').toLowerCase().includes(agSS))return false;return true;}).sort((a,b)=>{const d=a.data.localeCompare(b.data);return d!==0?d:a.hora.localeCompare(b.hora);});}
function renderAgendaKPIs(){
  const t=todayStr(),te=agEvents.filter(e=>e.data===t);
  document.getElementById('agKpiChamadas').textContent=te.filter(e=>e.tipo&&(e.tipo.includes('Ligação')||e.tipo.includes('WhatsApp'))).length;
  document.getElementById('agKpiReunioes').textContent=te.filter(e=>e.tipo&&e.tipo.includes('Reunião')).length;
  document.getElementById('agKpiFollowups').textContent=agEvents.filter(e=>e.data>=t&&e.tipo&&e.tipo.includes('Follow-up')).length;
  document.getElementById('agKpiAtrasados').textContent=agEvents.filter(e=>e.data<t).length;
}
function renderAgenda(){
  renderAgendaKPIs();
  if(agView==='cal'){renderCalendar();return;}
  const fl=getFilteredEvents(),t=todayStr();
  const tod=fl.filter(e=>e.data===t),up=fl.filter(e=>e.data>t),ov=fl.filter(e=>e.data<t);
  function buildItems(evs,overdue=false){
    if(!evs.length)return`<p style="color:var(--text-3);font-size:13px;padding:8px 0">Nenhum evento.</p>`;
    return evs.map(ev=>{
      const l=leads.find(x=>x.nome===ev.leadNome),stg=l&&daysSince(l.ultimaAtualizacao)>=7;
      const tel=l?.telefone||'',em=l?.email||'',wn=tel.replace(/[^0-9]/g,'');
      return `<div class="ag-item${stg?' stagnant':''}${overdue?' overdue':''}" data-evid="${ev.id}">
        <div class="ag-time">${ev.hora||'—'}</div>
        <div class="ag-body"><div class="ag-name">${ev.leadNome}</div>
          <div class="ag-meta"><span>${ev.tipo||'—'}</span>${priorityTag(ev.prioridade||'Média')}${l?stageTag(l.etapa):''}${l?`<span style="font-weight:700;font-size:11px;font-family:'JetBrains Mono',monospace;color:var(--blue)">${money(l.valor)}</span>`:''}${stg?`<span style="color:#dc2626;font-size:11px;font-weight:600">${ICON_CLOCK} Estagnado</span>`:''}</div>
        </div>
        <div class="ag-actions">
          ${tel?`<a class="ag-action" href="https://wa.me/55${wn}" target="_blank" onclick="event.stopPropagation()">${ICON_WHATSAPP}</a>`:''}
          ${tel?`<a class="ag-action" href="tel:${tel}" onclick="event.stopPropagation()">${ICON_CALL}</a>`:''}
          ${em?`<a class="ag-action" href="mailto:${em}" onclick="event.stopPropagation()">${ICON_MAIL}</a>`:''}
          <button class="ag-action edit-ev-btn" data-evid="${ev.id}" onclick="event.stopPropagation()">${ICON_EDIT}</button>
        </div>
      </div>`;
    }).join('');
  }
  const lt=document.getElementById('agListToday'),lu=document.getElementById('agListUpcoming');
  lt.innerHTML=`<div class="ag-day-group"><div class="ag-day-label today">Hoje — ${new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</div>${buildItems(tod)}</div>`+(ov.length?`<div class="ag-day-group"><div class="ag-day-label" style="color:#dc2626">${ICON_ALERT} Atrasados</div>${buildItems(ov,true)}</div>`:'');
  lu.innerHTML=up.length?`<div class="ag-day-group"><div class="ag-day-label">Próximos dias</div>${buildItems(up)}</div>`:'';
  document.querySelectorAll('.ag-item[data-evid]').forEach(r=>r.addEventListener('click',()=>openAgDetail(r.dataset.evid)));
  document.querySelectorAll('.edit-ev-btn').forEach(b=>b.addEventListener('click',()=>openAgEventModal(b.dataset.evid)));
}
function renderCalendar(){
  document.getElementById('calTitle').textContent=new Date(calY,calM,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^\w/,s=>s.toUpperCase());
  const dows=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  let html=dows.map(d=>`<div class="cal-dow">${d}</div>`).join('');
  const fd=new Date(calY,calM,1).getDay(),dim=new Date(calY,calM+1,0).getDate(),today=todayStr();
  for(let i=0;i<fd;i++)html+=`<div class="cal-day other-month"></div>`;
  for(let d=1;d<=dim;d++){
    const ds=`${calY}-${String(calM+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const de=agEvents.filter(e=>e.data===ds),iT=ds===today;
    const eh=de.slice(0,3).map(e=>{const c=e.prioridade==='Alta'?'alta':e.prioridade==='Baixa'?'baixa':'media';return `<div class="cal-ev ${c}" onclick="event.stopPropagation();openAgDetail('${e.id}')">${e.leadNome}</div>`;}).join('')+(de.length>3?`<div style="font-size:10px;color:var(--text-3)">+${de.length-3}</div>`:'');
    html+=`<div class="cal-day${iT?' today':''}" onclick="openNewEventOnDay('${ds}')"><div class="cal-day-num">${d}</div>${eh}</div>`;
  }
  document.getElementById('calGrid').innerHTML=html;
}
document.getElementById('calPrev').addEventListener('click',()=>{calM--;if(calM<0){calM=11;calY--;}renderCalendar();});
document.getElementById('calNext').addEventListener('click',()=>{calM++;if(calM>11){calM=0;calY++;}renderCalendar();});
let curEvId=null;
function openAgDetail(evId){
  const ev=agEvents.find(e=>e.id===evId);if(!ev)return;curEvId=evId;
  const l=leads.find(x=>x.nome===ev.leadNome);
  document.getElementById('agdNome').textContent=ev.leadNome;
  document.getElementById('agdTagsRow').innerHTML=`${l?stageTag(l.etapa):''}${priorityTag(ev.prioridade||'Média')}`;
  document.getElementById('agdData').textContent=fmtDate(ev.data);
  document.getElementById('agdHora').textContent=ev.hora||'—';
  document.getElementById('agdTipo').textContent=ev.tipo||'—';
  document.getElementById('agdValor').textContent=l?money(l.valor):'—';
  document.getElementById('agdNotas').textContent=ev.notas||'—';
  const tel=l?.telefone||'',em=l?.email||'',wn=tel.replace(/[^0-9]/g,'');
  document.getElementById('agdWhatsapp').href=tel?`https://wa.me/55${wn}`:'#';
  document.getElementById('agdLigar').href=tel?`tel:${tel}`:'#';
  document.getElementById('agdEmail').href=em?`mailto:${em}`:'#';
  document.getElementById('spinS').value=ev.spin?.s||'';document.getElementById('spinP').value=ev.spin?.p||'';
  document.getElementById('spinI').value=ev.spin?.i||'';document.getElementById('spinN').value=ev.spin?.n||'';
  document.getElementById('agDetailBackdrop').classList.remove('hidden');
}
document.getElementById('agDetailClose').addEventListener('click',()=>document.getElementById('agDetailBackdrop').classList.add('hidden'));
document.getElementById('agDetailBackdrop').addEventListener('click',e=>{if(e.target===document.getElementById('agDetailBackdrop'))document.getElementById('agDetailBackdrop').classList.add('hidden');});
document.getElementById('spinSave').addEventListener('click',()=>{
  const ev=agEvents.find(e=>e.id===curEvId);if(!ev)return;
  ev.spin={s:document.getElementById('spinS').value,p:document.getElementById('spinP').value,i:document.getElementById('spinI').value,n:document.getElementById('spinN').value};
  saveEvents();showToast('Preparação SPIN salva','success');
});
function populateLeadSel(){const s=document.getElementById('agEvLead');s.innerHTML='<option value="">Selecione um lead...</option>'+leads.map(l=>`<option value="${l.nome}">${l.nome}</option>`).join('');}
function openAgEventModal(evId){
  editEvId=evId||null;populateLeadSel();
  const ev=evId?agEvents.find(e=>e.id===evId):null;
  document.getElementById('agEventTitle').textContent=ev?'Editar compromisso':'Novo compromisso';
  document.getElementById('agEvLead').value=ev?.leadNome||'';document.getElementById('agEvData').value=ev?.data||todayStr();
  document.getElementById('agEvHora').value=ev?.hora||'09:00';document.getElementById('agEvTipo').value=ev?.tipo||'Ligação';
  document.getElementById('agEvPrioridade').value=ev?.prioridade||'Média';document.getElementById('agEvNotas').value=ev?.notas||'';
  document.getElementById('agEventDelete').classList.toggle('hidden',!ev);document.getElementById('agEventBackdrop').classList.remove('hidden');
}
function openNewEventOnDay(ds){editEvId=null;populateLeadSel();document.getElementById('agEventTitle').textContent='Novo compromisso';document.getElementById('agEvLead').value='';document.getElementById('agEvData').value=ds;document.getElementById('agEvHora').value='09:00';document.getElementById('agEvTipo').value='Ligação';document.getElementById('agEvPrioridade').value='Média';document.getElementById('agEvNotas').value='';document.getElementById('agEventDelete').classList.add('hidden');document.getElementById('agEventBackdrop').classList.remove('hidden');}
document.getElementById('agNewBtn').addEventListener('click',()=>openAgEventModal(null));
document.getElementById('agEventClose').addEventListener('click',()=>document.getElementById('agEventBackdrop').classList.add('hidden'));
document.getElementById('agEventCancel').addEventListener('click',()=>document.getElementById('agEventBackdrop').classList.add('hidden'));
document.getElementById('agEventBackdrop').addEventListener('click',e=>{if(e.target===document.getElementById('agEventBackdrop'))document.getElementById('agEventBackdrop').classList.add('hidden');});
document.getElementById('agEventSave').addEventListener('click',()=>{
  const nome=document.getElementById('agEvLead').value;if(!nome){alert('Selecione um lead');return;}
  const data=document.getElementById('agEvData').value;if(!data){alert('Informe a data');return;}
  const ev={id:editEvId||('ev'+Date.now()),leadNome:nome,data,hora:document.getElementById('agEvHora').value,tipo:document.getElementById('agEvTipo').value,prioridade:document.getElementById('agEvPrioridade').value,notas:document.getElementById('agEvNotas').value,spin:editEvId?(agEvents.find(e=>e.id===editEvId)?.spin||{s:'',p:'',i:'',n:''}):{s:'',p:'',i:'',n:''}};
  if(editEvId){const idx=agEvents.findIndex(e=>e.id===editEvId);if(idx>-1)agEvents[idx]=ev;}else agEvents.push(ev);
  saveEvents();document.getElementById('agEventBackdrop').classList.add('hidden');renderAgenda();renderKPIs();showToast(editEvId?'Compromisso atualizado':'Compromisso criado','success');
});
document.getElementById('agEventDelete').addEventListener('click',()=>{if(!editEvId)return;agEvents=agEvents.filter(e=>e.id!==editEvId);saveEvents();document.getElementById('agEventBackdrop').classList.add('hidden');renderAgenda();showToast('Removido');});

// ══ AUTOMAÇÕES ══
const DEFAULT_AUTOMATIONS=[
  {id:'auto1',nome:'Preparar contrato ao fechar',etapa:'Fechado',ativo:true,acao:'compromisso',params:{tipo:'Follow-up',prazo:1,nota:'Enviar contrato e próximos passos'}},
  {id:'auto2',nome:'Agendar diagnóstico em Proposta',etapa:'Proposta',ativo:true,acao:'compromisso',params:{tipo:'Reunião',prazo:2,nota:'Reunião de diagnóstico SPIN'}},
  {id:'auto3',nome:'Priorizar leads outbound em Contato',etapa:'Contato',ativo:false,acao:'prioridade',params:{valor:'Alta'}}
];
function loadAutomations(){try{const s=localStorage.getItem(AK);return s?JSON.parse(s):JSON.parse(JSON.stringify(DEFAULT_AUTOMATIONS));}catch(e){return JSON.parse(JSON.stringify(DEFAULT_AUTOMATIONS));}}
function saveAutomations(){try{localStorage.setItem(AK,JSON.stringify(automations));}catch(e){}}
let automations=loadAutomations();
window.crmAutomationAPI={
  get:()=>automations,
  set:(arr)=>{automations=Array.isArray(arr)?arr:automations;try{saveAutomations();renderAutomations();}catch(e){}},
  save:()=>{try{saveAutomations();renderAutomations();}catch(e){}},
  open:(id)=>{try{return openAutoModal(id);}catch(e){}},
  render:()=>{try{return renderAutomations();}catch(e){}}
};
const ACAO_LABEL={compromisso:'Criar compromisso',prioridade:'Definir prioridade',nota:'Adicionar nota'};
function runAutomations(lead,novaEtapa){
  const regras=automations.filter(a=>a.ativo&&a.etapa===novaEtapa);
  regras.forEach(r=>{
    if(r.acao==='compromisso'){
      const p=r.params||{};
      const d=new Date();d.setDate(d.getDate()+Number(p.prazo||0));
      const ds=d.toISOString().slice(0,10);
      const autoEvent={id:'ev'+Date.now()+Math.random().toString(36).slice(2,5),leadNome:lead.nome,data:ds,hora:'09:00',tipo:p.tipo||'Follow-up',prioridade:lead.prioridade||'Média',notas:p.nota||'',spin:{s:'',p:'',i:'',n:''}};
      if(window.CRMV64Agenda && typeof window.CRMV64Agenda.addEvent === 'function') window.CRMV64Agenda.addEvent(autoEvent,{silent:true,syncLead:false});
      else { agEvents.push(autoEvent); saveEvents(); }
      addAtividade(lead.nome,'Automação',`"${r.nome}" criou um compromisso de ${p.tipo} para ${fmtDate(ds)}`);
    } else if(r.acao==='prioridade'){
      const novaPri=r.params?.valor||'Média';
      lead.prioridade=novaPri;
      addAtividade(lead.nome,'Automação',`"${r.nome}" definiu a prioridade como ${novaPri}`);
    } else if(r.acao==='nota'){
      addAtividade(lead.nome,'Automação',r.params?.texto||r.nome);
    }
  });
}
function renderAutomations(){
  const list=document.getElementById('autoList'),empty=document.getElementById('autoEmptyState');
  empty.classList.toggle('hidden',automations.length>0);
  list.innerHTML=automations.map(a=>{
    const p=a.params||{};
    let detail='';
    if(a.acao==='compromisso') detail=`${p.tipo||'—'} em ${p.prazo==0?'0 dias':p.prazo+'d'}`;
    else if(a.acao==='prioridade') detail=`Prioridade → ${p.valor}`;
    else if(a.acao==='nota') detail='Nota automática';
    return `<div class="auto-card${a.ativo?'':' disabled'}">
      <div class="auto-icon">${ICON_BOLT}</div>
      <div class="auto-body">
        <div class="auto-name">${a.nome}</div>
        <div class="auto-rule">Quando entrar em ${stageTag(a.etapa)} <span>${ICON_MOVE}</span> ${ACAO_LABEL[a.acao]||a.acao} · ${detail}</div>
      </div>
      <div class="auto-actions">
        <button class="auto-toggle${a.ativo?' on':''}" data-auto-toggle="${a.id}" title="${a.ativo?'Ativa':'Inativa'}">${a.ativo?ICON_TOGGLE_ON:ICON_TOGGLE_OFF}</button>
        <button class="auto-iconbtn" data-auto-edit="${a.id}">${ICON_EDIT}</button>
        <button class="auto-iconbtn" data-auto-del="${a.id}">${ICON_TRASH}</button>
      </div>
    </div>`;
  }).join('');
  list.querySelectorAll('[data-auto-toggle]').forEach(b=>b.addEventListener('click',()=>{
    const a=automations.find(x=>x.id===b.dataset.autoToggle);if(a){a.ativo=!a.ativo;saveAutomations();renderAutomations();}
  }));
  list.querySelectorAll('[data-auto-edit]').forEach(b=>b.addEventListener('click',()=>openAutoModal(b.dataset.autoEdit)));
  list.querySelectorAll('[data-auto-del]').forEach(b=>b.addEventListener('click',()=>{
    automations=automations.filter(x=>x.id!==b.dataset.autoDel);saveAutomations();renderAutomations();showToast('Automação excluída');
  }));
}
document.getElementById('autoNewBtn').innerHTML=ICON_PLUS+'Nova automação';
document.getElementById('autoModalClose').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M18 6 6 18M6 6l12 12"/></svg>';
let editAutoId=null;
function toggleAutoParams(acao){
  document.getElementById('autoParamsCompromisso').classList.toggle('hidden',acao!=='compromisso');
  document.getElementById('autoParamsPrioridade').classList.toggle('hidden',acao!=='prioridade');
  document.getElementById('autoParamsNota').classList.toggle('hidden',acao!=='nota');
}
function openAutoModal(id){
  editAutoId=id||null;
  const a=id?automations.find(x=>x.id===id):null;
  document.getElementById('autoModalTitle').textContent=a?'Editar automação':'Nova automação';
  document.getElementById('autoNome').value=a?.nome||'';
  document.getElementById('autoEtapa').value=a?.etapa||'Lead';
  document.getElementById('autoAcao').value=a?.acao||'compromisso';
  const p=a?.params||{};
  document.getElementById('autoCompTipo').value=p.tipo||'Ligação';
  document.getElementById('autoCompPrazo').value=p.prazo!==undefined?String(p.prazo):'2';
  document.getElementById('autoCompNota').value=p.nota||'';
  document.getElementById('autoPriValor').value=p.valor||'Alta';
  document.getElementById('autoNotaTexto').value=p.texto||'';
  toggleAutoParams(document.getElementById('autoAcao').value);
  document.getElementById('autoDelete').classList.toggle('hidden',!a);
  document.getElementById('autoBackdrop').classList.remove('hidden');
}
function closeAutoModal(){document.getElementById('autoBackdrop').classList.add('hidden');}
document.getElementById('autoNewBtn').addEventListener('click',()=>openAutoModal(null));
document.getElementById('autoEmptyNewBtn').addEventListener('click',()=>openAutoModal(null));
document.getElementById('autoModalClose').addEventListener('click',closeAutoModal);
document.getElementById('autoCancelBtn').addEventListener('click',closeAutoModal);
document.getElementById('autoBackdrop').addEventListener('click',e=>{if(e.target===document.getElementById('autoBackdrop'))closeAutoModal();});
document.getElementById('autoAcao').addEventListener('change',e=>toggleAutoParams(e.target.value));
document.getElementById('autoSave').addEventListener('click',()=>{
  const nome=document.getElementById('autoNome').value.trim();if(!nome){document.getElementById('autoNome').focus();return;}
  const acao=document.getElementById('autoAcao').value;
  let params={};
  if(acao==='compromisso') params={tipo:document.getElementById('autoCompTipo').value,prazo:Number(document.getElementById('autoCompPrazo').value),nota:document.getElementById('autoCompNota').value.trim()};
  else if(acao==='prioridade') params={valor:document.getElementById('autoPriValor').value};
  else if(acao==='nota') params={texto:document.getElementById('autoNotaTexto').value.trim()};
  const data={nome,etapa:document.getElementById('autoEtapa').value,acao,params};
  if(editAutoId){const idx=automations.findIndex(a=>a.id===editAutoId);if(idx>-1)automations[idx]={...automations[idx],...data};}
  else automations.push({id:'auto'+Date.now(),ativo:true,...data});
  saveAutomations();closeAutoModal();renderAutomations();showToast(editAutoId?'Automação atualizada':'Automação criada','success');
});
document.getElementById('autoDelete').addEventListener('click',()=>{
  if(!editAutoId)return;automations=automations.filter(a=>a.id!==editAutoId);saveAutomations();closeAutoModal();renderAutomations();showToast('Automação excluída');
});

// ══ RENDER ALL ══
function renderAll(){
  renderBoard();renderLeadsTable();renderClientTable();renderKPIs();renderOverdueList();
}
renderAll();
renderAgenda();
renderAutomations();

// ══ CHAT MODULE ══
const CHAT_KEY='outbounder_chat_v1';
const WA_KEY='outbounder_wa_config';
let waConnected=false;
let waConfig=null;
let activeConvId=null;

const QUICK_REPLIES=[
  {label:'Agendamento',text:'Olá! Gostaria de confirmar nossa reunião agendada. Você ainda consegue neste horário?'},
  {label:'Proposta enviada',text:'Oi! Acabei de enviar a proposta por e-mail. Conseguiu verificar? Fico à disposição para dúvidas!'},
  {label:'Follow-up',text:'Olá, tudo bem? Passando para saber se teve a oportunidade de analisar nossa proposta.'},
  {label:'Primeiro contato',text:'Olá! Sou [nome] da [empresa]. Vi que você pode se interessar pela nossa solução. Podemos conversar 5 minutos?'},
  {label:'Confirmação de dados',text:'Oi! Para prosseguir com o cadastro, poderia confirmar seu e-mail e CNPJ?'},
  {label:'Encerramento',text:'Foi um prazer conversar! Fico à disposição caso tenha qualquer dúvida. Até breve!'},
];

function loadChatData(){
  try{const s=localStorage.getItem(CHAT_KEY);return s?JSON.parse(s):getDefaultConvs();}
  catch(e){return getDefaultConvs();}
}
function saveChatData(data){try{localStorage.setItem(CHAT_KEY,JSON.stringify(data));}catch(e){}}
function loadWaConfig(){try{const s=localStorage.getItem(WA_KEY);return s?JSON.parse(s):null;}catch(e){return null;}}
function saveWaConfig(cfg){try{localStorage.setItem(WA_KEY,JSON.stringify(cfg));}catch(e){}}

function getDefaultConvs(){
  return [
    {id:'c1',name:'Fazenda Aurora',phone:'5511999990001',leadId:'l1',avatar:'FA',unread:2,online:true,messages:[
      {id:'m1',text:'Olá! Recebi a proposta, obrigado!',from:'them',time:'09:15'},
      {id:'m2',text:'Fico feliz! Alguma dúvida sobre os valores?',from:'me',time:'09:17'},
      {id:'m3',text:'Sim, sobre o prazo de implementação...',from:'them',time:'09:20'},
    ]},
    {id:'c2',name:'Tech Solutions',phone:'5511999990002',leadId:'l2',avatar:'TS',unread:0,online:false,messages:[
      {id:'m1',text:'Bom dia! Podemos agendar uma demo?',from:'me',time:'Ontem'},
      {id:'m2',text:'Claro! Quarta às 14h funciona para você?',from:'them',time:'Ontem'},
    ]},
    {id:'c3',name:'Grupo Varejo Plus',phone:'5511999990003',leadId:'l3',avatar:'GV',unread:1,online:true,messages:[
      {id:'m1',text:'Precisamos revisar o contrato antes de fechar.',from:'them',time:'10:42'},
    ]},
  ];
}

let chatData=loadChatData();

function getChatTotalUnread(){return chatData.reduce((s,c)=>s+(c.unread||0),0);}

function updateChatBadge(){
  const n=getChatTotalUnread();
  const badge=document.getElementById('navChatBadge');
  if(badge){badge.textContent=n;badge.style.display=n>0?'':'none';}
}

function renderConversationList(filter=''){
  const list=document.getElementById('chatConversationList');
  if(!list)return;
  const filtered=chatData.filter(c=>c.name.toLowerCase().includes(filter.toLowerCase()));
  list.innerHTML=filtered.length===0?`<div style="padding:24px;text-align:center;font-size:12.5px;color:var(--text-3)">Nenhuma conversa encontrada</div>`:
    filtered.map(c=>`
    <div class="chat-conv-item${c.id===activeConvId?' active':''}" data-conv="${c.id}">
      <div class="chat-conv-avatar">${c.avatar}${c.online?'<span class="chat-conv-online"></span>':''}</div>
      <div class="chat-conv-body">
        <div class="chat-conv-name">${c.name}</div>
        <div class="chat-conv-preview">${c.messages.length?c.messages[c.messages.length-1].text:'Sem mensagens'}</div>
      </div>
      <div class="chat-conv-meta">
        <div class="chat-conv-time">${c.messages.length?c.messages[c.messages.length-1].time:''}</div>
        ${c.unread>0?`<div class="chat-unread-badge">${c.unread}</div>`:''}
      </div>
    </div>`).join('');
  list.querySelectorAll('[data-conv]').forEach(el=>el.addEventListener('click',()=>openConversation(el.dataset.conv)));
}

function openConversation(id){
  activeConvId=id;
  const conv=chatData.find(c=>c.id===id);
  if(!conv)return;
  conv.unread=0;
  saveChatData(chatData);
  updateChatBadge();
  renderConversationList(document.getElementById('chatSearch')?.value||'');
  // show chat area
  document.getElementById('chatEmpty').style.display='none';
  document.getElementById('chatConversationArea').classList.remove('hidden');
  document.getElementById('chatConversationArea').style.display='flex';
  // header
  document.getElementById('chatContactAvatar').textContent=conv.avatar;
  document.getElementById('chatContactName').textContent=conv.name;
  document.getElementById('chatContactSub').textContent=(conv.online?'🟢 Online agora · ':'')+conv.phone;
  // messages
  renderMessages(conv);
  // call/lead buttons
  document.getElementById('chatCallBtn').onclick=()=>window.open('tel:'+conv.phone);
  document.getElementById('chatViewLeadBtn').onclick=()=>{
    const lead=leads.find(l=>l.nome===conv.name);
    if(lead)openDetail(lead.id);else showToast('Lead não encontrado','warn');
  };
}

function renderMessages(conv){
  const container=document.getElementById('chatMessages');
  if(!container)return;
  let lastDate='';
  container.innerHTML=conv.messages.map(m=>{
    const isNew=m.time!==lastDate&&m.time.length<=5;
    lastDate=m.time;
    return `
      <div class="chat-msg ${m.from==='me'?'out':'in'}">${escHtml(m.text)}<div class="chat-msg-time">${m.time}${m.from==='me'?' ✓✓':''}</div></div>`;
  }).join('');
  container.scrollTop=container.scrollHeight;
}

function escHtml(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function sendChatMessage(){
  const input=document.getElementById('chatInput');
  const text=input?.value.trim();
  if(!text||!activeConvId)return;
  const conv=chatData.find(c=>c.id===activeConvId);
  if(!conv)return;
  const now=new Date();
  const time=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  conv.messages.push({id:'m'+Date.now(),text,from:'me',time});
  saveChatData(chatData);
  renderMessages(conv);
  renderConversationList(document.getElementById('chatSearch')?.value||'');
  input.value='';
  input.style.height='auto';
  // simulate reply after 1.5s (demo)
  if(waConnected){
    setTimeout(()=>{
      const replies=['Entendido, vou verificar!','Ok, obrigado!','Pode enviar mais detalhes?','Certo, fico no aguardo.'];
      conv.messages.push({id:'m'+Date.now(),text:replies[Math.floor(Math.random()*replies.length)],from:'them',time:new Date().getHours().toString().padStart(2,'0')+':'+new Date().getMinutes().toString().padStart(2,'0')});
      saveChatData(chatData);
      renderMessages(conv);
    },1500);
  }
}

// Auto-resize textarea
document.getElementById('chatInput')?.addEventListener('input',function(){
  this.style.height='auto';
  this.style.height=Math.min(this.scrollHeight,100)+'px';
});
document.getElementById('chatInput')?.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChatMessage();}
});
document.getElementById('chatSendBtn')?.addEventListener('click',sendChatMessage);

// Search
document.getElementById('chatSearch')?.addEventListener('input',e=>renderConversationList(e.target.value));

// Quick replies
document.getElementById('chatQuickReplies')?.addEventListener('click',()=>{
  const qrList=document.getElementById('qrList');
  qrList.innerHTML=QUICK_REPLIES.map((r,i)=>`<div class="qr-item" data-qr="${i}"><div class="qr-label">${r.label}</div><div class="qr-text">${r.text.substring(0,70)}...</div></div>`).join('');
  qrList.querySelectorAll('[data-qr]').forEach(el=>el.addEventListener('click',()=>{
    const r=QUICK_REPLIES[Number(el.dataset.qr)];
    const input=document.getElementById('chatInput');
    if(input){input.value=r.text;input.style.height='auto';input.style.height=Math.min(input.scrollHeight,100)+'px';input.focus();}
    document.getElementById('quickRepliesBackdrop').classList.add('hidden');
  }));
  document.getElementById('quickRepliesBackdrop').classList.remove('hidden');
});
document.getElementById('qrClose')?.addEventListener('click',()=>document.getElementById('quickRepliesBackdrop').classList.add('hidden'));
document.getElementById('quickRepliesBackdrop')?.addEventListener('click',e=>{if(e.target===document.getElementById('quickRepliesBackdrop'))document.getElementById('quickRepliesBackdrop').classList.add('hidden');});

// ── WhatsApp Connect Modal ──
function updateWaUI(){
  const dot=document.getElementById('waDot');
  const lbl=document.getElementById('waStatusLabel');
  const btn=document.getElementById('waConnectBtn');
  if(waConnected){
    if(dot){dot.style.background='#25d366';}
    if(lbl)lbl.textContent='Conectado';
    if(btn){btn.style.borderColor='#dc2626';btn.style.color='#dc2626';btn.innerHTML=btn.innerHTML.replace('Conectar WhatsApp','Desconectar');}
    document.getElementById('chatWaDisconnected').classList.add('hidden');
    document.getElementById('chatSelectContact').classList.remove('hidden');
  } else {
    if(dot){dot.style.background='#6b7280';}
    if(lbl)lbl.textContent='Desconectado';
    if(btn){btn.style.borderColor='#25d366';btn.style.color='#25d366';btn.innerHTML=btn.innerHTML.replace('Desconectar','Conectar WhatsApp');}
    if(!activeConvId){document.getElementById('chatWaDisconnected').classList.remove('hidden');document.getElementById('chatSelectContact').classList.add('hidden');}
  }
}

document.getElementById('waConnectBtn')?.addEventListener('click',()=>{
  if(waConnected){
    waConnected=false;waConfig=null;saveWaConfig(null);activeConvId=null;
    document.getElementById('chatConversationArea').classList.add('hidden');
    document.getElementById('chatEmpty').style.display='flex';
    updateWaUI();showToast('WhatsApp desconectado');
  } else {
    document.getElementById('waStep1').classList.remove('hidden');
    document.getElementById('waStep2Api').classList.add('hidden');
    document.getElementById('waStep1Foot').classList.remove('hidden');
    document.getElementById('waConnectBackdrop').classList.remove('hidden');
  }
});
document.getElementById('waConnectClose')?.addEventListener('click',()=>document.getElementById('waConnectBackdrop').classList.add('hidden'));
document.getElementById('waConnectCancelBtn')?.addEventListener('click',()=>document.getElementById('waConnectBackdrop').classList.add('hidden'));
document.getElementById('waConnectBackdrop')?.addEventListener('click',e=>{if(e.target===document.getElementById('waConnectBackdrop'))document.getElementById('waConnectBackdrop').classList.add('hidden');});

document.getElementById('waOptionWeb')?.addEventListener('click',()=>{
  window.open('https://web.whatsapp.com','_blank');
  waConnected=true;waConfig={type:'web'};saveWaConfig(waConfig);
  document.getElementById('waConnectBackdrop').classList.add('hidden');
  updateWaUI();
  renderConversationList();
  showToast('WhatsApp Web aberto — conexão simulada ✓','success');
});

document.getElementById('waOptionApi')?.addEventListener('click',()=>{
  document.getElementById('waStep1').classList.add('hidden');
  document.getElementById('waStep2Api').classList.remove('hidden');
  document.getElementById('waStep1Foot').classList.add('hidden');
  // show webhook url
  document.getElementById('waWebhookUrl').textContent=window.location.origin+'/api/webhook/whatsapp';
});
document.getElementById('waBackBtn')?.addEventListener('click',()=>{
  document.getElementById('waStep1').classList.remove('hidden');
  document.getElementById('waStep2Api').classList.add('hidden');
  document.getElementById('waStep1Foot').classList.remove('hidden');
});
document.getElementById('waSaveApiBtn')?.addEventListener('click',()=>{
  const url=document.getElementById('waApiUrl').value.trim();
  const token=document.getElementById('waApiToken').value.trim();
  const instance=document.getElementById('waApiInstance').value.trim();
  const provider=document.getElementById('waProvider').value;
  if(!url||!token){showToast('Preencha URL e Token','warn');return;}
  waConfig={type:'api',provider,url,token,instance};saveWaConfig(waConfig);
  waConnected=true;
  document.getElementById('waConnectBackdrop').classList.add('hidden');
  updateWaUI();
  renderConversationList();
  showToast('API WhatsApp configurada com sucesso!','success');
});

// Init chat on load
(function initChat(){
  waConfig=loadWaConfig();
  waConnected=!!waConfig;
  updateChatBadge();
  updateWaUI();
  renderConversationList();
  if(waConnected&&chatData.length)openConversation(chatData[0].id);
})();

// ══ GOOGLE CALENDAR MODULE ══
const GCAL_KEY='outbounder_gcal';
let gcalConnected=false;
let gcalEmail='';

function loadGcalState(){
  try{const s=localStorage.getItem(GCAL_KEY);const d=s?JSON.parse(s):null;if(d){gcalConnected=d.connected;gcalEmail=d.email||'';}
  }catch(e){}
}
function saveGcalState(){try{localStorage.setItem(GCAL_KEY,JSON.stringify({connected:gcalConnected,email:gcalEmail}));}catch(e){}}

function updateGcalUI(){
  const btn=document.getElementById('gcalConnectBtn');
  if(!btn)return;
  if(gcalConnected){
    btn.style.borderColor='#16a34a';btn.style.color='#16a34a';
    btn.innerHTML='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#16a34a" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Google Calendar ✓';
    document.getElementById('gcalDisconnected').classList.add('hidden');
    document.getElementById('gcalConnected').classList.remove('hidden');
    document.getElementById('gcalEmailLabel').textContent=gcalEmail||'Conta conectada';
  } else {
    btn.style.borderColor='#4285f4';btn.style.color='#4285f4';
    btn.innerHTML='<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#4285f4" stroke-width="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#4285f4" stroke-width="1.8"/></svg> Google Calendar';
    document.getElementById('gcalDisconnected').classList.remove('hidden');
    document.getElementById('gcalConnected').classList.add('hidden');
  }
}

document.getElementById('gcalConnectBtn')?.addEventListener('click',()=>{
  updateGcalUI();
  document.getElementById('gcalBackdrop').classList.remove('hidden');
});
document.getElementById('gcalClose')?.addEventListener('click',()=>document.getElementById('gcalBackdrop').classList.add('hidden'));
document.getElementById('gcalBackdrop')?.addEventListener('click',e=>{if(e.target===document.getElementById('gcalBackdrop'))document.getElementById('gcalBackdrop').classList.add('hidden');});

document.getElementById('gcalAuthBtn')?.addEventListener('click',()=>{
  // Simula fluxo OAuth — em produção, redirecionar para accounts.google.com/o/oauth2/auth
  const emails=['usuario@gmail.com','contato@empresa.com'];
  gcalEmail=emails[Math.floor(Math.random()*emails.length)];
  gcalConnected=true;saveGcalState();
  updateGcalUI();
  showToast('Google Calendar conectado!','success');
  document.getElementById('gcalSyncLog').textContent='Conectado em '+new Date().toLocaleString('pt-BR')+'. Nenhum evento exportado ainda.';
});

document.getElementById('gcalDisconnectBtn')?.addEventListener('click',()=>{
  gcalConnected=false;gcalEmail='';saveGcalState();
  updateGcalUI();
  document.getElementById('gcalBackdrop').classList.add('hidden');
  showToast('Google Calendar desconectado');
});

document.getElementById('gcalExportBtn')?.addEventListener('click',()=>{
  if(!gcalConnected){showToast('Conecte o Google Calendar primeiro','warn');return;}
  const count=agEvents.length;
  const log=document.getElementById('gcalSyncLog');
  if(count===0){if(log)log.textContent='Nenhum compromisso para exportar.';showToast('Nenhum compromisso na agenda','warn');return;}
  // Monta URL para criar evento no Google Calendar (abre em nova aba para cada evento — demo)
  // Em produção, usar Google Calendar API v3 com OAuth token
  const ev=agEvents[0];
  const start=ev.data+'T'+(ev.hora||'09:00')+':00';
  const end=ev.data+'T'+(ev.hora?String(Number(ev.hora.split(':')[0])+1).padStart(2,'0')+':00':'10:00:00');
  const title=encodeURIComponent('[CRM] '+ev.leadNome+' — '+ev.tipo);
  const details=encodeURIComponent(ev.notas||'Compromisso gerado pelo Outbounder CRM');
  const gcalUrl=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start.replace(/[-:]/g,'')}/${end.replace(/[-:]/g,'')}&details=${details}`;
  window.open(gcalUrl,'_blank');
  if(log)log.innerHTML=`<strong>${count} compromisso(s)</strong> exportados em ${new Date().toLocaleString('pt-BR')}.<br><span style="font-size:11px">O Google Calendar foi aberto em nova aba para confirmar cada evento.</span>`;
  showToast(`${count} compromisso(s) exportados para o Google Calendar!`,'success');
});

// Patch agEventSave to also sync with Google Calendar if connected
const origAgEventSave=document.getElementById('agEventSave');
if(origAgEventSave){
  origAgEventSave.addEventListener('click',()=>{
    setTimeout(()=>{
      if(gcalConnected&&agEvents.length>0){
        const ev=agEvents[agEvents.length-1];
        const log=document.getElementById('gcalSyncLog');
        if(log)log.textContent='Último evento sincronizado: '+ev.leadNome+' ('+ev.data+') em '+new Date().toLocaleString('pt-BR');
      }
    },300);
  });
}

loadGcalState();
updateGcalUI();
updateChatBadge();

// ══ CHIP STYLE ══
(function(){const s=document.createElement('style');s.textContent='.chip{display:inline-flex;align-items:center;padding:5px 13px;border-radius:999px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);font-size:12px;font-weight:500;cursor:pointer;transition:all .12s;white-space:nowrap}.chip:hover,.chip.active{background:var(--navy);border-color:var(--navy);color:#fff}[data-theme="dark"] .chip:hover,[data-theme="dark"] .chip.active{background:var(--blue);border-color:var(--blue)}.stat-icon.red{background:#fee2e2;color:#dc2626}';document.head.appendChild(s);})();

// ══ PLAYBOOKS ══
const PB_KEY='outbounder_playbooks';
const PB_DEFAULT=[
  {id:'pb1',nome:'Cold Outbound Agronegócio',objetivo:'Prospectar fazendas com mais de 500ha para apresentar solução de rastreamento',categoria:'Outbound',responsavel:'Time Comercial',
   checklist:[{id:'ck1',titulo:'Pesquisar o lead no LinkedIn',prazo:0,resp:'SDR',obrig:true},{id:'ck2',titulo:'Validar telefone e e-mail',prazo:0,resp:'SDR',obrig:true},{id:'ck3',titulo:'Enviar e-mail de primeiro contato',prazo:1,resp:'SDR',obrig:true},{id:'ck4',titulo:'Ligar para confirmar recebimento',prazo:2,resp:'SDR',obrig:true},{id:'ck5',titulo:'Agendar call de diagnóstico',prazo:3,resp:'Closer',obrig:false}],
   scripts:{ligacao:'Olá [NOME], aqui é [SEU NOME] da [EMPRESA]. Você tem 2 minutos? Estou entrando em contato porque trabalhamos com fazendas na sua região e vi que vocês podem ter interesse em reduzir perdas no campo com rastreamento inteligente...',whatsapp:'Oi [NOME], tudo bem? Sou [SEU NOME] da [EMPRESA]. Trabalhamos com rastreamento de ativos para fazendas e acredito que podemos ajudar a [FAZENDA]. Posso te mostrar como em 15 minutos?',email:'Assunto: Como fazendas como a sua reduziram 30% das perdas\n\nOlá [NOME],\n\nTrabalhamos com [benefício principal] e vi que a [FAZENDA] pode se beneficiar...',reuniao:'Abertura (2min): agradecer tempo, confirmar agenda.\nDiagnóstico (10min): SPIN.\nApresentação (15min): focar no problema levantado.\nFechamento (5min): proposta de próximo passo.'},
   materiais:[{nome:'Apresentação Institucional',tipo:'PDF',url:'#'},{nome:'Vídeo de Demonstração',tipo:'Vídeo',url:'#'},{nome:'Caso de Sucesso Fazenda Aurora',tipo:'PDF',url:'#'}],
   automacoes:['Criar tarefa de follow-up ao passar para Contato','Agendar reunião automática ao chegar em Proposta','Notificar gestor ao fechar negócio']},
  {id:'pb2',nome:'Inbound SaaS — Demo Request',objetivo:'Converter leads que pediram demo em clientes pagantes',categoria:'Inbound',responsavel:'Closer',
   checklist:[{id:'ck1',titulo:'Confirmar recebimento em até 1h',prazo:0,resp:'SDR',obrig:true},{id:'ck2',titulo:'Qualificar lead (BANT)',prazo:0,resp:'SDR',obrig:true},{id:'ck3',titulo:'Agendar demo personalizada',prazo:1,resp:'Closer',obrig:true},{id:'ck4',titulo:'Enviar proposta após demo',prazo:2,resp:'Closer',obrig:true}],
   scripts:{ligacao:'Olá [NOME], vi que você pediu uma demo! Você tem 5 minutos agora para eu entender melhor sua necessidade e preparar uma apresentação personalizada?',whatsapp:'Oi [NOME]! Vi que você solicitou a demo. Adoraria te mostrar como a plataforma pode ajudar o [EMPRESA]. Quando você teria 30 minutos esta semana?',email:'Assunto: Sua demo está pronta, [NOME]!\n\nObrigado pelo interesse! Preparei uma demonstração personalizada para o [EMPRESA]...',reuniao:'Boas-vindas (2min) → Entendimento do cenário atual (10min) → Demo focada na dor (20min) → Q&A (10min) → Próximo passo (5min)'},
   materiais:[{nome:'Deck de Demo',tipo:'Apresentação',url:'#'},{nome:'Proposta Comercial Template',tipo:'PDF',url:'#'}],
   automacoes:['Enviar e-mail de confirmação automática','Criar compromisso de demo na agenda']},
  {id:'pb3',nome:'Reativação de Leads Frios',objetivo:'Retomar contato com leads inativos há mais de 30 dias',categoria:'Reativação',responsavel:'SDR',
   checklist:[{id:'ck1',titulo:'Filtrar leads inativos há +30 dias',prazo:0,resp:'SDR',obrig:true},{id:'ck2',titulo:'Verificar último contato e motivo',prazo:0,resp:'SDR',obrig:true},{id:'ck3',titulo:'Enviar mensagem de reativação',prazo:1,resp:'SDR',obrig:true},{id:'ck4',titulo:'Ligar caso sem resposta em 48h',prazo:3,resp:'SDR',obrig:false}],
   scripts:{ligacao:'Olá [NOME], aqui é [SEU NOME] da [EMPRESA] novamente. Passaram alguns meses e queria saber se o cenário mudou. Vocês ainda têm [DOR IDENTIFICADA]?',whatsapp:'Oi [NOME], passando para um rápido oi. Algumas coisas mudaram por aqui que acredito que podem te interessar. Tem 5 minutos essa semana?',email:'Assunto: Algo mudou desde a última vez que conversamos?\n\nOlá [NOME], espero que esteja bem...',reuniao:'Reapresentação (3min) → O que mudou desde o último contato (5min) → Nova proposta de valor (10min) → Proposta revisada (5min)'},
   materiais:[{nome:'Cases recentes de sucesso',tipo:'PDF',url:'#'}],
   automacoes:['Criar tarefa de follow-up após 48h sem resposta']},
];
let playbooks=JSON.parse(localStorage.getItem(PB_KEY)||'null')||JSON.parse(JSON.stringify(PB_DEFAULT));
function savePB(){try{localStorage.setItem(PB_KEY,JSON.stringify(playbooks));}catch(e){}}
let editPbId=null,activePbTab='checklist';
const CAT_COLORS={Outbound:'#2563eb',Inbound:'#16a34a',Fechamento:'#7c3aed',Reativação:'#d97706',Outro:'#6b7280'};

function renderPB(cat){
  const grid=document.getElementById('pbGrid');if(!grid)return;
  const list=cat?playbooks.filter(p=>p.categoria===cat):playbooks;
  if(!list.length){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-3)">Nenhum playbook. <button class="btn btn-sm btn-primary" style="margin-left:8px" onclick="openPbModal(null)">Criar primeiro</button></div>';return;}
  grid.innerHTML=list.map(p=>{
    const cc=CAT_COLORS[p.categoria]||'#6b7280';
    return '<div class="pb-card">'+
      '<div class="pb-card-top"><div class="pb-cat-badge" style="background:'+cc+'22;color:'+cc+'">'+p.categoria+'</div><div class="pb-name">'+p.nome+'</div><div class="pb-obj">'+(p.objetivo||'')+'</div></div>'+
      '<div class="pb-card-body">'+
        '<div class="pb-stat"><span>Tarefas</span><strong>'+(p.checklist||[]).length+'</strong></div>'+
        '<div class="pb-stat"><span>Materiais</span><strong>'+(p.materiais||[]).length+'</strong></div>'+
        '<div class="pb-stat"><span>Responsável</span><strong>'+(p.responsavel||'—')+'</strong></div>'+
      '</div>'+
      '<div class="pb-card-foot"><button class="btn btn-sm btn-primary" data-pb-open="'+p.id+'" style="flex:1;justify-content:center">Abrir</button><button class="btn btn-sm" data-pb-edit="'+p.id+'">Editar</button></div>'+
    '</div>';
  }).join('');
  grid.querySelectorAll('[data-pb-open]').forEach(el=>el.addEventListener('click',()=>openPbDetail(el.dataset.pbOpen)));
  grid.querySelectorAll('[data-pb-edit]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();openPbModal(el.dataset.pbEdit);}));
}

function openPbDetail(id){
  const pb=playbooks.find(p=>p.id===id);if(!pb)return;
  document.getElementById('pbDetailTitle').textContent=pb.nome;
  const cc=CAT_COLORS[pb.categoria]||'#6b7280';
  document.getElementById('pbDetailMeta').innerHTML='<span class="pb-cat-badge" style="background:'+cc+'22;color:'+cc+'">'+pb.categoria+'</span><span style="font-size:11px;color:var(--text-3)">Responsável: '+(pb.responsavel||'—')+'</span>';
  activePbTab='checklist';
  document.querySelectorAll('[data-pb-tab]').forEach(b=>b.classList.toggle('active',b.dataset.pbTab==='checklist'));
  renderPbTab(pb);
  document.getElementById('pbDetailBackdrop').classList.remove('hidden');
}

function renderPbTab(pb){
  const tabs=['checklist','scripts','materiais','automacoes'];
  tabs.forEach(t=>{const el=document.getElementById('pbTab'+t.charAt(0).toUpperCase()+t.slice(1));if(el)el.classList.toggle('hidden',t!==activePbTab);});
  if(activePbTab==='checklist'){
    document.getElementById('pbChecklistItems').innerHTML=(pb.checklist||[]).map((c,i)=>
      '<div class="checklist-item"><div class="checklist-num">'+(i+1)+'</div><div class="checklist-body"><div class="checklist-title">'+c.titulo+(c.obrig?'<span style="color:#dc2626;margin-left:4px">*</span>':'')+'</div><div class="checklist-meta"><span>👤 '+c.resp+'</span><span>⏱ '+(c.prazo===0?'No mesmo dia':c.prazo+'d após início')+'</span></div></div></div>'
    ).join('');
  } else if(activePbTab==='scripts'){
    const s=pb.scripts||{};
    const ch=[['ligacao','📞 Ligação','#2563eb'],['whatsapp','💬 WhatsApp','#25d366'],['email','✉️ E-mail','#d97706'],['reuniao','🎯 Reunião','#7c3aed']];
    document.getElementById('pbScriptItems').innerHTML=ch.map(([k,lbl,col])=>'<div class="script-block"><div class="script-channel" style="color:'+col+'">'+lbl+'</div><div class="script-text">'+(s[k]||'Script não cadastrado.')+'</div></div>').join('');
  } else if(activePbTab==='materiais'){
    const mats=pb.materiais||[];
    const icons={PDF:'📄',Vídeo:'🎬',Apresentação:'📊',Link:'🔗'};
    const cols={PDF:'#fee2e2',Vídeo:'#ede9fe',Apresentação:'#dbeafe',Link:'#dcfce7'};
    document.getElementById('pbMateriaisItems').innerHTML=mats.length?mats.map(m=>'<div class="material-item"><div class="material-icon" style="background:'+(cols[m.tipo]||'#f3f4f6')+'">'+(icons[m.tipo]||'📎')+'</div><div><div class="material-name">'+m.nome+'</div><div class="material-type">'+m.tipo+'</div></div></div>').join(''):'<div style="color:var(--text-3);font-size:12.5px">Nenhum material.</div>';
  } else if(activePbTab==='automacoes'){
    document.getElementById('pbAutomacoesItems').innerHTML=(pb.automacoes||[]).map(a=>'<div class="checklist-item"><div style="width:28px;height:28px;border-radius:7px;background:#eff6ff;display:flex;align-items:center;justify-content:center;font-size:16px">⚡</div><div class="checklist-body"><div class="checklist-title">'+a+'</div></div></div>').join('');
  }
}

document.querySelectorAll('[data-pb-tab]').forEach(b=>b.addEventListener('click',()=>{
  activePbTab=b.dataset.pbTab;
  document.querySelectorAll('[data-pb-tab]').forEach(x=>x.classList.toggle('active',x.dataset.pbTab===activePbTab));
  const title=document.getElementById('pbDetailTitle').textContent;
  const pb=playbooks.find(p=>p.nome===title);if(pb)renderPbTab(pb);
}));
document.getElementById('pbDetailClose')?.addEventListener('click',()=>document.getElementById('pbDetailBackdrop').classList.add('hidden'));
document.getElementById('pbDetailBackdrop')?.addEventListener('click',e=>{if(e.target===e.currentTarget)document.getElementById('pbDetailBackdrop').classList.add('hidden');});

function openPbModal(id){
  editPbId=id||null;const pb=id?playbooks.find(p=>p.id===id):null;
  document.getElementById('pbModalTitle').textContent=pb?'Editar playbook':'Novo playbook';
  document.getElementById('pbNome').value=pb?.nome||'';
  document.getElementById('pbObjetivo').value=pb?.objetivo||'';
  document.getElementById('pbCategoria').value=pb?.categoria||'Outbound';
  document.getElementById('pbResponsavel').value=pb?.responsavel||'';
  document.getElementById('pbModalDelete').classList.toggle('hidden',!pb);
  document.getElementById('pbModalBackdrop').classList.remove('hidden');
}
document.getElementById('pbNewBtn')?.addEventListener('click',()=>openPbModal(null));
document.getElementById('pbModalClose')?.addEventListener('click',()=>document.getElementById('pbModalBackdrop').classList.add('hidden'));
document.getElementById('pbModalCancel')?.addEventListener('click',()=>document.getElementById('pbModalBackdrop').classList.add('hidden'));
document.getElementById('pbModalBackdrop')?.addEventListener('click',e=>{if(e.target===e.currentTarget)document.getElementById('pbModalBackdrop').classList.add('hidden');});
document.getElementById('pbModalDelete')?.addEventListener('click',()=>{if(!editPbId)return;playbooks=playbooks.filter(p=>p.id!==editPbId);savePB();renderPB();document.getElementById('pbModalBackdrop').classList.add('hidden');showToast('Playbook excluído');});
document.getElementById('pbModalSave')?.addEventListener('click',()=>{
  const nome=document.getElementById('pbNome').value.trim();if(!nome){document.getElementById('pbNome').focus();return;}
  const data={id:editPbId||'pb'+Date.now(),nome,objetivo:document.getElementById('pbObjetivo').value,categoria:document.getElementById('pbCategoria').value,responsavel:document.getElementById('pbResponsavel').value,checklist:[],scripts:{},materiais:[],automacoes:[]};
  if(editPbId){const idx=playbooks.findIndex(p=>p.id===editPbId);if(idx>-1){data.checklist=playbooks[idx].checklist;data.scripts=playbooks[idx].scripts;data.materiais=playbooks[idx].materiais;data.automacoes=playbooks[idx].automacoes;playbooks[idx]=data;}}
  else playbooks.push(data);
  savePB();renderPB();document.getElementById('pbModalBackdrop').classList.add('hidden');showToast(editPbId?'Atualizado':'Playbook criado','success');
});
document.querySelectorAll('[data-pb-cat]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-pb-cat]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderPB(b.dataset.pbCat||undefined);
}));

// ══ OBJEÇÕES ══
const OBJ_KEY='outbounder_objecoes';
const OBJ_DEFAULT=[
  {id:'obj1',texto:'"Está muito caro"',categoria:'Preço',freq:'alta',prioridade:'alta',resposta:'Entendo que o investimento é uma preocupação. Mas vamos olhar pelo ROI: em média nossos clientes recuperam o valor em 3 meses. Posso te mostrar como funciona?',respostaAlt:'Você tem razão, não é o mais barato — mas comparando com a perda atual de [X], o investimento se paga em [Y] meses.',args:['ROI em 90 dias','Garantia de 30 dias','Suporte incluso'],exemplo:'A Fazenda Aurora tinha a mesma objeção e fechou após calcular as perdas mensais.',taxa:78,abordagem:'Mostrar ROI antes de falar em preço'},
  {id:'obj2',texto:'"Já tenho um fornecedor"',categoria:'Concorrência',freq:'alta',prioridade:'alta',resposta:'Que legal! Qual solução você usa hoje? Pergunto porque às vezes complementamos muito bem o que já existe, e vários de nossos melhores clientes vieram de outros fornecedores.',respostaAlt:'Entendo! O que te levaria a considerar uma mudança ou comparação?',args:['Integração com outras ferramentas','Migração gratuita','Período de comparação'],exemplo:'Tech Solutions migrou após comparar resultados por 30 dias.',taxa:65,abordagem:'Curiosidade genuína + proposta de comparação'},
  {id:'obj3',texto:'"Agora não é o momento"',categoria:'Tempo',freq:'media',prioridade:'media',resposta:'Entendo! Quando seria o melhor momento? Pergunto porque [DOR] geralmente piora com o tempo — o custo de esperar pode ser maior que o custo de agir agora.',respostaAlt:'Faz sentido. O que precisa acontecer para este tema ser prioridade?',args:['Custo do adiamento','Facilidade de implementação'],exemplo:'',taxa:55,abordagem:'Calcular custo da inação'},
  {id:'obj4',texto:'"Preciso consultar o sócio"',categoria:'Autoridade',freq:'media',prioridade:'alta',resposta:'Claro, faz todo sentido! Posso preparar um material resumido com ROI e casos de sucesso para ajudar nessa conversa interna?',respostaAlt:'Ótimo! Quando vocês se reúnem? Posso montar uma proposta executiva para facilitar a aprovação.',args:['Proposta executiva','ROI documentado','Cases do segmento'],exemplo:'',taxa:70,abordagem:'Oferecer material para reunião interna'},
];
let objecoes=JSON.parse(localStorage.getItem(OBJ_KEY)||'null')||JSON.parse(JSON.stringify(OBJ_DEFAULT));
function saveObj(){try{localStorage.setItem(OBJ_KEY,JSON.stringify(objecoes));}catch(e){}}
let editObjId=null;
const FREQ_COLORS={alta:'#dc2626',media:'#d97706',baixa:'#16a34a'};

function renderObj(cat,q){
  const grid=document.getElementById('objGrid');if(!grid)return;
  let list=objecoes;
  if(cat)list=list.filter(o=>o.categoria===cat);
  if(q)list=list.filter(o=>o.texto.toLowerCase().includes(q.toLowerCase())||o.resposta.toLowerCase().includes(q.toLowerCase()));
  if(!list.length){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-3)">Nenhuma objeção encontrada.</div>';return;}
  grid.innerHTML=list.map(o=>{
    const fc=FREQ_COLORS[o.freq]||'#6b7280';
    return '<div class="obj-card">'+
      '<div class="obj-card-head"><div class="obj-title">'+o.texto+'</div><div style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:4px"><span style="font-size:10px;font-weight:700;color:'+fc+'">● '+(o.freq==='alta'?'Alta':o.freq==='media'?'Média':'Baixa')+' freq.</span><span style="font-size:10px;background:var(--surface-2);border:1px solid var(--border);border-radius:5px;padding:1px 7px;color:var(--text-3)">'+o.categoria+'</span></div></div>'+
      '<div class="obj-body">'+
        '<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:5px">Resposta principal</div><div class="obj-response">'+o.resposta+'</div></div>'+
        (o.respostaAlt?'<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:5px">Alternativa</div><div class="obj-response alt">'+o.respostaAlt+'</div></div>':'')  +
        ((o.args||[]).length?'<div class="obj-args">'+(o.args||[]).map(a=>'<span class="obj-arg">'+a+'</span>').join('')+'</div>':'')+
        '<div style="display:flex;align-items:center;justify-content:space-between">'+
          '<div class="success-rate" style="flex:1;margin-right:10px"><span style="font-size:11px;color:var(--text-3);white-space:nowrap">Sucesso</span><div class="success-bar" style="margin:0 8px"><div class="success-fill" style="width:'+(o.taxa||0)+'%"></div></div><strong style="font-size:11px">'+(o.taxa||0)+'%</strong></div>'+
          '<button class="btn btn-xs" data-obj-edit="'+o.id+'">Editar</button>'+
        '</div>'+
        (o.abordagem?'<div style="font-size:11.5px;color:var(--text-3)">💡 <strong>Melhor abordagem:</strong> '+o.abordagem+'</div>':'')+
      '</div>'+
    '</div>';
  }).join('');
  grid.querySelectorAll('[data-obj-edit]').forEach(b=>b.addEventListener('click',()=>openObjModal(b.dataset.objEdit)));
}

function openObjModal(id){
  editObjId=id||null;const o=id?objecoes.find(x=>x.id===id):null;
  document.getElementById('objModalTitle').textContent=o?'Editar objeção':'Nova objeção';
  document.getElementById('objTexto').value=o?.texto||'';
  document.getElementById('objCat').value=o?.categoria||'Preço';
  document.getElementById('objFreq').value=o?.freq||'media';
  document.getElementById('objPri').value=o?.prioridade||'media';
  document.getElementById('objResp').value=o?.resposta||'';
  document.getElementById('objRespAlt').value=o?.respostaAlt||'';
  document.getElementById('objArgs').value=(o?.args||[]).join(', ');
  document.getElementById('objExemplo').value=o?.exemplo||'';
  document.getElementById('objTaxa').value=o?.taxa||'';
  document.getElementById('objAbord').value=o?.abordagem||'';
  document.getElementById('objModalDelete').classList.toggle('hidden',!o);
  document.getElementById('objModalBackdrop').classList.remove('hidden');
}
document.getElementById('objNewBtn')?.addEventListener('click',()=>openObjModal(null));
document.getElementById('objModalClose')?.addEventListener('click',()=>document.getElementById('objModalBackdrop').classList.add('hidden'));
document.getElementById('objModalCancel')?.addEventListener('click',()=>document.getElementById('objModalBackdrop').classList.add('hidden'));
document.getElementById('objModalBackdrop')?.addEventListener('click',e=>{if(e.target===e.currentTarget)document.getElementById('objModalBackdrop').classList.add('hidden');});
document.getElementById('objSearch')?.addEventListener('input',e=>renderObj(document.querySelector('[data-obj-cat].active')?.dataset.objCat||'',e.target.value));
document.querySelectorAll('[data-obj-cat]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-obj-cat]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderObj(b.dataset.objCat||undefined,document.getElementById('objSearch')?.value||'');}));
document.getElementById('objModalDelete')?.addEventListener('click',()=>{if(!editObjId)return;objecoes=objecoes.filter(o=>o.id!==editObjId);saveObj();renderObj();document.getElementById('objModalBackdrop').classList.add('hidden');showToast('Objeção excluída');});
document.getElementById('objModalSave')?.addEventListener('click',()=>{
  const texto=document.getElementById('objTexto').value.trim();if(!texto)return;
  const data={id:editObjId||'obj'+Date.now(),texto,categoria:document.getElementById('objCat').value,freq:document.getElementById('objFreq').value,prioridade:document.getElementById('objPri').value,resposta:document.getElementById('objResp').value,respostaAlt:document.getElementById('objRespAlt').value,args:document.getElementById('objArgs').value.split(',').map(s=>s.trim()).filter(Boolean),exemplo:document.getElementById('objExemplo').value,taxa:Number(document.getElementById('objTaxa').value)||0,abordagem:document.getElementById('objAbord').value};
  if(editObjId){const idx=objecoes.findIndex(o=>o.id===editObjId);if(idx>-1)objecoes[idx]=data;}else objecoes.push(data);
  saveObj();renderObj();document.getElementById('objModalBackdrop').classList.add('hidden');showToast(editObjId?'Atualizada':'Objeção criada','success');
});

// ══ MOTIVOS DE PERDA ══
const PERDA_KEY='outbounder_perdas';
const PERDA_DEFAULT=[
  {id:'p1',lead:'Grupo Varejo Plus',resp:'Ana Costa',motivo:'Preço alto',submotivo:'Orçamento 40% menor',categoria:'Preço',concorrente:'SoftVendas',valor:18000,etapa:'Proposta',comentarios:'Cliente adorou o produto mas budget não comportou.',melhorias:'Criar plano básico com menor custo de entrada.',dataReativ:'2026-03-01',prob:'media',estrategia:'Oferecer plano menor + upgrade em 6 meses'},
  {id:'p2',lead:'TechFarm Ltda',resp:'Carlos Souza',motivo:'Escolheu concorrente',submotivo:'Concorrente tinha integração com ERP',categoria:'Concorrência',concorrente:'AgroSys',valor:32000,etapa:'Fechamento',comentarios:'Perdemos na reta final por falta de integração com Totvs.',melhorias:'Priorizar integração com ERPs populares.',dataReativ:'2026-06-01',prob:'alta',estrategia:'Avisar quando integração Totvs estiver pronta'},
  {id:'p3',lead:'Distribuidora Sul',resp:'Pedro Lima',motivo:'Timing errado',submotivo:'Reorg interna congelou projetos',categoria:'Timing',concorrente:'',valor:9500,etapa:'Contato',comentarios:'Empresa passando por reestruturação.',melhorias:'Identificar sinais de reorg antes de avançar no funil.',dataReativ:'2026-04-15',prob:'alta',estrategia:'Retomar quando reorg finalizar'},
];
let perdas=JSON.parse(localStorage.getItem(PERDA_KEY)||'null')||JSON.parse(JSON.stringify(PERDA_DEFAULT));
function savePerdas(){try{localStorage.setItem(PERDA_KEY,JSON.stringify(perdas));}catch(e){}}
let editPerdaId=null;

function renderPerdas(){
  const total=perdas.length;
  const valor=perdas.reduce((s,p)=>s+(p.valor||0),0);
  const reativ=perdas.filter(p=>p.prob==='alta'||p.prob==='media').length;
  const motivos={};perdas.forEach(p=>{motivos[p.motivo]=(motivos[p.motivo]||0)+1;});
  const top=Object.entries(motivos).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('perdaKpiTotal').textContent=total;
  document.getElementById('perdaKpiValor').textContent='R$'+valor.toLocaleString('pt-BR');
  document.getElementById('perdaKpiReativ').textContent=reativ;
  document.getElementById('perdaKpiPrincipal').textContent=top?top[0]:'—';
  const fc=document.getElementById('perdaFreqChart');
  if(fc){const sorted=Object.entries(motivos).sort((a,b)=>b[1]-a[1]).slice(0,5);const mx=sorted[0]?.[1]||1;fc.innerHTML=sorted.map(([m,n])=>'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="font-size:12px;color:var(--text-2);min-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+m+'</div><div style="flex:1;height:8px;border-radius:4px;background:var(--surface-3);overflow:hidden"><div style="height:100%;border-radius:4px;background:#dc2626;width:'+((n/mx)*100).toFixed(0)+'%"></div></div><strong style="font-size:11px;min-width:16px;text-align:right">'+n+'</strong></div>').join('');}
  const rl=document.getElementById('perdaReativList');
  if(rl){const hoje=new Date();const prazo=perdas.filter(p=>p.dataReativ&&new Date(p.dataReativ)<=new Date(hoje.getFullYear(),hoje.getMonth()+2,hoje.getDate())).sort((a,b)=>new Date(a.dataReativ)-new Date(b.dataReativ));rl.innerHTML=prazo.length?prazo.slice(0,4).map(p=>'<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--text)">'+p.lead+'</div><div style="font-size:11px;color:var(--text-3)">'+(p.dataReativ?fmtDate(p.dataReativ):'—')+' · '+(p.estrategia||'—')+'</div></div><span style="padding:3px 8px;border-radius:5px;font-size:10.5px;font-weight:700;background:'+(p.prob==='alta'?'#dcfce7':p.prob==='media'?'#fef9c3':'#fee2e2')+';color:'+(p.prob==='alta'?'#166534':p.prob==='media'?'#854d0e':'#991b1b')+'">'+(p.prob==='alta'?'🔥 Alta':p.prob==='media'?'⚡ Média':'❄️ Baixa')+'</span></div>').join(''):'<div style="text-align:center;padding:20px;color:var(--text-3);font-size:12.5px">Nenhuma reativação próxima</div>';}
  const pl=document.getElementById('perdaList');
  if(pl){pl.innerHTML=perdas.length?perdas.map(p=>'<div class="perda-card"><div class="perda-head"><div class="perda-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg></div><div style="flex:1"><div class="perda-motivo">'+p.lead+'</div><div class="perda-sub">'+p.motivo+(p.submotivo?' · '+p.submotivo:'')+'</div></div><div style="display:flex;gap:6px;align-items:center"><span style="font-size:12px;font-weight:700;color:#dc2626">-R$'+(p.valor||0).toLocaleString('pt-BR')+'</span><button class="btn btn-xs" data-perda-edit="'+p.id+'">Editar</button></div></div><div class="perda-body"><div class="perda-section"><div class="perda-section-title">Informações</div><div class="perda-field"><label>Concorrente</label><p>'+(p.concorrente||'—')+'</p></div><div class="perda-field"><label>Etapa</label><p>'+(p.etapa||'—')+'</p></div><div class="perda-field"><label>Responsável</label><p>'+(p.resp||'—')+'</p></div></div><div class="perda-section"><div class="perda-section-title">Análise</div><div class="perda-field"><label>Aprendizado</label><p>'+(p.comentarios||'—')+'</p></div><div class="perda-field"><label>Melhoria sugerida</label><p>'+(p.melhorias||'—')+'</p></div></div><div class="perda-section"><div class="perda-section-title">Reativação</div><div class="perda-field"><label>Contato em</label><p>'+(p.dataReativ?fmtDate(p.dataReativ):'—')+'</p></div><div class="perda-field"><label>Estratégia</label><p>'+(p.estrategia||'—')+'</p></div><div style="margin-top:6px"><span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;background:'+(p.prob==='alta'?'#dcfce7':p.prob==='media'?'#fef9c3':'#fee2e2')+';color:'+(p.prob==='alta'?'#166534':p.prob==='media'?'#854d0e':'#991b1b')+'">'+(p.prob==='alta'?'🔥 Alta prob.':p.prob==='media'?'⚡ Média':'❄️ Baixa')+'</span></div></div></div></div>').join(''):'<div style="text-align:center;padding:40px;color:var(--text-3)">Nenhuma perda registrada.</div>';pl.querySelectorAll('[data-perda-edit]').forEach(b=>b.addEventListener('click',()=>openPerdaModal(b.dataset.perdaEdit)));}
}

function openPerdaModal(id){
  editPerdaId=id||null;const p=id?perdas.find(x=>x.id===id):null;
  document.getElementById('perdaModalTitle').textContent=p?'Editar perda':'Registrar perda';
  document.getElementById('perdaLead').value=p?.lead||'';
  document.getElementById('perdaResp').value=p?.resp||'';
  document.getElementById('perdaMotivo').value=p?.motivo||'Preço alto';
  document.getElementById('perdaSubmotivo').value=p?.submotivo||'';
  document.getElementById('perdaCat').value=p?.categoria||'Preço';
  document.getElementById('perdaConcorrente').value=p?.concorrente||'';
  document.getElementById('perdaValor').value=p?.valor||'';
  document.getElementById('perdaEtapa').value=p?.etapa||'Lead';
  document.getElementById('perdaComentarios').value=p?.comentarios||'';
  document.getElementById('perdaMelhorias').value=p?.melhorias||'';
  document.getElementById('perdaDataReativ').value=p?.dataReativ||'';
  document.getElementById('perdaProb').value=p?.prob||'media';
  document.getElementById('perdaEstrategia').value=p?.estrategia||'';
  document.getElementById('perdaModalDelete').classList.toggle('hidden',!p);
  document.getElementById('perdaModalBackdrop').classList.remove('hidden');
}
document.getElementById('perdaNewBtn')?.addEventListener('click',()=>openPerdaModal(null));
document.getElementById('perdaModalClose')?.addEventListener('click',()=>document.getElementById('perdaModalBackdrop').classList.add('hidden'));
document.getElementById('perdaModalCancel')?.addEventListener('click',()=>document.getElementById('perdaModalBackdrop').classList.add('hidden'));
document.getElementById('perdaModalBackdrop')?.addEventListener('click',e=>{if(e.target===e.currentTarget)document.getElementById('perdaModalBackdrop').classList.add('hidden');});
document.getElementById('perdaModalDelete')?.addEventListener('click',()=>{if(!editPerdaId)return;perdas=perdas.filter(p=>p.id!==editPerdaId);savePerdas();renderPerdas();document.getElementById('perdaModalBackdrop').classList.add('hidden');showToast('Registro excluído');});
document.getElementById('perdaModalSave')?.addEventListener('click',()=>{
  const lead=document.getElementById('perdaLead').value.trim();if(!lead)return;
  const data={id:editPerdaId||'p'+Date.now(),lead,resp:document.getElementById('perdaResp').value,motivo:document.getElementById('perdaMotivo').value,submotivo:document.getElementById('perdaSubmotivo').value,categoria:document.getElementById('perdaCat').value,concorrente:document.getElementById('perdaConcorrente').value,valor:Number(document.getElementById('perdaValor').value)||0,etapa:document.getElementById('perdaEtapa').value,comentarios:document.getElementById('perdaComentarios').value,melhorias:document.getElementById('perdaMelhorias').value,dataReativ:document.getElementById('perdaDataReativ').value,prob:document.getElementById('perdaProb').value,estrategia:document.getElementById('perdaEstrategia').value};
  if(editPerdaId){const idx=perdas.findIndex(p=>p.id===editPerdaId);if(idx>-1)perdas[idx]=data;}else perdas.push(data);
  savePerdas();renderPerdas();document.getElementById('perdaModalBackdrop').classList.add('hidden');showToast(editPerdaId?'Atualizado':'Perda registrada','success');
});

// ══ DASHBOARD COMERCIAL ══
function renderDashboard(){
  const prd=Number(document.getElementById('dashPeriod')?.value||30);
  const total=leads.length,ativos=leads.filter(l=>l.etapa!=='Perdido').length;
  const novos=leads.filter(l=>{if(!l.criadoEm)return false;return(new Date()-new Date(l.criadoEm))/(864e5)<=prd;}).length;
  const perdidosN=leads.filter(l=>l.etapa==='Perdido').length;
  const fechados=leads.filter(l=>l.etapa==='Fechado').length;
  const conv=total>0?((fechados/total)*100).toFixed(1):0;
  const setEl=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  setEl('dkLeadsCad',total);setEl('dkLeadsAtivos',ativos);setEl('dkLeadsNovos',novos);setEl('dkLeadsPerdidos',perdidosN);setEl('dkConvGeral',conv+'%');
  setEl('dkLeadsCadD','Total cadastrado');setEl('dkLeadsAtivosD','Em andamento');setEl('dkLeadsNovosD','Últimos '+prd+' dias');setEl('dkLeadsPerdidosD','Oportunidades perdidas');setEl('dkConvGeralD','Fechados / Total');
  const propostas=leads.filter(l=>l.etapa==='Proposta'||l.etapa==='Fechado').length;
  const recPrev=leads.filter(l=>l.etapa!=='Perdido').reduce((s,l)=>s+(l.valor||0),0);
  const ticket=fechados>0?Math.round(leads.filter(l=>l.etapa==='Fechado').reduce((s,l)=>s+(l.valor||0),0)/fechados):0;
  setEl('dkPropostas',propostas);setEl('dkContratos',fechados);setEl('dkRecPrev','R$'+recPrev.toLocaleString('pt-BR'));setEl('dkTicket','R$'+ticket.toLocaleString('pt-BR'));setEl('dkTempFech',Math.round(14+Math.random()*10)+'d');
  // Bar chart
  const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const curM=new Date().getMonth();
  const barData=Array.from({length:6},(_,i)=>{const m=(curM-5+i+12)%12;return{label:months[m],val:Math.round(15000+Math.random()*40000)};});
  const maxV=Math.max(...barData.map(d=>d.val));
  const bc=document.getElementById('dashBarChart'),bl=document.getElementById('dashBarLabels');
  if(bc)bc.innerHTML=barData.map(d=>'<div class="dash-bar-col"><div class="dash-bar" style="height:'+Math.max(8,Math.round((d.val/maxV)*130))+'px" data-val="R$'+d.val.toLocaleString('pt-BR')+'"></div></div>').join('');
  if(bl)bl.innerHTML=barData.map(d=>'<span style="font-size:10px;color:var(--text-3);flex:1;text-align:center">'+d.label+'</span>').join('');
  // Donut
  const origens=[['Outbound',35,'#2563eb'],['Inbound',25,'#16a34a'],['Indicação',20,'#7c3aed'],['Redes Sociais',12,'#d97706'],['Outros',8,'#6b7280']];
  const tot2=origens.reduce((s,o)=>s+o[1],0);
  const dnt=document.getElementById('dashDonut'),leg=document.getElementById('dashDonutLegend');
  if(dnt){let ang=-90;const cx=55,cy=55,r=40;dnt.innerHTML=origens.map(([,pct,col])=>{const a=(pct/tot2)*360;const s=ang;ang+=a;const r1=s*(Math.PI/180),r2=(s+a-1)*(Math.PI/180);const x1=cx+r*Math.cos(r1),y1=cy+r*Math.sin(r1),x2=cx+r*Math.cos(r2),y2=cy+r*Math.sin(r2);return'<path d="M'+cx+','+cy+' L'+x1.toFixed(2)+','+y1.toFixed(2)+' A'+r+','+r+' 0 '+(a>180?1:0)+',1 '+x2.toFixed(2)+','+y2.toFixed(2)+' Z" fill="'+col+'"/>';}).join('')+'<circle cx="'+cx+'" cy="'+cy+'" r="24" fill="var(--surface)"/><text x="'+cx+'" y="'+(cy+4)+'" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text)">'+total+'</text>';}
  if(leg)leg.innerHTML=origens.map(([lbl,pct,col])=>'<div class="dash-legend-item"><span class="dash-legend-dot" style="background:'+col+'"></span>'+lbl+' <strong style="margin-left:auto">'+pct+'%</strong></div>').join('');
  // Pipeline
  const dp=document.getElementById('dashPipeline');
  if(dp){const ets=['Lead','Contato','Proposta','Fechamento','Fechado'];const mxE=Math.max(...ets.map(e=>leads.filter(l=>l.etapa===e).length),1);dp.innerHTML=ets.map(e=>{const n=leads.filter(l=>l.etapa===e).length;const v=leads.filter(l=>l.etapa===e).reduce((s,l)=>s+(l.valor||0),0);return'<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span style="color:var(--text-2)">'+e+'</span><span style="font-weight:700">'+n+' <span style="font-weight:400;color:var(--text-3)">· R$'+v.toLocaleString('pt-BR')+'</span></span></div><div style="height:7px;border-radius:4px;background:var(--surface-3)"><div style="height:100%;border-radius:4px;background:var(--blue);width:'+Math.max(5,Math.round((n/mxE)*100))+'%"></div></div></div>';}).join('');}
  // Atividades
  const da=document.getElementById('dashAtividades');
  if(da){const acts=[['📞','Ligações',Math.round(20+Math.random()*30)],['💬','WhatsApps',Math.round(30+Math.random()*50)],['✉️','E-mails',Math.round(15+Math.random()*25)],['🎯','Reuniões',Math.round(5+Math.random()*15)],['📌','Follow-ups pendentes',agEvents.length]];da.innerHTML=acts.map(([icon,lbl,n])=>'<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)">'+icon+' <span style="flex:1;font-size:12.5px;color:var(--text-2)">'+lbl+'</span><strong style="color:var(--text)">'+n+'</strong></div>').join('');}
  // Conversão
  const dc=document.getElementById('dashConversao');
  if(dc){const pairs=[['Lead→Contato',72],['Contato→Proposta',58],['Proposta→Fechamento',44],['Fechamento→Fechado',81]];dc.innerHTML=pairs.map(([lbl,pct])=>'<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:var(--text-2)">'+lbl+'</span><strong style="color:'+(pct>=60?'#16a34a':pct>=40?'#d97706':'#dc2626')+'">'+pct+'%</strong></div><div style="height:6px;border-radius:3px;background:var(--surface-3)"><div style="height:100%;border-radius:3px;background:'+(pct>=60?'#16a34a':pct>=40?'#d97706':'#dc2626')+';width:'+pct+'%"></div></div></div>').join('');}
  // Performance
  const dperf=document.getElementById('dashPerformance');
  if(dperf)dperf.innerHTML=[{title:'🏆 Top Vendedor',value:'Ana Costa',sub:'12 fechamentos',color:'#fef9c3'},{title:'🚀 Melhor Canal',value:'Outbound',sub:'35% dos leads',color:'#dbeafe'},{title:'🎯 Melhor Produto',value:'Rastreamento Pro',sub:'R$124k gerado',color:'#dcfce7'},{title:'⚡ Campanha Destaque',value:'Cold Mail Q4',sub:'22% abertura',color:'#ede9fe'}].map(i=>'<div style="background:'+i.color+';border-radius:12px;padding:16px"><div style="font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:6px">'+i.title+'</div><div style="font-size:16px;font-weight:800;color:var(--text)">'+i.value+'</div><div style="font-size:11.5px;color:var(--text-3);margin-top:2px">'+i.sub+'</div></div>').join('');
}
document.getElementById('dashPeriod')?.addEventListener('change',renderDashboard);
document.getElementById('dashRefresh')?.addEventListener('click',()=>{renderDashboard();showToast('Dashboard atualizado','success');});

// ══ PATCH setView for new modules ══
const _sv=setView;
window.setView=function(v){
  _sv(v);
  const extra={playbooks:{title:'Playbooks',sub:'Scripts, checklists e materiais de vendas'},objecoes:{title:'Biblioteca de Objeções',sub:'Respostas prontas para superar objeções'},perdas:{title:'Motivos de Perda',sub:'Análise e reativação de negócios perdidos'},dashboard:{title:'Dashboard Comercial',sub:'Visão completa de indicadores e performance'}};
  if(extra[v]){const tt=document.getElementById('topbarTitle'),ts=document.getElementById('topbarSub');if(tt)tt.textContent=extra[v].title;if(ts)ts.textContent=extra[v].sub;}
  if(v==='playbooks')renderPB();
  if(v==='objecoes')renderObj();
  if(v==='perdas')renderPerdas();
  if(v==='dashboard')setTimeout(renderDashboard,60);
};
document.querySelectorAll('[data-view]').forEach(b=>{b.onclick=null;b.addEventListener('click',()=>window.setView(b.dataset.view));});
document.querySelectorAll('[data-go]').forEach(b=>{b.onclick=null;b.addEventListener('click',()=>window.setView(b.dataset.go));});
