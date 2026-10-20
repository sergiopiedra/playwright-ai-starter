import { expect, type Locator, type Page } from '@playwright/test';

/** Header shared by every authenticated page: burger menu and cart. */
export class HeaderComponent {
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly menuButton: Locator;
  readonly closeMenuButton: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;

  constructor(readonly page: Page) {
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.closeMenuButton = page.getByRole('button', { name: 'Close Menu' });
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetAppStateLink = page.getByTestId('reset-sidebar-link');
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async openMenu(): Promise<void> {
    await this.menuButton.click();
    await expect(this.logoutLink).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.openMenu();
    await this.logoutLink.click();
  }

  /** Asserts the badge count; `0` means the badge is not rendered at all. */
  async expectCartCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.cartBadge).toBeHidden();
    } else {
      await expect(this.cartBadge).toHaveText(String(count));
    }
  }
}
