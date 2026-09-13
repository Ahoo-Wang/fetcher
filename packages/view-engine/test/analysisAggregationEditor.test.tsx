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

import type {
  AnalysisViewConfig,
  AnalysisHavingExpression,
  AnalysisDerivedExpression,
  AnalysisComponentConfig,
  AnalysisCompileContext,
} from '../src/analysis/analysisModel.js';

import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  AggregationExpressionType as E,
  HavingExpressionType as H,
  ComparisonOperator as C,
  DerivedExpressionType as D,
  AggregationExpressionOperator as O,
} from '@ahoo-wang/fetcher-wow';
import { AnalysisHavingEditor } from '../src/analysis/AnalysisHavingEditor.js';
import { AnalysisDerivedExpressionEditor } from '../src/analysis/AnalysisDerivedExpressionEditor.js';
import { AnalysisMetricEditor } from '../src/analysis/AnalysisMetricEditor.js';
const metrics = [
  {
    id: 'count',
    alias: 'orders',
    title: '订单数',
    component: { name: 'count' },
    props: {},
  },
];
afterEach(cleanup);
it('retains an incomplete having number', () => {
  const change = vi.fn();
  render(
    <AnalysisHavingEditor
      value={{
        id: 'h1',
        type: H.CONDITION,
        metricId: 'count',
        operator: C.GTE,
        value: 100,
      }}
      metrics={metrics}
      onChange={change}
    />,
  );
  fireEvent.change(screen.getByLabelText('结果筛选 h1 数值'), {
    target: { value: '' },
  });
  expect(change).toHaveBeenLastCalledWith(
    expect.objectContaining({ value: '' }),
  );
});
it('removes the having root without silently choosing a new metric', () => {
  const change = vi.fn();
  render(
    <AnalysisHavingEditor
      value={{ id: 'h1', type: H.IS_NULL, metricId: 'missing' }}
      metrics={metrics}
      onChange={change}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '删除结果筛选 h1' }));
  expect(change).toHaveBeenCalledWith(undefined);
});
it('retains derived constants without evaluation', () => {
  const change = vi.fn();
  render(
    <AnalysisDerivedExpressionEditor
      label="支付率"
      value={{
        type: D.BINARY,
        operator: O.DIVIDE,
        left: { type: D.METRIC_REF, metricId: 'count' },
        right: { type: D.CONSTANT, value: 2 },
      }}
      metrics={metrics}
      onChange={change}
    />,
  );
  fireEvent.change(screen.getByLabelText('支付率 右侧 常量'), {
    target: { value: '' },
  });
  expect(change).toHaveBeenCalledWith(
    expect.objectContaining({ right: { type: D.CONSTANT, value: '' } }),
  );
});
it('does not change disabled result filters', () => {
  const change = vi.fn();
  render(
    <AnalysisHavingEditor
      disabled
      value={{
        id: 'h1',
        type: H.CONDITION,
        metricId: 'count',
        operator: C.GTE,
        value: 100,
      }}
      metrics={metrics}
      onChange={change}
    />,
  );
  fireEvent.change(screen.getByLabelText('结果筛选 h1 数值'), {
    target: { value: '3' },
  });
  expect(change).not.toHaveBeenCalled();
});
it('offers percentile shortcuts without converting incomplete input to zero', () => {
  const change = vi.fn();
  render(
    <AnalysisMetricEditor
      label="指标 1"
      value={{
        ...metrics[0],
        component: { name: 'percentile' },
        field: 'amount',
        props: { percentile: 95 },
      }}
      previousMetrics={[]}
      context={{
        fields: [{ field: 'amount', label: '金额', type: 'number' }],
        capability: {
          count: true,
          features: { percentile: true },
          fields: [
            { field: 'amount', groups: [], functions: [], percentile: true },
          ],
        },
      }}
      onChange={change}
    />,
  );
  fireEvent.change(screen.getByLabelText('指标 1 百分位'), {
    target: { value: '' },
  });
  expect(change).toHaveBeenLastCalledWith(
    expect.objectContaining({ props: { percentile: '' } }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'P50' }));
  expect(change).toHaveBeenLastCalledWith(
    expect.objectContaining({ props: { percentile: 50 } }),
  );
});

