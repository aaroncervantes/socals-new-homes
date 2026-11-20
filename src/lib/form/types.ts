export type JourneyId = "ready" | "soon" | "researching" | "browsing";
export type AreaId =
  | "san-bernardino"
  | "riverside"
  | "orange-county"
  | "los-angeles"
  | "other";
export type PriceId = "under-650" | "650-1m" | "1m-plus" | "unsure";
export type FinancingId = "preapproved" | "ready-to-preapprove" | "cash" | "figuring-out";
export type TimelineId = "asap" | "1-3" | "3-6" | "6-plus" | "exploring";
export type PreferenceId =
  | "beds-3"
  | "beds-4"
  | "beds-5"
  | "larger-lot"
  | "next-gen"
  | "adu"
  | "single-story"
  | "two-story"
  | "low-hoa"
  | "no-hoa"
  | "quick-move-in"
  | "incentives"
  | "new-community"
  | "age-55"
  | "unsure";

export type Answers = {
  journey?: JourneyId;
  firstName?: string;
  lastName?: string;
  area?: AreaId;
  areaOther?: string;
  phone?: string;
  price?: PriceId;
  preferences?: PreferenceId[];
  financing?: FinancingId;
  timeline?: TimelineId;
  consent?: boolean;
};

export type Option = {
  id: string;
  label: string;
  letter?: string;
  group?: string;
};

export type ScreenType =
  | "welcome"
  | "single"
  | "text"
  | "phone"
  | "multi"
  | "info"
  | "confirm"
  | "done";

export type Screen = {
  id: string;
  type: ScreenType;
  field?: keyof Answers;
  eyebrow?: string;
  question?: string;
  description?: string;
  paragraphs?: string[];
  footnote?: string;
  placeholder?: string;
  autoComplete?: string;
  autoAdvance?: boolean;
  options?: Option[];
  reveal?: { when: string; field: "areaOther"; label: string; placeholder: string };
  next?: string;
  branchingRules?: { when: string; next: string }[];
  cta?: string;
  showSocial?: boolean;
  showText?: boolean;
  textIntro?: string;
};
