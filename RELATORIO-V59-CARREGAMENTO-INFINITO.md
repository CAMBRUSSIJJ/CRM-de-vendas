# CRM v59 — correção de carregamento infinito

Problema identificado: a v58 tinha uma correção de sidebar com `MutationObserver` permanente no `body`. Em alguns navegadores/cache/localStorage, classes antigas de sidebar podiam ser reaplicadas por módulos antigos e removidas pela v58 em sequência, causando sensação de carregamento infinito/travamento.

Correção aplicada:
- remove a chamada da camada v58;
- adiciona camada v59 sem `MutationObserver` infinito;
- força o CRM a sair de qualquer estado de carregamento;
- mantém a sidebar visível, recolhida por padrão e abrindo no hover;
- esconde rails/topbars duplicadas;
- usa passadas finitas de estabilização.

Arquivos alterados:
- `index.html`
- `README.md`
- `assets/css/crm-v59-emergencia-carregamento.css`
- `assets/js/modules/39-emergencia-carregamento-sidebar-v59.js`
- `RELATORIO-V59-CARREGAMENTO-INFINITO.md`
