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
import { CommandHeaders, CommandStage } from '@ahoo-wang/fetcher-wow';
import { createRef } from 'react';
import { ConfigProvider } from 'antd';
import { FetcherViewer } from '../../src/fetcherviewer/FetcherViewer';
import type { FetcherViewerRef } from '../../src/fetcherviewer/FetcherViewer';
import { definition, saved, server } from './viewerServer';

async function saveChanges() {
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
  fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));
}

it('keeps a lagging same-ID snapshot pending until retry reaches the command version', async () => {
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
  await screen.findByLabelText('Status value');
  const previousViews = structuredClone(server.views);
  server.deferLists = true;
  await saveChanges();
  await waitFor(() => expect(server.pendingList).toBeTypeOf('function'));
  const savedViews = server.views;
  const commandVersion = server.versions.saved;
  const queryCount = server.queries.length;

  // The command completed, but the first refreshed read model is still at version 1.
  server.views = previousViews;
  server.versions.saved = commandVersion - 1;
  await act(async () => server.pendingList!());
  const retry = await screen.findByRole('button', { name: /重\s*试/ });
  expect(onSwitchView).not.toHaveBeenCalled();
  expect(ref.current?.getActiveView()).toBeUndefined();
  expect(server.queries).toHaveLength(queryCount);
  await act(async () => ref.current?.refreshData());
  expect(server.queries).toHaveLength(queryCount);
  expect(server.editCount).toBe(1);
  expect(server.commandHeaders[0].get(CommandHeaders.WAIT_STAGE)).toBe(
    CommandStage.PROCESSED,
  );

  server.views = savedViews;
  server.versions.saved = commandVersion;
  server.deferLists = false;
  fireEvent.click(retry);
  await waitFor(() =>
    expect(ref.current?.getActiveView()?.internalCondition?.value).toBe(
      'server-scope',
    ),
  );
  expect(screen.getByLabelText('Status value')).toHaveValue('edited');
  expect(screen.queryByRole('columnheader', { name: 'Status' })).toBeNull();
  expect(onSwitchView).toHaveBeenCalledExactlyOnceWith(savedViews[0]);
  await waitFor(() => expect(server.queries).toHaveLength(queryCount + 1));
  expect(server.queries.at(-1)?.condition?.children?.[0].value).toBe(
    'server-scope',
  );
  expect(server.editCount).toBe(1);
  await act(async () => ref.current?.refreshData());
  expect(server.queries).toHaveLength(queryCount + 2);
  expect(server.queries.at(-1)?.condition?.children?.[0].value).toBe(
    'server-scope',
  );
}, 15_000);

it.each([null, Number.POSITIVE_INFINITY])(
  'recovers browsing after an invalid command version %s without repeating the update',
  async version => {
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
    server.commandVersion = version;
    await saveChanges();
    const error = await screen.findByRole('alert');
    expect(error).toHaveTextContent('命令未返回有效版本，无法确认保存结果。');
    expect(onSwitchView).not.toHaveBeenCalled();
    expect(ref.current?.getActiveView()).toBeUndefined();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: '重新加载视图' }),
      ).not.toBeDisabled(),
    );
    const listCount = server.listCount;
    fireEvent.click(screen.getByRole('button', { name: '重新加载视图' }));
    await waitFor(() => expect(server.listCount).toBe(listCount + 1));
    await screen.findByLabelText('Status value');
    await waitFor(() =>
      expect(ref.current?.getActiveView()?.id).toBe(saved.id),
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(server.editCount).toBe(1);
    expect(onSwitchView).not.toHaveBeenCalled();
  },
  15_000,
);

it('accepts a created snapshot at version zero and requests the processed command stage', async () => {
  server.views = [];
  server.commandVersion = 0;
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
    target: { value: 'Zero version' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));
  await waitFor(() => expect(ref.current?.getActiveView()?.id).toBe('created'));
  expect(server.commandHeaders[0].get(CommandHeaders.WAIT_STAGE)).toBe(
    CommandStage.PROCESSED,
  );
  expect(server.createCount).toBe(1);
  await waitFor(() => expect(server.queries).toHaveLength(1));
  expect(server.queries[0].condition?.children?.[0].value).toBe(
    'created-scope',
  );
}, 15_000);

