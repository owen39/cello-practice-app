# Cello Practice Companion — UX audit

25 September 2026 · Senior UX review

## Scope and evidence

Reviewed the PM brief and the Today, Library, Overview, History, backup, and reminder components. Walked through the live local preview at `127.0.0.1:4174` on a desktop-sized viewport, including each empty state and the Library's lower sections. The preview had seeded areas but no exercises or logs. Populated states, the weekly reminder, and phone layout were assessed from components and CSS; a phone-sized browser viewport was unavailable to this subagent. Validate those states on an actual phone before calling the polish complete.

## Overall assessment

The four screens follow the brief's gentle, non-prescriptive approach. The dark green, warm neutral background, card treatment, typography, and primary/secondary actions are consistent. The fixed navigation is clear, with four easily named destinations. Empty states usually explain the next step. The main opportunity is to make a few actions and labels more predictable, and to give the user a way back from an accidental archive. No broad redesign is warranted.

## Findings and recommended fixes

| Priority | Finding and evidence | Bounded fix |
| --- | --- | --- |
| **P1** | **Archiving has no recovery path.** Library's exercise and area `Archive` buttons act immediately (`src/Library.tsx`, area rows and exercise cards); `src/repository.ts` exposes archive but no restore, and archived items vanish from Library. An accidental tap leaves no visible way to retrieve an exercise or area. | Add a small “Archived items” section or filter with `Restore` actions for exercises and areas. Add a short archive confirmation or immediate Undo message while restore is being built. Keep historical data intact. |
| **P1** | **History correction is a one-tap permanent removal.** `Delete entry` calls `deleteLog` directly (`src/History.tsx`). Today and Library call the same deletion for Undo, which is understandable immediately after marking; History may contain older entries and the label gives no second chance. | Confirm deletion in History with the exercise and date, or provide a reversible Undo notice. Keep the quick `Undo practice` action in Today. |
| **P2** | **Dates and recency use different formats.** Today shows raw `YYYY-MM-DD` (`src/Today.tsx`); Library exercise cards say `Last practiced YYYY-MM-DD` (`src/Library.tsx`); History formats a full human date and Overview uses relative wording (`src/display.ts`, `src/Overview.tsx`). | Use the existing `formatDay` for Today's date and `lastPracticedLabel` for Library cards. Choose one “past 7 / past 30 days” wording across Library and Overview. |
| **P2** | **The first-use path makes users hunt for Library.** Today is the landing screen, but its empty state only says “Add an exercise in the Library to get started”; there is no direct action (`src/Today.tsx`). On a phone, the add selector is disabled until that step is done. | Put a clear “Go to Library” action in the no-exercise state, wired to the existing page navigation. Keep Today as the default screen. |
| **P2** | **Bottom content can sit under iPhone's home indicator.** The fixed nav adds `env(safe-area-inset-bottom)` to its own padding, while `.app` always reserves only `84px` (`src/style.css`). The reserved content space can be shorter than the nav on devices with a bottom inset. | Include the safe-area inset in the app's bottom padding. Verify the final Library backup controls and History entries can scroll fully above the nav on an iPhone. |
| **P2** | **Backup success wording is stronger than what the app can verify.** Library announces “Backup downloaded” and the reminder closes when the browser download is triggered (`src/Library.tsx`, `src/BackupReminder.tsx`, `src/backupDownload.ts`). The app cannot confirm that the file was saved in Files, especially in an installed iPhone web app. | Say “Backup ready. Save the file somewhere safe” (or equivalent) and add a brief iPhone-oriented save hint if device testing shows a problem. Verify the installed PWA download and restore flow manually. |
| **P3** | **Restore control looks unlike the rest of the action system.** The native file input displays a browser-specific “Choose file / No file chosen” inside an otherwise carefully styled Library panel (observed in live preview; `src/Library.tsx`, `.backup-actions` in `src/style.css`). | Present “Restore a backup” as a styled button/label while retaining the accessible file input and its native picker. Show the selected filename only when useful. |
| **P3** | **Empty Library still shows Search.** With zero exercises, “Search exercises” is active above the “Start your library” empty card (`src/Library.tsx`); in the live preview it adds a control that cannot yield a result. | Hide or disable Search until an exercise exists; retain the current no-match state once searching is useful. |
| **P3** | **Overview begins with five zero rows on first use.** The seeded areas all show “Not practiced yet / 0 days” before the more useful “No exercises yet” message (observed in live preview; `src/Overview.tsx`). | When there are no exercises or logs, lead with one short getting-started state and reduce or collapse the zero area list. Do not change the normal overview once practice exists. |

## Flow assessment

- **Library and exercises:** Add and edit controls are compact and aligned; area management, grouping, search, and direct logging are discoverable. Recovery from archiving needs attention. The backup panel is logically placed but visually less polished at the file picker.
- **Today:** Flexible selection and one-tap logging fit the brief. The empty state needs a direct route to the prerequisite Library step, and the date should be human-readable.
- **Overview:** Neutral counts and recency avoid pressure or scoring. First-use zero rows obscure the useful next action; populated statistics are structurally clear in code.
- **History:** Date grouping and entry labels support review. Correction needs a safer interaction for older entries.
- **Backup and reminder:** Copy explains local storage and replacement on restore. The modal has clear primary and secondary actions and Escape postpones it; actual installed-iPhone file saving and modal layout remain unverified.
- **Navigation and responsive layout:** Desktop alignment and spacing are tidy. Four fixed destinations remain visible. CSS stacks forms and list actions below 620px, but a real phone-width walkthrough is still needed, particularly nav clearance, long exercise names, keyboard overlap, and backup controls.

## Suggested implementation order

1. P1 recovery/correction safeguards.
2. P2 dates, first-use route, safe-area spacing, and backup wording.
3. P3 polish, then a phone-width walkthrough of populated states and the reminder.

Keep these as small, independently reviewable changes; the current layout and information architecture can remain.
