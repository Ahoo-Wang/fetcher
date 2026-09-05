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

import { cleanup } from '@testing-library/react';
import { Fetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';
import { CommandStage, FunctionKind, Operator } from '@ahoo-wang/fetcher-wow';
import type {
  CommandResult,
  ErrorInfo,
  MaterializedSnapshot,
  PagedList,
  PagedQuery,
} from '@ahoo-wang/fetcher-wow';
import type { ViewDefinition, ViewState } from '../../src/viewer/types';

export const definition: ViewDefinition = {
  id: 'definition',
  name: 'Definition',
  fields: [
    { name: 'id', label: 'ID', type: 'text', primaryKey: true },
    { name: 'status', label: 'Status', type: 'text', primaryKey: false },
  ],
  availableFilters: [],
  dataUrl: '/data',
  countUrl: '/count',
};
export const saved: ViewState = {
  id: 'saved',
  name: 'Saved',
  definitionId: definition.id,
  type: 'PERSONAL',
  source: 'CUSTOM',
  isDefault: false,
  columns: [
    { name: 'id', key: 'id', fixed: true, hidden: false },
    { name: 'status', key: 'status', fixed: false, hidden: false },
  ],
  filters: [
    {
      key: 'status',
      type: 'text',
      field: { name: 'status', label: 'Status' },
      operator: { defaultValue: Operator.EQ },
      value: { defaultValue: 'saved' },
    },
  ],
  condition: { field: 'status', operator: Operator.EQ, value: 'saved' },
  internalCondition: {
    field: 'scope',
    operator: Operator.EQ,
    value: 'original-scope',
  },
  pageSize: 10,
  tableSize: 'middle',
  sorter: [],
};
export type Row = { id: string; status: string };

export const server = {
  views: [] as ViewState[],
  snapshots: undefined as MaterializedSnapshot<ViewState>[] | undefined,
  tenantId: '(0)',
  ownerId: '(0)',
  commandPaths: [] as string[],
  versions: {} as Record<string, number>,
  commandVersion: undefined as number | null | undefined,
  commandHeaders: [] as Headers[],
  commandError: undefined as ErrorInfo | undefined,
  queries: [] as PagedQuery[],
  data: { list: [{ id: 'record', status: 'row' }], total: 1 } as PagedList<Row>,
  deferData: false,
  pendingData: [] as ((data: PagedList<Row>) => void)[],
  dataSignals: [] as (AbortSignal | null | undefined)[],
  deferLists: false,
  pendingList: undefined as (() => void) | undefined,
  listStatus: 200,
  hideCreatedView: false,
  createCount: 0,
  createBodies: [] as Record<string, unknown>[],
  editCount: 0,
  listCount: 0,
  deferEdits: false,
  pendingEdit: undefined as (() => void) | undefined,
};
export function viewSnapshot(
  view: ViewState,
  metadata: Partial<Omit<MaterializedSnapshot<ViewState>, 'state'>> = {},
): MaterializedSnapshot<ViewState> {
  return {
    contextName: 'viewer',
    aggregateName: 'view',
    aggregateId: view.id,
    tenantId: server.tenantId,
    ownerId: view.type === 'SHARED' ? '(shared)' : server.ownerId,
    spaceId: '(0)',
    version: server.versions[view.id] ?? 1,
    eventId: 'event',
    firstOperator: 'operator',
    operator: 'operator',
    firstEventTime: 0,
    eventTime: 0,
    snapshotTime: 0,
    tags: {},
    deleted: false,
    ...metadata,
    state: view,
  };
}

let previousFetcher: Fetcher;

function commandResult(aggregateId: string): CommandResult {
  return {
    id: 'result',
    commandId: 'command',
    waitCommandId: 'command',
    requestId: 'request',
    contextName: 'viewer',
    aggregateName: 'view',
    tenantId: server.tenantId,
    aggregateId,
    stage: CommandStage.PROCESSED,
    aggregateVersion:
      server.commandVersion === null
        ? undefined
        : (server.commandVersion ?? server.versions[aggregateId] ?? 1),
    signalTime: 0,
    errorCode: server.commandError?.errorCode ?? 'Ok',
    errorMsg: server.commandError?.errorMsg ?? '',
    result: {},
    function: {
      contextName: 'viewer',
      name: 'view',
      processorName: 'view',
      functionKind: FunctionKind.COMMAND,
    },
  };
}

beforeEach(() => {
  server.views = structuredClone([saved]);
  server.snapshots = undefined;
  server.tenantId = '(0)';
  server.ownerId = '(0)';
  server.commandPaths = [];
  server.versions = { saved: 1 };
  server.commandVersion = undefined;
  server.commandHeaders = [];
  server.commandError = undefined;
  server.queries = [];
  server.data = { list: [{ id: 'record', status: 'row' }], total: 1 };
  server.deferData = false;
  server.pendingData = [];
  server.dataSignals = [];
  server.deferLists = false;
  server.pendingList = undefined;
  server.listStatus = 200;
  server.hideCreatedView = false;
  server.createCount = 0;
  server.createBodies = [];
  server.editCount = 0;
  server.listCount = 0;
  server.deferEdits = false;
  server.pendingEdit = undefined;
  previousFetcher = fetcherRegistrar.default;
  fetcherRegistrar.default = new Fetcher({ baseURL: 'https://viewer.test' });
  fetcherRegistrar.default.interceptors.request.use({
    name: 'test-resource-scope',
    order: 0,
    intercept(exchange) {
      const params = exchange.ensureRequestUrlParams();
      params.path = {
        tenantId: server.tenantId,
        ownerId: server.ownerId,
        ...params.path,
      };
    },
  });
  // Keep all components, clients and hooks real; only replace the HTTP boundary.
  vi.stubGlobal(
    'fetch',
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(input), 'https://viewer.test').pathname;
      if (path === '/viewer/viewer_definition/snapshot/single/state') {
        return Response.json(definition);
      }
      if (
        path === '/viewer/view/snapshot/list/state' ||
        path === '/viewer/view/snapshot/list'
      ) {
        const response = () => {
          const snapshots = server.hideCreatedView
            ? []
            : (server.snapshots ??
              server.views.map(view => viewSnapshot(view)));
          return Response.json(
            path.endsWith('/state')
              ? snapshots.map(snapshot => snapshot.state)
              : snapshots,
          );
        };
        server.listCount++;
        if (server.listStatus !== 200) {
          return Response.json(
            { message: 'List unavailable' },
            { status: server.listStatus },
          );
        }
        if (server.deferLists) {
          return new Promise<Response>(resolve => {
            server.pendingList = () => resolve(response());
          });
        }
        return response();
      }
      if (path === '/data') {
        server.queries.push(JSON.parse(init?.body as string));
        server.dataSignals.push(init?.signal);
        if (server.deferData) {
          return new Promise<Response>(resolve => {
            server.pendingData.push(data => resolve(Response.json(data)));
          });
        }
        return Response.json(server.data);
      }
      if (path === '/count') return new Response('1');
      if (init?.method === 'DELETE') {
        const id = path.split('/').at(-1)!;
        server.views = server.views.filter(view => view.id !== id);
        return Response.json(commandResult(id));
      }
      if (
        init?.method === 'POST' &&
        /\/view\/type\/(PERSONAL|SHARED)$/.test(path)
      ) {
        server.createCount++;
        server.commandPaths.push(path);
        server.commandHeaders.push(new Headers(init.headers));
        const createBody = JSON.parse(init.body as string);
        server.createBodies.push(createBody);
        if (server.commandError) return Response.json(commandResult('created'));
        server.versions.created = server.commandVersion ?? 1;
        server.views = [
          {
            ...createBody,
            id: 'created',
            type: path.endsWith('/SHARED') ? 'SHARED' : 'PERSONAL',
            internalCondition: {
              field: 'scope',
              operator: Operator.EQ,
              value: 'created-scope',
            },
          },
        ];
        return Response.json(commandResult('created'));
      }
      if (
        init?.method === 'PUT' &&
        /\/view\/saved\/type\/(PERSONAL|SHARED)$/.test(path)
      ) {
        server.editCount++;
        server.commandPaths.push(path);
        server.commandHeaders.push(new Headers(init.headers));
        if (server.commandError) return Response.json(commandResult('saved'));
        const updatedView: ViewState = {
          ...JSON.parse(init.body as string),
          id: 'saved',
          type: path.endsWith('/SHARED') ? 'SHARED' : 'PERSONAL',
          internalCondition: {
            field: 'scope',
            operator: Operator.EQ,
            value: 'server-scope',
          },
          columns: [saved.columns[0], { ...saved.columns[1], hidden: true }],
        };
        const finishEdit = () => {
          server.versions.saved = (server.versions.saved ?? 0) + 1;
          server.views = server.views.map(view =>
            view.id === 'saved' ? updatedView : view,
          );
          return Response.json(commandResult('saved'));
        };
        if (server.deferEdits) {
          return new Promise<Response>(resolve => {
            server.pendingEdit = () => resolve(finishEdit());
          });
        }
        return finishEdit();
      }
      throw new Error(`Unexpected HTTP request: ${init?.method} ${path}`);
    },
  );
});

afterEach(() => {
  cleanup();
  fetcherRegistrar.default = previousFetcher;
  window.localStorage.clear();
});