async function choose(label: string, option: string) {
  fireEvent.click(screen.getByRole('combobox', { name: label }));
  const node = await screen.findByRole('option', { name: option, exact: true });
  fireEvent.pointerDown(node, { pointerType: 'mouse' });
  fireEvent.click(node);
}
it('edits every having predicate without changing its metric identity', async () => {
  const change = vi.fn();
  let value: AnalysisHavingExpression = {
    id: 'h1',
    type: H.CONDITION,
    metricId: 'count',
    operator: C.GTE,
    value: 100,
  };
  const props = {
    metrics,
    onChange: (next: typeof value | undefined) => {
      if (next) value = next;
      change(next);
    },
  };
  const view = render(<AnalysisHavingEditor {...props} value={value} />);
  const refresh = () =>
    view.rerender(<AnalysisHavingEditor {...props} value={value} />);
  await choose('结果筛选 h1 指标', '订单数');
  refresh();
  await choose('结果筛选 h1 比较符', '小于');
  refresh();
  expect(value).toMatchObject({ metricId: 'count', operator: C.LT });
  await choose('结果筛选 h1 类型', '区间');
  refresh();
  fireEvent.change(screen.getByLabelText('结果筛选 h1 下界'), {
    target: { value: '1' },
  });
  refresh();
  fireEvent.change(screen.getByLabelText('结果筛选 h1 上界'), {
    target: { value: '8' },
  });
  refresh();
  expect(value).toMatchObject({ lower: '1', upper: '8', metricId: 'count' });
  await choose('结果筛选 h1 类型', '属于集合');
  refresh();
  fireEvent.change(screen.getByLabelText('结果筛选 h1 值 1'), {
    target: { value: '2' },
  });
  refresh();
  fireEvent.click(screen.getByRole('button', { name: '添加值', exact: true }));
  refresh();
  fireEvent.change(screen.getByLabelText('结果筛选 h1 值 2'), {
    target: { value: '3' },
  });
  refresh();
  fireEvent.click(screen.getByRole('button', { name: '结果筛选 h1 删除值 1' }));
  refresh();
  expect(value).toMatchObject({ values: ['3'] });
  await choose('结果筛选 h1 类型', '空值');
  refresh();
  await choose('结果筛选 h1 空值', '有值');
  refresh();
  expect(value).toMatchObject({ negated: true });
  await choose('结果筛选 h1 类型', '比较');
  refresh();
  expect(value).toMatchObject({ operator: C.GTE, value: '' });
});
it('creates and edits nested having groups and removes a child', async () => {
  let value: AnalysisHavingExpression | undefined;
  const props = {
    metrics,
    onChange: (next: typeof value) => {
      value = next;
    },
  };
  const view = render(<AnalysisHavingEditor {...props} />);
  const refresh = () =>
    view.rerender(<AnalysisHavingEditor {...props} value={value} />);
  fireEvent.click(screen.getByRole('button', { name: '添加结果筛选' }));
  refresh();
  const id = value!.id;
  await choose(`结果筛选 ${id} 类型`, '全部条件');
  refresh();
  if (!value || !('operands' in value)) throw new Error('expected group');
  const childId = value.operands[0].id;
  fireEvent.change(screen.getByLabelText(`结果筛选 ${childId} 数值`), {
    target: { value: '10' },
  });
  refresh();
  expect(value.operands[0]).toMatchObject({ value: '10' });
  fireEvent.click(
    screen.getByRole('button', { name: '添加条件', exact: true }),
  );
  refresh();
  expect(value.operands.length).toBe(2);
  fireEvent.click(
    screen.getByRole('button', { name: `删除结果筛选 ${childId}` }),
  );
  refresh();
  expect(value.operands.length).toBe(1);
  await choose(`结果筛选 ${id} 类型`, '任一条件');
  refresh();
  expect(value.type).toBe(H.OR);
});
it('edits derived leaves and both operands while preserving IDs', async () => {
  let value: AnalysisDerivedExpression = { type: D.CONSTANT, value: '' };
  const props = {
    metrics,
    label: '公式',
    onChange: (next: typeof value) => {
      value = next;
    },
  };
  const view = render(
    <AnalysisDerivedExpressionEditor {...props} value={value} />,
  );
  const refresh = () =>
    view.rerender(<AnalysisDerivedExpressionEditor {...props} value={value} />);
  await choose('公式 类型', '指标');
  refresh();
  await choose('公式 指标', '订单数');
  refresh();
  expect(value).toEqual({ type: D.METRIC_REF, metricId: 'count' });
  await choose('公式 类型', '运算');
  refresh();
  await choose('公式 运算符', '乘 ×');
  refresh();
  await choose('公式 左侧 类型', '常量');
  refresh();
  fireEvent.change(screen.getByLabelText('公式 左侧 常量'), {
    target: { value: '2' },
  });
  refresh();
  fireEvent.change(screen.getByLabelText('公式 右侧 常量'), {
    target: { value: '4' },
  });
  refresh();
  expect(value).toMatchObject({
    operator: O.MULTIPLY,
    left: { type: D.CONSTANT, value: '2' },
    right: { type: D.CONSTANT, value: '4' },
  });
  await choose('公式 类型', '常量');
  refresh();
  expect(value).toEqual({ type: D.CONSTANT, value: '' });
});
it('repairs missing formulas and limits deep editing', () => {
  const change = vi.fn();
  const view = render(
    <AnalysisDerivedExpressionEditor
      label="公式"
      value={undefined as never}
      metrics={metrics}
      onChange={change}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '修复公式' }));
  expect(change).toHaveBeenCalledWith({ type: D.CONSTANT, value: '' });
  view.rerender(
    <AnalysisDerivedExpressionEditor
      label="公式"
      depth={9}
      value={{ type: D.CONSTANT, value: 0 }}
      metrics={metrics}
      onChange={change}
    />,
  );
  expect(screen.getByRole('alert').textContent).toMatch(/8 层/);
  view.rerender(
    <AnalysisHavingEditor depth={9} metrics={metrics} onChange={change} />,
  );
  expect(screen.getByRole('alert').textContent).toMatch(/8 层/);
});
it('updates a metric formula, display format and independent filter', async () => {
  let value: AnalysisComponentConfig = {
    ...metrics[0],
    component: { name: 'derived' },
    derivedExpression: { type: D.CONSTANT, value: 0 },
  };
  const context: AnalysisCompileContext = {
    fields: [{ field: 'amount', label: '金额', type: 'number' }],
    capability: {
      count: true,
      expressions: true,
      features: {
        metricFilters: true,
        derived: true,
        percentile: true,
        distinctCount: true,
      },
      fields: [
        {
          field: 'amount',
          groups: [],
          functions: [],
          percentile: true,
          distinctCount: true,
        },
      ],
    },
  };
  const valid = vi.fn();
  const props = {
    context,
    label: '指标 1',
    previousMetrics: metrics,
    onChange: (next: typeof value) => {
      value = next;
    },
    onFilterValidityChange: valid,
  };
  const view = render(<AnalysisMetricEditor {...props} value={value} />);
  const refresh = () =>
    view.rerender(<AnalysisMetricEditor {...props} value={value} />);
  await choose('指标 1 展示格式', '百分比');
  refresh();
  expect(value.props.displayFormat).toBe('percent');
  fireEvent.change(screen.getByLabelText('指标 1 公式 常量'), {
    target: { value: '0.25' },
  });
  refresh();
  expect(value.derivedExpression).toMatchObject({ value: '0.25' });
  value = { ...metrics[0] };
  refresh();
  fireEvent.click(screen.getByText('统计条件', { exact: true }));
  fireEvent.click(screen.getByRole('button', { name: '添加统计条件' }));
  refresh();
  expect(value.filters?.root).toMatchObject({ operator: 'MATCH_ALL' });
  fireEvent.click(screen.getByRole('button', { name: '移除统计条件' }));
  refresh();
  expect(value.filters).toBeUndefined();
  value = {
    ...metrics[0],
    component: { name: 'percentile' },
    props: { percentile: 95 },
  };
  refresh();
  await choose('指标 1 字段', '金额');
  refresh();
  expect(value.field).toBe('amount');
  await choose('指标 1 输入', '公式');
  refresh();
  expect(value.expression).toMatchObject({ type: 'FIELD', field: 'amount' });
  await choose('指标 1 公式 类型', '常量');
  refresh();
  fireEvent.change(screen.getByLabelText('指标 1 公式 常量'), {
    target: { value: '3' },
  });
  refresh();
  expect(value.expression).toMatchObject({ type: 'CONSTANT', value: '3' });
  await choose('指标 1 输入', '字段');
  refresh();
  expect(value.expression).toBeUndefined();
});

