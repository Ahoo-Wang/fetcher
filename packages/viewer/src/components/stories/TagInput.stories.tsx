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
import { useState } from 'react';
import { TagInput, NumberTagValueItemSerializer } from '../TagInput';

const meta: Meta<typeof TagInput> = {
  title: 'Viewer/Components/TagInput',
  component: TagInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "A tag input component based on Antd's Select in tags mode. Allows users to input multiple tags separated by specified token separators. Supports both string and number types with custom serializers.",
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <TagInput
        placeholder="Enter tags separated by comma"
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const WithDefaultValues: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([
      'react',
      'typescript',
      'storybook',
    ]);
    return (
      <TagInput
        placeholder="Add more tags..."
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const NumberTags: Story = {
  render: () => {
    const [value, setValue] = useState<number[]>([]);
    return (
      <TagInput<number>
        placeholder="Enter numbers separated by space"
        tokenSeparators={[' ']}
        value={value}
        serializer={NumberTagValueItemSerializer}
        onChange={setValue}
      />
    );
  },
};

export const NumberTagsWithDefaults: Story = {
  render: () => {
    const [value, setValue] = useState<number[]>([1, 2, 3]);
    return (
      <TagInput<number>
        placeholder="Add more numbers..."
        tokenSeparators={[' ', ',']}
        value={value}
        serializer={NumberTagValueItemSerializer}
        onChange={setValue}
      />
    );
  },
};

export const CustomSeparators: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <TagInput
        placeholder="Use | or ; to separate tags"
        tokenSeparators={['|', ';']}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const MaxTagCount: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([
      'tag1',
      'tag2',
      'tag3',
      'tag4',
      'tag5',
    ]);
    return (
      <TagInput
        placeholder="Maximum 3 tags"
        maxTagCount={3}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(['disabled', 'tags']);
    return (
      <TagInput
        placeholder="This input is disabled"
        disabled={true}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const NoClear: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(['persistent', 'tags']);
    return (
      <TagInput
        placeholder="No clear button"
        allowClear={false}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const WithChangeHandler: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <div>
        <TagInput
          placeholder="Type and see changes below"
          value={value}
          onChange={setValue}
        />
        <p style={{ marginTop: 16, fontSize: '14px', color: '#666' }}>
          Current tags: [{value.join(', ')}]
        </p>
        <p style={{ fontSize: '12px', color: '#999' }}>
          Try typing: apple, banana; orange|grape
        </p>
      </div>
    );
  },
};

export const EmailTags: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <TagInput
        placeholder="Enter email addresses"
        tokenSeparators={[',', ';', ' ']}
        style={{ minWidth: 300 }}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const CompactLayout: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(['small', 'compact', 'tags']);
    return (
      <TagInput
        placeholder="Compact tags"
        size="small"
        value={value}
        onChange={setValue}
      />
    );
  },
};