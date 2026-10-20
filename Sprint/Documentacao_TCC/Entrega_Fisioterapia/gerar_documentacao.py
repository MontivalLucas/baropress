from pathlib import Path
from datetime import datetime, timezone
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import json

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
DOC = OUT / 'BAROPRESS_Documentacao_Tecnica_para_Fisioterapia.docx'
doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21), Cm(29.7)
sec.top_margin, sec.bottom_margin = Cm(2.0), Cm(2.0)
sec.left_margin, sec.right_margin = Cm(2.2), Cm(2.2)
sec.header_distance = sec.footer_distance = Cm(0.85)
for name in ['Normal', 'Title', 'Subtitle', 'Heading 1', 'Heading 2', 'Caption']:
    st = doc.styles[name]
    st.font.name = 'Calibri'
    st.font.color.rgb = RGBColor(0,0,0)
normal = doc.styles['Normal']
normal.font.size = Pt(11)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.08
for name, size in [('Title', 24), ('Heading 1', 17), ('Heading 2', 12.5)]:
    st = doc.styles[name]
    st.font.size = Pt(size)
    st.font.bold = True
    st.paragraph_format.space_before = Pt(8)
    st.paragraph_format.space_after = Pt(6)
    st.paragraph_format.keep_with_next = True
doc.styles['Caption'].font.size = Pt(9)
doc.styles['Caption'].paragraph_format.space_after = Pt(8)
header = sec.header.paragraphs[0]
header.text = 'BAROPRESS  |  DOCUMENTAÇÃO DO DESENVOLVIMENTO'
header.runs[0].font.size = Pt(8)
footer = sec.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
footer.add_run('TCC em colaboração com Fisioterapia  •  09 outubro 2026  |  ')
fld = OxmlElement('w:fldSimple'); fld.set(qn('w:instr'), 'PAGE'); footer._p.append(fld)
for r in footer.runs: r.font.size = Pt(8)
doc.core_properties.title = 'Documentação técnica do projeto BAROPRESS para Fisioterapia'
doc.core_properties.subject = 'Construção, dificuldades, soluções e resultados piloto para apoiar o artigo científico'
doc.core_properties.author = 'Equipe do projeto BAROPRESS'
doc.core_properties.created = datetime(2026,10,9,12,0,0,tzinfo=timezone.utc)

def p(text='', style=None):
    for before, after in [('abri la','abri-la'),('descartá la','descartá-la'),('Trata se','Trata-se'),('bem sucedida','bem-sucedida'),('e mail','e-mail'),('Wi Fi','Wi-Fi')]:
        text = text.replace(before, after)
    return doc.add_paragraph(text, style)

def h(text, level=2):
    return doc.add_heading(text, level)

def page(title):
    heading = h(title, 1)
    heading.paragraph_format.page_break_before = True

def bullets(items):
    for x in items:
        pp = p(x, 'List Bullet')
        pp.paragraph_format.space_after = Pt(4)

def table(headers, rows, widths):
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    for col,w in zip(t.columns,widths): col.width = Cm(w)
    for c,v,w in zip(t.rows[0].cells,headers,widths): c.text=v; c.width=Cm(w)
    for row in rows:
        cells=t.add_row().cells
        for c,v,w in zip(cells,row,widths): c.text=str(v); c.width=Cm(w)
    tblPr=t._tbl.tblPr
    borders=OxmlElement('w:tblBorders')
    for edge in ['top','left','bottom','right','insideH','insideV']:
        e=OxmlElement('w:'+edge)
        for k,v in [('val','single'),('sz','4'),('color','D9D9D9')]: e.set(qn('w:'+k),v)
        borders.append(e)
    tblPr.append(borders)
    repeat=OxmlElement('w:tblHeader'); t.rows[0]._tr.get_or_add_trPr().append(repeat)
    for i,row in enumerate(t.rows):
        nosplit=OxmlElement('w:cantSplit'); row._tr.get_or_add_trPr().append(nosplit)
        for c in row.cells:
            c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            pr=c._tc.get_or_add_tcPr()
            sh=OxmlElement('w:shd'); sh.set(qn('w:fill'),'DCE6EF' if i==0 else ('F5F7F9' if i%2==0 else 'FFFFFF')); pr.append(sh)
            margins=OxmlElement('w:tcMar')
            for edge in ['top','left','bottom','right']:
                e=OxmlElement('w:'+edge); e.set(qn('w:w'),'85'); e.set(qn('w:type'),'dxa'); margins.append(e)
            pr.append(margins)
            for pp in c.paragraphs:
                pp.paragraph_format.space_after=Pt(2)
                pp.paragraph_format.line_spacing=1.05
                for r in pp.runs: r.font.size=Pt(9.5); r.font.bold=i==0
    p('').paragraph_format.space_after=Pt(0)
    return t

def figure(relative, caption, width=None, height=None):
    pp=p(''); pp.alignment=WD_ALIGN_PARAGRAPH.CENTER
    pp.paragraph_format.keep_with_next=True
    pp.paragraph_format.space_after=Pt(3)
    kwargs={}
    if width is not None: kwargs['width']=Cm(width)
    if height is not None: kwargs['height']=Cm(height)
    pp.add_run().add_picture(str(ROOT / relative),**kwargs)
    p(caption,'Caption')

