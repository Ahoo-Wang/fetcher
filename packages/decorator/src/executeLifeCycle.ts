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
import { FetchExchange } from '@ahoo-wang/fetcher';

/**
 * Lifecycle hooks for decorator-based API execution.
 *
 * This interface allows users to hook into the request execution lifecycle
 * and modify the FetchExchange before and after it is processed by interceptors.
 */
export interface ExecuteLifeCycle {
  beforeExecute?(exchange: FetchExchange): void | Promise<void>;

  /**
   * Called after the FetchExchange is processed by interceptors.
   * Users can inspect or modify the exchange after processing at this point.
   *
   * @param exchange - The FetchExchange object representing the request and response
   */
  afterExecute?(exchange: FetchExchange): void | Promise<void>;
}
