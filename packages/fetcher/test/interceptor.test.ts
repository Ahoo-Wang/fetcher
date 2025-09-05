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
  Fetcher,
  FetchExchange,
  Interceptor,
  InterceptorRegistry,
} from '../src';

describe('Interceptor', () => {
  it('should define Interceptor interface', () => {
    // This is a type-only interface, so we just verify it compiles
    const interceptor: Interceptor = {
      name: 'test-interceptor',
      order: 100,
      intercept: vi.fn(),
    };
    expect(interceptor.name).toBe('test-interceptor');
    expect(interceptor.order).toBe(100);
  });
});

describe('InterceptorRegistry', () => {
  const mockFetcher = {} as Fetcher;
  const mockRequest = { url: '/test' };

  it('should create InterceptorRegistry with default interceptors', () => {
    const registry = new InterceptorRegistry();
    expect(registry).toBeInstanceOf(InterceptorRegistry);
    expect(registry.name).toBe('InterceptorRegistry');
    expect(registry.order).toBe(Number.MIN_SAFE_INTEGER);
  });

  it('should create InterceptorRegistry with initial interceptors', () => {
    const interceptor1: Interceptor = {
      name: 'interceptor-1',
      order: 100,
      intercept: vi.fn(),
    };
    const interceptor2: Interceptor = {
      name: 'interceptor-2',
      order: 200,
      intercept: vi.fn(),
    };

    const registry = new InterceptorRegistry([interceptor1, interceptor2]);
    expect(registry).toBeInstanceOf(InterceptorRegistry);
    expect(registry.interceptors).toEqual([interceptor1, interceptor2]);
  });

  it('should add interceptor to registry', () => {
    const registry = new InterceptorRegistry();
    const interceptor: Interceptor = {
      name: 'test-interceptor',
      order: 100,
      intercept: vi.fn(),
    };

    const result = registry.use(interceptor);
    expect(result).toBe(true);
  });

  it('should not add interceptor with duplicate name', () => {
    const registry = new InterceptorRegistry();
    const interceptor1: Interceptor = {
      name: 'test-interceptor',
      order: 100,
      intercept: vi.fn(),
    };
    const interceptor2: Interceptor = {
      name: 'test-interceptor',
      order: 200,
      intercept: vi.fn(),
    };

    registry.use(interceptor1);
    const result = registry.use(interceptor2);
    expect(result).toBe(false);
  });

  it('should eject interceptor by name', () => {
    const registry = new InterceptorRegistry();
    const interceptor: Interceptor = {
      name: 'test-interceptor',
      order: 100,
      intercept: vi.fn(),
    };

    registry.use(interceptor);
    const result = registry.eject('test-interceptor');
    expect(result).toBe(true);
  });

  it('should return false when ejecting non-existent interceptor', () => {
    const registry = new InterceptorRegistry();
    const result = registry.eject('non-existent');
    expect(result).toBe(false);
  });

  it('should clear all interceptors', () => {
    const registry = new InterceptorRegistry();
    const interceptor: Interceptor = {
      name: 'test-interceptor',
      order: 100,
      intercept: vi.fn(),
    };

    registry.use(interceptor);
    registry.clear();
    // We can't directly check the internal array, but we can verify by trying to eject
    const result = registry.eject('test-interceptor');
    expect(result).toBe(false);
  });

  it('should execute interceptors in order', async () => {
    const registry = new InterceptorRegistry();
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
    });

    const interceptor1: Interceptor = {
      name: 'interceptor-1',
      order: 100,
      intercept: vi.fn(),
    };
    const interceptor2: Interceptor = {
      name: 'interceptor-2',
      order: 200,
      intercept: vi.fn(),
    };

    registry.use(interceptor1);
    registry.use(interceptor2);

    await registry.intercept(exchange);

    expect(interceptor1.intercept).toHaveBeenCalledWith(exchange);
    expect(interceptor2.intercept).toHaveBeenCalledWith(exchange);
  });

  it('should execute interceptors in correct order when added in different order', async () => {
    const registry = new InterceptorRegistry();
    const exchange = new FetchExchange({
      fetcher: mockFetcher,
      request: mockRequest,
    });

    const interceptor1: Interceptor = {
      name: 'interceptor-1',
      order: 200,
      intercept: vi.fn(),
    };
    const interceptor2: Interceptor = {
      name: 'interceptor-2',
      order: 100,
      intercept: vi.fn(),
    };

    // Add in reverse order
    registry.use(interceptor1);
    registry.use(interceptor2);

    await registry.intercept(exchange);

    // Should still execute in correct order (100 then 200)
    expect(interceptor2.intercept).toHaveBeenCalledBefore(
      interceptor1.intercept as any,
    );
  });
});
