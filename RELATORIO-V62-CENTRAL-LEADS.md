# CRM V62 — Central de Leads Profissional

## Objetivo
Criar uma Central de Leads profissional sem sobrepor implementações antigas, mantendo a base de dados atual (`outbounder_leads_v5`) e substituindo a camada anterior de Gestão de Leads.

## O que foi atualizado

### 1. Substituição da camada antiga de Leads
- Removido o módulo antigo `10-leads-tabela-colunas-v19.js`.
- Criado o módulo oficial único `10-central-leads-profissional-v62.js`.
- Atualizado o `index.html` para carregar somente o módulo V62 de Leads.
- Mantida a mesma seção `#leads`, a mesma tabela base e os mesmos dados, evitando uma segunda aba ou outro renderizador paralelo.

### 2. Corte de sobreposição da camada V6 em Leads
O arquivo `05-integracao-geral-v6.js` ainda é usado por outras áreas do CRM, mas foi ajustado para não tentar controlar a aba Leads.

Foram removidas do fluxo ativo da V6 em Leads:
- painel `v6LeadsPanel`;
- filtros V6 paralelos;
- colunas V6 paralelas;
- edição rápida V6 na tabela de Leads;
- extras V6 no formulário/modal de Leads.

Isso evita que duas camadas renderizem a mesma tabela.

### 3. Nova Central de Leads
A aba Leads agora tem:
- hero profissional da Central de Leads;
- KPIs clicáveis: Total, Quentes, Atrasados, Sem ação, Propostas e Ganhos;
- busca global por nome, telefone, origem, responsável, tag, cidade, produto e decisor;
- filtros por etapa, prioridade, origem, responsável e situação especial;
- filtro para possíveis duplicados;
- filtro para leads sem contato;
- filtro para leads parados há 7+ dias;
- tabela com edição rápida;
- personalização de colunas;
- exportação CSV por todos, filtrados, selecionados ou quentes;
- seleção em massa;
- mover etapa em massa;
- alterar responsável em massa;
- excluir em massa;
- score comercial;
- qualidade do cadastro;
- próxima ação;
- botão rápido de follow-up em +2 dias;
- abertura da ficha do lead ao clicar na linha.

### 4. Ficha e cadastro enriquecidos
Foram adicionados campos profissionais ao cadastro e ao modal de edição:
- cidade;
- produto/serviço de interesse;
- decisor/cargo;
- canal preferido;
- probabilidade de fechamento;
- tags;
- próxima ação;
- dor principal.

Esses campos também aparecem na ficha lateral do lead quando preenchidos.

### 5. Limpeza de referências antigas
- Atualizado `MODULES.md` para apontar para o módulo V62.
- Atualizado o módulo de UX `28-botoes-sidebar-ux-areas.js` para usar os KPIs V62 em vez de V19.
- Mantida regra CSS de segurança para esconder/remover restos de V6/V19 caso algum dado antigo tente aparecer.

## Arquivos alterados
- `index.html`
- `MODULES.md`
- `assets/css/app.css`
- `assets/js/modules/00-nucleo-dados-base.js`
- `assets/js/modules/05-integracao-geral-v6.js`
- `assets/js/modules/28-botoes-sidebar-ux-areas.js`

## Arquivos removidos
- `assets/js/modules/10-leads-tabela-colunas-v19.js`

## Arquivos adicionados
- `assets/js/modules/10-central-leads-profissional-v62.js`
- `RELATORIO-V62-CENTRAL-LEADS.md`
- `CHECKS-v62.txt`
- `REMOVIDOS-V62.txt`

## Observação importante
Esta versão não cria uma segunda aba de Leads. Ela substitui a implementação antiga e usa a estrutura existente do CRM para evitar o problema de camadas duplicadas, CSS brigando e renderizadores concorrentes.
