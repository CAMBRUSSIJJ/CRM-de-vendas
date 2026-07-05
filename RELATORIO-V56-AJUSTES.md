# Relatório v56 — Agenda e Sidebar

## Correção feita

Esta versão trabalha apenas em cima da camada v55, sem mexer na estrutura principal do CRM.

### Sidebar

- Remove visualmente e no DOM os botões antigos de recolher/expandir (`v55SidebarControl`, `v55SidebarHandle` e equivalentes antigos).
- A sidebar passa a funcionar no modelo profissional de dock:
  - recolhida por padrão;
  - abre suavemente ao passar o mouse ou focar pelo teclado;
  - fecha ao tirar o mouse;
  - mostra apenas ícones quando recolhida;
  - mostra nomes das abas ao expandir;
  - mantém tooltips e ícones nas abas/sub-abas.

### Agenda

- Mantida a agenda funcional da v55, mas com acabamento visual novo.
- Melhorias de layout:
  - botão “Novo compromisso” mais profissional;
  - cards dos dias mais suaves;
  - hover com indicação de clique para criar compromisso;
  - grade mensal mais limpa;
  - visão diária com blocos de horário mais claros;
  - drawer lateral de criação/edição com visual mais refinado;
  - backdrop ao abrir compromisso;
  - campos de formulário com foco e espaçamento melhores.

## Arquivos adicionados

- `assets/css/crm-v56-agenda-sidebar-polido.css`
- `assets/js/modules/36-agenda-sidebar-polido-v56.js`

## Arquivo alterado

- `index.html`

## Testes recomendados

1. Abrir o CRM.
2. Passar o mouse na lateral e confirmar expansão suave sem botão.
3. Tirar o mouse e confirmar recolhimento automático.
4. Abrir Agenda.
5. Clicar em uma área vazia de um dia.
6. Criar compromisso e salvar.
7. Abrir visualização Dia, Mês, Ano e Lista.
8. Clicar em um evento e editar no painel lateral.
