# Mapa dos módulos JS

Este arquivo documenta a reorganização feita em `assets/js/`.

## O que mudou

- `assets/js/legacy/script-00.js` ... `script-27.js` foram **renomeados** (conteúdo
  100% preservado, byte a byte) para nomes descritivos dentro de
  `assets/js/modules/`.
- A **ordem de carregamento no `index.html` não mudou** — só os nomes dos
  arquivos. Isso elimina o risco de quebrar comportamento, já que cada script
  é uma IIFE com sua própria flag de guarda (`window.__algumaFlag`) e alguns
  dependem de código definido por scripts anteriores na mesma ordem.
- A pasta `assets/js/legacy/` foi removida (o conteúdo agora vive em `modules/`
  com nomes que dizem o que cada arquivo faz).

## Mapa completo (ordem de carregamento = ordem de execução)

| Nº | Arquivo novo | Área principal | Observação |
|----|---|---|---|
| 00 | `00-nucleo-dados-base.js` | Dados/seed (`DEFAULT_LEADS`) + base do app | Maior arquivo (120 KB); mistura várias áreas — candidato a divisão futura |
| 01 | `01-central-acoes-relatorios.js` | Central de ações, dashboard, relatório executivo, exportação | |
| 02 | `02-funil-lead-scoring.js` | Funil de vendas, pontuação/"smart" de leads | |
| 03 | `03-fix-chat-topbar.js` | Correção pontual do chat e da topbar | Patch pequeno |
| 04 | `04-metas-dashboard-ia-inicial.js` | Metas, widgets do dashboard, gerador de script com IA (1ª versão) | |
| 05 | `05-integracao-geral-v6.js` | Integração geral entre quase todas as áreas (v6) | Maior patch (72 KB) |
| 06 | `06-garimpo-leads.js` | Prospecção/garimpo de leads (busca, mock de resultados, exportação) | |
| 07 | `07-fix-visibilidade-topbar.js` | Correção de visibilidade da topbar | Patch pequeno |
| 08 | `08-modulo-ligacoes.js` | Discador, fila de chamadas, histórico de ligações | |
| 09 | `09-painel-widgets.js` | Painel inicial e widgets configuráveis | |
| 10 | `10-leads-tabela-colunas-v19.js` | Tabela de leads: colunas, filtros, ações em massa (v19) | |
| 11 | `11-pipeline-board-modais.js` | Board do pipeline (drag&drop, modal de motivo de perda, config de etapas) | |
| 12 | `12-pipeline-calendario-v23.js` | Pipeline: visão calendário/gantt (v23) | |
| 13 | `13-disable-funil-v25.js` | **Flag que desativa** uma versão antiga do funil (v25) | 2 linhas — código morto, ver nota abaixo |
| 14 | `14-disable-funil-v26.js` | **Flag que desativa** outra versão antiga do funil (v26) | 2 linhas — código morto, ver nota abaixo |
| 15 | `15-relatorio-perdas-funil-v27.js` | Relatório de perdas e funil (v27) | |
| 16 | `16-funil-toggle-visual-v28.js` | Alternância visual do funil (v28) | |
| 17 | `17-metas-modulo-v29.js` | Módulo de metas: alertas, evolução, ranking (v29) | |
| 18 | `18-metas-rotina-ligacoes-v30.js` | Ponte entre metas e rotina de ligações (v30) | |
| 19 | `19-fix-nav-metas.js` | Correção de navegação da tela de metas | Patch pequeno |
| 20 | `20-metas-central-controle-v32.js` | Central de controle de metas/blocos de agenda (v32) | |
| 21 | `21-navegacao-boot.js` | Boot/roteamento da navegação principal | |
| 22 | `22-playbook-builder-ia-v34.js` | Construtor de playbooks com IA (v34) | |
| 23 | `23-followups-modulo-core.js` | Núcleo do módulo de follow-ups/cadências | |
| 24 | `24-agenda-automacoes-v36.js` | Agenda + automações integradas (v36) | |
| 25 | `25-agenda-automacoes-ligacoes-v41.js` | Agenda, automações e ligações — limpeza estrutural (v41) | Maior integração depois do 05 |
| 26 | `26-layout-limpeza-codigo-v45.js` | Layout e limpeza de "código aparecendo na tela" (v45) | Relacionado ao `CHECKS.txt` |
| 27 | `27-configuracoes-v46.js` | Modal e barra lateral de configurações (v46) | |
| — | `crm-ui-profissional.js` | Camada mais nova (v47), fora da pasta `modules/` | Não renomeado — já tinha nome descritivo |

## Atualização — 2ª rodada de limpeza

