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
  ExchangeError,
  Fetcher,
  HttpStatusValidationError,
  ResultExtractors,
} from '@ahoo-wang/fetcher';

interface User {
  id: number;
  name: string;
}

const client = new Fetcher({ baseURL: 'http://127.0.0.1:8787' });
const user = await client.get<User>(
  '/users/1',
  {},
  { resultExtractor: ResultExtractors.Json },
);

if (user.id !== 1 || user.name !== 'Ada') {
  throw new Error(`Unexpected user: ${JSON.stringify(user)}`);
}

try {
  await client.get('/missing');
  throw new Error('Expected /missing to fail with HTTP 404');
} catch (error) {
  if (
    !(error instanceof ExchangeError) ||
    !(error.cause instanceof HttpStatusValidationError) ||
    error.exchange.response?.status !== 404
  ) {
    throw error;
  }
}

console.log(user.name);
