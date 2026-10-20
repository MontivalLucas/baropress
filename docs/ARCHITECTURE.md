# BAROPRESS — Arquitetura do Sistema

## Atualização 0.2.10 (07/10/2026)

O diagrama e as descrições das fases abaixo preservam contexto histórico.
A navegação atual reúne documentos no Histórico de Exames e Arduino/Backup/Logs
em Configurações. Ajustes do mapa ficam na Análise/Novo Exame.

`lib.rs` encaminha comandos de aquisição a uma fila serial e os demais a uma
fila do banco; ambas usam o mesmo controle de autorização em `dispatch_command`.
A espera da porta não ocupa a fila de listas. O mutex do banco continua existindo;
operações pesadas não ganham paralelismo ilimitado.

`navigationGuard.ts` centraliza saída, descarte e bloqueio durante operações;
`NavigationProtection` integra os formulários ao fechamento da janela Tauri.
Rascunhos são locais à sessão, sem recuperação persistente após reiniciar.

Migração 7 guarda `patient_snapshot_json` na transação de criação do exame.
Detalhes e lista usam a cópia para novos registros; antigos usam o cadastro
atual com aviso. Backups 5/6 são adaptados sem inventar essa cópia.
`exams_update_notes` altera apenas observações de exame concluído, com auditoria,
limite de 10.000 caracteres e transação; matriz/parâmetros originais permanecem.

Relatório e limites: [CORRECOES_0.2.10.md](corrections/CORRECOES_0.2.10.md).

## Visão Geral da Arquitetura

O sistema é dividido em camadas desacopladas com responsabilidades bem definidas:

```text
┌────────────────────────────────────────────────────────┐
│                      INTERFACE                         │
│  React 18 + TypeScript + TailwindCSS + Zustand         │
│  (Dashboard, Pacientes, Aquisição, Análise)            │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│               CAMADA BAROPODOMÉTRICA                   │
│  Interpolação Bicúbica + LUT 256 + CoP + Métricas      │
│  (Superfície Contínua, Threshold Suave, Bilateral)     │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                 CAMADA DE AQUISIÇÃO                    │
│  SensorDevice (SerialSensorDevice / MockSensorDevice)  │
│  Buffer Circular (120 frames) + TareManager            │
└───────────────────────────▲────────────────────────────┘
                            │ IPC Tauri 2 (Eventos & Invoke)
┌───────────────────────────▼────────────────────────────┐
│                    BACKEND RUST                        │
│  Tauri Core + serialport + rusqlite + argon2           │
│  Thread Dedicada de Leitura Serial / Parser 225        │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                 HARDWARE / SISTEMA                     │
│  ESP32 (USB / Bluetooth SPP) ou Mock 15×15             │
│  SQLite Local (%APPDATA%/br.com.baropress.app)         │
└────────────────────────────────────────────────────────┘
```

## Diretrizes de Separação de Responsabilidades

1. **Desacoplamento de Hardware:** A interface de usuário React nunca interage com portas COM, threads, bytes ou chamadas diretas de serial. Toda interação é mediada pela interface abstrata `SensorDevice`.
2. **Buffer e Taxa de Renderização:** O fluxo serial chega a ~30 FPS e é armazenado no `FrameBuffer` circular. A renderização do heatmap é orquestrada via `requestAnimationFrame` diretamente em um Canvas 2D acelerado.
3. **Isolamento Geométrico:** O espelhamento da matriz física (`fliplr`) está centralizado na função `normalizeMatrixOrientation()`.
4. **Segurança e Privacidade:** O banco de dados SQLite reside exclusivamente no disco local do usuário em `%APPDATA%/br.com.baropress.app/baropress.db`. Nenhum dado clínico ou de telemetria é enviado para servidores externos.

## Fase 5 — Módulo de Exames Baropodométricos

### 1. Fluxo do Exame Estático
```text
Paciente Cadastrado
       ↓
Novo Exame (Confirmação dos dados antropométricos e dispositivo)
       ↓
Preparação (Posicionamento bípede natural + Estabilização 5s)
       ↓
Aquisição Controlada (10s @ ~30 FPS, coleta contínua em memória)
       ↓
Processamento Amostral (Média temporal dos 225 sensores + Métricas CoP/Carga)
       ↓
Resultado Clínico (Mapa contínuo, indicadores objetivos e configuração)
       ↓
Persistência SQLite (Transação atômica vinculada a patient_id)
       ↓
Consulta & Reabertura (ExamesPage e Prontuário do Paciente)
```