p('Documentação técnica do projeto BAROPRESS', 'Title')
p('Construção dificuldades soluções e resultados piloto para apoiar o artigo científico', 'Subtitle')
p('Destinatárias  Equipe de Fisioterapia participante do TCC\nData  09 de outubro de 2026\nVersão desta documentação  1.0')
h('Síntese do projeto')
p('O BAROPRESS reúne uma plataforma sensora de matriz 15 × 15 e um aplicativo desktop para adquirir, visualizar e registrar a distribuição relativa do sinal associado ao apoio sobre a superfície. A documentação disponível descreve Velostat, fitas de cobre, ESP32 e dois multiplexadores. O aplicativo organiza pacientes, exames, questionários, comparação de resultados e relatórios locais. [S1–S3]')
p('Os registros mostram funcionamento de aquisição e visualização e um piloto de bancada com 35 coletas. Entretanto, o perfil candidato de força total foi reprovado na validação registrada. A conclusão sustentada pelos dados é a de um protótipo acadêmico com resultados exploratórios e necessidade de aperfeiçoamento metrológico; os registros não demonstram precisão clínica, pressão local calibrada ou validação de marcha. [S2, S4]')
h('Como ler este documento')
p('O relato histórico da construção, as medidas cadastradas, as funções implementadas e os resultados experimentais têm graus diferentes de comprovação. Essa distinção é indicada ao longo do texto. Os ensaios apresentados são os extraídos em 07/10/2026; não houve nova coleta física nem nova leitura do banco pessoal para esta entrega.')
p('O código e a entrega mais recente identificam a versão 0.2.12, de 09/10/2026. Os ensaios pertencem ao registro documental da versão 0.2.10, e a captura de calibração pertence à 0.2.11. Não se presume que o computador de uso já tenha sido atualizado. [S2, S8]')
h('Organização do conteúdo')
bullets(['Materiais, medidas e construção da plataforma.', 'Eletrônica, aquisição e processamento dos dados.', 'Recursos do aplicativo e evolução do desenvolvimento.', 'Problemas de montagem e software e soluções registradas.', 'Procedimento piloto, variabilidade e resultado da validação.', 'Parecer técnico e textos que podem apoiar o artigo.', 'Imagens disponíveis e referências internas para rastreabilidade.'])

page('1 Materiais e características da plataforma')
p('A tabela reúne componentes descritos na referência de hardware. Ela é uma relação técnica de montagem, não uma lista de compra conferida por notas fiscais ou fotografias da versão final. Quantidades não documentadas e valores finais desconhecidos permanecem explicitados. [S1, S2]')
table(['Componente','Quantidade descrita','Função e identificação'],[
('ESP32 Dev Module ou NodeMCU 32S','1 placa','Microcontrolador descrito com ESP WROOM 32; seleção e leitura da matriz, lógica de 3,3 V.'),
('CD74HC4067','2 módulos','Multiplexadores de 16 canais; um para linhas e outro para colunas; 15 canais usados em cada.'),
('Fitas condutoras de cobre','30 fitas','15 linhas e 15 colunas em direções ortogonais; largura cadastrada de 10 mm.'),
('Velostat','1 folha contínua descrita','Material sensível entre as camadas de cobre; dimensões finais, espessura e fornecedor não confirmados.'),
('Resistores de pull down','15','Um por coluna para referência ao GND. A referência cita 1 a 10 kΩ; valor efetivamente usado não confirmado.'),
('Protoboard jumpers e cabo flat','Sem contagem registrada','Conexões citadas no histórico. Tipo final de fixação, soldagem e conectores não documentado.'),
('Conexão serial e alimentação','Sem lista final','USB e Bluetooth SPP descritos. A forma física usada nas coletas não é comprovada apenas pela porta COM5.'),
('Base revestimento e EVA','Sem especificação final','A documentação anterior menciona EVA, mas não identifica espessura, camadas, módulos ou método de união.')],[4.2,3.0,9.4])
h('Medidas cadastradas')
p('A região sensora cadastrada mede 300 × 300 mm, com 15 × 15 pontos, passo entre centros de 20 mm em X e Y e fitas de 10 mm. O vão livre informado entre fitas adjacentes é 10 mm. Os 225 pontos são interseções da matriz; não correspondem necessariamente a 225 sensores discretos adquiridos individualmente. [S2, S7]')
p('Essas medidas são de cadastro. Elas não estabelecem tamanho externo do tapete, espessura total, área efetiva de cada célula nem capacidade mecânica máxima. Os pontos estão habilitados, mas as coordenadas físicas e áreas individuais não foram preenchidas no conjunto de evidências consultado. [S2]')

