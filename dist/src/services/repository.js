const clone=value=>{try{return structuredClone(value)}catch(_){return JSON.parse(JSON.stringify(value))}};

export class CRMRepository {
  constructor(adapter,{eventTarget=document}={}){
    this.adapter=adapter;
    this.eventTarget=eventTarget;
    this.queue=Promise.resolve();
    this.revision=0;
  }
  use(adapter){if(!adapter?.get||!adapter?.set)throw new TypeError('Adaptador de dados inválido.');this.adapter=adapter;return this}
  async get(key,fallback=null){return clone(await this.adapter.get(key,fallback))}
  async set(key,value,{source='repository',emit=true}={}){
    const saved=await this.adapter.set(key,clone(value));this.revision++;
    if(emit)this.emit('crm:repository-change',{key,source,revision:this.revision});
    return clone(saved)
  }
  async remove(key,{source='repository'}={}){const removed=await this.adapter.remove(key);this.revision++;this.emit('crm:repository-change',{key,source,removed:true,revision:this.revision});return removed}
  transaction(label,work){
    const execute=async()=>{
      const snapshot=await this.adapter.export();
      try{const result=await work(this);this.emit('crm:transaction-committed',{label,revision:this.revision});return result}
      catch(error){await this.adapter.import(snapshot,{clear:true});this.emit('crm:transaction-rolled-back',{label,error:error?.message||String(error)});throw error}
    };
    this.queue=this.queue.then(execute,execute);return this.queue;
  }
  emit(type,detail){try{this.eventTarget.dispatchEvent(new CustomEvent(type,{detail}))}catch(_){ }}
  async health(){return this.adapter.health()}
}
