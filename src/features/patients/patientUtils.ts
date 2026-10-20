/**
 * Utilitários de validação, formatação e cálculo clínico para pacientes.
 */

export function cleanDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Formata string de dígitos como CPF (000.000.000-00) */
export function formatCpf(value: string): string {
  const digits = cleanDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/** Validação algorítmica de CPF brasileiro (módulo 11) */
export function validateCpf(value: string): boolean {
  const digits = cleanDigits(value);
  if (digits.length !== 11) return false;
  // Rejeita sequências repetidas como 11111111111
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(digits[i], 10) * (10 - i);
  }
  let rev = (sum * 10) % 11;
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== Number.parseInt(digits[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(digits[i], 10) * (11 - i);
  }
  rev = (sum * 10) % 11;
  if (rev === 10 || rev === 11) rev = 0;
  return rev === Number.parseInt(digits[10], 10);
}

/** Formata telefone brasileiro com 10 ou 11 dígitos */
export function formatPhone(value: string): string {
  const digits = cleanDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/** Calcula a idade em anos a partir da data de nascimento (YYYY-MM-DD) */
export function calculateAge(birthDate: string | null, reference: Date = new Date()): number | null {
  if (!birthDate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match || !Number.isFinite(reference.getTime())) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const birth = new Date(year, month - 1, day, 12);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) return null;
  let age = reference.getFullYear() - year;
  const m = reference.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && reference.getDate() < day)) {
    age--;
  }
  return age >= 0 ? age : null;
}

/** Formata data YYYY-MM-DD para DD/MM/YYYY */
export function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  const parts = dateString.split("T")[0].split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

/** Formata timestamp completo para DD/MM/YYYY HH:mm */
export function formatDateTime(dateTimeString: string | null): string {
  if (!dateTimeString) return "—";
  try {
    const normalized=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateTimeString)?dateTimeString.replace(' ','T')+'Z':dateTimeString;
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return dateTimeString;
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateTimeString;
  }
}

export interface BmiResult {
  value: number;
  label: string;
  badgeColor: string;
}
export function formatHeight(height: number | null | undefined): string {
  if (height == null || !Number.isFinite(height) || height <= 0) return "Não disponível";
  const cm = height > 3 ? height : height * 100;
  return `${Number(cm.toFixed(1))} cm`;
}

/**
 * Calcula Índice de Massa Corporal (IMC) e fornece classificação OMS.
 * @param weightKg peso em quilogramas
 * @param heightCm altura em centímetros (ou metros se <= 2.5)
 */
export function calculateBmi(weightKg: number | null, heightCm: number | null): BmiResult | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  // Normaliza altura: se foi digitado em metros (ex: 1.75) ou cm (ex: 175)
  const heightM = heightCm > 3 ? heightCm / 100 : heightCm;
  if (heightM <= 0) return null;

  const bmi = weightKg / (heightM * heightM);
  const rounded = Math.round(bmi * 10) / 10;

  if (bmi < 18.5) {
    return { value: rounded, label: "Abaixo do peso", badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
  }
  if (bmi < 25) {
    return { value: rounded, label: "Peso normal", badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
  }
  if (bmi < 30) {
    return { value: rounded, label: "Sobrepeso", badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
  }
  if (bmi < 35) {
    return { value: rounded, label: "Obesidade grau I", badgeColor: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
  }
  if (bmi < 40) {
    return { value: rounded, label: "Obesidade grau II", badgeColor: "text-rose-600 bg-rose-600/10 border-rose-600/20" };
  }
  return { value: rounded, label: "Obesidade grau III", badgeColor: "text-red-700 bg-red-700/10 border-red-700/20" };
}
