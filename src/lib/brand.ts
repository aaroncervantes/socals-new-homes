function safeAssetUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol === "https:") return url.toString();
  } catch {
    return "";
  }
  return "";
}

export const brand = {
  name: "SoCal’s New Homes",
  textNumberDisplay: "(909) 406-6560",
  textNumberE164: "+19094066560",
  instagramUrl: safeAssetUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
  facebookUrl: safeAssetUrl(process.env.NEXT_PUBLIC_FACEBOOK_URL),
  logoSrc: safeAssetUrl(process.env.NEXT_PUBLIC_LOGO_SRC),
};

export const requiredBrandAssets = [
  "Instagram profile URL (NEXT_PUBLIC_INSTAGRAM_URL). None is on file.",
  "Facebook profile URL (NEXT_PUBLIC_FACEBOOK_URL). None is on file.",
] as const;
