import { describe, it, expect } from 'vitest';
import { FunctionMetadata } from '../src';
import { ParameterType } from '../src';
import { HttpMethod } from '@ahoo-wang/fetcher';

describe('FunctionMetadata.resolveRequest', () => {
  it('should resolve request with request parameter', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.POST },
      [
        {
          type: ParameterType.REQUEST,
          index: 0,
        },
      ],
    );

    const requestObject = {
      headers: { 'X-Custom': 'value' },
      query: { filter: 'active' },
      timeout: 5000,
    };
    const request = metadata.resolveRequest([requestObject]);
    expect(request.headers).toEqual({
      'X-Custom': 'value',
    });
    expect(request.query).toEqual({ filter: 'active' });
    expect(request.timeout).toBe(5000);
  });

  it('should merge endpoint request with parameter request', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.POST },
      [
        {
          type: ParameterType.PATH,
          name: 'id',
          index: 0,
        },
        {
          type: ParameterType.REQUEST,
          index: 1,
        },
      ],
    );

    const requestObject = {
      headers: { 'X-Custom': 'value' },
      query: { filter: 'active' },
      timeout: 5000,
    };
    const request = metadata.resolveRequest([123, requestObject]);

    // Path parameter should be merged
    expect(request.path).toEqual({ id: 123 });

    // Parameter request should take precedence
    expect(request.headers).toEqual({
      'X-Custom': 'value',
    });
    expect(request.query).toEqual({ filter: 'active' });
    expect(request.timeout).toBe(5000);
  });

  it('should give parameter request precedence over endpoint configuration', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      [
        {
          type: ParameterType.REQUEST,
          index: 0,
        },
      ],
    );

    const requestObject = {
      method: HttpMethod.POST,
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'John' },
    };
    const request = metadata.resolveRequest([requestObject]);

    // Parameter request should take precedence
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.headers).toEqual({
      'Content-Type': 'application/json',
    });
    expect(request.body).toEqual({ name: 'John' });
  });

  it('should handle empty parameter request', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.GET },
      [
        {
          type: ParameterType.REQUEST,
          index: 0,
        },
        {
          type: ParameterType.PATH,
          name: 'id',
          index: 1,
        },
      ],
    );

    const requestObject = {};
    const request = metadata.resolveRequest([requestObject, 456]);

    // Should fall back to endpoint configuration
    expect(request.method).toBe(HttpMethod.GET);
    // Path parameter should still be processed
    expect(request.path).toEqual({ id: 456 });
  });

  it('should merge nested objects correctly', () => {
    const metadata = new FunctionMetadata(
      'testFunc',
      {},
      { method: HttpMethod.POST },
      [
        {
          type: ParameterType.REQUEST,
          index: 0,
        },
        {
          type: ParameterType.PATH,
          name: 'userId',
          index: 1,
        },
        {
          type: ParameterType.QUERY,
          name: 'page',
          index: 2,
        },
      ],
    );

    const requestObject = {
      path: { postId: 123 },
      query: { filter: 'active' },
      headers: { Authorization: 'Bearer token' },
    };
    const request = metadata.resolveRequest([requestObject, 789, 2]);

    // Should merge nested objects
    expect(request.path).toEqual({
      postId: 123,
      userId: 789,
    });
    expect(request.query).toEqual({
      filter: 'active',
      page: 2,
    });
    expect(request.headers).toEqual({
      Authorization: 'Bearer token',
    });
  });
});
