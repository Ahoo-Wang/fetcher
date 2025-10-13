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
import { TagInput } from '../TagInput';

const meta: Meta<typeof TagInput> = {
  title: 'Viewer/Components/TagInput',
  component: TagInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A tag input component based on Ant Design Select with tags mode. Supports multiple token separators and automatic tag creation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no tags are selected',
    },
    allowClear: {
      control: 'boolean',
      description: 'Whether to show clear button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    maxTagCount: {
      control: 'number',
      description: 'Maximum number of tags to display',
    },
    tokenSeparators: {
      control: 'object',
      description: 'Token separators for creating tags',
    },
    style: {
      control: 'object',
      description: 'Custom styles for the component',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter tags (comma, period, or space separated)',
    style: { width: 300 },
  },
  render: args => {
    const [value, setValue] = useState<string[]>([]);
    return <TagInput {...args} value={value} onChange={setValue} />;
  },
};

export const WithInitialValues: Story = {
  args: {
    placeholder: 'Add more tags...',
    style: { width: 300 },
  },
  render: args => {
    const [value, setValue] = useState<string[]>([
      'react',
      'typescript',
      'storybook',
    ]);
    return <TagInput {...args} value={value} onChange={setValue} />;
  },
};

export const CustomSeparators: Story = {
  args: {
    placeholder: 'Use semicolon, pipe, or newline to separate tags',
    tokenSeparators: [';', '|', '\n'],
    style: { width: 300 },
  },
  render: args => {
    const [value, setValue] = useState<string[]>([]);
    return <TagInput {...args} value={value} onChange={setValue} />;
  },
};

export const MaxTagCount: Story = {
  args: {
    placeholder: 'Maximum 3 tags displayed',
    maxTagCount: 3,
    style: { width: 300 },
  },
  render: args => {
    const [value, setValue] = useState<string[]>([
      'tag1',
      'tag2',
      'tag3',
      'tag4',
      'tag5',
    ]);
    return <TagInput {...args} value={value} onChange={setValue} />;
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'This input is disabled',
    disabled: true,
    style: { width: 300 },
  },
  render: args => {
    const [value, setValue] = useState<string[]>(['disabled', 'tags']);
    return <TagInput {...args} value={value} onChange={setValue} />;
  },
};

export const NoClearButton: Story = {
  args: {
    placeholder: 'No clear button available',
    allowClear: false,
    style: { width: 300 },
  },
  render: args => {
    const [value, setValue] = useState<string[]>(['persistent', 'tags']);
    return <TagInput {...args} value={value} onChange={setValue} />;
  },
};

export const CustomStyling: Story = {
  args: {
    placeholder: 'Custom styled tag input',
    style: {
      width: 400,
      border: '2px solid #1890ff',
      borderRadius: '8px',
      padding: '4px',
    },
  },
  render: args => {
    const [value, setValue] = useState<string[]>([]);
    return <TagInput {...args} value={value} onChange={setValue} />;
  },
};
