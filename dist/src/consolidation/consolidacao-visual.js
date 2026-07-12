(function(){
  'use strict';
  const W=window,D=document;
  const VERSION='V98 Consolidação Estável';
  const $=(s,r=D)=>r.querySelector(s);
  const $$=(s,r=D)=>Array.from(r.querySelectorAll(s));
  const LEGACY={
    funil:{parent:'pipeline',mode:'funil'},
    clientes:{parent:'leads',mode:'clientes'},
    objecoes:{parent:'playbooks',mode:'objecoes'},
    dashboard:{parent:'metricas',mode:'dashboard'},
    perdas:{parent:'metricas',mode:'perdas'},
    importar:{parent:'configuracoes',mode:'importar'}
  };
  const KEYS={leads:'crm_v975_leads_mode',pipeline:'crm_v975_pipeline_mode',playbooks:'crm_v975_playbooks_mode',metricas:'crm_v975_metricas_mode',configuracoes:'crm_v975_config_mode'};
  const TITLES={inicio:['Painel','Visão geral das suas oportunidades'],leads:['Gestão de leads','Base comercial principal'],pipeline:['Pipeline','Kanban, lista, calendário e visualização em funil'],playbooks:['Playbooks','Scripts, checklists e biblioteca de objeções'],metricas:['Métricas','Dashboard, indicadores e análise de perdas'],configuracoes:['Configurações','Personalização, manutenção e importar/exportar'],metas:['Metas comerciais','Ligações, follow-ups, propostas e fechamentos'],cadencias:['Follow-ups','Rotina de próximos contatos'],agenda:['Agenda','Planejamento e compromissos'],ligacoes:['Ligações','Fila de chamadas e histórico'],automacoes:['Automações','Regras e gatilhos comerciais'],garimpo:['Garimpo de Leads','Prospecção e criação de oportunidades'],chat:['Atendimento','Conversas com leads e clientes']};
  let latestPreviousSetView=null;
  let pendingTarget='';
  let objCat='';
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function brl(v){return 'R$ '+Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:0});}
  function today(){return new Date().toISOString().slice(0,10);}
  function read(k,d){try{return localStorage.getItem(k)||d}catch(e){return d}}
  function write(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function toast(msg,type){try{if(typeof W.showToast==='function')return W.showToast(msg,type||'success');if(typeof W.toast==='function')return W.toast(msg,type||'success')}catch(e){}console.info('[V97.5]',msg);}
  function leads(){try{return W.CRMV94Official?.getLeads?.()||[]}catch(e){return []}}
  function saveLeads(list){try{return W.CRMV94Official?.saveLeads?.(list)}catch(e){console.warn('[V97.5] falha ao salvar leads',e)}}
  function setMode(parent,mode){if(KEYS[parent])write(KEYS[parent],mode);}
  function mode(parent,def){return read(KEYS[parent],def);}
  function syncTitle(parent){const meta=TITLES[parent];if(!meta)return;const t=$('#topbarTitle'),sub=$('#topbarSub');if(t)t.textContent=meta[0];if(sub)sub.textContent=meta[1];}
  function forceParent(parent){
    $$('[data-v975-legacy-placeholder]').forEach(sanitizeLegacyPlaceholder);
    const target=D.getElementById(parent);
    if(!target||!target.classList.contains('view'))return false;
    $$('.view').forEach(v=>v.classList.toggle('active',v===target));
    $$('[data-view],[data-go-view]').forEach(el=>{
      const value=el.getAttribute('data-view')||el.getAttribute('data-go-view');
      if(el.classList.contains('nav-item')||el.classList.contains('rail-btn'))el.classList.toggle('active',value===parent);
    });
    D.body.dataset.currentView=parent;syncTitle(parent);
    return true;
  }
  function finiteEnhance(parent,target){
    [0,70,190,420].forEach(ms=>setTimeout(()=>{if(parent)forceParent(parent);enhance(parent,target)},ms));
    if(target)setTimeout(()=>{if(pendingTarget===target)pendingTarget='';},560);
  }
  function routeLegacy(target,navigator){
    const cfg=LEGACY[target];if(!cfg)return false;
    setMode(cfg.parent,cfg.mode);pendingTarget=target;
    const nav=typeof navigator==='function'?navigator:latestPreviousSetView;
    try{nav?.call(W,cfg.parent)}catch(e){console.warn('[V97.5] rota legada',target,e)}
    forceParent(cfg.parent);finiteEnhance(cfg.parent,target);
    try{history.replaceState(null,'','#'+cfg.parent)}catch(e){}
    return true;
  }
  function installRouter(){
    if(typeof W.setView==='function'&&W.setView.__v975Router)return;
    W.__crmV975RouterInstalled=true;
    const prev=W.setView;latestPreviousSetView=prev;
    const wrapped=function(view){
      view=String(view||'');
      if(LEGACY[view]){routeLegacy(view,prev);return;}
      const out=typeof prev==='function'?prev.apply(this,arguments):undefined;
      if(D.getElementById(view)?.classList.contains('view'))forceParent(view);
      finiteEnhance(view,'');
      return out;
    };
    wrapped.__v975Router=true;wrapped.__v975Previous=prev;
    W.setView=wrapped;
    try{setView=wrapped}catch(e){}
  }
  function normalizeLegacyLinks(){
    $('.v97-nav-archive')?.remove();
    Object.entries(LEGACY).forEach(([old,cfg])=>{
      $$('[data-view="'+old+'"],[data-go-view="'+old+'"],a[href="#'+old+'"]').forEach(el=>{
        const navLike=el.matches('.nav-item,.rail-btn,.tab')||!!el.closest('.v97-archive-list');
        if(navLike){el.remove();return;}
        el.dataset.v975Target=old;
        if(el.hasAttribute('data-view'))el.setAttribute('data-view',cfg.parent);
        if(el.hasAttribute('data-go-view'))el.setAttribute('data-go-view',cfg.parent);
        if(el.matches('a[href]'))el.setAttribute('href','#'+cfg.parent);
      });
    });
  }
  function sanitizeLegacyPlaceholder(el){if(!el)return;el.hidden=true;el.className='';el.removeAttribute('style');el.dataset.v975LegacyPlaceholder='1';el.setAttribute('aria-hidden','true');}
  function cleanLegacyViews(){
    Object.keys(LEGACY).forEach(id=>{
      const old=D.getElementById(id);if(!old)return;
      if(old.dataset.v975LegacyPlaceholder==='1'){sanitizeLegacyPlaceholder(old);return;}
      const ph=D.createElement('div');ph.id=id;sanitizeLegacyPlaceholder(ph);old.replaceWith(ph);
    });
  }
  function getActive(){const active=$('.view.active')?.id;if(active)return active;const h=location.hash.replace('#','');return LEGACY[h]?.parent||h||'inicio';}
  function enhance(parent,target){
    const active=getActive();
    if(parent&&active!==parent&&!(parent==='configuracoes'&&active==='configuracoes'))return;
    if(active==='pipeline')enhancePipeline(target);
    if(active==='leads')enhanceLeads(target);
    if(active==='playbooks')enhancePlaybooks(target);
    if(active==='metricas')enhanceMetricas(target);
    if(active==='configuracoes')enhanceConfig(target);
  }
  function enhancePipeline(target){
    const sec=$('#pipeline');if(!sec||!sec.classList.contains('active'))return;
    const requested=(target==='funil'||pendingTarget==='funil')?'funil':mode('pipeline','kanban');
    const map={kanban:'kanban',tabela:'table',table:'table',funil:'funnel',funnel:'funnel'};
    const wanted=map[requested]||'kanban';
    if(target==='funil'||pendingTarget==='funil')setMode('pipeline','funil');
    try{localStorage.setItem('crm_v65_pipeline_view',wanted)}catch(e){}
    const native=sec.querySelector('[data-v65-pipe-view="'+wanted+'"]');
    if(native&&!native.classList.contains('active'))native.click();
    else if(window.CRMV65Pipeline?.render)window.CRMV65Pipeline.render();
  }
  function clientsOf(all){return all.filter(l=>/fechado|ganho|cliente/i.test(String(l.pipeline||l.etapa||'')));}
  function renderClients(){
    const host=$('#v975ClientsBody');if(!host)return;
    const all=leads(),list=clientsOf(all),value=list.reduce((s,l)=>s+Number(l.valor||0),0);
    host.innerHTML='<div class="v975-client-panel">'+
      '<div class="v975-dashboard-grid">'+
        '<div class="v975-stat"><span>Clientes ativos</span><strong>'+list.length+'</strong><small>Negócios fechados/ganhos</small></div>'+
        '<div class="v975-stat"><span>Receita cadastrada</span><strong>'+esc(brl(value))+'</strong><small>Valor dos clientes</small></div>'+
        '<div class="v975-stat"><span>Ticket médio</span><strong>'+esc(brl(list.length?value/list.length:0))+'</strong><small>Média por cliente</small></div>'+
        '<div class="v975-stat"><span>Conversão da base</span><strong>'+(all.length?Math.round(list.length/all.length*100):0)+'%</strong><small>Clientes / total de leads</small></div>'+
      '</div>'+
      '<section class="v975-panel"><div class="v975-panel-head"><div><h2>Clientes</h2><p>Relacionamentos que já avançaram para Fechado/Ganho, usando a mesma ficha única dos Leads.</p></div><div class="v975-actions"><span class="v975-route-note">Dentro de Leads</span><button class="v94-btn primary" type="button" data-v94-action="new-lead">Novo contato</button></div></div>'+
      (list.length?'<div class="v975-table-wrap"><table class="v975-table"><thead><tr><th>Cliente</th><th>Contato</th><th>Segmento / cidade</th><th>Responsável</th><th>Valor</th><th>Último resultado</th><th></th></tr></thead><tbody>'+list.map(l=>'<tr><td><div class="v975-person"><span class="v975-avatar">'+esc((l.empresa||l.nome||'?').charAt(0).toUpperCase())+'</span><div><b>'+esc(l.empresa||l.nome)+'</b><small>'+esc(l.origem||'CRM')+'</small></div></div></td><td>'+esc(l.telefone||'-')+'</td><td><b>'+esc(l.segmento||'-')+'</b><br><small>'+esc(l.cidade||'-')+'</small></td><td>'+esc(l.responsavel||'-')+'</td><td><b>'+esc(brl(l.valor))+'</b></td><td>'+esc(l.ultimoResultado||'Fechado')+'</td><td><button class="v94-btn soft" type="button" data-v95-open-lead="'+esc(l.id)+'">Abrir ficha</button></td></tr>').join('')+'</tbody></table></div>':'<div class="v975-empty">Nenhum cliente fechado ainda. Quando um lead for movido para Fechado/Ganho, ele aparecerá aqui automaticamente.</div>')+
      '</section></div>';
  }
  function applyLeadsMode(wanted){
    const sec=$('#leads');if(!sec)return;
    const base=sec.querySelector('[data-v975-leads-base]');const clients=sec.querySelector('#v975ClientsBody');
    sec.querySelectorAll('[data-v975-leads-mode]').forEach(b=>b.classList.toggle('active',b.dataset.v975LeadsMode===wanted));
    if(base)base.hidden=wanted==='clientes';if(clients)clients.hidden=wanted!=='clientes';
    if(wanted==='clientes')renderClients();
  }
  function enhanceLeads(target){
    const sec=$('#leads');if(!sec||!sec.classList.contains('active'))return;
    const shell=sec.querySelector('.v94-shell');if(!shell)return;
    let base=sec.querySelector('[data-v975-leads-base]');
    if(!base){const panel=Array.from(shell.children).find(x=>x.classList?.contains('v94-panel'));if(panel){panel.dataset.v975LeadsBase='1';base=panel;}}
    let nav=sec.querySelector('[data-v975-leads-nav]');
    if(!nav){nav=D.createElement('div');nav.className='v975-subnav';nav.dataset.v975LeadsNav='1';nav.innerHTML='<button type="button" data-v975-leads-mode="base">Base de Leads</button><button type="button" data-v975-leads-mode="clientes">Clientes</button>';if(base)base.insertAdjacentElement('beforebegin',nav);else shell.appendChild(nav);}
    let clients=sec.querySelector('#v975ClientsBody');if(!clients){clients=D.createElement('div');clients.id='v975ClientsBody';clients.hidden=true;(base||nav).insertAdjacentElement('afterend',clients);}
    const wanted=(target==='clientes'||pendingTarget==='clientes')?'clientes':mode('leads','base');
    if(target==='clientes'||pendingTarget==='clientes')setMode('leads','clientes');
    applyLeadsMode(wanted);
  }
  function objectionLibraryMarkup(){
    return '<section class="v975-panel v975-objection-library" data-v975-objection-library><div class="v975-panel-head"><div><h2>Biblioteca de objeções</h2><p>A estrutura antiga foi trazida para dentro de Playbooks, com busca, categorias, respostas alternativas e taxa de sucesso.</p></div><div class="v975-actions"><span class="v975-route-note">Dentro de Playbooks</span><button class="v94-btn primary" type="button" data-v975-new-objection>Nova objeção</button></div></div><div class="v975-library-tools"><input class="v975-search" id="v975ObjSearch" placeholder="Buscar objeção ou resposta..."><div class="v975-category-row">'+['','Preço','Tempo','Concorrência','Necessidade','Autoridade'].map((c,i)=>'<button type="button" class="'+(i===0?'active':'')+'" data-v975-obj-cat="'+esc(c)+'">'+(c||'Todas')+'</button>').join('')+'</div></div><div class="obj-grid" id="objGrid"></div></section>';
  }
  function enhanceObjections(){
    const body=$('#v94PbBody');if(!body)return false;
    if(!body.querySelector('[data-v975-objection-library]'))body.insertAdjacentHTML('beforeend',objectionLibraryMarkup());
    const grid=body.querySelector('#objGrid');
    try{
      if(typeof W.renderObj==='function')W.renderObj(objCat,$('#v975ObjSearch')?.value||'');
      else if(grid&&!grid.children.length)grid.innerHTML='<div class="v975-empty">A biblioteca está pronta. Os registros salvos aparecerão aqui ao abrir o CRM em uma origem normal.</div>';
    }catch(e){if(grid&&!grid.children.length)grid.innerHTML='<div class="v975-empty">Não foi possível carregar os registros antigos, mas a área de Objeções foi consolidada corretamente.</div>';console.warn('[V97.5] biblioteca de objeções',e)}
    return true;
  }
  function prepareObjectionsView(){
    const sec=$('#playbooks');if(!sec||!sec.classList.contains('active'))return false;
    let personal=sec.querySelector('[data-v94-pb-tab="personalizacao"]');
    let body=sec.querySelector('#v94PbBody');
    if((!personal||!body)&&typeof W.CRMV94Official?.renderPlaybooks==='function'){
      try{W.CRMV94Official.renderPlaybooks()}catch(e){console.warn('[V97.5] renderização de Playbooks',e)}
      forceParent('playbooks');personal=sec.querySelector('[data-v94-pb-tab="personalizacao"]');body=sec.querySelector('#v94PbBody');
    }
    if(personal){personal.textContent='Objeções';personal.title='Objeções do playbook e biblioteca comercial';if(!personal.classList.contains('active'))personal.click();}
    setTimeout(enhanceObjections,0);
    return !!body;
  }
  function enhancePlaybooks(target){
    const sec=$('#playbooks');if(!sec||!sec.classList.contains('active'))return;
    let personal=sec.querySelector('[data-v94-pb-tab="personalizacao"]');
    if(personal){personal.textContent='Objeções';personal.title='Objeções do playbook e biblioteca comercial';}
    const wanted=(target==='objecoes'||pendingTarget==='objecoes')?'objecoes':mode('playbooks','estrategia');
    if(target==='objecoes'||pendingTarget==='objecoes')setMode('playbooks','objecoes');
    if(wanted==='objecoes'){
      [0,35,110,260].forEach(ms=>setTimeout(()=>{forceParent('playbooks');prepareObjectionsView()},ms));
    }
  }
  function renderDashboard(){
    const body=$('#v94MetBody');if(!body)return;
    const all=leads(),active=all.filter(l=>!/fechado|perdido/i.test(String(l.pipeline||''))),won=all.filter(l=>/fechado|ganho/i.test(String(l.pipeline||''))),lost=all.filter(l=>/perdido/i.test(String(l.pipeline||'')));
    const totalValue=active.reduce((s,l)=>s+Number(l.valor||0),0),wonValue=won.reduce((s,l)=>s+Number(l.valor||0),0);
    const stages=[...new Set(all.map(l=>l.pipeline||l.etapa||'Lead'))];const max=Math.max(1,...stages.map(st=>all.filter(l=>(l.pipeline||l.etapa)===st).length));
    const origins=Object.entries(all.reduce((g,l)=>{const k=l.campanha||l.origem||'Sem origem';g[k]=g[k]||[];g[k].push(l);return g},{})).sort((a,b)=>b[1].length-a[1].length);
    const due=all.filter(l=>l.proximaData&&l.proximaData<=today()&&!/fechado|perdido/i.test(String(l.pipeline||''))).sort((a,b)=>String(a.proximaData).localeCompare(String(b.proximaData))).slice(0,7);
    body.innerHTML='<div class="v975-dashboard"><div class="v975-dashboard-grid">'+
      '<div class="v975-stat"><span>Pipeline aberto</span><strong>'+esc(brl(totalValue))+'</strong><small>'+active.length+' oportunidades ativas</small></div>'+
      '<div class="v975-stat"><span>Receita fechada</span><strong>'+esc(brl(wonValue))+'</strong><small>'+won.length+' clientes ganhos</small></div>'+
      '<div class="v975-stat"><span>Conversão</span><strong>'+(all.length?Math.round(won.length/all.length*100):0)+'%</strong><small>Fechados / base total</small></div>'+
      '<div class="v975-stat"><span>Perdas</span><strong>'+lost.length+'</strong><small>'+esc(brl(lost.reduce((s,l)=>s+Number(l.valor||0),0)))+' em oportunidades</small></div>'+
      '</div><div class="v975-two-col"><section class="v975-panel"><div class="v975-panel-head"><div><h2>Distribuição do Pipeline</h2><p>Dados reais da ficha única dos leads.</p></div><span class="v975-route-note">Dashboard em Métricas</span></div>'+stages.map(st=>{const arr=all.filter(l=>(l.pipeline||l.etapa)===st),val=arr.reduce((s,l)=>s+Number(l.valor||0),0);return '<div class="v975-stage-row"><b>'+esc(st)+'</b><div class="v975-bar"><span style="width:'+Math.max(3,Math.round(arr.length/max*100))+'%"></span></div><small>'+arr.length+' · '+esc(brl(val))+'</small></div>'}).join('')+'</section><section class="v975-panel"><div class="v975-panel-head"><div><h2>Ações prioritárias</h2><p>Hoje e vencidas.</p></div></div><div class="v975-due-list">'+(due.length?due.map(l=>'<div class="v975-due"><div><b>'+esc(l.empresa||l.nome)+'</b><small>'+esc(l.proximaData||'')+' '+esc(l.proximaHora||'')+' · '+esc(l.followup||'')+'</small></div><button class="v94-btn soft" data-v95-open-lead="'+esc(l.id)+'">Abrir</button></div>').join(''):'<div class="v975-empty">Nenhuma ação vencida.</div>')+'</div></section></div><section class="v975-panel"><div class="v975-panel-head"><div><h2>Origem e campanhas</h2><p>Volume, valor e avanço comercial por fonte.</p></div></div>'+(origins.length?origins.map(([name,arr])=>'<div class="v975-origin-row"><b>'+esc(name)+'</b><div class="v975-bar"><span style="width:'+Math.max(3,Math.round(arr.length/Math.max(1,all.length)*100))+'%"></span></div><small>'+arr.length+' leads · '+esc(brl(arr.reduce((s,l)=>s+Number(l.valor||0),0)))+'</small></div>').join(''):'<div class="v975-empty">Sem dados de origem.</div>')+'</section></div>';
  }
  function lossCompatibilityMarkup(){
    const lost=leads().filter(l=>/perdido/i.test(String(l.pipeline||l.etapa||'')));
    return '<div class="v975-loss-center"><section class="v975-panel"><div class="v975-panel-head"><div><h2>Perdas registradas no Pipeline</h2><p>Leads marcados como Perdido na ficha única.</p></div><div class="v975-actions"><span class="v975-route-note">Dentro de Métricas</span><button class="v94-btn primary" type="button" data-v975-new-loss>Registrar análise de perda</button></div></div>'+(lost.length?'<div class="v975-table-wrap"><table class="v975-table"><thead><tr><th>Lead</th><th>Segmento</th><th>Responsável</th><th>Valor</th><th>Último resultado</th><th></th></tr></thead><tbody>'+lost.map(l=>'<tr><td><b>'+esc(l.empresa||l.nome)+'</b></td><td>'+esc(l.segmento||'-')+'</td><td>'+esc(l.responsavel||'-')+'</td><td>'+esc(brl(l.valor))+'</td><td>'+esc(l.ultimoResultado||'Perdido')+'</td><td><button class="v94-btn soft" data-v95-open-lead="'+esc(l.id)+'">Abrir ficha</button></td></tr>').join('')+'</tbody></table></div>':'<div class="v975-empty">Nenhum lead está marcado como Perdido.</div>')+'</section><div class="v975-loss-kpis"><div class="v975-stat"><span>Perdas analisadas</span><strong id="perdaKpiTotal">0</strong><small>Registros históricos</small></div><div class="v975-stat"><span>Valor perdido</span><strong id="perdaKpiValor">R$0</strong><small>Somatório analisado</small></div><div class="v975-stat"><span>Potencial reativação</span><strong id="perdaKpiReativ">0</strong><small>Média/alta probabilidade</small></div><div class="v975-stat"><span>Motivo principal</span><strong id="perdaKpiPrincipal">—</strong><small>Mais frequente</small></div></div><div class="v975-loss-grid"><section class="v975-panel"><div class="v975-panel-head"><div><h2>Motivos mais frequentes</h2><p>Aprendizados consolidados.</p></div></div><div id="perdaFreqChart"></div><div class="v975-panel-head" style="margin-top:18px"><div><h2>Próximas reativações</h2></div></div><div id="perdaReativList"></div></section><section class="v975-panel"><div class="v975-panel-head"><div><h2>Histórico e plano de recuperação</h2><p>Concorrente, aprendizados, melhorias e estratégia futura.</p></div></div><div id="perdaList"></div></section></div></div>';
  }
  function renderLosses(){const body=$('#v94MetBody');if(!body)return;body.innerHTML=lossCompatibilityMarkup();try{W.renderPerdas?.()}catch(e){console.warn('[V97.5] centro de perdas',e)}}
  function ensureDashboardTab(sec){
    const tabs=sec.querySelector('.v94-tabs');if(!tabs)return null;
    let b=tabs.querySelector('[data-v975-met-tab="dashboard"]');
    if(!b){b=D.createElement('button');b.className='v94-tab';b.type='button';b.dataset.v975MetTab='dashboard';b.textContent='Dashboard';const first=tabs.querySelector('[data-v94-met-tab="geral"]');first?.insertAdjacentElement('afterend',b);}
    return b;
  }
  function applyMetricMode(wanted){
    const sec=$('#metricas');if(!sec)return;
    const dash=ensureDashboardTab(sec);
    sec.querySelectorAll('.v94-tab').forEach(b=>b.classList.toggle('active',(wanted==='dashboard'&&b===dash)||(wanted!=='dashboard'&&b.dataset.v94MetTab===wanted)));
    if(wanted==='dashboard')renderDashboard();else if(wanted==='perdas')renderLosses();
  }
  function enhanceMetricas(target){
    const sec=$('#metricas');if(!sec||!sec.classList.contains('active'))return;
    ensureDashboardTab(sec);
    const wanted=(target==='dashboard'||pendingTarget==='dashboard')?'dashboard':(target==='perdas'||pendingTarget==='perdas')?'perdas':mode('metricas','geral');
    if(target==='dashboard'||pendingTarget==='dashboard')setMode('metricas','dashboard');
    if(target==='perdas'||pendingTarget==='perdas')setMode('metricas','perdas');
    if(wanted==='dashboard'){applyMetricMode('dashboard');return;}
    const native=sec.querySelector('[data-v94-met-tab="'+wanted+'"]');if(native&&!native.classList.contains('active'))native.click();
    if(wanted==='perdas')setTimeout(()=>applyMetricMode('perdas'),0);
  }
  function csvEscape(v){const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
  function download(content,name,type){const blob=new Blob([content],{type:type||'text/plain;charset=utf-8'});const a=D.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;D.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  function exportLeadsCSV(){const cols=['id','empresa','nome','telefone','email','cidade','segmento','origem','campanha','responsavel','prioridade','valor','pipeline','followup','proximaData','proximaHora','ultimoResultado','observacoes'];const lines=[cols.join(',')].concat(leads().map(l=>cols.map(c=>csvEscape(l[c])).join(',')));download('\ufeff'+lines.join('\n'),'realtalent-leads-'+today()+'.csv','text/csv;charset=utf-8');toast('CSV de leads exportado.');}
  function exportLeadsJSON(){download(JSON.stringify({version:VERSION,exportedAt:new Date().toISOString(),leads:leads()},null,2),'realtalent-leads-'+today()+'.json','application/json');toast('JSON de leads exportado.');}
  function exportFullBackup(){const data={version:VERSION,exportedAt:new Date().toISOString(),localStorage:{}};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);data.localStorage[k]=localStorage.getItem(k)}}catch(e){}download(JSON.stringify(data,null,2),'realtalent-backup-completo-'+today()+'.json','application/json');toast('Backup completo exportado.');}
  function parseCSV(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const ch=text[i],nx=text[i+1];if(ch==='"'&&q&&nx==='"'){cell+='"';i++;continue}if(ch==='"'){q=!q;continue}if(ch===','&&!q){row.push(cell);cell='';continue}if((ch==='\n'||ch==='\r')&&!q){if(ch==='\r'&&nx==='\n')i++;row.push(cell);cell='';if(row.some(x=>String(x).trim()))rows.push(row);row=[];continue}cell+=ch}row.push(cell);if(row.some(x=>String(x).trim()))rows.push(row);return rows;}
  function normHeader(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');}
  function importCSVText(text,replace){const rows=parseCSV(String(text||'').replace(/^\ufeff/,''));if(rows.length<2)throw new Error('O CSV não possui linhas de dados.');const aliases={nome:'nome',empresa:'empresa',cliente:'empresa',telefone:'telefone',phone:'telefone',email:'email',cidade:'cidade',segmento:'segmento',responsavel:'responsavel',prioridade:'prioridade',valor:'valor',pipeline:'pipeline',etapa:'pipeline',followup:'followup',proximaacao:'proximaData',proximadata:'proximaData',dataentrada:'dataEntrada',origem:'origem',campanha:'campanha',obs:'observacoes',observacoes:'observacoes',id:'id'};const heads=rows[0].map(h=>aliases[normHeader(h)]||normHeader(h));const incoming=rows.slice(1).map((r,idx)=>{const o={};heads.forEach((h,i)=>{if(h)o[h]=String(r[i]??'').trim()});o.id=o.id||'imp_'+Date.now().toString(36)+'_'+idx;o.empresa=o.empresa||o.nome||'Lead importado';o.nome=o.nome||o.empresa;o.valor=Number(String(o.valor||'0').replace(/[^0-9,.-]/g,'').replace(',','.'))||0;o.pipeline=o.pipeline||'Lead';o.followup=o.followup||'Primeiro contato';return o}).filter(o=>o.empresa||o.nome);let base=replace?[]:leads().slice();incoming.forEach(n=>{const idx=base.findIndex(x=>(n.id&&x.id===n.id)||(n.telefone&&x.telefone===n.telefone)||((x.empresa||x.nome)===(n.empresa||n.nome)));if(idx>=0)base[idx]=Object.assign({},base[idx],n);else base.push(n)});saveLeads(base);return incoming.length;}
  function showImportResult(ok,msg){const el=$('#v975ImportResult');if(!el)return;el.className='v975-result show '+(ok?'ok':'bad');el.textContent=msg;}
  function configPanel(){return '<section class="v972-panel v975-import-export" data-v975-import-panel><div class="v972-panel-head"><div><h3>Importar / Exportar</h3><p>Leads, planilhas e backup completo dentro de Configurações, sem página separada.</p></div><span class="v975-route-note">Dentro de Configurações</span></div><div class="v975-import-grid"><div class="v975-import-card"><h4>Importar leads por CSV</h4><p>Reconhece nome, empresa, telefone, cidade, segmento, responsável, valor, etapa/pipeline, origem, campanha e observações.</p><label class="v975-drop" data-v975-drop-csv><b>Selecionar ou arrastar CSV</b><small>O arquivo é processado apenas neste navegador.</small><input hidden type="file" accept=".csv,text/csv" data-v975-file="csv"></label><label class="v972-field"><span>Modo de importação</span><select data-v975-import-mode><option value="merge">Adicionar e atualizar correspondências</option><option value="replace">Substituir a base de leads</option></select></label></div><div class="v975-import-card"><h4>Exportar leads</h4><p>Baixe a base comercial em formato de planilha ou JSON estruturado.</p><button class="v972-btn primary" type="button" data-v975-export="csv">Exportar leads em CSV</button><button class="v972-btn soft" type="button" data-v975-export="leads-json">Exportar leads em JSON</button></div><div class="v975-import-card"><h4>Backup completo</h4><p>Inclui todos os dados e preferências armazenados localmente pelo CRM.</p><button class="v972-btn primary" type="button" data-v975-export="backup">Baixar backup completo</button></div><div class="v975-import-card"><h4>Restaurar JSON</h4><p>Aceita backup completo da RealTalent ou um JSON contendo uma lista de leads.</p><label class="v975-drop" data-v975-drop-json><b>Selecionar ou arrastar JSON</b><small>A restauração completa pede confirmação.</small><input hidden type="file" accept=".json,application/json" data-v975-file="json"></label></div></div><div id="v975ImportResult" class="v975-result"></div><div class="v972-card"><h4>Segurança</h4><p>Antes de substituir dados, exporte um backup completo. A importação por CSV atualiza registros pelo ID, telefone ou nome da empresa.</p></div></section>';}
  function enhanceConfig(target){
    const sec=$('#configuracoes');if(!sec||!sec.classList.contains('active'))return;
    const backupTab=sec.querySelector('[data-v972-tab="backup"]');if(backupTab){const span=backupTab.querySelector('span');if(span)span.textContent='Importar/Exportar';else backupTab.textContent='Importar/Exportar';const small=backupTab.querySelector('small');if(small)small.textContent='dados';}
    const wanted=(target==='importar'||pendingTarget==='importar')?'importar':mode('configuracoes','');
    if(target==='importar'||pendingTarget==='importar'){setMode('configuracoes','importar');if(backupTab&&!backupTab.classList.contains('is-active'))backupTab.click();}
    const activeBackup=backupTab?.classList.contains('is-active')||wanted==='importar'||sec.getAttribute('data-v972-tab')==='backup';
    if(activeBackup){const layout=sec.querySelector('.v972-layout');if(layout){layout.querySelector(':scope > .v972-panel')?.remove();if(!layout.querySelector('[data-v975-import-panel]'))layout.insertAdjacentHTML('beforeend',configPanel());}}
    try{W.CRMV974Personalizacao?.render?.()}catch(e){}
  }
  function restoreJSONFile(file){const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(String(r.result||'{}'));if(data.localStorage&&typeof data.localStorage==='object'){if(!confirm('Restaurar o backup completo e substituir os dados locais atuais?'))return;Object.entries(data.localStorage).forEach(([k,v])=>localStorage.setItem(k,String(v)));showImportResult(true,'Backup completo restaurado. Recarregando o CRM...');setTimeout(()=>location.reload(),350);return}const arr=Array.isArray(data)?data:(Array.isArray(data.leads)?data.leads:null);if(!arr)throw new Error('JSON sem lista de leads ou backup localStorage.');saveLeads(arr);showImportResult(true,arr.length+' lead(s) restaurado(s) do JSON.');finiteEnhance('configuracoes','importar')}catch(e){showImportResult(false,'Falha ao importar JSON: '+e.message)}};r.readAsText(file,'utf-8');}
  function handleCSVFile(file){const r=new FileReader();r.onload=()=>{try{const replace=$('[data-v975-import-mode]')?.value==='replace';if(replace&&!confirm('Substituir toda a base atual de leads pelo CSV?'))return;const n=importCSVText(r.result,replace);showImportResult(true,n+' lead(s) importado(s) com sucesso.');toast('Importação concluída.');}catch(e){showImportResult(false,'Falha ao importar CSV: '+e.message)}};r.readAsText(file,'utf-8');}
  function bind(){
    if(W.__crmV975Bound)return;W.__crmV975Bound=true;
    D.addEventListener('click',e=>{
      const legacy=e.target.closest('[data-v975-target]');if(legacy){const target=legacy.dataset.v975Target;setMode(LEGACY[target].parent,LEGACY[target].mode);pendingTarget=target;finiteEnhance(LEGACY[target].parent,target);}
      const leadTab=e.target.closest('[data-v975-leads-mode]');if(leadTab){setMode('leads',leadTab.dataset.v975LeadsMode);applyLeadsMode(leadTab.dataset.v975LeadsMode);return;}
      const pipeTab=e.target.closest('[data-v94-pipe-tab],[data-v65-pipe-view]');if(pipeTab){const raw=pipeTab.dataset.v94PipeTab||pipeTab.dataset.v65PipeView;const map={table:'tabela',funnel:'funil',kanban:'kanban'};setMode('pipeline',map[raw]||raw);}
      const pbTab=e.target.closest('[data-v94-pb-tab]');if(pbTab){const m=pbTab.dataset.v94PbTab==='personalizacao'?'objecoes':pbTab.dataset.v94PbTab;setMode('playbooks',m);setTimeout(()=>enhancePlaybooks(''),0);}
      const dash=e.target.closest('[data-v975-met-tab="dashboard"]');if(dash){setMode('metricas','dashboard');applyMetricMode('dashboard');return;}
      const mt=e.target.closest('[data-v94-met-tab]');if(mt){setMode('metricas',mt.dataset.v94MetTab);setTimeout(()=>applyMetricMode(mt.dataset.v94MetTab),0);}
      if(e.target.closest('[data-v975-new-objection]')){W.openObjModal?.(null);return;}
      const cat=e.target.closest('[data-v975-obj-cat]');if(cat){objCat=cat.dataset.v975ObjCat||'';$$('[data-v975-obj-cat]').forEach(b=>b.classList.toggle('active',b===cat));W.renderObj?.(objCat,$('#v975ObjSearch')?.value||'');return;}
      if(e.target.closest('[data-v975-new-loss]')){W.openPerdaModal?.(null);return;}
      const ex=e.target.closest('[data-v975-export]');if(ex){if(ex.dataset.v975Export==='csv')exportLeadsCSV();if(ex.dataset.v975Export==='leads-json')exportLeadsJSON();if(ex.dataset.v975Export==='backup')exportFullBackup();return;}
      const drop=e.target.closest('[data-v975-drop-csv],[data-v975-drop-json]');if(drop&&!e.target.matches('input'))drop.querySelector('input')?.click();
      const configTab=e.target.closest('[data-v972-tab]');if(configTab){if(configTab.dataset.v972Tab==='backup')setMode('configuracoes','importar');else setMode('configuracoes','');setTimeout(()=>enhanceConfig(configTab.dataset.v972Tab==='backup'?'importar':''),0);}
      if(e.target.closest('[data-view="leads"],[data-view="pipeline"],[data-view="playbooks"],[data-view="metricas"],[data-view="configuracoes"]'))setTimeout(()=>enhance(getActive(),''),90);
      if(e.target.closest('[data-v94-pb-action="save"],[data-v94-pb-action="new"],[data-v94-pb-select]'))setTimeout(()=>enhancePlaybooks(''),80);
    },false);
    D.addEventListener('input',e=>{if(e.target.id==='v975ObjSearch')W.renderObj?.(objCat,e.target.value||'');});
    D.addEventListener('change',e=>{const input=e.target.closest('[data-v975-file]');if(!input||!input.files?.[0])return;if(input.dataset.v975File==='csv')handleCSVFile(input.files[0]);else restoreJSONFile(input.files[0]);input.value='';});
    ['dragenter','dragover'].forEach(type=>D.addEventListener(type,e=>{const z=e.target.closest('[data-v975-drop-csv],[data-v975-drop-json]');if(z){e.preventDefault();z.classList.add('drag')}}));
    ['dragleave','drop'].forEach(type=>D.addEventListener(type,e=>{const z=e.target.closest('[data-v975-drop-csv],[data-v975-drop-json]');if(!z)return;e.preventDefault();z.classList.remove('drag');if(type==='drop'&&e.dataTransfer?.files?.[0]){if(z.hasAttribute('data-v975-drop-csv'))handleCSVFile(e.dataTransfer.files[0]);else restoreJSONFile(e.dataTransfer.files[0]);}}));
    W.addEventListener('hashchange',()=>{const h=location.hash.replace('#','');if(LEGACY[h])routeLegacy(h);else finiteEnhance(h,'')});
    D.addEventListener('crm:leads-updated',()=>finiteEnhance(getActive(),''));
  }
  function initialRoute(){const h=location.hash.replace('#','');if(LEGACY[h]){routeLegacy(h);return}finiteEnhance(getActive(),'');}
  function boot(){
    D.body?.classList.add('v975-ready');
    installRouter();normalizeLegacyLinks();bind();
    const h=location.hash.replace('#','');if(LEGACY[h])routeLegacy(h);
    setTimeout(()=>{cleanLegacyViews();normalizeLegacyLinks();initialRoute();},230);
    setTimeout(()=>{installRouter();cleanLegacyViews();normalizeLegacyLinks();enhance(getActive(),'');},700);
    setTimeout(()=>{installRouter();cleanLegacyViews();normalizeLegacyLinks();enhance(getActive(),'');},1600);
    setTimeout(()=>{installRouter();cleanLegacyViews();normalizeLegacyLinks();enhance(getActive(),'');},3200);
    W.CRMV975Consolidacao={version:VERSION,routeLegacy,enhance,map:LEGACY,diagnostics:function(){const ids={};$$('[id]').forEach(el=>ids[el.id]=(ids[el.id]||0)+1);return {version:VERSION,active:getActive(),duplicateIds:Object.entries(ids).filter(([,n])=>n>1),legacyViews:Object.keys(LEGACY).map(id=>({id,placeholder:!!$('#'+id+'[data-v975-legacy-placeholder]')})),mainViews:$$('.view').map(v=>v.id)}}};
    if(W.CRMV97Navigation)W.CRMV97NavigationV975=Object.freeze({version:VERSION,consolidados:LEGACY});
  }
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