it('keeps rejected update drafts editable and saves corrected changes on retry', async ({
  onTestFinished,
}) => {
  const originalFields = definition.fields;
  definition.fields = originalFields.map(field => ({ ...field, sorter: true }));
  onTestFinished(() => {
    definition.fields = originalFields;
  });
  const ref = createRef<FetcherViewerRef>();
  const onSwitchView = vi.fn();
  render(
    <FetcherViewer
      viewerDefinitionId={definition.id}
      defaultViewId={saved.id}
      pagination={false}
      ref={ref}
      onSwitchView={onSwitchView}
      actionColumn={{
        title: 'Actions',
        actions: () => ({ primaryAction: () => null, secondaryActions: [] }),
      }}
      viewTableSetting={{ title: 'Columns' }}
    />,
    {
      wrapper: ({ children }) => (
        <ConfigProvider theme={{ token: { motion: false } }}>
          {children}
        </ConfigProvider>
      ),
    },
  );
  fireEvent.change(await screen.findByLabelText('Status value'), {
    target: { value: 'edited' },
  });
  fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
  fireEvent.click(screen.getByRole('columnheader', { name: 'Status' }));
  fireEvent.click(
    within(screen.getByRole('columnheader', { name: /Actions/ })).getByRole(
      'img',
      { name: 'setting' },
    ),
  );
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Status' }));
  const draft = structuredClone(ref.current?.getActiveView());
  expect(draft?.sorter).toEqual([{ field: 'status', direction: 'ASC' }]);
  expect(draft?.columns.find(column => column.name === 'status')?.hidden).toBe(
    true,
  );
  server.commandError = {
    errorCode: 'PolicyDenied',
    errorMsg: '不允许修改此视图',
  };
  fireEvent.click(screen.getByRole('button', { name: /保\s*存/ }));
  fireEvent.click(await screen.findByText('覆盖当前视图'));
  fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));
  const error = await screen.findByRole('alert');
  expect(error).toHaveTextContent('不允许修改此视图');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(server.versions.saved).toBe(1);
  expect(server.listCount).toBe(1);
  expect(onSwitchView).not.toHaveBeenCalled();
  expect(ref.current?.getActiveView()).toEqual(draft);
  expect(screen.getByLabelText('Status value')).toHaveValue('edited');
  expect(screen.queryByRole('columnheader', { name: 'Status' })).toBeNull();
  expect(server.editCount).toBe(1);

  server.commandError = undefined;
  fireEvent.change(screen.getByLabelText('Status value'), {
    target: { value: 'corrected' },
  });
  fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
  fireEvent.click(screen.getByRole('button', { name: /保\s*存/ }));
  fireEvent.click(await screen.findByText('覆盖当前视图'));
  fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));
  await waitFor(() =>
    expect(onSwitchView).toHaveBeenCalledExactlyOnceWith(server.views[0]),
  );
  expect(screen.getByLabelText('Status value')).toHaveValue('corrected');
  expect(ref.current?.getActiveView()?.sorter).toEqual(draft?.sorter);
  expect(
    ref.current
      ?.getActiveView()
      ?.columns.find(column => column.name === 'status')?.hidden,
  ).toBe(true);
  expect(server.views[0].condition.value).toBe('corrected');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(server.editCount).toBe(2);
}, 15_000);

it('shows a rejected creation instead of waiting for a nonexistent successful view', async () => {
  server.views = [];
  server.versions.created = 0;
  server.commandError = {
    errorCode: 'NameAlreadyExists',
    errorMsg: '视图名称已存在',
  };
  const onSwitchView = vi.fn();
  render(
    <FetcherViewer
      viewerDefinitionId={definition.id}
      pagination={false}
      onSwitchView={onSwitchView}
    />,
  );
  fireEvent.click(await screen.findByRole('button', { name: '创建视图' }));
  fireEvent.change(screen.getByLabelText('视图名称'), {
    target: { value: 'Duplicate' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));
  const error = await screen.findByRole('alert');
  expect(error).toHaveTextContent('视图名称已存在');
  expect(server.listCount).toBe(1);
  expect(server.queries).toEqual([]);
  expect(onSwitchView).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '重新加载视图' }));
  await screen.findByRole('button', { name: '创建视图' });
  expect(server.createCount).toBe(1);
  expect(onSwitchView).not.toHaveBeenCalled();
}, 15_000);