page('2 Construção e ligações eletrônicas')
h('Organização da superfície sensora')
p('A arquitetura descrita usa uma camada com 15 condutores paralelos, uma folha contínua de Velostat entre as camadas e outra camada com 15 condutores perpendicularmente orientados. Cada cruzamento define uma posição de leitura. A solicitação mecânica modifica a resposta elétrica do conjunto, lida pelo circuito como contagem do conversor analógico digital, ou ADC. [S1]')
p('A sequência funcional reconstruída da documentação é: organizar os condutores da primeira direção; interpor o material sensível; organizar os condutores da direção perpendicular; conectar linhas e colunas aos multiplexadores; referenciar cada coluna ao GND por resistor; conectar a seleção e a leitura ao ESP32; e conferir varredura e orientação na visualização. Essa sequência explica a arquitetura documentada, sem substituir uma ficha de fabricação da montagem final.')
h('Pinagem descrita na referência de construção')
table(['Sinal','Linhas ou excitação','Colunas ou leitura'],[
('SIG','GPIO12','GPIO34 ADC1'),('S0','GPIO25','GPIO18'),('S1','GPIO26','GPIO19'),('S2','GPIO27','GPIO21'),('S3','GPIO14','GPIO22'),('Canais usados','C0 a C14','C0 a C14'),('Alimentação dos MUX','VCC em 3,3 V','VCC em 3,3 V'),('Referência e habilitação','GND comum e EN em GND','GND comum e EN em GND')],[4.4,6.1,6.1])
p('Na montagem relatada, os pinos RX0 e TX0 ficam entre referências usadas na ligação do seletor de colunas. Um erro de conexão em RX0, no lugar de GPIO22, foi registrado e corrigido. A pinagem acima deve ser tratada como referência histórica até a conferência do circuito final. [S1, S2]')
h('Varredura e firmware')
p('O firmware transcrito na referência, em Arduino C++, seleciona uma linha e percorre as 15 colunas, repetindo até completar 225 leituras. Após o chaveamento, descreve espera de 60 µs, leitura de descarte e mais 10 µs antes da leitura aproveitada. A finalidade declarada é reduzir efeitos de acomodação e memória da leitura anterior. O efeito quantitativo desse ajuste não foi ensaiado separadamente. [S1]')
p('A alimentação, a fixação das camadas, a proteção dos cabos, os valores finais dos resistores e o firmware efetivamente carregado nas coletas não têm identificação completa nas evidências. Portanto, esta documentação não atribui a essa montagem um método de colagem, soldagem, encapsulamento ou acabamento que não esteja registrado. [S2]')

page('3 Aquisição processamento e interpretação')
h('Caminho dos dados')
p('Carga aplicada → resposta da matriz → seleção de linha e coluna → ADC do ESP32 → linha CSV com 225 valores → comunicação serial → validação do quadro → compensação de zero e orientação → visualização e indicadores → salvamento do exame e emissão de relatório. [S1, S3, S9]')
p('O protocolo aceito pelo aplicativo contém exatamente 225 inteiros entre 0 e 4095 por quadro. Linhas vazias, valores ausentes, não inteiros ou fora da faixa são rejeitados. Essa validação evita interpretar quadros malformados como matrizes válidas; não verifica, sozinha, a exatidão física do sensor. [S9]')
p('A referência descreve USB serial e Bluetooth Serial Port Profile, com nome Esteira_Pressao_ESP32. Nas 35 coletas estão registrados transporte SERIAL, COM5 e 115200 baud. A porta pode ser física ou virtual; esse cadastro não determina qual enlace foi efetivamente usado. Não há aquisição por Wi Fi identificada no código consultado. [S1, S2]')
h('Compensação de zero e orientação')
p('A tara estima a linha de base com a plataforma sem carga e subtrai esse valor por ponto, limitando o resultado inferior a zero. No código atual, o zeramento usa 20 quadros por padrão. A compensação de zero não transforma ADC em força ou pressão. A orientação histórica inclui espelhamento horizontal da matriz, corrigindo a correspondência entre o lado físico e a tela. [S5, S9]')
h('Mapa e indicadores relativos')
p('O mapa de calor usa interpolação para criar uma superfície visual contínua a partir dos 225 pontos. VMAX controla o limite da escala de cores, gamma modifica o contraste e a suavização atua na apresentação. Esses ajustes não aumentam a quantidade de sensores nem estabelecem uma curva física de pressão. [S3, S4]')
p('O limiar de contato determina quais valores entram nos indicadores. A leitura média corresponde à média espacial dos pontos considerados em contato; o percentual de contato corresponde à contagem desses pontos dividida por 225. Sem área efetiva conhecida, esse percentual não pode ser tratado como cm². [S4, S9]')
p('A distribuição bilateral histórica compara a soma ADC das colunas 0 a 6 com a das colunas 8 a 14; a coluna 7 fica excluída. Ela pressupõe posicionamento adequado e não reconhece os pés automaticamente. O marcador de centro é calculado com pesos ADC e coordenadas da matriz; deve ser descrito como centro relativo ADC, sem afirmar equivalência a CoP físico validado. [S2, S4, S9]')
h('Frequência observada')
p('Nas janelas dos ensaios de bancada foram registrados aproximadamente 12,21 a 12,81 quadros por segundo. Cada quadro contém uma varredura sequencial de 225 posições. O relato inicial de aproximadamente 30 FPS não foi confirmado nessas coletas. Baud rate, taxa de recepção dos quadros e FPS de desenho da tela são medidas diferentes. [S2]')

