# Booking Price Placeholder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the booking footer's incomplete price placeholder while preserving every other preview and submission state.

**Architecture:** Keep the existing `previewState` state machine and backend-only pricing source unchanged. Modify only the final fallback branch in the booking footer template so the incomplete state renders no left-side price block; the existing flex layout will continue to align the submit button to the right.

**Tech Stack:** uni-app, Vue single-file component, WeChat Mini Program styles

## Global Constraints

- Do not display a local default amount.
- Preserve loading, error, priced, and free preview states.
- In successful preview states, render only the amount or the primary free-status label; render no secondary description.
- Preserve agreement validation, form validation, submission, and payment behavior.
- Do not modify unrelated staged changes in the working tree.

---

### Task 1: Remove the incomplete price placeholder

**Files:**
- Modify: `pages/booking-form/booking-form.vue:291-300`

**Interfaces:**
- Consumes: existing `previewState`, `previewResult`, `previewError`, and free-state computed properties.
- Produces: unchanged footer behavior except that `previewState === 'incomplete'` renders no `.price-info` block.

- [x] **Step 1: Record the current incomplete-state behavior**

Confirm that the final `v-else` branch renders `<text class="price-status-text">请完善信息</text>` after the loading and error branches.

- [x] **Step 2: Implement the minimal template change**

Delete only this final fallback branch:

```vue
<view class="price-info" v-else>
	<text class="price-status-text">请完善信息</text>
</view>
```

Keep the loading and error branches unchanged.

- [x] **Step 3: Verify the component and regression suite**

Run:

```bash
git diff --check -- pages/booking-form/booking-form.vue
node --experimental-default-type=module --test tests/*.test.js
```

Expected: `git diff --check` exits successfully and all Node tests pass. Review the focused diff to confirm no amount, preview, validation, or submission logic changed.

### Task 2: Remove successful-price secondary descriptions

**Files:**
- Modify: `pages/booking-form/booking-form.vue:249-290`

**Interfaces:**
- Consumes: existing priced and free preview branches.
- Produces: only the amount or primary free-status label in successful preview states.

- [x] **Step 1: Confirm the compiled footer still contains secondary price descriptions**

Inspect the successful preview branches for `.price-desc` nodes that render person counts or explanatory copy.

- [x] **Step 2: Remove only the successful-state `.price-desc` nodes**

Keep `.price-row`, `.price-symbol`, `.price-value`, loading, error, and submit-button branches unchanged.

- [x] **Step 3: Verify the focused diff and regression suite**

Run:

```bash
git diff --check -- pages/booking-form/booking-form.vue
node --experimental-default-type=module --test tests/*.test.js
```

Expected: the diff removes only secondary successful-state descriptions and all Node tests pass.
