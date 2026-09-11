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
import { afterEach, expect, it, vi } from 'vitest';
import { useState } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  AggregationFunction,
  AggregationGroupType,
  FilterOperator,
} from '@ahoo-wang/fetcher-wow';
import { ViewEngine } from '../src/engine/ViewEngine.js';
import { ViewPageContent } from '../src/view/ViewPageContent.js';
import { AnalysisView } from '../src/analysis/AnalysisView.js';
import { compileAnalysis } from '../src/analysis/analysisCompiler.js';
vi.mock('../src/analysis/analysisCompiler.js', { spy: true });
import type { FilterRegistration } from '../src/filter/filterReactTypes.js';
import { createFilterConfiguration } from '../src/filter/filterConfiguration.js';
import type {
  AnalysisViewInstance,
  ViewDefinition,
} from '../src/contracts/viewModel.js';

afterEach(cleanup);
function setup(
  mixed = false,
  damagedPresentation = false,
  maxRetainedResults = 20,
) {
  const definition: ViewDefinition = {
    id: 'orders',
    title: '订单分析',
    sourceId: 'orders',
    record: mixed ? { rowKey: 'id', allowedLayouts: ['table'] } : undefined,
    fields: [{ field: 'amount', label: '金额', type: 'number' }],
    analysis: {
      count: true,
      fields: [
        { field: 'amount', groups: [], functions: [AggregationFunction.SUM] },
      ],
    },
  };
  const instance: AnalysisViewInstance = {
    id: 'totals',
    definitionId: 'orders',
    kind: 'analysis',
    title: '订单统计',
    scope: { type: 'personal' },
    revision: '1',
    config: {
      filters: createFilterConfiguration({
        id: 'root',
        component: { name: 'builtin' },
        operator: FilterOperator.MATCH_ALL,
        props: {},
      }),
      dimensions: [],
      metrics: [
        {
          id: 'count',
          component: { name: 'count' },
          alias: 'orders',
          title: '订单数',
          props: {},
        },
      ],
      sort: [],
      limit: 100,
      presentation: {
        layout: 'table',
        columns: [],
        ...(damagedPresentation ? { x: 'deleted_category' } : {}),
      },
    },
  };
  const aggregate = vi.fn().mockResolvedValue([{ orders: 2 }]);
  const save = vi.fn(async (value: AnalysisViewInstance) => ({
    ...value,
    revision: '2',
  }));
  const engine = new ViewEngine({
    definitionId: 'orders',
    definition,
    limits: { maxRetainedResults },
    instances: {
      instances: mixed
        ? [
            instance,
            {
              ...instance,
              id: 'records',
              title: '订单记录',
              kind: 'record',
              config: {
                filters: instance.config.filters,
                sort: [],
                pagination: { mode: 'paged', size: 10 },
                presentation: {
                  layout: 'table',
                  table: {
                    columns: [{ id: 'amount', kind: 'field', field: 'amount' }],
                  },
                },
              },
            },
          ]
        : [instance],
      defaultInstanceId: 'totals',
    },
    host: {
      resolveSource: () => ({
        aggregate,
        paged: async () => ({ list: [], total: 0 }),
      }),
      instance: { save },
      permission: {
        getInstance: () => ({
          save: true,
          saveAsPersonal: false,
          saveAsShared: false,
        }),
      },
    },
  });
  return { engine, aggregate, save };
}
it('saves edited analysis without running and exposes a single run action', async () => {
  const { engine, aggregate, save } = setup();
  try {
    await engine.load();
    render(<AnalysisView engine={engine} />);
    expect(
      screen
        .getByRole('button', { name: '配置分析' })
        .getAttribute('aria-expanded'),
    ).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: '配置分析' }));
    const before = aggregate.mock.calls.length;
    fireEvent.change(screen.getByRole('textbox', { name: '最多结果行数' }), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存', exact: true }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(aggregate).toHaveBeenCalledTimes(before);
    expect(
      screen.queryByRole('button', { name: '查询', exact: true }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: '运行分析', exact: true }),
    );
    await waitFor(() => expect(aggregate).toHaveBeenCalledTimes(before + 1));
    expect(screen.getByRole('table')).toBeTruthy();
  } finally {
    engine.dispose();
  }
});
it('keeps successful results on retry failure and blocks invalid working config', async () => {
  const { engine, aggregate } = setup();
  try {
    await engine.load();
    await engine.analysis('totals').run();
    render(<AnalysisView engine={engine} />);
    aggregate.mockRejectedValueOnce(new Error('服务暂时不可用'));
    fireEvent.click(
      screen.getByRole('button', { name: '运行分析', exact: true }),
    );
    await waitFor(() =>
      expect(screen.getByText('分析查询失败，请重试')).toBeTruthy(),
    );
    expect(screen.getByRole('table')).toBeTruthy();
    await act(async () =>
      engine.analysis('totals').edit(config => ({ ...config, limit: '' })),
    );
    expect(
      screen.getByRole('button', { name: '运行分析', exact: true }),
    ).toHaveProperty('disabled', true);
    expect(
      screen.getByRole('button', { name: '保存', exact: true }),
    ).toHaveProperty('disabled', true);
  } finally {
    engine.dispose();
  }
});

