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

import { StrictMode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { filter } from '@ahoo-wang/fetcher-wow';
import { ViewPage, ViewPageContent } from '../src/record/ViewPage.js';
import { ViewEngine } from '../src/record/ViewEngine.js';
import type {
  ViewDefinition,
  ViewHost,
  ViewInstance,
} from '../src/record/recordModel.js';
import type { GlobalActionsRendererProps } from '../src/record/recordReactTypes.js';

afterEach(cleanup);
const definition: ViewDefinition = {
  id: 'orders',
  sourceId: 'orders',
  title: '订单管理',
  rowKey: 'id',
  fields: [{ field: 'amount', label: '金额', type: 'number', sortable: true }],
};
const instance: ViewInstance = {
  id: 'mine',
  definitionId: 'orders',
  title: '我的订单',
  kind: 'record',
  scope: { type: 'personal' },
  config: {
    filter: filter.gte('amount', 10),
    sort: [],
    pagination: { mode: 'paged', size: 10 },
    presentation: {
      layout: 'table',
      table: { columns: [{ id: 'amount', kind: 'field', field: 'amount' }] },
    },
  },
};
function setup() {
  const paged = vi
    .fn()
    .mockResolvedValue({ list: [{ id: 0, amount: 42 }], total: 1 });
  const other = {
    ...structuredClone(instance),
    id: 'system',
    title: '所有订单',
    scope: { type: 'public', source: 'system' } as const,
  };
  const host: ViewHost = {
    loadDefinition: vi.fn().mockResolvedValue(definition),
    listInstances: vi.fn().mockResolvedValue({
      instances: [instance, other],
      defaultInstanceId: instance.id,
    }),
    resolveSource: () => ({
      paged,
      cursor: vi.fn().mockResolvedValue({ list: [], nextCursor: null }),
    }),
    saveInstance: vi.fn(async submitted => ({
      ...submitted,
      revision: 'next',
    })),
    getInstancePermissions: () => ({
      save: true,
      saveAsPersonal: true,
      saveAsShared: false,
    }),
    createInstance: vi.fn(async submitted => ({
      ...submitted,
      id: 'copy',
      revision: '1',
    })),
  };
  return { host, paged };
}
it('does not load data without an explicit access scope', () => {
  const { host, paged } = setup();
  render(<ViewPage scopeKey="" definitionId="orders" host={host} />);
  expect(screen.getByRole('alert').textContent).toContain('scopeKey');
  expect(host.loadDefinition).not.toHaveBeenCalled();
  expect(paged).not.toHaveBeenCalled();
});

it('keeps same-scope drafts across host reference changes and resets on an explicit scope change', async () => {
  const { host, paged } = setup();
  const page = render(
    <ViewPage
      scopeKey="user-one"
      definitionId="orders"
      host={Object.freeze(host)}
    />,
  );
  await screen.findByRole('cell', { name: '42' });
  fireEvent.change(screen.getByRole('textbox', { name: '金额值' }), {
    target: { value: '500' },
  });
  const resolveSource = vi.fn(host.resolveSource);
  const nextHost = { ...host, resolveSource };
  page.rerender(
    <ViewPage scopeKey="user-one" definitionId="orders" host={nextHost} />,
  );
  await waitFor(() =>
    expect(
      (screen.getByRole('textbox', { name: '金额值' }) as HTMLInputElement)
        .value,
    ).toBe('500'),
  );
  expect(paged).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  await waitFor(() => expect(resolveSource).toHaveBeenCalledOnce());
  page.rerender(
    <ViewPage
      scopeKey="user-one"
      definitionId="orders"
      host={{
        ...nextHost,
        getInstancePermissions: () => ({
          save: false,
          saveAsPersonal: true,
          saveAsShared: false,
        }),
      }}
    />,
  );
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: '保存' })).toBeNull(),
  );
  expect(screen.getByRole('button', { name: '另存为' })).toBeTruthy();
  page.rerender(
    <ViewPage scopeKey="user-two" definitionId="orders" host={nextHost} />,
  );
  await waitFor(() =>
    expect(
      (screen.getByRole('textbox', { name: '金额值' }) as HTMLInputElement)
        .value,
    ).toBe('10'),
  );
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(3));
});

