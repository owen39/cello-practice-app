# Progress

This file tracks the current slice and completed work. Each completed slice should have a Git commit and a short verification record.

| Slice | Status | Owner | Evidence / next step |
| --- | --- | --- | --- |
| 0. Foundation | Complete | Senior developer agent | React/Vite PWA shell; IndexedDB repository and seed areas; domain and repository tests. `npm run build` and `npm test` pass (7 tests). |
| 1. Library | Complete | Senior developer agent | Area/exercise create, edit, recategorize, archive; grouped search; recency and 7/30-day counts; direct log/undo from library. Build and 8 tests pass. |
| 2. Today and logging | Complete | Senior developer agent | Daily selection, one-tap log/undo, removal independent of history, direct Library logs visible in Today. Local midnight/focus refresh. Build and 9 tests pass. |
| 3. Overview and history | Complete | Senior developer agent | Active area and exercise recency/counts; dated history with archived names and log correction. `npm run build` and `npm test` pass (13 tests). |
| 4. Finish local release | Complete | Senior developer agent + tech lead | Local backup/restore, setup docs, accessibility and phone layout polish. Build and 15 tests pass; live phone-width core flow and offline reopen passed. |
| 4a. Weekly backup reminder | Complete | Tech lead | Reminder after seven days of saved exercise data or the last backup/deferral; Download backup and Remind me next week actions. Build and 18 tests pass. |
| 4b. UX audit and recovery | Complete | Senior UX designer + senior developer agent | `UX_AUDIT.md` records flow findings; Library now exposes archived area/exercise restore, with area-first guard and History deletion confirmation. Repository restoration test passes. |
| 4c. UX consistency and polish | Complete in code; iPhone check pending | Senior developer agent | Human dates, matching recency/window labels, Today route to Library, safe-area clearance, backup copy, styled restore control, and cleaner first-use states. `npm test` passes 19 tests; `npm run build` passes. Desktop browser walkthrough at 390px confirms empty flows and backup controls clear the bottom nav. Installed iPhone save/restore remains manual. |
| 4d. Empty-state and form alignment | Complete | Tech lead | Matched Overview and History empty-state paragraph spacing; gave adjacent text inputs, selects, and form buttons the same explicit height. Build passes. A fresh live preview confirmed both empty cards have the same dimensions and Library/Today form controls align at 44px. |
| 4e. iPhone local-preview IDs | Complete in code; iPhone check pending | Tech lead | Replaced secure-context-only `crypto.randomUUID()` in app storage with UUID v4 generation from `crypto.getRandomValues()`, which also works over local-network HTTP. All 20 tests and the build pass; the app initialized in a live desktop browser through the LAN HTTP address. Refresh the iPhone preview to confirm there too. |
| 4f. iPhone Home Screen icon | Complete in code; iPhone check pending | Tech lead | Added explicit favicon and Apple touch icon links to the existing app artwork. Build passes and the LAN preview serves the touch PNG with HTTP 200; a new iPhone Home Screen addition needs visual confirmation. |
| 5. Optional cloud sync | Deferred | Unassigned | Needs Supabase configuration and conflict policy. |

## Decisions

- 2026-09-24: Build a local-first PWA in the project mirror's `app/` Git repository. The mirror root does not permit `.git` creation.
- 2026-09-24: Preserve historical category at log time; archive rather than hard delete catalog data.
- 2026-09-24: Use local calendar days and distinct-day counts; no goals, scores, or streaks.
- 2026-09-25: Repository methods guard active area/exercise references, keep archived catalog records, snapshot `areaId` in each log, and enforce one log per exercise and day. PWA includes 192px and 512px icons.
- 2026-09-25: Library archive area action is available only after all active exercises have been moved or archived. Direct library logging uses the same repository log and undo methods intended for Today, so subsequent screens share one source of truth.
- 2026-09-25: Today's selected list is keyed by local calendar day; old unfinished selections stay stored but are not shown on later days. The mounted app refreshes at local midnight and on focus/visibility, including the Library's logging date.
- 2026-09-25: Overview computes area counts from each log's saved area snapshot and counts distinct local days. History includes archived catalog names and deleting a log immediately reloads its date group; navigating to Overview recalculates totals from storage.
- 2026-09-25: Backup files include the complete local catalog, selections, and logs. Restore validates schema/version, uniqueness, dates, and references before an atomic replacement. Invalid backups leave existing data untouched.
- 2026-09-25: Backup reminders appear on app open/return once a week after exercise data exists. Reminder timing is a device-local preference and is not part of the practice backup.
- 2026-09-25: Archived areas and exercises can be restored from Library. An exercise in an archived area requires that area restored first. Archive prompts confirm the action; History deletion confirms the named exercise and date. Today's immediate Undo remains one tap.

## Local release verification

- 2026-09-25: `npm run build` generates the app, manifest, service worker, and precache; `npm test` passes 15 tests covering local dates, distinct area days, corrections, archived records, and backup round-trip/rejection.
- 2026-09-25: A live phone-width browser walkthrough passed add exercise → select for Today → log → verify counts and history → delete correction. The skip link was confirmed hidden until keyboard focus, and navigation from the bottom of Library was confirmed to open Overview at the top.
- 2026-09-25: Opened the production build at `127.0.0.1:4173`, loaded it twice, stopped the preview server, then reloaded successfully. Added an exercise while the server was stopped and confirmed it remained after another reload. This verifies offline app-shell loading and local writes on this browser; it does not test a deployed phone installation.
- 2026-09-25: UX follow-up build and 19 tests pass. In the live preview, Today's empty state opens Library, its archive section expands, and Overview leads with a single first-use card. At a 390px viewport, the final backup controls scroll fully above the fixed navigation. Populated archive/History interactions were covered by repository tests and code review; a second isolated local preview port was unavailable, so no browser data was changed for a populated walkthrough.
