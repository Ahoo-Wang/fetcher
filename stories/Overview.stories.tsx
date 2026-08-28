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
import { fixtureViewerDefinition } from './fixtures/viewer';

const meta = {
  title: 'Overview',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const StartHere: Story = {
  name: 'Start Here',
  render: () => (
    <main aria-labelledby="storybook-title" className="story-stack">
      <h1 id="storybook-title">Fetcher interactive workflows</h1>
      <p>
        Explore real package behavior with deterministic local data. No story
        contacts an external service or requires credentials.
      </p>
      <ul>
        <li>HTTP &amp; Streaming</li>
        <li>React Hooks</li>
        <li>Viewer</li>
      </ul>
      <p>
        Use Controls to change inputs, Interactions to inspect assertions, and
        Accessibility to review the rendered result.
      </p>
      <output className="story-output">
        Fixtures: {fixtureUsers.map(user => user.name).join(', ')} ·{' '}
        {fixtureViewerDefinition.name}
      </output>
      <a href="https://fetcher.ahoo.me/start/first-request">
        Read the five-minute guide
      </a>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Fetcher interactive workflows' }),
    ).toBeVisible();
    await expect(canvas.getByText('Fixtures: Ada, Lin · Users')).toBeVisible();
  },
};
