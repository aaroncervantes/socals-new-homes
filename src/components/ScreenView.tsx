import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { fillCopy } from "@/lib/form/copy";
import type { Answers, Option, Screen } from "@/lib/form/types";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/Logo";
import { brand } from "@/lib/brand";
import { SocialLinks, TextUs } from "@/components/SocialLinks";

type Props = {
  screen: Screen;
  answers: Answers;
  number: number | null;
  error: string | null;
  onSingle: (id: string) => void;
  onText: (value: string) => void;
  onAreaOther: (value: string) => void;
  onRestart: () => void;
};

const settle = { type: "spring" as const, stiffness: 520, damping: 40, mass: 0.62 };
const displayTitle =
  "font-serif tracking-[-0.03em] text-ink outline-none text-center text-[2.6rem] leading-[1.05] sm:text-6xl";

function LinkedCopy({
  text,
  link,
}: {
  text: string;
  link?: { text: string; href: string };
}) {
  if (!link || !text.includes(link.text)) return text;
  const [before, after] = text.split(link.text);
  return (
    <>
      {before}
      <a href={link.href} className="underline underline-offset-4">
        {link.text}
      </a>
      {after}
    </>
  );
}

function ChoiceFace({ option }: { option: Option }) {
  return (
    <>
      {option.letter ? (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-current/30 text-[13px] font-medium">
          {option.letter}
        </span>
      ) : null}
      <span>{option.label}</span>
    </>
  );
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
  const reduce = useReducedMotion() === true;
  return (
    <motion.button
      type="button"
      role={pressed ? "radio" : undefined}
      aria-checked={pressed ? selected : undefined}
      aria-pressed={pressed ? undefined : selected}
      data-testid={`option-${option.id}`}
      onClick={onClick}
      variants={{
        hidden: { opacity: reduce ? 1 : 0 },
        show: { opacity: 1, transition: reduce ? { duration: 0.16 } : settle },
      }}
      whileTap={reduce ? undefined : { scale: 0.975 }}
      transition={reduce ? { duration: 0.12 } : settle}
      className="relative flex min-h-14 w-full overflow-hidden rounded-2xl border border-line bg-card text-left text-[16.5px] leading-snug text-ink"
    >
      <span className="relative z-10 flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3">
        <ChoiceFace option={option} />
      </span>
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 flex items-center bg-ink text-paper"
        initial={false}
        animate={
          reduce
            ? { opacity: selected ? 1 : 0, clipPath: "inset(0% 0% 0% 0%)" }
            : { opacity: 1, clipPath: selected ? "inset(0% 0% 0% 0%)" : "inset(0% 100% 0% 0%)" }
        }
        transition={reduce ? { duration: 0.16, ease: "easeOut" } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3">
          <ChoiceFace option={option} />
        </span>
      </motion.span>
    </motion.button>
  );
}

export function ScreenView({
  screen,
  answers,
  number,
  error,
  onSingle,
  onText,
  onAreaOther,
  onRestart,
}: Props) {
  const reduce = useReducedMotion() === true;
  const titleId = `${screen.id}-title`;
  const inputId = `${screen.id}-answer`;
  const errorId = `${screen.id}-error`;
  const question = screen.question ? fillCopy(screen.question, answers) : "";
  const selectedSingle = screen.field ? answers[screen.field] : undefined;
  const showOther = Boolean(screen.reveal && selectedSingle === screen.reveal.when);
  const textValue =
    screen.field === "firstName" || screen.field === "lastName" || screen.field === "phone"
      ? (answers[screen.field] ?? "")
      : "";
  const list = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.028, delayChildren: reduce ? 0 : 0.02 },
    },
  };

  return (
    <div data-testid={`screen-${screen.id}`}>
      {screen.type === "welcome" ? (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.16 }}
          animate={reduce ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [1.16, 0.96, 1] }}
          transition={
            reduce
              ? { duration: 0.16, ease: "easeOut" }
              : { duration: 0.42, times: [0, 0.58, 1], ease: [0.16, 1, 0.3, 1] }
          }
          className="mb-2 flex justify-center"
        >
          <Logo className="h-48 w-48 sm:h-56 sm:w-56" />
        </motion.div>
      ) : null}

      {number != null ? (
        <p className="text-[13px] font-medium tracking-[0.14em] text-clay">
          <span>{number}</span>
          <span aria-hidden="true"> →</span>
        </p>
      ) : null}

      {screen.eyebrow ? (
        <p
          className={cn(
            "text-[13px] font-medium uppercase tracking-[0.18em] text-clay",
            screen.type === "welcome" && "text-center",
          )}
        >
          {screen.eyebrow}
        </p>
      ) : null}

      {question ? (
        <h1
          id={titleId}
          tabIndex={-1}
          data-autofocus={screen.type === "text" || screen.type === "phone" ? undefined : "true"}
          className={cn(
            screen.type === "welcome"
              ? cn(displayTitle, "mt-1")
              : "mt-3 font-serif text-[1.85rem] leading-[1.15] tracking-[-0.03em] text-ink outline-none sm:text-[2.35rem]",
            number == null && !screen.eyebrow ? "mt-0" : "",
          )}
        >
          {question}
        </h1>
      ) : null}

      {screen.description ? (
        <p
          className={cn(
            "mt-3 max-w-xl text-[16.5px] leading-relaxed text-muted",
            screen.type === "welcome" && "mx-auto text-center",
          )}
        >
          <LinkedCopy text={fillCopy(screen.description, answers)} link={screen.descriptionLink} />
        </p>
      ) : null}

      {screen.type === "done" && screen.paragraphs?.[0] ? (
        <motion.h1
          data-testid="thanks-line"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.14 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduce
              ? { duration: 0.16, ease: "easeOut" }
              : { type: "spring", stiffness: 640, damping: 24, mass: 0.58 }
          }
          className={cn(displayTitle, "mt-1 text-balance")}
        >
          {fillCopy(screen.paragraphs[0], answers)}
        </motion.h1>
      ) : null}

      {screen.paragraphs?.length ? (
        <div
          className={cn(
            "mt-5 space-y-4 text-[17px] leading-relaxed text-ink/90",
            screen.type === "welcome" &&
              "mx-auto mt-7 max-w-[34ch] space-y-5 text-center text-[17px] leading-[1.5] text-balance text-ink sm:max-w-[40ch] sm:text-[18px]",
          )}
        >
          {(screen.type === "done" ? screen.paragraphs.slice(1) : screen.paragraphs).map((paragraph) => (
            <p key={paragraph}>{fillCopy(paragraph, answers)}</p>
          ))}
        </div>
      ) : null}

      {screen.supportEmail ? (
        <p className="mt-5 text-[16.5px] leading-relaxed text-ink/90">
          Support Email:{" "}
          <a href={`mailto:${screen.supportEmail}`} className="underline underline-offset-4">
            {screen.supportEmail}
          </a>
        </p>
      ) : null}

      {screen.showCall ? (
        <p className="mt-6 text-[17px] leading-relaxed text-ink">
          <a
            href={`tel:${brand.textNumberE164}`}
            data-testid="text-number"
            className="underline decoration-ink/30 underline-offset-4"
          >
            {brand.textNumberDisplay}
          </a>
        </p>
      ) : null}

      {screen.footnote ? (
        <p
          className={cn(
            "mt-6 text-[15px] text-muted",
            screen.type === "welcome" && "mt-8 text-center text-[14px] tracking-[0.01em]",
          )}
        >
          {screen.footnote}
        </p>
      ) : null}

      {screen.type === "single" && screen.options ? (
        <motion.div
          role="radiogroup"
          aria-labelledby={titleId}
          className="mt-8 flex flex-col gap-2.5"
          initial="hidden"
          animate="show"
          variants={list}
        >
          {screen.options.map((option) => (
            <ChoiceButton
              key={option.id}
              option={option}
              selected={selectedSingle === option.id}
              pressed
              onClick={() => onSingle(option.id)}
            />
          ))}
        </motion.div>
      ) : null}

      <AnimatePresence initial={false}>
        {showOther && screen.reveal ? (
          <motion.label
            key="area-other"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            transition={reduce ? { duration: 0.12 } : settle}
            className="mt-5 block"
          >
            <span className="text-[15px] text-muted">{screen.reveal.label}</span>
            <input
              data-testid="area-other-input"
              value={answers.areaOther ?? ""}
              placeholder={screen.reveal.placeholder}
              maxLength={60}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => onAreaOther(event.target.value)}
              className="mt-2 w-full appearance-none border-0 border-b border-ink/25 bg-transparent py-2 text-[18px] text-ink shadow-none outline-none placeholder:text-[#8a847c] focus:border-ink focus:outline-none focus-visible:outline-none"
            />
          </motion.label>
        ) : null}
      </AnimatePresence>

      {screen.type === "text" || screen.type === "phone" ? (
        <div className="mt-8">
          <label className="sr-only" htmlFor={inputId}>
            {question}
          </label>
          <input
            id={inputId}
            data-testid="text-input"
            data-autofocus="true"
            type={screen.type === "phone" ? "tel" : "text"}
            value={textValue}
            placeholder={screen.placeholder}
            autoComplete={screen.autoComplete}
            inputMode={screen.type === "phone" ? "tel" : "text"}
            maxLength={screen.type === "phone" ? 16 : 40}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => onText(event.target.value)}
            className={cn(
              "w-full appearance-none border-0 border-b border-ink/25 bg-transparent py-3 font-serif text-[1.7rem] leading-tight text-ink shadow-none outline-none placeholder:text-[#8a847c] focus:border-ink focus:outline-none focus-visible:outline-none",
            )}
          />
        </div>
      ) : null}

      {screen.showText ? <TextUs intro={screen.textIntro} /> : null}
      {screen.showSocial ? <SocialLinks /> : null}

      {screen.type === "done" && screen.cta ? (
        <button
          type="button"
          onClick={onRestart}
          className="mt-8 text-[15px] text-muted underline underline-offset-4"
        >
          {screen.cta}
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
