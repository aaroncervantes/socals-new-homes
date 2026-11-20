import { brand } from "@/lib/brand";

const APPROVED_LOGO = "/brand/logo.png";

/** Approved wax-seal mark. An explicit NEXT_PUBLIC_LOGO_SRC can point at another file. */
export function Logo({ className = "h-14 w-14" }: { className?: string }) {
  return (
    // The file is the owner-approved asset. A plain img serves those bytes unchanged.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={brand.logoSrc || APPROVED_LOGO} alt="SoCal’s New Homes" className={className} />
  );
}
