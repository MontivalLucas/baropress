export type Sc = { t: string; s?: string; n: string }

export const S: Sc[] = [
  {
    t: 'Para quem sente dor ao caminhar, cada passo importa.',
    s: 'Alterações no apoio plantar podem estar associadas a desconforto, dificuldades de marcha e limitações funcionais.',
    n: 'Imagine uma pessoa que sente dor ao caminhar. Para ela, ficar em pé ou percorrer uma pequena distância pode se tornar um desafio. Na fisioterapia, compreender o apoio dos pés faz parte de uma investigação que considera a história, os sintomas e a função de cada pessoa. Alterações no apoio podem estar associadas ao desconforto, mas não explicam sozinhas todas as suas causas. É nesse cuidado que informações instrumentais confiáveis podem acrescentar uma perspectiva. Nossa história começa nessa necessidade humana.',
  },
  {
    t: 'Avaliar melhor para decidir com mais informação.',
    s: 'A análise instrumental, quando validada, pode complementar a avaliação clínica e o acompanhamento do apoio plantar.',
    n: 'O fisioterapeuta reúne a história do paciente, observa seus movimentos, realiza o exame físico e aplica testes funcionais. É esse raciocínio clínico que orienta o cuidado. Uma ferramenta instrumental adequada pode acrescentar registros e medidas que nem sempre são fáceis de quantificar apenas pela observação. Esses dados precisam ser confiáveis e interpretados junto aos achados clínicos. Comparar registros pode ajudar a investigar mudanças, mas uma diferença não prova melhora ou eficácia de um tratamento. A decisão continua com o profissional. No caso do BAROPRESS, a aplicação clínica ainda depende de validação. Com esse papel complementar em mente, precisamos discutir também o acesso à tecnologia.',
  },
  {
    t: 'A tecnologia avançou. O acesso ainda é um desafio.',
    s: 'Equipamentos especializados podem exigir investimentos difíceis para pequenos consultórios, profissionais autônomos e instituições com orçamento limitado.',
    n: 'Tecnologias de avaliação plantar já existem, mas adquirir um equipamento especializado pode exigir um investimento difícil para uma operação menor. A diretriz IWGDF de 2023 reconhece que sistemas validados de mensuração plantar são relativamente caros e que a tecnologia e a expertise necessárias ainda não estão amplamente disponíveis. Esse argumento aparece em um contexto específico: calçados terapêuticos e prevenção de recorrência de úlceras em pessoas com diabetes. Não é uma estatística sobre clínicas brasileiras, nem prova de falta de tratamento. Ele ajuda a reconhecer uma barreira e uma pergunta de pesquisa: como investigar alternativas mais acessíveis, preservando os requisitos de qualidade e segurança? Fonte: IWGDF 2023, fundamentação da recomendação 8c, página 20 do PDF.',
  },
  {
    t: 'E se essa tecnologia pudesse chegar a mais profissionais?',
    s: 'Superando a barreira do alto custo para democratizar o acesso e criar oportunidades.',
    n: 'Slide 4 — A oportunidade: superando a barreira do alto custo para democratizar o acesso. Três diretrizes: acessibilidade, mobilidade e acompanhamento. Visualização 3D em perspectiva do tapete eletrônico.',
  },
  {
    t: 'BAROPRESS: Um tapete. Um software. Uma proposta acessível.',
    s: 'Hardware experimental próprio, integrado a um sistema de visualização e acompanhamento.',
    n: 'Slide 5 — Apresentação do Hardware: fotografia real da bancada experimental em destaque, com avanço automático a cada 2 segundos pelas 4 etapas de desenvolvimento (malha de cobre, multiplexação, Velostat, ESP32).',
  },
  {
    t: 'Como funciona',
    s: '225 posições de leitura integradas a um sistema de aquisição e análise relativa.',
    n: 'Fluxo em 3 etapas: 1. CAPTURA: Matriz experimental 15×15 com 225 cruzamentos e multiplexação matricial dupla (2× CIs CD74HC4067). 2. PROCESSAMENTO: Microcontrolador ESP32 com conversão analógica ADC de 12 bits (0–4095) e transmissão serial CSV a 115200 baud via USB. 3. VISUALIZAÇÃO: Interface desktop oficial (Tauri/Rust/SQLite) com compensação de tara, mapa de calor com interpolação bicúbica contínua e prontuário local de exames. Ressalva técnica: sinais em escala ADC relativa, sem validação clínica direta de pressão local em kg/cm².',
  },
  {
    t: 'Do exame ao histórico. Tudo em um único sistema.',
    s: 'Aquisição, visualização, registros e relatórios integrados ao fluxo do profissional.',
    n: 'Slide 7 — Software Real: Interface desktop oficial (Tauri + Rust + SQLite) centralizada na grande moldura. Alternância automática a cada 3 segundos entre as três etapas principais: Mapa, Indicadores e Histórico.',
  },
  {
    t: 'Não basta observar um resultado. É importante acompanhar a evolução.',
    s: 'Registre, consulte e compare informações coletadas em diferentes momentos.',
    n: 'Slide 8 — Acompanhamento e Evolução: Módulo oficial de comparação do BAROPRESS. Visualização longitudinal de múltiplos exames (#2, #3, #4 e #9) com métricas quantitativas cronológicas de pico ADC, média, área de contato e distribuição de carga.',
  },
  {
    t: 'Informação que vai além da tela.',
    s: 'Organize os resultados em relatórios exportáveis e consulte os registros quando necessário.',
    n: 'Slide 9 — Relatório Oficial A4: Documento estruturado para exportação em PDF. Contém identificação do exame, origem verificada do sinal (ESP32/Hardware Real), superfície contínua interpolada e indicadores quantitativos.',
  },
  {
    t: 'Uma proposta de entrada mais acessível.',
    s: 'Tecnologia para pequenas clínicas e atendimento domiciliar.',
    n: 'Slide 10 — Investimento: BaroScan, R$ 24.961,25, preço anunciado em catálogo público de distribuidor nacional em outubro/2024. BAROPRESS, R$ 2.990, tapete e software integrados para visualização, registros e acompanhamento. Custo estimado de materiais por unidade: aproximadamente R$ 500. Saldo após materiais: R$ 2.490, equivalente a 83,3% do preço de venda (2.490 / 2.990), antes de montagem, tributos e demais despesas. Não representa lucro líquido nem custo total de produção. Destacar a portabilidade e o acesso para pequenas clínicas e atendimento domiciliar.',
  },
  {
    t: 'BAROPRESS',
    s: 'Mais acesso à tecnologia. Mais possibilidades para o cuidado.',
    n: 'Encerramento: a matriz 15×15 retorna à marca. Assinatura: Montival Lucas & Raphaela Teles.',
  },
  {
    t: 'Desenvolvimento com base científica.',
    s: 'O artigo documenta a construção e a avaliação preliminar do BAROPRESS.',
    n: 'Slide 12 — Artigo do projeto: mostrar a primeira página real do documento fornecido, sem atribuir revista, DOI, autores formais ou data de publicação não confirmados. O estudo relata testes de bancada sem pacientes, cinco massas entre 0,438 e 4,518 kg e três repetições por nível. O sinal respondeu à aplicação de cargas, mas a calibração candidata não atingiu o critério adotado de erro absoluto máximo de 1 N (erro máximo de 8,299 N; sete de nove estimativas disponíveis). Não afirmar mensuração quantitativa de pressão plantar ou validade clínica estabelecida. A publicação foi informada pelo usuário; os dados editoriais ainda não foram verificados, por isso o rótulo escolhido é Artigo do projeto. Referência: BAROPRESS: desenvolvimento e avaliação preliminar de um protótipo de baixo custo para aquisição e distribuição espacial de sinais associados à aplicação de carga. Documento do projeto, 2026.',
  },
]

