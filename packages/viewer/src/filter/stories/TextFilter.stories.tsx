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
import { TextFilter } from '../TextFilter';
import { Operator } from '@ahoo-wang/fetcher-wow';

const meta: Meta<typeof TextFilter> = {
  title: 'Viewer/Filters/TextFilter',
  component: TextFilter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A text filter component that supports various text matching operations including equals, contains, starts with, ends with, and in/not in operations.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    field: {
      name: 'name',
      label: 'Name',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.EQ,
      options: [],
    },
    value: {
      defaultValue: '',
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <TextFilter {...args} onChange={setValue} />;
  },
};

export const Contains: Story = {
  args: {
    field: {
      name: 'description',
      label: 'Description',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.CONTAINS,
      options: [],
    },
    value: {
      defaultValue: 'search term',
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <TextFilter {...args} onChange={setValue} />;
  },
};

export const StartsWith: Story = {
  args: {
    field: {
      name: 'title',
      label: 'Title',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.STARTS_WITH,
      options: [],
    },
    value: {
      defaultValue: 'prefix',
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <TextFilter {...args} onChange={setValue} />;
  },
};

export const EndsWith: Story = {
  args: {
    field: {
      name: 'filename',
      label: 'Filename',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.ENDS_WITH,
      options: [],
    },
    value: {
      defaultValue: '.txt',
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <TextFilter {...args} onChange={setValue} />;
  },
};

export const InOperator: Story = {
  args: {
    field: {
      name: 'tags',
      label: 'Tags',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.IN,
      options: [],
    },
    value: {
      defaultValue: ['react', 'typescript', 'storybook'],
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <TextFilter {...args} onChange={setValue} />;
  },
};

export const NotInOperator: Story = {
  args: {
    field: {
      name: 'categories',
      label: 'Categories',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.NOT_IN,
      options: [],
    },
    value: {
      defaultValue: ['deprecated', 'legacy'],
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <TextFilter {...args} onChange={setValue} />;
  },
};

export const WithPlaceholder: Story = {
  args: {
    field: {
      name: 'search',
      label: 'Search',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.CONTAINS,
      options: [],
    },
    value: {
      defaultValue: '',
      placeholder: 'Enter search term...',
    },
  },
  render: args => {
    const [, setValue] = useState<any>();
    return <TextFilter {...args} onChange={setValue} />;
  },
};

export const WithChangeHandler: Story = {
  args: {
    field: {
      name: 'content',
      label: 'Content',
      type: 'string',
    },
    operator: {
      defaultValue: Operator.EQ,
      options: [],
    },
    value: {
      defaultValue: '',
    },
  },
  render: args => {
    const [value, setValue] = useState<any>();
    return (
      <div>
        <TextFilter {...args} onChange={setValue} />
        <p style={{ marginTop: 16, fontSize: '14px', color: '#666' }}>
          Current filter: {JSON.stringify(value, null, 2)}
        </p>
      </div>
    );
  },
};
