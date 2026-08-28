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

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { fixtureUsers } from './fixtures/http';

const meta = {
  title: 'Overview',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const StartHere: Story = {
  render: () => (
    <main aria-labelledby="storybook-title" className="story-overview">
      <header className="story-overview__hero">
        <p className="story-overview__eyebrow">Fetcher Scenario Lab</p>
        <h1 id="storybook-title">Fetcher interactive workflows</h1>
        <p>
          Explore real package behavior with deterministic local data. Every
          scenario names its setup, action, and observable contract before you
          run it.
        </p>
        <div className="story-overview__facts" aria-label="Lab guarantees">
          <span>Local fixtures</span>
          <span>No credentials</span>
          <span>Repeatable assertions</span>
        </div>
      </header>

      <section aria-labelledby="scenario-catalog-title">
        <h2 id="scenario-catalog-title">Choose a developer scenario</h2>
        <div className="story-overview__grid">
          <a href="./?path=/docs/http-streaming-fetcher--docs" target="_top">
            <span>HTTP exchange</span>
            <strong>Trace a request</strong>
            <p>Follow URL resolution, transport, extraction, and failure.</p>
          </a>
          <a href="./?path=/docs/http-streaming-event-bus--docs" target="_top">
            <span>Event delivery</span>
            <strong>Compare handler execution</strong>
            <p>Observe serial order, parallel completion, and cleanup.</p>
          </a>
          <a
            href="./?path=/docs/http-streaming-event-stream--docs"
            target="_top"
          >
            <span>Streaming</span>
            <strong>Read an SSE response</strong>
            <p>
              Inspect parsing, termination, malformed data, and cancellation.
            </p>
          </a>
          <a href="./?path=/docs/react-hooks-async-state--docs" target="_top">
            <span>React async state</span>
            <strong>Drive a promise lifecycle</strong>
            <p>
              See success, rejection, retry, debounce, and stale suppression.
            </p>
          </a>
          <a href="./?path=/docs/react-hooks-fetcher--docs" target="_top">
            <span>React request state</span>
            <strong>Bind Fetcher to a hook</strong>
            <p>Exercise loading, result, error, refresh, and cancellation.</p>
          </a>
          <a href="./?path=/docs/react-hooks-wow-queries--docs" target="_top">
            <span>CQRS query state</span>
            <strong>Run typed Wow queries</strong>
            <p>Compare single, list, page, count, and stream query state.</p>
          </a>
        </div>
      </section>

      <section aria-labelledby="scenario-reading-title">
        <h2 id="scenario-reading-title">Read every scenario the same way</h2>
        <ol className="story-overview__flow">
          <li>
            <strong>Setup</strong>
            <span>Know the fixture and starting state.</span>
          </li>
          <li>
            <strong>Action</strong>
            <span>Run one named behavior variant.</span>
          </li>
          <li>
            <strong>Observe</strong>
            <span>Compare the visible result with the contract.</span>
          </li>
        </ol>
      </section>

      <footer className="story-overview__footer">
        <output className="story-output">
          Fixtures: {fixtureUsers.map(user => user.name).join(', ')} · Users
        </output>
        <a href="https://fetcher.ahoo.me/start/first-request">
          Read the five-minute guide
        </a>
      </footer>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Fetcher interactive workflows' }),
    ).toBeVisible();
    await expect(canvas.getByText('Setup')).toBeVisible();
    await expect(canvas.getByText('Action')).toBeVisible();
    await expect(canvas.getByText('Observe')).toBeVisible();
    const links = canvas.getAllByRole('link');
    await expect(links).toHaveLength(7);
    for (const link of links.slice(0, 6)) {
      await expect(link.getAttribute('href')?.startsWith('./?path=')).toBe(
        true,
      );
    }
    await expect(canvas.getByText('Fixtures: Ada, Lin · Users')).toBeVisible();
  },
};
