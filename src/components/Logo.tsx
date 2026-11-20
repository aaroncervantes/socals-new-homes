import { brand } from "@/lib/brand";

/**
 * Replaceable brand mark. Until an approved logo exists, this renders a
 * typographic wordmark — not a made-up logo. Set NEXT_PUBLIC_LOGO_SRC to
 * /brand/logo.svg after placing the file in public/brand/.
 */
export function Logo({ className = "" }: { className?: string }) {
  if (brand.logoSrc) {
    return (
      // The owner-supplied asset is an arbitrary path, so a plain img is intentional.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={brand.logoSrc} alt="SoCal’s New Homes" className={`h-8 w-auto ${className}`} />
    );
  }

  return (
    <span className={`font-serif text-[15px] uppercase tracking-[0.18em] text-ink ${className}`}>
      SoCal’s New Homes
    </span>
  );
}
