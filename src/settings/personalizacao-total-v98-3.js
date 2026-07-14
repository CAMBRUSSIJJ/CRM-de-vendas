/* CRM V98.3 — Central de Personalização Total por Aba */
(function(){
  'use strict';
  if(window.CRMV983LayoutStudio) return;

  const D=document;
  const W=window;
  const VERSION='V98.7 Personalização Total';
  const STORE='crm_v983_layout_studio';
  const REGISTRY_STORE='crm_v983_layout_registry';
  const VIEWS=['inicio','leads','garimpo','pipeline','ligacoes','cadencias','agenda','chat','playbooks','metas','automacoes','metricas','configuracoes'];
  const LABELS={inicio:'Painel',leads:'Leads',garimpo:'Garimpo',pipeline:'Pipeline',ligacoes:'Ligações',cadencias:'Follow-ups',agenda:'Agenda',chat:'Atendimento',playbooks:'Playbooks',metas:'Metas',automacoes:'Automações',metricas:'Métricas',configuracoes:'Configurações'};
  const CANDIDATES=[
    '.panel-pro-hero','.panel-pro-toolbar','.panel-widget','.card','.v94-hero','.v94-kpi','.v94-panel','.v94-card',
    '.v93-hero','.v93-kpi','.v93-panel','.v93-card','.v92-hero','.v92-panel','.v92-card','.v92-kpi',
    '.v65-pipe-hero','.v65-pipe-kpi','.v65-pipe-tools','.v65-insight','.v65-pipe-col','.v65-funnel-card',
    '.v68-hero','.v68-kpi','.v68-card','.v69-hero','.v69-card','.v69-kpi','.v67-hero','.v67-kpi','.v67-card',
    '.agenda-kpis','.ag-kpi','.agenda-toolbar','.cal-grid','.v982-call-hero','.v982-call-kpis>div','.v982-call-toolbar','.v982-panel',
    '.v982-cadence-editor','.v982-cadence-preview','.v982-cad-row','.v954-hero','.v954-kpi','.v954-panel','.v954-card',
    '#chatLayout','#chatMain','#chatEmpty','#chatWaDisconnected','#chatConversationArea','#chatMessages','#chatConversationList','.v975-panel','.v975-card','.crm-v71-card','.v731-settings-card','.v974-personalizacao','.v972-settings-block',
    '[class*="-hero"]','[class*="-kpi"]','[class*="-panel"]','[class*="-card"]'
  ].join(',');
  const EXCLUDE='script,style,template,svg,button,input,select,textarea,option,table,thead,tbody,tr,td,th,.modal-overlay,.detail-overlay,.toast,[hidden],[aria-hidden="true"],[data-crm-layout-ui]';

  let uiState={view:'inicio',pane:'tab',component:null,search:'',drawer:false};
  let observer=null;
  let scanTimer=null;
  let applying=false;
  let registry=loadJSON(REGISTRY_STORE,{});

  function $(s,r=D){return r.querySelector(s)}
  function $$(s,r=D){return Array.from(r.querySelectorAll(s))}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function loadJSON(key,fb){try{const x=JSON.parse(localStorage.getItem(key)||'null');return x&&typeof x==='object'?x:fb}catch(_){return fb}}
  function saveJSON(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch(_){}}
  function clone(v){return JSON.parse(JSON.stringify(v))}
  function slug(v){return String(v||'item').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,52)||'item'}
  function hex(v,fb=''){const s=String(v||'').trim();return /^#[0-9a-f]{6}$/i.test(s)?s:fb}
  function rgb(hexColor){const h=hex(hexColor,'#1d9e75').slice(1);const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255]}
  function toast(msg,type='success'){
    try{if(W.crmToast)return W.crmToast(msg,type)}catch(_){ }
    try{if(W.showToast)return W.showToast(msg,type)}catch(_){ }
    const old=$('.v983-layout-toast'); if(old)old.remove();
    const el=D.createElement('div');el.className='v982-toast v983-layout-toast';el.textContent=msg;D.body.appendChild(el);setTimeout(()=>el.remove(),2400);
  }

  function tabDefaults(){return{
    pageBg:'',textColor:'',accent:'',cardBg:'',cardText:'',cardBorder:'',gap:18,padding:0,density:'normal',radius:'original',shadow:'original',maxWidth:'fluid',autoContrast:true,forceText:false,
    components:{},order:[]
  }}
  function defaults(){const tabs={};VIEWS.forEach(v=>tabs[v]=tabDefaults());return{version:VERSION,tabs,lastView:'inicio'}}
  function normalize(raw){
    const out=defaults();raw=raw&&typeof raw==='object'?raw:{};
    VIEWS.forEach(v=>{
      const src=raw.tabs?.[v]||{};const t=Object.assign(tabDefaults(),src);
      t.components=src.components&&typeof src.components==='object'?src.components:{};
      t.order=Array.isArray(src.order)?src.order.filter(Boolean):[];
      t.gap=Math.max(0,Math.min(60,Number(t.gap)||18));
      t.padding=Math.max(0,Math.min(80,Number(t.padding)||0));
      if(!['compact','normal','spacious'].includes(t.density))t.density='normal';
      if(!['original','0','10','14','18','24','32'].includes(String(t.radius)))t.radius='original';
      if(!['original','none','soft','medium','strong'].includes(t.shadow))t.shadow='original';
      if(!['fluid','wide','comfortable','focus'].includes(t.maxWidth))t.maxWidth='fluid';
      ['pageBg','textColor','accent','cardBg','cardText','cardBorder'].forEach(k=>t[k]=hex(t[k],''));
      t.autoContrast=t.autoContrast!==false;t.forceText=!!t.forceText;
      out.tabs[v]=t;
    });
    out.lastView=VIEWS.includes(raw.lastView)?raw.lastView:'inicio';
    return out;
  }
  function load(){return normalize(loadJSON(STORE,{}))}
  function save(cfg){const n=normalize(cfg);saveJSON(STORE,n);return n}
  function tabCfg(view){return load().tabs[view]||tabDefaults()}
  function componentDefaults(){return{visible:true,bg:'',text:'',border:'',accent:'',radius:'',shadow:'inherit',opacity:100,padding:'',fullWidth:false,accentStrip:false,forceText:false}}
  function componentCfg(view,key){return Object.assign(componentDefaults(),tabCfg(view).components[key]||{})}

  function activeView(){return $('.view.active')?.id||D.body.dataset.currentView||load().lastView||'inicio'}
  function viewEl(id){return D.getElementById(id)}
  function readableLabel(el,index){
    const explicit=el.getAttribute('aria-label')||el.getAttribute('title')||el.dataset.layoutLabel;
    if(explicit)return explicit.trim().slice(0,70);
    if(el.id)return humanize(el.id);
    const head=el.querySelector(':scope > h1,:scope > h2,:scope > h3,:scope > h4,:scope > header h1,:scope > header h2,:scope > header h3,:scope .card-title,:scope .section-title-text,:scope [class*="title"]');
    const txt=(head?.textContent||el.querySelector('h1,h2,h3,h4,strong')?.textContent||'').replace(/\s+/g,' ').trim();
    if(txt&&txt.length<90)return txt;
    const classes=Array.from(el.classList).filter(c=>!['active','hidden','view','grid-view'].includes(c));
    const primary=classes.find(c=>/hero|kpi|panel|card|toolbar|queue|calendar|table|funnel|kanban|agenda/i.test(c))||classes[0];
    return primary?humanize(primary):`Bloco ${index+1}`;
  }
  function humanize(v){return String(v||'Bloco').replace(/^v\d+[-_]?/i,'').replace(/[-_]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase()).trim()}
  function classSignature(el){
    const ignore=/^(active|hidden|selected|open|visible|dragging|drop|grid-view|view|routine|compact|expanded)$/;
    const cls=Array.from(el.classList).filter(c=>!ignore.test(c)&&!c.startsWith('crm-lp-')&&!c.startsWith('crm-layout-')).sort();
    const parent=el.parentElement;
    const pcls=parent?Array.from(parent.classList).filter(c=>!ignore.test(c)).sort().slice(0,2):[];
    return `${el.tagName.toLowerCase()}.${cls.join('.')}@${pcls.join('.')}`;
  }
  function isCandidate(el,view){
    if(!el||el===view||el.matches(EXCLUDE)||el.closest('[data-crm-layout-ui]'))return false;
    if(el.closest('.modal-overlay,.detail-overlay,.toast'))return false;
    const cls=String(el.className||'');
    if(/row-action|btn|badge|chip|tab|field|input|select|item-row|lead-row|table-row/i.test(cls))return false;
    if(el.tagName==='SECTION'&&el.id&&el.classList.contains('view'))return false;
    return true;
  }
  function directCandidates(view){
    return Array.from(view.children).filter(el=>isCandidate(el,view)&&!el.matches('.modal-overlay,.detail-overlay,[data-v975-legacy-placeholder]'));
  }
  function discover(viewId){
    const view=viewEl(viewId);if(!view)return[];
    const raw=[...directCandidates(view),...$$(CANDIDATES,view).filter(el=>isCandidate(el,view))];
    const unique=Array.from(new Set(raw));
    const sigCounts={};unique.forEach(el=>{const s=classSignature(el);sigCounts[s]=(sigCounts[s]||0)+1});
    const seen=new Map();const items=[];
    unique.forEach((el,index)=>{
      const sig=classSignature(el);const repeated=sigCounts[sig]>=3;const grouped=repeated&&!el.id;
      const top=el.parentElement===view;
      let key;
      if(el.id) key=`id:${el.id}`;
      else if(grouped) key=`group:${slug(sig)}`;
      else key=`item:${slug(readableLabel(el,index))}:${slug(sig)}`;
      if(seen.has(key)){
        const item=seen.get(key);item.nodes.push(el);item.count=item.nodes.length;return;
      }
      const item={key,label:grouped?`Grupo · ${readableLabel(el,index)}`:readableLabel(el,index),kind:top?'Seção':(/hero/i.test(sig)?'Destaque':/kpi/i.test(sig)?'Indicador':/toolbar/i.test(sig)?'Barra':'Card'),count:1,nodes:[el],top,reorderable:top};
      seen.set(key,item);items.push(item);
    });
    items.forEach(item=>item.nodes.forEach(el=>{el.dataset.crmLayoutComponent=item.key;el.dataset.crmLayoutKind=item.kind;}));
    registry[viewId]=items.map(({key,label,kind,count,top,reorderable})=>({key,label,kind,count,top,reorderable}));
    saveJSON(REGISTRY_STORE,registry);
    return items;
  }
  function registryItems(viewId){
    const live=discover(viewId);
    if(live.length)return live;
    return (registry[viewId]||[]).map(x=>Object.assign({},x,{nodes:[]}));
  }

  function shadowValue(v){return({original:'',none:'none',soft:'0 18px 40px -38px rgba(15,23,42,.50)',medium:'0 16px 34px -20px rgba(15,23,42,.28)',strong:'0 20px 48px -16px rgba(15,23,42,.38)',inherit:'var(--crm-tab-shadow)'})[v]||'var(--crm-tab-shadow)'}
  function maxWidth(v){return({fluid:'none',wide:'1680px',comfortable:'1380px',focus:'1120px'})[v]||'none'}
  function setProp(el,name,value,important=true){if(value===null||value===undefined||value==='')el.style.removeProperty(name);else el.style.setProperty(name,String(value),important?'important':'')}
  function clearComponentStyles(el){
    ['--crm-component-bg','--crm-component-text','--crm-component-border','--crm-component-radius','--crm-component-shadow','--crm-component-opacity','--crm-component-padding','--crm-component-accent','order','grid-column','width'].forEach(p=>el.style.removeProperty(p));
    delete el.dataset.crmForceText;delete el.dataset.crmNoShadow;delete el.dataset.crmAccentStrip;delete el.dataset.crmComponentPadding;delete el.dataset.crmFullWidth;delete el.dataset.crmCustomBg;delete el.dataset.crmCustomText;delete el.dataset.crmCustomBorder;delete el.dataset.crmCustomRadius;delete el.dataset.crmCustomShadow;if(el.dataset.crmLayoutHidden==='1'){const prev=el.dataset.crmOriginalDisplay||'';if(prev)el.style.setProperty('display',prev);else el.style.removeProperty('display');delete el.dataset.crmOriginalDisplay;delete el.dataset.crmLayoutHidden;}
  }
  function applyComponent(view,item,cfg,orderIndex){
    item.nodes.forEach(el=>{
      clearComponentStyles(el);
      if(cfg.visible===false){if(el.dataset.crmLayoutHidden!=='1')el.dataset.crmOriginalDisplay=el.style.getPropertyValue('display')||'';el.dataset.crmLayoutHidden='1';el.style.setProperty('display','none','important');return}
      if(cfg.bg){setProp(el,'--crm-component-bg',cfg.bg,false);el.dataset.crmCustomBg='1'}
      if(cfg.text){setProp(el,'--crm-component-text',cfg.text,false);el.dataset.crmForceText='1';el.dataset.crmCustomText='1'}
      if(cfg.border){setProp(el,'--crm-component-border',cfg.border,false);el.dataset.crmCustomBorder='1'}
      if(cfg.accent){setProp(el,'--crm-component-accent',cfg.accent,false)}
      if(cfg.radius){setProp(el,'--crm-component-radius',`${Number(cfg.radius)}px`,false);el.dataset.crmCustomRadius='1'}
      if(cfg.shadow&&cfg.shadow!=='inherit'){setProp(el,'--crm-component-shadow',shadowValue(cfg.shadow),false);el.dataset.crmCustomShadow='1';if(cfg.shadow==='none')el.dataset.crmNoShadow='1'}
      setProp(el,'--crm-component-opacity',Math.max(20,Math.min(100,Number(cfg.opacity)||100))/100,false);
      if(cfg.padding!==''){setProp(el,'--crm-component-padding',`${Math.max(0,Math.min(60,Number(cfg.padding)||0))}px`,false);el.dataset.crmComponentPadding='1'}
      if(cfg.fullWidth&&item.top)el.dataset.crmFullWidth='1';
      if(cfg.accentStrip)el.dataset.crmAccentStrip='1';
      if(cfg.forceText)el.dataset.crmForceText='1';
      if(item.reorderable)setProp(el,'order',orderIndex,false);
    });
  }
  function colorLuminance(c){
    const m=String(c||'').match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i);let vals;
    if(m)vals=[+m[1],+m[2],+m[3]];else if(/^#[0-9a-f]{6}$/i.test(c))vals=rgb(c);else return null;
    const x=vals.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*x[0]+.7152*x[1]+.0722*x[2];
  }
  function backgroundLuminance(el){
    const cs=getComputedStyle(el);const colors=[];
    const bg=cs.backgroundColor;if(bg&&!/rgba\(0, 0, 0, 0\)|transparent/.test(bg))colors.push(bg);
    const matches=(cs.backgroundImage||'').match(/#[0-9a-f]{3,8}|rgba?\([^)]*\)/ig)||[];matches.forEach(c=>colors.push(c));
    const vals=colors.map(colorLuminance).filter(v=>v!==null);if(!vals.length)return null;return vals.reduce((a,b)=>a+b,0)/vals.length;
  }
  function applyContrast(view,enabled){
    const heroes=$$('[class*="hero"],[data-crm-layout-kind="Destaque"]',view);
    heroes.forEach(el=>{
      delete el.dataset.crmAutoTone;if(!enabled)return;
      const lum=backgroundLuminance(el);
      if(lum===null)return;
      el.dataset.crmAutoTone=lum>.56?'dark-text':'light-text';
    });
  }
  function applyView(viewId){
    const view=viewEl(viewId);if(!view)return;
    applying=true;
    try{
      const cfg=tabCfg(viewId);const items=discover(viewId);
      view.dataset.crmLayoutView=viewId;view.dataset.crmLayoutDensity=cfg.density;
      view.dataset.crmForceTabText=cfg.forceText?'1':'0';
      view.dataset.crmCardBg=cfg.cardBg?'1':'0';view.dataset.crmCardText=cfg.cardText?'1':'0';view.dataset.crmCardBorder=cfg.cardBorder?'1':'0';
      view.dataset.crmCardRadius=cfg.radius!=='original'?'1':'0';view.dataset.crmCardShadow=cfg.shadow!=='original'?'1':'0';
      setProp(view,'--crm-tab-bg',cfg.pageBg||'transparent',false);
      setProp(view,'--crm-tab-text',cfg.textColor||'var(--text,#172033)',false);
      setProp(view,'--crm-tab-accent',cfg.accent||'var(--v71-accent,#1d9e75)',false);
      setProp(view,'--crm-tab-card-bg',cfg.cardBg||'var(--surface,#fff)',false);
      setProp(view,'--crm-tab-card-text',cfg.cardText||'var(--text,#172033)',false);
      setProp(view,'--crm-tab-card-border',cfg.cardBorder||'var(--border,#dfe5eb)',false);
      setProp(view,'--crm-tab-gap',`${cfg.gap}px`,false);setProp(view,'--crm-tab-pad',`${cfg.padding}px`,false);
      if(cfg.radius!=='original')setProp(view,'--crm-tab-radius',`${cfg.radius}px`,false);else view.style.removeProperty('--crm-tab-radius');if(cfg.shadow!=='original')setProp(view,'--crm-tab-shadow',shadowValue(cfg.shadow),false);else view.style.removeProperty('--crm-tab-shadow');
      setProp(view,'--crm-tab-max-width',maxWidth(cfg.maxWidth),false);
      if(cfg.accent){const [r,g,b]=rgb(cfg.accent);setProp(view,'--v71-accent',cfg.accent,false);setProp(view,'--brand-accent',cfg.accent,false);setProp(view,'--blue',cfg.accent,false);setProp(view,'--v71-accent-rgb',`${r},${g},${b}`,false)}else ['--v71-accent','--brand-accent','--blue','--v71-accent-rgb'].forEach(p=>view.style.removeProperty(p));
      const order=cfg.order.length?cfg.order:items.filter(x=>x.top).map(x=>x.key);
      items.forEach((item,index)=>applyComponent(view,item,componentCfg(viewId,item.key),Math.max(0,order.indexOf(item.key)>=0?order.indexOf(item.key):index)+1));
      applyContrast(view,cfg.autoContrast);
    }finally{applying=false}
  }
  function applyAll(){VIEWS.forEach(applyView);injectButton();ensureDrawer();ensureCenter()}
  function scheduleApply(viewId){clearTimeout(scanTimer);scanTimer=setTimeout(()=>{applyView(viewId||activeView());refreshUI()},80)}

  function colorField(label,path,value){const val=hex(value,'#ffffff');return `<div class="crm-lp-field"><label>${esc(label)}</label><div class="crm-lp-color-row"><input type="color" value="${val}" data-lp-color="${esc(path)}"><input type="text" value="${esc(value||'')}" placeholder="Padrão do tema" data-lp-field="${esc(path)}"><button class="crm-lp-clear" type="button" data-lp-clear="${esc(path)}" title="Usar padrão">×</button></div></div>`}
  function selectField(label,path,value,opts,wide=false){return `<div class="crm-lp-field ${wide?'wide':''}"><label>${esc(label)}</label><select data-lp-field="${esc(path)}">${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(value)===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></div>`}
  function rangeField(label,path,value,min,max,suffix='px'){return `<div class="crm-lp-field"><label>${esc(label)}</label><div class="crm-lp-range"><input type="range" min="${min}" max="${max}" value="${Number(value)||0}" data-lp-field="${esc(path)}"><output>${Number(value)||0}${suffix}</output></div></div>`}
  function toggleField(title,desc,path,value){return `<div class="crm-lp-field wide"><div class="crm-lp-toggle"><div><b>${esc(title)}</b><small>${esc(desc)}</small></div><label class="crm-lp-switch"><input type="checkbox" ${value?'checked':''} data-lp-field="${esc(path)}"><i></i></label></div></div>`}
  function tabPane(view){const c=tabCfg(view);return `<div class="crm-lp-pane ${uiState.pane==='tab'?'active':''}" data-lp-pane="tab"><div class="crm-lp-grid">
    ${colorField('Fundo da aba','tab.pageBg',c.pageBg)}${colorField('Cor do texto da aba','tab.textColor',c.textColor)}
    ${colorField('Cor de destaque desta aba','tab.accent',c.accent)}${colorField('Fundo padrão dos cards','tab.cardBg',c.cardBg)}
    ${colorField('Texto padrão dos cards','tab.cardText',c.cardText)}${colorField('Borda padrão dos cards','tab.cardBorder',c.cardBorder)}
    ${selectField('Densidade','tab.density',c.density,[['compact','Compacta'],['normal','Padrão'],['spacious','Confortável']])}
    ${selectField('Largura útil','tab.maxWidth',c.maxWidth,[['fluid','Tela inteira'],['wide','Ampla — 1680px'],['comfortable','Confortável — 1380px'],['focus','Foco — 1120px']])}
    ${selectField('Arredondamento','tab.radius',String(c.radius),[['original','Manter original'],['0','Reto'],['10','Discreto'],['14','Médio'],['18','Arredondado'],['24','Grande'],['32','Extra grande']])}
    ${selectField('Sombra dos cards','tab.shadow',c.shadow,[['original','Manter original'],['none','Sem sombra'],['soft','Suave'],['medium','Média'],['strong','Forte']])}
    ${rangeField('Espaçamento entre blocos','tab.gap',c.gap,0,60)}${rangeField('Margem interna da aba','tab.padding',c.padding,0,80)}
    ${toggleField('Contraste automático','Corrige automaticamente títulos claros em fundos claros e títulos escuros em fundos escuros.','tab.autoContrast',c.autoContrast)}
    ${toggleField('Forçar cor de texto','Aplica a cor escolhida também aos títulos e textos internos da aba.','tab.forceText',c.forceText)}
  </div><div class="crm-lp-actions"><button class="crm-lp-btn primary" type="button" data-lp-action="apply">Aplicar agora</button><button class="crm-lp-btn soft" type="button" data-lp-action="copy-tab">Copiar estilo desta aba</button><button class="crm-lp-btn danger" type="button" data-lp-action="reset-tab">Restaurar esta aba</button></div></div>`}

  function componentList(view,items){
    const q=uiState.search.toLowerCase();const filtered=items.filter(i=>!q||`${i.label} ${i.kind}`.toLowerCase().includes(q));
    return `<div class="crm-lp-component-list"><div class="crm-lp-component-list-head"><input value="${esc(uiState.search)}" placeholder="Buscar card ou seção..." data-lp-component-search></div>${filtered.map(i=>{const c=componentCfg(view,i.key);return `<button type="button" class="crm-lp-component-item ${uiState.component===i.key?'active':''}" data-lp-component="${esc(i.key)}"><span><b>${esc(i.label)}</b><small>${esc(i.kind)}${i.count>1?` · ${i.count} itens`:''}</small></span><span class="state ${c.visible===false?'off':''}">${c.visible===false?'Oculto':'Visível'}</span></button>`}).join('')||'<div class="crm-lp-empty">Nenhum card foi mapeado ainda. Abra essa aba uma vez e volte para atualizar o mapa.</div>'}</div>`
  }
  function componentEditor(view,item){
    if(!item)return '<div class="crm-lp-component-editor"><div class="crm-lp-empty">Selecione um card ou seção para editar cor, visibilidade, borda, sombra, largura e posição.</div></div>';
    const c=componentCfg(view,item.key);return `<div class="crm-lp-component-editor"><div class="crm-lp-editor-head"><div><h3>${esc(item.label)}</h3><p>${esc(item.kind)}${item.count>1?` · altera ${item.count} itens semelhantes`:''}</p></div>${item.reorderable?'<div class="crm-lp-move"><button type="button" data-lp-move="up" title="Mover para cima">↑</button><button type="button" data-lp-move="down" title="Mover para baixo">↓</button></div>':''}</div><div class="crm-lp-grid">
      ${toggleField('Mostrar este bloco','Você pode ocultar e reativar quando quiser.','component.visible',c.visible!==false)}
      ${colorField('Fundo do bloco','component.bg',c.bg)}${colorField('Cor do texto','component.text',c.text)}
      ${colorField('Cor da borda','component.border',c.border)}${colorField('Cor de destaque','component.accent',c.accent)}
      ${selectField('Arredondamento','component.radius',String(c.radius),[['','Herdar da aba'],['0','Reto'],['10','Discreto'],['14','Médio'],['18','Arredondado'],['24','Grande'],['32','Extra grande']])}
      ${selectField('Sombra','component.shadow',c.shadow,[['inherit','Herdar da aba'],['none','Sem sombra'],['soft','Suave'],['medium','Média'],['strong','Forte']])}
      ${rangeField('Opacidade','component.opacity',c.opacity,20,100,'%')}
      <div class="crm-lp-field"><label>Espaço interno</label><select data-lp-field="component.padding"><option value="" ${c.padding===''?'selected':''}>Herdar original</option>${[0,8,12,16,20,24,32,40].map(n=>`<option value="${n}" ${String(c.padding)===String(n)?'selected':''}>${n}px</option>`).join('')}</select></div>
      ${toggleField('Ocupar toda a largura','Faz o bloco usar todas as colunas disponíveis.','component.fullWidth',c.fullWidth)}
      ${toggleField('Faixa de destaque','Adiciona uma faixa lateral com a cor de destaque.','component.accentStrip',c.accentStrip)}
      ${toggleField('Forçar texto interno','Aplica a cor escolhida aos títulos e textos internos.','component.forceText',c.forceText)}
    </div><div class="crm-lp-actions"><button class="crm-lp-btn primary" type="button" data-lp-action="apply">Aplicar</button><button class="crm-lp-btn danger" type="button" data-lp-action="reset-component">Restaurar bloco</button></div></div>`
  }
  function componentsPane(view,items){
    const selected=items.find(x=>x.key===uiState.component)||null;
    return `<div class="crm-lp-pane ${uiState.pane==='components'?'active':''}" data-lp-pane="components"><div class="crm-lp-components-layout">${componentList(view,items)}${componentEditor(view,selected)}</div><div class="crm-lp-note" style="margin-top:10px">Os grupos repetidos, como indicadores e cards de leads, podem ser alterados juntos. Blocos ocultos continuam disponíveis nesta lista para serem reativados.</div></div>`
  }
  function presetsPane(view){return `<div class="crm-lp-pane ${uiState.pane==='presets'?'active':''}" data-lp-pane="presets"><div class="crm-lp-presets">
    <button class="crm-lp-preset" type="button" data-lp-preset="clean"><b>Limpo profissional</b><small>Cards claros, sombra suave, espaço confortável e contraste automático.</small></button>
    <button class="crm-lp-preset" type="button" data-lp-preset="compact"><b>Operação compacta</b><small>Reduz espaços e sombras para mostrar mais informações por tela.</small></button>
    <button class="crm-lp-preset" type="button" data-lp-preset="focus"><b>Modo foco</b><small>Limita a largura, amplia espaços e deixa somente o essencial em evidência.</small></button>
    <button class="crm-lp-preset" type="button" data-lp-preset="accent"><b>Destaque da marca</b><small>Usa a cor principal do CRM em bordas, faixas e elementos importantes.</small></button>
  </div><div class="crm-lp-actions"><button class="crm-lp-btn soft" type="button" data-lp-action="export">Exportar personalização</button><button class="crm-lp-btn soft" type="button" data-lp-action="import">Importar personalização</button><button class="crm-lp-btn danger" type="button" data-lp-action="reset-all">Restaurar todas as abas</button><input class="crm-lp-file" type="file" accept="application/json" data-lp-file></div><div class="crm-lp-note" style="margin-top:10px">A exportação cria um backup apenas do layout. Leads, agenda, metas e demais dados comerciais não são alterados.</div></div>`}
  function studioHtml(view,compact=false){
    const items=registryItems(view);if(!uiState.component&&items.length)uiState.component=items[0].key;
    return `<div class="crm-lp-studio" data-crm-layout-ui data-lp-studio data-lp-view="${esc(view)}"><div class="crm-lp-toolbar"><label><span>Aba para personalizar</span><select data-lp-view-select>${VIEWS.map(v=>`<option value="${v}" ${view===v?'selected':''}>${esc(LABELS[v])}</option>`).join('')}</select></label>${compact?'<button class="crm-lp-btn soft" type="button" data-lp-action="open-view">Abrir esta aba</button>':''}<button class="crm-lp-btn ${D.body.classList.contains('crm-layout-editing')?'primary':'soft'}" type="button" data-lp-action="visual-edit">${D.body.classList.contains('crm-layout-editing')?'Encerrar edição visual':'Selecionar card na tela'}</button></div><div class="crm-lp-tabs"><button type="button" class="${uiState.pane==='tab'?'active':''}" data-lp-pane-btn="tab">Aparência da aba</button><button type="button" class="${uiState.pane==='components'?'active':''}" data-lp-pane-btn="components">Cards e seções</button><button type="button" class="${uiState.pane==='presets'?'active':''}" data-lp-pane-btn="presets">Presets e backup</button></div>${tabPane(view)}${componentsPane(view,items)}${presetsPane(view)}</div>`
  }

  function injectButton(){
    const old=$('#crmLayoutStudioButton');if(old)old.remove();
  }
  function ensureDrawer(){
    if(!$('#crmLayoutStudioBackdrop')){const b=D.createElement('div');b.id='crmLayoutStudioBackdrop';b.setAttribute('data-crm-layout-ui','');D.body.appendChild(b)}
    if(!$('#crmLayoutStudioDrawer')){const d=D.createElement('aside');d.id='crmLayoutStudioDrawer';d.setAttribute('data-crm-layout-ui','');d.innerHTML='<div class="crm-lp-drawer-head"><div><span>Personalização por aba</span><h2 id="crmLpDrawerTitle">Layout</h2><p>Controle o que aparece e como cada parte deve ficar.</p></div><button class="crm-lp-close" type="button" data-lp-action="close">×</button></div><div class="crm-lp-drawer-body" id="crmLpDrawerBody"></div>';D.body.appendChild(d)}
  }
  function openDrawer(view=activeView(),component=null){uiState.view=VIEWS.includes(view)?view:'inicio';uiState.component=component;uiState.drawer=true;ensureDrawer();renderDrawer();$('#crmLayoutStudioBackdrop')?.classList.add('active');$('#crmLayoutStudioDrawer')?.classList.add('active')}
  function closeDrawer(){uiState.drawer=false;D.body.classList.remove('crm-layout-editing');$('#crmLayoutStudioBackdrop')?.classList.remove('active');$('#crmLayoutStudioDrawer')?.classList.remove('active');refreshUI()}
  function renderDrawer(){if(!uiState.drawer)return;const body=$('#crmLpDrawerBody'),title=$('#crmLpDrawerTitle');if(title)title.textContent=LABELS[uiState.view]||uiState.view;if(body)body.innerHTML=studioHtml(uiState.view,true)}
  function ensureCenter(){
    const root=$('#configuracoes');if(!root)return;
    let center=root.querySelector('[data-v983-layout-center]');if(!center){center=D.createElement('section');center.className='crm-lp-center';center.dataset.v983LayoutCenter='1';center.setAttribute('data-crm-layout-ui','');root.appendChild(center)}
    center.innerHTML=`<div class="crm-lp-center-head"><div><div class="eyebrow">Personalização por aba</div><h2>Personalização completa por aba</h2><p>Escolha o que aparece em cada módulo, altere cores de cards e seções, reorganize blocos, ajuste densidade, largura, bordas, sombras e contraste.</p></div><div class="crm-lp-center-actions"><button class="crm-lp-btn soft" type="button" data-lp-action="scan-all">Atualizar mapa de cards</button><button class="crm-lp-btn primary" type="button" data-lp-action="open-active">Abrir personalização da aba atual</button></div></div><div class="crm-lp-center-body">${studioHtml(uiState.view,false)}</div>`;
  }
  function refreshUI(){if(uiState.drawer)renderDrawer();const center=$('[data-v983-layout-center]');if(center&&$('#configuracoes'))ensureCenter()}

  function getPath(path){const [scope,key]=path.split('.');if(scope==='tab')return tabCfg(uiState.view)[key];if(scope==='component'&&uiState.component)return componentCfg(uiState.view,uiState.component)[key];return''}
  function setPath(path,value){
    const cfg=load();const [scope,key]=path.split('.');const view=uiState.view;
    if(scope==='tab')cfg.tabs[view][key]=value;
    if(scope==='component'&&uiState.component){cfg.tabs[view].components[uiState.component]=Object.assign(componentDefaults(),cfg.tabs[view].components[uiState.component]||{}, {[key]:value})}
    cfg.lastView=view;save(cfg);applyView(view);
  }
  function parseInput(el){if(el.type==='checkbox')return el.checked;if(el.type==='range'||el.type==='number')return Number(el.value);return el.value}
  function updateRange(el){const out=el.closest('.crm-lp-range')?.querySelector('output');if(out)out.textContent=`${el.value}${el.dataset.lpField?.includes('opacity')?'%':'px'}`}
  function handleField(el){const path=el.dataset.lpField;if(!path)return;let val=parseInput(el);if(/Bg|Color|Border|accent|\.bg$|\.text$|\.border$/.test(path)&&val)val=hex(val,'');setPath(path,val);updateRange(el);if(el.type!=='range')refreshUI()}
  function moveComponent(dir){
    const cfg=load(),view=uiState.view,key=uiState.component;const items=registryItems(view).filter(x=>x.top);let order=cfg.tabs[view].order.length?cfg.tabs[view].order.slice():items.map(x=>x.key);items.forEach(x=>{if(!order.includes(x.key))order.push(x.key)});const i=order.indexOf(key),j=i+(dir==='up'?-1:1);if(i<0||j<0||j>=order.length)return;[order[i],order[j]]=[order[j],order[i]];cfg.tabs[view].order=order;save(cfg);applyView(view);refreshUI();
  }
  function resetTab(){const cfg=load();cfg.tabs[uiState.view]=tabDefaults();save(cfg);applyView(uiState.view);uiState.component=null;refreshUI();toast('Layout da aba restaurado.')}
  function resetComponent(){if(!uiState.component)return;const cfg=load();delete cfg.tabs[uiState.view].components[uiState.component];save(cfg);applyView(uiState.view);refreshUI();toast('Card restaurado.')}
  function resetAll(){window.CRMDialog?.confirm('Restaurar a personalização de todas as abas?',{title:'Restaurar personalização',danger:true}).then(ok=>{if(!ok)return;localStorage.removeItem(STORE);VIEWS.forEach(applyView);uiState.component=null;refreshUI();toast('Todas as abas foram restauradas.')})}
  function copyTab(){
    window.CRMDialog?.prompt('Digite o nome ou ID da aba que deve receber este estilo:',{title:'Copiar estilo para outra aba',label:'Aba de destino',placeholder:'Ex.: Pipeline'}).then(target=>{if(!target)return;const id=VIEWS.find(v=>v===target.trim().toLowerCase()||LABELS[v].toLowerCase()===target.trim().toLowerCase());if(!id)return toast('Aba não encontrada.','warn');const cfg=load();const source=clone(cfg.tabs[uiState.view]);source.components={};source.order=[];cfg.tabs[id]=source;save(cfg);applyView(id);toast(`Estilo copiado para ${LABELS[id]}.`)})
  }
  function preset(name){
    const cfg=load(),t=cfg.tabs[uiState.view];
    if(name==='clean')Object.assign(t,{pageBg:'',textColor:'',accent:'',cardBg:'#ffffff',cardText:'#172033',cardBorder:'#e2e8f0',gap:18,padding:0,density:'normal',radius:'original',shadow:'original',maxWidth:'fluid',autoContrast:true,forceText:false});
    if(name==='compact')Object.assign(t,{gap:9,padding:0,density:'compact',radius:'10',shadow:'none',maxWidth:'fluid',autoContrast:true});
    if(name==='focus')Object.assign(t,{gap:24,padding:16,density:'spacious',radius:'24',shadow:'soft',maxWidth:'focus',autoContrast:true});
    if(name==='accent'){const global=getComputedStyle(D.documentElement).getPropertyValue('--v71-accent').trim();const a=hex(global,'#1d9e75');Object.assign(t,{accent:a,cardBorder:a,shadow:'soft',autoContrast:true});Object.keys(t.components).forEach(k=>{t.components[k].accent=a;t.components[k].accentStrip=true})}
    save(cfg);applyView(uiState.view);refreshUI();toast('Preset aplicado.')
  }
  function exportPrefs(){const data={type:'realtalent-crm-layout',version:VERSION,exportedAt:new Date().toISOString(),preferences:load()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=D.createElement('a');a.href=URL.createObjectURL(blob);a.download=`realtalent-layout-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  function importPrefs(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const raw=JSON.parse(r.result);const prefs=raw.preferences||raw;if(!prefs.tabs)throw new Error('Formato inválido');save(prefs);applyAll();refreshUI();toast('Personalização importada.')}catch(e){toast('Arquivo de personalização inválido.','danger')}};r.readAsText(file)}
  function openView(view){closeDrawer();try{W.setView?.(view)}catch(_){ }setTimeout(()=>{applyView(view);openDrawer(view)},180)}
  function visualEdit(){
    const view=uiState.view;if(activeView()!==view){try{W.setView?.(view)}catch(_){ }}
    const enable=!D.body.classList.contains('crm-layout-editing');
    if(uiState.drawer)closeDrawer();
    D.body.classList.toggle('crm-layout-editing',enable);
    if(enable)toast('Clique em qualquer card destacado para personalizá-lo.');
  }
  function scanAll(){VIEWS.forEach(v=>discover(v));refreshUI();toast('Mapa de cards atualizado.')}

  function bind(){
    D.addEventListener('click',e=>{
      if(e.target.closest('#crmLayoutStudioButton')){openDrawer(activeView());return}
      if(e.target.id==='crmLayoutStudioBackdrop'){closeDrawer();return}
      if(D.body.classList.contains('crm-layout-editing')){
        const card=e.target.closest('.view.active [data-crm-layout-component]');if(card&&!e.target.closest('button,a,input,select,textarea')){e.preventDefault();e.stopPropagation();const view=card.closest('.view')?.id||activeView();D.body.classList.remove('crm-layout-editing');uiState.pane='components';openDrawer(view,card.dataset.crmLayoutComponent);return}
      }
      const pane=e.target.closest('[data-lp-pane-btn]');if(pane){uiState.pane=pane.dataset.lpPaneBtn;refreshUI();return}
      const comp=e.target.closest('[data-lp-component]');if(comp){uiState.component=comp.dataset.lpComponent;uiState.pane='components';refreshUI();return}
      const move=e.target.closest('[data-lp-move]');if(move){moveComponent(move.dataset.lpMove);return}
      const clear=e.target.closest('[data-lp-clear]');if(clear){setPath(clear.dataset.lpClear,'');refreshUI();return}
      const presetBtn=e.target.closest('[data-lp-preset]');if(presetBtn){preset(presetBtn.dataset.lpPreset);return}
      const action=e.target.closest('[data-lp-action]');if(!action)return;
      const a=action.dataset.lpAction;
      if(a==='close')closeDrawer();
      if(a==='apply'){applyView(uiState.view);toast('Personalização aplicada.')}
      if(a==='reset-tab')resetTab();
      if(a==='reset-component')resetComponent();
      if(a==='reset-all')resetAll();
      if(a==='copy-tab')copyTab();
      if(a==='export')exportPrefs();
      if(a==='import')action.closest('[data-lp-studio]')?.querySelector('[data-lp-file]')?.click();
      if(a==='open-view')openView(uiState.view);
      if(a==='open-active')openDrawer(activeView());
      if(a==='visual-edit')visualEdit();
      if(a==='scan-all')scanAll();
    },true);
    D.addEventListener('change',e=>{
      if(e.target.matches('[data-lp-view-select]')){uiState.view=e.target.value;uiState.component=null;const cfg=load();cfg.lastView=uiState.view;save(cfg);refreshUI();return}
      if(e.target.matches('[data-lp-field]')){handleField(e.target);return}
      if(e.target.matches('[data-lp-file]'))importPrefs(e.target.files?.[0]);
      if(e.target.matches('[data-lp-color]')){const path=e.target.dataset.lpColor;setPath(path,e.target.value);refreshUI()}
    },true);
    D.addEventListener('input',e=>{
      if(e.target.matches('[data-lp-component-search]')){uiState.search=e.target.value;refreshUI();return}
      if(e.target.matches('[data-lp-field][type="range"]'))handleField(e.target);
      if(e.target.matches('[data-lp-color]')){const text=e.target.parentElement?.querySelector('[data-lp-field]');if(text){text.value=e.target.value;setPath(e.target.dataset.lpColor,e.target.value);updateRange(e.target)}}
    },true);
    D.addEventListener('crm:viewchange',e=>{const v=e.detail?.view||activeView();if(VIEWS.includes(v)){const cfg=load();cfg.lastView=v;save(cfg);setTimeout(()=>{applyView(v);if(v==='configuracoes')ensureCenter()},80);setTimeout(()=>applyView(v),320)}});
    D.addEventListener('click',e=>{const nav=e.target.closest('[data-view],[data-go-view],a[href^="#"]');if(!nav)return;let v=nav.dataset.view||nav.dataset.goView||(nav.getAttribute('href')||'').replace('#','');if(VIEWS.includes(v))setTimeout(()=>{applyView(v);if(v==='configuracoes')ensureCenter()},120)},false);
  }
  function observe(){
    if(observer)observer.disconnect();observer=new MutationObserver(muts=>{if(applying)return;let view=null;for(const m of muts){const el=m.target.nodeType===1?m.target:m.target.parentElement;const v=el?.closest?.('.view');if(v&&VIEWS.includes(v.id)&&!el.closest?.('[data-crm-layout-ui]')){view=v.id;break}}if(view)scheduleApply(view);if($('#configuracoes.active'))setTimeout(ensureCenter,100)});observer.observe($('#app')||D.body,{childList:true,subtree:true});
  }
  function updateVersion(){
    D.title='RealTalent CRM — Ligação em Foco Premium';
    const brand=$('.brand-sub');if(brand)brand.textContent='Operação comercial';
  }
  function init(){
    updateVersion();injectButton();ensureDrawer();bind();observe();
    setTimeout(()=>{VIEWS.forEach(discover);applyAll()},180);
    setTimeout(()=>{applyAll();ensureCenter()},650);
    setTimeout(()=>applyAll(),1500);
  }

  W.CRMV983LayoutStudio=Object.freeze({version:VERSION,load,save,apply:applyView,applyAll,discover,open:openDrawer,resetTab,registry:()=>clone(registry)});
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
