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

async function loadAndExpect(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Load users' }));
  await expect(await canvas.findByText(text)).toBeVisible();
}
import displayMeta, {
  DebouncedRequest as DisplayDebouncedRequest,
  EmptyList as DisplayEmptyList,
  GetSuccess as DisplayGetSuccess,
  HttpError as DisplayHttpError,
  ManualRefetch as DisplayManualRefetch,
} from './FetcherHooks.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: 'React Hooks/Fetcher/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const GetSuccess: Story = {
  ...DisplayGetSuccess,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) => loadAndExpect(canvasElement, 'Ada, Lin'),
};

export const EmptyList: Story = {
  ...DisplayEmptyList,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) => loadAndExpect(canvasElement, 'Empty · 0 users'),
};

export const HttpError: Story = {
  ...DisplayHttpError,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    loadAndExpect(canvasElement, 'Error · ExchangeError'),
};

export const ManualRefetch: Story = {
  ...DisplayManualRefetch,
  tags: ['!dev', '!autodocs', 'test'],
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
  ...DisplayDebouncedRequest,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    loadAndExpect(canvasElement, 'Debounced · Ada · query Ada'),
};
