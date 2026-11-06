# Revisão do pitch BAROPRESS

Revisão em 5 de novembro de 2026. Escopo: 11 cenas, sem correções de interface nesta etapa.

## Verificação

Inspeção visual da versão compilada em 1280×720; relatório também em viewport 1024×768.
Navegação das 11 cenas, ciclo automático do hardware, troca automática e manual das abas do software,
modo apresentador, atalhos e interpolação do path SVG principal.
Nenhum aviso ou erro capturado no console durante a amostra; detector estático sem achados.
Não foram medidos FPS nem realizado ensaio em projetor físico ou celular.

## Revisão por cena

| Tela | Situação | Padronização recomendada |
| --- | --- | --- |
| 1 — Abertura | Marca e matriz bem enquadradas | Manter composição central como exceção intencional; aplicar padrão de pílulas ao selo técnico. |
| 2 — Público | Foto encaixada na máscara orgânica, sem corte de texto observado | Alinhar margem esquerda com as demais cenas narrativas; unificar pílulas e subtítulo. |
| 3 — Barreira financeira | Contraste e preço legíveis | Unificar margem, tipografia de apoio e hierarquia do rótulo “O problema”; manter ilustração e cápsula. |
| 4 — Oportunidade | Forma e produto preservados | Harmonizar peso do subtítulo; usar mesma família de tópicos da cena 2, sem mudar o argumento. |
| 5 — Hardware | Cinco fotos carregam; ciclo automático funciona | Ampliar textos secundários e uniformizar etapas; adicionar pausa para permitir explicação de cada imagem. |
| 6 — Funcionamento | Matriz e morphism funcionam; diagrama legível | Alinhar estrutura dos três subtópicos: número, título, informação principal e detalhe, com as mesmas escalas. |
| 7 — Software | Trocas automáticas e clique nas abas funcionam | Padronizar moldura e margens das capturas; evitar duplicação de cabeçalhos de janela; permitir pausa. Corrigir Enter nas abas. |
| 8 — Comparação | Quatro exames visíveis | Capturar área útil com tabela completa; reduzir informações de interface não essenciais para permitir leitura em projeção. |
| 9 — Relatório | Problema confirmado | Substituir a imagem já cortada por captura integral; enquadrar o documento com proporção A4 real e alinhar janela à área segura da forma orgânica. |
| 10 — Investimento | Barras proporcionais (BAROPRESS = 11,98% da referência); custo e margem legíveis | Harmonizar cabeçalho com cenas 5–8 e preservar a distinção entre margem após materiais e lucro líquido. |
| 11 — Encerramento | Marca retorna corretamente | Manter simetria com a abertura; harmonizar assinatura e discurso comercial com o restante do pitch. |

## Prioridades confirmadas

| Prioridade | Antes | Depois recomendado | Motivo |
| --- | --- | --- | --- |
| Alta | `public/shots/relatorio-a4.png` tem 784×610 e termina no meio do mapa | Captura/exportação integral em proporção A4 | O arquivo já vem cortado; `object-fit: contain` não recupera conteúdo ausente. |
| Alta | Moldura de relatório 760×860 contém imagem horizontal dentro da forma orgânica | Documento e moldura com proporções coerentes, com margem interna segura | Evita espaços brancos artificiais e quinas da janela avançando sobre a curva. |
| Alta | Painel do apresentador de 169px ocupa a faixa da navegação em 1280×720; reserva fixa de 76px | Reserva baseada na altura real do painel e controles fora da sobreposição | Navegação fica coberta; textos longos também cobrem parte do palco. |
| Alta | Enter em “Histórico” na cena 7 avança para a cena 8 | Atalhos de cena ignoram eventos de controles interativos | Preserva operação por teclado sem roubar a ativação das abas. |
| Média | Margens esquerdas de 120, 140 e 160px e títulos de 48 a 78px nas cenas de conteúdo | Duas composições padronizadas: narrativa lateral e demonstração com cabeçalho | Consistência sem forçar abertura, encerramento e demonstrações à mesma composição. |
| Média | Tópicos alternam pílulas, caixas arredondadas e letras maiúsculas, com tamanhos e pesos diferentes | Mesmos altura, raio, padding e tipografia para tópicos equivalentes; setas apenas para sequência | Unifica cenas 2, 4 e 9; etapas de hardware e fluxo técnico mantêm suas semânticas próprias. |
| Média | `useReducedMotion` multiplica durações por 0,01 e carrosséis continuam | Alternativa de movimento reduzido com dissolução suave e pausa do avanço automático | Respeita preferência de movimento sem afetar a experiência animada padrão. |
| Média | `Shot` aparece fora de `Rv`; forma, revelações e animações internas usam relógios separados | Coreografia compartilhada de forma, janela e conteúdo; validar ida, volta e avanço rápido | Preserva morphism e motion, reduzindo encaixes transitórios incoerentes. |
| Baixa | `transition-all` e dimensões dos nós de hardware mudam em cada estado | Transições explícitas; tamanho estável e escala para estado ativo | Evita animar propriedades não intencionais. Nenhuma queda de FPS foi medida. |

## Direção de padronização

Preservar azul elétrico, navy, ice white, formas orgânicas e transformação contínua do path SVG.
Não substituir morphism por cortes secos. Não remover as animações no modo padrão.
Usar área segura comum no palco 1920×1080, com margem lateral de referência de 120px.
Para cabeçalhos de demonstração: escala e posição comuns às cenas 5–8 e 10.
Para cenas narrativas: escala própria e consistente nas cenas 2–4 e 9.
Textos secundários precisam de tamanho suficiente após redução para projeção, sem crescer o volume de texto.

## Motion: o que manter

- Curvas existentes `EZ_OUT = [0.23, 1, 0.32, 1]` e `EZ_MOVE = [0.77, 0, 0.175, 1]`.
- Path SVG persistente, interpolado entre as cenas.
- Revelação da matriz e retomada da marca no encerramento.
- Trocas suaves das imagens e barras proporcionais animadas.

## Próxima etapa sugerida

Corrigir primeiro relatório, painel de notas e teclado; depois consolidar tipografia, margens,
tópicos e enquadramento das capturas. Finalizar conferindo transições em ambos os sentidos,
velocidades Lento/Normal/Rápido, movimento reduzido e tela cheia.
