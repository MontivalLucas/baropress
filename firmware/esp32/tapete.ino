#include "BluetoothSerial.h"

// Verifica se o Bluetooth está habilitado no core do ESP32
#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth não habilitado! Ative-o nas configurações da IDE.
#endif

BluetoothSerial SerialBT;

// --- MUX 2: Leitura Analógica (Colunas) ---
const int s0 = 18;
const int s1 = 19;
const int s2 = 21;
const int s3 = 22;
const int SIG_pin = 34; // D34 (ADC1)

// --- MUX 1: Excitação Digital (Linhas) ---
const int w0 = 25;
const int w1 = 26;
const int w2 = 27;
const int w3 = 14;
const int OUT_pin = 12;

const int ROWS = 15;
const int COLS = 15;

inline void setMuxChannel(int channel, int p0, int p1, int p2, int p3) {
  digitalWrite(p0, bitRead(channel, 0));
  digitalWrite(p1, bitRead(channel, 1));
  digitalWrite(p2, bitRead(channel, 2));
  digitalWrite(p3, bitRead(channel, 3));
}

void setup() {
  Serial.begin(115200);

  // Inicializa o Bluetooth com o nome visível para o computador
  SerialBT.begin("Esteira_Pressao_ESP32");
  Serial.println("Bluetooth iniciado! Pronto para parear no computador.");

  pinMode(s0, OUTPUT);
  pinMode(s1, OUTPUT);
  pinMode(s2, OUTPUT);
  pinMode(s3, OUTPUT);

  pinMode(w0, OUTPUT);
  pinMode(w1, OUTPUT);
  pinMode(w2, OUTPUT);
  pinMode(w3, OUTPUT);

  pinMode(OUT_pin, OUTPUT);
  digitalWrite(OUT_pin, HIGH);

  pinMode(SIG_pin, INPUT);
  delay(500);
}

void loop() {
  // Executa a leitura e envio apenas se o computador estiver conectado via Bluetooth
  // (Caso queira ler mesmo sem conexão BT ativa, basta remover o if e manter o loop)
  for (int r = 0; r < ROWS; r++) {
    setMuxChannel(r, w0, w1, w2, w3);

    for (int c = 0; c < COLS; c++) {
      setMuxChannel(c, s0, s1, s2, s3);
      delayMicroseconds(60);

      analogRead(SIG_pin); // Leitura de descarte
      delayMicroseconds(10);

      int val = analogRead(SIG_pin);

      // Envia via Bluetooth (e via Serial USB para debug se o cabo estiver conectado)
      SerialBT.print(val);
      Serial.print(val);

      if (!(r == ROWS - 1 && c == COLS - 1)) {
        SerialBT.print(",");
        Serial.print(",");
      }
    }
  }

  SerialBT.println();
  Serial.println();
  delay(10); // ~10 fps
}