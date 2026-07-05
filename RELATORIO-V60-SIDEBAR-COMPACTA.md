# CRM v60 — Sidebar compacta profissional

## Objetivo
Simplificar a barra lateral para ela ficar mais profissional, compacta e com menos informação exposta ao mesmo tempo.

## O que mudou

### Estrutura principal
A sidebar agora mostra somente 10 áreas principais:

1. Painel
2. Leads
3. Pipeline
4. Follow-ups
5. Agenda
6. Atendimento
7. Inteligência
8. Gestão
9. Automações
10. Configurações

### Sub-abas escondidas em flyout
As sub-abas não ficam mais abertas/empilhadas dentro da lateral. Ao passar o mouse em uma área, aparece um painel flutuante com as opções internas.

Exemplos:

- Atendimento contém Ligações, Chat, WhatsApp e Histórico.
- Inteligência contém Playbooks, Scripts, Objeções, Materiais e IA local.
- Gestão contém Resumo, Métricas, Metas, Perdas e Forecast.
- Configurações contém Importar/Exportar, Layout, Preferências e Backup.

### Ícones profissionais
Foram adicionados ícones SVG lineares diretamente no módulo v60, sem depender de biblioteca externa.

### Sem botão de recolher
A lateral não usa mais botão manual de abrir/recolher. Ela fica recolhida com ícones e expande ao passar o mouse.

### Sem setas
Não há setas de expandir sub-abas. As sub-abas aparecem em flyout profissional.

## Arquivos adicionados

- `assets/css/crm-v60-sidebar-compacta-profissional.css`
- `assets/js/modules/40-sidebar-compacta-profissional-v60.js`
- `RELATORIO-V60-SIDEBAR-COMPACTA.md`

## Arquivo alterado

- `index.html`
- `README.md`

## Testes recomendados

1. Abrir o CRM.
2. Ver se a lateral aparece como barra fina com ícones.
3. Passar o mouse na lateral e conferir se ela expande.
4. Passar o mouse em cada área e conferir o flyout de sub-abas.
5. Clicar em Agenda, Follow-ups, Atendimento, Inteligência, Gestão e Configurações.
6. Conferir se a página não entra em carregamento infinito.
