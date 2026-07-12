(function(W){
  'use strict';
  if(W.CRMLocalStore) return;
  const safeParse=(raw,fallback)=>{try{return raw==null?fallback:JSON.parse(raw)}catch(_){return fallback}};
  W.CRMLocalStore=Object.freeze({
    get(key,fallback=null){return safeParse(localStorage.getItem(key),fallback)},
    set(key,value){localStorage.setItem(key,JSON.stringify(value));return value},
    remove(key){localStorage.removeItem(key)},
    has(key){return localStorage.getItem(key)!==null},
    keys(){return Object.keys(localStorage)},
    export(){const out={};Object.keys(localStorage).forEach(k=>out[k]=localStorage.getItem(k));return out}
  });
})(window);
