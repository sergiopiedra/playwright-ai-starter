---
name: test-from-user-story
description: Turn a user story or acceptance criteria into Playwright tests in this repo by mapping each criterion to a scenario, reusing page objects and fixtures, tagging @smoke/@regression, and verifying across browsers. Use when given a user story ("As a … I want … so that …"), Gherkin, a Jira-style ticket, or acceptance criteria to automate.
---

# Test from User Story

Converts a story into maintainable, tagged, cross-browser tests that follow `AGENTS.md`.

## Workflow

### 1. Break the story into scenarios

Write this table in your reply **before** writing code:

| #   | Acceptance criterion | Scenario (Given / When / Then) | Layer | Tag |
| --- | -------------------- | ------------------------------ | ----- | --- |

- **One criterion becomes one test or more.** Add the obvious negative/edge cases (empty input,
  invalid data, unauthorised user) even if the story only states the happy path. Mark them
  as _inferred_.
- **Pick the cheapest layer that proves the behaviour:**
  - pure business rule or data contract → `tests/api`
  - user-visible flow → `tests/ui`
  - "is it usable with assistive tech" → `tests/a11y`
  - "does it look right" → `tests/visual`
- **Tags:** `@smoke` only for the critical happy path that must pass on every deploy and is
  safe on prod (read-only). Everything gets `@regression`.
- If a criterion is untestable or ambiguous, say so and ask; don't invent behaviour.

### 2. Find what already exists

- Page objects: `src/pages/index.ts`. Fixtures: `src/fixtures/index.ts`.
- Test data: `src/data/` (`USERS`, `PRODUCTS`, `buildCustomer()`, `buildBooking()`).
- An existing spec for the same feature? **Extend it** inside its `describe` rather than
  creating a new file.
- Missing page object? Run the `new-page-object` skill first.

### 3. Write the tests

```ts
import { expect, test } from '@fixtures';
import { STORAGE_STATE } from '@data/users';

test.use({ storageState: STORAGE_STATE.standard }); // only for logged-in flows

test.describe('<Feature from the story>', () => {
  test(
    '<user-facing behaviour from the criterion>',
    { tag: ['@smoke', '@regression'] },
    async ({ inventoryPage, cartPage }) => {
      // Arrange
      await inventoryPage.goto();

      // Act
      await inventoryPage.addToCart('Sauce Labs Backpack');
      await inventoryPage.header.openCart();

      // Assert
      await expect(cartPage.itemNames).toHaveText(['Sauce Labs Backpack']);
    },
  );
});
```

Rules:

- Title = the behaviour in the user's words, not the implementation.
- Optionally link the story with an annotation:
  `{ tag: '@regression', annotation: { type: 'story', description: 'SHOP-123' } }`.
- Variants of one rule → a data table plus a `for` loop (see `tests/ui/login.spec.ts`).
- Always use `somePage.goto()`. Never call raw `page.goto` on deep links (SPA redirect shim).
- Use factories for input data so tests are parallel-safe; never rely on pre-existing API data.
- Mutating API tests must use `createdBooking` or respect `env.allowDataMutation`.
- No `if` in tests, no `waitForTimeout`, no `force`.

### 4. Verify

```bash
npx playwright test <spec> --project=chromium -g "<title>"      # iterate
npm run check
npx playwright test <spec> --project=chromium --project=webkit --project=mobile-chrome --repeat-each=3
```

All green before reporting. If a test fails because the **app** doesn't meet the criterion,
don't bend the test: report it as a likely defect, with the evidence (error-context.md, trace).

### 5. Report back

- The scenario table with a ✅ per implemented row and file:line links.
- Inferred scenarios you added and why.
- Anything you couldn't automate, and the reason.
