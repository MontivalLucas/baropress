# Formação do mapa de calor

O projeto passou da renderização direta com Matplotlib para uma camada específica de análise no BAROPRESS. Os passos conceituais são:

```text
CSV/serial ou simulação → validar quadro 225 → matriz 15x15
    → orientar conforme montagem → subtrair referência (tara)
    → suprimir leituras abaixo do limiar
    ├→ métricas calculadas a partir dos dados corrigidos
    └→ intensidade de exibição (gama/VMAX)
         → interpolação/suavização → paleta térmica → tela/PDF
```

No **Python inicial**, o `imshow` aplica interpolação `gaussian`; no **Python interativo**, `bicubic`. Essas funções suavizam o aspecto visual, mas continuam baseadas em 225 leituras de entrada.

No **BAROPRESS**, a documentação da fase 4 descreve interpolação contínua tipo Catmull-Rom, suavização, tabela de cores (LUT) e controles visuais de VMAX, gama e limiar. O projeto separa o cálculo das métricas da renderização para não confundir cores realçadas com valores físicos. Versões mais novas registram parâmetros junto do exame para permitir interpretação ao reabrir.

**Nunca interpretar uma área vermelha como pressão absoluta calibrada** apenas pela cor. Dois mapas com VMAX diferente podem parecer distintos mesmo com leituras semelhantes. Comparações longitudinais exigem escala consistente, orientação conferida, mesmas condições de aquisição e registro da origem (ESP32 real/simulador).

O tratamento atual e as equações do app estão em [BAROPODOMETRY.md](../BAROPODOMETRY.md); as equações exatas dos primeiros programas estão em [PROCESSAMENTO_PYTHON.md](PROCESSAMENTO_PYTHON.md).
