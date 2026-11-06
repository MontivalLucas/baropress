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

Registro final, roteiro, verificações e commits serão preenchidos após a execução.
