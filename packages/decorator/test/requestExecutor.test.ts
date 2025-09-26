import { describe, it, expect, vi } from 'vitest';
import {
  HttpMethod,
  JsonResultExtractor,
  ExchangeResultExtractor,
  NamedFetcher,
} from '@ahoo-wang/fetcher';
import {
  RequestExecutor,
  DECORATOR_TARGET_ATTRIBUTE_KEY,
  EndpointReturnType,
  DECORATOR_METADATA_ATTRIBUTE_KEY,
} from '../src';
import { FunctionMetadata } from '../src';
import { ParameterType, type ParameterMetadata } from '../src';

// Mock classes for testing
class MockFetcher extends NamedFetcher {
  constructor() {
    super('mock-fetcher');
  }

  exchange = vi.fn().mockResolvedValue({
    extractResult: vi.fn(),
  });
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
    it('should create RequestExecutor instance with target and metadata', () => {
      const executor = new RequestExecutor({}, mockFunctionMetadata);
      expect(executor).toBeInstanceOf(RequestExecutor);
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

      const executor = new RequestExecutor({}, metadataWithFetcher);
      await executor.execute(['123', 'active']);
      expect(mockFetcher.exchange).toHaveBeenCalledWith(
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
          attributes: new Map<string, any>([
            [DECORATOR_TARGET_ATTRIBUTE_KEY, {}],
            [DECORATOR_METADATA_ATTRIBUTE_KEY, metadataWithFetcher],
          ]),
        },
      );
    });

    it('should use endpoint result type when defined', async () => {
      const mockFetcher = new MockFetcher();
      mockFetcher.exchange = vi
        .fn()
        .mockResolvedValue('endpoint extractor result');

      const metadataWithExtractor = new FunctionMetadata(
        'getUser',
        {
          ...mockApiMetadata,
          fetcher: mockFetcher,
          returnType: EndpointReturnType.EXCHANGE,
        },
        { ...mockEndpointMetadata, resultExtractor: ExchangeResultExtractor },
        mockParameterMetadata,
      );

      const executor = new RequestExecutor({}, metadataWithExtractor);
      const result = await executor.execute(['123', 'active']);
      expect(result).toBe('endpoint extractor result');
      expect(mockFetcher.exchange).toHaveBeenCalledWith(
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

      const executor = new RequestExecutor({}, metadataWithoutParams);
      await executor.execute([]);

      expect(mockFetcher.exchange).toHaveBeenCalledWith(
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
          attributes: new Map<string, any>([
            [DECORATOR_TARGET_ATTRIBUTE_KEY, {}],
            [DECORATOR_METADATA_ATTRIBUTE_KEY, metadataWithoutParams],
          ]),
        },
      );
    });

    it('should reject when fetcher exchange rejects', async () => {
      const mockFetcher = new MockFetcher();
      mockFetcher.exchange = vi
        .fn()
        .mockRejectedValue(new Error('Request failed'));

      const metadataWithFetcher = new FunctionMetadata(
        'getUser',
        { ...mockApiMetadata, fetcher: mockFetcher },
        mockEndpointMetadata,
        mockParameterMetadata,
      );

      const executor = new RequestExecutor({}, metadataWithFetcher);

      await expect(executor.execute(['123', 'active'])).rejects.toThrow(
        'Request failed',
      );
    });
  });
});
