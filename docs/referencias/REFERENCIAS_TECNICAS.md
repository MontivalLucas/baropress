# Referências e fontes da documentação

## Fontes primárias do projeto

- [Código ESP32](../../firmware/esp32/tapete.ino): multiplexação e transmissão de leituras.
- [Protótipo Python inicial](../../prototipos/python-heatmap/heatmap_inicial.py) e [interativo](../../prototipos/python-heatmap/heatmap_interativo.py): cálculo de baseline, processamento e visualização.
- [Contexto original](../../Sprint/01_Referencias/Contexto.txt) e [fases originais](../../Sprint/01_Referencias/PROJETO%20TCC%20-%20FASES.txt): requisitos e decisões iniciais, tratados como documentação histórica.
- [Registro do piloto](../../Sprint/Documentacao_TCC/DOCUMENTACAO_PROTOTIPO_E_TESTE_PILOTO.txt): distinção entre dados observados, relatados e ainda não comprovados.
- [Arquitetura desktop](../ARCHITECTURE.md), [cálculos](../BAROPODOMETRY.md) e [histórico](../../Sprint/05_Historico/): implementação e evolução.
- [Revisão de código 0.2.15](../review/REVISAO_CODIGO_0.2.15_2026-10-22.md): achados e riscos pendentes.

## Referências tecnológicas públicas

- [Arduino ESP32 / Espressif](https://docs.espressif.com/projects/arduino-esp32/en/latest/) — APIs e suporte de placa.
- [Espressif — ESP32](https://www.espressif.com/en/products/socs/esp32) — características da família e limitações de hardware.
- [Tauri v2](https://v2.tauri.app/) — aplicação desktop e distribuição.
- [React](https://react.dev/) — interface.
- [Rust](https://www.rust-lang.org/) — backend.
- [SQLite](https://www.sqlite.org/docs.html) — persistência local.
- [Matplotlib](https://matplotlib.org/stable/) e [NumPy](https://numpy.org/doc/stable/) — protótipos Python.
- [PySerial](https://pyserial.readthedocs.io/en/latest/) — comunicação serial Python.

## Referência funcional comercial

O software BaroScan/BaroSys e seu manual foram consultados como **referência de funcionalidades** nos documentos internos e em análises comparativas. Instaladores, vídeos de demonstração, PDFs comerciais e eventuais dados identificáveis da pasta `Baroscan/` **não integram o repositório público**. A referência comercial não implica afiliação, validação ou cópia de interface e código de terceiros.
