import {LocalStorageAdapter} from '../adapters/local-storage-adapter.js';
import {SupabaseAdapter} from '../adapters/supabase-adapter.js';
import {CRMRepository} from '../services/repository.js';
import {BackupService} from '../services/backup-service.js';
import {LifecycleRegistry} from '../services/lifecycle.js';
import {SupabaseConnectionManager} from '../services/supabase-connection.js';

const VERSION='99.0.0';
const localAdapter=new LocalStorageAdapter();
const repository=new CRMRepository(localAdapter);
const backup=new BackupService(repository,{appVersion:VERSION});
const lifecycle=new LifecycleRegistry();

const VIEWS=['inicio','leads','novo-lead','garimpo','pipeline','cadencias','automacoes','agenda','ligacoes','chat','metas','playbooks','metricas','configuracoes'];
VIEWS.forEach(view=>lifecycle.register(view,{mount:()=>document.getElementById(view)?.setAttribute('data-lifecycle-mounted','1'),render:()=>document.getElementById(view)?.setAttribute('data-lifecycle-active','1'),unmount:()=>document.getElementById(view)?.removeAttribute('data-lifecycle-active')}));

function legacyLeadApi(){return window.CRMCanonicalStore||window.CRMCommercialModel||null}
function leadsSync(){return legacyLeadApi()?.getLeads?.()||[]}
function saveLeadsSync(list,source='v99-kernel'){return legacyLeadApi()?.saveLeads?.(list,source)||list}
function updateLeadSync(id,changes,source='v99-kernel'){return window.CRMCanonicalStore?.updateLead?.(id,changes,source)||null}
function upsertLeadSync(lead,source='v99-kernel'){return window.CRMCanonicalStore?.upsertLead?.(lead,source)||null}
function deleteLeadSync(id,source='v99-kernel'){return window.CRMCanonicalStore?.deleteLead?.(id,source)||false}

const store={
  version:'V99.0',mode:'local',repository,localAdapter,remoteAdapter:null,
  get:(key,fallback=null)=>repository.get(key,fallback),
  set:(key,value,options)=>repository.set(key,value,options),
  remove:(key,options)=>repository.remove(key,options),
  transaction:(label,work)=>repository.transaction(label,work),
  health:async()=>({...(await repository.health()),mode:store.mode,remote:store.remoteAdapter?await store.remoteAdapter.health():null}),
  useAdapter(adapter){repository.use(adapter);this.mode=adapter.mode||'custom';return this},
  useLocal(){repository.use(localAdapter);this.mode=this.remoteAdapter?'hybrid':'local';return this},
  useSupabase(client,options={}){this.remoteAdapter=new SupabaseAdapter(client,options);this.mode='hybrid';return this.remoteAdapter},
  async syncToRemote(){if(!this.remoteAdapter)throw new Error('Supabase ainda não configurado.');const records=await localAdapter.export();const result=await this.remoteAdapter.import(records,{clear:false});return {ok:true,direction:'local-to-supabase',records:result?.records??Object.keys(records).length}},
  async syncFromRemote({clear=true}={}){if(!this.remoteAdapter)throw new Error('Supabase ainda não configurado.');const records=await this.remoteAdapter.export();await localAdapter.import(records,{clear});return {ok:true,direction:'supabase-to-local',records:Object.keys(records).length}},
  leads:{allSync:leadsSync,saveSync:saveLeadsSync,updateSync:updateLeadSync,upsertSync:upsertLeadSync,removeSync:deleteLeadSync,all:async()=>leadsSync(),save:async(list,source)=>saveLeadsSync(list,source),update:async(id,changes,source)=>updateLeadSync(id,changes,source),upsert:async(lead,source)=>upsertLeadSync(lead,source),remove:async(id,source)=>deleteLeadSync(id,source)}
};

const runtimeSupabase={...(window.__CRM_SUPABASE_CONFIG__||window.CRM_RUNTIME_CONFIG||{})};
const supabase=new SupabaseConnectionManager(store,{globalConfig:runtimeSupabase});

