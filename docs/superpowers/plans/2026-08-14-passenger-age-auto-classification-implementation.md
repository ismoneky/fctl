# Passenger Age Auto Classification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let contacts and ordinary companions receive child/senior age-free pricing from their ID cards without being treated as age-restricted adults, while preserving explicit child/senior selection and mismatch validation.

**Architecture:** Separate the stored compatibility type (`adult` means no explicit child/senior selection) from the effective pricing type derived from a valid ID card and booking year. Implement the same resolver in the mini-program for immediate UI feedback and in NestJS as the authoritative validation/pricing source.

**Tech Stack:** uni-app Vue 3, JavaScript Node test runner, NestJS, TypeScript, Jest

## Global Constraints

- Age remains `booking year - ID-card birth year`.
- Ages 0–13 are child age-free; ages 70 and above are senior age-free.
- Contacts and ordinary companions must provide valid ID cards but have no adult-age restriction.
- Explicit child/senior selections keep their type-age mismatch validation and missing-ID behavior.
- Backend preview/create results remain authoritative; membership, daily quota, insurance, payment, and passenger limits do not change.

---

### Task 1: Mini-program effective type and summary

**Files:**
- Modify: `utils/passenger-pricing.js`
- Modify: `tests/passenger-pricing.test.js`

**Interfaces:**
- Consumes: `calculateYearAge(idCard, bookingDate)` and stored `passengerType`.
- Produces: `resolveEffectivePassengerType(passenger, bookingDate): 'adult' | 'child' | 'senior'` and date-aware `summarizePassengers(passengers, bookingDate)`.

- [x] **Step 1: Write failing frontend tests**

Add assertions that a stored `adult` with the age-13 ID resolves to `child`, a stored `adult` with the age-70 ID resolves to `senior`, age 14 resolves to `adult`, explicit child/senior values remain explicit, and `summarizePassengers` counts auto-classified people under child/senior when a booking date is supplied.

- [x] **Step 2: Verify the frontend tests fail**

Run `node --experimental-default-type=module --test tests/passenger-pricing.test.js`.

Expected: failure because `resolveEffectivePassengerType` is missing and the summary still counts stored `adult` values.

- [x] **Step 3: Implement the frontend resolver**

For explicit `child`/`senior`, return the stored type. For the compatibility `adult` value, return `child` for valid ages 0–13, `senior` for ages 70+, and `adult` for missing/invalid dates, invalid IDs, negative ages, or ages 14–69. Update `summarizePassengers` to use this resolver when `bookingDate` is provided.

- [x] **Step 4: Verify the focused frontend tests pass**

Run `node --experimental-default-type=module --test tests/passenger-pricing.test.js`.

Expected: all tests in the file pass.

### Task 2: Mini-program booking form feedback

**Files:**
- Modify: `pages/booking-form/booking-form.vue`
- Test: `tests/passenger-pricing.test.js`

**Interfaces:**
- Consumes: `resolveEffectivePassengerType` and `summarizePassengers(passengers, bookingDate)`.
- Produces: automatic child/senior counts and age-free labels for contacts/ordinary companions; explicit type controls remain unchanged.

- [x] **Step 1: Add a failing label-oriented pure-function assertion**

Assert through the resolver that an ordinary contact with the age-13 ID and an ordinary companion with the age-70 ID expose effective child/senior types without changing their stored `adult` compatibility values.

- [x] **Step 2: Verify the assertion fails before wiring**

Run `node --experimental-default-type=module --test tests/passenger-pricing.test.js`.

Expected: failure until the resolver API and form-facing behavior exist.

- [x] **Step 3: Wire the form to effective types**

Pass `formData.bookingDate` into `summarizePassengers`. Make `getAgeFreeLabel` use `resolveEffectivePassengerType`, and render the tags container when either an explicit type exists or an automatic age-free label exists. Render the “同行儿童/同行老人” type tag only for explicit selections; keep the automatic free label visible for contacts and ordinary companions. Do not add a selector or rewrite the stored compatibility value.

- [x] **Step 4: Run the full frontend suite**

Run `node --experimental-default-type=module --test tests/*.test.js`.

Expected: all frontend tests pass.

### Task 3: Backend authoritative effective type

**Files:**
- Modify: `../nest/src/modules/booking/passenger-pricing.ts`
- Modify: `../nest/src/modules/booking/passenger-pricing.spec.ts`

**Interfaces:**
- Consumes: `normalizePassengerType`, `validateChineseIdCard`, and `calculateYearAge`.
- Produces: `resolveEffectivePassengerType(passenger, bookingDate): PassengerType`, relaxed contact-age validation, and effective-type pricing snapshots.

- [x] **Step 1: Write failing backend unit tests**

Add cases where a contact stored as `adult` with an age-13 ID validates and prices as child-free, a companion stored as `adult` with an age-70 ID prices as senior-free, and an age-14 stored `adult` remains regular. Replace the old expectation that a child/senior contact is rejected; valid explicit child/senior contacts must pass. Preserve the test that an explicitly selected child aged 14 throws `PASSENGER_TYPE_AGE_MISMATCH`.

- [x] **Step 2: Verify backend unit tests fail**

Run `npx jest --runInBand src/modules/booking/passenger-pricing.spec.ts` from `nest`.

Expected: automatic classifications remain regular and the contact restriction still throws `CONTACT_INVALID`.

- [x] **Step 3: Implement backend resolution and contact validation**

Add the resolver with the same boundary logic as the frontend. Change the first-person rule to require an ID and reject `idCardUnavailable`, without requiring `PassengerType.ADULT`. Keep explicit child/senior mismatch validation. In `calculateAgePricing`, use the effective type for age-free calculation and returned `passengerType`; keep `ageValue` null for ordinary 14–69 people to preserve existing snapshots.

- [x] **Step 4: Verify backend unit tests pass**

Run `npx jest --runInBand src/modules/booking/passenger-pricing.spec.ts` from `nest`.

Expected: the focused suite passes.

### Task 4: Preview/create integration and final regression

**Files:**
- Modify: `../nest/src/modules/booking/booking-eligibility.spec.ts`
- Verify: `../nest/src/modules/booking/booking.service.ts`

**Interfaces:**
- Consumes: `validatePassengerBusinessRules` and `calculateAgePricing` through the existing preview/create flow.
- Produces: consistent amount, free reason, and stored passenger snapshots for automatically classified contacts and ordinary companions.

- [x] **Step 1: Write failing integration tests**

Add a non-member/non-quota case with an age-13 contact stored as `adult` and assert age-free pricing, then create an order with an ordinary age-70 companion stored as `adult` and assert its snapshot is `senior`, `ageFree=true`, and `pricingReason='senior_age_free'`.

- [x] **Step 2: Verify integration tests fail**

Run `npx jest --runInBand src/modules/booking/booking-eligibility.spec.ts` from `nest`.

Expected: old pricing treats both stored `adult` records as regular.

- [x] **Step 3: Complete minimal integration adjustments**

Use the effective pricing results already consumed by `booking.service.ts`; only adjust service code if a test proves it is overriding the resolved `passengerType` or age-free snapshot.

- [x] **Step 4: Run all verification commands**

Run:

- `node --experimental-default-type=module --test tests/*.test.js` from `fctl`.
- `npx jest --runInBand` from `nest`.
- `npm run test:diagnostics` from `nest` (outside the sandbox if local port binding is denied).
- `npm run build` from `nest`.
- `git diff --check` in both repositories.

Expected: all suites and build pass with no whitespace errors.