it('switches kinds in one page and preserves unrun drafts and panel state', async () => {
  const { engine, aggregate } = setup(true);
  try {
    await engine.load();
    render(<ViewPageContent engine={engine} />);
    fireEvent.click(screen.getByRole('button', { name: '配置分析' }));
    fireEvent.change(screen.getByRole('textbox', { name: '最多结果行数' }), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: '配置分析' }));
    const calls = aggregate.mock.calls.length;
    await act(() => engine.selectInstance('records'));
    expect(screen.queryByRole('button', { name: '配置分析' })).toBeNull();
    await act(() => engine.selectInstance('totals'));
    expect(
      screen
        .getByRole('button', { name: '配置分析' })
        .getAttribute('aria-expanded'),
    ).toBe('false');
    expect(aggregate).toHaveBeenCalledTimes(calls);
    fireEvent.click(screen.getByRole('button', { name: '配置分析' }));
    expect(
      screen.getByRole('textbox', { name: '最多结果行数' }),
    ).toHaveProperty('value', '');
    expect(screen.getByRole('button', { name: '运行分析' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(screen.getByRole('table')).toBeTruthy();
  } finally {
    engine.dispose();
  }
});

it('describes a cleared filter group as all records in the collapsed query summary', async () => {
  const { engine, aggregate } = setup();
  try {
    await engine.load();
    render(<AnalysisView engine={engine} configurationOpen={false} />);
    const before = aggregate.mock.calls.length;
    await act(() =>
      engine.analysis('totals').edit(config => ({
        ...config,
        filters: createFilterConfiguration({
          id: 'empty-group',
          component: { name: 'builtin' },
          operator: FilterOperator.AND,
          props: {},
          operands: [
            {
              id: 'amount-filter',
              component: { name: 'builtin' },
              field: 'amount',
              operator: FilterOperator.EQ,
              props: {},
            },
          ],
        }),
      })),
    );
    expect(
      screen.getByRole('button', { name: '展开查询配置' }).textContent,
    ).toContain('全部记录');
    expect(aggregate).toHaveBeenCalledTimes(before);
  } finally {
    engine.dispose();
  }
});

it('inspects data without querying or editing and keeps the selected tab after a refresh', async () => {
  const { engine, aggregate } = setup();
  try {
    await engine.load();
    engine.analysis('totals').edit(config => ({
      ...config,
      presentation: { ...config.presentation, layout: 'metric' },
    }));
    await engine.analysis('totals').run();
    render(<AnalysisView engine={engine} />);
    await screen.findByRole('tab', { name: '分析', exact: true });
    const original = engine.getSnapshot().sessions.totals.instance.config;
    const calls = aggregate.mock.calls.length;
    fireEvent.click(screen.getByRole('tab', { name: '数据表', exact: true }));
    expect(screen.getByRole('table')).toBeTruthy();
    expect(engine.getSnapshot().sessions.totals.instance.config).toEqual(
      original,
    );
    expect(aggregate).toHaveBeenCalledTimes(calls);
    await act(() => engine.analysis('totals').run());
    expect(
      screen
        .getByRole('tab', { name: '数据表', exact: true })
        .getAttribute('aria-selected'),
    ).toBe('true');
    expect(screen.getByRole('table')).toBeTruthy();
  } finally {
    engine.dispose();
  }
});

it('changes visualization without dispatching another query', async () => {
  const { engine, aggregate } = setup();
  try {
    await engine.load();
    render(<AnalysisView engine={engine} />);
    const before = aggregate.mock.calls.length;
    await act(() =>
      engine.analysis('totals').edit(config => ({
        ...config,
        presentation: { layout: 'metric', columns: [] },
      })),
    );
    await waitFor(() =>
      expect(document.querySelector('[aria-label="分析指标"]')).not.toBeNull(),
    );
    expect(aggregate).toHaveBeenCalledTimes(before);
    expect(
      screen.getByRole('region', { name: '执行口径' }).textContent,
    ).toContain('根记录');
  } finally {
    engine.dispose();
  }
});
it('runs valid queries while keeping invalid presentation unsaveable', async () => {
  const { engine, aggregate, save } = setup();
  try {
    await engine.load();
    engine.analysis('totals').edit(config => ({
      ...config,
      presentation: { layout: 'bar', columns: [], x: 'missing' },
    }));
    const before = aggregate.mock.calls.length;
    expect(
      engine.getSnapshot().sessions.totals.validation.length,
    ).toBeGreaterThan(0);
    await engine.analysis('totals').run();
    expect(aggregate).toHaveBeenCalledTimes(before + 1);
    await expect(engine.save('totals')).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  } finally {
    engine.dispose();
  }
});

it('automatically queries restored instances even when a presentation alias was removed', async () => {
  const { engine, aggregate } = setup(false, true);
  try {
    await engine.load();
    expect(aggregate).toHaveBeenCalledTimes(1);
    expect(engine.getSnapshot().sessions.totals.queryStatus).toBe('success');
  } finally {
    engine.dispose();
  }
});
it('combines root and element editor validity and releases removed scopes and instances', async () => {
  let resize: ResizeObserverCallback | undefined;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  const { filter } = await import('@ahoo-wang/fetcher-wow');
  const buffered: FilterRegistration = {
    modes: ['simple', 'advanced'],
    compile: (props, context) =>
      filter.eq(context.field!.field, props.value as number),
    component: function BufferedEditor({ field, context, onValidityChange }) {
      const [draft, setDraft] = useState('5');
      return (
        <div>
          <span>
            {String(context)} {field?.label}
          </span>
          <input
            aria-label={`${field?.label} 草稿`}
            value={draft}
            onChange={event => {
              setDraft(event.target.value);
              onValidityChange(false);
            }}
          />
          <button
            onClick={() => {
              setDraft('-');
              onValidityChange(false);
            }}
          >
            {field?.label} 无效
          </button>
          <button onClick={() => onValidityChange(true)}>
            {field?.label} 有效
          </button>
        </div>
      );
    },
  };
  const rootFilter = createFilterConfiguration({
    id: 'root',
    field: 'amount',
    component: { name: 'buffered' },
    operator: FilterOperator.EQ,
    props: { value: 5 },
  });
  const scopedFilter = createFilterConfiguration({
    id: 'scoped',
    field: 'amount',
    component: { name: 'buffered' },
    operator: FilterOperator.EQ,
    props: { value: 5 },
  });
  const localConfig = {
    filters: rootFilter,
    scope: { id: 'lines', filters: [scopedFilter] },
    dimensions: [],
    metrics: [
      {
        id: 'count',
        component: { name: 'count' },
        alias: 'n',
        title: 'Count',
        props: {},
      },
    ],
    sort: [],
    limit: 100,
    presentation: { layout: 'table' as const, columns: [] },
  };
  const instance: AnalysisViewInstance = {
    id: 'a',
    definitionId: 'd',
    title: 'A',
    kind: 'analysis',
    scope: { type: 'personal' },
    revision: '1',
    config: localConfig,
  };
  const aggregate = vi.fn(async () => [{ n: 1 }]);
  const engine = new ViewEngine({
    definitionId: 'd',
    definition: {
      id: 'd',
      title: 'D',
      sourceId: 's',
      fields: [{ field: 'amount', label: '根金额', type: 'number' }],
      analysis: {
        fields: [],
        count: true,
        scopes: [
          {
            id: 'lines',
            label: '明细',
            fields: [],
            capability: { fields: [], count: true },
            elements: [
              {
                path: 'lines',
                fields: [
                  { field: 'amount', label: '明细金额', type: 'number' },
                ],
              },
            ],
          },
        ],
      },
    },
    instances: {
      instances: [
        instance,
        { ...instance, id: 'b', config: { ...localConfig, scope: undefined } },
      ],
      defaultInstanceId: 'a',
    },
    filterCompilers: { buffered },
    host: { resolveSource: () => ({ aggregate }) },
  });
  try {
    await engine.load();
    render(
      <AnalysisView
        engine={engine}
        extensions={{ filters: { buffered } }}
        filterContext="宿主上下文"
      />,
    );
    expect(await screen.findByText('宿主上下文 明细金额')).toBeTruthy();
    fireEvent.click(screen.getByText('明细金额 无效'));
    await waitFor(() =>
      expect(engine.getSnapshot().sessions.a.filterValid).toBe(false),
    );
    fireEvent.click(screen.getByText('根金额 无效'));
    fireEvent.click(screen.getByText('根金额 有效'));
    expect(engine.getSnapshot().sessions.a.filterValid).toBe(false);
    await expect(engine.analysis('a').run()).rejects.toThrow('筛选输入无效');
    act(() =>
      resize!(
        [{ contentRect: { width: 600 } }] as ResizeObserverEntry[],
        {} as ResizeObserver,
      ),
    );
    fireEvent.click(
      screen.getByRole('button', { name: '配置分析', exact: true }),
    );
    expect(
      (
        screen.getByRole('textbox', {
          name: '明细金额 草稿',
        }) as HTMLInputElement
      ).value,
    ).toBe('-');
    expect(engine.getSnapshot().sessions.a.filterValid).toBe(false);
    fireEvent.click(
      screen.getByRole('button', { name: '查看结果', exact: true }),
    );
    await expect(engine.analysis('a').run()).rejects.toThrow('筛选输入无效');
    fireEvent.click(
      screen.getByRole('button', { name: '配置分析', exact: true }),
    );
    expect(
      (
        screen.getByRole('textbox', {
          name: '明细金额 草稿',
        }) as HTMLInputElement
      ).value,
    ).toBe('-');
    act(() =>
      resize!(
        [{ contentRect: { width: 1200 } }] as ResizeObserverEntry[],
        {} as ResizeObserver,
      ),
    );
    expect(
      (
        screen.getByRole('textbox', {
          name: '明细金额 草稿',
        }) as HTMLInputElement
      ).value,
    ).toBe('-');
    await expect(engine.analysis('a').run()).rejects.toThrow('筛选输入无效');
    await act(() =>
      engine.analysis('a').edit(config => ({ ...config, scope: undefined })),
    );
    await waitFor(() =>
      expect(engine.getSnapshot().sessions.a.filterValid).toBe(true),
    );
    fireEvent.click(screen.getByText('根金额 无效'));
    await act(() => engine.selectInstance('b'));
    await waitFor(() =>
      expect(engine.getSnapshot().sessions.b.filterValid).toBe(true),
    );
  } finally {
    cleanup();
    engine.dispose();
    vi.unstubAllGlobals();
  }
});

it('keeps display validation visible when the table owns no chart notice', async () => {
  const { engine } = setup();
  try {
    await engine.load();
    render(<AnalysisView engine={engine} />);
    act(() =>
      engine.analysis('totals').edit(config => ({
        ...config,
        presentation: { layout: 'table', columns: [], x: 'missing' },
      })),
    );
    expect(screen.getByLabelText('图表设置').textContent).toContain(
      '横轴维度已失效',
    );
    act(() =>
      engine.analysis('totals').edit(config => ({
        ...config,
        presentation: { ...config.presentation, layout: 'bar' },
      })),
    );
    expect(screen.getByLabelText('图表设置').textContent).not.toContain(
      '横轴维度已失效',
    );
  } finally {
    engine.dispose();
  }
});

it('shows executed display controls for stale results without replacing the draft', async () => {
  const { engine, aggregate } = setup();
  try {
    await engine.load();
    render(<AnalysisView engine={engine} />);
    act(() =>
      engine.analysis('totals').edit(config => ({
        ...config,
        presentation: { ...config.presentation, layout: 'metric' },
      })),
    );
    expect(
      screen.getByRole('combobox', { name: '图表类型' }).textContent,
    ).toContain('指标卡');
    act(() =>
      engine.analysis('totals').edit(config => ({ ...config, limit: 50 })),
    );
    expect(
      screen.getByRole('combobox', { name: '图表类型' }).textContent,
    ).toContain('数据表');
    aggregate.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await engine
        .analysis('totals')
        .run()
        .catch(() => {});
    });
    expect(
      screen.getByRole('combobox', { name: '图表类型' }).textContent,
    ).toContain('数据表');
    act(() =>
      engine.analysis('totals').edit(config => ({ ...config, limit: 100 })),
    );
    expect(
      screen.getByRole('combobox', { name: '图表类型' }).textContent,
    ).toContain('指标卡');
  } finally {
    engine.dispose();
  }
});