function toast(message,type='success'){window.crmToast?.(message,type)||window.showToast?.(message,type)}
function formatStatus(status){
  if(!status.configured)return 'Não configurado';
  if(!status.connected)return 'Projeto salvo';
  if(!status.authenticated)return 'Conectado · sem login';
  if(!status.tenantId)return `Conta: ${status.userEmail||'autenticada'}`;
  return `Nuvem ativa · ${status.userEmail||'conta autenticada'}`;
}
function setBusy(button,busy,label='Processando...'){
  if(!button)return;button.disabled=!!busy;
  if(busy){button.dataset.originalText=button.textContent;button.textContent=label}else if(button.dataset.originalText){button.textContent=button.dataset.originalText;delete button.dataset.originalText}
}

function appendBackupPanel(){
  const page=document.getElementById('configuracoes');if(!page||page.querySelector('[data-v99-backup-panel]'))return;
  const panel=document.createElement('section');panel.className='card v99-backup-panel';panel.dataset.v99BackupPanel='1';panel.innerHTML=`<div class="v99-panel-head"><div><span class="v99-eyebrow">Segurança dos dados</span><h3>Backup e integridade</h3><p>Exporte uma cópia completa, valide o armazenamento e restaure o CRM com verificação de integridade. Credenciais e sessões do Supabase não entram no backup.</p></div><span class="v99-status" data-v99-storage-status>Local</span></div><div class="v99-backup-actions"><button class="btn btn-primary" type="button" data-v99-backup>Baixar backup completo</button><button class="btn" type="button" data-v99-restore>Restaurar backup</button><button class="btn" type="button" data-v99-health>Verificar integridade</button><input type="file" accept="application/json,.json" hidden data-v99-file></div><div class="v99-health-result" data-v99-health-result aria-live="polite"></div>`;
  page.appendChild(panel);
  const file=panel.querySelector('[data-v99-file]'),result=panel.querySelector('[data-v99-health-result]');
  panel.querySelector('[data-v99-backup]').addEventListener('click',async()=>{try{const payload=await backup.create();backup.download(payload);result.textContent=`Backup criado com ${Object.keys(payload.records).length} registros.`;toast('Backup completo baixado.')}catch(error){result.textContent=error.message;toast('Falha ao criar backup.','error')}});
  panel.querySelector('[data-v99-restore]').addEventListener('click',()=>file.click());
  file.addEventListener('change',async()=>{const selected=file.files?.[0];if(!selected)return;try{const payload=JSON.parse(await selected.text());const validation=await backup.validate(payload);if(!validation.ok)throw new Error(validation.errors.join(' '));const confirmed=await window.CRMDialog?.confirm?.(`O backup contém ${validation.records} registros. Os dados locais atuais serão substituídos.`,{title:'Restaurar backup',confirmText:'Restaurar'});if(confirmed===false)return;await backup.restore(payload,{clear:true});result.textContent='Backup restaurado. Recarregando o CRM...';toast('Backup restaurado.');setTimeout(()=>location.reload(),350)}catch(error){result.textContent=error.message;toast('Backup inválido ou corrompido.','error')}finally{file.value=''}});
  panel.querySelector('[data-v99-health]').addEventListener('click',async()=>{const health=await store.health();const leads=leadsSync();result.textContent=health.ok?`Armazenamento íntegro · ${leads.length} lead(s) · modo ${store.mode}.`:`Falha de integridade: ${health.error||'erro desconhecido'}`;panel.querySelector('[data-v99-storage-status]').textContent=store.mode==='hybrid'?'Local + Supabase':'Local'});
}

