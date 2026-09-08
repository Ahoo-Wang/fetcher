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
import { ExchangeError, HttpStatusValidationError } from '@ahoo-wang/fetcher';
import { OpenAI } from '@ahoo-wang/fetcher-openai';
import { useState } from 'react';
import { installFetchFixture } from '../fixtures/http';

type Scenario = 'json' | 'stream' | 'cancel' | 'error';

async function runScenario(scenario: Scenario): Promise<string> {
  const openai = new OpenAI({
    baseURL: 'https://api.example.test',
    apiKey: 'storybook-placeholder',
  });

  try {
    if (scenario === 'json') {
      const response = await openai.chat.completions({
        model: 'fixture-model',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      return response.choices[0]?.message.content ?? 'No content';
    }

    if (scenario === 'error') {
      await openai.chat.completions({
        model: 'fixture-error',
        messages: [{ role: 'user', content: 'Fail locally' }],
      });
      return 'Unexpected success';
    }

    const stream = await openai.chat.completions({
      model: scenario === 'cancel' ? 'fixture-cancel' : 'fixture-model',
      messages: [{ role: 'user', content: 'Stream locally' }],
      stream: true,
    });

    if (scenario === 'cancel') {
      const reader = stream.getReader();
      await reader.read();
      await reader.cancel();
      await reader.closed;
      return 'Reader cancelled';
    }

    let output = '';
    for await (const event of stream) {
      output += event.data.choices[0]?.delta.content ?? '';
    }
    return output;
  } catch (error) {
    if (
      error instanceof ExchangeError &&
      error.exchange.error instanceof HttpStatusValidationError
    ) {
      return `ExchangeError → HttpStatusValidationError · ${error.exchange.response?.status}`;
    }
    return error instanceof Error ? error.name : 'Unknown error';
  }
}

function OpenAIDemo({ scenario }: { scenario: Scenario }) {
  const [output, setOutput] = useState('Ready');
  return (
    <section className="story-stack" aria-label="OpenAI completion">
      <button onClick={() => void runScenario(scenario).then(setOutput)}>
        Send chat
      </button>
      <output className="story-output" aria-live="polite">
        {output}
      </output>
    </section>
  );
}

const scene = {
  domain: 'Protocol streaming',
  summary: 'Reconstruct an OpenAI-compatible completion from local chunks.',
  fixture: 'Local SSE · no credentials',
  setup: 'Credential-free chat completion chunks form the response.',
  observe:
    'Token assembly, [DONE], malformed data, or cancellation is visible.',
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
  title: 'HTTP/OpenAI Streaming',
  component: OpenAIDemo,
  beforeEach: installFetchFixture,
  args: { scenario: 'json' },
  argTypes: { scenario: { table: { disable: true } } },
} satisfies Meta<typeof OpenAIDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NonStreaming: Story = {
  args: { scenario: 'json' },
};

export const TokenStream: Story = {
  args: { scenario: 'stream' },
};

export const ReaderCancellation: Story = {
  args: { scenario: 'cancel' },
};

export const ApiError: Story = {
  args: { scenario: 'error' },
};
