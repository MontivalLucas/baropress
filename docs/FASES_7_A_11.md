# BAROPRESS 0.2.0 — fases 7 a 11

Cada fase foi implementada e passou por testes e build antes do início da seguinte.
Os comandos e resultados estão registrados em `Sprint/05_Historico`.

## Fase 7 — comparação e evolução

Abra **Comparação**, escolha um paciente e selecione de dois a quatro exames
concluídos. Também é possível iniciar pelo histórico do prontuário ou pela lista
de exames. A comparação apresenta mapas, pressão máxima/média, contato, carga
bilateral, coordenadas do CoP, variações e gráficos ordenados por data.

A escala visual comum facilita comparar mapas; as métricas originais permanecem
na tabela. Exames com protocolos, origens ou thresholds distintos apresentam
um aviso. Os gráficos descrevem dados registrados, sem gerar diagnóstico.

Novas coletas salvam pontos de CoP e seus tempos relativos reais. Exames antigos
sem trajetória informam sua ausência. Uma coleta sem contato não gera pontos.

## Fase 8 — agenda

Abra **Agenda** e escolha dia, semana ou mês. Use **Nova consulta** ou clique em
uma data. Associe paciente e profissional, preencha início/término, tipo, status
e observações. Clique numa consulta para editar ou excluir com confirmação.

**Novo profissional** cadastra nome, profissão e registro para associá-lo às
consultas. O backend rejeita horários inválidos e sobreposição do paciente ou
profissional. Consultas canceladas não ocupam o horário. A navegação considera
mudanças de mês, ano e anos bissextos.

## Fase 9 — questionários e anamnese

Abra **Questionários** e crie um modelo. Cada pergunta pertence a um grupo e
aceita texto, seleção única, múltipla seleção, número ou sim/não. Configure
obrigatoriedade e ativação. Perguntas de seleção exigem opções distintas.

Para responder, escolha o modelo e paciente e salve as respostas. O histórico
registra a data e uma cópia do modelo utilizado. Editar ou desativar perguntas
depois não altera respostas anteriores. Zero e **Não** são respostas válidas.
Consultas e questionários respondidos também aparecem no prontuário.

## Fase 10 — backup, importação e exportação

Acesse **Configurações > Backup** com uma conta administradora.

**Backup completo** gera um arquivo `.baropress.json` com o snapshot lógico do
banco SQLite: contas, clínicas/profissionais, pacientes, exames, frames existentes,
métricas, consultas, modelos/respostas, configurações, logs e sequências de IDs.
O formato conserva os tipos do SQLite e os blobs; não contém comandos SQL.

**Backup individual** inclui apenas o paciente selecionado e seus vínculos,
sem contas ou configurações globais. A importação individual cria novos IDs,
remapeia os vínculos e preserva outros prontuários. Um CPF existente bloqueia
a importação para evitar duplicar o cadastro.

Ao escolher um arquivo, o aplicativo valida sua versão e estrutura e apresenta
uma prévia. Antes de importar, exige confirmação na interface e aquisição
pausada. A restauração completa substitui os dados e encerra a sessão; entre com
uma conta existente no backup. A importação individual mantém as contas atuais.

O sistema cria e sincroniza no disco uma cópia dos dados atuais em
`%APPDATA%/br.com.baropress.app/backups` antes de alterar o banco. Falha na cópia
impede a importação. Erros de escrita ou referências invalidam toda a transação.
O arquivo é limitado a 64 MB e deve ter a versão de esquema compatível.

Nos detalhes de um exame, exporte **CSV da matriz média**, **PNG** ou
**JSON processado**. O CSV inclui índice, linha, coluna e ADC para reconstruir
a matriz salva. A média e a trajetória não permitem reconstruir frames brutos
que não foram armazenados pelo fluxo de exame.

## Fase 11 — refinamento

**Configurações** regula duração padrão, visualização, tema e hardware. Os ajustes
são persistidos no SQLite após a última alteração ou pelo botão de salvar.
As gravações são serializadas e aguardadas antes de restaurar o banco. Configurações
de hardware requerem o dispositivo desconectado. A conexão é gerenciada em Aquisição.

**Configurações > Logs** apresenta os últimos 500 eventos persistentes, com filtro por nível e
exportação. As operações registram categorias e resultados, sem copiar senhas,
respostas ou dados clínicos para a auditoria. Logs da aquisição desta sessão
também podem ser consultados.

Os módulos carregam sob demanda. Os diálogos principais oferecem foco por teclado,
Tab e Escape. Há recuperação de sessão inválida, tratamento de falha da interface,
mensagens de erro na busca de exames e status real do dispositivo no dashboard.
Foi corrigida a ordem de peso/altura no cálculo do IMC do prontuário e relatórios.

## Verificação e limites

Os testes usam simulador e bancos isolados. O teste integrado verifica exames,
agenda, cinco tipos de perguntas, configurações e restauração completa.
Nenhum prontuário real foi criado, substituído ou restaurado durante a tarefa.

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
cargo test --offline --manifest-path src-tauri/Cargo.toml
npm.cmd run tauri:build -- --ci --bundles nsis -- --offline
```

Homologação visual no desktop, instalação/desinstalação e ensaio com ESP32 físico
continuam necessários. Compilar e testar não equivale a homologar o equipamento.