it('uses the configuration dialog when its container is narrow inside a wide page', async () => {
  const { engine } = setup();
  let resize: ResizeObserverCallback | undefined;
  const disconnect = vi.fn();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        resize = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  try {
    await engine.load();
    render(<AnalysisView engine={engine} />);
    expect(resize).toBeDefined();
    act(() =>
      resize!(
        [{ contentRect: { width: 600 } }] as ResizeObserverEntry[],
        {} as ResizeObserver,
      ),
    );
    fireEvent.click(
      screen.getByRole('button', { name: '配置分析', exact: true }),
    );
    expect(screen.getByRole('dialog', { name: '配置分析' })).toBeTruthy();
  } finally {
    cleanup();
    engine.dispose();
    vi.unstubAllGlobals();
  }
  expect(disconnect).toHaveBeenCalled();
});

it('mounts the configuration on a page that starts narrow', async () => {
  const { engine } = setup();
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }));
  try {
    await engine.load();
    render(<AnalysisView engine={engine} />);
    fireEvent.click(
      screen.getByRole('button', { name: '配置分析', exact: true }),
    );
    expect(await screen.findByText('高级设置')).toBeTruthy();
  } finally {
    cleanup();
    engine.dispose();
    vi.unstubAllGlobals();
  }
});

it('refreshes analysis on a timer, pauses unrun query drafts and stops after unmount', async () => {
  const { engine, aggregate } = setup();
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  await engine.load();
  const view = render(<AnalysisView engine={engine} />);
  fireEvent.click(screen.getByRole('button', { name: '自动刷新设置' }));
  const interval = await screen.findByRole('menuitemradio', {
    name: '每 30 秒',
  });
  vi.useFakeTimers();
  try {
    fireEvent.click(interval);
    const before = aggregate.mock.calls.length;
    await act(() => vi.advanceTimersByTimeAsync(31000));
    expect(aggregate.mock.calls.length).toBe(before + 1);
    await act(() =>
      engine.analysis('totals').edit(config => ({ ...config, limit: 7 })),
    );
    expect(screen.getByRole('button', { name: '刷新' })).toHaveProperty(
      'disabled',
      true,
    );
    await act(() => vi.advanceTimersByTimeAsync(60000));
    expect(aggregate.mock.calls.length).toBe(before + 1);
    await act(() => engine.analysis('totals').restore());
    await act(() => vi.advanceTimersByTimeAsync(31000));
    expect(aggregate.mock.calls.length).toBe(before + 2);
    view.unmount();
    await act(() => vi.advanceTimersByTimeAsync(60000));
    expect(aggregate.mock.calls.length).toBe(before + 2);
  } finally {
    view.unmount();
    engine.dispose();
    vi.useRealTimers();
  }
});

