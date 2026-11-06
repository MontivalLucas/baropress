# Execução do prompt mestre BAROPRESS — 06/11/2026

## Fase A — Auditoria inicial

Tipo: apresentação web de hardware HealthTech experimental. Refinamento do pitch existente, com a identidade visual atual e 12 cenas em palco 1920 × 1080.

Fonte do pedido: `C:/Users/Montival Nunes/Desktop/teste arduino/NOVO PROGRAMA/baropress-pitch-src/# PROMPT MESTRE — BAROPRESS.txt`.

A pasta que contém o prompt é uma exportação sem Git e com 11 cenas. O checkout selecionado é `C:/Users/Montival Nunes/Documents/ChatGPT/TCC - Tapete Baropodômétrico/baropress-repository`, remoto `https://github.com/MontivalLucas/baropress.git`, inicialmente em `main`, commit `b10923b`, sem alterações locais. Essa versão já contém o artigo e as correções anteriores de notas, teclado e links. Branch de trabalho: `codex/pitch-problematica-20261106`.

### Inventário anterior

| Cena | Título inicial | Diagnóstico e intervenção planejada |
| --- | --- | --- |
| 1 | BAROPRESS | Trocar a abertura técnica pela dificuldade do paciente, preservando marca e matriz animadas. |
| 2 | Compreender o apoio orienta o cuidado. | Tornar concreto o complemento entre avaliação clínica e informações instrumentais; preservar autonomia profissional. |
| 3 | Quando a tecnologia custa caro, o acesso fica limitado. | Incorporar a diretriz IWGDF em seu contexto específico, sem marcas ou preços. |
| 4 | E se essa tecnologia pudesse chegar a mais profissionais? | Qualificar a oportunidade como proposta em desenvolvimento e identificar o conceito visual. |
| 5 | BAROPRESS: Um tapete. Um software. Uma proposta acessível. | Refinar título, subtítulo e distinção entre fotos reais e conceito de produto. |
| 6 | Como funciona | Preservar diagrama; identificar sinal relativo e mapa ilustrativo. |
| 7 | Do exame ao histórico. Tudo em um único sistema. | Preservar demonstração; revisar precisão das notas e identificação dos registros. |
| 8 | Não basta observar um resultado. É importante acompanhar a evolução. | Trocar evolução por organização temporal, sem atribuir melhora clínica. |
| 9 | Informação que vai além da tela. | Preservar fluxo e prévia; revisar terminologia e dados apresentados. |
| 10 | Uma proposta de entrada mais acessível. | Destacar preço-alvo hipotético, atualizar data da fonte e contextualizar custos sem lucro presumido. |
| 11 | BAROPRESS | Fazer pedido concreto de parceiros para as próximas etapas de validação. |
| 12 | Desenvolvimento com base científica. | Preservar primeira página real; informar aceite pela equipe e DOI pendente, sem confundir com validação. |

### Arquitetura e invariantes

- `src/content.ts`: títulos, subtítulos, notas, capturas e metadados de hardware/artigo.
- `src/App.tsx`: `Scene` seleciona as 12 composições; `HERO`, `Grid`, `Rv` e `Shot` mantêm formas, matriz, revelações e imagens. `App` controla hash, teclado, escala, tela cheia, notas, relógio e alternâncias de hardware/software.
- As 12 entradas de conteúdo, temas e destinos SVG precisam permanecer alinhadas. O path SVG persistente deve continuar interpolando na navegação.
- Navegação limita índices; controles interativos não devem disparar avanço de cena. Painel de notas reserva sua altura real pelo `ResizeObserver`.
- Matriz 15 × 15 significa 225 cruzamentos de leitura; sinais ADC não são pressão física calibrada. Registros distintos não demonstram melhora clínica.
- Marcas e valores comerciais aparecem somente na cena 10; referências ficam em área de consulta acessível, fora da sequência narrativa.
- Movimento reduzido deve manter tudo visível e pausar alternâncias automáticas. A experiência animada padrão deve ser preservada.

