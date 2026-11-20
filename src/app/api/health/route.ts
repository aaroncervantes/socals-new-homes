import { crmConfigured } from "@/services/crm";
import { emailConfigured } from "@/server/email";
import { dbKind, pingDb } from "@/server/db";
import { json } from "@/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await pingDb();
    const kind = await dbKind();
    return json(200, {
      ok: true,
      db: kind,
      durable: kind === "postgres",
      emailConfigured: emailConfigured(),
      crmConfigured: crmConfigured(),
    });
  } catch {
    return json(503, { ok: false });
  }
}
