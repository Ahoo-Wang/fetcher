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
import {
  ExchangeError,
  Fetcher,
  FetchTimeoutError,
  HttpStatusValidationError,
  ResultExtractors,
} from '@ahoo-wang/fetcher';
import { useState } from 'react';
import { installFetchFixture } from '../fixtures/http';

type Scenario = 'basic' | 'path-query' | 'post' | 'timeout' | 'error';

interface RequestDemoProps {
  scenario: Scenario;
}

function RequestDemo({ scenario }: RequestDemoProps) {
  const [output, setOutput] = useState('Ready');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    setOutput('Loading…');
    try {
      const api = new Fetcher({
        baseURL: 'https://api.example.test',
        timeout: scenario === 'timeout' ? 10 : 1_000,
      });

      if (scenario === 'basic') {
        const user = await api.get<{ name: string }>(
          '/users/u-ada',
          {},
          { resultExtractor: ResultExtractors.Json },
        );
        setOutput(user.name);
      } else if (scenario === 'path-query') {
        const result = await api.get<{ requestUrl: string }>(
          '/users/{id}',
          {
            urlParams: { path: { id: 'u-ada' }, query: { include: 'team' } },
          },
          { resultExtractor: ResultExtractors.Json },
        );
        setOutput(`GET ${result.requestUrl}`);
      } else if (scenario === 'post') {
        const user = await api.post<{ id: string; name: string }>(
          '/users',
          { body: { name: 'Kai', role: 'member' } },
          { resultExtractor: ResultExtractors.Json },
        );
        setOutput(`Created ${user.id}: ${user.name}`);
      } else if (scenario === 'timeout') {
        await api.get('/slow');
      } else {
        await api.get('/error');
      }
    } catch (error) {
      if (error instanceof ExchangeError) {
        const exchangeError = error.exchange.error;
        if (exchangeError instanceof FetchTimeoutError) {
          setOutput('ExchangeError → FetchTimeoutError · 10ms');
        } else if (exchangeError instanceof HttpStatusValidationError) {
          setOutput(
            `ExchangeError → HttpStatusValidationError · ${error.exchange.response?.status}`,
          );
        } else {
          setOutput(`ExchangeError → ${exchangeError?.name ?? 'Unknown'}`);
        }
      } else {
        setOutput(error instanceof Error ? error.name : 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="story-stack" aria-label="Fetcher request">
      <button disabled={loading} onClick={() => void send()}>
        Send request
      </button>
      <output className="story-output" aria-live="polite">
        {output}
      </output>
    </section>
  );
}

const scene = {
  domain: 'HTTP exchange',
  summary: 'Trace a request through URL resolution, transport, and extraction.',
  fixture: 'Local fetch fixture · api.example.test',
  setup: 'A Fetcher and deterministic HTTP fixture are created for this path.',
  observe: 'The result names the URL, payload, timeout, or wrapped HTTP error.',
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
  title: 'HTTP/Fetcher',
  component: RequestDemo,
  beforeEach: installFetchFixture,
  args: { scenario: 'basic' },
  argTypes: { scenario: { table: { disable: true } } },
} satisfies Meta<typeof RequestDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BasicRequest: Story = {
  args: { scenario: 'basic' },
};

export const PathAndQuery: Story = {
  args: { scenario: 'path-query' },
};

export const PostJson: Story = {
  args: { scenario: 'post' },
};

export const Timeout: Story = {
  args: { scenario: 'timeout' },
};

export const ServerError: Story = {
  args: { scenario: 'error' },
};
