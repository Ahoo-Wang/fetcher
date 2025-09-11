import { describe, it, expect, vi } from 'vitest';
import {
  HttpMethod,
  JsonResultExtractor,
  ExchangeResultExtractor, NamedFetcher, ResultExtractors,
} from '@ahoo-wang/fetcher';
import { RequestExecutor, DECORATOR_TARGET_ATTRIBUTE_KEY } from '../src';
import { FunctionMetadata } from '../src';
import { ParameterType, type ParameterMetadata } from '../src';

// Mock classes for testing
class MockFetcher extends NamedFetcher {
  constructor() {
    super('mock-fetcher');
  }

  request = vi.fn().mockResolvedValue('mock response');
}

describe('RequestExecutor', () => {
  const mockApiMetadata = {
    basePath: '/api/v1',
    headers: { 'X-API-Default': 'api-value' },
    timeout: 5000,
    resultExtractor: JsonResultExtractor,
  };

  const mockEndpointMetadata = {
    method: HttpMethod.GET,
    path: '/users/{id}',
    headers: { 'X-Endpoint-Default': 'endpoint-value' },
    timeout: 3000,
  };

  const mockParameterMetadata = new Map<number, ParameterMetadata>([
    [0, { type: ParameterType.PATH, name: 'id', index: 0 }],
    [1, { type: ParameterType.QUERY, name: 'filter', index: 1 }],
  ]);

  const mockFunctionMetadata = new FunctionMetadata(
    'getUser',
    mockApiMetadata,
    mockEndpointMetadata,
    mockParameterMetadata,
  );

  describe('constructor', () => {
    it('should create RequestExecutor instance with metadata', () => {
      const executor = new RequestExecutor(mockFunctionMetadata);
      expect(executor).toBeInstanceOf(RequestExecutor);
    });
  });

  describe('getTargetFetcher', () => {
    it('should return undefined when target is null', () => {
      const executor = new RequestExecutor(mockFunctionMetadata);
      // @ts-expect-error - accessing private method for testing
      const result = executor.getTargetFetcher(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined when target is not an object', () => {
      const executor = new RequestExecutor(mockFunctionMetadata);
      // @ts-expect-error - accessing private method for testing
      const result = executor.getTargetFetcher('not-an-object');
      expect(result).toBeUndefined();
    });

    it('should return undefined when target has no fetcher property', () => {
      const executor = new RequestExecutor(mockFunctionMetadata);
      // @ts-expect-error - accessing private method for testing
      const result = executor.getTargetFetcher({});
      expect(result).toBeUndefined();
    });

    it('should return undefined when target fetcher is not a Fetcher instance', () => {
      const executor = new RequestExecutor(mockFunctionMetadata);
      // @ts-expect-error - accessing private method for testing
      const result = executor.getTargetFetcher({ fetcher: 'not-a-fetcher' });
      expect(result).toBeUndefined();
    });

    it('should return fetcher when target has a valid Fetcher instance', () => {
      const executor = new RequestExecutor(mockFunctionMetadata);
      const mockFetcher = new MockFetcher();
      // @ts-expect-error - accessing private method for testing
      const result = executor.getTargetFetcher({ fetcher: mockFetcher });
      expect(result).toBe(mockFetcher);
    });
  });

  describe('execute', () => {
    it('should execute request with metadata fetcher when target has no fetcher', async () => {
      const mockFetcher = new MockFetcher();
      const metadataWithFetcher = new FunctionMetadata(
        'getUser',
        { ...mockApiMetadata, fetcher: mockFetcher },
        mockEndpointMetadata,
        mockParameterMetadata,
      );

      const executor = new RequestExecutor(metadataWithFetcher);
      const result = await executor.execute({}, ['123', 'active']);

      expect(result).toBe('mock response');
      expect(mockFetcher.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: HttpMethod.GET,
          url: '/api/v1/users/{id}', // URL template is not processed by FunctionMetadata
          urlParams: {
            path: { id: '123' },
            query: { filter: 'active' },
          },
        }),
        {
          resultExtractor: JsonResultExtractor,
          attributes: new Map([[DECORATOR_TARGET_ATTRIBUTE_KEY, {}]]),
        },
      );
    });

    it('should execute request with target fetcher when available', async () => {
      const targetFetcher = new MockFetcher();
      const metadataFetcher = new MockFetcher();

      const metadataWithFetcher = new FunctionMetadata(
        'getUser',
        { ...mockApiMetadata, fetcher: metadataFetcher },
        mockEndpointMetadata,
        mockParameterMetadata,
      );

      const executor = new RequestExecutor(metadataWithFetcher);
      const target = { fetcher: targetFetcher };
      const result = await executor.execute(target, ['123', 'active']);

      expect(result).toBe('mock response');
      expect(targetFetcher.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: HttpMethod.GET,
          url: '/api/v1/users/{id}', // URL template is not processed by FunctionMetadata
          urlParams: {
            path: { id: '123' },
            query: { filter: 'active' },
          },
        }),
        {
          resultExtractor: JsonResultExtractor,
          attributes: new Map([[DECORATOR_TARGET_ATTRIBUTE_KEY, target]]),
        },
      );
      // Ensure metadata fetcher was not called
      expect(metadataFetcher.request).not.toHaveBeenCalled();
    });

    it('should use endpoint result extractor when defined', async () => {
      const mockFetcher = new MockFetcher();
      mockFetcher.request = vi.fn().mockResolvedValue('endpoint extractor result');

      const metadataWithExtractor = new FunctionMetadata(
        'getUser',
        { ...mockApiMetadata, fetcher: mockFetcher },
        { ...mockEndpointMetadata, resultExtractor: ExchangeResultExtractor },
        mockParameterMetadata,
      );

      const executor = new RequestExecutor(metadataWithExtractor);
      const result = await executor.execute({}, ['123', 'active']);

      expect(result).toBe('endpoint extractor result');
      expect(mockFetcher.request).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
      );
    });

    it('should handle empty arguments', async () => {
      const mockFetcher = new MockFetcher();
      const metadataWithoutParams = new FunctionMetadata(
        'getUsers',
        { ...mockApiMetadata, fetcher: mockFetcher },
        { ...mockEndpointMetadata, path: '/users' },
        new Map(),
      );

      const executor = new RequestExecutor(metadataWithoutParams);
      const result = await executor.execute({}, []);

      expect(result).toBe('mock response');
      expect(mockFetcher.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: HttpMethod.GET,
          url: '/api/v1/users',
          urlParams: {
            path: {},
            query: {},
          },
        }),
        {
          resultExtractor: JsonResultExtractor,
          attributes: new Map([[DECORATOR_TARGET_ATTRIBUTE_KEY, {}]]),
        },
      );
    });

    it('should reject when fetcher request rejects', async () => {
      const mockFetcher = new MockFetcher();
      mockFetcher.request = vi.fn().mockRejectedValue(new Error('Request failed'));

      const metadataWithFetcher = new FunctionMetadata(
        'getUser',
        { ...mockApiMetadata, fetcher: mockFetcher },
        mockEndpointMetadata,
        mockParameterMetadata,
      );

      const executor = new RequestExecutor(metadataWithFetcher);

      await expect(executor.execute({}, ['123', 'active']))
        .rejects
        .toThrow('Request failed');
    });
  });
});