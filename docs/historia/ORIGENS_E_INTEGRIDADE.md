# Proveniência e integridade dos arquivos incorporados

Em 26/10/2026, os arquivos-fonte foram copiados do diretório local `teste arduino/` para o repositório existente. **O conteúdo dos três arquivos incorporados foi comparado por SHA-256 com os originais**, com resultado idêntico.

| Origem relativa ao diretório histórico | Destino no GitHub | SHA-256 |
| --- | --- | --- |
| `heatmap_backup.py` | `prototipos/python-heatmap/heatmap_inicial.py` | `C1D0E690005A07C76BC40C462C6D7291D86FD3D6950CD187CA70F02C0D7FF76A` |
| `heatmap.py` | `prototipos/python-heatmap/heatmap_interativo.py` | `EDFB2B288D5435F737589DED12F374A5F634991E84C225E99C0066372E0518B1` |
| `tapete/tapete.ino` | `firmware/esp32/tapete.ino` | `82A094BE4CE70FECBC1D57C73B952D5ADB59BF914AF168F556B9253CD0A3ABAD` |
| `iniciar_mapa.bat` | `prototipos/python-heatmap/iniciar_mapa_original.bat` | `07565736929A0C6C9C4005AAF6A696A7D21784EB357BAD1236FB4553EBC0CCAF` |

Os três arquivos principais e o lançador `.bat` foram copiados preservando os bytes. O arquivo `mapa_calor.py` do diretório histórico tem o **mesmo hash** de `heatmap.py`, portanto não foi duplicado dentro de `prototipos/`. A igualdade comprova bytes iguais no dia da inspeção, mas não comprova qual nome foi criado primeiro.

## Fontes documentais complementares

- `Sprint/01_Referencias/Contexto.txt` e `Sprint/01_Referencias/PROJETO TCC - FASES.txt`: contexto inicial e objetivos planejados.
- `Sprint/05_Historico/`: entregas relatadas por data.
- `Sprint/Documentacao_TCC/DOCUMENTACAO_PROTOTIPO_E_TESTE_PILOTO.txt`: descrição de bancada e classificação do grau de evidência.
- `docs/ARCHITECTURE.md`, `docs/BAROPODOMETRY.md`: arquitetura e processamento desktop.
- Pasta externa `Baroscan/`: referências de produto comercial, mantidas no acervo local e não redistribuídas.
- Pasta externa `baropress-mac-m4/`: adaptação independente da versão 0.2.14, sem inclusão de ZIP ou executáveis.
- Pasta externa `NOVO PROGRAMA/imagens testes programa/`: 92 capturas de tela preservadas localmente; a publicação deve depender de triagem individual para dados pessoais e propriedade intelectual.

Veja também o [inventário de pastas e decisões de organização](INVENTARIO_DIRETORIOS.md).

## Preservação local da sessão

Antes da organização foi criado o diretório local `teste arduino/_backup_documentacao_2026-10-26/`, **fora do repositório Git**, com fontes originais, manifesto de hashes, diff binário das mudanças já existentes e cópias dos arquivos não rastreados naquele momento. Esse backup não deve ser enviado publicamente.

O commit Git original observado no repositório era `25968fe` (`Adiciona projeto BAROPRESS`, 20/10/2026); não se deve falsificar commits anteriores. Para confirmar integridade após obter o repositório, executar `Get-FileHash` nos arquivos incorporados e comparar com a tabela.
