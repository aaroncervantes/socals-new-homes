import type { LeadRecord } from "@/server/db";
import { apiConfigured, pushToGoHighLevel, webhookUrl } from "@/services/crm/gohighlevel";
import type { CrmResult } from "@/services/crm/types";

export function crmConfigured(): boolean {
  return Boolean(webhookUrl() || apiConfigured());
}

export function syncLead(lead: LeadRecord): Promise<CrmResult> {
  return pushToGoHighLevel(lead);
}
