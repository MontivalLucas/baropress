# Organização e publicação do histórico do BAROPRESS

## Estrutura do repositório

| Caminho | Conteúdo | Regra de manutenção |
| --- | --- | --- |
| `prototipos/python-heatmap/` | Python inicial e interativo, requisitos e instruções | Preservar as cópias históricas; experimentar em novos arquivos/branches |
| `firmware/esp32/` | `tapete.ino` original, pinagem e protocolo | Identificar revisões novas sem reescrever a cópia original |
| `hardware/` | Dimensões informadas, componentes, construção e mapa da matriz | Adicionar fotos somente com autorização; registrar medidas físicas verificadas |
| `docs/historia/` | Cronologia, decisões, proveniência e este guia | Atualizar marcos com fonte e grau de confiança |
| `docs/algoritmos/` | Aquisição, Python, heatmap e métricas | Explicitar equações, versões e limitações |
| `docs/validacao/` | Ensaios, registros e lacunas | Distinguir testes planejados, relatados e realizados |
| `docs/referencias/` | Referências do próprio projeto e tecnologias usadas | Apontar terceiros sem redistribuir instaladores ou materiais proprietários |
| `src/`, `src-tauri/`, `scripts/` | BAROPRESS atual | Manter caminhos e migrações existentes para não quebrar builds |
| `Sprint/` e `docs/` existentes | Planejamento, fases, decisões e relatórios originais | Manter histórico como evidência; corrigir dados incorretos por adendo |

## O que foi incorporado da pasta `teste arduino/`

Foram trazidas cópias verificadas por hash de `heatmap_backup.py`, `heatmap.py`, `tapete/tapete.ino` e do lançador histórico `iniciar_mapa.bat`. `mapa_calor.py` tem hash idêntico a `heatmap.py`, por isso não foi repetido. Os fontes originais permanecem no local onde foram encontrados. Consulte [origens e integridade](ORIGENS_E_INTEGRIDADE.md) e o [inventário](INVENTARIO_DIRETORIOS.md).

O inventário histórico identificou uma árvore independente `baropress-mac-m4/`, a pasta `Baroscan/` e 92 imagens de testes fora do repositório. A primeira contém adaptação e artefatos de distribuição que exigem reconciliação própria; a segunda reúne materiais comerciais de terceiros. As imagens aguardam triagem de privacidade. Nenhuma dessas pastas deve ser adicionada recursivamente ao repositório atual.

## Fluxo sugerido para o GitHub

O remoto do repositório principal é `github.com/MontivalLucas/baropress`. A branch de documentação desta entrega se chama `codex/documentacao-historica-20261026`. O histórico Git começa com o estado disponível de outubro de 2026; etapas anteriores são descritas nos arquivos históricos, sem criar commits falsamente retrodatados.

```powershell
# Na raiz do repositório atual; conferir alterações antes de qualquer commit.
git status --short
git diff --check
git log --oneline -5

# Após revisar uma mudança específica, usar staging por caminho.
git add docs/historia docs/algoritmos docs/validacao docs/referencias
git add prototipos/python-heatmap firmware/esp32 hardware
git add README.md .gitignore .gitattributes
git diff --cached --stat
git diff --cached --check

# Um commit de documentação separado das funcionalidades em desenvolvimento.
git commit -m "docs: preserva a evolucao historica do BAROPRESS"
git push -u origin codex/documentacao-historica-20261026
```

Esses comandos mostram **o fluxo de referência**. Se a documentação já tiver sido versionada, não é necessário repetir o commit. Para integrar à `main`, abrir um pull request, revisar os arquivos e mesclar quando os testes e a privacidade estiverem conferidos. Não fazer `git add .` em um workspace que contenha mudanças locais não concluídas.

## Alterações locais de desenvolvimento que requerem entrega separada

Em 26/10/2026, havia alterações não concluídas em `src/`, `src-tauri/`, `package.json`, `package-lock.json` e arquivos adicionais de exame com pés separados, além de documentos de revisão. Elas devem receber **revisão funcional, testes e commit específico** depois da documentação histórica; não devem ser acidentalmente incluídas neste commit. Há cópia de preservação local em `teste arduino/_backup_documentacao_2026-10-26/` com o diff e arquivos anteriores, fora do repositório.

Antes de publicar essas funcionalidades, executar os checks compatíveis com o ambiente:

```powershell
npm run typecheck
npm test
npm run build
node scripts/check_project.cjs
cargo test --manifest-path src-tauri/Cargo.toml --offline --locked
```

Se alguma verificação falhar, registrar qual e se o problema já existia nas alterações locais. Testes de código não substituem ensaios com o ESP32 e o tapete.

## Cuidados antes de tornar novos dados públicos

- Não fazer commit de bases de pacientes, CPF, prontuários, laudos identificáveis, credenciais, chaves ou arquivos `.env` reais.
- Não publicar gravações brutas, CSV ou fotos de participantes sem anonimização efetiva e autorização pertinente.
- Evitar `Baroscan/` e seus instaladores, PDFs, vídeos e marcas proprietárias como artefatos redistribuídos.
- Manter binários, ZIPs, builds e dependências fora do controle de versão. Para releases, gerar artefatos separados e documentar procedência.
- Marcar dados de simulação como **SIMULAÇÃO**, e medições de bancada como **REAL relatado** quando não houver revalidação independente.

## Rotina de atualização documental

Registrar novo marco na [linha do tempo](LINHA_DO_TEMPO.md) com data, commit ou arquivo de evidência, status do hardware e testes realizados. Atualizar decisões, algoritmos e validação apenas onde a mudança foi observada. Para modificações no firmware, manter um arquivo com nome/revisão próprios e identificar diferenças de pinagem/protocolo. Para dados de piloto, usar planilhas anonimizadas ou sintéticas com condições de aquisição e resultados reprodutíveis.
