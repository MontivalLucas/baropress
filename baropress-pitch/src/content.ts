export type Sc = { t: string; s?: string; n: string }

export const S: Sc[] = [
  {
    t: 'BAROPRESS',
    s: 'A tecnologia deve acompanhar o profissional.',
    n: 'A forma azul cresce, vira a placa e revela os 225 pontos: a marca.',
  },
  {
    t: 'O cuidado não acontece em apenas um lugar.',
    s: 'De pequenas clínicas a visitas domiciliares, os fisioterapeutas precisam de ferramentas compatíveis com a sua rotina.',
    n: 'Slide 2 — Público e contexto: do consultório compacto ao atendimento domiciliar. Apresentação com moldura orgânica gradiente e foto autêntica homecare.',
  },
  {
    t: 'Quando a tecnologia custa caro, o acesso fica limitado.',
    s: 'O alto custo de aquisição inviabiliza a adoção de novas tecnologias para a maioria das clínicas, limitando o diagnóstico avançado.',
    n: 'Slide 3 — Barreira financeira: referência comercial BaroScan (R$ 24.961,25 preço anunciado). Representação gráfica de custo elevado no painel vertical. Transição: E para o profissional que está começando?',
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
]

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
