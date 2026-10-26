# Ensaios e evidências existentes

## Evidência localizada

O relatório histórico [DOCUMENTACAO_PROTOTIPO_E_TESTE_PILOTO.txt](../../Sprint/Documentacao_TCC/DOCUMENTACAO_PROTOTIPO_E_TESTE_PILOTO.txt), elaborado em 07/10/2026, afirma haver **35 ensaios marcados REAL**, uma revisão do tapete cadastrada, um perfil candidato de força total e uma validação registrada, com nenhum perfil ativo. Essas observações foram registradas a partir do banco local **na ocasião da elaboração do relatório**; não foram conferidas novamente no banco nem repetidas fisicamente nesta organização.

O próprio relatório classifica os dados como experimento piloto de bancada com referências de massa no centro da plataforma. Isso não demonstra calibração por sensel, avaliação em movimento, precisão clínica ou segurança para diagnóstico.

Também existem roteiros e verificações preparadas em `Sprint/Documentacao_TCC/PROTOCOLO_BAROSYS_F06_V1.txt` e `docs/barosys/`. Diferenciar **roteiro planejado**, **ensaio relatado**, **resultado computado** e **verificação física nova**.

## Protocolo mínimo para novos testes

1. Registrar data, responsável, revisão do tapete/firmware e identificação **anônima** do experimento.
2. Conferir montagem, tensão, conexão, área sensora e temperatura/ambiente, quando pertinente.
3. Realizar tara com tapete totalmente livre e salvar os 225 valores de baseline, sem identificar participantes.
4. Aplicar carga/apoio de referência com massa, posição, superfície e tempo documentados; repetir em posições centrais e periféricas.
5. Medir quadros válidos por segundo, perdas, latência, estabilidade, repetibilidade, deriva, histerese e recuperação após retirar carga.
6. Salvar arquivos de teste anonimizados ou sintéticos com sua origem identificada, parâmetros e resultados.
7. Registrar diferenças entre esperado/observado, incertezas, falhas e correções propostas.

**Não divulgar** bases SQLite, prontuários, nomes/CPF, fotos de pessoas ou relatórios clínicos identificáveis no GitHub. Publicar apenas evidências anonimizadas com autorização apropriada ou dados sintéticos explicitamente identificados.

Resultados históricos e lacunas: [RESULTADOS.md](RESULTADOS.md) e [LIMITACOES.md](LIMITACOES.md).
