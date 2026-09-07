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

import '@ahoo-wang/fetcher-view-engine/styles.css';
import { filter } from '@ahoo-wang/fetcher-wow';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  completeExtensions,
  customExtensions,
  customFields,
  searchableExtensions,
  searchableFields,
} from './FilterCustomEditors.js';
import { OperatorGallery } from './FilterOperatorGallery.js';
import {
  nestedFilter,
  Scenario,
  type DemoArgs,
} from './FilterPanelExamples.js';
import {
  playCompleteFilter,
  playCustomEditor,
  playSearchableSelect,
} from './filterPanelExtensions.play.js';
import {
  playAdvancedTree,
  playAllOperators,
  playBusinessFilters,
  playSavedDateTime,
} from './filterPanelQuery.play.js';
import {
  playGroupedFields,
  playLogicalGroupMenu,
  playRepeatedFields,
} from './filterPanelSelection.play.js';

const meta = {
  title: 'View Engine/Filter Panel',
  args: { appearance: 'light', disabled: false },
  argTypes: {
    appearance: { control: 'inline-radio', options: ['light', 'dark'] },
    disabled: { control: 'boolean' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '完整 FilterPanel。宿主接收 onApply 后执行查询；此处只记录条件与调用次数。字段元数据、编辑器扩展与查询错误均通过 props 注入。',
      },
    },
  },
} satisfies Meta<DemoArgs>;
export default meta;
type Story = StoryObj<DemoArgs>;

export const GroupedFields: Story = {
  name: '添加筛选 · 分组复选与连续选择',
  render: args => <Scenario {...args} />,
  play: playGroupedFields,
};

export const BusinessFilters: Story = {
  name: '业务筛选 · 手动查询',
  render: args => <Scenario {...args} />,
  play: playBusinessFilters,
};
export const AdvancedTree: Story = {
  name: '高级 · 逻辑与同一元素',
  render: args => <Scenario {...args} initial={nestedFilter} />,
  play: playAdvancedTree,
};
export const LogicalGroupMenu: Story = {
  name: '高级 · 独立添加逻辑分组',
  render: args => (
    <Scenario {...args} initial={filter.matchAll()} mode="advanced" />
  ),
  play: playLogicalGroupMenu,
};
export const RepeatedFields: Story = {
  name: '高级 · 同一字段多条规则',
  render: args => (
    <Scenario
      {...args}
      initial={filter.and([
        filter.startsWith('customer', '上海'),
        filter.contains('customer', '科技'),
      ])}
    />
  ),
  play: playRepeatedFields,
};

export const CustomEditor: Story = {
  name: '自定义筛选器 · 无效状态保护',
  render: args => (
    <Scenario
      {...args}
      definitions={customFields}
      extensions={customExtensions}
      initial={filter.isIn('customer', ['customer-1', 'customer-2'])}
    />
  ),
  play: playCustomEditor,
};
export const Empty: Story = {
  name: '未设置值 · 从空条件开始',
  render: args => <Scenario {...args} initial={filter.matchAll()} />,
};
export const SearchableSelect: Story = {
  name: '自定义筛选器 · 内置搜索 Select',
  render: args => (
    <Scenario
      {...args}
      definitions={searchableFields}
      extensions={searchableExtensions}
      initial={filter.eq('customer', 'customer-1')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          '通过 extensions.filters 注册客户选择器。下拉内使用 Base UI Combobox 的内置搜索，搜索词只过滤候选，选中后输出 EQ；点击查询才应用条件。',
      },
    },
  },
  play: playSearchableSelect,
};
export const CompleteFilter: Story = {
  name: '完整自定义筛选器 · 组件契约',
  render: args => (
    <Scenario
      {...args}
      definitions={searchableFields}
      extensions={completeExtensions}
      initial={filter.eq('customer', 'customer-1')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'render: filter 接管整个非容器筛选器的布局、标签、值和移除操作。这个组件只通过契约回调编辑草稿；字段绑定、校验、错误展示与查询继续由面板管理。',
      },
    },
  },
  play: playCompleteFilter,
};
export const QueryError: Story = {
  name: '查询失败 · 保留条件重试',
  render: args => <Scenario {...args} initialError="查询失败，请重试。" />,
};
export const Dark: Story = {
  name: '深色 · 业务筛选',
  args: { appearance: 'dark' },
  render: args => <Scenario {...args} />,
};
export const SavedDateTime: Story = {
  name: '日期时间 · 保留已存时刻',
  render: args => (
    <Scenario
      {...args}
      initial={filter.eq('createdAt', Date.parse('2026-11-01T06:30:00Z'))}
      definitions={[
        {
          field: 'createdAt',
          label: '创建时间',
          type: 'datetime',
          timeZone: 'America/New_York',
        },
      ]}
    />
  ),
  play: playSavedDateTime,
};
export const AllOperators: Story = {
  name: '全部 50 种操作',
  render: args => <OperatorGallery {...args} />,
  play: playAllOperators,
};
