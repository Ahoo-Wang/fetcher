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

async function openChart(context) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  context.after(() => browser.close());
  const page = await browser.newPage();
  await page.goto(
    `${process.env.WIKI_TEST_URL ?? 'http://127.0.0.1:5173'}/architecture/request-lifecycle`,
  );
  const chart = page.locator('.mermaid-container').first();
  await chart.locator('.mermaid > svg').waitFor();
  await page.waitForTimeout(300);
  return { page, chart };
}

async function expandChart(chart) {
  const expand = chart
    .getByRole('button', { name: /Expand diagram|Toggle Fullscreen/ })
    .first();
  await chart.hover();
  await expand.click();
  return expand;
}

test('Mermaid inline sequence uses the reading width', async context => {
  const { chart } = await openChart(context);
  const bounds = await chart.evaluate(el => ({
    chart: el.clientWidth,
    svg: el.querySelector('.mermaid > svg').getBoundingClientRect().width,
  }));
  assert.ok(
    bounds.svg >= bounds.chart * 0.8,
    'inline sequence should use the reading width',
  );
});

test('Mermaid expanded view supports keyboard exit and restores focus', async context => {
  const { page, chart } = await openChart(context);
  const expand = await expandChart(chart);
  await page.waitForTimeout(200);
  assert.equal(
    await page
      .locator('.dialog-fullscreen-active[role="dialog"][aria-modal="true"]')
      .count(),
    1,
  );
  assert.equal(
    await page.evaluate(() => document.body.style.overflow),
    'hidden',
  );
  const first = chart.locator('[data-mermaid-control="zoomIn"]').first();
  const close = chart.getByRole('button', { name: 'Close diagram' }).first();
  await first.focus();
  await page.keyboard.press('Shift+Tab');
  assert.equal(await close.evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Tab');
  assert.equal(await first.evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  assert.equal(await page.locator('.dialog-fullscreen-active').count(), 0);
  assert.equal(
    await expand.evaluate(el => el === document.activeElement),
    true,
  );
  assert.notEqual(
    await page.evaluate(() => document.body.style.overflow),
    'hidden',
  );
});

test('Mermaid expanded view only zooms on a modified wheel', async context => {
  const { page, chart } = await openChart(context);
  await expandChart(chart);
  await page.waitForTimeout(200);
  const viewport = chart.locator('.mermaid-viewport');
  const before = await viewport.getAttribute('style');
  await viewport.dispatchEvent('wheel', { deltaY: -100, bubbles: true });
  await page.waitForTimeout(100);
  assert.equal(
    await viewport.getAttribute('style'),
    before,
    'ordinary wheel must not zoom',
  );
  await viewport.dispatchEvent('wheel', {
    deltaY: -100,
    metaKey: true,
    bubbles: true,
  });
  await page.waitForTimeout(150);
  assert.notEqual(
    await viewport.getAttribute('style'),
    before,
    'Command-wheel zooms',
  );
});
