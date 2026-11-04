# StudentOS

StudentOS is a free, mobile-first global student super app that also adapts to desktop. This first release is an offline-ready PWA foundation: your study data stays in the browser on your device, with no account, paid API, or third-party runtime dependency.

The visual direction is a quiet, futuristic navy-and-neon-green workspace. The navigation is Home, Study, Focus, Discover, and Profile. Discover contains a searchable library for the current release and the wider product roadmap.

## What works in this MVP

- **Home dashboard:** today's timetable, upcoming tasks, attendance snapshot, recent notes, and progress.
- **Study:** subjects, weekly repeating class times, attendance records and percentages, tasks and deadlines, and editable notes.
- **Focus:** adjustable study and break timer, a no-pressure memory match and shape-finding game, and an optional guided breathing pause. The break activities do not award points or track performance. Completing a study timer adds 10 points; completing an assignment adds 5 points once.
- **Discover:** search and browse available tools, planned modules, and premium ideas. The current release is free and has no checkout or subscription setup.
- **Profile:** display name, larger text, reduced motion, local JSON backup and restore, and a clear-data action.
- **Getting started:** Home shows four small setup steps, and **How to use** opens a plain-language guide from any page.
- **PWA and offline shell:** manifest, installable app shell, and a service worker that caches the app files after the first online visit.

The app does not include accounts, cloud sync, AI services, payments, a community backend, marketplace listings, or document uploads. Roadmap cards in Discover are labels for future work; they do not imply that those services are connected.

## Run locally on Windows

The app has no build step and no package installation. It must be opened through a local web server for JavaScript modules and the service worker to work correctly.

1. Open the StudentOS project folder in File Explorer.
2. Click the address bar, type `powershell`, and press Enter. A PowerShell window opens in that folder.
3. Check that Python is installed:

   ```powershell
   python --version
   ```

4. Start the local web server:

   ```powershell
   python -m http.server 8000
   ```

   If Windows says `python` is not recognized, try `py --version`, then `py -m http.server 8000`. If neither command is available, use a free local preview feature in your code editor; the app itself still has no package installation or build step.

5. Open [http://localhost:8000](http://localhost:8000) in your browser.
6. Keep the PowerShell window open while using the app. Press **Ctrl+C** in that window when you are finished.

You can also serve this folder with a free editor's local preview feature. Do not open `index.html` with a `file:///` address: browsers restrict service workers and module imports on file URLs.

## Manual walkthrough

After opening the app locally, try these steps:

1. Go to **Study → Subjects** and add two subjects.
2. Open **Timetable**, add a weekday and time for each subject, then return to Home to see today's classes.
3. Open **Attendance**, log a present, late, and absent session. Confirm that present and late count as attended and that the percentage is `(present + late) ÷ all logged sessions × 100`.
4. Add a task with a due date, then mark it complete. The dashboard count should update and 5 XP should be added.
5. Add a note, reopen it, edit it, and check that it remains after a browser reload.
6. In **Focus**, change the focus duration to 1 minute, save it, start the timer, and let it finish. The session count should increase and 10 XP should be added; a break timer should appear.
7. In **Focus → Relax**, try Memory Match, Find the odd one, and the breathing pause. You can stop the breathing activity at any time.
8. In **Profile**, download a backup. Clear the app data, then restore the downloaded JSON file and confirm that your records return.
9. Visit the app once while online, then turn off Wi-Fi or use the browser's offline mode and reload. The cached app shell and local data should still open. Offline availability begins after the first successful online load.
10. Narrow the browser window or open the page on a phone-sized screen. The layout should switch to a five-button bottom navigation.

The app does not transmit your student records to a server. Browser storage may be removed by device or browser cleanup, so export a backup periodically and store it somewhere private.

## Deploy free with GitHub Pages

StudentOS is a static site, so it can be hosted on a free static hosting tier without a server or paid API.

1. Create a GitHub repository for the project, or open an existing repository you control.
2. Add the files from this folder to the **root** of the repository: `index.html`, `app.js`, `store.js`, `catalog.js`, `styles.css`, `manifest.webmanifest`, `service-worker.js`, and `icon.svg`. Include `README.md` too if you want the instructions on GitHub.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/ (root)` folder, then save.
6. Wait for the Pages deployment to finish. The Pages panel will show the published URL, usually `https://<account>.github.io/<repository>/`.
7. Open that HTTPS link, use the app once online, and then follow the offline walkthrough above.

GitHub Pages is one free option; other static hosts can publish the same files. Hosting providers can change their free-tier, age, and account rules. Follow the current provider terms for your location and involve a parent or guardian if the provider requires it.

## Data, validation, and versioning

- The browser stores a JSON record under the local key `studentos:data`. There is no login and no network request for user records.
- The current data format is version 1. `store.js` normalizes saved data and includes an explicit migration step for earlier version-0 prototype data. Future schema changes should increment `DATA_VERSION` and add a migration before the new shape is used.
- Backups include the app identifier, schema version, export time, and data. Restore checks the version, limits file size and field lengths, validates dates, times, IDs, statuses, numeric ranges, and subject references, then only accepts the known fields. Newer backup versions are refused so an older app does not overwrite a newer format.
- User-entered text is rendered as text, not executable markup. Imported JSON is parsed as data; it is never evaluated as code.
- If saved JSON cannot be read, StudentOS keeps a recovery copy in browser storage and starts with a clean working view. Open Profile and download that recovery copy before continuing. This recovery text may require manual review; it is not automatically restored as app data.
- Import replaces the current data, and Clear all removes it. Export a backup before either action if you want to preserve your records.

## Future product roadmap

The feature library identifies these as planned, not delivered: richer documents, a full calendar, habits, student budgets and scholarship discovery, career and internship tools, study groups and peer Q&A, a student marketplace and book exchange, wellness and study-balance tools, grade calculations, exam countdowns, commute utilities, more themes and languages, cloud sync, AI study help, widgets, and personal insights. The “Premium ideas” cards are unpriced concepts only; they do not offer or take payment. Each future module needs its own privacy, safety, accessibility, and product design work before implementation.

This MVP has no payment setup, monetization, or business account. The owner is 17. If monetization is considered later, involve a parent or guardian first and verify the current minimum-age and guardian requirements of every payment, hosting, and business provider. Do not work around provider age rules or create payment/business accounts without the required adult involvement.
