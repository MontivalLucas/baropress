export type CalendarView = "day" | "week" | "month";
export function localDate(date = new Date()): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function parse(date: string) { return new Date(`${date}T12:00:00`); }
export function shiftCalendar(date: string, view: CalendarView, direction: number) {
    const d = parse(date);
    if (view === "month") {
        d.setDate(1);
        d.setMonth(d.getMonth() + direction);
    }
    else
        d.setDate(d.getDate() + direction * (view === "week" ? 7 : 1));
    return localDate(d);
}
export function calendarDays(date: string, view: CalendarView): string[] {
    const d = parse(date);
    if (view === "month")
        d.setDate(1);
    if (view !== "day")
        d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return Array.from({ length: view === "month" ? 42 : view === "week" ? 7 : 1 }, (_, i) => { const day = new Date(d); day.setDate(d.getDate() + i); return localDate(day); });
}
export function validAppointmentTimes(start: string, end: string) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(start) && /^([01]\d|2[0-3]):[0-5]\d$/.test(end) && start < end; }
export const appointmentStatuses = { scheduled: "Agendado", confirmed: "Confirmado", done: "Realizado", cancelled: "Cancelado" } as const;
