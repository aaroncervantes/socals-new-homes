import { readAttribution, type Attribution } from "@/lib/attribution";
import { getCampaign } from "@/lib/campaigns";
import { isValidHistory } from "@/lib/form/branching";
import { isAreaId } from "@/lib/form/config";
import type { Answers } from "@/lib/form/types";

const KEY = "snh.funnel.v1";

export type PersistedFunnel = {
  version: 1;
  history: string[];
  answers: Answers;
  idempotencyKey: string;
  sessionId: string;
  startedAt: number | null;
  attribution: Attribution;
};

export function createInitial(
  attribution: Attribution,
  prefill: Partial<Answers> = {},
): PersistedFunnel {
  return {
    version: 1,
    history: ["welcome"],
    answers: { ...prefill },
    idempotencyKey: crypto.randomUUID(),
    sessionId: crypto.randomUUID(),
    startedAt: null,
    attribution,
  };
}

function isPersisted(value: unknown): value is PersistedFunnel {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<PersistedFunnel>;
  return (
    record.version === 1 &&
    Array.isArray(record.history) &&
    !!record.answers &&
    typeof record.answers === "object" &&
    typeof record.idempotencyKey === "string" &&
    typeof record.sessionId === "string" &&
    (record.startedAt === null || typeof record.startedAt === "number") &&
    !!record.attribution
  );
}

export function saveFunnel(state: PersistedFunnel): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode and full storage should not block the funnel.
  }
}

export function clearFunnel(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}

export function restoreFunnel(): PersistedFunnel {
  const params = new URLSearchParams(window.location.search);
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isPersisted(parsed) && isValidHistory(parsed.history, parsed.answers)) {
        return parsed;
      }
    }
  } catch {
    // Fall through to a fresh session.
  }

  const prefill: Partial<Answers> = {};
  const campaign = getCampaign(params.get("campaign"));
  const areaParam = params.get("area");
  if (campaign?.area) prefill.area = campaign.area;
  else if (areaParam && isAreaId(areaParam)) prefill.area = areaParam;
  return createInitial(readAttribution(params), prefill);
}
