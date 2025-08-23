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

import { describe, it, expect } from 'vitest';
import { RequestBodyInterceptor } from '../src/requestBodyInterceptor';
import { ContentTypeHeader, ContentTypeValues } from '../src';
import { Fetcher, FetchExchange } from '../src';

describe('RequestBodyInterceptor', () => {
  const interceptor = new RequestBodyInterceptor();
  const mockFetcher = new Fetcher();

  it('should not modify request without body', () => {
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).toBe(exchange);
  });

  it('should not modify request with null body', () => {
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: null,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).toBe(exchange);
  });

  it('should not modify request with string body', () => {
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: 'plain text' as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).toBe(exchange);
  });

  it('should not modify request with number body', () => {
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: 42 as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).toBe(exchange);
  });

  it('should not modify request with boolean body', () => {
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: true as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).toBe(exchange);
  });

  it('should not modify request with ArrayBuffer body', () => {
    const arrayBuffer = new ArrayBuffer(8);
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: arrayBuffer as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).toBe(exchange);
  });

  it('should not modify request with Blob body', () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: blob as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).toBe(exchange);
  });

  it('should not modify request with FormData body', () => {
    const formData = new FormData();
    formData.append('key', 'value');
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: formData as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).toBe(exchange);
  });

  it('should not modify request with URLSearchParams body', () => {
    const params = new URLSearchParams({ key: 'value' });
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: params as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).toBe(exchange);
  });

  it('should not modify request with ReadableStream body', () => {
    const stream = new ReadableStream();
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: stream as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).toBe(exchange);
  });

  it('should not modify request with File body', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: file as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).toBe(exchange);
  });

  it('should not modify request with DataView body', () => {
    const buffer = new ArrayBuffer(16);
    const dataView = new DataView(buffer);
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: dataView as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).toBe(exchange);
  });

  it('should not modify request with TypedArray body', () => {
    const uint8Array = new Uint8Array([1, 2, 3]);
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: uint8Array as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).toBe(exchange);
  });

  it('should convert plain object to JSON string and set Content-Type header', () => {
    const requestBody = { name: 'John', age: 30 };
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: requestBody as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).not.toBe(exchange); // Should return a new object
    expect(result.request.body).toBe(JSON.stringify(requestBody));

    // Check that Content-Type header is set
    const headers = result.request.headers as Record<string, string>;
    expect(headers[ContentTypeHeader]).toBe(ContentTypeValues.APPLICATION_JSON);
  });

  it('should not override existing Content-Type header', () => {
    const requestBody = { name: 'John', age: 30 };
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: requestBody as any,
        headers: {
          [ContentTypeHeader]: 'text/plain',
        },
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).not.toBe(exchange); // Should return a new object
    expect(result.request.body).toBe(JSON.stringify(requestBody));

    // Check that existing Content-Type header is preserved
    const headers = result.request.headers as Record<string, string>;
    expect(headers[ContentTypeHeader]).toBe('text/plain');
  });

  it('should handle array body by converting to JSON', () => {
    const requestBody = [1, 2, 3];
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: requestBody as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).not.toBe(exchange); // Should return a new object
    expect(result.request.body).toBe(JSON.stringify(requestBody));

    // Check that Content-Type header is set
    const headers = result.request.headers as Record<string, string>;
    expect(headers[ContentTypeHeader]).toBe(ContentTypeValues.APPLICATION_JSON);
  });

  it('should handle nested object body by converting to JSON', () => {
    const requestBody = {
      user: {
        name: 'John',
        address: {
          city: 'New York',
          zip: '10001',
        },
      },
    };
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: requestBody as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).not.toBe(exchange); // Should return a new object
    expect(result.request.body).toBe(JSON.stringify(requestBody));

    // Check that Content-Type header is set
    const headers = result.request.headers as Record<string, string>;
    expect(headers[ContentTypeHeader]).toBe(ContentTypeValues.APPLICATION_JSON);
  });

  it('should handle empty object body', () => {
    const requestBody = {};
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: requestBody as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).not.toBe(exchange); // Should return a new object
    expect(result.request.body).toBe(JSON.stringify(requestBody));

    // Check that Content-Type header is set
    const headers = result.request.headers as Record<string, string>;
    expect(headers[ContentTypeHeader]).toBe(ContentTypeValues.APPLICATION_JSON);
  });

  it('should handle null prototype object body', () => {
    const requestBody = Object.create(null);
    requestBody.name = 'John';
    const exchange: FetchExchange = {
      fetcher: mockFetcher,
      url: 'http://example.com',
      request: {
        method: 'POST',
        body: requestBody as any,
      },
      response: undefined,
      error: undefined,
    };

    const result = interceptor.intercept(exchange);
    expect(result).not.toBe(exchange); // Should return a new object
    expect(result.request.body).toBe(JSON.stringify(requestBody));

    // Check that Content-Type header is set
    const headers = result.request.headers as Record<string, string>;
    expect(headers[ContentTypeHeader]).toBe(ContentTypeValues.APPLICATION_JSON);
  });
});
