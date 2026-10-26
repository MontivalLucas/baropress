# Evolução técnica do projeto

## 1. Experimento de sensoriamento

Uma matriz piezorresistiva de Velostat cruzada por trilhas de cobre forma 225 posições de leitura. O ESP32 aciona um MUX para a linha e um segundo MUX para a coluna; coleta o sinal ADC e transmite 225 números por linha CSV. Esta etapa viabiliza observar distribuição **relativa** de contato, sem obter automaticamente unidades físicas de pressão. Código: [tapete.ino](../../firmware/esp32/tapete.ino).

## 2. Primeiro visualizador em Python

`heatmap_backup.py` (cópia `heatmap_inicial.py`) abre serial, constrói `reshape(15,15)`, aplica `fliplr` e mostra `imshow` no Matplotlib. O baseline ponto a ponto acumula o **maior valor** de 30 quadros; o sinal é subtraído, recebe zona morta fixa de 180 e é limitado a 0..4095. Foram atendidos os objetivos básicos de mostrar um mapa e observar ruído de repouso.

## 3. Visualizador Python interativo

`heatmap.py` (cópia `heatmap_interativo.py`) introduziu baseline pela **média** de 30 leituras, nova tara em botão, ajustes visuais (VMAX/gama), ajuste de limiar, estatísticas de sensels e proporção entre metades do mapa (colunas 0..6 e 8..14). O leitor prioriza a linha mais recente para reduzir atraso visual. Esta foi uma evolução de experimentação da interface, ainda sem persistência estruturada de prontuários e exames.

## 4. Aplicação BAROPRESS

O código desktop atual combina **React 18, TypeScript, Vite, Tailwind, Zustand e Tauri 2** com comandos **Rust** e armazenamento local **SQLite**. A aquisição pode vir do ESP32 ou do simulador; visualização e armazenamento tornam-se parte do fluxo de pacientes, exames e relatórios.

| Bloco funcional | Etapa/fase nos documentos | Evolução |
| --- | --- | --- |
| Fundação | Fase 1 | Aplicativo desktop, organização da interface, banco e autenticação |
| Cadastro clínico | Fase 2 | Pacientes, validações e histórico |
| Comunicação | Fase 3 | USB/Bluetooth, buffer, parser, tara, simulação |
| Análise | Fases 4–4.2 | Interpolação, ajustes, métricas e revisão visual |
| Exames | Fase 5 | Preparação, aquisição temporal, revisão e persistência |
| Relatórios | Fase 6 | PDF, observações, mapa e identificação da origem dos dados |
| Comparação, agenda, questionários | Fases 7–9 | Acompanhamento longitudinal e fluxos administrativos |
| Backup, revisão e controle de acesso | Fases 10–11 e versões subsequentes | Exportação/restauração, refinamentos, perfil de usuário e auditorias |

O [README principal](../../README.md) e a [arquitetura](../ARCHITECTURE.md) detalham os módulos. A [documentação baropodométrica](../BAROPODOMETRY.md) contém o processamento implementado em cada versão e suas ressalvas.

## 5. Ampliação analítica e testes

Os documentos de outubro tratam de retenção de quadros, análises temporais, regiões manuais, relatórios e protocolos de bancada. Parte dos ensaios é registrada como **real** no relatório de piloto; isso significa aquisição em bancada relatada, **não** validação metrológica completa nem qualificação para diagnóstico clínico. Os testes automatizados cobrem lógica e integração, mas não substituem medição no hardware.

### Adaptação para macOS

Foi encontrada a pasta irmã `NOVO PROGRAMA/baropress-fase1/baropress-mac-m4` com cópia independente, instruções `LEIA_ME_MAC.md`, scripts `.command` e pacote ZIP da versão 0.2.14. Os registros locais confirmam preparação de build Apple Silicon; a compilação/validação nativa no Mac ainda depende de teste nesse sistema. A cópia não foi importada inteira para evitar duplicação de fontes, dependências e binários; antes de decidir um release multiplataforma, comparar suas alterações com o projeto principal.
