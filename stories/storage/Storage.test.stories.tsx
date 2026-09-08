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

async function writeAndExpect(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Write value' }));
  await expect(await canvas.findByText(text)).toBeVisible();
}
import displayMeta, {
  ChangeNotifications as DisplayChangeNotifications,
  Cleanup as DisplayCleanup,
  ReadWrite as DisplayReadWrite,
  Serialization as DisplaySerialization,
} from './Storage.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: '事件与存储/Storage/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const ReadWrite: Story = {
  ...DisplayReadWrite,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) => writeAndExpect(canvasElement, 'dark'),
};

export const Serialization: Story = {
  ...DisplaySerialization,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    writeAndExpect(canvasElement, '{"theme":"dark"}'),
};

export const ChangeNotifications: Story = {
  ...DisplayChangeNotifications,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) => writeAndExpect(canvasElement, 'light → dark'),
};

export const Cleanup: Story = {
  ...DisplayCleanup,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    writeAndExpect(canvasElement, '1 notification · destroyed'),
};