page('4 Desenvolvimento e recursos do aplicativo')
h('Da visualização inicial ao sistema desktop')
p('A documentação inicial apresenta um visualizador Python com pyserial, NumPy e Matplotlib, além de controles de tara, escala, limiar e gamma. O BAROPRESS atual é desenvolvido em Tauri 2, React e TypeScript, com serviços nativos em Rust e armazenamento SQLite local. Essa evolução organiza os dados e o fluxo de uso além da exibição do mapa. [S1, S3]')
h('Recursos implementados')
bullets(['Pacientes e histórico: cadastro, busca, arquivamento e associação dos exames; novos exames preservam uma cópia dos dados demográficos ao salvar.', 'Aquisição: configuração da porta, taxa serial, conexão automática, compensação de zero, diagnóstico da matriz e distinção entre Hardware Real e Simulação.', 'Exame estático: seleção do paciente, preparação, coleta temporizada, média por sensor, revisão e salvamento; observações técnicas e condições da aquisição.', 'Resultados e documentos: mapa, indicadores relativos, visualização de resultados salvos, relatório e exportação local em PDF, PNG, CSV e JSON conforme o recurso.', 'Comparação: seleção de 2 a 4 exames do mesmo paciente e possibilidade de escala visual comum; diferenças dependem da compatibilidade dos métodos e condições.', 'Questionários e agenda: anamnese baropodométrica com 40 perguntas, histórico de respostas, agendamentos e organização dos atendimentos.', 'Calibração: cadastro da montagem, coletas, construção de curva, validação e seleção de perfil; funções de conversão física dependem do escopo e da aprovação do perfil.', 'Administração: usuários, perfis de acesso, preferências, logs, backups e restauração.'])
h('Recursos acrescentados em outubro de 2026')
p('A revisão de exames passou a prever retenção de até 10.000 quadros brutos nos novos exames, reprodução temporal, seleção manual de regiões, gráficos do centro ADC e representação em 3D. A altura das barras é uma representação do sinal dos sensores, sem reconstrução anatômica. Exames antigos sem série bruta não recebem quadros ou condições inventadas. [S4]')
p('A versão 0.2.12 inclui perfis de administrador, profissional e secretário, com autorização no backend. Os registros finais informam 198 testes frontend e 123 testes Rust aprovados, com um benchmark ignorado, além da compilação e do instalador. Esses números são verificações de software; não representam ensaios físicos ou participantes. [S8]')
h('Estado da entrega')
p('A disponibilidade de uma função no código ou no instalador não comprova homologação com ESP32, Bluetooth, impressão física ou uso no ambiente definitivo. Os registros mantêm essas conferências separadas dos testes sintéticos e da conclusão da implementação. [S4, S8]')

page('5 Problemas na montagem e soluções registradas')
p('Os episódios abaixo são relatos da referência inicial. Não possuem fotos antes e depois, datas individuais ou ensaios quantitativos de confirmação. Ainda assim, documentam dificuldades e ajustes adotados durante o desenvolvimento. [S1, S2]')
h('Falha ao enviar o firmware')
p('Problema: erro DFU com exit status 74. Causa relatada: seleção de Arduino Nano ESP32 na IDE, acionando um método de envio incompatível com a placa descrita. Solução registrada: selecionar ESP32 Dev Module e usar envio UART por esptool. O aprendizado é conferir o modelo de placa e o método de upload antes de investigar a matriz sensora.')
h('Faixas contínuas e leituras agrupadas')
p('Problema: várias colunas respondiam em bloco. Uma causa relatada foi o barramento de GND da protoboard dividido, deixando parte dos resistores de pull down sem referência comum. Solução: interligar o barramento ao GND do ESP32 por jumper. Outra causa foi S3 do multiplexador de colunas ligado a RX0. Solução: reposicionar S3 em GPIO22, preservando S0 em GPIO18, S1 em GPIO19 e S2 em GPIO21.')
p('Esses episódios mostram que um desenho anormal no mapa pode resultar da ligação elétrica e da seleção dos canais. Não há evidência nesses relatos de que determinados sensores tenham sido danificados definitivamente.')
h('Direita e esquerda invertidas na tela')
p('Problema: apoio à direita aparecia à esquerda. Causa relatada: orientação do cabo flat em relação aos eixos de visualização. Solução inicial: espelhamento horizontal com np.fliplr no Python. A transformação correspondente também existe no aplicativo atual. A conferência experimental por carga localizada continua necessária para documentar a orientação final.')
h('Mapa com contraste insuficiente')
p('Problema: imagem predominantemente azul. Causa relatada: VMAX configurado em 3500 ADC, acima dos picos citados de 1800 a 2200 ADC. Solução visual: reduzir VMAX para aproximadamente 2100 e ajustar gamma para aproximadamente 1,3. Esses valores pertencem ao relato inicial e não são parâmetros universais ou resultados de calibração física.')
h('Bluetooth apenas emparelhado')
p('Problema: o Windows mostrava o dispositivo emparelhado, sem aquisição ativa. Procedimento registrado: identificar a porta serial SPP de saída e abri la pelo software. A referência relata conexão ativa durante o consumo dos dados. Os registros atuais em COM5, isoladamente, não confirmam aquisição sem fio.')
h('Ruído residual e leitura anterior')
p('A referência inclui leitura de descarte e espera após o chaveamento no firmware, além de tara e limiar no processamento. São medidas destinadas a reduzir resíduos e melhorar a visualização. Não foi localizado um ensaio que quantifique quanto cada medida reduziu ruído ou interferência entre pontos; portanto, não se afirma eliminação completa desses efeitos.')

