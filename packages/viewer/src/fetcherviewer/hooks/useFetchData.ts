import { useFetcherPagedQuery } from '@ahoo-wang/fetcher-react';
import { ViewDefinition, ViewState, ViewChangeAction } from '../../';
import {
  all,
  and,
  Condition,
  FieldSort,
  PagedList,
} from '@ahoo-wang/fetcher-wow';
import { FetcherError } from '@ahoo-wang/fetcher';
import { useEffect } from 'react';

export interface UseFetchDataOptions {
  viewerDefinition: ViewDefinition | undefined;
  defaultView: ViewState | undefined;
}

export interface UseFetchDataReturn<RecordType> {
  dataSource?: PagedList<RecordType>;
  loading: boolean;
  setQuery?: ViewChangeAction;
  error: FetcherError | undefined;
}

export function useFetchData<RecordType>(
  options: UseFetchDataOptions,
): UseFetchDataReturn<RecordType> {
  const { viewerDefinition, defaultView } = options;

  const { result, loading, error, setQuery } = useFetcherPagedQuery<RecordType>(
    {
      url: viewerDefinition?.dataUrl || '',
      autoExecute: true,
    },
  );

  useEffect(() => {
    if (defaultView && viewerDefinition) {
      setQuery({
        condition: defaultView?.condition
          ? defaultView.internalCondition
            ? and(defaultView.internalCondition, defaultView.condition)
            : all()
          : all(),
        pagination: {
          index: 1,
          size: defaultView.pageSize,
        },
        sort: defaultView?.sorter,
      });
    }
  }, [viewerDefinition, defaultView, setQuery]);

  const setQueryFn = (
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
  };

  return {
    dataSource: result,
    loading,
    setQuery: setQueryFn,
    error,
  };
}
