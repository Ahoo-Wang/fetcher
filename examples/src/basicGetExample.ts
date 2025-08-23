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

// Create a Fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
});

// Helper function to update output
export function updateOutput(
  elementId: string,
  content: string,
  className: string = '',
): void {
  const outputElement = document.getElementById(elementId);
  if (outputElement) {
    outputElement.textContent = content;
    outputElement.className = `output ${className}`;
  }
}

// Helper function to show loading state
export function showLoading(elementId: string): void {
  updateOutput(elementId, 'Loading...', 'loading');
}

// Basic GET Request Example
export function initBasicGetExample(): void {
  const basicGetBtn = document.getElementById('basicGetBtn');
  const basicGetClearBtn = document.getElementById('basicGetClearBtn');

  if (basicGetBtn) {
    basicGetBtn.addEventListener('click', async () => {
      const outputId = 'basicGetOutput';
      showLoading(outputId);

      try {
        const response: Response = await fetcher.get('/posts/1');
        const data = await response.json();
        updateOutput(outputId, JSON.stringify(data, null, 2), 'success');
      } catch (error: any) {
        updateOutput(outputId, `Error: ${error.message}`, 'error');
      }
    });
  }

  if (basicGetClearBtn) {
    basicGetClearBtn.addEventListener('click', () => {
      updateOutput(
        'basicGetOutput',
        'Click "Fetch Post #1" to run the example',
      );
    });
  }
}
