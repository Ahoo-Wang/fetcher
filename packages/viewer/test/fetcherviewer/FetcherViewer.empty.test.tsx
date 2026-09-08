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
import { Operator } from '@ahoo-wang/fetcher-wow';
import { FetcherViewer } from '../../src/fetcherviewer/FetcherViewer';
import type { FetcherViewerRef } from '../../src/fetcherviewer/FetcherViewer';
import { definition, saved, server } from './viewerServer';

it('can recreate a view after deleting the last view and refreshing the empty viewer', async () => {
  const props = {
    viewerDefinitionId: definition.id,
    defaultViewId: saved.id,
    pagination: false as const,
  };
  const mounted = render(<FetcherViewer {...props} />);
  await screen.findByLabelText('Status value');
  await screen.findByText('record');
  fireEvent.click(screen.getAllByRole('img', { name: 'setting' })[0]);
  const manage = await screen.findByRole('dialog');
  expect(within(manage).getByText('个人视图')).toBeInTheDocument();
  fireEvent.click(within(manage).getByRole('img', { name: 'delete' }));
  fireEvent.click(await screen.findByRole('button', { name: /^确\s*认$/ }));
  await waitFor(() => expect(server.views).toEqual([]));
  await screen.findByRole('button', { name: '创建视图' });

  mounted.unmount();
  const ref = createRef<FetcherViewerRef>();
  render(<FetcherViewer {...props} ref={ref} />);
  fireEvent.click(await screen.findByRole('button', { name: '创建视图' }));
  expect(ref.current?.getActiveView()).toBeUndefined();
  fireEvent.change(screen.getByLabelText('视图名称'), {
    target: { value: 'Recreated' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));

  await waitFor(() => expect(ref.current?.getActiveView()?.id).toBe('created'));
  expect(ref.current?.getActiveView()?.name).toBe('Recreated');
  expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
  expect(screen.queryByText('未找到视图')).toBeNull();
}, 15_000);

it('waits for the authoritative created view before fetching its data', async () => {
  server.views = [];
  const ref = createRef<FetcherViewerRef>();
  const onSwitchView = vi.fn();
  render(
    <FetcherViewer
      viewerDefinitionId={definition.id}
      pagination={false}
      ref={ref}
      onSwitchView={onSwitchView}
    />,
  );
  fireEvent.click(await screen.findByRole('button', { name: '创建视图' }));
  fireEvent.change(screen.getByLabelText('视图名称'), {
    target: { value: 'Restricted view' },
  });
  server.deferLists = true;
  fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));
  await waitFor(() => expect(server.pendingList).toBeTypeOf('function'));
  await act(async () => {});

  expect(server.createCount).toBe(1);
  expect(server.queries).toEqual([]);
  expect(onSwitchView).not.toHaveBeenCalled();
  expect(ref.current?.getActiveView()).toBeUndefined();

  await act(async () => server.pendingList!());
  await waitFor(() => expect(ref.current?.getActiveView()?.id).toBe('created'));
  expect(onSwitchView).toHaveBeenCalledExactlyOnceWith(server.views[0]);
  await waitFor(() => expect(server.queries).toHaveLength(1));
  expect(server.queries[0].condition).toEqual({
    operator: Operator.AND,
    children: [
      { field: 'scope', operator: Operator.EQ, value: 'created-scope' },
    ],
  });
}, 15_000);

it.each([401, 500, 'empty'] as const)(
  'retries a %s list response after creation without submitting another command',
  async response => {
    server.views = [];
    const ref = createRef<FetcherViewerRef>();
    render(
      <FetcherViewer
        viewerDefinitionId={definition.id}
        pagination={false}
        ref={ref}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: '创建视图' }));
    fireEvent.change(screen.getByLabelText('视图名称'), {
      target: { value: 'Created once' },
    });
    if (response === 'empty') server.hideCreatedView = true;
    else server.listStatus = response;
    fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));

    const retry = await screen.findByRole('button', { name: /重\s*试/ });
    expect(screen.getByText(/视图已创建/)).toBeInTheDocument();
    expect(server.createCount).toBe(1);
    expect(server.queries).toEqual([]);
    expect(ref.current?.getActiveView()).toBeUndefined();
    expect(screen.queryByRole('button', { name: '创建视图' })).toBeNull();

    server.listStatus = 200;
    server.hideCreatedView = false;
    fireEvent.click(retry);

    await waitFor(() =>
      expect(ref.current?.getActiveView()?.id).toBe('created'),
    );
    expect(ref.current?.getActiveView()?.internalCondition).toEqual({
      field: 'scope',
      operator: Operator.EQ,
      value: 'created-scope',
    });
    await waitFor(() => expect(server.queries).toHaveLength(1));
    expect(server.queries[0].condition?.children?.[0].value).toBe(
      'created-scope',
    );
    expect(server.createCount).toBe(1);
  },
  15_000,
);

it('sends a copy of an existing view without its ID when saving as a new view', async () => {
  const ref = createRef<FetcherViewerRef>();
  render(
    <FetcherViewer
      viewerDefinitionId={definition.id}
      defaultViewId={saved.id}
      pagination={false}
      ref={ref}
    />,
  );
  fireEvent.change(await screen.findByLabelText('Status value'), {
    target: { value: 'copied-filter' },
  });
  fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
  fireEvent.click(await screen.findByRole('button', { name: /保\s*存/ }));
  fireEvent.click(await screen.findByText('另存为新视图'));
  fireEvent.change(screen.getByLabelText('视图名称'), {
    target: { value: 'Copied view' },
  });
  const originalView = ref.current?.getActiveView();
  expect(originalView?.id).toBe('saved');
  server.deferLists = true;
  fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));
  await waitFor(() => expect(server.pendingList).toBeTypeOf('function'));

  expect(server.createBodies).toHaveLength(1);
  expect(server.createBodies[0]).not.toHaveProperty('id');
  expect(server.createBodies[0]).toMatchObject({
    name: 'Copied view',
    definitionId: definition.id,
    columns: saved.columns,
    condition: {
      field: 'status',
      operator: Operator.EQ,
      value: 'copied-filter',
    },
  });
  expect(originalView?.id).toBe('saved');

  await act(async () => server.pendingList!());
  await waitFor(() => expect(ref.current?.getActiveView()?.id).toBe('created'));
  expect(ref.current?.getActiveView()?.name).toBe('Copied view');
  expect(ref.current?.getActiveView()?.internalCondition?.value).toBe(
    'created-scope',
  );
}, 15_000);
