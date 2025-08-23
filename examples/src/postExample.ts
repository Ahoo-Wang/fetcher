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

// POST Request Example
export function initPostExample(): void {
  const postBtn = document.getElementById('postBtn');
  const postClearBtn = document.getElementById('postClearBtn');

  if (postBtn) {
    postBtn.addEventListener('click', async () => {
      const outputId = 'postOutput';
      showLoading(outputId);

      try {
        const response: Response = await fetcher.post('/posts', {
          body: JSON.stringify({
            title: 'Test Post',
            body: 'This is a test post created with Fetcher',
            userId: 1,
          }),
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        updateOutput(
          outputId,
          `Successfully created post #${data.id}\n\n${JSON.stringify(data, null, 2)}`,
          'success',
        );
      } catch (error: any) {
        updateOutput(outputId, `Error: ${error.message}`, 'error');
      }
    });
  }

  if (postClearBtn) {
    postClearBtn.addEventListener('click', () => {
      updateOutput('postOutput', 'Click "Create Post" to run the example');
    });
  }
}
