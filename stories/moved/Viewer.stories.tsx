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
import { expect, within } from 'storybook/test';
import { MovedNotice } from '../shared/MovedNotice.js';

const FIVE_X_STORIES =
  'https://github.com/Ahoo-Wang/fetcher/tree/5.x/stories/viewer';

const meta = {
  title: 'Viewer/已退役',
  component: MovedNotice,
  parameters: {
    docs: {
      description: {
        component:
          '`@ahoo-wang/fetcher-viewer` 已被 View Engine 取代，冻结在 5.x 分支，不再随 main 发布；它的故事留在 5.x 分支。新项目使用 Wow 仓的 `@ahoo-wang/wow-view-engine`。',
      },
    },
  },
  args: {
    subject: 'Viewer',
    summary:
      'fetcher-viewer 冻结在 5.x 分支，只接收补丁；新的数据视图由 Wow 仓的 View Engine 提供。',
    packages: ['@ahoo-wang/fetcher-viewer@5', '@ahoo-wang/wow-view-engine'],
    link: { href: FIVE_X_STORIES, label: '查看 5.x 分支上的 Viewer 故事' },
  },
} satisfies Meta<typeof MovedNotice>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Retired: Story = {
  name: '已退役',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('link', { name: '查看 5.x 分支上的 Viewer 故事' }),
    ).toHaveAttribute('href', FIVE_X_STORIES);
  },
};
