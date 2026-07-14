import {SupabaseConnectionManager} from '../src/services/supabase-connection.js';
import {LocalStorageAdapter} from '../src/adapters/local-storage-adapter.js';

class MemoryStorage {
  constructor(){this.map=new Map()}
  get length(){return this.map.size}
  key(index){return [...this.map.keys()][index]??null}
  getItem(key){return this.map.has(String(key))?this.map.get(String(key)):null}
  setItem(key,value){this.map.set(String(key),String(value))}
  removeItem(key){this.map.delete(String(key))}
  clear(){this.map.clear()}
}

const storage=new MemoryStorage();
const localAdapter=new LocalStorageAdapter({storage});
await localAdapter.set('crm_v99_leads',[{id:'1',nome:'Teste Supabase'}]);
storage.setItem('crm_supabase_config_v99','segredo-local');
storage.setItem('sb-test-auth-token','sessao');

const tenantId='11111111-1111-4111-8111-111111111111';
const user={id:'22222222-2222-4222-8222-222222222222',email:'teste@realtalent.local'};
const records=new Map();
const tenants=[{id:tenantId,name:'RealTalent',owner_id:user.id,created_at:new Date().toISOString()}];

function recordBuilder(){
  const state={filters:{},selection:'',deleting:false,head:false};
  const builder={
    select(columns,_options={}){state.selection=columns;state.head=!!_options?.head;return this},
    eq(field,value){state.filters[field]=String(value);return this},
    order(){return this},
    limit(){return this},
    maybeSingle(){
      const row=records.get(`${state.filters.tenant_id}|${state.filters.record_key}`);
      return Promise.resolve({data:row?{value:row.value}:null,error:null});
    },
    upsert(input){
      for(const row of Array.isArray(input)?input:[input])records.set(`${row.tenant_id}|${row.record_key}`,row);
      return Promise.resolve({error:null});
    },
    delete(){state.deleting=true;return this},
    then(resolve,reject){
      const run=()=>{
        if(state.deleting){
          for(const key of [...records.keys()]){
            const row=records.get(key);
            const tenantMatches=!state.filters.tenant_id||String(row?.tenant_id)===state.filters.tenant_id;
            const keyMatches=!state.filters.record_key||String(row?.record_key)===state.filters.record_key;
            if(tenantMatches&&keyMatches)records.delete(key);
          }
          return {data:[],error:null,count:records.size};
        }
        const filtered=[...records.values()].filter(row=>{
          return (!state.filters.tenant_id||String(row.tenant_id)===state.filters.tenant_id)
            &&(!state.filters.record_key||String(row.record_key)===state.filters.record_key);
        });
        if(state.head)return {data:null,error:null,count:filtered.length};
        const data=filtered.map(row=>state.selection==='record_key'?{record_key:row.record_key}:{record_key:row.record_key,value:row.value});
        return {data,error:null,count:data.length};
      };
      return Promise.resolve().then(run).then(resolve,reject);
    }
  };
  return builder;
}

const client={
  auth:{
    getUser:async()=>({data:{user},error:null}),
    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
    signInWithPassword:async()=>({data:{user,session:{user}},error:null}),
    signUp:async()=>({data:{user,session:{user}},error:null}),
    signOut:async()=>({error:null})
  },
  from(table){
    if(table==='crm_tenants')return {select(){return this},order(){return Promise.resolve({data:tenants,error:null})}};
    if(table==='crm_records')return recordBuilder();
    throw new Error(`Tabela inesperada no teste: ${table}`);
  },
  rpc:async(name)=>({data:name==='crm_create_tenant'?tenantId:null,error:null})
};

const store={
  mode:'local',remoteAdapter:null,
  useLocal(){this.mode=this.remoteAdapter?'hybrid':'local';return this},
  async syncToRemote(){
    const data=await localAdapter.export();
    const result=await this.remoteAdapter.import(data);
    return {ok:true,records:result.records};
  },
  async syncFromRemote(){
    const data=await this.remoteAdapter.export();
    await localAdapter.import(data,{clear:true});
    return {ok:true,records:Object.keys(data).length};
  }
};

const manager=new SupabaseConnectionManager(store,{storage,clientFactory:()=>client});
await manager.connect({
  url:'https://example.supabase.co',
  publishableKey:'publishable-key-that-is-long-enough',
  remember:true
});
const listed=await manager.listTenants();
manager.selectTenant(tenantId);
const sent=await manager.syncToRemote();
const remoteLead=await manager.adapter.get('crm_v99_leads');
const exported=await localAdapter.export();

let secretRejected=false;
try{
  const fakeUnsafeKey=['sb','secret','do_not_use_in_browser_123456789'].join('_');
  manager.save({url:'https://example.supabase.co',publishableKey:fakeUnsafeKey});
}catch(_){secretRejected=true}

const firstRemote=[...records.values()][0];
const result={
  version:'V99.0',
  status:manager.status(),
  tenants:listed.length,
  sent,
  remoteLead,
  remoteField:firstRemote?.tenant_id||'',
  updatedBy:firstRemote?.updated_by||'',
  privateExcluded:!('crm_supabase_config_v99' in exported)&&!('sb-test-auth-token' in exported),
  secretRejected,
  ok:false
};
result.ok=result.status.authenticated
  &&result.status.tenantId===tenantId
  &&listed.length===1
  &&sent.records===1
  &&Array.isArray(remoteLead)
  &&result.remoteField===tenantId
  &&result.updatedBy===user.id
  &&result.privateExcluded
  &&secretRejected;

console.log(JSON.stringify(result,null,2));
process.exit(result.ok?0:1);
