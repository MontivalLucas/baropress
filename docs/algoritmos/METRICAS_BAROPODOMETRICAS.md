# Métricas relativas e interpretação

Este guia distingue **o que o algoritmo calcula** do que seria uma medida clínica validada.

| Indicador | Interpretação matemática | Limite |
| --- | --- | --- |
| Pico da matriz | Maior leitura corrigida acima do limiar | Magnitude ADC relativa |
| Média | Média das leituras selecionadas pelo algoritmo | Depende do limiar e dos sensels considerados |
| Sensels em contato | Contagem de posições acima do limiar | Não é área em cm² sem geometria verificada |
| Balanço bilateral | Proporção da soma das leituras entre regiões definidas | Depende de orientação, posicionamento e recorte das regiões |
| Centro relativo ponderado (rotulado CoP em algumas interfaces) | Coordenadas da média ponderada das posições pelos sinais ADC | Não equivale a CoP físico calibrado ou centro de gravidade |
| Trajetória temporal | Sequência de centros relativos computados por quadro | Exige continuidade temporal e origem de dados preservadas |

Para uma matriz de pesos relativos não negativos `w[i,j]`, o centro relativo pode ser representado por:

```text
S = soma_i,j w[i,j]
x_rel = soma_i,j (j * w[i,j]) / S
y_rel = soma_i,j (i * w[i,j]) / S
```

Esse cálculo só é definido quando `S > 0`; caso contrário, o centro deve ser ausente/indeterminado. O formato exato das coordenadas e a orientação são definidos pela implementação de cada versão, descrita em [BAROPODOMETRY](../BAROPODOMETRY.md).

Na fase Python interativa, a divisão bilateral é uma **separação fixa de colunas**. O BAROPRESS passou a suportar modalidades de exame e regiões de análise com armazenamento de condições e parâmetros. Cada indicador deve ser consultado com esses metadados; comparar valores de algoritmos ou calibrações diferentes sem normalização pode gerar conclusões falsas.

**Conclusão técnica:** as métricas disponíveis permitem monitoramento exploratório da distribuição relativa das leituras. Converter ADC para pressão local, força total ou alegar aptidão diagnóstica requer protocolo e avaliação metrológica/clinicamente apropriados.
