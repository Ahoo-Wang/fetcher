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
import { useExecutePromise } from '@ahoo-wang/fetcher-react/core';
import { StrictMode, useEffect, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, within } from 'storybook/test';

type LifecycleArgs = {
  phase: 'layout' | 'passive';
  strict: boolean;
  unmountBeforeResolve: boolean;
};

const meta = {
  title: 'React Hooks/Async State/Lifecycle Regression',
  tags: ['!dev', '!autodocs', 'test'],
  args: { phase: 'layout', strict: false, unmountBeforeResolve: false },
  render: () => <div data-lifecycle-root />,
} satisfies Meta<LifecycleArgs>;

export default meta;
type Story = StoryObj<LifecycleArgs>;

export const FirstLayoutEffect: Story = {
  play: async ({ canvasElement, args }) => {
    const container = canvasElement.querySelector<HTMLElement>(
      '[data-lifecycle-root]',
    )!;
    const root = createRoot(container);
    const canvas = within(container);
    const trace: string[] = [];
    const signals: AbortSignal[] = [];
    const successes: string[] = [];
    const executions: Promise<void>[] = [];
    let savedExecute!: ReturnType<typeof useExecutePromise<string>>['execute'];
    let resolve!: (value: string) => void;
    const pending = new Promise<string>(done => {
      resolve = done;
    });
    let mounted!: () => void;
    const passiveMount = new Promise<void>(done => {
      mounted = done;
    });
    function run(execute: typeof savedExecute) {
      savedExecute = execute;
      trace.push(args.phase);
      executions.push(
        execute(controller => {
          trace.push('supplier');
          signals.push(controller.signal);
          return pending;
        }),
      );
    }

    function Probe() {
      const { execute, status, result } = useExecutePromise<string>({
        onSuccess: value => {
          successes.push(value);
        },
      });
      useLayoutEffect(() => {
        if (args.phase !== 'layout') return;
        run(execute);
        void Promise.resolve().then(() => trace.push('microtask'));
        // A slow layout exhausts React's task budget, leaving passive effects
        // for the next task. Do not use act: it drains those effects early.
        const until = performance.now() + 10;
        while (performance.now() < until) {
          // Keep this commit busy without changing React's scheduler.
        }
      }, [execute]);
      useEffect(() => {
        trace.push('passive');
        if (args.phase === 'passive') run(execute);
        mounted();
      }, [execute]);
      return <output>{result ?? status}</output>;
    }

    try {
      root.render(
        args.strict ? (
          <StrictMode>
            <Probe />
          </StrictMode>
        ) : (
          <Probe />
        ),
      );
      await passiveMount;
      await expect(trace).toContain('supplier');
      await expect(await canvas.findByText('loading')).toBeVisible();
      await expect(signals.map(signal => signal.aborted)).toEqual(
        args.strict ? [true, false] : [false],
      );
      if (args.unmountBeforeResolve) {
        root.unmount();
        await expect(signals.every(signal => signal.aborted)).toBe(true);
        await savedExecute(async () => {
          trace.push('unmounted supplier');
          return 'unmounted';
        });
        await expect(trace).not.toContain('unmounted supplier');
      }
      resolve('loaded');
      await Promise.all(executions);
      await expect(successes).toEqual(
        args.unmountBeforeResolve ? [] : ['loaded'],
      );
      if (!args.unmountBeforeResolve) {
        await expect(await canvas.findByText('loaded')).toBeVisible();
      }
    } finally {
      root.unmount();
      resolve('cleanup');
    }
  },
};

export const FirstPassiveEffect: Story = {
  ...FirstLayoutEffect,
  args: { phase: 'passive' },
};

export const StrictLayoutEffect: Story = {
  ...FirstLayoutEffect,
  args: { strict: true },
};

export const StrictPassiveEffect: Story = {
  ...FirstLayoutEffect,
  args: { phase: 'passive', strict: true },
};

export const UnmountedExecution: Story = {
  ...FirstLayoutEffect,
  args: { unmountBeforeResolve: true },
};

export const StrictUnmountedExecution: Story = {
  ...FirstLayoutEffect,
  args: { strict: true, unmountBeforeResolve: true },
};
