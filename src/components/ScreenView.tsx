import Link from "next/link";
import { CONSENT_TEXT } from "@/lib/consent";
import { fillCopy } from "@/lib/form/copy";
import type { Answers, Option, Screen } from "@/lib/form/types";
import { cn } from "@/lib/cn";
import { SocialLinks, TextUs } from "@/components/SocialLinks";

type Props = {
  screen: Screen;
  answers: Answers;
  number: number | null;
  error: string | null;
  onSingle: (id: string) => void;
  onMulti: (id: string) => void;
  onText: (value: string) => void;
  onCities: (value: string) => void;
  onConsent: (value: boolean) => void;
  onRestart: () => void;
};

function groupsOf(options: Option[]): Array<{ name: string; options: Option[] }> {
  const groups: Array<{ name: string; options: Option[] }> = [];
  for (const option of options) {
    const name = option.group ?? "";
    const last = groups[groups.length - 1];
    if (!last || last.name !== name) groups.push({ name, options: [option] });
    else last.options.push(option);
  }
  return groups;
}

function ChoiceButton({
  option,
  selected,
  pressed,
  onClick,
}: {
  option: Option;
  selected: boolean;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role={pressed ? "radio" : undefined}
      aria-checked={pressed ? selected : undefined}
      aria-pressed={pressed ? undefined : selected}
      data-testid={`option-${option.id}`}
      onClick={onClick}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-[16.5px] leading-snug",
        "transition-transform duration-75 ease-out active:scale-[0.985]",
        selected ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink",
      )}
    >
      {option.letter ? (
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[13px] font-medium",
            selected ? "border-white/35 text-paper" : "border-line text-ink",
          )}
        >
          {option.letter}
        </span>
      ) : (
        <span
          className={cn(
            "grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border",
            selected ? "border-paper bg-paper text-ink" : "border-line bg-paper",
          )}
          aria-hidden="true"
        >
          {selected ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.2 6.2 4.7 8.7 9.8 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
      )}
      <span>{option.label}</span>
    </button>
  );
}