it('does not rerender record cells for an unsubmitted filter edit', async () => {
  const { host, paged } = setup();
  const Cell = vi.fn(({ value }: { value: unknown }) => (
    <span>{String(value)}</span>
  ));
  const extendedDefinition = {
    ...definition,
    fields: definition.fields.map(field => ({
      ...field,
      cellRenderer: { name: 'amount' },
    })),
  };
  render(
    <ViewPage
      scopeKey="user-one"
      definitionId="orders"
      host={host}
      definition={extendedDefinition}
      extensions={{ cells: { amount: Cell } }}
    />,
  );
  await screen.findByRole('cell', { name: '42' });
  const calls = Cell.mock.calls.length;
  fireEvent.change(screen.getByRole('textbox', { name: '金额值' }), {
    target: { value: '500' },
  });
  await screen.findByText('筛选未生效');
  expect(Cell.mock.calls).toHaveLength(calls);
  expect(paged).toHaveBeenCalledTimes(1);
  paged.mockResolvedValue({ list: [{ id: 0, amount: 500 }], total: 1 });
  fireEvent.click(screen.getByRole('button', { name: '查询' }));
  await screen.findByRole('cell', { name: '500' });
});

it('owns a working engine across StrictMode replay and stops on unmount', async () => {
  const { host } = setup();
  const view = render(
    <StrictMode>
      <ViewPage scopeKey="test-user" definitionId="orders" host={host} />
    </StrictMode>,
  );
  expect(await screen.findByRole('cell', { name: '42' })).toBeTruthy();
  view.unmount();
  expect(host.loadDefinition).toHaveBeenCalledTimes(2);
});
it('places query failure in the record area without claiming an empty result or unknown page count', async () => {
  const { host, paged } = setup();
  paged.mockRejectedValueOnce(new Error('订单服务不可用'));
  render(<ViewPage scopeKey="test-user" definitionId="orders" host={host} />);
  const failure = await screen.findByRole('alert');
  expect(failure.closest('table')).toBe(screen.getByRole('table'));
  expect(failure.textContent).toContain('订单服务不可用');
  expect(screen.queryByRole('img', { name: '暂无记录' })).toBeNull();
  expect(screen.queryByText('本页 0 条记录')).toBeNull();
  expect(screen.queryByText('第 1 / – 页')).toBeNull();
  fireEvent.click(within(failure).getByRole('button', { name: '重试查询' }));
  expect(await screen.findByRole('cell', { name: '42' })).toBeTruthy();
  expect(screen.getByText('共 1 条记录')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});
it('keeps filter edits manual, blocks saves while pending, then saves applied configuration', async () => {
  const { host, paged } = setup();
  render(<ViewPage scopeKey="test-user" definitionId="orders" host={host} />);
  await screen.findByRole('cell', { name: '42' });
  const amount = screen.getByRole('textbox', { name: '金额值' });
  fireEvent.change(amount, { target: { value: '20' } });
  expect(paged).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: '视图选项' }));
  expect(
    (await screen.findByRole('menuitem', { name: '另存为' })).getAttribute(
      'aria-disabled',
    ),
  ).toBe('true');
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(2));
  expect(paged.mock.calls[1][0].filter).toEqual(filter.gte('amount', 20));
  fireEvent.click(screen.getByRole('button', { name: '保存', exact: true }));
  await waitFor(() => expect(host.saveInstance).toHaveBeenCalledTimes(1));
  await waitFor(() =>
    expect(
      (
        screen.getByRole('button', {
          name: '保存',
          exact: true,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true),
  );
  expect(
    screen.getByRole('status', { name: '保存状态' }).textContent,
  ).toContain('视图已保存');
});
it('describes applied filters while drafts remain pending', async () => {
  const { host } = setup();
  render(<ViewPage scopeKey="test-user" definitionId="orders" host={host} />);
  await screen.findByRole('cell', { name: '42' });
  expect(screen.getByLabelText('已应用 1 项筛选').textContent).toBe('1');
  fireEvent.change(screen.getByRole('textbox', { name: '金额值' }), {
    target: { value: '20' },
  });
  const toggle = screen.getByRole('button', { name: '收起筛选' });
  act(() => toggle.focus());
  expect((await screen.findByRole('tooltip')).textContent).toContain(
    '金额 大于等于 10',
  );
  expect(screen.getByRole('tooltip').textContent).not.toContain(
    '金额 大于等于 20',
  );
  fireEvent.click(toggle);
  expect(
    screen.getByRole('button', { name: '展开筛选' }).textContent,
  ).toContain('待查询');
});
it.each(['personal', 'shared'])(
  'save-as radios explain visibility and respect %s-only permission',
  async allowed => {
    const { host } = setup();
    host.getInstancePermissions = () => ({
      save: true,
      saveAsPersonal: allowed === 'personal',
      saveAsShared: allowed === 'shared',
    });
    render(<ViewPage scopeKey="test-user" definitionId="orders" host={host} />);
    await screen.findByRole('cell', { name: '42' });
    fireEvent.click(screen.getByRole('button', { name: '视图选项' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: '另存为' }));
    const dialog = within(
      await screen.findByRole('dialog', { name: '另存为视图' }),
    );
    const group = within(dialog.getByRole('radiogroup', { name: '可见范围' }));
    const selected = group.getByRole('radio', {
      name: allowed === 'personal' ? '个人视图' : '公共视图',
    });
    const unavailable = group.getByRole('radio', {
      name: allowed === 'personal' ? '公共视图' : '个人视图',
    });
    expect(selected.getAttribute('aria-checked')).toBe('true');
    expect(unavailable.getAttribute('aria-disabled')).toBe('true');
    expect(group.getByText(/仅自己可见/)).toBeTruthy();
    expect(group.getByText(/对有访问权限的用户可见/)).toBeTruthy();
    fireEvent.click(unavailable);
    expect(selected.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(dialog.getByRole('button', { name: '创建视图' }));
    await waitFor(() => expect(host.createInstance).toHaveBeenCalledTimes(1));
    expect(vi.mocked(host.createInstance!).mock.calls[0][0].scope).toEqual(
      allowed === 'personal'
        ? { type: 'personal' }
        : { type: 'public', source: 'shared' },
    );
  },
);

it('navigation collapse retains the filter buffer and does not query', async () => {
  const { host, paged } = setup();
  render(<ViewPage scopeKey="test-user" definitionId="orders" host={host} />);
  await screen.findByRole('cell', { name: '42' });
  fireEvent.change(screen.getByRole('textbox', { name: '金额值' }), {
    target: { value: '99' },
  });
  fireEvent.click(screen.getByRole('button', { name: '收起视图列表' }));
  expect(screen.queryByRole('complementary', { name: '视图列表' })).toBeNull();
  expect(
    (screen.getByRole('textbox', { name: '金额值' }) as HTMLInputElement).value,
  ).toBe('99');
  expect(paged).toHaveBeenCalledTimes(1);
});
it('collapses filters without unmounting editors, applying drafts or clearing selection', async () => {
  const { host, paged } = setup();
  render(
    <ViewPage
      scopeKey="test-user"
      definitionId="orders"
      host={host}
      selectable
    />,
  );
  await screen.findByRole('cell', { name: '42' });
  const amount = screen.getByRole('textbox', {
    name: '金额值',
  }) as HTMLInputElement;
  fireEvent.change(amount, { target: { value: '99' } });
  expect(screen.getByText('筛选未生效')).toBeTruthy();
  expect(screen.queryByText('筛选待查询')).toBeNull();
  fireEvent.click(screen.getByRole('checkbox', { name: '选择记录 0' }));
  fireEvent.click(screen.getByRole('button', { name: '收起筛选' }));
  const toggle = screen.getByRole('button', { name: '展开筛选' });
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(toggle.textContent).toContain('待查询');
  expect(screen.queryByText('筛选未生效')).toBeNull();
  expect(screen.queryByRole('textbox', { name: '金额值' })).toBeNull();
  expect(amount.isConnected).toBe(true);
  expect(amount.value).toBe('99');
  expect(
    screen
      .getByRole('checkbox', { name: '选择记录 0' })
      .getAttribute('aria-checked'),
  ).toBe('true');
  expect(
    (screen.getByRole('button', { name: '保存' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(paged).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: '取消选择' }));
  expect(
    screen
      .getByRole('checkbox', { name: '选择记录 0' })
      .getAttribute('aria-checked'),
  ).toBe('false');
  expect(document.activeElement).toBe(
    screen.getByRole('group', { name: '表格工具栏' }),
  );
  expect(paged).toHaveBeenCalledTimes(1);
  fireEvent.click(toggle);
  expect(screen.getByRole('textbox', { name: '金额值' })).toBe(amount);
  fireEvent.click(screen.getByRole('button', { name: '查询', exact: true }));
  await waitFor(() => expect(paged).toHaveBeenCalledTimes(2));
  expect(paged.mock.lastCall?.[0].filter).toEqual(filter.gte('amount', 99));
});
it('business refresh stays bound to its instance after navigation', async () => {
  const { host, paged } = setup();
  let context: GlobalActionsRendererProps | undefined;
  function Actions(props: GlobalActionsRendererProps) {
    context = props;
    return <button>业务操作</button>;
  }
  const engine = new ViewEngine({
    definitionId: definition.id,
    definition: {
      ...definition,
      recordActions: { global: { name: 'actions' } },
    },
    host,
  });
  await engine.load();
  render(
    <ViewPageContent
      engine={engine}
      extensions={{ globalActions: { actions: Actions } }}
    />,
  );
  const previous = context!;
  await act(() => engine.selectInstance('system'));
  await act(() => previous.refresh());
  expect(engine.getSnapshot().selectedInstanceId).toBe('system');
  expect(paged).toHaveBeenCalledTimes(3);
  engine.dispose();
});

it('separates global and table actions while sharing the applied query context', async () => {
  const { host, paged } = setup();
  let tableContext: GlobalActionsRendererProps | undefined;
  const engine = new ViewEngine({
    definitionId: definition.id,
    definition: {
      ...definition,
      recordActions: { global: { name: 'create' }, table: { name: 'batch' } },
    },
    host,
  });
  await engine.load();
  render(
    <ViewPageContent
      engine={engine}
      selectable
      extensions={{
        globalActions: { create: () => <button>新建记录</button> },
        tableActions: {
          batch: props => {
            tableContext = props;
            return <button>批量处理</button>;
          },
        },
      }}
    />,
  );
  const global = within(screen.getByRole('group', { name: '全局工具栏' }));
  const table = within(screen.getByRole('group', { name: '表格工具栏' }));
  expect(global.getByRole('heading', { name: '订单管理' })).toBeTruthy();
  expect(global.getByRole('button', { name: '新建记录' })).toBeTruthy();
  expect(global.queryByRole('button', { name: '批量处理' })).toBeNull();
  expect(table.getByRole('button', { name: '批量处理' })).toBeTruthy();
  expect(table.getByRole('button', { name: '列设置' })).toBeTruthy();
  fireEvent.change(screen.getByRole('textbox', { name: '金额值' }), {
    target: { value: '99' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: '选择记录 0' }));
  expect(tableContext?.selectedRowKeys).toEqual([0]);
  expect(tableContext?.filter).toEqual(filter.gte('amount', 10));
  expect(paged).toHaveBeenCalledTimes(1);
  engine.dispose();
});

it('opens Save As from the save menu and preserves the host create contract', async () => {
  const { host } = setup();
  render(<ViewPage scopeKey="test-user" definitionId="orders" host={host} />);
  await screen.findByRole('cell', { name: '42' });
  fireEvent.click(screen.getByRole('button', { name: '视图选项' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: '另存为' }));
  const dialog = within(
    await screen.findByRole('dialog', { name: '另存为视图' }),
  );
  fireEvent.change(dialog.getByRole('textbox', { name: '视图名称' }), {
    target: { value: '工作副本' },
  });
  fireEvent.click(dialog.getByRole('button', { name: '创建视图' }));
  await waitFor(() => expect(host.createInstance).toHaveBeenCalledTimes(1));
  expect(vi.mocked(host.createInstance!).mock.calls[0][0]).toMatchObject({
    title: '工作副本',
    scope: { type: 'personal' },
    config: instance.config,
  });
});

it('returns focus to view actions after restoring without Save As permission', async () => {
  const { host } = setup();
  host.getInstancePermissions = () => ({
    save: true,
    saveAsPersonal: false,
    saveAsShared: false,
  });
  const engine = new ViewEngine({ definitionId: definition.id, host });
  await engine.load();
  engine.setTitle('修改后的订单');
  render(<ViewPageContent engine={engine} />);
  const actions = screen.getByRole('group', { name: '视图操作' });
  const trigger = screen.getByRole('button', { name: '视图选项' });
  trigger.focus();
  fireEvent.click(trigger);
  const restore = await screen.findByRole('menuitem', { name: '还原' });
  restore.focus();
  fireEvent.click(restore);
  await waitFor(() =>
    expect(engine.getSnapshot().sessions.mine.dirty).toBe(false),
  );
  await waitFor(() => expect(document.activeElement).toBe(actions));
  expect(trigger.isConnected).toBe(false);
  const save = screen.getByRole('button', {
    name: '保存',
  }) as HTMLButtonElement;
  expect(save.disabled).toBe(true);
  fireEvent.click(save);
  expect(host.saveInstance).not.toHaveBeenCalled();
  engine.dispose();
});

it('shows invalid local JSON as a load error instead of crashing the page', async () => {
  const { host } = setup();
  const malformed = {
    ...definition,
    fields: [{ ...definition.fields[0], extra: NaN }],
  };
  render(
    <ViewPage
      scopeKey="test-user"
      definitionId="orders"
      definition={malformed}
      host={host}
    />,
  );
  expect((await screen.findByRole('alert')).textContent).toContain('JSON');
  expect(host.loadDefinition).not.toHaveBeenCalled();
});

it('keeps a late save failure on its source instance after navigation', async () => {
  const { host } = setup();
  let rejectSave: (error: Error) => void = () => {};
  host.saveInstance = vi.fn(
    () =>
      new Promise<ViewInstance>((_, reject) => {
        rejectSave = reject;
      }),
  );
  const engine = new ViewEngine({ definitionId: definition.id, host });
  await engine.load();
  engine.setTitle('编辑后的订单');
  render(<ViewPageContent engine={engine} />);
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await act(() => engine.selectInstance('system'));
  await act(async () => {
    rejectSave(new Error('源实例保存失败'));
  });
  expect(screen.queryByText('源实例保存失败')).toBeNull();
  await act(() => engine.selectInstance('mine'));
  expect(screen.getByText('源实例保存失败')).toBeTruthy();
  engine.dispose();
});

it('offers reload after a revision conflict and saves the retained draft with the fresh revision', async () => {
  const { host } = setup();
  const saveInstance = vi
    .fn()
    .mockRejectedValueOnce(new Error('版本冲突'))
    .mockImplementation(async (value: ViewInstance) => ({
      ...value,
      revision: 'r3',
    }));
  host.saveInstance = saveInstance;
  host.loadInstance = vi.fn(async () => ({ ...instance, revision: 'r2' }));
  const engine = new ViewEngine({ definitionId: definition.id, host });
  await engine.load();
  engine.setTitle('我的新名称');
  render(<ViewPageContent engine={engine} />);
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await screen.findByText('版本冲突');
  fireEvent.click(screen.getByRole('button', { name: '重新加载并保留编辑' }));
  await waitFor(() =>
    expect(engine.getSnapshot().sessions.mine.instance.revision).toBe('r2'),
  );
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() => expect(saveInstance).toHaveBeenCalledTimes(2));
  expect(saveInstance.mock.calls[1][0]).toMatchObject({
    title: '我的新名称',
    revision: 'r2',
  });
  engine.dispose();
});

it('manages names and deletion together while protecting system views and pending filters', async () => {
  const { host } = setup();
  host.getInstancePermissions = () => ({
    save: true,
    saveAsPersonal: true,
    saveAsShared: false,
    rename: true,
    delete: true,
  });
  host.renameInstance = vi.fn(async (id, title) => ({
    ...instance,
    id,
    title,
    revision: 'renamed',
  }));
  host.deleteInstance = vi
    .fn()
    .mockRejectedValueOnce(new Error('删除失败，请重试'))
    .mockResolvedValue(undefined);
  render(<ViewPage scopeKey="test-user" definitionId="orders" host={host} />);
  await screen.findByRole('cell', { name: '42' });
  fireEvent.change(screen.getByRole('textbox', { name: '金额值' }), {
    target: { value: '99' },
  });
  fireEvent.click(screen.getByRole('button', { name: '视图选项' }));
  expect(
    within(await screen.findByRole('menu')).queryByRole('menuitem', {
      name: '删除视图',
    }),
  ).toBeNull();
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  fireEvent.click(screen.getAllByRole('button', { name: '管理视图' })[0]);
  const manager = within(
    await screen.findByRole('dialog', { name: '管理视图' }),
  );
  expect(manager.queryByRole('textbox', { name: '所有订单名称' })).toBeNull();
  expect(manager.queryByRole('button', { name: '删除所有订单' })).toBeNull();
  expect(manager.queryByRole('textbox')).toBeNull();
  expect(
    manager.queryByRole('button', { name: '编辑所有订单名称' }),
  ).toBeNull();
  fireEvent.click(manager.getByRole('button', { name: '编辑我的订单名称' }));
  const nameInput = manager.getByRole('textbox', { name: '我的订单名称' });
  await waitFor(() => expect(document.activeElement).toBe(nameInput));
  fireEvent.change(nameInput, { target: { value: '取消的名称' } });
  fireEvent.keyDown(nameInput, { key: 'Escape' });
  expect(manager.queryByRole('textbox')).toBeNull();
  expect(host.renameInstance).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(document.activeElement).toBe(
      manager.getByRole('button', { name: '编辑我的订单名称' }),
    ),
  );

  fireEvent.click(manager.getByRole('button', { name: '编辑我的订单名称' }));
  fireEvent.change(manager.getByRole('textbox', { name: '我的订单名称' }), {
    target: { value: '我的工作台' },
  });
  fireEvent.click(manager.getByRole('button', { name: '保存我的订单名称' }));
  await manager.findByRole('button', { name: '编辑我的工作台名称' });
  expect(manager.queryByRole('textbox')).toBeNull();
  expect(host.saveInstance).not.toHaveBeenCalled();
  expect(
    (
      screen.getByRole('textbox', {
        name: '金额值',
        hidden: true,
      }) as HTMLInputElement
    ).value,
  ).toBe('99');
  fireEvent.click(manager.getByRole('button', { name: '删除我的工作台' }));
  let confirm = within(await screen.findByRole('dialog', { name: '删除视图' }));
  fireEvent.click(confirm.getByRole('button', { name: '取消' }));
  expect(host.deleteInstance).not.toHaveBeenCalled();
  fireEvent.click(manager.getByRole('button', { name: '删除我的工作台' }));
  confirm = within(await screen.findByRole('dialog', { name: '删除视图' }));
  fireEvent.click(confirm.getByRole('button', { name: '删除视图' }));
  await waitFor(() =>
    expect(confirm.getByRole('alert').textContent).toContain('删除失败'),
  );
  fireEvent.click(confirm.getByRole('button', { name: '删除视图' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: '删除视图' })).toBeNull(),
  );
  expect(screen.getByRole('dialog', { name: '管理视图' })).toBeTruthy();
  expect(manager.queryByRole('textbox')).toBeNull();
  fireEvent.click(manager.getByRole('button', { name: '完成' }));
  expect(await screen.findByRole('cell', { name: '42' })).toBeTruthy();
});