function appendSupabasePanel(){
  const page=document.getElementById('configuracoes');if(!page||page.querySelector('[data-v99-supabase-panel]'))return;
  const cfg=supabase.config;
  const panel=document.createElement('section');panel.className='card v99-supabase-panel';panel.dataset.v99SupabasePanel='1';panel.innerHTML=`
    <div class="v99-panel-head"><div><span class="v99-eyebrow">Banco online e contas</span><h3>Supabase</h3><p>Conecte um projeto, entre na sua conta e sincronize o CRM com um workspace protegido por RLS. Use somente a chave publicável do projeto.</p></div><span class="v99-status" data-v99-supa-badge>Não configurado</span></div>
    <div class="v99-supa-grid">
      <div class="v99-supa-section">
        <div class="v99-section-title">1. Projeto</div>
        <label class="v99-field"><span>URL do projeto</span><input type="url" autocomplete="url" data-v99-supa-url placeholder="https://seu-projeto.supabase.co" value="${escapeHtml(cfg.url)}"></label>
        <label class="v99-field"><span>Chave publicável / anon</span><input type="password" autocomplete="off" data-v99-supa-key placeholder="eyJ..." value="${escapeHtml(cfg.publishableKey)}"></label>
        <label class="v99-check"><input type="checkbox" data-v99-supa-remember ${cfg.remember!==false?'checked':''}><span>Lembrar esta configuração neste navegador</span></label><label class="v99-check"><input type="checkbox" data-v99-supa-autosync ${cfg.autoSync?'checked':''}><span>Enviar alterações comerciais automaticamente quando a nuvem estiver conectada</span></label>
        <div class="v99-row-actions"><button class="btn btn-primary" type="button" data-v99-supa-connect>Salvar e conectar</button><button class="btn" type="button" data-v99-supa-clear>Remover configuração</button></div>
      </div>
      <div class="v99-supa-section">
        <div class="v99-section-title">2. Conta</div>
        <label class="v99-field"><span>E-mail</span><input type="email" autocomplete="username" data-v99-supa-email placeholder="voce@empresa.com"></label>
        <label class="v99-field"><span>Senha</span><input type="password" autocomplete="current-password" data-v99-supa-password placeholder="Mínimo definido no Supabase"></label>
        <div class="v99-row-actions"><button class="btn btn-primary" type="button" data-v99-supa-signin>Entrar</button><button class="btn" type="button" data-v99-supa-signup>Criar conta</button><button class="btn" type="button" data-v99-supa-signout>Sair</button></div>
      </div>
      <div class="v99-supa-section">
        <div class="v99-section-title">3. Workspace</div>
        <label class="v99-field"><span>Workspace ativo</span><select data-v99-supa-tenant><option value="">Entre para carregar</option></select></label>
        <div class="v99-inline-create"><input data-v99-supa-tenant-name placeholder="Ex: RealTalent Comercial"><button class="btn" type="button" data-v99-supa-create-tenant>Criar</button></div>
        <button class="btn" type="button" data-v99-supa-refresh>Atualizar workspaces</button>
      </div>
      <div class="v99-supa-section">
        <div class="v99-section-title">4. Sincronização</div>
        <p class="v99-help">O modo híbrido mantém a velocidade local e permite enviar ou recuperar uma cópia do workspace online.</p>
        <div class="v99-sync-actions"><button class="btn btn-primary" type="button" data-v99-sync-up>Enviar dados locais</button><button class="btn" type="button" data-v99-sync-down>Baixar dados da nuvem</button><button class="btn" type="button" data-v99-supa-test>Testar conexão</button></div>
      </div>
    </div>
    <div class="v99-health-result" data-v99-supa-result aria-live="polite"></div>
    <div class="v99-security-note"><strong>Importante:</strong> nunca use a chave <code>service_role</code> no navegador. Execute primeiro o arquivo <code>supabase/schema.sql</code> no SQL Editor do projeto.</div>`;
  page.appendChild(panel);

  const $=selector=>panel.querySelector(selector),result=$('[data-v99-supa-result]'),tenantSelect=$('[data-v99-supa-tenant]');
  const message=(text,type='info')=>{result.textContent=text;result.dataset.type=type};
  const fields=()=>({url:$('[data-v99-supa-url]').value,publishableKey:$('[data-v99-supa-key]').value,remember:$('[data-v99-supa-remember]').checked,autoSync:$('[data-v99-supa-autosync]').checked,table:'crm_records'});
  const credentials=()=>({email:$('[data-v99-supa-email]').value,password:$('[data-v99-supa-password]').value});
  const paint=()=>{const status=supabase.status();$('[data-v99-supa-badge]').textContent=formatStatus(status);$('[data-v99-supa-signout]').disabled=!status.authenticated;$('[data-v99-sync-up]').disabled=!status.authenticated||!status.tenantId;$('[data-v99-sync-down]').disabled=!status.authenticated||!status.tenantId;$('[data-v99-supa-create-tenant]').disabled=!status.authenticated;$('[data-v99-supa-refresh]').disabled=!status.authenticated};
  const ensureConnected=async()=>{if(!supabase.client)await supabase.connect(fields());return supabase.status()};
  const loadTenants=async()=>{
    const status=supabase.status();if(!status.authenticated){tenantSelect.innerHTML='<option value="">Entre para carregar</option>';paint();return[]}
    const tenants=await supabase.listTenants();tenantSelect.innerHTML='<option value="">Selecione...</option>'+tenants.map(t=>`<option value="${escapeHtml(t.id)}" ${t.id===supabase.config.tenantId?'selected':''}>${escapeHtml(t.name)}</option>`).join('');paint();return tenants;
  };

  $('[data-v99-supa-connect]').addEventListener('click',async event=>{const button=event.currentTarget;setBusy(button,true,'Conectando...');try{const status=await supabase.connect(fields());message(status.authenticated?'Projeto conectado e sessão restaurada.':'Projeto conectado. Entre na sua conta.','success');if(status.authenticated)await loadTenants();paint()}catch(error){message(error.message,'error');toast('Falha ao conectar o Supabase.','error')}finally{setBusy(button,false)}});
  $('[data-v99-supa-clear]').addEventListener('click',async()=>{const confirmed=await window.CRMDialog?.confirm?.('Remover a configuração do Supabase deste navegador? Os dados locais não serão apagados.',{title:'Remover configuração',confirmText:'Remover'});if(confirmed===false)return;await supabase.signOut().catch(()=>{});supabase.clear();$('[data-v99-supa-url]').value='';$('[data-v99-supa-key]').value='';tenantSelect.innerHTML='<option value="">Entre para carregar</option>';message('Configuração removida. O CRM permanece em modo local.');paint()});
  $('[data-v99-supa-signin]').addEventListener('click',async event=>{const button=event.currentTarget;setBusy(button,true,'Entrando...');try{await ensureConnected();const {email,password}=credentials();await supabase.signIn(email,password);await loadTenants();message(`Conta conectada: ${supabase.status().userEmail}.`,'success');toast('Conta Supabase conectada.')}catch(error){message(error.message,'error');toast('Não foi possível entrar.','error')}finally{setBusy(button,false);paint()}});
  $('[data-v99-supa-signup]').addEventListener('click',async event=>{const button=event.currentTarget;setBusy(button,true,'Criando...');try{await ensureConnected();const {email,password}=credentials();const data=await supabase.signUp(email,password);message(data?.session?'Conta criada e conectada.':'Conta criada. Confirme o e-mail antes de entrar.','success');if(data?.session)await loadTenants();toast('Cadastro enviado ao Supabase.')}catch(error){message(error.message,'error');toast('Não foi possível criar a conta.','error')}finally{setBusy(button,false);paint()}});
  $('[data-v99-supa-signout]').addEventListener('click',async()=>{try{await supabase.signOut();tenantSelect.innerHTML='<option value="">Entre para carregar</option>';message('Sessão encerrada. O CRM voltou ao modo local.');paint()}catch(error){message(error.message,'error')}});
  $('[data-v99-supa-refresh]').addEventListener('click',async()=>{try{const tenants=await loadTenants();message(`${tenants.length} workspace(s) encontrado(s).`,'success')}catch(error){message(error.message,'error')}});
  tenantSelect.addEventListener('change',()=>{if(!tenantSelect.value)return;try{supabase.selectTenant(tenantSelect.value);message('Workspace selecionado. Agora você pode sincronizar.','success');paint()}catch(error){message(error.message,'error')}});
  $('[data-v99-supa-create-tenant]').addEventListener('click',async event=>{const button=event.currentTarget;setBusy(button,true,'Criando...');try{const id=await supabase.createTenant($('[data-v99-supa-tenant-name]').value);await loadTenants();tenantSelect.value=id;message('Workspace criado e selecionado.','success');toast('Workspace criado.')}catch(error){message(error.message,'error');toast('Não foi possível criar o workspace.','error')}finally{setBusy(button,false);paint()}});
  $('[data-v99-sync-up]').addEventListener('click',async event=>{const button=event.currentTarget;setBusy(button,true,'Enviando...');try{const sync=await supabase.syncToRemote();message(`${sync.records} registros enviados para a nuvem.`,'success');toast('Sincronização concluída.')}catch(error){message(error.message,'error');toast('Falha ao enviar dados.','error')}finally{setBusy(button,false)}});
  $('[data-v99-sync-down]').addEventListener('click',async event=>{const confirmed=await window.CRMDialog?.confirm?.('Baixar o workspace online e substituir os dados locais atuais?',{title:'Baixar dados da nuvem',confirmText:'Baixar e substituir'});if(confirmed===false)return;const button=event.currentTarget;setBusy(button,true,'Baixando...');try{const sync=await supabase.syncFromRemote({clear:true});message(`${sync.records} registros recuperados. Recarregando...`,'success');toast('Dados recuperados da nuvem.');setTimeout(()=>location.reload(),350)}catch(error){message(error.message,'error');toast('Falha ao baixar dados.','error')}finally{setBusy(button,false)}});
  $('[data-v99-supa-test]').addEventListener('click',async()=>{try{const health=await supabase.health();message(health.ok?`Conexão íntegra · modo ${health.mode} · ${health.remote?.count??0} registro(s).`:`Conexão incompleta: ${health.error||health.remote?.error||'entre e selecione um workspace'}`,health.ok?'success':'error')}catch(error){message(error.message,'error')}});

  supabase.on(()=>paint());paint();
  if(supabase.status().authenticated)loadTenants().catch(error=>message(error.message,'error'));
}

