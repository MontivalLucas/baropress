# Alterações aplicadas
Data: 07/10/2026. Versão0.2.1.

## Conta, login e recuperação
- src-tauri/src/auth.rs: primeiro admin seguro; cadastro de profissional/assistente só pelo admin; identidade normalizada/única; Argon2id com salt aleatório; senha nova12–128 com letras/números; contas antigas com senha já existente continuam autenticando.
- Sessão em memória Rust por8h, conferindo active/role/hash atuais por comando. Restart requer login; refresh pode recuperar sessão pelo backend. Troca, recuperação e restauração completa invalidam sessão; logout desconecta aquisição.
- Código recovery256 bits, hash em settings, exibido uma vez; uso único consumido na mesma transação da nova senha; rotação exige senha atual; sem recuperação por nome/CPF/e-mail. Cinco erros geram cooldown60s em memória; restart reinicia esse limitador local.
- Backend registra eventos de conta com mensagens fixas, sem senha/código/e-mail. Frontend não duplica esses logs.
- src-tauri/src/lib.rs: guarda central dos43 comandos; auth_current/logout/recover/register_first/login/has_users públicos, demais exigem sessão, equipe/backups exigem admin.
- src/features/auth/*, App.tsx, stores/session.ts, api.ts, types/index.ts, Sidebar.tsx, Settings.tsx: telas completas, confirmação, mostrar/ocultar, loading, alertas, Enter, recibo, opção em sessão, logout real e consulta backend.
- Sem serviços de e-mail/SMS ou cadastro público posterior. Sem bypass de conta antiga.

Logout salva o último ajuste hidratado antes de revogar, mesmo antes do debounce; audit-session.test.ts valida a sequência e o bloqueio durante save.

## Dados, fluxos e apresentação
- patients.rs/exams.rs/support.rs: rejeitam antropometria não finita, CPF sem dígitos, ADC>4095, métricas fora de faixa e configuração JSON incoerente com escalares. Não recalculam nem sobrescrevem exames legados.
- patientUtils.ts/PatientDetails/PatientForm/ReportViewer/reportPdfGenerator: altura em cm correta, com apresentação legada em metros compatível com o IMC existente.
- savedValues.ts, prévia/PDF/detalhes: campos ausentes permanecem indisponíveis; zero real mantido; barra sem dados não simula50/50.
- reportPdfGenerator: observações longas continuam em páginas adicionais; numeração total. ReportViewer explicita persistência e imprime texto integral, sem textarea recortada.
- ReportsPage, PatientsPage, NewExamPage: erros úteis, retry e exclusão de resultados de busca antigos onde havia concorrência.
- stores/acquisition.ts: promessa única de conexão, disconnect aguardando connect e callbacks antigos descartados. AcquisitionPage/BaropodometryPage/ExamSettingsTab: feedback/catch nas ações.
- controls.tsx: IDs únicos/useId, aria-describedby, Button padrão button; todos os submits dos formulários afetados declarados explicitamente.
- HeatmapSettingsPanel/ParameterBar: ajuda por clique, Escape e descrição ARIA. Tailwind/CSS: tokens antes ausentes, cor primária por tema, impressão A4/overflow/última quebra.
- exportUtils/ExamExportActions/comparisonUtils: validação de integridade antes de exportar/comparar.

## SQLite e compatibilidade
- db.rs: snapshot consistente antes de migrations existentes, versão futura recusada, transaction rollback; cópia do diretório legado pela API backup SQLite, incluindo WAL e propagando erro.
- Cargo.toml: ativada feature backup do rusqlite já presente; nenhuma dependência nova adicionada.
- Não acrescentei migration. Hashes recovery usam tabela settings existente; não alterei senha de usuário real, pacientes, exames nem instalações.
- Debug aceita BAROPRESS_TEST_DATA_DIR para base isolada; build release ignora esse override.
- Versões package/package-lock/Cargo/Cargo.lock/Tauri alinhadas em0.2.1.

## Evidência antes/depois e risco
Antes: defeitos identificados por inspeção dos símbolos registrados em PROBLEMAS_ENCONTRADOS.md; suíte baseline113 frontend +44 Rust passou e não cobria essas falhas.
Depois:132 frontend +63 Rust passaram, com novas regressões de auth, logout/preferências, limites, WAL/snapshot, concorrência, dados ausentes/altura, páginas extras e invariância visual. TypeScript e build aprovados; detalhes/logs em RESULTADOS_TESTES.md.
UI não foi executada. CSS/ARIA, downloads, serial físico e instalador precisam do checklist. Testes de PDF em Node produzem documento/páginas, mas não renderizam Canvas real nem imprimem.

As principais mudanças de comportamento são sessão protegida/relogin em restart, backup apenas para admin, senha nova mais forte, necessidade de guardar código recovery, validação de novos payloads e páginas extras quando notas são longas. Não removi os botões redundantes úteis nem mudei regra de contato/calibração.

Scripts de execução: audit_inventory.cjs (inventário AST) e audit_verify.ps1 (suítes/logs). Scripts temporários usados para editar fontes foram removidos após aplicação.
