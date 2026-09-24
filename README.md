# Cello Practice Companion

A phone-friendly, local-first practice log. Choose exercises for today, mark them practiced with one tap, and see when and how often you practiced each exercise and area. The app does not assign a schedule or target.

## Run locally

Requirements: Node.js 20.19 or newer (or 22.12 or newer) and npm.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. To check a release build:

```sh
npm test
npm run build
npm run preview
```

The production files are in `dist/`. Serve them over HTTPS for installation on a phone; `localhost` also supports service workers during development. After the first loaded visit, the installed PWA app shell is cached for offline reopening. Practice data is kept in this browser's IndexedDB on this device. The app has no account or cross-device sync.

## Using the app

1. In **Library**, add an exercise to a practice area. The five suggested areas can be renamed; you can add more.
2. In **Today**, add any exercises you want to keep in view. You can add or remove them at any time. You can also mark an exercise practiced directly from Library without adding it to Today.
3. Mark an exercise practiced once per local calendar day. Use **Undo practice** or delete a mistaken entry in **History** to correct it.
4. **Overview** shows the last practice day and distinct days practiced in the past 7 and 30 days. An area's count is the union of practice days for exercises logged in that area, so two exercises on the same day count once.

Unfinished Today selections do not carry over. Archiving an exercise removes it from the active Library but keeps its name in History. To archive an area, first move or archive its active exercises. Past logs retain the area they belonged to when recorded.

## Back up and restore

At the bottom of Library, **Download backup** saves all areas, exercises, Today selections, and practice logs as a JSON file. Keep that file somewhere safe. **Restore a backup** validates the file, asks for confirmation, then replaces all local practice data in one transaction. An invalid file leaves existing data intact. A backup is useful before clearing browser data or moving to a different device; there is no automatic cloud backup.

## Project layout

- `src/domain.ts`: local day and distinct-day calculations.
- `src/repository.ts`: storage contract.
- `src/storage.ts`: Dexie/IndexedDB implementation and atomic backup restore.
- `src/Today.tsx`, `src/Library.tsx`, `src/Overview.tsx`, `src/History.tsx`: the four screens.
- `DESIGN.md`, `PROJECT_BRIEF.md`, `PROGRESS.md`: product context and delivery record.

## Release scope

This is the local first release. Supabase sign-in and sync remain a separate future slice. The app can be run and built without Supabase credentials or an `.env` file.