page('6 Correções de software e tentativa desfeita')
p('Os registros de auditoria identificam problemas no código e descrevem correções. Alguns resultados foram verificados com testes sintéticos e bancos temporários; isso não deve ser confundido com reprodução do problema no dispositivo físico. [S5]')
h('Unidades e dados ausentes nos relatórios')
p('Uma altura cadastrada em centímetros podia aparecer com unidade de metros incorreta. Também existiam valores substitutos indevidos para dados ausentes, como distribuição 50/50, duração de 10 s e frequência de 30 FPS. A correção adotou formatação compartilhada e indicação explícita de ausência, preservando zeros reais. Observações longas passaram a ter páginas de continuação, em vez de ultrapassar a área prevista.')
h('Conexão interferindo na navegação')
p('Comandos de porta serial e de banco compartilhavam execução, o que podia prejudicar listas enquanto uma porta demorava a abrir. A revisão 0.2.10 separou os executores, preservou autorização e ampliou o intervalo entre tentativas de conexão com falha. Isso melhora a organização do aplicativo, mas não resolve por si só problemas do driver ou do transporte físico.')
h('Preservação do exame e dos registros')
p('Foram acrescentados avisos de alteração não salva e proteção ao sair durante preparação, coleta ou salvamento. Novos exames preservam dados demográficos no momento da gravação. Migrações e backups receberam verificações de consistência, cópia antes de atualização e operações transacionais. Registros antigos mantêm aviso quando não possuem as informações históricas novas.')
h('Acesso e uso da calibração')
p('A autenticação e a autorização passaram a ser verificadas no backend, e a gestão de usuários foi ampliada na 0.2.12. A tela de calibração foi organizada em cinco etapas: Tapete, Coletas, Criar curva, Conferir curva e Usar calibração, com explicações, unidades e campos condicionais. Trata se de melhoria de uso; os critérios físicos não foram substituídos por aparência ou testes da interface. [S7, S8]')
h('Reposicionamento da faixa esquerda que não funcionou')
p('Em 08/10/2026 foi tentado um deslocamento visual de colunas para alinhar a faixa esquerda. O responsável relatou que o resultado não deu certo e pediu a reversão. Foram removidos reposicionamento, controles e persistência associados, restaurando matriz e marcador originais em análise, exames, comparação, PNG, PDF e visualizadores Python. A restauração da versão 0.2.11 foi registrada. [S6]')
p('A tentativa deve aparecer como uma solução avaliada e desfeita, não como uma correção física bem sucedida. A documentação não identifica uma causa experimental definitiva para o alinhamento observado.')
h('Limitações ainda registradas')
p('O limiar zero inclui leituras zero na contagem de contato pela regra atual. SQLite e backups locais não são cifrados; o login limita comandos do aplicativo. Na recuperação atual, e mail e RA permitem redefinição, e RA não é segredo de uso único. Essas características estão documentadas e não devem ser apresentadas como funcionalidades já aperfeiçoadas ou segurança integral comprovada. [S4, S8]')

page('7 Procedimento e resultados do piloto de bancada')
h('Conjunto de ensaios disponível')
p('A extração de 07/10/2026 documenta 35 coletas marcadas REAL: 28 aceitas, uma em revisão e seis rejeitadas por erro no cadastro de peso e unidade. São 6.570 quadros completos, incluindo acomodação, e 4.389 quadros nas janelas analisadas. A marca REAL identifica a origem cadastrada; não substitui confirmação externa da montagem ou da carga aplicada. [S2]')
p('Os ensaios de carga foram cadastrados como HOLD, com 5 s de acomodação programada e 10 s de coleta, usando o centro da placa. A coleta de zero corresponde ao tapete sem carga. Não há ensaio de caminhada, carga em bordas ou cantos, nem área de contato preenchida nesse conjunto.')
h('Níveis usados para construir o perfil candidato')
table(['Massa total kg','Repetições','Sinal médio ADC','CV entre repetições'],[
('0,438','3','2.390,269','28,59%'),('1,458','3','8.822,090','5,27%'),('2,478','3','13.659,920','5,19%'),('3,498','3','16.634,120','2,51%'),('4,518','3','22.931,684','4,27%')],[3.8,2.5,5.2,5.1])
p('A massa total inclui o aplicador de 0,438 kg quando informado no cadastro. As três coletas adicionais de 3,060 kg sem suporte foram aceitas, mas não integraram esse ajuste. O ensaio com celular de 199 g permaneceu em revisão. Os seis cadastros rejeitados foram preservados e excluídos do ajuste, sem corrigir retrospectivamente o banco. [S2]')
h('Definição do sinal e da variabilidade')
p('S é a média temporal da soma das 225 leituras após correção pelo baseline e pelo piso de ruído do perfil candidato: soma de max(0, ADCᵢ − bᵢ − nᵢ). O piso descrito é nᵢ = max(1, 3 × DP do zeroᵢ + |deriva do zeroᵢ|). Portanto, S é um indicador agregado ADC, não pressão física.')
p('O coeficiente de variação, CV, foi calculado entre as médias das três repetições de carregamento de cada nível, com desvio padrão amostral. O CV de 28,59% no ajuste de 0,438 kg indica variabilidade relevante do sinal. Centenas de quadros de uma mesma coleta não representam centenas de aplicações independentes de carga.')
h('Cobertura e instrumentação')
p('Nos ensaios TOTAL aceitos, 77 pontos tiveram leitura não nula pelo menos uma vez; os outros 148 não foram ativados nessa carga central. Isso não comprova falha dos 148 pontos, pois não houve teste de toda a superfície. O maior ADC bruto das janelas foi 1589. A identificação da balança, a incerteza e a unidade de resolução não estão completas; essas lacunas limitam a rastreabilidade das referências. [S2]')

