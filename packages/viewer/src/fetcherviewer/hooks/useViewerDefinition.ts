import { useState, useEffect, useCallback } from 'react';
import { fetcherRegistrar } from '@ahoo-wang/fetcher';
import { viewerDefinitionQueryClientFactory } from '../client';
import { ViewDefinition } from '../../';

export interface UseViewerDefinitionResult {
  viewerDefinition: ViewDefinition | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

export function useViewerDefinition(
  viewerDefinitionId: string,
): UseViewerDefinitionResult {
  const [definition, setDefinition] = useState<ViewDefinition | undefined>();
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
      viewerDefinitionQueryClientFactory.createSnapshotQueryClient({
        fetcher,
      });

    snapshotQueryClient
      .getStateById(viewerDefinitionId, {}, abortController)
      .then(result => {
        if (!abortController.signal.aborted) {
          setDefinition(result);
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
  }, [viewerDefinitionId, refreshKey]);

  return { viewerDefinition: definition, loading, error, refetch };
}
