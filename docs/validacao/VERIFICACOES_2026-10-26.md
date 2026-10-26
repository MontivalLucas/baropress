# Verificações da organização histórica — 26/10/2026

Comandos executados na árvore de trabalho `baropress` na branch `codex/documentacao-historica-20261026`. Os testes do aplicativo avaliaram o **código local naquele momento**, que incluía modificações pré-existentes em desenvolvimento. Este documento registra verificações de software, não ensaios de pressão nem certificação clínica.

| Verificação | Resultado | Limite |
| --- | --- | --- |
| Comparação SHA-256 dos dois arquivos Python, firmware ESP32 e lançador `.bat` | **4 correspondências** entre original e cópia | Comprova integridade de cópia em 26/10, não autenticidade de autoria/data anterior |
| Compilação de sintaxe `python -m py_compile` para os dois protótipos | **Aprovado** | Não testa porta serial, dependências de UI nem hardware |
| Inspeção de links relativos de 22 documentos Markdown e índice principal | **0 links locais inexistentes** no conjunto conferido antes da inclusão deste registro | Não confirma disponibilidade de links externos |
| `npm run typecheck` | **Aprovado** (exit 0) | Avaliação estática TypeScript |
| `npm test -- --run` | **223 testes aprovados, 28 arquivos** (exit 0) | Testes lógicos existentes; não testam ESP32 real |
| `npm run build` | **Aprovado** (exit 0) | Build frontend Vite; sem pacote de instalação Tauri |
| `node scripts/check_project.cjs` | **Aprovado** (exit 0): 142 fontes, 114 runtime, 0 runtime não usados | Escopo do verificador: frontend TypeScript |
| `cargo test --manifest-path src-tauri/Cargo.toml --offline --locked` | **Bloqueado pelo ambiente** (exit 101) | Linker `x86_64-w64-mingw32-clang` não encontrado; nenhum resultado de testes Rust válido |
| `cargo check --manifest-path src-tauri/Cargo.toml --offline --locked` | **Bloqueado pelo ambiente** (exit 101) | Mesma ausência de linker, aqui durante o build script |

O `git diff --check` inicial não acusou problemas nos arquivos modificados do projeto. Após colocar os arquivos históricos novos em staging, o Git identificou espaços finais **já presentes nos scripts Python originais** e terminações CRLF do lançador `.bat`. Para manter a integridade byte a byte, foram definidos atributos `-text -whitespace` exclusivamente nesses três arquivos históricos: isto desativa a normalização de linhas e o alerta de whitespace para seus conteúdos históricos, sem reescrever os fontes. O firmware também recebeu `-text` para garantir integridade do arquivo em Git. O console Git Windows exibiu avisos informativos de conversão LF/CRLF nos demais arquivos. Conferir o diff versionado após staging conforme [guia GitHub](../historia/GUIA_GITHUB.md).

## Próximos passos de validação

1. Disponibilizar o linker exigido pela configuração Rust do ambiente e repetir `cargo test --offline --locked` em condições reproduzíveis; documentar o resultado, sem deduzi-lo a partir de builds TypeScript.
2. Compilar/gravar a revisão física do ESP32 em uma placa identificada e medir a comunicação USB e Bluetooth.
3. Testar a sequência de 225 valores, orientação e calibração usando cargas conhecidas e registro de incerteza.
4. Inspecionar a interface e a instalação Tauri em máquina independente, com banco de dados sintético.

Para a documentação histórica, a rastreabilidade é dada pelos [hashes](../historia/ORIGENS_E_INTEGRIDADE.md), pela [cronologia](../historia/LINHA_DO_TEMPO.md) e pelas fontes individuais.
