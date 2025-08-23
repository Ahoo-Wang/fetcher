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

// Create a Fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
});

// Path Parameters Example
export function initPathParamExample(): void {
  const pathParamBtn = document.getElementById('pathParamBtn');
  const pathParamClearBtn = document.getElementById('pathParamClearBtn');
  const userIdInput = document.getElementById(
    'userIdInput',
  ) as HTMLInputElement | null;

  if (pathParamBtn && userIdInput) {
    pathParamBtn.addEventListener('click', async () => {
      const outputId = 'pathParamOutput';
      const userId = userIdInput.value;
      showLoading(outputId);

      try {
        const response: Response = await fetcher.get('/users/{id}/posts', {
          pathParams: { id: userId },
        });
        const data = await response.json();
        updateOutput(
          outputId,
          `Found ${data.length} posts for user ${userId}\n\n${JSON.stringify(data.slice(0, 3), null, 2)}${data.length > 3 ? '\n\n...' : ''}`,
          'success',
        );
      } catch (error: any) {
        updateOutput(outputId, `Error: ${error.message}`, 'error');
      }
    });
  }

  if (pathParamClearBtn) {
    pathParamClearBtn.addEventListener('click', () => {
      updateOutput(
        'pathParamOutput',
        'Click "Fetch User Posts" to run the example',
      );
    });
  }
}
