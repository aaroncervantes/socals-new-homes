import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { CONSENT_VERSION } from "../src/lib/consent.ts";
import { parseSubmission, type Submission } from "../src/lib/form/validation.ts";

const dir = mkdtempSync(path.join(tmpdir(), "snh-"));

let db: typeof import("../src/server/db.ts");
let leads: typeof import("../src/server/leads.ts");

before(async () => {
  process.env.DATABASE_URL = "";
  process.env.SQLITE_PATH = path.join(dir, "leads.sqlite");
  delete process.env.LEAD_NOTIFICATION_EMAIL;
  delete process.env.EMAIL_API_KEY;
  delete process.env.EMAIL_FROM;
  delete process.env.GHL_WEBHOOK_URL;
  delete process.env.GHL_API_KEY;
  delete process.env.GHL_LOCATION_ID;
  db = await import("../src/server/db.ts");
  leads = await import("../src/server/leads.ts");
  await db.resetDbForTests();
});

after(async () => {
  await db.resetDbForTests();
  rmSync(dir, { recursive: true, force: true });
});

function submission(key = crypto.randomUUID()): Submission {
  const parsed = parseSubmission({
    idempotencyKey: key,
    startedAt: Date.now() - 30_000,
    consent: true,
    consentVersion: CONSENT_VERSION,
    answers: {
      journey: "soon",
      firstName: "Mary-Jane",
      lastName: "O’Brien",
      area: "orange-county",
      phone: "9495550100",
      price: "1m-plus",
      preferences: ["unsure", "adu"],
      financing: "cash",
      timeline: "6-plus",
      consent: true,
    },
    attribution: {
      utmSource: "facebook",
      utmMedium: "paid",
      utmCampaign: "spring",
      utmContent: "reel",
      utmTerm: "new homes",
      referrer: "https://facebook.com/",
      landingUrl: "https://example.com/?utm_source=facebook",
    },
  });
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

test("a lead is stored once, email and CRM are skipped without credentials", async () => {
  const key = crypto.randomUUID();
  const first = await leads.acceptLead(submission(key), "test-agent");
  const second = await leads.acceptLead(submission(key), "test-agent");
  assert.equal(first.id, second.id);
  assert.equal(await db.countLeads(), 1);
  const row = await db.getLead(first.id);
  assert.ok(row);
  assert.equal(row.firstName, "Mary-Jane");
  assert.equal(row.lastName, "O’Brien");
  assert.equal(row.phoneE164, "+19495550100");
  assert.equal(row.classification, "nurture_lead");
  assert.deepEqual(row.preferences, ["adu"]);
  assert.equal(row.areaOther, null);
  assert.equal(row.consent, true);
  assert.equal(row.consentVersion, CONSENT_VERSION);
  assert.equal(row.utmSource, "facebook");
  assert.equal(row.utmTerm, "new homes");
  assert.equal(row.userAgent, "test-agent");
  assert.equal(row.emailStatus, "skipped");
  assert.equal(row.crmStatus, "skipped");
  assert.equal(row.landingUrl?.includes("utm_source=facebook"), true);
});

test("rate limit blocks the third hit in a window", async () => {
  const bucket = `lead:test-${crypto.randomUUID()}`;
  assert.equal(await db.allowRateLimit(bucket, 2, 60_000), true);
  assert.equal(await db.allowRateLimit(bucket, 2, 60_000), true);
  assert.equal(await db.allowRateLimit(bucket, 2, 60_000), false);
});
