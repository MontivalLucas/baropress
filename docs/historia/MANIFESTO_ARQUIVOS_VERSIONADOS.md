# Manifesto navegável de arquivos versionados — BAROPRESS

> Gerado em 26/10/2026 por `python scripts/gerar_manifesto_arquivos.py`.
> Fonte: caminhos rastreados no **índice Git** (`git ls-files`), mais este manifesto.
> Não enumera arquivos locais não rastreados, arquivos externos, dependências ignoradas nem dados privados.
> Para entender funções e origens, comece pelo [mapa completo](../MAPEAMENTO_COMPLETO_PROJETO.md).

**Total de caminhos:** 513 · **Grupos:** 54.

## Grupos

| Área | Quantidade |
| --- | ---: |
| `(raiz)` | 11 |
| `baropress-liquid-glass` | 10 |
| `docs/algoritmos` | 4 |
| `docs/ARCHITECTURE.md` | 1 |
| `docs/audit` | 12 |
| `docs/BAROPODOMETRY.md` | 1 |
| `docs/barosys` | 25 |
| `docs/BUILD_WINDOWS.md` | 1 |
| `docs/corrections` | 27 |
| `docs/FASES_7_A_11.md` | 1 |
| `docs/historia` | 8 |
| `docs/maintenance` | 2 |
| `docs/MAPEAMENTO_COMPLETO_PROJETO.md` | 1 |
| `docs/performance` | 8 |
| `docs/questionnaires` | 2 |
| `docs/referencias` | 1 |
| `docs/review` | 1 |
| `docs/validacao` | 4 |
| `firmware/esp32` | 3 |
| `hardware` | 4 |
| `prototipos/python-heatmap` | 5 |
| `scripts` | 18 |
| `Sprint/00_LEIA_PRIMEIRO.txt` | 1 |
| `Sprint/01_Referencias` | 2 |
| `Sprint/02_Concluido` | 1 |
| `Sprint/03_Em_Andamento` | 1 |
| `Sprint/04_Futuro` | 9 |
| `Sprint/05_Historico` | 44 |
| `Sprint/06_Modelos` | 1 |
| `Sprint/99_Logs_Antigos` | 2 |
| `Sprint/BAROPRESS_AUDITORIA_CORRECAO_LOGIN_CODEX.txt` | 1 |
| `Sprint/BAROPRESS_Documentacao_Tecnica_para_Fisioterapia.docx` | 1 |
| `Sprint/Documentacao_TCC` | 65 |
| `Sprint/Treinamento` | 4 |
| `src-tauri/bin_deps` | 2 |
| `src-tauri/build.rs` | 1 |
| `src-tauri/capabilities` | 1 |
| `src-tauri/Cargo.lock` | 1 |
| `src-tauri/Cargo.toml` | 1 |
| `src-tauri/icons` | 52 |
| `src-tauri/installerHooks.nsh` | 1 |
| `src-tauri/migrations` | 9 |
| `src-tauri/src` | 20 |
| `src-tauri/tauri.conf.json` | 1 |
| `src/App.tsx` | 1 |
| `src/components` | 9 |
| `src/features` | 59 |
| `src/index.css` | 1 |
| `src/main.tsx` | 1 |
| `src/pages` | 2 |
| `src/services` | 35 |
| `src/stores` | 5 |
| `src/tests` | 28 |
| `src/types` | 1 |

## Índice completo

### `(raiz)` (11)

- [`.gitattributes`](../../.gitattributes)
- [`.gitignore`](../../.gitignore)
- [`index.html`](../../index.html)
- [`iniciar_baropress.bat`](../../iniciar_baropress.bat)
- [`package-lock.json`](../../package-lock.json)
- [`package.json`](../../package.json)
- [`postcss.config.js`](../../postcss.config.js)
- [`README.md`](../../README.md)
- [`tailwind.config.js`](../../tailwind.config.js)
- [`tsconfig.json`](../../tsconfig.json)
- [`vite.config.ts`](../../vite.config.ts)

### `baropress-liquid-glass` (10)

- [`baropress-liquid-glass/abrir-preview.bat`](../../baropress-liquid-glass/abrir-preview.bat)
- [`baropress-liquid-glass/app.js`](../../baropress-liquid-glass/app.js)
- [`baropress-liquid-glass/assets/favicon.svg`](../../baropress-liquid-glass/assets/favicon.svg)
- [`baropress-liquid-glass/assets/pressure-map.svg`](../../baropress-liquid-glass/assets/pressure-map.svg)
- [`baropress-liquid-glass/index.html`](../../baropress-liquid-glass/index.html)
- [`baropress-liquid-glass/original-files.sha256.json`](../../baropress-liquid-glass/original-files.sha256.json)
- [`baropress-liquid-glass/preview.mjs`](../../baropress-liquid-glass/preview.mjs)
- [`baropress-liquid-glass/README.md`](../../baropress-liquid-glass/README.md)
- [`baropress-liquid-glass/styles.css`](../../baropress-liquid-glass/styles.css)
- [`baropress-liquid-glass/verify.mjs`](../../baropress-liquid-glass/verify.mjs)

### `docs/algoritmos` (4)

- [`docs/algoritmos/AQUISICAO_DADOS.md`](../../docs/algoritmos/AQUISICAO_DADOS.md)
- [`docs/algoritmos/HEATMAP.md`](../../docs/algoritmos/HEATMAP.md)
- [`docs/algoritmos/METRICAS_BAROPODOMETRICAS.md`](../../docs/algoritmos/METRICAS_BAROPODOMETRICAS.md)
- [`docs/algoritmos/PROCESSAMENTO_PYTHON.md`](../../docs/algoritmos/PROCESSAMENTO_PYTHON.md)

### `docs/ARCHITECTURE.md` (1)

- [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)

### `docs/audit` (12)

- [`docs/audit/ALTERACOES_APLICADAS.md`](../../docs/audit/ALTERACOES_APLICADAS.md)
- [`docs/audit/AUDITORIA_FINAL.md`](../../docs/audit/AUDITORIA_FINAL.md)
- [`docs/audit/CHECKLIST_MANUAL.md`](../../docs/audit/CHECKLIST_MANUAL.md)
- [`docs/audit/inventario.json`](../../docs/audit/inventario.json)
- [`docs/audit/INVENTARIO_FUNCIONAL.md`](../../docs/audit/INVENTARIO_FUNCIONAL.md)
- [`docs/audit/logs/artifacts.json`](../../docs/audit/logs/artifacts.json)
- [`docs/audit/logs/results.json`](../../docs/audit/logs/results.json)
- [`docs/audit/PENDENCIAS_E_RECOMENDACOES.md`](../../docs/audit/PENDENCIAS_E_RECOMENDACOES.md)
- [`docs/audit/PLANO_DE_CORRECOES.md`](../../docs/audit/PLANO_DE_CORRECOES.md)
- [`docs/audit/PROBLEMAS_ENCONTRADOS.md`](../../docs/audit/PROBLEMAS_ENCONTRADOS.md)
- [`docs/audit/REDUNDANCIAS_E_UX.md`](../../docs/audit/REDUNDANCIAS_E_UX.md)
- [`docs/audit/RESULTADOS_TESTES.md`](../../docs/audit/RESULTADOS_TESTES.md)

### `docs/BAROPODOMETRY.md` (1)

- [`docs/BAROPODOMETRY.md`](../../docs/BAROPODOMETRY.md)

### `docs/barosys` (25)

