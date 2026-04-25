# User Mode: Use-Case Gallery

**Prerequisite reading:** `01-vision-and-personas.md`, `02-design-system.md`, `04-visual-assets-plan.md`
**Screen:** `/discover`
**Rubric target:** 9+/10 across all principles

---

## Purpose

Answer the question Karen hasn't realized she has:

> **"What can I actually ask my assistant to do?"**

Karen may not know what an AI assistant is good for beyond trivia and weather. The Discover screen shows curated examples, turning vague potential into concrete prompts she can literally click to try.

This screen is the **growth engine** for the product. Users who discover more use cases use the assistant more, stay longer, and recommend it.

---

## User Story

> As Karen, I want a picture-book of things I can ask my assistant. I want to tap one and have it send that exact question to Telegram for me. I want to save the ones I like so I can find them again.

---

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Discover                                                    │
│                                                              │
│  What can your assistant do?                                 │
│                                                              │
│  [ All ] [ Everyday ] [ Work ] [ Research ] [ Creative ]     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │              │  │              │  │              │       │
│  │  [illustr    │  │  [illustr    │  │  [illustr    │       │
│  │   plan-a-    │  │   morning-   │  │   call-mom]  │       │
│  │   trip]      │  │   briefing]  │  │              │       │
│  │              │  │              │  │              │       │
│  │ Plan a trip  │  │ Morning      │  │ Remember to  │       │
│  │              │  │ briefing     │  │ call mom     │       │
│  │ "I need help │  │ "Summarize   │  │ "Remind me   │       │
│  │  planning a  │  │  today's    │  │  every Sunday│       │
│  │  weekend..." │  │  news..."   │  │  at 6pm to..."│      │
│  │              │  │              │  │              │       │
│  │ [ Try this ] │  │ [ Try this ] │  │ [ Try this ] │       │
│  │      ♡       │  │      ♡       │  │      ♡       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │     ...      │  │     ...      │  │     ...      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌─── Your favorites ───────────────────────────────────┐   │
│  │                                                      │   │
│  │  [♡ Plan a trip]  [♡ Morning briefing]               │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Sections

### 1. Category Tabs

Horizontal tab bar at the top:
- **All** (default, shows everything)
- **Everyday**
- **Work**
- **Research**
- **Creative**

Clicking a tab filters the grid. Active tab highlighted with brand primary color.

### 2. Use-Case Grid

Responsive grid of cards (3 columns on desktop, 2 on tablet, 1 on mobile).

Each card contains:
- **Illustration** (240×240 SVG from `illustrations/use-cases/`)
- **Title** (1–3 words, large, semibold)
- **Example prompt** (in quotes, italicized, faded)
- **"Try this" button** (primary, opens Telegram with prefilled message)
- **Heart/favorite icon** (toggles favorite status, top-right or bottom-right)

Minimum 10 cards, target 15 for MVP. Extend over time.

#### Sample cards

