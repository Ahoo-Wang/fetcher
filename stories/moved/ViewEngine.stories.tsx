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
import { MovedNotice, WOW_STORYBOOK } from '../shared/MovedNotice.js';

const meta = {
  title: 'View Engine/已迁移',
  component: MovedNotice,
  parameters: {
    docs: {
      description: {
        component:
          'View Engine 的全部场景（首页、数据视图、分析视图、仪表盘视图与真实后端）已随包迁到 Wow 仓，在 Wow 文档站的 Storybook 里维护。',
      },
    },
  },
  args: {
    subject: 'View Engine',
    summary:
      '数据视图引擎迁到了 Wow 仓（typescript/wow-view-engine），它的故事在 Wow 文档站的 Storybook 里。',
    packages: ['@ahoo-wang/wow-view-engine'],
    availability:
      '还没有发布到 npm：View Engine 宣布稳定后，随 Wow 的版本一起发布。它从未以 @ahoo-wang/fetcher-view-engine 的名字发布过。',
    link: { href: WOW_STORYBOOK, label: '打开 Wow Storybook' },
  },
} satisfies Meta<typeof MovedNotice>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Moved: Story = {
  name: '已迁移',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('link', { name: '打开 Wow Storybook' }),
    ).toHaveAttribute('href', WOW_STORYBOOK);
  },
};