export function ScreenView({
  screen,
  answers,
  number,
  error,
  onSingle,
  onMulti,
  onText,
  onCities,
  onConsent,
  onRestart,
}: Props) {
  const titleId = `${screen.id}-title`;
  const inputId = `${screen.id}-answer`;
  const errorId = `${screen.id}-error`;
  const question = screen.question ? fillCopy(screen.question, answers) : "";
  const selectedSingle = screen.field ? answers[screen.field] : undefined;
  const textValue =
    screen.field === "firstName" || screen.field === "lastName" || screen.field === "phone"
      ? (answers[screen.field] ?? "")
      : "";

  return (
    <div data-testid={`screen-${screen.id}`}>
      {number != null ? (
        <p className="text-[13px] font-medium tracking-[0.14em] text-clay">
          <span>{number}</span>
          <span aria-hidden="true"> →</span>
        </p>
      ) : null}

      {screen.eyebrow ? (
        <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-clay">{screen.eyebrow}</p>
      ) : null}

      {question ? (
        <h1
          id={titleId}
          tabIndex={-1}
          data-autofocus={screen.type === "text" || screen.type === "phone" ? undefined : "true"}
          className={cn(
            "font-serif tracking-[-0.03em] text-ink outline-none",
            screen.type === "welcome"
              ? "mt-4 text-[2.6rem] leading-[1.05] sm:text-6xl"
              : "mt-3 text-[1.85rem] leading-[1.15] sm:text-[2.35rem]",
            number == null && !screen.eyebrow ? "mt-0" : "",
          )}
        >
          {question}
        </h1>
      ) : null}

      {screen.description ? (
        <p className="mt-3 max-w-xl text-[16.5px] leading-relaxed text-muted">{fillCopy(screen.description, answers)}</p>
      ) : null}

      {screen.paragraphs?.length ? (
        <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-ink/90">
          {screen.paragraphs.map((paragraph) => (
            <p key={paragraph}>{fillCopy(paragraph, answers)}</p>
          ))}
        </div>
      ) : null}

      {screen.footnote ? <p className="mt-6 text-[15px] text-muted">{screen.footnote}</p> : null}

      {screen.type === "welcome" ? (
        <p className="mt-4 text-[13px] text-muted">
          <Link href="/privacy" className="underline decoration-line underline-offset-4">
            Privacy
          </Link>
        </p>
      ) : null}

      {screen.type === "single" && screen.options ? (
        <div role="radiogroup" aria-labelledby={titleId} className="mt-8 flex flex-col gap-2.5">
          {screen.options.map((option) => (
            <ChoiceButton
              key={option.id}
              option={option}
              selected={selectedSingle === option.id}
              pressed
              onClick={() => onSingle(option.id)}
            />
          ))}
        </div>
      ) : null}

      {screen.extra ? (
        <label className="mt-6 block">
          <span className="text-[15px] text-muted">{screen.extra.label}</span>
          <input
            data-testid="cities-input"
            value={answers.cities ?? ""}
            placeholder={screen.extra.placeholder}
            maxLength={200}
            onChange={(event) => onCities(event.target.value)}
            className="mt-2 w-full border-0 border-b border-ink/25 bg-transparent py-2 text-[18px] text-ink outline-none placeholder:text-[#8a847c] focus:border-ink"
          />
        </label>
      ) : null}

      {screen.type === "text" || screen.type === "phone" ? (
        <div className="mt-8">
          <label className="sr-only" htmlFor={inputId}>
            {question}
          </label>
          <input
            id={inputId}
            data-testid="text-input"
            data-autofocus="true"
            value={textValue}
            placeholder={screen.placeholder}
            autoComplete={screen.autoComplete}
            inputMode={screen.type === "phone" ? "tel" : "text"}
            maxLength={screen.type === "phone" ? 16 : 40}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => onText(event.target.value)}
            className="w-full border-0 border-b border-ink/25 bg-transparent py-3 font-serif text-[1.7rem] leading-tight text-ink outline-none placeholder:text-[#8a847c] focus:border-ink"
          />
        </div>
      ) : null}

      {screen.type === "multi" && screen.options ? (
        <div role="group" aria-labelledby={titleId} className="mt-8">
          {groupsOf(screen.options).map((group) => (
            <div key={group.name || "options"} className="mt-5 first:mt-0">
              {group.name ? (
                <h2 className="mb-2 text-[12px] font-medium uppercase tracking-[0.16em] text-muted">
                  {group.name}
                </h2>
              ) : null}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {group.options.map((option) => (
                  <ChoiceButton
                    key={option.id}
                    option={option}
                    selected={(answers.preferences ?? []).some((item) => item === option.id)}
                    pressed={false}
                    onClick={() => onMulti(option.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {screen.type === "confirm" ? (
        <div className="mt-8">
          <label className="flex items-start gap-3 text-[15px] leading-relaxed text-ink">
            <input
              data-testid="consent"
              type="checkbox"
              checked={answers.consent === true}
              onChange={(event) => onConsent(event.target.checked)}
              className="mt-0.5 shrink-0"
            />
            <span>{CONSENT_TEXT}</span>
          </label>
          <p className="mt-4 text-[14px] leading-relaxed text-muted">
            <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>
            <span aria-hidden="true"> · </span>
            <Link href="/terms" className="underline underline-offset-4">Terms</Link>
            <span aria-hidden="true"> · </span>
            <Link href="/disclosures" className="underline underline-offset-4">Real Estate Disclosures</Link>
          </p>
        </div>
      ) : null}

      {screen.showText ? <TextUs intro={screen.textIntro} /> : null}
      {screen.showSocial ? <SocialLinks /> : null}

      {screen.type === "done" ? (
        <button
          type="button"
          onClick={onRestart}
          className="mt-8 text-[15px] text-muted underline underline-offset-4"
        >
          {screen.cta ?? "Start over"}
        </button>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" data-testid="error" className="mt-4 text-[15px] text-clay">
          {error}
        </p>
      ) : null}
    </div>
  );
}
