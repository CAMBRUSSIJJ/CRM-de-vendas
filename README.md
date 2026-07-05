# CRM Pro v47 — Modularizado Profissional

Esta versão preserva a base da v41/v46 e organiza o projeto para facilitar manutenção.

## Como abrir

1. Extraia o ZIP inteiro em uma pasta.
2. Abra `index.html` no navegador.
3. Não abra o `index.html` separado dos arquivos `assets/`, porque os estilos e scripts agora ficam separados.

## O que mudou

- CSS separado em `assets/css/app.css`.
- JavaScript original separado em `assets/js/legacy/script-00.js` até `script-27.js`.
- Nova camada segura em `assets/js/crm-ui-profissional.js`.
- Configurações globais de layout, lateral, filtros e modo leve.
- Filtros padronizados com contador e botão de limpar.
- Modo leve com menos animações, menos sombras e renderização mais econômica.

## Importante

Esta é a versão segura/modular preservando as funções antigas. Ela não removeu seus scripts antigos; apenas separou e organizou para evitar código aparecendo na tela e facilitar próximas manutenções.

Para melhorar ainda mais a velocidade no futuro, o próximo passo é reescrever cada módulo em arquivos independentes de verdade: leads, pipeline, follow-ups, ligações, metas, agenda e automações.


## Atualização v49 — Layout unificado e compacto

Esta versão adiciona uma camada de experiência mais compacta e profissional sem remover as ferramentas existentes.

Principais mudanças:

- Sidebar reorganizada em áreas: Painel, Leads, Pipeline, Follow-ups, Agenda, Atendimento, Inteligência, Gestão, Automações e Configurações.
- Botão global **+ Criar** para lead, follow-up, ligação, compromisso, automação, playbook, objeção e perda.
- Busca global no topo para encontrar leads, telefones, etapas e telas do CRM.
- Densidade de layout: confortável, compacto e super compacto.
- Áreas unificadas: Atendimento, Inteligência Comercial, Gestão Comercial e Configurações.
- Modo execução de follow-ups para trabalhar um contato por vez.
- Painel inicial mais direto com hoje, atrasados, leads quentes, propostas e pipeline aberto.
- Ferramentas de contexto adicionadas em Agenda, Automações, Playbooks, Objeções, Métricas/Gestão e Atendimento.

Arquivos adicionados:

- `assets/css/crm-ux-unificado-compacto.css`
- `assets/js/modules/29-layout-unificado-ferramentas.js`

Arquivo atualizado:

- `index.html`

## Atualização v51 — Agenda, Ligações, Playbooks, Automações e lateral

Esta versão adiciona uma camada de UX profissional sem remover os módulos existentes:

- barra lateral redesenhada com recolher/expandir e sub-abas;
- remoção visual das abas duplicadas do topo/rail;
- agenda com comando compacto, filtro lateral, kanban, painel lateral do compromisso, concluir/remarcar/criar próximo follow-up;
- ligações com modo discagem, configuração do discador em painel lateral e ações inteligentes pós-ligação;
- inteligência comercial com playbooks, scripts, objeções, materiais e gerador local de script;
- automações com modelos prontos, construtor visual, simulação e histórico.

Arquivos principais adicionados:

- `assets/css/crm-v51-agenda-ligacoes-playbook-automacoes.css`
- `assets/js/modules/31-agenda-ligacoes-playbook-automacoes.js`

Também foi exposta uma API leve no `00-nucleo-dados-base.js` para que os módulos novos consigam usar leads, agenda e automações sem duplicar estado.


## Atualização v52 — Sidebar, Agenda e Ligações

Esta versão adiciona uma camada de melhoria sem remover as funções antigas:

- Recolhimento profissional da barra lateral com animação suave, tooltip nos ícones e sub-abas quando expandida.
- Agenda em visual de calendário inspirado no Google Calendar, com visualizações de Mês, Dia, Ano e Lista.
- Eventos do calendário abrem em painel lateral para editar data, hora, tipo, prioridade, lead e notas.
- Telefones na aba Ligações e no detalhe do lead viram links `tel:+55...`, para abrir o app padrão de chamadas do Windows/celular conectado.
- Aviso técnico: gravação automática não é possível com `tel:`/Vincular ao Celular; para gravação real é necessário VoIP/API com consentimento.

Arquivos novos:

```txt
assets/css/crm-v52-sidebar-calendar-calls.css
assets/js/modules/32-sidebar-calendar-ligacoes.js
```

## Atualização v53
- Barra lateral sem setas/chevrons: recolhimento por botão discreto e handle lateral profissional.
- Agenda com visualização Mês, Dia, Ano e Lista, navegação Hoje/Anterior/Próximo e criação de compromisso ao clicar no dia/horário.
- Ligações com números clicáveis usando `tel:+55...` para funcionar com celular conectado ao Windows.


## V54 — correção estrutural de Agenda, Ligações e Sidebar

Esta versão corrige a sobreposição de páginas que fazia a Agenda e Ligações não aparecerem corretamente. A correção oficial está em:

- `assets/css/crm-v54-correcao-estrutural.css`
- `assets/js/modules/34-correcao-estrutural-agenda-ligacoes-sidebar.js`

Também foi incluído o relatório `RELATORIO-V54-BUGS.md` com os bugs encontrados.

Principais mudanças:

- Sidebar recolhe/expande sem setas, com animação suave e grip profissional.
- Agenda com visualizações Mês, Dia, Ano e Lista.
- Clique em dia/horário cria compromisso em painel lateral.
- Clique em evento abre edição em painel lateral.
- Ligações com telefone clicável usando `tel:+55...`, ideal para celular conectado ao Windows.
- Overlays antigos v52/v53 foram removidos do carregamento para evitar conflito.

## Atualização v55

Esta versão corrige a sobreposição de Agenda, Ligações e Follow-ups. A Agenda agora é renderizada diretamente dentro da aba oficial `#agenda`, as Ligações dentro de `#ligacoes` e os Follow-ups dentro de `#cadencias`, evitando páginas duplicadas por cima.

Arquivos principais da v55:

- `assets/css/crm-v55-agenda-followups-ligacoes-sidebar.css`
- `assets/js/modules/35-agenda-followups-ligacoes-sidebar-v55.js`
- `RELATORIO-V55-BUGS.md`

A Agenda possui visualizações de Mês, Dia, Ano e Lista, criação por clique no dia/horário e painel lateral de evento. Os Follow-ups usam layout tipo Pipeline, com etapas e cards arrastáveis. A aba Ligações possui links `tel:+55...` para abrir o discador do computador/celular conectado.
