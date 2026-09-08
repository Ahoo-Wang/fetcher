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

async function sendAndExpect(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Send request' }));
  await expect(await canvas.findByText(text)).toBeVisible();
}
import displayMeta, {
  BasicRequest as DisplayBasicRequest,
  PathAndQuery as DisplayPathAndQuery,
  PostJson as DisplayPostJson,
  ServerError as DisplayServerError,
  Timeout as DisplayTimeout,
} from './Fetcher.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: 'HTTP/Fetcher/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const BasicRequest: Story = {
  ...DisplayBasicRequest,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) => sendAndExpect(canvasElement, 'Ada'),
};

export const PathAndQuery: Story = {
  ...DisplayPathAndQuery,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    sendAndExpect(
      canvasElement,
      'GET https://api.example.test/users/u-ada?include=team',
    ),
};

export const PostJson: Story = {
  ...DisplayPostJson,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    sendAndExpect(canvasElement, 'Created u-new: Kai'),
};

export const Timeout: Story = {
  ...DisplayTimeout,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    sendAndExpect(canvasElement, 'ExchangeError → FetchTimeoutError · 10ms'),
};

export const ServerError: Story = {
  ...DisplayServerError,
  tags: ['!dev', '!autodocs', 'test'],
  play: ({ canvasElement }) =>
    sendAndExpect(
      canvasElement,
      'ExchangeError → HttpStatusValidationError · 500',
    ),
};
