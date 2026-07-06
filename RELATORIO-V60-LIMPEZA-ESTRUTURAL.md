# Relatório V60 — Limpeza estrutural e estabilização do Garimpo

## O que foi encontrado nesta base

O ZIP recebido é a base `v59_emergency`. Nesta versão **não existem** os arquivos/pastas citados no diagnóstico externo:

- não existe `assets/js/modules/42-garimpo-temas-v62.js`;
- não existem as pastas `src/` e `pages/`;
- não existe `assets/js/legacy/`.

Por isso, a correção foi aplicada no problema equivalente que realmente existia neste ZIP: o Garimpo ainda estava como módulo v7 antigo, com chave de dados antiga e com observador de DOM próprio.

## Correções aplicadas

### 1. Garimpo estabilizado

Arquivo alterado:

- `assets/js/modules/06-garimpo-leads.js`

Mudanças:

- removido o `MutationObserver` do Garimpo v7;
- removido o re-render automático quando a classe da tela mudava;
- criada função oficial `window.renderGarimpoLeads`;
- mantidos aliases seguros `window.renderGarimpoLeadsV7` e `window.renderGarimpoLeadsV60` para compatibilidade com módulos antigos;
- migradas as chaves de `localStorage`:
  - de `outbounder_garimpo_leads_v7` para `outbounder_garimpo_leads_v62`;
  - de `outbounder_garimpo_config_v7` para `outbounder_garimpo_config_v62`;
- adicionada proteção para não executar este módulo se uma implementação oficial v62 real estiver presente no futuro.

### 2. Garimpo voltou para a navegação principal

Arquivo alterado:

- `assets/js/modules/37-limpeza-estrutural-layout-definitivo-v57.js`

Mudanças:

- adicionada a entrada `Garimpo` na sidebar reconstruída pela camada v57;
- corrigido o atalho de `Funil` para apontar para a aba real `funil`, não para `dashboard`.

### 3. Funil passa a existir antes do clique

Arquivo alterado:

- `assets/js/modules/13-funil-legado-e-relatorios.js`

Mudança:

- a seção `#funil` agora é criada no boot do módulo, evitando que o roteador caia para a tela inicial quando a pessoa clica em Funil antes da seção existir.

### 4. Navegação antiga v45 deixou de disputar clique

Arquivo alterado:

- `assets/js/modules/26-layout-limpeza-codigo-v45.js`

Mudanças:

- o módulo v45 continua oferecendo painel de layout e limpeza visual;
- ele não registra mais um roteador paralelo para `[data-view]`;
- ele não força mais aba inicial usando a chave antiga `crm_v45_current_view`.

### 5. Scripts e CSS órfãos removidos

Foram removidos arquivos que não eram carregados pelo `index.html` e não tinham import dinâmico. A lista completa está em:

- `REMOVIDOS-V60.txt`

Resumo da limpeza:

- módulos JS: de 32 para 18;
- CSS: de 14 para 5;
- total de arquivos: de 58 para 36;
- tamanho aproximado: de 1,56 MB para 1,05 MB.

## Validações feitas

- Todos os arquivos JS restantes passaram em `node --check`.
- Todas as referências `<script src="...">` e `<link href="...">` do `index.html` apontam para arquivos existentes.
- Não restou referência no `index.html` para os módulos/CSS removidos.
- O arquivo de Garimpo não possui mais `MutationObserver` funcional.

## Observação importante

Como o ZIP enviado não continha a versão v62 real (`42-garimpo-temas-v62.js`), esta V60 não tenta inventar esse arquivo. Ela estabiliza a base recebida e deixa o Garimpo preparado para conviver com uma implementação v62 futura sem duplicar renderização.