- [`docs/barosys/benchmark.json`](../../docs/barosys/benchmark.json)
- [`docs/barosys/METODO_E_LIMITES.md`](../../docs/barosys/METODO_E_LIMITES.md)
- [`docs/barosys/pdf-legacy-1.png`](../../docs/barosys/pdf-legacy-1.png)
- [`docs/barosys/pdf-legacy-2.png`](../../docs/barosys/pdf-legacy-2.png)
- [`docs/barosys/pdf-synthetic-1.png`](../../docs/barosys/pdf-synthetic-1.png)
- [`docs/barosys/pdf-synthetic-2.png`](../../docs/barosys/pdf-synthetic-2.png)
- [`docs/barosys/pdf-synthetic-3.png`](../../docs/barosys/pdf-synthetic-3.png)
- [`docs/barosys/pdf-synthetic-4.png`](../../docs/barosys/pdf-synthetic-4.png)
- [`docs/barosys/report-legacy.pdf`](../../docs/barosys/report-legacy.pdf)
- [`docs/barosys/report-synthetic.pdf`](../../docs/barosys/report-synthetic.pdf)
- [`docs/barosys/source-inventory.json`](../../docs/barosys/source-inventory.json)
- [`docs/barosys/ui-1100-dark-3d.png`](../../docs/barosys/ui-1100-dark-3d.png)
- [`docs/barosys/ui-1100-dark-graphs.png`](../../docs/barosys/ui-1100-dark-graphs.png)
- [`docs/barosys/ui-1100-light-3d.png`](../../docs/barosys/ui-1100-light-3d.png)
- [`docs/barosys/ui-1100-light-graphs.png`](../../docs/barosys/ui-1100-light-graphs.png)
- [`docs/barosys/ui-1366-dark-3d.png`](../../docs/barosys/ui-1366-dark-3d.png)
- [`docs/barosys/ui-1366-dark-graphs.png`](../../docs/barosys/ui-1366-dark-graphs.png)
- [`docs/barosys/ui-1366-light-3d.png`](../../docs/barosys/ui-1366-light-3d.png)
- [`docs/barosys/ui-1366-light-graphs.png`](../../docs/barosys/ui-1366-light-graphs.png)
- [`docs/barosys/ui-comparison-2.png`](../../docs/barosys/ui-comparison-2.png)
- [`docs/barosys/ui-comparison-4.png`](../../docs/barosys/ui-comparison-4.png)
- [`docs/barosys/ui-new-conditions.png`](../../docs/barosys/ui-new-conditions.png)
- [`docs/barosys/ui-report.png`](../../docs/barosys/ui-report.png)
- [`docs/barosys/ui-results.json`](../../docs/barosys/ui-results.json)
- [`docs/barosys/VALIDACAO_E_DEMONSTRACAO.txt`](../../docs/barosys/VALIDACAO_E_DEMONSTRACAO.txt)

### `docs/BUILD_WINDOWS.md` (1)

- [`docs/BUILD_WINDOWS.md`](../../docs/BUILD_WINDOWS.md)

### `docs/corrections` (27)

- [`docs/corrections/alinhamento-faixa-esquerda.png`](../../docs/corrections/alinhamento-faixa-esquerda.png)
- [`docs/corrections/ALINHAMENTO_FAIXA_ESQUERDA.md`](../../docs/corrections/ALINHAMENTO_FAIXA_ESQUERDA.md)
- [`docs/corrections/AQUISICAO_30_45_MODALIDADES.md`](../../docs/corrections/AQUISICAO_30_45_MODALIDADES.md)
- [`docs/corrections/artifacts-0.2.10.json`](../../docs/corrections/artifacts-0.2.10.json)
- [`docs/corrections/artifacts-0.2.11.json`](../../docs/corrections/artifacts-0.2.11.json)
- [`docs/corrections/artifacts-0.2.13.json`](../../docs/corrections/artifacts-0.2.13.json)
- [`docs/corrections/artifacts-0.2.14.json`](../../docs/corrections/artifacts-0.2.14.json)
- [`docs/corrections/artifacts-alinhamento-0.2.11.json`](../../docs/corrections/artifacts-alinhamento-0.2.11.json)
- [`docs/corrections/artifacts-rollback-faixa-esquerda.json`](../../docs/corrections/artifacts-rollback-faixa-esquerda.json)
- [`docs/corrections/calibracao-ajuda-0.2.11.jpg`](../../docs/corrections/calibracao-ajuda-0.2.11.jpg)
- [`docs/corrections/CALIBRACAO_SIMPLIFICADA_0.2.11.md`](../../docs/corrections/CALIBRACAO_SIMPLIFICADA_0.2.11.md)
- [`docs/corrections/CORRECOES_0.2.10.md`](../../docs/corrections/CORRECOES_0.2.10.md)
- [`docs/corrections/iam-artifacts-0.2.12.json`](../../docs/corrections/iam-artifacts-0.2.12.json)
- [`docs/corrections/iam-artifacts-pre-0.2.12.json`](../../docs/corrections/iam-artifacts-pre-0.2.12.json)
- [`docs/corrections/iam-artifacts.json`](../../docs/corrections/iam-artifacts.json)
- [`docs/corrections/iam-secretaria-agenda.jpg`](../../docs/corrections/iam-secretaria-agenda.jpg)
- [`docs/corrections/novo-exame-aquisicao-teste.png`](../../docs/corrections/novo-exame-aquisicao-teste.png)
- [`docs/corrections/novo-exame-condicoes-teste.png`](../../docs/corrections/novo-exame-condicoes-teste.png)
- [`docs/corrections/PRIMEIRO_ACESSO_0.2.13.md`](../../docs/corrections/PRIMEIRO_ACESSO_0.2.13.md)
- [`docs/corrections/rollback-faixa-esquerda/baropress-alinhamento.exe.retired`](../../docs/corrections/rollback-faixa-esquerda/baropress-alinhamento.exe.retired)
- [`docs/corrections/rollback-faixa-esquerda/BAROPRESS_0.2.11_alinhamento_x64-setup.exe.retired`](../../docs/corrections/rollback-faixa-esquerda/BAROPRESS_0.2.11_alinhamento_x64-setup.exe.retired)
- [`docs/corrections/rollback-faixa-esquerda/heatmap.py.antes-rollback`](../../docs/corrections/rollback-faixa-esquerda/heatmap.py.antes-rollback)
- [`docs/corrections/rollback-faixa-esquerda/mapa_calor.py.antes-rollback`](../../docs/corrections/rollback-faixa-esquerda/mapa_calor.py.antes-rollback)
- [`docs/corrections/ROLLBACK_FAIXA_ESQUERDA.md`](../../docs/corrections/ROLLBACK_FAIXA_ESQUERDA.md)
- [`docs/corrections/source-inventory-0.2.10.json`](../../docs/corrections/source-inventory-0.2.10.json)
- [`docs/corrections/source-inventory-0.2.11.json`](../../docs/corrections/source-inventory-0.2.11.json)
- [`docs/corrections/USUARIOS_LOGIN_ACESSO.md`](../../docs/corrections/USUARIOS_LOGIN_ACESSO.md)

### `docs/FASES_7_A_11.md` (1)

- [`docs/FASES_7_A_11.md`](../../docs/FASES_7_A_11.md)

### `docs/historia` (8)

- [`docs/historia/DECISOES_DE_PROJETO.md`](../../docs/historia/DECISOES_DE_PROJETO.md)
- [`docs/historia/EVOLUCAO_TECNICA.md`](../../docs/historia/EVOLUCAO_TECNICA.md)
- [`docs/historia/GUIA_GITHUB.md`](../../docs/historia/GUIA_GITHUB.md)
- [`docs/historia/INVENTARIO_DIRETORIOS.md`](../../docs/historia/INVENTARIO_DIRETORIOS.md)
- [`docs/historia/LINHA_DO_TEMPO.md`](../../docs/historia/LINHA_DO_TEMPO.md)
- [`docs/historia/MANIFESTO_ARQUIVOS_VERSIONADOS.md`](../../docs/historia/MANIFESTO_ARQUIVOS_VERSIONADOS.md)
- [`docs/historia/ORIGENS_E_INTEGRIDADE.md`](../../docs/historia/ORIGENS_E_INTEGRIDADE.md)
- [`docs/historia/README.md`](../../docs/historia/README.md)

### `docs/maintenance` (2)

- [`docs/maintenance/AUDITORIA_2026-10-20.md`](../../docs/maintenance/AUDITORIA_2026-10-20.md)
- [`docs/maintenance/ORGANIZACAO.md`](../../docs/maintenance/ORGANIZACAO.md)

### `docs/MAPEAMENTO_COMPLETO_PROJETO.md` (1)

