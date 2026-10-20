import { describe, expect, it } from "vitest";
import { createMatDefaults } from "@/features/calibration/matDefaults";

describe("Medidas padrão da montagem BAROPRESS", () => {
  it("carrega medidas registradas sem assumir áreas ou capacidade", () => {
    const mat = createMatDefaults();
    expect([mat.widthMm, mat.heightMm, mat.pitchXMm, mat.pitchYMm, mat.stripWidthMm]).toEqual([300, 300, 20, 20, 10]);
    expect(mat.capacityKg).toBeNull();
    expect(mat.cells).toHaveLength(225);
    expect(mat.cells.every(cell => cell.xMm === null && cell.yMm === null && cell.areaMm2 === null)).toBe(true);
  });
  it("prioriza a revisão cadastrada e preserva sua geometria/máscara sem alterar o original", () => {
    const original = createMatDefaults();
    original.id = "salvo"; original.createdAt = "2026-10-08"; original.widthMm = 450;
    original.cells[0] = { xMm: 1, yMm: 2, areaMm2: 30, enabled: false, reason: "Excluída na montagem" };
    const draft = createMatDefaults(original);
    expect(draft.widthMm).toBe(450);
    expect(draft.cells[0]).toEqual(original.cells[0]);
    expect(draft.id).toBe(""); expect(draft.createdAt).toBeUndefined();
    draft.cells[0].reason = "Alteração do rascunho";
    expect(original.cells[0].reason).toBe("Excluída na montagem");
    expect(original.id).toBe("salvo");
  });
});
