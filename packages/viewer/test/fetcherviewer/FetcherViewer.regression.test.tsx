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

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from '@testing-library/react';
const state = vi.hoisted(() => ({
  data: { list: [{ id: 'A' }], total: 1 },
  queries: [] as any[],
  requests: [] as any[],
  definition: undefined as any,
  views: undefined as any,
  loading: false,
  viewerProps: null as any,
  storedViewId: undefined as string | undefined,
}));
vi.mock('../../src/fetcherviewer/hooks/useViewerDefinition', () => ({
  useViewerDefinition: () => ({
    viewerDefinition: state.definition ?? definition,
    loading: state.loading,
  }),
}));
vi.mock('../../src/fetcherviewer/hooks/useViewerViews', () => ({
  useViewerViews: () => ({
    views: state.views ?? views,
    loading: state.loading,
    execute: () => {},
  }),
}));
vi.mock('../../src/hooks/useRefreshDataEventBus', () => ({
  useRefreshDataEventBus: () => ({
    publish: () => Promise.resolve(),
    subscribe: () => true,
  }),
}));
vi.mock('../../src/viewer/Viewer', () => ({
  Viewer: (props: any) => {
    state.viewerProps = props;
    return (
      <>
        <button onClick={() => props.onSwitchView(views[1])}>switch B</button>
        <output>{JSON.stringify(props.dataSource)}</output>
      </>
    );
  },
}));
vi.mock('@ahoo-wang/fetcher-react', async original => {
  const actual = await original<any>();
  const r = await import('react');
  return {
    ...actual,
    useKeyStorage: () => {
      const [value, setValue] = r.useState(state.storedViewId);
      const save = r.useCallback((id: string) => {
        state.storedViewId = id;
        setValue(id);
      }, []);
      return [value, save];
    },
    useFetcherPagedQuery: (options: any) => {
      const url = r.useRef(options.url);
      url.current = options.url;
      const setQuery = r.useCallback((query: any) => {
        state.queries.push(query);
        state.requests.push({ url: url.current, query });
      }, []);
      return {
        result: state.data,
        loading: false,
        error: undefined,
        setQuery,
        execute: async () => {},
        getQuery: () => state.queries.at(-1),
      };
    },
  };
});
import { FetcherViewer } from '../../src/fetcherviewer/FetcherViewer';
const definition = {
  id: 'def',
  name: 'Def',
  fields: [],
  availableFilters: [],
  dataUrl: '/data',
  countUrl: '/count',
};
const views = [
  {
    id: 'A',
    name: 'A',
    definitionId: 'def',
    type: 'PERSONAL',
    source: 'CUSTOM',
    isDefault: false,
    columns: [],
    filters: [],
    tableSize: 'middle',
    pageSize: 10,
    condition: { operator: 'EQ', field: 'name', value: 'A' },
    internalCondition: { operator: 'EQ', field: 'scope', value: 'scopeA' },
    sorter: [],
  },
  {
    id: 'B',
    name: 'B',
    definitionId: 'def',
    type: 'PERSONAL',
    source: 'CUSTOM',
    isDefault: false,
    columns: [],
    filters: [],
    tableSize: 'middle',
    pageSize: 10,
    condition: { operator: 'EQ', field: 'name', value: 'B' },
    internalCondition: { operator: 'EQ', field: 'scope', value: 'scopeB' },
    sorter: [],
  },
];
beforeEach(() => {
  state.queries = [];
  state.requests = [];
  state.definition = undefined;
  state.views = undefined;
  state.loading = false;
  state.data = { list: [{ id: 'A' }], total: 1 };
  state.storedViewId = undefined;
});
afterEach(cleanup);
it('uses the selected view after initialization with defaultViewId', async () => {
  state.queries = [];
  render(
    <FetcherViewer
      viewerDefinitionId="def"
      defaultViewId="A"
      pagination={false}
    />,
  );
  await act(async () => {});
  const count = state.queries.length;
  fireEvent.click(screen.getByText('switch B'));
  await act(async () => {});
  expect(state.queries).toHaveLength(count + 1);
  state.viewerProps.onLoadData(views[1].condition, 1, 10, []);
  expect(state.queries.at(-1).condition.children[0].value).toBe('scopeB');
});
it('ignores stale asynchronous enhancement results', async () => {
  const pending = new Map<string, (v: any) => void>();
  const enhance = (rows: any[]) =>
    new Promise<any[]>(resolve => pending.set(rows[0].id, resolve));
  state.data = { list: [{ id: 'A' }], total: 1 };
  const { rerender } = render(
    <FetcherViewer
      viewerDefinitionId="def"
      pagination={false}
      enhanceDataSource={enhance}
    />,
  );
  state.data = { list: [{ id: 'B' }], total: 2 };
  rerender(
    <FetcherViewer
      viewerDefinitionId="def"
      pagination={false}
      enhanceDataSource={enhance}
    />,
  );
  await act(async () => pending.get('B')!([{ id: 'B-enhanced' }]));
  expect(screen.getByText(/B-enhanced/)).toBeTruthy();
  await act(async () => pending.get('A')!([{ id: 'A-enhanced' }]));
  expect(screen.queryByText(/A-enhanced/)).toBeNull();
  expect(screen.getByText(/B-enhanced/)).toBeTruthy();
  expect(state.viewerProps.dataSource.total).toBe(2);
});

