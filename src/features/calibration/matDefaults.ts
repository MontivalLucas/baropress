import type { Mat } from "@/services/calibration/types";

// Medidas cadastradas do BAROPRESS, documentadas em Sprint/Documentacao_TCC/
// DOCUMENTACAO_PROTOTIPO_E_TESTE_PILOTO.txt, seções 2.1 e 3.1.
// Áreas/centros das células e capacidade não foram determinados nesse registro.
export function createMatDefaults(existing?: Mat): Mat {
  if (existing) {
    const copy = structuredClone(existing);
    copy.id = "";
    delete copy.createdAt;
    return copy;
  }
  return {
    id: "", identity: "Tapete BAROPRESS", revision: "Medição 1", firmware: "Não identificada",
    widthMm: 300, heightMm: 300, pitchXMm: 20, pitchYMm: 20, stripWidthMm: 10,
    layers: "Matriz de 15 linhas e 15 colunas, totalizando 225 cruzamentos.\nFitas de cobre com largura de 10 mm.\nVão livre entre fitas adjacentes de 10 mm.\nPasso entre centros de 20 mm nos eixos X e Y.\nDimensões informadas da região de medição: 300 x 300 mm.\nMaterial sensível, sequência das camadas, resistores, espessuras e margens nas bordas: conferir e complementar.",
    capacityKg: null, orientation: "RAW_FLIP_X",
    cells: Array.from({ length: 225 }, () => ({ xMm: null, yMm: null, areaMm2: null, enabled: true, reason: "" })),
  };
}
