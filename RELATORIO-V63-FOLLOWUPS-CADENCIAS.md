# CRM V63 — Follow-ups com Cadências

## Objetivo
Evoluir a aba **Follow-ups** para uma central operacional real, com cadências comerciais, sem criar uma segunda aba, sem renderizador paralelo e sem sobrepor a estrutura existente da V62.

## O que foi alterado

### 1. Módulo único da aba Follow-ups
Adicionado:

- `assets/js/modules/14-followups-cadencias-v63.js`
- `assets/css/crm-v63-followups-cadencias.css`

Esse novo módulo passa a controlar a aba `#cadencias`.

### 2. Renderização antiga delegada
O módulo antigo:

- `37-limpeza-estrutural-layout-definitivo-v57.js`

não desenha mais a interface antiga de Follow-ups. Agora ele apenas delega a aba para o módulo V63 por meio de:

- `window.CRMV63Followups.render()`
- `window.CRMV63Followups.setTab()`

Isso evita a sobreposição que acontecia quando duas camadas tentavam redesenhar a mesma aba.

### 3. Construtor antigo da camada V6 removido
A camada:

- `05-integracao-geral-v6.js`

não cria mais o construtor parcial de cadência `v6CadenceBuilder`. A V6 continua com suas outras funções, mas a parte de Follow-ups/Cadências foi removida dela para não disputar DOM com a V63.

## Novas funções da Central de Follow-ups

A aba agora possui:

- Visão de execução diária.
- Visão Kanban de follow-ups.
- Visão de Cadências.
- Visão de Modelos de mensagem.
- KPIs clicáveis:
  - vencidos;
  - hoje;
  - próximos 7 dias;
  - sem próximo passo;
  - valor em risco.
- Busca global por lead, etapa, cadência e responsável.
- Filtros por situação.
- Ordenação por data, prioridade, valor e etapa.
- Criação rápida de follow-up.
- Criação opcional de compromisso na agenda local.
- Rotina recomendada do dia.
- Cadências rápidas.
- Aplicação de cadência em um lead.
- Aplicação de cadência nos leads filtrados.
- Editor de cadências.
- Duplicação e exclusão de cadências.
- Passos por dia, canal, título e mensagem/objetivo.
- Concluir passo atual e avançar automaticamente para o próximo.
- Adiar follow-up.
- Drag and drop no Kanban para mudar vencimento.
- Modelos prontos para WhatsApp, proposta, ligação, break-up, reativação e reunião.

## Dados usados

A V63 continua usando os dados principais dos leads, sem criar outra base separada de leads.

Campos utilizados/adicionados nos leads:

- `followup`
- `proximaAcao`
- `etapaFollowup`
- `cadenciaId`
- `cadenciaAtual`
- `cadenciaPassos`
- `cadenciaStatus`
- `atividades`
- `ultimaAtualizacao`

As cadências ficam em:

- `crm_v63_cadencias`

Também existe migração segura de cadências antigas de:

- `crm_v6_cadences`

## Arquivos alterados

- `index.html`
- `assets/js/modules/05-integracao-geral-v6.js`
- `assets/js/modules/37-limpeza-estrutural-layout-definitivo-v57.js`

## Arquivos adicionados

- `assets/js/modules/14-followups-cadencias-v63.js`
- `assets/css/crm-v63-followups-cadencias.css`

## Importante

A V63 não criou uma nova aba chamada Follow-ups. Ela atualizou a aba existente `#cadencias` e fez os módulos antigos delegarem para o novo módulo único.
