# Decisões técnicas e motivos

| Decisão observada | Motivação/efeito | Limitação |
| --- | --- | --- |
| Matriz resistiva 15 × 15 com Velostat | Protótipo acessível com 225 pontos de leitura | Resolução discreta, sensibilidade não uniforme, crosstalk e histerese exigem ensaios |
| Dois MUX CD74HC4067 | Reduzir quantidade de GPIOs necessários à varredura | Tempo de comutação e aquisição afeta a taxa real |
| ESP32 com CSV por USB e Bluetooth Classic SPP | Comunicação simples de inspecionar e consumir por Python/desktop | Sem timestamp, checksum ou contador no formato histórico |
| Python + NumPy/Matplotlib no primeiro protótipo | Validar rapidamente visualização da matriz e parâmetros | Ferramenta experimental, sem banco de prontuários |
| Mudar baseline máximo para média de quadros | A versão interativa registra referência por média, manipulável por botão | Efeito quantitativo deve ser medido; não pressupor que um método seja universalmente superior |
| Normalização horizontal da matriz | Ajustar apresentação à orientação da montagem relatada | Confirmar fisicamente posição e convenção anatômica |
| Tauri + React + Rust + SQLite no produto | Centralizar fluxos clínicos e dados em aplicativo desktop local | Necessita builds por plataforma e migrações compatíveis |
| Separar dispositivo real de simulação | Permitir testes sem hardware, identificando a origem dos quadros | Simulação não verifica sensores nem fidelidade física |
| Preservar histórico `Sprint/` | Sustentar rastreabilidade acadêmica das entregas | Registros históricos não equivalem a testes refeitos hoje |
| Excluir instaladores proprietários e dados de participantes do GitHub | Respeitar licenças e privacidade | Referenciar análises sem redistribuir o acervo de terceiros |

## Decisões em aberto

- Validar a curva de calibração por sensel e o valor físico real de força/pressão, incluindo incertezas.
- Medir frequência efetiva, perdas, latência e estabilidade USB/Bluetooth em protótipo físico.
- Registrar esquemático, revisões e medidas finais do tapete, com fotos autorizadas.
- Avaliar as pendências de segurança e manutenção da [revisão 0.2.15](../review/REVISAO_CODIGO_0.2.15_2026-10-22.md) antes de afirmar prontidão clínica.

Os itens em aberto não são critérios para remover a documentação histórica; são limites explicitados ao leitor.
