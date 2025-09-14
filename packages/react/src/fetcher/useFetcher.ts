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


import {
  fetcher as defaultFetcher,
  FetcherCapable,
  FetchExchange,
  FetchRequest,
  RequestOptions,
} from '@ahoo-wang/fetcher';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DepsCapable } from '../types';

export interface UseFetcherOptions extends RequestOptions, FetcherCapable, DepsCapable {
}

export interface UseFetcherResult<R> {
  loading: boolean;
  exchange: FetchExchange | unknown;
  result: R | undefined;
  error: Error | undefined | unknown;
  cancel: () => void;
}

export function useFetcher<R>(request: FetchRequest, options?: UseFetcherOptions): UseFetcherResult<R> {
  const { deps = [], fetcher = defaultFetcher } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined | unknown>(undefined);
  const [exchange, setExchange] = useState<FetchExchange | undefined>(undefined);
  const [result, setResult] = useState<any>(undefined);
  const abortControllerRef = useRef<AbortController | undefined>();

  const execute = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = request.abortController ?? new AbortController();
    request.abortController = abortControllerRef.current;
    setLoading(true);
    setError(undefined);
    try {
      const exchange = fetcher.exchange(request, options);
      setExchange(exchange);
      const result = (await exchange).extractResult<R>();
      setResult(result);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
      abortControllerRef.current = undefined;
    }
  }, [deps, fetcher]);
  const cancel = () => {
    abortControllerRef.current?.abort();
  };
  useEffect(() => {
    execute();
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = undefined;
    };
  }, [execute, ...deps]);
  return {
    loading, exchange, result, error, cancel,
  };
}