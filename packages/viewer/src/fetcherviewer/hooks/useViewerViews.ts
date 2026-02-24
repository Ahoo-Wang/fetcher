import { ViewAggregatedFields } from '../client';
import { ViewState } from '../../';
import {
  and,
  eq,
  isIn,
  listQuery,
} from '@ahoo-wang/fetcher-wow';
import { useFetcherListQuery } from '@ahoo-wang/fetcher-react';

export interface UseViewerViewsResult {
  views: ViewState[] | undefined;
  loading: boolean;
  error: Error | undefined;
}

export function useViewerViews(
  definitionId: string,
  tenantId: string,
  ownerId: string,
): UseViewerViewsResult {
  const {
    loading,
    result: views,
    error,
  } = useFetcherListQuery<ViewState>({
    url: '/viewer/view/snapshot/list/state',
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

  return { views, loading, error };
}
