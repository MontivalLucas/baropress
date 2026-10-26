# Exame com aquisições individuais dos pés

- O bloco extenso de revisão fica fechado em **Detalhes técnicos**.
- Selecionar o pé inicial prepara, por padrão, a coleta dos dois pés separadamente.
- Ao terminar a primeira aquisição, a tela pede a troca de pé e aguarda o comando do operador. A segunda aquisição mantém sua própria preparação de cinco segundos.
- A opção **Coletar somente este pé** continua disponível. No resultado de uma coleta única, também é possível acrescentar o outro pé.
- As duas aquisições são salvas atomicamente, vinculadas pelo identificador de sequência. Cada uma preserva matriz, série bruta, condições, eventos e parâmetros; os mapas não são somados nem tratados como uma coleta simultânea.
- Histórico, prontuário e contador do dashboard apresentam uma entrada por exame combinado. A revisão exibe os dois mapas; o PDF reúne as aquisições sob o identificador principal.
- Uma interrupção durante o segundo pé preserva a primeira coleta para repetição. Excluir o exame remove as duas aquisições. Uma etapa antiga sem sua correspondente continua visível no histórico.

## Verificação

- Frontend: 223 testes aprovados; compilação TypeScript e Vite aprovada.
- Backend: na validação atual, 129 testes aprovados e um benchmark ignorado; 11 testes de análise cobrem agrupamento, paginação, exclusão conjunta, etapa órfã e restauração de backup.
- A inversão experimental da condição de troca automática foi detectada pelos testes nos dois sentidos. O código original foi restaurado e a suíte do frontend voltou a passar.
- Conferência visual com dados sintéticos em `scripts/check_paired_exam.cjs`, usando `scripts/acquisition-preview.html`; evidências em `docs/corrections/paired-exam/`. Validadas as ordens esquerda→direita (1366 px) e direita→esquerda (768 px), com exportação de PDF e sem erros de página. Para reproduzir, executar `npm run dev -- --host 127.0.0.1 --port 1434`, seguido de `node scripts/check_paired_exam.cjs`, com Playwright instalado. O script recebe o endereço pelo ambiente `BAROPRESS_PREVIEW_URL` e não acessa o banco pessoal.
- Executável Windows gerado com sucesso por `npm run tauri:build -- --no-bundle`, em `src-tauri/target/release/baropress.exe`. A instalação aberta no computador não foi substituída.
