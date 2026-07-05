/* Script original 04 */
(function(){
  'use strict';
  if(window.__crmProV5FinalPatch) return;
  window.__crmProV5FinalPatch = true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const moneyFmt=(n)=>'R$ '+(Number(n)||0).toLocaleString('pt-BR',{maximumFractionDigits:0});
  const todayISO=()=>{try{return typeof todayStr==='function'?todayStr():new Date().toISOString().slice(0,10);}catch(e){return new Date().toISOString().slice(0,10)}};
  const addDays=(iso,days)=>{const d=new Date((iso||todayISO())+'T00:00:00');d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)};
  const inRange=(iso,start,end)=>{if(!iso) return false;const x=String(iso).slice(0,10);return (!start||x>=start)&&(!end||x<=end)};
  const callSafe=(name,delay=0)=>{const fn=window[name] || (typeof globalThis!=='undefined'?globalThis[name]:null); if(typeof fn!=='function') return; const run=()=>{try{fn()}catch(e){console.warn('CRM v5:',name,e)}}; delay?setTimeout(run,delay):run();};
  const stagesV5=['Lead','Contato','Proposta','Fechado','Perdido'];
  const STAGE_PROB_V5={Lead:10,Contato:30,Proposta:65,Fechado:100,Perdido:0};

  const VIEW_META_V5={
    inicio:{title:'Painel',sub:'Visão geral das suas oportunidades'},
    leads:{title:'Gestão de leads',sub:'Base comercial principal'},
    pipeline:{title:'Pipeline',sub:'Kanban operacional de oportunidades'},
    funil:{title:'Funil de vendas',sub:'Etapas, conversão, forecast e gargalos por lead'},
    clientes:{title:'Clientes',sub:'Relacionamentos cadastrados'},
    playbooks:{title:'Playbooks',sub:'Scripts com Gerador local, checklists e materiais de vendas'},
    objecoes:{title:'Biblioteca de Objeções',sub:'Respostas prontas para superar objeções'},
    perdas:{title:'Motivos de Perda',sub:'Análise e reativação de negócios perdidos'},
    dashboard:{title:'Dashboard Comercial',sub:'Indicadores e performance'},
    metas:{title:'Metas',sub:'Ligações, reuniões, propostas e atividades por período'},
    cadencias:{title:'Follow-ups',sub:'Rotina de próximos contatos'},
    automacoes:{title:'Automações',sub:'Regras de funil'},
    agenda:{title:'Agenda',sub:'Planejamento e follow-ups'},
    chat:{title:'Chat',sub:'Conversas com leads e clientes via WhatsApp'},
    metricas:{title:'Métricas',sub:'Indicadores de desempenho'},
    importar:{title:'Importar / Exportar',sub:'Gerencie seus dados'},
    'novo-lead':{title:'Novo lead',sub:'Cadastro rápido'}
  };

  function iconTarget(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.7"/></svg>'}
  function ensureNavV5(){
    if(!$('.sidebar-nav [data-view="metas"]')){
      const btn=document.createElement('button');btn.className='nav-item';btn.dataset.view='metas';btn.innerHTML=iconTarget()+'<span>Metas</span>';
      ($('.sidebar-nav [data-view="dashboard"]')||$('.sidebar-nav [data-view="agenda"]'))?.insertAdjacentElement('afterend',btn);
    }
    if(!$('.rail [data-view="metas"]')){
      const btn=document.createElement('button');btn.className='rail-btn';btn.dataset.view='metas';btn.title='Metas';btn.innerHTML=iconTarget();
      ($('.rail [data-view="dashboard"]')||$('.rail [data-view="agenda"]'))?.insertAdjacentElement('afterend',btn);
    }
    if(!$('.topbar-tabs [data-view="metas"]')){
      const btn=document.createElement('button');btn.className='tab';btn.dataset.view='metas';btn.textContent='Metas';
      ($('.topbar-tabs [data-view="dashboard"]')||$('.topbar-tabs [data-view="agenda"]'))?.insertAdjacentElement('afterend',btn);
    }
  }

  function ensureGoalsSection(){
    if($('#metas')) return;
    const main=$('main.main'); if(!main) return;
    const sec=document.createElement('section');sec.id='metas';sec.className='view grid-view';
    sec.innerHTML=`
      <div class="section-header">
        <div><div class="section-title-text">Metas comerciais</div><div class="section-sub">Controle de ligações, reuniões, WhatsApps, propostas e fechamentos por período.</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm" id="goalSyncBtn">Atualizar pelo CRM</button><button class="btn btn-primary btn-sm" id="goalClearFormBtn">Nova meta</button></div>
      </div>
      <div class="goals-kpi-grid">
        <div class="goals-kpi"><div class="val" id="goalKpiActive">0</div><div class="lbl">Metas ativas</div></div>
        <div class="goals-kpi"><div class="val" id="goalKpiProgress">0%</div><div class="lbl">Progresso médio</div></div>
        <div class="goals-kpi"><div class="val" id="goalKpiHit">0</div><div class="lbl">Batidas</div></div>
        <div class="goals-kpi"><div class="val" id="goalKpiDue">0</div><div class="lbl">Encerram em 7 dias</div></div>
      </div>
      <div class="goals-layout">
        <div class="card"><div class="card-header"><div><div class="card-title">Cadastrar / editar meta</div><div class="card-sub">Defina quantidade, responsável e datas.</div></div></div>
          <div class="card-body"><form id="goalForm" class="goal-form">
            <input type="hidden" id="goalId">
            <div class="field"><label>Tipo de meta</label><select id="goalTipo"><option>Ligação</option><option>Reunião</option><option>WhatsApp</option><option>E-mail</option><option>Proposta</option><option>Fechamento</option><option>Atividade</option></select></div>
            <div class="field"><label>Título</label><input id="goalTitulo" placeholder="Ex: 80 ligações na semana"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label>Alvo</label><input id="goalAlvo" type="number" min="1" placeholder="80"></div><div class="field"><label>Realizado manual</label><input id="goalRealizado" type="number" min="0" placeholder="0"></div></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label>Data inicial</label><input id="goalInicio" type="date"></div><div class="field"><label>Data final</label><input id="goalFim" type="date"></div></div>
            <div class="field"><label>Responsável</label><input id="goalResponsavel" placeholder="Ex: SDR / Time Comercial"></div>
            <div class="field"><label>Apuração</label><select id="goalFonte"><option value="auto">Automática pelo CRM</option><option value="manual">Manual</option></select></div>
            <div class="field"><label>Observações</label><textarea id="goalObs" rows="3" placeholder="Ex: considerar apenas contatos novos, foco em C-level..."></textarea></div>
            <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" id="goalCancelBtn">Limpar</button><button type="submit" class="btn btn-primary">Salvar meta</button></div>
          </form></div>
        </div>
        <div class="card" style="overflow:hidden"><div class="card-header"><div><div class="card-title">Plano de metas</div><div class="card-sub">Acompanhe avanço, prazo e status.</div></div></div>
          <div class="goal-table-wrap"><table class="data-table"><thead><tr><th>Meta</th><th>Período</th><th>Realizado</th><th>Progresso</th><th>Status</th><th></th></tr></thead><tbody id="goalsTable"></tbody></table></div>
        </div>
      </div>`;
    const ref=$('#agenda')||$('#metricas')||main.lastElementChild;
    ref ? ref.insertAdjacentElement('afterend',sec) : main.appendChild(sec);
  }

  const GOAL_KEY='outbounder_goals_v5';
  function getGoals(){
    try{let arr=JSON.parse(localStorage.getItem(GOAL_KEY)||'null'); if(Array.isArray(arr)) return arr;}catch(e){}
    const t=todayISO();
    return [
      {id:'g_'+Date.now()+'_calls',tipo:'Ligação',titulo:'Ligações da semana',alvo:40,manualRealizado:0,inicio:t,fim:addDays(t,7),responsavel:'Time Comercial',fonte:'auto',obs:'Volume de prospecção ativa.'},
      {id:'g_'+Date.now()+'_meet',tipo:'Reunião',titulo:'Reuniões agendadas',alvo:8,manualRealizado:0,inicio:t,fim:addDays(t,7),responsavel:'SDR / Closer',fonte:'auto',obs:'Reuniões criadas pela agenda ou histórico.'},
      {id:'g_'+Date.now()+'_wpp',tipo:'WhatsApp',titulo:'Interações por WhatsApp',alvo:60,manualRealizado:0,inicio:t,fim:addDays(t,7),responsavel:'SDR',fonte:'auto',obs:'Mensagens registradas no histórico do lead.'}
    ];
  }
  let goalsV5=getGoals();
  function saveGoals(){try{localStorage.setItem(GOAL_KEY,JSON.stringify(goalsV5));}catch(e){}}

  function countFromCRM(tipo,start,end){
    let n=0;
    const list=(typeof leads!=='undefined' && Array.isArray(leads))?leads:[];
    list.forEach(l=>{
      (Array.isArray(l.atividades)?l.atividades:[]).forEach(a=>{
        const d=String(a.data||'').slice(0,10); if(!inRange(d,start,end)) return;
        const t=String(a.tipo||'').toLowerCase();
        if(tipo==='Ligação' && t.includes('liga')) n++;
        else if(tipo==='Reunião' && (t.includes('reuni')||t.includes('meeting'))) n++;
        else if(tipo==='WhatsApp' && t.includes('whats')) n++;
        else if(tipo==='E-mail' && (t.includes('e-mail')||t.includes('email'))) n++;
        else if(tipo==='Atividade') n++;
      });
      const ref=String(l.ultimaAtualizacao||l.dataFechamento||l.dataEntrada||'').slice(0,10);
      if(tipo==='Proposta' && ['Proposta','Fechado'].includes(l.etapa) && inRange(ref,start,end)) n++;
      if(tipo==='Fechamento' && l.etapa==='Fechado' && inRange(String(l.dataFechamento||l.ultimaAtualizacao||'').slice(0,10),start,end)) n++;
    });
    if(typeof agEvents!=='undefined' && Array.isArray(agEvents)){
      agEvents.forEach(ev=>{const d=String(ev.data||ev.start||'').slice(0,10); if(!inRange(d,start,end)) return; const t=String(ev.tipo||ev.title||'').toLowerCase(); if(tipo==='Reunião'&&t.includes('reuni')) n++; if(tipo==='Ligação'&&t.includes('liga')) n++; if(tipo==='WhatsApp'&&t.includes('whats')) n++; if(tipo==='E-mail'&&(t.includes('email')||t.includes('e-mail'))) n++; if(tipo==='Atividade') n++;});
    }
    return n;
  }
  function goalRealized(g){return g.fonte==='manual'?Number(g.manualRealizado||0):countFromCRM(g.tipo,g.inicio,g.fim)}
  function goalPct(g){return Math.min(999,Math.round((goalRealized(g)/(Number(g.alvo)||1))*100))}
  function goalStatus(g){const p=goalPct(g); if(p>=100)return ['Batida','goal-ok']; const days=Math.ceil((new Date((g.fim||todayISO())+'T00:00:00')-new Date(todayISO()+'T00:00:00'))/86400000); if(days<0)return ['Vencida','goal-bad']; if(days<=3&&p<70)return ['Atenção','goal-mid']; return ['Em andamento','goal-mid'];}

  function renderGoals(){
    const table=$('#goalsTable'); if(!table) return;
    const active=goalsV5.filter(g=>!g.fim || g.fim>=todayISO());
    const avg=goalsV5.length?Math.round(goalsV5.reduce((s,g)=>s+Math.min(100,goalPct(g)),0)/goalsV5.length):0;
    const hit=goalsV5.filter(g=>goalPct(g)>=100).length;
    const due=goalsV5.filter(g=>{const d=Math.ceil((new Date((g.fim||todayISO())+'T00:00:00')-new Date(todayISO()+'T00:00:00'))/86400000);return d>=0&&d<=7;}).length;
    const set=(id,v)=>{const el=$(id); if(el)el.textContent=v}; set('#goalKpiActive',active.length); set('#goalKpiProgress',avg+'%'); set('#goalKpiHit',hit); set('#goalKpiDue',due);
    if(!goalsV5.length){table.innerHTML='<tr><td colspan="6"><div class="goal-empty">Nenhuma meta cadastrada ainda.</div></td></tr>'; renderHomeExtras(); return;}
    table.innerHTML=goalsV5.map(g=>{const done=goalRealized(g),pct=goalPct(g),[st,cls]=goalStatus(g);return `<tr><td><strong>${esc(g.titulo||g.tipo)}</strong><div style="font-size:12px;color:var(--text-3);margin-top:3px">${esc(g.tipo)} · ${esc(g.responsavel||'Sem responsável')} · ${g.fonte==='auto'?'automática':'manual'}</div>${g.obs?`<div style="font-size:11.5px;color:var(--text-3);margin-top:3px">${esc(g.obs)}</div>`:''}</td><td><span class="goal-date-pill">${esc(g.inicio||'—')} → ${esc(g.fim||'—')}</span></td><td><strong>${done}</strong> / ${Number(g.alvo)||0}</td><td style="min-width:130px"><div class="crm-progress"><span style="width:${Math.min(100,pct)}%"></span></div><div style="font-size:11px;color:var(--text-3);margin-top:4px">${pct}%</div></td><td><span class="goal-status ${cls}">${st}</span></td><td><div class="goal-actions"><button class="btn btn-xs" data-goal-plus="${g.id}" title="Somar 1">+1</button><button class="btn btn-xs" data-goal-edit="${g.id}">Editar</button><button class="btn btn-xs btn-danger" data-goal-del="${g.id}">Excluir</button></div></td></tr>`}).join('');
    $$('[data-goal-plus]').forEach(b=>b.onclick=()=>{const g=goalsV5.find(x=>x.id===b.dataset.goalPlus); if(!g)return; g.fonte='manual'; g.manualRealizado=Number(g.manualRealizado||0)+1; saveGoals(); renderGoals(); toastV5('Realizado atualizado','success');});
    $$('[data-goal-edit]').forEach(b=>b.onclick=()=>fillGoalForm(b.dataset.goalEdit));
    $$('[data-goal-del]').forEach(b=>b.onclick=()=>{goalsV5=goalsV5.filter(g=>g.id!==b.dataset.goalDel);saveGoals();renderGoals();toastV5('Meta excluída','warn');});
    renderHomeExtras();
  }
  function clearGoalForm(){['goalId','goalTitulo','goalAlvo','goalRealizado','goalResponsavel','goalObs'].forEach(id=>{const el=$('#'+id);if(el)el.value=''}); const t=todayISO(); $('#goalInicio')&&( $('#goalInicio').value=t); $('#goalFim')&&($('#goalFim').value=addDays(t,7)); $('#goalTipo')&&($('#goalTipo').value='Ligação'); $('#goalFonte')&&($('#goalFonte').value='auto');}
  function fillGoalForm(id){const g=goalsV5.find(x=>x.id===id); if(!g)return; $('#goalId').value=g.id; $('#goalTipo').value=g.tipo||'Ligação'; $('#goalTitulo').value=g.titulo||''; $('#goalAlvo').value=g.alvo||''; $('#goalRealizado').value=g.manualRealizado||0; $('#goalInicio').value=g.inicio||todayISO(); $('#goalFim').value=g.fim||addDays(todayISO(),7); $('#goalResponsavel').value=g.responsavel||''; $('#goalFonte').value=g.fonte||'auto'; $('#goalObs').value=g.obs||''; $('#goalTitulo')?.focus();}
  function bindGoalEvents(){
    const form=$('#goalForm'); if(form && !form.dataset.bound){form.dataset.bound='1'; form.addEventListener('submit',e=>{e.preventDefault(); const id=$('#goalId').value||('g_'+Date.now()); const data={id,tipo:$('#goalTipo').value,titulo:($('#goalTitulo').value||($('#goalTipo').value+' de '+$('#goalInicio').value)).trim(),alvo:Number($('#goalAlvo').value)||1,manualRealizado:Number($('#goalRealizado').value)||0,inicio:$('#goalInicio').value||todayISO(),fim:$('#goalFim').value||addDays(todayISO(),7),responsavel:$('#goalResponsavel').value.trim()||'Time Comercial',fonte:$('#goalFonte').value||'auto',obs:$('#goalObs').value.trim()}; const idx=goalsV5.findIndex(g=>g.id===id); if(idx>-1)goalsV5[idx]=data; else goalsV5.unshift(data); saveGoals(); clearGoalForm(); renderGoals(); toastV5(idx>-1?'Meta atualizada':'Meta criada','success');});}
    $('#goalCancelBtn')?.addEventListener('click',clearGoalForm); $('#goalClearFormBtn')?.addEventListener('click',clearGoalForm); $('#goalSyncBtn')?.addEventListener('click',()=>{renderGoals();toastV5('Metas atualizadas com os dados do CRM','success');});
  }

  function toastV5(msg,type='') { try { if(typeof showToast==='function') return showToast(msg,type); } catch(e){} console.log(msg); }

  function ensureScriptLab(){
    const page=$('#playbooks'); if(!page || $('#scriptLab')) return;
    const lab=document.createElement('div');lab.id='scriptLab';lab.className='script-lab';
    lab.innerHTML=`<div class="script-lab-head"><div><h3>Criador de scripts com Gerador local</h3><p>Gere scripts para ligação, WhatsApp, e-mail e reunião usando estruturas inspiradas em prospecção direta, diagnóstico consultivo e melhoria contínua de outbound.</p></div><span class="pb-ai-badge">Gerador local</span></div>
      <div class="script-lab-body"><div class="script-lab-form">
        <div class="field"><label>Base do script</label><select id="aiBase"><option value="hibrido">Híbrido: Jeb + Thiago Reis</option><option value="jeb">Jeb Blount: abertura direta</option><option value="thiago">Thiago Reis: IA + hipótese de dor</option></select></div>
        <div class="field"><label>Canal</label><select id="aiCanal"><option value="todos">Todos</option><option value="ligacao">Ligação</option><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="reuniao">Reunião</option></select></div>
        <div class="field"><label>Persona / cargo</label><input id="aiPersona" placeholder="Ex: dono de franquia, gestor comercial"></div>
        <div class="field"><label>Dor provável</label><input id="aiDor" placeholder="Ex: baixa previsibilidade de vendas"></div>
        <div class="field"><label>Oferta / solução</label><input id="aiOferta" placeholder="Ex: CRM com follow-up e automação"></div>
        <div class="field"><label>Objetivo</label><select id="aiObjetivo"><option>Agendar reunião</option><option>Reativar lead</option><option>Conduzir diagnóstico</option><option>Enviar proposta</option><option>Contornar objeção</option></select></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" id="aiGenerateBtn" type="button">Gerar scripts</button><button class="btn" id="aiSavePbBtn" type="button">Salvar como playbook</button></div>
      </div><div class="script-output"><div class="script-framework-notes"><div class="script-note"><b>Jeb Blount</b><p>Use abertura objetiva, motivo claro, relevância e pedido específico de próximo passo.</p></div><div class="script-note"><b>Thiago Reis / Growth</b><p>Use hipótese de dor, teste de mensagem, leitura de objeções e otimização por resposta.</p></div></div><div id="aiScriptOutput" class="script-output-grid"><div class="crm-empty">Preencha os campos e clique em gerar scripts.</div></div></div></div>`;
    const after=$('.section-header',page); after ? after.insertAdjacentElement('afterend',lab) : page.prepend(lab);
    $('#aiGenerateBtn')?.addEventListener('click',renderAiScripts);
    $('#aiSavePbBtn')?.addEventListener('click',saveAiPlaybook);
    renderAiScripts(false);
  }
  function getAiInputs(){return {base:$('#aiBase')?.value||'hibrido',canal:$('#aiCanal')?.value||'todos',persona:($('#aiPersona')?.value||'decisor').trim(),dor:($('#aiDor')?.value||'falta de previsibilidade comercial').trim(),oferta:($('#aiOferta')?.value||'uma solução para organizar o processo comercial').trim(),objetivo:$('#aiObjetivo')?.value||'Agendar reunião'};}
  function scriptsFromInputs(){
    const i=getAiInputs(); const persona=i.persona, dor=i.dor, oferta=i.oferta, objetivo=i.objetivo;
    const jebOpen=`[NOME], aqui é [SEU NOME] da [EMPRESA]. Vou ser direto: trabalho com ${oferta} e estou falando com ${persona}s que têm enfrentado ${dor}.`;
    const hypothesis=`Minha hipótese é que hoje existe algum gargalo em ${dor}; se eu estiver errado, você me corrige em 30 segundos.`;
    const cta=objetivo==='Agendar reunião'?'Faz sentido olharmos isso em uma conversa de 15 minutos?': objetivo==='Reativar lead'?'Vale retomarmos esse assunto com o cenário atual?': objetivo==='Enviar proposta'?'Posso te enviar uma proposta objetiva com próximos passos?':'Posso te fazer duas perguntas rápidas para entender se faz sentido avançar?';
    return {
      ligacao:`${jebOpen}\n\n${i.base==='thiago'?hypothesis:'O motivo do contato é simples: normalmente esse problema aparece quando o time cresce, mas o processo ainda depende de planilha, memória ou follow-up manual.'}\n\nPergunta rápida: como vocês controlam hoje as oportunidades e próximos passos?\n\nSe fizer sentido, ${cta}`,
      whatsapp:`Oi [NOME], tudo bem? Sou [SEU NOME] da [EMPRESA].\n\nEstou falando com ${persona}s que querem resolver ${dor}. Minha hipótese é que ${oferta} pode ajudar com mais previsibilidade e menos perda de follow-up.\n\n${cta}`,
      email:`Assunto: Ideia rápida sobre ${dor}\n\nOlá [NOME], tudo bem?\n\nSou [SEU NOME], da [EMPRESA]. Estou conversando com ${persona}s que têm buscado melhorar ${dor}.\n\nA hipótese é simples: quando o processo comercial fica sem rotina clara de atividades, o funil perde previsibilidade. A ${oferta} pode ajudar a organizar follow-up, próximos passos e acompanhamento por meta.\n\n${cta}\n\nAbraço,\n[SEU NOME]`,
      reuniao:`1. Abertura — confirmar tempo e objetivo da conversa.\n2. Contexto — “o que fez ${dor} virar prioridade agora?”\n3. Diagnóstico — mapear volume, rotina, gargalos e impactos financeiros.\n4. Consequência — traduzir perda de follow-up, baixa conversão ou falta de reuniões em custo.\n5. Solução — conectar ${oferta} apenas aos problemas confirmados.\n6. Próximo passo — ${cta}`
    };
  }
  function renderAiScripts(showToastFlag=true){
    const out=$('#aiScriptOutput'); if(!out) return; const i=getAiInputs(), s=scriptsFromInputs(); const labels={ligacao:'📞 Ligação',whatsapp:'💬 WhatsApp',email:'✉️ E-mail',reuniao:'🎯 Roteiro de reunião'}; const keys=i.canal==='todos'?['ligacao','whatsapp','email','reuniao']:[i.canal];
    out.innerHTML=keys.map(k=>`<div class="ai-script-card"><div class="head"><b>${labels[k]}</b><span class="method-pill">${i.base==='jeb'?'Jeb':i.base==='thiago'?'Thiago / Growth':'Híbrido'}</span></div><div class="body">${esc(s[k])}</div></div>`).join('');
    if(showToastFlag) toastV5('Scripts gerados','success');
  }
  function saveAiPlaybook(){
    renderAiScripts(false);
    try{
      const i=getAiInputs(), s=scriptsFromInputs();
      const pb={id:'pb_ai_'+Date.now(),nome:'Script IA — '+(i.persona||'Prospecção'),objetivo:i.objetivo+' para '+i.persona+' com foco em '+i.dor,categoria:'Outbound',responsavel:'Time Comercial',checklist:[{id:'ck_ai1',titulo:'Validar persona e hipótese de dor antes do contato',prazo:0,resp:'SDR',obrig:true},{id:'ck_ai2',titulo:'Executar script no canal escolhido',prazo:0,resp:'SDR',obrig:true},{id:'ck_ai3',titulo:'Registrar objeção e resposta do lead',prazo:1,resp:'SDR',obrig:true},{id:'ck_ai4',titulo:'Ajustar script conforme taxa de resposta',prazo:3,resp:'Gestor',obrig:false}],scripts:s,materiais:[{nome:'Resumo executivo da oferta',tipo:'PDF',url:'#'},{nome:'Lista de objeções mais frequentes',tipo:'Link',url:'#'}],automacoes:['Criar follow-up se não houver resposta em 48h','Registrar objeção mais frequente no lead','Atualizar meta de atividade após contato']};
      if(typeof playbooks!=='undefined' && Array.isArray(playbooks)){playbooks.unshift(pb); if(typeof savePB==='function') savePB(); if(typeof renderPB==='function') renderPB();}
      else {const key='outbounder_playbooks'; const arr=JSON.parse(localStorage.getItem(key)||'[]'); arr.unshift(pb); localStorage.setItem(key,JSON.stringify(arr));}
      toastV5('Playbook criado com os scripts gerados','success');
    }catch(e){console.warn(e);toastV5('Não foi possível salvar o playbook','danger');}
  }
  function seedAdvancedPlaybooks(){
    try{
      if(typeof playbooks==='undefined' || !Array.isArray(playbooks)) return;
      const add=[];
      if(!playbooks.some(p=>p.id==='pb_jeb_blount_v5')) add.push({id:'pb_jeb_blount_v5',nome:'Prospecção Fanática — abertura direta',objetivo:'Gerar conversas comerciais com abordagem curta, motivo claro e pedido objetivo de próximo passo.',categoria:'Outbound',responsavel:'SDR',checklist:[{id:'j1',titulo:'Separar lista com fit e motivo de contato',prazo:0,resp:'SDR',obrig:true},{id:'j2',titulo:'Abrir com nome, apresentação e motivo direto',prazo:0,resp:'SDR',obrig:true},{id:'j3',titulo:'Conectar relevância à dor provável',prazo:0,resp:'SDR',obrig:true},{id:'j4',titulo:'Pedir uma reunião curta e objetiva',prazo:0,resp:'SDR',obrig:true},{id:'j5',titulo:'Registrar tentativa e próxima ação no CRM',prazo:1,resp:'SDR',obrig:true}],scripts:{ligacao:'[NOME], aqui é [SEU NOME] da [EMPRESA]. Vou ser breve: liguei porque ajudamos empresas como a [EMPRESA DO LEAD] a reduzir perda de oportunidades no funil. Como vocês controlam hoje os próximos passos comerciais? Se fizer sentido, podemos olhar isso em 15 minutos esta semana?',whatsapp:'Oi [NOME], sou [SEU NOME] da [EMPRESA]. Vi que a [EMPRESA] pode ter ganho com mais controle de follow-up e metas comerciais. Posso te mandar uma ideia objetiva?',email:'Assunto: Ideia rápida para o funil da [EMPRESA]\n\nOlá [NOME], estou entrando em contato porque ajudamos times comerciais a manter rotina de prospecção, acompanhamento e metas. Faz sentido conversarmos por 15 minutos esta semana?',reuniao:'Abertura direta → Diagnóstico rápido → Impacto da falta de rotina → Próximo passo objetivo.'},materiais:[{nome:'Checklist de ligação objetiva',tipo:'PDF',url:'#'}],automacoes:['Criar follow-up em 48h sem resposta','Atualizar meta de ligação ao registrar atividade']});
      if(!playbooks.some(p=>p.id==='pb_thiago_reis_ai_v5')) add.push({id:'pb_thiago_reis_ai_v5',nome:'Outbound com IA — hipótese, teste e otimização',objetivo:'Criar scripts por hipótese de dor, medir respostas, identificar objeções e melhorar a abordagem semanalmente.',categoria:'Outbound',responsavel:'Growth / SDR',checklist:[{id:'t1',titulo:'Criar hipótese de dor por segmento',prazo:0,resp:'SDR',obrig:true},{id:'t2',titulo:'Gerar 2 variações de script',prazo:0,resp:'SDR',obrig:true},{id:'t3',titulo:'Medir respostas e objeções',prazo:2,resp:'SDR',obrig:true},{id:'t4',titulo:'Atualizar script vencedor no playbook',prazo:5,resp:'Gestor',obrig:true}],scripts:{ligacao:'[NOME], minha hipótese é que hoje vocês perdem previsibilidade porque as atividades comerciais ficam espalhadas. Se isso fizer sentido, posso te mostrar em 15 minutos como organizar metas, follow-ups e pipeline no mesmo lugar?',whatsapp:'Oi [NOME], testando uma hipótese rápida: o maior gargalo hoje é volume de atividade, falta de follow-up ou baixa conversão? Dependendo da resposta, te mostro um caminho simples.',email:'Assunto: Hipótese sobre previsibilidade comercial\n\nOlá [NOME], minha hipótese é que a [EMPRESA] poderia ganhar previsibilidade ao medir ligações, reuniões e próximos passos por etapa. Posso te enviar um exemplo prático?',reuniao:'Hipótese inicial → perguntas de validação → objeções registradas → próxima ação mensurável → ajuste do script.'},materiais:[{nome:'Mapa de hipótese de dor',tipo:'Link',url:'#'}],automacoes:['Registrar objeção no histórico','Comparar taxa de resposta por script','Criar meta semanal de atividade']});
      if(add.length){playbooks.unshift(...add); if(typeof savePB==='function') savePB(); if(typeof renderPB==='function') renderPB();}
    }catch(e){console.warn('seed pb',e)}
  }

  const DASH_KEY='outbounder_dashboard_widgets_v5';
  const DASH_DEFAULT={hero:true,kpis:true,followups:true,goals:true,funnel:true,hotleads:true};
  let dashPrefs=(()=>{try{return {...DASH_DEFAULT,...JSON.parse(localStorage.getItem(DASH_KEY)||'{}')}}catch(e){return {...DASH_DEFAULT}}})();
  function saveDashPrefs(){try{localStorage.setItem(DASH_KEY,JSON.stringify(dashPrefs));}catch(e){}}
  function ensureHomeConfig(){
    const home=$('#inicio'); if(!home || $('#homeConfigBar')) return;
    const bar=document.createElement('div'); bar.id='homeConfigBar'; bar.className='crm-home-toolbar'; bar.innerHTML='<div><b>Painel principal configurável</b><p>Escolha quais quadros aparecem na tela inicial deste CRM.</p></div><button class="btn btn-sm" id="dashboardCustomizeBtn">Editar quadros</button>';
    home.insertAdjacentElement('afterbegin',bar);
    const hg=$('.home-grid',home); if(hg) hg.dataset.dashboardWidget='hero';
    const sg=$('.stats-grid',home); if(sg) sg.dataset.dashboardWidget='kpis';
    const bottom=Array.from(home.children).find(el=>el.getAttribute('style')?.includes('grid-template-columns:1.3fr 1fr')); if(bottom) bottom.dataset.dashboardWidget='followups';
    if(!$('#homeExtraWidgets')){
      const extra=document.createElement('div'); extra.id='homeExtraWidgets'; extra.className='crm-home-extra'; extra.innerHTML=`
        <div class="card" data-dashboard-widget="goals"><div class="card-header"><div><div class="card-title">Metas em foco</div><div class="card-sub">Próximas metas comerciais</div></div><button class="btn btn-sm" data-view="metas">Ver metas</button></div><div class="card-body" id="homeGoalsWidget"></div></div>
        <div class="card" data-dashboard-widget="funnel"><div class="card-header"><div><div class="card-title">Pulso do funil</div><div class="card-sub">Distribuição atual por etapa</div></div><button class="btn btn-sm" data-view="funil">Ver funil</button></div><div class="card-body" id="homeFunnelWidget"></div></div>
        <div class="card" data-dashboard-widget="hotleads"><div class="card-header"><div><div class="card-title">Leads quentes</div><div class="card-sub">Maior potencial de avanço</div></div><button class="btn btn-sm" data-view="leads">Ver leads</button></div><div class="card-body" id="homeHotLeadsWidget"></div></div>`;
      const sg=$('.stats-grid',home); sg?sg.insertAdjacentElement('afterend',extra):home.appendChild(extra);
    }
    if(!$('#dashboardWidgetModal')){
      const modal=document.createElement('div'); modal.id='dashboardWidgetModal'; modal.className='modal-overlay hidden crm-widget-modal'; modal.innerHTML=`<div class="modal-box"><div class="modal-head"><h3>Editar quadros do painel</h3><button class="modal-close" id="dashboardWidgetClose">×</button></div><div class="modal-body"><div class="crm-widget-checks" id="dashboardWidgetChecks"></div></div><div class="modal-foot"><button class="btn" id="dashboardWidgetAll">Mostrar todos</button><button class="btn btn-primary" id="dashboardWidgetSave">Salvar</button></div></div>`;
      document.body.appendChild(modal);
    }
    $('#dashboardCustomizeBtn')?.addEventListener('click',openDashModal); $('#dashboardWidgetClose')?.addEventListener('click',()=>$('#dashboardWidgetModal').classList.add('hidden')); $('#dashboardWidgetModal')?.addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.classList.add('hidden')}); $('#dashboardWidgetAll')?.addEventListener('click',()=>{dashPrefs={...DASH_DEFAULT}; openDashModal(); applyDashboardPrefs();}); $('#dashboardWidgetSave')?.addEventListener('click',()=>{$$('#dashboardWidgetChecks input').forEach(i=>dashPrefs[i.value]=i.checked); saveDashPrefs(); applyDashboardPrefs(); $('#dashboardWidgetModal').classList.add('hidden'); toastV5('Painel atualizado','success');});
  }
  function openDashModal(){const labels={hero:['Boas-vindas e atalhos','Card inicial e acesso aos módulos'],kpis:['Indicadores principais','Leads, propostas, fechamentos e pipeline'],followups:['Follow-ups e nota rápida','Lista de pendências e bloco de nota'],goals:['Metas em foco','Resumo das metas mais próximas'],funnel:['Pulso do funil','Quantidade e valor por etapa'],hotleads:['Leads quentes','Oportunidades com maior score']}; const box=$('#dashboardWidgetChecks'); if(box) box.innerHTML=Object.entries(labels).map(([k,[t,s]])=>`<label class="crm-widget-check"><input type="checkbox" value="${k}" ${dashPrefs[k]?'checked':''}><div><strong>${t}</strong><span>${s}</span></div></label>`).join(''); $('#dashboardWidgetModal')?.classList.remove('hidden');}
  function applyDashboardPrefs(){Object.keys(DASH_DEFAULT).forEach(k=>$$(`[data-dashboard-widget="${k}"]`).forEach(el=>el.classList.toggle('crm-widget-hidden',!dashPrefs[k])));}
  function renderHomeExtras(){
    const goals=$('#homeGoalsWidget'); if(goals){const list=goalsV5.slice().sort((a,b)=>(a.fim||'9999').localeCompare(b.fim||'9999')).slice(0,3); goals.innerHTML=list.length?`<div class="crm-home-list">${list.map(g=>`<div class="crm-home-row"><div><b>${esc(g.titulo||g.tipo)}</b><br><span>${goalRealized(g)} / ${Number(g.alvo)||0} · até ${esc(g.fim||'—')}</span></div><strong>${goalPct(g)}%</strong></div>`).join('')}</div>`:'<div class="crm-empty">Nenhuma meta cadastrada.</div>';}
    const funnel=$('#homeFunnelWidget'); if(funnel){const list=(typeof leads!=='undefined'&&Array.isArray(leads))?leads:[]; const total=list.length||1; funnel.innerHTML=stagesV5.map(s=>{const arr=list.filter(l=>l.etapa===s),v=arr.reduce((sum,l)=>sum+(Number(l.valor)||0),0); return `<div class="crm-home-row"><div><b>${s}</b><br><span>${arr.length} lead(s) · ${moneyFmt(v)}</span></div><strong>${Math.round((arr.length/total)*100)}%</strong></div>`}).join('');}
    const hot=$('#homeHotLeadsWidget'); if(hot){let list=(typeof leads!=='undefined'&&Array.isArray(leads))?leads:[]; const score=(l)=>{try{return typeof calcScore==='function'?calcScore(l):(STAGE_PROB_V5[l.etapa]||0)+(l.prioridade==='Alta'?20:l.prioridade==='Média'?10:3)}catch(e){return 0}}; list=list.filter(l=>!['Fechado','Perdido'].includes(l.etapa)).sort((a,b)=>score(b)-score(a)).slice(0,4); hot.innerHTML=list.length?`<div class="crm-home-list">${list.map(l=>`<div class="crm-home-row" data-open-hot="${esc(l.id||l.nome)}" style="cursor:pointer"><div><b>${esc(l.nome)}</b><br><span>${esc(l.etapa)} · ${esc(l.responsavel||'Sem responsável')}</span></div><strong>${score(l)}</strong></div>`).join('')}</div>`:'<div class="crm-empty">Sem leads abertos.</div>'; $$('[data-open-hot]',hot).forEach(x=>x.onclick=()=>{try{typeof openDetail==='function'&&openDetail(x.dataset.openHot)}catch(e){}})};
    applyDashboardPrefs();
  }

  function crmSetViewV5(view){
    if(!view) return;
    if(view==='novo-lead') {try{typeof openModal==='function'?openModal(null):null}catch(e){} return;}
    const target=$('#'+CSS.escape(view)); const isChat=view==='chat'; if(!target && !isChat) return;
    $$('.view').forEach(el=>{el.classList.remove('active'); el.style.display='';});
    const chat=$('#chat');
    if(isChat){ if(chat){chat.classList.add('active'); chat.style.display='block';} }
    else { if(chat){chat.classList.remove('active'); chat.style.display='none';} target.classList.add('active'); target.style.display=''; }
    $$('[data-view],[data-go],[data-go-view]').forEach(el=>{const key=el.dataset.view||el.dataset.go||el.dataset.goView; el.classList.toggle('active',key===view);});
    const meta=VIEW_META_V5[view]||{title:view,sub:''}; $('#topbarTitle')&&($('#topbarTitle').textContent=meta.title); $('#topbarSub')&&($('#topbarSub').textContent=meta.sub);
    if(view==='agenda') callSafe('renderAgenda',40); if(view==='metricas') callSafe('renderMetrics',40); if(view==='dashboard') callSafe('renderDashboard',40); if(view==='playbooks'){callSafe('renderPB',40); setTimeout(()=>{ensureScriptLab();},30);} if(view==='objecoes') callSafe('renderObj',40); if(view==='perdas') callSafe('renderPerdas',40); if(view==='funil') callSafe('renderFunilPage',40); if(view==='metas') setTimeout(renderGoals,20); if(view==='chat'){callSafe('renderConversationList');callSafe('updateChatBadge');}
    if(view==='inicio') setTimeout(renderHomeExtras,30);
  }
  function installFinalRouter(){
    window.setView=crmSetViewV5; try{setView=crmSetViewV5;}catch(e){}
    window.addEventListener('click',function(e){
      const btn=e.target.closest('[data-view],[data-go],[data-go-view]'); if(!btn) return;
      const view=btn.dataset.view||btn.dataset.go||btn.dataset.goView; if(!view) return;
      if(view==='novo-lead' || view==='chat' || $('#'+CSS.escape(view))){e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); crmSetViewV5(view);}
    },true);
  }

  function patchRenderAll(){
    if(window.__crmV5RenderPatched) return; window.__crmV5RenderPatched=true;
    try{const old=typeof renderAll==='function'?renderAll:null; if(old){renderAll=function(){old(); renderGoals(); renderHomeExtras();}; try{window.renderAll=renderAll}catch(e){}}}catch(e){}
  }

  function init(){
    ensureNavV5(); ensureGoalsSection(); ensureScriptLab(); seedAdvancedPlaybooks(); ensureHomeConfig(); bindGoalEvents(); clearGoalForm(); renderGoals(); renderHomeExtras(); applyDashboardPrefs(); installFinalRouter(); patchRenderAll();
    const active=$('.view.active'); crmSetViewV5(active?active.id:'inicio');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
