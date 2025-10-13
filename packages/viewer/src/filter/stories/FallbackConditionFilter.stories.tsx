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
import { FallbackConditionFilter } from '../FallbackConditionFilter';

const meta: Meta<typeof FallbackConditionFilter> = {
  title: 'Viewer/Filter/FallbackConditionFilter',
  component: FallbackConditionFilter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A fallback component that displays a warning when an unsupported filter type is encountered.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'text',
      description: 'The unsupported filter type that triggered the fallback',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'unknown-filter-type',
  },
};

export const CustomType: Story = {
  args: {
    type: 'custom-data-type',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the fallback for a custom data type.',
      },
    },
  },
};

export const ComplexType: Story = {
  args: {
    type: 'array<string>',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the fallback for complex type names.',
      },
    },
  },
};
