# CRM v64 — Roteador único e Agenda profissional

## Correções aplicadas

- Corrigido o bug em que qualquer clique na lateral acabava abrindo o Garimpo.
- A aba Garimpo deixou de ser injetada por cima das outras abas da V60/V63.
- Criada uma camada final de navegação V64 com um único roteador para todas as abas.
- Todas as páginas antigas/sobrepostas passam a ser ocultadas quando outra aba é aberta.
- A lateral agora tem Garimpo como aba principal, integrada ao menu oficial, não como camada extra.
- A Agenda recebeu botão **Configurações da agenda** no topo.
- O painel de configurações da Agenda permite criar agendas, renomear, alterar cores, ativar/ocultar, excluir e escolher agenda padrão.
- O painel antigo inline de edição de agendas da V63 foi escondido para não poluir a tela nem parecer sobreposto.

## Arquivos principais adicionados

- `assets/js/modules/44-router-agenda-profissional-v64.js`
- `assets/css/crm-v64-router-agenda-profissional.css`

## Arquivo ajustado

- `assets/js/modules/43-garimpo-ligacoes-agenda-automacoes-v63.js`
  - A injeção antiga da aba Garimpo foi neutralizada para impedir sobreposição/captura de clique.

## Observação

Esta versão mantém as funções da V63, mas coloca a V64 como camada final responsável pela navegação e pela agenda profissional.
