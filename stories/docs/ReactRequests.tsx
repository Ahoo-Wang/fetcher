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

import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import { useFetcher } from '@ahoo-wang/fetcher-react';
import { useMemo } from 'react';

interface User {
  id: string;
  name: string;
}

type Result = User[] | { status: string };

export function ReactRequests({ baseURL = '/api' }: { baseURL?: string }) {
  const fetcher = useMemo(() => new Fetcher({ baseURL }), [baseURL]);
  const request = useFetcher<Result>({
    fetcher,
    resultExtractor: ResultExtractors.Json,
  });

  const output = request.loading
    ? request.status
    : request.error
      ? `Error · ${request.error.name}`
      : Array.isArray(request.result)
        ? request.result.map(user => user.name).join(', ')
        : (request.result?.status ?? request.status);

  return (
    <section
      aria-label="React requests"
      style={{ display: 'grid', gap: '0.75rem', maxWidth: '24rem' }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button onClick={() => void request.execute({ url: '/users' })}>
          Load
        </button>
        <button onClick={() => void request.execute({ url: '/error' })}>
          Fail
        </button>
        <button onClick={() => void request.execute({ url: '/slow' })}>
          Load slow
        </button>
        <button disabled={!request.loading} onClick={request.abort}>
          Cancel
        </button>
      </div>
      <output aria-live="polite">{output}</output>
    </section>
  );
}
