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
import { ConditionFilter } from '../ConditionFilter';
import '../IdConditionFilter';
import { conditionFilterRegistry } from '../conditionFilterRegistry';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { Input } from 'antd';

// Mock filter components for demonstration
const MockStringFilter = ({ field, operator, placeholder }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span>{field.label}:</span>
    <Input
      placeholder={placeholder || `Enter ${field.label}`}
      style={{ width: 200 }}
    />
  </div>
);

const MockNumberFilter = ({ field, operator, placeholder }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span>{field.label}:</span>
    <Input
      type="number"
      placeholder={placeholder || `Enter ${field.label}`}
      style={{ width: 200 }}
    />
  </div>
);

// Register mock filters for stories
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
          'A dynamic filter component that renders different filter types based on the field type using a registry pattern.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['string', 'number', 'id', 'unsupported'],
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
    field: {
      control: 'object',
      description: 'Field configuration object',
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
  parameters: {
    docs: {
      description: {
        story: 'Renders a string filter component for text input.',
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: 'Renders a number filter component for numeric input.',
      },
    },
  },
};

export const IdFilter: Story = {
  args: {
    type: 'id',
    field: {
      name: 'userId',
      label: 'User ID',
      type: 'string',
    },
    operator: Operator.ID,
    placeholder: 'Enter user ID',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Renders the specialized ID filter component with ID/IDS operators.',
      },
    },
  },
};

export const UnsupportedType: Story = {
  args: {
    type: 'unsupported',
    field: {
      name: 'unknown',
      label: 'Unknown Field',
      type: 'unsupported',
    },
    operator: Operator.EQ,
    placeholder: 'This will show fallback',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the fallback behavior when an unsupported filter type is provided.',
      },
    },
  },
};

export const DynamicTypeSwitching: Story = {
  args: {
    type: 'string',
    field: {
      name: 'dynamic',
      label: 'Dynamic Field',
      type: 'string',
    },
    operator: Operator.EQ,
    placeholder: 'Dynamic placeholder',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows how the component dynamically switches between different filter types.',
      },
    },
  },
};