page('8 Resultado da calibração e análise das limitações')
p('O perfil candidato é de força total, com algoritmo por trechos, 15 ensaios de ajuste e cinco níveis de carga. Ele não define força ou pressão individual por sensor. A referência de força foi obtida da massa total pela relação F = m × 9,80665. O critério cadastrado para aprovação era erro absoluto máximo de 1 N. [S2]')
h('Validação registrada em 07 de outubro de 2026')
table(['Massa kg','Rep','Referência N','Estimativa N','Erro N'],[
('0,438','1','4,295','4,714','+0,419'),('0,438','2','4,295','4,584','+0,289'),('0,438','3','4,295','4,721','+0,425'),('2,478','1','24,301','25,604','+1,303'),('2,478','2','24,301','31,429','+7,128'),('2,478','3','24,301','32,600','+8,299'),('4,518','1','44,306','43,253','−1,053'),('4,518','2','44,306','Indisponível','Indisponível'),('4,518','3','44,306','Indisponível','Indisponível')],[3.0,1.3,3.8,4.5,4.0])
p('Resultado salvo: FAILED, ou reprovado. Sobre as sete estimativas disponíveis, o erro absoluto médio foi 2,702 N, a raiz do erro quadrático médio foi 4,191 N, o viés médio foi +2,401 N e o erro absoluto máximo foi 8,299 N. O maior erro relativo foi aproximadamente +34,15%, para a referência de 2,478 kg. [S2]')
p('As duas estimativas indisponíveis pertencem ao conjunto de nove validações e devem permanecer reportadas. A análise documental encontrou sinal acima do último nó da curva em todos os quadros dessas duas janelas; não foi identificada saturação ADC nessas janelas. Não se deve trocar indisponibilidade de domínio por erro zero ou descartá la sem explicação.')
h('Interpretação técnica')
p('O perfil estava no estado ADJUSTED, sem perfil ativo na extração. A reprovação demonstra que o ajuste realizado não satisfez o critério escolhido naquele protocolo. Não identifica, isoladamente, um defeito do Velostat, resistor, multiplexador ou ESP32. Contato, reposicionamento, acomodação, variação elétrica e protocolo são hipóteses a investigar, não causas comprovadas.')
p('A maior massa total aceita, 4,518 kg, é a maior referência encontrada no piloto; não é a capacidade máxima ou limite seguro da plataforma. Tampouco demonstra resposta para carga corporal. Pressão local, histerese, estabilidade entre dias, resposta em toda a superfície e aquisição dinâmica não foram validadas nesse bloco.')

