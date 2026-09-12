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

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ViewPageContent } from '../../src/view/ViewPageContent.js';
import { DashboardView } from '../../src/dashboard/DashboardView.js';
import { ViewEngine } from '../../src/engine/ViewEngine.js';
import { definition, instance } from '../engine/fixtures.js';
import {
  createFilterConfiguration,
  newFilterNode,
} from '../../src/filter/filterCore.js';
import { filter, FilterOperator as Op } from '@ahoo-wang/fetcher-wow';
import { dashboardSetup, globalFilter } from './runtimeFixtures.js';
vi.hoisted(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(cleanup);
const empty = {
  schemaVersion: 1 as const,
  panels: [
    { id: 'a', instanceId: 'child', layout: { x: 0, y: 0, w: 6, h: 18 } },
  ],
  filters: [],
};
it('requires an explicit panel decision before query/save and never queries while editing', async () => {
  const { engine, paged } = dashboardSetup(empty);
  await engine.load();
  render(<ViewPageContent engine={engine} />);
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(1));
  paged.mockClear();
  fireEvent.click(screen.getByRole('button', { name: '全局筛选设置' }));
  fireEvent.click(screen.getByRole('button', { name: '添加全局筛选' }));
  expect(
    (screen.getByRole('button', { name: '查询' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(
    (screen.getByRole('button', { name: '保存' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.change(screen.getByRole('combobox', { name: /绑定方式/ }), {
    target: { value: 'excluded' },
  });
  expect(paged).not.toHaveBeenCalled();
  expect(
    (screen.getByRole('button', { name: '查询' }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  await waitFor(() => expect(screen.queryByText('待查询')).toBeNull());
  expect(paged).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() => expect(screen.getByText('已保存')).toBeTruthy());
  cleanup();
  engine.dispose();
});
it('needs explicit semantic confirmation and blocks an incomplete mapping without treating it as exclusion', async () => {
  const item = { ...globalFilter(), bindings: [], excludedPanelIds: [] };
  const { engine, paged } = dashboardSetup({ ...empty, filters: [item] });
  await engine.load();
  render(<ViewPageContent engine={engine} />);
  await waitFor(() =>
    expect(
      engine.dashboard('dashboard').getSnapshot().panels.a.definition,
    ).toBeTruthy(),
  );
  fireEvent.click(screen.getByRole('button', { name: '全局筛选设置' }));
  fireEvent.change(screen.getByRole('combobox', { name: /绑定方式/ }), {
    target: { value: 'fields' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: /映射state.amount/ }), {
    target: { value: 'state.amount' },
  });
  expect(
    engine.dashboard('dashboard').getSnapshot().config.filters[0].bindings,
  ).toEqual([]);
  fireEvent.click(screen.getByRole('checkbox', { name: /确认含义/ }));
  expect(
    engine.dashboard('dashboard').getSnapshot().config.filters[0].bindings,
  ).toMatchObject([{ kind: 'fields', semanticCompatibility: true }]);
  expect(paged).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(1));
  fireEvent.change(screen.getByRole('combobox', { name: /映射state.amount/ }), {
    target: { value: '' },
  });
  expect(
    engine.dashboard('dashboard').getSnapshot().config.filters[0]
      .excludedPanelIds,
  ).toEqual([]);
  expect(
    (screen.getByRole('button', { name: '保存' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  cleanup();
  engine.dispose();
});
it('preserves unknown transforms and disallows options transforms without an editor', async () => {
  const item = {
    ...globalFilter(),
    bindings: [
      {
        panelId: 'a',
        kind: 'transform' as const,
        name: 'legacy',
        options: { region: 'east' },
      },
    ],
  };
  const { engine } = dashboardSetup({ ...empty, filters: [item] });
  await engine.load();
  render(
    <DashboardView
      runtime={engine.dashboard('dashboard')}
      extensions={{
        dashboard: {
          transforms: { needsOptions: { label: '区域转换', hasOptions: true } },
        },
      }}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '全局筛选设置' }));
  expect(
    (screen.getByRole('option', { name: /区域转换/ }) as HTMLOptionElement)
      .disabled,
  ).toBe(true);
  expect(screen.getByText(/原配置已保留/)).toBeTruthy();
  expect(
    engine.dashboard('dashboard').getSnapshot().config.filters[0].bindings[0],
  ).toEqual(item.bindings[0]);
  cleanup();
  engine.dispose();
});
it('invalid local transform options disable query and save even though the last committed value is valid', async () => {
  const item = {
    ...globalFilter(),
    bindings: [
      {
        panelId: 'a',
        kind: 'transform' as const,
        name: 'legacy',
        options: { region: 'east' },
      },
    ],
  };
  const base = dashboardSetup();
  const engine = new ViewEngine({
    definitionId: 'root',
    definition: {
      id: 'root',
      title: 'Root',
      fields: definition.fields,
      dashboard: true,
    },
    instances: {
      instances: [
        {
          id: 'dashboard',
          definitionId: 'root',
          title: 'Overview',
          kind: 'dashboard',
          revision: 'r1',
          scope: { type: 'personal' },
          config: { ...empty, filters: [item] },
        },
      ],
      defaultInstanceId: 'dashboard',
    },
    host: base.host,
    dashboardTransforms: {
      legacy: () => filter.eq('state.amount', 10),
      simple: () => filter.eq('state.amount', 10),
    },
  });
  base.engine.dispose();
  await engine.load();
  const runtime = engine.dashboard('dashboard');
  render(
    <ViewPageContent
      engine={engine}
      extensions={{
        dashboard: {
          transforms: {
            simple: { label: '无参数转换', hasOptions: false },
            legacy: {
              label: '区域转换',
              hasOptions: true,
              Editor: ({ onValidityChange }) => (
                <input
                  aria-label="转换参数"
                  onChange={() => onValidityChange(false)}
                />
              ),
            },
          },
        },
      }}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '全局筛选设置' }));
  await waitFor(() => expect(runtime.getSnapshot().validation).toEqual([]));
  fireEvent.change(screen.getByRole('textbox', { name: '转换参数' }), {
    target: { value: '-' },
  });
  expect(
    runtime.getSnapshot().session.editorValidity['transform:amount:a'],
  ).toBe(false);
  expect(
    (screen.getByRole('button', { name: '查询' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(
    (screen.getByRole('button', { name: '保存' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  await expect(engine.save('dashboard')).rejects.toThrow();
  fireEvent.change(
    screen.getByRole('combobox', { name: 'child（面板 1）宿主转换器' }),
    { target: { value: 'simple' } },
  );
  expect(
    Object.values(runtime.getSnapshot().session.editorValidity),
  ).not.toContain(false);
  expect(
    (screen.getByRole('button', { name: '查询' }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
  await expect(engine.save('dashboard')).resolves.toBeUndefined();
  await act(() => engine.restore('dashboard'));
  expect(runtime.getSnapshot().session.editorValidity).toEqual({});
  cleanup();
  engine.dispose();
});

it('lists SEARCH fields and full element-relative paths and offers only compatible scoped targets', async () => {
  const sourceFields = [
    { field: 'region', label: 'Region', type: 'string' as const },
    {
      field: 'items',
      label: 'Items',
      type: 'array' as const,
      fields: [{ field: 'sku', label: 'SKU', type: 'string' as const }],
    },
  ];
  const target = {
    ...definition,
    fields: [
      ...definition.fields,
      {
        field: 'zone',
        label: 'Zone',
        type: 'string' as const,
        operators: [Op.EQ],
      },
      {
        field: 'lines',
        label: 'Lines',
        type: 'array' as const,
        fields: [{ field: 'code', label: 'Code', type: 'string' as const }],
      },
    ],
  };
  const root = {
    ...newFilterNode(Op.AND),
    operands: [
      {
        ...newFilterNode(Op.SEARCH),
        props: { query: 'east', fields: ['region'] },
      },
      {
        ...newFilterNode(Op.ELEMENT_MATCH),
        field: 'items',
        predicate: {
          ...newFilterNode(Op.EQ),
          field: 'sku',
          props: { value: 'SKU-1' },
        },
      },
    ],
  };
  const engine = new ViewEngine({
    definitionId: 'root',
    definition: {
      id: 'root',
      title: 'Overview',
      fields: sourceFields,
      dashboard: true,
    },
    instances: {
      instances: [
        {
          id: 'dashboard',
          definitionId: 'root',
          title: 'Overview',
          kind: 'dashboard',
          scope: { type: 'personal' },
          revision: 'r1',
          config: {
            ...empty,
            filters: [
              {
                id: 'global',
                filters: createFilterConfiguration(root),
                bindings: [],
                excludedPanelIds: [],
              },
            ],
          },
        },
      ],
      defaultInstanceId: 'dashboard',
    },
    host: {
      permission: { getInstance: () => ({ save: true }) },
      definition: { load: async () => target },
      instance: {
        load: async () => instance('child'),
        save: async value => ({ ...value, revision: 'r2' }),
      },
      resolveSource: () => ({ paged: async () => ({ total: 0, list: [] }) }),
    },
  });
  await engine.load();
  render(<DashboardView runtime={engine.dashboard('dashboard')} />);
  await waitFor(() =>
    expect(
      engine.dashboard('dashboard').getSnapshot().panels.a.definition,
    ).toBeTruthy(),
  );
  fireEvent.click(screen.getByRole('button', { name: '全局筛选设置' }));
  fireEvent.change(screen.getByRole('combobox', { name: /绑定方式/ }), {
    target: { value: 'fields' },
  });
  expect(
    [
      ...(
        screen.getByRole('combobox', {
          name: /映射region$/,
        }) as HTMLSelectElement
      ).options,
    ].map(option => option.value),
  ).toContain('zone');
  const nested = screen.getByRole('combobox', {
    name: /映射items.sku$/,
  }) as HTMLSelectElement;
  expect([...nested.options].map(option => option.value)).toEqual(['']);
  fireEvent.change(screen.getByRole('combobox', { name: /映射items$/ }), {
    target: { value: 'lines' },
  });
  expect([...nested.options].map(option => option.value)).toEqual([
    '',
    'lines.code',
  ]);
  cleanup();
  engine.dispose();
});

it('repair focuses the failed global item and panel rather than an earlier valid item', async () => {
  const first = {
    ...globalFilter(),
    id: 'unrelated',
    bindings: [],
    excludedPanelIds: ['a'],
  };
  const failed = {
    ...globalFilter(),
    id: 'failed',
    bindings: [{ panelId: 'a', kind: 'transform' as const, name: 'missing' }],
  };
  const { engine } = dashboardSetup({ ...empty, filters: [first, failed] });
  await engine.load();
  render(<DashboardView runtime={engine.dashboard('dashboard')} />);
  fireEvent.click(await screen.findByRole('button', { name: '修复绑定' }));
  expect(engine.dashboard('dashboard').getSnapshot().panels.a.filterId).toBe(
    'failed',
  );
  const second = screen
    .getByRole('region', { name: '全局筛选2' })
    .querySelector('[data-binding-panel="a"]');
  expect(document.activeElement).toBe(second);
  cleanup();
  engine.dispose();
});

it('edits and removes global drafts while refresh retains the applied query until explicit submission', async () => {
  const item = globalFilter();
  item.bindings = item.bindings.filter(binding => binding.panelId === 'a');
  const { engine, paged } = dashboardSetup({ ...empty, filters: [item] });
  await engine.load();
  render(<ViewPageContent engine={engine} />);
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(1));
  const appliedRequest = paged.mock.calls[0][0];
  paged.mockClear();
  fireEvent.change(screen.getByLabelText('Amount值'), {
    target: { value: '25' },
  });
  expect(paged).not.toHaveBeenCalled();
  expect(engine.dashboard('dashboard').getSnapshot().pending).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '刷新全部' }));
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(1));
  expect(paged.mock.calls[0][0]).toEqual(appliedRequest);
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(2));
  expect(JSON.stringify(paged.mock.calls[1][0])).toContain('25');
  fireEvent.click(screen.getByRole('button', { name: '全局筛选设置' }));
  fireEvent.click(screen.getByRole('button', { name: '移除全局筛选 1' }));
  expect(engine.dashboard('dashboard').getSnapshot().config.filters).toEqual(
    [],
  );
  expect(
    engine.dashboard('dashboard').getSnapshot().applied.filters,
  ).toHaveLength(1);
  expect(paged).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(3));
  expect(JSON.stringify(paged.mock.calls[2][0])).not.toContain('state.amount');
  cleanup();
  engine.dispose();
});

it('creates a scoped options transform, keeps invalid input local, then applies and cancels it explicitly', async () => {
  const item = { ...globalFilter(), bindings: [], excludedPanelIds: ['a'] };
  const base = dashboardSetup();
  const engine = new ViewEngine({
    definitionId: 'root',
    definition: {
      id: 'root',
      title: 'Root',
      fields: definition.fields,
      dashboard: true,
    },
    instances: {
      instances: [
        {
          id: 'dashboard',
          definitionId: 'root',
          title: 'Overview',
          kind: 'dashboard',
          revision: 'r1',
          scope: { type: 'personal' },
          config: { ...empty, filters: [item, { ...item, id: 'other' }] },
        },
      ],
      defaultInstanceId: 'dashboard',
    },
    host: base.host,
    dashboardTransforms: {
      minimum: ({ options }) =>
        filter.gte('state.amount', Number(options?.minimum)),
      plain: () => filter.eq('state.amount', 10),
    },
  });
  base.engine.dispose();
  await engine.load();
  const runtime = engine.dashboard('dashboard');
  render(
    <ViewPageContent
      engine={engine}
      extensions={{
        dashboard: {
          transforms: {
            minimum: {
              label: '最低金额',
              hasOptions: true,
              applicable: (source, target) =>
                source.id === 'root' && target.id === 'orders',
              Editor: ({ value, onChange, onValidityChange }) => (
                <input
                  aria-label="最低金额参数"
                  value={String(value.minimum ?? '')}
                  onChange={event => {
                    const number = Number(event.target.value);
                    const valid =
                      event.target.value !== '' && Number.isFinite(number);
                    onValidityChange(valid);
                    if (valid) onChange({ minimum: number });
                  }}
                />
              ),
            },
            plain: { label: '固定金额' },
            incompatible: { label: '其他业务', applicable: () => false },
          },
        },
      }}
    />,
  );
  await waitFor(() =>
    expect(runtime.getSnapshot().panels.a.definition).toBeTruthy(),
  );
  fireEvent.click(screen.getByRole('button', { name: '全局筛选设置' }));
  fireEvent.change(screen.getAllByRole('combobox', { name: /绑定方式/ })[0], {
    target: { value: 'transform' },
  });
  expect(screen.queryByRole('option', { name: '其他业务' })).toBeNull();
  const selector = screen.getByRole('combobox', { name: /宿主转换器/ });
  fireEvent.change(selector, { target: { value: 'minimum' } });
  expect(
    (
      screen.getByRole('button', {
        name: '查询',
        exact: true,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.change(screen.getByLabelText('最低金额参数'), {
    target: { value: '30' },
  });
  expect(runtime.getSnapshot().config.filters[0].bindings[0]).toMatchObject({
    name: 'minimum',
    options: { minimum: 30 },
  });
  expect(runtime.getSnapshot().config.filters[0].excludedPanelIds).toEqual([]);
  expect(runtime.getSnapshot().config.filters[1]).toEqual({
    ...item,
    id: 'other',
  });
  fireEvent.change(screen.getByLabelText('最低金额参数'), {
    target: { value: '' },
  });
  expect(
    (
      screen.getByRole('button', {
        name: '保存',
        exact: true,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.change(screen.getByLabelText('最低金额参数'), {
    target: { value: '40' },
  });
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  await waitFor(() => expect(runtime.getSnapshot().pending).toBe(false));
  expect(JSON.stringify(base.paged.mock.lastCall?.[0])).toContain('40');
  fireEvent.change(selector, { target: { value: '' } });
  expect(runtime.getSnapshot().config.filters[0].bindings).toEqual([]);
  expect(
    (
      screen.getByRole('button', {
        name: '查询',
        exact: true,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.change(selector, { target: { value: 'plain' } });
  expect(runtime.getSnapshot().config.filters[0].bindings[0]).toMatchObject({
    name: 'plain',
  });
  expect(
    (
      screen.getByRole('button', {
        name: '查询',
        exact: true,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
  cleanup();
  engine.dispose();
});

it('explains implicit root semantics without persisting a false field mapping', async () => {
  const item = {
    id: 'root',
    filters: createFilterConfiguration({
      ...newFilterNode(Op.SEARCH),
      props: { query: 'invoice' },
    }),
    bindings: [],
    excludedPanelIds: [],
  };
  const { engine } = dashboardSetup({ ...empty, filters: [item] });
  await engine.load();
  render(<DashboardView runtime={engine.dashboard('dashboard')} />);
  fireEvent.click(screen.getByRole('button', { name: '检查筛选绑定' }));
  fireEvent.change(screen.getByRole('combobox', { name: /绑定方式/ }), {
    target: { value: 'fields' },
  });
  expect(screen.getByText('此条件包含隐式根语义，需要宿主转换。')).toBeTruthy();
  expect(
    (
      screen.getByRole('checkbox', { name: /确认含义/ }) as HTMLInputElement
    ).getAttribute('aria-disabled'),
  ).toBe('true');
  fireEvent.change(screen.getByLabelText('搜索目标字段'), {
    target: { value: 'Amount' },
  });
  expect(engine.dashboard('dashboard').getSnapshot().config.filters[0]).toEqual(
    item,
  );
  cleanup();
  engine.dispose();
});

it('recovers from the filter budget by removing a draft item before adding a replacement', async () => {
  const item = { ...globalFilter(), bindings: [], excludedPanelIds: ['a'] };
  const { engine, paged } = dashboardSetup(
    { ...empty, filters: [item] },
    {},
    { maxDashboardFilters: 1 },
  );
  await engine.load();
  render(<DashboardView runtime={engine.dashboard('dashboard')} />);
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(1));
  paged.mockClear();
  fireEvent.click(screen.getByRole('button', { name: '全局筛选设置' }));
  fireEvent.click(screen.getByRole('button', { name: '添加全局筛选' }));
  expect(
    screen
      .getAllByRole('alert')
      .some(node => /筛选/.test(node.textContent ?? '')),
  ).toBe(true);
  expect(engine.dashboard('dashboard').getSnapshot().config.filters).toEqual([
    item,
  ]);
  fireEvent.click(screen.getByRole('button', { name: '移除全局筛选 1' }));
  fireEvent.click(screen.getByRole('button', { name: '添加全局筛选' }));
  fireEvent.change(screen.getByRole('combobox', { name: /绑定方式/ }), {
    target: { value: 'fields' },
  });
  await waitFor(() =>
    expect(
      (
        screen.getByRole('checkbox', { name: /确认含义/ }) as HTMLElement
      ).getAttribute('aria-disabled'),
    ).not.toBe('true'),
  );
  fireEvent.click(screen.getByRole('checkbox', { name: /确认含义/ }));
  expect(screen.getByText('常量条件，无字段映射')).toBeTruthy();
  expect(
    engine.dashboard('dashboard').getSnapshot().config.filters[0].id,
  ).not.toBe(item.id);
  expect(paged).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  await waitFor(() =>
    expect(engine.dashboard('dashboard').getSnapshot().pending).toBe(false),
  );
  cleanup();
  engine.dispose();
});
