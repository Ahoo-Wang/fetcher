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

import type { Fetcher, FetchRequest } from '../src';

/**
 * Shared test fixtures for the fetcher package. Centralizes the mock objects
 * (mockFetcher / mockRequest) that were previously copy-pasted across 7 test
 * files. Each factory returns a fresh instance so tests stay isolated.
 */

/** A minimal Fetcher stub (no interceptor chain) for unit tests. */
export function createMockFetcher(): Fetcher {
  return {} as Fetcher;
}

/** A minimal FetchRequest with a typical test URL. */
export function createMockRequest(
  url = '/test',
  overrides: Partial<FetchRequest> = {},
): FetchRequest {
  return { url, ...overrides } as FetchRequest;
}
