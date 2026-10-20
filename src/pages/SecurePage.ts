import { expect, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from './components/HeaderComponent';

/** A page behind login: shares the header (cart + menu) and a page title. */
export abstract class SecurePage extends BasePage {
  /** Exact text of the `title` element, e.g. "Products". */
  protected abstract readonly titleText: string;

  readonly header = new HeaderComponent(this.page);
  readonly title: Locator = this.page.getByTestId('title');

  async expectLoaded(): Promise<void> {
    await this.expectOnPage();
    await expect(this.title).toHaveText(this.titleText);
  }
}
