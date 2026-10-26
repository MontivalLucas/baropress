# Firmware original de aquisição do tapete

O arquivo [tapete.ino](tapete.ino) é uma cópia byte a byte do arquivo `teste arduino/tapete/tapete.ino` localizado na revisão de 26/10/2026. Não recebeu refatoração, correção ou mudança de pinagem nesta incorporação histórica.

## Componentes e operação

- ESP32 com suporte a **Bluetooth Classic / SPP** no core utilizado.
- Dois multiplexadores **CD74HC4067**: um seleciona a linha excitada e o outro seleciona a coluna lida.
- Matriz resistiva de Velostat/fita condutora, **15 linhas × 15 colunas = 225 pontos**.
- Cada célula é lida pelo ADC de 12 bits do ESP32 em GPIO 34; o firmware envia o inteiro retornado por `analogRead`.

Em `setup`, o programa inicia Serial USB a 115200, `BluetoothSerial` com o nome `Esteira_Pressao_ESP32`, configura os pinos e leva a saída de excitação a HIGH. No `loop`, percorre linhas e colunas; em cada seleção de coluna espera **60 µs**, descarta uma leitura ADC, espera **10 µs** e usa a leitura seguinte. Envia os **225 valores em ordem linha-major** separados por vírgulas e termina o quadro com quebra de linha nos dois transportes. Há `delay(10)` ao final de cada quadro.

O firmware imprime uma mensagem textual de inicialização no USB. Os leitores de software devem rejeitar linhas que não contenham 225 inteiros.

> A observação `~10 fps` no comentário de `delay(10)` não constitui uma medição. Tempo de ADC, multiplexação e envio de CSV também limita a taxa efetiva; igualmente, referências antigas a `~30 FPS` são estimativas. Medir FPS e perda de quadros em hardware antes de afirmar desempenho.

## Reproduzir

1. Abrir `tapete.ino` na Arduino IDE com uma placa ESP32 compatível selecionada.
2. Usar um core que forneça `BluetoothSerial.h` e Bluetooth Classic; confirmar a seleção de placa e porta.
3. Conferir a [pinagem](../../hardware/PINAGEM_ESP32.md), a tensão de operação e a montagem **antes de energizar**.
4. Gravar, abrir Serial Monitor em 115200 e conferir quadros com 225 valores. O canal Bluetooth SPP é outra via para a mesma sequência.
5. Usar os protótipos Python ou o BAROPRESS para visualizar. Rejeitar cabeçalhos, linhas parciais e quadros malformados.

Não existe aqui uma medição de desempenho em bancada feita nesta entrega, nem um firmware comprovadamente idêntico ao que está gravado no ESP32 físico hoje.

Documentos: [algoritmo de aquisição](../../docs/algoritmos/AQUISICAO_DADOS.md), [protocolo CSV](PROTOCOLO_COMUNICACAO.md), [montagem](../../hardware/README.md).
