export type Sc = { t: string; s?: string; n: string }

export const S: Sc[] = [
  {
    t: 'BAROPRESS',
    s: 'A tecnologia deve acompanhar o profissional.',
    n: 'A forma azul cresce, vira a placa e revela os 225 pontos: a marca.',
  },
  {
    t: 'Compreender o apoio orienta o cuidado.',
    s: 'Dados instrumentais complementam a anamnese e o exame físico. A interpretação e a decisão continuam com o fisioterapeuta.',
    n: 'Slide 2 — Avaliação e autonomia: uma avaliação bem fundamentada apoia decisões terapêuticas mais seguras. Recursos instrumentais, quando adequadamente validados, acrescentam informações à anamnese e ao exame físico; não substituem o raciocínio clínico. Registros comparáveis ajudam a investigar mudanças entre sessões, sem que qualquer diferença prove melhora clínica. A aplicação clínica do BAROPRESS ainda depende de validação. Referências: Lin, Papi e McGregor, 2019, doi:10.1136/bmjopen-2018-023656; Hébert-Losier e Murray, 2020, doi:10.1016/j.gaitpost.2019.09.027.',
  },
  {
    t: 'Quando a tecnologia custa caro, o acesso fica limitado.',
    s: 'O investimento em equipamentos pode dificultar o acesso de pequenas clínicas e profissionais autônomos a recursos de avaliação instrumental.',
    n: 'Slide 3 — Barreira de acesso: custo e tempo de adoção são barreiras relatadas por profissionais ao considerar tecnologias de avaliação instrumental. Isso pode dificultar a obtenção de registros para acompanhar o paciente; não significa que o profissional trate sem conhecimento ou apenas por hipóteses. Não afirmar que a maioria das clínicas brasileiras carece de recursos: não há levantamento local apresentado. Marcas, preços e comparação ficam exclusivamente na cena 10. Transição: como ampliar o acesso a ferramentas que apoiem a avaliação e o acompanhamento? Referência: Lin, Papi e McGregor, 2019, doi:10.1136/bmjopen-2018-023656.',
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
