# BAROPRESS — Documentação Técnica da Camada Baropodométrica (Fase 4)

Este documento descreve a arquitetura, algoritmos matemáticos e diretrizes de renderização do módulo de **Análise Baropodométrica** do sistema **BAROPRESS**.

---

## 1. Visão Geral da Matriz e Dados

* **Geometria:** Matriz de 15 linhas × 15 colunas = **225 sensores / sensels**.
* **Origem dos Dados:** Dispositivo físico ESP32 (via USB Serial ou Bluetooth SPP) ou simulador de hardware (`MockSensorDevice`).
* **Tipo dos Dados:** Valores brutos do conversor analógico-digital (ADC de 12 bits: `0–4095`).
* **Frequência de Aquisição:** ~30 FPS (quadros por segundo).

> [!IMPORTANT]
> **Aviso de Conformidade sobre Calibração Física:**
> O sistema utiliza atualmente **valores ADC relativos**. Não representa pressão física em **kg**, **kgf**, **N** ou **kgf/cm²** sem calibração física validada com célula de carga e protocolo metrológico. A terminologia da interface emprega estritamente: *"Valor ADC"*, *"Leitura Relativa"*, *"Pressão Relativa"* e *"Sensels em Contato"*.

---

## 2. Pipeline de Processamento dos Dados

O fluxo dos dados segue uma arquitetura desacoplada:

```text
ESP32 / Mock
     ↓
SensorFrame (225 valores)
     ↓
Tara (Subtração do baseline sem carga: max(0, raw - baseline))
     ↓
Normalização de Orientação (normalizeMatrixOrientation — fliplr)
     ↓
Threshold de Contato (filtro de corte de ruído)
     ↓
├── Interpolação Bicúbica Catmull-Rom (superfície contínua 180×180)
│         ↓
│   Suavização Gaussiana Separável (remoção de descontinuidades)
│         ↓
│   Mapeamento de Cores por LUT (paleta contínua de 256 cores)
│         ↓
│   Renderização no Canvas 2D (superfície térmica orgânica)
│
└── Cálculo Analítico de Métricas e CoP
          ↓
    • Centro de Pressão (CoP x, y)
    • Pressão Máxima e Média Relativa
    • Área de Contato Relativa (%)
    • Distribuição de Carga Esquerda / Direita (%)
```

---

## 3. Calibração de Tara (Zero Baseline)

Antes do exame, o operador realiza o zeramento da plataforma:
* Captura a média aritmética de 20 quadros consecutivos sem carga sobre a esteira:
  $$\text{baseline}[i] = \frac{1}{N} \sum_{k=1}^{N} \text{raw}_k[i]$$
* Para cada quadro subsequente:
  $$\text{corrected}[i] = \max(0, \text{raw}[i] - \text{baseline}[i])$$
* O baseline pode ser ativado, desativado ou redefinido a qualquer momento na interface.

---

## 4. Orientação da Matriz

A montagem física dos multiplexadores CD74HC4067 na esteira produz uma inversão horizontal em relação ao ponto de vista anatômico plantar superior.
* A função isolada `normalizeMatrixOrientation()` aplica o espelhamento horizontal (`fliplr`):
  $$\text{col}_{\text{alvo}} = 14 - \text{col}_{\text{origem}}$$
* **Importante:** A mesma transformação geométrica é compartilhada de forma estrita pelo heatmap contínuo, pelo cálculo do CoP e pelo painel de métricas.

---

## 5. Parâmetros de Visualização e Ajustes em Tempo Real (Fase 4.1)

A tela de Análise Baropodométrica dispõe do painel flutuante de **Ajustes do Mapa**, permitindo calibração visual em tempo real sem interrupção do fluxo de aquisição:

