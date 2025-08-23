import { describe, it, expect } from 'vitest';
import { RequestBodyInterceptor } from '../src/requestBodyInterceptor';
import { FetcherRequest } from '../src';
import { ContentTypeHeader, ContentTypeValues } from '../src';

describe('RequestBodyInterceptor', () => {
  const interceptor = new RequestBodyInterceptor();

  it('should not modify request without body', () => {
    const request: FetcherRequest = {
      method: 'POST',
    };

    const result = interceptor.intercept(request);
    expect(result).toBe(request);
  });

  it('should not modify request with null body', () => {
    const request: FetcherRequest = {
      method: 'POST',
      body: null,
    };

    const result = interceptor.intercept(request);
    expect(result).toBe(request);
  });

  it('should not modify request with string body', () => {
    const request: FetcherRequest = {
      method: 'POST',
      body: 'plain text' as any,
    };

    const result = interceptor.intercept(request);
    expect(result).toBe(request);
  });

  it('should not modify request with number body', () => {
    const request: FetcherRequest = {
      method: 'POST',
      body: 42 as any,
    };

    const result = interceptor.intercept(request);
    expect(result).toBe(request);
  });

  it('should not modify request with boolean body', () => {
    const request: FetcherRequest = {
      method: 'POST',
      body: true as any,
    };

    const result = interceptor.intercept(request);
    expect(result).toBe(request);
  });

  it('should not modify request with ArrayBuffer body', () => {
    const arrayBuffer = new ArrayBuffer(8);
    const request: FetcherRequest = {
      method: 'POST',
      body: arrayBuffer as any,
    };

    const result = interceptor.intercept(request);
    expect(result).toBe(request);
  });

  it('should not modify request with Blob body', () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const request: FetcherRequest = {
      method: 'POST',
      body: blob as any,
    };

    const result = interceptor.intercept(request);
    expect(result).toBe(request);
  });

  it('should not modify request with FormData body', () => {
    const formData = new FormData();
    formData.append('key', 'value');
    const request: FetcherRequest = {
      method: 'POST',
      body: formData as any,
    };

    const result = interceptor.intercept(request);
    expect(result).toBe(request);
  });

  it('should not modify request with URLSearchParams body', () => {
    const params = new URLSearchParams({ key: 'value' });
    const request: FetcherRequest = {
      method: 'POST',
      body: params as any,
    };

    const result = interceptor.intercept(request);
    expect(result).toBe(request);
  });

  it('should not modify request with ReadableStream body', () => {
    const stream = new ReadableStream();
    const request: FetcherRequest = {
      method: 'POST',
      body: stream as any,
    };

    const result = interceptor.intercept(request);
    expect(result).toBe(request);
  });

  it('should not modify request with File body', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const request: FetcherRequest = {
      method: 'POST',
      body: file as any,
    };

    const result = interceptor.intercept(request);
    expect(result).toBe(request);
  });

  it('should not modify request with DataView body', () => {
    const buffer = new ArrayBuffer(16);
    const dataView = new DataView(buffer);
    const request: FetcherRequest = {
      method: 'POST',
      body: dataView as any,
    };

    const result = interceptor.intercept(request);
    expect(result).toBe(request);
  });

  it('should not modify request with TypedArray body', () => {
    const uint8Array = new Uint8Array([1, 2, 3]);
    const request: FetcherRequest = {
      method: 'POST',
      body: uint8Array as any,
    };

    const result = interceptor.intercept(request);
    expect(result).toBe(request);
  });

  it('should convert plain object to JSON string and set Content-Type header', () => {
    const requestBody = { name: 'John', age: 30 };
    const request: FetcherRequest = {
      method: 'POST',
      body: requestBody as any,
    };

    const result = interceptor.intercept(request);
    expect(result).not.toBe(request); // Should return a new object
    expect(result.body).toBe(JSON.stringify(requestBody));

    // Check that Content-Type header is set
    const headers = result.headers as Record<string, string>;
    expect(headers[ContentTypeHeader]).toBe(ContentTypeValues.APPLICATION_JSON);
  });

  it('should not override existing Content-Type header', () => {
    const requestBody = { name: 'John', age: 30 };
    const request: FetcherRequest = {
      method: 'POST',
      body: requestBody as any,
      headers: {
        [ContentTypeHeader]: 'text/plain',
      },
    };

    const result = interceptor.intercept(request);
    expect(result).not.toBe(request); // Should return a new object
    expect(result.body).toBe(JSON.stringify(requestBody));

    // Check that existing Content-Type header is preserved
    const headers = result.headers as Record<string, string>;
    expect(headers[ContentTypeHeader]).toBe('text/plain');
  });

  it('should handle array body by converting to JSON', () => {
    const requestBody = [1, 2, 3];
    const request: FetcherRequest = {
      method: 'POST',
      body: requestBody as any,
    };

    const result = interceptor.intercept(request);
    expect(result).not.toBe(request); // Should return a new object
    expect(result.body).toBe(JSON.stringify(requestBody));

    // Check that Content-Type header is set
    const headers = result.headers as Record<string, string>;
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
    const request: FetcherRequest = {
      method: 'POST',
      body: requestBody as any,
    };

    const result = interceptor.intercept(request);
    expect(result).not.toBe(request); // Should return a new object
    expect(result.body).toBe(JSON.stringify(requestBody));

    // Check that Content-Type header is set
    const headers = result.headers as Record<string, string>;
    expect(headers[ContentTypeHeader]).toBe(ContentTypeValues.APPLICATION_JSON);
  });

  it('should handle empty object body', () => {
    const requestBody = {};
    const request: FetcherRequest = {
      method: 'POST',
      body: requestBody as any,
    };

    const result = interceptor.intercept(request);
    expect(result).not.toBe(request); // Should return a new object
    expect(result.body).toBe(JSON.stringify(requestBody));

    // Check that Content-Type header is set
    const headers = result.headers as Record<string, string>;
    expect(headers[ContentTypeHeader]).toBe(ContentTypeValues.APPLICATION_JSON);
  });

  it('should handle null prototype object body', () => {
    const requestBody = Object.create(null);
    requestBody.name = 'John';
    const request: FetcherRequest = {
      method: 'POST',
      body: requestBody as any,
    };

    const result = interceptor.intercept(request);
    expect(result).not.toBe(request); // Should return a new object
    expect(result.body).toBe(JSON.stringify(requestBody));

    // Check that Content-Type header is set
    const headers = result.headers as Record<string, string>;
    expect(headers[ContentTypeHeader]).toBe(ContentTypeValues.APPLICATION_JSON);
  });
});
