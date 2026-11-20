"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="legal-page grid min-h-dvh place-items-center bg-paper px-6 text-center text-ink">
      <div>
        <h1 className="font-serif text-4xl">Something went wrong.</h1>
        <button type="button" onClick={reset} className="mt-6 underline underline-offset-4">
          Try again
        </button>
      </div>
    </main>
  );
}
