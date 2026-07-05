# CRM v58 — correção da barra lateral invisível

## Problema identificado

A versão v57 limpou várias camadas antigas, mas ainda havia classes antigas de sidebar que podiam ficar salvas no navegador ou aplicadas por scripts anteriores, como:

- `crm-sidebar-icons`
- `crm-sidebar-fixed`
- `crm-sidebar-pinned`
- `crm-v46-sidebar-icons`
- `crm-v46-sidebar-fixed`

Essas classes possuem regras com `!important` e especificidade maior do que a regra simples `.sidebar` da v57. Resultado: em alguns casos a lateral era deslocada para fora da tela ou ficava invisível.

## Correção feita

Foi adicionada uma camada v58 exclusiva para estabilizar a sidebar:

- força a `.sidebar` a ficar visível;
- remove classes antigas conflitantes do `body`;
- observa mudanças no `body` para impedir que scripts antigos reapliquem classes conflitantes;
- mantém a lateral sem botão de recolher;
- mantém o comportamento profissional: recolhida por padrão e expandida ao passar o mouse;
- esconde `rail`, `topbar-tabs` e botões antigos de toggle;
- garante ícones/textos mínimos se algum script antigo deixar botão vazio.

## Arquivos adicionados

- `assets/css/crm-v58-sidebar-visivel-estavel.css`
- `assets/js/modules/38-sidebar-visivel-estavel-v58.js`

## Arquivo alterado

- `index.html`

## Teste recomendado

1. Abrir o CRM.
2. Confirmar se a sidebar aparece como coluna fina de ícones no lado esquerdo.
3. Passar o mouse na sidebar.
4. Confirmar se ela expande suavemente.
5. Tirar o mouse.
6. Confirmar se ela recolhe novamente.
7. Clicar em Agenda, Leads, Pipeline e Follow-ups para confirmar a navegação.
