import { expect, type Page } from '@playwright/test';

/**
 * Root of every page object.
 *
 * Subclasses declare their `path` and define what "loaded" means in `expectLoaded()`
 * using web-first assertions, so navigation helpers never rely on sleeps.
 */
export abstract class BasePage {
  readonly page: Page;

  /** Path relative to `baseURL`, e.g. `/inventory.html`. */
  protected abstract readonly path: string;

  constructor(page: Page) {
    this.page = page;
  }

  /** Navigates directly to this page and waits until it is ready. */
  async goto(): Promise<void> {
    // Don't wait for `load`: third-party assets can stall it. `expectLoaded()` is the
    // real readiness signal.
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    await this.expectLoaded();
  }

  /** Asserts the browser is on this page's URL. */
  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${escapeRegExp(this.path)}$`));
  }

  /** Asserts the page is rendered and ready for interaction. */
  abstract expectLoaded(): Promise<void>;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
