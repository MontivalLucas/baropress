# BAROPRESS — check-up de desempenho e limpeza

Data: 07/10/2026. Versão: 0.2.9.
Status: correções, testes e empacotamento concluídos. Homologação no uso real pendente.

A revisão priorizou a lentidão ao navegar, abrir abas e listas, conforme informado
pelo usuário. Foram revisados aquisição, visualização, consultas, carregamento
das telas, preferências, autenticação, exames, agenda, questionários, relatórios,
backup, dependências e arquivos do projeto. Testes usam bancos isolados e dados
sintéticos. O banco pessoal não foi aberto nem modificado para esta revisão.

## Causas encontradas e correções

| Encontrado | Mudança aplicada |
|---|---|
| Banco, autorização e serial no caminho da janela | Fila de comandos em worker separado; autorização permanece antes da execução e os comandos conservam sua ordem. |
| Listagens completas e consulta a cada tecla | Paginação real no SQLite: 50 linhas exibidas, uma extra para detectar próxima página, e consulta após 250 ms sem digitação. |
| Painéis administrativos assinando todos os frames | Seletores dos campos utilizados em Dashboard, Conta, Backup e seleção de perfil físico; Novo Exame e calibração recebem frames somente nas etapas que os exibem. |
| Estatísticas visuais publicadas a cada frame | Contadores visuais no máximo a cada 250 ms; eventos de erro/conexão e coleta bruta continuam independentes. |
| Interpolação refazendo linhas e alocando arrays por pixel | Interpolação separável e buffers por resolução, com Float64 intermediário e o mesmo clamp/resultado Float32. |
| Detalhes/exportações carregados com a lista de exames | Detalhes carregados sob demanda ao abrir Visualizar. |
| Polling de status acumulando consultas | Uma consulta por vez; resposta antiga ignorada após desconexão; listeners parciais liberados se a conexão falhar. |
| Endpoint e fila de polling de quadros sem consumidor | Removidos; quadros continuam pelo evento sensor-frame, utilizado na coleta. |

