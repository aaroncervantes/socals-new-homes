import type { MetadataRoute } from "next";

function origin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${origin()}/`, changeFrequency: "monthly", priority: 1 }];
}
