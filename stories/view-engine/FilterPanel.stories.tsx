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

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within, waitFor } from 'storybook/test';
import {
  filter,
  FilterOperator,
  DeletionState,
  type FilterExpression,
} from '@ahoo-wang/fetcher-wow';
import {
  compileFilterDraft,
  FILTER_OPERATORS,
  newFilterDraft,
  type FilterFieldDefinition,
  type FilterMode,
} from '@ahoo-wang/fetcher-view-engine';
import {
  FilterPanel,
  FilterSelect,
  FilterSearchSelect,
  InputGroupButton,
  type FilterEditorProps,
  type FilterComponentProps,
  type FilterExtensions,
} from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

interface DemoArgs {
  appearance: 'light' | 'dark';
  disabled: boolean;
}
const fields: FilterFieldDefinition[] = [
  {
    field: 'status',
    label: '订单状态',
    group: '订单信息',
    type: 'string',
    options: [
      { value: 'pending', label: '待处理' },
      { value: 'paid', label: '已支付' },
      { value: 'closed', label: '已关闭' },
    ],
  },
  { field: 'amount', label: '订单金额', type: 'number', group: '订单信息' },
  { field: 'customer', label: '客户', type: 'string', group: '客户信息' },
  { field: 'priority', label: '优先处理', type: 'boolean', group: '订单信息' },
  {
    field: 'createdAt',
    label: '创建时间',
    group: '时间',
    type: 'datetime',
    timeZone: 'Asia/Shanghai',
  },
  {
    field: 'items',
    label: '商品明细',
    type: 'array',
    fields: [
      { field: 'sku', label: '商品编码', type: 'string' },
      { field: 'quantity', label: '数量', type: 'number' },
    ],
  },
];
const businessFilter = filter.and([
  filter.eq('status', 'pending'),
  filter.gte('amount', 1000),
]);
const nestedFilter = filter.and([
  filter.or([filter.eq('status', 'pending'), filter.eq('priority', true)]),
  filter.nor([filter.eq('status', 'closed')]),
  filter.elementMatch(
    'items',
    filter.and([filter.startsWith('sku', 'SKU-'), filter.gte('quantity', 2)]),
  ),
]);