page('9 Exames salvos e parecer sobre o desenvolvimento')
h('Cinco exames adicionais em ADC')
p('Além da calibração, foram encontrados cinco exames estáticos concluídos e marcados REAL, aqui identificados por E01 a E05, sem dados pessoais. Não é possível concluir que correspondam a cinco participantes ou a cinco repetições independentes. Seus valores processados foram preservados, mas a extração não encontrou séries brutas desses exames. [S2]')
table(['Exame','Duração s','Quadros','Pico ADC','Metade E','Metade D'],[
('E01','10','125','1.626,7','45,9%','54,1%'),('E02','10','113','1.842,6','45,0%','55,0%'),('E03','15','169','1.941,7','45,3%','54,7%'),('E04','10','122','1.300,5','44,9%','55,1%'),('E05','10','158','1.473,3','34,9%','65,1%')],[2.0,2.7,2.3,3.4,3.1,3.1])
p('Os percentuais são distribuição relativa do sinal ADC nas metades históricas. Sem referência de massa, ficha de condições e associação experimental, os resultados não validam pesagem, precisão por pé ou interpretação clínica. Os recursos novos de retenção não recuperam dados que não foram salvos nos exames antigos.')
h('Parecer técnico baseado nos registros')
p('O desenvolvimento conseguiu integrar a aquisição matricial, o tratamento de dados e a apresentação organizada de resultados em um aplicativo desktop. O histórico registra correções concretas de configuração da placa, aterramento, seleção de canais, orientação e escala visual. Também registra amadurecimento do software na preservação do histórico, no acesso e nos fluxos de exame.')
p('A limitação principal dos resultados experimentais é metrológica: o perfil de força total testado foi reprovado, houve dispersão entre carregamentos e faltam referências suficientes para estabelecer pressão por ponto. Uma visualização plantar reconhecível ou a aprovação dos testes de software não substitui esse resultado de validação.')
p('Assim, o material sustenta um relato de desenvolvimento de protótipo e estudo piloto de bancada. Ainda não sustenta equivalência com equipamento comercial, diagnóstico automático, precisão clínica, análise de marcha ou conversão local validada em kPa. A expressão antiga “100% calibrado” deve ser substituída pela descrição objetiva do ajuste visual e pelo resultado reprovado da curva candidata. [S1, S2, S4]')
h('Aperfeiçoamentos a testar em continuidade')
p('Como recomendações de engenharia, registrar a montagem final e o firmware, identificar o instrumento de referência, repetir zero e carregamentos com posicionamento controlado, testar toda a superfície e comparar carregamento e descarregamento. Qualquer revisão de material, circuito ou curva precisa de novo ensaio e validação independente antes de receber afirmações de exatidão. Essas ações são propostas de continuidade, não soluções já executadas.')

page('10 Textos de apoio para o artigo científico')
p('Os parágrafos abaixo sintetizam os registros do projeto. Podem apoiar a redação de materiais e métodos, resultados e discussão, após revisão dos autores e confirmação dos detalhes da montagem. As referências S são internas; não constituem revisão bibliográfica da área.')
h('Descrição do dispositivo e do software')
p('Foi desenvolvido o BAROPRESS, um protótipo acadêmico de aquisição e visualização matricial associado a uma superfície sensora de 15 linhas e 15 colunas, totalizando 225 posições. A arquitetura documentada emprega folha contínua de Velostat entre camadas ortogonais de condutores de cobre, microcontrolador ESP32 e dois multiplexadores CD74HC4067. A região sensora cadastrada corresponde a 300 × 300 mm, com passo de 20 mm e fitas de 10 mm. A aquisição transmite quadros de 225 contagens ADC, e o aplicativo desktop, implementado em Tauri, React, TypeScript e Rust, utiliza SQLite local para organizar exames e resultados. [S1–S3]')
h('Método do estudo piloto')
p('Foram analisados 35 registros de bancada identificados no sistema como de origem real, coletados em 07 de outubro de 2026. O procedimento cadastrado compreendeu carga mantida, acomodação programada de 5 s e coleta de 10 s. Do total, 28 registros foram aceitos, um permaneceu em revisão e seis foram rejeitados por erro de cadastro de carga ou unidade. O perfil candidato de força total foi ajustado com cinco níveis de massa total, entre 0,438 e 4,518 kg, com três repetições por nível, e avaliado em nove registros de validação. A frequência observada nas janelas dos ensaios foi aproximadamente 12,21 a 12,81 quadros por segundo. [S2]')
h('Resultados e dificuldades')
p('O histórico descreve dificuldades de envio do firmware, referência de aterramento, conexão do seletor do multiplexador, orientação espacial e contraste do mapa, com ajustes de configuração, ligação e processamento. No estudo piloto, o perfil de força total não atendeu ao critério cadastrado de erro absoluto máximo de 1 N. Entre sete estimativas disponíveis, o erro absoluto médio foi 2,70 N, a raiz do erro quadrático médio foi 4,19 N e o erro absoluto máximo foi 8,30 N. Duas validações não produziram estimativa devido ao sinal fora do domínio da curva. O coeficiente de variação entre as repetições do menor nível usado no ajuste foi 28,59%. [S1, S2]')
h('Discussão e conclusão sugeridas')
p('Os registros indicam integração funcional entre superfície sensora, aquisição e aplicativo, mas os resultados de bancada ainda não estabelecem calibração física aprovada. A dispersão e as estimativas fora do domínio mostram necessidade de controle do carregamento, rastreabilidade das referências e investigação da repetibilidade. A ausência de área efetiva por ponto e de validação local impede interpretar o mapa como pressão física calibrada. O BAROPRESS deve ser apresentado, nesta etapa, como protótipo acadêmico de desenvolvimento com resultados exploratórios, sem extrapolação para precisão clínica ou aquisição dinâmica. [S2, S4]')

page('11 Imagens disponíveis do sistema')
p('As imagens desta seção já existiam no projeto. São capturas de prévias ou documentos com dados sintéticos, usadas para demonstrar recursos de software. Não retratam participantes nem resultados do piloto físico. Não foram inseridas fotografias ou espaços vazios para imagens da montagem.')
h('Calibração e medidas da montagem')
figure('docs/corrections/calibracao-ajuda-0.2.11.jpg','Figura 1  Captura existente da ajuda para largura ativa e medidas da montagem na versão 0.2.11. Prévia isolada com dados sintéticos, registrada em 08/10/2026. Fonte [S7].',width=7.4)
h('Revisão temporal do centro relativo ADC')
figure('docs/barosys/ui-1366-light-graphs.png','Figura 2  Tela de trajetória X Y e séries X e Y em função do tempo. Prévia sintética de 09/10/2026. As coordenadas são células da matriz, sem validação de CoP físico. Fonte [S4].',width=16.5)

