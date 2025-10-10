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
import React from 'react';
import { ConditionFilter } from '../conditionFilter';
import { conditionFilterRegistry } from '../conditionFilterRegistry';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { Input } from 'antd';

// Create a simple mock filter component for demonstration
const MockStringFilter = ({ field, operator, placeholder }: any) => (
  <Input placeholder={placeholder || `Enter ${field.label}`} />
);

const MockNumberFilter = ({ field, operator, placeholder }: any) => (
  <Input type="number" placeholder={placeholder || `Enter ${field.label}`} />
);

// Register mock filters for the story
conditionFilterRegistry.register('string', MockStringFilter);
conditionFilterRegistry.register('number', MockNumberFilter);

const meta: Meta<typeof ConditionFilter> = {
  title: 'Viewer/Filter/ConditionFilter',
  component: ConditionFilter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A dynamic filter component that renders different filter types based on the field type.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['string', 'number'],
      description: 'The type of filter to render',
    },
    operator: {
      control: { type: 'select' },
      options: Object.values(Operator),
      description: 'The operator for the condition',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const StringFilter: Story = {
  args: {
    type: 'string',
    field: {
      name: 'name',
      label: 'Name',
      type: 'string',
    },
    operator: Operator.EQ,
    placeholder: 'Enter name',
  },
  render: args => {
    const ref = React.createRef<any>();
    return <ConditionFilter {...args} ref={ref} />;
  },
};

export const NumberFilter: Story = {
  args: {
    type: 'number',
    field: {
      name: 'age',
      label: 'Age',
      type: 'number',
    },
    operator: Operator.GTE,
    placeholder: 'Enter minimum age',
  },
  render: args => {
    const ref = React.createRef<any>();
    return <ConditionFilter {...args} ref={ref} />;
  },
};

export const WithDifferentOperators: Story = {
  args: {
    type: 'string',
    field: {
      name: 'status',
      label: 'Status',
      type: 'string',
    },
    operator: Operator.CONTAINS,
    placeholder: 'Search status',
  },
  render: args => {
    const ref = React.createRef<any>();
    return <ConditionFilter {...args} ref={ref} />;
  },
};
