import type { Answers, AreaId, Screen } from "@/lib/form/types";

const letter = (index: number) => String.fromCharCode(65 + index);

function withLetters<T extends { label: string }>(
  options: T[],
): Array<T & { letter: string }> {
  return options.map((option, index) => ({ ...option, letter: letter(index) }));
}

export const screens: Screen[] = [
  {
    id: "welcome",
    type: "welcome",
    eyebrow: "Welcome to",
    question: "SoCal’s New Homes",
    paragraphs: [
      "We’re so glad you’re here! Whether you’re ready to buy or just browsing, this quick form will help us better serve you",
      "Your dream home could be just a click away.",
    ],
    footnote: "Takes about 1 minute",
    cta: "Find my home",
    next: "journey",
  },
  {
    id: "journey",
    type: "single",
    field: "journey",
    question: "Where are you in your home buying journey?",
    autoAdvance: true,
    options: withLetters([
      { id: "ready", label: "I’m ready to buy and want help finding the right home." },
      { id: "soon", label: "I’m planning to buy within the next 3–6 months." },
      { id: "researching", label: "I’m still researching and comparing communities." },
      { id: "browsing", label: "I’m just browsing for now." },
    ]),
    branchingRules: [
      { when: "ready", next: "first-name" },
      { when: "soon", next: "first-name" },
      { when: "researching", next: "first-name" },
      { when: "browsing", next: "browsing" },
    ],
  },
  {
    id: "browsing",
    type: "info",
    question: "No problem.",
    paragraphs: [
      "Sometimes you just want to see what’s being built.",
      "Follow SoCal’s New Homes to discover new communities, builder incentives, model homes, and new-construction opportunities throughout Southern California.",
      "Whenever you’re ready to tour homes or want help comparing communities, we’ll be here.",
    ],
    showSocial: true,
    cta: "Done",
    next: "browsing-done",
  },
  {
    id: "browsing-done",
    type: "done",
    question: "You’re welcome anytime.",
    paragraphs: [
      "We’ll be here when you want to tour homes or compare communities.",
    ],
    showSocial: true,
    showText: true,
    textIntro: "Whenever you’re ready,",
    cta: "Start over",
  },
  {
    id: "first-name",
    type: "text",
    field: "firstName",
    question: "What’s your first name?",
    placeholder: "Type your answer here...",
    autoComplete: "given-name",
    cta: "OK",
    next: "last-name",
  },
  {
    id: "last-name",
    type: "text",
    field: "lastName",
    question: "What’s your last name?",
    placeholder: "Type your answer here...",
    autoComplete: "family-name",
    cta: "OK",
    next: "area",
  },
  {
    id: "area",
    type: "single",
    field: "area",
    question: "What part of Southern California are you interested in?",
    autoAdvance: false,
    options: withLetters([
      { id: "san-bernardino", label: "San Bernardino County" },
      { id: "riverside", label: "Riverside" },
      { id: "orange-county", label: "Orange County" },
      { id: "los-angeles", label: "Los Angeles County" },
      { id: "other", label: "Other" },
    ]),
    reveal: {
      when: "other",
      field: "areaOther",
      label: "Which area?",
      placeholder: "Type an area",
    },
    cta: "OK",
    next: "phone",
  },
  {
    id: "phone",
    type: "phone",
    field: "phone",
    question: "Perfect, {firstName}. What’s a good number to reach you?",
    description: "We’ll only use this to follow up about your home search. No spam.",
    placeholder: "(000)-000-0000",
    autoComplete: "tel",
    cta: "OK",
    next: "price",
  },
  {
    id: "price",
    type: "single",
    field: "price",
    question: "What price range are you looking in?",
    autoAdvance: true,
    options: withLetters([
      { id: "under-650", label: "Under $650k" },
      { id: "650-1m", label: "$650k–$1M" },
      { id: "1m-plus", label: "$1M+" },
      { id: "unsure", label: "Not sure yet" },
    ]),
    cta: "OK",
    next: "preferences",
  },
  {
    id: "preferences",
    type: "multi",
    field: "preferences",
    question: "What are you looking for in your next home?",
    description: "Choose every option that fits.",
    options: [
      { id: "beds-3", label: "3+ Bedrooms", group: "Size" },
      { id: "beds-4", label: "4+ Bedrooms", group: "Size" },
      { id: "beds-5", label: "5+ Bedrooms", group: "Size" },
      { id: "larger-lot", label: "Larger Lot", group: "Size" },
      { id: "single-story", label: "Single Story", group: "Layout" },
      { id: "two-story", label: "Two Story", group: "Layout" },
      { id: "next-gen", label: "Next Gen / Multi-Gen", group: "Layout" },
      { id: "adu", label: "ADU", group: "Layout" },
      { id: "low-hoa", label: "Low HOA", group: "Community" },
      { id: "no-hoa", label: "No HOA", group: "Community" },
      { id: "quick-move-in", label: "Quick Move-In", group: "Community" },
      { id: "incentives", label: "Builder Incentives", group: "Community" },
      { id: "new-community", label: "New Community", group: "Community" },
      { id: "age-55", label: "55+ Community", group: "Community" },
      { id: "unsure", label: "Not sure yet", group: "Other" },
    ],
    cta: "OK",
    next: "financing",
  },
  {
    id: "financing",
    type: "single",
    field: "financing",
    question: "Are you currently pre-approved for a home loan or purchasing with proof of funds?",
    autoAdvance: true,
    options: withLetters([
      { id: "preapproved", label: "Yes, I’m already pre-approved." },
      { id: "ready-to-preapprove", label: "Not yet, but I’m ready to get pre-approved." },
      { id: "cash", label: "I’m paying cash / have proof of funds." },
      { id: "figuring-out", label: "I’m still figuring out financing." },
    ]),
    cta: "OK",
    next: "timeline",
  },
  {
    id: "timeline",
    type: "single",
    field: "timeline",
    question: "When are you hoping to move?",
    autoAdvance: true,
    options: withLetters([
      { id: "asap", label: "As soon as possible" },
      { id: "1-3", label: "Within 1–3 months" },
      { id: "3-6", label: "Within 3–6 months" },
      { id: "6-plus", label: "6+ months" },
      { id: "exploring", label: "Just exploring" },
    ]),
    cta: "OK",
    next: "confirm",
  },
  {
    id: "confirm",
    type: "confirm",
    question: "You’re all set, {firstName}.",
    paragraphs: [
      "We’ll review what you’re looking for and reach out with new-home options that make sense for your search.",
      "Instead of sending random listings, our goal is to help narrow down communities, builders, incentives, and homes that actually fit what you’re looking for.",
    ],
    cta: "Submit my home search",
    next: "success",
  },
  {
    id: "success",
    type: "done",
    question: "Thank you, {firstName}.",
    paragraphs: [
      "Your home search has been received.",
      "We’ll review your preferences and reach out to help you explore available new-construction options.",
    ],
    showText: true,
    showSocial: true,
    textIntro: "For a faster response,",
    cta: "Start over",
  },
];

