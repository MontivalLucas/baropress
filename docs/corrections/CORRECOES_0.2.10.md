# Correções de arquitetura e interface — BAROPRESS 0.2.10

Data: 07/10/2026. Esta entrega implementa as correções concretas da revisão 0.2.9. Os testes usam dados sintéticos ou bancos temporários; a instalação e os prontuários pessoais não foram alterados nesta execução.

## O que mudou

### 1. Conexão e navegação

- Comandos de porta serial passam por um executor separado dos comandos do banco. Uma abertura de porta bloqueada não ocupa a fila das listas. A autorização permanece no backend, nas duas filas. Isso não elimina a disputa pelo banco em operações pesadas nem corrige o driver da COM5.
- Falhas de conexão automática aumentam o intervalo de novas tentativas, até 60 segundos. Configurações > Arduino permite pausar e retomar as próximas tentativas. Uma abertura já iniciada no Windows não é cancelada por esse botão.
- A mensagem principal explica o próximo passo; detalhes técnicos continuam nos logs.
- O cache de listas é invalidado por domínio. Gravar preferências ou logs não joga fora os resultados clínicos. Atualizar no Histórico e nos Questionários força uma nova consulta.
- Novo Exame pesquisa após 250 ms sem digitação e limita a consulta a 50 pacientes; a interface orienta refinar a busca. Comparação consulta páginas de 50 exames concluídos do paciente selecionado no backend, mantendo a seleção ao trocar de página.

### 2. Unidades e preservação do histórico

- Detalhes, documento e PDF usam o formatador comum de altura, incluindo dados legados em metros.
- Tara é descrita como compensação de zero. Não é apresentada como calibração física.
- Nascimento é tratado como data civil; idade no exame usa a data de início, com criação como referência alternativa.
- A migração 7 adiciona uma cópia demográfica aos novos exames: nome, CPF, nascimento, altura, peso, calçado e nome do profissional associado. A cópia é feita na transação de salvamento, não no início da coleta. Alterações posteriores do cadastro não mudam esses campos no exame já salvo, inclusive valores originalmente ausentes.
- Exames antigos continuam acessíveis com os dados cadastrais atuais e um aviso explícito de ausência da cópia histórica. Não foram inventados dados anteriores.
- Backups dos esquemas 5 e 6 recebem as colunas novas sem fabricar histórico. Migração de banco existente mantém a cópia de segurança anterior à atualização.

### 3. Proteção ao sair e coleta

- Navegação, saída da conta e fechamento da janela passam por uma proteção comum. Pacientes, Agenda, Questionários, conta/preferências e observações do documento avisam sobre alterações não salvas. Operações em andamento bloqueiam a saída; a confirmação reavalia esse bloqueio.
- Questionários confirmam descarte ao trocar paciente, modelo ou formulário. O botão Atualizar já tinha proteção e continua desabilitado durante o preenchimento.
- Durante preparação/coleta, sair exige confirmação de interrupção. Resultado ainda não salvo recebe aviso ao fechar a aplicação; continuar navegando mantém o resultado em memória.
- A coleta aborta quando fica mais de 2 segundos sem quadros válidos. Esse prazo é um watchdog técnico de comunicação, não um critério clínico de qualidade. Cancelar/abortar também libera os quadros brutos acumulados.
- Análise/Novo Exame mostram aviso quando o limiar é zero: a regra existente inclui leituras zero na contagem de contato. O cálculo científico não foi alterado sem definir o protocolo.
- Os avisos usam foco e teclado próprios para evitar que Escape também feche um formulário por baixo.

As proteções confirmam descarte; não são rascunhos persistentes. Fechar o processo ainda perde o trabalho não salvo depois de confirmar.

### 4. Documento e interface

- Observações podem ser salvas explicitamente no exame. A operação aceita até 10.000 caracteres, valida exame concluído, registra auditoria e mantém matriz, métricas e parâmetros originais.
- Reabrir o exame recupera o texto salvo. Responsável ausente aparece como “Responsável não informado”, sem identidade fictícia. Histórico de revisões e assinatura profissional seguem pendentes.
- Dois mapas de comparação ocupam duas colunas; quatro podem ocupar quatro colunas em telas largas. A tabela de métricas usa números em português.
- Rodapés da Agenda e preparação do exame permanecem acessíveis durante a rolagem.
- Dashboard prioriza Novo exame. Preferências aparecem antes da seção recolhida Conta e equipe. O acesso ao login usa “Como obter acesso”.
- Histórico de Exames permanece como acesso aos exames/documentos. Arduino, Backup e Logs permanecem em Configurações; ajustes de mapa permanecem na Análise/Novo Exame.

## Validação

- TypeScript aprovado.
- 179 testes de interface/serviços aprovados em 23 arquivos.
- 99 testes Rust aprovados; um benchmark sintético está intencionalmente ignorado na execução comum.
- Testes cobrem fila serial bloqueada sem atrasar a fila do banco, intervalo das tentativas, guarda de navegação, queda parcial de quadros, datas civis, cache, salvamento das observações sem mudar a amostra, cópia demográfica após edição e compatibilidade de backup dos esquemas anteriores.
- Testes existentes de geração de PDF continuam aprovados. Isso não equivale à inspeção visual do PDF ou impressão.
- Inventário TypeScript: 120 arquivos, nenhum arquivo de produção fora do grafo de imports, todas as dependências de produção referenciadas. Isso não prova ausência de cada função morta no projeto; não houve nova exclusão indiscriminada de arquivos.
- Build de produção e instalador NSIS aprovados. Binário identificado como 0.2.10. Instalador com 3.698.178 bytes, SHA256 `FA1808F74BD85D099A9DDA55C766C4C030A5DA2DC908C3BEADC7BA456E296230`.

Evidências: `frontend-tests-0.2.10.log`, `rust-tests-0.2.10.log`, `build-0.2.10.log`, `source-inventory-0.2.10.json` e `artifacts-0.2.10.json`.

Pacote: `src-tauri/target/release/bundle/nsis/BAROPRESS_0.2.10_x64-setup.exe` na raiz do projeto. O instalador foi gerado e verificado, sem executá-lo sobre a instalação pessoal.

Não foi medida a fluidez da versão 0.2.10 no WebView2 ou no Arduino real. A navegação visual da revisão anterior era da versão instalada 0.2.9. Não confundir essas verificações.

## Continuação obrigatória

O plano detalhado, com prioridade, sequência, dependências e critérios de conclusão, está em `Sprint/04_Futuro/PENDENCIAS_POS_CORRECOES_0.2.10.txt`. A implementação acima não encerra todas as melhorias propostas nas cinco etapas da revisão.

Principais próximos passos: homologação em instalação de teste, conexão COM5 e desempenho real; rascunhos persistentes; regras de contato e qualidade; autoria e revisões dos documentos; seletores restantes, acessibilidade, retenção e manutenção das dependências.
