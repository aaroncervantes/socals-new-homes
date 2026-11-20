import { brand } from "@/lib/brand";

function Row({ name, url }: { name: string; url: string }) {
  if (!url) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-4 py-3 text-[15px] text-muted">
        {name} — link not configured
      </p>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-2xl border border-line bg-card px-4 py-3 text-[15px] text-ink transition-transform active:scale-[0.985]"
    >
      {name}
    </a>
  );
}

export function SocialLinks() {
  return (
    <div className="mt-8 flex flex-col gap-2.5">
      <Row name="Instagram" url={brand.instagramUrl} />
      <Row name="Facebook" url={brand.facebookUrl} />
    </div>
  );
}

export function TextUs({ intro }: { intro?: string }) {
  return (
    <p className="mt-6 text-[17px] leading-relaxed text-ink">
      {intro ? `${intro} ` : null}
      <a
        href={`sms:${brand.textNumberE164}`}
        className="underline decoration-ink/30 underline-offset-4"
      >
        text us at {brand.textNumberDisplay}
      </a>
    </p>
  );
}
