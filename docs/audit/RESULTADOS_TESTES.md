# Resultados de testes
Data:07/10/2026. Versão final0.2.1.

## Evidências e comandos
Logs integrais com duração/exit code em [logs/results.json](logs/results.json). Não há CPF, credencial ou nota real nesses logs; dados são sintéticos.

| Comando exato | Resultado | Quantidade / tempo medido | Evidência |
|---|---|---|---|
| npm.cmd run typecheck | PASS | 8.57s, exit0 | logs/typecheck.log |
| npm.cmd test | PASS — TESTADO AUTOMATICAMENTE |132 testes,17 arquivos; processo9.72s | logs/frontend-tests.log |
| npm.cmd run build | PASS | processo24.34s; maior chunk390,99kB | logs/frontend-build.log |
| cargo test --manifest-path src-tauri/Cargo.toml --offline | PASS — TESTADO AUTOMATICAMENTE |63 testes, exit0; duração total31.22s | logs/rust-tests.log |
| npm.cmd run tauri:build -- --ci --bundles nsis -- --offline | Compilação release PASS; empacotamento no ambiente restrito FAIL externo | Duração final em results.json; release1m54s, DNS ao obter NSIS3.11 | logs/tauri-build.log |
| npm.cmd run tauri:build -- --debug --no-bundle --ci -- --offline | PASS | frontend e desktop debug compilados; Rust57,87s naquela execução | saída da ferramenta nesta conversa; janela localizada com sky.list_windows |
| Repetição do build NSIS com acesso à rede | PASS — instalador0.2.1 gerado | frontend15,48s, release1m27s, NSIS3,32MiB; não instala nada | logs/tauri-build-retry.log |
| npm.cmd run tauri -- bundle --ci --bundles nsis | PASS — empacotamento FINAL do executável atualizado | ferramenta8,53s; NSIS3,32MiB; acesso à rede autorizado | logs/tauri-bundle-final.log |

Baseline anterior às correções: npm.cmd test →113/12 arquivos (18,18s Vitest); cargo test --manifest-path src-tauri/Cargo.toml --offline →44 testes, compilação1m36s/testes0,53s. A suíte antiga passou mesmo com falhas que a auditoria encontrou: esse PASS não era homologação dos novos fluxos.

## O que os testes cobrem
- Auth Rust: bootstrap/admin, papel/duplicidade, senhas fracas, legacyArgon, login errado/correto, current/guards, cooldown, provision/rotação/uso único, alteração/logout lógico/expiração/restart, persistência/recovery em full backup e logs sem credenciais.
- Pacientes: CRUD, pesquisa, CPF/duplicidade/arquivo/histórico, antropometria finita.
- Parser serial de225/ADC e TS mock/buffer/tara/orientação; concorrência de conexão/desconexão.
- Exame: janela/preparação em fake timers integradas ao dispositivo mock,10s, cancelamento/disconnect, retry/save sem duplicar; SQLite transação e reabertura.
- Métricas/CoP/média/interpolação/auto; invariância de ajustes visuais e centro excluído só da distribuição lateral.
- Relatórios: validação, filename, valores nulos/altura e geração jsPDF A4, duas páginas normais/páginas extras por notas longas.
- Comparação/datas/deltas; agenda/calendário/conflitos; questionários cinco tipos/snapshot; backup full/individual/remapeamento/FK/rollback.
- Preferências/fila serial de escrita e logs. Workflow Rust integra exames, agenda, cinco tipos de respostas, preferências e restore com DB isolado.
- SQLite: snapshots antes de migração, versão futura rejeitada, recuperação consistente de WAL do diretório legado.

## Limites e métodos
**INSPECIONADO NO CÓDIGO:**234 definições de controles, estados das páginas, callbacks, CSS/ARIA e integrações; tabela específica no inventário. Isso não é execução de botões.
**BLOQUEADO (UI):**Computer Use localizou BAROPRESS debug em target/audit-runtime; get_window_state não retornou captura, com “Computer Use app approval timed out”. Nenhum fluxo de interface foi aprovado.
**NÃO TESTADO:**4 layouts, ESP32/Bluetooth físico, impressão, Canvas real no PDF/PNG, download WebView2, instalação/desinstalação/atualização e perfil CPU/memória.
O teste PDF em Node não tem document/Canvas, portanto a imagem de calor real não é gerada nesse ambiente. Não concluir fidelidade visual com o teste de número de páginas.

Warnings: cache incremental Rust não conseguiu hardlink e copiou arquivos; não impediu testes. Tauri alerta identifier .app por convenção macOS; identificador Windows foi preservado para não mudar diretório dos dados.
Falhas intermediárias corrigidas: generate_handler precisava de tipo explícito; --bundles none não é válido na CLI instalada, substituído por --no-bundle. Não são falhas remanescentes das suítes.
Bloqueio externo de empacotamento inicial: DNS os11001 ao obter NSIS, mesmo com Cargo --offline; NSIS tem download separado.
O bundle final informou que o marcador __TAURI_BUNDLE_TYPE não pôde ser adicionado novamente ao binário já processado pelo build NSIS anterior. O empacotamento concluiu com exit0. Não existe updater plugin configurado neste projeto; instalação/atualização real permanecem não testadas.

Nenhum usuário/paciente real, porta física ou instalação real foi alterado. Banco debug e DBs temporários são isolados; não houve reset nem nova migration.

Artefatos finais: src-tauri/target/release/baropress.exe e src-tauri/target/release/bundle/nsis/BAROPRESS_0.2.1_x64-setup.exe. Versões de arquivo e hashes registrados em logs/artifacts.json. O instalador foi produzido, não instalado.
