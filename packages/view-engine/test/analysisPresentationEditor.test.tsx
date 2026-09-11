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
import type { AnalysisPresentation } from '../src/analysis/analysisPresentation.js';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { AnalysisPlan } from '../src/analysis/analysisModel.js';
import { AnalysisPresentationEditor } from '../src/analysis/AnalysisPresentationEditor.js';
afterEach(cleanup);
const plan: AnalysisPlan = {
  query: { metrics: [] },
  schema: [
    {
      id: 'x',
      alias: 'x',
      title: '时间',
      role: 'dimension',
      valueType: 'datetime',
      nullable: false,
    },
    {
      id: 'region',
      alias: 'region',
      title: '地区',
      role: 'dimension',
      valueType: 'string',
      nullable: false,
    },
    {
      id: 'm',
      alias: 'm',
      title: '数量',
      role: 'metric',
      valueType: 'number',
      nullable: false,
      aggregation: 'COUNT',
    },
    {
      id: 'any',
      alias: 'any',
      title: '样本',
      role: 'metric',
      valueType: 'number',
      nullable: false,
      aggregation: 'ANY',
    },
  ],
};
it('changes layout through the sole onChange output and preserves valid aliases and column widths', async () => {
  const onChange = vi.fn();
  render(
    <AnalysisPresentationEditor
      value={{
        layout: 'bar',
        columns: [{ alias: 'm', width: 220 }],
        x: 'x',
        series: 'region',
        metrics: ['m', 'gone'],
        orientation: 'horizontal',
        stacked: true,
      }}
      plan={plan}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByRole('combobox', { name: '图表类型' }));
  const option = await screen.findByRole('option', { name: '折线图' });
  fireEvent.pointerDown(option, { pointerType: 'mouse' });
  fireEvent.click(option);
  expect(onChange).toHaveBeenCalledExactlyOnceWith({
    layout: 'line',
    orientation: 'horizontal',
    stacked: true,
    columns: [{ alias: 'm', width: 220 }],
    x: 'x',
    series: 'region',
    metrics: ['m'],
  });
});
it('chooses numeric metric defaults and exposes repairable compatibility issues', () => {
  const onChange = vi.fn();
  render(
    <AnalysisPresentationEditor
      value={{ layout: 'metric', columns: [] }}
      plan={plan}
      onChange={onChange}
    />,
  );
  expect(
    screen.getByRole('checkbox', { name: '数量' }).getAttribute('aria-checked'),
  ).toBe('true');
  expect(screen.queryByRole('checkbox', { name: '样本' })).toBeNull();
  expect(screen.getByRole('status').textContent).toMatch(/分组/);
  fireEvent.click(screen.getByRole('checkbox', { name: '数量' }));
  expect(onChange.mock.calls[0][0].metrics).toEqual([]);
});
it('disables configuration without an executed plan or when stale', () => {
  const onChange = vi.fn();
  const view = render(
    <AnalysisPresentationEditor
      value={{ layout: 'table', columns: [] }}
      onChange={onChange}
    />,
  );
  expect(
    screen.getByRole('combobox', { name: '图表类型' }).hasAttribute('disabled'),
  ).toBe(true);
  view.rerender(
    <AnalysisPresentationEditor
      value={{ layout: 'bar', columns: [] }}
      plan={plan}
      disabled
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByRole('checkbox', { name: '数量' }));
  expect(onChange).not.toHaveBeenCalled();
});

it('repairs stale display aliases when choosing a new chart while retaining valid widths', async () => {
  const onChange = vi.fn();
  render(
    <AnalysisPresentationEditor
      value={{
        layout: 'bar',
        columns: [
          { alias: 'gone', width: 100 },
          { alias: 'm', width: 200 },
        ],
        x: 'gone',
        series: 'gone',
        metrics: ['gone'],
      }}
      plan={plan}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByRole('combobox', { name: '图表类型' }));
  const option = await screen.findByRole('option', { name: '饼图' });
  fireEvent.pointerDown(option, { pointerType: 'mouse' });
  fireEvent.click(option);
  expect(onChange.mock.calls[0][0]).toEqual({
    layout: 'pie',
    columns: [{ alias: 'm', width: 200 }],
    x: undefined,
    metrics: undefined,
  });
});

