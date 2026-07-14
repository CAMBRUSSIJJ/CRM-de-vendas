const asObject=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const chunks=(entries,size)=>{const out=[];for(let i=0;i<entries.length;i+=size)out.push(entries.slice(i,i+size));return out};

export class SupabaseAdapter {
  constructor(client,{table='crm_records',tenantId,workspaceId,userId=null,chunkSize=200}={}){
    if(!client?.from) throw new TypeError('Cliente Supabase inválido.');
    const id=String(tenantId||workspaceId||'').trim();
    if(!id) throw new TypeError('Workspace Supabase não informado.');
    if(!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) throw new TypeError('Nome de tabela inválido.');
    this.client=client;
    this.table=table;
    this.tenantId=id;
    this.workspaceId=id;
    this.userId=userId||null;
    this.chunkSize=Math.max(25,Math.min(500,Number(chunkSize)||200));
    this.mode='supabase';
    this.channel=null;
  }
  query(){return this.client.from(this.table)}
  record(key,value){return {tenant_id:this.tenantId,record_key:String(key),value,updated_by:this.userId,updated_at:new Date().toISOString()}}
  scoped(query){return query.eq('tenant_id',this.tenantId)}
  async get(key,fallback=null){
    const {data,error}=await this.scoped(this.query().select('value')).eq('record_key',String(key)).maybeSingle();
    if(error) throw error;
    return data?.value??fallback;
  }
  async set(key,value){
    const {error}=await this.query().upsert(this.record(key,value),{onConflict:'tenant_id,record_key'});
    if(error) throw error;
    return value;
  }
  async remove(key){
    const {error}=await this.scoped(this.query().delete()).eq('record_key',String(key));
    if(error) throw error;
    return true;
  }
  async keys(){
    let query=this.scoped(this.query().select('record_key'));
    if(typeof query.order==='function')query=query.order('record_key');
    const {data,error}=await query;
    if(error) throw error;
    return (data||[]).map(row=>row.record_key);
  }
  async export(){
    const {data,error}=await this.scoped(this.query().select('record_key,value'));
    if(error) throw error;
    return Object.fromEntries((data||[]).map(row=>[row.record_key,JSON.stringify(row.value)]));
  }
  async import(records,{clear=false}={}){
    const source=asObject(records);
    if(clear){
      const {error}=await this.scoped(this.query().delete());
      if(error)throw error;
    }
    const entries=Object.entries(source).map(([key,raw])=>{
      let value=raw;
      try{if(typeof raw==='string')value=JSON.parse(raw)}catch(_){ }
      return this.record(key,value);
    });
    for(const batch of chunks(entries,this.chunkSize)){
      if(!batch.length)continue;
      const {error}=await this.query().upsert(batch,{onConflict:'tenant_id,record_key'});
      if(error)throw error;
    }
    return {ok:true,records:entries.length};
  }
  async health(){
    try{
      let query=this.scoped(this.query().select('record_key',{head:true,count:'exact'}));
      if(typeof query.limit==='function')query=query.limit(1);
      const {error,count}=await query;
      return {ok:!error,mode:this.mode,table:this.table,tenantId:this.tenantId,workspaceId:this.tenantId,count:count??null,error:error?.message||null,at:new Date().toISOString()};
    }catch(error){return {ok:false,mode:this.mode,table:this.table,tenantId:this.tenantId,workspaceId:this.tenantId,error:error?.message||String(error),at:new Date().toISOString()}}
  }
  watch(handler){
    if(typeof handler!=='function'||!this.client?.channel)return()=>{};
    this.unwatch();
    const filter=`tenant_id=eq.${this.tenantId}`;
    this.channel=this.client.channel(`crm-records-${this.tenantId}`)
      .on('postgres_changes',{event:'*',schema:'public',table:this.table,filter},payload=>handler(payload))
      .subscribe();
    return()=>this.unwatch();
  }
  async unwatch(){
    if(!this.channel)return;
    try{await this.client.removeChannel?.(this.channel)}catch(_){try{await this.channel.unsubscribe?.()}catch(__){ }}
    this.channel=null;
  }
}
