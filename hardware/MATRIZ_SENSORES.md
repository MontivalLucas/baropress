# Matriz de pressão relativa 15 × 15

O sistema lê **225 cruzamentos de eletrodos** por varredura de linhas e colunas. A indexação serial do firmware é:

```text
linha 0:    [  0,   1, ...  14 ]
linha 1:    [ 15,  16, ...  29 ]
...
linha 14:   [210, 211, ... 224 ]
```

Índice linear: `15 * linha + coluna`. No Python, cada quadro é convertido em `reshape(15, 15)` e então espelhado horizontalmente (`fliplr`) para exibição conforme a montagem de referência. O BAROPRESS possui normalização de orientação própria documentada em [BAROPODOMETRY](../docs/BAROPODOMETRY.md).

O material Velostat altera sua resistência sob compressão; a resposta observada depende da geometria, do circuito de leitura, da distribuição do apoio e da calibração. **ADC 0–4095 não equivale diretamente a kPa, N ou kg**. A densidade 15×15 limita resolução espacial e uma interpolação mais suave não aumenta o número de medições independentes.

Para caracterização física, confirmar se todos os cruzamentos são funcionais, orientação anatômica, contato fantasma (*ghosting*), repetibilidade, histerese, estabilidade térmica, distribuição de força conhecida e variação ao longo do tempo.
