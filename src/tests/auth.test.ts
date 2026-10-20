import { describe, expect, it } from "vitest";
import { passwordError } from "@/features/auth/authValidation";
describe("Auditoria — validações de senha", () => {
  it("recusa senha curta, sem letras/números ou previsível", () => {
    for (const password of ["curta1", "semnumeroalgum", "123456789012", "password1234", " ContaTeste123"]) expect(passwordError(password, password)).toBeTruthy();
  });
  it("exige confirmação idêntica", () => expect(passwordError("ContaTeste!2026", "ContaTeste!2027")).toContain("confirmação"));
  it("aceita frase longa com Unicode e número", () => expect(passwordError("Minha frase ç 2026", "Minha frase ç 2026")).toBeNull());
  it("recusa senha acima de 128 caracteres", () => { const p = "a1".repeat(65); expect(passwordError(p, p)).toBeTruthy(); });
});
