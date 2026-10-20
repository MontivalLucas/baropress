import { create } from "zustand";

export interface NavigationIssue { message: string; blocked?: boolean }
type Guard = (closing: boolean) => NavigationIssue | null;
const guards = new Set<Guard>();
export function registerNavigationGuard(guard: Guard) {
  guards.add(guard);
  return () => { guards.delete(guard); };
}
export function navigationIssue(closing = false): NavigationIssue | null {
  const issues = [...guards].map(guard => guard(closing)).filter((issue): issue is NavigationIssue => !!issue);
  return issues.find(issue => issue.blocked) ?? issues[0] ?? null;
}
export const useNavigationDialog = create<{ issue: NavigationIssue | null; action: (() => void) | null }>(() => ({ issue: null, action: null }));
export function requestNavigation(action: () => void, closing = false) {
  const issue = navigationIssue(closing);
  if (issue) useNavigationDialog.setState({ issue, action });
  else action();
}
export function cancelNavigation() { useNavigationDialog.setState({ issue: null, action: null }); }
export function confirmNavigation() {
  const { action, issue } = useNavigationDialog.getState();
  if (!action || issue?.blocked) return;
  const current = navigationIssue();
  if (current?.blocked) { useNavigationDialog.setState({ issue: current }); return; }
  cancelNavigation();
  action();
}
export function clearNavigationGuards() { guards.clear(); cancelNavigation(); }
