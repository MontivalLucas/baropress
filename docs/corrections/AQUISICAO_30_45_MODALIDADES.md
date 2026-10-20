# Aquisição de 30/45 segundos e modalidades por pé

Implementação realizada em 14/10/2026 na ordem solicitada.

- Duração: 30 ou 45 segundos, padrão 30, preparação separada de 5 segundos. Preferências antigas são normalizadas na leitura do frontend; a duração dos exames antigos permanece preservada.
- Modalidades: ambos os pés, esquerdo ou direito; sequência opcional dos dois separados, começando por qualquer pé. A primeira aquisição é revisada e preservada, e a troca aguarda o operador. Falha na segunda permite repeti-la; cancelamento explícito descarta a sequência inteira.
- Trajeto: linha ciano e marcador atual no mapa; pontos vêm dos quadros corrigidos pela tara/orientação congeladas. Ausência de contato e lacunas separam segmentos. O resultado salvo reconstrói o traçado dos quadros originais. O centro relativo ADC não equivale ao centro de gravidade ou a CoP físico validado.
- Histórico e relatórios: modalidade, duração e etapa; duas etapas guardadas em registros vinculados por identificador único, com matriz, série temporal e PDF próprios. Há links entre as etapas. Aquisições individuais apresentam distribuição por metades do tapete.

Os metadados opcionais ficam no JSON de análise existente, sem migração SQL. O comando de sequência grava os dois registros com savepoints e reverte ambos em caso de erro. Verificação de duplicidade, permissões e invalidação do cache foram incluídas. Backup individual preserva modalidade e vínculo. Exames antigos permanecem sem modalidade informada. Comparações quantitativas sinalizam diferenças de modalidade ou duração.

Validação: 210 testes frontend e 126 testes Rust aprovados, com 1 benchmark ignorado; TypeScript e build frontend aprovados. Sem validação visual: o navegador integrado não conectou e Edge não estava disponível. Sem teste no ESP32 real, sem acesso ao banco pessoal e sem instalação sobre o programa de uso. Nenhum novo instalador foi gerado.

A prévia isolada está em scripts/acquisition-preview.html (Vite): paciente sintético, Mock e armazenamento em memória, sem SQLite.

Roteiro e critérios: [plano](../../Sprint/04_Futuro/PLANO_AQUISICAO_30_45_MODALIDADES.txt).


Atualização de validação (14/10/2026): o navegador foi recuperado. A tela simplificada, a troca de abas, uma coleta Mock de 30 s com 909 quadros, o salvamento sintético, a reabertura e o relatório foram conferidos. 217 testes frontend e 9 testes de integração SQLite passaram. Hardware físico e WebView nativo permanecem pendentes. Registro: Sprint/05_Historico/2026-10-14_03_testes_condicoes_simplificadas.txt.
