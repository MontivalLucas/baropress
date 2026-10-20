# Primeiro acesso e cadastro — 0.2.13

Em uma instalação sem contas, a própria tela de login abre **Cadastre-se no primeiro acesso**, informa que a primeira conta terá perfil **Administrador** e mostra nome, e-mail, RA numérico, senha e confirmação. O botão **Cadastrar e entrar como administrador** cria a conta; a pessoa guarda o código pessoal de recuperação apresentado uma vez e continua para o programa.

A ajuda explica que RA identifica a conta e participa da recuperação de acesso, preservando zeros iniciais. Cada computador mantém seu banco local; o primeiro administrador é daquela instalação. Em atualização de um computador com contas existentes, o cadastro inicial não reabre: a pessoa entra com sua conta existente.

A base da 0.2.12 já possuía o cadastro inicial automático. Nesta revisão, a jornada foi deixada explícita, o retorno desabilitado foi removido e a regra do modelo foi reforçada: **a primeira conta é sempre admin**, mesmo se a função interna receber outro perfil. O comando público não oferece seleção de perfil. O banco verifica em transação se ainda não existem contas. Contas inativas ou excluídas não tornam o cadastro público disponível novamente.

Depois da primeira conta, o administrador cria os próximos usuários em **Usuários > Criar usuário**, escolhendo admin, profissional ou secretário. Menus e backend mantêm as permissões da entrega anterior, incluindo Agenda para secretaria e recuperação por e-mail + RA com alternativa por código.

## Verificação e pacote

198 testes frontend em 26 arquivos e 123 testes Rust aprovados, 1 benchmark explicitamente ignorado. O teste de cadastro inicial ampliado confirmou admin mesmo com outro perfil solicitado internamente, RA/zeros, sessão autenticada com acesso a Usuários, senha protegida e bloqueio de segundo cadastro, inclusive após desativar a conta existente. TypeScript/build, cargo fmt --check e NSIS 0.2.13 aprovados. Versão do executável confirmada como 0.2.13; esquema9 permanece sem nova migração.

O teste usa SQLite descartável e contas sintéticas. Não foi criada conta pessoal, alterado banco de uso ou instalado o programa nesta execução. A homologação visual nativa e com Arduino da entrega de usuários continua pendente; nesta alteração não se presume captura visual nova.

Plano: `Sprint/04_Futuro/PLANO_PRIMEIRO_ACESSO_CADASTRO.txt`.
Checkpoint: `Sprint/05_Historico/2026-10-09_14_primeiro_acesso_cadastro.txt`.
[Instalador 0.2.13](../../src-tauri/target/visualizacao/release/bundle/nsis/BAROPRESS_0.2.13_x64-setup.exe).
[Manifesto com tamanho e SHA-256](artifacts-0.2.13.json).
Pacote anterior 0.2.12 permanece preservado e foi conferido pelo hash registrado.

## Conferência em outro computador

1. Instalar o pacote 0.2.13 em ambiente de teste sem contas do BAROPRESS.
2. Conferir que o cadastro inicial abre automaticamente e informa perfil Administrador.
3. Preencher os campos, criar a conta, guardar o código pessoal e continuar.
4. Conferir acesso ao menu Usuários e criar um profissional/secretário de teste.
5. Sair e reabrir: a tela deve oferecer entrada, sem criar outro primeiro administrador.

Usar contas e banco descartáveis nesta conferência. O instalador não leva as contas ou prontuários de quem o compartilha.
