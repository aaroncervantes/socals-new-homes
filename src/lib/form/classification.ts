import type { JourneyId, TimelineId } from "@/lib/form/types";

export type LeadClassification = "qualified_lead" | "nurture_lead" | "browser";

export type ClassificationInput = {
  journey?: JourneyId | string;
  timeline?: TimelineId | string;
};

/**
 * Internal lead class. Never shown as a score to the visitor.
 *
 * - browsing → browser. No lead row, no owner email, no CRM contact.
 * - researching → nurture_lead, at any timeline.
 * - ready → qualified_lead, including a far timeline (6+ months or just exploring).
 * - soon (planning to buy within 3–6 months) → qualified_lead.
 * - soon AND timeline is 6+ months or just exploring → nurture_lead.
 *   The answer says the real horizon is longer than the 3–6 month plan.
 * - any other submitted contact → nurture_lead.
 *
 * Price never changes the class and never rejects the visitor.
 */
const FAR_TIMELINES = new Set(["6-plus", "exploring"]);

export function classifyLead(input: ClassificationInput): LeadClassification {
  if (input.journey === "browsing") return "browser";
  if (input.journey === "researching") return "nurture_lead";
  if (input.journey === "ready") return "qualified_lead";
  if (input.journey === "soon") {
    if (input.timeline && FAR_TIMELINES.has(input.timeline)) return "nurture_lead";
    return "qualified_lead";
  }
  return "nurture_lead";
}

export function classificationLabel(value: string): string {
  if (value === "qualified_lead") return "Qualified lead";
  if (value === "nurture_lead") return "Nurture lead";
  if (value === "browser") return "Browser";
  return value;
}