export const ARTICLE = {
  image: 'shots/artigo-primeira-pagina.png',
  title: 'BAROPRESS: desenvolvimento e avaliação preliminar de um protótipo de baixo custo para aquisição e distribuição espacial de sinais associados à aplicação de carga.',
  reference: 'Documento do projeto · 2026',
}

export const SHOTS: Record<string, string> = {
  'Mapa': 'shots/mapa.png',
  'Indicadores': 'shots/indicadores.png',
  'Histórico': 'shots/historico.png',
  'Comparação': 'shots/comparacao.png',
  'Relatório': 'shots/relatorio.png',
}

export const SHOT_META: Record<string, { title: string; detail: string; tag: string }> = {
  'Mapa': {
    title: 'Exame Baropodométrico Estático (#000010)',
    detail: 'Mapa interpolado 15×15 · Leitura máx. 1552 ADC · Centro relativo X: 7.5 | Y: 9.3 · Metade E 43,8% / D 56,2%',
    tag: 'Hardware Real · 30 s (363 quadros)',
  },
  'Indicadores': {
    title: 'Análise Ao Vivo & Controle de Parâmetros',
    detail: 'Ajustes em tempo real de Threshold (320 ADC), VMAX (1400 ADC), Gamma (1.30) e Suavização (0.40)',
    tag: 'Serial 115200 baud · 225 sensels',
  },
  'Histórico': {
    title: 'Histórico de Exames & Prontuário Local',
    detail: 'Persistência 100% offline em SQLite com distinção automática entre coletas REAL e SIMULAÇÃO',
    tag: 'Dados Anonimizados · SQLite',
  },
  'Comparação': {
    title: 'Comparação Longitudinal (4 Avaliações)',
    detail: 'Exames #2, #3, #4 e #9 lado a lado com tabela cronológica de pico ADC, média, contato e simetria',
    tag: 'Acompanhamento Temporal',
  },
  'Relatório': {
    title: 'Visualização e Exportação de Relatório PDF',
    detail: 'Documento estruturado com identificação, origem do sinal, superfície interpolada e indicadores quantitativos',
    tag: 'Laudo A4 Nativo',
  },
}

export type HwItem = {
  id: string
  code: string
  label: string
  src: string
  spec: string
}

export const HW_PHOTOS: HwItem[] = [
  {
    id: 'matriz',
    code: 'A',
    label: 'Malha de cobre 15x15',
    src: 'shots/matriz.jpg',
    spec: '15 fitas condutoras de cobre por eixo com espaçamento uniforme sobre base isolante de 300 × 300 mm.',
  },
  {
    id: 'velostat',
    code: 'B',
    label: 'Velostat',
    src: 'shots/velostat.jpg',
    spec: 'Folha polimérica piezorresistiva acoplada entre as malhas ortogonais formando 225 cruzamentos sensíveis.',
  },
  {
    id: 'arduino',
    code: 'C',
    label: 'Multiplexação Dupla e Aquisição ESP32',
    src: 'shots/arduino.jpg',
    spec: 'Módulos CD74HC4067 para varredura matricial e microcontrolador ESP32 com leitura analógica ADC de 12 bits.',
  },
  {
    id: 'tapete',
    code: 'D',
    label: 'Tapete protótipo',
    src: 'shots/tapete.jpg',
    spec: 'Bancada montada e integrada com fiação protegida, encapsulamento inicial e conectividade USB serial.',
  },
  {
    id: 'produto',
    code: 'E',
    label: 'Produto',
    src: 'shots/tapete-prototipo.jpg',
    spec: 'Conceito de produto final: plataforma portátil fina, acabamento emborrachado resistente e ícone de posicionamento podal.',
  },
]
