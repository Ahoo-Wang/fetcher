import { useFetcherPagedQuery } from '@ahoo-wang/fetcher-react';
import type { ViewDefinition, ViewState, ViewChangeAction } from '../../';
import type {
  Condition,
  FieldSort,
  PagedList,
  PagedQuery} from '@ahoo-wang/fetcher-wow';
import {
  all,
  and
} from '@ahoo-wang/fetcher-wow';
import type { FetcherError } from '@ahoo-wang/fetcher';
import { useCallback, useEffect } from 'react';

export interface UseFetchDataOptions {
  viewerDefinition: ViewDefinition | undefined;
  defaultView: ViewState | undefined;
}

export interface UseFetchDataReturn<RecordType> {
  dataSource?: PagedList<RecordType>;
  loading: boolean;
  setQuery?: ViewChangeAction;
  error: FetcherError | undefined;
  reload: () => Promise<void>;
  getPageQuery: () => PagedQuery | undefined;
}

export function useFetchData<RecordType>(
  options: UseFetchDataOptions,
): UseFetchDataReturn<RecordType> {
  const { viewerDefinition, defaultView } = options;

  const { result, loading, error, setQuery, execute, getQuery } =
    useFetcherPagedQuery<RecordType>({
      url: viewerDefinition?.dataUrl || '',
      autoExecute: true,
    });

  const setQueryFn = useCallback(
    (
      condition: Condition,
      index: number,
      size: number,
      sorter?: FieldSort[],
    ) => {
      setQuery({
        condition: defaultView?.internalCondition
          ? and(defaultView.internalCondition, condition)
          : condition,
        pagination: {
          index: index,
          size: size,
        },
        sort: sorter,
      });
    },
    [defaultView, setQuery],
  );

  useEffect(() => {
    if (defaultView && viewerDefinition) {
      setQueryFn(
        defaultView?.condition || all(),
        1,
        defaultView?.pageSize || 10,
        defaultView?.sorter,
      );
    }
  }, [defaultView, viewerDefinition, setQueryFn]);

  return {
    getPageQuery: getQuery,
    dataSource: result,
    loading,
    setQuery: setQueryFn,
    error,
    reload: execute,
  };
}
