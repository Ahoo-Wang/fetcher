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
import { FetcherViewer } from '../../src/fetcherviewer/FetcherViewer';
import type { FetcherViewerRef } from '../../src/fetcherviewer/FetcherViewer';
import { definition, saved, server } from './viewerServer';
import type { Row } from './viewerServer';

it('hides previous-view rows while switching and preserves scoped pagination and filtering', async () => {
  server.data = { list: [{ id: 'saved-row', status: 'old' }], total: 30 };
  server.views.push({
    ...saved,
    id: 'other',
    name: 'Other',
    internalCondition: { ...saved.internalCondition!, value: 'other-scope' },
  });
  const ref = createRef<FetcherViewerRef>();
  render(
    <FetcherViewer<Row>
      viewerDefinitionId={definition.id}
      defaultViewId={saved.id}
      pagination={{ showSizeChanger: false }}
      ref={ref}
    />,
  );
  await screen.findByLabelText('Status value');
  await screen.findByText('saved-row');
  server.deferData = true;
  fireEvent.click(screen.getByText('Other'));
  expect(screen.queryByText('saved-row')).toBeNull();
  await waitFor(() => expect(server.pendingData).toHaveLength(1));
  expect(ref.current?.getActiveView()?.id).toBe('other');
  expect(screen.queryByText('saved-row')).toBeNull();
  expect(server.queries.at(-1)?.condition?.children?.[0].value).toBe(
    'other-scope',
  );
  expect(Object.keys(server.queries.at(-1)!)).toEqual([
    'condition',
    'pagination',
    'sort',
  ]);
  expect(server.dataSignals.at(-1)).toBeInstanceOf(AbortSignal);

  await act(async () =>
    server.pendingData.shift()!({
      list: [{ id: 'other-page-1', status: 'current' }],
      total: 30,
    }),
  );
  await screen.findByText('other-page-1');
  fireEvent.click(screen.getByTitle('2'));
  expect(screen.queryByText('other-page-1')).toBeNull();
  await waitFor(() => expect(server.pendingData).toHaveLength(1));
  expect(ref.current?.getPageQuery()?.pagination).toEqual({
    index: 2,
    size: 10,
  });
  expect(server.queries.at(-1)?.condition?.children?.[0].value).toBe(
    'other-scope',
  );
  await act(async () =>
    server.pendingData.shift()!({
      list: [{ id: 'other-page-2', status: 'current' }],
      total: 30,
    }),
  );
  await screen.findByText('other-page-2');

  fireEvent.change(screen.getByLabelText('Status value'), {
    target: { value: 'filtered' },
  });
  fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
  expect(screen.queryByText('other-page-2')).toBeNull();
  await waitFor(() => expect(server.pendingData).toHaveLength(1));
  expect(ref.current?.getPageQuery()?.pagination).toEqual({
    index: 1,
    size: 10,
  });
  expect(
    server.queries
      .at(-1)
      ?.condition?.children?.map(condition => condition.value),
  ).toEqual(['other-scope', 'filtered']);
  await act(async () =>
    server.pendingData.shift()!({
      list: [{ id: 'filtered-row', status: 'filtered' }],
      total: 1,
    }),
  );
  await screen.findByText('filtered-row');
}, 15_000);

