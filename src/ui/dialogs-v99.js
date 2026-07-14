/* CRM V99.0 — diálogos alinhados ao Design System. */
(function(W,D){
  'use strict';
  if(W.CRMDialog) return;
  let active=null;
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function close(value){if(!active)return;const {root,resolve,previous}=active;active=null;root.remove();try{previous?.focus?.()}catch(_){ }resolve(value)}
  function open(opts={}){
    if(active)close(false);
    const previous=D.activeElement;
    const root=D.createElement('div');root.className='crm-dialog-backdrop';
    const isPrompt=opts.kind==='prompt';
    root.innerHTML=`<section class="crm-dialog" role="dialog" aria-modal="true" aria-labelledby="crmDialogTitle"><header><div><span>${esc(opts.eyebrow||'Confirmação')}</span><h2 id="crmDialogTitle">${esc(opts.title||'Confirmar ação')}</h2></div><button type="button" data-dialog-close aria-label="Fechar">×</button></header><div class="crm-dialog-body"><p>${esc(opts.message||'')}</p>${isPrompt?`<label>${esc(opts.label||'Valor')}<input data-dialog-input value="${esc(opts.defaultValue||'')}" placeholder="${esc(opts.placeholder||'')}"></label>`:''}</div><footer><button type="button" data-dialog-cancel>${esc(opts.cancelLabel||'Cancelar')}</button><button type="button" class="primary ${opts.danger?'danger':''}" data-dialog-confirm>${esc(opts.confirmLabel||'Confirmar')}</button></footer></section>`;
    D.body.appendChild(root);
    return new Promise(resolve=>{
      active={root,resolve,previous};
      const input=root.querySelector('[data-dialog-input]');
      const confirm=()=>close(isPrompt?(input?.value??''):true);
      root.addEventListener('click',e=>{if(e.target===root||e.target.closest('[data-dialog-close],[data-dialog-cancel]'))close(isPrompt?null:false);else if(e.target.closest('[data-dialog-confirm]'))confirm()});
      root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close(isPrompt?null:false)}if(e.key==='Enter'&&(!isPrompt||e.target===input)){e.preventDefault();confirm()}});
      setTimeout(()=>{(input||root.querySelector('[data-dialog-confirm]'))?.focus()},0);
    });
  }
  W.CRMDialog=Object.freeze({
    confirm(message,opts={}){return open({...opts,message,kind:'confirm'})},
    prompt(message,opts={}){return open({...opts,message,kind:'prompt'})},
    alert(message,opts={}){return open({...opts,message,kind:'alert',cancelLabel:'',confirmLabel:'Entendi'})}
  });
})(window,document);
