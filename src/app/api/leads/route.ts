import { brand } from "@/lib/brand";
import { intEnv } from "@/lib/env";
import { parseSubmission } from "@/lib/form/validation";
import { acceptLead } from "@/server/leads";
import { allowRateLimit } from "@/server/db";
import { clientIp, hashIp, json, sameOrigin } from "@/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 20_000;

function honeypotTripped(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const value = (body as { honeypot?: unknown }).honeypot;
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request): Promise<Response> {
  let text: string;
  try {
    text = await request.text();
  } catch {
    return json(400, { ok: false, error: "That submission could not be read." });
  }
  if (text.length > MAX_BODY) {
    return json(413, { ok: false, error: "That submission could not be read." });
  }
  if (!sameOrigin(request)) {
    return json(403, { ok: false, error: "This submission was blocked." });
  }

  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    return json(400, { ok: false, error: "That submission could not be read." });
  }

  if (honeypotTripped(body)) {
    console.info("[leads] honeypot filtered");
    return json(200, { ok: true, id: crypto.randomUUID() });
  }

  const parsed = parseSubmission(body);
  if (!parsed.ok) return json(400, { ok: false, error: parsed.error });

  const allowed = await allowRateLimit(
    `lead:${hashIp(clientIp(request))}`,
    intEnv("RATE_LIMIT_MAX", 8),
    60 * 60 * 1000,
  );
  if (!allowed) {
    return json(429, {
      ok: false,
      error: `Too many submissions from this network. Please text us at ${brand.textNumberDisplay}.`,
    });
  }

  try {
    const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;
    const saved = await acceptLead(parsed.value, userAgent);
    return json(200, { ok: true, id: saved.id });
  } catch {
    console.error("[leads] save failed");
    return json(500, { ok: false, error: "We couldn’t save your request. Please try again." });
  }
}
