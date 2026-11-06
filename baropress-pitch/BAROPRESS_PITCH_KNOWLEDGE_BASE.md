# BAROPRESS — Base de Conhecimento do Projeto e Pitch Deck

**Revisão narrativa de 05/11/2026, atualizada em 06/11/2026:** a apresentação atual tem 12 cenas. A abertura original BAROPRESS foi restaurada a pedido do usuário; as cenas 2–3 contextualizam a avaliação e preservam a autonomia do fisioterapeuta. A comparação de preços permanece na cena 10. A cena 12 mostra o artigo do projeto como estudo preliminar de bancada, sem afirmar validade clínica ou publicação editorial verificada. As cenas 4–11 mantêm o conteúdo e as composições. O roteiro abaixo documenta a base anterior; para a narrativa vigente, consultar `src/content.ts` e [o registro desta revisão](plans/REVISAO_NARRATIVA_2026-11-05.md).

> **Documento Oficial de Referência para Inteligências Artificiais e Desenvolvedores**  
> **Projeto:** BAROPRESS — Sistema Integrado de Baropodometria Experimental de Entrada  
> **Autores / Desenvolvedores:** Montival Lucas & Raphaela Teles  
> **Contexto:** Trabalho de Conclusão de Curso (TCC) / Engenharia & Tecnologia Assistiva  
> **Última Atualização:** Outubro / Novembro de 2026  

---

## 1. Visão Geral Executiva

O **BAROPRESS** é uma solução de tecnologia assistiva e instrumentalização baropodométrica projetada para democratizar o acesso à análise da distribuição de pressão plantar. O projeto une um **hardware experimental próprio** (tapete sensor matricial de baixo custo) a um **software desktop profissional** (Tauri + Rust + SQLite + React) para aquisição, visualização em tempo real, persistência em prontuário local, análise comparativa longitudinal e emissão de laudos em PDF.

### O Propósito Central
Tornar a tecnologia baropodométrica acessível a profissionais autônomos, fisioterapeutas recém-formados, pequenas clínicas e atendimento domiciliar (*homecare*), superando a barreira financeira imposta pelos equipamentos de ponta tradicionais sem fazer promessas falsas de equivalência clínica absoluta.

---

## 2. Diagnóstico do Problema & Mercado

### 2.1 A Barreira de Acesso Financeiro
- **Equipamentos Clínicos de Referência:** Dispositivos comerciais consolidados (como a plataforma *BaroScan*) possuem preços anunciados de **R$ 24.961,25** (tabela pública de distribuidor nacional, outubro/2024).
- **Impacto no Profissional:** Esse investimento elevado concentra a barreira de entrada em grandes hospitais, centros de reabilitação consolidados e laboratórios de marcha com alto orçamento.
- **O Profissional Desassistido:** Fisioterapeutas em início de carreira, clínicas de pequeno porte e profissionais que realizam atendimento domiciliar ficam sem recursos instrumentais objetivos para avaliar a evolução de pisada, distribuição de carga e apoio estático de seus pacientes.

### 2.2 O Cenário Homecare e Pequenos Consultórios
O cuidado com a saúde não ocorre apenas em salas de grandes hospitais. A portabilidade e a facilidade de montagem são vitais para que o profissional possa transportar o equipamento em uma bolsa e utilizá-lo na casa do paciente, conectando-o via USB a qualquer computador portátil.

---

## 3. Os Três Pilares Fundacionais

1. **Acessibilidade:** Redução drástica do custo de aquisição e complexidade operacional, viabilizando a adoção por clínicas emergentes e profissionais autônomos.
2. **Mobilidade:** Tapete leve, flexível e portátil, acionado via cabo USB único, ideal tanto para consultórios compactos quanto para atendimento domiciliar.
3. **Acompanhamento (Evolução Longitudinal):** Não basta observar um resultado estático isolado; o software é desenhado em torno do histórico do paciente, permitindo comparar exames cronológicos para checar a eficácia de palmilhas, intervenções posturais ou reabilitação.

---

## 4. Arquitetura de Hardware

O hardware do BAROPRESS foi concebido segundo uma filosofia de manufatura acessível em camadas e modularidade:

### 4.1 Estrutura em Camadas
- **Etapa A — Malha Ortogonal de Cobre (15×15):**  
  Duas camadas com 15 fitas condutoras de cobre por eixo, montadas perpendicularmente sobre lâminas isolantes flexíveis (dimensão ativa de 300 × 300 mm), gerando **225 cruzamentos sensíveis (sensels)**.
