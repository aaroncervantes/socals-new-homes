export type Attribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  referrer: string | null;
  landingUrl: string | null;
};

const LIMITS = {
  utm: 120,
  referrer: 500,
  landing: 1000,
} as const;

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
  return cleaned || null;
}

export function emptyAttribution(): Attribution {
  return {
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    referrer: null,
    landingUrl: null,
  };
}

export function cleanAttribution(input: unknown): Attribution {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return {
    utmSource: clean(source.utmSource, LIMITS.utm),
    utmMedium: clean(source.utmMedium, LIMITS.utm),
    utmCampaign: clean(source.utmCampaign, LIMITS.utm),
    utmContent: clean(source.utmContent, LIMITS.utm),
    utmTerm: clean(source.utmTerm, LIMITS.utm),
    referrer: clean(source.referrer, LIMITS.referrer),
    landingUrl: clean(source.landingUrl, LIMITS.landing),
  };
}

export function readAttribution(params: URLSearchParams): Attribution {
  const campaign = params.get("campaign");
  const utmCampaign = clean(params.get("utm_campaign"), LIMITS.utm);
  return {
    utmSource: clean(params.get("utm_source"), LIMITS.utm),
    utmMedium: clean(params.get("utm_medium"), LIMITS.utm),
    utmCampaign: utmCampaign ?? (campaign ? clean(`campaign:${campaign}`, LIMITS.utm) : null),
    utmContent: clean(params.get("utm_content"), LIMITS.utm),
    utmTerm: clean(params.get("utm_term"), LIMITS.utm),
    referrer: clean(document.referrer, LIMITS.referrer),
    landingUrl: clean(window.location.href, LIMITS.landing),
  };
}
