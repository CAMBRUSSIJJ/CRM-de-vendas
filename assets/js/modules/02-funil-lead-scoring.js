/* Script original 02 */
(function(){
'use strict';
if(window.__crmProV4Funil)return;window.__crmProV4Funil=true;
const STAGE_PROB_V4={Lead:10,Contato:30,Proposta:65,Fechado:100,Perdido:0};
const STAGE_COLORS_V4={Lead:'#6366f1',Contato:'#f59e0b',Proposta:'#06b6d4',Fechado:'#22c55e',Perdido:'#ef4444'};
const STAGE_DESC_V4={Lead:'Entrada e qualificação inicial',Contato:'Primeiro contato e diagnóstico',Proposta:'Oferta enviada e negociação',Fechado:'Venda concluída',Perdido:'Oportunidade perdida'};
const escV4=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const onlyDigitsV4=(v)=>String(v||'').replace(/\D/g,'');
const moneyV4=(v)=>typeof money==='function'?money(v):new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
const fmtDateV4=(d)=>typeof fmtDate==='function'?fmtDate(d):(d||'—');
const todayV4=()=>typeof todayStr==='function'?todayStr():new Date().toISOString().slice(0,10);
const calcScoreV4=(l)=>{try{return typeof calcScore==='function'?calcScore(l):Math.round((STAGE_PROB_V4[l.etapa]||0)+10);}catch(e){return 0;}};
const daysSinceV4=(d)=>{try{return typeof daysSince==='function'?daysSince(d):0;}catch(e){return 0;}};
const isOverdueV4=(d)=>{try{return typeof isOverdue==='function'?isOverdue(d):false;}catch(e){return false;}};
const stageTagV4=(s)=>`<span class="tag ${({Lead:'tag-lead',Contato:'tag-contato',Proposta:'tag-proposta',Fechado:'tag-fechado',Perdido:'tag-perdido'}[s]||'tag-neutro')}">${escV4(s||'Lead')}</span>`;
const priorityTagV4=(p)=>`<span class="tag ${({Alta:'tag-alta','Média':'tag-media',Baixa:'tag-baixa'}[p]||'tag-neutro')}">${escV4(p||'Média')}</span>`;
function leadByV4(ref){if(!ref)return null;if(typeof ref==='object')return ref;return (leads||[]).find(l=>l.id===ref)||(leads||[]).find(l=>l.nome===ref)||null;}
function stageListV4(){return (typeof stages!=='undefined'&&Array.isArray(stages)&&stages.length)?stages:['Lead','Contato','Proposta','Fechado','Perdido'];}
function weightedV4(arr){return arr.reduce((s,l)=>s+(Number(l.valor)||0)*(Number(l.probabilidade??STAGE_PROB_V4[l.etapa]??0)/100),0);}
function totalV4(arr){return arr.reduce((s,l)=>s+(Number(l.valor)||0),0);}
function avgV4(vals){const f=vals.filter(v=>Number.isFinite(v));return f.length?Math.round(f.reduce((a,b)=>a+b,0)/f.length):0;}
function svgFunnel(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M3 4h18l-7 8v6l-4 2v-8L3 4z"/></svg>';}
function svgSmall(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>';}
function makeBtn(cls,view,title,label){const b=document.createElement('button');b.className=cls;b.dataset.view=view;b.title=title||label;b.innerHTML=svgFunnel()+(label?`<span>${label}</span>`:'');b.addEventListener('click',()=>window.setView?window.setView(view):setView(view));return b;}
function ensureFunilNav(){
  if(!document.querySelector('.sidebar-nav [data-view="funil"]')){const ref=document.querySelector('.sidebar-nav [data-view="pipeline"]');const b=makeBtn('nav-item','funil','Funil de vendas','Funil de vendas');ref?.insertAdjacentElement('afterend',b);}
  if(!document.querySelector('.rail [data-view="funil"]')){const ref=document.querySelector('.rail [data-view="pipeline"]');const b=makeBtn('rail-btn','funil','Funil de vendas','');ref?.insertAdjacentElement('afterend',b);}
  if(!document.querySelector('.topbar-tabs [data-view="funil"]')){const ref=document.querySelector('.topbar-tabs [data-view="pipeline"]');const b=document.createElement('button');b.className='tab';b.dataset.view='funil';b.textContent='Funil';b.addEventListener('click',()=>window.setView?window.setView('funil'):setView('funil'));ref?.insertAdjacentElement('afterend',b);}
}
function ensureFunilPage(){
  if(document.getElementById('funil'))return;
  const section=document.createElement('section');section.id='funil';section.className='view grid-view funnel-shell';
  section.innerHTML=`
    <div class="section-header"><div><div class="section-title-text">Funil de vendas</div><div class="section-sub">Visão executiva das oportunidades por etapa, com quantidade de leads, valor bruto, forecast ponderado e gargalos comerciais.</div></div></div>
    <div class="funnel-hero">
      <div><h2>Mapa comercial por etapa</h2><p>Acompanhe onde cada lead está, quanto existe em potencial e quais etapas precisam de ação. Os indicadores abaixo são recalculados com a base local do CRM.</p></div>
      <div class="funnel-hero-actions"><button class="btn" id="funnelOpenLeadBtn">Cadastrar lead</button><button class="btn" id="funnelGoPipelineBtn">Ver pipeline</button><button class="btn" id="funnelReportBtn">Relatório PDF</button></div>
    </div>
    <div class="funnel-kpi-grid" id="funnelKpis"></div>
    <div class="funnel-layout">
      <div class="card funnel-card-main"><div class="card-header"><div><div class="card-title">Distribuição do funil</div><div class="card-sub">Quantidade, valor total e forecast por etapa</div></div><span class="crm-safe-badge">Tempo real</span></div><div class="card-body"><div class="funnel-canvas" id="salesFunnelCanvas"></div></div></div>
      <div class="card"><div class="card-header"><div><div class="card-title">Ações recomendadas</div><div class="card-sub">Prioridade por risco comercial</div></div></div><div class="card-body"><div class="funnel-alert-list" id="funnelAlerts"></div></div></div>
    </div>
    <div class="card"><div class="card-header"><div><div class="card-title">Resumo por etapa</div><div class="card-sub">Comparativo operacional do funil</div></div></div><div class="card-body funnel-table-wrap"><table class="funnel-table"><thead><tr><th>Etapa</th><th>Leads</th><th>Valor bruto</th><th>Forecast</th><th>Conversão vs entrada</th><th>Dias médios parado</th><th>Lead mais quente</th></tr></thead><tbody id="funnelStageTable"></tbody></table></div></div>
    <div class="funnel-stage-grid" id="funnelStageGrid"></div>`;
  const dash=document.getElementById('dashboard');(dash?.parentNode||document.querySelector('main'))?.insertBefore(section,dash||null);
  document.getElementById('funnelOpenLeadBtn')?.addEventListener('click',()=>openModal(null));
  document.getElementById('funnelGoPipelineBtn')?.addEventListener('click',()=>window.setView('pipeline'));
  document.getElementById('funnelReportBtn')?.addEventListener('click',()=>{if(typeof printExecutiveReport==='function')printExecutiveReport();});
}
function renderFunilPage(){
  if(!document.getElementById('funil'))return;
  const st=stageListV4(),base=Array.isArray(leads)?leads:[];
  const open=base.filter(l=>!['Fechado','Perdido'].includes(l.etapa));
  const closed=base.filter(l=>l.etapa==='Fechado');
  const lost=base.filter(l=>l.etapa==='Perdido');
  const pipeVal=totalV4(open),forecast=weightedV4(open),closedVal=totalV4(closed);
  const conv=base.length?Math.round((closed.length/base.length)*100):0;
  const kpis=[
    ['Leads totais',base.length,'Base cadastrada'],['Oportunidades abertas',open.length,moneyV4(pipeVal)+' em pipeline'],['Forecast ponderado',moneyV4(forecast),'Valor ajustado por probabilidade'],['Fechados',closed.length,moneyV4(closedVal)+' conquistados'],['Conversão geral',conv+'%',lost.length+' perdido(s)']
  ];
  const kpiBox=document.getElementById('funnelKpis');if(kpiBox)kpiBox.innerHTML=kpis.map(k=>`<div class="funnel-kpi"><div class="label">${escV4(k[0])}</div><div class="value">${escV4(k[1])}</div><div class="hint">${escV4(k[2])}</div></div>`).join('');
  const maxCount=Math.max(1,...st.map(s=>base.filter(l=>l.etapa===s).length));
  const entry=Math.max(1,base.filter(l=>l.etapa!=='Perdido').length||base.length||1);
  const canvas=document.getElementById('salesFunnelCanvas');
  if(canvas)canvas.innerHTML=st.map(s=>{const arr=base.filter(l=>l.etapa===s),count=arr.length,val=totalV4(arr),w=weightedV4(arr),pct=Math.round(count/maxCount*100),convStage=Math.round(count/entry*100),color=STAGE_COLORS_V4[s]||'#64748b';return `<div class="funnel-row" data-stage-filter="${escV4(s)}"><div class="stage"><span class="funnel-dot" style="background:${color}"></span>${escV4(s)}</div><div class="funnel-track"><div class="funnel-fill" style="width:${Math.max(6,pct)}%;background:${color}">${count}</div></div><div class="funnel-meta"><strong>${moneyV4(val)}</strong>Forecast ${moneyV4(w)}</div><div class="funnel-conv"><div class="pct">${convStage}%</div><div class="txt">vs entrada ativa</div></div></div>`;}).join('');
  canvas?.querySelectorAll('[data-stage-filter]').forEach(r=>r.addEventListener('click',()=>{try{ltStage=r.dataset.stageFilter;window.setView('leads');renderLeadsTable();}catch(e){window.setView('leads');}}));
  const alerts=[];
  const overdue=open.filter(l=>l.followup&&isOverdueV4(l.followup));
  const stagnant=open.filter(l=>daysSinceV4(l.ultimaAtualizacao||l.dataEntrada)>=7);
  const hot=open.filter(l=>calcScoreV4(l)>=70).sort((a,b)=>calcScoreV4(b)-calcScoreV4(a));
  if(overdue.length)alerts.push(['Follow-up vencido',`${overdue.length} lead(s) precisam de contato hoje.`,overdue[0]?.id||overdue[0]?.nome]);
  if(stagnant.length)alerts.push(['Negócios parados',`${stagnant.length} lead(s) sem avanço há 7+ dias.`,stagnant[0]?.id||stagnant[0]?.nome]);
  if(hot.length)alerts.push(['Lead quente',`${hot[0].nome} tem score ${calcScoreV4(hot[0])}.`,hot[0]?.id||hot[0]?.nome]);
  if(!alerts.length)alerts.push(['Funil saudável','Nenhum alerta crítico encontrado neste momento.','']);
  const alertBox=document.getElementById('funnelAlerts');if(alertBox)alertBox.innerHTML=alerts.map((a,i)=>`<div class="funnel-alert" ${a[2]?`data-alert-lead="${escV4(a[2])}"`:''}><div class="ico">${i+1}</div><div><b>${escV4(a[0])}</b><p>${escV4(a[1])}</p></div></div>`).join('');
  alertBox?.querySelectorAll('[data-alert-lead]').forEach(x=>x.addEventListener('click',()=>openDetail(x.dataset.alertLead)));
  const tbody=document.getElementById('funnelStageTable');
  if(tbody)tbody.innerHTML=st.map(s=>{const arr=base.filter(l=>l.etapa===s),hotLead=arr.slice().sort((a,b)=>calcScoreV4(b)-calcScoreV4(a))[0],avgDays=avgV4(arr.map(l=>daysSinceV4(l.ultimaAtualizacao||l.dataEntrada))),count=arr.length,convStage=Math.round((count/entry)*100);return `<tr><td>${stageTagV4(s)}<div style="font-size:11px;color:var(--text-3);margin-top:4px">${escV4(STAGE_DESC_V4[s]||'')}</div></td><td><strong>${count}</strong></td><td>${moneyV4(totalV4(arr))}</td><td>${moneyV4(weightedV4(arr))}</td><td>${convStage}%</td><td>${avgDays}d</td><td>${hotLead?`<button class="btn btn-xs" data-hot-lead="${escV4(hotLead.id||hotLead.nome)}">${escV4(hotLead.nome)} · ${calcScoreV4(hotLead)}</button>`:'—'}</td></tr>`;}).join('');
  tbody?.querySelectorAll('[data-hot-lead]').forEach(b=>b.addEventListener('click',()=>openDetail(b.dataset.hotLead)));
  const grid=document.getElementById('funnelStageGrid');
  if(grid)grid.innerHTML=st.map(s=>{const arr=base.filter(l=>l.etapa===s).sort((a,b)=>calcScoreV4(b)-calcScoreV4(a)).slice(0,3);return `<div class="funnel-stage-card"><div class="head"><div class="name"><span class="funnel-dot" style="background:${STAGE_COLORS_V4[s]||'#64748b'}"></span> ${escV4(s)}</div><span class="count">${base.filter(l=>l.etapa===s).length}</span></div><div class="crm-progress"><span style="width:${Math.max(2,STAGE_PROB_V4[s]||0)}%;background:${STAGE_COLORS_V4[s]||'#64748b'}"></span></div><div class="funnel-mini-leads">${arr.length?arr.map(l=>`<div class="funnel-mini-lead" data-mini-lead="${escV4(l.id||l.nome)}"><div><b>${escV4(l.nome)}</b><br><span>${escV4(l.responsavel||'Sem responsável')} · score ${calcScoreV4(l)}</span></div><strong style="font-size:11px">${moneyV4(l.valor)}</strong></div>`).join(''):'<span style="font-size:12px;color:var(--text-3)">Nenhum lead nesta etapa</span>'}</div></div>`;}).join('');
  grid?.querySelectorAll('[data-mini-lead]').forEach(x=>x.addEventListener('click',()=>openDetail(x.dataset.miniLead)));
}
function installFunilRouting(){
  const prev=window.setView||((v)=>setView(v));
  function patched(v){prev(v);if(v==='funil'){const tt=document.getElementById('topbarTitle'),ts=document.getElementById('topbarSub');if(tt)tt.textContent='Funil de vendas';if(ts)ts.textContent='Etapas, conversão, forecast e gargalos por lead';setTimeout(renderFunilPage,40);} }
  window.setView=patched;try{setView=patched;}catch(e){}
}
function enhanceLeadModal(){
  const box=document.querySelector('#modalBackdrop .modal-box'),body=document.querySelector('#modalBackdrop .modal-body'),grid=document.querySelector('#modalBackdrop .modal-grid');if(!box||!body||!grid)return;
  box.classList.add('smart-lead-modal');body.classList.add('crm-smart-body');grid.classList.add('lead-smart-grid');
  if(!document.getElementById('leadSmartBanner'))body.insertAdjacentHTML('afterbegin',`<div class="crm-modal-banner" id="leadSmartBanner"><div><b>Cadastro comercial inteligente</b><br><span>Ao alterar etapa, valor ou prioridade, o CRM calcula probabilidade, forecast e sugere o próximo passo.</span></div><span class="crm-safe-badge">Automação local</span></div>`);
  const valField=document.getElementById('mValor')?.closest('.field');
  if(valField&&!document.getElementById('mProbabilidade'))valField.insertAdjacentHTML('afterend',`<div class="field"><label>Probabilidade (%)</label><input id="mProbabilidade" type="number" min="0" max="100" placeholder="Automático"></div>`);
  const origField=document.getElementById('mOrigem')?.closest('.field');
  if(origField&&!document.getElementById('mCanalPref'))origField.insertAdjacentHTML('afterend',`<div class="field"><label>Canal preferido</label><select id="mCanalPref"><option value="WhatsApp">WhatsApp</option><option value="Ligação">Ligação</option><option value="E-mail">E-mail</option><option value="Reunião">Reunião</option></select></div>`);
  const fuField=document.getElementById('mFollowup')?.closest('.field');
  if(fuField&&!document.getElementById('mProximoPasso'))fuField.insertAdjacentHTML('afterend',`<div class="field full"><label>Próximo passo</label><input id="mProximoPasso" placeholder="Ex: Enviar proposta revisada e confirmar decisão"></div>`);
  if(!document.getElementById('leadSmartSide'))body.insertAdjacentHTML('beforeend',`<aside class="crm-modal-side" id="leadSmartSide"><div class="crm-side-head"><b>Resumo automático</b><span>Prévia antes de salvar</span></div><div class="crm-side-body"><div class="crm-side-kpi"><span>Score estimado</span><strong id="leadSmartScore">0</strong></div><div class="crm-side-kpi"><span>Forecast</span><strong id="leadSmartForecast">R$ 0</strong></div><div><div class="crm-side-kpi"><span>Probabilidade</span><strong id="leadSmartProb">0%</strong></div><div class="crm-progress"><span id="leadSmartProbBar"></span></div></div><div class="crm-next-box" id="leadSmartNext">Preencha os dados para receber uma sugestão.</div><button class="btn btn-sm" id="leadSmartApply" type="button">Aplicar sugestão</button></div></aside>`);
  const update=()=>{
    const etapa=document.getElementById('mEtapa')?.value||'Lead';let prob=Number(document.getElementById('mProbabilidade')?.value);if(!Number.isFinite(prob)||prob<=0)prob=STAGE_PROB_V4[etapa]??10;
    const valor=Number(document.getElementById('mValor')?.value)||0,pri=document.getElementById('mPrioridade')?.value||'Média';
    const temp={etapa,valor,prioridade:pri,followup:document.getElementById('mFollowup')?.value,ultimaAtualizacao:todayV4(),dataEntrada:document.getElementById('mData')?.value||todayV4()};
    const suggest={Lead:'Qualificar dor, orçamento e decisor antes de avançar.',Contato:'Registrar diagnóstico e agendar próxima conversa.',Proposta:'Confirmar critérios de decisão e prazo de fechamento.',Fechado:'Criar onboarding e pedido de indicação.',Perdido:'Registrar motivo de perda e data de reativação.'}[etapa]||'Definir próximo passo comercial.';
    const score=calcScoreV4(temp),forecast=valor*(prob/100);
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};set('leadSmartScore',score);set('leadSmartForecast',moneyV4(forecast));set('leadSmartProb',prob+'%');const bar=document.getElementById('leadSmartProbBar');if(bar)bar.style.width=Math.max(2,Math.min(100,prob))+'%';set('leadSmartNext',suggest);
  };
  ['mEtapa','mPrioridade','mValor','mFollowup','mData','mProbabilidade'].forEach(id=>document.getElementById(id)?.addEventListener('input',update));
  document.getElementById('leadSmartApply')?.addEventListener('click',()=>{const next=document.getElementById('leadSmartNext')?.textContent||'';const p=document.getElementById('mProximoPasso');if(p&&!p.value)p.value=next;showToast('Sugestão aplicada','success');});
  const oldOpen=typeof openModal==='function'?openModal:null;
  if(oldOpen&&!window.__crmOpenLeadV4){window.__crmOpenLeadV4=true;openModal=function(lead,defStage){oldOpen(lead,defStage);const l=leadByV4(lead?.id||lead?.nome||lead);const etapa=document.getElementById('mEtapa')?.value||defStage||l?.etapa||'Lead';const probEl=document.getElementById('mProbabilidade');if(probEl)probEl.value=l?.probabilidade??STAGE_PROB_V4[etapa]??10;const canal=document.getElementById('mCanalPref');if(canal)canal.value=l?.canalPreferido||'WhatsApp';const prox=document.getElementById('mProximoPasso');if(prox)prox.value=l?.proximoPasso||'';setTimeout(update,30);};try{window.openModal=openModal;}catch(e){}}
  const oldGet=typeof getModalDataPatched==='function'?getModalDataPatched:null;
  if(oldGet&&!window.__crmGetLeadV4){window.__crmGetLeadV4=true;getModalDataPatched=function(){const d=oldGet();const etapa=d.etapa||document.getElementById('mEtapa')?.value||'Lead';let prob=Number(document.getElementById('mProbabilidade')?.value);d.probabilidade=Number.isFinite(prob)?Math.max(0,Math.min(100,prob)):(STAGE_PROB_V4[etapa]??10);d.canalPreferido=document.getElementById('mCanalPref')?.value||'WhatsApp';d.proximoPasso=(document.getElementById('mProximoPasso')?.value||'').trim();return d;};}
  update();
}
const OBJ_TEMPLATES_V4={
  'Preço':{consultiva:'Entendo. Antes de comparar apenas preço, vale olharmos o custo do problema que você quer resolver. Se hoje isso gera perda de tempo, retrabalho ou oportunidades perdidas, o investimento precisa ser comparado com esse impacto. Posso montar uma conta simples de retorno para você decidir com segurança?',whats:'Entendo. Vamos olhar pelo retorno, não só pelo preço? Posso te mostrar uma conta rápida do quanto isso pode economizar ou gerar em resultado.',alt:'Você tem razão em avaliar investimento. A pergunta principal é: quanto custa continuar sem resolver isso?',args:'ROI estimado, custo da inação, garantia, suporte incluso, implantação assistida',abord:'Comparar investimento com custo do problema'},
  'Tempo':{consultiva:'Faz sentido não forçar o momento. Para eu te orientar melhor: o que precisa acontecer para esse assunto virar prioridade? Pergunto porque, quando o problema continua ativo, o custo de esperar costuma crescer.',whats:'Claro. O que precisa acontecer para esse tema virar prioridade? Assim eu acompanho no tempo certo sem te pressionar.',alt:'Podemos deixar uma próxima conversa agendada para revisar o cenário sem compromisso.',args:'custo de adiar, janela ideal, implantação gradual, baixo esforço inicial',abord:'Mapear gatilho de prioridade'},
  'Concorrência':{consultiva:'Ótimo que vocês já têm uma solução. Minha sugestão não é trocar por trocar, e sim comparar resultado, aderência e suporte. Quais pontos da solução atual funcionam bem e quais ainda deixam lacunas?',whats:'Perfeito. O que funciona bem no fornecedor atual e o que ainda incomoda? Posso comparar só onde fizer sentido.',alt:'Podemos fazer uma análise lado a lado sem compromisso de troca.',args:'comparativo objetivo, migração assistida, prova de conceito, suporte especializado',abord:'Comparação por lacunas'},
  'Necessidade':{consultiva:'Entendo. Talvez ainda não esteja claro o impacto prático. Me ajuda com uma coisa: hoje esse processo gera retrabalho, atraso, perda de venda ou dificuldade de controle? Se não houver impacto real, realmente não faz sentido avançar.',whats:'Faz sentido. Só para confirmar: esse problema gera retrabalho, atraso ou perda de oportunidade hoje?',alt:'Se a dor não for prioridade, podemos manter o contato para outro momento.',args:'diagnóstico da dor, impacto operacional, prioridade real, ganho mensurável',abord:'Validar dor antes de vender'},
  'Autoridade':{consultiva:'Claro, decisões importantes precisam envolver quem aprova. Posso preparar um resumo executivo com problema, impacto, solução, investimento e retorno esperado para facilitar sua conversa interna?',whats:'Claro. Quer que eu te mande um resumo executivo para apresentar ao decisor?',alt:'Podemos marcar uma conversa rápida com o decisor para tirar dúvidas objetivas.',args:'resumo executivo, ROI, case semelhante, próximos passos claros',abord:'Ajudar o contato a vender internamente'},
  'Outro':{consultiva:'Entendo o ponto. Para eu responder com precisão: o que mais pesa na sua decisão agora — risco, prazo, orçamento, prioridade ou confiança?',whats:'Entendi. O que mais pesa na decisão agora: risco, prazo, orçamento, prioridade ou confiança?',alt:'Vamos mapear o principal bloqueio antes de falar de solução.',args:'diagnóstico, prioridade, risco, resultado esperado',abord:'Descobrir bloqueio real'}
};
function enhanceObjModal(){
  const box=document.querySelector('#objModalBackdrop .modal-box'),body=document.querySelector('#objModalBackdrop .modal-body');if(!box||!body)return;box.classList.add('smart-obj-modal');body.classList.add('obj-smart-body');
  if(!body.querySelector('.obj-main-fields')){const wrap=document.createElement('div');wrap.className='obj-main-fields';while(body.firstChild)wrap.appendChild(body.firstChild);body.appendChild(wrap);}
  if(!document.getElementById('objAssistPanel'))body.insertAdjacentHTML('beforeend',`<aside class="obj-assist-panel" id="objAssistPanel"><div class="obj-assist-head"><b>Construtor de resposta</b><p>Use modelos comerciais para preencher a objeção com linguagem consultiva, direta e menos genérica.</p></div><div class="obj-assist-body"><button class="obj-template-btn" type="button" data-obj-fill="consultiva"><b>Resposta consultiva</b><span>Mais completa para reunião ou proposta</span></button><button class="obj-template-btn" type="button" data-obj-fill="whats"><b>Versão WhatsApp</b><span>Curta, natural e objetiva</span></button><button class="obj-template-btn" type="button" data-obj-fill="argumentos"><b>Argumentos e abordagem</b><span>Preenche argumentos, alternativa e melhor abordagem</span></button><div class="obj-quality" id="objQuality"><div class="obj-quality-row"><span>Categoria</span><strong id="objQCat">Preço</strong></div><div class="obj-quality-row"><span>Tom sugerido</span><strong id="objQTom">ROI</strong></div><div class="obj-quality-row"><span>Uso recomendado</span><strong id="objQUso">Proposta</strong></div></div></div></aside>`);
  const update=()=>{const cat=document.getElementById('objCat')?.value||'Outro';const tom={Preço:'ROI',Tempo:'Urgência leve',Concorrência:'Comparação',Necessidade:'Diagnóstico',Autoridade:'Material executivo',Outro:'Descoberta'}[cat]||'Consultivo';const uso={Preço:'Proposta',Tempo:'Follow-up',Concorrência:'Reunião',Necessidade:'Diagnóstico',Autoridade:'Aprovação',Outro:'Conversa'}[cat]||'Conversa';const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};set('objQCat',cat);set('objQTom',tom);set('objQUso',uso);};
  const fill=(kind)=>{const cat=document.getElementById('objCat')?.value||'Outro',t=OBJ_TEMPLATES_V4[cat]||OBJ_TEMPLATES_V4.Outro;if(kind==='consultiva'){document.getElementById('objResp').value=t.consultiva;document.getElementById('objRespAlt').value=t.alt;}if(kind==='whats'){document.getElementById('objResp').value=t.whats;document.getElementById('objRespAlt').value=t.alt;}if(kind==='argumentos'){document.getElementById('objArgs').value=t.args;document.getElementById('objAbord').value=t.abord;document.getElementById('objRespAlt').value=t.alt;if(!document.getElementById('objTaxa').value)document.getElementById('objTaxa').value=65;}showToast('Modelo aplicado','success');};
  document.getElementById('objCat')?.addEventListener('change',update);document.querySelectorAll('[data-obj-fill]').forEach(b=>b.addEventListener('click',()=>fill(b.dataset.objFill)));
  const oldOpen=typeof openObjModal==='function'?openObjModal:null;if(oldOpen&&!window.__crmOpenObjV4){window.__crmOpenObjV4=true;openObjModal=function(id){oldOpen(id);setTimeout(update,20);};try{window.openObjModal=openObjModal;}catch(e){}}
  update();
}
function patchNovoLeadClick(){
  document.addEventListener('click',function(e){const b=e.target.closest('[data-view="novo-lead"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(typeof openModal==='function')openModal(null);},true);
}
function install(){ensureFunilNav();ensureFunilPage();installFunilRouting();enhanceLeadModal();enhanceObjModal();patchNovoLeadClick();/* funil render consolidado no patch v28 */
  const oldRender=typeof renderAll==='function'?renderAll:null;if(oldRender&&!window.__crmRenderAllV4){window.__crmRenderAllV4=true;renderAll=function(){oldRender();/* funil render consolidado no patch v28 */};try{window.renderAll=renderAll;}catch(e){}}
  const oldDashRefresh=document.getElementById('dashRefresh');oldDashRefresh?.addEventListener('click',renderFunilPage);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
