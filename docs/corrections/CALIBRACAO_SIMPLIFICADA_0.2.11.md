# Calibração simplificada — 0.2.11

08/10/2026. A tela agora apresenta cinco etapas: **Tapete → Coletas → Criar curva → Conferir curva → Usar calibração**. Diagnóstico e Guia de bancada continuam disponíveis como apoio.

Cada etapa tem uma explicação curta. Campos têm ícones de ajuda com finalidade, unidade e exemplos de preenchimento. Para abrir, passe o mouse ou clique; pelo teclado, use Tab e Enter/Espaço. Escape fecha a ajuda. Os ícones são botões que não enviam o formulário.

O formulário separa escolha da coleta, identificação, referência e tempos. Na coleta de zero, campos de carga ficam ocultos. Massa do aplicador aparece para referência em massa; área e seleção de pontos aparecem conforme o tipo de aplicação. Pessoa usa kg e as condições específicas de verificação estática. Trocar tipo/unidade limpa as condições dependentes para evitar referências incompatíveis.

Protocolos, resolução/incerteza, montagem e geometria personalizada ficam em seções recolhidas. Os critérios da curva continuam visíveis; os valores não são sugeridos como garantia de precisão. Campos obrigatórios são marcados. O protocolo mantém sua versão inicial e pode ser editado nos detalhes; se ele for apagado, a seção abre para mostrar o campo inválido.

As medidas padrão do tapete BAROPRESS vêm do cadastro documentado em `Sprint/Documentacao_TCC/DOCUMENTACAO_PROTOTIPO_E_TESTE_PILOTO.txt`, seções 2.1 e 3.1: região sensora **300 × 300 mm**, fitas **10 mm** e espaçamento entre centros **20 mm** em X/Y, com matriz **15 × 15**. O primeiro cadastro recebe identificação/revisão conhecidas e firmware “Não identificada”. Áreas/centros das células e capacidade não são estimados.

Uma montagem já cadastrada tem prioridade sobre os padrões, incluindo campos desconhecidos e geometria personalizada. O rascunho é uma cópia independente; salvar uma alteração gera nova revisão e não modifica registros antigos. Um resumo mostra as medidas carregadas. A edição fica em **Alterar medidas e montagem**. Não há cadastro automático no banco sem a ação Salvar.

Quando já há uma revisão selecionada, o cadastro de outra montagem fica recolhido. Os dados existentes permanecem acessíveis pelo seletor e pela geometria. O rodapé da coleta mostra espera + duração e mantém a ação próxima durante a rolagem.

Não há alteração de cálculos, migrações ou autorização no backend. Áreas/capacidade desconhecidas não são estimadas, zero precisa ser aceito e os critérios de independência, origem e ativação permanecem.

TypeScript e 181 testes aprovados em 24 arquivos. Dois novos casos verificam medidas documentadas, ausência de áreas/capacidade presumidas e preservação de geometria/máscara de montagem existente sem alterar o original. Registros de compilação e identificação do pacote: `build-0.2.11.log` e `artifacts-0.2.11.json`. A prévia usa dados sintéticos; não corresponde a uma calibração física. O banco pessoal não foi usado para os testes.

Progresso: `Sprint/05_Historico/2026-10-08_12_calibracao_simplificada_ajudas.txt`. Homologação no aplicativo instalado/Arduino e as outras evoluções continuam no plano de pendências 0.2.10.

Compilação de produção e instalador NSIS aprovados, binário identificado como 0.2.11. Pacote: `src-tauri/target/release/bundle/nsis/BAROPRESS_0.2.11_x64-setup.exe`. Tamanho e SHA256 em `artifacts-0.2.11.json`. Não foi instalado automaticamente.

Prévia compilada conferida em 08/10/2026, no navegador em painel estreito: ajuda por clique/Enter, fechamento por Escape/Tab, campos condicionais para força/aplicação local/pessoa e primeiro cadastro com 300/300/20/20/10 já preenchidos. Edição recolhida confirmada. Captura: `calibracao-ajuda-0.2.11.jpg`. Isso não substitui homologação física, todos os temas, escalas ou aplicativo instalado.