it('manages names for prototype-like instance IDs', async () => {
  const { host } = setup();
  const value = { ...instance, id: 'constructor' };
  host.listInstances = vi
    .fn()
    .mockResolvedValue({ instances: [value], defaultInstanceId: value.id });
  host.getInstancePermissions = () => ({
    save: false,
    saveAsPersonal: false,
    saveAsShared: false,
    rename: true,
  });
  host.renameInstance = vi.fn(async (id, title) => ({ ...value, id, title }));
  render(<ViewPage scopeKey="test-user" definitionId="orders" host={host} />);
  await screen.findByRole('cell', { name: '42' });
  fireEvent.click(screen.getAllByRole('button', { name: '管理视图' })[0]);
  const manager = within(
    await screen.findByRole('dialog', { name: '管理视图' }),
  );
  expect(manager.queryByRole('textbox')).toBeNull();
  fireEvent.click(manager.getByRole('button', { name: '编辑我的订单名称' }));
  fireEvent.change(manager.getByRole('textbox', { name: '我的订单名称' }), {
    target: { value: '新的名称' },
  });
  fireEvent.click(manager.getByRole('button', { name: '保存我的订单名称' }));
  expect(
    await manager.findByRole('button', { name: '编辑新的名称名称' }),
  ).toBeTruthy();
});

