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

import { NamedFetcher } from '@ahoo-wang/fetcher';
import {
  authorizationRequestInterceptor,
  cosecRequestInterceptor,
  authorizationResponseInterceptor,
  cosecResourceAttributionInterceptor,
} from '../cosec';

// A JSONPlaceholder-compatible host. The `required` test project starts a
// local one (test/jsonplaceholder/globalSetup.ts) and sets
// JSONPLACEHOLDER_BASE_URL to it; set the variable yourself to point the same
// suites at another host, e.g. https://jsonplaceholder.typicode.com.
// Unset, it falls back to json-server's default address.
export const typicodeFetcher = new NamedFetcher('typicode', {
  baseURL: process.env.JSONPLACEHOLDER_BASE_URL || 'http://localhost:3000',
});

typicodeFetcher.interceptors.request.use(cosecRequestInterceptor);
typicodeFetcher.interceptors.request.use(authorizationRequestInterceptor);
typicodeFetcher.interceptors.response.use(authorizationResponseInterceptor);
typicodeFetcher.interceptors.response.use(cosecResourceAttributionInterceptor);
