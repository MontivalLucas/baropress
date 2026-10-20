# Checklist manual no Windows
Data: 07/10/2026. **NÃO EXECUTADO**, salvo abertura/localização da janela de teste. Não usar banco real.

## Preparação segura
1. Usar conta Windows/VM de teste ou build debug com BAROPRESS_TEST_DATA_DIR apontando para uma pasta de teste vazia. Essa variável só é aceita em build debug e ignora a cópia de diretório legado.
2. Para preparar o executável isolado: npm.cmd run tauri:build -- --debug --no-bundle --ci -- --offline.
3. No PowerShell, dentro do projeto:
```powershell
$env:BAROPRESS_TEST_DATA_DIR = Join-Path (Get-Location).Path 'src-tauri/target/manual-test'
& './src-tauri/target/debug/baropress.exe'
Remove-Item Env:BAROPRESS_TEST_DATA_DIR
```
4. Usar somente nomes/dados inventados. Guardar códigos apenas no ensaio local; nunca anexar códigos, CPF ou observações reais ao relatório.
5. Repetir telas nos tamanhos 1280x720, 1366x768, 1440x900 e 1920x1080, em temas claro/escuro. Registrar tamanho efetivo, recorte, scroll e proporção do mapa. Nenhum desses quatro layouts foi validado nesta auditoria.

## Login, conta e sessão
- Banco vazio: primeiro administrador, nome/e-mail válidos, senha >=12 com letras/números e confirmação; curto, confirmação diferente, e-mail inválido.
- Enter envia; loading bloqueia envio; Mostrar/Ocultar não envia formulário; labels e alertas lidos corretamente.
- Guardar código único e marcar confirmação; continuar e acessar dashboard.
- Sair: volta ao login e desconecta aquisição; reiniciar executável exige login; refresh do WebView usa auth_current.
- Entrar com senha errada: mensagem genérica; cinco erros bloqueiam por um minuto; testar após esperar.
- Criar conta na tela inicial com banco existente: orientação ao administrador, nenhum cadastro público.
- Admin em Configurações > Conta e segurança: cadastrar profissional/assistente; e-mail duplicado com maiúsculas recusado; entregar código privadamente ao titular sintético.
- Entrar como profissional: cadastro de equipe e backups negados no backend.
- Troca: senha atual errada não modifica hash; senha fraca/diferente da confirmação recusada; correta encerra sessão; senha antiga falha e nova entra.
- Provisionar recovery: senha atual obrigatória; novo código invalida anterior. Sair > Esqueci minha senha?; e-mail/código errados mostram mesma mensagem; correto altera senha; reutilização falha.
- Conta antiga sem código: login com senha antiga continua; gerar código autenticado. Sem senha/código não existe bypass por e-mail, nome ou CPF.

## Sidebar, dashboard e configurações
- Visitar cada uma das 13 rotas, voltar pelos botões e atalhos; checar página selecionada, carregamento e erro.
- Cards sem exames/pacientes e após salvar; consultas canceladas fora do total; status dispositivo atual.
- Tema; duração 3–60; origem/COM/baud desconectado; gamma/vmax/threshold/suavização/FPS/resolução/modo/CoP; padrão, concluir e salvamento explícito/automático.
- Fechar/reabrir e entrar: ajustes persistem. Ficar oito horas ou testar sessão inválida em base isolada: retorna ao login.
- Não sair enquanto gravação do exame está em andamento; mensagem e dados preservados.

## Pacientes
- Novo: nome obrigatório, CPF sintético válido/inválido/repetido, contato, nascimento, sexo, profissão, altura cm, peso kg, calçado, endereço e observações.
- Salvar pelo topo, rodapé e Enter; loading, erro de backend, cancelar/voltar sem gravar.
- Busca por nome/CPF, limpar, nenhum resultado, retry; digitar rápido e confirmar que resposta antiga não substitui filtro novo.
- Detalhes, editar, IMC, consultas/anamnese, abrir exame, comparar e relatório.
- Arquivar: cancelar/ESC/confirmar, registro sai da lista ativa, exames continuam preservados. Não há UI de desarquivamento implementada.

