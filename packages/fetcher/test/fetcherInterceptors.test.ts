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
import { FetchInterceptor, InterceptorManager, RequestBodyInterceptor, UrlResolveInterceptor, } from '../src';

describe('InterceptorManager', () => {
  it('should create InterceptorManager with default interceptors', () => {
    const interceptors = new InterceptorManager();

    expect(interceptors).toBeDefined();
    expect(interceptors.request).toBeDefined();
    expect(interceptors.response).toBeDefined();
    expect(interceptors.error).toBeDefined();
  });

  it('should have UrlResolveInterceptor in request interceptors', () => {
    const interceptors = new InterceptorManager();

    // Check that UrlResolveInterceptor is in the request interceptors
    const requestInterceptors = (interceptors.request as any)
      .sortedInterceptors;
    const urlResolveInterceptor = requestInterceptors.find(
      (interceptor: any) => interceptor instanceof UrlResolveInterceptor,
    );

    expect(urlResolveInterceptor).toBeDefined();
    expect(urlResolveInterceptor!.name).toBe('UrlResolveInterceptor');
  });

  it('should have RequestBodyInterceptor in request interceptors', () => {
    const interceptors = new InterceptorManager();

    // Check that RequestBodyInterceptor is in the request interceptors
    const requestInterceptors = (interceptors.request as any)
      .sortedInterceptors;
    const requestBodyInterceptor = requestInterceptors.find(
      (interceptor: any) => interceptor instanceof RequestBodyInterceptor,
    );

    expect(requestBodyInterceptor).toBeDefined();
    expect(requestBodyInterceptor!.name).toBe('RequestBodyInterceptor');
  });

  it('should have FetchInterceptor in request interceptors', () => {
    const interceptors = new InterceptorManager();

    // Check that FetchInterceptor is in the request interceptors
    const requestInterceptors = (interceptors.request as any)
      .sortedInterceptors;
    const fetchInterceptor = requestInterceptors.find(
      (interceptor: any) => interceptor instanceof FetchInterceptor,
    );

    expect(fetchInterceptor).toBeDefined();
    expect(fetchInterceptor!.name).toBe('FetchInterceptor');
  });

  it('should have correct order of default request interceptors', () => {
    const interceptors = new InterceptorManager();

    const requestInterceptors = (interceptors.request as any)
      .sortedInterceptors;

    // Check the order of interceptors
    expect(requestInterceptors[0].name).toBe('UrlResolveInterceptor');
    expect(requestInterceptors[0].order).toBe(Number.MIN_SAFE_INTEGER + 1000);

    expect(requestInterceptors[1].name).toBe('RequestBodyInterceptor');
    expect(requestInterceptors[1].order).toBe(Number.MIN_SAFE_INTEGER + 2000);

    expect(requestInterceptors[2].name).toBe('FetchInterceptor');
    expect(requestInterceptors[2].order).toBe(Number.MAX_SAFE_INTEGER - 1000);
  });

  it('should start with empty response and error interceptors', () => {
    const interceptors = new InterceptorManager();

    const responseInterceptors = (interceptors.response as any)
      .sortedInterceptors;
    const errorInterceptors = (interceptors.error as any).sortedInterceptors;

    expect(responseInterceptors).toHaveLength(0);
    expect(errorInterceptors).toHaveLength(0);
  });
});
