import { getScreen, hasScreen } from "@/lib/form/config";
import type { Answers } from "@/lib/form/types";

export function resolveNext(screenId: string, answers: Partial<Answers>): string | null {
  const screen = getScreen(screenId);
  if (screen.branchingRules?.length && screen.field) {
    const value = answers[screen.field];
    if (typeof value !== "string") return null;
    return screen.branchingRules.find((rule) => rule.when === value)?.next ?? null;
  }
  return screen.next ?? null;
}

export function buildPath(answers: Partial<Answers>): string[] {
  const path: string[] = [];
  let current: string | null = "welcome";
  const seen = new Set<string>();

  while (current && !seen.has(current)) {
    seen.add(current);
    path.push(current);
    const screen = getScreen(current);
    if (screen.type === "done") break;
    if (screen.branchingRules?.length && screen.field) {
      const value = answers[screen.field];
      if (typeof value !== "string" || value.length === 0) {
        const fallback =
          screen.branchingRules.find((rule) => rule.when !== "browsing") ??
          screen.branchingRules[0];
        current = fallback?.next ?? null;
        continue;
      }
    }
    current = resolveNext(current, answers);
  }

  return path;
}

export function isValidHistory(history: string[], answers: Partial<Answers>): boolean {
  if (history.length === 0 || history[0] !== "welcome") return false;
  if (!history.every((id) => hasScreen(id))) return false;
  for (let index = 0; index < history.length - 1; index += 1) {
    const current = history[index];
    if (!current) return false;
    const expected = current === "welcome" ? "journey" : resolveNext(current, answers);
    if (expected !== history[index + 1]) return false;
  }
  return true;
}
