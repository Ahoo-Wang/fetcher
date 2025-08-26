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
import { ContentTypeValues, Fetcher, FetchExchange, RequestBodyInterceptor } from '../src';

describe('RequestBodyInterceptor', () => {
  const interceptor = new RequestBodyInterceptor();
  const mockFetcher = new Fetcher();

  it('should have correct name and order', () => {
    expect(interceptor.name).toBe('RequestBodyInterceptor');
    expect(interceptor.order).toBe(Number.MIN_SAFE_INTEGER + 200);
  });

  it('should not modify request without body', () => {
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
      },
    );

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBeUndefined();
  });

  it('should not modify request with null body', () => {
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: null,
      },
    );

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBeNull();
  });

  it('should not modify request with string body', () => {
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: 'plain text' as any,
      },
    );

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe('plain text');
  });

  it('should not modify request with number body', () => {
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: 42 as any,
      },
    );

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(42);
  });

  it('should not modify request with boolean body', () => {
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: true as any,
      },
    );

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(true);
  });

  it('should not modify request with ArrayBuffer body', () => {
    const arrayBuffer = new ArrayBuffer(8);
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: arrayBuffer as any,
      },
    );

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(arrayBuffer);
  });

  it('should not modify request with Blob body', () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: blob as any,
      });

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(blob);
  });

  it('should not modify request with FormData body', () => {
    const formData = new FormData();
    formData.append('key', 'value');
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: formData as any,
      });

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(formData);
  });

  it('should not modify request with URLSearchParams body', () => {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('key', 'value');
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: urlSearchParams as any,
      },
    );

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(urlSearchParams);
  });

  it('should not modify request with ReadableStream body', () => {
    const stream = new ReadableStream();
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: stream as any,
      });

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(stream);
  });

  it('should not modify request with File body', () => {
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: file,
      });

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(file);
  });

  it('should not modify request with DataView body', () => {
    const arrayBuffer = new ArrayBuffer(16);
    const dataView = new DataView(arrayBuffer);
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: dataView,
      });

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(dataView);
  });

  it('should not modify request with TypedArray body', () => {
    const typedArray = new Uint8Array([1, 2, 3]);
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: typedArray as any,
      });

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(typedArray);
  });

  it('should convert plain object to JSON string and set Content-Type header', () => {
    const requestBody = { name: 'John', age: 30 };
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: requestBody as any,
      });

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(JSON.stringify(requestBody));
    expect(exchange.request.body).toBe(JSON.stringify(requestBody));

    // Check that Content-Type header is set
    const headers = exchange.request.headers!;
    expect(headers['Content-Type']).toBe(ContentTypeValues.APPLICATION_JSON);
  });

  it('should not override existing Content-Type header', () => {
    const requestBody = { name: 'John', age: 30 };
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: requestBody as any,
        headers: {
          ['Content-Type']: 'text/plain',
        },
      });

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(JSON.stringify(requestBody));
    expect(exchange.request.body).toBe(JSON.stringify(requestBody));

    // Check that existing Content-Type header is preserved
    const headers = exchange.request.headers!;
    expect(headers['Content-Type']).toBe('text/plain');
  });

  it('should handle array body by converting to JSON', () => {
    const requestBody = [1, 2, 3];
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: requestBody as any,
      });

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(JSON.stringify(requestBody));
    expect(exchange.request.body).toBe(JSON.stringify(requestBody));

    // Check that Content-Type header is set
    const headers = exchange.request.headers!;
    expect(headers['Content-Type']).toBe(ContentTypeValues.APPLICATION_JSON);
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
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method: 'POST',
        body: requestBody as any,
      });

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(JSON.stringify(requestBody));
    expect(exchange.request.body).toBe(JSON.stringify(requestBody));

    // Check that Content-Type header is set
    const headers = exchange.request.headers!;
    expect(headers['Content-Type']).toBe(ContentTypeValues.APPLICATION_JSON);
  });

  it('should handle empty object body', () => {
    const requestBody = {};
    const exchange = new FetchExchange(
      mockFetcher,
      {
        url: 'http://example.com',
        method:
          'POST',
        body:
          requestBody as any,
      });

    interceptor.intercept(exchange);
    expect(exchange.request.body).toBe(JSON.stringify(requestBody));
    expect(exchange.request.body).toBe(JSON.stringify(requestBody));

// Check that Content-Type header is set
    const headers = exchange.request.headers!;
    expect(headers['Content-Type']).toBe(ContentTypeValues.APPLICATION_JSON);
  })
  ;
})
;