### Alterações previstas e áreas preservadas

Alterar `src/content.ts`, blocos pertinentes de `src/App.tsx`, suporte pontual em `src/index.css`, cabeçalho vigente da base de conhecimento e este relatório. Acrescentar somente o suporte necessário à consulta de referências, duração orientativa e pausa das demonstrações. Preservar composições técnicas 6–9, fotografias e capturas existentes quando adequadas, paleta, navegação e animações. Não modificar desktop, firmware, banco de dados nem outros módulos. Não fazer merge ou deploy de produção.

### Baseline e comandos

`package.json` oferece somente `dev`, `build` e `preview`. `npm run build` executou TypeScript (`tsc --noEmit`) e Vite com sucesso antes das alterações: 439 módulos, `dist/index.html` com 459,54 kB. Não existem scripts de lint, test ou typecheck independentes. GitHub CLI não está instalado; o remoto Git e o conector GitHub serão utilizados se disponíveis.

### Fontes conferidas

- OMS: *Rehabilitation: a key strategy in addressing noncommunicable diseases*, 14/02/2025. Estimativa de 2,6 bilhões referente à reabilitação global, não à demanda por baropodometria.
- OMS: *Rehabilitation*, 22/04/2024. Mais de 50% sem serviços necessários em alguns países de baixa e média renda; não é um indicador do Brasil ou de equipamentos.
- IWGDF 2023: fundamentação da recomendação 8c, página 20 do PDF (índice 19). Sistemas validados relativamente caros e tecnologia/expertise ainda pouco disponíveis, no contexto de calçados terapêuticos e prevenção de recorrência de úlceras plantares em pessoas com diabetes.
- Podotech: página oficial BaroScan consultada em 06/11/2026; R$ 24.961,25 anunciado. Não há evidência para atribuir esse valor a outubro/2024.
- Artigo: primeira página real já incorporada ao checkout. Conferência da versão disponível no Drive e do status editorial em andamento.

## Fases B–H — Resultado

### Alterações e preservação

- **B–D, cenas 1–3:** abertura humana sem especificações eletrônicas; marca e matriz animadas preservadas. A cena 2 mostra duas entradas complementares convergindo para a decisão profissional, mantendo a imagem e a moldura existentes. A cena 3 incorpora IWGDF com contexto e localização exatos; não usa marcas, preços ou estatísticas sobre clínicas brasileiras. As estatísticas da OMS ficam na consulta de referências para não disputar a mensagem central.
- **E, cenas 4–5:** oportunidade como proposta, identificação explícita de acabamento conceitual e apresentação do hardware experimental integrado ao software. Fotografias reais e seleção de cinco etapas preservadas; etapa E passa a “Conceito de produto”. O novo cabeçalho exige apenas deslocar a fotografia 30 px e reduzir sua altura em 30 px, sem mudar sua área inferior.
- **F, cenas 6–9:** diagrama, janela de software, comparação e fluxo PDF preservados. Na cena 6, o mapa é identificado como ilustrativo e os sinais como ADC relativos. A cena 7 mantém integralmente a composição e as três capturas. A cena 8 usa a captura existente com usuário de demonstração, revisa o título e explicita ausência de inferência clínica. A cena 9 identifica a captura como trecho real do relatório com identificação ocultada; não chama o documento de laudo diagnóstico nem promete página A4 completa.
- **G, cenas 10–12:** dois painéis e barras financeiras preservados, com preço-alvo hipotético explícito e fonte de novembro de 2026. A margem percentual foi substituída pela próxima etapa de validar a viabilidade, evitando sugerir lucro demonstrado. O fechamento solicita parceiros de ensino, pesquisa e profissionais para validação. A cena científica mantém a mesma imagem real e distingue aceite informado pela equipe, DOI pendente e ausência de validação clínica.
- **H, suporte:** todas as notas foram reescritas para fala natural; orientação de tempo por cena soma 600 segundos. Referências ficam no painel existente, com cinco links e limites de interpretação. Demonstrações ganharam pausa/retomada; `matchMedia` com `useSyncExternalStore` acompanha mudanças de movimento reduzido em tempo real. `MotionConfig` aplica a preferência às animações e as revelações mantêm conteúdo visível. Navegação quebra linhas em viewports estreitos; `ResizeObserver` reserva a altura real dos controles e das notas. Corrigido cronômetro que podia mostrar tempo negativo no instante do reset. Ícone local em SVG evita requisição de favicon ausente.

