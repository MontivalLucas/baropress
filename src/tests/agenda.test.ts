import { describe, expect, it } from "vitest";
import { calendarDays, localDate, shiftCalendar, validAppointmentTimes } from "@/features/agenda/calendarUtils";
describe("Fase 8 — calendário", () => {
  it("gera dia, semana a partir de segunda-feira e grade mensal de 42 dias",()=>{expect(calendarDays('2026-10-06','day')).toEqual(['2026-10-06']);const week=calendarDays('2026-10-06','week');expect(week).toHaveLength(7);expect(week[0]).toBe('2026-10-05');const month=calendarDays('2026-10-06','month');expect(month).toHaveLength(42);expect(month[0]).toBe('2026-09-28');});
  it("navega sem transbordar meses de 31 dias e considera ano bissexto",()=>{expect(shiftCalendar('2026-01-31','month',1)).toBe('2026-02-01');expect(shiftCalendar('2024-02-28','day',1)).toBe('2024-02-29');expect(shiftCalendar('2026-12-31','day',1)).toBe('2027-01-01');expect(localDate(new Date(2026,9,6,23))).toBe('2026-10-06');});
  it("rejeita horários inválidos e duração negativa",()=>{expect(validAppointmentTimes('09:00','09:30')).toBe(true);expect(validAppointmentTimes('25:00','26:00')).toBe(false);expect(validAppointmentTimes('09:30','09:00')).toBe(false);expect(validAppointmentTimes('09:00','09:00')).toBe(false);});
});
