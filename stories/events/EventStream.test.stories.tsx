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
import '@ahoo-wang/fetcher-eventstream';
import { expect, userEvent, within } from 'storybook/test';

async function readAndExpect(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Read stream' }));
  await expect(await canvas.findByText(text)).toBeVisible();
}
import displayMeta, {
  Cancelled as DisplayCancelled,
  DoneTermination as DisplayDoneTermination,
  MalformedJson as DisplayMalformedJson,
  MultilineEvent as DisplayMultilineEvent,
  TokenStream as DisplayTokenStream,
} from './EventStream.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: '事件与存储/Event Stream/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const TokenStream: Story = {
  ...DisplayTokenStream,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) => readAndExpect(canvasElement, 'Hello Fetcher'),
};

export const MultilineEvent: Story = {
  ...DisplayMultilineEvent,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    readAndExpect(canvasElement, 'note: first line · second line'),
};

export const DoneTermination: Story = {
  ...DisplayDoneTermination,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    readAndExpect(canvasElement, '2 chunks · stopped at [DONE]'),
};

export const MalformedJson: Story = {
  ...DisplayMalformedJson,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    readAndExpect(canvasElement, 'SyntaxError · malformed JSON'),
};

export const Cancelled: Story = {
  ...DisplayCancelled,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    readAndExpect(canvasElement, 'Cancelled after chunk-1'),
};
