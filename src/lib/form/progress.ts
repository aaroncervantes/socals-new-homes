import { buildPath } from "@/lib/form/branching";
import { getScreen } from "@/lib/form/config";
import type { Answers } from "@/lib/form/types";

export function questionNumber(screenId: string, answers: Partial<Answers>): number | null {
  const screen = getScreen(screenId);
  if (screen.type === "welcome" || screen.type === "done") return null;
  const numbered = buildPath(answers).filter((id) => {
    const item = getScreen(id);
    return item.type !== "welcome" && item.type !== "done";
  });
  const index = numbered.indexOf(screenId);
  return index === -1 ? null : index + 1;
}

export function progressFor(screenId: string, answers: Partial<Answers>): number {
  const path = buildPath(answers);
  const index = path.indexOf(screenId);
  if (index <= 0) return 0;
  const last = path.length - 1;
  if (last <= 0) return 0;
  return index / last;
}
