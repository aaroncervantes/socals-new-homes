export type JourneyId = "ready" | "soon" | "researching" | "browsing";
export type AreaId =
  | "san-bernardino"
  | "riverside"
  | "orange-county"
  | "los-angeles"
  | "other";
export type PriceId = "200-450" | "500-750" | "800-950" | "1mil-plus";
export type FinancingId = "preapproved" | "ready-to-preapprove";
export type TimelineId = "asap" | "1-3" | "3-6" | "6-plus" | "exploring";
export type Answers = {
  journey?: JourneyId;
  firstName?: string;
  lastName?: string;
  area?: AreaId;
  areaOther?: string;
  phone?: string;
  price?: PriceId;
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
  href?: string;
  descriptionLink?: { text: string; href: string };
  supportEmail?: string;
  showCall?: boolean;
  showSocial?: boolean;
  showText?: boolean;
  textIntro?: string;
};
