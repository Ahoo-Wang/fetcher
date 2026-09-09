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
import { filter, FilterOperator } from '@ahoo-wang/fetcher-wow';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  completeExtensions,
  customExtensions,
  customFields,
  searchableFields,
} from './FilterCustomEditors.js';
import { OperatorGallery } from './FilterOperatorGallery.js';
import {
  nestedFilter,
  Scenario,
  type DemoArgs,
} from './FilterPanelExamples.js';

const meta = {
  title: 'View Engine/过滤器',
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
          'FilterPanel 管理草稿、校验和显式查询。输入只改变草稿；Enter/查询触发 onApply，由宿主执行记录查询。本页输出条件与调用次数，不连接业务服务。\n\n“添加筛选”使用分组 Checkbox 弹层，支持连续选择且不撑开页面；高级模式通过独立按钮菜单添加 AND/OR/NOR，允许同字段多条规则。自定义组件在 extensions.filters 一次提供 component、compile、modes、clear；保存原始 props，保留未设置控件和本地展示属性。\n\n建议依次验证：手动查询 → 高级嵌套 → 无效状态保护 → 错误重试 → 深色/禁用状态。',
      },
    },
  },
} satisfies Meta<DemoArgs>;

export default meta;

type Story = StoryObj<DemoArgs>;

export const GroupedFields: Story = {
  name: '添加筛选 · 分组复选与连续选择',
  render: args => <Scenario {...args} />,
};

export const BusinessFilters: Story = {
  name: '业务筛选 · 手动查询',
  render: args => <Scenario {...args} />,
};

export const AdvancedTree: Story = {
  name: '高级 · 逻辑与同一元素',
  render: args => <Scenario {...args} initial={nestedFilter} />,
};

export const LogicalGroupMenu: Story = {
  name: '高级 · 独立添加逻辑分组',
  render: args => (
    <Scenario {...args} initial={filter.matchAll()} mode="advanced" />
  ),
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
};

export const CustomEditor: Story = {
  name: '自定义筛选器 · 无效状态保护',
  render: args => (
    <Scenario
      {...args}
      definitions={customFields}
      extensions={customExtensions}
      initial={filter.isIn('customer', ['customer-1', 'customer-2'])}
      initialDraft={{
        id: 'customer-groups',
        op: FilterOperator.IN,
        field: 'customer',
        editor: { name: 'customer-groups' },
        props: { values: ['customer-1', 'customer-2'] },
      }}
    />
  ),
};

export const Empty: Story = {
  name: '未设置值 · 从空条件开始',
  render: args => <Scenario {...args} initial={filter.matchAll()} />,
};

export const SearchableSelect: Story = {
  name: '内置筛选器 · 搜索 Select',
  render: args => (
    <Scenario
      {...args}
      definitions={searchableFields}
      initial={filter.eq('customer', 'customer-1')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          '字段直接配置 editor.name: select 和 options，无需注册组件。内置搜索只过滤候选，选中后保存组件属性，点击查询才应用条件。',
      },
    },
  },
};

export const CompleteFilter: Story = {
  name: '完整自定义筛选器 · 组件契约',
  render: args => (
    <Scenario
      {...args}
      definitions={searchableFields}
      extensions={completeExtensions}
      initial={filter.eq('customer', 'customer-1')}
      initialDraft={{
        id: 'customer-search',
        op: FilterOperator.EQ,
        field: 'customer',
        editor: { name: 'customer-search' },
        props: { value: 'customer-1' },
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'render: filter 接管整个非容器筛选器的布局、标签、值和移除操作。组件通过 onChange(props) 更新可保存属性，同一注册中的 compile 生成条件；字段绑定、组合校验、错误展示与查询由面板管理。',
      },
    },
  },
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
      timeZone="America/New_York"
      definitions={[
        {
          field: 'createdAt',
          label: '创建时间',
          type: 'datetime',
          editor: { name: 'builtin', options: { showTime: true } },
        },
      ]}
    />
  ),
};

export const AllOperators: Story = {
  name: '全部 50 种操作',
  render: args => <OperatorGallery {...args} />,
};