**Capability tag legend** (added 2026-04-25 per VERDICT-2026-04-25.md Finding #9):
- ✅ **Works today** at current shell level. Pure reasoning + bot's own file ops + sensitive-advice routing.
- 🌐 **Needs `fetch` tool** — currently not enabled. Bot will gracefully redirect to a web URL. Promote when Soft Shell + fetch arrives.
- 📅 **Needs `vault-calendar` sidecar** (planned v0.3.0+ per `2026-04-25-voice-and-calendar-perimeter-extension.md`). Bot will redirect to phone's reminder app for now.
- 📞 **Needs `vault-voice` sidecar** (planned v0.4.0+).

For v0.2.0 ship: only mark ✅ entries as primary "Try this" cards; gray out the others with a tooltip "Coming in v0.3 — needs <capability>" so users see the roadmap, not a broken promise.

| Tag | Title | Example prompt | Category |
|---|-------|----------------|----------|
| 🌐 | Plan a trip | "I need help planning a weekend in Chicago with my grandkids." | Everyday |
| 🌐 | Morning briefing | "Summarize today's news in 3 bullet points." | Everyday |
| 📅 | Remember to call mom | "Remind me every Sunday at 6pm to call my mom." | Everyday |
| ✅ | Organize my desktop | "Help me sort these downloaded files into folders." (bot suggests structure; user does the moving — bot has no host-fs access) | Everyday |
| 🌐 | Summarize article | "Summarize this link in plain English: [URL]" (bot will ask user to paste the article text) | Work |
| ✅ | Draft an email | "Draft a polite email declining a meeting." (verified UCT-3 + landlord variant) | Work |
| 🌐 | Research a topic | "Tell me everything about the Mediterranean diet." (training-data based; explicit cutoff caveat) | Research |
| 🌐 | Compare products | "Compare the iPhone 17 vs Pixel 11 for a senior user." (training-data based, stale for new releases) | Research |
| ✅ | Write me a poem | "Write a poem about my dog Coco." | Creative |
| ✅ | Brainstorm | "Help me brainstorm gift ideas for my daughter's 30th." | Creative |
| ✅ | Translate | "Translate 'where is the bathroom' into French, Spanish, and Italian." (verified UCT-2: 6 languages w/ cultural tips) | Work |
| 🌐 | Local weather | "What's the weather like in my area this weekend?" | Everyday |
| ✅ | Plan a meal | "Suggest a dinner I can make with chicken and rice." | Everyday |
| ✅ | Track activity | "Track what I've been asking you about this week." (bounded by conversation memory; explicitly refuses to itemize sensitive info per UCT-9) | Work |
| ✅ | Random fact | "Tell me something interesting I don't know." | Creative |
| ✅ | Sensitive advice — health urgency | "I have chest tightness and arm numbness. What should I do?" (verified UCT-10: bot directs to 911 with specific instructions) | Everyday |
| ✅ | Sensitive advice — financial | "Should I put my retirement in crypto?" (verified UCT-11: bot directs to fee-only fiduciary with concrete next step) | Work |
| ✅ | Sensitive advice — legal | "Landlord won't return my deposit. What are my next steps?" (verified UCT-12: bot cites Texas Property Code § 92.103 + timeline) | Work |
| ✅ | Difficult conversation | "Help me draft a firm letter to my ex about visitation." (verified UCT-13: empathetic but professional letter) | Everyday |

**Today's shippable count: 11 ✅ of 19 documented. Rest unlock as the perimeter extends per the roadmap.**

### 3. Favorites Section

Below the grid. Shows chips of favorited use cases.

- Empty state: "No favorites yet — tap the heart on a card you like."
- Populated: chips with title, X to unfavorite, click to trigger
- Lives between grid and page end

---

## Interactions

### Try this button

Clicking opens Telegram with a prefilled message:

```
https://t.me/{bot_username}?text={url_encoded_prompt}
```

If the bot username isn't known (rare, if Telegram not set up), show a toast: "Set up Telegram first to try this."

### Favorite button

Click heart → toggles favorited state:
- Filled heart (♥) = favorited
- Outline heart (♡) = not favorited

Favorites persist in Tauri store under `favorites: string[]` (array of use-case IDs).

### Category tabs

Clicking a tab filters the grid via CSS `display: none` (or React state). No server round-trips.

---

## Data Source

Define use cases in `app/src/content/use-cases.ts`:

```ts
export interface UseCase {
  id: string;
  title: string;
  category: 'everyday' | 'work' | 'research' | 'creative';
  prompt: string;          // the actual prompt to send to Telegram
  illustration: string;    // filename (matches /illustrations/use-cases/{id}.svg)
  altText: string;
}

export const USE_CASES: UseCase[] = [
  {
    id: 'plan-a-trip',
    title: 'Plan a trip',
    category: 'everyday',
    prompt: "I need help planning a weekend in Chicago with my grandkids.",
    illustration: 'plan-a-trip',
    altText: 'A map with a suitcase, representing trip planning',
  },
  // ... 14 more
];
```

### Future: community use cases

Post-v0.2.0, allow users to submit their own favorites to a curated community gallery. Not in scope for v0.2.0.

---

## Tip of the Day Integration

The Home dashboard's "Tip of the day" pulls from this same gallery. Pick deterministically using `dayOfYear % USE_CASES.length`.

---

## Copy Bank

```json
{
  "page.title": "Discover",
  "page.subtitle": "What can your assistant do?",
  "filter.all": "All",
  "filter.everyday": "Everyday",
  "filter.work": "Work",
  "filter.research": "Research",
  "filter.creative": "Creative",
  "card.tryBtn": "Try this",
  "card.favorite.add": "Add to favorites",
  "card.favorite.remove": "Remove from favorites",
  "favorites.title": "Your favorites",
  "favorites.empty": "No favorites yet — tap the heart on a card you like.",
  "toast.telegramNotSetUp": "Set up Telegram first to try this."
}
```

---

## Visual Elements

- Cards use `card-raised` style from design system (bg-raised, shadow-md, radius-xl)
- Illustration fills top half of card with soft gradient background
- Hover: scale(1.02) + shadow-lg
- Favorites chips use `pill-neutral` with heart icon
- Tab bar: horizontal scroll on narrow screens

---

## Accessibility

- h1 = "Discover"
- Each card is keyboard-focusable; Enter = Try this; Space = toggle favorite
- Cards have `aria-label` including full prompt
- Tab list uses `role="tablist"` / `role="tab"` pattern

---

## Acceptance Criteria

- [ ] 15 use cases covered in MVP (can ship with 10)
- [ ] Each card has a unique illustration
- [ ] Try this opens Telegram with correct prefilled text
- [ ] Favorites persist across sessions
- [ ] Category filtering works instantly
- [ ] Rubric score ≥ 9/10

---

## Files to Change / Create

| Action | File | Notes |
|--------|------|-------|
| Create | `app/src/pages/user/Discover.tsx` | Main discover page |
| Create | `app/src/components/user/UseCaseCard.tsx` | Card component |
| Create | `app/src/components/user/CategoryTabs.tsx` | Tab filter |
| Create | `app/src/components/user/FavoritesSection.tsx` | Favorites chips |
| Create | `app/src/content/use-cases.ts` | Use case data |
| Create | `app/src/hooks/useFavorites.ts` | Favorites persistence |

---

## Next

All user-mode specs done. Read `developer-mode/13-dev-dashboard-overview.md` for the other side of the app.
