# Relatório V64 — Agenda integrada com Leads

## Objetivo
Criar uma agenda profissional integrada com a Central de Leads e com os Follow-ups, sem criar uma segunda agenda ativa nem permitir que módulos antigos sobrescrevam a tela.

## Arquivos adicionados

- `assets/js/modules/15-agenda-integrada-leads-v64.js`
- `assets/css/crm-v64-agenda-integrada-leads.css`

## Arquivos alterados

- `index.html`
  - Incluído o CSS V64.
  - Incluído o módulo V64 antes da camada V57, para a V57 apenas delegar a Agenda.

- `assets/js/modules/37-limpeza-estrutural-layout-definitivo-v57.js`
  - A antiga Agenda V57 não renderiza mais o DOM da Agenda.
  - `renderAgenda()` e `setAgendaView()` agora delegam para `window.CRMV64Agenda`.
  - Mantive a ponte dos submenus Mês, Semana, Dia, Ano e Lista.

- `assets/js/modules/05-integracao-geral-v6.js`
  - Removidas as chamadas que injetavam o bloco antigo `v6AgendaPro` dentro da Agenda.
  - As funções antigas continuam no arquivo por compatibilidade, mas não são executadas.

- `assets/js/modules/00-nucleo-dados-base.js`
  - O `setView('agenda')` não chama mais a Agenda antiga do núcleo.
  - As automações que criam compromisso agora preferem `window.CRMV64Agenda.addEvent()`, evitando sobrescrever a lista de eventos com estado antigo em memória.

## Funcionalidades adicionadas

- Agenda com visualização por:
  - Dia;
  - Semana;
  - Mês;
  - Ano;
  - Lista.

- Integração com leads:
  - Evento pode ser vinculado a um lead.
  - Drawer mostra prévia do lead vinculado.
  - Ao salvar evento vinculado, o lead pode receber próxima ação, data de follow-up e histórico.
  - Botões rápidos para abrir lead, WhatsApp e ligação.
  - Filtros por lead e por responsável.

- Integração com follow-ups:
  - Follow-ups dos leads aparecem na Agenda mesmo quando ainda não existe evento real.
  - Esses itens são marcados como vindos do lead.
  - Ao clicar, é possível transformar em compromisso real da Agenda.

- Organização comercial:
  - KPIs clicáveis: hoje, atrasados, próximos 7 dias, reuniões, vinculados e concluídos.
  - Filtro por tipo de compromisso.
  - Filtro por prioridade.
  - Busca por lead, responsável, cidade, etapa, tipo e notas.
  - Fila do dia na lateral.
  - Mini calendário com contagem de itens por dia.
  - Densidade confortável/compacta.

- Gestão de evento:
  - Criar compromisso clicando no dia ou horário.
  - Editar compromisso em drawer lateral.
  - Marcar compromisso como concluído.
  - Registrar resultado.
  - Excluir compromisso.
  - Atualizar histórico do lead vinculado.

## Medidas contra sobreposição

- A V64 é a única camada que renderiza a aba `#agenda`.
- A V57 não sobrescreve mais o DOM da Agenda.
- A V6 não injeta mais o bloco `v6AgendaPro` dentro da Agenda.
- O núcleo antigo não chama mais o `renderAgenda` antigo ao navegar para Agenda.
- O `crmAgendaAPI` passa a ser reatribuído pela V64.
- A chave `localStorage` foi mantida como `outbounder_agenda_v1` para preservar os compromissos existentes.

## Observações

A estrutura antiga de Agenda ainda existe no núcleo por compatibilidade com outras partes do sistema, mas não é mais acionada pela navegação oficial. Isso evita quebrar funções antigas que ainda consultam dados da agenda, sem permitir que elas disputem a interface visual.