- [`docs/MAPEAMENTO_COMPLETO_PROJETO.md`](../../docs/MAPEAMENTO_COMPLETO_PROJETO.md)

### `docs/performance` (8)

- [`docs/performance/artifacts-0.2.9.json`](../../docs/performance/artifacts-0.2.9.json)
- [`docs/performance/cache-cleanup-0.2.9.json`](../../docs/performance/cache-cleanup-0.2.9.json)
- [`docs/performance/CHECKUP_0.2.9.md`](../../docs/performance/CHECKUP_0.2.9.md)
- [`docs/performance/imports-0.2.9.json`](../../docs/performance/imports-0.2.9.json)
- [`docs/performance/interpolation-0.2.9.json`](../../docs/performance/interpolation-0.2.9.json)
- [`docs/performance/lists-0.2.9.json`](../../docs/performance/lists-0.2.9.json)
- [`docs/performance/npm-audit-0.2.9.json`](../../docs/performance/npm-audit-0.2.9.json)
- [`docs/performance/npm-audit-production-0.2.9.json`](../../docs/performance/npm-audit-production-0.2.9.json)

### `docs/questionnaires` (2)

- [`docs/questionnaires/anamnese-baropodometrica.json`](../../docs/questionnaires/anamnese-baropodometrica.json)
- [`docs/questionnaires/ANAMNESE_BAROPODOMETRICA.md`](../../docs/questionnaires/ANAMNESE_BAROPODOMETRICA.md)

### `docs/referencias` (1)

- [`docs/referencias/REFERENCIAS_TECNICAS.md`](../../docs/referencias/REFERENCIAS_TECNICAS.md)

### `docs/review` (1)

- [`docs/review/REVISAO_ARQUITETURA_UX_0.2.9.md`](../../docs/review/REVISAO_ARQUITETURA_UX_0.2.9.md)

### `docs/validacao` (4)

- [`docs/validacao/ENSAIOS.md`](../../docs/validacao/ENSAIOS.md)
- [`docs/validacao/LIMITACOES.md`](../../docs/validacao/LIMITACOES.md)
- [`docs/validacao/RESULTADOS.md`](../../docs/validacao/RESULTADOS.md)
- [`docs/validacao/VERIFICACOES_2026-10-26.md`](../../docs/validacao/VERIFICACOES_2026-10-26.md)

### `firmware/esp32` (3)

- [`firmware/esp32/PROTOCOLO_COMUNICACAO.md`](../../firmware/esp32/PROTOCOLO_COMUNICACAO.md)
- [`firmware/esp32/README.md`](../../firmware/esp32/README.md)
- [`firmware/esp32/tapete.ino`](../../firmware/esp32/tapete.ino)

### `hardware` (4)

- [`hardware/COMPONENTES.md`](../../hardware/COMPONENTES.md)
- [`hardware/MATRIZ_SENSORES.md`](../../hardware/MATRIZ_SENSORES.md)
- [`hardware/PINAGEM_ESP32.md`](../../hardware/PINAGEM_ESP32.md)
- [`hardware/README.md`](../../hardware/README.md)

### `prototipos/python-heatmap` (5)

- [`prototipos/python-heatmap/heatmap_inicial.py`](../../prototipos/python-heatmap/heatmap_inicial.py)
- [`prototipos/python-heatmap/heatmap_interativo.py`](../../prototipos/python-heatmap/heatmap_interativo.py)
- [`prototipos/python-heatmap/iniciar_mapa_original.bat`](../../prototipos/python-heatmap/iniciar_mapa_original.bat)
- [`prototipos/python-heatmap/README.md`](../../prototipos/python-heatmap/README.md)
- [`prototipos/python-heatmap/requirements.txt`](../../prototipos/python-heatmap/requirements.txt)

### `scripts` (18)

- [`scripts/acquisition-preview.html`](../../scripts/acquisition-preview.html)
- [`scripts/acquisition-preview.tsx`](../../scripts/acquisition-preview.tsx)
- [`scripts/audit_inventory.cjs`](../../scripts/audit_inventory.cjs)
- [`scripts/audit_verify.ps1`](../../scripts/audit_verify.ps1)
- [`scripts/barosys-fixture.ts`](../../scripts/barosys-fixture.ts)
- [`scripts/barosys-preview.html`](../../scripts/barosys-preview.html)
- [`scripts/barosys-preview.tsx`](../../scripts/barosys-preview.tsx)
- [`scripts/benchmark_barosys.cjs`](../../scripts/benchmark_barosys.cjs)
- [`scripts/benchmark_interpolation.cjs`](../../scripts/benchmark_interpolation.cjs)
- [`scripts/calibration-preview.html`](../../scripts/calibration-preview.html)
- [`scripts/calibration-preview.tsx`](../../scripts/calibration-preview.tsx)
- [`scripts/check_barosys_ui.cjs`](../../scripts/check_barosys_ui.cjs)
- [`scripts/check_project.cjs`](../../scripts/check_project.cjs)
- [`scripts/gerar_manifesto_arquivos.py`](../../scripts/gerar_manifesto_arquivos.py)
- [`scripts/refresh_barosys_pdf.cjs`](../../scripts/refresh_barosys_pdf.cjs)
- [`scripts/set_version.cjs`](../../scripts/set_version.cjs)
- [`scripts/users-preview.html`](../../scripts/users-preview.html)
- [`scripts/users-preview.tsx`](../../scripts/users-preview.tsx)

### `Sprint/00_LEIA_PRIMEIRO.txt` (1)

- [`Sprint/00_LEIA_PRIMEIRO.txt`](../../Sprint/00_LEIA_PRIMEIRO.txt)

### `Sprint/01_Referencias` (2)

- [`Sprint/01_Referencias/Contexto.txt`](../../Sprint/01_Referencias/Contexto.txt)
- [`Sprint/01_Referencias/PROJETO TCC - FASES.txt`](../../Sprint/01_Referencias/PROJETO%20TCC%20-%20FASES.txt)

### `Sprint/02_Concluido` (1)

- [`Sprint/02_Concluido/PROGRESSO_CONCLUIDO.txt`](../../Sprint/02_Concluido/PROGRESSO_CONCLUIDO.txt)

### `Sprint/03_Em_Andamento` (1)

- [`Sprint/03_Em_Andamento/PROGRESSO_EM_ANDAMENTO.txt`](../../Sprint/03_Em_Andamento/PROGRESSO_EM_ANDAMENTO.txt)

### `Sprint/04_Futuro` (9)

- [`Sprint/04_Futuro/ESTUDO_DINAMICA_F09_A.txt`](../../Sprint/04_Futuro/ESTUDO_DINAMICA_F09_A.txt)
- [`Sprint/04_Futuro/PENDENCIAS_POS_CORRECOES_0.2.10.txt`](../../Sprint/04_Futuro/PENDENCIAS_POS_CORRECOES_0.2.10.txt)
- [`Sprint/04_Futuro/PENDENCIAS_USUARIOS_LOGIN_ACESSO.txt`](../../Sprint/04_Futuro/PENDENCIAS_USUARIOS_LOGIN_ACESSO.txt)
- [`Sprint/04_Futuro/PLANO_AQUISICAO_30_45_MODALIDADES.txt`](../../Sprint/04_Futuro/PLANO_AQUISICAO_30_45_MODALIDADES.txt)
- [`Sprint/04_Futuro/PLANO_MELHORIAS_BASEADAS_NO_BAROSYS.txt`](../../Sprint/04_Futuro/PLANO_MELHORIAS_BASEADAS_NO_BAROSYS.txt)
- [`Sprint/04_Futuro/PLANO_PRIMEIRO_ACESSO_CADASTRO.txt`](../../Sprint/04_Futuro/PLANO_PRIMEIRO_ACESSO_CADASTRO.txt)
- [`Sprint/04_Futuro/PLANO_USUARIOS_LOGIN_ACESSO.txt`](../../Sprint/04_Futuro/PLANO_USUARIOS_LOGIN_ACESSO.txt)
- [`Sprint/04_Futuro/PROGRESSO_FUTURO.txt`](../../Sprint/04_Futuro/PROGRESSO_FUTURO.txt)
- [`Sprint/04_Futuro/PROMPTS_MELHORIAS_BAROSYS_CODEX.txt`](../../Sprint/04_Futuro/PROMPTS_MELHORIAS_BAROSYS_CODEX.txt)

