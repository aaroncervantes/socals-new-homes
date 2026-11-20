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
    next: "first-name",
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
    next: "journey",
  },
  {
    id: "journey",
    type: "single",
    field: "journey",
    question: "Where are you in your home buying journey?",
    autoAdvance: true,
    options: withLetters([
      { id: "ready", label: "I am ready to buy and need an agent to help!" },
      { id: "browsing", label: "I am just browsing for now, just want a list of homes." },
    ]),
    branchingRules: [
      { when: "ready", next: "area" },
      { when: "browsing", next: "browsing" },
    ],
  },
  {
    id: "browsing",
    type: "info",
    paragraphs: [
      "We totally get it — sometimes you just want to explore what’s out there.",
      "Hit “Continue” to browse available properties on our site, no strings attached.",
      "If you prefer you can always check out our site with homes on it. Go for it!",
      "And whenever you’re ready or have questions, we’re just a message away.",
    ],
    cta: "Browse homes",
    href: "https://cervantesre.com/",
  },
  {
    id: "area",
    type: "single",
    field: "area",
    question: "What part of Southern California are you interested in?",
    autoAdvance: false,
    options: withLetters([
      { id: "san-bernardino", label: "San Bernardino County" },
      { id: "riverside", label: "Riverside County" },
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
    description: "We keep it demure, no spammy texts from us.",
    placeholder: "(000)-000-0000",
    autoComplete: "tel",
    cta: "OK",
    next: "price",
  },
  {
    id: "price",
    type: "single",
    field: "price",
    question: "What is your Price Range?",
    autoAdvance: true,
    options: withLetters([
      { id: "200-450", label: "$200k-$450k" },
      { id: "500-750", label: "$500k-$750k" },
      { id: "800-950", label: "$800k-$950k" },
      { id: "1mil-plus", label: "$1Mil+" },
    ]),
    cta: "OK",
    next: "financing",
  },
  {
    id: "financing",
    type: "single",
    field: "financing",
    question: "Are you Pre-Approved for a Home Loan or have Proof of Funds?",
    description:
      "Please note, we need a PRE-APPROVED letter prior to any showings. This is a non-negotiable. If you’re looking to just view Homes, please visit our website to see all our latest listings.",
    descriptionLink: { text: "our website", href: "https://cervantesre.com/" },
    autoAdvance: true,
    options: withLetters([
      { id: "preapproved", label: "Yes, I have been Pre-Approved and I’m Ready" },
      { id: "ready-to-preapprove", label: "No, But I’m ready to get Approved ASAP" },
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
    paragraphs: [
      "God bless you and your family, Thank you for submitting your Inquiry.",
      "We will be reaching out via Text Message to coordinate a scheduled call with us. Please check your inbox and give us a couple days to reach out.",
      "Feel free to visit our socials to check out homes or see our reviews in the meantime!",
    ],
    supportEmail: "hello@cervantesestates.com",
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
