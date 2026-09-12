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
  within,
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
it('shows the dashboard through the page, keeps layout changes query-free, and refreshes one panel', async () => {
  const { engine, paged } = dashboardSetup();
  await engine.load();
  render(<ViewPageContent engine={engine} />);
  await waitFor(() =>
    expect(screen.getAllByRole('button', { name: '刷新child' })).toHaveLength(
      2,
    ),
  );
  paged.mockClear();
  fireEvent.click(screen.getByRole('button', { name: '编辑布局' }));
  for (let i = 0; i < 6; i++)
    fireEvent.keyDown(
      screen.getAllByRole('button', { name: '调整child尺寸' })[0],
      { key: 'ArrowRight' },
    );
  expect(
    engine.dashboard('dashboard').getSnapshot().config.panels[0].layout.w,
  ).toBe(12);
  expect(paged).not.toHaveBeenCalled();
  fireEvent.click(screen.getAllByRole('button', { name: '刷新child' })[0]);
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(1));
  cleanup();
  engine.dispose();
});
it('explains an empty dashboard without discovery and never takes lifecycle ownership', async () => {
  const { engine } = dashboardSetup({
    schemaVersion: 1,
    panels: [],
    filters: [],
  });
  await engine.load();
  const runtime = engine.dashboard('dashboard');
  const dispose = vi.spyOn(runtime, 'dispose');
  const rendered = render(<DashboardView runtime={runtime} />);
  expect(screen.getByText(/添加 Markdown、链接或图片/)).toBeTruthy();
  expect(screen.getByRole('button', { name: '添加Markdown' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: '添加面板' })).toBeNull();
  rendered.unmount();
  expect(dispose).not.toHaveBeenCalled();
  engine.dispose();
});

it('creates the first dashboard, discovers a panel, and saves only the dashboard', async () => {
  const create = vi.fn(async value => ({
    ...value,
    id: 'saved-dashboard',
    revision: 'r1',
  }));
  const paged = vi.fn().mockResolvedValue({
    total: 1,
    list: [{ state: { id: 'one', amount: 20 } }],
  });
  const engine = new ViewEngine({
    definitionId: 'root',
    definition: {
      id: 'root',
      title: 'Business',
      fields: definition.fields,
      dashboard: true,
    },
    instances: { instances: [], defaultInstanceId: null },
    host: {
      permission: {
        getDefinition: () => ({ createPersonal: true, createShared: false }),
        getInstance: () => ({ save: true }),
      },
      definition: { load: async () => definition },
      instance: { load: async () => instance('child'), create },
      dashboard: {
        search: async () => ({
          items: [
            {
              id: 'child',
              definitionId: 'orders',
              title: '订单视图',
              kind: 'record',
            },
          ],
          nextCursor: null,
        }),
      },
      resolveSource: () => ({ paged }),
    },
  });
  await engine.load();
  render(<ViewPageContent engine={engine} />);
  fireEvent.click(screen.getByRole('button', { name: '新建仪表盘' }));
  fireEvent.change(await screen.findByRole('textbox', { name: '名称' }), {
    target: { value: '销售概览' },
  });
  fireEvent.click(screen.getByRole('button', { name: '创建草稿' }));
  fireEvent.click(await screen.findByRole('button', { name: '添加面板' }));
  fireEvent.click(await screen.findByRole('button', { name: /订单视图/ }));
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(1));
  expect(create).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
  expect(create.mock.calls[0][0]).toMatchObject({
    title: '销售概览',
    kind: 'dashboard',
    config: { panels: [{ instanceId: 'child' }] },
  });
  cleanup();
  engine.dispose();
});
it('supports save-as-only editing without exposing creation or overwrite', async () => {
  const { engine } = dashboardSetup(undefined, {
    permission: { getInstance: () => ({ save: false, saveAsPersonal: true }) },
    instance: { load: async () => instance('child'), create: vi.fn() },
  });
  await engine.load();
  render(<ViewPageContent engine={engine} />);
  expect(screen.queryByRole('button', { name: '保存' })).toBeNull();
  expect(screen.getByRole('button', { name: '另存为' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '编辑布局' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: '新建仪表盘' })).toBeNull();
  cleanup();
  engine.dispose();
});
it('aborts candidate requests when search changes or closes, and exposes retry', async () => {
  const signals: AbortSignal[] = [];
  const search = vi.fn((_input, signal: AbortSignal) => {
    signals.push(signal);
    return new Promise<never>(() => {});
  });
  const { engine } = dashboardSetup(
    { schemaVersion: 1, panels: [], filters: [] },
    { dashboard: { search } },
  );
  await engine.load();
  render(<DashboardView runtime={engine.dashboard('dashboard')} />);
  fireEvent.click(screen.getByRole('button', { name: '添加面板' }));
  fireEvent.change(await screen.findByRole('textbox', { name: '搜索视图' }), {
    target: { value: 'order' },
  });
  await waitFor(() => expect(search).toHaveBeenCalledTimes(2));
  expect(signals[0].aborted).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '关闭', exact: true }));
  await waitFor(() => expect(signals[1].aborted).toBe(true));
  cleanup();
  engine.dispose();
});

