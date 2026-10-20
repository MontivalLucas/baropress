# BAROPRESS — Sistema de Baropodometria 15×15 (TCC)

O plano BAROSYS foi executado no código fonte em 09/10/2026: condições e
qualidade, retenção de quadros, reprodução, regiões manuais, análise temporal,
relatórios/comparação e vista 3D. O protocolo de bancada foi preparado;
ensaios reais e viabilidade dinâmica serão feitos com o operador depois.
Não foi gerado ou instalado pacote novo. A versão de uso continua preservada.

Métodos e limites: [análise estática](docs/barosys/METODO_E_LIMITES.md).
Evidências e roteiro: [verificação F07](docs/barosys/VALIDACAO_E_DEMONSTRACAO.txt).
Status por fase: [plano vigente](Sprint/04_Futuro/PLANO_MELHORIAS_BASEADAS_NO_BAROSYS.txt).
Novos exames guardam até 10.000 quadros com tara/orientação/tempo congelados;
exames antigos mantêm indicadores e avisos de dados indisponíveis. ADC e
centro relativo não equivalem a pressão local ou CoP físico validado.

A nova migração é o esquema 8. Faça a homologação inicial em banco isolado:
um banco migrado não pode ser aberto pelo executável antigo de esquema 7.

Versão 0.2.11 — calibração simplificada, balões de ajuda e medidas padrão do tapete. Mantém as correções de conexão, proteção de saída e histórico da 0.2.10. Relatórios em Histórico de Exames; Arduino, Backup e Logs em Configurações. Anamnese de 40 perguntas incluída em Questionários. Registros na Sprint.

Calibração e medidas padrão: [entrega 0.2.11](docs/corrections/CALIBRACAO_SIMPLIFICADA_0.2.11.md). Correções anteriores: [0.2.10](docs/corrections/CORRECOES_0.2.10.md). Próximos passos com prioridade e critérios: [pendências](Sprint/04_Futuro/PENDENCIAS_POS_CORRECOES_0.2.10.txt).

Auditoria, correções e limites reais de validação: [docs/audit/AUDITORIA_FINAL.md](docs/audit/AUDITORIA_FINAL.md).
Login agora é validado no backend. O primeiro uso cria o administrador; ele cadastra a equipe em Configurações > Sistema > Conta e segurança. Guarde o código de recuperação exibido uma única vez. Contas antigas podem gerar um código após entrar com a senha atual. Não há envio de e-mail/SMS nem redefinição por nome/CPF.

Sistema desktop de baropodometria desenvolvido em **Tauri 2 + React + TypeScript + Rust + SQLite**.

## Módulos Implementados

