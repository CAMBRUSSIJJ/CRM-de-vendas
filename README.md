# RealTalent CRM V99.0

Versão de consolidação estrutural com núcleo modular, backup validado e integração híbrida com Supabase.

## Executar

- Windows: abra `ABRIR-CRM.bat`.
- Desenvolvimento: `npm run dev`.
- Build: `npm run build`.
- HTML único: `npm run standalone`.

## Arquitetura V99

- `CRMData`: API síncrona canônica para os módulos existentes.
- `CRMKernelV99`: núcleo ES Module com repositório, adaptadores, transações e ciclo de vida.
- `LocalStorageAdapter`: modo local padrão, excluindo sessões e configuração do Supabase dos backups.
- `SupabaseAdapter`: persistência multiworkspace na tabela `crm_records`, isolada por `tenant_id`.
- `SupabaseConnectionManager`: conexão, autenticação, seleção de workspace e sincronização.
- `CRMBackupService`: backup versionado, checksum, validação e restauração.
- `CRMNavigationV990`: proprietário único da navegação.

## Configurar o Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor e execute `supabase/schema.sql`.
3. Execute `supabase/VERIFICAR-INSTALACAO.sql`.
4. Em Authentication, mantenha e-mail e senha habilitados.
5. Abra o CRM e acesse `Configurações → Supabase`.
6. Informe a Project URL e a publishable/anon key.
7. Crie ou acesse uma conta.
8. Crie um workspace e envie os dados locais para a nuvem.

Nunca use a chave `service_role` ou uma secret key no navegador. O painel rejeita essas chaves e o banco usa RLS para limitar cada conta aos workspaces em que ela é membro.

O modo atual é híbrido: a interface continua operando com armazenamento local e permite enviar ou recuperar uma cópia completa do workspace online. A sincronização trabalha por chave de registro e ainda não faz mesclagem colaborativa de campos; em conflito, o último envio daquela chave prevalece. Isso preserva compatibilidade com os módulos históricos enquanto a migração assíncrona é concluída.

## Objetos do banco

- `crm_profiles`;
- `crm_tenants`;
- `crm_memberships`;
- `crm_records`;
- `crm_create_tenant`;
- políticas RLS por workspace;
- proteção contra remoção do último proprietário;
- bloqueio de alteração direta do proprietário principal e de `updated_by` forjado.

## Arquivos do Supabase

- `supabase/schema.sql`: tabelas, funções, papéis e políticas RLS.
- `supabase/VERIFICAR-INSTALACAO.sql`: consultas para conferir a instalação.
- `src/config/runtime-config.js`: configuração opcional para implantação já conectada.
- `config/supabase-config.example.js`: exemplo de configuração.
- `SUPABASE-SETUP.md`: instruções completas.

## Validação

```bash
npm run check
npm run audit
npm run test:kernel
npm run test:supabase
npm run test:actions
npm run build
npm run standalone
```