### 1. SVGs repetidos (`index.html`)
O arquivo tinha 101 blocos `<svg>` inline, sendo 86 deles cópias exatas de
apenas 26 ícones. Criei um sprite (`<symbol>` escondido, logo após `<body>`)
com esses 26 ícones únicos e troquei as 86 cópias por `<svg ...><use
href="#ic-nome"></use></svg>` — os atributos de cada instância (cor, tamanho,
`stroke-width` etc.) continuam exatamente como estavam, só o desenho interno
passou a ser compartilhado. Ganho real de tamanho foi modesto (~1,7%, uns
1.6 KB) porque os ícones são pequenos, mas agora **cada ícone existe em um
único lugar** — trocar o desenho do ícone de "fechar", por exemplo, é editar
1 `<symbol>` em vez de caçar 15 cópias espalhadas pelo arquivo.

### 2. Fusão de módulos por domínio — o que descobri e o que fiz

Antes de fundir, rastreei como os arquivos se comunicam entre si e achei uma
**corrente de monkey-patch** na função `window.setView` (troca de tela):

- `00-nucleo-dados-base.js` cria `window.setView` pela primeira vez.
- `07-fix-visibilidade-topbar.js` guarda a versão anterior
  (`previousSetView = window.setView`) e cria uma nova versão que chama a
  antiga e adiciona comportamento.
- `08-modulo-ligacoes.js` faz o mesmo de novo, embrulhando a versão que
  `07` deixou.

Isso significa que a ordem **00 → 07 → 08** importa de verdade: se algum
desses três mudasse de posição, a topbar ou o módulo de ligações
provavelmente parariam de esconder/mostrar coisas corretamente. Padrão
parecido existe com `renderGarimpoLeadsV7` (definida em `06`, chamada por
`19` e `21`) e `renderCallCenterV9` (definida em `08`, chamada por `19` e
`21`) — a navegação central depende de funções definidas em módulos
"de domínio" que vêm depois dela na sequência atual.

**Por isso não reordenei nada.** Só fundi grupos de arquivos que já eram
**vizinhos na sequência original e do mesmo domínio** — isso reduz o número
de arquivos sem mudar a ordem de execução em nada (risco zero):

| Novo arquivo | Fundiu | Domínio |
|---|---|---|
| `11-pipeline-board-completo.js` | `11` + `12` | Pipeline (board + calendário) |
| `13-funil-legado-e-relatorios.js` | `13`+`14`+`15`+`16` | Funil (flags antigas + relatório de perdas + toggle visual) |
| `17-metas-modulo-completo.js` | `17`+`18`+`19`+`20` | Metas (v29 a v32) |
| `24-agenda-automacoes-completo.js` | `24` + `25` | Agenda + automações (v36 e v41) |

Resultado: **28 → 20 arquivos**, mesma ordem de execução, mesmo
comportamento. Os outros 16 arquivos não foram tocados porque não têm um
vizinho contíguo do mesmo domínio — fundi-los exigiria reordenar, e isso é
exatamente o que o encadeamento do `setView` torna arriscado.

### O que ficaria para uma etapa futura (mais arriscada)
Uma fusão completa em "um arquivo por domínio" (um único `agenda.js`, um
único `metas.js`, etc., juntando tudo que está espalhado e fora de ordem)
exigiria reescrever a corrente de `setView` e as chamadas de
`renderGarimpoLeadsV7`/`renderCallCenterV9` para não dependerem mais da
ordem de carregamento — ou seja, seria uma refatoração real de código, não
apenas reorganização de arquivos. Recomendo fazer isso com testes manuais
tela por tela, não em uma única tacada automática.

## Achados durante a análise (para próximos passos)

1. **`13-disable-funil-v25.js` e `14-disable-funil-v26.js`** têm 2 linhas cada e
   só setam uma flag `window.__crmFunilVXX_disabled = true`. São restos de
   versões desativadas. Dá pra manter (documentam histórico) ou remover se
   nada mais checar essas flags — vale um grep antes de apagar.
2. Os números de versão nos nomes (`v6`, `v19`, `v23`, `v25`... `v46`) mostram
   que o app foi construído como uma sequência de **patches incrementais**,
   não como módulos desenhados desde o início. Isso é normal em apps que
   crescem rápido, mas explica por que várias áreas (agenda, automações,
   metas) aparecem espalhadas em 3–4 arquivos diferentes ao longo do tempo.
3. Cada script é uma IIFE isolada com guarda própria — bom sinal, reduz risco
   de conflito global. Mas também significa que fundir esses arquivos em
   módulos "de verdade" por domínio (um único `agenda.js`, um único
   `metas.js` etc.) exige entender a ordem de dependência entre eles antes de
   juntar — não é uma tarefa mecânica, por isso não foi feita nesta etapa.
4. `assets/css/app.css` tem 224 KB — vale uma análise de CSS não utilizado
   como próximo passo (ferramentas como PurgeCSS ajudam nisso).