### `Sprint/05_Historico` (44)

- [`Sprint/05_Historico/2026-10-06_01_correcao_fase5.txt`](../../Sprint/05_Historico/2026-10-06_01_correcao_fase5.txt)
- [`Sprint/05_Historico/2026-10-06_02_fase7_comparacao.txt`](../../Sprint/05_Historico/2026-10-06_02_fase7_comparacao.txt)
- [`Sprint/05_Historico/2026-10-06_03_fase8_agenda.txt`](../../Sprint/05_Historico/2026-10-06_03_fase8_agenda.txt)
- [`Sprint/05_Historico/2026-10-06_04_fase9_questionarios.txt`](../../Sprint/05_Historico/2026-10-06_04_fase9_questionarios.txt)
- [`Sprint/05_Historico/2026-10-06_05_fase10_backup.txt`](../../Sprint/05_Historico/2026-10-06_05_fase10_backup.txt)
- [`Sprint/05_Historico/2026-10-06_06_fase11_refinamento.txt`](../../Sprint/05_Historico/2026-10-06_06_fase11_refinamento.txt)
- [`Sprint/05_Historico/2026-10-07_01_resumo_fases7_a11.txt`](../../Sprint/05_Historico/2026-10-07_01_resumo_fases7_a11.txt)
- [`Sprint/05_Historico/2026-10-07_02_auditoria_login_qualidade.txt`](../../Sprint/05_Historico/2026-10-07_02_auditoria_login_qualidade.txt)
- [`Sprint/05_Historico/2026-10-07_03_uniformizacao_visualizacao_exame.txt`](../../Sprint/05_Historico/2026-10-07_03_uniformizacao_visualizacao_exame.txt)
- [`Sprint/05_Historico/2026-10-07_04_exames_sem_aba_relatorios.txt`](../../Sprint/05_Historico/2026-10-07_04_exames_sem_aba_relatorios.txt)
- [`Sprint/05_Historico/2026-10-07_05_arduino_configuracoes_conexao_automatica.txt`](../../Sprint/05_Historico/2026-10-07_05_arduino_configuracoes_conexao_automatica.txt)
- [`Sprint/05_Historico/2026-10-07_06_configuracoes_sem_mapa_calor.txt`](../../Sprint/05_Historico/2026-10-07_06_configuracoes_sem_mapa_calor.txt)
- [`Sprint/05_Historico/2026-10-07_07_questionario_anamnese_integrado.txt`](../../Sprint/05_Historico/2026-10-07_07_questionario_anamnese_integrado.txt)
- [`Sprint/05_Historico/2026-10-07_08_configuracoes_logs_backup_historico_exames.txt`](../../Sprint/05_Historico/2026-10-07_08_configuracoes_logs_backup_historico_exames.txt)
- [`Sprint/05_Historico/2026-10-07_09_checkup_desempenho_limpeza.txt`](../../Sprint/05_Historico/2026-10-07_09_checkup_desempenho_limpeza.txt)
- [`Sprint/05_Historico/2026-10-07_10_revisao_arquitetura_ux_funcionalidades.txt`](../../Sprint/05_Historico/2026-10-07_10_revisao_arquitetura_ux_funcionalidades.txt)
- [`Sprint/05_Historico/2026-10-07_11_correcoes_arquitetura_ux.txt`](../../Sprint/05_Historico/2026-10-07_11_correcoes_arquitetura_ux.txt)
- [`Sprint/05_Historico/2026-10-07_12_documentacao_prototipo_piloto.txt`](../../Sprint/05_Historico/2026-10-07_12_documentacao_prototipo_piloto.txt)
- [`Sprint/05_Historico/2026-10-08_12_calibracao_simplificada_ajudas.txt`](../../Sprint/05_Historico/2026-10-08_12_calibracao_simplificada_ajudas.txt)
- [`Sprint/05_Historico/2026-10-08_13_alinhamento_faixa_esquerda.txt`](../../Sprint/05_Historico/2026-10-08_13_alinhamento_faixa_esquerda.txt)
- [`Sprint/05_Historico/2026-10-08_14_rollback_faixa_esquerda.txt`](../../Sprint/05_Historico/2026-10-08_14_rollback_faixa_esquerda.txt)
- [`Sprint/05_Historico/2026-10-09_01_plano_melhorias_barosys.txt`](../../Sprint/05_Historico/2026-10-09_01_plano_melhorias_barosys.txt)
- [`Sprint/05_Historico/2026-10-09_02_barosys_F00.txt`](../../Sprint/05_Historico/2026-10-09_02_barosys_F00.txt)
- [`Sprint/05_Historico/2026-10-09_03_barosys_F01.txt`](../../Sprint/05_Historico/2026-10-09_03_barosys_F01.txt)
- [`Sprint/05_Historico/2026-10-09_04_barosys_F02.txt`](../../Sprint/05_Historico/2026-10-09_04_barosys_F02.txt)
- [`Sprint/05_Historico/2026-10-09_05_barosys_F03.txt`](../../Sprint/05_Historico/2026-10-09_05_barosys_F03.txt)
- [`Sprint/05_Historico/2026-10-09_06_barosys_F04.txt`](../../Sprint/05_Historico/2026-10-09_06_barosys_F04.txt)
- [`Sprint/05_Historico/2026-10-09_07_barosys_F05.txt`](../../Sprint/05_Historico/2026-10-09_07_barosys_F05.txt)
- [`Sprint/05_Historico/2026-10-09_08_barosys_F06.txt`](../../Sprint/05_Historico/2026-10-09_08_barosys_F06.txt)
- [`Sprint/05_Historico/2026-10-09_09_barosys_F07.txt`](../../Sprint/05_Historico/2026-10-09_09_barosys_F07.txt)
- [`Sprint/05_Historico/2026-10-09_10_barosys_F08.txt`](../../Sprint/05_Historico/2026-10-09_10_barosys_F08.txt)
- [`Sprint/05_Historico/2026-10-09_11_barosys_F09.txt`](../../Sprint/05_Historico/2026-10-09_11_barosys_F09.txt)
- [`Sprint/05_Historico/2026-10-09_12_IAM_01.txt`](../../Sprint/05_Historico/2026-10-09_12_IAM_01.txt)
- [`Sprint/05_Historico/2026-10-09_12_IAM_02.txt`](../../Sprint/05_Historico/2026-10-09_12_IAM_02.txt)
- [`Sprint/05_Historico/2026-10-09_12_IAM_03.txt`](../../Sprint/05_Historico/2026-10-09_12_IAM_03.txt)
- [`Sprint/05_Historico/2026-10-09_12_IAM_04.txt`](../../Sprint/05_Historico/2026-10-09_12_IAM_04.txt)
- [`Sprint/05_Historico/2026-10-09_12_IAM_05.txt`](../../Sprint/05_Historico/2026-10-09_12_IAM_05.txt)
- [`Sprint/05_Historico/2026-10-09_12_IAM_06.txt`](../../Sprint/05_Historico/2026-10-09_12_IAM_06.txt)
- [`Sprint/05_Historico/2026-10-09_13_entrega_usuarios_acesso_0.2.12.txt`](../../Sprint/05_Historico/2026-10-09_13_entrega_usuarios_acesso_0.2.12.txt)
- [`Sprint/05_Historico/2026-10-09_14_primeiro_acesso_cadastro.txt`](../../Sprint/05_Historico/2026-10-09_14_primeiro_acesso_cadastro.txt)
- [`Sprint/05_Historico/2026-10-14_01_aquisicao_modalidades_trajeto.txt`](../../Sprint/05_Historico/2026-10-14_01_aquisicao_modalidades_trajeto.txt)
- [`Sprint/05_Historico/2026-10-14_02_simplificacao_novo_exame.txt`](../../Sprint/05_Historico/2026-10-14_02_simplificacao_novo_exame.txt)
- [`Sprint/05_Historico/2026-10-14_03_testes_condicoes_simplificadas.txt`](../../Sprint/05_Historico/2026-10-14_03_testes_condicoes_simplificadas.txt)
- [`Sprint/05_Historico/2026-10-14_04_exe_0.2.14.txt`](../../Sprint/05_Historico/2026-10-14_04_exe_0.2.14.txt)

