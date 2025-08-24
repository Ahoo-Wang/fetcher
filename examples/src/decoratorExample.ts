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

// Initialize the example
export function initDecoratorExample() {
  const exampleContainer = document.createElement('div');
  exampleContainer.className = 'example';
  exampleContainer.innerHTML = `
    <h2>Decorator Example</h2>
    <p>This example demonstrates the decorator functionality.</p>
    <button id="getUsersBtn">Show Decorator Usage</button>
    <div id="decoratorResult"></div>
  `;
  document.getElementById('app')!.appendChild(exampleContainer);

  const resultDiv = document.getElementById('decoratorResult')!;

  document
    .getElementById('getUsersBtn')!
    .addEventListener('click', async () => {
      try {
        resultDiv.innerHTML = `<p>The decorator package provides a clean way to define HTTP services using TypeScript decorators.</p>
      <pre>
// Example usage:
import { Fetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';
import { api, get, post, path, query, body } from '@ahoo-wang/fetcher-decorator';

const userFetcher = new Fetcher({ baseURL: 'https://api.example.com' });
fetcherRegistrar.register('user', userFetcher);

@api('/users', { fetcher: 'user' })
class UserService {
  @get('/')
  getUsers(@query('limit') limit?: number) {
    throw new Error('Implementation will be generated automatically.');
  }
  
  @post('/')
  createUser(@body() user: User) {
    throw new Error('Implementation will be generated automatically.');
  }
  
  @get('/{id}')
  getUser(@path('id') id: number) {
    throw new Error('Implementation will be generated automatically.');
  }
}

const userService = new UserService();
// Usage: userService.getUsers(10);
      </pre>`;
      } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${(error as Error).message}</p>`;
      }
    });
}
