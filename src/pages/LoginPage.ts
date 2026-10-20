import { expect, type Locator } from '@playwright/test';
import type { Credentials } from '@data/users';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  protected readonly path = '/';

  readonly usernameInput: Locator = this.page.getByTestId('username');
  readonly passwordInput: Locator = this.page.getByTestId('password');
  readonly loginButton: Locator = this.page.getByTestId('login-button');
  readonly errorMessage: Locator = this.page.getByTestId('error');

  async expectLoaded(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
  }

  async login({ username, password }: Credentials): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string | RegExp): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(message);
  }
}
