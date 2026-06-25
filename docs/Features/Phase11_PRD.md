# PRD — Phase 11: Wearables & HealthKit Integration

## Overview
Phase 11 bridges the gap between the web application and native mobile device telemetry. By integrating Capacitor, we will package the Next.js web app into native iOS and Android bundles. This allows us to request permissions for Apple Health and Google Fit/Health Connect, automating the logging of daily steps, sleep quality, and resting heart rate.

---

## Sub-Phase 11.1: Native App Configuration (Capacitor Setup)
**Estimated Time:** 25 mins

### Tasks:
- [x] 1. Install Capacitor CLI and core packages: `npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android`.
- [x] 2. Initialize the Capacitor project: `npx cap init "Gym Planner AI" "com.gymplanner.ai"`.
- [x] 3. Update `capacitor.config.ts` to point the `webDir` to Next.js's output directory (e.g., `out` or `.next`).
- [x] 4. Update `next.config.mjs` to enable static export (`output: 'export'`) required for native bundling.
- [x] 5. Add native platforms to the project: `npx cap add ios` and `npx cap add android`.
- [x] 6. Ensure routing in Next.js relies on HashRouter or handles static routing correctly without a Node server.

---

## Sub-Phase 11.2: HealthKit / Google Fit API Integration
**Estimated Time:** 35 mins

### Tasks:
- [x] 1. Install a community Capacitor HealthKit plugin (e.g., `@awesome-cordova-plugins/health` or a modern Capacitor equivalent).
- [x] 2. Open Xcode (`npx cap open ios`) and configure the `Info.plist` to include the `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` keys.
- [x] 3. Open Android Studio (`npx cap open android`) and configure the `AndroidManifest.xml` with Google Fit / Health Connect permissions.
- [x] 4. Create `src/lib/health/sync.ts` utility file.
- [ ] 5. Write `requestHealthPermissions()` to prompt the user natively.
- [ ] 6. Write `queryDailySteps()` to fetch the total steps from midnight to current time.
- [ ] 7. Write `querySleepData()` to fetch the total minutes of sleep from the previous night.

---

## Sub-Phase 11.3: Dashboard Telemetry UI
**Estimated Time:** 20 mins

### Tasks:
- [x] 1. Open `src/app/(app)/dashboard/page.tsx`.
- [x] 2. Create a new row of mini metric cards specifically for Wearable Data.
- [x] 3. Build a "Steps" card. Use a circular progress ring to show current steps vs a 10,000 step goal.
- [x] 4. Build a "Sleep" card. Display the hours/minutes slept and color code it (Green > 7hrs, Orange < 6hrs, Red < 5hrs).
- [x] 5. Add a manual "Sync Wearable" refresh button to trigger the Capacitor plugin on-demand.
- [x] 6. If the app is running in a standard web browser (not natively), hide these cards or show a placeholder prompting them to download the mobile app.

---

## Sub-Phase 11.4: Emotional Memory Syncing
**Estimated Time:** 15 mins

### Tasks:
- [x] 1. Modify the data flow so that upon successful health sync, the steps and sleep data are injected directly into the user's `emotional_memory`.
- [x] 2. Update the `emotional_memory` JSON structure to accept `latest_sleep_hours` and `latest_steps`.
- [x] 3. Update the `/api/chat` system prompt to actively review this new data before generating a workout plan.
- [ ] 4. Test the AI response: Manually inject a sleep value of 3 hours and verify the AI suggests a lighter recovery day.

---
**Status:** ~50% Complete (Health APIs are just stubbed/mocked, iOS missing, sleep testing pending)
