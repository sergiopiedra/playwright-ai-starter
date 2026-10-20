# AGENTS.md

Guidance for AI coding agents (and humans) working in this repository. Follow these
conventions exactly; they are enforced by ESLint, TypeScript and code review.

## Project

Playwright + TypeScript test automation template.

| Target        | URL                                  | Tests                        |
| ------------- | ------------------------------------ | ---------------------------- |
| Web app (SPA) | https://www.saucedemo.com            | `tests/ui`, `a11y`, `visual` |
| REST API      | https://restful-booker.herokuapp.com | `tests/api`                  |

## Commands

```bash
npm ci && npx playwright install --with-deps   # setup
npm run check                                  # typecheck + lint + format:check (run before every commit)
npx playwright test --project=chromium tests/ui/cart.spec.ts   # one file, one browser
npx playwright test -g "adds products" --project=chromium      # one test by title
npm run test:smoke | test:regression | test:api | test:a11y | test:visual
npm run test:visual:update                     # regenerate local visual baselines (review the diff!)
npm run report                                 # open the last HTML report
```

When iterating, run the **narrowest** command (single file, single project). Run the full
suite only before finishing.

## Layout

```
src/
  config/env.ts        # zod-validated env. Import `env`, never read process.env directly
  pages/               # Page Objects. BasePage -> SecurePage -> concrete pages
    components/        # Reusable fragments (HeaderComponent)
  api/                 # BookingClient + zod schemas for API contracts
  fixtures/index.ts    # `test` + `expect` with custom fixtures and matchers
  data/                # Static data (users, products) and factories (faker)
  utils/               # Pure helpers (money parsing, a11y formatting)
tests/
  auth.setup.ts        # Logs in once, saves storage state
  ui/ api/ a11y/ visual/
  __screenshots__/     # Visual baselines, per platform
```

Path aliases: `@fixtures`, `@pages`, `@pages/*`, `@api/*`, `@config/*`, `@data/*`, `@utils/*`.

## Conventions

### Tests

- Import **only** from `@fixtures`: `import { expect, test } from '@fixtures';` (lint-enforced).
- Get page objects through fixtures (`async ({ inventoryPage }) => …`), not `new XPage(page)`.
- Structure each test as Arrange / Act / Assert separated by blank lines.
- Title describes behaviour from the user's perspective: `'customer can complete a purchase'`.
- Every test has at least one tag: `@smoke` (critical path, fast, safe on prod) and/or
  `@regression` (everything). Use the details object: `test('…', { tag: ['@smoke'] }, …)`.
- Authenticated UI specs use `test.use({ storageState: STORAGE_STATE.standard })`.
- Data-driven tests: a `const cases = [...]` array plus a `for … of` loop that generates `test()`s.
- No conditionals in tests, no `test.only`, no `waitForTimeout`, no `{ force: true }`,
  no `networkidle` (all lint-enforced).
- Tests must be independent and parallel-safe: no shared mutable state, no ordering assumptions.

### Page Objects

- Extend `BasePage` (public pages) or `SecurePage` (behind login; gets `header` + `title`).
- Declare `protected readonly path` and implement `expectLoaded()` with web-first assertions.
- Locators are `readonly` fields; actions are `async` methods named after user intent
  (`addToCart`, `checkout`), not mechanics (`clickButton3`).
- Allowed assertions in POMs: page-state checks named `expect*` (`expectLoaded`, `expectError`).
  Business assertions belong in the spec.
- Return data (`getItemPrices(): Promise<number[]>`), never raw `ElementHandle`s.
- Register every new page object as a fixture in `src/fixtures/index.ts` and export it from `src/pages/index.ts`.

### Locators (in priority order)

1. `getByRole(role, { name })`: what users and assistive tech see
2. `getByTestId('…')`: `testIdAttribute` is set to `data-test` (the app's convention)
3. `getByLabel` / `getByPlaceholder` / `getByText`
4. CSS only as a last resort, scoped to a parent locator. **Never XPath.**

Scope lists with `filter({ has })` or `filter({ hasText })` instead of `nth()`.

### Assertions

- Prefer web-first assertions that auto-retry: `await expect(locator).toHaveText(…)`.
- `expect(value)` on already-resolved data is fine for computed values (sorting, totals).
- Money: compare numbers via `parseMoney()` and `roundCents()`, never float strings.

### API tests

- Use `bookingApi` (anonymous) or `authedBookingApi` (token) fixtures.
- Client methods return the raw `APIResponse`; assert status, then validate the body with the zod schema
  (`BookingSchema.parse(await res.json())`).
- Build payloads with `buildBooking()`, which makes unique data per test.
- Guard anything that creates/updates/deletes with `env.allowDataMutation` (prod is read-only).
  The `createdBooking` fixture does this and cleans up after itself.

### Accessibility

- `expect(await a11y.scan()).toHaveNoViolations()` runs WCAG 2.1 A/AA.
- Known issues go in `allow: ['rule-id']` with a comment. Never disable a rule globally.

### Visual regression

- Mask dynamic content (`mask: [locator]`), use explicit snapshot names (`'cart.png'`).
- Baselines are per-platform. CI (linux) is the source of truth: new linux baselines are
  published as the `visual-baselines` workflow artifact. Never blindly `--update-snapshots`.
  Look at the diff in the HTML report first.

### Environment & secrets

- `TEST_ENV=dev|prod` selects `.env.<env>`; `.env.local` overrides; real env vars override everything.
- Never commit real secrets or `.env.local`. Prod passwords come from CI secrets.

## App quirks you must know

- **Sauce Demo deep links go through a 404 → SPA redirect shim.** Always navigate with
  `somePage.goto()`, which waits for the final document. Raw `page.goto('/inventory.html')`
  resolves on the throwaway shim and causes flaky WebKit tests.
- Sauce Demo's session cookie lasts 10 minutes; `auth.setup.ts` saves it as a session cookie.
- Restful Booker: `DELETE` returns **201**, bad credentials return **200** with
  `{ reason: 'Bad credentials' }`, `GET /ping` returns **201**. It is a shared public sandbox
  that resets periodically, so never depend on pre-existing data.

## Definition of done

1. `npm run check` passes.
2. New/changed tests pass on chromium **and** webkit with `--repeat-each=3`.
3. Tags applied; no `.only`; no new `allow` entries or snapshot updates without justification.
4. Commit messages follow Conventional Commits (`feat:`, `fix:`, `test:`, `ci:`, `docs:`, `chore:`).

## Don't

- Don't "fix" flakiness by adding retries, raising timeouts or adding sleeps. Find the race
  (see `.claude/skills/fix-flaky-test`).
- Don't use `page.waitForTimeout`, `page.$`, `ElementHandle`, or `{ force: true }`.
- Don't read `process.env` outside `src/config/env.ts`.
- Don't edit generated folders: `test-results/`, `playwright-report/`, `blob-report/`, `playwright/.auth/`.
