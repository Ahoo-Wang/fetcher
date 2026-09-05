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

import { useLatest, useQuery } from '@ahoo-wang/fetcher-react';
import type { ViewDefinition, ViewState, ViewChangeAction } from '../../';
import type {
  Condition,
  FieldSort,
  PagedList,
  PagedQuery,
} from '@ahoo-wang/fetcher-wow';
import { all, and } from '@ahoo-wang/fetcher-wow';
import type { FetcherError } from '@ahoo-wang/fetcher';
import { fetcherRegistrar, JsonResultExtractor } from '@ahoo-wang/fetcher';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

interface ViewDataQuery {
  view: ViewState | undefined;
  url: string;
  query: PagedQuery;
}

export function useFetchData<RecordType>(
  options: UseFetchDataOptions,
): UseFetchDataReturn<RecordType> {
  const { viewerDefinition, defaultView } = options;
  const latestOptionsRef = useLatest(options);

  const dataUrl = viewerDefinition?.dataUrl ?? '';
  const { result, loading, error, setQuery, execute, getQuery } = useQuery<
    ViewDataQuery,
    { request: ViewDataQuery; data: PagedList<RecordType> }
  >({
    autoExecute: true,
    execute: async (request, _attributes, abortController) => ({
      request,
      data: await fetcherRegistrar.default.post<PagedList<RecordType>>(
        request.url,
        { body: request.query, abortController },
        { resultExtractor: JsonResultExtractor },
      ),
    }),
  });

  const createRequest = useCallback(
    (
      condition: Condition,
      index: number,
      size: number,
      sorter?: FieldSort[],
    ): ViewDataQuery => ({
      view: defaultView,
      url: dataUrl,
      query: {
        condition: defaultView?.internalCondition
          ? and(defaultView.internalCondition, condition)
          : condition,
        pagination: { index, size },
        sort: sorter,
      },
    }),
    [defaultView, dataUrl],
  );
  const defaultRequest = useMemo(
    () =>
      defaultView && viewerDefinition
        ? createRequest(
            defaultView.condition || all(),
            1,
            defaultView.pageSize || 10,
            defaultView.sorter,
          )
        : undefined,
    [defaultView, viewerDefinition, createRequest],
  );
  const [requests, setRequests] = useState({
    defaultRequest,
    currentRequest: defaultRequest,
  });
  if (requests.defaultRequest !== defaultRequest) {
    setRequests({ defaultRequest, currentRequest: defaultRequest });
  }
  const { currentRequest } = requests;
  const setQueryFn = useCallback(
    (
      condition: Condition,
      index: number,
      size: number,
      sorter?: FieldSort[],
    ) => {
      const request = createRequest(condition, index, size, sorter);
      setRequests({ defaultRequest, currentRequest: request });
      setQuery(request);
    },
    [createRequest, defaultRequest, setQuery],
  );

  useEffect(() => {
    if (defaultRequest) setQuery(defaultRequest);
  }, [defaultRequest, setQuery]);

  const getPageQuery = useCallback(() => getQuery()?.query, [getQuery]);
  const reload = useCallback(async () => {
    const current = latestOptionsRef.current;
    const request = getQuery();
    if (
      current.defaultView &&
      current.viewerDefinition &&
      request?.view === current.defaultView &&
      request.url === current.viewerDefinition.dataUrl
    ) {
      await execute();
    }
  }, [latestOptionsRef, getQuery, execute]);

  return {
    getPageQuery,
    // A retained result belongs to the view used when the request started.
    dataSource:
      result?.request === currentRequest &&
      result?.request.view === defaultView &&
      result?.request.url === dataUrl
        ? result.data
        : undefined,
    loading,
    setQuery: setQueryFn,
    error,
    reload,
  };
}
