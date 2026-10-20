import type { Page, Role } from '@/types';
export const roleLabels: Record<Role, string> = { admin: 'Administrador', professional: 'Profissional', assistant: 'Secretário' };
export function isAdmin(role?: Role) { return role === 'admin'; }
export function isClinical(role?: Role) { return role === 'admin' || role === 'professional'; }
export function canPage(role: Role | undefined, page: Page) {
  if (!role) return false;
  if (['patients', 'exams', 'settings', 'agenda'].includes(page)) return true;
  if (['calibration', 'users'].includes(page)) return isAdmin(role);
  return isClinical(role);
}
export function canSettings(role: Role | undefined, tab: string) { return tab === 'general' ? !!role : isAdmin(role); }
