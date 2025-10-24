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
import { FallbackFilter } from '../FallbackFilter';
import { Operator } from '@ahoo-wang/fetcher-wow';

const meta: Meta<typeof FallbackFilter> = {
  title: 'Viewer/Filters/FallbackFilter',
  component: FallbackFilter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A fallback filter component that displays a warning when an unsupported filter type is requested. This component is used when the filter registry cannot find a matching filter for the specified type.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'unsupported-filter-type',
    field: {
      name: 'unknownField',
      label: 'Unknown Field',
      type: 'unknown',
    },
    operator: {
      defaultValue: Operator.EQ,
      options: [],
    },
    value: {
      defaultValue: '',
    },
  },
  render: args => <FallbackFilter {...args} />,
};

export const CustomType: Story = {
  args: {
    type: 'custom-filter',
    field: {
      name: 'customField',
      label: 'Custom Field',
      type: 'custom',
    },
    operator: {
      defaultValue: Operator.EQ,
      options: [],
    },
    value: {
      defaultValue: 'some value',
    },
  },
  render: args => <FallbackFilter {...args} />,
};

export const WithComplexType: Story = {
  args: {
    type: 'very-complex-filter-type',
    field: {
      name: 'complexField',
      label: 'Complex Field',
      type: 'complex',
    },
    operator: {
      defaultValue: Operator.CONTAINS,
      options: [],
    },
    value: {
      defaultValue: ['value1', 'value2'],
    },
  },
  render: args => <FallbackFilter {...args} />,
};

export const EmptyType: Story = {
  args: {
    type: '',
    field: {
      name: 'emptyField',
      label: 'Empty Field',
      type: 'empty',
    },
    operator: {
      defaultValue: Operator.EQ,
      options: [],
    },
    value: {
      defaultValue: null,
    },
  },
  render: args => <FallbackFilter {...args} />,
};
