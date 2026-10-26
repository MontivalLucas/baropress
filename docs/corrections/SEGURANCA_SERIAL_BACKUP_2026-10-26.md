# Revisão de confiabilidade: serial e backup — 26/10/2026

**Escopo:** correções isoladas sobre `main` (base 0.2.14), na branch
`codex/seguranca-serial-backup-20261026`. A evolução funcional de exames da
0.2.15 está em uma entrega separada (PR #2). Os programas Python históricos
e o firmware ESP32 original permanecem preservados e inalterados.

## Aquisição serial

O leitor em `src-tauri/src/acquisition.rs` deixa de usar `read_line` com
crescimento sem limite. Acumula no máximo **4096 bytes por linha**, lendo em
passos de até **1024 bytes**, e só aceita quadros após um `LF`. Um quadro
corrompido que exceda o limite é descartado até o próximo `LF`, quando a
recepção volta a aceitar novas linhas. O parser mantém a exigência de **225
inteiros ADC na faixa 0–4095** e conserva fragmentos recebidos antes de um
timeout temporário, além de suportar `CRLF` e `LF`.

As leituras são divididas em passos para permitir reavaliar cancelamento e
sessão entre blocos. A chamada subjacente ao dispositivo ainda tem timeout
configurado de **2 segundos**. Um fluxo sem delimitadores será descartado até
que chegue uma quebra de linha; desconexões reais continuam dependentes do
driver/porta serial.

Testes adicionados no módulo Rust cobrem quadros fragmentados, timeout
intermediário, `LF`/`CRLF`, entrada de 1 MiB sem quebra de linha e retomada
após linha inválida. Estes são testes sintéticos: não medem throughput,
orientação do tapete ou perda de dados em um ESP32 físico.

## Exportação e restauração

`src-tauri/src/backup.rs` centraliza o limite de **64 MiB (67.108.864 bytes)**
que já era imposto na importação. Agora a exportação JSON, inclusive a
**cópia preventiva antes de restaurar**, obedece ao mesmo limite. Se o backup
completo atual exceder esse tamanho, a restauração é recusada **antes de
modificar as tabelas**, porque a cópia preventiva não poderia ser restaurada
por esta versão. O erro aparece ao operador. Exporte prontuários individuais
quando couberem no limite, mas isso **não equivale à recuperação integral** de
um banco grande.

O JSON ainda é montado na memória antes da checagem de tamanho. Suporte a
exportação/importação em fluxo, arquivos maiores, cópias automáticas,
criptografia e ensaios de recuperação de desastres permanecem pendentes.
**Não apagar nem substituir** o SQLite clínico ou cópias externas em busca de
contornar esse limite.

## Evidência e validação

| Verificação | Situação | Alcance |
| --- | --- | --- |
| `npm run build` | Aprovado nesta branch em 26/10 | TypeScript e Vite, sem instalação Tauri |
| `npm test -- --maxWorkers=1 --testTimeout=30000` | 217 testes aprovados em 26/10 | Vitest frontend, versão 0.2.14 |
| `git diff --check` | Aprovado após as correções de código | Formatação do diff |
| `cargo test --manifest-path src-tauri/Cargo.toml --lib` | Bloqueado no Windows local | `tauri-winres`: `NotAttempted("windres")`; sem testes Rust executados |
| `.github/workflows/rust-windows.yml` | Verificar resultado do GitHub Actions após push/PR | Runner Windows com cadeia MSVC; exige execução real para declarar aprovação |
| ESP32 físico, validação clínica e restore real | Pendente | Exige bancada e base sintética isolada |

As notas de validação referem-se exclusivamente à branch desta revisão. O
histórico geral está no [mapa completo](../MAPEAMENTO_COMPLETO_PROJETO.md),
na [cronologia](../historia/LINHA_DO_TEMPO.md) e no
[levantamento histórico](../validacao/VERIFICACOES_2026-10-26.md).