page('12 Visualização dos sensores e exemplo de relatório')
h('Vista em 3D e regiões manuais')
figure('docs/barosys/ui-1366-light-3d.png','Figura 3  Representação dos 225 pontos e seleção de regiões manuais em uma prévia sintética de 09/10/2026. As barras representam ADC e não a anatomia do pé. Fonte [S4].',width=16.2)
p('A tela diferencia mapa médio, máximos por sensor e quadro individual. Máximos por sensor podem vir de momentos diferentes e não representam necessariamente um único instante. As regiões são atribuídas pelo operador; a imagem não demonstra reconhecimento anatômico automático.')
h('Relatório local com mapa e indicadores')
p('A página seguinte reproduz uma imagem existente da primeira página de um relatório sintético. O aviso de simulação permanece visível. Valores e formas da imagem pertencem ao teste de software, sem relação com os valores do piloto de bancada.')
p('O exemplo mostra o formato de entrega dos resultados: identificação, mapa, escala relativa, indicadores e parâmetros da sessão. Ele ilustra a organização do documento emitido pelo aplicativo, sem acrescentar dados experimentais ao estudo. [S4]')

page('13 Exemplo existente de saída em relatório')
figure('docs/barosys/pdf-synthetic-1.png','Figura 4  Primeira página de relatório sintético emitido em 09/10/2026. Mapa e indicadores relativos ADC; imagem de validação do formato de saída, sem participante real. Fonte [S4].',height=21.2)

page('14 Fontes e informações para complementar depois')
h('Referências internas utilizadas')
sources=[
('S1','Sprint/01_Referencias/Contexto.txt','Referência inicial de arquitetura, pinagem, firmware transcrito, visualizador Python e relatos de dificuldades.'),
('S2','Sprint/Documentacao_TCC/DOCUMENTACAO_PROTOTIPO_E_TESTE_PILOTO.txt e Evidencias/RESUMO_ANALITICO.json','Documentação de 07/10/2026, medidas cadastradas, inventário de coletas, variabilidade, perfil e validação. Evidencias/MANIFESTO.json registra a extração e hashes.'),
('S3','README.md e package.json','Recursos e tecnologias do aplicativo. package.json identifica a versão 0.2.12; o README reúne descrições de entregas anteriores.'),
('S4','docs/barosys/METODO_E_LIMITES.md e VALIDACAO_E_DEMONSTRACAO.txt','Método da análise estática, retenção, unidades e limites, além da procedência dos PNGs de interface e PDF sintéticos.'),
('S5','docs/audit/PROBLEMAS_ENCONTRADOS.md e docs/corrections/CORRECOES_0.2.10.md','Problemas identificados por auditoria e correções de acesso, unidades, conexão, histórico e preservação dos dados.'),
('S6','docs/corrections/ROLLBACK_FAIXA_ESQUERDA.md','Tentativa desfeita e restauração de 08/10/2026.'),
('S7','docs/corrections/CALIBRACAO_SIMPLIFICADA_0.2.11.md','Organização da calibração, medidas padrão e procedência da captura de ajuda.'),
('S8','docs/corrections/USUARIOS_LOGIN_ACESSO.md e Sprint/05_Historico/2026-10-09_13_entrega_usuarios_acesso_0.2.12.txt','Estado da entrega mais recente, perfis de acesso, testes e limitações de homologação.'),
('S9','src/services/acquisition/parser.ts e tare.ts e src/services/baropodometry/metrics.ts','Conferência do protocolo, espelhamento, compensação de zero e indicadores ADC.')]
for label,path,detail in sources:
    pp=p(); rr=pp.add_run(label+'  '); rr.bold=True
    pp.add_run(path+'\n'+detail)
    for r in pp.runs: r.font.size=Pt(9.5)
h('Complementos que dependem da equipe')
p('Para completar a descrição reprodutível da construção, faltam: fotografias e dimensões externas do tapete; camadas e espessuras do EVA e do material sensível; método de fixação; lista final de peças e custos; valores dos resistores; circuito e firmware efetivamente usados; identificação da balança; e relato dos ajustes físicos posteriores ao piloto.')
p('Para descrever ensaios com pessoas, também são necessários protocolo, vínculo entre participantes e registros, condições da coleta e documentação pertinente ao estudo. Nenhuma informação ausente foi preenchida com suposição. Este documento pode receber esses complementos em uma próxima revisão.')

OUT.mkdir(parents=True,exist_ok=True)
for border in doc.styles.element.xpath('.//w:pBdr'):
    border.getparent().remove(border)
for border in doc.element.xpath('.//w:pBdr'):
    border.getparent().remove(border)
doc.save(DOC)
print(DOC)
print('paragraphs',len(doc.paragraphs),'tables',len(doc.tables),'figures',len(doc.inline_shapes))