function Scenario({
  appearance,
  disabled,
  initial = businessFilter,
  definitions = fields,
  extensions,
  mode,
  initialError,
}: DemoArgs & {
  initial?: FilterExpression;
  definitions?: readonly FilterFieldDefinition[];
  extensions?: FilterExtensions;
  mode?: FilterMode;
  initialError?: string;
}) {
  const [value, setValue] = useState(initial);
  const [calls, setCalls] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError);
  return (
    <main
      className="fve-root"
      data-theme={appearance}
      style={{
        padding: 24,
        boxSizing: 'border-box',
        maxWidth: 1000,
        background: 'var(--fve-background)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <FilterPanel
        value={value}
        fields={definitions}
        mode={mode}
        extensions={extensions}
        disabled={disabled}
        queryError={error}
        onPendingChange={setPending}
        onApply={next => {
          setValue(next);
          setCalls(count => count + 1);
          setError(undefined);
        }}
      />
      <div aria-label="宿主状态">
        已应用 {calls} 次 · {pending ? '筛选有待查询修改' : '筛选已同步'}
      </div>
      <details>
        <summary>查看已应用的 Wow 查询条件</summary>
        <pre
          data-testid="applied-filter"
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          {JSON.stringify(value, null, 2)}
        </pre>
      </details>
    </main>
  );
}

function CustomerEditor({
  node,
  field,
  onChange,
  onValidityChange,
  disabled,
}: FilterEditorProps) {
  const [unavailable, setUnavailable] = useState(false);
  const selected =
    node?.op === FilterOperator.IN &&
    node.values.join(',') === 'customer-1,customer-2'
      ? 'vip'
      : null;
  return (
    <>
      <FilterSelect
        label="客户分组"
        placeholder="不限客户"
        value={selected}
        options={[{ value: 'vip', label: '重点客户' }]}
        disabled={disabled || unavailable}
        onClear={() => onChange(undefined)}
        onValueChange={() =>
          onChange(filter.isIn(field!.field, ['customer-1', 'customer-2']))
        }
        inline
      />
      <InputGroupButton
        disabled={disabled}
        onClick={() => {
          const next = !unavailable;
          setUnavailable(next);
          onValidityChange(
            !next,
            next ? '候选加载失败，请恢复后重试。' : undefined,
          );
        }}
      >
        {unavailable ? '恢复候选' : '模拟候选失败'}
      </InputGroupButton>
    </>
  );
}
const customFields = fields.map(field =>
  field.field === 'customer'
    ? { ...field, editor: { name: 'customer-groups' } }
    : field,
);
const customExtensions: FilterExtensions = {
  filters: {
    'customer-groups': { component: CustomerEditor, modes: ['simple'] },
  },
};
const customers = [
  { value: 'customer-1', label: '远山科技' },
  { value: 'customer-2', label: '晨星零售' },
  { value: 'customer-3', label: '云杉制造' },
  { value: 'customer-4', label: '海川物流' },
  { value: 'customer-5', label: '云海商贸（停用）', disabled: true },
];
function SearchableCustomerEditor({
  node,
  field,
  disabled,
  onChange,
}: FilterEditorProps) {
  return (
    <FilterSearchSelect
      label="客户选择"
      placeholder="选择客户"
      searchPlaceholder="输入客户名称"
      options={customers}
      value={
        node?.op === FilterOperator.EQ && typeof node.value === 'string'
          ? node.value
          : null
      }
      onValueChange={id => onChange(filter.eq(field!.field, id))}
      onClear={() => onChange(undefined)}
      disabled={disabled}
      inline
    />
  );
}
const searchableFields: FilterFieldDefinition[] = [
  {
    field: 'customer',
    label: '客户',
    type: 'string',
    operators: [FilterOperator.EQ],
    editor: { name: 'customer-search' },
  },
];
const searchableExtensions: FilterExtensions = {
  filters: {
    'customer-search': {
      component: SearchableCustomerEditor,
      modes: ['simple', 'advanced'],
      supports: node =>
        node === undefined ||
        (node.op === FilterOperator.EQ &&
          customers.some(customer => customer.value === node.value)),
    },
  },
};
function CompleteCustomerFilter({
  node,
  field,
  disabled,
  onChange,
  onClear,
  onRemove,
  errorId,
}: FilterComponentProps) {
  return (
    <div
      role="group"
      aria-label="自定义客户筛选器"
      aria-describedby={errorId}
      className="fve:flex fve:w-full fve:flex-wrap fve:items-center fve:gap-2 fve:rounded-lg fve:border fve:border-input fve:p-2"
    >
      <strong>客户范围</strong>
      <FilterSearchSelect
        label="客户选择"
        placeholder="不限客户"
        options={customers}
        value={
          node?.op === FilterOperator.EQ && typeof node.value === 'string'
            ? node.value
            : null
        }
        onValueChange={id => onChange(filter.eq(field!.field, id))}
        onClear={onClear}
        disabled={disabled}
        inline
      />
      <InputGroupButton onClick={onRemove} disabled={disabled}>
        移除此筛选
      </InputGroupButton>
    </div>
  );
}
const completeExtensions: FilterExtensions = {
  filters: {
    'customer-search': {
      ...searchableExtensions.filters!['customer-search'],
      render: 'filter',
      component: CompleteCustomerFilter,
    },
  },
};
const galleryFields: FilterFieldDefinition[] = [
  {
    field: 'data',
    label: '示例字段',
    fields: [{ field: 'quantity', label: '元素数量', type: 'number' }],
  },
];
function example(op: FilterOperator): FilterExpression {
  const descriptor = FILTER_OPERATORS[op];
  const draft = newFilterDraft(
    op,
    descriptor.category === 'field' || descriptor.category === 'element'
      ? 'data'
      : undefined,
  );
  switch (descriptor.input) {
    case 'value':
      draft.value =
        descriptor.category === 'root' ||
        [
          FilterOperator.CONTAINS,
          FilterOperator.STARTS_WITH,
          FilterOperator.ENDS_WITH,
        ].includes(op)
          ? '示例'
          : 0;
      break;
    case 'values':
      draft.values =
        descriptor.category === 'root' ? ['id-1', 'id-2'] : [0, false, '示例'];
      break;
    case 'between':
      draft.lowerBound = 0;
      draft.upperBound = 10;
      break;
    case 'search':
      draft.query = '示例';
      draft.fields = ['data'];
      break;
    case 'deletion':
      draft.state = DeletionState.ACTIVE;
      break;
    case 'time':
      draft.time = '09:30:45.123456789';
      break;
    case 'days':
      draft.days = 7;
      break;
  }
  if (descriptor.category === 'logical')
    draft.operands = [
      { ...newFilterDraft(FilterOperator.EQ, 'data'), value: '示例' },
    ];
  if (descriptor.category === 'element')
    draft.predicate = {
      ...newFilterDraft(FilterOperator.GTE, 'quantity'),
      value: 1,
    };
  const result = compileFilterDraft(draft, galleryFields);
  if (!result.expression)
    throw new Error(result.errors.map(error => error.message).join('；'));
  return result.expression;
}
function OperatorGallery(args: DemoArgs) {
  const [op, setOp] = useState(FilterOperator.EQ);
  return (
    <div className="fve-root" data-theme={args.appearance}>
      <FilterSelect
        label="协议操作"
        value={op}
        options={Object.values(FilterOperator).map(op => ({
          value: op,
          label: `${op} · ${FILTER_OPERATORS[op].label}`,
        }))}
        onValueChange={setOp}
      />
      <Scenario
        key={op}
        {...args}
        initial={example(op)}
        definitions={galleryFields}
        mode="advanced"
      />
    </div>
  );
}

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
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const add = canvas.getByRole('button', { name: '添加筛选' });
    await userEvent.click(add);
    let picker = within(
      await page.findByRole('dialog', { name: '选择筛选字段' }),
    );
    for (const group of ['订单信息', '客户信息', '时间', '其他字段'])
      await expect(picker.getByText(group, { exact: true })).toBeVisible();
    for (const label of ['订单状态', '订单金额'])
      await expect(picker.getByRole('checkbox', { name: label })).toBeChecked();
    await userEvent.click(picker.getByText('客户', { exact: true }));
    const customer = picker.getByRole('checkbox', { name: '客户' });
    await expect(customer).toBeChecked();
    await expect(customer).toHaveFocus();
    await expect(canvas.getByRole('textbox', { name: '客户值' })).toBeVisible();
    await userEvent.keyboard(' ');
    await expect(customer).not.toBeChecked();
    await expect(canvas.queryByRole('textbox', { name: '客户值' })).toBeNull();
    await userEvent.keyboard(' ');
    await expect(customer).toBeChecked();
    await userEvent.click(picker.getByRole('checkbox', { name: '优先处理' }));
    await expect(
      picker.getByRole('checkbox', { name: '优先处理' }),
    ).toBeChecked();
    await expect(
      canvas.getAllByRole('textbox', { name: '客户值' }),
    ).toHaveLength(1);
    await userEvent.click(picker.getByRole('button', { name: '完成' }));
    await waitFor(() =>
      expect(page.queryByRole('dialog', { name: '选择筛选字段' })).toBeNull(),
    );
    await userEvent.click(canvas.getByRole('button', { name: '删除客户条件' }));
    await userEvent.click(add);
    picker = within(await page.findByRole('dialog', { name: '选择筛选字段' }));
    await expect(
      picker.getByRole('checkbox', { name: '客户' }),
    ).not.toBeChecked();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(page.queryByRole('dialog', { name: '选择筛选字段' })).toBeNull(),
    );
    await expect(add).toHaveFocus();
    await expect(canvas.getByLabelText('宿主状态')).toHaveTextContent(
      '已应用 0 次',
    );
  },
};

