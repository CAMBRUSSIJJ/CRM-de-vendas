# CRM Modular v48 — paleta aplicada

Esta versão organiza o CRM em arquivos por domínio, mantendo tudo client-side e usando `localStorage` centralizado. Não inclui Supabase/Firebase e não usa Vite/build, conforme solicitado.

## O que foi feito

1. **Modularização real dos scripts**
   - `src/modules/leads.js`
   - `src/modules/pipeline.js`
   - `src/modules/followups.js`
   - `src/modules/agenda.js`
   - `src/modules/automacoes.js`
   - `src/modules/metricas.js`
   - `src/modules/metas.js`
   - `src/modules/playbook.js`
   - `src/modules/configuracoes.js`

2. **Persistência centralizada**
   - `src/core/storage.js` concentra leitura, salvamento e migração de dados.
   - Ele tenta importar dados antigos dos nomes usados no CRM legado:
     - `outbounder_leads_v5`
     - `outbounder_agenda_v1`
     - `outbounder_notes`
     - `outbounder_automations_v1`
     - `crm_v47_ui_prefs`

3. **Ícones reaproveitáveis**
   - `src/assets/icons.js` concentra os SVGs.
   - Os módulos chamam `icon('nome')`, em vez de repetir SVG por todo HTML.

4. **Botões robustos**
   - `src/ui/buttons.js` corrige botões vazios e adiciona texto/`aria-label` quando necessário.
   - Isso evita botão mudo se algum script falhar.

5. **HTML separado por páginas/componentes**
   - `pages/*.html` guarda a estrutura visual de cada aba.
   - `src/ui/page-loader.js` carrega cada página sob demanda.

## Como abrir

Como o navegador bloqueia `fetch()` em alguns casos quando você abre direto pelo arquivo, use um servidor local simples.

No terminal, dentro da pasta deste projeto:

```bash
python -m http.server 5500
```

Depois abra:

```txt
http://localhost:5500
```

Também funciona com Live Server do VS Code ou GitHub Pages.

## Como encaixar no seu projeto atual

- Use essa estrutura como base organizada.
- Vá movendo as funções do HTML legado para os módulos corretos.
- Sempre que algum módulo precisar salvar dados, use `storage.js`; não grave direto no `localStorage`.
- Não precisa mexer em Supabase/Firebase agora.
- Não precisa instalar Vite agora.

## Ordem ideal de migração do CRM legado

1. Mover dados e funções globais para `src/core/storage.js`.
2. Mover lógica de leads para `src/modules/leads.js`.
3. Mover pipeline/funil para `src/modules/pipeline.js`.
4. Mover follow-ups para `src/modules/followups.js`.
5. Mover agenda e automações para seus módulos.
6. Deixar métricas apenas lendo dados centralizados.

## Paleta aplicada no layout

Esta versão usa a paleta informada:

- Verde profundo: `#04342C`
- Verde destaque: `#1D9E75`
- Creme de fundo: `#F1EFE8`
- Texto/carvão: `#2C2C2A`

As cores foram centralizadas em `styles/base.css` como variáveis CSS para facilitar futuras alterações.