it.each([false, true])(
  'opens management from the switcher footer without changing selection (empty: %s)',
  async empty => {
    const { host, paged } = setup();
    if (empty)
      host.listInstances = vi
        .fn()
        .mockResolvedValue({ instances: [], defaultInstanceId: null });
    render(
      <ViewPage
        scopeKey="test-user"
        definitionId="orders"
        host={host}
        initialSidebarCollapsed
      />,
    );
    const chooser = await screen.findByRole('combobox', {
      name: '选择视图实例',
    });
    if (!empty) await screen.findByRole('cell', { name: '42' });
    expect(screen.queryByRole('button', { name: '管理视图' })).toBeNull();
    fireEvent.click(chooser);
    const manage = await screen.findByRole('button', { name: '管理视图' });
    expect(manage.closest('[role="listbox"]')).toBeNull();
    fireEvent.click(manage);
    const dialog = within(
      await screen.findByRole('dialog', { name: '管理视图' }),
    );
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.click(dialog.getByRole('button', { name: '完成' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(chooser));
    expect(paged).toHaveBeenCalledTimes(empty ? 0 : 1);
    expect(chooser.textContent).toContain(empty ? '选择视图' : '我的订单');
  },
);

it('automatically refreshes without overlapping requests and stops when disabled', async () => {
  const { host, paged } = setup();
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  render(<ViewPage scopeKey="test-user" definitionId="orders" host={host} />);
  await screen.findByRole('cell', { name: '42' });
  fireEvent.click(screen.getByRole('button', { name: '自动刷新设置' }));
  const interval = await screen.findByRole('menuitemradio', {
    name: '每 5 分钟',
  });
  vi.useFakeTimers();
  try {
    let complete!: (value: {
      list: { id: number; amount: number }[];
      total: number;
    }) => void;
    paged.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          complete = resolve;
        }),
    );
    fireEvent.click(interval);
    const refresh = screen.getByRole('button', { name: '刷新' });
    expect(refresh.textContent).toContain('05:00');
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(refresh.textContent).toContain('04:59');
    vi.setSystemTime(Date.now() + 10000);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(refresh.textContent).toContain('04:48');
    await act(() => vi.advanceTimersByTimeAsync(287999));
    expect(refresh.textContent).toContain('00:01');
    expect(paged).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(paged).toHaveBeenCalledTimes(2);
    expect(refresh.textContent).toContain('刷新中');
    expect(screen.getByRole('cell', { name: '42' })).toBeTruthy();
    await act(() => vi.advanceTimersByTimeAsync(900000));
    expect(paged).toHaveBeenCalledTimes(2);
    await act(async () =>
      complete({ list: [{ id: 0, amount: 43 }], total: 1 }),
    );
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(refresh.textContent).toContain('05:00');
    expect(screen.getByRole('cell', { name: '43' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '自动刷新设置' }));
    fireEvent.click(
      screen.getByRole('menuitemradio', { name: '关闭自动刷新' }),
    );
    await act(() => vi.advanceTimersByTimeAsync(600000));
    expect(paged).toHaveBeenCalledTimes(2);
  } finally {
    vi.useRealTimers();
  }
});

