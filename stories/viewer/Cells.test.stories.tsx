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
import displayMeta, { Gallery as DisplayGallery } from './Cells.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: 'Viewer/单元格与表格/Cells/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const Gallery: Story = {
  ...DisplayGallery,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    await expect(await canvas.findByText('Action: Edit Ada')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'docs@example.test' }),
    ).toHaveAttribute('href', 'mailto:docs@example.test');
  },
};
