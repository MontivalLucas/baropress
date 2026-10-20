# BAROPRESS — Guia de Build e Instalação no Windows

Este documento descreve como configurar, executar em desenvolvimento e compilar o instalador de produção do **BAROPRESS** para o ambiente Windows.

---

## 1. Pré-requisitos de Sistema

* **Sistema Operacional:** Windows 10 ou Windows 11 (64-bit / x64)
* **Node.js:** v20+ (recomendado v24+; validado com 24.19.0)
* **Rust & Cargo:** versão estável atual (com toolchain `x86_64-pc-windows-gnullvm` ou `x86_64-pc-windows-msvc`)
* **Tauri CLI:** v2.x (`@tauri-apps/cli`)
* **Microsoft Edge WebView2:** Runtime padrão do Windows

---

## 2. Execução em Desenvolvimento

Para instalar as dependências e iniciar o aplicativo em modo de desenvolvimento com hot-reload:

```bash
npm install
npm run tauri:dev
```

*(Ou diretamente: `npm run tauri dev`)*

Também é possível iniciar via script de inicialização rápida:
```cmd
iniciar_baropress.bat
```

---

## 3. Geração do Instalador de Produção

Antes de gerar o instalador de produção, valide a integridade do código:

```bash
# 1. Verificação estática de tipos TypeScript
npm run typecheck

# 2. Build do bundle de frontend (Vite)
npm run build

# Testes do frontend
npm run test -- --run

# 3. Testes unitários do backend Rust
cargo test --manifest-path src-tauri/Cargo.toml

# 4. Compilação de release e empacotamento do instalador NSIS
npm run tauri:build
```

*(Ou diretamente: `npm run tauri build`)*

---

## 4. Localização do Instalador Gerado

Após a conclusão com sucesso do comando `npm run tauri:build`, o instalador executável é gerado em:

```text
src-tauri/target/release/bundle/nsis/BAROPRESS_0.2.1_x64-setup.exe
```

* **Formato:** Executável instalador Windows (NSIS `.exe`)
* **Arquitetura:** x64
* **Tamanho aproximado da versão 0.2.1:** 3,32 MiB
* **Recursos incluídos:**
  * Binário principal `baropress.exe`
  * Dependências de runtime (`WebView2Loader.dll`, `libunwind.dll`)
  * Ícone oficial do aplicativo BAROPRESS
  * Atalho na Área de Trabalho e no Menu Iniciar
  * Desinstalador registrado no Windows (Configurações → Aplicativos)

---

Versão 0.2.1 gerada em 07/10/2026, com 132 testes frontend e 63 testes backend
aprovados. A compilação foi validada; instalação/desinstalação e homologação
visual/hardware ainda precisam ser executadas em ambiente de teste.

Na primeira execução do empacotamento, o Tauri precisa baixar a ferramenta NSIS.
O argumento `--offline` passado ao Cargo evita downloads de crates, mas não
dispensa esse download inicial do empacotador.

## 5. Armazenamento do Banco de Dados SQLite

Para garantir a persistência dos dados e respeitar as permissões de usuário do Windows (evitando falhas em pastas de sistema):

* O banco de dados **não** é gravado na pasta de instalação do programa.
* O arquivo `baropress.db` é criado e mantido no diretório padrão de dados do usuário:

```text
%APPDATA%\br.com.baropress.app\baropress.db
```
*(Exemplo: `C:\Users\<Usuario>\AppData\Roaming\br.com.baropress.app\baropress.db`)*

### Persistência e Atualizações
* Ao instalar uma nova versão ou desinstalar o programa, os dados do usuário no SQLite permanecem preservados em `%APPDATA%`.
* As migrações do banco (`PRAGMA user_version`) são aplicadas automaticamente e de forma incremental durante a inicialização do aplicativo.