it('expands the page without remounting filters and lets Escape close overlays first', async () => {
  const { host, paged } = setup();
  const view = render(
    <ViewPage scopeKey="test-user" definitionId="orders" host={host} />,
  );
  await screen.findByRole('cell', { name: '42' });
  const input = screen.getByRole('textbox', { name: '金额值' });
  fireEvent.change(input, { target: { value: '99' } });
  fireEvent.click(screen.getByRole('button', { name: '展开视图' }));
  expect(
    view.container.querySelector('[data-view-expanded="true"]'),
  ).toBeTruthy();
  expect(document.body.style.overflow).toBe('hidden');
  expect(screen.getByRole('textbox', { name: '金额值' })).toBe(input);
  fireEvent.click(screen.getByRole('button', { name: '列设置' }));
  const columns = await screen.findByRole('dialog', { name: '列设置' });
  fireEvent.keyDown(columns, { key: 'Escape' });
  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: '列设置' })).toBeNull(),
  );
  expect(screen.getByRole('button', { name: '收起视图' })).toBeTruthy();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: '展开视图' }),
  );
  await screen.findByRole('button', { name: '展开视图' });
  expect(document.body.style.overflow).not.toBe('hidden');
  expect((input as HTMLInputElement).value).toBe('99');
  expect(paged).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: '展开视图' }));
  view.unmount();
  expect(document.body.style.overflow).not.toBe('hidden');
});

