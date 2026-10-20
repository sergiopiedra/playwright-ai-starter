#!/usr/bin/env node
// Prints every [data-test] element on a page with a suggested Playwright locator.
//
// Usage:
//   node .claude/skills/new-page-object/scripts/dump-locators.mjs <path-or-url> [--login <username>]
//
// Examples:
//   node .claude/skills/new-page-object/scripts/dump-locators.mjs /
//   node .claude/skills/new-page-object/scripts/dump-locators.mjs /inventory-item.html?id=4 --login standard_user

import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--')) ?? '/';
const loginIndex = args.indexOf('--login');
const loginAs = loginIndex >= 0 ? args[loginIndex + 1] : undefined;

const baseURL = process.env.BASE_URL ?? 'https://www.saucedemo.com';
const password = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

const browser = await chromium.launch();
const page = await browser.newPage({ baseURL });

try {
  if (loginAs) {
    await page.goto('/');
    await page.locator('[data-test="username"]').fill(loginAs);
    await page.locator('[data-test="password"]').fill(password);
    await page.locator('[data-test="login-button"]').click();
    await page.waitForURL('**/inventory.html');
  }

  await page.goto(target);
  await page.waitForLoadState('networkidle');

  const elements = await page.$$eval('[data-test]', (nodes) =>
    nodes.map((n) => ({
      testId: n.getAttribute('data-test'),
      tag: n.tagName.toLowerCase(),
      role: n.getAttribute('role'),
      type: n.getAttribute('type'),
      text: (n.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60),
    })),
  );

  // Collapse repeated ids (list items) into one row with a count.
  const grouped = new Map();
  for (const el of elements) {
    const entry = grouped.get(el.testId);
    if (entry) entry.count += 1;
    else grouped.set(el.testId, { ...el, count: 1 });
  }

  console.log(`\n${page.url()}  —  ${grouped.size} unique data-test ids\n`);
  for (const el of grouped.values()) {
    const repeat = el.count > 1 ? ` (x${el.count})` : '';
    const kind = [el.tag, el.type].filter(Boolean).join(':');
    console.log(`getByTestId('${el.testId}')${repeat}  <${kind}>  "${el.text}"`);
  }
} finally {
  await browser.close();
}
