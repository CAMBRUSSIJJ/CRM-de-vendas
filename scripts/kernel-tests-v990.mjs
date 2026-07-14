import {LocalStorageAdapter} from '../src/adapters/local-storage-adapter.js';
import {SupabaseAdapter} from '../src/adapters/supabase-adapter.js';
import {CRMRepository} from '../src/services/repository.js';
import {BackupService} from '../src/services/backup-service.js';
class MemoryStorage{constructor(){this.map=new Map()}get length(){return this.map.size}key(i){return [...this.map.keys()][i]??null}getItem(k){return this.map.has(k)?this.map.get(k):null}setItem(k,v){this.map.set(String(k),String(v))}removeItem(k){this.map.delete(String(k))}clear(){this.map.clear()}}
const storage=new MemoryStorage(),local=new LocalStorageAdapter({storage}),events=new EventTarget(),repo=new CRMRepository(local,{eventTarget:events}),backup=new BackupService(repo,{appVersion:'99.0.0-test'});
await repo.set('alpha',{value:1});
let rolledBack=false;try{await repo.transaction('rollback',async r=>{await r.set('alpha',{value:2});throw new Error('rollback')})}catch{rolledBack=true}
const afterRollback=await repo.get('alpha');
const payload=await backup.create(),valid=await backup.validate(payload),tampered=structuredClone(payload);tampered.records.alpha='{"value":999}';const invalid=await backup.validate(tampered);
await repo.set('beta',[1,2,3]);await backup.restore(payload,{clear:true});const betaAfterRestore=await repo.get('beta',null);
const rows=new Map();
const builder={
 select(){return this},eq(field,value){this.filters??={};this.filters[field]=value;return this},maybeSingle(){const row=rows.get(`${this.filters.tenant_id}|${this.filters.record_key}`);return Promise.resolve({data:row?{value:row.value}:null,error:null})},
 upsert(record){rows.set(`${record.tenant_id}|${record.record_key}`,record);return Promise.resolve({error:null})},
 delete(){this.deleting=true;return this},limit(){return Promise.resolve({data:[],error:null})},
 then(resolve){const data=[...rows.values()].filter(r=>!this.filters?.tenant_id||r.tenant_id===this.filters.tenant_id).map(r=>({record_key:r.record_key,value:r.value}));return Promise.resolve({data,error:null}).then(resolve)}
};
const client={from(){return Object.create(builder)}};const supa=new SupabaseAdapter(client,{tenantId:'t1'});await supa.set('lead',{id:1});const supaValue=await supa.get('lead');
const result={version:'V99.0',local:{rolledBack,afterRollback,betaAfterRestore},backup:{valid,invalid},supabase:{value:supaValue,health:await supa.health()},ok:false};
result.ok=rolledBack&&afterRollback.value===1&&betaAfterRestore===null&&valid.ok&&!invalid.ok&&supaValue.id===1;
console.log(JSON.stringify(result,null,2));process.exit(result.ok?0:1);