Nenhuma cena foi excluída ou acrescentada. Todas tiveram revisão das notas; as composições das cenas 6–9 foram preservadas, com os ajustes semânticos acima. Paleta, teclado, hash, tela cheia, curva das transições, elemento SVG persistente e demonstrações continuam no sistema existente. Não foram introduzidas dependências.

O texto final de cada cena, seus complementos visíveis, as falas completas e as referências estão em [ROTEIRO_PROMPT_MESTRE_2026-11-06.md](ROTEIRO_PROMPT_MESTRE_2026-11-06.md). O roteiro de dez minutos é orientação, não duração comprovada por ensaio oral.

### Evidência documental

O artigo DOCX foi localizado e lido pela integração Google Drive na pasta fornecida: [arquivo real](https://docs.google.com/document/d/1TlYKZ2T9QO0IUouwsgtHjVYc3H2Lnzx6/edit). O título, o resumo e os números principais correspondem à primeira página incorporada: matriz 15 × 15, cinco massas de 0,438 a 4,518 kg, três repetições, ausência de pacientes, erro máximo de 8,299 N frente ao critério de 1 N e duas estimativas indisponíveis. A imagem existente não foi modificada ou recriada. A procedência e os hashes anteriores estão no relatório de 05/11.

Não havia carta de aceite entre os arquivos diretos da pasta consultada; por isso, a interface atribui o aceite à informação da equipe. Não foi inventada referência editorial definitiva, DOI, volume, número, paginação ou data de publicação. A fidelidade à versão formalmente aceita depende da confirmação editorial, que não foi disponibilizada.

As capturas usadas nas cenas 7–9 foram inspecionadas: não exibem nome ou CPF identificável de paciente; o histórico usa “Participante 01” etc. e o relatório oculta a identificação. Não se transformaram registros reais em resultados sintéticos: a apresentação diferencia demonstração da interface, origem do sinal e ausência de validação clínica. A prévia de relatório disponível já é parcial; sua identificação foi corrigida, sem inventar conteúdo ausente.

### Design e limites da verificação

O projeto é um palco fixo 16:9, não uma landing page com seções de rolagem. Os testes genéricos de hero, altura de seções e CTA de landing pages não se aplicam: a prova relevante cobre as 12 cenas, os limites reais do palco, os controles e as transições. A identidade existente prevalece sobre receitas genéricas das skills. O detector Impeccable executado sobre os arquivos de interface alterados retornou `[]`.

A verificação percorre hash e controles, seleção da cena, renderização React e carregamento dos ativos estáticos. Não há API, banco de dados ou serviço externo no fluxo do pitch; a consulta de referências usa links opcionais. Nenhuma verificação de backend clínico foi necessária ou executada. Não foram medidos FPS, desempenho em projetor físico, confiabilidade do hardware ou eficácia clínica.

### Verificações finais e commits

- `npm run build`: aprovado no baseline e após cada conjunto lógico de edição. Build final: TypeScript e Vite aprovados, 439 módulos, HTML com 470,40 kB e gzip de 142,72 kB.
- `git diff --check`: aprovado.
- Busca das expressões científicas/comerciais indicadas no prompt sobre `src`: nenhuma ocorrência das expressões de risco sem qualificação; não há DOI inventado nem afirmação de publicação concluída.
- Microsoft Edge headless sobre o build de produção: 48 capturas, correspondentes às 12 cenas em **1920 × 1080**, **1366 × 768**, **800 × 600** e **390 × 844**. Sem imagem ausente após carregamento, conteúdo fora do palco ou controles fora da viewport. O palco mantém proporção 16:9; em celular, isso reduz a leitura e não substitui um modo de leitura próprio.
- Navegação por teclado e botões aprovada, incluindo limites e normalização de `#s999` para a última cena.
- Notas com rolagem por teclado sem troca involuntária de cena, tempo orientativo, reset do cronômetro e fechamento por Escape aprovados.
- Cinco referências acessíveis por teclado, com links reais e contexto de interpretação.
- Hardware: seleção das etapas, pausa, retomada e alternância automática aprovadas. Software: Enter ativa uma aba sem avançar a cena; alternância automática e pausa aprovadas.
- Movimento reduzido: conteúdo visível, troca manual e resposta à mudança da preferência durante a sessão aprovados. A versão instalada de `useReducedMotion` mantinha apenas o valor inicial; a assinatura nativa de `matchMedia` corrige essa limitação.
- Tela cheia: entrada e saída aprovadas. SVG: mesmo elemento antes/depois, paths inicial/intermediário/final diferentes e navegação interrompida sem erro.
- Navegação offline depois de carregar os ativos: aprovada, incluindo a imagem do artigo. Não se afirma suporte a primeiro carregamento offline ou instalação como PWA.
- Console e rede da aplicação: nenhum erro relevante. Durante o ensaio offline, o script externo injetado pelo Kaspersky tentou acessar sua própria rede; esses avisos foram registrados separadamente como condição do ambiente, sem modificar o antivírus.
- Verificador de desempenho da skill de design, três carregamentos por largura (1366 e 390 px), sobre a cena inicial compilada: **0 FAIL, 2 WARN**, ambos referentes à carga de CPU do host (41% antes, 71% depois). Layout shift medido: 0,000 nas duas larguras; nenhuma requisição quebrada. Esses números não representam o custo de todas as capturas das outras cenas nem desempenho de campo. Não houve repetição para perseguir variação de ruído do host.

Evidências locais: `C:/Users/Montival Nunes/.codex/visualizations/2026/11/06/01a1b0cb-eae1-7db0-8695-c63e6e2c0255/`, incluindo `qa-pitch.cjs`, `qa-results.json`, as 48 capturas e capturas de notas/referências. Os resultados de desempenho são um complemento; não substituem medição de FPS ou teste em projetor.

Commits lógicos:

1. `e04b9df` — auditoria e plano do prompt mestre.
2. `31b40f1` — paciente, avaliação e acesso.
3. `4d4f29a` — oportunidade e apresentação experimental.
4. `0850b43` — demonstrações, hipótese comercial e aceite científico.
5. `d5d5b83` — referências, controles, responsividade e movimento reduzido.
6. `38f4d55` — documentação final: este relatório, roteiro completo e atualização da autoridade vigente na base de conhecimento.
7. Registro de publicação da branch e do PR de revisão.

### Pendências reais

1. Disponibilizar a carta de aceite ou confirmação editorial para comprovar de forma independente o status informado e a versão formalmente aceita. O status atual permanece atribuído à equipe.
2. Fornecer exportação integral anonimizada do relatório caso se deseje substituir a captura parcial existente. A apresentação atual identifica corretamente o trecho.
3. Realizar ensaio oral cronometrado e teste no projetor utilizado pela banca; os dez minutos são orientação.

Branch publicada: `codex/pitch-problematica-20261106`.

PR em rascunho para revisão: [MontivalLucas/baropress #4](https://github.com/MontivalLucas/baropress/pull/4). O remoto `main` permaneceu no commit inicial `b10923b`. Nenhum merge ou deploy de produção foi realizado.
