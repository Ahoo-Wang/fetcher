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
import { AntdProvider } from '../shared/AntdProvider.js';
import { ScenarioFrame } from '../shared/ScenarioFrame.js';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import { useDebouncedFetcher, useFetcher } from '@ahoo-wang/fetcher-react';
import { useMemo, useState } from 'react';
import type { FixtureUser } from '../fixtures/http';
import { installFetchFixture } from '../fixtures/http';

type Scenario = 'success' | 'empty' | 'error' | 'refetch' | 'debounce';

interface SearchResult {
  query: string;
  users: FixtureUser[];
}

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
  const debounced = useDebouncedFetcher<SearchResult>({
    fetcher,
    resultExtractor: ResultExtractors.Json,
    debounce: { delay: 20 },
  });

  const load = () => {
    if (scenario === 'debounce') {
      debounced.run({ url: '/users/search?query=A' });
      debounced.run({ url: '/users/search?query=Ad' });
      debounced.run({ url: '/users/search?query=Ada' });
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
      ? `Debounced · ${debounced.result.users.map(user => user.name).join(', ')} · query ${debounced.result.query}`
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

const scene = {
  domain: 'React request state',
  summary: 'Bind a typed Fetcher request to React execution state.',
  fixture: 'Local fetch fixture · local users',
  setup: 'A hook receives a deterministic request and local response fixture.',
  observe:
    'Loading, result, error, refresh, and cancellation remain inspectable.',
};

const meta = {
  parameters: { docs: { story: { inline: false, height: '480px' } } },
  decorators: [
    (Story, context) => (
      <AntdProvider>
        <ScenarioFrame title={context.name} {...scene}>
          <Story />
        </ScenarioFrame>
      </AntdProvider>
    ),
  ],
  title: 'React Hooks/Fetcher',
  component: FetcherHookDemo,
  beforeEach: installFetchFixture,
  args: { scenario: 'success' },
  argTypes: { scenario: { table: { disable: true } } },
} satisfies Meta<typeof FetcherHookDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GetSuccess: Story = {
  args: { scenario: 'success' },
};

export const EmptyList: Story = {
  args: { scenario: 'empty' },
};

export const HttpError: Story = {
  args: { scenario: 'error' },
};

export const ManualRefetch: Story = {
  args: { scenario: 'refetch' },
};

export const DebouncedRequest: Story = {
  args: { scenario: 'debounce' },
};
