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
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { createRef } from 'react';
import { ConfigProvider } from 'antd';
import { FetcherViewer } from '../../src/fetcherviewer/FetcherViewer';
import type { FetcherViewerRef } from '../../src/fetcherviewer/FetcherViewer';
import { definition, saved, server, viewSnapshot } from './viewerServer';

it.each([
  ['create', 'PERSONAL'],
  ['create', 'SHARED'],
  ['update', 'PERSONAL'],
  ['update', 'SHARED'],
] as const)(
  'confirms the %s %s command only within its returned aggregate identity and owner',
  async (action, type) => {
    server.tenantId = 'tenant-current';
    server.ownerId = 'owner-current';
    server.views = action === 'create' ? [] : [{ ...saved, type }];
    const owner = type === 'SHARED' ? '(shared)' : server.ownerId;
    const onSwitchView = vi.fn();
    const ref = createRef<FetcherViewerRef>();
    render(
      <FetcherViewer
        viewerDefinitionId={definition.id}
        tenantId={server.tenantId}
        ownerId={server.ownerId}
        pagination={false}
        ref={ref}
        onSwitchView={onSwitchView}
      />,
    );
    if (action === 'create') {
      fireEvent.click(await screen.findByRole('button', { name: '创建视图' }));
      fireEvent.change(screen.getByLabelText('视图名称'), {
        target: { value: 'Created' },
      });
      if (type === 'SHARED')
        fireEvent.click(screen.getByRole('radio', { name: '共享视图' }));
    } else {
      fireEvent.change(await screen.findByLabelText('Status value'), {
        target: { value: 'edited' },
      });
      fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
      fireEvent.click(await screen.findByRole('button', { name: /保\s*存/ }));
      fireEvent.click(await screen.findByText('覆盖当前视图'));
    }
    server.deferLists = true;
    fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));
    await waitFor(() => expect(server.pendingList).toBeTypeOf('function'));
    const target = viewSnapshot(server.views[0]);
    const wrongView = {
      ...target.state,
      name: 'Wrong scope',
      internalCondition: { ...saved.internalCondition!, value: 'wrong-scope' },
    };
    server.snapshots = [
      viewSnapshot(wrongView, { tenantId: '(0)', version: 99 }),
      viewSnapshot(wrongView, {
        ownerId: owner === '(shared)' ? server.ownerId : '(shared)',
        version: 99,
      }),
    ];
    const queryCount = server.queries.length;
    await act(async () => server.pendingList!());
    expect(onSwitchView).not.toHaveBeenCalled();
    expect(ref.current?.getActiveView()).toBeUndefined();
    expect(server.queries).toHaveLength(queryCount);
    const retry = await screen.findByRole('button', { name: /重\s*试/ });
    const expectedPath =
      action === 'create' ? `/view/type/${type}` : `/view/saved/type/${type}`;
    expect(server.commandPaths[0]).toBe(
      `/viewer/tenant/tenant-current/owner/${owner}${expectedPath}`,
    );

    server.snapshots.push(target);
    server.deferLists = false;
    fireEvent.click(retry);
    await waitFor(() =>
      expect(onSwitchView).toHaveBeenCalledExactlyOnceWith(target.state),
    );
    await waitFor(() => expect(server.queries).toHaveLength(queryCount + 1));
    expect(server.queries.at(-1)?.condition?.children?.[0].value).toBe(
      action === 'create' ? 'created-scope' : 'server-scope',
    );
    expect(server.createCount + server.editCount).toBe(1);
  },
  15_000,
);

it.each([false, true])(
  'preserves selected snapshot identity and draft across list refresh (target missing: %s)',
  async missing => {
    server.tenantId = 'interceptor-tenant';
    const selected = {
      ...saved,
      internalCondition: {
        ...saved.internalCondition!,
        value: 'selected-scope',
      },
    };
    const other = { ...saved, id: 'other', name: 'Other' };
    const selectedSnapshot = viewSnapshot(selected, {
      tenantId: 'component-tenant',
      ownerId: 'component-owner',
    });
    server.snapshots = [selectedSnapshot, viewSnapshot(other)];
    const originalFetch = globalThis.fetch;
    const deletePaths: string[] = [];
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'DELETE')
        deletePaths.push(new URL(String(input)).pathname);
      return originalFetch(input, init);
    });
    const ref = createRef<FetcherViewerRef>();
    render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <FetcherViewer
          viewerDefinitionId={definition.id}
          tenantId="component-tenant"
          ownerId="component-owner"
          pagination={false}
          ref={ref}
        />
      </ConfigProvider>,
    );
    const filter = await screen.findByLabelText('Status value');
    fireEvent.change(filter, { target: { value: 'draft' } });
    fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
    const draft = structuredClone(ref.current?.getActiveView());
    const wrong = {
      ...selected,
      name: 'Wrong scope',
      internalCondition: { ...saved.internalCondition!, value: 'wrong-scope' },
    };
    server.snapshots = [
      viewSnapshot(wrong, { tenantId: '(0)', ownerId: 'component-owner' }),
      viewSnapshot(wrong, {
        tenantId: 'component-tenant',
        ownerId: '(shared)',
      }),
      ...(missing ? [] : [structuredClone(selectedSnapshot)]),
    ];
    server.deferLists = true;
    fireEvent.click(screen.getAllByRole('img', { name: 'setting' })[0]);
    const manage = (await screen.findByText('个人视图')).closest(
      '[role="dialog"]',
    ) as HTMLElement;
    const otherRow = within(manage)
      .getByText('Other')
      .closest('.ant-flex') as HTMLElement;
    fireEvent.click(within(otherRow).getByRole('img', { name: 'delete' }));
    const prompt = (await screen.findByText('确认删除此视图？')).closest(
      '.ant-popconfirm',
    ) as HTMLElement;
    fireEvent.click(within(prompt).getByRole('button', { name: /^确\s*认$/ }));
    await waitFor(() => expect(server.pendingList).toBeTypeOf('function'));
    expect(deletePaths).toEqual([
      '/viewer/tenant/component-tenant/owner/component-owner/view/other',
    ]);
    expect(screen.getByLabelText('Status value')).toBe(filter);
    expect(ref.current?.getActiveView()).toEqual(draft);
    await act(async () => server.pendingList!());
    expect(screen.getByLabelText('Status value')).toBe(filter);
    expect(ref.current?.getActiveView()).toEqual(draft);
    fireEvent.change(filter, { target: { value: 'after-refresh' } });
    fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
    await waitFor(() =>
      expect(server.queries.at(-1)?.condition?.children?.[1].value).toBe(
        'after-refresh',
      ),
    );
    expect(server.queries.at(-1)?.condition?.children?.[0].value).toBe(
      'selected-scope',
    );
  },
  15_000,
);
