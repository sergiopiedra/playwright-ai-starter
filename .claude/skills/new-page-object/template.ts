// Template for a new page object. Copy to src/pages/<Name>Page.ts and replace the
// placeholders. Kept outside tsconfig's `include`, so it isn't type-checked in place.
import { expect, type Locator } from '@playwright/test';
import { SecurePage } from './SecurePage'; // or BasePage for public pages

export class __Name__Page extends SecurePage {
  protected readonly path = '/__path__.html';
  protected readonly titleText = '__Title text__';

  // --- Locators: readonly, typed, role > test id > label/text ---------------
  readonly primaryButton: Locator = this.page.getByRole('button', { name: '__Accessible name__' });
  readonly items: Locator = this.page.getByTestId('__item-test-id__');
  readonly errorMessage: Locator = this.page.getByTestId('error');

  /** One item in a repeated list, matched by its exact visible name. */
  item(name: string): Locator {
    return this.items.filter({
      has: this.page.getByTestId('__item-name-test-id__').getByText(name, { exact: true }),
    });
  }

  // --- Actions: named after user intent ---------------------------------------
  async doPrimaryAction(): Promise<void> {
    await this.primaryButton.click();
  }

  // --- Queries: return plain data ----------------------------------------------
  async getItemNames(): Promise<string[]> {
    return this.items.allTextContents();
  }

  // --- Page-state assertions only (business assertions live in specs) -----------
  async expectError(message: string | RegExp): Promise<void> {
    await expect(this.errorMessage).toHaveText(message);
  }
}