A documentação do [Tauri](https://v2.tauri.app/develop/calling-rust/) confirma
que comandos síncronos são executados na thread principal por padrão. A correção
move também a autorização e os locks, evitando que a guarda do banco continue
bloqueando a janela antes de chamar o comando.

## Resultados medidos

### Interpolação

Mediana de 11 execuções depois de três aquecimentos, Node 24.19.0, matriz
assimétrica de 225 valores. Comparação com a fonte 0.2.8 capturada antes da mudança.
O comparador também conferiu matrizes zero/4095, suavização 0/0,35/1,0 e cada pixel.

| Resolução | Antes | Depois | Ganho | Diferença máxima |
|---|---:|---:|---:|---:|
| 150×150 | 3,35 ms | 0,58 ms | 5,79× | 0 |
| 300×300 | 12,28 ms | 2,30 ms | 5,33× | 0 |
| 450×450 | 26,02 ms | 5,11 ms | 5,09× | 0 |

O teste de regressão conserva o hash SHA-256 da superfície suavizada anterior.
Esses resultados medem o cálculo sintético; não são uma medição de FPS da janela.
Evidência: [interpolation-0.2.9.json](interpolation-0.2.9.json).

### Listas com 10 mil pacientes e 10 mil exames sintéticos

SQLite em memória, build de teste Rust, mesma consulta/campos e ordenação; o
cenário paginado busca 51 linhas e exibe 50. Tempos são uma amostra, sem limiar
obrigatório de desempenho. Não representam o banco pessoal ou o custo do WebView2.

| Lista | Consulta completa | Primeira página | JSON completo | JSON da página |
|---|---:|---:|---:|---:|
| Pacientes | 100,38 ms | 5,80 ms | 1978895 bytes | 9988 bytes |
| Exames | 144,73 ms | 44,01 ms | 4307789 bytes | 21984 bytes |

A primeira página transfere cerca de 99,5% menos dados. Todos os registros
continuam acessíveis pelas páginas e pela busca. Testes conferem empates,
filtros, última página, paciente arquivado e equivalência com a listagem completa.
Evidência: [lists-0.2.9.json](lists-0.2.9.json).

## Limpeza aplicada

- Removido src/features/baropodometry/CopMarker.tsx: componente sem importações;
  o marcador utilizado continua desenhado no Canvas.
- Removido src/services/sessionStorage.ts e seu teste obsoleto: parser de sessão
  antigo sem consumidor no app. A autenticação continua verificada pelo backend.
- Removido scripts/format_sources.cjs: script pontual de edição das fases antigas,
  sem comando no package.json, incluindo referência a fonte já removida.
- Removido acquisition_poll_frames e a fila recent_frames, sem consumidor.
- A auditoria AST final encontrou 94 arquivos usados pelo app, 21 arquivos de
  teste e nenhum arquivo frontend órfão. As sete dependências de runtime têm uso.
- Cargo clean do pacote em perfil de desenvolvimento removeu 7696 artefatos,
  13,2 GiB (aproximadamente 14 GB). Fontes, migrações, instaladores de produção,
  referências, histórico e banco pessoal foram preservados.
- O cache separado visualizacao foi preservado: Cargo recusou sua limpeza por
  ausência de CACHEDIR.TAG. A proteção não foi removida ou contornada.

A limpeza libera espaço em disco. A fila, a paginação e os seletores reduzem o
trabalho durante a navegação. O protótipo baropress-liquid-glass é uma referência
visual independente e foi mantido; não faz parte do aplicativo instalado.
Evidências: [imports-0.2.9.json](imports-0.2.9.json),
[cache-cleanup-0.2.9.json](cache-cleanup-0.2.9.json).

## Verificações

- 166 testes frontend aprovados em 21 arquivos.
- 94 testes Rust aprovados; um benchmark ignorado na suíte foi executado à parte.
- Relógio de 5 s de preparação/10 s de coleta, 303 frames, cancelamento,
  desconexão, salvamento, PDF, preferências e fluxo de restauração verificados.
- Testes novos: fidelidade da interpolação, buffers sem resíduos, entrega de
  todos os frames, polling sem sobreposição, resposta antiga descartada,
  falha de listener e paginação sem perder/duplicar registros.
- Testes da fila: execução fora do remetente, ordem FIFO, comando lento sem
  bloquear o envio e finalização das mensagens já enfileiradas.
- TypeScript, build frontend de produção, executável release e instalador NSIS x64 aprovados.
- Versão do executável e integridade SHA-256 da cópia do instalador verificadas.
- Clippy concluiu sem erros, com oito avisos de estilo no código existente
  (Default, múltiplos, unwrap redundante, loops e if colapsável).
- Vite atualizado de 5.4.21 para 6.4.3; Vitest de 2.1.9 para 4.1.11;
  plugin React 4.7.0. A adaptação dos testes restaura ações do Zustand copiadas
  de spies e tipa o mock de conexão, conforme a nova API de testes.
- Npm audit: 13 alertas antes, sete depois, zero críticos e zero nas
  dependências de produção. Os sete restantes são da cadeia Tailwind/PostCSS
  em desenvolvimento; o npm recomenda migração de versão principal. A migração
  de CSS/layout fica registrada para validação específica.

Logs: [frontend-tests-0.2.9.log](frontend-tests-0.2.9.log),
[rust-tests-0.2.9.log](rust-tests-0.2.9.log),
[npm-audit-0.2.9.json](npm-audit-0.2.9.json),
[npm-audit-production-0.2.9.json](npm-audit-production-0.2.9.json).

## Conferência no programa instalado

1. Atualizar pelo instalador 0.2.9 e entrar.
2. Percorrer Dashboard, Pacientes, Histórico de Exames e Configurações.
3. Buscar um registro, avançar/voltar páginas, abrir detalhes e relatório.
4. Repetir com Arduino conectado e leitura ativa; conferir resposta dos controles.
5. Em paciente de teste, executar preparação/coleta, salvar e reabrir o exame.
6. Observar CPU/memória no Gerenciador de Tarefas em uma sessão prolongada.

A fluidez real no WebView2, consumo prolongado de memória, UI e ESP32 físico
continuam pendentes de homologação manual. Seletores antigos de paciente e a
lista de comparação ainda usam lista completa; bases muito grandes podem exigir
busca/paginação adicional nesses fluxos. Os backups antigos continuam compatíveis
com o mesmo esquema do banco; nenhuma migração de dados foi introduzida.

Instalador gerado e conferido (ProductVersion 0.2.9 e SHA-256 da cópia): src-tauri/target/release/bundle/nsis/BAROPRESS_0.2.9_x64-setup.exe.
Registro: Sprint/05_Historico/2026-10-07_09_checkup_desempenho_limpeza.txt.
