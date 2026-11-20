import type { Answers } from "@/lib/form/types";

export function fillCopy(template: string, answers: Partial<Answers>): string {
  const name = typeof answers.firstName === "string" ? answers.firstName.trim() : "";
  return template.replaceAll("{firstName}", name || "there");
}
