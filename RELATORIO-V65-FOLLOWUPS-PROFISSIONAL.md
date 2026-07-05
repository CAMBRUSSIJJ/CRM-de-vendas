# Relatório V65 — Follow-ups profissional

## Objetivo
Transformar a aba de Follow-ups em uma central diária de acompanhamento comercial, corrigindo textos com aparência provisória e mantendo a navegação estável da versão anterior.

## Arquivos adicionados
- `assets/js/modules/45-followups-central-profissional-v65.js`
- `assets/css/crm-v65-followups-profissional.css`

## Ajustes no `index.html`
- Inclusão do CSS da V65.
- Inclusão do módulo JS da V65 após o roteador principal.
- Limpeza de comentários e textos antigos com aparência de rascunho.

## Melhorias adicionadas na aba Follow-ups
- Cabeçalho profissional com ações rápidas.
- Indicadores de rotina: atrasados, vencem hoje, sem contato +7 dias, tentativas hoje, taxa de resposta e reuniões geradas.
- Filtros por texto, prioridade, responsável, etapa, vencimento e tipo de ação.
- Visualizações salvas e filtros rápidos.
- Visualização em lista com fila inteligente.
- Visualização em Kanban.
- Visualização em calendário de 14 dias.
- Modo execução com script sugerido.
- Modelos de cadência: Lead novo, Pós-reunião e Reativação.
- Criador simples de regras de automação.
- Métricas por responsável e etapa de follow-up.
- Painel lateral do lead com histórico, próximo passo, reagendamento com data escolhida, script e aplicação de cadência.
- Atalhos de teclado: L para ligar, N para próximo lead, A para atendeu e X para não atendeu.

## Correções de bugs e polimento
- A aba Follow-ups agora substitui o conteúdo antigo em vez de ficar sobreposta.
- A navegação principal continua usando o roteador único da versão anterior.
- Textos como “IA local” foram substituídos por termos mais profissionais, como “assistente de scripts” e “gerador de scripts”.
- O contador de tentativas na central de Follow-ups não duplica tentativa quando o usuário liga e depois registra “não atendeu”.
- A seleção de leads no calendário de Follow-ups foi corrigida.

## Validações feitas
- Conferência de links CSS/JS referenciados no `index.html`.
- Verificação de sintaxe JavaScript com `node --check` nos módulos carregados pela página.
