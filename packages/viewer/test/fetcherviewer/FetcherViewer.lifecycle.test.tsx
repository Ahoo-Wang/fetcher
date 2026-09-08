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
import { Operator } from '@ahoo-wang/fetcher-wow';
import { createRef } from 'react';
import { FetcherViewer } from '../../src/fetcherviewer/FetcherViewer';
import type { FetcherViewerRef } from '../../src/fetcherviewer/FetcherViewer';
import { definition, saved, server } from './viewerServer';

it('uses the refreshed saved view for inputs, columns and internal query conditions', async () => {
  server.data = { list: [{ id: 'before-save', status: 'old row' }], total: 1 };
  const ref = createRef<FetcherViewerRef>();
  const onSwitchView = vi.fn();
  render(
    <FetcherViewer
      viewerDefinitionId={definition.id}
      defaultViewId={saved.id}
      pagination={false}
      ref={ref}
      onSwitchView={onSwitchView}
    />,
  );
  fireEvent.change(await screen.findByLabelText('Status value'), {
    target: { value: 'edited' },
  });
  fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
  fireEvent.click(await screen.findByRole('button', { name: /保\s*存/ }));
  fireEvent.click(await screen.findByText('覆盖当前视图'));
  await waitFor(() =>
    expect(server.queries.at(-1)?.condition?.children?.[1].value).toBe(
      'edited',
    ),
  );
  await screen.findByText('before-save');
  const queryCount = server.queries.length;
  server.deferLists = true;
  server.deferData = true;
  fireEvent.click(await screen.findByRole('button', { name: /^确\s*认$/ }));
  await waitFor(() => expect(server.pendingList).toBeTypeOf('function'));
  await act(async () => {});
  expect(server.queries).toHaveLength(queryCount);
  expect(onSwitchView).not.toHaveBeenCalled();
  expect(ref.current?.getActiveView()).toBeUndefined();
  await act(async () => server.pendingList!());

  await waitFor(() =>
    expect(ref.current?.getActiveView()?.internalCondition?.value).toBe(
      'server-scope',
    ),
  );
  expect(screen.getByLabelText('Status value')).toHaveValue('edited');
  expect(screen.queryByRole('columnheader', { name: 'Status' })).toBeNull();
  expect(onSwitchView).toHaveBeenCalledExactlyOnceWith(server.views[0]);
  await waitFor(() => expect(server.queries).toHaveLength(queryCount + 1));
  expect(screen.queryByText('before-save')).toBeNull();
  await act(async () =>
    server.pendingData.shift()!({
      list: [{ id: 'after-save', status: 'server row' }],
      total: 1,
    }),
  );
  expect(await screen.findByText('after-save')).toBeInTheDocument();
  await waitFor(() =>
    expect(server.queries.at(-1)?.condition?.children?.[0]).toEqual({
      field: 'scope',
      operator: Operator.EQ,
      value: 'server-scope',
    }),
  );
}, 15_000);

async function openSaveConfirmation() {
  fireEvent.change(await screen.findByLabelText('Status value'), {
    target: { value: 'edited' },
  });
  fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
  fireEvent.click(await screen.findByRole('button', { name: /保\s*存/ }));
  fireEvent.click(await screen.findByText('覆盖当前视图'));
  await waitFor(() =>
    expect(server.queries.at(-1)?.condition?.children?.[1].value).toBe(
      'edited',
    ),
  );
}

it.each([401, 500, 'empty'] as const)(
  'retries a %s list response after updating without repeating the update',
  async response => {
    const ref = createRef<FetcherViewerRef>();
    render(
      <FetcherViewer
        viewerDefinitionId={definition.id}
        pagination={false}
        ref={ref}
      />,
    );
    await openSaveConfirmation();
    server.queries.length = 0;
    if (response === 'empty') server.hideCreatedView = true;
    else server.listStatus = response;
    fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));

    const retry = await screen.findByRole('button', { name: /重\s*试/ });
    expect(screen.getByText(/视图已更新/)).toBeInTheDocument();
    expect(server.editCount).toBe(1);
    expect(server.queries).toEqual([]);
    expect(ref.current?.getActiveView()).toBeUndefined();

    server.listStatus = 200;
    server.hideCreatedView = false;
    fireEvent.click(retry);
    await waitFor(() =>
      expect(ref.current?.getActiveView()?.internalCondition?.value).toBe(
        'server-scope',
      ),
    );
    await waitFor(() => expect(server.queries).toHaveLength(1));
    expect(server.queries[0].condition?.children?.[0].value).toBe(
      'server-scope',
    );
    expect(server.editCount).toBe(1);
  },
  15_000,
);