### 2. Estrutura de Dados e Persistência da Matriz
Para garantir desempenho ótimo e evitar sobrecarga de I/O em disco, os quadros instantâneos (~30/s) são retidos apenas na memória durante a janela de aquisição. Ao término:
- Calcula-se a matriz média: $average[i] = \frac{1}{N} \sum_{k=1}^{N} frame_k[i]$ para $i \in [0, 224]$.
- A matriz processada é validada estritamente (exatamente 225 valores, todos finitos e $\ge 0$) e armazenada como string JSON (`matrix_json`) no registro da tabela `exams`.
- Os indicadores escalares (`max_pressure`, `mean_pressure`, `contact_area_percent`, `contact_sensors`, `cop_x`, `cop_y`, `left_load`, `right_load`, `left_percent`, `right_percent`) e configurações da análise (`threshold`, `vmax`, `gamma`, `smoothing`, `tare_applied`) são gravados como colunas indexáveis.

### 3. Diferenciação Estrita: REAL vs SIMULAÇÃO
- **REAL:** Quando o hardware ESP32 físico via porta USB Serial/Bluetooth está conectado.
- **SIMULATION:** Quando o Simulador Mock 15×15 está ativo. Apresentado com selo destacado e inequívoco em todas as telas e relatórios, impedindo qualquer confusão com medições biomédicas reais.

### 4. Unidades de Medida
Todas as leituras de pressão utilizam exclusivamente leituras relativas do conversor ADC (0 a 4095). O sistema não exibe unidades físicas fictícias (como kg, N ou kgf/cm²), preservando rigor científico até a futura calibração manométrica formal.

## Correção da Fase 5 e Configuração do Exame

`examRuntime.ts` mantém um relógio por tempo decorrido e assina os frames do
`SensorDevice` diretamente. As atualizações React e o FPS do Canvas não reiniciam
o cronômetro nem definem a taxa de coleta. O baseline de tara e o espelhamento
horizontal são aplicados aos frames antes de calcular a média temporal.

`examStore.ts` aguarda conexão e início do fluxo antes de abrir a janela de coleta.
Desconexão, cancelamento, saída da tela e coleta sem frames válidos impedem a
geração de um resultado parcial salvável. Na falha de gravação, a amostra permanece
em RESULT para que a mesma entrada possa ser enviada novamente.

A aba Configurações do exame reutiliza `HeatmapSettingsPanel`, com prévia ao vivo.
`visualization.ts` compartilha os ajustes com Análise; a fase 11 também os persiste no SQLite.
Durante o exame, os parâmetros permanecem fixos, incluindo os valores obtidos
no ajuste automático da prévia.

A migração `0003_exam_visualization.sql` adiciona `visualization_settings_json`.
Gamma, VMAX, threshold e suavização continuam nas colunas existentes; o JSON
também preserva resolução, FPS visual, modo e visibilidade do CoP. Exames antigos
mantêm suas colunas e usam valores padrão para as opções novas. Detalhes e
relatórios reaplicam os parâmetros salvos. A leitura do exame ocorre dentro da
transação, antes do commit, para evitar informar falha depois de já gravá-lo.

## Fase 6 — Módulo de Relatórios Baropodométricos

### 1. Fluxo de Geração e Consulta
```text
Exame Salvo (Tabela exams)
       ↓
Seleção de Exame (Histórico de Exames > Relatório)
       ↓
Validação de Integridade (225 sensels, patientId, métricas finitas)
       ↓
Visualização Interativa (ReportViewer: 2 páginas A4 fiéis ao documento final)
       ↓
Revisão e Observações Clínicas Manuais
       ↓
Exportação Local:
  ├── [Imprimir]: CSS @media print (A4 limpo sem cabeçalhos de tela/sidebar)
  └── [Exportar PDF]: jsPDF com gráficos vetoriais e mapa contínuo em alta resolução
```

