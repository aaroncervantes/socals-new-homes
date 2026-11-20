import { DatabaseSync } from "node:sqlite";

const base = process.argv[2] ?? "http://127.0.0.1:3456";
const sqlitePath = process.env.SQLITE_PATH;

function payload(overrides = {}) {
  return {
    idempotencyKey: crypto.randomUUID(),
    startedAt: Date.now() - 20_000,
    honeypot: "",
    consent: true,
    consentVersion: "2026-11-20",
    answers: {
      journey: "ready",
      firstName: "Funnel",
      lastName: "Test",
      area: "san-bernardino",
      cities: "Ontario",
      phone: "9095550199",
      price: "under-500",
      preferences: ["beds-4", "incentives"],
      financing: "ready-to-preapprove",
      timeline: "1-3",
    },
    attribution: {
      utmSource: "instagram",
      utmMedium: "bio",
      utmCampaign: "verify",
      utmContent: null,
      utmTerm: null,
      referrer: "https://instagram.com/",
      landingUrl: `${base}/?utm_source=instagram&utm_medium=bio&utm_campaign=verify`,
    },
    ...overrides,
  };
}

async function post(body, headers = {}) {
  const response = await fetch(`${base}/api/leads`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: response.status, json };
}

const health = await fetch(`${base}/api/health`).then(async (response) => ({
  status: response.status,
  json: await response.json(),
}));

const lead = payload();
const created = await post(lead);
const duplicate = await post(lead);
const badPhone = await post(payload({ answers: { ...lead.answers, phone: "123" } }));
const browsing = await post(payload({ answers: { ...lead.answers, journey: "browsing" } }));
const fast = await post(payload({ startedAt: Date.now() }));
const honeypot = await post(payload({ honeypot: "https://spam.example" }));
const blocked = await post(payload(), { origin: "https://evil.example" });
const event = await fetch(`${base}/api/events`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: "form_started",
    questionId: null,
    branch: null,
    sessionId: crypto.randomUUID(),
    utmSource: "instagram",
    utmMedium: null,
    utmCampaign: null,
  }),
});

const report = {
  health,
  created,
  duplicate,
  badPhone: badPhone.status,
  browsing: browsing.status,
  fast: fast.status,
  honeypot: honeypot.status,
  blocked: blocked.status,
  event: event.status,
};

const ok =
  health.status === 200 &&
  health.json.ok === true &&
  created.status === 200 &&
  created.json.ok === true &&
  duplicate.status === 200 &&
  duplicate.json.id === created.json.id &&
  badPhone.status === 400 &&
  browsing.status === 400 &&
  fast.status === 400 &&
  honeypot.status === 200 &&
  blocked.status === 403 &&
  event.status === 204;

let stored = null;
if (sqlitePath) {
  const db = new DatabaseSync(sqlitePath);
  const rows = db.prepare(
    "SELECT id, first_name, last_name, classification, email_status, crm_status, utm_source, utm_medium, utm_campaign, consent, consent_version, cities, price_range, phone_e164 FROM leads",
  ).all();
  const events = db.prepare("SELECT COUNT(*) AS count FROM analytics_events").get();
  stored = { leads: rows, events: Number(events.count) };
  db.close();
}

const storedOk =
  stored &&
  stored.leads.length === 1 &&
  stored.leads[0].first_name === "Funnel" &&
  stored.leads[0].classification === "qualified_lead" &&
  stored.leads[0].email_status === "skipped" &&
  stored.leads[0].crm_status === "skipped" &&
  stored.leads[0].utm_source === "instagram" &&
  stored.leads[0].consent === 1 &&
  stored.leads[0].phone_e164 === "+19095550199" &&
  stored.events >= 1;

console.log(JSON.stringify({ ...report, stored }, null, 2));
if (!ok || (sqlitePath && !storedOk)) process.exit(1);
