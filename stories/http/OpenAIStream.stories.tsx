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
import { ExchangeError, HttpStatusValidationError } from '@ahoo-wang/fetcher';
import { OpenAI } from '@ahoo-wang/fetcher-openai';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
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

const meta = {
  title: 'HTTP & Streaming/OpenAI',
  component: OpenAIDemo,
  beforeEach: installFetchFixture,
  args: { scenario: 'json' },
  argTypes: { scenario: { control: 'radio' } },
} satisfies Meta<typeof OpenAIDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

async function chatAndExpect(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Send chat' }));
  await expect(await canvas.findByText(text)).toBeVisible();
}

export const NonStreaming: Story = {
  args: { scenario: 'json' },
  play: ({ canvasElement }) => chatAndExpect(canvasElement, 'Hello Fetcher'),
};

export const TokenStream: Story = {
  args: { scenario: 'stream' },
  play: ({ canvasElement }) => chatAndExpect(canvasElement, 'Hello Fetcher'),
};

export const ReaderCancellation: Story = {
  args: { scenario: 'cancel' },
  play: ({ canvasElement }) => chatAndExpect(canvasElement, 'Reader cancelled'),
};

export const ApiError: Story = {
  args: { scenario: 'error' },
  play: ({ canvasElement }) =>
    chatAndExpect(
      canvasElement,
      'ExchangeError → HttpStatusValidationError · 429',
    ),
};
