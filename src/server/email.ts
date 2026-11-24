import { brand } from "@/lib/brand";
import { answerLabel } from "@/lib/form/config";
import { classificationLabel } from "@/lib/form/classification";
import type { LeadRecord } from "@/server/db";

const GOLD = "#c9a84c";
const CREAM = "#f7f5f2";
const CHARCOAL = "#1b1916";
const MUTED = "#6b6560";
const CARD = "#ffffff";

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

function filled(value: string | null | undefined): value is string {
  if (value == null) return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== "—";
}

type Field = {
  label: string;
  value: string;
  href?: string;
};

/** Buyer-facing fields only — no UTMs, referrer, or empty placeholders. */
export function leadEmailFields(lead: LeadRecord): Field[] {
  const fields: Field[] = [
    { label: "Name", value: `${lead.firstName} ${lead.lastName}`.trim() },
    { label: "Phone", value: lead.phoneDisplay, href: `tel:${lead.phoneE164}` },
    { label: "Classification", value: classificationLabel(lead.classification) },
    { label: "Buying stage", value: answerLabel("journey", lead.journey) },
    { label: "Area", value: answerLabel("area", lead.area) },
  ];

  if (filled(lead.areaOther)) {
    fields.push({ label: "Typed area", value: lead.areaOther.trim() });
  }

  fields.push(
    { label: "Budget", value: answerLabel("price", lead.priceRange) },
    { label: "Financing", value: answerLabel("financing", lead.financing) },
  );

  if (filled(lead.timeline)) {
    fields.push({ label: "Timeline", value: answerLabel("timeline", lead.timeline) });
  }

  if (filled(lead.landingUrl)) {
    fields.push({ label: "Landing page", value: lead.landingUrl.trim(), href: lead.landingUrl.trim() });
  }

  fields.push({
    label: "Submitted",
    value: `${formatTimestamp(lead.createdAt)} Pacific`,
  });

  return fields.filter((field) => filled(field.value));
}

export function siteBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "";
  if (fromEnv) return fromEnv;
  return "https://web-production-a651e071.up.railway.app";
}

export function emailLogoUrl(): string {
  const custom = brand.logoSrc;
  if (custom.startsWith("https://")) return custom;
  return `${siteBaseUrl()}/brand/logo-email.png`;
}

export function leadEmailSubject(lead: LeadRecord): string {
  return `New SoCal’s New Homes Lead — ${lead.firstName} ${lead.lastName}`.replace(/[\r\n]/g, " ");
}

export function leadEmailText(lead: LeadRecord): string {
  const intro = `A new lead just came in on ${brand.name}.`;
  const body = leadEmailFields(lead)
    .map((field) => `${field.label}: ${field.value}`)
    .join("\n");
  return `${intro}\n\n${body}`;
}

function fieldBlock(field: Field): string {
  const valueHtml = field.href
    ? `<a href="${escapeHtml(field.href)}" style="color:${GOLD};text-decoration:none;font-weight:600;">${escapeHtml(field.value)}</a>`
    : escapeHtml(field.value);

  return `<tr>
  <td style="padding:0 0 18px 0;">
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};font-weight:700;margin:0 0 6px 0;">${escapeHtml(field.label)}</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.45;color:${CHARCOAL};margin:0;">${valueHtml}</div>
  </td>
</tr>`;
}

export function leadEmailHtml(lead: LeadRecord): string {
  const fields = leadEmailFields(lead);
  const logo = escapeHtml(emailLogoUrl());
  const name = escapeHtml(`${lead.firstName} ${lead.lastName}`.trim());
  const rows = fields.map(fieldBlock).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(leadEmailSubject(lead))}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${CARD};border:1px solid #ebe6dc;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px rgba(27,25,22,0.08);">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg, ${GOLD}, #e4d19a, ${GOLD});font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="padding:36px 36px 12px 36px;background:${CARD};">
              <img src="${logo}" width="96" height="96" alt="SoCal’s New Homes" style="display:block;width:96px;height:96px;border:0;border-radius:50%;" />
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${GOLD};font-weight:700;margin:18px 0 0 0;">SoCal’s New Homes</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;color:${MUTED};margin:6px 0 0 0;">with Cervantes Realty</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 0 36px;">
              <div style="height:1px;background:linear-gradient(90deg, transparent, ${GOLD}, transparent);font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 36px 8px 36px;">
              <h1 style="margin:0 0 10px 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${CHARCOAL};font-weight:700;">New lead · ${name}</h1>
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:${MUTED};">
                A buyer just finished the SoCal’s New Homes questionnaire. Their answers are below.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 36px 12px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${rows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 32px 36px;">
              <div style="border-top:1px solid #ebe6dc;padding-top:18px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${MUTED};">
                Reply by call or text · ${escapeHtml(brand.textNumberDisplay)}
              </div>
            </td>
          </tr>
        </table>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.08em;color:#9a948c;margin:18px 0 0 0;">
          CERVANTES × SOCAL’S NEW HOMES
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