it('pauses automatic refresh while hidden, editing or explicitly paused and cleans up on unmount', async () => {
  const { host, paged } = setup();
  const visibility = vi
    .spyOn(document, 'visibilityState', 'get')
    .mockReturnValue('hidden');
  const view = render(
    <ViewPage scopeKey="test-user" definitionId="orders" host={host} />,
  );
  await screen.findByRole('cell', { name: '42' });
  fireEvent.click(screen.getByRole('button', { name: '自动刷新设置' }));
  const interval = await screen.findByRole('menuitemradio', {
    name: '每 30 秒',
  });
  vi.useFakeTimers();
  try {
    fireEvent.click(interval);
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(paged).toHaveBeenCalledTimes(1);
    const refresh = screen.getByRole('button', { name: '刷新' });
    expect(refresh.textContent).toContain('已暂停');
    expect(refresh.getAttribute('title')).toContain('页面处于后台');
    visibility.mockReturnValue('visible');
    const input = screen.getByRole('textbox', { name: '金额值' });
    act(() => input.focus());
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(paged).toHaveBeenCalledTimes(1);
    expect(refresh.getAttribute('title')).toContain('正在编辑');
    act(() => input.blur());
    expect(refresh.textContent).toContain('00:30');
    await act(() => vi.advanceTimersByTimeAsync(10000));
    expect(refresh.textContent).toContain('00:20');
    act(() => input.focus());
    expect(refresh.textContent).toContain('已暂停');
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(paged).toHaveBeenCalledTimes(1);
    act(() => input.blur());
    expect(refresh.textContent).toContain('00:30');
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(paged).toHaveBeenCalledTimes(2);
    view.rerender(
      <ViewPage
        scopeKey="test-user"
        definitionId="orders"
        host={host}
        autoRefreshPaused
      />,
    );
    await act(() => vi.advanceTimersByTimeAsync(45000));
    expect(paged).toHaveBeenCalledTimes(2);
    view.unmount();
    await act(() => vi.advanceTimersByTimeAsync(60000));
    expect(paged).toHaveBeenCalledTimes(2);
  } finally {
    vi.useRealTimers();
  }
});
