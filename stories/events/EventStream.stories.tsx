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
import '@ahoo-wang/fetcher-eventstream';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fixtureSseChunks } from '../fixtures/http';

type Scenario = 'tokens' | 'multiline' | 'done' | 'malformed' | 'cancelled';

interface ChatChunk {
  choices: Array<{ delta: { content?: string } }>;
}

function responseFromChunks(chunks: readonly string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } },
  );
}

async function readTokens(): Promise<string> {
  const events = responseFromChunks(
    fixtureSseChunks,
  ).requiredJsonEventStream<ChatChunk>(event => event.data === '[DONE]');
  let output = '';
  for await (const event of events) {
    output += event.data.choices[0]?.delta.content ?? '';
  }
  return output;
}

async function runScenario(scenario: Scenario): Promise<string> {
  if (scenario === 'tokens') return readTokens();

  if (scenario === 'multiline') {
    const reader = responseFromChunks([
      'event: note\nid: multiline\ndata: first line\ndata: second line\n\n',
    ])
      .requiredEventStream()
      .getReader();
    const result = await reader.read();
    return `${result.value?.event}: ${result.value?.data.replace('\n', ' · ')}`;
  }

  if (scenario === 'done') {
    const events = responseFromChunks(
      fixtureSseChunks,
    ).requiredJsonEventStream<ChatChunk>(event => event.data === '[DONE]');
    let count = 0;
    for await (const event of events) {
      if (event.data.choices.length) count++;
    }
    return `${count} chunks · stopped at [DONE]`;
  }

  if (scenario === 'malformed') {
    try {
      const reader = responseFromChunks(['data: {"broken"\n\n'])
        .requiredJsonEventStream<Record<string, unknown>>()
        .getReader();
      await reader.read();
      return 'Unexpected success';
    } catch (error) {
      return `${error instanceof Error ? error.name : 'Error'} · malformed JSON`;
    }
  }

  const encoder = new TextEncoder();
  const response = new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode('id: chunk-1\ndata: first chunk\n\n'),
        );
      },
      cancel() {},
    }),
    { headers: { 'Content-Type': 'text/event-stream' } },
  );
  const reader = response.requiredEventStream().getReader();
  const first = await reader.read();
  await reader.cancel();
  return `Cancelled after ${first.value?.id}`;
}

function EventStreamDemo({ scenario }: { scenario: Scenario }) {
  const [output, setOutput] = useState('Ready');
  return (
    <section className="story-stack" aria-label="Event stream">
      <button
        onClick={() => {
          void runScenario(scenario).then(setOutput);
        }}
      >
        Read stream
      </button>
      <output className="story-output" aria-live="polite">
        {output}
      </output>
    </section>
  );
}

const scene = {
  domain: 'Streaming',
  summary: 'Read deterministic SSE frames as browser consumers receive them.',
  fixture: 'Local ReadableStream · fixed SSE chunks',
  setup: 'A Response is assembled from known event-stream chunks.',
  observe:
    'Parsed events, termination, malformed JSON, or cancellation is visible.',
};

const meta = {
  decorators: [
    (Story, context) => (
      <AntdProvider>
        <ScenarioFrame title={context.name} {...scene}>
          <Story />
        </ScenarioFrame>
      </AntdProvider>
    ),
  ],
  title: '事件与存储/Event Stream',
  component: EventStreamDemo,
  args: { scenario: 'tokens' },
  argTypes: { scenario: { table: { disable: true } } },
} satisfies Meta<typeof EventStreamDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TokenStream: Story = {
  args: { scenario: 'tokens' },
};

export const MultilineEvent: Story = {
  args: { scenario: 'multiline' },
};

export const DoneTermination: Story = {
  args: { scenario: 'done' },
};

export const MalformedJson: Story = {
  args: { scenario: 'malformed' },
};

export const Cancelled: Story = {
  args: { scenario: 'cancelled' },
};
