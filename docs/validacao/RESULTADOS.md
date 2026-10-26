# Resultados observados e estado da validação

Verificações automatizadas executadas no workspace em 26/10/2026: [registro com comandos e resultados](VERIFICACOES_2026-10-26.md). Esses testes foram realizados com as alterações locais de desenvolvimento presentes e não substituem ensaio físico.

| Tipo de evidência | Situação registrada | O que ainda falta |
| --- | --- | --- |
| Funcionamento básico do firmware | Código de varredura 15×15 e saída CSV inspecionados | Compilar e testar a versão gravada na placa |
| Heatmap Python | Algoritmos e visualizadores preservados no repositório | Reproduzir com COM/USB real e conferência de orientação |
| Ensaios do piloto | Documento de 07/10/2026 relata 35 ensaios marcados REAL em banco à época | Conferir metrologia, replicações e rastreabilidade física; não divulgar dados pessoais |
| Algoritmos do BAROPRESS | Testes e auditorias registrados em `Sprint/` e `docs/` | Regressão atual em código, dispositivos, UI e banco isolado |
| Taxa de aquisição | Referências divergentes a cerca de 10 e 30 FPS em comentários/documentos | Medir throughput real por transporte e reportar distribuição de intervalos |
| Pressão/força em unidades físicas | **Não validada como medição clínica local** | Calibração rastreável, incerteza e validação por sensel |
| Compatibilidade Mac M4 | Pacote independente 0.2.14 preparado | Build e teste com hardware em macOS ARM64 |

Para citações acadêmicas, identificar a data do registro e a modalidade de evidência. Não converter o número de testes automatizados documentados em evidência clínica, nem apresentar registros antigos como resultado de uma nova execução.

O código e os testes atuais também passam por revisão: [revisão 0.2.15 de 22/10](../review/REVISAO_CODIGO_0.2.15_2026-10-22.md) apresenta riscos relevantes ainda a verificar/corrigir. Um relatório final de aceitação deve incluir versões de software/firmware, condições, logs, resultados e responsável.
