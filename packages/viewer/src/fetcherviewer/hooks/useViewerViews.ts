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

import { ViewAggregatedFields } from '../client';
import type { ViewState } from '../../';
import {
  and,
  eq,
  isIn,
  listQuery,
  SnapshotQueryEndpointPaths,
} from '@ahoo-wang/fetcher-wow';
import type { AggregateId, MaterializedSnapshot } from '@ahoo-wang/fetcher-wow';
import { fetcherRegistrar, JsonResultExtractor } from '@ahoo-wang/fetcher';
import { useCallback, useMemo } from 'react';
import { useLatest, useQuery } from '@ahoo-wang/fetcher-react';

export type ViewSnapshotTarget = AggregateId & { ownerId: string };

export interface UseViewerViewsResult {
  views: ViewState[] | undefined;
  /** Versioned snapshots backing the returned views. */
  snapshots?: MaterializedSnapshot<ViewState>[];
  loading: boolean;
  error: Error | undefined;
  execute: (target?: ViewSnapshotTarget) => void;
}

export function useViewerViews(
  definitionId: string,
  tenantId: string,
  ownerId: string,
  target?: ViewSnapshotTarget,
): UseViewerViewsResult {
  const latestTarget = useLatest(target);
  const {
    loading,
    result: snapshots,
    error,
    setQuery,
  } = useQuery<
    {
      definitionId: string;
      tenantId: string;
      ownerId: string;
      target?: ViewSnapshotTarget;
    },
    MaterializedSnapshot<ViewState>[]
  >({
    initialQuery: { definitionId, tenantId, ownerId, target },
    autoExecute: true,
    execute: async (request, _attributes, abortController) => {
      const url = `/viewer/view/${SnapshotQueryEndpointPaths.LIST}`;
      const condition = and(
        eq(ViewAggregatedFields.DELETED, false),
        isIn(ViewAggregatedFields.TENANT_ID, '(0)', request.tenantId),
        isIn(ViewAggregatedFields.OWNER_ID, '(shared)', request.ownerId),
        eq(ViewAggregatedFields.STATE_DEFINITION_ID, request.definitionId),
      );
      const fetchSnapshots = (query: ReturnType<typeof listQuery>) =>
        fetcherRegistrar.default.post<MaterializedSnapshot<ViewState>[]>(
          url,
          { body: query, abortController },
          { resultExtractor: JsonResultExtractor },
        );
      const snapshots = await fetchSnapshots(
        listQuery({ condition, limit: 999 }),
      );
      const target = request.target;
      if (
        !target ||
        target.contextName !== 'viewer' ||
        target.aggregateName !== 'view'
      )
        return snapshots;
      const matchesTarget = (snapshot: MaterializedSnapshot<ViewState>) =>
        snapshot.contextName === target.contextName &&
        snapshot.aggregateName === target.aggregateName &&
        snapshot.aggregateId === target.aggregateId &&
        snapshot.tenantId === target.tenantId &&
        snapshot.ownerId === target.ownerId &&
        snapshot.state.definitionId === request.definitionId &&
        !snapshot.deleted;
      if (snapshots.some(matchesTarget)) return snapshots;
      abortController?.signal.throwIfAborted();
      const targeted = await fetchSnapshots(
        listQuery({
          condition: and(
            condition,
            eq(ViewAggregatedFields.AGGREGATE_ID, target.aggregateId),
            eq(ViewAggregatedFields.TENANT_ID, target.tenantId),
            eq(ViewAggregatedFields.OWNER_ID, target.ownerId),
          ),
          limit: 1,
        }),
      );
      return [...snapshots, ...targeted.filter(matchesTarget)];
    },
  });
  const execute = useCallback(
    (target = latestTarget.current) => {
      setQuery({ definitionId, tenantId, ownerId, target });
    },
    [definitionId, tenantId, ownerId, latestTarget, setQuery],
  );
  const views = useMemo(
    () => snapshots?.map(snapshot => snapshot.state),
    [snapshots],
  );
  return { views, snapshots, loading, error, execute };
}