it('does not publish a late enhancement from the previous view', async () => {
  server.views.push({ ...saved, id: 'other', name: 'Other' });
  const ref = createRef<FetcherViewerRef>();
  let finishEnhancement: ((rows: Row[]) => void) | undefined;
  const enhance = (rows: Row[]) =>
    rows[0]?.id === 'refresh-row'
      ? new Promise<Row[]>(resolve => {
          finishEnhancement = resolve;
        })
      : rows;
  render(
    <FetcherViewer<Row>
      viewerDefinitionId={definition.id}
      defaultViewId={saved.id}
      pagination={false}
      ref={ref}
      enhanceDataSource={enhance}
    />,
  );
  await screen.findByLabelText('Status value');
  await screen.findByText('record');
  server.data = { list: [{ id: 'refresh-row', status: 'old' }], total: 1 };
  await act(async () => ref.current?.refreshData());
  await waitFor(() => expect(finishEnhancement).toBeTypeOf('function'));
  server.deferData = true;
  fireEvent.click(screen.getByText('Other'));
  await waitFor(() => expect(server.pendingData).toHaveLength(1));
  await act(async () =>
    finishEnhancement!([{ id: 'old-enhanced', status: 'old' }]),
  );
  expect(screen.queryByText('record')).toBeNull();
  expect(screen.queryByText('old-enhanced')).toBeNull();
  await act(async () =>
    server.pendingData.shift()!({
      list: [{ id: 'current-row', status: 'current' }],
      total: 1,
    }),
  );
  expect(await screen.findByText('current-row')).toBeInTheDocument();
});

it('preserves edited filters, sorting, columns and page through enhancement failure and recovery', async () => {
  const originalField = definition.fields[0];
  definition.fields[0] = { ...originalField, sorter: true };
  try {
    server.data = { list: [{ id: 'record', status: 'row' }], total: 30 };
    let rejectEnhancement = false;
    const enhance = async (rows: Row[]) => {
      if (rejectEnhancement) throw new Error('Enhancement unavailable');
      return rows;
    };
    const ref = createRef<FetcherViewerRef>();
    render(
      <FetcherViewer<Row>
        viewerDefinitionId={definition.id}
        defaultViewId={saved.id}
        ref={ref}
        pagination={{ showSizeChanger: false }}
        enhanceDataSource={enhance}
        viewTableSetting={{ title: 'Columns' }}
        actionColumn={{
          title: 'Actions',
          actions: () => ({ primaryAction: () => null, secondaryActions: [] }),
        }}
      />,
    );
    const filter = await screen.findByLabelText('Status value');
    await screen.findByText('record');
    fireEvent.change(filter, { target: { value: 'edited' } });
    fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
    await waitFor(() =>
      expect(ref.current?.getPageQuery()?.condition?.children?.[1].value).toBe(
        'edited',
      ),
    );
    fireEvent.click(screen.getByRole('columnheader', { name: 'ID' }));
    await waitFor(() =>
      expect(ref.current?.getPageQuery()?.sort).toEqual([
        { field: 'id', direction: 'ASC' },
      ]),
    );
    fireEvent.click(
      within(screen.getByRole('columnheader', { name: /Actions/ })).getByRole(
        'img',
        { name: 'setting' },
      ),
    );
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Status' }));
    fireEvent.click(filter);
    expect(screen.queryByRole('columnheader', { name: 'Status' })).toBeNull();
    fireEvent.click(screen.getByTitle('2'));
    await waitFor(() =>
      expect(ref.current?.getPageQuery()?.pagination?.index).toBe(2),
    );
    await act(async () => {});

    rejectEnhancement = true;
    await act(async () => ref.current?.refreshData());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enhancement unavailable',
    );
    expect(screen.getByLabelText('Status value')).toBe(filter);
    expect(filter).toHaveValue('edited');
    expect(screen.getByRole('columnheader', { name: 'ID' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(screen.queryByRole('columnheader', { name: 'Status' })).toBeNull();

    rejectEnhancement = false;
    await act(async () => ref.current?.refreshData());
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(screen.getByLabelText('Status value')).toBe(filter);
    expect(filter).toHaveValue('edited');
    expect(screen.getByRole('columnheader', { name: 'ID' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(screen.queryByRole('columnheader', { name: 'Status' })).toBeNull();
    expect(screen.getByTitle('2')).toHaveClass('ant-pagination-item-active');
    expect(
      ref.current
        ?.getActiveView()
        ?.columns.find(column => column.name === 'status')?.hidden,
    ).toBe(true);
    expect(ref.current?.getPageQuery()?.pagination?.index).toBe(2);
  } finally {
    definition.fields[0] = originalField;
  }
}, 15_000);