* **Fase 1 — Fundação:** Autenticação local com Argon2, SQLite (`%APPDATA%/br.com.baropress.app/baropress.db`), Dashboard, layout profissional e tema claro/escuro.
* **Fase 2 — Módulo de Pacientes:** CRUD completo de pacientes, validações de CPF e dados antropométricos, busca em tempo real, arquivamento e histórico de exames.
* **Fase 2.5 — Instalador Windows:** Build de produção release e instalador executável Windows NSIS (versão atual: `BAROPRESS_0.2.11_x64-setup.exe`).
* **Fase 3 — Aquisição de Dados:** Controles em Configurações > Arduino, com conexão automática após login, comunicação USB Serial/Bluetooth SPP, baud rate salvo, simulador Mock 15×15, parser de 225 valores, buffer desacoplado e tara por média.
* **Fase 4, 4.1 & 4.2 — Análise Baropodométrica, Ajustes e Layout:** Mapa de calor contínuo por interpolação bicúbica (Catmull-Rom), Centro de Pressão (CoP), escala térmica, ajustes (Gamma, Vmax, Threshold, Suavização, FPS e Resolução) e modos Automático/Manual. O layout desktop ainda precisa da homologação visual nos tamanhos documentados na auditoria.
* **Fase 5 — Exames Baropodométricos:** Ciclo completo de exame estático vinculado a paciente (Seleção de Paciente -> Confirmação -> Preparação e Estabilização -> Aquisição Controlada -> Média Temporal de 225 Sensores -> Resultado e Indicadores -> Persistência Segura em SQLite). Listagem de exames com busca e filtros, inspeção e reabertura com mapa de calor contínuo, CoP e métricas objetivas (ADC relativo), histórico integrado no prontuário do paciente e distinção inequívoca entre ESP32 REAL e SIMULAÇÃO.
* **Fase 6 — Relatórios Baropodométricos:** Módulo de geração, visualização, impressão e exportação em PDF local (A4 em 2 páginas principais e continuação para observações longas). Usa matriz e parâmetros salvos no exame (`ExamDetails`) e cópia demográfica gravada com os novos exames (cadastro atual com aviso nos antigos), renderiza o mapa contínuo interpolado em alta resolução com retículo CoP e legenda térmica, formata indicadores quantitativos (pressão máx/média, área, CoP e gráfico de barra proporcional de distribuição bilateral de carga), campo para observações clínicas com salvamento explícito, cabeçalho/rodapé com timestamp real, aviso técnico legal e diferenciação inequívoca de exames REAL e SIMULAÇÃO. Zero envio externo de dados.


* **Fase 7 — Comparação e Evolução:** De 2 a 4 exames do mesmo paciente, mapas com escala comum, métricas, gráficos por data e trajetória do CoP nos novos exames.
* **Fase 8 — Agenda:** Calendário dia/semana/mês, consultas, profissionais, status, observações e validação de horários sobrepostos.
* **Fase 9 — Questionários:** Editor por grupos, cinco tipos de perguntas, ativação e histórico com cópia do modelo utilizado.
* **Fase 10 — Backup e Exportação:** Backup completo e individual, prévia, confirmação, cópia de segurança e restauração transacional; CSV, PNG e JSON do exame.
* **Fase 11 — Refinamento:** Preferências persistentes, logs, acesso por teclado, telas sob demanda e compilação final.
## Documentação Técnica

* [FASES_7_A_11.md](docs/FASES_7_A_11.md): uso dos novos módulos e limites de validação.
* [ARCHITECTURE.md](docs/ARCHITECTURE.md): Arquitetura e fluxos do sistema.
* [BUILD_WINDOWS.md](docs/BUILD_WINDOWS.md): Instruções de compilação e empacotamento do instalador Windows.
* [BAROPODOMETRY.md](docs/BAROPODOMETRY.md): Detalhamento matemático da matriz 15×15, interpolação, CoP e métricas.

## Organização e Progresso

A pasta [Sprint](Sprint/00_LEIA_PRIMEIRO.txt) reúne referências, trabalho concluído,
pendências, planejamento e histórico de entregas em TXT. Consulte o índice para
localizar cada status e registrar o progresso das próximas tarefas.

## Check-up de desempenho 0.2.9

Pacientes e Histórico de Exames exibem **50 registros por página**, com busca
no banco após uma pausa curta de digitação. As operações Rust passam por uma
fila fora da janela; autorização e ordem dos comandos são preservadas.
Painéis administrativos recebem apenas os estados que utilizam. O mapa de calor
reutiliza buffers e mantém a superfície da versão anterior.

Resultados, limpeza e limites: [CHECKUP_0.2.9.md](docs/performance/CHECKUP_0.2.9.md).
Os testes usam dados sintéticos; a navegação no WebView2 e o ESP32 real ainda
precisam de conferência manual. Desenvolvimento e testes exigem Node.js 20+.

## Configuração Antes do Exame

Os ajustes do mapa de calor ficam em **Análise** e **Novo Exame**. Configurações
reúne Sistema, Arduino, Backup e Logs; o painel duplicado do mapa foi removido.

