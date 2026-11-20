import { isAnalyticsEvent } from "@/lib/analytics-events";
import { allowRateLimit, insertEvent } from "@/server/db";
import { json, noContent, sameOrigin } from "@/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clip(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
  return cleaned || null;
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return noContent();
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 4_000) return noContent();
    body = JSON.parse(text) as unknown;
  } catch {
    return json(400, { ok: false });
  }
  if (!body || typeof body !== "object") return json(400, { ok: false });
  const record = body as Record<string, unknown>;
  if (typeof record.name !== "string" || !isAnalyticsEvent(record.name)) {
    return json(400, { ok: false });
  }
  const sessionId = typeof record.sessionId === "string" && UUID.test(record.sessionId)
    ? record.sessionId
    : null;
  if (sessionId) {
    const allowed = await allowRateLimit(`event:${sessionId}`, 300, 60 * 60 * 1000);
    if (!allowed) return noContent();
  }
  const branch = clip(record.branch, 40);
  try {
    await insertEvent({
      name: record.name,
      questionId: clip(record.questionId, 40),
      branch: branch && ["ready", "soon", "researching", "browsing"].includes(branch) ? branch : null,
      sessionId,
      utmSource: clip(record.utmSource, 120),
      utmMedium: clip(record.utmMedium, 120),
      utmCampaign: clip(record.utmCampaign, 120),
    });
  } catch {
    console.error("[analytics] event was not stored");
  }
  return noContent();
}
