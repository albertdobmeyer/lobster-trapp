export type FAQCategory =
  | "getting-started"
  | "keys"
  | "security"
  | "troubleshooting"
  | "privacy"
  | "updates";

export type FAQAnswerBlockType =
  | "paragraph"
  | "list"
  | "screenshot"
  | "callout";

export interface FAQAnswerBlock {
  type: FAQAnswerBlockType;
  /** Plain text for paragraph/callout, JSX-safe HTML disallowed. List uses string[]. */
  content: string | string[];
  /** Asset path under app/src/assets/help-screenshots/ for screenshot blocks. */
  imageSrc?: string;
  altText?: string;
}

export interface FAQ {
  id: string;
  category: FAQCategory;
  question: string;
  answer: FAQAnswerBlock[];
  /** ids of related FAQs to surface at the bottom of the detail view. */
  related: string[];
}

export const FAQ_CATEGORIES: { id: FAQCategory; label: string; emoji: string }[] = [
  { id: "getting-started", label: "Getting started", emoji: "🏁" },
  { id: "keys", label: "Keys & accounts", emoji: "🔑" },
  { id: "security", label: "Security", emoji: "🛡️" },
  { id: "troubleshooting", label: "Troubleshooting", emoji: "🔧" },
  { id: "privacy", label: "Privacy", emoji: "🔒" },
  { id: "updates", label: "Updates & billing", emoji: "💳" },
];

/** Populated in Phase E.2.5 — 30 entries (5 per category). */
export const FAQS: FAQ[] = [];
