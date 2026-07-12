(function(){
'use strict';if(window.__CRM_V98_STABILITY__)return;window.__CRM_V98_STABILITY__=true;
const D=document,W=window,$=(s,r=D)=>r.querySelector(s),$$=(s,r=D)=>Array.from(r.querySelectorAll(s));
const VERSION='V98 Estabilização Definitiva';
const LEGACY={funil:['pipeline','funil'],clientes:['leads','clientes'],objecoes:['playbooks','objecoes'],dashboard:['metricas','dashboard'],perdas:['metricas','perdas'],importar:['configuracoes','importar']};
const VIEWS=new Set(['inicio','leads','garimpo','pipeline','cadencias','agenda','ligacoes','chat','metas','automacoes','playbooks','metricas','configuracoes']);
const TITLES={inicio:['Painel','Visão geral das suas oportunidades'],leads:['Gestão de leads','Base comercial principal'],garimpo:['Garimpo de Leads','Prospecção e criação de oportunidades'],pipeline:['Pipeline','Kanban, tabela e funil na mesma estrutura'],cadencias:['Follow-ups','Rotina de próximos contatos'],agenda:['Agenda','Planejamento e compromissos'],ligacoes:['Ligações','Fila de chamadas e histórico'],chat:['Atendimento','Conversas com leads e clientes'],metas:['Metas comerciais','Ligações, follow-ups, propostas e fechamentos'],automacoes:['Automações','Regras, lembretes e gatilhos comerciais'],playbooks:['Playbooks','Scripts, checklists e biblioteca de objeções'],metricas:['Métricas','Dashboard, indicadores e análise de perdas'],configuracoes:['Configurações','Personalização, manutenção e importar/exportar']};
const OWNERS=Object.freeze({inicio:'V67 Dashboard',leads:'V94 Leads',garimpo:'V93 Garimpo',pipeline:'V65 Pipeline',cadencias:'V92 Follow-up',agenda:'V64 Agenda',ligacoes:'V93 Ligações',chat:'Núcleo Chat',metas:'V68 Metas',automacoes:'V95 Automações',playbooks:'V94 Playbooks',metricas:'V94 Métricas',configuracoes:'V97 Configurações'});
let routing=false;
function store(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function normalize(x){let raw=String(x||'inicio').replace(/^#/,'');if(LEGACY[raw])return{view:LEGACY[raw][0],legacy:raw,mode:LEGACY[raw][1]};if(raw==='novo-lead')return{view:'leads',legacy:'novo-lead',mode:'new'};return{view:VIEWS.has(raw)?raw:'inicio',legacy:'',mode:''}}
function activate(view){const target=D.getElementById(view)||D.getElementById('inicio');if(!target)return null;$$('.view').forEach(v=>{const on=v===target;v.classList.toggle('active',on);v.hidden=false;v.style.display=on?'':'none';v.setAttribute('aria-hidden',on?'false':'true')});$$('[data-view],[data-go-view],[data-go]').forEach(n=>{const val=n.getAttribute('data-view')||n.getAttribute('data-go-view')||n.getAttribute('data-go');n.classList.toggle('active',(LEGACY[val]?.[0]||val)===view)});D.body.dataset.currentView=view;const meta=TITLES[view]||[view,''];if($('#topbarTitle'))$('#topbarTitle').textContent=meta[0];if($('#topbarSub'))$('#topbarSub').textContent=meta[1];store('crm_current_view',view);try{history.replaceState(null,'','#'+view)}catch(e){}return target}
function render(view,mode){try{
if(view==='inicio')W.CRMV67Dashboard?.render?.();
else if(view==='leads'){W.CRMV94Official?.renderLeads?.();if(mode==='new')setTimeout(()=>W.CRMV94Official?.openLeadDrawer?.('new'),20)}
else if(view==='pipeline'){if(mode==='funil'){store('crm_v65_pipeline_view','funnel');store('crm_v975_pipeline_mode','funil')}W.CRMV65Pipeline?.render?.()}
else if(view==='metas')W.CRMV68Goals?.render?.();
else if(view==='agenda')W.CRMV64Agenda?.render?.();
else if(view==='cadencias')(W.CRMV92FollowupActive?.render||W.CRMV932FollowupRepair?.render||W.CRMV921FollowupClean?.render)?.();
else if(view==='garimpo')W.CRMV93Official?.renderGarimpo?.();
else if(view==='ligacoes')W.CRMV93Official?.renderLigacoes?.();
else if(view==='playbooks')W.CRMV94Official?.renderPlaybooks?.();
else if(view==='metricas')W.CRMV94Official?.renderMetricas?.();
else if(view==='configuracoes'){W.CRMV972Settings?.render?.();W.CRMV974Personalizacao?.render?.()}
else if(view==='automacoes')(W.renderAutomations||W.CRMV953RemindersCenter?.render||W.CRMV952RuleEngine?.render)?.();
else if(view==='chat'){W.renderConversationList?.();W.updateChatBadge?.()}
}catch(e){console.warn('[V98] falha em '+view,e)}if(mode&&W.CRMV975Consolidacao?.enhance)setTimeout(()=>W.CRMV975Consolidacao.enhance(view,mode==='new'?'':mode),35)}
function loading(el){if(!el)return true;const t=(el.textContent||'').trim();return!t||(/^Carregando/i.test(t)&&t.length<140)||/Carregando módulo/i.test(t)}
function ensure(view,mode,n=0){const el=D.getElementById(view);if(!el||!el.classList.contains('active')||!loading(el))return;if(n<2){render(view,mode);setTimeout(()=>ensure(view,mode,n+1),140);return}el.innerHTML='<div class="card" style="padding:22px;display:grid;gap:10px"><strong>O módulo não concluiu o carregamento.</strong><span style="color:var(--text-3)">A tentativa foi interrompida para evitar carregamento infinito.</span><button class="btn btn-primary" type="button" data-v98-retry="'+view+'">Tentar novamente</button></div>'}
function route(input){if(routing)return;const n=normalize(input);routing=true;try{activate(n.view);render(n.view,n.mode);D.dispatchEvent(new CustomEvent('crm:viewchange',{detail:{view:n.view,source:'v98',legacy:n.legacy||''}}));setTimeout(()=>{render(n.view,n.mode);ensure(n.view,n.mode);healthCheck();routing=false},70)}catch(e){routing=false;console.error('[V98] rota falhou',e)}}
route.__v98Router=true;route.__v975Router=true;
function duplicateIds(){const ids={};$$('[id]').forEach(x=>ids[x.id]=(ids[x.id]||0)+1);return Object.entries(ids).filter(([,n])=>n>1)}
function healthCheck(){const active=$$('.view.active'),cur=active[0];const report={version:VERSION,activeViews:active.map(v=>v.id),activeCount:active.length,duplicateIds:duplicateIds(),loading:cur?loading(cur):true,owners:OWNERS,pipelineOwner:$('#pipeline .v65-pipe-hero')?'V65':($('#pipeline .v94-shell')?'V94':'não renderizado'),metasOwner:$('#metas .v68-hero')?'V68':'não renderizado',legacyPlaceholders:Object.keys(LEGACY).map(id=>({id,ok:!!D.querySelector('#'+id+'[data-v975-legacy-placeholder]')}))};report.ok=report.activeCount===1&&!report.duplicateIds.length&&!report.loading&&report.legacyPlaceholders.every(x=>x.ok);W.__CRM_V98_LAST_HEALTH__=report;return report}
W.setView=route;try{setView=route}catch(e){}W.CRMV98Stability=Object.freeze({version:VERSION,route,healthCheck,owners:OWNERS,legacy:LEGACY});
D.addEventListener('click',e=>{const retry=e.target.closest?.('[data-v98-retry]');if(retry){route(retry.dataset.v98Retry);return}const n=e.target.closest?.('[data-view],[data-go-view],[data-go],a[href^="#"]');if(!n)return;const val=n.getAttribute('data-view')||n.getAttribute('data-go-view')||n.getAttribute('data-go')||(n.getAttribute('href')||'').slice(1);if(!VIEWS.has(val)&&!LEGACY[val]&&val!=='novo-lead')return;e.preventDefault();route(val)},true);
function boot(){Object.keys(LEGACY).forEach(id=>{const el=D.getElementById(id);if(el){el.hidden=true;el.style.display='none';el.classList.remove('active')}});const h=location.hash.replace('#','');let saved='';try{saved=localStorage.getItem('crm_current_view')||''}catch(e){}route(h||saved||$('.view.active')?.id||'inicio');setTimeout(healthCheck,350);setTimeout(healthCheck,1100)}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