it('expands the shared page from analysis and exits with Escape without rerunning', async () => {
  const { engine, aggregate } = setup();
  try {
    await engine.load();
    const view = render(<ViewPageContent engine={engine} />);
    const before = aggregate.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: '展开视图' }));
    expect(
      document.querySelector('[data-view-expanded="true"]'),
    ).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('[data-view-expanded="true"]')).toBeNull();
    expect(aggregate.mock.calls.length).toBe(before);
    view.unmount();
  } finally {
    engine.dispose();
  }
});

it('mounts root filters on first expansion and retains them when collapsed', async () => {
  const { engine, aggregate } = setup();
  try {
    await engine.load();
    engine.analysis('totals').edit(config => ({
      ...config,
      filters: createFilterConfiguration({
        id: 'amount',
        field: 'amount',
        component: { name: 'builtin' },
        operator: FilterOperator.EQ,
        props: { value: 5 },
      }),
    }));
    render(<AnalysisView engine={engine} configurationOpen />);
    expect(
      screen.queryByRole('textbox', { name: '金额值', hidden: true }),
    ).toBeNull();
    const summary = screen
      .getByText('筛选条件', { exact: true })
      .closest('summary')!;
    fireEvent.click(summary);
    const editor = screen.getByRole('textbox', { name: '金额值' });
    fireEvent.click(summary);
    expect(screen.getByRole('textbox', { name: '金额值', hidden: true })).toBe(
      editor,
    );
    fireEvent.click(summary);
    expect(screen.getByRole('textbox', { name: '金额值' })).toBe(editor);
    expect(aggregate).toHaveBeenCalledTimes(1);
  } finally {
    cleanup();
    engine.dispose();
  }
});

