---
title: Build a Data Viewer
description: Render a paged Viewer with application-owned fetching, cancellation, and recoverable errors.
---

# Build a Data Viewer

Create a React page that renders a saved default view, loads data and responds to paging/sorting. `Viewer` owns presentation state; your application supplies data and persistence callbacks.

## 1. Prepare the application

Use a React app with CSS-capable bundling and install `@ahoo-wang/fetcher-viewer` plus its declared peers. The [package entry](../reference/viewer/) lists the full installation contract; React, Ant Design, icons, dayjs and the Fetcher peers must resolve to compatible versions.

This example assumes a same-origin application `POST /users/paged` accepting `{ condition, pagination: { index, size }, sort }` and returning JSON `{ list: [{ id, name }], total }`. Implement this route or adapt `load` to your real server. It is an application contract, not an endpoint created by Viewer. The backend must enforce authorization and validate the query. `countUrl` is required definition metadata but is not called by this example.

## 2. Add the complete page

Save this as `UsersPage.tsx` and mount `<UsersPage />` through your existing React root/router:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import { all, type PagedList } from '@ahoo-wang/fetcher-wow';
import {
  Viewer,
  type FieldDefinition,
  type ViewDefinition,
  type ViewState,
  type ViewChangeAction,
} from '@ahoo-wang/fetcher-viewer';

interface User {
  id: string;
  name: string;
}
const fields: FieldDefinition[] = [
  { name: 'id', label: 'ID', type: 'text', primaryKey: true },
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    primaryKey: false,
    sorter: true,
  },
];
const definition: ViewDefinition = {
  id: 'users',
  name: 'Users',
  fields,
  availableFilters: [],
  dataUrl: '/users/paged',
  countUrl: '/users/count',
};
const defaultView: ViewState = {
  id: 'default',
  name: 'All users',
  definitionId: 'users',
  type: 'PERSONAL',
  source: 'SYSTEM',
  isDefault: true,
  filters: [],
  columns: fields.map(field => ({
    key: field.name,
    name: field.name,
    fixed: field.primaryKey,
    hidden: false,
  })),
  tableSize: 'middle',
  pageSize: 20,
  condition: all(),
  sorter: [],
};
const defaultViews = [defaultView];
const api = new Fetcher();
type QueryArgs = Parameters<ViewChangeAction>;

export function UsersPage() {
  const [data, setData] = useState<PagedList<User>>({ list: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const pending = useRef<AbortController | null>(null);
  const lastQuery = useRef<QueryArgs>([all(), 1, 20, []]);

  const load = useCallback(async (...args: QueryArgs) => {
    lastQuery.current = args;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const [condition, index, size, sorter] = args;
    setLoading(true);
    setError(undefined);
    try {
      const page = await api.post<PagedList<User>>(
        definition.dataUrl,
        {
          signal: controller.signal,
          body: { condition, pagination: { index, size }, sort: sorter },
        },
        { resultExtractor: ResultExtractors.Json },
      );
      if (!controller.signal.aborted) setData(page);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'Loading failed');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(...lastQuery.current);
    return () => pending.current?.abort();
  }, [load]);

  return (
    <section aria-label="Users">
      {error && (
        <div role="alert">
          {error}{' '}
          <button onClick={() => void load(...lastQuery.current)}>Retry</button>
        </div>
      )}
      <Viewer<User>
        defaultViews={defaultViews}
        defaultView={defaultView}
        definition={definition}
        dataSource={data}
        loading={loading}
        pagination={{}}
        enableRowSelection
        onLoadData={load}
      />
    </section>
  );
}
```

The initial effect loads the first page. `onLoadData` supplies the condition, one-based page index, size and sorter for later changes. The callback converts these into the application's request body. A new request cancels its predecessor; aborted responses cannot overwrite newer data. Unmount cancels the active request.

## 3. Check loading, empty and failure states

Mock the application route with `{ list: [{ id: '42', name: 'Ada' }], total: 1 }`. Verify a visible row, selection, sorting and the outgoing query. Return an empty list/zero total to check the table empty state. Return an HTTP error to check the alert and retry of the last query. Delay two responses and change pages quickly: only the current response should update the table. The example retains previous rows on failure and displays an error above them.

The JSON generic does not validate server data. Validate untrusted responses at your application boundary when required. This recipe's TypeScript checks do not replace browser interaction checks; [Storybook](https://fetcher.ahoo.me/storybook/) contains component examples.

## 4. Add filters and saved views when needed

The initial view intentionally has no filters. Add entries to `availableFilters` and saved `filters` using [filter contracts](../reference/viewer/filters). Built-in datetime behavior is registry-resolved as `datetime`; `DateTimeFilter` is not a named export from the package root. Do not import its internal file.

For saved view mutations, provide `onCreateView`, `onUpdateView` and `onDeleteView`. Call their success callback with the server-confirmed view only after persistence succeeds; otherwise the UI must retain the existing state. See [saved view lifecycle](../reference/viewer/saved-views). This example defines one system default view and performs no remote view writes.

## 5. Choose remote composition deliberately

Use [FetcherViewer](../reference/viewer/fetcher-viewer) when the server implements its definition and Wow saved-view contracts and the required client Fetcher configuration is installed. A generic paged endpoint alone is insufficient. See [models and state](../reference/viewer/models-and-state) and [View versus Viewer](../reference/viewer/view-and-viewer) for ownership boundaries.

[Viewer.tsx:57](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L57) documents data and persistence ownership.
