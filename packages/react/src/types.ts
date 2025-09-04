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

import type { Fetcher } from '@ahoo-wang/fetcher';

/**
 * The state of a fetcher request.
 *
 * Represents the current status of a data fetching operation.
 */
export interface FetcherState<DataType = any> {
  /**
   * Indicates if the request is currently loading.
   */
  loading: boolean;

  /**
   * The data returned from the request, if successful.
   */
  data?: DataType;

  /**
   * Any error that occurred during the request.
   */
  error?: Error;

  /**
   * The raw response from the fetcher.
   */
  response?: Response;
}

/**
 * Configuration options for the useFetcher hook.
 */
export interface UseFetcherOptions {
  /**
   * Whether to automatically execute the request when the component mounts or dependencies change.
   * @default true
   */
  autoExecute?: boolean;

  /**
   * Dependencies that should trigger a refetch when they change.
   */
  deps?: any[];

  /**
   * The fetcher instance to use for requests.
   * If not provided, the default fetcher will be used.
   */
  fetcher?: Fetcher;
}