it('explains evicted analysis results and restores them with the run action', async () => {
  const { engine, aggregate } = setup(true, false, 1);
  try {
    await engine.load();
    await engine.selectInstance('records');
    await engine.selectInstance('totals');
    expect(engine.getSnapshot().sessions.totals.result).toBeNull();
    render(<AnalysisView engine={engine} />);
    expect(screen.getByText('分析结果缓存已释放')).toBeTruthy();
    expect(screen.queryByText('从一个业务问题开始')).toBeNull();
    const before = aggregate.mock.calls.length;
    fireEvent.click(
      screen.getByRole('button', { name: '运行分析', exact: true }),
    );
    await waitFor(() => expect(screen.getByRole('table')).toBeTruthy());
    expect(aggregate).toHaveBeenCalledTimes(before + 1);
  } finally {
    engine.dispose();
  }
});

it('renders the engine compilation without recompiling the working query', async () => {
  const { engine } = setup();
  try {
    await engine.load();
    vi.mocked(compileAnalysis).mockClear();
    render(<AnalysisView engine={engine} />);
    expect(compileAnalysis).not.toHaveBeenCalled();
    act(() =>
      engine.analysis('totals').edit(config => ({ ...config, limit: 50 })),
    );
    expect(compileAnalysis).toHaveBeenCalledTimes(1);
  } finally {
    engine.dispose();
  }
});

