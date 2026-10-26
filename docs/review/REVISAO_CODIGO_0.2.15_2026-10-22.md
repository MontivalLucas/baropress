# Revisão de código BAROPRESS 0.2.15 — 22/10/2026

## Parecer

**Solicitar correções.** Foram identificados três riscos P1 e três problemas P2. A suíte verde não cobre todos os comportamentos da interface. Esta entrega revisa o código; não aplica correções funcionais.

P1: tratar antes de uso confiável com dados reais. P2: corrigir na próxima manutenção. As oportunidades de simplificação estão separadas dos defeitos.

## Alcance e método

Inventário de 171 arquivos em src, src-tauri/src e migrações, com 26.209 linhas: 141 arquivos TypeScript/TSX, 20 Rust, nove migrações e CSS. Revisão dos fluxos de autenticação/perfis, pacientes, agenda, questionários, aquisição, calibração, processamento, histórico, comparação, relatórios, backups, preferências e navegação. Inspeção das configurações, scripts e documentação; o protótipo Liquid Glass foi verificado separadamente.

Skills: code-review-and-quality, code-simplification, performance-optimization e security-and-hardening. Caveman aplicado apenas à conversa. Não foi necessária alteração da arquitetura ou instalação de dependências.

Fronteiras consideradas: formulário/IPC, USB serial, arquivo de backup e sessão. Ativos: contas, prontuários, amostras, resultados e disponibilidade da aplicação. Verificados autorização no backend, parâmetros SQL, limites de entrada, consistência histórica, concorrência e custos de processamento.

O inventário cobre todo o código listado; a profundidade manual foi maior nos fluxos críticos. Isso não equivale a executar todos os caminhos. Não houve ensaio com ESP32, banco clínico, impressora ou homologação no WebView2. O benchmark Node não mede a interface Windows. Não foi feita auditoria de advisories Rust com cargo-audit, indisponível nesta instalação.

As seis alterações locais já existentes foram preservadas: package.json, package-lock.json, src-tauri/Cargo.toml, src-tauri/Cargo.lock, src-tauri/tauri.conf.json e src/features/exams/ExamDetailsModal.tsx. Uma mutação temporária do mapa foi restaurada e conferida por SHA-256. Nenhum dado clínico foi aberto ou alterado.

## Achados obrigatórios

### R1 — P1 — E-mail e RA permitem assumir uma conta

**Local:** src-tauri/src/auth.rs:457–459, 488–496; src-tauri/src/auth_tests.rs:772–794.

A recuperação aceita a igualdade de e-mail e RA como autorização para trocar a senha. Não exige código secreto nem sessão. O mesmo RA permite repetir a recuperação, inclusive de administrador. Quem conhece esses identificadores pode assumir a conta e acessar os dados permitidos ao perfil.

É um comportamento intencional, documentado no README e coberto por teste; não se trata de regressão descoberta nesta revisão. Ainda assim, o risco permanece. Argon2 e limite de tentativas não protegem quando os identificadores corretos já são conhecidos.

**Correção proposta:** manter RA como identificador e exigir código de recuperação aleatório, temporário ou atendimento por administrador autenticado. A mudança exige decisão de produto sobre o requisito atual. **Aceite:** conhecer e-mail/RA não deve autorizar troca; código expirado/consumido deve falhar; recuperação válida deve continuar revogando sessões.

### R2 — P1 — O próprio aplicativo exporta backups que não consegue importar

**Local:** src-tauri/src/backup.rs:198–201, 565–566, 578–580; src/features/backup/BackupPage.tsx:65–68.

A exportação serializa todo o banco sem limite. A prévia e a importação rejeitam arquivos acima de 64 MiB (67.108.864 bytes). A cópia automática anterior à restauração usa o mesmo formato sem garantir que possa ser restaurada.

**Evidência:** para 450 quadros com 225 leituras de quatro dígitos, apenas os lotes brutos de um exame ocupam aproximadamente 531.593 bytes no envelope de backup. Cerca de 127 exames desse exemplo já excedem o limite, antes de incluir as demais tabelas. O volume exato depende das leituras e metadados. O cálculo é sintético; não foi exportado um banco real.

**Correção proposta:** garantir compatibilidade de tamanho entre exportação e restauração, com armazenamento/leitura por partes e limites explícitos de memória. Um bloqueio claro na exportação evita falsa garantia enquanto o formato escalável não existir. **Aceite:** todo backup anunciado como concluído deve passar pela prévia e restaurar em banco isolado, inclusive acima do limite atual.

### R3 — P1 — Leitura serial sem tamanho máximo pode impedir interrupção

**Local:** src-tauri/src/acquisition.rs:284–285, 292, 320–321, 396–403.