it('wires extended options through the full editor and retains filter validity', async () => {
  const { AnalysisEditor } = await import('../src/analysis/AnalysisEditor.js');
  const {
    AggregationGroupType: G,
    AggregationDateUnit: U,
    FilterOperator: Op,
  } = await import('@ahoo-wang/fetcher-wow');
  let value: AnalysisViewConfig = {
    filters: {
      mode: 'simple',
      root: {
        id: 'all',
        component: { name: 'builtin' },
        operator: Op.MATCH_ALL,
        props: {},
      },
    },
    dimensions: [
      {
        id: 'group',
        alias: 'group',
        field: 'region',
        component: { name: 'terms' },
        title: '地区',
        props: {},
      },
    ],
    metrics: [metrics[0]],
    sort: [],
    limit: 100,
    presentation: { layout: 'table', columns: [] },
  };
  const context: AnalysisCompileContext = {
    timeZone: 'UTC',
    fields: [
      { field: 'region', label: '地区', type: 'string' },
      { field: 'date', label: '日期', type: 'datetime' },
    ],
    capability: {
      count: true,
      features: {
        derived: true,
        having: true,
        metricFilters: true,
        missingKey: true,
        dense: true,
      },
      fields: [
        { field: 'region', groups: [G.TERMS], functions: [] },
        {
          field: 'date',
          groups: [G.DATE_HISTOGRAM],
          dateUnits: [U.DAY],
          functions: [],
        },
      ],
    },
  };
  const validity = vi.fn();
  const props = {
    context,
    onChange: (next: typeof value) => {
      value = next;
    },
    onFilterValidityChange: validity,
  };
  const view = render(<AnalysisEditor {...props} value={value} />);
  const refresh = () =>
    view.rerender(<AnalysisEditor {...props} value={value} />);
  fireEvent.click(screen.getByRole('button', { name: '编辑维度 1' }));
  fireEvent.change(screen.getByLabelText('维度 1 缺失值归组'), {
    target: { value: '未知' },
  });
  refresh();
  expect(value.dimensions[0].props.missingKey).toBe('未知');
  await choose('维度 1 类型', '日期分桶');
  refresh();
  await choose('维度 1 字段', '日期');
  refresh();
  await choose('维度 1 时间粒度', '日');
  refresh();
  fireEvent.click(screen.getByRole('checkbox', { name: '维度 1 补齐日期' }));
  refresh();
  expect(value.dimensions[0].props.dense).toBe(true);
  fireEvent.click(
    screen.getByRole('button', { name: '完成编辑', exact: true }),
  );
  fireEvent.click(screen.getByRole('button', { name: '编辑指标 1' }));
  fireEvent.click(screen.getByText('统计条件', { exact: true }));
  fireEvent.click(screen.getByRole('button', { name: '添加统计条件' }));
  refresh();
  expect(value.metrics[0].filters).toBeDefined();
  expect(validity).toHaveBeenCalledWith(true);
  await choose('指标 1 类型', '指标公式');
  refresh();
  fireEvent.change(screen.getByLabelText('指标 1 公式 常量'), {
    target: { value: '0.5' },
  });
  refresh();
  expect(value.metrics[0].derivedExpression).toMatchObject({ value: '0.5' });
  expect(value.metrics[0].filters).toBeUndefined();
  fireEvent.click(
    screen.getByRole('button', { name: '完成编辑', exact: true }),
  );
  fireEvent.click(screen.getByRole('button', { name: '添加结果筛选' }));
  refresh();
  expect(value.having).toBeDefined();
});