- **Etapa B — Camada Piezorresistiva (Velostat):**  
  Filme de polímero semicondutor com partículas de carbono (Velostat / Linqstat) posicionado entre as duas malhas condutoras. Conforme a pressão mecânica local aumenta, a resistência elétrica entre as trilhas condutoras diminui de forma previsível e contínua.
- **Etapa C — Multiplexação Matricial Dupla:**  
  Dois circuitos integrados multiplexadores analógicos **CD74HC4067** (16 canais cada):
  - 1º MUX para seleção das 15 colunas transmissoras (linhas de excitação).
  - 2º MUX para seleção das 15 linhas receptoras (leitura de retorno).
- **Etapa D — Aquisição e Processamento (ESP32):**  
  Microcontrolador ESP32 executando varredura matricial sequencial:
  - Leitura analógica via conversor ADC integrado de 12 bits (faixa dinâmica de 0 a 4095).
  - Emissão contínua de pacotes seriais CSV a 115200 baud via conexão USB direta.
- **Etapa E — Conceito de Produto (Tapete Protótipo):**  
  Encapsulamento emborrachado flexível e impermeável com guia visual central de orientação dos pés, conector USB reforçado e proteção contra tração mecânica.

### 4.2 Viabilidade de Materiais
- **Custo Direto de Materiais de Bancada:** Aproximadamente **R$ 500,00** (inclui ESP32, 2× CD74HC4067, fita condutora de cobre, filme Velostat, fiação, protoboards e base isolante).
- *Ressalva Formal:* Este valor reflete exclusivamente os insumos brutos do protótipo artesanal e **não** constitui o custo fabril final (que demandaria processos seriados, moldes, certificações de compatibilidade eletromagnética, tributos e logística).

---

## 5. Arquitetura de Software

O ecossistema de software foi desenvolvido como aplicação nativa com arquitetura de alta performance e segurança:

### 5.1 Stack Tecnológico
- **Core / Backend:** Tauri + Rust (garante baixo consumo de memória, comunicação direta e rápida com a porta serial USB e manipulação local offline do banco de dados).
- **Banco de Dados:** SQLite nativo incorporado, com criptografia e armazenamento 100% local (respeito irrestrito à LGPD e prontuário médico confidencial).
- **Frontend / Interface:** React, Tailwind CSS, animações Framer Motion, renderização em Canvas/WebGL com interpolação contínua.

### 5.2 Módulos da Aplicação
1. **Módulo de Aquisição & Calibração em Tempo Real:**
   - Botão de zeramento de tara rápida (compensação de peso residual do tapete).
   - Ajustes ao vivo de sensibilidade: *Threshold* (corte de ruído basal), *VMAX* (saturação da escala), *Gamma* (resposta não linear) e *Suavização temporal*.
   - Taxa de amostragem estável com monitoramento de quadros por segundo (FPS).
2. **Visualização por Mapa de Calor Interpolado:**
   - Algoritmo de interpolação bicúbica contínua transformando os 225 pontos discretos em uma mancha térmica contínua de gradiente podal anatômico (azul → ciano → verde → amarelo → vermelho).
3. **Métricas Quantitativas Relativas:**
   - **Leitura Máxima:** Pico relativo de intensidade (unidades ADC).
   - **Leitura Média:** Média dos sensels efetivamente em contato com carga.
   - **Área de Contato:** Porcentagem dos 225 sensels ativados acima do limiar.
   - **Centro de Pressão (CoP):** Coordenadas relativas $X, Y$ em tempo real com indicador visual dinâmico.
   - **Distribuição de Carga:** Barra percentual comparativa (Ex.: Pé Esquerdo 44,6% vs Pé Direito 55,4%).
4. **Histórico & Prontuário Local:**
   - Registro de pacientes e histórico de avaliações persistido em SQLite.
   - Distinção clara e automática no banco de dados entre coletas com **HARDWARE REAL** e **DEMONSTRAÇÃO SIMULADA**.
