(function(){
  'use strict';
  if(window.__crmV971BootShield) return;
  window.__crmV971BootShield = true;

  const dummyClassList = { add(){}, remove(){}, toggle(){ return false; }, contains(){ return false; }, replace(){ return false; } };
  const dummyStyle = new Proxy({}, { get(){ return ''; }, set(){ return true; } });
  const dummyDataset = new Proxy({}, { get(){ return ''; }, set(){ return true; } });
  const dummy = new Proxy({
    __crmDummy:true,
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return false; },
    appendChild(){ return null; }, prepend(){}, append(){}, remove(){},
    insertAdjacentHTML(){}, querySelector(){ return null; }, querySelectorAll(){ return []; },
    setAttribute(){}, getAttribute(){ return null; }, hasAttribute(){ return false; },
    focus(){}, blur(){}, click(){}, matches(){ return false; }, closest(){ return null; },
    classList: dummyClassList, style: dummyStyle, dataset: dummyDataset,
    value:'', checked:false, innerHTML:'', textContent:'', href:'', disabled:false
  }, { get(target, prop){ return prop in target ? target[prop] : (typeof prop === 'symbol' ? undefined : ''); }, set(target, prop, value){ target[prop]=value; return true; } });

  window.__crm971El = function(id){ return document.getElementById(id) || dummy; };
  window.__crm971Qs = function(sel, root){ return (root || document).querySelector(sel) || dummy; };

  window.addEventListener('error', function(ev){
    try { console.warn('[V97.1 boot shield] erro capturado:', ev.message || ev.error); } catch(e) {}
  });
  window.addEventListener('unhandledrejection', function(ev){
    try { console.warn('[V97.1 boot shield] promise capturada:', ev.reason); } catch(e) {}
  });
})();
