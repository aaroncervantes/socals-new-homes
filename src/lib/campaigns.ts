import type { AreaId } from "@/lib/form/types";

/**
 * Presets for later campaign routes such as /corona or /ontario.
 * Those pages are not built yet. A future route can render the funnel and
 * send visitors to /?campaign=corona, which preselects the area.
 */
export type CampaignPreset = {
  slug: string;
  area: AreaId;
};

const CAMPAIGNS: Record<string, CampaignPreset> = {
  corona: { slug: "corona", area: "riverside" },
  ontario: { slug: "ontario", area: "san-bernardino" },
  fontana: { slug: "fontana", area: "san-bernardino" },
  "jurupa-valley": { slug: "jurupa-valley", area: "riverside" },
  "rancho-cucamonga": { slug: "rancho-cucamonga", area: "san-bernardino" },
};

export function getCampaign(slug: string | null | undefined): CampaignPreset | null {
  if (!slug) return null;
  return CAMPAIGNS[slug.trim().toLowerCase()] ?? null;
}

export function listCampaigns(): CampaignPreset[] {
  return Object.values(CAMPAIGNS);
}
