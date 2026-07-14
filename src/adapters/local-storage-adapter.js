const DEFAULT_SENSITIVE=[
  /^sb-[a-z0-9-]+-auth-token$/i,
  /^supabase\.auth\./i,
  /^crm_v99_supabase_connection$/i,
  /^crm_supabase_/i
];
export class LocalStorageAdapter {
  constructor({storage=window.localStorage,namespace='crm',sensitivePatterns=DEFAULT_SENSITIVE}={}){
    if(!storage) throw new Error('Storage local indisponível.');
    this.storage=storage;this.namespace=namespace;this.mode='local';this.sensitivePatterns=sensitivePatterns;
  }
  key(key){return String(key)}
  isSensitive(key){return this.sensitivePatterns.some(pattern=>pattern instanceof RegExp?pattern.test(String(key)):String(key)===String(pattern))}
  getSync(key,fallback=null){try{const raw=this.storage.getItem(this.key(key));return raw==null?fallback:JSON.parse(raw)}catch(_){return fallback}}
  setSync(key,value){this.storage.setItem(this.key(key),JSON.stringify(value));return value}
  removeSync(key){this.storage.removeItem(this.key(key));return true}
  keysSync({includeSensitive=false}={}){return Array.from({length:this.storage.length},(_,i)=>this.storage.key(i)).filter(Boolean).filter(key=>includeSensitive||!this.isSensitive(key))}
  exportSync({includeSensitive=false}={}){const data={};this.keysSync({includeSensitive}).forEach(key=>{data[key]=this.storage.getItem(key)});return data}
  importSync(data,{clear=false,allowSensitive=false}={}){
    if(!data||typeof data!=='object'||Array.isArray(data)) throw new TypeError('Backup inválido.');
    if(clear)this.keysSync({includeSensitive:false}).forEach(key=>this.storage.removeItem(key));
    Object.entries(data).forEach(([key,value])=>{if(!allowSensitive&&this.isSensitive(key))return;this.storage.setItem(key,typeof value==='string'?value:JSON.stringify(value))});
    return true;
  }
  async get(key,fallback=null){return this.getSync(key,fallback)}
  async set(key,value){return this.setSync(key,value)}
  async remove(key){return this.removeSync(key)}
  async keys(options){return this.keysSync(options)}
  async export(options){return this.exportSync(options)}
  async import(data,options){return this.importSync(data,options)}
  async health(){return {ok:true,mode:this.mode,storage:'localStorage',protectedKeys:this.keysSync({includeSensitive:true}).length-this.keysSync().length,at:new Date().toISOString()}}
}
