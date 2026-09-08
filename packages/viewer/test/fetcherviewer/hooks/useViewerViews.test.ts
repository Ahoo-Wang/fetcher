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
import { useViewerViews } from '../../../src/fetcherviewer/hooks/useViewerViews';
import { definition, saved, viewSnapshot } from '../viewerServer';
import type { ListQuery, MaterializedSnapshot } from '@ahoo-wang/fetcher-wow';
import type { ViewState } from '../../../src/viewer/types';

const target = {
  contextName: 'viewer',
  aggregateName: 'view',
  aggregateId: 'outside-list',
  tenantId: '(0)',
  ownerId: '(0)',
};

it('confirms a target beyond the display limit with a scoped query in one load', async () => {
  const requests: ListQuery[] = [];
  const displayed = viewSnapshot(saved);
  const confirmed = viewSnapshot(
    { ...saved, id: target.aggregateId },
    { version: 2 },
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input, init) => {
      const query = JSON.parse(init.body) as ListQuery;
      requests.push(query);
      return Response.json(query.limit === 999 ? [displayed] : [confirmed]);
    }),
  );
  const { result, rerender } = renderHook(
    ({ selected }) => useViewerViews(definition.id, '(0)', '(0)', selected),
    { initialProps: { selected: undefined as typeof target | undefined } },
  );
  await waitFor(() => expect(result.current.snapshots).toEqual([displayed]));
  act(() => {
    result.current.execute(target);
  });
  rerender({ selected: target });
  await waitFor(() =>
    expect(result.current.snapshots).toEqual([displayed, confirmed]),
  );
  expect(requests.map(query => query.limit)).toEqual([999, 999, 1]);
  expect(requests.at(-1)?.condition?.children).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        field: 'aggregateId',
        value: target.aggregateId,
      }),
      expect.objectContaining({ field: 'tenantId', value: target.tenantId }),
      expect.objectContaining({ field: 'ownerId', value: target.ownerId }),
    ]),
  );
  act(() => {
    result.current.execute();
  });
  await waitFor(() => expect(requests).toHaveLength(5));
});

it('keeps a matching versioned snapshot and does not issue a target query', async () => {
  const confirmed = viewSnapshot(
    { ...saved, id: target.aggregateId },
    { version: 2 },
  );
  const fetch = vi.fn(async () => Response.json([confirmed]));
  vi.stubGlobal('fetch', fetch);
  const { result } = renderHook(() =>
    useViewerViews(definition.id, '(0)', '(0)', target),
  );
  await waitFor(() => expect(result.current.snapshots).toEqual([confirmed]));
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('rejects wrong target identities and ignores completion of a superseded target lookup', async () => {
  let resolveOld: ((response: Response) => void) | undefined;
  let oldSignal: AbortSignal | undefined;
  const displayed = viewSnapshot(saved);
  const confirmed = viewSnapshot({ ...saved, id: target.aggregateId });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input, init) => {
      const query = JSON.parse(init.body) as ListQuery;
      if (query.limit === 999) return Response.json([displayed]);
      oldSignal = init.signal;
      return new Promise<Response>(resolve => {
        resolveOld = resolve;
      });
    }),
  );
  const { result } = renderHook(() =>
    useViewerViews(definition.id, '(0)', '(0)'),
  );
  await waitFor(() => expect(result.current.snapshots).toEqual([displayed]));
  act(() => {
    result.current.execute(target);
  });
  await waitFor(() => expect(resolveOld).toBeTypeOf('function'));
  act(() => {
    result.current.execute();
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(oldSignal?.aborted).toBe(true);
  await act(async () => resolveOld!(Response.json([confirmed])));
  expect(result.current.snapshots).toEqual([displayed]);

  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input, init) => {
      const query = JSON.parse(init.body) as ListQuery;
      const wrong = {
        ...confirmed,
        tenantId: 'other',
      } satisfies MaterializedSnapshot<ViewState>;
      return Response.json(query.limit === 999 ? [displayed] : [wrong]);
    }),
  );
  act(() => {
    result.current.execute(target);
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.snapshots).toEqual([displayed]);
});