Em **Novo Exame**, selecione o paciente e a modalidade: ambos os pés, pé esquerdo
ou pé direito. Para avaliar os dois separadamente, marque a sequência e selecione
primeiro o pé inicial. Após revisar a primeira etapa, avance, posicione o outro
pé e inicie a segunda preparação. A gravação das duas etapas é conjunta; cada
pé mantém seus quadros, mapa e indicadores, ligados pelo identificador da sequência.

Selecione 30 ou 45 segundos para cada coleta. Preferências antigas de duração
são normalizadas para 30 segundos, preservando a escolha de 45 segundos.
O trajeto em ciano acompanha o centro relativo ponderado pelas leituras ADC
durante a aquisição. Perdas de contato e lacunas separam o traçado; ele também
é reconstruído dos quadros ao reabrir o exame. Não é o centro de gravidade.

Abra **Configurações do exame**.
Ative a prévia ao vivo para ajustar Gamma, VMAX, threshold, suavização, FPS visual,
resolução, modo Auto/Manual e marcador de CoP. Os últimos ajustes usados na Análise
são compartilhados com o próximo exame e persistidos no banco local. Para zerar a tara, deixe a plataforma sem carga.

Ao iniciar, o sistema aguarda a conexão, prepara por 5 segundos e coleta durante
30 ou 45 segundos (30 por padrão). Os parâmetros ficam fixos na coleta. No resultado, use
a mesma barra da Análise para ajustar Gamma, VMAX, suavização, FPS visual e CoP;
**Ajustes avançados e resolução** abre o painel completo. O limiar de contato
fica fixo para preservar as métricas, a trajetória e os dados físicos.

Se o mapa estiver muito vermelho, aumente **VMAX** ou use **Ajustar VMAX ao pico**.
Gamma controla o contraste intermediário; não recupera valores já saturados
pelo VMAX. Para comparar exames, mantenha uma escala manual comum.
Os ajustes visuais finais são salvos no exame e compartilhados com a Análise
e próximos exames. Exames anteriores mantêm seus parâmetros históricos.

Depois de revisar o resultado, clique em **Salvar Exame no Banco**. Se houver erro,
**Tentar novamente** repete a gravação mantendo a amostra.

Execute pelo `iniciar_baropress.bat` para usar o código atualizado. Uma instalação
anterior só recebe as alterações após recompilar e atualizar seu executável.
Instalador desta entrega: [BAROPRESS 0.2.9](src-tauri/target/release/bundle/nsis/BAROPRESS_0.2.9_x64-setup.exe).
O executável novo está em `src-tauri/target/visualizacao/release/baropress.exe`;
o build foi separado porque o executável release anterior estava aberto.

## Histórico de Exames e PDF

O histórico e os documentos ficam em **Histórico de Exames**. O botão **Relatório** de cada
exame abre a prévia A4, as observações, a impressão e a exportação em PDF.
**Voltar para Histórico de Exames** retorna à mesma lista. A aba separada Relatórios e sua
listagem duplicada foram removidas; as funções de emissão foram mantidas.

## Backup e Logs em Configurações

O menu lateral reúne os exames em **Histórico de Exames**.
Em **Configurações > Backup** ficam exportação completa/individual, prévia
e restauração, com acesso de administrador. Durante uma operação de backup,
a troca de guias fica indisponível até a conclusão.
Em **Configurações > Logs** ficam filtro por nível, atualização e exportação
dos eventos exibidos, além dos registros de aquisição da sessão.

## Arduino e conexão automática

A aba Aquisição foi removida. Em **Configurações > Arduino** ficam porta,
baud rate, conexão, leitura contínua, tara, matriz 15×15 e logs. O Dashboard
e Testes e calibração têm atalhos para essa configuração.

