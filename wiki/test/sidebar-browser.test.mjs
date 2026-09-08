/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
const require = createRequire(import.meta.url);
const { chromium } = createRequire(
  require.resolve('@vitest/browser-playwright'),
)('playwright');

test('current sidebar link is revealed without reordering or interrupting manual scrolling', async context => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  context.after(() => browser.close());
  for (const mobile of [false, true]) {
    const page = await browser.newPage({
      viewport: mobile
        ? { width: 390, height: 700 }
        : { width: 1280, height: 720 },
    });
    await page.goto(
      `${process.env.WIKI_TEST_URL ?? 'http://127.0.0.1:5173'}/zh/reference/viewer/fetcher-viewer`,
    );
    if (mobile)
      await page.getByRole('button', { name: '目录', exact: true }).click();
    await page.waitForFunction(
      () => {
        const sidebar = document.querySelector('.VPSidebar');
        const link = sidebar?.querySelector('a[aria-current="page"]');
        if (!link) return false;
        const bounds = sidebar.getBoundingClientRect();
        const item = link.getBoundingClientRect();
        return (
          item.height > 0 &&
          item.top >= bounds.top + 64 &&
          item.bottom <= bounds.bottom
        );
      },
      null,
      { timeout: 5000 },
    );
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    const sidebar = page.locator('.VPSidebar');
    const order = await sidebar.locator('h3').allTextContents();
    await sidebar.evaluate(el => {
      el.scrollTop = 0;
    });
    await page
      .getByRole('button', { name: '开始使用 toggle section', exact: true })
      .click();
    await page.waitForTimeout(150);
    assert.equal(
      await sidebar.evaluate(el => el.scrollTop),
      0,
      'manual browsing must not snap back',
    );
    assert.deepEqual(await sidebar.locator('h3').allTextContents(), order);
    if (mobile) {
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: '目录', exact: true }).click();
      await page.waitForFunction(
        () => {
          const link = document.querySelector(
            '.VPSidebar a[aria-current="page"]',
          );
          const bounds = link.getBoundingClientRect();
          return bounds.top >= 0 && bounds.bottom <= innerHeight;
        },
        null,
        { timeout: 5000 },
      );
    }
    await page.close();
  }
});
