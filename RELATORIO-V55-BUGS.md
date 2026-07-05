# Relatório v55 — correção de Agenda, Follow-ups, Ligações e Sidebar

## Bugs encontrados

1. **Agenda sobreposta**
   - Havia mais de uma camada tentando controlar a aba Agenda.
   - A versão v41 ainda podia renderizar a agenda antiga depois da agenda nova.
   - A versão v54 criava um aplicativo externo `#v54AgendaApp`, em vez de substituir diretamente a aba `#agenda`, o que podia fazer parecer que nada tinha mudado dependendo da navegação.

2. **Botão de criar evento sem efeito visual correto**
   - O botão novo abria uma lógica separada, mas a agenda antiga podia voltar por cima.
   - Na v55, o botão `+ Criar evento` abre um painel lateral próprio e salva direto em `outbounder_agenda_v1`.

3. **Clique no dia do calendário não estava confiável**
   - A versão anterior dependia de uma camada fora da aba Agenda.
   - Na v55, o clique no quadradinho do dia e no horário do modo Dia abre o painel de criação com data/hora preenchidas.

4. **Ligações não apareciam sempre como clicáveis**
   - Algumas versões procuravam tabelas diferentes (`callTable`, `callTableV36`) e podiam errar a tela ativa.
   - Na v55, a aba `#ligacoes` é renderizada oficialmente e todos os telefones válidos viram `tel:+55...`.

5. **Follow-ups não tinham o mesmo raciocínio visual do Pipeline**
   - Existiam listas e pequenos blocos, mas não uma estrutura única tipo kanban/pipeline.
   - Na v55, Follow-ups virou um board com colunas por etapa, cards arrastáveis e seleção de etapa por lead.

6. **Sidebar com setas e controles acumulados**
   - Havia controles de recolher de versões anteriores e setas/chevrons de sub-abas.
   - Na v55, o recolhimento usa um controle discreto em formato de linhas e um handle lateral com pontos, sem setas.

## O que foi alterado

- Removido o carregamento de:
  - `assets/js/modules/24-agenda-automacoes-completo.js`
  - `assets/js/modules/34-correcao-estrutural-agenda-ligacoes-sidebar.js`
  - `assets/css/crm-v54-correcao-estrutural.css`

- Adicionado o carregamento de:
  - `assets/css/crm-v55-agenda-followups-ligacoes-sidebar.css`
  - `assets/js/modules/35-agenda-followups-ligacoes-sidebar-v55.js`

## Principais melhorias

- Agenda com visualizações: **Mês, Dia, Ano e Lista**.
- Clique no dia/horário para criar evento.
- Botão `+ Criar evento` funcional.
- Mini calendário lateral.
- Camadas de agenda e tipos de evento personalizáveis.
- Densidade confortável/compacta.
- Ligações com números clicáveis usando `tel:+55...`.
- Follow-ups em layout de pipeline/kanban.
- Cards de follow-up arrastáveis entre etapas.
- Sidebar recolhível sem setas, com animação mais suave.