it('retries failed discovery and appends paginated candidates without losing the first page', async () => {
  const search = vi
    .fn()
    .mockRejectedValueOnce(new Error('候选服务暂不可用'))
    .mockResolvedValueOnce({
      items: [
        {
          id: 'child',
          definitionId: 'orders',
          title: '订单候选',
          kind: 'record',
        },
      ],
      nextCursor: 'next',
    })
    .mockResolvedValueOnce({
      items: [
        {
          id: 'second',
          definitionId: 'orders',
          title: '另一个候选',
          kind: 'record',
        },
      ],
      nextCursor: null,
    });
  const { engine } = dashboardSetup(
    { schemaVersion: 1, panels: [], filters: [] },
    { dashboard: { search } },
  );
  await engine.load();
  render(<DashboardView runtime={engine.dashboard('dashboard')} />);
  fireEvent.click(screen.getByRole('button', { name: '添加面板' }));
  expect(await screen.findByText('候选服务暂不可用')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '重试搜索' }));
  fireEvent.click(await screen.findByRole('button', { name: '加载更多视图' }));
  expect(
    await screen.findByRole('button', { name: /另一个候选/ }),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: /订单候选/ })).toBeTruthy();
  expect(search.mock.calls[2][0]).toMatchObject({ cursor: 'next' });
  cleanup();
  engine.dispose();
});

it('replacing a filtered reference preserves its position but requires a fresh binding decision before any query', async () => {
  const item = globalFilter();
  item.bindings = item.bindings.filter(binding => binding.panelId === 'a');
  const { engine, paged } = dashboardSetup(
    {
      schemaVersion: 1,
      panels: [
        {
          kind: 'view' as const,
          id: 'a',
          instanceId: 'child',
          layout: { x: 0, y: 0, w: 8, h: 18 },
        },
      ],
      filters: [item],
    },
    {
      instance: {
        load: async id => instance(id),
        save: async value => ({ ...value, revision: 'r2' }),
      },
      dashboard: {
        search: async () => ({
          items: [
            {
              id: 'replacement',
              definitionId: 'orders',
              title: '新版订单',
              kind: 'record',
            },
          ],
          nextCursor: null,
        }),
      },
    },
  );
  await engine.load();
  render(<ViewPageContent engine={engine} />);
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(1));
  paged.mockClear();
  fireEvent.click(screen.getByRole('button', { name: '编辑布局' }));
  fireEvent.click(screen.getByRole('button', { name: '替换面板1' }));
  fireEvent.click(await screen.findByRole('button', { name: /新版订单/ }));
  await waitFor(() =>
    expect(
      engine.dashboard('dashboard').getSnapshot().panels.a.instance?.id,
    ).toBe('replacement'),
  );
  const config = engine.dashboard('dashboard').getSnapshot().config;
  expect(config.panels[0]).toEqual({
    kind: 'view' as const,
    id: 'a',
    instanceId: 'replacement',
    layout: { x: 0, y: 0, w: 8, h: 18 },
  });
  expect(config.filters[0].bindings).toEqual([]);
  expect(paged).not.toHaveBeenCalled();
  expect(
    (screen.getByRole('button', { name: '查询' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '全局筛选设置' }));
  fireEvent.change(screen.getByRole('combobox', { name: /绑定方式/ }), {
    target: { value: 'excluded' },
  });
  expect(paged).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(1));
  cleanup();
  engine.dispose();
});