## Aquisição e análise
- Mock: conectar, padrões Centro/Esquerda/Direita/Uniforme/Dinâmico, iniciar/pausar, desconectar, logs e limpar.
- Conectar duas vezes rapidamente e desconectar durante abertura: só um dispositivo, sem timers órfãos.
- Serial: listar portas, COM/baud, erro em COM inválida, conectar ESP32, iniciar, pausar, perda física de conexão, reconectar.
- Bluetooth implementado é SPP via porta COM; testar pareamento no Windows manualmente. BLE nativo não existe.
- Receber 225 valores entre 0 e 4095; enviar quadro curto, longo, não numérico, negativo e excedido em firmware de teste; verificar contador/erro e frames seguintes válidos.
- Aplicar carga conhecida à esquerda/direita física: confirmar um único espelhamento, topo/anterior, CoP e métricas. Sem calibração, todas as pressões continuam ADC.
- Tara sem carga (20 frames), ativar/desativar/limpar; confirmar aviso de offset alto.
- Análise: cinco sliders, Auto/Manual, CoP, reset, painel avançado/resolução, concluir, ? por clique/Escape; FPS visual separado da entrada de frames.
- No threshold 0, registrar comportamento atual e encaminhar SCI-01; não “corrigir” regra durante homologação sem decisão.

## Novo exame, histórico e navegação cruzada
- Buscar paciente; aba Paciente e aba Configurações do exame; prévia, tara, todos os ajustes e durações.
- Preparação 5 s > coleta 10 s padrão; cronômetros avançam enquanto chegam frames; início só após conexão/aquisição.
- Cancelar/ESC/continuar; sair da página na coleta; ausência/perda de dispositivo; botão repetir.
- Resultado, salvar SQLite, falha simulada de gravação em base isolada e retry sem perder amostra; duplo salvar não duplica.
- Reabrir após restart: matriz225, parâmetros, duração, origem e trajetória mantidos.
- Histórico: busca, atualizar, detalhes, CSV225 linhas, PNG e JSON; voltar e relatório; matriz é média, não frames brutos.

## Comparação
- Abrir diretamente e pelo paciente/exame; selecionar mesmo paciente, 2–4 concluídos, limite4 e menos2.
- Comparar, escala comum ligada/desligada, matriz/tabela, sete gráficos, dados nulos, datas iguais/fusos e delta com base zero.
- Avisos de origem/tipo/threshold distintos; trajetória nova vs legado; ausência de contato.

## Agenda
- Dia/semana/mês, anterior/próximo, hoje, data; nova consulta pelo dia e botão; profissional novo.
- Paciente/profissional, data, início/término, tipo, status e notas; salvar/editar/cancelar.
- Conflito mesmo paciente/profissional recusado; horário adjacente aceito; consulta cancelada não bloqueia.
- Excluir em base de teste com confirmação; ESC/Tab/Shift+Tab e foco restaurado.

## Questionários
- Modelo: nome/descrição/ativo; grupo/texto/tipo/opções por linha, obrigatório/ativo; adicionar/remover, cancelar, salvar.
- Cinco tipos: texto, única, múltipla, número (incluindo 0), sim/não (incluindo Não); campo obrigatório e opções duplicadas.
- Selecionar paciente, responder, cancelar, salvar; histórico por data.
- Editar modelo depois de responder: histórico conserva snapshot anterior; inativar pergunta/modelo; abrir histórico no prontuário.

## Backup e logs
- Admin: exportar completo e individual; individual sem outras contas/pacientes.
- Importar JSON válido; prévia/counts/checkbox; sem confirmação não restaura; arquivo >64MB e esquema inválido recusados.
- Aquisição ativa bloqueia importação; pausar, importar individual e remapear IDs; CPF existente impede.
- Restore completo SOMENTE na base de teste: snapshot antes, transação, logout, contas/configurações do backup; nenhum dado de outra base tocado.
- Códigos/hashes também pertencem ao estado do backup completo: restaurar versão antiga pode restaurar credenciais antigas; reprovisionar recovery depois.
- Logs: filtro, atualizar, exportar os eventos exibidos, seção aquisição; nenhuma senha/código/resposta clínica no evento de segurança.

## Relatórios, arquivos e impressão
- Abrir exame REAL e SIMULATION sintéticos; dados/metadados, altura175cm, CoP, lateral ausente, duração/FPS0 ou null, mapa e ajustes originais.
- Observações adicionais entram apenas na saída; texto longo deve gerar continuação sem sobrepor assinatura.
- Exportar PDF, salvar e abrir no leitor: A4, duas páginas normais, páginas extras só para notas longas, numeração e conteúdo legível.
- PNG deve conter mapa/CoP/orientação; comparar com prévia; PDF automatizado em Node não exercitou Canvas real.
- Imprimir em “Microsoft Print to PDF” na conta de teste, conferir ambas as páginas e notas completas; depois impressora física, sem afirmar resultado antes.
- Instalar/desinstalar/atualizar NSIS 0.2.1 apenas em VM/conta de teste; verificar atalhos, DLLs, WebView2 e preservação do SQLite.

