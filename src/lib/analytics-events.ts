export const ANALYTICS_EVENTS = [
  "landing_viewed",
  "form_started",
  "question_viewed",
  "question_completed",
  "qualified_branch_entered",
  "browsing_branch_entered",
  "form_submitted",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEvent(value: string): value is AnalyticsEventName {
  return (ANALYTICS_EVENTS as readonly string[]).includes(value);
}