it.each([true, false])(
  'removes panels without querying siblings and restores focus with discovery=%s',
  async discovery => {
    const { engine, paged } = dashboardSetup(
      {
        schemaVersion: 1,
        panels: ['a', 'b', 'c'].map(id => ({
          kind: 'view' as const,
          id,
          instanceId: 'child',
          layout: { x: 0, y: 0, w: 4, h: 18 },
        })),
        filters: [],
      },
      discovery
        ? {
            dashboard: {
              search: async () => ({ items: [], nextCursor: null }),
            },
          }
        : {},
    );
    await engine.load();
    render(<DashboardView runtime={engine.dashboard('dashboard')} />);
    await waitFor(() => expect(paged).toHaveBeenCalledTimes(3));
    paged.mockClear();
    fireEvent.click(screen.getByRole('button', { name: '编辑布局' }));
    const previous = screen.getByRole('button', { name: '移除面板1' });
    const next = screen.getByRole('button', { name: '移除面板3' });
    fireEvent.click(screen.getByRole('button', { name: '移除面板2' }));
    expect(document.activeElement).toBe(next);
    fireEvent.click(screen.getByRole('button', { name: '移除面板2' }));
    expect(document.activeElement).toBe(previous);
    fireEvent.click(screen.getByRole('button', { name: '移除面板1' }));
    expect(engine.dashboard('dashboard').getSnapshot().config.panels).toEqual(
      [],
    );
    if (discovery)
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: '添加面板' }),
      );
    else expect(document.activeElement?.getAttribute('tabindex')).toBe('-1');
    expect(paged).not.toHaveBeenCalled();
    cleanup();
    engine.dispose();
  },
);

it('read-only browsing can query temporary global values and refresh them without dirtying saved configuration', async () => {
  const item = globalFilter();
  item.bindings = item.bindings.filter(binding => binding.panelId === 'a');
  const { engine, paged } = dashboardSetup(
    {
      schemaVersion: 1,
      panels: [
        {
          kind: 'view' as const,
          id: 'a',
          instanceId: 'child',
          layout: { x: 0, y: 0, w: 6, h: 18 },
        },
      ],
      filters: [item],
    },
    { permission: { getInstance: () => ({}) } },
  );
  await engine.load();
  render(<DashboardView runtime={engine.dashboard('dashboard')} />);
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(1));
  paged.mockClear();
  expect(screen.queryByRole('button', { name: '全局筛选设置' })).toBeNull();
  fireEvent.change(screen.getByLabelText('Amount值'), {
    target: { value: '60' },
  });
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(1));
  expect(JSON.stringify(paged.mock.calls[0][0])).toContain('60');
  fireEvent.click(screen.getByRole('button', { name: '刷新全部' }));
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(2));
  expect(engine.dashboard('dashboard').getSnapshot().session.dirty).toBe(false);
  expect(
    engine.dashboard('dashboard').getSnapshot().session.instance.config.filters,
  ).toEqual([item]);
  cleanup();
  engine.dispose();
});

it('keeps candidate selection open after panel-limit rejection and permits cancelling without changing references', async () => {
  const { engine } = dashboardSetup(
    {
      schemaVersion: 1,
      panels: [
        {
          kind: 'view' as const,
          id: 'a',
          instanceId: 'child',
          layout: { x: 0, y: 0, w: 6, h: 18 },
        },
      ],
      filters: [],
    },
    {
      dashboard: {
        search: async () => ({
          items: [
            {
              id: 'analysis',
              title: '销售分析',
              definitionId: 'orders',
              kind: 'analysis',
            },
          ],
          nextCursor: null,
        }),
      },
    },
    { maxDashboardPanels: 1 },
  );
  await engine.load();
  render(<DashboardView runtime={engine.dashboard('dashboard')} />);
  fireEvent.click(screen.getByRole('button', { name: '添加面板' }));
  fireEvent.click(await screen.findByRole('button', { name: /销售分析/ }));
  expect(screen.getByRole('dialog', { name: '添加面板' })).toBeTruthy();
  expect(
    screen
      .getAllByRole('alert')
      .some(node => /面板/.test(node.textContent ?? '')),
  ).toBe(true);
  expect(
    engine.dashboard('dashboard').getSnapshot().config.panels,
  ).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: '关闭', exact: true }));
  expect(
    engine.dashboard('dashboard').getSnapshot().config.panels[0].instanceId,
  ).toBe('child');
  cleanup();
  engine.dispose();
});

