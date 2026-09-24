# Progress

This file tracks the current slice and completed work. Each completed slice should have a Git commit and a short verification record.

| Slice | Status | Owner | Evidence / next step |
| --- | --- | --- | --- |
| 0. Foundation | In progress | Senior developer agent | Build app shell, storage contracts, PWA, tests. |
| 1. Library | Queued | Unassigned | Start after foundation data contracts land. |
| 2. Today and logging | Queued | Unassigned | Start after library. |
| 3. Overview and history | Queued | Unassigned | Start after logging. |
| 4. Finish local release | Queued | Unassigned | Full workflow and phone/offline verification. |
| 5. Optional cloud sync | Deferred | Unassigned | Needs Supabase configuration and conflict policy. |

## Decisions

- 2026-09-24: Build a local-first PWA in the project mirror's `app/` Git repository. The mirror root does not permit `.git` creation.
- 2026-09-24: Preserve historical category at log time; archive rather than hard delete catalog data.
- 2026-09-24: Use local calendar days and distinct-day counts; no goals, scores, or streaks.