it('waits beyond the latest list received while an update command was pending', async () => {
  server.views.push({ ...saved, id: 'other', name: 'Other' });
  const ref = createRef<FetcherViewerRef>();
  const onSwitchView = vi.fn();
  render(
    <FetcherViewer
      viewerDefinitionId={definition.id}
      defaultViewId={saved.id}
      pagination={false}
      ref={ref}
      onSwitchView={onSwitchView}
    />,
  );
  await openSaveConfirmation();
  server.deferEdits = true;
  fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));
  await waitFor(() => expect(server.pendingEdit).toBeTypeOf('function'));

  // Removing a different view refreshes the list while the update is still pending.
  fireEvent.click(screen.getAllByRole('img', { name: 'setting' })[0]);
  const manage = (await screen.findByText('个人视图')).closest(
    '[role="dialog"]',
  ) as HTMLElement;
  const otherRow = within(manage)
    .getByText('Other')
    .closest('.ant-flex') as HTMLElement;
  fireEvent.click(within(otherRow).getByRole('img', { name: 'delete' }));
  const deletePrompt = (await screen.findByText('确认删除此视图？')).closest(
    '.ant-popconfirm',
  ) as HTMLElement;
  fireEvent.click(
    within(deletePrompt).getByRole('button', { name: /^确\s*认$/ }),
  );
  await waitFor(() => expect(server.listCount).toBe(2));
  await screen.findByLabelText('Status value');
  await act(async () => {});
  expect(ref.current?.getActiveView()?.internalCondition?.value).toBe(
    'original-scope',
  );
  onSwitchView.mockClear();
  server.queries.length = 0;

  server.deferLists = true;
  await act(async () => server.pendingEdit!());
  await waitFor(() => expect(server.pendingList).toBeTypeOf('function'));
  await act(async () => {});
  expect(onSwitchView).not.toHaveBeenCalled();
  expect(server.queries).toEqual([]);
  expect(ref.current?.getActiveView()).toBeUndefined();

  await act(async () => server.pendingList!());
  await waitFor(() =>
    expect(ref.current?.getActiveView()?.internalCondition?.value).toBe(
      'server-scope',
    ),
  );
  expect(onSwitchView).toHaveBeenCalledExactlyOnceWith(server.views[0]);
  await waitFor(() => expect(server.queries).toHaveLength(1));
  expect(server.queries[0].condition?.children?.[0].value).toBe('server-scope');
}, 15_000);

it('shows an enhancement failure and recovers when the enhancer changes', async () => {
  const props = {
    viewerDefinitionId: definition.id,
    defaultViewId: saved.id,
    pagination: false as const,
  };
  const enhance = async () => {
    throw new Error('Enrichment unavailable');
  };
  const { rerender } = render(
    <FetcherViewer {...props} enhanceDataSource={enhance} />,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Enrichment unavailable',
  );

  rerender(<FetcherViewer {...props} enhanceDataSource={rows => rows} />);
  await screen.findByRole('columnheader', { name: 'ID' });
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  expect(screen.getByText('record')).toBeInTheDocument();
});

it('keeps empty-view creation available when enhancement fails without an active view', async () => {
  server.views = [];
  render(
    <FetcherViewer
      viewerDefinitionId={definition.id}
      pagination={false}
      enhanceDataSource={async () => {
        throw new Error('No rows to enhance');
      }}
    />,
  );
  expect(
    await screen.findByRole('button', { name: '创建视图' }),
  ).toBeInTheDocument();
});