it('keeps chart choices when visiting the data table and returning', async () => {
  const original: AnalysisPresentation = {
    layout: 'bar',
    columns: [],
    x: 'x',
    series: 'region',
    metrics: ['m'],
    orientation: 'horizontal',
    stacked: true,
  };
  let latest = original;
  function Example() {
    const [value, setValue] = useState(original);
    return (
      <AnalysisPresentationEditor
        value={value}
        plan={plan}
        onChange={next => {
          latest = next;
          setValue(next);
        }}
      />
    );
  }
  render(<Example />);
  for (const label of ['数据表', '柱状图']) {
    fireEvent.click(screen.getByRole('combobox', { name: '图表类型' }));
    const option = await screen.findByRole('option', { name: label });
    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.click(option);
  }
  expect(latest).toMatchObject(original);
});
it('removes invisible stale metric references when selecting an available metric', () => {
  const onChange = vi.fn();
  render(
    <AnalysisPresentationEditor
      value={{ layout: 'bar', columns: [], x: 'x', metrics: ['deleted'] }}
      plan={plan}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByRole('checkbox', { name: '数量' }));
  expect(onChange.mock.calls[0][0].metrics).toEqual(['m']);
});

it('preserves multiple selected metrics and explicit empty drafts across pie round trips', async () => {
  const extended: AnalysisPlan = {
    ...plan,
    schema: [
      plan.schema[0],
      { ...plan.schema[2], aggregation: 'SUM', unit: 'CNY' },
      {
        ...plan.schema[2],
        id: 'cost',
        alias: 'cost',
        title: '成本',
        aggregation: 'SUM',
        unit: 'CNY',
      },
    ],
  };
  const original: AnalysisPresentation = {
    layout: 'bar',
    columns: [],
    x: 'x',
    metrics: ['m', 'cost'],
    orientation: 'horizontal',
  };
  let latest = original;
  function Example() {
    const [value, setValue] = useState(original);
    return (
      <AnalysisPresentationEditor
        value={value}
        plan={extended}
        onChange={next => {
          latest = next;
          setValue(next);
        }}
      />
    );
  }
  const view = render(<Example />);
  for (const label of ['饼图', '柱状图']) {
    fireEvent.click(screen.getByRole('combobox', { name: '图表类型' }));
    const option = await screen.findByRole('option', { name: label });
    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.click(option);
  }
  expect(latest.metrics).toEqual(['m', 'cost']);
  view.unmount();
  const changed = vi.fn();
  render(
    <AnalysisPresentationEditor
      value={{ ...original, metrics: [] }}
      plan={extended}
      onChange={changed}
    />,
  );
  fireEvent.click(screen.getByRole('combobox', { name: '图表类型' }));
  const option = await screen.findByRole('option', { name: '折线图' });
  fireEvent.pointerDown(option, { pointerType: 'mouse' });
  fireEvent.click(option);
  expect(changed.mock.calls[0][0].metrics).toEqual([]);
});
it('can leave compatibility notices to the surrounding result view', () => {
  render(
    <AnalysisPresentationEditor
      value={{ layout: 'metric', columns: [] }}
      plan={plan}
      onChange={() => {}}
      showIssues={false}
    />,
  );
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.getByRole('checkbox', { name: '数量' })).toBeTruthy();
});
it('does not materialize defaults when returning to an unchanged layout', async () => {
  const original: AnalysisPresentation = { layout: 'bar', columns: [] };
  let latest = original;
  function Example() {
    const [value, setValue] = useState(original);
    return (
      <AnalysisPresentationEditor
        value={value}
        plan={{
          ...plan,
          schema: plan.schema.filter(column => column.alias !== 'region'),
        }}
        onChange={next => {
          latest = next;
          setValue(next);
        }}
      />
    );
  }
  render(<Example />);
  for (const label of ['数据表', '柱状图']) {
    fireEvent.click(screen.getByRole('combobox', { name: '图表类型' }));
    const option = await screen.findByRole('option', { name: label });
    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.click(option);
  }
  expect(JSON.parse(JSON.stringify(latest))).toEqual(original);
});
