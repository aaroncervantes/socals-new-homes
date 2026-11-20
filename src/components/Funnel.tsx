"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { setAnalyticsContext, track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { CONSENT_VERSION } from "@/lib/consent";
import { fillCopy } from "@/lib/form/copy";
import { getScreen } from "@/lib/form/config";
import { resolveNext } from "@/lib/form/branching";
import { progressFor, questionNumber } from "@/lib/form/progress";
import { formatUsPhone } from "@/lib/form/phone";
import {
  clearFunnel,
  restoreFunnel,
  saveFunnel,
  type PersistedFunnel,
} from "@/lib/form/persistence";
import type { Answers } from "@/lib/form/types";
import { validateScreen } from "@/lib/form/validation";
import { ScreenView } from "@/components/ScreenView";
import { useViewport } from "@/components/useViewport";

const SEO_TITLE = "SoCal’s New Homes | New Construction Homes in Southern California";

export function Funnel() {
  useViewport();
  const reduce = useReducedMotion() === true;
  const [state, setState] = useState<PersistedFunnel | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [edge, setEdge] = useState(false);
  const stateRef = useRef<PersistedFunnel | null>(null);
  const lock = useRef<string | null>(null);
  const timer = useRef<number | null>(null);
  const submittingRef = useRef(false);
  const honeypot = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackedLanding = useRef(false);

  function commit(next: PersistedFunnel, persist = true) {
    stateRef.current = next;
    setState(next);
    const terminal = next.history.at(-1) === "success";
    if (persist && !terminal) saveFunnel(next);
  }

  useEffect(() => {
    const initial = restoreFunnel();
    stateRef.current = initial;
    setState(initial);
    setAnalyticsContext({ sessionId: initial.sessionId, attribution: initial.attribution });
  }, []);

  const currentId = state?.history.at(-1) ?? "welcome";

  useEffect(() => {
    lock.current = null;
    const node = scrollRef.current;
    node?.scrollTo(0, 0);
    const focus = node?.querySelector<HTMLElement>('[data-autofocus="true"]');
    focus?.focus({ preventScroll: true });
  }, [currentId]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const update = () => {
      const overflow = node.scrollHeight - node.clientHeight > 8;
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 8;
      setEdge(overflow && !atBottom);
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    return () => {
      node.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [currentId, state]);

  useEffect(() => {
    if (!state || trackedLanding.current) return;
    trackedLanding.current = true;
    const marker = `snh.landing.${state.sessionId}`;
    if (sessionStorage.getItem(marker) !== "1") {
      sessionStorage.setItem(marker, "1");
      track("landing_viewed");
    }
  }, [state]);

  const ready = state !== null;
  useEffect(() => {
    const current = stateRef.current;
    if (!current) return;
    const screen = getScreen(current.history.at(-1) ?? "welcome");
    if (screen.type === "welcome") {
      document.title = SEO_TITLE;
      return;
    }
    if (screen.question) {
      document.title = `${fillCopy(screen.question, current.answers)} · SoCal’s New Homes`;
    }
    if (screen.type === "done") return;
    track("question_viewed", {
      questionId: screen.id,
      branch: typeof current.answers.journey === "string" ? current.answers.journey : undefined,
    });
  }, [ready, currentId]);

  function continueFrom(screenId: string, override?: { field: keyof Answers; value: string }) {
    if (lock.current === screenId) return;
    const current = stateRef.current;
    if (!current || current.history.at(-1) !== screenId) return;
    const screen = getScreen(screenId);
    if (screen.type === "confirm") {
      void submit();
      return;
    }
    if (screen.type === "done") return;
    const answers = override
      ? ({ ...current.answers, [override.field]: override.value } as Answers)
      : current.answers;
    const problem = validateScreen(screen, answers);
    if (problem) {
      setError(problem);
      return;
    }
    const next = resolveNext(screenId, answers);
    if (!next) return;
    lock.current = screenId;
    setError(null);
    setDirection(1);
    const startedAt = current.startedAt ?? (screenId === "welcome" ? Date.now() : current.startedAt);
    commit({ ...current, answers, history: [...current.history, next], startedAt });
    if (screenId === "welcome") track("form_started");
    if (screen.type !== "welcome") {
      track("question_completed", {
        questionId: screenId,
        branch: typeof answers.journey === "string" ? answers.journey : undefined,
      });
    }
    if (screenId === "journey" && typeof answers.journey === "string") {
      if (answers.journey === "browsing") track("browsing_branch_entered");
      else track("qualified_branch_entered", { branch: answers.journey });
    }
  }

  function chooseSingle(id: string) {
    const current = stateRef.current;
    if (!current) return;
    const screenId = current.history.at(-1);
    if (!screenId) return;
    const screen = getScreen(screenId);
    if (screen.type !== "single" || !screen.field) return;
    const answers = { ...current.answers, [screen.field]: id } as Answers;
    commit({ ...current, answers });
    setError(null);
    if (!screen.autoAdvance) return;
    if (timer.current) window.clearTimeout(timer.current);
    const field = screen.field;
    timer.current = window.setTimeout(() => {
      continueFrom(screen.id, { field, value: id });
    }, 160);
  }

  function togglePreference(id: string) {
    const current = stateRef.current;
    if (!current) return;
    const existing = current.answers.preferences ?? [];
    let preferences: Answers["preferences"];
    if (id === "unsure") preferences = existing.length === 1 && existing[0] === "unsure" ? [] : ["unsure"];
    else if (existing.some((item) => item === id)) {
      preferences = existing.filter((item) => item !== id);
    } else {
      preferences = [...existing.filter((item) => item !== "unsure"), id as NonNullable<Answers["preferences"]>[number]];
    }
    commit({
      ...current,
      answers: { ...current.answers, preferences: preferences as Answers["preferences"] },
    });
    setError(null);
  }

  function setText(value: string) {
    const current = stateRef.current;
    if (!current) return;
    const screen = getScreen(current.history.at(-1) ?? "");
    if (screen.field !== "firstName" && screen.field !== "lastName" && screen.field !== "phone") return;
    const nextValue = screen.field === "phone" ? formatUsPhone(value) : value.slice(0, 40);
    commit({ ...current, answers: { ...current.answers, [screen.field]: nextValue } });
    setError(null);
  }

  function setCities(value: string) {
    const current = stateRef.current;
    if (!current) return;
    commit({ ...current, answers: { ...current.answers, cities: value.slice(0, 200) } });
    setError(null);
  }

  function setAreaOther(value: string) {
    const current = stateRef.current;
    if (!current) return;
    commit({ ...current, answers: { ...current.answers, areaOther: value.slice(0, 60) } });
    setError(null);
  }

  function setConsent(value: boolean) {
    const current = stateRef.current;
    if (!current) return;
    commit({ ...current, answers: { ...current.answers, consent: value } });
    setError(null);
  }

  function goBack() {
    if (timer.current) window.clearTimeout(timer.current);
    const current = stateRef.current;
    if (!current || current.history.length <= 1) return;
    lock.current = null;
    setDirection(-1);
    setError(null);
    commit({ ...current, history: current.history.slice(0, -1) });
  }

  function restart() {
    if (timer.current) window.clearTimeout(timer.current);
    clearFunnel();
    const fresh = restoreFunnel();
    if (fresh.history.length !== 1 || fresh.history[0] !== "welcome") {
      const blank = {
        ...fresh,
        history: ["welcome"],
        answers: {},
        idempotencyKey: crypto.randomUUID(),
        startedAt: null,
      };
      clearFunnel();
      commit(blank);
    } else {
      commit(fresh);
    }
    setAnalyticsContext({ sessionId: stateRef.current?.sessionId ?? fresh.sessionId, attribution: fresh.attribution });
    setDirection(1);
    setError(null);
  }

  async function submit() {
    const current = stateRef.current;
    if (!current || submittingRef.current) return;
    const screen = getScreen(current.history.at(-1) ?? "");
    const problem = validateScreen(screen, current.answers);
    if (problem) {
      setError(problem);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: current.idempotencyKey,
          startedAt: current.startedAt,
          honeypot: honeypot.current,
          consent: current.answers.consent === true,
          consentVersion: CONSENT_VERSION,
          answers: {
            journey: current.answers.journey,
            firstName: current.answers.firstName,
            lastName: current.answers.lastName,
            area: current.answers.area,
            areaOther: current.answers.areaOther ?? "",
            cities: current.answers.cities ?? "",
            phone: current.answers.phone,
            price: current.answers.price,
            preferences: current.answers.preferences ?? [],
            financing: current.answers.financing,
            timeline: current.answers.timeline,
          },
          attribution: current.attribution,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "We couldn’t save your request. Please try again.");
      }
      track("form_submitted", {
        branch: typeof current.answers.journey === "string" ? current.answers.journey : undefined,
      });
      clearFunnel();
      setDirection(1);
      const success: PersistedFunnel = { ...current, history: ["success"] };
      stateRef.current = success;
      setState(success);
      document.title = `Thank you, ${current.answers.firstName ?? ""} · SoCal’s New Homes`;
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn’t save your request. Please try again.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (event.key === "Escape") return;
      const current = stateRef.current;
      const screenId = current?.history.at(-1);
      if (!screenId) return;
      const screen = getScreen(screenId);
      if (event.key === "Enter") {
        if (typing && target instanceof HTMLInputElement && target.type === "checkbox") return;
        if (typing) return;
        event.preventDefault();
        if (screen.type === "confirm") void submit();
        else if (screen.type !== "done") continueFrom(screenId);
        return;
      }
      if (typing || event.key.length !== 1 || screen.type !== "single") return;
      const option = screen.options?.find((item) => item.letter?.toLowerCase() === event.key.toLowerCase());
      if (!option) return;
      event.preventDefault();
      chooseSingle(option.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!state) {
    return (
      <main className="funnel-root grid-rows-[auto_minmax(0,1fr)] bg-paper" aria-busy="true">
        <div className="pt-[env(safe-area-inset-top)]">
          <div className="h-0.5 bg-sand" />
        </div>
      </main>
    );
  }

  const screen = getScreen(currentId);
  const showBar = screen.type !== "done";
  const progress = progressFor(currentId, state.answers);
  const number = questionNumber(currentId, state.answers);
  const cta = submitting ? "Sending…" : (screen.cta ?? "OK");

  return (
    <form
      data-testid="funnel"
      className={cn(
        "funnel-root bg-paper",
        showBar ? "grid-rows-[auto_minmax(0,1fr)_auto]" : "grid-rows-[auto_minmax(0,1fr)]",
      )}
      noValidate
      aria-busy={submitting}
      onSubmit={(event) => {
        event.preventDefault();
        const screenId = stateRef.current?.history.at(-1);
        if (!screenId) return;
        const active = getScreen(screenId);
        if (active.type === "confirm") void submit();
        else if (active.type !== "done") continueFrom(screenId);
      }}
    >
      <div className="pt-[env(safe-area-inset-top)]">
        <div
          className="h-0.5 bg-sand"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Progress"
          data-testid="progress"
        >
          <div
            data-testid="progress-bar"
            className="h-full origin-left bg-ink transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
          />
        </div>
      </div>

        <div className="relative min-h-0 overflow-hidden">
        <AnimatePresence mode="sync" initial={false} custom={direction}>
          <motion.div
            key={currentId}
            ref={scrollRef}
            custom={direction}
            variants={{
              enter: (dir: number) => ({
                opacity: 0,
                x: reduce ? 0 : dir * 32,
                y: reduce ? 0 : 8,
              }),
              center: { opacity: 1, x: 0, y: 0 },
              exit: (dir: number) => ({
                opacity: 0,
                x: reduce ? 0 : dir * -24,
                y: reduce ? 0 : -6,
                pointerEvents: "none" as const,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              reduce
                ? { duration: 0.16, ease: "easeOut" }
                : { type: "spring", stiffness: 380, damping: 40, mass: 0.8 }
            }
            className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-y-contain"
          >
            <div className="mx-auto flex min-h-full w-full max-w-[640px] flex-col justify-center px-5 py-8 sm:px-8">
              <ScreenView
                screen={screen}
                answers={state.answers}
                number={number}
                error={error}
                onSingle={chooseSingle}
                onMulti={togglePreference}
                onText={setText}
                onCities={setCities}
                onAreaOther={setAreaOther}
                onConsent={setConsent}
                onRestart={restart}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {showBar ? (
        <div
          className={cn(
            "px-5 pt-3 sm:px-8",
            "pb-[max(0.85rem,env(safe-area-inset-bottom))]",
            edge ? "border-t border-line" : "border-t border-transparent",
          )}
        >
          <div className="mx-auto flex w-full max-w-[640px] items-center gap-3">
            {state.history.length > 1 ? (
              <motion.button
                type="button"
                data-testid="back"
                aria-label="Back"
                onClick={goBack}
                whileTap={reduce ? undefined : { scale: 0.96 }}
                transition={reduce ? { duration: 0.12 } : { type: "spring", stiffness: 500, damping: 40, mass: 0.7 }}
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-line bg-card text-ink"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none">
                  <path d="M11.5 3.5 6 9l5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            ) : null}
            <motion.button
              key={screen.type === "welcome" ? "welcome-cta" : "step-cta"}
              type="submit"
              data-testid="cta"
              disabled={submitting}
              initial={reduce || screen.type !== "welcome" ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={reduce || submitting ? undefined : { scale: 0.985 }}
              transition={
                reduce
                  ? { duration: 0.12 }
                  : { type: "spring", stiffness: 380, damping: 36, mass: 0.8, delay: screen.type === "welcome" ? 0.08 : 0 }
              }
              className="h-14 flex-1 rounded-full bg-ink px-5 text-[16.5px] font-medium text-paper disabled:opacity-60"
            >
              {cta}
            </motion.button>
          </div>
        </div>
      ) : null}

      <div className="hp" aria-hidden="true">
        <label>
          Company website
          <input
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
            onChange={(event) => {
              honeypot.current = event.target.value;
            }}
            name="company_website"
          />
        </label>
      </div>
    </form>
  );
}
