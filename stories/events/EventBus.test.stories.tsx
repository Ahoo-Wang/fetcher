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

async function emitAndExpect(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await expect(canvas.getByText('Setup')).toBeVisible();
  await expect(canvas.getByText('Action')).toBeVisible();
  await expect(canvas.getByText('Observe')).toBeVisible();
  await userEvent.click(canvas.getByRole('button', { name: 'Emit event' }));
  await expect(await canvas.findByText(text)).toBeVisible();
}
import displayMeta, {
  BroadcastCleanup as DisplayBroadcastCleanup,
  ParallelCompletion as DisplayParallelCompletion,
  SerialOrder as DisplaySerialOrder,
} from './EventBus.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: '事件与存储/Event Bus/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const SerialOrder: Story = {
  ...DisplaySerialOrder,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) => emitAndExpect(canvasElement, 'first → second'),
};

export const ParallelCompletion: Story = {
  ...DisplayParallelCompletion,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) => emitAndExpect(canvasElement, 'fast → slow'),
};

export const BroadcastCleanup: Story = {
  ...DisplayBroadcastCleanup,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    emitAndExpect(canvasElement, 'posted: update · closed: true'),
};