5. **Módulo de Comparação Longitudinal:**
   - Visualização lado a lado de até 4 exames cronológicos do mesmo paciente (Ex.: Exames #2, #3, #4 e #9).
   - Tabela comparativa automática de evolução: pico ADC, área de contato, média e simetria de carga esquerda/direita ao longo das semanas de tratamento.
6. **Emissão de Relatório Oficial (A4 Nativo):**
   - Laudo técnico estruturado pronto para impressão ou exportação em PDF.
   - Contém: Identificação anonimizada, selo de verificação de sinal (*Hardware Real via ESP32*), visualização do mapa térmico e tabela de indicadores biomecânicos.

---

## 6. Proposta Comercial & Posicionamento Estratégico

### 6.1 Análise Comparativa de Preço
| Categoria | Solução | Valor | Caracterização & Contexto |
| :--- | :--- | :--- | :--- |
| **Referência de Mercado** | BaroScan | **R$ 24.961,25** | Preço anunciado de tabela em out/2024. Equipamento clínico consolidado, certificado e de alta densidade de sensores. |
| **Hipótese Comercial** | BAROPRESS | **R$ 2.990,00** | Hipótese de preço-alvo em estudo de viabilidade comercial preliminar (sob validação, não comercializado ainda). |
| **Insumos do Protótipo** | BAROPRESS Bancada | **≈ R$ 500,00** | Estimativa preliminar de componentes eletrônicos do protótipo experimental (não inclui fabricação seriada ou tributos). |

### 6.2 O Argumento Comercial Oficial
> *"O BAROPRESS pretende atender profissionais que buscam uma solução de entrada para visualização e acompanhamento, com uma proposta de investimento mais acessível após validação."*

### 6.3 Diretrizes Éticas e Técnicas (Regras Inegociáveis)
- **Não afirmar equivalência clínica:** Os dados fornecidos pelo protótipo experimental são sinais analógicos relativos (escala ADC de 12 bits), e não medições de pressão clínica absoluta calibrada em $\text{kg/cm}^2$.
- **Não prometer o que não foi medido:** Não inventar retornos de investimento (ROI), taxas de conversão de clientes ou faturamentos futuros fictícios.
- **Transparência metrológica:** O valor de R$ 500,00 refere-se estritamente aos materiais de bancada; não deve ser confundido com custo fabril final de produção seriada.
- **Tom da comunicação:** Transmitir **oportunidade**, inovação e viabilidade, sem transmitir nem inferioridade amadora nem falsas promessas de um produto comercial já finalizado.

---

## 7. Roteiro Completo do Pitch Deck (11 Cenas)

A apresentação visual do BAROPRESS é construída com design editorial de alto nível, tipografia suíça refinada, transições contínuas de morfismo SVG (*squircle morphing*) e modos integrados de tela cheia e notas do apresentador:

1. **Slide 1 — Abertura (Branco Editorial):**
   - *Título:* BAROPRESS
   - *Subtítulo:* A tecnologia deve acompanhar o profissional.
   - *Conceito:* A cápsula azul cresce a partir do centro, revelando a marca e a matriz de 225 sensels.

2. **Slide 2 — O Cenário & Público (Ice White):**
   - *Título:* O cuidado não acontece em apenas um lugar.
   - *Subtítulo:* De pequenas clínicas a visitas domiciliares, os fisioterapeutas precisam de ferramentas compatíveis com a sua rotina.
   - *Visual:* Fotografia autêntica de fisioterapeuta em atendimento domiciliar com moldura orgânica gradiente.

3. **Slide 3 — A Barreira Financeira (Midnight Navy):**
   - *Título:* Quando a tecnologia custa caro, o acesso fica limitado.
   - *Subtítulo:* O alto custo de aquisição inviabiliza a adoção de novas tecnologias para a maioria das clínicas, limitando o diagnóstico avançado.
   - *Visual:* Painel escuro com destaque ao valor de referência comercial BaroScan (R$ 24.961,25). Chamada de transição: *"E para o profissional que está começando?"*.

4. **Slide 4 — A Oportunidade (Electric Blue):**
   - *Título:* E se essa tecnologia pudesse chegar a mais profissionais?
   - *Subtítulo:* Superando a barreira do alto custo para democratizar o acesso e criar oportunidades.
   - *Visual:* Três pílulas de diretrizes (Acessibilidade, Mobilidade, Acompanhamento) e render 3D em perspectiva isométrica do tapete eletrônico isolado.

5. **Slide 5 — Desenvolvimento do Hardware (Branco Editorial):**
   - *Título:* BAROPRESS: Um tapete. Um software. Uma proposta acessível.
   - *Subtítulo:* Hardware experimental próprio, integrado a um sistema de visualização e acompanhamento.
   - *Visual:* Carrossel dinâmico das 5 etapas construtivas com fotos reais de bancada alternando a cada 2,5 segundos:
     - Etapa A: Malha de cobre 15×15
     - Etapa B: Camada Velostat
     - Etapa C: Multiplexação Dupla e Aquisição ESP32
     - Etapa D: Tapete protótipo
     - Etapa E: Conceito de Produto

6. **Slide 6 — Como Funciona (Midnight Navy):**
   - *Título:* Como funciona
   - *Subtítulo:* 225 posições de leitura integradas a um sistema de aquisição e análise relativa.
   - *Visual:* Diagrama de fluxo de sinal horizontal em 3 blocos conectados por setas de pulso:
     - Bloco 1 (CAPTURA): Matriz experimental 15×15 com revelação progressiva em onda dos 225 sensels.
     - Bloco 2 (PROCESSAMENTO): Chip vetorial do ESP32 com barramento de clock e conversão ADC.
     - Bloco 3 (VISUALIZAÇÃO): Mini-janela de aplicação com mapa térmico plantar contínuo e escala térmica.

7. **Slide 7 — Software Real (Branco Editorial):**
   - *Título:* Do exame ao histórico. Tudo em um único sistema.
   - *Subtítulo:* Aquisição, visualização, registros e relatórios integrados ao fluxo do profissional.
   - *Visual:* Janela desktop oficial centralizada com alternância automática a cada 3 segundos entre as abas: **Mapa** (exame ao vivo), **Indicadores** (sliders de calibração) e **Histórico** (prontuário local em SQLite).

8. **Slide 8 — Acompanhamento e Evolução (Ice White):**
   - *Título:* Não basta observar um resultado. É importante acompanhar a evolução.
   - *Subtítulo:* Registre, consulte e compare informações coletadas em diferentes momentos.
   - *Visual:* Janela oficial do módulo de comparação longitudinal exibindo 4 exames reais lado a lado (#2, #3, #4 e #9) com tabela cronológica de evolução.

9. **Slide 9 — Relatório A4 Oficial (Electric Blue):**
   - *Título:* Informação que vai além da tela.
   - *Subtítulo:* Organize os resultados em relatórios exportáveis e consulte os registros quando necessário.
   - *Visual:* Fluxo direto de três pílulas (`MAPA › Relatório › Exportação PDF`) e prévia oficial ampliada em alta resolução do laudo estruturado A4 pronto para emissão médica/fisioterapêutica.

10. **Slide 10 — Reformulação Comercial (Branco Editorial):**
    - *Título:* Uma proposta de entrada para um mercado especializado.
    - *Subtítulo:* Nosso objetivo é estudar uma alternativa de menor investimento, sem prometer equivalência às plataformas clínicas avançadas.
    - *Visual:* Dois grandes painéis simétricos lado a lado:
      - Painel de Referência (Ice White / Midnight Navy): BaroScan (R$ 24.961,25), contexto clínico e alto investimento.
      - Painel BAROPRESS (Electric Blue / Branco): Preço-alvo preliminar R$ 2.990 sob validação, materiais de bancada ≈ R$ 500 com ressalva fabril e argumentos de democratização.

11. **Slide 11 — Encerramento (Midnight Navy):**
    - *Título:* BAROPRESS
    - *Subtítulo:* Mais acesso à tecnologia. Mais possibilidades para o cuidado.
    - *Assinatura:* Montival Lucas & Raphaela Teles.

---

## 8. Guia Rápido de Prompting para Outras AIs

Ao solicitar código, textos ou melhorias para o BAROPRESS em modelos como ChatGPT, Claude ou DeepSeek, utilize este guia de contexto rápido:

```markdown
Você está atuando como especialista sênior em engenharia biomédica e sistemas embarcados no projeto BAROPRESS.
O BAROPRESS é um sistema de baropodometria experimental de entrada composto por:
- Hardware: Matriz piezorresistiva 15x15 (225 sensels) com cobre, Velostat e multiplexação dupla CD74HC4067 controlada por ESP32 (leitura analógica de 12 bits, saída serial CSV 115200 baud). Custo de materiais: ≈ R$ 500.
- Software: Desktop nativo em Tauri (Rust + React + Tailwind + SQLite) para visualização contínua por mapa térmico, prontuário local, comparação de exames e laudo A4 em PDF.
- Posicionamento Comercial: Proposta de entrada acessível com preço-alvo hipotético de R$ 2.990 voltada para fisioterapeutas autônomos, pequenas clínicas e homecare, contra referências de R$ 24.961,25 (BaroScan).
- Regra Ética: Nunca prometer equivalência metrológica ou diagnóstica a plataformas clínicas avançadas em kg/cm²; os dados são em escala ADC relativa.
```
