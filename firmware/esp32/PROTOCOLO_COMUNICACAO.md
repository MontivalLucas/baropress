# Protocolo observado — ESP32 → computador

**Fonte:** `firmware/esp32/tapete.ino`, preservado em 26/10/2026. Este documento descreve o comportamento implementado no firmware histórico, não uma especificação de negociação futura.

| Propriedade | Valor |
| --- | --- |
| Transporte | USB serial (`Serial`) e Bluetooth Classic SPP (`SerialBT`) |
| USB baud rate | 115200 |
| Nome anunciado no Bluetooth | `Esteira_Pressao_ESP32` |
| Uma amostra | inteiro lido por `analogRead(GPIO34)` |
| Um quadro | 225 números decimais separados por `,`, terminados com `println()` |
| Ordem | primeiro todas as colunas da linha 0; depois linha 1; ...; linha 14 |
| Índice linear | `i = 15 × linha + coluna`, índices de 0 a 14 |
| Temporização | `delayMicroseconds(60)` + leitura descartada + `delayMicroseconds(10)` + leitura válida por célula; `delay(10)` ao fim |
| Cabeçalho | Não há cabeçalho por quadro; pode existir texto de inicialização no USB |

O software receptor deve separar por quebra de linha, exigir **exatamente 225 campos inteiros**, ignorar a mensagem de inicialização e quadros inválidos, tratar interrupção serial e usar a **orientação estabelecida na camada de apresentação**. A simples ordenação em linhas não resolve qual lado corresponde ao pé esquerdo anatômico; o Python histórico usa `fliplr`.

```text
v[0],v[1],...,v[14],v[15],...,v[224]\n
linha 0 (colunas 0..14) | linha 1 | ... | linha 14
```

Os valores são de ADC relativo; o código não transmite unidade de pressão, timestamp, contador de sequência, checksum, versão de protocolo ou identificador de dispositivo. Por isso, o receptor não pode identificar lacunas com exatidão apenas pelo quadro. Para validar a taxa e a integridade da transmissão, usar um ensaio que registre tempo local de recepção e contagem de linhas válidas/inválidas, explicitando as limitações.