const byId = new Map(screens.map((screen) => [screen.id, screen]));

export function hasScreen(id: string): boolean {
  return byId.has(id);
}

export function getScreen(id: string): Screen {
  const screen = byId.get(id);
  if (!screen) throw new Error(`Unknown screen: ${id}`);
  return screen;
}

export function optionIds(screenId: string): string[] {
  return getScreen(screenId).options?.map((option) => option.id) ?? [];
}

export function optionLabel(screenId: string, optionId: string): string {
  return getScreen(screenId).options?.find((option) => option.id === optionId)?.label ?? optionId;
}

export function isAreaId(value: string): value is AreaId {
  return optionIds("area").includes(value);
}

export function validateScreenGraph(): void {
  for (const screen of screens) {
    if (screen.next && !hasScreen(screen.next)) {
      throw new Error(`Screen ${screen.id} points to unknown screen ${screen.next}`);
    }
    for (const rule of screen.branchingRules ?? []) {
      if (!hasScreen(rule.next)) {
        throw new Error(`Screen ${screen.id} branches to unknown screen ${rule.next}`);
      }
    }
  }
}

validateScreenGraph();

export function answerLabel(field: keyof Answers, value: string): string {
  const screen = screens.find((item) => item.field === field && item.options);
  return screen?.options?.find((option) => option.id === value)?.label ?? value;
}