String::with_capacity(2048) reserva memória inicial; não limita a linha. read_line continua acumulando bytes enquanto não encontra quebra de linha. Se um dispositivo transmitir continuamente sem delimitador, o buffer cresce e o laço não volta a verificar stop_signal ou sessão. Pausar/desconectar espera handle.join(), podendo ficar preso.

**Evidência:** reprodução com o mesmo BufReader/read_line recebeu 1.048.576 bytes sem quebra e aumentou a capacidade de 2.048 para 1.048.576 bytes. A prova usa stream finito em memória; travamento com stream contínuo é deduzido do fluxo e precisa de teste de integração.

**Correção proposta:** leitura incremental com limite de linha compatível com 225 valores, descarte até delimitador após excesso e verificação de cancelamento entre blocos. **Aceite:** entrada contínua sem quebra não cresce indefinidamente e não impede pausa/desconexão; quadro normal e fragmentado continua válido.

### R4 — P2 — Limitador de FPS descarta definitivamente a última imagem

**Local:** src/features/baropodometry/BaropodometricHeatmap.tsx:62–70.

Quando uma atualização chega antes do intervalo visual, o efeito retorna sem agendar a pintura pendente. Ao pausar reprodução ou trocar rapidamente o quadro selecionado, o canvas pode conservar a imagem anterior enquanto o restante da tela mostra a nova seleção. Não há alteração dos dados persistidos, mas a inspeção fica inconsistente.

**Evidência:** com FPS 30, entrada 100 em t=100 ms e entrada 900 em t=110 ms, só 100 foi desenhado. Avançar o relógio não agenda a imagem perdida. Prova isolada com substitutos de hooks e canvas, sem navegador.

**Cobertura:** inverti temporariamente a condição de descarte de '<' para '>'. Os 217 testes continuaram passando. O arquivo original foi restaurado, SHA-256 e82583a7e7d746cd40c01c985f0434be9e19346e031234c9213683587f4d35d3.

**Correção proposta:** reter a atualização mais recente e pintar ao terminar o intervalo, cancelando agendamento na desmontagem; para imagem estática, permitir atualização imediata. **Aceite:** após duas mudanças rápidas e pausa, canvas, seleção e indicadores devem corresponder ao último quadro. Adicionar teste que falhe com a mutação descrita.

### R5 — P2 — Profissional recebe ações que o backend sempre recusa

**Local:** src/features/agenda/AgendaPage.tsx:86; src/features/questionnaires/QuestionnairesPage.tsx:112, 120, 122; src-tauri/src/permissions.rs:42–68.

A Agenda mostra 'Novo profissional' para qualquer usuário que não seja secretário, incluindo profissional. Questionários mostra 'Novo modelo', 'Editar' e salvamento também para profissional. Os comandos professionals_create e questionnaires_save são exclusivos do administrador. O usuário pode preencher formulários inteiros e descobrir a restrição somente ao salvar.

**Correção proposta:** reutilizar isAdmin nas ações administrativas da interface, preservando resposta/consulta permitidas ao profissional e autorização Rust. **Aceite:** profissional não recebe criação de profissional nem edição de modelos; administrador mantém essas funções; chamadas diretas proibidas continuam recusadas.

### R6 — P2 — Ferramentas de desenvolvimento têm advisories ativos

**Local:** package.json:31–35 e package-lock.json. Evidências completas em npm-audit.json.

npm audit encontrou dez entradas de pacote: seis altas e quatro moderadas. São ferramentas de desenvolvimento e suas dependências; npm audit --omit=dev encontrou zero. Contagens de pacote não equivalem a dez vulnerabilidades independentes. Não foi demonstrada exploração no aplicativo empacotado.

O lockfile contém Vite 6.4.3, Vitest 4.1.11 e Tailwind 3.4.19. iniciar_baropress.bat:9 executa tauri dev, portanto o ambiente de desenvolvimento faz parte do caminho de execução documentado para o usuário.

