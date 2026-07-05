/* CRM v50 — correções pedidas: lateral recolhível, pipeline/funil limpos e follow-ups por etapas */
(function(){
  'use strict';
  if(window.__crmV50CorrecoesLayout) return;
  window.__crmV50CorrecoesLayout = true;
  const DOC=document;
  const $=(s,r=DOC)=>r.querySelector(s);
  const $$=(s,r=DOC)=>Array.from(r.querySelectorAll(s));
  const LS_SIDEBAR='crm_v50_sidebar_collapsed';
  const LS_FU_VIEW='crm_v50_followup_view';
  const LS_FU_STAGE='crm_v50_followup_stage_filter';
  const PIPE_VIEW_KEY='crm_pipeline_view_v23';
  const FU_STAGES=['Primeiro contato','Tentativa 2','Nutrição','Proposta enviada','Negociação','Reativação','Break-up'];
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const today=()=>new Date().toISOString().slice(0,10);
  const fmt=d=>{if(!d)return 'Sem data';try{return new Date(String(d).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR')}catch(e){return d}};
  const addDays=(n)=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
  const toast=(m,t='success')=>{try{(window.showToast||showToast)(m,t)}catch(e){console.log(m)}};
  function leads(){try{if(Array.isArray(window.leads))return window.leads}catch(e){}try{if(typeof leads!=='undefined'&&Array.isArray(leads))return leads}catch(e){}try{return JSON.parse(localStorage.getItem('outbounder_leads_v5')||'[]')}catch(e){return[]}}
  function saveLeads(){try{if(typeof window.saveLeads==='function')window.saveLeads()}catch(e){}try{if(typeof saveLeads==='function')saveLeads()}catch(e){}try{localStorage.setItem('outbounder_leads_v5',JSON.stringify(leads()))}catch(e){}}
  function rerender(){['renderAll','renderBoard','renderPipelineV23','renderFollowups','renderFuAll'].forEach(fn=>{try{const f=window[fn]||globalThis[fn]; if(typeof f==='function')f()}catch(e){}});setTimeout(()=>{decorateFollowupCards();renderFollowupViews();},80)}
  function findLead(ref){return leads().find(l=>String(l.id||l.nome)===String(ref)||String(l.nome)===String(ref));}
  function openLead(ref){try{if(typeof window.openDetail==='function')return window.openDetail(ref)}catch(e){}try{if(typeof openDetail==='function')return openDetail(ref)}catch(e){} }

  function boot(){
    DOC.body.classList.add('crm-v50-correcoes');
    applySidebarState();
    setTimeout(()=>{installSidebarControls();cleanupTopNavigation();installPipelineTools();installFunilTools();installFollowupTools();installLeadFollowupFields();enhanceStageModal();},450);
    setTimeout(()=>{installSidebarControls();cleanupTopNavigation();installPipelineTools();installFunilTools();installFollowupTools();installLeadFollowupFields();enhanceStageModal();},1200);
    observe();
  }

  function applySidebarState(){DOC.body.classList.toggle('crm-sidebar-collapsed',localStorage.getItem(LS_SIDEBAR)==='1');}
  function installSidebarControls(){
    const brand=$('.sidebar-brand');
    if(brand && !$('#v50SidebarToggle')){
      brand.insertAdjacentHTML('beforeend','<button type="button" class="v50-sidebar-toggle" id="v50SidebarToggle" aria-label="Recolher/expandir lateral" title="Recolher/expandir lateral">☰</button>');
    }
    $$('.crm-v49-nav-section').forEach(sec=>{
      const main=sec.querySelector('.crm-v49-nav-main'); const sub=sec.querySelector('.crm-v49-nav-sub');
      if(main && sub && !main.querySelector('.v50-group-toggle')){
        main.insertAdjacentHTML('beforeend','<button type="button" class="v50-group-toggle" aria-label="Abrir sub-abas" title="Abrir sub-abas">⌄</button>');
      }
    });
  }
  DOC.addEventListener('click',e=>{
    const tog=e.target.closest('#v50SidebarToggle');
    if(tog){e.preventDefault();e.stopPropagation();const next=!DOC.body.classList.contains('crm-sidebar-collapsed');DOC.body.classList.toggle('crm-sidebar-collapsed',next);localStorage.setItem(LS_SIDEBAR,next?'1':'0');return;}
    const group=e.target.closest('.v50-group-toggle');
    if(group){e.preventDefault();e.stopPropagation();group.closest('.crm-v49-nav-section')?.classList.toggle('v50-sub-collapsed');return;}
  },true);

  function cleanupTopNavigation(){
    $$('.topbar-tabs,.crm-v49-area-nav').forEach(el=>{el.setAttribute('aria-hidden','true');});
  }

  function installPipelineTools(){
    const page=$('#pipeline'); if(!page) return;
    if(!$('#v50PipelineCommand')){
      const ref=$('#pipelineV20Hero')||page.querySelector('.section-header')||page.firstElementChild;
      const html='<div class="v50-pipeline-command" id="v50PipelineCommand"><div><b>Pipeline operacional</b><span>Uma única barra para alternar visualização, abrir filtros e configurar etapas sem duplicar botões.</span></div><div class="v50-pipeline-actions"><div class="v50-segmented" id="v50PipelineViews"><button type="button" data-v50-pipe-view="kanban">Kanban</button><button type="button" data-v50-pipe-view="gantt">Gantt</button><button type="button" data-v50-pipe-view="calendar">Calendário</button><button type="button" data-view="funil">Funil</button></div><button type="button" class="v50-icon-btn" id="v50PipelineFilters">Filtros</button><button type="button" class="v50-icon-btn" id="v50PipelineStages">Configurar etapas</button><button type="button" class="v50-icon-btn primary" id="v50PipelineNewLead">Novo lead</button></div></div>';
      ref ? ref.insertAdjacentHTML('afterend',html) : page.insertAdjacentHTML('afterbegin',html);
    }
    syncPipelineViewButtons();
    enhancePipelineFilterDrawer();
  }
  function syncPipelineViewButtons(){
    const cur=localStorage.getItem(PIPE_VIEW_KEY)||'kanban';
    $$('[data-v50-pipe-view]').forEach(b=>b.classList.toggle('active',b.dataset.v50PipeView===cur));
  }
  function enhancePipelineFilterDrawer(){
    const panel=$('#pipelineV24Filters'); if(!panel) return;
    if(!panel.querySelector('.v50-filter-topline')){
      panel.insertAdjacentHTML('afterbegin','<div class="v50-filter-topline"><div><b>Filtros do Pipeline</b><span>Configure a visão que você quer: etapa, origem, responsável, follow-up, valor, entrada, contato e score.</span></div><button type="button" class="v50-drawer-close" data-v50-close-pipeline-filter>×</button></div><div class="v50-saved-views"><button type="button" data-v50-filter-preset="overdue">Vencidos</button><button type="button" data-v50-filter-preset="proposal">Propostas</button><button type="button" data-v50-filter-preset="hot">Alta prioridade</button><button type="button" data-v50-filter-preset="nocontact">Sem follow-up</button><button type="button" data-v50-filter-preset="clear">Limpar tudo</button></div>');
    }
  }
  DOC.addEventListener('click',e=>{
    const pv=e.target.closest('[data-v50-pipe-view]');
    if(pv){e.preventDefault();e.stopPropagation();localStorage.setItem(PIPE_VIEW_KEY,pv.dataset.v50PipeView);try{window.renderPipelineV23&&window.renderPipelineV23()}catch(err){}syncPipelineViewButtons();return;}
    if(e.target.closest('#v50PipelineFilters')){e.preventDefault();e.stopPropagation();DOC.body.classList.add('v50-pipeline-filter-open');enhancePipelineFilterDrawer();return;}
    if(e.target.closest('[data-v50-close-pipeline-filter]')){e.preventDefault();e.stopPropagation();DOC.body.classList.remove('v50-pipeline-filter-open');return;}
    if(e.target===DOC.body && DOC.body.classList.contains('v50-pipeline-filter-open')){DOC.body.classList.remove('v50-pipeline-filter-open');}
    if(e.target.closest('#v50PipelineStages')){e.preventDefault();e.stopPropagation();const btn=$('#pipelineConfigStages');if(btn)btn.click();else toast('Ferramenta de etapas ainda não carregou. Abra o Pipeline novamente.','warn');setTimeout(enhanceStageModal,80);return;}
    if(e.target.closest('#v50PipelineNewLead')){e.preventDefault();e.stopPropagation();try{(window.openModal||openModal)(null)}catch(err){try{window.setView('novo-lead')}catch(_){}}return;}
    const preset=e.target.closest('[data-v50-filter-preset]');
    if(preset){e.preventDefault();e.stopPropagation();applyPipelinePreset(preset.dataset.v50FilterPreset);return;}
  },true);
  DOC.addEventListener('keydown',e=>{if(e.key==='Escape'){DOC.body.classList.remove('v50-pipeline-filter-open');$('.v50-funnel-filter-drawer')?.classList.remove('show');}},true);
  function setVal(id,val){const el=$('#'+id);if(el){el.value=val;el.dispatchEvent(new Event('change',{bubbles:true}));el.dispatchEvent(new Event('input',{bubbles:true}));}}
  function applyPipelinePreset(p){
    const ids=['pipelineV24Search','pipelineV24Stage','pipelineV24Priority','pipelineV24Origin','pipelineV24Resp','pipelineV24Segment','pipelineV24MinValue','pipelineV24MaxValue','pipelineV24EntryFrom','pipelineV24EntryTo','pipelineV24FollowStatus','pipelineV24FollowFrom','pipelineV24FollowTo','pipelineV24ContactStatus','pipelineV24MinScore'];
    if(p==='clear'){ids.forEach(id=>setVal(id,'')); localStorage.setItem('crm_pipeline_focus_v23','todos');}
    if(p==='overdue'){setVal('pipelineV24FollowStatus','vencido');}
    if(p==='proposal'){setVal('pipelineV24Stage','Proposta');}
    if(p==='hot'){setVal('pipelineV24Priority','Alta');}
    if(p==='nocontact'){setVal('pipelineV24FollowStatus','sem');}
    try{window.renderPipelineV23&&window.renderPipelineV23()}catch(e){}
  }

  function enhanceStageModal(){
    const modal=$('#pipelineStageModal'); if(!modal) return;
    modal.classList.add('v50-stage-modal-enhanced');
    const body=modal.querySelector('.modal-body'); if(!body) return;
    if(!body.querySelector('.v50-stage-helper')){
      body.insertAdjacentHTML('afterbegin','<div class="v50-stage-helper"><div><b>Ordem</b><span>Arraste as linhas para definir o caminho comercial.</span></div><div><b>Probabilidade</b><span>Controla forecast e leitura do funil.</span></div><div><b>Visibilidade</b><span>Oculte etapas que não usa sem apagar dados.</span></div><div><b>Lead conectado</b><span>Ao renomear etapa, os leads são atualizados junto.</span></div></div>');
    }
    const list=$('#v20StageList');
    if(list && !body.querySelector('.v50-stage-row-labels')){
      list.insertAdjacentHTML('beforebegin','<div class="v50-stage-row-labels"><span></span><span>Nome da etapa</span><span>Prob.</span><span>Cor</span><span>Visível</span><span>Ação</span></div>');
    }
  }

  function installFunilTools(){
    const page=$('#funil'); if(!page) return;
    if(!$('#v50FunnelCommand')){
      const ref=page.querySelector('.section-header')||page.firstElementChild;
      ref?.insertAdjacentHTML('afterend','<div class="v50-funnel-command" id="v50FunnelCommand"><div><b>Funil de vendas limpo</b><span>Filtros ficam em painel lateral, e a tela principal prioriza conversão, forecast, perdas e gargalos.</span></div><div class="v50-pipeline-actions"><button type="button" class="v50-icon-btn" id="v50FunnelFilters">Filtros do funil</button><button type="button" class="v50-icon-btn" data-view="pipeline">Abrir Pipeline</button></div></div>');
    }
    if(!$('.v50-funnel-filter-drawer')){
      DOC.body.insertAdjacentHTML('beforeend','<div class="v50-funnel-filter-drawer"><div class="v50-filter-topline"><div><b>Filtros do Funil</b><span>Escolha período, responsável e origem sem ocupar espaço na tela do funil.</span></div><button type="button" class="v50-drawer-close" data-v50-close-funnel-filter>×</button></div><div id="v50FunnelFiltersHost"></div></div>');
    }
    const original=page.querySelector('.v27-filters'); const host=$('#v50FunnelFiltersHost');
    if(original && host && !host.contains(original)) host.appendChild(original);
  }
  DOC.addEventListener('click',e=>{
    if(e.target.closest('#v50FunnelFilters')){e.preventDefault();e.stopPropagation();installFunilTools();$('.v50-funnel-filter-drawer')?.classList.add('show');return;}
    if(e.target.closest('[data-v50-close-funnel-filter]')){e.preventDefault();e.stopPropagation();$('.v50-funnel-filter-drawer')?.classList.remove('show');return;}
  },true);

  function installFollowupTools(){
    const page=$('#cadencias'); if(!page) return;
    if(!$('#v50FollowupStages')){
      const ref=page.querySelector('.followups-toolbar')||page.querySelector('.followups-hero')||page.firstElementChild;
      ref?.insertAdjacentHTML('beforebegin','<div class="v50-fu-stages" id="v50FollowupStages"><div class="v50-fu-stages-head"><div><b>Etapas do follow-up</b><span>Atribua cada lead a uma etapa de cadência e alterne a forma de visualizar a rotina.</span></div><div class="v50-fu-views"><button type="button" data-v50-fu-view="fila">Fila</button><button type="button" data-v50-fu-view="kanban">Kanban por etapa</button><button type="button" data-v50-fu-view="timeline">Timeline</button><button type="button" data-v50-fu-view="compact">Compacto</button></div></div><div class="v50-fu-stage-chips"><button type="button" data-v50-fu-stage="">Todas</button>'+FU_STAGES.map(s=>'<button type="button" data-v50-fu-stage="'+esc(s)+'">'+esc(s)+'</button>').join('')+'</div></div>');
    }
    if(!$('#fuStage')){
      const type=$('#fuType')?.closest('.field');
      type?.insertAdjacentHTML('afterend','<div class="field"><label>Etapa do follow-up</label><select id="fuStage">'+FU_STAGES.map(s=>'<option>'+esc(s)+'</option>').join('')+'</select><div class="v50-helper">Essa etapa fica salva no lead e aparece nas visualizações.</div></div>');
    }
    syncFollowupUI(); decorateFollowupCards(); renderFollowupViews();
  }
  function activeFuView(){return localStorage.getItem(LS_FU_VIEW)||'fila'}
  function activeFuStage(){return localStorage.getItem(LS_FU_STAGE)||''}
  function syncFollowupUI(){
    const page=$('#cadencias'); if(!page) return;
    const view=activeFuView(); page.classList.remove('v50-fu-mode-fila','v50-fu-mode-kanban','v50-fu-mode-timeline','v50-fu-mode-compact'); page.classList.add('v50-fu-mode-'+view);
    $$('[data-v50-fu-view]').forEach(b=>b.classList.toggle('active',b.dataset.v50FuView===view));
    const st=activeFuStage(); $$('[data-v50-fu-stage]').forEach(b=>b.classList.toggle('active',String(b.dataset.v50FuStage||'')===st));
  }
  DOC.addEventListener('click',e=>{
    const view=e.target.closest('[data-v50-fu-view]');
    if(view){e.preventDefault();localStorage.setItem(LS_FU_VIEW,view.dataset.v50FuView);syncFollowupUI();renderFollowupViews();return;}
    const stage=e.target.closest('[data-v50-fu-stage]');
    if(stage){e.preventDefault();localStorage.setItem(LS_FU_STAGE,stage.dataset.v50FuStage||'');filterFollowupCards();renderFollowupViews();syncFollowupUI();return;}
  },true);
  DOC.addEventListener('change',e=>{
    const sel=e.target.closest('[data-v50-card-stage]');
    if(sel){const l=findLead(sel.dataset.v50CardStage); if(l){l.followupStage=sel.value;l.ultimaAtualizacao=today();saveLeads();toast('Etapa de follow-up atualizada','success');rerender();}return;}
  },true);
  DOC.addEventListener('click',e=>{
    if(e.target.closest('#fuSaveQuick')){setTimeout(()=>{const l=findLead($('#fuLeadSelect')?.value); if(l){l.followupStage=$('#fuStage')?.value||l.followupStage||FU_STAGES[0]; saveLeads(); decorateFollowupCards(); renderFollowupViews();}},120);}
  },true);
  function leadStage(l){return l.followupStage||l.followupEtapa||l.cadenciaEtapa||FU_STAGES[0];}
  function decorateFollowupCards(){
    $$('#fuList .followup-item').forEach(item=>{
      const l=findLead(item.dataset.fuId); if(!l) return;
      const title=item.querySelector('.fu-title');
      if(title && !title.querySelector('.v50-fu-stage-tag')) title.insertAdjacentHTML('beforeend','<span class="v50-fu-stage-tag">'+esc(leadStage(l))+'</span>');
      if(!item.querySelector('[data-v50-card-stage]')){
        const note=item.querySelector('.fu-note')||item.children[1];
        note?.insertAdjacentHTML('afterend','<div class="v50-fu-card-tools"><label class="v50-fu-stage-tag">Etapa</label><select data-v50-card-stage="'+esc(l.id||l.nome)+'">'+FU_STAGES.map(s=>'<option '+(s===leadStage(l)?'selected':'')+'>'+esc(s)+'</option>').join('')+'</select><button type="button" class="fu-action" data-fu-delay="'+esc(l.id||l.nome)+'">Adiar +2d</button></div>');
      }
    });
    filterFollowupCards();
  }
  function filterFollowupCards(){
    const st=activeFuStage();
    $$('#fuList .followup-item').forEach(item=>{const l=findLead(item.dataset.fuId); item.style.display=(!st||!l||leadStage(l)===st)?'':'none';});
  }
  function openLeadsForFu(l){openLead(l.id||l.nome)}
  function renderFollowupViews(){
    const page=$('#cadencias'); if(!page) return;
    const card=page.querySelector('.followups-main-card'); if(!card) return;
    let board=$('#v50FuBoard'), timeline=$('#v50FuTimeline');
    if(!board){card.insertAdjacentHTML('beforeend','<div class="v50-fu-board" id="v50FuBoard"></div>');board=$('#v50FuBoard');}
    if(!timeline){card.insertAdjacentHTML('beforeend','<div class="v50-fu-timeline" id="v50FuTimeline"></div>');timeline=$('#v50FuTimeline');}
    const stFilter=activeFuStage();
    const arr=leads().filter(l=>!['Fechado','Perdido'].includes(l.etapa)).filter(l=>!stFilter||leadStage(l)===stFilter).sort((a,b)=>String(a.followup||'9999').localeCompare(String(b.followup||'9999')));
    board.innerHTML=FU_STAGES.map(stage=>{const list=arr.filter(l=>leadStage(l)===stage);return '<div class="v50-fu-col"><div class="v50-fu-col-head"><b>'+esc(stage)+'</b><span>'+list.length+'</span></div><div class="v50-fu-col-body">'+(list.map(l=>'<div class="v50-fu-mini" data-v50-open-lead="'+esc(l.id||l.nome)+'"><b>'+esc(l.nome||'Lead')+'</b><span>'+esc([l.etapa,l.responsavel||'Sem responsável'].filter(Boolean).join(' · '))+'</span><div class="row"><small>'+esc(fmt(l.followup))+'</small><small>'+esc(l.prioridade||'Média')+'</small></div></div>').join('')||'<div class="fu-empty"><b>Vazio</b>Sem leads nesta etapa.</div>')+'</div></div>'}).join('');
    timeline.innerHTML=arr.length?arr.map(l=>'<div class="v50-fu-timeline-row" data-v50-open-lead="'+esc(l.id||l.nome)+'"><time>'+esc(fmt(l.followup))+'</time><div><b>'+esc(l.nome||'Lead')+'</b><span>'+esc(leadStage(l)+' · '+(l.proximaAcao||l.obs||'Sem observação'))+'</span></div><span class="v50-fu-stage-tag">'+esc(l.prioridade||'Média')+'</span></div>').join(''):'<div class="fu-empty"><b>Nenhum follow-up</b>Crie datas e etapas para montar a timeline.</div>';
    $$('[data-v50-open-lead]',card).forEach(el=>{if(!el.dataset.v50Bound){el.dataset.v50Bound='1';el.addEventListener('click',()=>openLeadsForFu(findLead(el.dataset.v50OpenLead)||{}));}});
    syncFollowupUI();
  }

  function installLeadFollowupFields(){
    const formFollow=$('input[name="followup"]');
    if(formFollow && !formFollow.closest('.field')?.nextElementSibling?.querySelector('[name="followupStage"]')){
      formFollow.closest('.field')?.insertAdjacentHTML('afterend','<div class="field"><label>Etapa do follow-up</label><select name="followupStage">'+FU_STAGES.map(s=>'<option>'+esc(s)+'</option>').join('')+'</select></div>');
    }
    const modalFollow=$('#mFollowup');
    if(modalFollow && !$('#mFollowupStage')){
      modalFollow.closest('.field')?.insertAdjacentHTML('afterend','<div class="field"><label>Etapa do follow-up</label><select id="mFollowupStage">'+FU_STAGES.map(s=>'<option>'+esc(s)+'</option>').join('')+'</select></div>');
    }
  }
  DOC.addEventListener('submit',e=>{
    if(e.target && e.target.id==='leadForm'){
      const fd=new FormData(e.target); const nome=fd.get('nome'); const stage=fd.get('followupStage')||FU_STAGES[0];
      setTimeout(()=>{const l=leads().find(x=>x.nome===nome); if(l){l.followupStage=stage; saveLeads();}},120);
    }
  },true);
  DOC.addEventListener('click',e=>{
    if(e.target.closest('#modalSave')){
      const name=$('#mNome')?.value?.trim(); const stage=$('#mFollowupStage')?.value||FU_STAGES[0];
      setTimeout(()=>{const l=leads().find(x=>x.nome===name); if(l){l.followupStage=stage; saveLeads(); decorateFollowupCards(); renderFollowupViews();}},150);
    }
  },true);
  function enhanceLeadDetail(){
    const name=$('#dNome')?.textContent?.trim(); if(!name) return;
    const l=leads().find(x=>x.nome===name); if(!l) return;
    let box=$('#v50DetailFollowupInfo');
    const body=$('.dp-body'); if(!body) return;
    if(!box){body.insertAdjacentHTML('afterbegin','<div class="v50-detail-fu" id="v50DetailFollowupInfo"></div>'); box=$('#v50DetailFollowupInfo');}
    box.innerHTML='<div class="dp-field"><label>Etapa do follow-up</label><p><span class="v50-fu-stage-tag">'+esc(leadStage(l))+'</span></p></div><div class="dp-field"><label>Próximo follow-up</label><p>'+esc(fmt(l.followup))+'</p></div>';
  }

  const mo=new MutationObserver(()=>{clearTimeout(window.__v50Timer);window.__v50Timer=setTimeout(()=>{cleanupTopNavigation();installSidebarControls();installPipelineTools();installFunilTools();installFollowupTools();installLeadFollowupFields();enhanceStageModal();enhanceLeadDetail();},160);});
  function observe(){mo.observe(DOC.body,{childList:true,subtree:true});}
  if(DOC.readyState==='loading')DOC.addEventListener('DOMContentLoaded',boot); else boot();
})();
