# Análise estática baseada no plano BAROSYS

Contrato `baropress-static-v1`, migração 8. Implementação sobre a base 0.2.11;
a instalação de uso e os bancos pessoais não fazem parte desta entrega.

Novos exames estáticos retêm no máximo 10.000 quadros brutos de 225 inteiros
ADC, em lotes de 60 na tabela existente `exam_raw_chunks`. A série relativa
usa `seriesFrames`; a física usa `rawFrames` com perfil validado. Os dois
contratos não podem duplicar a mesma série. Exame e série são transacionais.
Não há limpeza automática. Dados antigos não recebem condições inventadas.
Detalhes não carregam os quadros: revisão e exportação leem sob demanda;
a revisão usa páginas de 600 quadros e memória limitada pelo máximo de coleta.
Backups completos/individuais incluem metadados e lotes; formatos de esquema
5, 6 e 7 recebem apenas campos nulos na atualização para 8.

O relógio é `performance.now`, relativo ao início da coleta, na recepção
do computador. O contador serial também é de recepção. Não mede perdas
anteriores. Linhas inválidas são contadas pelos eventos recebidos dentro
da janela da sessão, sem subtrair contadores cumulativos de outra coleta.
Há atraso de entrega dos eventos: a janela é de recepção, não de firmware.

Condições são congeladas no início da preparação; mudanças posteriores
ficam em eventos, com tempo e informante. As condições de outro paciente
são descartadas ao selecionar um novo. Eventos antes de salvar podem
registrar correção de condição sem alterar o snapshot inicial.

Qualidade: `N / T planejado` e `(N-1)/(último-primeiro)` são taxas diferentes.
Intervalos usam pares com diferença positiva. Maior lacuna inclui início
até primeiro quadro e último quadro até fim da janela. ADC 4095 e leitura
corrigida ≥ VMAX são contagens diferentes, sobre `225*N` amostras. O VMAX
da coleta fica congelado, mesmo após editar a aparência. Estado fora de
domínio depende do perfil físico salvo; ausência de perfil é indisponível.
Sem taxa mínima clínica inventada. Watchdog existente de 2 s preservado.

A transformação histórica é tara bruta `max(0,raw-baseline)` seguida de
espelhamento horizontal, sem deslocamento da faixa esquerda. Média é
média aritmética por quadro/sensor, arredondada a 0,1 ADC. Máximos por
sensor combinam instantes distintos. Quadro individual usa seu tempo real.
Gamma, VMAX, interpolação e suavização são apresentação; não recalculam
área ou força. Reprodução não usa dispositivo nem COM.

Regiões manuais atribuem células inteiras a LA/LP/RA/RP; sem overlap.
Coluna central pode ser atribuída; parcela não atribuída permanece visível.
Revisões são anexadas com operador/modo/quadro/versão/data; os indicadores
originais por metades não mudam. Contato relativo mantém `valor >= limiar`;
limiar zero inclui zeros, decisão SCI-01 ainda pendente do protocolo.
Média espacial ADC usa células em contato. Percentuais declaram total
geral, total atribuído ou soma do pé. Denominador zero é indisponível.
Área cm² usa áreas efetivas conhecidas da montagem congelada; proporção
de área é distinta da soma ADC. Geometria desconhecida não vira zero.

Derivações físicas regionais só usam mapa médio salvo, perfil local
validado e cobertura completa. Sensor da revisão é convertido para índice
bruto por RAW_FLIP_X. Contato físico é pressão > 0. Força N = soma kPa*mm²/1000.
Pressão média ponderada = força*1000/área mm². É derivação do mapa médio
por sensor, distinta da média de estatísticas de contato quadro a quadro.
Perfil de força total não autoriza pressão por região. Modos máximos/quadro
físicos por região ficam indisponíveis nesta versão; não extrapolam calibração.

Oscilação permanece centro ADC relativo em células; não foi convertido
para CoP físico ou mm. Sem filtro. Trajetória/X(t)/Y(t) usam toda a série,
incluindo ausência de contato. Trecho vazio é indisponível. Continuidade
exige contato em ambos os pontos, dt > 0 e dt ≤ min(2000 ms, 3*intervalo
médio observado), com mínimo numérico de 1 ms. Esta é uma regra técnica
exploratória explícita, não limite clínico nem fórmula do BAROSYS.
Comprimento soma distâncias euclidianas contínuas. Duração válida soma dt
dos pares válidos. Velocidade ponderada = comprimento / duração válida;
média de velocidades por intervalo tem pesos iguais e é apresentada
separadamente. Amplitude = máximo-mínimo; dispersão = desvio populacional
dos pontos válidos do trecho. Pontos legados têm continuidade/precisão
desconhecidas: mostrar pontos e aviso, sem inferir segmentos reais.
Elipse não incluída; algoritmo comercial desconhecido.

PDF e prévia usam `analysisLines`/cálculos compartilhados. Seções opcionais:
condições/qualidade/regiões e oscilação. Exportação JSON da série contém
formato 1, exame completo e bruto; PNG/CSV originais mantêm mapa médio.
Comparação conserva valores salvos e bloqueia deltas quando método,
condições/origem/limiar são diferentes ou desconhecidos. Comparação regional
exige mesmas máscaras, versão e modo médio. Escala comum só nos mapas ADC.

3D usa SVG com 225 barras, paleta/Gamma/VMAX do 2D, rotação e zoom por controles
de teclado. Altura = min(ADC/VMAX,1); abaixo do limiar aparece neutro.
É representação discreta dos sensores; não representa anatomia.

Ensaios físicos F06 e viabilidade F09 permanecem pendentes por decisão do
responsável. Consultar protocolo F06-A e estudo F09-A na Sprint. Testes
sintéticos, navegador e PDF não homologam montagem, marcha ou precisão.
