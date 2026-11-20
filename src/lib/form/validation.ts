import { cleanAttribution, type Attribution } from "@/lib/attribution";
import { CONSENT_VERSION } from "@/lib/consent";
import { intEnv } from "@/lib/env";
import { getScreen, optionIds } from "@/lib/form/config";
import { formatUsPhone, phoneError, toE164 } from "@/lib/form/phone";
import type { Answers, AreaId, FinancingId, JourneyId, PreferenceId, PriceId, Screen, TimelineId } from "@/lib/form/types";

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
  cities: string | null;
  price: PriceId;
  preferences: PreferenceId[];
  financing: FinancingId;
  timeline: TimelineId;
  consent: true;
  consentVersion: string;
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
    if (screen.extra) {
      const cities = answers.cities;
      if (typeof cities === "string" && cleanLine(cities).length > 200) {
        return "Please shorten the cities list.";
      }
      if (typeof cities === "string" && /[<>]/.test(cities)) {
        return "Please remove special characters from the cities list.";
      }
    }
    return null;
  }

  if (screen.type === "multi") {
    const values = answers.preferences;
    const allowed = new Set(optionIds("preferences"));
    if (!values || values.length === 0) return "Choose at least one option.";
    if (values.some((id) => !allowed.has(id))) return "Choose at least one option.";
    return null;
  }

  if (screen.type === "confirm") {
    if (answers.consent !== true) return "Please agree to be contacted so we can follow up.";
    return null;
  }

  return null;
}

function oneOf<T extends string>(value: unknown, allowed: readonly string[]): T | null {
  if (typeof value !== "string") return null;
  return allowed.includes(value) ? (value as T) : null;
}

function parseCities(value: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, error: "Please check the cities you entered." };
  const cleaned = cleanLine(value);
  if (!cleaned) return { ok: true, value: null };
  if (cleaned.length > 200) return { ok: false, error: "Please shorten the cities list." };
  if (/[<>]/.test(cleaned)) return { ok: false, error: "Please remove special characters from the cities list." };
  return { ok: true, value: cleaned };
}

function parsePreferences(value: unknown): PreferenceId[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) return null;
  const allowed = new Set(optionIds("preferences"));
  const ids: PreferenceId[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !allowed.has(item) || ids.includes(item as PreferenceId)) return null;
    ids.push(item as PreferenceId);
  }
  if (ids.includes("unsure") && ids.length > 1) return ids.filter((id) => id !== "unsure");
  return ids;
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
  if (record.consent !== true || record.consentVersion !== CONSENT_VERSION) {
    return { ok: false, error: "Please agree to be contacted so we can follow up." };
  }
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
  const cities = parseCities(bag.cities);
  if (!cities.ok) return cities;
  const phone = typeof bag.phone === "string" ? bag.phone : "";
  const phoneProblem = phoneError(phone);
  if (phoneProblem) return { ok: false, error: phoneProblem };
  const price = oneOf<PriceId>(bag.price, optionIds("price"));
  if (!price) return { ok: false, error: "Choose a price range." };
  const preferences = parsePreferences(bag.preferences);
  if (!preferences) return { ok: false, error: "Choose at least one home preference." };
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
      cities: cities.value,
      price,
      preferences,
      financing,
      timeline,
      consent: true,
      consentVersion: CONSENT_VERSION,
      attribution: cleanAttribution(record.attribution),
    },
  };
}
