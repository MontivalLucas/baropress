# Algoritmos de visualização Python — comparação

Os dois programas históricos encontram-se em [prototipos/python-heatmap](../../prototipos/python-heatmap/README.md). A ordem de evolução é inferida pela funcionalidade.

| Passo | Versão inicial (`heatmap_backup.py`) | Versão interativa (`heatmap.py`) |
| --- | --- | --- |
| Receber | linhas CSV da serial, exatamente 225 campos | linhas CSV, priorizando o quadro mais recente |
| Matriz | `reshape((15,15))` e `fliplr` | idem |
| Referência de repouso | máximo observado por célula nos primeiros 30 quadros | média observada por célula nos primeiros 30 quadros |
| Tara | calculada no início | calculada no início e reiniciada por botão |
| Limite de ruído | corte fixo 180 ADC | limiar editável, inicial 150 ADC |
| Cor | Matplotlib `turbo` com escala fixa | VMAX e correção gama controlados por sliders |
| Métricas | pico apresentado em texto | pico, sensels ativos, FPS visual, carga bilateral relativa |
| Porta original | COM4 | COM5 |

## Equações observadas

Seja `R_t(i,j)` a leitura da célula `(i,j)` no quadro `t`.

**Inicial**: `B(i,j) = max(R_1(i,j), ..., R_30(i,j))`. Após aquisição, `D_t = R_t - B`, valores `D_t < 180` tornam-se zero e aplica-se `clip(D_t, 0, 4095)`.

**Interativa**: `B(i,j) = média(R_1(i,j), ..., R_30(i,j))`. Calcula `D_t = max(0, R_t-B)`, zera valores menores que o limiar escolhido `L`; a intensidade exibida é `VMAX × (clip(D_t/VMAX,0,1))^gama`. A cor é um tratamento de exibição e não calibração física.

O programa interativo calcula `S_esq` somando colunas `0..6` e `S_dir` somando `8..14`; omite a coluna central (`7`). Se `S_esq + S_dir > 50`, apresenta `100 × S_esq/(S_esq + S_dir)` e `100 × S_dir/(S_esq + S_dir)`; caso contrário apresenta zero em ambos. São proporções das leituras tratadas, e não medidas de força em newtons.

## Cuidados ao reproduzir

- O programa inicial começa a tara com a plataforma livre; qualquer peso durante os 30 primeiros quadros contamina o baseline.
- A implementação interativa pode reaproveitar o último quadro válido quando não há quadro novo durante a animação; isso não deve ser confundido com nova amostra do ESP32.
- A função de FPS conta atualizações do loop do visualizador, portanto **não** comprova FPS de aquisição.
- As correções do heatmap e a orientação devem ser comparadas visualmente com posições físicas conhecidas.
- São versões preservadas para fins históricos; mantenha alterações experimentais futuras em arquivo/branch separado.
