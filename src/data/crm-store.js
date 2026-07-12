(function(W){
  'use strict';
  if(W.CRMStore) return;
  const local=W.CRMLocalStore;
  W.CRMStore={
    mode:'local',
    async get(key,fallback=null){return local.get(key,fallback)},
    async set(key,value){return local.set(key,value)},
    async remove(key){return local.remove(key)},
    async health(){return {ok:true,mode:this.mode,at:new Date().toISOString()}},
    async use(adapter){if(!adapter||typeof adapter.get!=='function'||typeof adapter.set!=='function')throw new TypeError('Adaptador inválido');Object.assign(this,adapter);return this}
  };
})(window);
