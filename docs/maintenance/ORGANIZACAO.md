# Organização e manutenção do BAROPRESS

Revisão conservadora de 20/10/2026, versão 0.2.14. Este índice organiza a navegação pelo projeto; os caminhos funcionais permanecem nos locais existentes.

| Caminho | Responsabilidade | Regra de manutenção |
| --- | --- | --- |
| `src/App.tsx`, `src/main.tsx`, `src/pages/`, `src/components/` | Entrada React, navegação, telas e controles compartilhados | Preservar nomes de telas, carregamento sob demanda e acessibilidade. |
| `src/features/` | Aquisição, agenda, autenticação, backup, baropodometria, calibração, comparação, exames, logs, pacientes, questionários e relatórios | Recursos em uso; nenhum módulo órfão foi identificado no grafo de imports. |
| `src/services/`, `src/stores/`, `src/types/` | Comunicação Tauri, aquisição, cálculos, estado e contratos | Preservar contratos, unidades, formatos persistidos e fronteira `services/database/api.ts`. |
| `src/tests/` | 28 arquivos de testes frontend | Executar `npm test`; testes não são arquivos mortos. |
| `src-tauri/src/` | Comandos Rust, autorização, serial e SQLite | 65 comandos registrados com chamadas frontend; manter o registro e a autorização. |
| `src-tauri/migrations/` | Nove migrações SQLite em ordem | Não renomear, reordenar, editar ou excluir migrações existentes. |
| `src-tauri/capabilities/`, `icons/`, `bin_deps/`, `installerHooks.nsh` | Permissões, ícones e suporte ao instalador | DLLs repetidas em `entrega/` cumprem outro papel; preservar ambas as cópias. |
| `scripts/` | Verificações, benchmarks, atualização de versão e prévias com dados sintéticos | Uso manual não aparece necessariamente nos scripts do `package.json`. |
| `docs/` | Arquitetura, métodos, auditorias, correções, evidências e manutenção | Relatórios antigos descrevem versões históricas; conferir a data e a versão. |
| `Sprint/` | Planejamento, histórico, treinamento e documentação de TCC | Duplicações podem ser entregas ou evidências históricas; preservar sem decisão editorial explícita. |
| `entrega/` | Instalador, aplicativo com DLLs e apresentações distribuíveis | Preservar os pacotes existentes; uma compilação não implica instalação ou publicação. |
| `baropress-liquid-glass/` | Protótipo visual independente, documentado e verificável | Não está no aplicativo React, mas tem uso próprio; preservar. |
| `.evento-build/` | Fontes, imagens de origem, candidatos e renders das apresentações | `build.mjs` e `modern.mjs` geram materiais; `verify*.mjs` gera imagens `final-*`. Remover somente outputs idênticos com snapshot e prova de que não são entradas. |
| `dist/`, `src-tauri/target/`, `src-tauri/gen/`, `node_modules/` | Artefatos de build, esquemas e dependências | Não confundir com código próprio; esta auditoria preservou caches e dependências instaladas. Builds podem regenerar `dist/`, `target/` e `gen/`. |

## Verificação de regressão

Na raiz do projeto:

```powershell
npm run typecheck
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml --offline --locked
npm run tauri:build -- --ci --bundles nsis -- --offline --locked
node scripts/check_project.cjs
```

Executar os builds frontend e Tauri em sequência: ambos escrevem em `dist/`. Os testes Rust usam bases em memória ou temporárias; não abrir o aplicativo de produção para esta verificação.

## Critério de limpeza

Ausência de import direto não prova inutilidade: CLI, tipos React, PostCSS, Tailwind e hooks do instalador têm uso indireto. Igualdade de bytes também não prova que dois caminhos são intercambiáveis. A auditoria de 20/10/2026 preservou funções, exports públicos, migrações, dependências e fluxos; removeu apenas 19 renders temporários duplicados (1.246.717 bytes), mantendo suas cópias canônicas e o snapshot externo.

Consulte `AUDITORIA_2026-10-20.md` nesta pasta para resultados, limitações, lista de arquivos e restauração. O snapshot externo tem manifesto SHA-256 e não inclui `node_modules/`, `.evento-build/node_modules/` nem `src-tauri/target/`.