it('uses defaultViewId only on initialization and persists later selections', async () => {
  state.queries = [];
  const { rerender, unmount } = render(
    <FetcherViewer
      viewerDefinitionId="def"
      defaultViewId="A"
      pagination={false}
    />,
  );
  await act(async () => {});
  const initialCount = state.queries.length;
  rerender(
    <FetcherViewer
      viewerDefinitionId="def"
      defaultViewId="B"
      pagination={false}
    />,
  );
  await act(async () => {});
  expect(state.queries).toHaveLength(initialCount);
  expect(state.viewerProps.defaultView.id).toBe('A');
  fireEvent.click(screen.getByText('switch B'));
  expect(state.storedViewId).toBe('B');
  unmount();
  render(<FetcherViewer viewerDefinitionId="def" pagination={false} />);
  await act(async () => {});
  expect(state.viewerProps.defaultView.id).toBe('B');
});

it('isolates selections across definitions while ignoring retained loading results', async () => {
  const { rerender } = render(
    <FetcherViewer viewerDefinitionId="def" pagination={false} />,
  );
  await act(async () => {});
  fireEvent.click(screen.getByText('switch B'));
  expect(state.viewerProps.defaultView.id).toBe('B');
  const originalCount = state.requests.length;

  // The new definition can arrive while its view list still contains old data.
  state.definition = { ...definition, id: 'other', dataUrl: '/other-data' };
  state.loading = true;
  rerender(<FetcherViewer viewerDefinitionId="other" pagination={false} />);
  await act(async () => {});
  expect(state.requests).toHaveLength(originalCount);

  const otherView = {
    ...views[0],
    id: 'C',
    definitionId: 'other',
    condition: { operator: 'EQ', field: 'name', value: 'C' },
    internalCondition: { operator: 'EQ', field: 'scope', value: 'scopeC' },
  };
  state.views = [otherView];
  state.loading = false;
  rerender(<FetcherViewer viewerDefinitionId="other" pagination={false} />);
  await act(async () => {});
  expect(state.viewerProps.defaultView.id).toBe('C');
  expect(state.requests.at(-1)).toEqual(
    expect.objectContaining({
      url: '/other-data',
      query: expect.objectContaining({
        condition: expect.objectContaining({
          children: [otherView.internalCondition, otherView.condition],
        }),
      }),
    }),
  );
  expect(state.requests).toHaveLength(originalCount + 1);
});

it('ignores old definition and views until both new resources are available', async () => {
  const { rerender } = render(
    <FetcherViewer viewerDefinitionId="def" pagination={false} />,
  );
  await act(async () => {});
  const originalCount = state.requests.length;
  state.loading = true;
  rerender(<FetcherViewer viewerDefinitionId="other" pagination={false} />);
  await act(async () => {});
  expect(state.requests).toHaveLength(originalCount);

  const otherView = { ...views[0], id: 'C', definitionId: 'other' };
  state.views = [otherView];
  rerender(<FetcherViewer viewerDefinitionId="other" pagination={false} />);
  await act(async () => {});
  expect(state.requests).toHaveLength(originalCount);
  state.definition = { ...definition, id: 'other', dataUrl: '/other-data' };
  state.loading = false;
  rerender(<FetcherViewer viewerDefinitionId="other" pagination={false} />);
  await act(async () => {});
  expect(state.viewerProps.defaultView.id).toBe('C');
  expect(state.requests.at(-1).url).toBe('/other-data');
});

it('preserves the selected view through a same-definition reload and update', async () => {
  const { rerender } = render(
    <FetcherViewer viewerDefinitionId="def" pagination={false} />,
  );
  await act(async () => {});
  fireEvent.click(screen.getByText('switch B'));
  state.loading = true;
  rerender(<FetcherViewer viewerDefinitionId="def" pagination={false} />);
  state.views = views.map(view => ({ ...view }));
  state.loading = false;
  rerender(<FetcherViewer viewerDefinitionId="def" pagination={false} />);
  await act(async () => {});
  expect(state.viewerProps.defaultView.id).toBe('B');
  const updated = {
    ...views[1],
    condition: { operator: 'EQ', field: 'name', value: 'updated' },
  };
  act(() => state.viewerProps.onSwitchView(updated));
  expect(state.viewerProps.defaultView).toEqual(updated);
  expect(state.requests.at(-1).query.condition.children[1]).toEqual(
    updated.condition,
  );
});
