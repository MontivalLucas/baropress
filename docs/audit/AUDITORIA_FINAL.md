# Auditoria final do BAROPRESS
Data: 07/10/2026. Versão: 0.2.1. Instrução executada: Sprint/BAROPRESS_AUDITORIA_CORRECAO_LOGIN_CODEX.txt.

## Resultado e cobertura real
Foram descobertas **13 rotas autenticadas + login (14 páginas principais)**, **18 telas/visualizações** contando cadastro/edição/detalhes do paciente e prévia do relatório, **2 abas do exame em 1 tablist**, **6 definições de painéis/diálogos** (5 modais e um painel visual), **234 definições estáticas de controles em 32 arquivos** e **43 comandos Tauri**.

O inventário percorre todo JSX atual, incluindo componentes compartilhados, controles condicionais e templates de listas. Conta uma definição por trecho de código; não conta uma linha de paciente ou opção de dropdown como um botão independente em runtime. O detalhamento de cada controle, handler, arquivo/linha e bloqueio está em [INVENTARIO_FUNCIONAL.md](INVENTARIO_FUNCIONAL.md), com dados reproduzíveis em [inventario.json](inventario.json).

**0 fluxos completos e 0 dos 234 controles foram TESTADOS NA INTERFACE.** Os 234 controles foram inventariados/INSPECIONADOS NO CÓDIGO e permanecem pendentes de clique/teclado. Foram verificadas partes de lógica das 12 famílias abaixo por testes automáticos; isto não equivale a 12 jornadas completas de UI. O desktop foi compilado e a janela isolada foi localizada, mas a captura foi BLOQUEADA pelo timeout de aprovação do Computer Use. Layouts 1280x720, 1366x768, 1440x900 e 1920x1080, hardware e impressão NÃO TESTADOS.

Suítes finais: **132 testes frontend (17 arquivos) + 63 backend**, todos aprovados. TypeScript, Vite e executável release aprovados; instalador NSIS Windows x64 **0.2.1** gerado. Logs exatos em [RESULTADOS_TESTES.md](RESULTADOS_TESTES.md). A geração do instalador não é teste de instalação.

## Matriz das páginas, abas, seções e ações
Em cada linha, evidência de comportamento de UI é INSPECIONADO NO CÓDIGO. A coluna automática cobre só funções/stores/banco citados. Estados padrão a homologar por controle: inicial, vazio, carregando, sucesso, erro, cancelamento, desabilitado e saída/volta, quando aplicável.