A advisory Windows do launch-editor inclui Vite até 6.4.3 e informa correção em 6.4.4: [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm). A advisory de travessia no mocker inclui 4.1.11 e informa correção em 4.1.12: [GHSA-xp26-3454-mjgp](https://github.com/advisories/GHSA-xp26-3454-mjgp). Consultadas em 22/10/2026.

**Correção proposta:** atualizar Vite e Vitest separadamente, revisar changelogs e repetir os testes. Triar Tailwind e transitivas pelo uso real; a remediação sugerida envolve versão principal e não deve ser aplicada com --force. **Aceite:** alertas alcançáveis corrigidos ou adiados com justificativa, responsável e data de revisão; lockfile e build conferidos por atualização.

## Otimização e simplificação — propostas separadas

1. **Evitar consultas repetidas no ajuste/validação.** calibration.rs:1060–1064 lê todos os ensaios de ajuste dentro do laço de cada ensaio de validação. Com 100 ensaios em cada conjunto, são 10.000 chamadas get_trial somente nessa verificação. Carregar os metadados do ajuste uma vez por operação. Medir consultas e tempo antes/depois; não foi medido ganho de latência nesta revisão.
2. **Compartilhar a série temporal do detalhe.** useExamTrajectory.ts:13 carrega todos os quadros; AnalysisReview.tsx:29 volta a buscá-los quando o operador abre a revisão. Compartilhar a mesma carga pelo componente proprietário, preservando leitura limitada e validação de quantidade. Medir bytes IPC e processamento antes de alterar.
3. **Reduzir publicação de estado durante coleta.** examStore.ts:273 copia trajetória, quadros e timestamps a cada quadro; collectRawFrame publica novamente. NewExamPage.tsx:45 assina o store inteiro. Separar retenção da amostra da publicação visual e usar seletores por etapa. Confirmar necessidade com perfil no WebView2; não reduzir amostragem para acelerar renderização.
4. **Separar responsabilidades por domínio.** calibration.rs tem 2.527 linhas, incluindo testes, e mistura captura, curvas, validação, importação e conversão. Extrair essas responsabilidades em módulos, mantendo contratos e testes. AnalysisReview.tsx concentra várias funções e blocos JSX em linhas longas: separar reprodução, editor de regiões e carregamento torna os estados verificáveis. Não criar camadas pass-through.
5. **Tratar pendências científicas já registradas.** metrics.ts:25 conta zeros como contato com limiar zero; uma matriz zerada indica 225 sensores/100%, apesar de CoP indisponível. O relatório de 0.2.9 já registra a decisão pendente. Definir a regra do protocolo e aplicá-la também às regiões, em vez de mudar silenciosamente um resultado científico.

Não recomendo reescrever a interpolação agora. O benchmark sintético atual mediu medianas de 2,15 ms (150²), 2,37 ms (300²) e 6,88 ms (450²), 11 amostras após três aquecimentos. A dispersão foi alta, incluindo 28,81 ms em 450²; uma reexecução do mesmo código mediu 3,95 ms em 450², confirmando sensibilidade à carga do ambiente. Os números não comprovam latência da tela nem ganho sobre outra versão. Os buffers já são reutilizados e há teste de equivalência numérica.

## Verificações

- npm run build: aprovado, incluindo tsc --noEmit. Vite processou 1.943 módulos. Bundle principal 96,55 kB / 30,64 kB gzip; vendor-ui 170,68 kB / 52,28 kB gzip. PDF permanece em chunk separado.
- npm test padrão: 216 aprovados, um timeout de 5 s no teste de interpolação. Não foi tratado como defeito funcional confirmado.
- node node_modules/vitest/vitest.mjs run --maxWorkers=1 --testTimeout=30000: **217/217 aprovados**, 28 arquivos, 45,46 s. A mudança de worker e timeout foi apenas na linha de comando.
- Mutação do limitador visual: **217/217 ainda aprovados**; lacuna de cobertura confirmada. Fonte restaurado por cópia binária e hash.
- cargo test --manifest-path src-tauri/Cargo.toml: **127 aprovados, zero falhas, um benchmark ignorado**; 128 casos no total. Compilação 9 min 41 s; testes 112,17 s.
- npm audit: seis altas/quatro moderadas no conjunto de desenvolvimento. Produção: zero.
- scripts/check_project.cjs: nenhum arquivo TypeScript de runtime órfão; todas as sete dependências diretas de produção têm import.
- baropress-liquid-glass/verify.mjs: 27 verificações de fonte/lógica aprovadas, sem navegador.

## Evidências e reprodução

Arquivos em [evidencias-2026-10-22](evidencias-2026-10-22): inventário/hashes, testes frontend, mutação, auditorias npm, benchmark e provas isoladas. Os relatórios não contêm prontuários nem credenciais reais.

Na raiz do projeto, executar:

~~~powershell
node docs/review/evidencias-2026-10-22/reproduzir.cjs
rustc docs/review/evidencias-2026-10-22/serial_probe.rs -o "$env:TEMP/baropress-serial-probe.exe"
& "$env:TEMP/baropress-serial-probe.exe"
~~~

O primeiro comando mede interpolação, reproduz a perda de atualização em substitutos de hooks/canvas e estima tamanho dos lotes de backup. O segundo/terceiro demonstra o crescimento de read_line sem delimitador, sem acessar porta real. Esses experimentos não substituem testes de integração.

Próxima sequência recomendada: resolver política de recuperação; garantir restauração do backup exportado; limitar leitura serial; corrigir pintura e testar o último quadro; alinhar ações aos perfis; atualizar ferramentas por etapas. Refatorações e otimizações devem ficar em mudanças próprias, com medidas e equivalência de comportamento.
