# Plano por lotes
Data: 07/10/2026.

O arquivo de instruções continha uma seção intermediária “NÃO aplicar alterações” e uma etapa final autorizando correção efetiva. Foi seguida a etapa final e a implementação obrigatória de login. As correções comprovadas abaixo já foram aplicadas; mudanças estruturais/clinicamente ambíguas continuam pendentes.

| Lote | IDs / prioridade | Dependência / tamanho relativo | Arquivos centrais | Aceitação / risco |
|---|---|---|---|---|
| A — segurança e integridade | AUTH-01/02/03, DATA-03, DB-01/02 — P0/P1 | Rust/SQLite; G para auth, M dados/banco | auth.rs, lib.rs, db.rs, exams.rs, auth UI | Sem sessão não há acesso; só admin cria equipe/backup; recovery exige segredo; banco antigo preservado. Risco de reautenticação e contas sem código; mitigado por testes legados |
| B — fluxos | AUTH-04, DATA-01/02, PDF-01, UI-01, ACQ-01, PAT-01 — P1/P2 | Após A; M | sessionActions, stores, relatórios, pacientes, aquisição | Exame salvo mantém matriz/ajustes; erro visível; conexão única; altura correta; sem valores inventados; PDF continua observações. Risco nos fluxos async, acq física pendente |
| C — UX / redundância | UX-01/02/03, PRINT-01 — P2 | Após B; P/M | controls, Tailwind, CSS, tooltips, ReportViewer | Labels/foco sem IDs repetidos, submits corretos, tokens gerados, impressão sem textarea truncada. Risco visual; manual obrigatório |
| D — robustez e performance | PERF-01, teste de volume, paginação e perfil Canvas — futuro | Base sintética grande; M/G | consultas, hooks, heatmap | Medir latência e memória antes/depois; não mudar FPS de aquisição ao limitar render. Ainda não aplicado |
| Decisão de segurança | SEC-01 cifrar banco/exportações | Chave e recuperação; G | banco, backup, instalador | Recuperar cópia cifrada após restart sem perda de pacientes; migração requer cópia e aprovação |
| Decisão de medição | SCI-01 threshold zero | Definir contato; P | metrics/cop/settings/tests | 225 zeros resultarem no contato acordado; não mudar exames antigos |
| Decisão de produto | UX-04 e HIST-01 | Faixas/snapshot clínico; M | formulário, patient/exam schema | Regras iguais entre camadas; dados demográficos históricos reprodutíveis sem fabricar passado |

Quick wins aplicados: erros em tela, altura/unidades, valores ausentes, campos acessíveis, CSS/tokens, guarda da conexão e observações longas. Mudanças estruturais propostas: cifragem, snapshot demográfico, paginação, perfis e gestão fina de permissões.

Não há pedido de aprovação repetido para lotes A/B/C já autorizados. SEC-01, SCI-01, UX-04 e HIST-01 devem receber decisão explícita antes de implementação.

