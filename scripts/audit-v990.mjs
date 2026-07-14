import {readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve('.');
function walk(dir,ext){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(dir,e.name),ext):(!ext||e.name.endsWith(ext)?[resolve(dir,e.name)]:[]))}
const js=walk(resolve(root,'src')).filter(f=>/\.(?:js|mjs)$/.test(f));
const css=walk(resolve(root,'src'),'.css');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const refs=[...html.matchAll(/(?:href|src)="(\.\/src\/[^"]+)"/g)].map(m=>m[1]);
const syntax=[];for(const file of js){try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}catch(error){syntax.push({file:relative(root,file),error:String(error.stderr||error.message)})}}
const allJs=js.map(f=>({file:relative(root,f),text:readFileSync(f,'utf8')}));
const legacyLead=/outbounder_leads_v5|crm_v62_leads|crm_v94_leads|realtalent_leads|crm_leads/g;
const allowedLegacy=new Set(['src/data/canonical-store-v99.js','src/modules/importacao-exportacao.js']);
const legacyRefs=allJs.flatMap(({file,text})=>allowedLegacy.has(file)?[]:[...text.matchAll(legacyLead)].map(m=>({file,token:m[0]})));
const onclick=allJs.flatMap(({file,text})=>[...text.matchAll(/\bonclick\s*=/g)].map(()=>file));
const setViewAssignments=allJs.flatMap(({file,text})=>[...text.matchAll(/(?:window|W)\.setView\s*=(?!=)|defineProperty\([^,]+,['"]setView/g)].map(()=>file));
const important=css.reduce((n,f)=>n+(readFileSync(f,'utf8').match(/!important/g)||[]).length,0);
const timeouts=allJs.reduce((n,x)=>n+(x.text.match(/setTimeout/g)||[]).length,0);
const observers=allJs.reduce((n,x)=>n+(x.text.match(/new MutationObserver/g)||[]).length,0);
const moduleEntry=refs.includes('./src/v99/main.js');
const exists=path=>{try{return statSync(resolve(root,path)).isFile()}catch{return false}};
const schemaPath=resolve(root,'supabase/schema.sql');
const schema=exists('supabase/schema.sql')?readFileSync(schemaPath,'utf8'):'';
const schemaChecks={
  tenantTable:/create table if not exists public\.crm_tenants/i.test(schema),
  memberships:/create table if not exists public\.crm_memberships/i.test(schema),
  recordsTenant:/primary key \(tenant_id,record_key\)/i.test(schema),
  rls:/alter table public\.crm_records enable row level security/i.test(schema),
  ownerGuard:/crm_guard_membership_change/i.test(schema)&&/A workspace must keep at least one owner/i.test(schema),
  secretRevoked:/revoke all on public\.crm_profiles,public\.crm_tenants,public\.crm_memberships,public\.crm_records from anon/i.test(schema)
};
const report={version:'V99.0',sourceFiles:js.length+css.length,js:js.length,css:css.length,references:refs.length,missing:refs.filter(r=>{try{return !statSync(resolve(root,r)).isFile()}catch{return true}}),duplicateReferences:refs.filter((x,i)=>refs.indexOf(x)!==i),syntax,architecture:{moduleEntry,canonicalStore:refs.includes('./src/data/canonical-store-v99.js'),navigationOwner:refs.includes('./src/core/navigation-owner-v99.js'),eventHub:refs.includes('./src/core/event-hub-v99.js'),backupService:exists('src/services/backup-service.js'),supabaseAdapter:exists('src/adapters/supabase-adapter.js'),supabaseConnection:exists('src/services/supabase-connection.js'),runtimeConfig:exists('src/config/runtime-config.js'),supabaseSchema:exists('supabase/schema.sql'),schemaChecks},debt:{legacyLeadRefs:legacyRefs,onclick,setViewAssignments,timeouts,observers,important},ok:false};
report.ok=!report.missing.length&&!report.duplicateReferences.length&&!syntax.length&&moduleEntry&&!legacyRefs.length&&!onclick.length&&setViewAssignments.length===1&&report.architecture.supabaseConnection&&report.architecture.runtimeConfig&&report.architecture.supabaseSchema&&Object.values(schemaChecks).every(Boolean);
writeFileSync(resolve(root,'AUDITORIA-ESTATICA-CRM-V99-0.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));process.exit(report.ok?0:1);
