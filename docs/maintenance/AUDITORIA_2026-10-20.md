# BAROPRESS — Auditoria, limpeza e organização

Data: **20/10/2026**. Versão: **0.2.14**. Execução local efetiva, sem instalação ou publicação.

Projeto: `C:\Users\Montival Nunes\Desktop\teste arduino\NOVO PROGRAMA\baropress-fase1\baropress`.

## Resultado

Removidos **19 renders temporários duplicados**, totalizando **1,246,717 bytes** (aproximadamente 1,19 MiB). Foram mantidas cópias canônicas com SHA-256 idêntico. Nenhuma função, tela, import, dependência, contrato, comando Rust ou migração foi removido ou alterado.

A organização foi feita por um índice de responsabilidades em `docs/maintenance/ORGANIZACAO.md` e um link ao fim do `README.md`. Não houve mudança dos caminhos funcionais: ela não se justificava diante dos contratos, scripts e materiais úteis encontrados.

## Contexto e método

O projeto foi localizado entre os projetos locais cadastrados. A pasta não contém repositório Git; por isso não há branch ou commit de segurança. A conversa anterior foi consultada, mas o texto do plano não estava recuperável: havia somente o pedido e um marcador de conteúdo. Esta execução seguiu os critérios explícitos do pedido atual.

Não foram encontrados arquivos `AGENTS.md` no projeto nem nos diretórios ancestrais conferidos. Nenhum agente auxiliar foi utilizado.

O trabalho ocorreu em etapas: inventário e snapshot; baseline; análise de referências e duplicações; remoção com pré-validação de todos os alvos; índice documental; regressão e conferência de hashes. O script de remoção recusaria executar sem sucesso nos testes e builds de baseline.

Foi feito inventário por caminho, tamanho e hash de todos os arquivos próprios e materiais, incluindo pastas ocultas. A análise AST percorreu arquivos JS/TS, imports estáticos e dinâmicos literais, reexports e require. Foram conferidos os módulos Rust, comandos registrados, chamadas frontend, dependências, migrações e configurações do instalador. Isso é auditoria estática com compilação e testes; não constitui revisão manual linha a linha de todos os documentos ou execução de todos os fluxos gráficos.

## Ponto de segurança

- Snapshot: `BAROPRESS-snapshot-antes-2026-10-20.zip`.
- Arquivos arquivados: **672**, total de **85,037,827 bytes**.
- Tamanho do ZIP: **52,648,228 bytes**.
- SHA-256 do ZIP: `7afb34ba6f64abb611b8d04b0f6f100135ea7d3868315d6c6afb2114a002f162`.
- Todos os arquivos do ZIP foram lidos novamente e comparados com seu hash; a integridade CRC também foi conferida.
- Exclusões explícitas: `node_modules/`, `.evento-build/node_modules/` e `src-tauri/target/`. São dependências instaladas e cache/build Rust; não foram apagados.
- O snapshot inclui fontes, locks, configurações, `dist/` inicial, esquemas gerados, ícones, DLLs, documentação, apresentações, scripts e pacotes existentes em `entrega/`.
- Não é backup do banco clínico em AppData. O aplicativo não foi iniciado e esse banco não foi acessado por esta auditoria.

O ZIP, manifesto e logs estão na pasta externa de outputs desta conversa:
`C:\Users\Montival Nunes\Documents\Codex\2026-10-20\referenced-chatgpt-conversation-this-is-an\outputs`.

## Cobertura das pastas

