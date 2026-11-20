import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import pg from "pg";
import type { Submission } from "@/lib/form/validation";
import { classifyLead } from "@/lib/form/classification";

type SqlValue = SQLInputValue;
type Row = Record<string, unknown>;

export type LeadRecord = {
  id: string;
  idempotencyKey: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  phoneDisplay: string;
  phoneE164: string;
  journey: string;
  area: string;
  areaOther: string | null;
  cities: string | null;
  priceRange: string;
  preferences: string[];
  financing: string;
  timeline: string;
  classification: string;
  consent: boolean;
  consentAt: string | null;
  consentVersion: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  referrer: string | null;
  landingUrl: string | null;
  userAgent: string | null;
  emailStatus: string;
  emailError: string | null;
  crmStatus: string;
  crmError: string | null;
};

type SqliteConn = { kind: "sqlite"; db: DatabaseSync };
type PostgresConn = { kind: "postgres"; pool: pg.Pool };
type Connection = SqliteConn | PostgresConn;

let connecting: Promise<Connection> | null = null;
let queue: Promise<unknown> = Promise.resolve();

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_display TEXT NOT NULL,
    phone_e164 TEXT NOT NULL,
    journey TEXT NOT NULL,
    area TEXT NOT NULL,
    area_other TEXT,
    cities TEXT,
    price_range TEXT NOT NULL,
    preferences TEXT NOT NULL,
    financing TEXT NOT NULL,
    timeline TEXT NOT NULL,
    classification TEXT NOT NULL,
    consent INTEGER NOT NULL,
    consent_at TEXT,
    consent_version TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    referrer TEXT,
    landing_url TEXT,
    user_agent TEXT,
    email_status TEXT NOT NULL,
    email_error TEXT,
    crm_status TEXT NOT NULL,
    crm_error TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    name TEXT NOT NULL,
    question_id TEXT,
    branch TEXT,
    session_id TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    bucket TEXT PRIMARY KEY,
    window_start BIGINT NOT NULL,
    count INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at)`,
  `CREATE INDEX IF NOT EXISTS events_created_at_idx ON analytics_events (created_at)`,
];

function databaseUrl(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  return url ? url : null;
}

function sslOption(url: string): pg.PoolConfig["ssl"] {
  if (
    /sslmode=disable/.test(url) ||
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes(".railway.internal")
  ) {
    return undefined;
  }
  return { rejectUnauthorized: false };
}

function toPg(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function open(): Promise<Connection> {
  const url = databaseUrl();
  if (url && /^postgres(?:ql)?:\/\//i.test(url)) {
    const pool = new pg.Pool({ connectionString: url, ssl: sslOption(url), max: 5 });
    const connection: PostgresConn = { kind: "postgres", pool };
    await applySchema(connection);
    return connection;
  }

  const file = process.env.SQLITE_PATH?.trim() || path.join(process.cwd(), "data", "leads.sqlite");
  await mkdir(path.dirname(file), { recursive: true });
  const { DatabaseSync: SqliteDatabase } = await import("node:sqlite");
  const db = new SqliteDatabase(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000;");
  const connection: SqliteConn = { kind: "sqlite", db };
  await applySchema(connection);
  return connection;
}

async function applySchema(connection: Connection): Promise<void> {
  for (const statement of SCHEMA) {
    if (connection.kind === "sqlite") connection.db.exec(statement);
    else await connection.pool.query(statement);
  }
  if (connection.kind === "sqlite") {
    const columns = connection.db.prepare("PRAGMA table_info(leads)").all() as Array<{ name: string }>;
    if (!columns.some((column) => column.name === "area_other")) {
      connection.db.exec("ALTER TABLE leads ADD COLUMN area_other TEXT");
    }
    return;
  }
  await connection.pool.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS area_other TEXT");
}

function connection(): Promise<Connection> {
  if (!connecting) connecting = open();
  return connecting;
}

function params(values: unknown[]): SqlValue[] {
  return values.map((value) => (value === undefined ? null : (value as SqlValue)));
}

async function get(sql: string, values: unknown[] = []): Promise<Row | null> {
  const current = await connection();
  const bound = params(values);
  if (current.kind === "sqlite") {
    return current.db.prepare(sql).get(...bound) ?? null;
  }
  const result = await current.pool.query(toPg(sql), bound);
  return (result.rows[0] as Row | undefined) ?? null;
}

async function run(sql: string, values: unknown[] = []): Promise<number> {
  const current = await connection();
  const bound = params(values);
  if (current.kind === "sqlite") {
    return Number(current.db.prepare(sql).run(...bound).changes);
  }
  const result = await current.pool.query(toPg(sql), bound);
  return result.rowCount ?? 0;
}

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function text(row: Row, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function nullable(row: Row, key: string): string | null {
  const value = row[key];
  if (value == null || value === "") return null;
  return typeof value === "string" ? value : String(value);
}

function mapLead(row: Row): LeadRecord {
  let preferences: string[] = [];
  try {
    const parsed: unknown = JSON.parse(text(row, "preferences") || "[]");
    if (Array.isArray(parsed)) preferences = parsed.filter((item) => typeof item === "string");
  } catch {
    preferences = [];
  }
  return {
    id: text(row, "id"),
    idempotencyKey: text(row, "idempotency_key"),
    createdAt: text(row, "created_at"),
    firstName: text(row, "first_name"),
    lastName: text(row, "last_name"),
    phoneDisplay: text(row, "phone_display"),
    phoneE164: text(row, "phone_e164"),
    journey: text(row, "journey"),
    area: text(row, "area"),
    areaOther: nullable(row, "area_other"),
    cities: nullable(row, "cities"),
    priceRange: text(row, "price_range"),
    preferences,
    financing: text(row, "financing"),
    timeline: text(row, "timeline"),
    classification: text(row, "classification"),
    consent: Number(row.consent) === 1,
    consentAt: nullable(row, "consent_at"),
    consentVersion: nullable(row, "consent_version"),
    utmSource: nullable(row, "utm_source"),
    utmMedium: nullable(row, "utm_medium"),
    utmCampaign: nullable(row, "utm_campaign"),
    utmContent: nullable(row, "utm_content"),
    utmTerm: nullable(row, "utm_term"),
    referrer: nullable(row, "referrer"),
    landingUrl: nullable(row, "landing_url"),
    userAgent: nullable(row, "user_agent"),
    emailStatus: text(row, "email_status"),
    emailError: nullable(row, "email_error"),
    crmStatus: text(row, "crm_status"),
    crmError: nullable(row, "crm_error"),
  };
}

export async function dbKind(): Promise<"sqlite" | "postgres"> {
  return (await connection()).kind;
}

export async function pingDb(): Promise<void> {
  await get("SELECT 1 AS ok");
}

export async function countLeads(): Promise<number> {
  const row = await get("SELECT COUNT(*) AS count FROM leads");
  return Number(row?.count ?? 0);
}

export async function getLead(id: string): Promise<LeadRecord | null> {
  const row = await get("SELECT * FROM leads WHERE id = ?", [id]);
  return row ? mapLead(row) : null;
}

export async function saveLead(
  submission: Submission,
  userAgent: string | null,
): Promise<LeadRecord> {
  const existing = await get("SELECT * FROM leads WHERE idempotency_key = ?", [
    submission.idempotencyKey,
  ]);
  if (existing) return mapLead(existing);

  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();
  const classification = classifyLead(submission);
  const columns = [
    "id",
    "idempotency_key",
    "created_at",
    "first_name",
    "last_name",
    "phone_display",
    "phone_e164",
    "journey",
    "area",
    "area_other",
    "cities",
    "price_range",
    "preferences",
    "financing",
    "timeline",
    "classification",
    "consent",
    "consent_at",
    "consent_version",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "referrer",
    "landing_url",
    "user_agent",
    "email_status",
    "email_error",
    "crm_status",
    "crm_error",
  ];
  const values = [
    id,
    submission.idempotencyKey,
    createdAt,
    submission.firstName,
    submission.lastName,
    submission.phoneDisplay,
    submission.phoneE164,
    submission.journey,
    submission.area,
    submission.areaOther,
    submission.cities,
    submission.price,
    JSON.stringify(submission.preferences),
    submission.financing,
    submission.timeline,
    classification,
    1,
    createdAt,
    submission.consentVersion,
    submission.attribution.utmSource,
    submission.attribution.utmMedium,
    submission.attribution.utmCampaign,
    submission.attribution.utmContent,
    submission.attribution.utmTerm,
    submission.attribution.referrer,
    submission.attribution.landingUrl,
    userAgent,
    "pending",
    null,
    "pending",
    null,
  ];
  const placeholders = columns.map(() => "?").join(", ");
  const inserted = await get(
    `INSERT INTO leads (${columns.join(", ")}) VALUES (${placeholders})
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING id`,
    values,
  );
  const storedId = inserted ? text(inserted, "id") : "";
  const row = await get("SELECT * FROM leads WHERE idempotency_key = ?", [
    submission.idempotencyKey,
  ]);
  if (!row) throw new Error(storedId ? "lead missing after insert" : "lead was not saved");
  return mapLead(row);
}

export async function claimDelivery(id: string, channel: "email" | "crm"): Promise<boolean> {
  const column = channel === "email" ? "email_status" : "crm_status";
  const changes = await run(
    `UPDATE leads SET ${column} = 'sending' WHERE id = ? AND ${column} IN ('pending', 'failed')`,
    [id],
  );
  return changes === 1;
}

export async function setDelivery(
  id: string,
  channel: "email" | "crm",
  status: "sent" | "skipped" | "failed",
  error: string | null,
): Promise<void> {
  const statusColumn = channel === "email" ? "email_status" : "crm_status";
  const errorColumn = channel === "email" ? "email_error" : "crm_error";
  await run(`UPDATE leads SET ${statusColumn} = ?, ${errorColumn} = ? WHERE id = ?`, [
    status,
    error,
    id,
  ]);
}

export async function insertEvent(event: {
  name: string;
  questionId: string | null;
  branch: string | null;
  sessionId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}): Promise<void> {
  await run(
    `INSERT INTO analytics_events
      (id, created_at, name, question_id, branch, session_id, utm_source, utm_medium, utm_campaign)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      new Date().toISOString(),
      event.name,
      event.questionId,
      event.branch,
      event.sessionId,
      event.utmSource,
      event.utmMedium,
      event.utmCampaign,
    ],
  );
}

export async function countEvents(): Promise<number> {
  const row = await get("SELECT COUNT(*) AS count FROM analytics_events");
  return Number(row?.count ?? 0);
}

export function allowRateLimit(bucket: string, limit: number, windowMs: number): Promise<boolean> {
  return serialize(async () => {
    const now = Date.now();
    const row = await get("SELECT window_start, count FROM rate_limits WHERE bucket = ?", [bucket]);
    if (!row || now - Number(row.window_start) >= windowMs) {
      await run(
        `INSERT INTO rate_limits (bucket, window_start, count) VALUES (?, ?, 1)
         ON CONFLICT (bucket) DO UPDATE SET window_start = ?, count = 1`,
        [bucket, now, now],
      );
      return true;
    }
    if (Number(row.count) >= limit) return false;
    await run("UPDATE rate_limits SET count = count + 1 WHERE bucket = ?", [bucket]);
    return true;
  });
}

export async function resetDbForTests(): Promise<void> {
  const pending = connecting;
  connecting = null;
  queue = Promise.resolve();
  if (!pending) return;
  const current = await pending.catch(() => null);
  if (!current) return;
  if (current.kind === "sqlite") current.db.close();
  else await current.pool.end();
}
