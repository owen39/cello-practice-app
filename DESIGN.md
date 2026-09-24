# Cello Practice Companion — technical design

Status: approved for implementation as a local-first PWA; cloud sync is a later, independent slice.  
Source: [PM brief](PROJECT_BRIEF.md), 24 September 2026.

## Goal and product rules

Help one cellist keep an exercise library, choose a flexible list for today, mark exercises practiced, and understand recency and frequency. The app must not prescribe a schedule, target, streak, or score. One tap records that an exercise was practiced on a local calendar day; duration is not required.

The first usable version works on one device without an account. This avoids blocking the core workflow on Supabase credentials or Google OAuth configuration. We will use the PWA and Supabase patterns from the existing *Do Idea* project where they fit, but will not import its project data model or sync implementation.

## Architecture

```text
React + TypeScript UI (Vite)
    ├── pure domain functions: date windows, distinct-day counts, projections
    ├── repository interface: areas, exercises, today selections, practice logs
    └── IndexedDB implementation (Dexie) → durable local data

PWA service worker → cached app shell for repeat offline visits

Later: Supabase Auth + Postgres/RLS + per-user sync adapter
```

The repository interface keeps screens independent of storage. The first adapter uses IndexedDB. A later cloud slice adds sign-in and synchronization without changing the four main screens. Static hosting can serve the Vite `dist` folder.

## Data model and invariants

| Entity | Fields | Rule |
| --- | --- | --- |
| Area | `id`, `name`, `sortOrder`, `archivedAt?`, timestamps | Seed Scales, Left hand, Bowing, Pieces, Other. Rename and archive; do not erase historical links. |
| Exercise | `id`, `areaId`, `name`, `archivedAt?`, timestamps | Exactly one current area. Archive rather than hard delete. |
| Today selection | `day` (`YYYY-MM-DD`), `exerciseId`, `createdAt` | Unique `(day, exerciseId)`. No carryover; an uncompleted selection expires from view tomorrow. |
| Practice log | `id`, `day`, `exerciseId`, `areaId`, `createdAt` | Unique `(day, exerciseId)`. `areaId` snapshots the area at logging time so later recategorization does not rewrite history. |

All days use the device's local calendar date, not UTC date. “Past 7 days” means today and the preceding 6 local dates; “past 30 days” means today and the preceding 29. An exercise count is distinct logged days. An area count is the union of logged days among its exercises, so two bowing exercises on one day count as one area day. Last practiced is the latest logged day. Logging twice is idempotent. Undoing a log removes only that log, not the Today selection. Removing a Today selection never removes a log.

Archived exercises remain named in history. Archived areas remain available for historical labels; removing an area with active exercises must require reassignment or archive those exercises together. For the first implementation, “remove area” means archive it after its active exercises are reassigned. This preserves the PM brief's remove capability without deleting data.

## Screens and interactions

1. **Today:** today's selected exercises with done state; add/remove from selection; one-tap log and undo. A user can also log directly from the library.
2. **Library:** active exercises grouped by area, search, add/edit/archive exercise, add/rename/archive area, recency and 7/30-day counts.
3. **Overview:** area and exercise counts for 7/30 days and last practiced, with neutral copy. No rankings or recommended plan.
4. **History:** reverse chronological dates and logged exercises, with delete correction.

Phone width is the primary layout. Navigation and action targets must work with touch and keyboard; counts must have text labels, not color alone. Empty states must explain the next action.

## Delegable slices

Each slice should be a separate Git commit and update `PROGRESS.md`. An agent may own one slice at a time; later slices depend on the preceding data contracts.

| Slice | Deliverable | Acceptance check |
| --- | --- | --- |
| 0. Foundation | Vite/React/TypeScript, PWA shell, shared navigation, IndexedDB schema/repository, seed areas, domain tests | App opens and installs; local data survives reload; build and tests pass. |
| 1. Library | Area/exercise CRUD and archive, grouped/searchable library | User creates, edits, searches, recategorizes, archives; history-safe semantics. |
| 2. Today and logging | Day selection, direct logging, undo, date rollover | No mandatory plan; one log per exercise/day; removing selection retains log. |
| 3. Overview and history | Pure statistics and both screens | Distinct-day area counts, 7/30-day windows, last dates, correction recomputes immediately. |
| 4. Finish local release | Mobile polish, accessible states, realistic workflow check, export/backup decision | PM acceptance criteria verified on phone width and desktop; offline reopen verified. |
| 5. Optional cloud sync | Supabase schema/RLS, auth, per-user local cache, resilient sync, deployment configuration | Two devices converge; offline edits sync after reconnect; access isolation and conflict behavior tested. |

Slice 5 requires a Supabase project and OAuth redirect configuration for a live deployment. It is not required for the local first release. Before implementing sync, choose an explicit conflict rule. If using an outbox, delete a queued entry only when its revision still matches the uploaded revision; the *Do Idea* implementation has a race if a newer local edit arrives during upload.

## Verification and release

Domain tests cover local day boundaries, distinct-day counting, recategorization, idempotent logging, and deletion. UI verification covers the core path: add exercise → select for today → log → view overview/history → undo → archive. Check a narrow phone viewport and offline reopen after an initial visit. `npm run build` is the required build gate for every slice.

No production deployment or account setup is needed to complete the local release. The repository should carry `.env.example`, migrations, and deployment instructions if slice 5 begins; no secret or Supabase service role key may enter the browser bundle.
