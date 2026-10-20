# Usuários, login e acesso — 09/10/2026

Plano registrado antes da implementação em `Sprint/04_Futuro/PLANO_USUARIOS_LOGIN_ACESSO.txt`.
IAM-01 a IAM-05 implementados e verificados em escopo automatizado. IAM-06 concluiu a verificação técnica e o instalador final 0.2.12, esquema 9. A instalação de uso e o banco pessoal não foram alterados. Homologação visual nativa e teste com o Arduino permanecem separados da conclusão do software.

## Permissões implementadas

| Perfil | Acesso |
| --- | --- |
| Administrador | Toda a clínica, Usuários, calibração, Arduino, logs e backup/restauração |
| Profissional | Pacientes, exames, resultados/PDF, análise, comparação, questionários e Agenda; utiliza o Arduino configurado pelo administrador |
| Secretário | Cadastro e edição de dados cadastrais de pacientes, resultados de exames concluídos/PDF, criação e consulta de agendamentos, tema e segurança da própria conta |

A Agenda foi acrescentada para a secretaria por solicitação posterior ao plano. Consultas existentes abrem em leitura; consultas novas podem ser criadas como agendadas ou confirmadas. Edição, exclusão, cancelamento e cadastro de profissionais ficam com profissional/admin. Esses limites são conferidos no Rust, além dos menus e campos da interface.

A secretaria não inicia exames, aquisição ao vivo ou calibração, não altera observações clínicas/antropometria/resultados e não acessa administração, logs, backup ou configurações do Arduino. O profissional acessa perfis físicos ativos e validados por comando clínico próprio, sem acesso aos ensaios e controles de calibração.

## Usuários e sessões

A aba Usuários é exclusiva do administrador: busca paginada, cadastro dos três perfis, edição de nome/e-mail/RA/perfil, ativação/desativação e exclusão lógica. As alterações exigem a senha atual do administrador. A exclusão retira acesso e preserva identidade histórica. Não é permitido excluir a si próprio, desativar/rebaixar a própria conta ou retirar o último administrador ativo.

RA é texto numérico único, com até 32 dígitos e zeros iniciais preservados. É obrigatório em cadastros novos. Contas antigas sem RA continuam entrando; o administrador completa os dados. A migração prepara RA 180386 para a conta existente com o e-mail informado, somente se já tiver perfil admin. Não eleva outra conta nem cria senha padrão. Essa migração foi testada em dados sintéticos; não foi executada sobre o banco pessoal.

O backend decide o acesso de cada comando, inclusive chamadas diretas. Sessões verificam estado e versão da conta a cada chamada. Alterar perfil/estado/credenciais revoga sessões; a aquisição verifica a sessão periodicamente e encerra a leitura quando perde autorização. O frontend também verifica a sessão aberta. Auditoria acontece no Rust sem gravar senha, RA ou código de recuperação.

Backups antigos dos esquemas suportados recebem os novos campos sem inventar RA. Restauração completa rejeita contas sem administrador ativo e avança a versão de sessão além dos valores do banco anterior e do backup, invalidando sessões de outras janelas mesmo quando a senha permanece igual. Falhas desfazem a transação. Backup individual continua sem contas/settings/logs.

## Recuperação concluída conforme pedido

Após a instrução “siga com o que falta para concluir”, foi aplicado o pedido original: **e-mail + RA**, sem exigir código adicional nesse caminho. “Esqueci minha senha” pede RA por padrão e confirmação da nova senha. RA é numérico, preserva zeros iniciais e permanece reutilizável enquanto estiver cadastrado.

Contas ausentes, RA incorreto/malformado, conta inativa/excluída e conta antiga sem RA recebem erro genérico. Há bloqueio após cinco falhas, senha protegida com Argon2 e invalidação das sessões anteriores em qualquer janela. A redefinição consome os códigos de recuperação previamente emitidos.

**Limitação do fluxo solicitado:** RA é identificador, não um segredo temporário; quem conhece e-mail e RA consegue redefinir a senha, inclusive de administrador. Não declarar esta opção equivalente a um código secreto aleatório de uso único. A recomendação anterior de acrescentar um segredo de recuperação continua registrada no histórico do plano, mas não é obrigatória no fluxo pedido.

