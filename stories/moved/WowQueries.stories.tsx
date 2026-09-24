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
  title: 'React Hooks/Wow Queries',
  component: MovedNotice,
  parameters: {
    docs: {
      description: {
        component:
          'Wow 查询 Hook（单条、列表、分页、计数与列表流）已迁到 Wow 仓的 `@ahoo-wang/wow-react`，建立在本仓 `@ahoo-wang/fetcher-react/core` 与 `/fetcher` 两个子路径之上。',
      },
    },
  },
  args: {
    subject: 'Wow Queries',
    summary:
      'useSingleQuery、useListQuery、usePagedQuery、useCountQuery 与 useListStreamQuery 迁到了 Wow 仓（typescript/wow-react），版本跟随 Wow。',
    packages: ['@ahoo-wang/wow-react', '@ahoo-wang/wow-client'],
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
