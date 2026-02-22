import { useState, useEffect, useCallback } from 'react';
import { fetcherRegistrar } from '@ahoo-wang/fetcher';
import { ViewAggregatedFields, viewQueryClientFactory } from '../client';
import { ViewState } from '../../';
import { and, DeletionState, eq } from '@ahoo-wang/fetcher-wow';

export interface UseViewerViewsResult {
  views: ViewState[];
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

export function useViewerViews(
  definitionId: string,
  tenantId?: string,
  ownerId?: string,
): UseViewerViewsResult {
  const [views, setViews] = useState<ViewState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey(k => k + 1);
    setLoading(true);
    setError(undefined);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    const fetcher = fetcherRegistrar.default;
    const snapshotQueryClient =
      viewQueryClientFactory.createSnapshotQueryClient({
        fetcher,
      });

    Promise.all([
      snapshotQueryClient.listState(
        {
          condition: and(
            eq(ViewAggregatedFields.DELETED, DeletionState.ACTIVE),
            eq(ViewAggregatedFields.OWNER_ID, ownerId || '(0)'),
            eq(ViewAggregatedFields.STATE_DEFINITION_ID, definitionId),
            eq(ViewAggregatedFields.STATE_TYPE, 'PERSONAL'),
            eq(ViewAggregatedFields.STATE_SOURCE, 'CUSTOM'),
          ),
        },
        {},
        abortController,
      ),
      snapshotQueryClient.listState(
        {
          condition: and(
            eq(ViewAggregatedFields.DELETED, DeletionState.ACTIVE),
            eq(ViewAggregatedFields.TENANT_ID, '(0)'),
            eq(ViewAggregatedFields.STATE_DEFINITION_ID, definitionId),
            eq(ViewAggregatedFields.STATE_SOURCE, 'SYSTEM'),
          ),
        },
        {},
        abortController,
      ),
      snapshotQueryClient.listState(
        {
          condition: and(
            eq(ViewAggregatedFields.DELETED, DeletionState.ACTIVE),
            eq(ViewAggregatedFields.TENANT_ID, tenantId || '(0)'),
            eq(ViewAggregatedFields.STATE_DEFINITION_ID, definitionId),
            eq(ViewAggregatedFields.STATE_SOURCE, 'CUSTOM'),
          ),
        },
        {},
        abortController,
      ),
    ])
      .then(([personalViews, systemViews, sharedViews]) => {
        if (!abortController.signal.aborted) {
          setViews([...personalViews, ...systemViews, ...sharedViews]);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!abortController.signal.aborted) {
          setError(err as Error);
          setLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [definitionId, refreshKey]);

  return { views, loading, error, refetch };
}