it('reports caller-owned runtime submission rejection and clears it after a successful retry', async () => {
  const { engine } = dashboardSetup({
    schemaVersion: 1,
    panels: [],
    filters: [],
  });
  await engine.load();
  const runtime = engine.dashboard('dashboard');
  // A caller-owned runtime may reject its async command; the public view must own that rejection.
  vi.spyOn(runtime, 'apply').mockRejectedValueOnce(
    new Error('查询提交暂不可用'),
  );
  render(<DashboardView runtime={runtime} />);
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  expect(await screen.findByText('查询提交暂不可用')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  await waitFor(() =>
    expect(screen.queryByText('查询提交暂不可用')).toBeNull(),
  );
  cleanup();
  engine.dispose();
});

it('opens the original saved view through the host without changing or refreshing dashboard positions', async () => {
  const openOriginal = vi.fn();
  const { engine, paged } = dashboardSetup(undefined, {
    dashboard: { openOriginal },
  });
  await engine.load();
  render(<DashboardView runtime={engine.dashboard('dashboard')} />);
  await waitFor(() =>
    expect(screen.getAllByRole('button', { name: '编辑原视图' })).toHaveLength(
      2,
    ),
  );
  paged.mockClear();
  fireEvent.click(screen.getAllByRole('button', { name: '编辑原视图' })[1]);
  expect(openOriginal).toHaveBeenCalledWith({
    instanceId: 'child',
    definitionId: 'orders',
  });
  expect(paged).not.toHaveBeenCalled();
  expect(
    engine
      .dashboard('dashboard')
      .getSnapshot()
      .config.panels.map(panel => panel.id),
  ).toEqual(['a', 'b']);
  cleanup();
  engine.dispose();
});

it('explains who can configure an empty read-only dashboard even when discovery exists', async () => {
  const search = vi.fn();
  const { engine } = dashboardSetup(
    { schemaVersion: 1, panels: [], filters: [] },
    { permission: { getInstance: () => ({}) }, dashboard: { search } },
  );
  await engine.load();
  render(<DashboardView runtime={engine.dashboard('dashboard')} />);
  expect(screen.getByText('请联系视图维护者添加面板。')).toBeTruthy();
  expect(screen.queryByRole('button', { name: '添加面板' })).toBeNull();
  expect(search).not.toHaveBeenCalled();
  cleanup();
  engine.dispose();
});

it('keeps local dashboards reachable after navigating away without adding authoritative IDs', async () => {
  const { engine } = dashboardSetup(undefined, {
    instance: { create: vi.fn() },
    permission: {
      getDefinition: () => ({ createPersonal: true, createShared: false }),
    },
  });
  await engine.load();
  let draftId = '';
  act(() => {
    draftId = engine.createDashboard({
      title: '未保存的分析台',
      scope: { type: 'personal' },
    });
  });
  render(<ViewPageContent engine={engine} />);
  const sidebar = screen.getByRole('complementary', { name: '视图列表' });
  fireEvent.click(within(sidebar).getByRole('button', { name: 'Dashboard' }));
  await waitFor(() =>
    expect(engine.getSnapshot().selectedInstanceId).toBe('dashboard'),
  );
  expect(engine.getSnapshot().instanceIds).toEqual(['dashboard']);
  fireEvent.click(
    within(sidebar).getByRole('button', { name: /未保存的分析台/ }),
  );
  await waitFor(() =>
    expect(engine.getSnapshot().selectedInstanceId).toBe(draftId),
  );
  expect(engine.getSnapshot().sessions[draftId].instance.title).toBe(
    '未保存的分析台',
  );
  fireEvent.click(within(sidebar).getByRole('button', { name: 'Dashboard' }));
  await waitFor(() =>
    expect(engine.getSnapshot().selectedInstanceId).toBe('dashboard'),
  );
  fireEvent.click(within(sidebar).getByRole('button', { name: '管理视图' }));
  fireEvent.click(
    await screen.findByRole('button', { name: '继续编辑：未保存的分析台' }),
  );
  await waitFor(() =>
    expect(engine.getSnapshot().selectedInstanceId).toBe(draftId),
  );
  cleanup();
  engine.dispose();
});
