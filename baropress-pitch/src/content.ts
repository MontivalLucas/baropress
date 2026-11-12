type ReferenceId = (typeof REFERENCES)[number]['id']
export type Sc = { t: string; s?: string; n: string; references: ReferenceId[] }

export const S: Sc[] = [
  {
    t: 'Para quem sente dor ao caminhar, cada passo importa.',
    references: ['who-policy', 'article'],
    s: 'Alterações no apoio plantar podem estar associadas a desconforto, dificuldades de marcha e limitações funcionais.',
    n: 'Imagine uma pessoa que sente dor ao caminhar. Para ela, ficar em pé ou percorrer uma pequena distância pode se tornar um desafio. Na fisioterapia, compreender o apoio dos pés faz parte de uma investigação que considera a história, os sintomas e a função de cada pessoa. Alterações no apoio podem estar associadas ao desconforto, mas não explicam sozinhas todas as suas causas. É nesse cuidado que informações instrumentais confiáveis podem acrescentar uma perspectiva. Nossa história começa nessa necessidade humana.',
  },
  {
    t: 'Avaliar melhor para decidir com mais informação.',
    references: ['who-rehabilitation', 'article'],
    s: 'A análise instrumental, quando validada, pode complementar a avaliação clínica e o acompanhamento do apoio plantar.',
    n: 'O fisioterapeuta reúne a história do paciente, observa seus movimentos, realiza o exame físico e aplica testes funcionais. É esse raciocínio clínico que orienta o cuidado. Uma ferramenta instrumental adequada pode acrescentar registros e medidas que nem sempre são fáceis de quantificar apenas pela observação. Esses dados precisam ser confiáveis e interpretados junto aos achados clínicos. Comparar registros pode ajudar a investigar mudanças, mas uma diferença não prova melhora ou eficácia de um tratamento. A decisão continua com o profissional. No caso do BAROPRESS, a aplicação clínica ainda depende de validação. Com esse papel complementar em mente, precisamos discutir também o acesso à tecnologia.',
  },
  {
    t: 'A tecnologia avançou. O acesso ainda é um desafio.',
    references: ['iwgdf'],
    s: 'Equipamentos especializados podem exigir investimentos difíceis para pequenos consultórios, profissionais autônomos e instituições com orçamento limitado.',
    n: 'Tecnologias de avaliação plantar já existem, mas adquirir um equipamento especializado pode exigir um investimento difícil para uma operação menor. A diretriz IWGDF de 2023 reconhece que sistemas validados de mensuração plantar são relativamente caros e que a tecnologia e a expertise necessárias ainda não estão amplamente disponíveis. Esse argumento aparece em um contexto específico: calçados terapêuticos e prevenção de recorrência de úlceras em pessoas com diabetes. Não é uma estatística sobre clínicas brasileiras, nem prova de falta de tratamento. Ele ajuda a reconhecer uma barreira e uma pergunta de pesquisa: como investigar alternativas mais acessíveis, preservando os requisitos de qualidade e segurança? Fonte: IWGDF 2023, fundamentação da recomendação 8c, página 20 do PDF.',
  },
  {
    t: 'E se essa tecnologia pudesse chegar a mais profissionais?',
    references: ['article'],
    s: 'Uma proposta para reduzir barreiras de investimento e ampliar o acesso à visualização instrumental do apoio plantar.',
    n: 'Foi a partir dessa dificuldade de acesso que surgiu nossa pergunta: seria possível desenvolver uma alternativa mais acessível, reunindo um tapete sensor e um software próprio? Três diretrizes orientam essa investigação: acessibilidade, mobilidade e organização de registros ao longo do tempo. São objetivos de desenvolvimento, que ainda precisam ser comprovados no uso pretendido. A imagem apresenta um conceito de acabamento, não um equipamento final. A seguir, mostramos o que a equipe já construiu.',
  },
  {
    t: 'BAROPRESS. Um tapete. Um software. Um caminho para ampliar o acesso.',
    references: ['article'],
    s: 'Plataforma experimental de aquisição e visualização de sinais associados ao apoio plantar, integrada a um aplicativo desktop.',
    n: 'Esta é a proposta BAROPRESS: integrar hardware e software para investigar uma alternativa mais acessível de visualização e organização de sinais plantares. As primeiras quatro imagens mostram etapas reais da bancada: a malha de cobre, o Velostat, o circuito de aquisição e o tapete montado. A quinta é um conceito de produto, não o equipamento final. A matriz tem 15 linhas e 15 colunas, totalizando 225 cruzamentos de leitura; não são 225 sensores independentes. O ESP32 e dois multiplexadores fazem a aquisição dos sinais digitais. O aplicativo organiza mapas, registros e relatórios. Já existe integração funcional, mas ainda não demonstramos mensuração quantitativa validada de pressão plantar. Uso clínico futuro depende de desempenho comprovado, estudos apropriados e requisitos regulatórios aplicáveis.',
  },
  {
    t: 'Como funciona',
    references: ['article'],
    s: '225 posições de leitura integradas a um sistema de aquisição e análise relativa.',
    n: 'O funcionamento pode ser entendido em três passos. Primeiro, a matriz registra variações do sinal elétrico em 225 cruzamentos. Depois, o ESP32 organiza essas leituras digitais e as transmite ao computador. Por fim, o software apresenta o mapa e armazena os registros. As cores mostram intensidades relativas do sinal, em contagens ADC. A interpolação suaviza a imagem, mas não cria novos pontos de medição. O diagrama desta cena é ilustrativo. Não estamos mostrando pressão física calibrada em kPa ou kg/cm². A questão técnica para as próximas etapas é demonstrar como essas respostas se relacionam com cargas de referência e com as condições de uso pretendidas.',
  },
  {
    t: 'Do exame ao histórico. Tudo em um único sistema.',
    references: ['article'],
    s: 'Aquisição, visualização, registros e relatórios integrados ao fluxo do profissional.',
    n: 'No aplicativo, o foco é transformar a aquisição em registros organizados. Na primeira tela, vemos um registro e seu mapa de sinais relativos. A segunda mostra os controles de visualização: ajustar a escala ou o limiar muda a forma de apresentar o sinal, não constitui calibração física. Na terceira, o histórico reúne registros que podem ser consultados posteriormente. Os selos de hardware real identificam a origem da aquisição; não certificam validade clínica. Estas são capturas do software, não um atendimento nem uma validação com pacientes. A demonstração alterna automaticamente, e pode ser pausada para apresentar cada tela com calma. O valor que investigamos é reunir aquisição, visualização e consulta no mesmo fluxo. A utilidade para decisões clínicas ainda precisa ser estudada.',
  },
  {
    t: 'Não basta registrar um momento. É importante organizar informações ao longo do tempo.',
    references: ['article'],
    s: 'Registre, consulte e compare informações coletadas em diferentes momentos.',
    n: 'O módulo de comparação permite consultar registros de diferentes momentos lado a lado. A tabela organiza leituras máximas, médias e descritores relativos do sinal. Isso facilita recuperar o que foi registrado, mas diferenças numéricas podem refletir tanto as condições de aquisição quanto o comportamento do sistema. Não demonstram melhora clínica nem eficácia de um tratamento. Nesta etapa, comparamos registros eletrônicos do protótipo; a interpretação futura exige medidas confiáveis e protocolo padronizado.',
  },
  {
    t: 'Informação que vai além da tela.',
    references: ['article'],
    s: 'Organize os resultados em relatórios exportáveis e consulte os registros quando necessário.',
    n: 'Os registros também podem ser organizados em relatórios exportáveis em PDF. Esta captura mostra um trecho real da interface de relatório, com a identificação pessoal ocultada para apresentação pública. O documento reúne origem da aquisição, mapa e indicadores relativos. O selo de hardware real indica de onde veio o sinal, não que a medição tenha sido clinicamente validada. É um relatório de sinais do protótipo, não um laudo diagnóstico. A captura é parcial; não representa a página A4 completa.',
  },
  {
    t: 'Uma proposta de entrada mais acessível.',
    references: ['podotech', 'article'],
    s: 'Uma hipótese de investimento menor, com desempenho e viabilidade ainda a validar.',
    n: 'Os sistemas profissionais existentes mostram que esta categoria tecnológica está estabelecida. Um exemplo é o BaroScan, anunciado pela Podotech por R$ 24.961,25 na consulta de novembro de 2026. Nossa hipótese é desenvolver uma alternativa de entrada com preço-alvo de R$ 2.990. A estimativa preliminar de materiais da bancada é de aproximadamente R$ 500. Isso não é o custo completo de produção, e a diferença de R$ 2.490 não representa lucro validado. Ainda precisamos contabilizar montagem, calibração, testes, impostos, suporte, logística, manutenção, garantia, comercialização e eventuais despesas regulatórias. As barras comparam somente valores; os produtos não têm desempenho ou capacidade clínica equivalentes demonstrados. Antes de comercializar para uso clínico, precisamos comprovar desempenho, investigar demanda e atender aos requisitos aplicáveis.',
  },
  {
    t: 'BAROPRESS',
    references: ['article'],
    s: 'Mais acesso à tecnologia. Mais possibilidades para o cuidado.',
    n: 'Nossa proposta é ampliar as possibilidades de acesso à tecnologia sem antecipar capacidades clínicas. Já construímos o protótipo, integramos o software e documentamos os primeiros ensaios. Buscamos parceiros de ensino, pesquisa e profissionais para revisar a calibração, ampliar os testes e planejar as próximas etapas de validação. Esse é o convite: ajudar a transformar o potencial em desempenho demonstrado e valor comprovado para os usuários.',
  },
  {
    t: 'Da ideia à pesquisa científica.',
    references: ['article'],
    s: 'O desenvolvimento e os ensaios preliminares do BAROPRESS foram documentados em artigo científico.',
    n: 'O BAROPRESS não ficou apenas na ideia. Esta é a primeira página real do artigo que documenta a construção e os testes de bancada, sem pacientes e sem testes clínicos de marcha. Foram cinco níveis de massa, de 0,438 a 4,518 kg, com três repetições por nível. O sinal respondeu à carga, mas a calibração candidata não atingiu o critério adotado de erro absoluto máximo de 1 N: o erro máximo foi de 8,299 N e duas das nove estimativas ficaram indisponíveis. O estudo registra esses limites e não demonstra mensuração quantitativa validada de pressão plantar. Conforme informado pela equipe, o artigo está in press na Revista Internacional de Ciências da Saúde e Sociedade (RICSS), em 2026. A situação editorial é um marco acadêmico, mas não comprova validação metrológica ou clínica. Essa pesquisa dá base às próximas etapas do desenvolvimento. Os QR codes deste slide levam aos perfis de LinkedIn da equipe, para quem quiser acompanhar o projeto ou conversar sobre futuras colaborações.',
  },
]