| Pasta | Arquivos no snapshot | Bytes | Tratamento |
| --- | ---: | ---: | --- |
| `(root)` | 10 | 143,204 | Configurações e locks preservados; README recebeu apenas um bloco final com links. |
| `.evento-build` | 101 | 9,280,650 | Scripts, inputs, imagens diferentes e candidatos preservados; 19 renders finais idênticos removidos. |
| `baropress-liquid-glass` | 10 | 135,099 | Protótipo independente preservado; 27 verificações de lógica passaram. |
| `dist` | 35 | 1,435,993 | Build regenerado; os 35 arquivos finais têm hashes idênticos ao baseline e ao estado inicial. |
| `docs` | 117 | 22,206,801 | Histórico preservado; índice e relatório desta auditoria acrescentados em maintenance/. |
| `entrega` | 14 | 24,197,885 | Instalador, executável, DLLs e apresentações distribuídas preservados byte a byte. |
| `scripts` | 17 | 36,564 | Verificadores, previews, benchmarks e ferramentas manuais preservados. |
| `Sprint` | 133 | 25,214,225 | Planejamento, documentação, evidências, logs e entregas históricas preservados. |
| `src` | 142 | 802,642 | 142 arquivos, incluindo CSS; todos preservados byte a byte. |
| `src-tauri` | 93 | 1,584,764 | Fontes, migrações, configurações, ícones, DLLs e esquemas preservados byte a byte; target excluído do inventário. |

## Código, imports e dependências

- **141 arquivos TS/TSX**: **113** alcançados a partir da entrada React e **28** arquivos de testes. Nenhum módulo TS/TSX órfão foi identificado.
- Imports dinâmicos das telas e barrels/reexports foram considerados. Os dois imports não literais encontrados estão nos geradores de apresentações e carregam ferramentas externas de geração; foram preservados.
- TypeScript com `noUnusedLocals` e `noUnusedParameters` passou antes e depois. Não houve import local sem uso reportado pelo compilador. Exports públicos não foram tratados como mortos pela simples ausência de uso local.
- **20 arquivos Rust** em `src-tauri/src/`; **65 comandos registrados**. Todos possuem chamadas frontend literais correspondentes, e nenhuma chamada identificada ficou sem handler.
- As nove migrações SQL são incluídas por `db.rs`. Ordem, nomes e conteúdo permaneceram idênticos.
- Nenhuma dependência foi removida: as sete de produção têm imports efetivos; as dez de desenvolvimento são usadas por código, tipos, CLI ou configuração. As oito entradas de dependências/build Rust têm referências nas fontes/build.rs.
- `npm ls --depth=0` terminou com código 0. Não houve instalação, atualização de versão ou edição de lockfiles.

| Dependência frontend | Evidência de uso |
| --- | --- |
| `@tauri-apps/api` | `src/components/NavigationProtection.tsx`, `src/services/acquisition/SerialSensorDevice.ts` |
| `clsx` | `src/App.tsx`, `src/components/Sidebar.tsx` |
| `jspdf` | `src/features/reports/reportPdfGenerator.ts` |
| `lucide-react` | `src/components/Sidebar.tsx`, `src/features/acquisition/ArduinoSettings.tsx` |
| `react` | `scripts/barosys-preview.tsx`, `scripts/calibration-preview.tsx` |
| `react-dom` | `scripts/acquisition-preview.tsx`, `scripts/barosys-preview.tsx` |
| `zustand` | `src/features/calibration/CalibrationPage.tsx`, `src/features/calibration/PhysicalResults.tsx` |
| `@tauri-apps/cli` | package.json scripts tauri |
| `@types/react` | TypeScript JSX/React type resolution |
| `@types/react-dom` | TypeScript react-dom type resolution |
| `@vitejs/plugin-react` | `vite.config.ts` |
| `autoprefixer` | postcss.config.js |
| `postcss` | Vite/PostCSS integration |
| `tailwindcss` | postcss.config.js; tailwind.config.js |
| `typescript` | `scripts/audit_inventory.cjs`, `scripts/benchmark_barosys.cjs` |
| `vite` | `vite.config.ts` |
| `vitest` | `src/tests/acquisition.test.ts`, `src/tests/agenda.test.ts` |

## Arquivos removidos

São outputs de `verify.mjs`/`verify-modern.mjs`: esses scripts escrevem os arquivos `final-*`, sem lê-los como entrada. Os geradores e HTMLs finais usam outras imagens ou dados embutidos. As cópias canônicas abaixo permanecem no projeto; os originais removidos também permanecem no snapshot.

