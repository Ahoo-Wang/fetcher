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
import { describe, expect, it } from 'vitest';
import { foreignResponse } from './foreignResponse';

// The stand-in for a Response from another constructor must be a faithful
// standard Response apart from the helpers, or the #2030 tests prove little.
describe('foreignResponse test helper', () => {
  it('has the standard Response members', async () => {
    const response = foreignResponse('{"a":1}', {
      status: 201,
      statusText: 'Created',
      headers: { 'content-type': 'application/json' },
    });
    expect(response).not.toBeInstanceOf(Response);
    expect(response.status).toBe(201);
    expect(response.ok).toBe(true);
    expect(response.statusText).toBe('Created');
    expect(response.url).toBe('');
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.bodyUsed).toBe(false);
    expect(await response.json()).toEqual({ a: 1 });
    expect(response.bodyUsed).toBe(true);
    expect(await foreignResponse('text').text()).toBe('text');
    expect(foreignResponse(null).body).toBeNull();
  });

  it('has none of the helpers installed on Response.prototype', () => {
    expect('requiredEventStream' in foreignResponse('x')).toBe(false);
    expect('eventStream' in foreignResponse('x')).toBe(false);
  });
});
