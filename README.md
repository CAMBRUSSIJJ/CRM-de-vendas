# CRM V98.1 — Modularização Estrutural

Esta versão preserva o comportamento da V98, mas separa o sistema em arquivos físicos por responsabilidade.

## Uso direto

Abra `index.html` no Chrome ou Edge dentro da pasta extraída. No Windows, também pode usar `ABRIR-CRM.bat`.

A pasta `standalone` contém uma versão HTML única para conferência e backup.

## Desenvolvimento

```bash
npm install
npm run dev
```

Para gerar a versão de produção:

```bash
npm run build
```

A saída pronta para publicação fica em `dist/`.

## Estrutura

- `src/core`: inicialização, dados-base, eventos, estado, roteamento e renderizadores oficiais.
- `src/modules`: Pipeline, Follow-ups, Agenda, Metas, Automação, notificações e demais áreas.
- `src/data`: armazenamento local e interface `CRMStore`, preparada para adaptação ao Supabase.
- `src/navigation`: mapa e personalização da navegação.
- `src/settings`: configurações e personalização.
- `src/stability`: proteções contra sobreposição, loading infinito e disputas de renderização.
- `src/styles`: CSS separado por núcleo, módulos, navegação, configurações e estabilidade.
- `dist`: versão compilada pronta para hospedagem.
- `standalone`: HTML único da V98.1.
- `backup`: HTML único da V98 anterior preservado.

## Dados

As mesmas chaves do `localStorage` foram mantidas. A modularização não exige migração e não apaga a base existente.
