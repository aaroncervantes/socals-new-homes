import { answerLabel } from "@/lib/form/config";
import { classificationLabel } from "@/lib/form/classification";
import type { LeadRecord } from "@/server/db";
import { safeError } from "@/server/safe-error";
import type { CrmResult } from "@/services/crm/types";

const LEAD_SOURCE = "SoCal’s New Homes Website";

export function webhookUrl(): string | null {
  const value = process.env.GHL_WEBHOOK_URL?.trim();
  return value || null;
}

export function apiConfigured(): boolean {
  return Boolean(process.env.GHL_API_KEY?.trim() && process.env.GHL_LOCATION_ID?.trim());
}

function isHttps(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function crmPayload(lead: LeadRecord): Record<string, string> {
  return {
    firstName: lead.firstName,
    lastName: lead.lastName,
    phone: lead.phoneE164,
    source: LEAD_SOURCE,
    leadSource: LEAD_SOURCE,
    leadClassification: classificationLabel(lead.classification),
    buyingJourney: answerLabel("journey", lead.journey),
    area: answerLabel("area", lead.area),
    areaOther: lead.areaOther ?? "",
    cities: lead.cities ?? "",
    budget: answerLabel("price", lead.priceRange),
    homePreferences: lead.preferences.map((id) => answerLabel("preferences", id)).join(", "),
    financing: answerLabel("financing", lead.financing),
    timeline: answerLabel("timeline", lead.timeline),
    utmSource: lead.utmSource ?? "",
    utmMedium: lead.utmMedium ?? "",
    utmCampaign: lead.utmCampaign ?? "",
    submittedAt: lead.createdAt,
  };
}

function noteBody(lead: LeadRecord): string {
  return Object.entries(crmPayload(lead))
    .map(([key, value]) => `${key}: ${value || "—"}`)
    .join("\n");
}

async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`CRM request failed (${response.status})`);
  return response.json().catch(() => ({}));
}

async function createContact(lead: LeadRecord): Promise<void> {
  const token = process.env.GHL_API_KEY?.trim();
  const locationId = process.env.GHL_LOCATION_ID?.trim();
  if (!token || !locationId) throw new Error("CRM API is not configured");
  const created = (await postJson(
    "https://services.leadconnectorhq.com/contacts/",
    {
      locationId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phoneE164,
      source: LEAD_SOURCE,
      tags: [lead.classification, "socal-new-homes-website"],
    },
    { authorization: `Bearer ${token}`, version: "2021-07-28" },
  )) as { contact?: { id?: string } };
  const contactId = created.contact?.id;
  if (!contactId) return;
  try {
    await postJson(
      `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
      { body: noteBody(lead) },
      { authorization: `Bearer ${token}`, version: "2021-07-28" },
    );
  } catch (error) {
    console.error(`[crm] note failed lead=${lead.id} ${safeError(error)}`);
  }
}

export async function pushToGoHighLevel(lead: LeadRecord): Promise<CrmResult> {
  if (lead.classification === "browser") return { status: "skipped" };
  const webhook = webhookUrl();
  const hasApi = apiConfigured();
  if (!webhook && !hasApi) return { status: "skipped" };

  if (webhook) {
    if (!isHttps(webhook)) return { status: "failed", error: "GHL_WEBHOOK_URL must be https" };
    try {
      await postJson(webhook, crmPayload(lead), {});
      return { status: "sent" };
    } catch (error) {
      if (!hasApi) return { status: "failed", error: safeError(error) };
    }
  }

  try {
    await createContact(lead);
    return { status: "sent" };
  } catch (error) {
    return { status: "failed", error: safeError(error) };
  }
}
