# CRM v63 — Garimpo, Ligações, Agenda e Automações

## O que foi corrigido/adicionado

### Garimpo
- Garimpo agora aparece como aba principal na sidebar compacta, não apenas como subitem escondido.
- Mantida a página de Garimpo da v62 com busca assistida, importação/colagem e envio ao CRM.
- Incluído reforço por MutationObserver para a aba continuar aparecendo mesmo quando a sidebar antiga for reconstruída por outros módulos.

### Ligações
- Criada página completa de Ligações carregada pela navegação atual.
- Contador real de tentativas baseado no histórico de atividades do lead.
- Ao abrir o discador, o CRM registra a tentativa correta: Tentativa 1, 2, 3 etc.
- Ao registrar resultado, a tentativa aberta é atualizada em vez de sempre gravar “Tentativa 2”.
- Painel lateral mostra histórico de ligações do lead selecionado.
- Adicionados filtros por texto, prioridade, responsável e “vence hoje”.
- Reagendamento agora permite escolher uma data em campo de calendário.
- Adicionados atalhos de teclado na aba Ligações: L para ligar, N para próximo, A para atendeu e X para não atendeu.

### Agenda
- Agenda oficial agora aceita agendas personalizadas.
- É possível criar, renomear, ativar/desativar e escolher cores das agendas.
- O formulário de compromisso agora possui cor do compromisso.
- Os compromissos passam a respeitar a cor escolhida no evento ou a cor da agenda.

### Automações
- Criada central de automações avançadas com abas: Modelos prontos, Criador visual, Regras salvas e Histórico.
- Novos gatilhos: follow-up vence hoje, resultado de ligação, lead em etapa, prioridade, lead sem telefone e lead criado hoje.
- Novas condições: sem atividade há X dias, valor acima de X e responsável específico.
- Novas ações: criar compromisso, definir follow-up, adicionar nota, definir prioridade, mover etapa e trocar responsável.
- Botão “Executar agora” para aplicar regras aos leads atuais e registrar histórico de execução.

## Arquivos adicionados
- `assets/js/modules/43-garimpo-ligacoes-agenda-automacoes-v63.js`
- `assets/css/crm-v63-garimpo-ligacoes-agenda-automacoes.css`

## Arquivos alterados
- `index.html`
- `assets/js/modules/41-agenda-oficial-google-v61.js`
