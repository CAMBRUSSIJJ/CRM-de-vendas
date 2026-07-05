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
