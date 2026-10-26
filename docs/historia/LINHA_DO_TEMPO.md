# Linha do tempo — do protótipo ao BAROPRESS

Esta cronologia combina fontes datadas e observação do código. **As etapas Python e ESP32 não possuem data de commit original confirmada**, portanto aparecem como etapas técnicas precedentes sem dia inventado.

| Momento | Marco | Evidência e ressalva |
| --- | --- | --- |
| Etapa inicial, data não comprovada | Tapete resistivo com 15 × 15 cruzamentos, ESP32 e dois CD74HC4067 | [Firmware preservado](../../firmware/esp32/tapete.ino) **[CÓDIGO]** e [contexto histórico](../../Sprint/01_Referencias/Contexto.txt) **[REGISTRO]** |
| Etapa inicial, data não comprovada | Visualização do CSV serial em Python com Matplotlib, baseline máximo de 30 quadros e limiar 180 | [heatmap_inicial.py](../../prototipos/python-heatmap/heatmap_inicial.py) **[CÓDIGO]** |
| Evolução Python, data não comprovada | Sliders de VMAX, limiar e gama; baseline médio, tara manual, leitura do último quadro, FPS visual e balanço bilateral | [heatmap_interativo.py](../../prototipos/python-heatmap/heatmap_interativo.py) **[CÓDIGO]**. A ordem entre versões é **[INFERÊNCIA]** pela complexidade. |
| 06/10/2026 | Registros de correções de exames e implementação/planejamento das fases 7 a 11 | `Sprint/05_Historico/2026-10-06_*.txt` **[REGISTRO]**; há histórico de software anterior a essa data sem versão original comprovada aqui |
| 07/10/2026 | Uniformização visual, Arduino em Configurações, questionários, desempenho, documentação do piloto e integração dos módulos | `Sprint/05_Historico/2026-10-07_*.txt`, [protocolo do piloto](../../Sprint/Documentacao_TCC/DOCUMENTACAO_PROTOTIPO_E_TESTE_PILOTO.txt) **[REGISTRO]** |
| 08/10/2026 | Correções de calibração e ajustes de orientação, inclusive rollback documentado | `Sprint/05_Historico/2026-10-08_*.txt` **[REGISTRO]** |
| 09/10/2026 | Plano e fases de melhorias inspiradas na análise funcional do BaroSys; testes de bancada preparados | `Sprint/05_Historico/2026-10-09_*.txt` e `docs/barosys/` **[REGISTRO]** |
| 14/10/2026 | Modalidades de exame, trajeto do centro relativo, simplificação do fluxo e distribuição 0.2.14 registrada | `Sprint/05_Historico/2026-10-14_*.txt` **[REGISTRO]** |
| 20/10/2026 | Auditoria/organização conservadora e primeiro commit visível do repositório atual (`25968fe`) | [auditoria](../maintenance/AUDITORIA_2026-10-20.md) **[REGISTRO]** e histórico Git **[CÓDIGO]** |
| 22/10/2026 | Revisão técnica da versão 0.2.15, com achados pendentes de correção | [revisão de código](../review/REVISAO_CODIGO_0.2.15_2026-10-22.md) **[REGISTRO]**; arquivo local ainda não rastreado em 26/10 |
| 26/10/2026 | Organização histórica para GitHub, cópias íntegras dos protótipos e do firmware, documentação consolidada | [proveniência](ORIGENS_E_INTEGRIDADE.md) **[CÓDIGO]**; a publicação dependerá do resultado do versionamento |
| 26/10/2026 | Endurecimento do receptor serial e limite coerente para exportação, importação e cópia preventiva do banco na base 0.2.14 | [registro técnico](../corrections/SEGURANCA_SERIAL_BACKUP_2026-10-26.md) **[CÓDIGO EM REVISÃO]**; testes Rust locais dependem da ferramenta de recursos Windows |

## Como ler esta cronologia

- A data de um arquivo não demonstra necessariamente quando o programa foi usado pela primeira vez.
- Os registros de `Sprint/05_Historico` são relatos da época das entregas, não reexecução de todos os testes.
- A fase 11 do plano acadêmico e as versões `0.2.x` são **eixos diferentes** de organização.
- A documentação do piloto descreve registros de bancada e pendências de montagem; não confundir esses registros com validação clínica ou exatidão de pressão local.
- A [adaptação independente para Mac M4, versão 0.2.14](EVOLUCAO_TECNICA.md#adaptacao-para-macos) foi identificada na pasta de trabalho e está documentada sem incluir o ZIP completo ou builds nesta publicação.
