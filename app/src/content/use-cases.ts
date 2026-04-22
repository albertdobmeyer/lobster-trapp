export type UseCaseCategory = "everyday" | "work" | "research" | "creative";

export interface UseCase {
  id: string;
  title: string;
  category: UseCaseCategory;
  /** Exact prompt text sent to Telegram via deep-link. */
  prompt: string;
  /** Filename stem under app/src/assets/illustrations/use-cases/ (e.g. "plan-a-trip" → plan-a-trip.svg). */
  illustration: string;
  altText: string;
}

export const USE_CASE_CATEGORIES: { id: UseCaseCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "everyday", label: "Everyday" },
  { id: "work", label: "Work" },
  { id: "research", label: "Research" },
  { id: "creative", label: "Creative" },
];

/** Populated in Phase E.2.6 — 15 entries. */
export const USE_CASES: UseCase[] = [];