### 2. Arquitetura do Módulo de Relatórios
- **`reportUtils.ts`**:
  - `sanitizeFileName()`: Higienização de nomes contra caracteres reservados no Windows (`/ \ : * ? " < > |`).
  - `generateReportFileName()`: Padronização `BAROPRESS_Relatorio_{NomePaciente}_{YYYY-MM-DD}.pdf`.
  - `validateExamForReport()`: Barreira de segurança pré-relatório que bloqueia exames corrompidos ou incompletos.
  - `renderHeatmapToDataUrl()`: Renderizador em canvas offscreen da interpolação contínua (Catmull-Rom bicúbica) e retículo do CoP a 600×600 px.
- **`reportPdfGenerator.ts`**:
  - Motor de renderização PDF em A4 Retrato utilizando `jsPDF`.
  - Layout dividido estritamente em duas páginas:
    - **Página 1:** Cabeçalho oficial, identificação do paciente (nome, CPF, idade, sexo, altura, peso, IMC), alerta destacado de origem (`HARDWARE REAL` vs `⚠ EXAME DE SIMULAÇÃO`), mapa de calor contínuo interpolado com legenda térmica e VMAX real, tabela de indicadores quantitativos (pressão máx/média relativa, área de contato, sensels ativos) e distribuição bilateral com gráfico de barra proporcional.
    - **Página 2:** Retículo CoP (x, y ou "Não disponível"), parâmetros técnicos de análise gravados no exame (Threshold, VMAX, Gamma, Suavização, Tara), dados da sessão de aquisição (duração, frames válidos, FPS médio), nota técnica de calibração sobre ADC relativo, observações manuais do avaliador, identificação do profissional e linha para assinatura física, aviso técnico médico-legal e rodapé com timestamp real de emissão.
- **`ReportViewer.tsx`**:
  - Componente de visualização em tela que emula fielmente o documento impresso em proporção A4.
  - Permite digitação ao vivo de notas clínicas antes da impressão ou exportação.
- **`ExamsPage.tsx` / `ExamReportView.tsx`**:
  - Listagem única em Histórico de Exames, busca por nome/CPF e relatório sob demanda; a antiga página duplicada foi removida.

### 3. Diretrizes Clínicas e Técnicas Fundamentais
1. **Origem REAL vs SIMULAÇÃO:**
   - **REAL:** Indica que os dados foram gerados por medições da esteira/plataforma com microcontrolador ESP32.
   - **SIMULATION:** Sinaliza com aviso amarelo `⚠ EXAME DE SIMULAÇÃO` no topo do relatório que o exame foi obtido com o simulador virtual da aplicação.
2. **Leituras em ADC Relativo:**
   - Os valores representam exclusivamente grandezas relativas do conversor analógico-digital de 12 bits (0 a 4095). Não representam kgf, Newtons ou Pascal, prevenindo falsas interpretações biomédicas.
3. **Reprodutibilidade Estrita:**
   - O relatório recupera unicamente os parâmetros gravados na tabela `exams` (`vmax`, `gamma`, `threshold`, `smoothing`, `tare_applied`). Alterações feitas pelo usuário em outras telas não alteram retroativamente os exames já laudados.
4. **Privacidade e Operação 100% Offline:**
   - A biblioteca `jsPDF` compõe o documento diretamente na memória do processo local. Nenhum dado é trafegado via internet ou APIs em nuvem.

### 4. Limitações Atuais (Escopo da Fase 6)
- A comparação entre exames do mesmo paciente é oferecida no módulo da fase 7.
- Não inclui estabilometria, exames dinâmicos (marcha) nem análise temporal CoP em vídeo.
- Não emite diagnóstico automático nem sugestões de laudo por Inteligência Artificial.

## Fase 7 — Comparação e Evolução

A comparação usa somente exames concluídos do mesmo paciente, de dois a quatro
por seleção. Os mapas podem usar uma escala comum; a tabela preserva as métricas
originais. Gráficos ordenados por data mostram pressão máxima/média, contato,
distribuição bilateral e CoP. Diferenças de origem, protocolo ou threshold são
indicadas, sem interpretar a variação como diagnóstico.

As novas coletas salvam os tempos relativos reais de cada frame e a trajetória
do CoP em `cop_trajectory_json` (migração 4). Exames anteriores podem ter esse
campo nulo. A interface informa quando não existem pontos de trajetória.

