# iPhone offline setup

The production build already caches the app shell and keeps practice records in IndexedDB. Offline reopening needs a service worker, which iPhone browsers only allow from a trusted HTTPS address. The current `http://192.168…` development shortcut cannot provide that, even when added to the Home Screen.

## Prepared HTTPS route

The repository includes a manual GitHub Pages workflow. It builds the app for `https://owen39.github.io/cello-practice-app/`, runs tests, and publishes only the generated static files. The workflow does not publish automatically. GitHub Pages must be enabled with **Settings → Pages → Build and deployment → GitHub Actions**. The resulting website is public even if the repository is private; practice records are not included in the build and stay on the device. GitHub plan eligibility for Pages on a private repository must be checked before enabling it.

## Move the current phone data and verify

1. In the current iPhone shortcut, use **Library → Download backup** and save the JSON file somewhere you can find it.
2. Once the HTTPS site is live, open it in Safari while online, let the app finish loading, then use **Add to Home Screen**.
3. Open the new Home Screen app and use **Library → Restore a backup**. The HTTPS site has a different address and therefore a separate local data store.
4. Confirm the exercises and History are present. Then enable Airplane Mode, close the app, and reopen it from the Home Screen. Add and mark a test exercise to check local writes offline.
5. Keep the backup file. Do not remove the old shortcut until the new app and its data work offline.

The first visit and future updates need a connection. Normal practice logging, History, Overview, and local backup export use only files and data on the device after installation. If iOS clears the app's local storage, restore from a saved backup.
