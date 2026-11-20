import { emailConfigured, missingEmailEnv, sendLeadEmail } from "@/server/email";
import { claimDelivery, getLead, saveLead, setDelivery, type LeadRecord } from "@/server/db";
import { safeError } from "@/server/safe-error";
import type { Submission } from "@/lib/form/validation";
import { syncLead, crmConfigured } from "@/services/crm";

export async function acceptLead(
  submission: Submission,
  userAgent: string | null,
): Promise<{ id: string }> {
  const saved = await saveLead(submission, userAgent);
  await Promise.all([deliverEmail(saved.id), deliverCrm(saved.id)]);
  return { id: saved.id };
}

async function deliverEmail(id: string): Promise<void> {
  const lead = await getLead(id);
  if (!lead || finished(lead.emailStatus)) return;
  if (lead.classification === "browser" || !emailConfigured()) {
    await setDelivery(id, "email", "skipped", null);
    if (lead.classification !== "browser") {
      console.info(`[leads] email skipped lead=${id} missing=${missingEmailEnv().join(",")}`);
    }
    return;
  }
  const claimed = await claimDelivery(id, "email");
  if (!claimed) return;
  try {
    await sendLeadEmail(lead);
    await setDelivery(id, "email", "sent", null);
    console.info(`[leads] email sent lead=${id}`);
  } catch (error) {
    await setDelivery(id, "email", "failed", safeError(error));
    console.error(`[leads] email failed lead=${id}`);
  }
}

async function deliverCrm(id: string): Promise<void> {
  const lead = await getLead(id);
  if (!lead || finished(lead.crmStatus)) return;
  if (lead.classification === "browser" || !crmConfigured()) {
    await setDelivery(id, "crm", "skipped", null);
    if (lead.classification !== "browser") console.info(`[leads] crm skipped lead=${id}`);
    return;
  }
  const claimed = await claimDelivery(id, "crm");
  if (!claimed) return;
  try {
    const result = await syncLead(lead);
    const status = result.status === "failed" ? "failed" : result.status;
    await setDelivery(id, "crm", status, result.error ?? null);
    console.info(`[leads] crm ${result.status} lead=${id}`);
  } catch (error) {
    await setDelivery(id, "crm", "failed", safeError(error));
    console.error(`[leads] crm failed lead=${id}`);
  }
}

function finished(status: string): boolean {
  return status === "sent" || status === "sending" || status === "skipped";
}

export type { LeadRecord };
