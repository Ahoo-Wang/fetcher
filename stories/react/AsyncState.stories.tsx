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
  useDebouncedExecutePromise,
  useExecutePromise,
  useLatest,
} from '@ahoo-wang/fetcher-react';
import { useEffect, useRef, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

type Scenario = 'success' | 'error' | 'retry' | 'debounce' | 'stale';

function resolveAfter(value: string, milliseconds: number): Promise<string> {
  return new Promise(resolve =>
    window.setTimeout(() => resolve(value), milliseconds),
  );
}

function AsyncStateDemo({ scenario }: { scenario: Scenario }) {
  const attempts = useRef(0);
  const latestScenario = useLatest(scenario);
  const execution = useExecutePromise<string, Error>();
  const debounced = useDebouncedExecutePromise<string, Error>({
    debounce: { delay: 20 },
  });
  const state = scenario === 'debounce' ? debounced : execution;

  const run = () => {
    if (scenario === 'debounce') {
      debounced.run(() => resolveAfter('Debounced first', 1));
      debounced.run(() => resolveAfter('Debounced second', 1));
      debounced.run(() => resolveAfter('Debounced third', 1));
      return;
    }

    if (scenario === 'stale') {
      void execution.execute(() => resolveAfter('Slow result', 20));
      void execution.execute(() => resolveAfter('Fast result', 5));
      return;
    }

    void execution.execute(async () => {
      await resolveAfter('', 20);
      if (latestScenario.current === 'error') {
        throw new Error('Unable to load');
      }
      if (latestScenario.current === 'retry' && attempts.current++ === 0) {
        throw new Error('Try again');
      }
      return latestScenario.current === 'retry' ? 'Recovered' : 'Loaded';
    });
  };

  const detail = state.error?.message ?? state.result;

  return (
    <section className="story-stack" aria-label="Async state">
      <button onClick={run}>Run operation</button>
      <output className="story-output" aria-live="polite">
        {state.status}
        {detail ? ` · ${detail}` : ''}
      </output>
    </section>
  );
}

function PendingChild({ onAbort }: { onAbort: () => void }) {
  const { execute } = useExecutePromise<string>({ onAbort });
  useEffect(() => {
    void execute(
      controller =>
        new Promise((resolve, reject) => {
          const timer = window.setTimeout(() => resolve('Too late'), 100);
          controller.signal.addEventListener(
            'abort',
            () => {
              window.clearTimeout(timer);
              reject(new DOMException('Aborted', 'AbortError'));
            },
            { once: true },
          );
        }),
    );
  }, [execute]);
  return <p>Child operation is loading</p>;
}

function UnmountDemo() {
  const [mounted, setMounted] = useState(true);
  const [output, setOutput] = useState('Mounted');
  return (
    <section className="story-stack" aria-label="Unmount cleanup">
      <button onClick={() => setMounted(false)}>Unmount child</button>
      {mounted && (
        <PendingChild onAbort={() => setOutput('Unmounted safely')} />
      )}
      <output className="story-output" aria-live="polite">
        {output}
      </output>
    </section>
  );
}

const meta = {
  title: 'React Hooks/Async State',
  component: AsyncStateDemo,
  args: { scenario: 'success' },
  argTypes: { scenario: { control: 'radio' } },
} satisfies Meta<typeof AsyncStateDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

async function runAndExpect(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Run operation' }));
  await expect(await canvas.findByText(text)).toBeVisible();
}

export const Success: Story = {
  args: { scenario: 'success' },
  play: ({ canvasElement }) => runAndExpect(canvasElement, 'success · Loaded'),
};

export const Rejection: Story = {
  args: { scenario: 'error' },
  play: ({ canvasElement }) =>
    runAndExpect(canvasElement, 'error · Unable to load'),
};

export const Retry: Story = {
  args: { scenario: 'retry' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Run operation' }),
    );
    await expect(await canvas.findByText('error · Try again')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Run operation' }),
    );
    await expect(await canvas.findByText('success · Recovered')).toBeVisible();
  },
};

export const Debounce: Story = {
  args: { scenario: 'debounce' },
  play: ({ canvasElement }) =>
    runAndExpect(canvasElement, 'success · Debounced third'),
};

export const StaleResultSuppression: Story = {
  args: { scenario: 'stale' },
  play: ({ canvasElement }) =>
    runAndExpect(canvasElement, 'success · Fast result'),
};

export const UnmountCleanup: Story = {
  render: () => <UnmountDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Unmount child' }),
    );
    await expect(await canvas.findByText('Unmounted safely')).toBeVisible();
  },
};
