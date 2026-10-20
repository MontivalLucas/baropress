import { describe, it, expect } from "vitest";
import {
  cleanDigits,
  formatCpf,
  validateCpf,
  formatPhone,
  calculateAge,
  formatDate,
  formatDateTime,
  calculateBmi,
} from "../features/patients/patientUtils";

describe("patientUtils - Validação e Formatação de Dados Clínicos", () => {
  it("usa datas civis e a data do exame para calcular idade", () => {
    expect(calculateAge("2003-05-09", new Date(2026, 4, 8, 12))).toBe(22);
    expect(calculateAge("2003-05-09", new Date(2026, 4, 9, 12))).toBe(23);
    expect(calculateAge("2003-05-09", new Date(2027, 4, 9, 12))).toBe(24);
    expect(calculateAge("2023-02-29")).toBeNull();
    expect(calculateAge("2024-02-29", new Date(2026, 2, 1, 12))).toBe(2);
  });
  it("interpreta o timestamp UTC do SQLite antes de mostrar o horário local",()=>{expect(formatDateTime('2026-10-07 12:00:00')).toBe(formatDateTime('2026-10-07T12:00:00Z'));});
  it("limpa pontuações de dígitos corretamente", () => {
    expect(cleanDigits("123.456.789-00")).toBe("12345678900");
    expect(cleanDigits("(11) 98765-4321")).toBe("11987654321");
    expect(cleanDigits("")).toBe("");
  });

  it("formata CPF com máscara padrão", () => {
    expect(formatCpf("11144477735")).toBe("111.444.777-35");
    expect(formatCpf("123")).toBe("123");
    expect(formatCpf("1234")).toBe("123.4");
    expect(formatCpf("1234567")).toBe("123.456.7");
  });

  it("valida algoritmo do CPF brasileiro", () => {
    // CPF matematicamente válido
    expect(validateCpf("11144477735")).toBe(true);
    expect(validateCpf("111.444.777-35")).toBe(true);
    expect(validateCpf("52998224725")).toBe(true);

    // CPFs com dígitos verificadores incorretos
    expect(validateCpf("11144477736")).toBe(false);
    expect(validateCpf("12345678901")).toBe(false);

    // CPFs com todos dígitos repetidos
    expect(validateCpf("11111111111")).toBe(false);
    expect(validateCpf("00000000000")).toBe(false);

    // CPFs com tamanho incompleto
    expect(validateCpf("12345")).toBe(false);
  });

  it("formata telefones com 10 e 11 dígitos", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
    expect(formatPhone("11")).toBe("(11");
  });

  it("calcula idade em anos corretamente a partir de nascimento", () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const birthDate = `${currentYear - 30}-01-01`;
    const age = calculateAge(birthDate);
    expect(age).toBeGreaterThanOrEqual(29);
    expect(age).toBeLessThanOrEqual(30);

    expect(calculateAge(null)).toBeNull();
    expect(calculateAge("invalid-date")).toBeNull();
  });

  it("formata datas YYYY-MM-DD para DD/MM/YYYY", () => {
    expect(formatDate("1995-12-25")).toBe("25/12/1995");
    expect(formatDate(null)).toBe("—");
  });

  it("calcula IMC com classificação OMS correta", () => {
    // 70 kg, 175 cm => IMC 22.9 (Peso normal)
    const normal = calculateBmi(70, 175);
    expect(normal).not.toBeNull();
    expect(normal?.value).toBe(22.9);
    expect(normal?.label).toBe("Peso normal");

    // 95 kg, 175 cm => IMC 31.0 (Obesidade grau I)
    const obeso = calculateBmi(95, 175);
    expect(obeso?.value).toBe(31);
    expect(obeso?.label).toBe("Obesidade grau I");

    // Aceita altura em metros também (1.75)
    const metros = calculateBmi(70, 1.75);
    expect(metros?.value).toBe(22.9);

    // Valores nulos ou inválidos
    expect(calculateBmi(null, 175)).toBeNull();
    expect(calculateBmi(70, null)).toBeNull();
    expect(calculateBmi(0, 175)).toBeNull();
  });
});
