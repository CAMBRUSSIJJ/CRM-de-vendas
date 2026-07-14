/* EMBED: assets/js/modules/18-importacao-exportacao-v69.js */
/* CRM V69 — Importação/Exportação oficial
   Central única para backup, CSV, restauração e reparo de dados.
   Não cria página paralela: renderiza somente a aba existente #importar. */
(function(){
  'use strict';

  const VERSION='V69';
  const LEADS_KEY='crm_v99_leads';
  const AGENDA_KEY='outbounder_agenda_v1';
  const DATA_PREFIXES=['outbounder_','crm_'];
  const EXPORT_DATE=()=>new Date().toISOString().slice(0,10);

  const KNOWN_KEYS=[
    LEADS_KEY, AGENDA_KEY, 'outbounder_notes', 'outbounder_automations_v1',
    'outbounder_playbooks', 'outbounder_objecoes', 'outbounder_perdas',
    'outbounder_chat_v1', 'outbounder_wa_config', 'outbounder_gcal',
    'outbounder_garimpo_leads_v62', 'outbounder_garimpo_config_v62',
    'crm_v63_cadencias', 'crm_v63_followups_state', 'crm_v63_cadencias_migrated',
    'outbounder_goals_v5', 'crm_goals_v5', 'outbounder_metas_rotina_v68', 'outbounder_metas_v68_prefs',
    'crm_v71_settings', 'crm_v61_settings', 'outbounder_ui_v57', 'outbounder_agenda_v64_ui',
    'crm_v62_leads_columns', 'crm_v62_leads_filters', 'crm_v65_pipeline_view', 'crm_v65_pipeline_stale_days',
    'crm_v67_dashboard_widgets', 'crm_v67_dashboard_colors', 'crm_v67_dashboard_order',
    'crm_funil_v27_mode', 'crm_current_view', 'crm_v45_current_view'
  ];

  const CSV_FIELDS={
    leads:['nome','segmento','responsavel','telefone','email','cidade','tags','etapa','prioridade','valor','probabilidade','origem','followup','proximaAcao','produtoInteresse','decisor','canalPreferido','dorPrincipal','obs','motivoPerda','dataEntrada','ultimaAtualizacao'],
    agenda:['id','titulo','title','leadNome','leadId','data','date','hora','time','tipo','type','prioridade','priority','responsavel','status','notas','notes'],
    metas:['id','nome','tipo','meta','atual','inicio','fim','responsavel','status'],
    garimpo:['id','nome','segmento','telefone','email','cidade','bairro','site','instagram','tags','status','fit','score','valor','dorPrincipal','proximaAcao'],
    followups:['id','nome','name','descricao','description','steps','ativo','createdAt','updatedAt']
  };

  let pendingImport=null;
  let lastPreviewRows=[];

  function $(s,root=document){return root.querySelector(s)}
  function $$(s,root=document){return Array.from(root.querySelectorAll(s))}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function toast(msg,type='success'){
    try{ if(window.crmToast) return window.crmToast(msg,type); }catch(e){}
    try{ if(typeof showToast==='function') return showToast(msg,type); }catch(e){}
    console.log(`[CRM ${type}] ${msg}`);
  }
  function readJSON(key,fallback=null){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(e){return fallback}}
  function writeJSON(key,val){localStorage.setItem(key,JSON.stringify(val));}
  function getLeads(){try{return window.CRMData?.leads?.all?.()||[]}catch(e){return[]}}
  function saveLeads(list){const saved=window.CRMData?.leads?.save?.(list,'import-export')||list;try{if(typeof renderAll==='function')renderAll()}catch(e){}return saved;}
  function normalizeText(v){return String(v||'').trim()}
  function normalizePhone(v){return normalizeText(v).replace(/\D/g,'')}
  function normLower(v){return normalizeText(v).toLowerCase()}
  function asNumber(v){if(typeof v==='number')return v;const n=Number(String(v||'').replace(/\./g,'').replace(',','.'));return Number.isFinite(n)?n:0}
  function today(){return new Date().toISOString().slice(0,10)}
  function duplicateKey(lead){
    const phone=normalizePhone(lead.telefone||lead.whatsapp||lead.celular);
    if(phone.length>=8) return `tel:${phone}`;
    const email=normLower(lead.email);
    if(email.includes('@')) return `email:${email}`;
    const name=normLower(lead.nome||lead.empresa||lead.name);
    const city=normLower(lead.cidade);
    return name ? `nome:${name}|${city}` : '';
  }
  function normalizeTags(v){
    if(Array.isArray(v)) return v.map(normalizeText).filter(Boolean).join(', ');
    return normalizeText(v);
  }
  function normalizeLead(row){
    const etapa=normalizeText(row.etapa||row.stage||row.status)||'Lead';
    const resolved=window.CRMStageRegistry?.resolveStage?.(etapa,{create:true});const validStage=resolved?.name||etapa||'Lead';
    const prioridade=normalizeText(row.prioridade||row.priority)||'Média';
    return {
      nome: normalizeText(row.nome||row.name||row.empresa||row.lead),
      segmento: normalizeText(row.segmento||row.nicho||row.segment||row.category),
      responsavel: normalizeText(row.responsavel||row.owner||row.vendedor),
      telefone: normalizeText(row.telefone||row.whatsapp||row.celular||row.phone),
      email: normalizeText(row.email||row.e_mail||row.mail),
      cidade: normalizeText(row.cidade||row.city||row.localidade),
      tags: normalizeTags(row.tags||row.tag),
      etapa: validStage, pipeline:validStage, pipelineStageId:resolved?.id||'', pipelineType:resolved?.type||'open', pipelineRole:resolved?.role||'lead',
      prioridade: ['Alta','Média','Baixa'].includes(prioridade)?prioridade:'Média',
      valor: asNumber(row.valor||row.value||row.ticket),
      probabilidade: Math.max(0,Math.min(100,asNumber(row.probabilidade||row.probability))),
      origem: normalizeText(row.origem||row.source||row.fonte),
      followup: normalizeText(row.followup||row['follow-up']||row.proximoContato||row.proximo_contato),
      proximaAcao: normalizeText(row.proximaAcao||row.proxima_acao||row.nextAction||row.next_action),
      produtoInteresse: normalizeText(row.produtoInteresse||row.produto||row.servico||row.interesse),
      decisor: normalizeText(row.decisor||row.cargo||row.contato),
      canalPreferido: normalizeText(row.canalPreferido||row.canal||row.preferredChannel),
      dorPrincipal: normalizeText(row.dorPrincipal||row.dor||row.problema),
      obs: normalizeText(row.obs||row.observacoes||row.notes),
      motivoPerda: normalizeText(row.motivoPerda||row.motivo_perda),
      dataEntrada: normalizeText(row.dataEntrada||row.createdAt||row.entrada)||today(),
      ultimaAtualizacao: normalizeText(row.ultimaAtualizacao||row.updatedAt)||today()
    };
  }

  function allManagedKeys(){
    const set=new Set(KNOWN_KEYS);
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(DATA_PREFIXES.some(p=>k.startsWith(p))) set.add(k);
    }
    return Array.from(set).sort();
  }
  function datasetSummary(){
    const leads=getLeads();
    const agenda=readJSON(AGENDA_KEY,[]);
    const gar=readJSON('outbounder_garimpo_leads_v62',[]);
    const cads=readJSON('crm_v63_cadencias',[]);
    const goals=readJSON('outbounder_goals_v5',readJSON('crm_goals_v5',[]));
    const autom=readJSON('outbounder_automations_v1',[]);
    const play=readJSON('outbounder_playbooks',[]);
    return {leads,agenda,gar,cads,goals,autom,play};
  }
  function countOf(v){
    if(Array.isArray(v)) return v.length;
    if(v && typeof v==='object') return Object.keys(v).length;
    return v ? 1 : 0;
  }
  function collectBackup(){
    const local={};
    allManagedKeys().forEach(k=>{const raw=localStorage.getItem(k); if(raw!==null) local[k]=raw;});
    const get=(k,fb)=>readJSON(k,fb);
    return {
      meta:{app:'Outbounder CRM',version:VERSION,exportedAt:new Date().toISOString(),format:'crm-full-backup-v69'},
      datasets:{
        leads:getLeads(),
        agenda:get(AGENDA_KEY,[]),
        garimpo:get('outbounder_garimpo_leads_v62',[]),
        garimpoConfig:get('outbounder_garimpo_config_v62',{}),
        cadencias:get('crm_v63_cadencias',[]),
        followupsState:get('crm_v63_followups_state',{}),
        metas:get('outbounder_goals_v5',get('crm_goals_v5',[])),
        metasPrefs:get('outbounder_metas_v68_prefs',{}),
        agendaUI:get('outbounder_agenda_v64_ui',{}),
        dashboard:{widgets:get('crm_v67_dashboard_widgets',{}),colors:get('crm_v67_dashboard_colors',{}),order:get('crm_v67_dashboard_order',[])},
        automations:get('outbounder_automations_v1',[]),
        playbooks:get('outbounder_playbooks',[]),
        objecoes:get('outbounder_objecoes',[]),
        perdas:get('outbounder_perdas',[]),
        chat:get('outbounder_chat_v1',[]),
        waConfig:get('outbounder_wa_config',null),
        settings:get('crm_v71_settings',get('crm_v61_settings',{}))
      },
      localStorage:local
    };
  }
  function downloadFile(name,content,type='text/plain;charset=utf-8'){
    const blob=content instanceof Blob?content:new Blob([content],{type});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1200);
  }
  function csvEscape(v){return '"'+String(v??'').replace(/"/g,'""').replace(/\r?\n/g,' ')+'"'}
  function toCSV(rows,fields){
    const list=Array.isArray(rows)?rows:[];
    return '\uFEFF'+[fields.join(','),...list.map(r=>fields.map(f=>csvEscape(r?.[f])).join(','))].join('\n');
  }
  function exportCSV(type){
    const data=datasetSummary();
    const map={
      leads:{rows:data.leads,fields:CSV_FIELDS.leads,name:'leads'},
      agenda:{rows:Array.isArray(data.agenda)?data.agenda:[],fields:CSV_FIELDS.agenda,name:'agenda'},
      metas:{rows:Array.isArray(data.goals)?data.goals:[],fields:CSV_FIELDS.metas,name:'metas'},
      garimpo:{rows:Array.isArray(data.gar)?data.gar:[],fields:CSV_FIELDS.garimpo,name:'garimpo'},
      followups:{rows:Array.isArray(data.cads)?data.cads:[],fields:CSV_FIELDS.followups,name:'cadencias-followup'}
    };
    const cfg=map[type]||map.leads;
    downloadFile(`outbounder_${cfg.name}_${EXPORT_DATE()}.csv`, toCSV(cfg.rows,cfg.fields), 'text/csv;charset=utf-8');
    toast(`CSV de ${cfg.name} exportado`,'success');
  }
  function exportBackup(){
    downloadFile(`outbounder_backup_completo_${EXPORT_DATE()}.json`, JSON.stringify(collectBackup(),null,2), 'application/json;charset=utf-8');
    toast('Backup completo exportado','success');
  }
  function exportTemplate(){
    const sample={
      nome:'Empresa Exemplo',segmento:'Serviços',responsavel:'Ana',telefone:'(11) 99999-9999',email:'contato@empresa.com',cidade:'Pelotas / RS',tags:'quente, indicação',etapa:'Lead',prioridade:'Alta',valor:'5000',probabilidade:'40',origem:'Garimpo',followup:today(),proximaAcao:'Ligar amanhã',produtoInteresse:'CRM',decisor:'Dono',canalPreferido:'WhatsApp',dorPrincipal:'Falta de organização comercial',obs:'Observação livre'
    };
    downloadFile(`modelo_importacao_leads_${VERSION}.csv`, toCSV([sample],CSV_FIELDS.leads), 'text/csv;charset=utf-8');
    toast('Modelo CSV baixado','success');
  }

  function parseCSV(text){
    const rows=[];let row=[],cell='',q=false;
    const s=String(text||'').replace(/^\uFEFF/,'');
    for(let i=0;i<s.length;i++){
      const c=s[i],n=s[i+1];
      if(c==='"'){
        if(q && n==='"'){cell+='"';i++;}
        else q=!q;
      }else if(c===',' && !q){row.push(cell);cell='';}
      else if((c==='\n' || c==='\r') && !q){
        if(c==='\r' && n==='\n') i++;
        row.push(cell);cell='';
        if(row.some(x=>String(x).trim()!=='')) rows.push(row);
        row=[];
      }else cell+=c;
    }
    row.push(cell); if(row.some(x=>String(x).trim()!=='')) rows.push(row);
    return rows;
  }
  function rowsToObjects(rows){
    if(!rows.length) return [];
    const headers=rows[0].map(h=>String(h||'').trim());
    return rows.slice(1).map(r=>{const o={};headers.forEach((h,i)=>{if(h)o[h]=String(r[i]??'').trim()});return o;}).filter(o=>Object.values(o).some(Boolean));
  }
  function analyseLeadImport(rows){
    const current=getLeads();
    const index=new Map(current.map((l,i)=>[duplicateKey(l),i]).filter(([k])=>k));
    const normalized=rows.map(normalizeLead).filter(l=>l.nome);
    const seen=new Set();
    let duplicates=0,invalid=0,internalDuplicates=0;
    normalized.forEach(l=>{
      const key=duplicateKey(l);
      if(!key) invalid++;
      else if(seen.has(key)) internalDuplicates++;
      else seen.add(key);
      if(key && index.has(key)) duplicates++;
    });
    return {normalized,current,index,stats:{total:rows.length,valid:normalized.length,duplicates,invalid,internalDuplicates,newItems:Math.max(0,normalized.length-duplicates)}};
  }
  function previewCSV(text){
    const rows=parseCSV(text);
    const box=$('#v69Preview');
    if(!box) return;
    if(rows.length<2){box.innerHTML='<div class="v69-alert danger">CSV sem cabeçalho ou sem linhas para importar.</div>';pendingImport=null;return;}
    const objects=rowsToObjects(rows);
    const analysis=analyseLeadImport(objects);
    lastPreviewRows=analysis.normalized;
    pendingImport={type:'csv-leads',rows:analysis.normalized,analysis};
    const fields=Object.keys(objects[0]||{}).slice(0,10);
    box.innerHTML=`
      <div class="v69-preview-head">
        <div><strong>Prévia do CSV de Leads</strong><span>${analysis.stats.valid} válidos · ${analysis.stats.duplicates} possíveis duplicados · ${analysis.stats.invalid} inválidos</span></div>
        <button class="btn btn-primary btn-sm" id="v69ConfirmCsv" type="button">Importar prévia</button>
      </div>
      <div class="v69-kpi-row compact">
        ${mini('Novos',analysis.stats.newItems,'ok')}${mini('Atualizações',analysis.stats.duplicates,'warn')}${mini('Repetidos no arquivo',analysis.stats.internalDuplicates,'danger')}
      </div>
      <div class="v69-table-wrap"><table class="v69-table"><thead><tr>${fields.map(f=>`<th>${esc(f)}</th>`).join('')}<th>Status</th></tr></thead><tbody>${objects.slice(0,12).map(o=>{const l=normalizeLead(o);const k=duplicateKey(l);const st=k&&analysis.index.has(k)?'Atualizar':'Novo';return `<tr>${fields.map(f=>`<td>${esc(o[f])}</td>`).join('')}<td><span class="v69-pill ${st==='Novo'?'ok':'warn'}">${st}</span></td></tr>`}).join('')}</tbody></table></div>`;
    $('#v69ConfirmCsv')?.addEventListener('click',()=>applyCSVImport());
  }
  function applyCSVImport(){
    if(!pendingImport || pendingImport.type!=='csv-leads') return;
    const mode=$('#v69DupMode')?.value||'update';
    const current=getLeads().slice();
    const index=new Map(current.map((l,i)=>[duplicateKey(l),i]).filter(([k])=>k));
    let added=0,updated=0,skipped=0;
    pendingImport.rows.forEach(row=>{
      const key=duplicateKey(row);
      if(!key){skipped++;return;}
      if(index.has(key)){
        if(mode==='skip'){skipped++;return;}
        if(mode==='create'){
          current.unshift({...row,id:row.id||('lead-'+Date.now()+'-'+Math.random().toString(16).slice(2)),dataEntrada:row.dataEntrada||today(),ultimaAtualizacao:today()});added++;return;
        }
        const i=index.get(key);
        current[i]={...current[i],...row,ultimaAtualizacao:today()};updated++;
      }else{
        current.unshift({...row,id:row.id||('lead-'+Date.now()+'-'+Math.random().toString(16).slice(2)),dataEntrada:row.dataEntrada||today(),ultimaAtualizacao:today()});
        added++;
      }
    });
    saveLeads(current);
    pendingImport=null;
    renderImportExport();
    toast(`${added} adicionados, ${updated} atualizados, ${skipped} ignorados`,'success');
  }
  function previewJSON(text){
    const box=$('#v69Preview');
    try{
      const payload=JSON.parse(text);
      const keys=payload.localStorage?Object.keys(payload.localStorage):[];
      const datasets=payload.datasets?Object.keys(payload.datasets):[];
      const leads=Array.isArray(payload.leads)?payload.leads:(Array.isArray(payload.datasets?.leads)?payload.datasets.leads:[]);
      pendingImport={type:'json-backup',payload,keys,datasets,leads};
      box.innerHTML=`
        <div class="v69-preview-head">
          <div><strong>Prévia do backup JSON</strong><span>${payload.meta?.version||'versão não informada'} · ${datasets.length} conjuntos · ${keys.length} chaves locais</span></div>
          <button class="btn btn-primary btn-sm" id="v69ConfirmJson" type="button">Restaurar JSON</button>
        </div>
        <div class="v69-kpi-row compact">
          ${mini('Leads no arquivo',leads.length,'ok')}${mini('Conjuntos',datasets.length,'warn')}${mini('Chaves',keys.length,'')}
        </div>
        <div class="v69-alert warn"><strong>Atenção:</strong> restauração JSON pode substituir dados atuais. Um backup automático será baixado antes da importação.</div>
        <div class="v69-chip-list">${[...datasets,...keys.slice(0,18)].slice(0,30).map(k=>`<span>${esc(k)}</span>`).join('')}</div>`;
      $('#v69ConfirmJson')?.addEventListener('click',()=>applyJSONImport());
    }catch(e){box.innerHTML='<div class="v69-alert danger">JSON inválido. Confira se o arquivo é um backup do CRM.</div>';pendingImport=null;}
  }
  function triggerPreImportBackup(){
    try{downloadFile(`backup_antes_importacao_${EXPORT_DATE()}.json`, JSON.stringify(collectBackup(),null,2), 'application/json;charset=utf-8');}catch(e){}
  }
  async function applyJSONImport(){
    if(!pendingImport || pendingImport.type!=='json-backup') return;
    const mode=$('#v69JsonMode')?.value||'replace';
    const payload=pendingImport.payload;
    const approved=await window.CRMDialog?.confirm(mode==='replace'?'Restaurar backup e substituir dados atuais?':'Mesclar backup com dados atuais?',{title:'Restaurar backup',danger:mode==='replace'});if(!approved)return;
    triggerPreImportBackup();
    let imported=0;
    const leadsPayload=Array.isArray(payload.leads)?payload.leads:(Array.isArray(payload.datasets?.leads)?payload.datasets.leads:null);
    if(mode==='replace' && payload.localStorage){
      Object.entries(payload.localStorage).forEach(([k,v])=>{
        if(DATA_PREFIXES.some(p=>k.startsWith(p))){localStorage.setItem(k,String(v));imported++;}
      });
      const importedLeads=readJSON(LEADS_KEY,null);
      if(Array.isArray(importedLeads)) saveLeads(importedLeads.map(normalizeLead));
    }else{
      if(leadsPayload){
        if(mode==='replace') saveLeads(leadsPayload.map(normalizeLead).filter(l=>l.nome));
        else mergeLeadArray(leadsPayload.map(normalizeLead));
        imported++;
      }
      const map={
        agenda:['outbounder_agenda_v1',payload.datasets?.agenda],
        garimpo:['outbounder_garimpo_leads_v62',payload.datasets?.garimpo],
        cadencias:['crm_v63_cadencias',payload.datasets?.cadencias],
        metas:['outbounder_goals_v5',payload.datasets?.metas],
        automations:['outbounder_automations_v1',payload.datasets?.automations],
        playbooks:['outbounder_playbooks',payload.datasets?.playbooks],
        objecoes:['outbounder_objecoes',payload.datasets?.objecoes],
        perdas:['outbounder_perdas',payload.datasets?.perdas],
        chat:['outbounder_chat_v1',payload.datasets?.chat]
      };
      Object.values(map).forEach(([k,v])=>{if(v!==undefined){writeJSON(k,v);imported++;}});
      if(mode==='replace' && payload.datasets?.settings) {writeJSON('crm_v71_settings',payload.datasets.settings); writeJSON('crm_v61_settings',payload.datasets.settings); imported++;}
    }
    pendingImport=null;
    window.dispatchEvent(new CustomEvent('crm:data-imported',{detail:{source:'v69',mode}}));
    renderImportExport();
    toast(`Backup restaurado (${imported} conjuntos)`,'success');
  }
  function mergeLeadArray(imported){
    const current=getLeads().slice();
    const index=new Map(current.map((l,i)=>[duplicateKey(l),i]).filter(([k])=>k));
    imported.filter(l=>l.nome).forEach(l=>{const k=duplicateKey(l);if(k&&index.has(k)){current[index.get(k)]={...current[index.get(k)],...l,ultimaAtualizacao:today()};}else current.unshift({...l,ultimaAtualizacao:today()});});
    saveLeads(current);
  }

  function handleImportText(){
    const txt=$('#v69ImportText')?.value||'';
    if(!txt.trim()){toast('Cole um CSV ou JSON primeiro','warn');return;}
    const kind=$('#v69ImportKind')?.value||'auto';
    if(kind==='json' || (kind==='auto' && txt.trim().startsWith('{'))) previewJSON(txt);
    else previewCSV(txt);
  }
  function handleFile(file){
    if(!file) return;
    const reader=new FileReader();
    reader.onload=e=>{
      const txt=String(e.target.result||'');
      const area=$('#v69ImportText'); if(area) area.value=txt;
      if(/\.json$/i.test(file.name) || txt.trim().startsWith('{')) previewJSON(txt); else previewCSV(txt);
    };
    reader.readAsText(file,'utf-8');
  }
  function scanDuplicates(){
    const leads=getLeads();const map=new Map();
    leads.forEach(l=>{const k=duplicateKey(l);if(!k)return;if(!map.has(k))map.set(k,[]);map.get(k).push(l);});
    return Array.from(map.values()).filter(arr=>arr.length>1);
  }
  function repairData(){
    const leads=getLeads().map(l=>normalizeLead({...l,nome:l.nome||l.empresa||l.name}));
    saveLeads(leads);
    const events=readJSON(AGENDA_KEY,[]);
    if(Array.isArray(events)) writeJSON(AGENDA_KEY,events.map((e,i)=>({...e,id:e.id||('evt-'+Date.now()+'-'+i),titulo:e.titulo||e.title||e.nome||'Compromisso'})));
    toast('Dados antigos reparados para o padrão atual','success');
    renderImportExport();
  }
  async function clearData(){
    const text=await window.CRMDialog?.prompt('Para apagar os dados comerciais, digite APAGAR:',{title:'Apagar dados comerciais',label:'Confirmação',danger:true});
    if(text!=='APAGAR'){toast('Limpeza cancelada','warn');return;}
    triggerPreImportBackup();
    [LEADS_KEY,AGENDA_KEY,'outbounder_garimpo_leads_v62','crm_v63_cadencias','outbounder_goals_v5','crm_goals_v5','outbounder_automations_v1','outbounder_chat_v1'].forEach(k=>localStorage.removeItem(k));
    try{ if(window.crmSaveLeads) window.crmSaveLeads(); }catch(e){}
    toast('Dados comerciais limpos com backup de segurança','warn');
    renderImportExport();
  }
  function mini(label,value,tone=''){
    return `<div class="v69-mini ${tone}"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;
  }
  function statusHTML(){
    const d=datasetSummary();
    const duplicates=scanDuplicates();
    const incomplete=getLeads().filter(l=>!l.proximaAcao&&!l.followup&& (window.CRMCommercialModel?window.CRMCommercialModel.isOpen(l):!['Fechado','Perdido'].includes(l.etapa)));
    const keys=allManagedKeys().length;
    return `<div class="v69-kpi-row">
      ${mini('Leads',d.leads.length,'ok')}
      ${mini('Agenda',countOf(d.agenda),'')}
      ${mini('Follow-ups',countOf(d.cads),'')}
      ${mini('Metas',countOf(d.goals),'')}
      ${mini('Garimpo',countOf(d.gar),'')}
      ${mini('Possíveis duplicados',duplicates.length,duplicates.length?'warn':'ok')}
      ${mini('Sem próximo passo',incomplete.length,incomplete.length?'warn':'ok')}
      ${mini('Chaves salvas',keys,'')}
    </div>`;
  }
  function renderImportExport(){
    const page=$('#importar'); if(!page) return;
    page.classList.add('v69-import-page');
    page.innerHTML=`
      <div class="section-header v69-head">
        <div><div class="section-title-text">Importar / Exportar</div><div class="section-sub">Backup, CSV, restauração e reparo seguro dos dados do CRM</div></div>
        <div class="v69-head-actions"><button class="btn btn-sm" id="v69Template" type="button">Modelo CSV</button><button class="btn btn-primary btn-sm" id="v69Backup" type="button">Backup completo JSON</button></div>
      </div>
      <section class="v69-hero">
        <div><span class="v69-version">${VERSION}</span><h2>Central segura de dados</h2><p>Exporte tudo antes de mudanças, importe leads por CSV com prévia e restaure backups sem criar módulos paralelos.</p></div>
        <div class="v69-safe-card"><strong>Proteção ativa</strong><span>Antes de restauração/limpeza, a V69 baixa um backup automático do estado atual.</span></div>
      </section>
      ${statusHTML()}
      <section class="v69-grid">
        <article class="v69-card v69-import-card">
          <div class="v69-card-head"><div><h3>Importar dados</h3><p>CSV para leads ou JSON de backup completo.</p></div></div>
          <div class="v69-drop" id="v69Drop"><input type="file" id="v69File" accept=".csv,.json,text/csv,application/json" hidden><strong>Arraste CSV/JSON aqui</strong><span>ou clique para selecionar arquivo</span></div>
          <div class="v69-options">
            <label>Tipo<select id="v69ImportKind"><option value="auto">Detectar automaticamente</option><option value="csv">CSV de Leads</option><option value="json">Backup JSON</option></select></label>
            <label>Duplicados CSV<select id="v69DupMode"><option value="update">Atualizar existente</option><option value="skip">Ignorar duplicado</option><option value="create">Criar mesmo assim</option></select></label>
            <label>JSON<select id="v69JsonMode"><option value="replace">Restaurar/substituir</option><option value="merge">Mesclar dados principais</option></select></label>
          </div>
          <textarea id="v69ImportText" placeholder="Cole aqui CSV de leads ou JSON de backup completo..." rows="8"></textarea>
          <div class="v69-actions"><button class="btn" id="v69PreviewBtn" type="button">Pré-visualizar</button><button class="btn btn-primary" id="v69ImportBtn" type="button">Importar prévia</button></div>
          <div id="v69Preview" class="v69-preview"><div class="v69-empty">Nenhum arquivo analisado ainda.</div></div>
        </article>
        <article class="v69-card">
          <div class="v69-card-head"><div><h3>Exportar dados</h3><p>Use JSON para backup/restauração e CSV para planilhas.</p></div></div>
          <div class="v69-export-list">
            <button type="button" data-v69-export="backup"><b>Backup completo JSON</b><span>Todos os dados e configurações principais</span></button>
            <button type="button" data-v69-export="leads"><b>Leads CSV</b><span>Base comercial completa com cidade e tags</span></button>
            <button type="button" data-v69-export="agenda"><b>Agenda CSV</b><span>Compromissos e eventos vinculados a leads</span></button>
            <button type="button" data-v69-export="metas"><b>Metas CSV</b><span>Metas comerciais conectadas</span></button>
            <button type="button" data-v69-export="garimpo"><b>Garimpo CSV</b><span>Leads garimpados e status de conexão</span></button>
            <button type="button" data-v69-export="followups"><b>Cadências CSV</b><span>Modelos e fluxos de follow-up</span></button>
          </div>
        </article>
        <article class="v69-card">
          <div class="v69-card-head"><div><h3>Manutenção dos dados</h3><p>Ferramentas simples para evitar dados quebrados.</p></div></div>
          <div class="v69-tool-list">
            <button type="button" id="v69Repair"><b>Reparar dados antigos</b><span>Padroniza campos como cidade, tags, próxima ação e IDs</span></button>
            <button type="button" id="v69CheckDup"><b>Ver duplicados</b><span>Analisa nome, telefone, e-mail e cidade</span></button>
            <button type="button" id="v69Clear" class="danger"><b>Limpar dados comerciais</b><span>Baixa backup automático antes de apagar</span></button>
          </div>
          <div id="v69Diag" class="v69-diag"></div>
        </article>
        <article class="v69-card">
          <div class="v69-card-head"><div><h3>Chaves controladas</h3><p>O que entra no backup completo.</p></div></div>
          <div class="v69-key-list">${allManagedKeys().slice(0,44).map(k=>`<span>${esc(k)}</span>`).join('')}</div>
        </article>
      </section>`;
    bindImportExport(page);
  }
  function bindImportExport(page){
    $('#v69Backup',page)?.addEventListener('click',exportBackup);
    $('#v69Template',page)?.addEventListener('click',exportTemplate);
    $('#v69PreviewBtn',page)?.addEventListener('click',handleImportText);
    $('#v69ImportBtn',page)?.addEventListener('click',()=>{
      if(!pendingImport){handleImportText();setTimeout(()=>$('#v69ConfirmCsv')?.click()||$('#v69ConfirmJson')?.click(),50);}
      else if(pendingImport.type==='csv-leads') applyCSVImport();
      else if(pendingImport.type==='json-backup') applyJSONImport();
    });
    $$('#importar [data-v69-export]').forEach(btn=>btn.addEventListener('click',()=>btn.dataset.v69Export==='backup'?exportBackup():exportCSV(btn.dataset.v69Export)));
    const drop=$('#v69Drop',page), file=$('#v69File',page);
    drop?.addEventListener('click',()=>file?.click());
    file?.addEventListener('change',e=>handleFile(e.target.files?.[0]));
    drop?.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag')});
    drop?.addEventListener('dragleave',()=>drop.classList.remove('drag'));
    drop?.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag');handleFile(e.dataTransfer.files?.[0])});
    $('#v69Repair',page)?.addEventListener('click',repairData);
    $('#v69Clear',page)?.addEventListener('click',clearData);
    $('#v69CheckDup',page)?.addEventListener('click',()=>{
      const d=scanDuplicates();const box=$('#v69Diag');if(!box)return;
      box.innerHTML=d.length?`<div class="v69-alert warn"><strong>${d.length} grupos de duplicados encontrados.</strong></div><div class="v69-dup-list">${d.slice(0,12).map(group=>`<div><b>${esc(group[0].nome)}</b><span>${group.length} registros · ${esc(group[0].telefone||group[0].email||group[0].cidade||'sem contato')}</span></div>`).join('')}</div>`:'<div class="v69-alert ok">Nenhum duplicado evidente encontrado.</div>';
    });
  }

  window.renderImportExportV69=renderImportExport;
  window.exportCRMBackupV69=exportBackup;
  function isActiveV69(){return !!$('#importar.active') || document.body?.dataset.currentView==='importar';}
  document.addEventListener('crm:viewchange',e=>{if(e.detail?.view==='importar')setTimeout(renderImportExport,40)});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{if(isActiveV69())renderImportExport();});
  else if(isActiveV69())renderImportExport();
})();
