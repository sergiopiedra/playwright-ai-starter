---
name: fix-flaky-test
description: Diagnose and fix a flaky Playwright test in this repo by reproducing it under stress, reading traces and error context, identifying the root-cause race, and proving the fix with repeated runs, without adding sleeps, retries or bigger timeouts. Use when a test "sometimes fails", "fails only in CI", "fails on webkit/firefox only", is marked flaky in the report, or passes on retry.
---

# Fix a Flaky Test

A flaky test is a race between the test and the app. The goal is to **find that race and
synchronise on the right signal**, then prove it statistically.

## Ground rules

- ❌ Never "fix" with `waitForTimeout`, larger timeouts, `retries`, `{ force: true }`,
  `networkidle`, or by deleting or weakening the assertion.
- ❌ Don't quarantine (`test.fixme`) unless the root cause is in the app or a third party
  **and** you've documented it with evidence.
- ✅ Every change must be justified by evidence (trace, error-context, logs, measurements).

## Workflow

### 1. Reproduce and measure the baseline

```bash
# Hammer the test: parallel load surfaces races. Use the project(s) where it fails.
npx playwright test <spec> -g "<title>" --project=<project> --repeat-each=30 --workers=8 --retries=0

# Full traces for every run while investigating:
npx playwright test <spec> -g "<title>" --project=<project> --repeat-each=30 --trace=on --retries=0
```

Write down the failure rate (e.g. "3/30 on webkit, 0/30 on chromium"). It is your baseline.
If it won't reproduce locally, run the whole project (`--project=webkit`) since the
interaction with other tests may be what triggers it, or reproduce in the CI container:
`docker run --rm -v $PWD:/w -w /w mcr.microsoft.com/playwright:v<version>-noble npx playwright test …`

### 2. Gather evidence

For each failure in `test-results/`:

1. Read `error-context.md`: the error, the failing line and an **accessibility snapshot of the
   page at failure time**. Compare what the test expected with what was really on screen.
2. Open the trace: `npx playwright show-trace test-results/<dir>/trace.zip`. Check the
   action timeline, DOM snapshots before/after each action, network and console.
3. For navigation questions, log the timeline in a throwaway script
   (`page.on('framenavigated' | 'load' | 'console')`), as was done to find the Sauce Demo
   redirect shim.

### 3. Classify the root cause

| Symptom                                                      | Likely cause                                                                             | Fix                                                                                                                                                  |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fails at a line right after `goto` / click; page "not ready" | Navigation resolved on an intermediate document (redirect, SPA shim) or before hydration | Wait on the _final_ state: `waitForURL`, `waitForLoadState` on the final document, or a web-first assertion on a ready marker. Use `BasePage.goto()` |
| `expect(await locator.textContent())` mismatches             | Non-retrying assertion on a snapshot value                                               | `await expect(locator).toHaveText(...)`                                                                                                              |
| Intermittent "element not found / detached"                  | Element re-rendered between locate and act; `ElementHandle` use                          | Use `Locator`s (they re-resolve); assert state before acting                                                                                         |
| Action "succeeds" but has no effect                          | Click before handlers attached, or during re-render                                      | Assert the effect of the previous step before moving on (e.g. button text changes to "Remove")                                                       |
| Passes alone, fails in the suite                             | Shared state: same user/data, storage state mutated, order dependence                    | Unique data via factories; per-test fixtures; never mutate shared storage state                                                                      |
| API data collisions                                          | Two tests editing the same record                                                        | `buildBooking()` per test; `createdBooking` fixture                                                                                                  |
| Only in CI                                                   | CPU-starved runner, different fonts/locale/timezone                                      | Reproduce in the container; set `locale`/`timezoneId`; mask volatile UI                                                                              |
| Visual diff noise                                            | Animations, carets, dynamic text (dates, years)                                          | `animations: 'disabled'`, `mask: [...]`, stable data                                                                                                 |
| Missing `await`                                              | Floating promise                                                                         | ESLint `no-floating-promises` should already catch it; run `npm run lint`                                                                            |

### 4. Fix at the right layer

- If the race is in **how a page is reached or readied**, fix it in the page object
  (`goto`, `expectLoaded`) so every test benefits.
- If it's in **test data/state**, fix the fixture or factory.
- Only touch the spec when the flake is specific to that test's logic.
- Add a short comment explaining _why_ the synchronisation is needed.

### 5. Prove it

```bash
npx playwright test <spec> --project=<failing projects> --repeat-each=30 --workers=8 --retries=0
npx playwright test --project=chromium --project=firefox --project=webkit --project=mobile-chrome --project=mobile-safari
npm run check
```

Report: baseline failure rate → root cause (with the evidence) → fix → new rate
(e.g. "2/123 → 0/363"). If you cannot reproduce at all, say so; don't ship a speculative fix
as "fixed".

## Worked example from this repo

**Symptom:** about 1–2% of WebKit runs lost a cart item or didn't find the page title right after
`inventoryPage.goto()`.

**Evidence:** a navigation log showed `GET /inventory.html` answering **404** with a
`spa-github-pages` shim that redirects to `/?/inventory.html`. `page.goto` resolved on the
shim's `DOMContentLoaded`, and `expectOnPage()` passed against the shim's URL. The test was
racing the real app's boot.

**Fix:** `BasePage.goto()` now uses `waitUntil: 'commit'` plus `waitForLoadState('load')`,
which resolves on the final document. Result: 2/123 failures → 0/363.
