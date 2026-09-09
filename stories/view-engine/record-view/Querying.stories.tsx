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
import { expect, within } from 'storybook/test';
import type { Story } from './demoTypes.js';
import { Scenario } from './Scenario.js';
import { recordViewMeta } from './meta.js';

const meta = {
  ...recordViewMeta,
  parameters: {
    ...recordViewMeta.parameters,
    docs: {
      ...recordViewMeta.parameters.docs,
      description: {
        component:
          '筛选输入只修改草稿，Enter/查询才更新记录。已应用区域的清空按钮将控件值恢复为未设置并立即查询，不删除控件。\n\n普通分页返回 list/total；游标模式返回 list/nextCursor，只向后翻页。排序、页大小和筛选改变后由引擎重新协调查询。失败时保留可恢复状态，空结果保留工具栏与创建入口。\n\n请实际修改条件、切页并重试失败场景，观察记录而不只观察开发输出。所有 source 方法沿用 Wow QueryApi，取消信号继续传给业务 I/O。',
      },
    },
  },
  title: 'View Engine/Record View/查询与分页',
};

export default meta;

export const BusinessRecords: Story = {
  name: '订单工作台 · 查询与保存',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('ORD-202609-1001')).toBeVisible();
    const row = canvas.getByRole('row', { name: /ORD-202609-1001/ });
    await expect(within(row).getByText('¥680.00')).toBeVisible();
    await expect(row.querySelector('[data-tone="warning"]')).toHaveTextContent(
      '待处理',
    );
    await expect(row).toHaveTextContent(/2026.*9.*6.*09:00/);
    for (const operation of ['save', 'create', 'rename', 'delete']) {
      await expect(
        canvas.getByTestId(`record-${operation}-count`),
      ).toHaveTextContent('0');
    }
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      '1',
    );
  },
  render: args => <Scenario {...args} />,
};

export const CursorRecords: Story = {
  name: '游标查询 · 只向后翻页',
  render: args => <Scenario {...args} mode="cursor" summaries />,
};

export const EmptyRecords: Story = {
  name: '空列表 · 保留创建入口',
  render: args => <Scenario {...args} empty />,
};

export const QueryFailure: Story = {
  name: '查询失败 · 保留草稿重试',
  render: args => <Scenario {...args} failFirstQuery />,
};
