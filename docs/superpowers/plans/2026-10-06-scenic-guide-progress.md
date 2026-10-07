# Progress — 2026-10-06-scenic-guide.md

- User approved first-version implementation on 2026-10-06. Execute within that authorization without repeated approval gates.
- Ruling: keep changes in the three existing repository checkouts; the enclosing workspace is not a Git repository and existing user changes are confined to unrelated booking files. Preserve those changes and leave a reviewable working diff.
- Ruling (user steering): replace local uploads with Tencent COS browser direct upload. Server signs an expiring policy only; image URLs are HTTPS CDN URLs. No local image endpoint remains. Bucket/region/CDN pending input; credentials are env-only.
- Pre-flight: all clients share config fields; x/y normalized; image URL HTTPS; revision required for writes. Public filtering on backend. Interfaces aligned.
- Baseline: admin 4 tests passed. Mini 122/123 passed; existing quota-levels.test.js line 79 fails on existing booking-form style. Backend 378/402 passed in sandbox; 24 existing HTTP cases failed on EPERM listen. Escalation declined. New guide tests use stream-based HTTP transport without listening and retain real Express/Nest handlers.
- Task 1: implemented, 22 guide API tests passed; actual COS round-trip pending configuration.
- Task 2: implemented, 4 new tests passed, TypeScript passed.
- Task 3: implemented, 5 new tests passed; broader verification in progress.
- Local admin demo requested: added explicit `npm run dev:guide-demo`, loopback port4319. Uses original image + five sample points, in-memory mock API and image upload, blocks production proxies. Refresh keeps saved data; restart/reset restores samples. No Nest/COS configuration required.
- Admin verification: 10 tests pass, TypeScript and targeted ESLint pass, production build passes with existing large-bundle warning; production JavaScript contains no demo entry or endpoints. Browser verified selection/edit/hide, keyboard position changes, add point, save and reload persistence. Local server left running for user testing.
- User visual feedback: reduced admin map marker diameter30→20px and selection ring5→3px, retained30px pointer hit area; coordinates and draft unchanged.
