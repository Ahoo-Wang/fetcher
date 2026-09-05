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
import type { MaterializedSnapshot } from '@ahoo-wang/fetcher-wow';
import { useMemo } from 'react';
import { useFetcherListQuery } from '@ahoo-wang/fetcher-react';

export interface UseViewerViewsResult {
  views: ViewState[] | undefined;
  /** Versioned snapshots backing the returned views. */
  snapshots?: MaterializedSnapshot<ViewState>[];
  loading: boolean;
  error: Error | undefined;
  execute: () => void;
}

export function useViewerViews(
  definitionId: string,
  tenantId: string,
  ownerId: string,
): UseViewerViewsResult {
  const {
    loading,
    result: snapshots,
    error,
    execute,
  } = useFetcherListQuery<MaterializedSnapshot<ViewState>>({
    url: `/viewer/view/${SnapshotQueryEndpointPaths.LIST}`,
    initialQuery: listQuery({
      condition: and(
        eq(ViewAggregatedFields.DELETED, false),
        isIn(ViewAggregatedFields.TENANT_ID, '(0)', tenantId),
        isIn(ViewAggregatedFields.OWNER_ID, '(shared)', ownerId),
        eq(ViewAggregatedFields.STATE_DEFINITION_ID, definitionId),
      ),
      limit: 999,
    }),
    autoExecute: true,
  });

  const views = useMemo(
    () => snapshots?.map(snapshot => snapshot.state),
    [snapshots],
  );

  return { views, snapshots, loading, error, execute };
}
