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

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FetchRequest, Fetcher, FetchExchange } from '@ahoo-wang/fetcher';
import { fetcher as defaultFetcher, ResultExtractors } from '@ahoo-wang/fetcher';

type UseFetcherRequest =
  | FetchRequest
  | ((signal: AbortSignal) => FetchRequest | Promise<FetchRequest>);

interface UseFetcherOptions<DataType> {
  autoExecute?: boolean;
  deps?: any[];
  fetcher?: Fetcher;
}

interface UseFetcherResult<DataType> {
  loading: boolean;
  data: DataType | undefined;
  error: Error | undefined;
  response: Response | undefined;
  exchange: FetchExchange | undefined;
  execute: () => Promise<FetchExchange | undefined>;
}

export function useFetcher<DataType = any>(
  request: UseFetcherRequest,
  options: UseFetcherOptions<DataType> = {},
): UseFetcherResult<DataType> {
  const { autoExecute = true, deps = [], fetcher = defaultFetcher } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [exchange, setExchange] = useState<FetchExchange | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(undefined);

    try {
      // 解析请求参数
      const resolvedRequest = typeof request === 'function'
        ? await request(signal)
        : request;

      // 如果请求中已经提供了 abortController，则使用它，否则使用我们创建的
      const fetchRequest = resolvedRequest.abortController
        ? resolvedRequest
        : {
          ...resolvedRequest,
          abortController: abortControllerRef.current,
        };

      // 发起请求
      const result = await fetcher.request<DataType>(
        fetchRequest,
        {
          resultExtractor: ResultExtractors.Exchange,
        },
      );

      // 检查是否已经取消
      if (!signal.aborted) {
        setExchange(result);
        setResponse(result.response);

        try {
          // 尝试解析 JSON 数据
          const jsonData = await result.extractResult();
          setData(jsonData);
        } catch (e) {
          // 如果不是 JSON 数据，则忽略
          setData(undefined);
        }

        return result;
      }
    } catch (err: any) {
      // 检查是否已经取消
      if (!signal.aborted) {
        setError(err);
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }

    return undefined;
  }, [request, fetcher]);

  // 自动执行或依赖变化时执行
  useEffect(() => {
    if (autoExecute) {
      execute();
    }

    return () => {
      // 组件卸载时取消请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoExecute, execute, ...deps]);

  return {
    loading,
    data,
    error,
    response,
    exchange,
    execute,
  };
}