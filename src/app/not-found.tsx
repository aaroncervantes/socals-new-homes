import Link from "next/link";

export default function NotFound() {
  return (
    <main className="legal-page grid min-h-dvh place-items-center bg-paper px-6 text-center text-ink">
      <div>
        <h1 className="font-serif text-4xl">This page is not part of the home search.</h1>
        <Link href="/" className="mt-6 inline-block underline underline-offset-4">
          Start over
        </Link>
      </div>
    </main>
  );
}