No modo **Hardware Real**, a conexão começa automaticamente após o login
e o carregamento das preferências. Prioriza a porta salva; sem ela disponível,
procura um Arduino/adaptador reconhecível único. Se houver mais de uma opção,
selecione a porta uma vez em Configurações. O baud rate salvo é reutilizado.
Sem dispositivo, continua procurando a cada três segundos, incluindo quando
o USB é conectado depois da abertura. Uma desconexão manual pausa as tentativas
nessa sessão; **Conectar Dispositivo** permite retomar.

Instalações novas usam Hardware Real por padrão. **Simulação** anteriormente
selecionada é preservada e conectada manualmente. A conexão automática não
inicia exames, leitura contínua, tara nem captura de calibração; essas ações
continuam nos seus controles. Novo Exame inicia a leitura quando necessário.

## Questionários incluídos

Ao abrir **Questionários** na versão 0.2.7, o programa inclui automaticamente
**Anamnese para avaliação baropodométrica — v1**, com 40 perguntas em 7 grupos.
O modelo vem de [docs/questionnaires](docs/questionnaires/ANAMNESE_BAROPODOMETRICA.md)
e mantém os textos, opções, grupos e campos obrigatórios do JSON original.
Selecione um paciente e use **Responder**; **Editar** permite personalizar.

A inclusão ocorre uma vez por banco e preserva alterações e desativação.
Um modelo previamente cadastrado com o mesmo nome é adotado sem sobrescrita.
Cada aplicação salva mantém sua cópia do modelo no histórico do paciente.

## Usuários e perfis — 0.2.13

Em um computador sem contas cadastradas, a tela de login abre automaticamente
**Cadastre-se no primeiro acesso**. Informe nome, e-mail, RA, senha e confirmação.
A primeira conta será **Administrador**, com acesso completo. Após guardar o
código pessoal de recuperação, continue para o programa. As próximas contas são
criadas pelo administrador na aba **Usuários**, com o perfil escolhido.

A aba **Usuários** é exclusiva do administrador. Profissionais têm acesso clínico;
secretários podem cadastrar pacientes, consultar resultados concluídos e **criar e
consultar agendamentos**. Edição/cancelamento de consultas permanece com
profissional/admin. As regras também são aplicadas no backend.

RA é obrigatório nos cadastros novos; contas antigas sem RA continuam entrando.
Em **Esqueci minha senha**, informe e-mail e RA para definir outra senha; o código
pessoal/temporário continua como alternativa para contas sem RA. O RA é um
identificador reutilizável: quem conhece e-mail e RA pode redefinir a senha. Consulte o [relatório e as pendências](docs/corrections/USUARIOS_LOGIN_ACESSO.md)
e o [plano registrado no Sprint](Sprint/04_Futuro/PLANO_USUARIOS_LOGIN_ACESSO.txt).

## Execução em Desenvolvimento

```bash
npm install
npm run tauri:dev
```

## Verificação e Testes

```bash
npm run typecheck
npm run build
npm test
cargo test --manifest-path src-tauri/Cargo.toml
```


## Entrega 0.2.14 — 14/10/2026

Instalador Windows x64: [BAROPRESS 0.2.14](entrega/BAROPRESS_0.2.14_x64-setup.exe).
Aplicativo: [baropress.exe](entrega/BAROPRESS_0.2.14/baropress.exe), com as duas DLLs na mesma pasta.
Inclui aquisição de 30/45 s, modalidades e sequência por pé, trajeto ao vivo e formulário simplificado.
217 testes frontend, 127 backend e build/NSIS aprovados; 1 benchmark ignorado. Pacote gerado sem instalação automática.


## Organização e limpeza conservadora — 20/10/2026

Consulte o [mapa das pastas e critérios de manutenção](docs/maintenance/ORGANIZACAO.md) e o [relatório da auditoria](docs/maintenance/AUDITORIA_2026-10-20.md). Funções, contratos, migrações e dependências foram preservados; a limpeza foi limitada a renders temporários comprovadamente duplicados.
