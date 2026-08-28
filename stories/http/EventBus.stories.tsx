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
import {
  BroadcastTypedEventBus,
  ParallelTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import type {
  CrossTabMessageHandler,
  CrossTabMessenger,
} from '@ahoo-wang/fetcher-eventbus';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

type Scenario = 'serial' | 'parallel' | 'broadcast';

const delay = (milliseconds: number) =>
  new Promise(resolve => window.setTimeout(resolve, milliseconds));

class FixtureMessenger implements CrossTabMessenger {
  posted?: unknown;
  closed = false;
  private handler: CrossTabMessageHandler = () => undefined;

  set onmessage(handler: CrossTabMessageHandler) {
    this.handler = handler;
  }

  postMessage(message: unknown): void {
    this.posted = message;
  }

  close(): void {
    this.closed = true;
    this.handler = () => undefined;
  }
}

async function runScenario(scenario: Scenario): Promise<string> {
  if (scenario === 'serial') {
    const log: string[] = [];
    const bus = new SerialTypedEventBus<string>('save');
    bus.on({ name: 'second', order: 20, handle: () => log.push('second') });
    bus.on({ name: 'first', order: 10, handle: () => log.push('first') });
    await bus.emit('saved');
    bus.destroy();
    return log.join(' → ');
  }

  if (scenario === 'parallel') {
    const log: string[] = [];
    const bus = new ParallelTypedEventBus<string>('refresh');
    bus.on({
      name: 'slow',
      order: 10,
      handle: async () => {
        await delay(20);
        log.push('slow');
      },
    });
    bus.on({
      name: 'fast',
      order: 20,
      handle: async () => {
        await delay(5);
        log.push('fast');
      },
    });
    await bus.emit('refresh');
    bus.destroy();
    return log.join(' → ');
  }

  const messenger = new FixtureMessenger();
  const delegate = new SerialTypedEventBus<string>('cross-tab');
  const bus = new BroadcastTypedEventBus({ delegate, messenger });
  await bus.emit('update');
  bus.destroy();
  delegate.destroy();
  return `posted: ${String(messenger.posted)} · closed: ${messenger.closed}`;
}

function EventBusDemo({ scenario }: { scenario: Scenario }) {
  const [output, setOutput] = useState('Ready');
  return (
    <section className="story-stack" aria-label="Event bus">
      <button onClick={() => void runScenario(scenario).then(setOutput)}>
        Emit event
      </button>
      <output className="story-output" aria-live="polite">
        {output}
      </output>
    </section>
  );
}

const meta = {
  title: 'HTTP & Streaming/Event Bus',
  component: EventBusDemo,
  args: { scenario: 'serial' },
  argTypes: { scenario: { control: 'radio' } },
} satisfies Meta<typeof EventBusDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

async function emitAndExpect(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Emit event' }));
  await expect(await canvas.findByText(text)).toBeVisible();
}

export const SerialOrder: Story = {
  args: { scenario: 'serial' },
  play: ({ canvasElement }) => emitAndExpect(canvasElement, 'first → second'),
};

export const ParallelCompletion: Story = {
  args: { scenario: 'parallel' },
  play: ({ canvasElement }) => emitAndExpect(canvasElement, 'fast → slow'),
};

export const BroadcastCleanup: Story = {
  args: { scenario: 'broadcast' },
  play: ({ canvasElement }) =>
    emitAndExpect(canvasElement, 'posted: update · closed: true'),
};
