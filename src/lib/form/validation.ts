import { cleanAttribution, type Attribution } from "@/lib/attribution";
import { CONSENT_VERSION } from "@/lib/consent";
import { intEnv } from "@/lib/env";
import { getScreen, optionIds } from "@/lib/form/config";
import { formatUsPhone, phoneError, toE164 } from "@/lib/form/phone";
import type { Answers, AreaId, FinancingId, JourneyId, PriceId, Screen, TimelineId } from "@/lib/form/types";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NAME = /^[\p{L}][\p{L}\s.'’\-]*$/u;

const QUALIFIED_JOURNEYS = new Set(["ready", "soon", "researching"]);

export type QualifiedJourney = Exclude<JourneyId, "browsing">;

export type Submission = {
  idempotencyKey: string;
  startedAt: number;
  firstName: string;
  lastName: string;
  phoneDisplay: string;
  phoneE164: string;
  journey: QualifiedJourney;
  area: AreaId;
  areaOther: string | null;
  price: PriceId;
  financing: FinancingId;
  timeline: TimelineId;
  consent: boolean;
  consentVersion: string | null;
  attribution: Attribution;
};

export type ParseResult = { ok: true; value: Submission } | { ok: false; error: string };

function cleanLine(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
}

export function validateName(value: unknown, label: "first" | "last"): string | null {
  const cleaned = cleanLine(value);
  if (!cleaned) return label === "first" ? "Please enter your first name." : "Please enter your last name.";
  if (cleaned.length > 40 || !NAME.test(cleaned)) return "Please use letters in your name.";
  return null;
}

export function normalizeName(value: string): string {
  return cleanLine(value);
}

export function validateScreen(screen: Screen, answers: Partial<Answers>): string | null {
  if (screen.type === "welcome" || screen.type === "info" || screen.type === "done") return null;

  if (screen.type === "text") {
    const label = screen.field === "lastName" ? "last" : "first";
    return validateName(answers[screen.field ?? "firstName"], label);
  }

  if (screen.type === "phone") {
    return phoneError(typeof answers.phone === "string" ? answers.phone : "");
  }

  if (screen.type === "single" && screen.field) {
    const value = answers[screen.field];
    const allowed = new Set(screen.options?.map((option) => option.id));
    if (typeof value !== "string" || !allowed.has(value)) return "Please choose an answer.";
    if (screen.field === "area" && value === "other") {
      const typed = parseAreaOther("other", answers.areaOther);
      if (!typed.ok) return typed.error;
    }
    return null;
  }

  if (screen.type === "confirm") return null;

  return null;
}

function oneOf<T extends string>(value: unknown, allowed: readonly string[]): T | null {
  if (typeof value !== "string") return null;
  return allowed.includes(value) ? (value as T) : null;
}

function parseAreaOther(
  area: string,
  value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (area !== "other") return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, error: "Please type the area." };
  const cleaned = cleanLine(value);
  if (!cleaned) return { ok: false, error: "Please type the area." };
  if (cleaned.length > 60) return { ok: false, error: "Please shorten the area." };
  if (/[<>]/.test(cleaned)) return { ok: false, error: "Please remove special characters from the area." };
  return { ok: true, value: cleaned };
}

export function parseSubmission(body: unknown): ParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "That submission could not be read." };
  }
  const record = body as Record<string, unknown>;
  if (typeof record.idempotencyKey !== "string" || !UUID.test(record.idempotencyKey)) {
    return { ok: false, error: "That submission could not be read." };
  }
  if (typeof record.startedAt !== "number" || !Number.isFinite(record.startedAt)) {
    return { ok: false, error: "Please refresh the page and try again." };
  }
  const elapsed = Date.now() - record.startedAt;
  const minimum = intEnv("MIN_SUBMIT_MS", 2500);
  if (record.startedAt > Date.now() + 60_000 || elapsed > 1000 * 60 * 60 * 24 * 30) {
    return { ok: false, error: "Please refresh the page and try again." };
  }
  if (elapsed < minimum) {
    return { ok: false, error: "Please take a moment and submit again." };
  }
  const consented = record.consent === true && record.consentVersion === CONSENT_VERSION;
  const answers = record.answers;
  if (!answers || typeof answers !== "object") {
    return { ok: false, error: "Please check your answers and try again." };
  }
  const bag = answers as Record<string, unknown>;
  const journey = oneOf<QualifiedJourney>(
    bag.journey,
    [...QUALIFIED_JOURNEYS],
  );
  if (!journey) {
    return { ok: false, error: "Tell us where you are in your home search." };
  }
  const firstError = validateName(bag.firstName, "first");
  if (firstError) return { ok: false, error: firstError };
  const lastError = validateName(bag.lastName, "last");
  if (lastError) return { ok: false, error: lastError };
  const area = oneOf<AreaId>(bag.area, optionIds("area"));
  if (!area) return { ok: false, error: "Choose the area you’re interested in." };
  const areaOther = parseAreaOther(area, bag.areaOther);
  if (!areaOther.ok) return areaOther;
  const phone = typeof bag.phone === "string" ? bag.phone : "";
  const phoneProblem = phoneError(phone);
  if (phoneProblem) return { ok: false, error: phoneProblem };
  const price = oneOf<PriceId>(bag.price, optionIds("price"));
  if (!price) return { ok: false, error: "Choose a price range." };
  const financing = oneOf<FinancingId>(bag.financing, optionIds("financing"));
  if (!financing) return { ok: false, error: "Tell us where financing stands." };
  const timeline = oneOf<TimelineId>(bag.timeline, optionIds("timeline"));
  if (!timeline) return { ok: false, error: "Choose a timeline." };
  const e164 = toE164(phone);
  if (!e164) return { ok: false, error: "Enter a valid US phone number." };

  getScreen("confirm");

  return {
    ok: true,
    value: {
      idempotencyKey: record.idempotencyKey,
      startedAt: record.startedAt,
      firstName: normalizeName(String(bag.firstName)),
      lastName: normalizeName(String(bag.lastName)),
      phoneDisplay: formatUsPhone(phone),
      phoneE164: e164,
      journey,
      area,
      areaOther: areaOther.value,
      price,
      financing,
      timeline,
      consent: consented,
      consentVersion: consented ? CONSENT_VERSION : null,
      attribution: cleanAttribution(record.attribution),
    },
  };
}
