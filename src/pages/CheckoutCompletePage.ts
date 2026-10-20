import { expect, type Locator } from '@playwright/test';
import { SecurePage } from './SecurePage';

export class CheckoutCompletePage extends SecurePage {
  protected readonly path = '/checkout-complete.html';
  protected readonly titleText = 'Checkout: Complete!';

  readonly confirmationHeader: Locator = this.page.getByTestId('complete-header');
  readonly backHomeButton: Locator = this.page.getByTestId('back-to-products');

  override async expectLoaded(): Promise<void> {
    await super.expectLoaded();
    await expect(this.confirmationHeader).toHaveText('Thank you for your order!');
  }

  async backHome(): Promise<void> {
    await this.backHomeButton.click();
  }
}
