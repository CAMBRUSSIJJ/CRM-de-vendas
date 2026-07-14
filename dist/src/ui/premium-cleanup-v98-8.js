/* CRM V98.8 — limpeza premium, contraste e acessibilidade progressiva. */
(function(W,D){
  'use strict';
  if(W.CRMV988PremiumCleanup) return;
  const $all=(s,r=D)=>Array.from((r||D).querySelectorAll(s));
  const technical=/^(?:CRM\s*)?V\d+(?:\.\d+)*(?:\s*[·—-].*)?$/i;
  function luminance(rgb){const c=rgb.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
  function rgb(value){
    const raw=String(value||'').trim();
    let m=raw.match(/rgba?\((\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)(?:[, /]+([\d.]+))?/i);
    if(m){if(m[4]==='0'||Number(m[4])===0)return null;return [+m[1],+m[2],+m[3]]}
    m=raw.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i);
    if(m){if(m[4]==='0'||Number(m[4])===0)return null;return [Math.round(+m[1]*255),Math.round(+m[2]*255),Math.round(+m[3]*255)]}
    return null;
  }
  function contrast(el){
    const cs=getComputedStyle(el),color=rgb(cs.backgroundColor);if(!color)return;
    const dark=luminance(color)<.38;
    const text=dark?'#f8fafc':'#172033',muted=dark?'rgba(248,250,252,.74)':'#667085';
    el.style.setProperty('--component-text',text);el.style.setProperty('--component-muted',muted);el.style.setProperty('color',text,'important');el.dataset.crmContrast=dark?'dark':'light';
    $all('h1,h2,h3,h4,b,strong,.section-title-text',el).forEach(node=>node.style.setProperty('color',text,'important'));
    $all('p,small,.muted,.v94-muted,.section-sub',el).forEach(node=>node.style.setProperty('color',muted,'important'));
  }
  function accessible(root){
    $all('button',root).forEach(btn=>{if(!btn.getAttribute('type'))btn.type='button';const name=(btn.getAttribute('aria-label')||btn.title||btn.textContent||'').trim();if(!name)btn.setAttribute('aria-label','Ação')});
    $all('input,select,textarea',root).forEach(el=>{if(el.getAttribute('aria-label')||el.getAttribute('aria-labelledby')||el.closest('label'))return;const label=el.placeholder||el.name||el.id;if(label)el.setAttribute('aria-label',String(label).replace(/[-_]/g,' '))});
    $all('.modal-overlay,.modal-backdrop,[class*="drawer"][class*="active"]',root).forEach(el=>{if(el.classList.contains('modal-overlay')||el.classList.contains('modal-backdrop')){el.setAttribute('role','dialog');el.setAttribute('aria-modal','true')}});
    $all('[data-v65-card],[data-v92-select],[data-v987-objection-card],[data-v987-queue-item]',root).forEach(el=>{if(!/^(BUTTON|A)$/.test(el.tagName)){el.setAttribute('role','button');if(!el.hasAttribute('tabindex'))el.tabIndex=0}});
  }
  function removeTechnical(root){
    $all('#v94VersionChip,.v94-version-chip,[data-version-chip],.crm-version-badge,.version-badge',root).forEach(el=>el.remove());
    $all('span,small,b,div',root).forEach(el=>{if(el.children.length||!technical.test((el.textContent||'').trim()))return;if(/VERSAO|version|badge/i.test(el.id+' '+el.className)||el.closest('.topbar,.sidebar,.section-header,.v94-hero,.v65-pipe-hero'))el.remove()});
    $all('[title*="V70"],[title*="V71"],[aria-label*="V70"],[aria-label*="V71"]',root).forEach(el=>{el.title=el.title.replace(/V7\d(?:\.\d+)?\s*/g,'').trim();if(el.hasAttribute('aria-label'))el.setAttribute('aria-label',el.getAttribute('aria-label').replace(/V7\d(?:\.\d+)?\s*/g,'').trim())});
  }
  function normalizeComponents(root){
    $all('.card,.v94-card,.v93-card,.v68-card,.v92-card,.v987-card,.v987-focus-panel,.v65-pipe-col,.v65-pipe-card,.v94-panel,[class*="-panel"]',root).forEach(el=>{el.classList.add('crm-component-card');contrast(el)});
    $all('.v94-hero,.v65-pipe-hero,.v67-hero,.v68-hero,.v987-studio-hero,.v987-focus-header,[class*="-hero"]',root).forEach(el=>{el.classList.add('crm-component-hero');contrast(el)});
    $all('.crm-empty,.v65-empty-col,.v93-empty,.v94-empty,.v92-empty,.v987-studio-empty,[class*="-empty"]',root).forEach(el=>el.classList.add('crm-component-empty'));
    $all('button,.btn,[class*="-btn"]',root).forEach(el=>el.classList.add('crm-component-action'));
  }
  function apply(root=D){removeTechnical(root);accessible(root);normalizeComponents(root)}
  let raf=0;
  const observer=new MutationObserver(mutations=>{if(!mutations.some(m=>m.addedNodes.length))return;cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>apply(D.querySelector('.view.active')||D))});
  function boot(){apply();observer.observe(D.body,{subtree:true,childList:true});D.documentElement.dataset.crmDesignSystem='v98.8'}
  W.CRMV988PremiumCleanup=Object.freeze({version:'V98.8',apply,stop:()=>observer.disconnect()});
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window,document);
