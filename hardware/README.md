# Construção do tapete baropodométrico

O protótipo utiliza **Velostat**, fitas condutoras de cobre e multiplexação de uma **matriz 15 × 15 (225 sensels)**. Um sensel é o ponto de cruzamento medido na matriz; não corresponde necessariamente a um componente sensor discreto.

**Fontes locais**: `Contexto.txt` e `PROJETO TCC - FASES.txt` da pasta histórica, [firmware](../firmware/esp32/tapete.ino), e [relatório existente de protótipo e piloto](../Sprint/Documentacao_TCC/DOCUMENTACAO_PROTOTIPO_E_TESTE_PILOTO.txt). As dimensões informadas no relatório são **dados cadastrados**, dependentes de conferência física:

| Propriedade | Registro disponível | Grau de confirmação |
| --- | --- | --- |
| Região sensora | 300 × 300 mm | Cadastro no sistema, não medição conferida nesta etapa |
| Passo entre centros de células | 20 mm em X/Y | Cadastro |
| Largura das fitas de cobre | 10 mm | Cadastro |
| Vão livre entre fitas | 10 mm | Cadastro |
| Número de posições | 225 (15 × 15) | Firmware e software |
| Camadas de EVA, revestimento e encaixe | Não suficientemente descritos | Pendente de registro físico |
| Dimensões externas e espessura final | Não comprovadas | Pendente |

## Registro de montagem a completar

Antes de uma reprodução ou apresentação científica, registrar fotos **autorizadas e sem pessoas identificáveis** das camadas, das conexões e do tapete final; indicar ordem dos materiais, isolamento, fixação, resistor/referência do divisor resistivo, esquema elétrico, tensão aplicada, posição dos MUX e proteção dos fios. Confirmar a área útil com régua/paquímetro e acrescentar identificação da revisão física e data do teste.

As fotos podem ser colocadas em `hardware/imagens/` após revisão manual de privacidade e direitos. Não foram publicadas automaticamente as imagens da pasta `Baroscan/` porque incluem referência comercial e materiais sem confirmação de autorização para redistribuição.

Ver [componentes](COMPONENTES.md), [pinagem](PINAGEM_ESP32.md), [matriz](MATRIZ_SENSORES.md), [limitações experimentais](../docs/validacao/LIMITACOES.md).