| Arquivo removido | Cópia idêntica mantida | Bytes |
| --- | --- | ---: |
| `.evento-build/final-estudo-1.png` | `.evento-build/hall-1.png` | 121,856 |
| `.evento-build/final-estudo-2.png` | `.evento-build/hall-2.png` | 40,348 |
| `.evento-build/final-estudo-3.png` | `.evento-build/hall-3.png` | 36,886 |
| `.evento-build/final-estudo-4.png` | `.evento-build/hall-4.png` | 47,107 |
| `.evento-build/final-estudo-5.png` | `.evento-build/hall-5.png` | 75,887 |
| `.evento-build/final-estudo-6.png` | `.evento-build/hall-6.png` | 50,676 |
| `.evento-build/final-estudo-7.png` | `.evento-build/hall-7.png` | 45,408 |
| `.evento-build/final-estudo-8.png` | `.evento-build/hall-8.png` | 40,315 |
| `.evento-build/final-hall-1.png` | `.evento-build/hall-1.png` | 121,856 |
| `.evento-build/final-hall-2.png` | `.evento-build/hall-2.png` | 40,348 |
| `.evento-build/final-hall-3.png` | `.evento-build/hall-3.png` | 36,886 |
| `.evento-build/final-hall-4.png` | `.evento-build/hall-4.png` | 47,107 |
| `.evento-build/final-hall-5.png` | `.evento-build/hall-5.png` | 75,887 |
| `.evento-build/final-hall-6.png` | `.evento-build/hall-6.png` | 50,676 |
| `.evento-build/final-hall-7.png` | `.evento-build/hall-7.png` | 45,408 |
| `.evento-build/final-hall-8.png` | `.evento-build/hall-8.png` | 40,315 |
| `.evento-build/modern-final-hall-1.png` | `.evento-build/modern-hall-1.png` | 160,874 |
| `.evento-build/modern-final-hall-2.png` | `.evento-build/modern-hall-2.png` | 80,513 |
| `.evento-build/modern-final-hall-3.png` | `.evento-build/modern-hall-3.png` | 88,364 |

## Duplicações e candidatos preservados

O inventário encontrou **52 grupos de arquivos idênticos**. Igualdade de bytes não prova que dois caminhos podem ser eliminados. A lista completa está em `inventory.json`.

- `modern-final-hall-4.png`, `-5.png` e `-6.png` diferem das imagens canônicas; a seleção automática os recusou e eles foram preservados.
- DLLs em `src-tauri/bin_deps/` e `entrega/BAROPRESS_0.2.14/`: necessárias em contextos de instalação e distribuição diferentes; o hook NSIS referencia as primeiras.
- Ícones iOS e esquemas desktop/Windows: nomes de plataforma e geração próprios, preservados.
- DOCX, planos e registros de Sprint, evidências QA, candidatos PPTX e documentos de rollback: mantidos por rastreabilidade e uso manual.
- Protótipo `baropress-liquid-glass/`: tem README, lógica, assets e verificador próprios, além de referência na documentação. Ausência do bundle principal não o torna descartável.
- Scripts de benchmark, previews e auditoria: mantidos como ferramentas manuais. Não foram retirados por não constarem em scripts npm.
- Arquivos históricos e README contêm referências a versões antigas. Foram preservados; o novo índice orienta conferir data e versão. Não foram feitas correções funcionais ou editoriais amplas sem prova de necessidade.

## Testes e builds executados

| Verificação | Baseline | Após limpeza | Resultado |
| --- | ---: | ---: | --- |
| `npm.cmd run typecheck` | 21.85 s; saída 0 | 40.35 s; saída 0 | Aprovado; sem imports/locais/parâmetros não usados reportados |
| `npm.cmd test` | 58.67 s; saída 0 | 27.85 s; saída 0 | 217 testes em 28 arquivos aprovados |
| `npm.cmd run build` | 95.08 s; saída 0 | 119.69 s; saída 0 | Build Vite aprovado |
| `cargo test --manifest-path src-tauri/Cargo.toml --offline --locked` | 161.61 s; saída 0 | 151.41 s; saída 0 | 127 aprovados, zero falhas, um benchmark ignorado |
| `npm.cmd run tauri:build -- --ci --bundles nsis -- --offline --locked` | 409.02 s; saída 0 | 325.78 s; saída 0 | Release e instalador NSIS compilados; não instalado |

