# CRM v61 — Agenda oficial

## Objetivo

Esta versão substitui a agenda antiga por uma única agenda oficial, sem reaproveitar os blocos antigos de HTML da agenda.

## O que foi removido/neutralizado

- O HTML antigo da agenda foi substituído por um container limpo.
- A renderização antiga da agenda no módulo `37-limpeza-estrutural-layout-definitivo-v57.js` foi neutralizada para não sobrescrever a agenda nova.
- O botão antigo de Google Calendar, os modais antigos e as listas antigas da agenda não fazem mais parte da aba oficial.

## O que foi implementado

- Visualização por Dia.
- Visualização por Semana.
- Visualização por Mês.
- Visualização por Ano.
- Visualização em Lista.
- Mini calendário lateral.
- Filtros por agenda/camada.
- Filtros por tipo de evento.
- Botão Hoje.
- Botões anterior/próximo.
- Botão Novo compromisso.
- Clique no quadrado do dia para criar evento.
- Clique no horário no modo Dia/Semana para criar evento naquele horário.
- Painel lateral profissional para criar/editar compromisso.
- Campos de título, data, agenda, início, fim, tipo, prioridade, status, local/link, lead vinculado e notas.
- Salvar, editar e excluir compromisso.

## Arquivos alterados/adicionados

- `index.html`
- `README.md`
- `RELATORIO-V61-AGENDA-OFICIAL.md`
- `assets/css/crm-v61-agenda-oficial-google.css`
- `assets/js/modules/41-agenda-oficial-google-v61.js`
- `assets/js/modules/37-limpeza-estrutural-layout-definitivo-v57.js`

## Testes recomendados

1. Abrir a aba Agenda.
2. Clicar em Mês, Semana, Dia, Ano e Lista.
3. Clicar em um quadrado do mês.
4. Criar um compromisso e salvar.
5. Conferir se aparece na grade.
6. Clicar no compromisso e editar.
7. Excluir o compromisso.
