# Algoritmo de aquisição da matriz

## Implementação histórica no ESP32

**Entrada:** 225 posições de uma malha resistiva 15 × 15. **Saída:** uma linha CSV por quadro para USB e Bluetooth SPP. Código preservado em [firmware/esp32/tapete.ino](../../firmware/esp32/tapete.ino).

```text
inicializar Serial USB (115200) e Bluetooth Classic SPP
configurar GPIOs de seleção, excitação HIGH e entrada analógica
repetir:
    para linha em 0..14:
        selecionar canal do MUX de excitação
        para coluna em 0..14:
            selecionar canal do MUX de leitura
            aguardar 60 us
            descartar analogRead(GPIO34)
            aguardar 10 us
            valor = analogRead(GPIO34)
            enviar valor no USB e Bluetooth
            enviar vírgula se não for a última célula
    terminar linha nos dois transportes
    aguardar 10 ms
```

O canal é selecionado escrevendo os quatro bits do número da linha ou coluna nos pinos S0..S3. A leitura descartada após a mudança de canal reduz influência da comutação e do histórico do ADC, embora sua eficácia neste circuito não tenha sido quantificada.

O código usa `for` incondicional; há comentário sugerindo transmissão somente quando o Bluetooth estiver conectado, mas **nenhum `if` de conexão envolve o laço real**. A documentação deve seguir o executável e não esse comentário.

## Recepção

O receptor deve acumular dados até um delimitador de linha, separar por vírgulas, validar comprimento 225, converter os campos para inteiros e descartar linhas não conformes (por exemplo, mensagem de inicialização). Depois de adquirir a matriz válida, a camada de processamento aplica orientação, tara, limiar e análise. Consulte [protocolo de comunicação](../../firmware/esp32/PROTOCOLO_COMUNICACAO.md).

O BAROPRESS possui leitor serial Rust, origem simulada, armazenamento de quadros, e serviços de visualização. O fluxo atual depende de estados de conexão, preparação, aquisição e registro do exame. O detalhamento de integração e limites de versão está em [ARCHITECTURE](../ARCHITECTURE.md) e [BAROPODOMETRY](../BAROPODOMETRY.md).

## Premissas de desempenho

O quadro consome tempo de seleção de 225 células, 450 chamadas aproximadas ao ADC (uma descartada e uma retida por célula), transmissão ASCII e intervalo final de 10 ms. **Não existe taxa fixa comprovada pelo `delay(10)`**. USB a 115200 bps, tamanho variável dos números e Bluetooth podem limitar a taxa. O parâmetro de FPS da interface controla a atualização visual, não a taxa física de leitura.

Para medir: receber por ao menos 60 segundos, contar linhas completas/corrompidas, medir intervalo interquadro e registrar método, computador, versão de firmware, conexão, quantidade de perdas e condições de carga.
