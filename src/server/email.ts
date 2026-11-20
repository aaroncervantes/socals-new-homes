import { answerLabel } from "@/lib/form/config";
import { classificationLabel } from "@/lib/form/classification";
import type { LeadRecord } from "@/server/db";

export function missingEmailEnv(): string[] {
  return ["LEAD_NOTIFICATION_EMAIL", "EMAIL_API_KEY", "EMAIL_FROM"].filter(
    (name) => !process.env[name]?.trim(),
  );
}

export function emailConfigured(): boolean {
  return missingEmailEnv().length === 0;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function dash(value: string | null): string {
  return value && value.trim() ? value : "—";
}

function lines(lead: LeadRecord): Array<[string, string]> {
  const preferences = lead.preferences.map((id) => answerLabel("preferences", id)).join(", ");
  return [
    ["Name", `${lead.firstName} ${lead.lastName}`],
    ["Phone", lead.phoneDisplay],
    ["Classification", classificationLabel(lead.classification)],
    ["Buying stage", answerLabel("journey", lead.journey)],
    ["Area", answerLabel("area", lead.area)],
    ["Typed area", dash(lead.areaOther)],
    ["Budget", answerLabel("price", lead.priceRange)],
    ["Home preferences", preferences || "—"],
    ["Financing", answerLabel("financing", lead.financing)],
    ["Timeline", answerLabel("timeline", lead.timeline)],
    ["Lead source", "SoCal’s New Homes Website"],
    ["UTM source", dash(lead.utmSource)],
    ["UTM medium", dash(lead.utmMedium)],
    ["UTM campaign", dash(lead.utmCampaign)],
    ["UTM content", dash(lead.utmContent)],
    ["UTM term", dash(lead.utmTerm)],
    ["Referrer", dash(lead.referrer)],
    ["Landing URL", dash(lead.landingUrl)],
    ["Submitted", `${formatTimestamp(lead.createdAt)} Pacific`],
  ];
}

export function leadEmailSubject(lead: LeadRecord): string {
  return `New SoCal’s New Homes Lead — ${lead.firstName} ${lead.lastName}`.replace(/[\r\n]/g, " ");
}

export function leadEmailText(lead: LeadRecord): string {
  return lines(lead)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

export function leadEmailHtml(lead: LeadRecord): string {
  const rows = lines(lead)
    .map(([label, value]) => {
      const rendered =
        label === "Phone"
          ? `<a href="tel:${escapeHtml(lead.phoneE164)}">${escapeHtml(value)}</a>`
          : escapeHtml(value);
      return `<tr><th align="left" style="padding:6px 16px 6px 0;vertical-align:top;">${escapeHtml(label)}</th><td style="padding:6px 0;">${rendered}</td></tr>`;
    })
    .join("");
  return `<div style="font-family:Georgia,serif;color:#1b1916;"><h1 style="font-size:22px;">New SoCal’s New Homes lead</h1><table style="border-collapse:collapse;font-size:16px;">${rows}</table></div>`;
}

export async function sendLeadEmail(lead: LeadRecord): Promise<void> {
  const missing = missingEmailEnv();
  if (missing.length > 0) {
    throw new Error(`Email is not configured (${missing.join(", ")})`);
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [process.env.LEAD_NOTIFICATION_EMAIL],
      subject: leadEmailSubject(lead),
      text: leadEmailText(lead),
      html: leadEmailHtml(lead),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`Email request failed (${response.status})`);
  }
}