function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
let autoSyncTimer=0,autoSyncRunning=false;
function scheduleAutoSync(){
  if(!supabase.config.autoSync||!supabase.status().authenticated||!supabase.status().tenantId)return;
  clearTimeout(autoSyncTimer);autoSyncTimer=setTimeout(async()=>{if(autoSyncRunning)return;autoSyncRunning=true;try{await supabase.syncToRemote();document.dispatchEvent(new CustomEvent('crm:cloud-synced',{detail:{direction:'up',automatic:true}}))}catch(error){console.warn('[CRM Supabase] Sincronização automática pendente:',error.message)}finally{autoSyncRunning=false}},900);
}
document.addEventListener('crm:datachange',scheduleAutoSync);
document.addEventListener('crm:repository-change',scheduleAutoSync);
function appendV99Panels(){appendBackupPanel();appendSupabasePanel()}

document.addEventListener('crm:viewchange',event=>{const view=event.detail?.view;if(view)lifecycle.activate(view,{source:'navigation'});if(view==='configuracoes')queueMicrotask(appendV99Panels)});
const initialView=document.body?.dataset.currentView||'inicio';lifecycle.activate(initialView,{source:'boot'});if(initialView==='configuracoes')appendV99Panels();

const kernel=Object.freeze({version:'V99.0',store,backup,lifecycle,supabase,adapters:Object.freeze({LocalStorageAdapter,SupabaseAdapter}),configureSupabase(client,options){const adapter=store.useSupabase(client,options);document.dispatchEvent(new CustomEvent('crm:backend-changed',{detail:{mode:'hybrid'}}));return adapter},useLocal(){store.useLocal();document.dispatchEvent(new CustomEvent('crm:backend-changed',{detail:{mode:'local'}}));return store},health:async()=>({version:VERSION,store:await store.health(),supabase:await supabase.health().catch(error=>({ok:false,error:error.message})),lifecycle:lifecycle.status(),leads:leadsSync().length})});
window.CRMKernel=kernel;window.CRMKernelV99=kernel;window.CRMStoreV99=store;window.CRMBackupService=backup;window.CRMSupabase=supabase;
Object.assign(window.CRMStore||{},store);
document.documentElement.dataset.crmKernel='v99';
document.dispatchEvent(new CustomEvent('crm:kernel-ready',{detail:{version:'V99.0',mode:store.mode}}));
supabase.restore().then(()=>{if(document.body?.dataset.currentView==='configuracoes')queueMicrotask(appendV99Panels)}).catch(()=>{});
