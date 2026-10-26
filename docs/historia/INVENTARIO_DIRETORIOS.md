# Inventário histórico das pastas locais — 26/10/2026

Este inventário registra os **principais grupos encontrados** sob o diretório de trabalho `teste arduino/` em 26/10/2026 e como cada grupo se relaciona ao repositório. É um inventário de organização, não uma afirmação de que cada arquivo individual foi auditado ou está pronto para divulgação.

| Local de origem (relativo a `teste arduino/`) | Conteúdo identificado | Destino/decisão |
| --- | --- | --- |
| `heatmap_backup.py` | Visualizador Python de baseline por máximo | Cópia integral em `prototipos/python-heatmap/heatmap_inicial.py` |
| `heatmap.py` | Visualizador Python interativo | Cópia integral em `prototipos/python-heatmap/heatmap_interativo.py` |
| `mapa_calor.py` | Mesmo conteúdo byte a byte de `heatmap.py` | Representado pelo interativo, sem duplicação |
| `iniciar_mapa.bat` | Atalho original Windows executando `python heatmap.py` | `prototipos/python-heatmap/iniciar_mapa_original.bat` para preservar o histórico |
| `tapete/tapete.ino` | Algoritmo original de varredura ESP32 | Cópia integral em `firmware/esp32/tapete.ino` |
| `Contexto.txt`; `PROJETO TCC - FASES.txt` | Textos de requisitos/planejamento originais | Já presentes em `Sprint/01_Referencias/`; referências cruzadas na cronologia |
| `NOVO PROGRAMA/baropress-fase1/baropress/` | Aplicativo Tauri, React, Rust, SQLite e documentos de sprint | Repositório Git atual; preservar sua estrutura executável |
| `NOVO PROGRAMA/baropress-fase1/baropress-mac-m4/` | Adaptação/empacotamento independente para Mac Apple Silicon | Referência documentada; reconciliar diferenças por revisão específica antes de incorporar |
| `NOVO PROGRAMA/imagens testes programa/` | 92 arquivos de captura de tela | Preservados localmente; seleção/anonimização e autorização antes de eventual publicação |
| `Baroscan/`; `ManualBaroScanv1.12.pdf`; atalhos para softwares externos | Material comercial, manuais e ferramentas de referência | Uso como referência técnica local; não redistribuir |
| `__pycache__/` | Cache gerado pelo Python | Não versionar |
| `_backup_documentacao_2026-10-26/` | Backup de originais, patch de alterações em curso e não rastreados | Preservado **fora** do repositório; não publicar |

## Princípios de organização aplicados

Os arquivos originais ficaram em seus diretórios; foram feitas **cópias verificadas por SHA-256**, sem movimentação destrutiva. A organização pública fica dentro do repositório existente e distingue protótipo, firmware, hardware, história, algoritmos, validação e referências. As modificações de funcionalidades da versão 0.2.15 em andamento permanecem fora do commit histórico.

Os materiais de terceiros, os instaladores, os dados identificáveis e as imagens sem triagem foram preservados localmente. Para anexá-los em uma próxima fase, verificar autoria, licença, presença de dados clínicos/pessoais e necessidade científica, e registrar a origem de cada artefato. Arquivos históricos já existentes em `Sprint/` permanecem onde estão para não quebrar links e referências do projeto.

O [guia de publicação](GUIA_GITHUB.md) apresenta o fluxo de branches e os testes; a [proveniência](ORIGENS_E_INTEGRIDADE.md) lista hashes dos itens copiados.
