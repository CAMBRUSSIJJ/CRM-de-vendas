# CRM V61 — Sidebar profissional e configurações unificadas

## Objetivo
Melhorar a aba lateral sem empilhar uma nova camada por cima. A versão V61 substitui os controles antigos de sidebar/configurações por uma única implementação.

## O que foi alterado
- Removido o CSS emergencial `crm-v59-emergencia-carregamento.css`.
- Removido o JS emergencial `39-emergencia-carregamento-sidebar-v59.js`.
- Removido o módulo antigo de configurações `27-configuracoes-v46.js`.
- Criado `crm-v61-sidebar-configuracoes.css` como única camada visual da lateral e do modal de configurações.
- Criado `27-configuracoes-v61.js` com personalização de layout, cores, tema, densidade, filtros fixos, modo leve, badges, tooltips e abas visíveis.
- Criado `39-sidebar-profissional-v61.js` para reconstruir a lateral com ícones SVG profissionais e sem MutationObserver renderizando a navegação.
- O painel antigo `Layout` da v45 foi desativado visualmente para não duplicar a nova central de configurações. O motor de classes continua disponível para compatibilidade.
- O bloco de CSS de sidebar da v57 foi removido do arquivo v57, deixando a v57 apenas com componentes de páginas.

## Novas opções em Configurações
- Lateral automática, fixa, compacta ou somente ícones.
- Cores por presets e cor personalizada.
- Tom da lateral: escuro, gradiente, claro ou minimalista.
- Tema claro/escuro.
- Densidade confortável ou compacta.
- Mostrar/ocultar abas da lateral.
- Presets rápidos: Mostrar tudo, Só essenciais, Operação comercial.
- Modo leve, reduzir animações, centralizar área e filtros fixos.

## Cuidados de compatibilidade
- O alias `window.crmV46Settings` aponta para `window.crmV61Settings`, evitando quebra caso algum script antigo chame a configuração anterior.
- A navegação continua usando `window.setView`, então as abas existentes seguem funcionando.
- As abas escondidas não são apagadas; apenas deixam de aparecer na navegação.
