# Revisão de fluidez — BAROPRESS

Data: 06/11/2026. Origem: relato de pequenos travamentos ao navegar e apresentar. Escopo: desempenho do pitch web, preservando conteúdo, imagens anteriores, referências visíveis, paleta, navegação e morphing SVG. Aplicativo desktop, firmware e banco de dados não foram alterados.

## Diagnóstico e implementação

| Antes | Depois | Causa tratada |
| --- | --- | --- |
| Relógio de 500 ms no estado de `App`, mesmo com painel fechado | Relógio em `PresentationClock`, montado apenas com o painel aberto; início permanece em `App` | Cada tick reconstruía o palco, a cena e as duas matrizes sem mudar seu conteúdo. O reset e o tempo decorrido ao reabrir continuam disponíveis. |
| Duas matrizes de 225 componentes Motion; a segunda nunca aparecia nas 12 cenas | Segunda matriz ausente enquanto estiver desligada; primeira matriz memorizada com parâmetros primitivos e velocidade explícita | 225 componentes invisíveis e suas animações eram mantidos sem função visual. Mudanças de navegação/controles também reconciliavam pontos sem alteração. |
| Cada ponto usava componente Motion, mola de escala, opacidade e cor | Pontos em elementos comuns com transições CSS de escala, opacidade e cor; onda, posição, cores e atrasos preservados | Evita centenas de objetos de animação e processamento React/Motion por mudança. A escala usa o easing existente com 500 ms em vez de mola individual. A matriz inteira continua se deslocando e escalando com Motion. |
| Revelações com blur, inclusive wrappers de 1920 × 1080; blur de imagens e da cena ao sair | Revelação por `clip-path`; fotos e capturas com escala/opacidade; saída da cena por opacidade | Reduz superfícies intermediárias filtradas e seu custo de composição durante navegação e troca de imagens. Tempos e easing das revelações, trocas e morphing foram mantidos. |
| `transition-all` em controles e dimensões dos marcadores do hardware | Propriedades explícitas; marcadores de tamanho fixo e mudança visual por escala | Impede animação de largura/altura e reposicionamento dos controles em cada frame. A largura dos indicadores de navegação muda uma vez, sem animação de layout. |
| Imagens decodificadas somente ao aparecer | Preparação sequencial com `Image.decode()` e decodificação assíncrona, iniciada em período ocioso | Reduz competição entre decodificação inicial e animação. Não altera, comprime ou substitui as imagens. Falha de preparação não impede o componente visível de carregar e reportar imagem ausente. |

O SVG persistente, a interpolação entre os 12 destinos, as curvas `EZ_OUT` e `EZ_MOVE`, a revelação em onda da marca e a troca automática/manual das demonstrações permanecem. A preferência por movimento reduzido continua ativa em tempo real, incluindo as transições CSS. Não foram adicionadas dependências nem `will-change` indiscriminado.

## Método de medição

Comparação sobre builds de produção servidos localmente, com Microsoft Edge headless em 1366 × 768. Mesmo roteiro e mesmos ativos preparados nas duas versões, para não atribuir variação de rede às animações. Duas condições: CPU normal e desaceleração de CPU de 4× pelo Chrome DevTools Protocol.

Em cada condição, percorrem-se as cenas 2, 4, 5, 6, 7, 8, 9, 10, 11 e 12, com janelas de aproximadamente 1,8 s. Registram-se deltas de tempo de script/layout/estilo, intervalos de `requestAnimationFrame` e tarefas longas. Uma janela adicional de 3 s mede o custo da cena parada, sem o painel do apresentador.

Esses dados são uma comparação controlada no mesmo host, não uma garantia de FPS em qualquer dispositivo. Headless e desaceleração de CPU não reproduzem a GPU, a memória ou o painel físico do usuário. Mantém-se o custo necessário do morphing SVG e de suas sombras; não foi trocado por cortes secos.

Scripts e resultados locais: pasta `C:/Users/Montival Nunes/.codex/visualizations/2026/11/06/01a1b0cb-eae1-7db0-8695-c63e6e2c0255/`, arquivos `profile-motion.cjs`, `motion-before.json`, `motion-after.json` (etapa intermediária) e `motion-final.json`.

## Resultados e validação

| Métrica no mesmo roteiro | Antes, CPU normal | Depois, CPU normal | Antes, CPU 4× | Depois, CPU 4× |
| --- | ---: | ---: | ---: | ---: |
| Tempo de JavaScript | 2.161 ms | 501 ms | 7.626 ms | 1.044 ms |
| Tempo total de tarefas | 6.844 ms | 4.392 ms | 15.127 ms | 9.676 ms |
| Tarefas longas | 12 | 3 | 67 | 28 |
| Intervalos de frame acima de 33,5 ms | 52 | 28 | 69 | 63 |
| JavaScript em 3 s de cena parada | 65,4 ms | 0,9 ms | 231,4 ms | 5,9 ms |
| Elementos DOM na cena 12 | 505 | 279 | 505 | 279 |

O tempo de JavaScript caiu aproximadamente 77% na condição normal e 86% com CPU desacelerada; o tempo total de tarefas caiu cerca de 36% nas duas condições. A atividade desnecessária da cena parada foi praticamente eliminada. Os intervalos de frame também melhoraram, mas a condição de CPU desacelerada ainda registra atrasos, associados ao trabalho restante de navegador/rasterização e ao ambiente do ensaio. Portanto, a redução de JavaScript não é apresentada como garantia de fluidez perfeita em qualquer GPU ou aparelho.

O build final executou TypeScript e Vite sem erros, com HTML de 475,00 kB e gzip de 143,63 kB. `git diff --check` aprovado. A revisão não modifica ativos de imagem, textos ou referências do pitch.

Verificação funcional aprovada: 48 capturas das 12 cenas em 1366 × 768, 1920 × 1080, 800 × 600 e 390 × 844, sem conteúdo fora do palco, imagens ausentes ou erros da aplicação. Conferidos teclado, botões, limites do hash, notas, referências, reset do relógio e continuidade do tempo ao fechar/reabrir o painel, pausa e retomada do hardware/software, entrada e saída da tela cheia e navegação offline após preparar os ativos.

Conferidos especificamente nesta correção: somente 225 pontos no DOM; velocidades Lento/Rápido atualizam as durações nativas; preferência de movimento reduzido continua pausando as demonstrações; mesmo elemento SVG interpola os destinos 11–12 e aceita navegação interrompida sem erro. Capturas da matriz nas cenas 6 e 11 também foram inspecionadas visualmente. No teste offline, avisos externos do antivírus do host foram registrados separadamente, sem alterar suas configurações.

Evidências funcionais em `qa-pitch.cjs`, `qa-results.json` e capturas `scene-*.png` na mesma pasta local. A branch `codex/pitch-fluidez-20261106` reúne a correção para revisão/publicação pela integração GitHub–Vercel.
