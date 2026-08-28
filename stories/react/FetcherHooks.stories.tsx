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
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import { useDebouncedFetcher, useFetcher } from '@ahoo-wang/fetcher-react';
import { useMemo, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import type { FixtureUser } from '../fixtures/http';
import { installFetchFixture } from '../fixtures/http';

type Scenario = 'success' | 'empty' | 'error' | 'refetch' | 'debounce';

function FetcherHookDemo({ scenario }: { scenario: Scenario }) {
  const fetcher = useMemo(
    () => new Fetcher({ baseURL: 'https://api.example.test' }),
    [],
  );
  const [loadCount, setLoadCount] = useState(0);
  const request = useFetcher<FixtureUser[]>({
    fetcher,
    resultExtractor: ResultExtractors.Json,
    onSuccess: () => setLoadCount(count => count + 1),
  });
  const debounced = useDebouncedFetcher<FixtureUser[]>({
    fetcher,
    resultExtractor: ResultExtractors.Json,
    debounce: { delay: 20 },
  });

  const load = () => {
    if (scenario === 'debounce') {
      debounced.run({ url: '/users?query=A' });
      debounced.run({ url: '/users?query=Ad' });
      debounced.run({ url: '/users?query=Ada' });
      return;
    }
    const url =
      scenario === 'empty'
        ? '/users/empty'
        : scenario === 'error'
          ? '/error'
          : '/users';
    void request.execute({ url });
  };

  let output = request.status;
  if (scenario === 'debounce') {
    output = debounced.result
      ? `Debounced · ${debounced.result.map(user => user.name).join(', ')}`
      : debounced.status;
  } else if (request.error) {
    output = `Error · ${request.error.name}`;
  } else if (scenario === 'refetch' && loadCount > 0) {
    output = `Loaded ${loadCount} ${loadCount === 1 ? 'time' : 'times'}`;
  } else if (request.result) {
    output =
      request.result.length === 0
        ? 'Empty · 0 users'
        : request.result.map(user => user.name).join(', ');
  }

  return (
    <section className="story-stack" aria-label="Fetcher hook">
      <button onClick={load}>Load users</button>
      <output className="story-output" aria-live="polite">
        {output}
      </output>
    </section>
  );
}

const meta = {
  title: 'React Hooks/Fetcher',
  component: FetcherHookDemo,
  beforeEach: installFetchFixture,
  args: { scenario: 'success' },
  argTypes: { scenario: { control: 'radio' } },
} satisfies Meta<typeof FetcherHookDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

async function loadAndExpect(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Load users' }));
  await expect(await canvas.findByText(text)).toBeVisible();
}

export const GetSuccess: Story = {
  args: { scenario: 'success' },
  play: ({ canvasElement }) => loadAndExpect(canvasElement, 'Ada, Lin'),
};

export const EmptyList: Story = {
  args: { scenario: 'empty' },
  play: ({ canvasElement }) => loadAndExpect(canvasElement, 'Empty · 0 users'),
};

export const HttpError: Story = {
  args: { scenario: 'error' },
  play: ({ canvasElement }) =>
    loadAndExpect(canvasElement, 'Error · ExchangeError'),
};

export const ManualRefetch: Story = {
  args: { scenario: 'refetch' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Load users' });
    await userEvent.click(button);
    await expect(await canvas.findByText('Loaded 1 time')).toBeVisible();
    await userEvent.click(button);
    await expect(await canvas.findByText('Loaded 2 times')).toBeVisible();
  },
};

export const DebouncedRequest: Story = {
  args: { scenario: 'debounce' },
  play: ({ canvasElement }) =>
    loadAndExpect(canvasElement, 'Debounced · Ada, Lin'),
};
