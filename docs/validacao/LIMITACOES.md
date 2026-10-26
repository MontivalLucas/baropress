# Limites experimentais e de uso

1. **ADC relativo:** leituras de `analogRead` e índices derivados não são automaticamente equivalentes a força, massa ou pressão. A calibração local deve ser validada.
2. **Resolução espacial:** há 225 pontos discretos; interpolação melhora visualização, não cria medições adicionais.
3. **Orientação:** espelhamento horizontal e esquerda/direita precisam ser conferidos com apoios em posições conhecidas.
4. **Sinal:** ruído, histerese, deriva, variações de contato e crosstalk podem gerar leituras diferentes para a mesma carga.
5. **Temporização:** `delay(10)` não garante dez ou trinta quadros por segundo. O protocolo não envia timestamps nem contador.
6. **Software e hardware:** testes com simulador, CI, Rust ou Vitest não equivalem a ensaio físico com ESP32 e tapete real.
7. **Medições relatadas:** o registro de ensaios REAL significa modalidade informada à época, não validação externa ou autorização de divulgação de dados individuais.
8. **Uso profissional:** sem validação metrológica e estudos adequados, não usar resultados exploratórios como fundamento exclusivo para diagnóstico clínico.

Pendências documentais: fotos e dimensões finais verificadas, esquema elétrico, identificação dos componentes, dados ambientais, roteiro padronizado, incerteza, resultados reproduzíveis anonimizados e homologação do instalador em máquina separada.

As questões de segurança e integridade de dados identificadas no [parecer técnico 0.2.15](../review/REVISAO_CODIGO_0.2.15_2026-10-22.md) também devem ser consideradas antes de qualquer uso com dados pessoais reais.