| Parâmetro | Faixa | Padrão | Step | Descrição Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **Gamma Visual** | 0.50 a 3.00 | 1.30 | 0.05 | Expoente da curva de transferência visual: $\text{visual} = \text{norm}^\gamma$. Valores menores realçam baixas pressões periféricas; valores maiores concentram contraste nas áreas de pico. Não altera as métricas matemáticas. |
| **Escala Máxima (VMAX)** | 500 a 4095 ADC | 2200 | 50 | Leitura que atinge a saturação vermelha da escala térmica. Permite ajustar o ganho dinâmico para diferentes massas corpóreas sem distorcer o valor bruto. |
| **Threshold (Contato)** | 0 a 1000 ADC | 150 | 10 | Limiar mínimo para considerar ativação do sensor. Valores abaixo são considerados ausência de contato (transparentes). Influencia diretamente o cálculo do CoP e da área de contato. |
| **Suavização / Bordas** | 0.00 a 1.00 | 0.35 | 0.05 | Controla o peso do filtro de difusão espacial binomial. Em 0.00, produz bordas nítidas e precisas sem blur; em 1.00, transições aveludadas. Evita geração de halos artificiais. |
| **Atualização Visual** | 10 a 60 FPS | 30 FPS | 1 | Frequência com que o Canvas redesenha a superfície interpolada. **Não altera a taxa de amostragem serial do hardware ESP32**. |
| **Resolução** | 150, 300, 450 | 300×300 | — | Dimensão da grade interpolada internamente (Baixa: 150×150, Média: 300×300, Alta: 450×450). |

---

## 5.1. Modos de Operação: Automático vs. Manual

* **Modo Manual:** O operador ajusta livremente cada controle deslizante com efeito visual imediato. Qualquer intervenção manual sobre um slider desativa o modo automático e fixa a preferência. O botão **Restaurar Padrão** reinicia todos os campos para as configurações de fábrica recomendadas.
* **Modo Automático:** O sistema monitora a dinâmica de pressão do paciente e ajusta continuamente a escala e o limiar:
  * **Auto-VMAX com P95 e EMA:** Extrai o percentil 95 ($P_{95}$) e percentil 98 ($P_{98}$) dos sensels ativos com folga de $15\%$. Aplica filtro exponencial temporal (Exponential Moving Average — EMA com $\alpha = 0.20$):
    $$V_{max}^{(t)} = 0.80 \cdot V_{max}^{(t-1)} + 0.20 \cdot V_{max}^{\text{alvo}}$$
    Isso assegura imunidade contra variações bruscas causadas por ruídos pontuais, eliminando flickering na tela.
  * **Auto-Threshold:** Calcula a linha de corte com base no ruído de fundo e na carga ativa, delimitado com segurança entre 100 e 220 ADC.
  * **Gamma e Suavização Automáticos:** Fixados em $1.30$ e $0.35$ para garantir consistência diagnóstica.

---

## 5.2. Desacoplamento entre Aquisição e Renderização

* **Frequência de Aquisição (Hardware ESP32):** Determinada pela leitura dos multiplexadores e transmissão serial via UART/Bluetooth SPP a 115200 baud (~30 FPS fixos). O buffer circular absorve o fluxo contínuo.
* **Frequência de Renderização Visual (Canvas):** Controlada pelo parâmetro de atualização visual (10–60 FPS) via `requestAnimationFrame`. Se configurada para 15 FPS, o Canvas renderiza a cada 66 ms utilizando o quadro mais recente recebido, economizando ciclos de CPU em computadores mais modestos.

---

## 5.3. Arquitetura de Layout One-Screen / Sem Rolagem (Fase 4.2)

A tela de Análise Baropodométrica foi estruturada para operar como um **dashboard clínico de viewport única** em resolução padrão desktop ($1366 \times 768$, $1440 \times 900$, $1920 \times 1080$):

1. **Zero Rolagem Vertical no Desktop ($\ge 1200\text{px}$):**
   * O container principal é restrito a `h-full flex flex-col min-h-0 overflow-hidden`.
   * A janela da aplicação utiliza 100% da viewport sem provocar `scrollHeight > clientHeight`.
2. **Barra de Parâmetros Compacta em Linha Única:**
   * Substitui os cards altos anteriores por uma barra horizontal esguia (`~50px`), posicionando Threshold, Vmax, Gamma, Suavização, FPS, CoP e Reset lado a lado.
   * Textos explicativos longos foram transferidos para tooltips interativos acessíveis via `?`.
