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
import type { StoryObj } from '@storybook/react-vite';
import displayMeta, {
  Success as DisplaySuccess,
  Failure as DisplayFailure,
  Cancellation as DisplayCancellation,
} from './ReactRequests.stories.js';

const meta = {
  ...displayMeta,
  title: 'Docs/React requests/回归',
  tags: ['!dev', '!autodocs', 'test'],
};
export default meta;
type Story = StoryObj<typeof displayMeta>;

export const Success: Story = {
  ...DisplaySuccess,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByText('Ada, Lin')).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Load' }));
    await expect(await canvas.findByText('Ada, Lin')).toBeVisible();
  },
};

export const Failure: Story = {
  ...DisplayFailure,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByText('Error · ExchangeError')).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Fail' }));
    await expect(
      await canvas.findByText('Error · ExchangeError'),
    ).toBeVisible();
  },
};

export const Cancellation: Story = {
  ...DisplayCancellation,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByText('completed')).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Load' }));
    await expect(await canvas.findByText('Ada, Lin')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Load slow' }));
    await expect(canvas.getByText('loading')).toBeVisible();
    await new Promise(resolve => window.setTimeout(resolve, 100));
    await expect(canvas.getByText('loading')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(canvas.getByText('idle')).toBeVisible();
    await new Promise(resolve => window.setTimeout(resolve, 2100));
    expect(canvas.queryByText('completed')).not.toBeInTheDocument();
  },
};
