# Rollback da faixa esquerda — 08/10/2026

O usuário informou que o deslocamento visual não deu certo e solicitou a reversão.

Foram removidos o reposicionamento de colunas, o marcador de CoP visual, o controle e as configurações de alinhamento, incluindo sua persistência nativa. Análise, exames, comparação, PNG e PDF voltaram a usar a matriz e o CoP originais. Os visualizadores `heatmap.py` e `mapa_calor.py` também foram restaurados, incluindo a remoção dos atalhos adicionados.

A instalação foi restaurada com o instalador original 0.2.11, preservado antes da alteração e confirmado pelo SHA-256 `933CF4BE00EBF810EA77501A11A3CEE3DF36EBA10CA2384D1E4754571E3BA82A`. A instalação silenciosa retornou código 0. O executável no caminho de uso da pasta `target/visualizacao/release` foi sincronizado com a instalação restaurada. Os arquivos experimentais foram retirados dos caminhos de uso e preservados em `rollback-faixa-esquerda` para histórico.

Validação: 181 testes frontend aprovados; TypeScript e frontend compilados; sintaxe e ausência do reposicionamento conferidas nos dois arquivos Python. A primeira tentativa de testes no ambiente restrito falhou na renomeação de temporários; a repetição autorizada fora desse ambiente passou. Não foram editados prontuários, matrizes de exames ou o banco pessoal.

Identidade dos artefatos e confirmação de instalação: `artifacts-rollback-faixa-esquerda.json`. O instalador de restauração está em `src-tauri/target/visualizacao/release/bundle/nsis/BAROPRESS_0.2.11_rollback_x64-setup.exe`.