it('disables result sorting while an extension holds invalid filter input', async () => {
  const definition: ViewDefinition = {
    id: 'grouped',
    title: 'Grouped',
    sourceId: 'orders',
    fields: [{ field: 'state', label: '状态', type: 'string' }],
    analysis: {
      count: true,
      fields: [
        { field: 'state', groups: [AggregationGroupType.TERMS], functions: [] },
      ],
    },
  };
  const instance: AnalysisViewInstance = {
    id: 'grouped',
    definitionId: definition.id,
    title: 'Grouped',
    kind: 'analysis',
    revision: '1',
    scope: { type: 'personal' },
    config: {
      filters: createFilterConfiguration({
        id: 'all',
        component: { name: 'builtin' },
        operator: FilterOperator.MATCH_ALL,
        props: {},
      }),
      dimensions: [
        {
          id: 'state',
          alias: 'state',
          title: '状态',
          field: 'state',
          component: { name: 'terms' },
          props: {},
        },
      ],
      metrics: [
        {
          id: 'n',
          alias: 'n',
          title: '数量',
          component: { name: 'count' },
          props: {},
        },
      ],
      sort: [],
      limit: 100,
      presentation: { layout: 'table', columns: [] },
    },
  };
  const aggregate = vi.fn().mockResolvedValue([{ state: 'paid', n: 2 }]);
  const engine = new ViewEngine({
    definitionId: definition.id,
    definition,
    instances: { instances: [instance], defaultInstanceId: instance.id },
    host: { resolveSource: () => ({ aggregate }) },
  });
  try {
    await engine.load();
    render(<AnalysisView engine={engine} />);
    act(() => engine.analysis(instance.id).setFilterValidity(false));
    const sort = screen.getByRole('button', { name: '排序数量' });
    expect((sort as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(sort);
    expect(
      engine.getSnapshot().sessions[instance.id].instance.config.sort,
    ).toEqual([]);
    expect(aggregate).toHaveBeenCalledOnce();
  } finally {
    engine.dispose();
  }
});
