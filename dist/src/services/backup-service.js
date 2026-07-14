const BACKUP_FORMAT='realtalent-crm-backup';
const encode=text=>new TextEncoder().encode(text);
const hex=buffer=>Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
async function digest(text){
  if(globalThis.crypto?.subtle)return hex(await crypto.subtle.digest('SHA-256',encode(text)));
  let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return 'fnv1a-'+(h>>>0).toString(16)
}
export class BackupService {
  constructor(repository,{appVersion='99.0.0'}={}){this.repository=repository;this.appVersion=appVersion}
  async create(){
    const records=await this.repository.adapter.export();
    const payload={format:BACKUP_FORMAT,schemaVersion:1,appVersion:this.appVersion,createdAt:new Date().toISOString(),records};
    payload.checksum=await digest(JSON.stringify(payload.records));
    return payload;
  }
  async validate(payload){
    const errors=[];
    if(!payload||payload.format!==BACKUP_FORMAT)errors.push('Formato de backup não reconhecido.');
    if(!payload?.records||typeof payload.records!=='object'||Array.isArray(payload.records))errors.push('Registros ausentes ou inválidos.');
    if(!Number.isInteger(payload?.schemaVersion))errors.push('Versão de esquema ausente.');
    const checksum=payload?.records?await digest(JSON.stringify(payload.records)):'';
    if(payload?.checksum&&checksum!==payload.checksum)errors.push('A verificação de integridade falhou.');
    return {ok:errors.length===0,errors,checksum,records:Object.keys(payload?.records||{}).length};
  }
  async restore(payload,{clear=true}={}){
    const validation=await this.validate(payload);if(!validation.ok)throw new Error(validation.errors.join(' '));
    await this.repository.adapter.import(payload.records,{clear});
    this.repository.emit('crm:backup-restored',{createdAt:payload.createdAt,records:validation.records});
    return validation;
  }
  download(payload,filename=`realtalent-crm-backup-${new Date().toISOString().slice(0,10)}.json`){
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);return filename;
  }
}
