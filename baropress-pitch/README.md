# BAROPRESS — Pitch

Apresentação web em 11 cenas, com React, Motion, Tailwind CSS e Vite.

## Desenvolvimento

```sh
cd baropress-pitch
npm ci
npm run dev
```

## Publicação no Vercel

Importar `MontivalLucas/baropress` e usar `baropress-pitch` como **Root Directory**.
Framework: **Vite**. Build: `npm run build`. Saída: `dist`.
Branch de produção: `main`. Nome solicitado do projeto: `baropress`.

A integração GitHub do Vercel publica novos commits de `main` automaticamente.
Mudanças locais só chegam ao site depois de commit e push.

Os recursos de imagem ficam em `public/shots`. `dist` e `node_modules` não são versionados.
A revisão visual está em [plans/REVISAO_APRESENTACAO.md](plans/REVISAO_APRESENTACAO.md).
