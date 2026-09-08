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
          '查询与分页：比较页码、游标、空态和失败重试。普通演示只进行初始读取，查询与保存由用户触发。',
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
