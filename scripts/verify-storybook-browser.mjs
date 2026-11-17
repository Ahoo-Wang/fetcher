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
import {
  browserTargets,
  missingBrowserTargets,
} from './verify-storybook-targets.mjs';
const require = createRequire(import.meta.url);
const { chromium } = createRequire(
  require.resolve('@vitest/browser-playwright'),
)('playwright');
const origin = process.argv[2] ?? 'http://127.0.0.1:6006';
(async () => {
  const response = await fetch(`${origin}/index.json`);
  assert.ok(
    response.ok,
    `${origin}/index.json: HTTP ${response.status}; is Storybook running?`,
  );
  const index = await response.json();
  const missing = missingBrowserTargets(index);
  assert.equal(
    missing.length,
    0,
    `Browser acceptance targets missing from the index: ${missing.join(', ')}`,
  );
  const entries = Object.values(index.entries);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    async function open(id, mode = 'story') {
      await page.goto(
        `${origin}/iframe.html?id=${encodeURIComponent(id)}&viewMode=${mode}`,
        { waitUntil: 'domcontentloaded' },
      );
      assert.equal(await page.locator('#error-message').isVisible(), false, id);
    }
    await open(browserTargets.startHere);
    await page.getByRole('heading', { name: '从示例开始接入' }).waitFor();
    for (const href of await page
      .locator('a[href^="./?path="]')
      .evaluateAll(a => a.map(x => x.getAttribute('href')))) {
      const route = new URL(href, origin).searchParams.get('path');
      assert(index.entries[route.replace(/^\/(docs|story)\//, '')], href);
    }
    // Opening an example sends nothing; the request waits for the user.
    await open(browserTargets.passiveStory);
    const passive = page.getByRole('region', { name: 'Fetcher request' });
    await passive.getByText('Ready', { exact: true }).waitFor();
    await page.waitForTimeout(1000);
    assert.equal(
      await passive.locator('output').textContent(),
      'Ready',
      'An example ran without user action',
    );
    await passive.getByRole('button', { name: 'Send request' }).click();
    await passive.getByText('Ada', { exact: true }).waitFor();
    await page.setViewportSize({ width: 414, height: 896 });
    await open(browserTargets.startHere);
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      'The landing page scrolls horizontally at 414px',
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const doc of entries.filter(entry => entry.type === 'docs')) {
      await open(doc.id, 'docs');
      await page.locator('.sbdocs-content').waitFor();
      await page.getByRole('navigation', { name: '独立场景' }).waitFor();
      if (doc.id === browserTargets.isolatedDocs) {
        const iframes = page.locator('iframe[src*="viewMode=story"]');
        await iframes.first().waitFor();
        assert.equal(
          await iframes.count(),
          1,
          'Docs renders only one primary iframe',
        );
        const first = page
          .frameLocator('iframe[src*="viewMode=story"]')
          .first();
        await first.getByRole('button', { name: 'Send request' }).click();
        await first.getByText('Ada', { exact: true }).waitFor();
        const other = await browser.newPage();
        await other.goto(
          `${origin}/iframe.html?id=${encodeURIComponent(browserTargets.isolatedStory)}&viewMode=story`,
        );
        await other.getByText('Ready', { exact: true }).waitFor();
        await other.getByRole('button', { name: 'Send request' }).click();
        await other
          .getByText('GET https://api.example.test/users/u-ada?include=team', {
            exact: true,
          })
          .waitFor();
        assert.equal(await first.getByText('Ada', { exact: true }).count(), 1);
        await other.close();
      }
      console.log('Docs verified:', doc.title);
    }
    assert.deepEqual(errors, []);
    console.log(
      'Navigation, passive initial state, iframe isolation, narrow layout: passed',
    );
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
