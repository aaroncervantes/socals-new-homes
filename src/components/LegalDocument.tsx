import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requiredBeforePublicLaunch } from "@/lib/legal";

export function LegalDocument({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="legal-page min-h-dvh bg-paper px-5 py-10 text-ink sm:px-8">
      <article className="mx-auto w-full max-w-2xl">
        <Link href="/" className="inline-block" aria-label="Back to SoCal’s New Homes">
          <Logo />
        </Link>
        <p className="mt-10 rounded-2xl border border-clay/30 bg-card px-4 py-3 text-[14px] leading-relaxed text-clay">
          Draft for review. This page is not approved legal copy and is not ready for public launch.
        </p>
        <h1 className="mt-8 font-serif text-4xl tracking-[-0.03em]">{title}</h1>
        <div className="mt-6 space-y-4 text-[16.5px] leading-relaxed text-ink/90">{children}</div>
        <h2 className="mt-10 font-serif text-2xl">Required before public launch</h2>
        <ul className="mt-4 space-y-3 text-[15.5px] leading-relaxed">
          {requiredBeforePublicLaunch.map((item) => (
            <li key={item.label}>
              <span className="font-medium">{item.label}.</span> {item.detail}{" "}
              <span className="text-clay">Not on file.</span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-[14px]">
          <Link href="/" className="underline underline-offset-4">
            Back to the home search
          </Link>
        </p>
      </article>
    </main>
  );
}
