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

import { act, renderHook, waitFor } from '@testing-library/react';
import type { UseFetchDataOptions } from '../../../src/fetcherviewer/hooks/useFetchData';
import { useFetchData } from '../../../src/fetcherviewer/hooks/useFetchData';
import { Operator, SortDirection } from '@ahoo-wang/fetcher-wow';
import { definition, saved, server } from '../viewerServer';
import type { Row } from '../viewerServer';

it('loads a new authoritative view object even when its ID and fields are unchanged', async () => {
  const { result, rerender } = renderHook(
    ({ view }) =>
      useFetchData<Row>({ viewerDefinition: definition, defaultView: view }),
    { initialProps: { view: structuredClone(saved) } },
  );
  await waitFor(() =>
    expect(result.current.dataSource?.list[0].id).toBe('record'),
  );
  const oldSignal = server.dataSignals.at(-1);
  server.deferData = true;
  rerender({ view: structuredClone(saved) });
  await waitFor(() => expect(server.pendingData).toHaveLength(1));
  expect(result.current.dataSource).toBeUndefined();
  expect(server.dataSignals.at(-1)).not.toBe(oldSignal);
  const pendingSignal = server.dataSignals.at(-1);
  rerender({ view: structuredClone(saved) });
  await waitFor(() => expect(server.pendingData).toHaveLength(2));
  expect(pendingSignal?.aborted).toBe(true);
  await act(async () =>
    server.pendingData.shift()!({
      list: [{ id: 'obsolete-row', status: 'old response' }],
      total: 1,
    }),
  );
  expect(result.current.dataSource).toBeUndefined();
  await act(async () =>
    server.pendingData.shift()!({
      list: [{ id: 'authoritative-row', status: 'same view' }],
      total: 1,
    }),
  );
  await waitFor(() =>
    expect(result.current.dataSource?.list[0].id).toBe('authoritative-row'),
  );
});

it('a retained reload only executes when the current view and URL still own its saved query', async () => {
  const view = structuredClone(saved);
  const initialProps: UseFetchDataOptions = {
    viewerDefinition: definition,
    defaultView: view,
  };
  const { result, rerender } = renderHook(
    (options: UseFetchDataOptions) => useFetchData<Row>(options),
    { initialProps },
  );
  await waitFor(() =>
    expect(result.current.dataSource?.list[0].id).toBe('record'),
  );
  const reload = result.current.reload;
  const initialCount = server.queries.length;
  rerender({ viewerDefinition: definition, defaultView: undefined });
  await act(async () => reload());
  expect(server.queries).toHaveLength(initialCount);

  rerender({ viewerDefinition: undefined, defaultView: view });
  await act(async () => reload());
  expect(server.queries).toHaveLength(initialCount);

  rerender({ viewerDefinition: definition, defaultView: view });
  await waitFor(() => expect(server.queries).toHaveLength(initialCount + 1));
  await act(async () => reload());
  expect(server.queries).toHaveLength(initialCount + 2);
  expect(server.queries.at(-1)).toEqual(result.current.getPageQuery());
});

it.each(['pagination', 'filter', 'sort'] as const)(
  'hides the previous result for a new %s query while preserving same-query reloads',
  async change => {
    const { result } = renderHook(() =>
      useFetchData<Row>({ viewerDefinition: definition, defaultView: saved }),
    );
    await waitFor(() =>
      expect(result.current.dataSource?.list[0].id).toBe('record'),
    );
    server.deferData = true;
    act(() =>
      result.current.setQuery?.(
        change === 'filter'
          ? { field: 'status', operator: Operator.EQ, value: 'changed' }
          : saved.condition!,
        change === 'pagination' ? 2 : 1,
        10,
        change === 'sort'
          ? [{ field: 'id', direction: SortDirection.DESC }]
          : [],
      ),
    );
    expect(result.current.dataSource).toBeUndefined();
    await waitFor(() => expect(server.pendingData).toHaveLength(1));
    await act(async () =>
      server.pendingData.shift()!({
        list: [{ id: 'current-query', status: 'new' }],
        total: 1,
      }),
    );
    await waitFor(() =>
      expect(result.current.dataSource?.list[0].id).toBe('current-query'),
    );
    let reload: Promise<void> | undefined;
    act(() => {
      reload = result.current.reload();
    });
    await waitFor(() => expect(server.pendingData).toHaveLength(1));
    expect(result.current.dataSource?.list[0].id).toBe('current-query');
    await act(async () => {
      server.pendingData.shift()!({
        list: [{ id: 'refreshed', status: 'same query' }],
        total: 1,
      });
      await reload;
    });
    expect(result.current.dataSource?.list[0].id).toBe('refreshed');
  },
);
