# Revisão narrativa do pitch BAROPRESS

Data de referência: 5 de novembro de 2026. Duração de apresentação pretendida: 5–7 minutos; não foi realizado ensaio oral cronometrado.

Atualização de 06/11/2026: a pedido do usuário, somente a cena 1 foi restaurada integralmente à abertura original, incluindo título BAROPRESS, subtítulo, especificações, tipografia e notas. As revisões das cenas 2–3 e o artigo na cena 12 foram mantidos. O escopo abaixo registra a revisão inicial de 05/11.

## Escopo aprovado

- Reestruturar somente as três primeiras cenas e acrescentar uma cena científica ao final, preservando o estilo, as animações e o morphism existentes.
- Cena 1: paciente e impacto da dor ao caminhar, antes de especificações e investimento.
- Cena 2: dados instrumentais como complemento à anamnese e ao exame físico, com interpretação e decisão do fisioterapeuta.
- Cena 3: barreira de acesso para pequenas clínicas e profissionais autônomos, sem marca, preço ou afirmação de que a maioria das clínicas trata sem dados.
- Cenas 4–11: conteúdo e blocos de renderização preservados. Histórico, comparação e PDF já são apresentados nas cenas 7–9; investimento permanece na cena 10.
- Cena 12: primeira página real do artigo, resultados preliminares e necessidade de validação.

O mesmo path SVG continua montado ao navegar. A cena científica acrescenta um destino à sequência de morphing, usando a paleta, as curvas de animação e a revelação existentes.

## Artigo do projeto

Título: **BAROPRESS: desenvolvimento e avaliação preliminar de um protótipo de baixo custo para aquisição e distribuição espacial de sinais associados à aplicação de carga.** Documento fornecido do projeto, 2026; consultado em 05/11/2026. O ano identifica o documento e os ensaios, não uma data de publicação editorial.

Origem local: `C:/Users/Montival Nunes/Desktop/teste arduino/NOVO PROGRAMA/ARTIGO - BAROPRESS_ DESENVOLVIMENTO E AVALIAÇÃO PRELIMINAR DE UM PROTÓTIPO DE BAIXO CUSTO PARA AQUISIÇÃO E DISTRIBUIÇÃO ESPACIAL DE SINAIS ASSOCIADOS À APLICA.docx`.

A primeira página foi exportada pelo Microsoft Word, com o original aberto somente para leitura, e rasterizada com PDFium em 1200 × 1697 pixels. Não houve alteração do manuscrito nem reconstrução da folha. Somente a imagem dessa página foi incorporada à apresentação em `public/shots/artigo-primeira-pagina.png`.

- SHA-256 do DOCX: `4B3CB038FB46C1734106F6AE63DD24CE2789E13684E3E90E110C04F1292BB5B1`.
- SHA-256 da imagem incorporada: `EFBC18C490496492A49C15926E37C7C66198D9725667974428BD19D69D21AD26`.

O renderizador padrão `render_docx.py` não pôde executar porque LibreOffice não está instalado no PATH. A exportação nativa do Word forneceu o PDF de origem; a primeira página foi conferida visualmente na apresentação.

O estudo descreve cinco níveis de massa e três repetições por nível, sem pacientes. Relata resposta do sinal às cargas e calibração candidata que não atingiu o critério adotado. O slide não afirma mensuração quantitativa de pressão plantar, confiabilidade estabelecida ou validade clínica.

O usuário informou aceite/publicação e o nome “revista praxis teologia”. A busca localizou a [Práxis Teológica](https://adventista.emnuvens.com.br/praxis/about), mas não confirmou o vínculo com este manuscrito. Conforme escolha do usuário, o encerramento usa a identificação **Artigo do projeto**, sem revista, DOI, autores formais ou data de publicação não confirmados.

## Referências consultadas

1. ROSÁRIO, J. L. P. A review of the utilization of baropodometry in postural assessment. *Journal of Bodywork and Movement Therapies*, v. 18, n. 2, p. 215–219, 2014. DOI: [10.1016/j.jbmt.2013.05.016](https://doi.org/10.1016/j.jbmt.2013.05.016). Contextualiza a investigação do apoio e da postura, incluindo necessidade de padronização e calibração; não valida o BAROPRESS.
2. LIN, D.; PAPI, E.; MCGREGOR, A. H. Exploring the clinical context of adopting an instrumented insole: a qualitative study of clinicians’ preferences in England. *BMJ Open*, v. 9, e023656, 2019. DOI: [10.1136/bmjopen-2018-023656](https://doi.org/10.1136/bmjopen-2018-023656). Estudo qualitativo com 30 profissionais, incluindo 11 fisioterapeutas; sustenta a discussão de barreiras de custo e adoção e do caráter complementar da tecnologia. Não é levantamento de clínicas brasileiras nem prova de eficácia clínica do protótipo.
3. HÉBERT-LOSIER, K.; MURRAY, L. Reliability of centre of pressure, plantar pressure, and plantar-flexion isometric strength measures: a systematic review. *Gait & Posture*, v. 75, p. 46–62, 2020. DOI: [10.1016/j.gaitpost.2019.09.027](https://doi.org/10.1016/j.gaitpost.2019.09.027). Fundamenta o cuidado com confiabilidade e erro ao interpretar diferenças entre registros.
4. PODOTECH. [BaroScan — anúncio comercial](https://podotech.com.br/baroscan). Consulta em 05/11/2026: preço anunciado de R$ 24.961,25. A pesquisa não comprova que o anúncio já apresentava esse valor em outubro/2024. O texto histórico da cena 10 foi preservado por estar fora do escopo restrito aprovado; essa atribuição de data permanece uma pendência documental. A comparação de investimento não demonstra equivalência técnica ou clínica.

As referências científicas pertinentes também estão nas notas das cenas 1–3.

## Ajustes de suporte à apresentação

- O painel de notas agora tem altura medida por `ResizeObserver`; palco e navegação reservam seu espaço real. Notas longas permitem rolagem por teclado.
- Atalhos de cena respeitam controles interativos e a área de notas; Escape continua disponível para fechar o painel.
- Links com número de cena fora da faixa são limitados às 12 cenas e normalizados, inclusive quando o índice não muda.
- Não houve alteração de APIs, banco de dados, firmware ou aplicação clínica.

## Verificação

- TypeScript (`tsc --noEmit`) e build de produção do Vite aprovados.
- Microsoft Edge headless: todas as 12 cenas carregaram em 1280 × 720, sem erros de JavaScript, respostas HTTP de erro ou imagens ausentes.
- Inspeção visual das cenas 1, 2, 3 e 12 em 1280 × 720 e 1024 × 768.
- Comparação do código anterior: narrativas e blocos de renderização das cenas 4–11 preservados integralmente.
- Conferidos: navegação nos limites, links inválidos, seleção de aba por Enter, notas com rolagem por teclado, controles livres com notas abertas e tela cheia.
- Conferida a transição 11–12: mesmo elemento SVG, paths inicial/intermediário/final distintos, retorno e interrupção rápida sem erro.
- A cena científica permanece visível com movimento reduzido e após navegação offline, depois do carregamento local dos ativos.
- Não foram medidos FPS nem realizados ensaios em projetor físico.

A revisão foi inicialmente implementada e compilada localmente. Em 06/11/2026, o usuário solicitou sua publicação pela integração GitHub–Vercel, mantendo a abertura original restaurada. A publicação usa a branch `main` e a raiz `baropress-pitch` do projeto existente.
