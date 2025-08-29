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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FunctionMetadata,
  ParameterType,
  RequestExecutor,
  api,
  get,
} from '../src';
import { fetcherRegistrar, HttpMethod } from '@ahoo-wang/fetcher';
import * as fetcherCapableModule from '../src/fetcherCapable';
import 'reflect-metadata';

// Mock fetcher
const mockRequest = vi.fn();
const mockFetcher: any = {
  request: mockRequest,
};

describe('RequestExecutor - execute method', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Mock fetcher registrar
    vi.spyOn(fetcherRegistrar, 'requiredGet').mockReturnValue(mockFetcher);

    // Mock getFetcher function to return our mock fetcher
    vi.spyOn(fetcherCapableModule, 'getFetcher').mockReturnValue(mockFetcher);
  });

  it('should execute HTTP request and return response', async () => {
    const mockResponse = new Response('{"id": 1, "name": "John"}');
    const mockExchange = {
      request: {} as any,
      response: Promise.resolve(mockResponse),
      requiredResponse: mockResponse,
    };

    mockRequest.mockResolvedValue(mockExchange);

    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: 'http://localhost/api' },
      { method: HttpMethod.GET, path: '/users/{id}' },
      new Map([
        [
          0,
          {
            type: ParameterType.PATH,
            name: 'id',
            index: 0,
          },
        ],
      ]),
    );

    const executor = new RequestExecutor(metadata);
    const result = await executor.execute(null, ['123']);

    expect(mockRequest).toHaveBeenCalledWith({
      url: 'http://localhost/api/users/{id}',
      method: 'GET',
      urlParams: {
        path: { id: '123' },
        query: {},
      },
      headers: {},
      body: undefined,
      timeout: undefined,
      signal: undefined,
    });

    expect(result).toEqual({ id: 1, name: 'John' });
  });

  it('should execute request through decorator binding', async () => {
    // This test ensures the actual executor execution path is covered
    const mockResponse = new Response('{"users": [{"id": 1, "name": "John"}]}');
    const mockExchange = {
      request: {} as any,
      response: Promise.resolve(mockResponse),
      requiredResponse: mockResponse,
    };

    mockRequest.mockResolvedValue(mockExchange);

    // Create a service class that will go through the full decorator binding process
    @api('/api')
    class TestService {
      @get('/users')
      getUsers() {
        // This will be replaced by the executor
        throw new Error('Should not be called');
      }
    }

    const instance = new TestService();
    // The getUsers method should now be the executor function
    expect(typeof instance.getUsers).toBe('function');

    // Call the method - this should trigger the execution path
    const result = await instance.getUsers();
    expect(result).toEqual({ users: [{ id: 1, name: 'John' }] });

    // Verify the request was made
    expect(mockRequest).toHaveBeenCalled();
  });

  it('should execute HTTP request with query parameters', async () => {
    const mockResponse = new Response('{"users": [{"id": 1, "name": "John"}]}');
    const mockExchange = {
      request: {} as any,
      response: Promise.resolve(mockResponse),
      requiredResponse: mockResponse,
    };

    mockRequest.mockResolvedValue(mockExchange);

    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: 'http://localhost/api' },
      { method: HttpMethod.GET, path: '/users' },
      new Map([
        [
          0,
          {
            type: ParameterType.QUERY,
            name: 'limit',
            index: 0,
          },
        ],
        [
          1,
          {
            type: ParameterType.QUERY,
            name: 'offset',
            index: 1,
          },
        ],
      ]),
    );

    const executor = new RequestExecutor(metadata);
    const result = await executor.execute(null, ['10', '0']);

    expect(mockRequest).toHaveBeenCalledWith({
      url: 'http://localhost/api/users',
      method: 'GET',
      urlParams: {
        path: {},
        query: { limit: '10', offset: '0' },
      },
      headers: {},
      body: undefined,
      timeout: undefined,
      signal: undefined,
    });

    expect(result).toEqual({ users: [{ id: 1, name: 'John' }] });
  });

  it('should execute HTTP request with headers', async () => {
    const mockResponse = new Response('{"id": 1, "name": "John"}');
    const mockExchange = {
      request: {} as any,
      response: Promise.resolve(mockResponse),
      requiredResponse: mockResponse,
    };

    mockRequest.mockResolvedValue(mockExchange);

    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: 'http://localhost/api' },
      { method: HttpMethod.POST, path: '/users' },
      new Map([
        [
          0,
          {
            type: ParameterType.HEADER,
            name: 'Authorization',
            index: 0,
          },
        ],
        [
          1,
          {
            type: ParameterType.BODY,
            index: 1,
          },
        ],
      ]),
    );

    const executor = new RequestExecutor(metadata);
    const result = await executor.execute(null, [
      'Bearer token',
      { name: 'John' },
    ]);

    expect(mockRequest).toHaveBeenCalledWith({
      url: 'http://localhost/api/users',
      method: 'POST',
      urlParams: {
        path: {},
        query: {},
      },
      headers: { Authorization: 'Bearer token' },
      body: { name: 'John' },
      timeout: undefined,
      signal: undefined,
    });

    expect(result).toEqual({ id: 1, name: 'John' });
  });

  it('should execute HTTP request with timeout', async () => {
    const mockResponse = new Response('{"id": 1, "name": "John"}');
    const mockExchange = {
      request: {} as any,
      response: Promise.resolve(mockResponse),
      requiredResponse: mockResponse,
    };

    mockRequest.mockResolvedValue(mockExchange);

    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: 'http://localhost/api', timeout: 5000 },
      { method: HttpMethod.GET, path: '/users/{id}' },
      new Map([
        [
          0,
          {
            type: ParameterType.PATH,
            name: 'id',
            index: 0,
          },
        ],
      ]),
    );

    const executor = new RequestExecutor(metadata);
    const result = await executor.execute(null, ['123']);

    expect(mockRequest).toHaveBeenCalledWith({
      url: 'http://localhost/api/users/{id}',
      method: 'GET',
      urlParams: {
        path: { id: '123' },
        query: {},
      },
      headers: {},
      body: undefined,
      timeout: 5000,
      signal: undefined,
    });

    expect(result).toEqual({ id: 1, name: 'John' });
  });

  it('should execute HTTP request with AbortSignal', async () => {
    const mockResponse = new Response('{"id": 1, "name": "John"}');
    const mockExchange = {
      request: {} as any,
      response: Promise.resolve(mockResponse),
      requiredResponse: mockResponse,
    };

    mockRequest.mockResolvedValue(mockExchange);

    const metadata = new FunctionMetadata(
      'testFunc',
      { basePath: 'http://localhost/api' },
      { method: HttpMethod.GET, path: '/users/{id}' },
      new Map([
        [
          0,
          {
            type: ParameterType.PATH,
            name: 'id',
            index: 0,
          },
        ],
      ]),
    );

    const executor = new RequestExecutor(metadata);
    const abortController = new AbortController();
    const result = await executor.execute(null, [
      '123',
      abortController.signal,
    ]);

    expect(mockRequest).toHaveBeenCalledWith({
      url: 'http://localhost/api/users/{id}',
      method: 'GET',
      urlParams: {
        path: { id: '123' },
        query: {},
      },
      headers: {},
      body: undefined,
      timeout: undefined,
      signal: abortController.signal,
    });

    expect(result).toEqual({ id: 1, name: 'John' });
  });
});
