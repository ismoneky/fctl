# Child Age Limit 13 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ages 0–13 valid and age-free for child passengers while rejecting age 14 and keeping the senior boundary unchanged.

**Architecture:** Keep the existing year-only age calculation and update the shared child boundary independently in the mini-program and Nest backend. Drive both changes with boundary tests, then update all user-visible child-age copy and generate algorithmic test IDs from the same MOD 11-2 helper used by tests.

**Tech Stack:** uni-app Vue 3, Node test runner, NestJS, TypeScript, Jest

## Global Constraints

- Age remains `booking year - ID-card birth year`.
- Ages `0–13` satisfy the child rule; age `14` does not.
- Senior age remains `>= 70`.
- Backend remains the authoritative validation and pricing boundary.
- Existing free-priority, missing-ID, insurance, and submission behavior must not change.

---

### Task 1: Update mini-program child boundary

**Files:**
- Modify: `utils/passenger-pricing.js`
- Modify: `tests/passenger-pricing.test.js`
- Modify: `components/child-senior-passenger-popup.vue`
- Modify: `pages/booking-form/booking-form.vue`
- Modify: `utils/passenger-display.js`

**Interfaces:**
- Consumes: `calculateYearAge(idCard, bookingDate)`.
- Produces: `CHILD_MAX_AGE = 13`, child validation copy, and child-free display copy.

- [x] **Step 1: Change frontend boundary tests to 13/14**

Use birth years 2013 and 2012 with booking year 2026. Assert age 13 passes, age 14 returns `身份证年龄不符合13岁及以下儿童条件`, and the child display label is `13岁及以下，年龄免费`.

- [x] **Step 2: Run frontend tests and verify the new assertions fail**

Run `node --experimental-default-type=module --test tests/passenger-pricing.test.js tests/passenger-display.test.js`.

Expected: failures still show the old 7-year constant or copy.

- [x] **Step 3: Implement the frontend boundary and copy**

Set `CHILD_MAX_AGE` to `13`, use it in booking-form display logic, and replace all active UI copy from “7岁及以下” to “13岁及以下”.

- [x] **Step 4: Run the full frontend suite**

Run `node --experimental-default-type=module --test tests/*.test.js`.

Expected: all frontend tests pass.

### Task 2: Update backend validation and pricing boundary

**Files:**
- Modify: `../nest/src/modules/booking/passenger-pricing.ts`
- Modify: `../nest/src/modules/booking/passenger-pricing.spec.ts`
- Modify: `../nest/src/modules/booking/booking-eligibility.spec.ts`
- Modify: `../nest/src/modules/booking/dto/passenger-dto.spec.ts`

**Interfaces:**
- Consumes: `calculateYearAge(idCard, bookingDate)`.
- Produces: backend `CHILD_MAX_AGE = 13`, matching validation copy, and age-free pricing for age 13.

- [x] **Step 1: Change backend boundary tests to 13/14**

Use `makeIdCard('20130101')` for age 13 and `makeIdCard('20120101')` for age 14 under `BOOKING_2026`. Assert age 13 validates and prices free; age 14 throws `TYPE_AGE_MISMATCH`.

- [x] **Step 2: Run focused backend tests and verify they fail**

Run `npm test -- --runInBand src/modules/booking/passenger-pricing.spec.ts src/modules/booking/booking-eligibility.spec.ts` from `nest`.

Expected: the age-13 case fails under the old boundary.

- [x] **Step 3: Implement the backend boundary and copy**

Set backend `CHILD_MAX_AGE` to `13` and replace the active validation label with `13岁及以下儿童`.

- [x] **Step 4: Run backend tests and build**

Run `npm test -- --runInBand` and `npm run build` from `nest`.

Expected: tests and TypeScript build pass.

### Task 3: Produce test identity numbers and final consistency check

**Files:**
- Verify: all active source and test files under `fctl` and `nest`

**Interfaces:**
- Consumes: the MOD 11-2 `makeIdCard` algorithm already used by both test suites.
- Produces: one fictional age-13 child ID and one fictional age-70 senior ID for booking year 2026.

- [x] **Step 1: Generate the two IDs**

Generate IDs for birth dates `2013-01-01` and `1956-01-01` with non-production sequence values and verify both pass the frontend and backend validators.

- [x] **Step 2: Scan active source for stale copy**

Search active `.vue`, `.js`, and `.ts` files for `7岁及以下`, `CHILD_MAX_AGE = 7`, or direct `age <= 7` checks. Historical plan documents are superseded by the new design and do not control runtime behavior.

- [x] **Step 3: Review final diffs**

Confirm the changes affect only the child threshold, related copy, boundary tests, and previously requested uncommitted UI work.
