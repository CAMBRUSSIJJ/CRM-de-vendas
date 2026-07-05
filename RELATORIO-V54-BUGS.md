# Relatório V54 — bugs encontrados e correção estrutural

## Diagnóstico

Foi encontrada sobreposição de camadas antigas nas mesmas áreas:

1. **Agenda**
   - A agenda original existe no `index.html`.
   - O módulo `24-agenda-automacoes-completo.js` também renderiza uma agenda própria.
   - O módulo `31-agenda-ligacoes-playbook-automacoes.js` adiciona outra camada com comando, kanban e drawers.
   - Os módulos `32-sidebar-calendar-ligacoes.js` e `33-sidebar-agenda-ligacoes-v53.js` adicionavam mais calendários (`v52CalendarApp` e `v53CalendarApp`).
   - Resultado: o calendário novo podia ser criado, mas outra camada antiga sobrescrevia ou escondia a tela logo depois.

2. **Ligações**
   - A aba real de ligações é criada por `08-modulo-ligacoes.js` com `#callTable`.
   - A correção anterior procurava `#callTableV36`, que não é a tabela real dessa versão.
   - Resultado: os telefones não viravam link clicável na tela usada pelo CRM.

3. **Sidebar**
   - Havia três tentativas de recolhimento ao mesmo tempo: v51, v52 e v53.
   - As setas/chevrons de sub-abas vinham de camadas antigas e ficavam visualmente ruins.
   - Resultado: a lateral parecia travada, com controles duplicados e aparência pouco profissional.

## Correção aplicada

A V54 não tenta mais remendar a mesma página por cima. Ela cria uma camada oficial estável para Agenda e Ligações, fora das áreas antigas, e oculta a versão antiga apenas quando a aba está ativa.

### Arquivos novos

- `assets/css/crm-v54-correcao-estrutural.css`
- `assets/js/modules/34-correcao-estrutural-agenda-ligacoes-sidebar.js`

### Arquivos desativados no `index.html`

Foram removidas as chamadas dos overlays que estavam conflitando:

- `assets/css/crm-v52-sidebar-calendar-calls.css`
- `assets/css/crm-v53-sidebar-agenda-ligacoes.css`
- `assets/js/modules/32-sidebar-calendar-ligacoes.js`
- `assets/js/modules/33-sidebar-agenda-ligacoes-v53.js`

Os arquivos continuam no projeto completo, mas não são carregados.

## Resultado esperado

- Sidebar recolhe/expande com um grip discreto, sem setas.
- Sub-abas aparecem quando a lateral está aberta e somem quando recolhida.
- Agenda tem visual oficial com Mês, Dia, Ano e Lista.
- Clique no dia/horário abre painel lateral para criar compromisso.
- Clique em evento abre edição no painel lateral.
- Ligações têm uma central oficial com telefones clicáveis em `tel:+55...`.
- A versão antiga de Agenda/Ligações fica escondida quando a nova está ativa, evitando página sobreposta.