Além disso, o verificador de alcance `scripts/check_project.cjs` não encontrou órfãos ou dependências de produção sem uso. O protótipo independente passou em 27 verificações de lógica/código, sem navegador. A restauração foi ensaiada em diretório isolado e seus 19 arquivos foram comparados com os hashes originais.

Os testes existentes cobrem, entre outros pontos, autenticação/perfis, aquisição/parser de 225 sensores, exames e sequências, banco/cache, pacientes, agenda, questionários, backups, calibração, cálculos, relatórios, navegação e preferências. Os testes Rust usam bases em memória ou temporárias; testes específicos verificam migração, compatibilidade, snapshot pré-migração e WAL.

Logs integrais e saídas estão em `logs/baseline/` e `logs/regression/`; arquivos `*-results.json` registram comando, código de saída e duração.

Aviso preexistente do Tauri: o identificador `br.com.baropress.app` termina em `.app`, desaconselhado para macOS. O identificador foi preservado para manter identidade e diretório do aplicativo. O aviso não impediu o build Windows. Um benchmark sintético Rust é ignorado pela própria suíte; não foi apresentado como teste aprovado.

## Integridade e limites

- **235 arquivos** sob `src/` e `src-tauri/`, fora do cache target, comparados com o snapshot e idênticos. Isso inclui telas, estilos, serviços, stores, tipos, testes, Rust, migrações, configurações e assets.
- `package.json`, `package-lock.json`, `Cargo.toml`, `Cargo.lock` e configurações Vite/TypeScript/Tauri preservados.
- `dist/`: 35 arquivos idênticos ao baseline e ao estado inicial. A limpeza não mudou o bundle de UI.
- `entrega/`: nenhuma alteração; o instalador de regressão foi produzido em `src-tauri/target/release/bundle/nsis/`, fora das entregas existentes.
- Não houve execução do aplicativo instalado, login com contas reais, operação no SQLite de produção, dispositivo ESP32/serial físico, validação clínica, impressão ou homologação visual do WebView2. Testes e hashes não substituem essas verificações manuais.

## Restauração

Na pasta de outputs, execute `RESTORAR_LIMPEZA.ps1` para recolocar as 19 imagens. O script valida o hash do ZIP, valida cada conteúdo e limita os destinos a `.evento-build/`. Se um arquivo existente diferir do original, interrompe antes de escrever; arquivos já idênticos são preservados. Pode receber `-RepoPath` para um checkout/cópia alternativo.

Para desfazer apenas a organização documental, remova o bloco final “Organização e limpeza conservadora — 20/10/2026” do README e os dois arquivos de `docs/maintenance/` acrescentados nesta execução. O README original também está no snapshot. Não é necessário substituir fontes, banco ou migrações.

## Evidências entregues

- `snapshot-manifest.json`: inventário inicial com SHA-256 de cada arquivo e do ZIP.
- `inventory.json`: totais por pasta e todos os grupos duplicados.
- `analysis.json`: grafo de imports, declarações, uso de dependências, comandos, migrações, candidatos aceitos e recusados.
- `removed-files.json`: lista exata dos 19 arquivos removidos, hashes e cópias mantidas.
- `verification.json`: diferenças finais e conferência das fontes e do bundle.
- `RESTORAR_LIMPEZA.ps1`: restauração das imagens removidas.
- `logs/`: evidências de baseline e regressão.

Nenhuma alegação de preservação depende apenas de testes: as fontes e contratos permaneceram byte a byte idênticos. A remoção ficou restrita a outputs sem função no aplicativo ou nos inputs das apresentações.