it('marks the failing nested result-filter input and shows its error', () => {
  render(
    <AnalysisHavingEditor
      metrics={metrics}
      onChange={() => {}}
      value={{
        id: 'parent',
        type: H.AND,
        operands: [
          {
            id: 'bad',
            type: H.CONDITION,
            metricId: 'count',
            operator: C.GTE,
            value: '',
          },
        ],
      }}
      errors={[{ id: 'bad', message: '数值常量无效' }]}
    />,
  );
  expect(
    screen.getByLabelText('结果筛选 bad 数值').getAttribute('aria-invalid'),
  ).toBe('true');
  expect(screen.getByRole('alert').textContent).toBe('数值常量无效');
});
it('does not offer terms-only numeric identifiers as arithmetic fields', () => {
  render(
    <AnalysisMetricEditor
      label="指标 1"
      previousMetrics={[]}
      onChange={() => {}}
      value={{
        ...metrics[0],
        component: { name: 'distinct-count' },
        expression: { type: E.FIELD, field: 'customer' },
      }}
      context={{
        fields: [{ field: 'customer', label: '客户编号', type: 'number' }],
        capability: {
          count: true,
          expressions: true,
          features: { distinctCount: true },
          fields: [
            {
              field: 'customer',
              groups: [],
              functions: [],
              distinctCount: true,
            },
          ],
        },
      }}
    />,
  );
  fireEvent.click(screen.getByRole('combobox', { name: '指标 1 公式 字段' }));
  expect(
    screen.queryByRole('option', { name: '客户编号', exact: true }),
  ).toBeNull();
});