| Rota / tela | Abas, seções e controles descobertos | Dependências / esperado | Evidência automática / pendência |
|---|---|---|---|
| Login | Verificar contas/retry; Entrar; e-mail/senha; Enter; mostrar/ocultar; criar conta; recuperação; código/nova senha/confirmação; recibo e checkbox | SQLite users/settings, AuthState; primeiro admin único, registro posterior privado, erro genérico | auth.test.ts, auth_tests.rs; telas/Enter/loading/leitor de tela não executados |
| Dashboard | Quatro indicadores; estado da esteira | dashboard_stats, dispositivo; excluir consultas canceladas, data exibida local | Consultas e bancos testados; cards/erro/status visual inspecionados |
| Pacientes — lista | Pesquisa, limpar, retry, cadastrar, abrir/editar, vazio/sem resultado | patients_list; filtro recente não pode receber resposta antiga | patients.test.ts + patients.rs tests; busca/teclado UI pendentes |
| Pacientes — novo/edição | Nome/social, nascimento, sexo, CPF, e-mail/telefone, profissão, altura/peso/calçado, endereço/observações; salvar/cancelar topo e rodapé, voltar | Validações e CRUD SQLite; altura em cm e CPF único entre ativos | CRUD/CPF/finitude testados; HTML/React UI pendente; faixas UX-04 não unificadas |
| Pacientes — detalhes | Dados, IMC, editar/voltar, arquivar modal cancelar/confirmar, exames, consultas, questionários, comparar, abrir exame/relatório | patients_get/exam_history, agenda/anamnese, session routing | Integridade/arquivamento/BMI testados; tabulação e modal pendentes |
| Aquisição | Real/mock, portas/retry, baud, cinco padrões mock; conectar/desconectar/iniciar/pausar; tara zerar/ativar/limpar; matriz225 e logs/limpar | serial Rust/eventos e mock TS; uma conexão, valores 0–4095, render independente | Parser, buffer, tara, mock e concorrência testados; USB/SPP/pairing/perda física NÃO TESTADOS |
| Análise | Mapa/legenda/métricas; aquisição/tara/padrões; cinco sliders; Auto/Manual, CoP, padrão; painel avançado com resolução, ?/Escape, concluir/fechar | Matrizes orientadas, métricas, interpolação/Canvas e configurações | baropodometry*.test.ts e audit-science; Canvas real/CPU/viewport NÃO TESTADOS |
| Exames | Busca, atualizar, novo, detalhes, relatório e comparação | exams_list/get; lista e vínculos corretos | Rust CRUD e reabertura testados; botões UI pendentes |
| Novo exame | Selecione paciente > confirmar; abas Paciente/Configurações do exame; prévia/tara/ajustes/duração > preparar/coletar > resultado/repetir/descartar > salvar/retry > sucesso; detalhes/voltar/histórico; cancelar modal | Runtime subscribe dispositivo; parâmetros fixos, janela real, média e trajectory, transação | exams.test.ts runtime/mock/10s/cancelamento/retry; Rust persistência; série física/GUI NÃO TESTADAS |
| Detalhes do exame (modal) | Mapa/CoP/métricas/parametrização; fechar; CSV/PNG/JSON; gerar relatório | exams_get, arquivo salvo e download; nunca inventar dados ausentes | Persistência, CSV, validações e formatação testados; PNG/download/foco UI pendentes |
| Relatórios — lista | Busca, atualizar, visualizar, loading/erro/vazio | exams_list/get; mensagens em tela e requisição mais recente | Serviços e validação testados; interação de busca/volta pendente |
| Relatórios — prévia | Duas páginas principais; origem REAL/SIMULATION, paciente/matriz/legenda/métricas/ajustes; observações; voltar, PDF, imprimir | Valores originais do exame, dados atuais do paciente; texto adicional entra apenas na saída | jsPDF A4/páginas/longas notas testado em Node; Canvas, abertura de arquivo e impressão NÃO TESTADOS |
| Comparação | Paciente, checkboxes2–4, comparar; escala compartilhada; tabelas/7 gráficos/CoP; avisos | Mesmo paciente e exames concluídos; parâmetros não mudam métricas gravadas | comparison.test.ts; seleção, datas/SVG/mapas/foco UI pendentes |
| Agenda | Dia/semana/mês; data, anterior/próximo/hoje; criar pelo dia, editar consulta; paciente/profissional/tipo/status/notas; cancelar/salvar/excluir com confirmação; profissional novo | Agenda SQLite, conflitos paciente/profissional, horários adjacentes aceitos | Calendar e Rust CRUD/conflitos testados; todos os controles/modal UI pendentes |
| Questionários | Novo/editar modelo, nome/descrição/ativo, grupos/perguntas/tipos/opções/obrigatório/ativo, adicionar/remover/cancelar/salvar; paciente, responder 5 tipos, cancelar/salvar; histórico expansível | SQLite transacional, snapshots, 0 e false válidos; respostas antigas preservadas | questionários frontend/Rust + workflow5 tipos testados; formulários UI pendentes |
| Backup | Exportar completo/individual, paciente; arquivo64MB, prévia/counts/checkbox; pausar e importar/restaurar; aviso e logout | Somente admin; cópia antes de restauração, IDs remapeados, FK/rollback | Rust full/patient/erros/snapshot + fluxo integrado; arquivo real/GUI em base de teste pendentes |
| Logs | Filtro de nível, atualizar, exportar exibidos, tabela500, aquisição expandir | Logs persistidos sem credenciais/respostas; backend registra auth antes de revogar | support/auth/api privacy tests; filtro/download/UI pendentes |
| Configurações | Sistema/tema/duração; origem/COM/baud e gerenciar conexão; painel visual, padrão/concluir; auto-save/salvar agora; conta e segurança: trocar, provisionar, criar equipe admin | SQLite settings; alteração senha exige senha atual e encerra sessão; prefs globais | Preferences/store serialWriter/Rust/auth testados; forms/restart visual pendentes |
| Sidebar / recovery de tela | Todas as13 rotas, página ativa; tema; sair; ErrorBoundary > Dashboard | Sessão backend; limpeza de dispositivo/amostra; manter orientação e navegação cruzada | Guarda backend/testes sessão; clique/atalhos/erro de render NÃO TESTADOS |

