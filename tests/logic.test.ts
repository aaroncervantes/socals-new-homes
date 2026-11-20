import assert from "node:assert/strict";
import { test } from "node:test";
import { getCampaign } from "../src/lib/campaigns.ts";
import { CONSENT_VERSION } from "../src/lib/consent.ts";
import { classifyLead } from "../src/lib/form/classification.ts";
import { buildPath, isValidHistory } from "../src/lib/form/branching.ts";
import { validateScreenGraph } from "../src/lib/form/config.ts";
import { formatUsPhone, phoneError } from "../src/lib/form/phone.ts";
import { progressFor, questionNumber } from "../src/lib/form/progress.ts";
import { parseSubmission } from "../src/lib/form/validation.ts";
import type { Answers } from "../src/lib/form/types.ts";

const qualified: Answers = {
  journey: "ready",
  firstName: "Alex",
  lastName: "Rivera",
  area: "san-bernardino",
  cities: "Corona",
  phone: "(909) 555-0199",
  price: "under-500",
  preferences: ["beds-3", "quick-move-in"],
  financing: "preapproved",
  timeline: "asap",
  consent: true,
};

test("screen graph is connected", () => {
  assert.doesNotThrow(() => validateScreenGraph());
});

test("qualified path matches the written question order", () => {
  const path = buildPath({ journey: "ready" });
  assert.deepEqual(path, [
    "welcome",
    "journey",
    "first-name",
    "last-name",
    "area",
    "phone",
    "price",
    "preferences",
    "financing",
    "timeline",
    "confirm",
    "success",
  ]);
  assert.equal(questionNumber("journey", { journey: "ready" }), 1);
  assert.equal(questionNumber("area", { journey: "ready" }), 4);
  assert.equal(questionNumber("confirm", { journey: "ready" }), 10);
  assert.equal(progressFor("welcome", { journey: "ready" }), 0);
  assert.equal(progressFor("success", { journey: "ready" }), 1);
});

test("browsing path stays out of the buyer questions", () => {
  const path = buildPath({ journey: "browsing" });
  assert.deepEqual(path, ["welcome", "journey", "browsing", "browsing-done"]);
  assert.equal(path.includes("phone"), false);
  assert.equal(progressFor("browsing-done", { journey: "browsing" }), 1);
  assert.equal(
    isValidHistory(["welcome", "journey", "browsing"], { journey: "browsing" }),
    true,
  );
  assert.equal(
    isValidHistory(["welcome", "journey", "first-name"], { journey: "browsing" }),
    false,
  );
});

test("classification rules", () => {
  assert.equal(classifyLead({ journey: "browsing" }), "browser");
  assert.equal(classifyLead({ journey: "researching", timeline: "asap" }), "nurture_lead");
  assert.equal(classifyLead({ journey: "ready", timeline: "exploring" }), "qualified_lead");
  assert.equal(classifyLead({ journey: "ready", timeline: "6-plus" }), "qualified_lead");
  assert.equal(classifyLead({ journey: "soon", timeline: "asap" }), "qualified_lead");
  assert.equal(classifyLead({ journey: "soon", timeline: "3-6" }), "qualified_lead");
  assert.equal(classifyLead({ journey: "soon", timeline: "6-plus" }), "nurture_lead");
  assert.equal(classifyLead({ journey: "soon", timeline: "exploring" }), "nurture_lead");
  assert.equal(classifyLead({ journey: "ready", price: "under-500" } as never), "qualified_lead");
});

test("phone formatting and validation", () => {
  assert.equal(formatUsPhone("9095550199"), "(909) 555-0199");
  assert.equal(formatUsPhone("+1 (909) 555-0199"), "(909) 555-0199");
  assert.equal(phoneError("909555"), "Enter a complete phone number.");
  assert.equal(phoneError("0000000000"), "Enter a valid US phone number.");
  assert.equal(phoneError("1111111111"), "Enter a valid US phone number.");
  assert.equal(phoneError("(909) 406-6560"), null);
});

test("submission accepts a low budget and rejects a browser payload", () => {
  const ok = parseSubmission(payload(qualified));
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.value.price, "under-500");
    assert.equal(ok.value.phoneE164, "+19095550199");
    assert.equal(ok.value.cities, "Corona");
  }
  const browsing = parseSubmission(payload({ ...qualified, journey: "browsing" }));
  assert.equal(browsing.ok, false);
  const fast = parseSubmission({ ...payload(qualified), startedAt: Date.now() });
  assert.equal(fast.ok, false);
  const noConsent = parseSubmission({ ...payload(qualified), consent: false });
  assert.equal(noConsent.ok, false);
});

test("other area stores a short typed value and ignores it otherwise", () => {
  const missing = parseSubmission(payload({ ...qualified, area: "other", areaOther: "   " }));
  assert.equal(missing.ok, false);
  const typed = parseSubmission(payload({ ...qualified, area: "other", areaOther: "Temecula" }));
  assert.equal(typed.ok, true);
  if (typed.ok) {
    assert.equal(typed.value.area, "other");
    assert.equal(typed.value.areaOther, "Temecula");
  }
  const listed = parseSubmission(payload({ ...qualified, area: "riverside", areaOther: "Temecula" }));
  assert.equal(listed.ok, true);
  if (listed.ok) assert.equal(listed.value.areaOther, null);
  const long = parseSubmission(payload({ ...qualified, area: "other", areaOther: "x".repeat(61) }));
  assert.equal(long.ok, false);
});

test("campaign presets prefill a listed county and city", () => {
  assert.equal(getCampaign("Corona")?.cities, "Corona");
  assert.equal(getCampaign("Corona")?.area, "riverside");
  assert.equal(getCampaign("rancho-cucamonga")?.area, "san-bernardino");
  assert.equal(getCampaign("missing"), null);
});

function payload(answers: Answers) {
  return {
    idempotencyKey: crypto.randomUUID(),
    startedAt: Date.now() - 20_000,
    consent: true,
    consentVersion: CONSENT_VERSION,
    answers,
    attribution: {
      utmSource: "instagram",
      utmMedium: "bio",
      utmCampaign: "launch",
      utmContent: null,
      utmTerm: null,
      referrer: "https://instagram.com/",
      landingUrl: "https://example.com/?utm_source=instagram",
    },
  };
}
