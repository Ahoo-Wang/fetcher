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

import { Fetcher, FetchExchange, Interceptor } from '@ahoo-wang/fetcher';
import { showLoading, updateOutput } from './basicGetExample';

// Create a Fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
});

// Interceptor Example
export function initInterceptorExample(): void {
  const interceptorBtn = document.getElementById('interceptorBtn');
  const interceptorClearBtn = document.getElementById('interceptorClearBtn');

  if (interceptorBtn) {
    interceptorBtn.addEventListener('click', async () => {
      const outputId = 'interceptorOutput';
      showLoading(outputId);

      // Add request interceptor
      const requestInterceptor: Interceptor = {
        name: 'RequestInterceptor',
        order: Number.MIN_SAFE_INTEGER,
        intercept(exchange: FetchExchange) {
          exchange.request = {
            ...exchange.request,
            headers: {
              ...exchange.request.headers,
              'X-Custom-Header': 'Added by interceptor',
            },
          };
          return exchange;
        },
      };
      const requestInterceptorId = fetcher.interceptors.request.use(requestInterceptor);

      try {
        const response: Response = await fetcher.get('/posts/1');
        const data = await response.json();
        updateOutput(
          outputId,
          `Request completed with custom header\n\n${JSON.stringify(data, null, 2)}`,
          'success',
        );
      } catch (error: any) {
        updateOutput(outputId, `Error: ${error.message}`, 'error');
      } finally {
        // Remove interceptor
        fetcher.interceptors.request.eject(requestInterceptor.name);
      }
    });
  }

  if (interceptorClearBtn) {
    interceptorClearBtn.addEventListener('click', () => {
      updateOutput(
        'interceptorOutput',
        'Click "Fetch with Interceptor" to run the example',
      );
    });
  }
}
