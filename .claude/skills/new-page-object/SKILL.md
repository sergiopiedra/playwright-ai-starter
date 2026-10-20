---
name: new-page-object
description: Generate a new Page Object (or reusable component) for this Playwright repo from the live page, following the BasePage/SecurePage hierarchy, registering it as a fixture and adding a smoke test. Use when asked to "create/add a page object", "model a page", "add a POM for <page>", or when a test needs a page that has no page object yet.
---

# New Page Object

Creates a page object that matches the repo conventions in `AGENTS.md`, wires it into the
fixtures, and proves it works with a smoke test.

## Inputs

- **Page**: a path (`/inventory-item.html?id=4`) or a description ("product details page").
- **Auth**: is it behind login? (Everything except `/` on Sauce Demo is.)
- Optional: the user actions the page must support.

If the page is ambiguous, ask once, then proceed.

## Workflow

### 1. Inspect the real page (never guess locators)

```bash
node .claude/skills/new-page-object/scripts/dump-locators.mjs <path> [--login standard_user]
```

This prints every `data-test` id with tag, repeat count and text. For roles and accessible
names, also check `test-results/**/error-context.md` from a run, or use
`npx playwright codegen https://www.saucedemo.com<path>`.

Decide for each element you need:

1. `getByRole(role, { name })` when the role and name are stable and meaningful
2. `getByTestId('<data-test>')` otherwise (`testIdAttribute` is `data-test`)
3. Repeated items (`x6`) become a list locator plus a `filter({ has })` lookup method, never `nth()`.

### 2. Pick the base class

| Page                                        | Extends                                                                        | Must define              |
| ------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------ |
| Public (no login)                           | `BasePage`                                                                     | `path`, `expectLoaded()` |
| Behind login (has header + `title` element) | `SecurePage`                                                                   | `path`, `titleText`      |
| Fragment reused across pages                | component class in `src/pages/components/` taking `page` (or a root `Locator`) | n/a                      |

### 3. Write the class

Start from [`template.ts`](template.ts). Rules:

- File and class are named `<Name>Page.ts` / `<Name>Page`.
- Locators are `readonly` typed fields: `readonly addButton: Locator = this.page.getByTestId('…');`
- Methods are `async`, named after **user intent** (`addToCart`, not `clickAddButton`), and
  return `Promise<void>` or plain data (`Promise<number[]>`).
- Only page-state assertions inside the POM, named `expect*` (e.g. `expectLoaded`, `expectError`).
- No `waitForTimeout`, no `force`, no `ElementHandle`, no hard-coded base URLs.
- Use `parseMoney()` from `@utils/money` for prices.
- Override `expectLoaded()` (calling `super.expectLoaded()`) only if the title isn't enough to
  know the page is ready.

### 4. Wire it up

1. Export it from `src/pages/index.ts`.
2. Add a fixture in `src/fixtures/index.ts`, both in the `PageFixtures` interface and in `base.extend`:
   ```ts
   productDetailsPage: async ({ page }, use) => {
     await use(new ProductDetailsPage(page));
   },
   ```

### 5. Prove it with a smoke test

Add (or extend) a spec in `tests/ui/` that navigates there, interacts once, and asserts with
web-first assertions. Tag it `@smoke` only if it is a critical path, otherwise `@regression`.

### 6. Verify

```bash
npm run check
npx playwright test <spec> --project=chromium --project=webkit --repeat-each=3
```

Both must be green before you report back. Summarize: file(s) created, fixture name,
public methods, and the test that covers it.

## Example (product details page)

```ts
import type { Locator } from '@playwright/test';
import { parseMoney } from '@utils/money';
import { SecurePage } from './SecurePage';

export class ProductDetailsPage extends SecurePage {
  protected readonly path = '/inventory-item.html';
  protected readonly titleText = 'Back to products'; // see note below

  readonly name: Locator = this.page.getByTestId('inventory-item-name');
  readonly price: Locator = this.page.getByTestId('inventory-item-price');
  readonly addToCartButton: Locator = this.page.getByRole('button', { name: 'Add to cart' });
  readonly backButton: Locator = this.page.getByTestId('back-to-products');

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  async getPrice(): Promise<number> {
    return parseMoney(await this.price.innerText());
  }
}
```

> Note: when a page has no `title` element or uses a query string (`?id=4`), override
> `expectLoaded()` and `goto()` instead of forcing `titleText`/`path` to fit.
