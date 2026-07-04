/* Script original 08 */
(function(){
  'use strict';
  if(window.__crmCallCenterV9) return;
  window.__crmCallCenterV9=true;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const CALL_CFG='outbounder_call_cfg_v9';
  const phoneIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.89.33 1.76.63 2.59a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.49-1.2a2 2 0 0 1 2.11-.45c.83.3 1.7.51 2.59.63A2 2 0 0 1 22 16.92z"/></svg>';
  function esc(v){return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
  function digits(v){return String(v||'').replace(/\D/g,'');}
  function today(){return new Date().toISOString().slice(0,10);}
  function addDays(n){const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
  function fmtDuration(sec){sec=Math.max(0,Math.floor(sec||0));const m=String(Math.floor(sec/60)).padStart(2,'0');const s=String(sec%60).padStart(2,'0');return `${m}:${s}`;}
  function cfg(){try{return JSON.parse(localStorage.getItem(CALL_CFG)||'{}')}catch(e){return {};}}
  function saveCfg(c){try{localStorage.setItem(CALL_CFG,JSON.stringify(c));}catch(e){}}
  function getLeadsList(){try{return leads||[]}catch(e){return []}}
  function notify(msg,type){try{showToast(msg,type||'success')}catch(e){console.log(msg)}}
  function scoreOf(l){try{return calcScore(l)}catch(e){return 0}}
  function isDue(l){if(!l.followup) return false; return l.followup<=today();}
  function hasPhone(l){return digits(l.telefone).length>=8;}
  function fullNumber(phone){
    const c=cfg();let d=digits(phone);let cc=String(c.country||'+55').replace(/[^\d+]/g,'')||'+55';
    if(cc[0]!=='+') cc='+'+cc;
    if(d.startsWith('00')) d=d.slice(2);
    if(d.startsWith('55') && d.length>=12) return '+'+d;
    return cc+d;
  }
  function dialHref(phone){
    const c=cfg();const protocol=c.protocol||'tel';const full=fullNumber(phone);const plain=full.replace(/\D/g,'');
    if(protocol==='whatsapp') return 'https://wa.me/'+plain;
    if(protocol==='callto') return 'callto:'+full;
    if(protocol==='sip') return 'sip:'+full;
    return 'tel:'+full;
  }
  function leadStatus(l){
    if(l.etapa==='Fechado') return ['Cliente','ok'];
    if(l.etapa==='Perdido') return ['Perdido','warn'];
    if(isDue(l)) return ['Ligar hoje','hot'];
    if((l.prioridade||'')==='Alta') return ['Alta prioridade','hot'];
    return ['Na fila',''];
  }
  function lastCall(l){
    const list=Array.isArray(l.atividades)?l.atividades:[];
    const a=list.find(x=>x.tipo==='Ligação');
    if(!a) return 'Sem ligação';
    try{return new Date(a.data).toLocaleDateString('pt-BR')}catch(e){return 'Registrada'}
  }
  function callHistoryToday(){
    const start=today();let n=0;
    getLeadsList().forEach(l=>(Array.isArray(l.atividades)?l.atividades:[]).forEach(a=>{if(a.tipo==='Ligação' && String(a.data||'').slice(0,10)===start)n++;}));
    return n;
  }
  function ensureNav(){
    function btn(cls,view,label,title){const b=document.createElement('button');b.className=cls;b.dataset.view=view;b.title=title||label;b.innerHTML=phoneIcon+(label?`<span>${label}</span>`:'');return b;}
    if(!$('.sidebar-nav [data-view="ligacoes"]')){($('.sidebar-nav [data-view="agenda"]')||$('.sidebar-nav [data-view="chat"]'))?.insertAdjacentElement('afterend',btn('nav-item','ligacoes','Ligações','Ligações pelo computador'));}
    if(!$('.rail [data-view="ligacoes"]')){($('.rail [data-view="agenda"]')||$('.rail [data-view="chat"]'))?.insertAdjacentElement('afterend',btn('rail-btn','ligacoes','','Ligações'));}
    if(!$('.topbar-tabs [data-view="ligacoes"]')){const b=document.createElement('button');b.className='tab';b.dataset.view='ligacoes';b.textContent='Ligações';($('.topbar-tabs [data-view="agenda"]')||$('.topbar-tabs [data-view="chat"]'))?.insertAdjacentElement('afterend',b);}
    if(!$('.module-grid [data-view="ligacoes"]')){
      const b=document.createElement('button');b.className='module-btn';b.dataset.view='ligacoes';
      b.innerHTML=`<div class="module-icon stat-icon sky">${phoneIcon}</div><div class="module-label">Ligações</div><div class="module-desc">Discagem pelo computador e registro de chamadas</div>`;
      $('.module-grid')?.appendChild(b);
    }
  }
  function ensureSection(){
    if($('#ligacoes')) return;
    const html=`<section id="ligacoes" class="view grid-view call-shell">
      <div class="section-header"><div><div class="section-title-text">Ligações pelo computador</div><div class="section-sub">Discagem rápida, timer, script e registro automático no histórico do lead.</div></div><div class="crm-report-actions"><button class="btn btn-sm" id="callRefreshBtn">Atualizar fila</button><button class="btn btn-sm btn-primary" data-view="novo-lead">+ Novo lead</button></div></div>
      <div class="crm-alert info"><strong>Como funciona:</strong> o botão de ligar abre o discador padrão do computador usando <b>tel:</b>. Para completar a chamada, configure um app de telefonia/softphone no Windows ou Mac. Exemplos: aplicativo de telefone da operadora, discador VoIP, PABX, Teams Phone, 3CX, Zoom Phone ou outro app que aceite links de chamada.</div>
      <div class="call-kpi-grid" id="callKpis"></div>
      <div class="call-main-grid">
        <div class="card"><div class="card-header"><div><div class="card-title">Fila de ligações</div><div class="card-sub">Leads com telefone, priorizados por follow-up vencido, prioridade e score</div></div></div>
          <div class="call-toolbar"><div class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="search-input" id="callSearch" placeholder="Buscar lead, segmento ou responsável..."></div><select id="callFilter" class="search-input" style="padding-left:12px;min-width:165px"><option value="">Todos</option><option value="hoje">Ligar hoje</option><option value="alta">Alta prioridade</option><option value="sem-ligacao">Sem ligação</option></select><button class="btn btn-sm" id="callQueueTopBtn">Selecionar próximo melhor</button></div>
          <div class="call-table-wrap"><table class="data-table"><thead><tr><th>Lead</th><th>Status</th><th>Telefone</th><th>Última ligação</th><th>Score</th><th>Ações</th></tr></thead><tbody id="callTable"></tbody></table></div>
        </div>
        <div style="display:grid;gap:18px">
          <div class="card call-dial-card"><div class="card-header"><div><div class="card-title">Discador</div><div class="card-sub">Inicie a ligação e registre o resultado</div></div></div><div class="card-body" id="callDialer"></div></div>
          <div class="card"><div class="card-header"><div><div class="card-title">Script rápido</div><div class="card-sub">Abordagem consultiva para ligação fria</div></div></div><div class="card-body"><div class="call-script" id="callScriptBox"></div></div></div>
          <div class="card"><div class="card-header"><div><div class="card-title">Configuração do discador</div><div class="card-sub">Escolha como o CRM deve abrir a chamada</div></div></div><div class="card-body"><div class="call-config-grid"><div class="field"><label>Protocolo</label><select id="callProtocol"><option value="tel">Padrão do computador: tel:</option><option value="callto">Softphone: callto:</option><option value="sip">VoIP/SIP: sip:</option><option value="whatsapp">WhatsApp Web</option></select></div><div class="field"><label>DDI padrão</label><input id="callCountry" value="+55" placeholder="+55"></div></div><div class="call-note">Use <b>tel:</b> para abrir o app padrão do sistema. Se sua telefonia usa PABX/VoIP, teste <b>callto:</b> ou <b>sip:</b>. O CRM registra a ligação mesmo que o app externo faça a chamada.</div></div></div>
        </div>
      </div>
    </section>`;
    $('main.main')?.insertAdjacentHTML('beforeend',html);
  }
  let activeLeadName='';let startedAt=null;let timer=null;
  function currentLead(){return getLeadsList().find(l=>l.nome===activeLeadName) || getQueue()[0] || null;}
  function getQueue(){
    let q=getLeadsList().filter(l=>hasPhone(l) && l.etapa!=='Perdido');
    const search=($('#callSearch')?.value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const filter=$('#callFilter')?.value||'';
    if(search){q=q.filter(l=>[l.nome,l.segmento,l.responsavel,l.telefone,l.etapa].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(search));}
    if(filter==='hoje') q=q.filter(isDue);
    if(filter==='alta') q=q.filter(l=>(l.prioridade||'')==='Alta');
    if(filter==='sem-ligacao') q=q.filter(l=>!((Array.isArray(l.atividades)?l.atividades:[]).some(a=>a.tipo==='Ligação')));
    return q.sort((a,b)=>(isDue(b)-isDue(a))||(((b.prioridade||'')==='Alta')-((a.prioridade||'')==='Alta'))||(scoreOf(b)-scoreOf(a))||String(a.nome).localeCompare(String(b.nome),'pt-BR'));
  }
  function renderKpis(){
    const all=getLeadsList();const phone=all.filter(hasPhone);const due=phone.filter(isDue);const high=phone.filter(l=>(l.prioridade||'')==='Alta');
    $('#callKpis') && ($('#callKpis').innerHTML=[['Com telefone',phone.length,'Prontos para discagem'],['Ligar hoje',due.length,'Follow-up vencido ou de hoje'],['Alta prioridade',high.length,'Melhor atacar primeiro'],['Ligações hoje',callHistoryToday(),'Registradas no CRM']].map(k=>`<div class="call-kpi"><div class="v">${esc(k[1])}</div><div class="l">${esc(k[0])}</div><div class="crm-dashboard-note">${esc(k[2])}</div></div>`).join(''));
  }
  function renderTable(){
    const tb=$('#callTable');if(!tb) return;const q=getQueue();
    if(!q.length){tb.innerHTML='<tr><td colspan="6"><div class="call-empty"><b>Nenhum lead com telefone na fila.</b><br>Cadastre telefone nos leads ou ajuste os filtros.</div></td></tr>';return;}
    tb.innerHTML=q.map(l=>{const st=leadStatus(l);const selected=l.nome===activeLeadName;return `<tr data-call-lead="${esc(l.nome)}" class="${selected?'selected-row':''}"><td><div style="font-weight:800;color:var(--text)">${esc(l.nome)}</div><div style="font-size:11.5px;color:var(--text-3);margin-top:2px">${esc(l.segmento||'Sem segmento')} • ${esc(l.responsavel||'Sem responsável')}</div></td><td><span class="call-status-pill ${st[1]}">${st[0]}</span></td><td style="font-family:'JetBrains Mono',monospace;font-size:12px">${esc(l.telefone)}</td><td>${esc(lastCall(l))}</td><td><span class="score-pill ${scoreOf(l)>=80?'score-hi':scoreOf(l)>=45?'score-md':'score-lo'}">${scoreOf(l)}</span></td><td><div class="row-actions" style="opacity:1"><button class="row-action primary" data-call-start="${esc(l.nome)}">Ligar</button><button class="row-action" data-call-select="${esc(l.nome)}">Registrar</button><button class="row-action" data-call-open="${esc(l.nome)}">Lead</button></div></td></tr>`;}).join('');
  }
  function renderScript(l){
    const box=$('#callScriptBox');if(!box) return;
    if(!l){box.textContent='Selecione um lead da fila para carregar um roteiro de ligação.';return;}
    box.textContent=`Abertura:\nOlá, falo com ${l.responsavel||'o responsável'}? Aqui é [SEU NOME]. Vi a ${l.nome} e queria te fazer uma pergunta rápida.\n\nContexto:\nEu ajudo empresas de ${l.segmento||'serviços'} a organizar atendimento, follow-up e conversão de oportunidades.\n\nPergunta de diagnóstico:\nHoje vocês conseguem saber quantos contatos chegam, quantos viram cliente e em qual etapa estão perdendo venda?\n\nPróximo passo:\nSe fizer sentido, posso te mandar um diagnóstico simples com 2 ou 3 melhorias para aumentar conversão e ticket médio.`;
  }
  function renderDialer(){
    const box=$('#callDialer');if(!box) return;const l=currentLead();
    if(!l){box.innerHTML='<div class="call-empty" style="color:rgba(255,255,255,.72)">Selecione um lead com telefone para iniciar.</div>';renderScript(null);return;}
    activeLeadName=l.nome;
    const elapsed=startedAt&&activeLeadName===l.nome?Math.floor((Date.now()-startedAt)/1000):0;
    box.innerHTML=`<div class="call-active-name">${esc(l.nome)}</div><div class="call-active-meta"><span>${esc(l.segmento||'Sem segmento')}</span><span>•</span><span>${esc(l.responsavel||'Sem responsável')}</span><span>•</span><span>${esc(l.etapa||'Lead')}</span></div><div class="call-number-box"><div><div style="font-size:11px;color:rgba(255,255,255,.58);font-weight:700;text-transform:uppercase;letter-spacing:.06em">Número</div><div class="call-number">${esc(l.telefone)}</div></div><button class="btn btn-sm" data-call-copy="${esc(l.telefone)}">Copiar</button></div><div style="font-size:11px;color:rgba(255,255,255,.58);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Tempo da ligação</div><div class="call-timer" id="callTimer">${fmtDuration(elapsed)}</div><div class="call-actions"><a class="btn btn-primary" href="${esc(dialHref(l.telefone))}" target="${(cfg().protocol||'tel')==='whatsapp'?'_blank':'_self'}" data-call-dial-link="${esc(l.nome)}">Abrir discador</a><button class="btn" data-call-start="${esc(l.nome)}">Iniciar timer</button><button class="btn" data-call-stop>Parar</button></div><div class="call-outcome-grid"><button class="call-outcome" data-call-outcome="Atendeu">✅ Atendeu</button><button class="call-outcome" data-call-outcome="Não atendeu">📵 Não atendeu</button><button class="call-outcome" data-call-outcome="Caixa postal">🎙️ Caixa postal</button><button class="call-outcome" data-call-outcome="Reunião marcada">📅 Reunião marcada</button><button class="call-outcome" data-call-outcome="Enviar WhatsApp">💬 Enviar WhatsApp</button><button class="call-outcome" data-call-outcome="Sem interesse">🚫 Sem interesse</button></div><div class="field" style="margin-top:12px"><label style="color:rgba(255,255,255,.65)">Observação da ligação</label><textarea id="callNote" placeholder="Ex: pediu retorno amanhã, falou com recepção, decisor ausente..." style="background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.18);color:#fff"></textarea></div>`;
    renderScript(l);
  }
  function tick(){const t=$('#callTimer');if(t&&startedAt)t.textContent=fmtDuration((Date.now()-startedAt)/1000);}
  function startCall(name,openDialer){
    const l=getLeadsList().find(x=>x.nome===name);if(!l) return;
    activeLeadName=name;startedAt=Date.now();clearInterval(timer);timer=setInterval(tick,1000);renderCallCenter();
    if(openDialer){setTimeout(()=>{try{window.open(dialHref(l.telefone),(cfg().protocol||'tel')==='whatsapp'?'_blank':'_self')}catch(e){location.href=dialHref(l.telefone)}},80);}
  }
  function stopCall(){clearInterval(timer);timer=null;}
  function saveOutcome(outcome){
    const l=currentLead();if(!l) return;const sec=startedAt?Math.floor((Date.now()-startedAt)/1000):0;const note=($('#callNote')?.value||'').trim();
    let texto=`Resultado: ${outcome}. Duração: ${fmtDuration(sec)}.`+(note?`\nObservação: ${note}`:'');
    try{addAtividade(l.nome,'Ligação',texto,'Discador do CRM')}catch(e){}
    l.ultimaAtualizacao=today();
    if(outcome==='Atendeu' && l.etapa==='Lead'){try{applyStageChange(l,'Contato')}catch(e){l.etapa='Contato';}}
    if(outcome==='Não atendeu' || outcome==='Caixa postal') l.followup=addDays(1);
    if(outcome==='Reunião marcada'){try{addAtividade(l.nome,'Reunião','Reunião/diagnóstico marcado a partir da ligação.','Discador do CRM')}catch(e){};l.followup=addDays(2);}
    if(outcome==='Sem interesse'){l.prioridade='Baixa';l.followup=addDays(15);}
    if(outcome==='Enviar WhatsApp'){const href='https://wa.me/'+fullNumber(l.telefone).replace(/\D/g,'');try{window.open(href,'_blank')}catch(e){};}
    try{saveLeads();renderAll();}catch(e){}
    stopCall();startedAt=null;notify('Ligação registrada no histórico do lead','success');renderCallCenter();
  }
  function renderCallCenter(){ensureSection();renderKpis();renderTable();renderDialer();}
  window.renderCallCenterV9=renderCallCenter;
  function bindEvents(){
    document.addEventListener('click',function(e){
      const nav=e.target.closest('[data-view="ligacoes"]'); if(nav){setTimeout(renderCallCenter,40);}
      const sel=e.target.closest('[data-call-select]'); if(sel){activeLeadName=sel.dataset.callSelect;startedAt=null;stopCall();renderCallCenter();}
      const row=e.target.closest('tr[data-call-lead]'); if(row && !e.target.closest('button,a,input,select,textarea')){activeLeadName=row.dataset.callLead;startedAt=null;stopCall();renderCallCenter();}
      const start=e.target.closest('[data-call-start]'); if(start){e.preventDefault();startCall(start.dataset.callStart,true);}
      const link=e.target.closest('[data-call-dial-link]'); if(link){startCall(link.dataset.callDialLink,false);}
      const stop=e.target.closest('[data-call-stop]'); if(stop){stopCall();}
      const out=e.target.closest('[data-call-outcome]'); if(out){saveOutcome(out.dataset.callOutcome);}
      const open=e.target.closest('[data-call-open]'); if(open){try{openDetail(open.dataset.callOpen)}catch(err){}};
      const copy=e.target.closest('[data-call-copy]'); if(copy){navigator.clipboard?.writeText(copy.dataset.callCopy);notify('Telefone copiado','success');}
      if(e.target.closest('#callRefreshBtn')) renderCallCenter();
      if(e.target.closest('#callQueueTopBtn')){const q=getQueue();if(q[0]){activeLeadName=q[0].nome;startedAt=null;stopCall();renderCallCenter();notify('Próximo melhor lead selecionado','success');}}
    },true);
    document.addEventListener('input',function(e){if(e.target&&['callSearch','callFilter'].includes(e.target.id))renderCallCenter();});
    document.addEventListener('change',function(e){
      if(e.target&&['callProtocol','callCountry','callFilter'].includes(e.target.id)){
        if(e.target.id==='callProtocol'||e.target.id==='callCountry'){saveCfg({protocol:$('#callProtocol')?.value||'tel',country:$('#callCountry')?.value||'+55'});notify('Configuração do discador salva','success');}
        renderCallCenter();
      }
    });
  }
  function hydrateConfig(){const c=cfg();if($('#callProtocol')) $('#callProtocol').value=c.protocol||'tel';if($('#callCountry')) $('#callCountry').value=c.country||'+55';}
  ensureNav();ensureSection();bindEvents();hydrateConfig();
  const prevSetView=window.setView || (typeof setView==='function'?setView:null);
  window.setView=function(view){
    if(typeof prevSetView==='function') prevSetView(view);
    if(view==='ligacoes'){
      $('#topbarTitle') && ($('#topbarTitle').textContent='Ligações pelo computador');
      $('#topbarSub') && ($('#topbarSub').textContent='Discagem, timer, script e registro de chamadas');
      setTimeout(()=>{hydrateConfig();renderCallCenter();},30);
    }
  };
  try{setView=window.setView;}catch(e){}
  renderCallCenter();
})();
