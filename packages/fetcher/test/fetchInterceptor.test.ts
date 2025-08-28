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

import { describe, expect, it, vi } from 'vitest';
import {
  FETCH_INTERCEPTOR_NAME,
  FETCH_INTERCEPTOR_ORDER,
  Fetcher,
  FetchExchange,
  FetchInterceptor,
} from '../src';

describe('FetchInterceptor', () => {
  it('should have correct name and order', () => {
    const interceptor = new FetchInterceptor();
    expect(interceptor.name).toBe(FETCH_INTERCEPTOR_NAME);
    expect(interceptor.order).toBe(FETCH_INTERCEPTOR_ORDER);
  });

  it('should call timeoutFetch and set response on exchange', async () => {
    const interceptor = new FetchInterceptor();
    const mockFetcher = {} as Fetcher;
    const request = { url: 'https://api.example.com/test' };
    const exchange = new FetchExchange(mockFetcher, request);

    const mockResponse = new Response('test response');
    const timeoutFetchSpy = vi
      .spyOn(await import('../src/timeout'), 'timeoutFetch')
      .mockResolvedValue(mockResponse);

    await interceptor.intercept(exchange);

    expect(timeoutFetchSpy).toHaveBeenCalledWith(request);
    expect(exchange.response).toBe(mockResponse);

    // Clean up spy
    timeoutFetchSpy.mockRestore();
  });
});