A opção “Usar código pessoal ou temporário de recuperação” mantém o caminho anterior como alternativa explícita, inclusive para contas antigas sem RA. Código pessoal é de uso único; código emitido pelo admin também expira em 30 minutos. RA errado não aciona automaticamente essa alternativa. Não existe envio de e-mail/SMS.

Referências de segurança utilizadas na revisão: [OWASP — recuperação](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) e [autorização](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

## Verificação

- Frontend: 198 testes aprovados, em 26 arquivos (`iam-frontend-tests-0.2.12.log`).
- TypeScript e build Vite aprovados (`iam-frontend-build-0.2.12.log`).
- Build Tauri/NSIS final 0.2.12 aprovado (`iam-installer-final-build-0.2.12.log`), incluindo TypeScript e frontend após o ajuste dos textos de RA/código. Versão do executável confirmada como 0.2.12. Manifesto de tamanho e SHA-256: `iam-artifacts-0.2.12.json`.
- Rust: 123 testes aprovados, 1 benchmark explicitamente ignorado, nenhum erro (`iam-backend-tests-0.2.12.log`). Inclui recuperação por RA (zeros, erro, legado, bloqueio, senha inválida, conta inativa/excluída, alternativa de código e múltiplas sessões), criação/consulta de Agenda pela secretaria com bloqueio de edição/cancelamento/conclusão, último admin, migração, restauração e revogação de sessões.
- Navegação com dados sintéticos na etapa anterior (IAM-04): menu admin e formulário de usuário com RA/perfis; aviso de alterações não salvas; menus profissional/secretário; Configurações sem áreas privilegiadas; Agenda da secretaria com detalhes bloqueados e nova consulta disponível.
- Nova captura da recuperação nesta retomada não foi obtida: o navegador integrado falhou ao anexar sua webview em duas tentativas (oculta e visível). Prévia compilada com LoginPage real e sem operações de credenciais; não declarar essa tela homologada visualmente.
- Evidência visual da etapa anterior: `iam-secretaria-agenda.jpg`. Prévia isolada em `scripts/users-preview.html`/`.tsx`, fora da entrada de produção. Não foram criadas/excluídas contas nem gravados agendamentos pela prévia; testes de gravação usam SQLite em memória.

## Entrega 0.2.12

Instalador: [BAROPRESS_0.2.12_x64-setup.exe](../../src-tauri/target/visualizacao/release/bundle/nsis/BAROPRESS_0.2.12_x64-setup.exe).
Executável de produção: `src-tauri/target/visualizacao/release/baropress.exe`.
Os hashes/tamanhos estão em [iam-artifacts-0.2.12.json](iam-artifacts-0.2.12.json).
O instalador 0.2.11 original foi conferido por hash e preservado. Não houve instalação automática ou abertura do executável sobre o banco pessoal.

O pacote utiliza o estado atual do projeto, incluindo as melhorias BAROSYS já implementadas nas etapas anteriores e mantendo o rollback da faixa esquerda. As regras de acesso foram verificadas com as funcionalidades clínicas existentes. Esta entrega não equivale a ensaio físico ou validação clínica.

Ao atualizar, o banco recebe esquema9 e snapshot pré-migração. A conta informada recebe RA somente se já for admin; não há criação de senha, troca de credenciais ou elevação de perfil automática. Voltar para executável antigo após migrar exige restaurar a cópia anterior do banco, não apenas trocar o programa.

## Ordem de homologação após o pacote

1. Homologar em instalação de teste com banco descartável os três perfis, CRUD de contas, recuperação por RA e por código, Agenda, resultados/PDF e restauração.
2. Testar migração de uma cópia do banco real: RA do administrador informado, IDs/senhas/histórico preservados, preenchimento de RA de contas antigas e snapshot antes da migração.
3. Homologar Arduino/exame como profissional e parada após revogação de acesso. Secretário não inicia aquisição/exame nem altera hardware.
4. Conferir versão/backup antes de atualizar a instalação de uso. Instalador original 0.2.11 preservado; banco esquema9 exige nova versão, sem rollback direto para executável antigo.

Os testes sintéticos não comprovam uso no aplicativo instalado, acesso ao hardware ou calibração física. A proteção por perfil não cifra o SQLite/backup local; o acesso aos arquivos continua dependente das permissões do Windows. Não foram modificados protocolo clínico, medidas do tapete, cálculo físico ou rollback da faixa esquerda.
