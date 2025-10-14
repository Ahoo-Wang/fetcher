import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
} from 'vitest';
import {
  HttpMethod,
  JsonResultExtractor,
  ExchangeResultExtractor,
  NamedFetcher,
} from '@ahoo-wang/fetcher';
import {
  RequestExecutor,
  EndpointReturnType,

} from '../src';
import { FunctionMetadata } from '../src';
import { ParameterType, type ParameterMetadata } from '../src';

// Mock classes for testing
const mockFetcher = new NamedFetcher('mock-fetcher');

describe('RequestExecutor', () => {
  beforeAll(() => {
    vi.spyOn(mockFetcher.interceptors, 'exchange').mockImplementation(
      async exchange => {
        // Mock the extractResult to return a mock value
        exchange.extractResult = vi.fn().mockResolvedValue('mock result');
        return exchange;
      },
    );
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

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
      const metadataWithFetcher = new FunctionMetadata(
        'getUser',
        { ...mockApiMetadata, fetcher: mockFetcher },
        mockEndpointMetadata,
        mockParameterMetadata,
      );

      const executor = new RequestExecutor({}, metadataWithFetcher);
      const result = await executor.execute(['123', 'active']);
      expect(result).toBe('mock result');
    });

    it('should use endpoint result type when defined', async () => {
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
      expect(result).toBeInstanceOf(Object); // Should return the exchange object
    });

    it('should handle empty arguments', async () => {
      const metadataWithoutParams = new FunctionMetadata(
        'getUsers',
        { ...mockApiMetadata, fetcher: mockFetcher },
        { ...mockEndpointMetadata, path: '/users' },
        new Map(),
      );

      const executor = new RequestExecutor({}, metadataWithoutParams);
      const result = await executor.execute([]);
      expect(result).toBe('mock result');
    });

    it('should reject when fetcher exchange rejects', async () => {
      (mockFetcher.interceptors.exchange as any).mockRejectedValueOnce(
        new Error('Request failed'),
      );

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

    it('should call lifecycle hooks when target implements ExecuteLifeCycle', async () => {
      const target = {
        beforeExecute: vi.fn().mockResolvedValue(undefined),
        afterExecute: vi.fn().mockResolvedValue(undefined),
      };

      const metadataWithFetcher = new FunctionMetadata(
        'getUser',
        { ...mockApiMetadata, fetcher: mockFetcher },
        mockEndpointMetadata,
        mockParameterMetadata,
      );

      const executor = new RequestExecutor(target, metadataWithFetcher);
      await executor.execute(['123', 'active']);

      expect(target.beforeExecute).toHaveBeenCalledWith(expect.any(Object));
      expect(target.afterExecute).toHaveBeenCalledWith(expect.any(Object));
    });
  });
});
