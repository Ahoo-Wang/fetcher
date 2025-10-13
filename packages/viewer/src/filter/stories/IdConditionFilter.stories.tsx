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
import React, { useState } from 'react';
import { IdConditionFilter } from '../IdConditionFilter';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { ConditionFilterValue } from '../types';
import { Card, Typography } from 'antd';

const meta: Meta<typeof IdConditionFilter> = {
  title: 'Viewer/Filter/IdConditionFilter',
  component: IdConditionFilter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A specialized filter component for ID fields that provides ID and IDS operators for filtering by single ID or multiple IDs.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    field: {
      control: 'object',
      description: 'The field configuration for the filter',
    },
    operator: {
      control: { type: 'select' },
      options: [Operator.ID, Operator.IDS],
      description:
        'The operator for the condition (ID for single ID, IDS for multiple IDs)',
    },
    value: {
      control: 'object',
      description: 'The value configuration for the input',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    field: {
      name: 'id',
      label: 'ID',
      type: 'string',
    },
    label: {
      name: 'id',
    },
    operator: {
      defaultValue: Operator.ID,
    },
    value: {
      placeholder: 'Enter ID',
    },
  },
  render: args => {
    return <IdConditionFilter {...args} />;
  },
};

export const WithOnChange: Story = {
  args: {
    field: {
      name: 'id',
      label: 'ID',
      type: 'string',
    },
    label: {
      name: 'id',
    },
    operator: {
      defaultValue: Operator.ID,
    },
    value: {
      placeholder: 'Enter ID',
    },
  },
  render: args => {
    const [conditionValue, setConditionValue] = useState<
      ConditionFilterValue | undefined
    >();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <IdConditionFilter {...args} onChange={setConditionValue} />
        <Card title="Current Condition Value" size="small">
          <Typography.Text code>
            {conditionValue
              ? JSON.stringify(conditionValue, null, 2)
              : 'No value'}
          </Typography.Text>
        </Card>
      </div>
    );
  },
};
