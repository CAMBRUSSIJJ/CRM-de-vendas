# Guia de conexão com Supabase — RealTalent CRM V99.0

## 1. Criar o projeto

Crie um projeto no painel do Supabase. Guarde:

- Project URL;
- chave publicável ou anon.

A chave `service_role` não deve ser colocada no HTML, em JavaScript do navegador ou no formulário do CRM.

## 2. Criar o banco

Abra o SQL Editor e execute:

`supabase/schema.sql`

Ele cria:

- `crm_profiles`: perfis das contas;
- `crm_tenants`: workspaces/empresas;
- `crm_memberships`: usuários e funções por workspace;
- `crm_records`: registros JSON do CRM, identificados por `tenant_id` e `record_key`;
- função `crm_create_tenant`;
- funções de autorização;
- políticas RLS para impedir que uma conta acesse outro workspace;
- proteção contra promoção indevida para proprietário;
- proteção para que o workspace nunca fique sem proprietário;
- validação de autoria nas gravações de `crm_records`.

Depois, execute `supabase/VERIFICAR-INSTALACAO.sql`.

## 3. Configurar autenticação

Em Authentication, mantenha e-mail e senha habilitados. Defina corretamente a Site URL e as URLs de redirecionamento do endereço onde o CRM será publicado.

Em um HTML aberto diretamente pelo computador, login por senha pode funcionar, mas confirmações e redefinições de senha devem apontar para uma URL publicada.

## 4. Conectar pelo CRM

Abra:

`Configurações → Supabase`

Preencha a URL e a chave publicável. Depois:

1. clique em **Salvar e conectar**;
2. entre ou crie uma conta;
3. crie um workspace;
4. clique em **Enviar dados locais**.

## 5. Como a sincronização funciona

A V99.0 usa modo híbrido:

- a operação continua no `localStorage` para manter compatibilidade e velocidade;
- a sincronização envia uma cópia completa para `crm_records` usando o `tenant_id` selecionado;
- **Baixar dados da nuvem** substitui a base local pela cópia do workspace;
- configurações de conexão e tokens de sessão não são enviados ao Supabase nem incluídos nos backups do CRM;
- a chave secreta do servidor é recusada pelo frontend;
- cada `record_key` é sincronizada como uma unidade: não existe mesclagem automática campo a campo;
- quando dois navegadores alteram a mesma chave sem baixar as mudanças anteriores, o último envio confirmado prevalece.

## 6. Publicação

Para publicar, configure a conexão no próprio CRM ou carregue um arquivo baseado em `config/supabase-config.example.js` antes do módulo principal.

## 7. Limitação atual

A sincronização é híbrida. Os módulos comerciais ainda usam uma cópia local como fonte imediata e sincronizam o conjunto de registros com o Supabase. A estrutura de membros e papéis já existe no banco, mas a interface de convite, transferência de propriedade e colaboração em tempo real ainda não foi adicionada. Antes do uso em equipe, essa administração deve ser concluída e testada em um projeto real.
