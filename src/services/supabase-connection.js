import {createClient} from '@supabase/supabase-js';
import {SupabaseAdapter} from '../adapters/supabase-adapter.js';

const CONFIG_KEY='crm_supabase_config_v99';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clean=value=>String(value??'').trim();
const safeParse=raw=>{try{return raw?JSON.parse(raw):{}}catch(_){return{}}};
const decodeJwtRole=key=>{try{const parts=String(key||'').split('.');if(parts.length<2)return'';const base=parts[1].replace(/-/g,'+').replace(/_/g,'/');const padded=base+'='.repeat((4-base.length%4)%4);const json=JSON.parse(globalThis.atob?atob(padded):Buffer.from(padded,'base64').toString('utf8'));return String(json.role||'')}catch(_){return''}};
const unsafeBrowserKey=key=>/^sb_secret_/i.test(String(key||''))||/service_role/i.test(decodeJwtRole(key));

export class SupabaseConnectionManager {
  constructor(store,{storage=globalThis.localStorage,clientFactory=createClient,globalConfig=null}={}){
    if(!store)throw new TypeError('CRMStore não informado.');
    this.store=store;
    this.storage=storage;
    this.clientFactory=clientFactory;
    this.client=null;
    this.adapter=null;
    this.user=null;
    const runtime=globalConfig||globalThis.__CRM_SUPABASE_CONFIG__||globalThis.CRM_RUNTIME_CONFIG||{};
    this.config=this.normalize({...safeParse(storage?.getItem?.(CONFIG_KEY)),...runtime});
    this.listeners=new Set();
    this.authSubscription=null;
  }
  normalize(config={}){
    const tenantId=clean(config.tenantId||config.workspaceId);
    return {
      url:clean(config.url||config.supabaseUrl),
      publishableKey:clean(config.publishableKey||config.anonKey||config.key||config.supabaseAnonKey),
      tenantId,
      workspaceId:tenantId,
      table:clean(config.table)||'crm_records',
      remember:config.remember!==false,
      autoConnect:config.autoConnect===true,
      autoSync:config.autoSync===true
    }
  }
  validate(config=this.config,{requireTenant=false}={}){
    const errors=[];
    try{const u=new URL(config.url);if(!/^https:$/.test(u.protocol))errors.push('A URL do projeto deve usar HTTPS.')}catch(_){errors.push('URL do projeto inválida.');}
    if(config.publishableKey.length<20)errors.push('Chave publicável inválida.');
    if(unsafeBrowserKey(config.publishableKey))errors.push('Use somente a chave publicável/anon. A chave secreta ou service_role não pode ser usada no navegador.');
    if(!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(config.table))errors.push('Nome de tabela inválido.');
    if(requireTenant&&!UUID.test(config.tenantId))errors.push('Selecione um workspace válido.');
    return {ok:!errors.length,errors};
  }
  save(config={}){
    const candidate=this.normalize({...this.config,...config});
    const validation=this.validate(candidate);
    if(!validation.ok)throw new Error(validation.errors.join(' '));
    this.config=candidate;
    if(this.config.remember)this.storage?.setItem?.(CONFIG_KEY,JSON.stringify(this.config));else this.storage?.removeItem?.(CONFIG_KEY);
    this.emit('config',this.status());
    return this.config;
  }
  clear(){
    this.storage?.removeItem?.(CONFIG_KEY);
    this.authSubscription?.unsubscribe?.();
    this.authSubscription=null;this.adapter=null;this.client=null;this.user=null;
    this.store.remoteAdapter=null;this.store.useLocal();
    this.config=this.normalize({});this.emit('config',this.status());
  }
  async connect(config={}){
    if(Object.keys(config).length)this.save(config);
    const validation=this.validate(this.config);
    if(!validation.ok)throw new Error(validation.errors.join(' '));
    this.client=this.clientFactory(this.config.url,this.config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data,error}=await this.client.auth.getUser();
    if(error&&!/session/i.test(error.message||''))throw error;
    this.user=data?.user||null;
    this.authSubscription?.unsubscribe?.();
    const auth=this.client.auth.onAuthStateChange?.((_event,session)=>{
      this.user=session?.user||null;
      if(this.user&&this.config.tenantId){try{this.attachTenant(this.config.tenantId)}catch(error){this.emit('error',{message:error.message})}}
      if(!this.user){this.adapter=null;this.store.remoteAdapter=null;this.store.useLocal()}
      this.emit('auth',this.status());
    });
    this.authSubscription=auth?.data?.subscription||auth?.subscription||null;
    if(this.user&&this.config.tenantId)this.attachTenant(this.config.tenantId);
    this.emit('connected',this.status());
    return this.status();
  }
  async restore(){if(!this.config.url||!this.config.publishableKey)return this.status();try{return await this.connect()}catch(error){this.emit('error',{message:error.message});return {...this.status(),error:error.message}}}
  async signUp(email,password,{fullName=''}={}){
    this.assertClient();
    const {data,error}=await this.client.auth.signUp({email:clean(email),password:String(password||''),options:{data:{full_name:clean(fullName)}}});
    if(error)throw error;this.user=data?.session?.user||null;this.emit('auth',this.status());return data;
  }
  async signIn(email,password){
    this.assertClient();
    const {data,error}=await this.client.auth.signInWithPassword({email:clean(email),password:String(password||'')});
    if(error)throw error;this.user=data?.user||null;if(this.config.tenantId)this.attachTenant(this.config.tenantId);this.emit('auth',this.status());return data;
  }
  async signOut(){if(this.client){const {error}=await this.client.auth.signOut();if(error)throw error}this.user=null;this.adapter=null;this.store.remoteAdapter=null;this.store.useLocal();this.emit('auth',this.status());return true}
  async refreshUser(){this.assertClient();const {data,error}=await this.client.auth.getUser();if(error)throw error;this.user=data?.user||null;return this.user}
  async listTenants(){
    this.assertAuthenticated();
    const {data,error}=await this.client.from('crm_tenants').select('id,name,owner_id,created_at').order('name');
    if(error)throw error;return data||[];
  }
  async listWorkspaces(){return this.listTenants()}
  async createTenant(name){
    this.assertAuthenticated();
    const tenantName=clean(name);if(tenantName.length<2)throw new Error('Informe um nome para o workspace.');
    const {data,error}=await this.client.rpc('crm_create_tenant',{p_name:tenantName});
    if(error)throw error;const tenantId=typeof data==='string'?data:data?.id||data?.tenant_id;if(!tenantId)throw new Error('O Supabase não retornou o workspace criado.');
    this.selectTenant(tenantId);return tenantId;
  }
  async createWorkspace(name){return this.createTenant(name)}
  selectTenant(tenantId){
    const value=clean(tenantId);if(!UUID.test(value))throw new Error('Workspace inválido.');
    this.config.tenantId=value;this.config.workspaceId=value;if(this.config.remember)this.storage?.setItem?.(CONFIG_KEY,JSON.stringify(this.config));
    if(this.client&&this.user)this.attachTenant(value);this.emit('tenant',this.status());return value;
  }
  selectWorkspace(workspaceId){return this.selectTenant(workspaceId)}
  attachTenant(tenantId=this.config.tenantId){
    this.assertClient();if(!this.user)throw new Error('Entre na sua conta antes de selecionar o workspace.');if(!UUID.test(clean(tenantId)))throw new Error('Selecione um workspace válido.');
    this.adapter=new SupabaseAdapter(this.client,{table:this.config.table,tenantId,userId:this.user.id});
    this.store.remoteAdapter=this.adapter;this.store.mode='hybrid';return this.adapter;
  }
  attachWorkspace(workspaceId){return this.attachTenant(workspaceId)}
  async syncToRemote(){this.assertReady();return this.store.syncToRemote()}
  async syncFromRemote(options={}){this.assertReady();return this.store.syncFromRemote(options)}
  async health(){
    const status=this.status();
    if(!this.client)return {...status,ok:false,error:'Supabase não conectado.'};
    if(!this.user)return {...status,ok:false,error:'Entre na conta do Supabase.'};
    if(!this.adapter)return {...status,ok:false,error:'Selecione um workspace antes de testar a sincronização.'};
    const remote=await this.adapter.health();
    return {...this.status(),ok:!!remote?.ok,remote,error:remote?.error||null};
  }
  status(){let origin='';try{origin=this.config.url?new URL(this.config.url).origin:''}catch(_){ }return {connected:!!this.client,authenticated:!!this.user,userEmail:this.user?.email||'',userId:this.user?.id||'',tenantId:this.config.tenantId||'',workspaceId:this.config.tenantId||'',mode:this.adapter?'hybrid':'local',table:this.config.table,url:origin,configured:!!(this.config.url&&this.config.publishableKey)}}
  on(handler){if(typeof handler!=='function')return()=>{};this.listeners.add(handler);return()=>this.listeners.delete(handler)}
  emit(type,detail){const payload={type,detail,status:this.status(),at:new Date().toISOString()};for(const listener of [...this.listeners]){try{listener(payload)}catch(_){ }}try{document.dispatchEvent(new CustomEvent('crm:supabase-status',{detail:payload}))}catch(_){ }}
  assertClient(){if(!this.client)throw new Error('Conecte o projeto Supabase primeiro.')}
  assertAuthenticated(){this.assertClient();if(!this.user)throw new Error('Entre na sua conta para continuar.')}
  assertReady(){this.assertAuthenticated();if(!this.adapter)throw new Error('Selecione um workspace antes de sincronizar.')}
  destroy(){this.authSubscription?.unsubscribe?.();this.adapter?.unwatch?.();this.listeners.clear()}
}

export const SUPABASE_CONFIG_KEY=CONFIG_KEY;
