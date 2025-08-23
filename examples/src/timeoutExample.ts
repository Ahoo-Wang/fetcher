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

import { Fetcher } from '@ahoo-wang/fetcher';
import { updateOutput, showLoading } from './basicGetExample';

// Timeout Example
export function initTimeoutExample(): void {
  const timeoutBtn = document.getElementById('timeoutBtn');
  const timeoutClearBtn = document.getElementById('timeoutClearBtn');
  const timeoutInput = document.getElementById(
    'timeoutInput',
  ) as HTMLInputElement | null;

  if (timeoutBtn && timeoutInput) {
    timeoutBtn.addEventListener('click', async () => {
      const outputId = 'timeoutOutput';
      const timeout = parseInt(timeoutInput.value);
      showLoading(outputId);

      try {
        // Create a new fetcher with custom timeout
        const timeoutFetcher = new Fetcher({
          baseURL: 'https://jsonplaceholder.typicode.com',
          timeout: timeout,
        });

        const startTime = Date.now();
        const response: Response = await timeoutFetcher.get('/posts/1');
        const endTime = Date.now();

        const data = await response.json();
        updateOutput(
          outputId,
          `Request completed in ${endTime - startTime}ms\n\n${JSON.stringify(data, null, 2)}`,
          'success',
        );
      } catch (error: any) {
        updateOutput(outputId, `Timeout Error: ${error.message}`, 'error');
      }
    });
  }

  if (timeoutClearBtn) {
    timeoutClearBtn.addEventListener('click', () => {
      updateOutput('timeoutOutput', 'Click "Test Timeout" to run the example');
    });
  }
}
