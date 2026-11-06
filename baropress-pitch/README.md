# BAROPRESS — Pitch

Apresentação web em 12 cenas, com React, Motion, Tailwind CSS e Vite.

A apresentação mantém a abertura original BAROPRESS. A revisão das cenas 2–3 contextualiza a avaliação fisioterapêutica e apresenta a barreira de acesso sem citar concorrentes na introdução. As cenas 4–11 preservam o conteúdo e as composições anteriores; a cena 12 encerra com a primeira página real do artigo do projeto. Fontes, limites científicos e verificações estão em [Revisão narrativa](plans/REVISAO_NARRATIVA_2026-11-05.md).

Site: [baropress.vercel.app](https://baropress.vercel.app).

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

Projeto Vercel `baropress` conectado ao repositório `MontivalLucas/baropress`, com raiz `baropress-pitch`.
A integração GitHub do Vercel publica novos commits de `main` automaticamente.
Mudanças locais só chegam ao site depois de commit e push.

Os recursos de imagem ficam em `public/shots`. `dist` e `node_modules` não são versionados.
A revisão visual está em [plans/REVISAO_APRESENTACAO.md](plans/REVISAO_APRESENTACAO.md).
