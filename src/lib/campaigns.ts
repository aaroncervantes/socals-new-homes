import type { AreaId } from "@/lib/form/types";

/**
 * Presets for later campaign routes such as /corona or /ontario.
 * Those pages are not built yet. A future route can render the funnel and
 * send visitors to /?campaign=corona, which preselects area and cities.
 */
export type CampaignPreset = {
  slug: string;
  area: AreaId;
  cities?: string;
};

const CAMPAIGNS: Record<string, CampaignPreset> = {
  corona: { slug: "corona", area: "inland-empire", cities: "Corona" },
  ontario: { slug: "ontario", area: "inland-empire", cities: "Ontario" },
  fontana: { slug: "fontana", area: "inland-empire", cities: "Fontana" },
  "jurupa-valley": {
    slug: "jurupa-valley",
    area: "inland-empire",
    cities: "Jurupa Valley",
  },
  "rancho-cucamonga": {
    slug: "rancho-cucamonga",
    area: "inland-empire",
    cities: "Rancho Cucamonga",
  },
};

export function getCampaign(slug: string | null | undefined): CampaignPreset | null {
  if (!slug) return null;
  return CAMPAIGNS[slug.trim().toLowerCase()] ?? null;
}

export function listCampaigns(): CampaignPreset[] {
  return Object.values(CAMPAIGNS);
}
