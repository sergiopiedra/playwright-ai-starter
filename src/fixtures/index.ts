import AxeBuilder from '@axe-core/playwright';
import { test as base, expect as baseExpect, type APIRequestContext } from '@playwright/test';
import type { AxeResults } from 'axe-core';
import { BookingClient } from '@api/BookingClient';
import type { CreatedBooking } from '@api/schemas';
import { env } from '@config/env';
import { buildBooking } from '@data/bookings';
import {
  CartPage,
  CheckoutCompletePage,
  CheckoutInformationPage,
  CheckoutOverviewPage,
  InventoryPage,
  LoginPage,
} from '@pages';
import { formatViolations, WCAG_TAGS } from '@utils/a11y';

interface A11yScanOptions {
  /** CSS selector to limit the scan to part of the page. */
  include?: string;
  /** CSS selectors to leave out of the scan (e.g. third-party widgets). */
  exclude?: string[];
}

interface A11y {
  /** Runs axe with WCAG 2.1 AA rules and attaches the full results to the report. */
  scan(options?: A11yScanOptions): Promise<AxeResults>;
}

interface PageFixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInformationPage: CheckoutInformationPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
  a11y: A11y;
}

interface ApiFixtures {
  /** Request context bound to API_URL, independent of the project's baseURL. */
  apiRequest: APIRequestContext;
  /** Unauthenticated client: use for read-only calls and negative auth tests. */
  bookingApi: BookingClient;
  /** Client that sends a valid auth token (required for PUT/PATCH/DELETE). */
  authedBookingApi: BookingClient;
  /** A fresh booking created before the test and deleted after it. */
  createdBooking: CreatedBooking;
}

interface WorkerFixtures {
  /** One auth token per worker, shared by all of its tests. */
  apiToken: string;
}

export const test = base.extend<PageFixtures & ApiFixtures, WorkerFixtures>({
  // --- Page objects -------------------------------------------------------
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutInformationPage: async ({ page }, use) => {
    await use(new CheckoutInformationPage(page));
  },
  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverviewPage(page));
  },
  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },

  // --- Accessibility ------------------------------------------------------
  a11y: async ({ page }, use, testInfo) => {
    await use({
      async scan({ include, exclude = [] } = {}) {
        let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
        if (include) builder = builder.include(include);
        for (const selector of exclude) builder = builder.exclude(selector);

        const results = await builder.analyze();
        await testInfo.attach('axe-results', {
          body: JSON.stringify(results, null, 2),
          contentType: 'application/json',
        });
        return results;
      },
    });
  },

  // --- API ----------------------------------------------------------------
  apiToken: [
    async ({ playwright }, use) => {
      const request = await playwright.request.newContext({ baseURL: env.apiUrl });
      const token = await new BookingClient(request).createTokenOrThrow(
        env.api.username,
        env.api.password,
      );
      await request.dispose();
      await use(token);
    },
    { scope: 'worker' },
  ],

  apiRequest: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({
      baseURL: env.apiUrl,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(request);
    await request.dispose();
  },

  bookingApi: async ({ apiRequest }, use) => {
    await use(new BookingClient(apiRequest));
  },

  authedBookingApi: async ({ bookingApi, apiToken }, use) => {
    await use(bookingApi.withToken(apiToken));
  },

  createdBooking: async ({ authedBookingApi }, use, testInfo) => {
    testInfo.skip(!env.allowDataMutation, `Data mutation is disabled for TEST_ENV=${env.name}`);

    const created = await authedBookingApi.createBookingOrThrow(buildBooking());
    await use(created);
    // Best-effort cleanup: the test may already have deleted it.
    await authedBookingApi.deleteBooking(created.bookingid);
  },
});

export const expect = baseExpect.extend({
  /**
   * Passes when an axe scan has no violations, except rule ids listed in `allow`
   * (a documented baseline of known issues, so only *new* violations fail).
   */
  toHaveNoViolations(results: AxeResults, { allow = [] }: { allow?: string[] } = {}) {
    const unexpected = results.violations.filter((violation) => !allow.includes(violation.id));
    const pass = unexpected.length === 0;

    return {
      pass,
      name: 'toHaveNoViolations',
      message: () =>
        pass
          ? 'Expected accessibility violations, but none were found.'
          : `Found ${unexpected.length} unexpected accessibility violation(s):\n\n${formatViolations(unexpected)}`,
    };
  },
});