export const BusinessFilters: Story = {
  name: '业务筛选 · 手动查询',
  render: args => <Scenario {...args} />,
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement);
    await expect(
      canvas.queryAllByRole('button', {
        name: /条件操作|移动.*条件|订单金额值选项/,
      }),
    ).toHaveLength(0);
    await expect(
      canvas.queryByRole('button', { name: '清空订单金额值' }),
    ).toBeNull();
    await userEvent.clear(canvas.getByLabelText('订单金额值'));
    await expect(canvas.getByLabelText('订单金额值')).toHaveValue('');
    await userEvent.clear(canvas.getByLabelText('订单金额值'));
    await userEvent.type(canvas.getByLabelText('订单金额值'), '1500');
    await expect(canvas.getByLabelText('宿主状态')).toHaveTextContent(
      '已应用 0 次',
    );
    await expect(
      canvas.getByText('待查询', { exact: true }),
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await expect(canvas.getByTestId('applied-filter')).toHaveTextContent(
      '1500',
    );
    await userEvent.click(canvas.getByRole('button', { name: '清空条件' }));
    await expect(canvas.getByLabelText('宿主状态')).toHaveTextContent(
      '已应用 1 次',
    );
    await userEvent.click(canvas.getByRole('button', { name: '撤销筛选修改' }));
    await expect(canvas.getByLabelText('订单金额值')).toHaveValue('1500');
  },
};
export const AdvancedTree: Story = {
  name: '高级 · 逻辑与同一元素',
  render: args => <Scenario {...args} initial={nestedFilter} />,
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement);
    await expect(
      canvas.queryAllByRole('button', { name: /移动.*条件/ }),
    ).toHaveLength(0);
    await expect(canvas.getByLabelText('数量值')).toHaveValue('2');
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await expect(canvas.getByTestId('applied-filter')).toHaveTextContent(
      'ELEMENT_MATCH',
    );
    await expect(canvas.getByTestId('applied-filter')).toHaveTextContent('NOR');
  },
};
export const LogicalGroupMenu: Story = {
  name: '高级 · 独立添加逻辑分组',
  render: args => (
    <Scenario {...args} initial={filter.matchAll()} mode="advanced" />
  ),
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const add = canvas.getByRole('button', { name: '添加筛选' });
    const group = canvas.getByRole('button', { name: '添加逻辑分组' });
    const buttons = canvas.getByRole('group', { name: '添加筛选' });
    await expect(within(buttons).getAllByRole('button')).toHaveLength(2);
    await expect(group.getBoundingClientRect().left).toBeCloseTo(
      add.getBoundingClientRect().right,
      0,
    );
    await expect(getComputedStyle(add).borderTopRightRadius).toBe('0px');
    await expect(getComputedStyle(group).borderTopLeftRadius).toBe('0px');
    await expect(getComputedStyle(group).borderLeftWidth).toBe('0px');
    await userEvent.click(add);
    let picker = within(
      await page.findByRole('dialog', { name: '选择筛选字段' }),
    );
    await expect(picker.queryByText('组合条件')).toBeNull();
    await expect(
      picker.queryByRole('button', {
        name: /满足全部条件|满足任一条件|全部条件均不满足/,
      }),
    ).toBeNull();
    await userEvent.click(group);
    await waitFor(() =>
      expect(page.queryByRole('dialog', { name: '选择筛选字段' })).toBeNull(),
    );
    await expect(
      await page.findByRole('menuitem', { name: /^AND/ }),
    ).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^NOR/ })).toBeVisible();
    await userEvent.click(page.getByRole('menuitem', { name: /^OR/ }));
    await waitFor(() => expect(group).toHaveFocus());
    await userEvent.click(add);
    picker = within(await page.findByRole('dialog', { name: '选择筛选字段' }));
    await userEvent.click(picker.getByRole('checkbox', { name: '订单状态' }));
    await userEvent.click(picker.getByRole('checkbox', { name: '订单金额' }));
    await userEvent.click(picker.getByRole('button', { name: '完成' }));
    await waitFor(() => expect(page.queryByRole('dialog')).toBeNull());
    await userEvent.click(canvas.getByRole('combobox', { name: '订单状态值' }));
    await userEvent.click(await page.findByRole('option', { name: '待处理' }));
    await userEvent.type(
      canvas.getByRole('textbox', { name: '订单金额值' }),
      '1000',
    );
    await expect(canvas.getByLabelText('宿主状态')).toHaveTextContent(
      '已应用 0 次',
    );
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await expect(canvas.getByTestId('applied-filter')).toHaveTextContent(
      '"op": "OR"',
    );
    await expect(canvas.getByLabelText('宿主状态')).toHaveTextContent(
      '已应用 1 次',
    );
  },
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
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '模拟候选失败' }));
    await expect(canvas.getByRole('button', { name: '查询' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: '恢复候选' }));
    await expect(canvas.getByRole('button', { name: '查询' })).toBeEnabled();
  },
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
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('combobox', { name: '客户选择' }));
    const search = await page.findByRole('combobox', { name: '客户选择搜索' });
    await userEvent.type(search, '云杉');
    await expect(
      page.getByRole('option', { name: '云杉制造' }),
    ).toBeInTheDocument();
    await expect(
      page.queryByRole('option', { name: '远山科技' }),
    ).not.toBeInTheDocument();
    await expect(canvas.getByLabelText('宿主状态')).toHaveTextContent(
      '已应用 0 次',
    );
    await expect(canvas.getByTestId('applied-filter')).toHaveTextContent(
      'customer-1',
    );
    await userEvent.clear(search);
    await userEvent.type(search, '无匹配客户');
    await expect(page.getByText('没有匹配选项')).toBeInTheDocument();
    await userEvent.clear(search);
    await userEvent.type(search, '云杉');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(
      canvas.getByRole('combobox', { name: '客户选择' }),
    ).toHaveTextContent('云杉制造');
    await expect(canvas.getByLabelText('宿主状态')).toHaveTextContent(
      '已应用 0 次',
    );
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await expect(canvas.getByTestId('applied-filter')).toHaveTextContent(
      'customer-3',
    );
    await userEvent.click(canvas.getByRole('button', { name: '清空客户选择' }));
    await expect(
      canvas.getByRole('combobox', { name: '客户选择' }),
    ).toHaveTextContent('选择客户');
    await expect(canvas.getByLabelText('宿主状态')).toHaveTextContent(
      '已应用 1 次',
    );
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await expect(canvas.getByTestId('applied-filter')).toHaveTextContent(
      'MATCH_ALL',
    );
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
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('group', { name: '自定义客户筛选器' }),
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole('group', { name: '客户筛选' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole('button', { name: '删除客户条件' }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: '清空客户选择' }));
    await expect(canvas.getByLabelText('宿主状态')).toHaveTextContent(
      '已应用 0 次',
    );
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await expect(canvas.getByTestId('applied-filter')).toHaveTextContent(
      'MATCH_ALL',
    );
    await userEvent.click(canvas.getByRole('button', { name: '移除此筛选' }));
    await expect(
      canvas.queryByRole('group', { name: '自定义客户筛选器' }),
    ).not.toBeInTheDocument();
    await expect(canvas.getByLabelText('宿主状态')).toHaveTextContent(
      '已应用 1 次',
    );
    await userEvent.click(canvas.getByRole('button', { name: '撤销筛选修改' }));
    await expect(
      canvas.getByRole('group', { name: '自定义客户筛选器' }),
    ).toBeInTheDocument();
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
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement);
    const time = canvas.getByRole('textbox', { name: '创建时间时间' });
    await expect(time).toHaveValue('01:30:00');
    await userEvent.clear(time);
    await userEvent.type(time, '01:30:00.000');
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await expect(canvas.getByTestId('applied-filter')).toHaveTextContent(
      '1793514600000',
    );
  },
};
export const AllOperators: Story = {
  name: '全部 50 种操作',
  render: args => <OperatorGallery {...args} />,
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    for (const op of [
      FilterOperator.SEARCH,
      FilterOperator.ELEMENT_MATCH,
      FilterOperator.BETWEEN,
      FilterOperator.NEXT_YEAR,
      FilterOperator.DELETION,
      FilterOperator.IDS,
    ]) {
      await userEvent.click(canvas.getByRole('combobox', { name: '协议操作' }));
      await userEvent.click(
        await page.findByRole('option', {
          name: `${op} · ${FILTER_OPERATORS[op].label}`,
        }),
      );
      await expect(canvas.getByRole('button', { name: '查询' })).toBeEnabled();
      await userEvent.click(canvas.getByRole('button', { name: '查询' }));
      await expect(canvas.getByTestId('applied-filter')).toHaveTextContent(op);
    }
  },
};
