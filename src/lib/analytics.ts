"use client";

import type { Attribution } from "@/lib/attribution";
import { isAnalyticsEvent, type AnalyticsEventName } from "@/lib/analytics-events";

type Context = {
  sessionId: string;
  attribution: Attribution;
};

let context: Context | null = null;

export function setAnalyticsContext(next: Context): void {
  context = next;
}

function gaId(): string | null {
  const value = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
  return /^G-[A-Z0-9]+$/i.test(value) ? value : null;
}

function pixelId(): string | null {
  const value = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
  return /^\d{5,20}$/.test(value) ? value : null;
}

export function track(
  name: AnalyticsEventName,
  detail?: { questionId?: string; branch?: string },
): void {
  if (!context || !isAnalyticsEvent(name)) return;
  const payload = {
    name,
    questionId: detail?.questionId ?? null,
    branch: detail?.branch ?? null,
    sessionId: context.sessionId,
    utmSource: context.attribution.utmSource,
    utmMedium: context.attribution.utmMedium,
    utmCampaign: context.attribution.utmCampaign,
  };
  const body = JSON.stringify(payload);
  try {
    const blob = new Blob([body], { type: "application/json" });
    const sent = navigator.sendBeacon?.("/api/events", blob) ?? false;
    if (!sent) {
      void fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    // Analytics must never block the funnel.
  }

  if (gaId() && typeof window.gtag === "function") {
    window.gtag("event", name, {
      question_id: detail?.questionId,
      branch: detail?.branch,
    });
  }
  if (pixelId() && typeof window.fbq === "function") {
    window.fbq("trackCustom", name, {
      question_id: detail?.questionId,
    });
  }
}
