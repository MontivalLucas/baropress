# Protótipos Python do mapa de pressão (15 × 15)

Este diretório preserva, sem alterar a lógica, duas versões do visualizador que antecederam o BAROPRESS desktop. Os arquivos são **cópias byte a byte** dos fontes encontrados em `teste arduino/` em 26/10/2026. Os nomes no repositório servem para distinguir as versões; consulte [proveniência e hashes](../../docs/historia/ORIGENS_E_INTEGRIDADE.md).

| Fonte original | Cópia neste repositório | O que demonstra |
| --- | --- | --- |
| `heatmap_backup.py` | `heatmap_inicial.py` | Heatmap Matplotlib; calibração inicial de 30 quadros pelo **máximo** de cada sensel, limiar fixo de 180 ADC, orientação espelhada e escala de exibição fixa. Porta padrão COM4. |
| `heatmap.py` | `heatmap_interativo.py` | Baseline pela **média** de 30 quadros; botão de nova tara; VMAX, limiar e gama ajustáveis; balanço bilateral das leituras; FPS do visualizador. Porta padrão COM5. |
| `mapa_calor.py` | **Não duplicado** | Conteúdo SHA-256 idêntico ao `heatmap.py` original; equivalência documentada. |
| `iniciar_mapa.bat` | `iniciar_mapa_original.bat` | Atalho histórico do Windows que executava `python heatmap.py` no diretório original. Preservado sem alteração, para rastreabilidade. |

Não há registro de Git contemporâneo a esses protótipos nesta pasta; os termos *inicial* e *interativo* designam a sequência técnica **inferida pela funcionalidade e pelos nomes dos arquivos**. Não servem como prova de datas exatas de criação.

## Executar com o ESP32

Requisitos: Python 3, dispositivo compatível transmitindo **uma linha CSV com 225 leituras** a **115200 baud**, e bibliotecas de [requirements.txt](requirements.txt).

```powershell
cd prototipos/python-heatmap
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python heatmap_interativo.py --help
python heatmap_interativo.py --port COM5
```

O visualizador interativo aceita `--port`, `--baud` e `--timeout` (consulte `--help`); o inicial usa `PORTA_SERIAL = 'COM4'` diretamente no código. Em outros sistemas operacionais a porta pode ter outro nome (por exemplo, `/dev/ttyUSB0`). Com a plataforma livre, aguarde a coleta inicial dos quadros de referência antes de apoiar peso. Para interromper, feche a janela.

O atalho `iniciar_mapa_original.bat` é uma cópia **histórica** que procura `heatmap.py`; dentro deste repositório, o arquivo correspondente se chama `heatmap_interativo.py`. Para iniciar a versão arquivada, utilize o comando `python heatmap_interativo.py` acima.

**Atenção:** estes programas fazem *visualização de leituras ADC relativas*. Não há calibração clínica em pressão física, nem garantia de orientação anatômica até validar a posição real do tapete. A divisão por colunas é uma aproximação geométrica e não identifica automaticamente pés em posições arbitrárias.

Veja também [processamento Python](../../docs/algoritmos/PROCESSAMENTO_PYTHON.md) e [protocolo ESP32](../../firmware/esp32/PROTOCOLO_COMUNICACAO.md).