## As 12 famílias de fluxos
1. Primeiro uso, login, conta da equipe, sessão/logout.
2. Provisão/recovery/troca de senha.
3. Pacientes CRUD/busca/arquivo/histórico.
4. Aquisição/parser/buffer/tara/mock/serial.
5. Análise e ajustes/métricas/orientação.
6. Exame estático/preparo/coleta/processamento/salvar/reabrir.
7. Relatório/PDF/CSV/PNG/JSON/impressão.
8. Comparação/evolução.
9. Agenda/profissionais/conflitos.
10. Questionários/modelos/respostas/snapshots.
11. Backup/export/restore/importação individual.
12. Preferências/logs/navegação cruzada/instalador.

Todas têm partes de lógica testadas; o “serial físico”, Canvas/download/print e instalação não fazem parte dessa aprovação automática. Nenhuma família está declarada homologada em interface/hardware.

## Consistência científica e dados
- 225 valores, matriz15x15, limites ADC 0–4095. Tara subtrai baseline no espaço bruto; normalizeMatrixOrientation espelha horizontalmente uma vez na visualização ou runtime de coleta. Banco/PDF usam a média já orientada, sem repetir espelhamento.
- CoP ponderado por pressão acima/incluindo threshold nas coordenadas0–14. Esquerda cols0–6, centro7, direita8–14. Centro participa de pressão total/CoP/área/média e é excluído apenas do denominador esquerda+direita.
- Área = sensels que passam o limiar /225; média temporal é por sensor e arredondada a uma casa. Não há conversão ADC→kg/N/pressão física.
- Gamma, vmax, suavização, renderFps e resolução afetam apresentação; threshold altera contato/métricas; modo AUTO pode mudar threshold e vmax ao vivo. No exame parâmetros são congelados. audit-science prova que ajustes exclusivamente visuais não alteram matriz/métricas.
- Origem SIMULATION é identificada e preservada. Comparação avisa mistura de fontes/limiares. Trajetória nova é gravada; ausência de dados antigos não é fabricada.
- Regra de contato em threshold0 preservada para decisão SCI-01. Snapshot de dados demográficos do paciente não existe (HIST-01); configuração/matriz do exame são históricas.
- Cinco migrations existentes mantidas; não foi acrescentada migration nem reset de banco. Recovery usa keys auth.recovery.ID em settings. Full backup preserva esses hashes; individual não inclui contas/settings.
- Bancos de testes: in-memory/temporários e target/audit-runtime. Banco real de pacientes não foi aberto/restaurado por esta auditoria.

## Leitura complementar
[Problemas](PROBLEMAS_ENCONTRADOS.md) · [Alterações](ALTERACOES_APLICADAS.md) · [Resultados](RESULTADOS_TESTES.md) · [UX](REDUNDANCIAS_E_UX.md) · [Plano](PLANO_DE_CORRECOES.md) · [Pendências](PENDENCIAS_E_RECOMENDACOES.md) · [Roteiro manual](CHECKLIST_MANUAL.md).