export const ARTICLE = {
  image: 'shots/artigo-primeira-pagina.png',
  title: 'BAROPRESS: desenvolvimento e avaliação preliminar de um protótipo de baixo custo para aquisição e distribuição espacial de sinais associados à aplicação de carga.',
  reference: 'RICSS · In press, 2026',
  editorialStatus: 'Artigo in press — RICSS (2026)',
  editorialDetail: 'Revista Internacional de Ciências da Saúde e Sociedade · informação editorial fornecida pela equipe.',
}

export const TEAM_LINKEDIN = [
  {
    name: 'Montival Lucas',
    handle: 'linkedin.com/in/montival-lucas',
    url: 'https://www.linkedin.com/in/montival-lucas/',
    qr: 'qr-linkedin-montival-lucas.svg',
  },
  {
    name: 'Raphaela Teles',
    handle: 'linkedin.com/in/raphaelateles',
    url: 'https://www.linkedin.com/in/raphaelateles/',
    qr: 'qr-linkedin-raphaela-teles.svg',
  },
] as const

// Tempos orientativos para fala e demonstração; total de dez minutos.
export const SCENE_SECONDS = [35, 60, 60, 35, 60, 50, 80, 40, 35, 60, 30, 55] as const

export const REFERENCES = [
  {
    id: 'who-policy',
    citation: 'OMS (2025) · Rehabilitation: a key strategy in addressing noncommunicable diseases',
    title: 'OMS · Rehabilitation: a key strategy in addressing noncommunicable diseases · 2025',
    url: 'https://www.who.int/publications/m/item/policy-brief',
    context: 'Estimativa global de 2,6 bilhões de pessoas que poderiam se beneficiar de reabilitação; não estima demanda por baropodometria ou pelo BAROPRESS.',
  },
  {
    id: 'who-rehabilitation',
    citation: 'OMS (2024) · Rehabilitation',
    title: 'OMS · Rehabilitation · 2024',
    url: 'https://www.who.int/news-room/fact-sheets/detail/rehabilitation/',
    context: 'Mais de 50% sem serviços necessários em alguns países de baixa e média renda. Não representa o Brasil nem falta de baropodômetros; dado complementar, não exibido na cena 3.',
  },
  {
    id: 'iwgdf',
    citation: 'IWGDF (2023) · Prevention guideline · Recomendação 8c, fundamentação, p. 20 do PDF',
    title: 'IWGDF · Guidelines on the prevention of foot ulcers in persons with diabetes · 2023',
    url: 'https://iwgdfguidelines.org/wp-content/uploads/2023/07/IWGDF-2023-02-Prevention-Guideline.pdf#page=20',
    context: 'Recomendação 8c, fundamentação, página 20 do PDF: custo e disponibilidade de sistemas validados no contexto de prevenção de recorrência de úlceras e calçados terapêuticos em pessoas com diabetes. Não valida o BAROPRESS.',
  },
  {
    id: 'podotech',
    citation: 'Podotech · BaroScan · podotech.com.br/baroscan · consulta em 06/11/2026',
    title: 'Podotech · BaroScan · consulta em 06/11/2026',
    url: 'https://podotech.com.br/baroscan',
    context: 'Preço público anunciado de R$ 24.961,25. Comparação financeira restrita à cena 10; não demonstra equivalência técnica ou clínica.',
  },
  {
    id: 'article',
    citation: 'BAROPRESS: desenvolvimento e avaliação preliminar de um protótipo de baixo custo para aquisição e distribuição espacial de sinais associados à aplicação de carga. Revista Internacional de Ciências da Saúde e Sociedade (RICSS). In press, 2026.',
    title: 'BAROPRESS: desenvolvimento e avaliação preliminar de um protótipo de baixo custo para aquisição e distribuição espacial de sinais associados à aplicação de carga. Revista Internacional de Ciências da Saúde e Sociedade (RICSS). In press, 2026.',
    context: 'Ensaios preliminares de bancada, sem pacientes. Publicação in press na RICSS em 2026, conforme informação da equipe. Sem validação clínica estabelecida.',
  },
] as const

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
    tag: 'Relatório de sinais · identificação ocultada',
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
    label: 'Conceito de produto',
    src: 'shots/tapete-prototipo.jpg',
    spec: 'Conceito de produto final: plataforma portátil fina, acabamento emborrachado resistente e ícone de posicionamento podal.',
  },
]
