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

async function chatAndExpect(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Send chat' }));
  await expect(await canvas.findByText(text)).toBeVisible();
}
import displayMeta, {
  ApiError as DisplayApiError,
  NonStreaming as DisplayNonStreaming,
  ReaderCancellation as DisplayReaderCancellation,
  TokenStream as DisplayTokenStream,
} from './OpenAIStream.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: 'HTTP/OpenAI Streaming/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const NonStreaming: Story = {
  ...DisplayNonStreaming,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) => chatAndExpect(canvasElement, 'Hello Fetcher'),
};

export const TokenStream: Story = {
  ...DisplayTokenStream,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) => chatAndExpect(canvasElement, 'Hello Fetcher'),
};

export const ReaderCancellation: Story = {
  ...DisplayReaderCancellation,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) => chatAndExpect(canvasElement, 'Reader cancelled'),
};

export const ApiError: Story = {
  ...DisplayApiError,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    chatAndExpect(
      canvasElement,
      'ExchangeError → HttpStatusValidationError · 429',
    ),
};
