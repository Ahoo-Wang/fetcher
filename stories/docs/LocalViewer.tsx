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

import { useCallback, useState } from 'react';
import { App } from 'antd';
import { FullscreenProvider } from '@ahoo-wang/fetcher-react';
import { Viewer } from '@ahoo-wang/fetcher-viewer';
import type { ViewDefinition, ViewState } from '@ahoo-wang/fetcher-viewer';
import { all, Operator, SortDirection } from '@ahoo-wang/fetcher-wow';
import type { Condition, FieldSort, PagedList } from '@ahoo-wang/fetcher-wow';

const users = [
  { id: 'u-ada', name: 'Ada', active: true },
  { id: 'u-lin', name: 'Lin', active: false },
  { id: 'u-grace', name: 'Grace', active: true },
  { id: 'u-zoe', name: 'Zoe', active: false },
];
type User = (typeof users)[number];

const definition: ViewDefinition = {
  id: 'local-users',
  name: 'Local users',
  fields: [
    { name: 'id', label: 'ID', type: 'text', primaryKey: true },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      primaryKey: false,
      sorter: true,
    },
    {
      name: 'active',
      label: 'Active',
      type: 'text',
      primaryKey: false,
      render: value => (value ? 'Yes' : 'No'),
    },
  ],
  availableFilters: [
    {
      label: 'User',
      filters: [
        {
          key: 'active',
          field: { name: 'active', label: 'Active' },
          component: 'bool',
        },
      ],
    },
  ],
  // Required metadata; this local application does not fetch these URLs.
  dataUrl: '/local-users/paged',
  countUrl: '/local-users/count',
};
const initialView: ViewState = {
  id: 'all-users',
  name: 'All users',
  definitionId: definition.id,
  type: 'PERSONAL',
  source: 'SYSTEM',
  isDefault: true,
  filters: [
    { key: 'active', type: 'bool', field: { name: 'active', label: 'Active' } },
  ],
  columns: definition.fields.map(field => ({
    key: field.name,
    name: field.name,
    fixed: field.primaryKey,
    hidden: false,
  })),
  tableSize: 'middle',
  pageSize: 2,
  condition: all(),
  sorter: [],
};

function filterUsers(condition: Condition): User[] {
  if (condition.operator === Operator.ALL) return [...users];
  if (
    condition.field === 'active' &&
    (condition.operator === Operator.TRUE ||
      condition.operator === Operator.FALSE)
  ) {
    return users.filter(
      user => user.active === (condition.operator === Operator.TRUE),
    );
  }
  throw new Error('This example supports only the Active boolean filter.');
}

function queryUsers(
  condition: Condition,
  page: number,
  size: number,
  sorter: FieldSort[] = [],
): PagedList<User> {
  const rows = filterUsers(condition);
  if (
    sorter.length > 1 ||
    sorter.some(
      sort =>
        sort.field !== 'name' ||
        ![SortDirection.ASC, SortDirection.DESC].includes(sort.direction),
    )
  ) {
    throw new Error(
      'This example supports only ascending/descending Name sorting.',
    );
  }
  if (sorter.length) {
    const direction = sorter[0].direction === SortDirection.ASC ? 1 : -1;
    rows.sort(
      (left, right) => left.name.localeCompare(right.name, 'en') * direction,
    );
  }
  return {
    list: rows.slice((page - 1) * size, page * size),
    total: rows.length,
  };
}

export function LocalViewer() {
  const [savedViews, setSavedViews] = useState<ViewState[]>([initialView]);
  const [data, setData] = useState(() => queryUsers(all(), 1, 2));
  const [savedName, setSavedName] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(
    (
      condition: Condition,
      page: number,
      size: number,
      sorter?: FieldSort[],
    ) => {
      try {
        setData(queryUsers(condition, page, size, sorter));
        setError('');
      } catch (failure) {
        setData({ list: [], total: 0 });
        setError(failure instanceof Error ? failure.message : String(failure));
      }
    },
    [],
  );
  return (
    <App>
      <FullscreenProvider>
        <Viewer<User>
          definition={definition}
          defaultViews={savedViews}
          defaultView={initialView}
          dataSource={data}
          enableRowSelection={false}
          pagination={{ showSizeChanger: false }}
          onLoadData={load}
          onSwitchView={view =>
            load(view.condition, 1, view.pageSize, view.sorter)
          }
          onGetRecordCount={async (_url, condition) =>
            filterUsers(condition).length
          }
          onCreateView={(view, onSuccess) => {
            const saved = { ...view, id: crypto.randomUUID() };
            setSavedViews(current => [...current, saved]);
            setSavedName(saved.name);
            onSuccess?.(saved);
          }}
          onUpdateView={(view, onSuccess) => {
            setSavedViews(current =>
              current.map(saved => (saved.id === view.id ? view : saved)),
            );
            setSavedName(view.name);
            onSuccess?.(view);
          }}
          onDeleteView={(view, onSuccess) => {
            setSavedViews(current =>
              current.filter(saved => saved.id !== view.id),
            );
            onSuccess?.(view);
          }}
        />
        {error && <p role="alert">{error}</p>}
        <output aria-live="polite">{savedName && `Saved: ${savedName}`}</output>
      </FullscreenProvider>
    </App>
  );
}