### `Sprint/06_Modelos` (1)

- [`Sprint/06_Modelos/MODELO_REGISTRO_PROGRESSO.txt`](../../Sprint/06_Modelos/MODELO_REGISTRO_PROGRESSO.txt)

### `Sprint/99_Logs_Antigos` (2)

- [`Sprint/99_Logs_Antigos/err.txt`](../../Sprint/99_Logs_Antigos/err.txt)
- [`Sprint/99_Logs_Antigos/out.txt`](../../Sprint/99_Logs_Antigos/out.txt)

### `Sprint/BAROPRESS_AUDITORIA_CORRECAO_LOGIN_CODEX.txt` (1)

- [`Sprint/BAROPRESS_AUDITORIA_CORRECAO_LOGIN_CODEX.txt`](../../Sprint/BAROPRESS_AUDITORIA_CORRECAO_LOGIN_CODEX.txt)

### `Sprint/BAROPRESS_Documentacao_Tecnica_para_Fisioterapia.docx` (1)

- [`Sprint/BAROPRESS_Documentacao_Tecnica_para_Fisioterapia.docx`](../../Sprint/BAROPRESS_Documentacao_Tecnica_para_Fisioterapia.docx)

### `Sprint/Documentacao_TCC` (65)

- [`Sprint/Documentacao_TCC/DOCUMENTACAO_PROTOTIPO_E_TESTE_PILOTO.txt`](../../Sprint/Documentacao_TCC/DOCUMENTACAO_PROTOTIPO_E_TESTE_PILOTO.txt)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/BAROPRESS_Documentacao_Tecnica_para_Fisioterapia.docx`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/BAROPRESS_Documentacao_Tecnica_para_Fisioterapia.docx)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/gerar_documentacao.py`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/gerar_documentacao.py)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/BAROPRESS_Documentacao_Tecnica_para_Fisioterapia.pdf`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/BAROPRESS_Documentacao_Tecnica_para_Fisioterapia.pdf)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-1.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-1.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-10.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-10.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-11.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-11.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-12.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-12.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-13.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-13.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-14.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-14.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-15.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-15.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-16.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-16.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-17.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-17.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-2.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-2.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-3.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-3.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-4.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-4.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-5.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-5.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-6.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-6.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-7.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-7.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-8.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-8.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-9.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa/page-9.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/BAROPRESS_Documentacao_Tecnica_para_Fisioterapia.pdf`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/BAROPRESS_Documentacao_Tecnica_para_Fisioterapia.pdf)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-1.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-1.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-10.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-10.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-11.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-11.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-12.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-12.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-13.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-13.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-14.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-14.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-15.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-15.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-2.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-2.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-3.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-3.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-4.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-4.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-5.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-5.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-6.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-6.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-7.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-7.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-8.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-8.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-9.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_entrega/page-9.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/BAROPRESS_Documentacao_Tecnica_para_Fisioterapia.pdf`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/BAROPRESS_Documentacao_Tecnica_para_Fisioterapia.pdf)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-1.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-1.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-10.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-10.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-11.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-11.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-12.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-12.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-13.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-13.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-14.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-14.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-15.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-15.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-2.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-2.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-3.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-3.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-4.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-4.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-5.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-5.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-6.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-6.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-7.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-7.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-8.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-8.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-9.png`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/qa_final/page-9.png)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/render_with_word.py`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/render_with_word.py)
- [`Sprint/Documentacao_TCC/Entrega_Fisioterapia/word_export.ps1`](../../Sprint/Documentacao_TCC/Entrega_Fisioterapia/word_export.ps1)
- [`Sprint/Documentacao_TCC/Evidencias/DADOS_BRUTOS_CALIBRACAO.json`](../../Sprint/Documentacao_TCC/Evidencias/DADOS_BRUTOS_CALIBRACAO.json)
- [`Sprint/Documentacao_TCC/Evidencias/EXAMES_ADC_SEM_IDENTIFICADORES.json`](../../Sprint/Documentacao_TCC/Evidencias/EXAMES_ADC_SEM_IDENTIFICADORES.json)
- [`Sprint/Documentacao_TCC/Evidencias/MANIFESTO.json`](../../Sprint/Documentacao_TCC/Evidencias/MANIFESTO.json)
- [`Sprint/Documentacao_TCC/Evidencias/MEDIAS_POR_SENSOR.txt`](../../Sprint/Documentacao_TCC/Evidencias/MEDIAS_POR_SENSOR.txt)
- [`Sprint/Documentacao_TCC/Evidencias/PERFIL_E_VALIDACAO_REGISTRADOS.json`](../../Sprint/Documentacao_TCC/Evidencias/PERFIL_E_VALIDACAO_REGISTRADOS.json)
- [`Sprint/Documentacao_TCC/Evidencias/RESULTADOS_POR_REPETICAO.txt`](../../Sprint/Documentacao_TCC/Evidencias/RESULTADOS_POR_REPETICAO.txt)
- [`Sprint/Documentacao_TCC/Evidencias/RESUMO_ANALITICO.json`](../../Sprint/Documentacao_TCC/Evidencias/RESUMO_ANALITICO.json)
- [`Sprint/Documentacao_TCC/extrair_evidencias.py`](../../Sprint/Documentacao_TCC/extrair_evidencias.py)
- [`Sprint/Documentacao_TCC/Fotos/LEIA_ME.txt`](../../Sprint/Documentacao_TCC/Fotos/LEIA_ME.txt)
- [`Sprint/Documentacao_TCC/PROTOCOLO_BAROSYS_F06_V1.txt`](../../Sprint/Documentacao_TCC/PROTOCOLO_BAROSYS_F06_V1.txt)

### `Sprint/Treinamento` (4)

- [`Sprint/Treinamento/BAROPRESS_TESTES_E_CALIBRACAO_GUIA_CODEX.txt`](../../Sprint/Treinamento/BAROPRESS_TESTES_E_CALIBRACAO_GUIA_CODEX.txt)
- [`Sprint/Treinamento/COMO_USAR_TESTES_E_CALIBRACAO.txt`](../../Sprint/Treinamento/COMO_USAR_TESTES_E_CALIBRACAO.txt)
- [`Sprint/Treinamento/CORRIGIR_CONJUNTO_DE_ENSAIOS.txt`](../../Sprint/Treinamento/CORRIGIR_CONJUNTO_DE_ENSAIOS.txt)
- [`Sprint/Treinamento/PROGRESSO_TESTES_E_CALIBRACAO.txt`](../../Sprint/Treinamento/PROGRESSO_TESTES_E_CALIBRACAO.txt)

### `src-tauri/bin_deps` (2)

- [`src-tauri/bin_deps/libunwind.dll`](../../src-tauri/bin_deps/libunwind.dll)
- [`src-tauri/bin_deps/WebView2Loader.dll`](../../src-tauri/bin_deps/WebView2Loader.dll)

### `src-tauri/build.rs` (1)

- [`src-tauri/build.rs`](../../src-tauri/build.rs)

### `src-tauri/capabilities` (1)

- [`src-tauri/capabilities/default.json`](../../src-tauri/capabilities/default.json)

### `src-tauri/Cargo.lock` (1)

- [`src-tauri/Cargo.lock`](../../src-tauri/Cargo.lock)

### `src-tauri/Cargo.toml` (1)

- [`src-tauri/Cargo.toml`](../../src-tauri/Cargo.toml)

### `src-tauri/icons` (52)

- [`src-tauri/icons/128x128.png`](../../src-tauri/icons/128x128.png)
- [`src-tauri/icons/128x128@2x.png`](../../src-tauri/icons/128x128%402x.png)
- [`src-tauri/icons/32x32.png`](../../src-tauri/icons/32x32.png)
- [`src-tauri/icons/64x64.png`](../../src-tauri/icons/64x64.png)
- [`src-tauri/icons/android/mipmap-anydpi-v26/ic_launcher.xml`](../../src-tauri/icons/android/mipmap-anydpi-v26/ic_launcher.xml)
- [`src-tauri/icons/android/mipmap-hdpi/ic_launcher.png`](../../src-tauri/icons/android/mipmap-hdpi/ic_launcher.png)
- [`src-tauri/icons/android/mipmap-hdpi/ic_launcher_foreground.png`](../../src-tauri/icons/android/mipmap-hdpi/ic_launcher_foreground.png)
- [`src-tauri/icons/android/mipmap-hdpi/ic_launcher_round.png`](../../src-tauri/icons/android/mipmap-hdpi/ic_launcher_round.png)
- [`src-tauri/icons/android/mipmap-mdpi/ic_launcher.png`](../../src-tauri/icons/android/mipmap-mdpi/ic_launcher.png)
- [`src-tauri/icons/android/mipmap-mdpi/ic_launcher_foreground.png`](../../src-tauri/icons/android/mipmap-mdpi/ic_launcher_foreground.png)
- [`src-tauri/icons/android/mipmap-mdpi/ic_launcher_round.png`](../../src-tauri/icons/android/mipmap-mdpi/ic_launcher_round.png)
- [`src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png`](../../src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png)
- [`src-tauri/icons/android/mipmap-xhdpi/ic_launcher_foreground.png`](../../src-tauri/icons/android/mipmap-xhdpi/ic_launcher_foreground.png)
- [`src-tauri/icons/android/mipmap-xhdpi/ic_launcher_round.png`](../../src-tauri/icons/android/mipmap-xhdpi/ic_launcher_round.png)
- [`src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png`](../../src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png)
- [`src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_foreground.png`](../../src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_foreground.png)
- [`src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_round.png`](../../src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_round.png)
- [`src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png`](../../src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png)
- [`src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png`](../../src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png)
- [`src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_round.png`](../../src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_round.png)
- [`src-tauri/icons/android/values/ic_launcher_background.xml`](../../src-tauri/icons/android/values/ic_launcher_background.xml)
- [`src-tauri/icons/icon.icns`](../../src-tauri/icons/icon.icns)
- [`src-tauri/icons/icon.ico`](../../src-tauri/icons/icon.ico)
- [`src-tauri/icons/icon.png`](../../src-tauri/icons/icon.png)
- [`src-tauri/icons/ios/AppIcon-20x20@1x.png`](../../src-tauri/icons/ios/AppIcon-20x20%401x.png)
- [`src-tauri/icons/ios/AppIcon-20x20@2x-1.png`](../../src-tauri/icons/ios/AppIcon-20x20%402x-1.png)
- [`src-tauri/icons/ios/AppIcon-20x20@2x.png`](../../src-tauri/icons/ios/AppIcon-20x20%402x.png)
- [`src-tauri/icons/ios/AppIcon-20x20@3x.png`](../../src-tauri/icons/ios/AppIcon-20x20%403x.png)
- [`src-tauri/icons/ios/AppIcon-29x29@1x.png`](../../src-tauri/icons/ios/AppIcon-29x29%401x.png)
- [`src-tauri/icons/ios/AppIcon-29x29@2x-1.png`](../../src-tauri/icons/ios/AppIcon-29x29%402x-1.png)
- [`src-tauri/icons/ios/AppIcon-29x29@2x.png`](../../src-tauri/icons/ios/AppIcon-29x29%402x.png)
- [`src-tauri/icons/ios/AppIcon-29x29@3x.png`](../../src-tauri/icons/ios/AppIcon-29x29%403x.png)
- [`src-tauri/icons/ios/AppIcon-40x40@1x.png`](../../src-tauri/icons/ios/AppIcon-40x40%401x.png)
- [`src-tauri/icons/ios/AppIcon-40x40@2x-1.png`](../../src-tauri/icons/ios/AppIcon-40x40%402x-1.png)
- [`src-tauri/icons/ios/AppIcon-40x40@2x.png`](../../src-tauri/icons/ios/AppIcon-40x40%402x.png)
- [`src-tauri/icons/ios/AppIcon-40x40@3x.png`](../../src-tauri/icons/ios/AppIcon-40x40%403x.png)
- [`src-tauri/icons/ios/AppIcon-512@2x.png`](../../src-tauri/icons/ios/AppIcon-512%402x.png)
- [`src-tauri/icons/ios/AppIcon-60x60@2x.png`](../../src-tauri/icons/ios/AppIcon-60x60%402x.png)
- [`src-tauri/icons/ios/AppIcon-60x60@3x.png`](../../src-tauri/icons/ios/AppIcon-60x60%403x.png)
- [`src-tauri/icons/ios/AppIcon-76x76@1x.png`](../../src-tauri/icons/ios/AppIcon-76x76%401x.png)
- [`src-tauri/icons/ios/AppIcon-76x76@2x.png`](../../src-tauri/icons/ios/AppIcon-76x76%402x.png)
- [`src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png`](../../src-tauri/icons/ios/AppIcon-83.5x83.5%402x.png)
- [`src-tauri/icons/Square107x107Logo.png`](../../src-tauri/icons/Square107x107Logo.png)
- [`src-tauri/icons/Square142x142Logo.png`](../../src-tauri/icons/Square142x142Logo.png)
- [`src-tauri/icons/Square150x150Logo.png`](../../src-tauri/icons/Square150x150Logo.png)
- [`src-tauri/icons/Square284x284Logo.png`](../../src-tauri/icons/Square284x284Logo.png)
- [`src-tauri/icons/Square30x30Logo.png`](../../src-tauri/icons/Square30x30Logo.png)
- [`src-tauri/icons/Square310x310Logo.png`](../../src-tauri/icons/Square310x310Logo.png)
- [`src-tauri/icons/Square44x44Logo.png`](../../src-tauri/icons/Square44x44Logo.png)
- [`src-tauri/icons/Square71x71Logo.png`](../../src-tauri/icons/Square71x71Logo.png)
- [`src-tauri/icons/Square89x89Logo.png`](../../src-tauri/icons/Square89x89Logo.png)
- [`src-tauri/icons/StoreLogo.png`](../../src-tauri/icons/StoreLogo.png)

### `src-tauri/installerHooks.nsh` (1)

- [`src-tauri/installerHooks.nsh`](../../src-tauri/installerHooks.nsh)

### `src-tauri/migrations` (9)

- [`src-tauri/migrations/0001_init.sql`](../../src-tauri/migrations/0001_init.sql)
- [`src-tauri/migrations/0002_exams_phase5.sql`](../../src-tauri/migrations/0002_exams_phase5.sql)
- [`src-tauri/migrations/0003_exam_visualization.sql`](../../src-tauri/migrations/0003_exam_visualization.sql)
- [`src-tauri/migrations/0004_exam_trajectory.sql`](../../src-tauri/migrations/0004_exam_trajectory.sql)
- [`src-tauri/migrations/0005_questionnaire_sessions.sql`](../../src-tauri/migrations/0005_questionnaire_sessions.sql)
- [`src-tauri/migrations/0006_calibration.sql`](../../src-tauri/migrations/0006_calibration.sql)
- [`src-tauri/migrations/0007_exam_patient_snapshot.sql`](../../src-tauri/migrations/0007_exam_patient_snapshot.sql)
- [`src-tauri/migrations/0008_exam_analysis.sql`](../../src-tauri/migrations/0008_exam_analysis.sql)
- [`src-tauri/migrations/0009_user_access.sql`](../../src-tauri/migrations/0009_user_access.sql)

### `src-tauri/src` (20)

- [`src-tauri/src/acquisition.rs`](../../src-tauri/src/acquisition.rs)
- [`src-tauri/src/agenda.rs`](../../src-tauri/src/agenda.rs)
- [`src-tauri/src/auth.rs`](../../src-tauri/src/auth.rs)
- [`src-tauri/src/auth_tests.rs`](../../src-tauri/src/auth_tests.rs)
- [`src-tauri/src/backup.rs`](../../src-tauri/src/backup.rs)
- [`src-tauri/src/calibration.rs`](../../src-tauri/src/calibration.rs)
- [`src-tauri/src/command_queue.rs`](../../src-tauri/src/command_queue.rs)
- [`src-tauri/src/db.rs`](../../src-tauri/src/db.rs)
- [`src-tauri/src/exam_analysis.rs`](../../src-tauri/src/exam_analysis.rs)
- [`src-tauri/src/exam_analysis_tests.rs`](../../src-tauri/src/exam_analysis_tests.rs)
- [`src-tauri/src/exams.rs`](../../src-tauri/src/exams.rs)
- [`src-tauri/src/lib.rs`](../../src-tauri/src/lib.rs)
- [`src-tauri/src/main.rs`](../../src-tauri/src/main.rs)
- [`src-tauri/src/pagination.rs`](../../src-tauri/src/pagination.rs)
- [`src-tauri/src/patients.rs`](../../src-tauri/src/patients.rs)
- [`src-tauri/src/permissions.rs`](../../src-tauri/src/permissions.rs)
- [`src-tauri/src/questionnaires.rs`](../../src-tauri/src/questionnaires.rs)
- [`src-tauri/src/support.rs`](../../src-tauri/src/support.rs)
- [`src-tauri/src/users.rs`](../../src-tauri/src/users.rs)
- [`src-tauri/src/workflow_tests.rs`](../../src-tauri/src/workflow_tests.rs)

### `src-tauri/tauri.conf.json` (1)

- [`src-tauri/tauri.conf.json`](../../src-tauri/tauri.conf.json)

### `src/App.tsx` (1)

- [`src/App.tsx`](../../src/App.tsx)

### `src/components` (9)

- [`src/components/ErrorBoundary.tsx`](../../src/components/ErrorBoundary.tsx)
- [`src/components/NavigationProtection.tsx`](../../src/components/NavigationProtection.tsx)
- [`src/components/Sidebar.tsx`](../../src/components/Sidebar.tsx)
- [`src/components/ui/controls.tsx`](../../src/components/ui/controls.tsx)
- [`src/components/ui/ListPagination.tsx`](../../src/components/ui/ListPagination.tsx)
- [`src/components/ui/Logo.tsx`](../../src/components/ui/Logo.tsx)
- [`src/components/ui/useDialogFocus.ts`](../../src/components/ui/useDialogFocus.ts)
- [`src/components/ui/usePagedSearch.ts`](../../src/components/ui/usePagedSearch.ts)
- [`src/components/ui/useUnsavedChanges.ts`](../../src/components/ui/useUnsavedChanges.ts)

### `src/features` (59)

- [`src/features/acquisition/ArduinoSettings.tsx`](../../src/features/acquisition/ArduinoSettings.tsx)
- [`src/features/acquisition/MatrixPreview15x15.tsx`](../../src/features/acquisition/MatrixPreview15x15.tsx)
- [`src/features/agenda/AgendaPage.tsx`](../../src/features/agenda/AgendaPage.tsx)
- [`src/features/agenda/calendarUtils.ts`](../../src/features/agenda/calendarUtils.ts)
- [`src/features/auth/AccountSettings.tsx`](../../src/features/auth/AccountSettings.tsx)
- [`src/features/auth/authValidation.ts`](../../src/features/auth/authValidation.ts)
- [`src/features/auth/LoginPage.tsx`](../../src/features/auth/LoginPage.tsx)
- [`src/features/auth/PasswordField.tsx`](../../src/features/auth/PasswordField.tsx)
- [`src/features/auth/permissions.ts`](../../src/features/auth/permissions.ts)
- [`src/features/auth/RecoveryReceipt.tsx`](../../src/features/auth/RecoveryReceipt.tsx)
- [`src/features/auth/sessionActions.ts`](../../src/features/auth/sessionActions.ts)
- [`src/features/auth/UsersPage.tsx`](../../src/features/auth/UsersPage.tsx)
- [`src/features/backup/BackupPage.tsx`](../../src/features/backup/BackupPage.tsx)
- [`src/features/backup/exportUtils.ts`](../../src/features/backup/exportUtils.ts)
- [`src/features/baropodometry/BaropodometricHeatmap.tsx`](../../src/features/baropodometry/BaropodometricHeatmap.tsx)
- [`src/features/baropodometry/BaropodometryPage.tsx`](../../src/features/baropodometry/BaropodometryPage.tsx)
- [`src/features/baropodometry/HeatmapSettingsPanel.tsx`](../../src/features/baropodometry/HeatmapSettingsPanel.tsx)
- [`src/features/baropodometry/MetricsPanel.tsx`](../../src/features/baropodometry/MetricsPanel.tsx)
- [`src/features/baropodometry/ParameterBar.tsx`](../../src/features/baropodometry/ParameterBar.tsx)
- [`src/features/baropodometry/PressureLegend.tsx`](../../src/features/baropodometry/PressureLegend.tsx)
- [`src/features/calibration/CalibrationHelp.tsx`](../../src/features/calibration/CalibrationHelp.tsx)
- [`src/features/calibration/CalibrationPage.tsx`](../../src/features/calibration/CalibrationPage.tsx)
- [`src/features/calibration/ClassificationCorrection.tsx`](../../src/features/calibration/ClassificationCorrection.tsx)
- [`src/features/calibration/fieldHelp.ts`](../../src/features/calibration/fieldHelp.ts)
- [`src/features/calibration/matDefaults.ts`](../../src/features/calibration/matDefaults.ts)
- [`src/features/calibration/PhysicalResults.tsx`](../../src/features/calibration/PhysicalResults.tsx)
- [`src/features/comparison/ComparisonPage.tsx`](../../src/features/comparison/ComparisonPage.tsx)
- [`src/features/comparison/comparisonUtils.ts`](../../src/features/comparison/comparisonUtils.ts)
- [`src/features/exams/AnalysisGraphs.tsx`](../../src/features/exams/AnalysisGraphs.tsx)
- [`src/features/exams/AnalysisReview.tsx`](../../src/features/exams/AnalysisReview.tsx)
- [`src/features/exams/CancelExamDialog.tsx`](../../src/features/exams/CancelExamDialog.tsx)
- [`src/features/exams/ExamConditionsForm.tsx`](../../src/features/exams/ExamConditionsForm.tsx)
- [`src/features/exams/ExamDetailsModal.tsx`](../../src/features/exams/ExamDetailsModal.tsx)
- [`src/features/exams/ExamExportActions.tsx`](../../src/features/exams/ExamExportActions.tsx)
- [`src/features/exams/examProcessing.ts`](../../src/features/exams/examProcessing.ts)
- [`src/features/exams/ExamReportView.tsx`](../../src/features/exams/ExamReportView.tsx)
- [`src/features/exams/examRuntime.ts`](../../src/features/exams/examRuntime.ts)
- [`src/features/exams/ExamSettingsTab.tsx`](../../src/features/exams/ExamSettingsTab.tsx)
- [`src/features/exams/ExamsPage.tsx`](../../src/features/exams/ExamsPage.tsx)
- [`src/features/exams/examStore.ts`](../../src/features/exams/examStore.ts)
- [`src/features/exams/ExamVisualizationControls.tsx`](../../src/features/exams/ExamVisualizationControls.tsx)
- [`src/features/exams/NewExamPage.tsx`](../../src/features/exams/NewExamPage.tsx)
- [`src/features/exams/SensorMap3D.tsx`](../../src/features/exams/SensorMap3D.tsx)
- [`src/features/exams/SequenceLinks.tsx`](../../src/features/exams/SequenceLinks.tsx)
- [`src/features/exams/useExamTrajectory.ts`](../../src/features/exams/useExamTrajectory.ts)
- [`src/features/logs/LogsPage.tsx`](../../src/features/logs/LogsPage.tsx)
- [`src/features/patients/PatientCareHistory.tsx`](../../src/features/patients/PatientCareHistory.tsx)
- [`src/features/patients/PatientDetails.tsx`](../../src/features/patients/PatientDetails.tsx)
- [`src/features/patients/PatientForm.tsx`](../../src/features/patients/PatientForm.tsx)
- [`src/features/patients/PatientList.tsx`](../../src/features/patients/PatientList.tsx)
- [`src/features/patients/PatientsPage.tsx`](../../src/features/patients/PatientsPage.tsx)
- [`src/features/patients/patientUtils.ts`](../../src/features/patients/patientUtils.ts)
- [`src/features/questionnaires/QuestionnaireHistory.tsx`](../../src/features/questionnaires/QuestionnaireHistory.tsx)
- [`src/features/questionnaires/QuestionnairesPage.tsx`](../../src/features/questionnaires/QuestionnairesPage.tsx)
- [`src/features/questionnaires/questionnaireUtils.ts`](../../src/features/questionnaires/questionnaireUtils.ts)
- [`src/features/reports/reportPdfGenerator.ts`](../../src/features/reports/reportPdfGenerator.ts)
- [`src/features/reports/reportUtils.ts`](../../src/features/reports/reportUtils.ts)
- [`src/features/reports/ReportViewer.tsx`](../../src/features/reports/ReportViewer.tsx)
- [`src/features/reports/savedValues.ts`](../../src/features/reports/savedValues.ts)

### `src/index.css` (1)

- [`src/index.css`](../../src/index.css)

### `src/main.tsx` (1)

- [`src/main.tsx`](../../src/main.tsx)

### `src/pages` (2)

- [`src/pages/Dashboard.tsx`](../../src/pages/Dashboard.tsx)
- [`src/pages/Settings.tsx`](../../src/pages/Settings.tsx)

### `src/services` (35)

- [`src/services/acquisition/automaticConnection.ts`](../../src/services/acquisition/automaticConnection.ts)
- [`src/services/acquisition/buffer.ts`](../../src/services/acquisition/buffer.ts)
- [`src/services/acquisition/index.ts`](../../src/services/acquisition/index.ts)
- [`src/services/acquisition/MockSensorDevice.ts`](../../src/services/acquisition/MockSensorDevice.ts)
- [`src/services/acquisition/parser.ts`](../../src/services/acquisition/parser.ts)
- [`src/services/acquisition/rawStream.ts`](../../src/services/acquisition/rawStream.ts)
- [`src/services/acquisition/SensorDevice.ts`](../../src/services/acquisition/SensorDevice.ts)
- [`src/services/acquisition/SerialSensorDevice.ts`](../../src/services/acquisition/SerialSensorDevice.ts)
- [`src/services/acquisition/tare.ts`](../../src/services/acquisition/tare.ts)
- [`src/services/acquisition/types.ts`](../../src/services/acquisition/types.ts)
- [`src/services/acquisition/useAutomaticConnection.ts`](../../src/services/acquisition/useAutomaticConnection.ts)
- [`src/services/baropodometry/autoAdjustment.ts`](../../src/services/baropodometry/autoAdjustment.ts)
- [`src/services/baropodometry/cop.ts`](../../src/services/baropodometry/cop.ts)
- [`src/services/baropodometry/heatmap.ts`](../../src/services/baropodometry/heatmap.ts)
- [`src/services/baropodometry/index.ts`](../../src/services/baropodometry/index.ts)
- [`src/services/baropodometry/interpolation.ts`](../../src/services/baropodometry/interpolation.ts)
- [`src/services/baropodometry/metrics.ts`](../../src/services/baropodometry/metrics.ts)
- [`src/services/baropodometry/normalization.ts`](../../src/services/baropodometry/normalization.ts)
- [`src/services/baropodometry/settings.ts`](../../src/services/baropodometry/settings.ts)
- [`src/services/baropodometry/trajectory.ts`](../../src/services/baropodometry/trajectory.ts)
- [`src/services/baropodometry/types.ts`](../../src/services/baropodometry/types.ts)
- [`src/services/calibration/characterization.ts`](../../src/services/calibration/characterization.ts)
- [`src/services/calibration/formatting.ts`](../../src/services/calibration/formatting.ts)
- [`src/services/calibration/math.ts`](../../src/services/calibration/math.ts)
- [`src/services/calibration/recorder.ts`](../../src/services/calibration/recorder.ts)
- [`src/services/calibration/types.ts`](../../src/services/calibration/types.ts)
- [`src/services/database/api.ts`](../../src/services/database/api.ts)
- [`src/services/examAnalysis/calculations.ts`](../../src/services/examAnalysis/calculations.ts)
- [`src/services/examAnalysis/report.ts`](../../src/services/examAnalysis/report.ts)
- [`src/services/examAnalysis/types.ts`](../../src/services/examAnalysis/types.ts)
- [`src/services/examProtocol.ts`](../../src/services/examProtocol.ts)
- [`src/services/navigationGuard.ts`](../../src/services/navigationGuard.ts)
- [`src/services/preferences.ts`](../../src/services/preferences.ts)
- [`src/services/serialWriter.ts`](../../src/services/serialWriter.ts)
- [`src/services/usePreferencesSync.ts`](../../src/services/usePreferencesSync.ts)

### `src/stores` (5)

- [`src/stores/acquisition.ts`](../../src/stores/acquisition.ts)
- [`src/stores/calibration.ts`](../../src/stores/calibration.ts)
- [`src/stores/preferences.ts`](../../src/stores/preferences.ts)
- [`src/stores/session.ts`](../../src/stores/session.ts)
- [`src/stores/visualization.ts`](../../src/stores/visualization.ts)

### `src/tests` (28)

- [`src/tests/acquisition.test.ts`](../../src/tests/acquisition.test.ts)
- [`src/tests/agenda.test.ts`](../../src/tests/agenda.test.ts)
- [`src/tests/audit-acquisition.test.ts`](../../src/tests/audit-acquisition.test.ts)
- [`src/tests/audit-reports.test.ts`](../../src/tests/audit-reports.test.ts)
- [`src/tests/audit-science.test.ts`](../../src/tests/audit-science.test.ts)
- [`src/tests/audit-session.test.ts`](../../src/tests/audit-session.test.ts)
- [`src/tests/auth.test.ts`](../../src/tests/auth.test.ts)
- [`src/tests/automatic-connection.test.ts`](../../src/tests/automatic-connection.test.ts)
- [`src/tests/backup.test.ts`](../../src/tests/backup.test.ts)
- [`src/tests/baropodometry-settings.test.ts`](../../src/tests/baropodometry-settings.test.ts)
- [`src/tests/baropodometry.test.ts`](../../src/tests/baropodometry.test.ts)
- [`src/tests/calibration-defaults.test.ts`](../../src/tests/calibration-defaults.test.ts)
- [`src/tests/calibration.test.ts`](../../src/tests/calibration.test.ts)
- [`src/tests/comparison.test.ts`](../../src/tests/comparison.test.ts)
- [`src/tests/database-api.test.ts`](../../src/tests/database-api.test.ts)
- [`src/tests/database-cache.test.ts`](../../src/tests/database-cache.test.ts)
- [`src/tests/exam-analysis.test.ts`](../../src/tests/exam-analysis.test.ts)
- [`src/tests/exam-conditions-ui.test.ts`](../../src/tests/exam-conditions-ui.test.ts)
- [`src/tests/exam-protocol.test.ts`](../../src/tests/exam-protocol.test.ts)
- [`src/tests/exams.test.ts`](../../src/tests/exams.test.ts)
- [`src/tests/interpolation-performance.test.ts`](../../src/tests/interpolation-performance.test.ts)
- [`src/tests/navigation.test.ts`](../../src/tests/navigation.test.ts)
- [`src/tests/patients.test.ts`](../../src/tests/patients.test.ts)
- [`src/tests/permissions.test.ts`](../../src/tests/permissions.test.ts)
- [`src/tests/preferences.test.ts`](../../src/tests/preferences.test.ts)
- [`src/tests/questionnaires.test.ts`](../../src/tests/questionnaires.test.ts)
- [`src/tests/reports.test.ts`](../../src/tests/reports.test.ts)
- [`src/tests/serial-status.test.ts`](../../src/tests/serial-status.test.ts)

### `src/types` (1)

- [`src/types/index.ts`](../../src/types/index.ts)
