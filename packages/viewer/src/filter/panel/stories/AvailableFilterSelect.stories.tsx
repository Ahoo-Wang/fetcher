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
import React, { useRef, useState } from 'react';
import {
  AvailableFilterSelect,
  AvailableFilterSelectRef,
  AvailableFilterGroup,
  AvailableFilter,
  AvailableFilterSelectProps,
} from '../AvailableFilterSelect';
import { Card, Typography, Space, Button, Divider } from 'antd';

function AvailableFilterSelectDemo(props: AvailableFilterSelectProps) {
  const ref = useRef<AvailableFilterSelectRef>(null);
  const [selected, setSelected] = useState<AvailableFilter[]>();

  const handleGetValue = () => {
    setSelected(ref.current?.getValue());
  };

  return (
    <Card title="Available Filter Select Demo" style={{ width: 600 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <AvailableFilterSelect {...props} ref={ref} />
        <Button onClick={handleGetValue} type="primary">
          获取选中过滤器
        </Button>
        {selected && (
          <>
            <Divider></Divider>
            <Typography.Text type="secondary" code>
              {JSON.stringify(selected)}
            </Typography.Text>
          </>
        )}
      </Space>
    </Card>
  );
}

const meta: Meta<typeof AvailableFilterSelectDemo> = {
  title: 'Viewer/Filters/Panel/AvailableFilterSelect',
  component: AvailableFilterSelectDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A component for selecting available filters from grouped filter options.

## Key Features
- **Grouped Filters**: Organizes filters into logical groups with labels
- **Checkbox Selection**: Allows multiple filter selection via checkboxes
- **Ref API**: Provides getValue method to retrieve selected filters
- **Flexible Layout**: Uses Antd Flex for responsive layout
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    filters: {
      control: 'object',
      description: 'Array of filter groups containing available filters',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for demonstration
const mockFilters: AvailableFilterGroup[] = [
  {
    label: '用户信息',
    filters: [
      {
        key: 'name',
        field: { name: 'name', label: '姓名', type: 'string' },
        component: 'text',
      },
      {
        key: 'email',
        field: { name: 'email', label: '邮箱', type: 'string' },
        component: 'text',
      },
      {
        key: 'age',
        field: { name: 'age', label: '年龄', type: 'number' },
        component: 'number',
      },
    ],
  },
  {
    label: '状态信息',
    filters: [
      {
        key: 'status',
        field: { name: 'status', label: '状态', type: 'string' },
        component: 'text',
      },
      {
        key: 'createdAt',
        field: { name: 'createdAt', label: '创建时间', type: 'date' },
        component: 'date',
      },
    ],
  },
];

export const Default: Story = {
  args: {
    filters: mockFilters,
  },
};
