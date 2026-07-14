(function(){
  'use strict';
  var VERSION='V97.4 Personalização Real';
  var KEY='crm_v974_personalizacao_real';
  var MAIN_VIEWS=['inicio','leads','garimpo','pipeline','ligacoes','cadencias','agenda','chat','playbooks','metas','automacoes','metricas','configuracoes'];
  var DEFAULT_LABELS={inicio:'Painel',leads:'Leads',garimpo:'Garimpo',pipeline:'Pipeline',ligacoes:'Ligações',cadencias:'Follow-ups',agenda:'Agenda',chat:'Atendimento',playbooks:'Playbooks',metas:'Metas',automacoes:'Automações',metricas:'Métricas',configuracoes:'Configurações'};
  var DEFAULT_VISIBLE=MAIN_VIEWS.reduce(function(acc,v){acc[v]=true;return acc;},{});
  function clone(o){return JSON.parse(JSON.stringify(o));}
  function defaults(){return {version:VERSION,theme:'premium',density:'padrao',sidebar:'hover',visible:clone(DEFAULT_VISIBLE),labels:clone(DEFAULT_LABELS),order:MAIN_VIEWS.slice()};}
  function safeParse(raw){try{return JSON.parse(raw||'{}')||{};}catch(e){return {};}}
  function merge(base,extra){
    var out=defaults();
    extra=extra||{};
    out.theme=extra.theme||base.theme||out.theme;
    out.density=extra.density||base.density||out.density;
    out.sidebar=extra.sidebar||base.sidebar||out.sidebar;
    out.visible=Object.assign({},out.visible,base.visible||{},extra.visible||{});
    out.labels=Object.assign({},out.labels,base.labels||{},extra.labels||{});
    var rawOrder=Array.isArray(extra.order)?extra.order:(Array.isArray(base.order)?base.order:out.order);
    out.order=rawOrder.filter(function(v){return MAIN_VIEWS.indexOf(v)>-1;});
    MAIN_VIEWS.forEach(function(v){if(out.order.indexOf(v)<0)out.order.push(v);});
    out.visible.configuracoes=true;
    return out;
  }
  function load(){return merge(defaults(), safeParse(localStorage.getItem(KEY)));}
  function save(cfg){localStorage.setItem(KEY, JSON.stringify(merge(defaults(),cfg)));}
  function qsAll(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function setLabel(el,label){
    if(!el) return;
    el.setAttribute('aria-label',label); el.setAttribute('title',label);
    var span=Array.prototype.find.call(el.querySelectorAll('span'),function(s){return !s.classList.contains('nav-badge') && !s.classList.contains('crm-ux-sr-only');});
    if(span) span.textContent=label;
    var sr=el.querySelector('.crm-ux-sr-only'); if(sr) sr.textContent=label;
  }
  function applyPrefs(){
    var cfg=load();
    var html=document.documentElement;
    html.setAttribute('data-crm-theme',cfg.theme);
    html.setAttribute('data-crm-density',cfg.density);
    html.setAttribute('data-theme',cfg.theme==='escuro'?'dark':'light');
    document.body.classList.toggle('rt-sidebar-expanded',cfg.sidebar==='expandida');
    document.body.classList.toggle('rt-sidebar-compact',cfg.sidebar==='compacta');
    document.body.classList.toggle('rt-sidebar-hover',cfg.sidebar==='hover');
    MAIN_VIEWS.forEach(function(view){
      var label=cfg.labels[view]||DEFAULT_LABELS[view]||view;
      qsAll('.nav-item[data-view="'+view+'"],.rail-btn[data-view="'+view+'"],.rail-logo[data-view="'+view+'"]').forEach(function(el){
        setLabel(el,label);
        if(view!=='configuracoes') el.hidden = cfg.visible[view]===false;
      });
    });
    cfg.order.forEach(function(view,idx){
      qsAll('.nav-item[data-view="'+view+'"],.rail-btn[data-view="'+view+'"]').forEach(function(el){el.style.order=String((idx+1)*10);});
    });
    return cfg;
  }
  function move(arr,view,dir){
    var i=arr.indexOf(view); if(i<0) return arr;
    var j=i+dir; if(j<0||j>=arr.length) return arr;
    var tmp=arr[i]; arr[i]=arr[j]; arr[j]=tmp; return arr;
  }
  function collectFromPanel(panel){
    var cfg=load();
    var theme=panel.querySelector('[data-v974-field="theme"]');
    var density=panel.querySelector('[data-v974-field="density"]');
    var sidebar=panel.querySelector('[data-v974-field="sidebar"]');
    if(theme) cfg.theme=theme.value;
    if(density) cfg.density=density.value;
    if(sidebar) cfg.sidebar=sidebar.value;
    MAIN_VIEWS.forEach(function(view){
      var cb=panel.querySelector('[data-v974-visible="'+view+'"]');
      var label=panel.querySelector('[data-v974-label="'+view+'"]');
      if(cb) cfg.visible[view]=cb.checked;
      if(label) cfg.labels[view]=label.value.trim()||DEFAULT_LABELS[view]||view;
    });
    cfg.visible.configuracoes=true;
    return cfg;
  }
  function renderRows(cfg){
    return cfg.order.map(function(view){
      var locked=view==='configuracoes';
      return '<div class="v974-tab-row" data-v974-row="'+esc(view)+'">'+
        '<input type="checkbox" '+(cfg.visible[view]!==false?'checked':'')+' '+(locked?'disabled':'')+' data-v974-visible="'+esc(view)+'" aria-label="Mostrar '+esc(view)+'">'+
        '<div><strong>'+esc(DEFAULT_LABELS[view]||view)+'</strong><div class="v974-note">ID: '+esc(view)+(locked?' · sempre visível':'')+'</div></div>'+
        '<input type="text" value="'+esc(cfg.labels[view]||DEFAULT_LABELS[view]||view)+'" data-v974-label="'+esc(view)+'" aria-label="Nome da aba '+esc(view)+'">'+
        '<div class="v974-mini-actions"><button type="button" class="v974-mini" data-v974-move="up" data-view="'+esc(view)+'">↑</button><button type="button" class="v974-mini" data-v974-move="down" data-view="'+esc(view)+'">↓</button></div>'+
      '</div>';
    }).join('');
  }
  function panelHtml(){
    var cfg=load();
    return '<section class="v974-personalizacao" data-v974-panel>'+ 
      '<div class="v974-head"><div><span class="v974-eyebrow">Personalização real</span><h3>Aparência, densidade e abas</h3><p>Preferências salvas no navegador, sem criar página nova, sem bloquear botões e sem mexer no motor das outras abas.</p></div><div class="v974-actions"><button type="button" class="v972-btn soft" data-v974-action="reset">Restaurar</button><button type="button" class="v972-btn primary" data-v974-action="save">Salvar preferências</button></div></div>'+
      '<div class="v974-body">'+
        '<div class="v974-grid">'+
          '<div class="v974-field"><label>Tema</label><select data-v974-field="theme"><option value="premium" '+(cfg.theme==='premium'?'selected':'')+'>Premium</option><option value="claro" '+(cfg.theme==='claro'?'selected':'')+'>Claro</option><option value="escuro" '+(cfg.theme==='escuro'?'selected':'')+'>Escuro</option></select></div>'+
          '<div class="v974-field"><label>Densidade</label><select data-v974-field="density"><option value="compacta" '+(cfg.density==='compacta'?'selected':'')+'>Compacta</option><option value="padrao" '+(cfg.density==='padrao'?'selected':'')+'>Padrão</option><option value="confortavel" '+(cfg.density==='confortavel'?'selected':'')+'>Confortável</option></select></div>'+
          '<div class="v974-field"><label>Sidebar</label><select data-v974-field="sidebar"><option value="hover" '+(cfg.sidebar==='hover'?'selected':'')+'>Recolhe e abre no hover</option><option value="expandida" '+(cfg.sidebar==='expandida'?'selected':'')+'>Sempre expandida</option><option value="compacta" '+(cfg.sidebar==='compacta'?'selected':'')+'>Compacta</option></select></div>'+
        '</div>'+
        '<div><div class="v974-note" style="margin-bottom:8px">Abas visíveis, nomes e ordem. A aba Configurações fica sempre visível para evitar travar o acesso.</div><div class="v974-tabs-list">'+renderRows(cfg)+'</div></div>'+
        '<div class="v974-note">As mudanças são aplicadas em toda a navegação principal e no rail lateral. Arquivos e dados do CRM não são apagados.</div>'+
      '</div>'+
    '</section>';
  }
  function ensurePanel(){
    var root=document.getElementById('configuracoes');
    if(!root) return;
    var old=root.querySelector('[data-v974-panel]');
    if(old) old.remove();
    root.insertAdjacentHTML('beforeend',panelHtml());
  }
  function flash(msg){
    try{ if(typeof window.toast==='function') window.toast(msg); else console.info('[V97.4]',msg); }catch(e){}
  }
  function bind(){
    if(window.__crmV974PersonalizacaoBound) return;
    window.__crmV974PersonalizacaoBound=true;
    document.addEventListener('click',function(e){
      var actionBtn=e.target.closest('[data-v974-action]');
      if(actionBtn){
        e.preventDefault();
        var panel=actionBtn.closest('[data-v974-panel]');
        var action=actionBtn.getAttribute('data-v974-action');
        if(action==='save' && panel){var cfg=collectFromPanel(panel);save(cfg);applyPrefs();ensurePanel();flash('Preferências salvas.');}
        if(action==='reset'){localStorage.removeItem(KEY);applyPrefs();ensurePanel();flash('Preferências restauradas.');}
        return;
      }
      var moveBtn=e.target.closest('[data-v974-move]');
      if(moveBtn){
        e.preventDefault();
        var p=moveBtn.closest('[data-v974-panel]'); if(!p) return;
        var cfg=collectFromPanel(p);
        cfg.order=move(cfg.order,moveBtn.getAttribute('data-view'),moveBtn.getAttribute('data-v974-move')==='up'?-1:1);
        save(cfg); applyPrefs(); ensurePanel();
        return;
      }
      if(e.target.closest('[data-view="configuracoes"]')) setTimeout(function(){applyPrefs();ensurePanel();},80);
    },false);
    document.addEventListener('change',function(e){
      if(e.target.closest('[data-v974-panel]')){
        var panel=e.target.closest('[data-v974-panel]');
        var cfg=collectFromPanel(panel); save(cfg); applyPrefs();
      }
    },false);
  }
  function init(){bind();applyPrefs();setTimeout(ensurePanel,120);setTimeout(applyPrefs,260);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  window.CRMV974Personalizacao=Object.freeze({version:VERSION,load:load,save:save,apply:applyPrefs,render:ensurePanel});
})();
