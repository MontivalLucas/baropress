# Pinagem identificada no firmware histórico

Fonte de verdade: [tapete.ino](../firmware/esp32/tapete.ino). Os nomes `MUX 1` e `MUX 2` seguem o contexto original do projeto.

| Conjunto | Ligação | GPIO ESP32 |
| --- | --- | --- |
| MUX 2 — leitura de colunas | S0 | 18 |
| MUX 2 — leitura de colunas | S1 | 19 |
| MUX 2 — leitura de colunas | S2 | 21 |
| MUX 2 — leitura de colunas | S3 | 22 |
| MUX 2 — saída analógica | SIG → ADC | 34 |
| MUX 1 — seleção de linhas | S0 | 25 |
| MUX 1 — seleção de linhas | S1 | 26 |
| MUX 1 — seleção de linhas | S2 | 27 |
| MUX 1 — seleção de linhas | S3 | 14 |
| MUX 1 — excitação | SIG / OUT | 12 |

`setMuxChannel(channel, p0, p1, p2, p3)` configura S0..S3 pelos bits 0..3 do índice. Somente os canais **0 a 14** são selecionados em ambos os MUX; o canal 15 não é usado.

O código configura GPIO 12 como OUTPUT HIGH e GPIO 34 como INPUT. **Antes de ligar o hardware**, conferir o circuito real, alimentação e compatibilidade de tensão; GPIO 12 também é pino de strapping em variantes ESP32, podendo afetar a inicialização dependendo do circuito conectado. Esta tabela é um mapa do código, não substitui um esquemático verificado.
