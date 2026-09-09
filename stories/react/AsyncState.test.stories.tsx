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
import { expect, userEvent, within } from 'storybook/test';

async function runAndExpect(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await expect(canvas.getByText('Setup')).toBeVisible();
  await expect(canvas.getByText('Action')).toBeVisible();
  await expect(canvas.getByText('Observe')).toBeVisible();
  const trigger = canvas.getByRole('button', { name: 'Run operation' });
  await expect(window.getComputedStyle(trigger).borderRadius).toBe('8px');
  await userEvent.tab();
  await expect(trigger).toHaveFocus();
  await expect(window.getComputedStyle(trigger).outlineColor).toBe(
    'rgb(9, 88, 217)',
  );
  await userEvent.click(trigger);
  await expect(await canvas.findByText(text)).toBeVisible();
}
import displayMeta, {
  Debounce as DisplayDebounce,
  Rejection as DisplayRejection,
  Retry as DisplayRetry,
  StaleResultSuppression as DisplayStaleResultSuppression,
  Success as DisplaySuccess,
  UnmountCleanup as DisplayUnmountCleanup,
} from './AsyncState.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: 'React Hooks/Async State/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const Success: Story = {
  ...DisplaySuccess,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) => runAndExpect(canvasElement, 'success · Loaded'),
};

export const Rejection: Story = {
  ...DisplayRejection,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    runAndExpect(canvasElement, 'error · Unable to load'),
};

export const Retry: Story = {
  ...DisplayRetry,
  tags: ['!dev', '!autodocs', 'test'],
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
  ...DisplayDebounce,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    runAndExpect(canvasElement, 'success · Debounced third'),
};

export const StaleResultSuppression: Story = {
  ...DisplayStaleResultSuppression,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    runAndExpect(canvasElement, 'success · Fast result'),
};

export const UnmountCleanup: Story = {
  ...DisplayUnmountCleanup,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Unmount child' }),
    );
    await expect(await canvas.findByText('Unmounted safely')).toBeVisible();
  },
};