## Fase 8 — Agenda

`agenda.rs` oferece consultas, profissionais e filtros de período/paciente.
Datas e horários são validados antes da gravação. Consultas não canceladas
impedem sobreposição do paciente ou profissional; horários adjacentes são aceitos.
O calendário usa datas locais ao meio-dia para evitar mudanças indevidas de dia.

## Fase 9 — Questionários

`questionnaires.rs` gerencia modelos, grupos e cinco tipos de pergunta. A migração
5 adiciona sessões, grupos e vínculo das respostas à sessão. Cada envio guarda
snapshot das perguntas e respostas em uma transação. Alterações posteriores do
modelo preservam o histórico. Perguntas removidas do editor são desativadas no banco.

## Fase 10 — Backup

`backup.rs` exporta um snapshot lógico do banco, com tipos do SQLite e blobs.
Tabelas e colunas são validadas contra uma lista fixa e o esquema atual; dados
são inseridos por parâmetros, sem executar SQL vindo do arquivo. A restauração
completa substitui linhas em transação e verifica integridade referencial.

A importação individual remapeia IDs e referências, inclusive nos snapshots das
sessões de questionário. Antes de importar, uma cópia completa é gravada e
sincronizada no diretório de backups da aplicação. Erro na cópia impede o restore.
O formato versionado aceita arquivos de até 64 MB com a mesma versão de esquema.

## Fase 11 — Preferências, auditoria e desempenho

`support.rs` mantém preferências em `settings` e eventos em `system_logs`.
O frontend serializa gravações de preferências e aguarda a fila antes de importar
um backup. A exportação aguarda o salvamento das configurações atuais.

Os módulos usam `React.lazy`/`Suspense`, com chunks separados de UI e PDF. Há
tratamento de falhas da interface, recuperação de sessão inválida, navegação de
foco nos diálogos e horários UTC do SQLite convertidos para a visualização local.
A auditoria registra nomes de operações e resultados, sem incluir seus argumentos.

`workflow_tests.rs` verifica um fluxo integrado de exames, agenda, questionários,
preferências e restauração, usando bancos isolados e dados sintéticos.

## Auditoria 0.2.1 — autenticação e integridade
AuthState mantém a sessão verificada em Rust, por oito horas; o invoke_handler protege os 43 comandos da aplicação. Usuário no navegador não autentica chamadas. Primeiro admin único; equipe e backups exigem admin. Recovery usa código aleatório de 256 bits com hash Argon2 em settings e consumo transacional; troca exige senha atual e revoga a sessão. Logs de conta são gerados no backend sem argumentos sensíveis. Banco legado é copiado pela API backup do SQLite e bancos antigos recebem snapshot antes de migrations. Build debug permite BAROPRESS_TEST_DATA_DIR; release usa o diretório normal. Detalhes e limites em docs/audit/AUDITORIA_FINAL.md.

## Desempenho 0.2.9

O invoke_handler só enfileira a mensagem em command_queue. Um worker dedicado
executa autorização e comando em ordem, mantendo o modelo serial anterior e
retirando locks de banco, Argon2, consultas e esperas de serial da janela.
Nenhum comando foi declarado async isoladamente: a autorização também precisa
ficar fora da janela. Falha de autorização e comando desconhecido rejeitam o invoke.

patients_list/exams_list aceitam limit/offset opcionais. O histórico e Pacientes
pedem 51 linhas e mostram 50, usando a linha extra para habilitar Próxima; os
seletores existentes conservam a listagem completa quando não pedem paginação.
A ordem inclui ID para estabilizar empates. Não houve migração de esquema.

A interpolação separa as 15 linhas horizontais do passe vertical, com clamp em
cada etapa como antes, precisão Float64 intermediária e resultado Float32.
O Canvas mantém workspace por resolução; relatórios usam buffers independentes.
Polling de status não se sobrepõe, respostas antigas são ignoradas após desconexão
e uma inscrição parcial de eventos é desfeita se a conexão falhar. Eventos de
sensores continuam completos; o endpoint de polling de frames não utilizado foi
removido. Contadores visuais são publicados no máximo a cada 250 ms; erros e
mudanças de conexão continuam imediatos.
