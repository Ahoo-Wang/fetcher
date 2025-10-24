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

import type { Meta, StoryObj } from '@storybook/react';
import { EditableFilterPanel } from '../EditableFilterPanel';
import type { AvailableFilterGroup } from '../AvailableFilterSelect';
import type { ActiveFilter } from '../EditableFilterPanel';
import React, { useState } from 'react';
import { Card, Divider, Typography } from 'antd';
import { all, Condition } from '@ahoo-wang/fetcher-wow';

const meta: Meta<typeof EditableFilterPanel> = {
  title: 'Viewer/Filters/Panel/FilterPanel',
  component: EditableFilterPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

const mockAvailableFilters: AvailableFilterGroup[] = [
  {
    label: '基本筛选',
    filters: [
      {
        field: { name: 'name', label: '姓名', type: 'string' },
        component: 'text',
      },
      {
        field: { name: 'age', label: '年龄', type: 'number' },
        component: 'number',
      },
    ],
  },
  {
    label: '高级筛选',
    filters: [
      {
        field: { name: 'status', label: '状态', type: 'string' },
        component: 'select',
      },
      {
        field: { name: 'date', label: '日期', type: 'date' },
        component: 'date',
      },
    ],
  },
];

const mockActiveFilters: ActiveFilter[] = [
  {
    key: '1',
    type: 'text',
    field: { name: 'name', label: '姓名', type: 'string' },
  },
];

export const Default: Story = {
  args: {
    availableFilters: mockAvailableFilters,
    activeFilters: mockActiveFilters,
  },
  render: args => {
    const [condition, setCondition] = useState<Condition>(all());
    return (
      <Card>
        <EditableFilterPanel {...args} onSearch={setCondition} />
        <Divider>搜索条件</Divider>
        <Typography.Text type="secondary" code>
          {JSON.stringify(condition)}
        </Typography.Text>
      </Card>
    );
  },
};

export const Empty: Story = {
  args: {
    availableFilters: mockAvailableFilters,
    activeFilters: [],
    onSearch: condition => console.log('搜索条件:', condition),
  },
};
