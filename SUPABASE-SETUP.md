# Configuração do Supabase — RealTalent CRM V99.0

## 1. Criar o projeto

Crie um projeto no Supabase e aguarde a preparação do banco.

## 2. Criar as tabelas e políticas

Abra **SQL Editor**, copie todo o conteúdo de `supabase/schema.sql` e execute uma vez. O arquivo cria:

- `crm_profiles`: perfil básico da conta;
- `crm_tenants`: workspaces/empresas;
- `crm_memberships`: membros e papéis `owner`, `admin`, `member` e `viewer`;
- `crm_records`: registros do CRM em JSONB, separados por `tenant_id`;
- `crm_create_tenant`: função segura para criar um workspace e registrar o proprietário;
- funções auxiliares de autorização;
- políticas RLS que isolam os dados por workspace;
- bloqueio da remoção ou rebaixamento do último `owner`;
- bloqueio de mudança direta de `owner_id`;
- validação de que `updated_by` pertence ao usuário autenticado.

Depois, execute `supabase/VERIFICAR-INSTALACAO.sql`. As quatro tabelas devem existir e a coluna `relrowsecurity` deve aparecer como `true`.

## 3. Obter as credenciais públicas

No painel do Supabase, copie:

- Project URL;
- Publishable key ou anon key.

Nunca utilize a `service_role` ou uma secret key no HTML, no navegador ou no frontend publicado. O CRM rejeita essas chaves no formulário.

## 4. Conectar no CRM

Abra o CRM e acesse **Configurações → Supabase**.

1. Cole a Project URL e a publishable/anon key.
2. Clique em **Salvar e conectar**.
3. Crie uma conta ou entre com e-mail e senha.
4. Crie ou selecione um workspace.
5. Faça um backup local antes da primeira sincronização.
6. Clique em **Enviar dados locais**.

## 5. Como a sincronização funciona

A V99.0 usa uma arquitetura híbrida:

- a interface continua operando com uma cópia local rápida;
- o Supabase mantém a cópia online por workspace;
- credenciais e tokens de sessão não entram no backup nem na sincronização comercial;
- o envio e a recuperação podem ser feitos manualmente;
- a opção de sincronização automática envia alterações locais quando a conta e o workspace estão conectados;
- baixar da nuvem substitui os dados comerciais locais deste navegador;
- o papel `viewer` pode consultar, mas não gravar registros;
- a sincronização é feita por chave completa, sem mesclagem campo a campo; em conflito, o último envio daquela chave prevalece.

## 6. Autenticação por e-mail

Quando a confirmação de e-mail estiver habilitada, a conta só poderá entrar depois de confirmar o link recebido. Para publicação, configure as URLs permitidas em **Authentication → URL Configuration**.

## 7. Configuração pré-preenchida para implantação

O arquivo `src/config/runtime-config.js` lê `window.__CRM_SUPABASE_CONFIG__`. Um exemplo está em `config/supabase-config.example.js`.

Use somente:

- `url`;
- `publishableKey`;
- opcionalmente `tenantId`;
- `table: 'crm_records'`.

Nunca coloque a `service_role` nesses arquivos.

## 8. Segurança operacional

- mantenha RLS ativado;
- não conceda escrita ao papel `anon`;
- faça backup antes de substituir uma base;
- use workspaces diferentes para homologação e produção;
- teste primeiro com uma conta e dados de demonstração;
- não compartilhe a senha de uma conta entre vendedores: convites e gestão de membros devem ser adicionados em uma etapa posterior de administração de equipe.


## 9. Validação antes de produção

Os testes incluídos validam o adaptador, autenticação simulada, seleção de workspace, exclusão de credenciais do backup e rejeição de chaves secretas. Eles não substituem um teste no seu projeto Supabase real. Antes de publicar:

1. execute `schema.sql` e `VERIFICAR-INSTALACAO.sql`;
2. teste com duas contas pertencentes a workspaces diferentes;
3. confirme que uma conta não consegue consultar o workspace da outra;
4. confirme que `viewer` não grava e que `member` não administra proprietários;
5. faça backup e teste envio e recuperação em um workspace de homologação.
