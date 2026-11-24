import assert from "node:assert/strict";
import { test } from "node:test";
import { leadEmailFields, leadEmailHtml, leadEmailText } from "../src/server/email.ts";
import type { LeadRecord } from "../src/server/db.ts";

function sample(overrides: Partial<LeadRecord> = {}): LeadRecord {
  return {
    id: "lead-1",
    idempotencyKey: "11111111-1111-4111-8111-111111111111",
    createdAt: "2026-11-24T20:33:00.000Z",
    firstName: "Email",
    lastName: "SmokeTest",
    phoneDisplay: "(909) 555-0199",
    phoneE164: "+19095550199",
    journey: "ready",
    area: "riverside",
    areaOther: null,
    priceRange: "500-750",
    financing: "ready-to-preapprove",
    timeline: "1-3",
    classification: "qualified_lead",
    consent: true,
    consentAt: "2026-11-24T20:33:00.000Z",
    consentVersion: "2026-11-20",
    utmSource: "agent-smoke",
    utmMedium: "railway",
    utmCampaign: "email-config",
    utmContent: null,
    utmTerm: null,
    referrer: "https://instagram.com/",
    landingUrl: "https://web-production-a651e071.up.railway.app/",
    userAgent: "test",
    emailStatus: "pending",
    emailError: null,
    crmStatus: "pending",
    crmError: null,
    ...overrides,
  };
}

test("lead email omits UTMs, referrer, and empty typed area", () => {
  const labels = leadEmailFields(sample()).map((field) => field.label);
  assert.deepEqual(labels, [
    "Name",
    "Phone",
    "Classification",
    "Buying stage",
    "Area",
    "Budget",
    "Financing",
    "Timeline",
    "Landing page",
    "Submitted",
  ]);
  assert.equal(labels.includes("UTM source"), false);
  assert.equal(labels.includes("Referrer"), false);
  assert.equal(labels.includes("Typed area"), false);
});

test("lead email includes typed area only when filled", () => {
  const labels = leadEmailFields(sample({ area: "other", areaOther: " Temecula " })).map(
    (field) => field.label,
  );
  assert.equal(labels.includes("Typed area"), true);
});

test("branded html has no empty dashes and plugs the logo", () => {
  const html = leadEmailHtml(sample({ areaOther: null, utmContent: null, referrer: null }));
  assert.match(html, /logo-email\.png/);
  assert.match(html, /#c9a84c/);
  assert.match(html, /#f7f5f2/);
  assert.equal(html.includes(">——<") || html.includes(">——</") || html.includes(">—<"), false);
  assert.equal(html.includes("UTM"), false);
  assert.equal(html.includes("Referrer"), false);
  const text = leadEmailText(sample());
  assert.match(text, /Name: Email SmokeTest/);
  assert.equal(text.includes("UTM"), false);
});
