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

import { describe, it, expect, vi } from 'vitest';
import { Fetcher } from '../src';
import { FetchExchange } from '../src';

describe('Fetcher Edge Cases', () => {
  it('should handle case where exchange has no response (covers lines 84-85)', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Mock the request method to return an exchange without response
    const mockRequest = vi.spyOn(fetcher as any, 'request').mockResolvedValue({
      fetcher,
      url: 'https://api.example.com/test',
      request: {},
      response: undefined, // No response
      error: undefined,
    } as FetchExchange);

    await expect(fetcher.fetch('/test')).rejects.toThrow(
      'Request to https://api.example.com/test failed with no response',
    );

    mockRequest.mockRestore();
  });
});
