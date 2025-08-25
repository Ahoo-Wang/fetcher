import { describe, it, expect } from 'vitest';
import { mergeRequest } from '../src';
import { HttpMethod } from '../src';

describe('mergeRequest', () => {
  it('should return second request when first request is empty', () => {
    const first = {};
    const second = {
      method: HttpMethod.POST,
      path: { id: 1 },
      query: { filter: 'active' },
      headers: { 'Content-Type': 'application/json' },
    };

    const result = mergeRequest(first, second);
    expect(result).toEqual(second);
  });

  it('should return first request when second request is empty', () => {
    const first = {
      method: HttpMethod.GET,
      path: { userId: 123 },
      headers: { Authorization: 'Bearer token' },
    };
    const second = {};

    const result = mergeRequest(first, second);
    expect(result).toEqual(first);
  });

  it('should merge path parameters', () => {
    const first = {
      path: { id: 1 },
    };
    const second = {
      path: { action: 'edit' },
    };

    const result = mergeRequest(first, second);
    expect(result.path).toEqual({ id: 1, action: 'edit' });
  });

  it('should merge query parameters', () => {
    const first = {
      query: { page: 1, limit: 10 },
    };
    const second = {
      query: { filter: 'active', sort: 'name' },
    };

    const result = mergeRequest(first, second);
    expect(result.query).toEqual({
      page: 1,
      limit: 10,
      filter: 'active',
      sort: 'name',
    });
  });

  it('should merge headers', () => {
    const first = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
    const second = {
      headers: { Authorization: 'Bearer token', 'X-Custom': 'value' },
    };

    const result = mergeRequest(first, second);
    expect(result.headers).toEqual({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Bearer token',
      'X-Custom': 'value',
    });
  });

  it('should give second request precedence for primitive values', () => {
    const first = {
      method: HttpMethod.GET,
      body: { name: 'John' },
      timeout: 5000,
    };
    const second = {
      method: HttpMethod.POST,
      body: { name: 'Jane' },
      timeout: 3000,
    };

    const result = mergeRequest(first, second);
    expect(result.method).toBe(HttpMethod.POST);
    expect(result.body).toEqual({ name: 'Jane' });
    expect(result.timeout).toBe(3000);
  });

  it('should handle undefined values correctly', () => {
    const first = {
      method: HttpMethod.GET,
      body: undefined,
      timeout: undefined,
    };
    const second = {
      method: undefined,
      body: { name: 'John' },
      timeout: 5000,
    };

    const result = mergeRequest(first, second);
    expect(result.method).toBe(HttpMethod.GET);
    expect(result.body).toEqual({ name: 'John' });
    expect(result.timeout).toBe(5000);
  });

  it('should handle null body values correctly', () => {
    const first = {
      body: null,
      timeout: 1000,
    };
    const second = {
      body: { name: 'John' },
      timeout: undefined,
    };

    const result = mergeRequest(first, second);
    expect(result.body).toEqual({ name: 'John' });
    expect(result.timeout).toBe(1000);
  });

  it('should merge complex requests correctly', () => {
    const first = {
      method: HttpMethod.GET,
      path: { userId: 123 },
      query: { page: 1 },
      headers: { Authorization: 'Bearer old-token' },
      timeout: 5000,
    };

    const second = {
      method: HttpMethod.POST,
      path: { postId: 456 },
      query: { filter: 'active' },
      headers: { 'Content-Type': 'application/json' },
      body: { title: 'New Post' },
      timeout: 3000,
    };

    const result = mergeRequest(first, second);
    expect(result).toEqual({
      method: HttpMethod.POST,
      path: { userId: 123, postId: 456 },
      query: { page: 1, filter: 'active' },
      headers: {
        Authorization: 'Bearer old-token',
        'Content-Type': 'application/json',
      },
      body: { title: 'New Post' },
      timeout: 3000,
    });
  });

  it('should preserve signal from second request', () => {
    const abortController = new AbortController();
    const first = {
      signal: null,
    };
    const second = {
      signal: abortController.signal,
    };

    const result = mergeRequest(first, second);
    expect(result.signal).toBe(abortController.signal);
  });

  it('should handle empty objects correctly', () => {
    const first = {
      path: {},
      query: {},
      headers: {},
    };
    const second = {
      path: { id: 1 },
      query: { filter: 'active' },
      headers: { 'Content-Type': 'application/json' },
    };

    const result = mergeRequest(first, second);
    expect(result.path).toEqual({ id: 1 });
    expect(result.query).toEqual({ filter: 'active' });
    expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
  });
});
