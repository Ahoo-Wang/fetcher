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
} from '@testing-library/react';
import { createRef } from 'react';
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