3. **Dimensionamento Inteligente do Mapa (Aspect Ratio 1:1 Restrito por Altura):**
   * O container do Canvas emprega `aspect-square h-full max-h-full max-w-full flex items-center justify-center`.
   * O mapa cresce até o limite exato do espaço vertical restante da viewport, sem jamais empurrar a legenda ou gerar scrollbar.
4. **Painel de Métricas em Grade 2×2 Compacta:**
   * Máxima, Média, CoP e Área organizadas em matriz bilateral (`~75px` cada card).
   * Barra de equilíbrio bilateral posicionada imediatamente abaixo (`~80px`).
   * Nota de calibração condensada em linha única informativa com botão popover.
5. **Responsividade Adaptativa:**
   * Em telas menores ($< 1200\text{px}$ ou dispositivos móveis), o layout converte suavemente para rolagem vertical natural (`overflow-y-auto`), assegurando legibilidade em qualquer dispositivo.


## 6. Interpolação e Renderização da Superfície Contínua

Para atender ao requisito visual obrigatório de **não parecer uma grade de 225 quadrados**, a renderização emprega:
1. **Interpolação Bicúbica Catmull-Rom 2D:**
   Amostra uma grade de alta resolução ($180 \times 180$) a partir dos 225 nós discretos da matriz, garantindo continuidade $C^1$, preservação de picos de pressão e ausência de blocos.
2. **Suavização Gaussiana Separável:**
   Filtro binomial suave 2D para eliminar oscilações de alta frequência.
3. **Tabela de Consulta de Cores (LUT de 256 cores):**
   Mapeia intensidades para uma rampa contínua suave:
   $$\text{Azul Profundo} \to \text{Ciano} \to \text{Verde} \to \text{Amarelo} \to \text{Laranja} \to \text{Vermelho Intenso}$$
4. **Resolução de Tela:**
   A imagem resultante é desenhada no Canvas com interpolação bicúbica/bilinear ativada pelo hardware de renderização da GPU.
5. **Fundo Neutro:**
   Regiões sem contato permanecem translúcidas sobre o fundo escuro da plataforma.

---

## 7. Centro de Pressão (CoP)

O CoP representa o baricentro das forças aplicadas sobre a plataforma:
$$\text{COP}_x = \frac{\sum_{i} x_i \cdot P_i}{\sum_{i} P_i}$$
$$\text{COP}_y = \frac{\sum_{i} y_i \cdot P_i}{\sum_{i} P_i}$$
onde:
* $x_i = i \pmod{15}$ (coluna, 0 a 14);
* $y_i = \lfloor i / 15 \rfloor$ (linha, 0 a 14);
* $P_i$ é o valor do sensor $i$ caso $P_i \ge \text{threshold}$ (sensores sem contato não entram na ponderação).
* Se $\sum P_i \le 0$, o CoP retorna `null` (sem carga).

---

## 8. Métricas Baropodométricas

1. **Pressão Máxima Relativa:** Maior leitura ADC observada entre os sensores em contato.
2. **Pressão Média Relativa:** $\frac{\sum P_{\text{contato}}}{\text{sensels em contato}}$. Retorna `null` quando não há carga.
3. **Área de Contato Relativa:** $\frac{\text{sensels em contato}}{225} \times 100\%$.
4. **Distribuição Bilateral de Carga:**
   * **Esquerda:** Colunas $0 \dots 6$ ($\text{Carga}_{\text{esq}} = \sum_{c \le 6} P_i$).
   * **Direita:** Colunas $8 \dots 14$ ($\text{Carga}_{\text{dir}} = \sum_{c \ge 8} P_i$).
   * Coluna 7 corresponde à linha média sagital.
   $$\%_{\text{esq}} = \frac{\text{Carga}_{\text{esq}}}{\text{Carga}_{\text{esq}} + \text{Carga}_{\text{dir}}} \times 100\%$$
   $$\%_{\text{dir}} = \frac{\text{Carga}_{\text{dir}}}{\text{Carga}_{\text{esq}} + \text{Carga}_{\text{dir}}} \times 100\%$$
