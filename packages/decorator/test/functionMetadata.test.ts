import { describe, it, expect, vi } from 'vitest';
import {
  HttpMethod,
  JsonResultExtractor,
  ExchangeResultExtractor,
  fetcher, NamedFetcher,
} from '@ahoo-wang/fetcher';
import { FunctionMetadata } from '../src';
import { ParameterType, type ParameterMetadata } from '../src';
import { ResultExtractors } from '../src';

// Mock classes for testing
class MockFetcher extends NamedFetcher {
  constructor() {
    super('mock-fetcher');
  }
}

describe('FunctionMetadata', () => {
  const mockApiMetadata = {
    basePath: '/api/v1',
    headers: { 'X-API-Default': 'api-value' },
    timeout: 5000,
    resultExtractor: JsonResultExtractor,
    fetcher: 'default-fetcher',
  };

  const mockEndpointMetadata = {
    method: HttpMethod.GET,
    path: '/users/{id}',
    headers: { 'X-Endpoint-Default': 'endpoint-value' },
    timeout: 3000,
    resultExtractor: ExchangeResultExtractor,
  };

  const mockParameterMetadata = new Map<number, ParameterMetadata>([
    [0, { type: ParameterType.PATH, name: 'id', index: 0 }],
    [1, { type: ParameterType.QUERY, name: 'filter', index: 1 }],
    [2, { type: ParameterType.HEADER, name: 'Authorization', index: 2 }],
    [3, { type: ParameterType.BODY, index: 3 }],
  ]);

  describe('constructor', () => {
    it('should create FunctionMetadata instance with all properties', () => {
      const functionMetadata = new FunctionMetadata(
        'getUser',
        mockApiMetadata,
        mockEndpointMetadata,
        mockParameterMetadata,
      );

      expect(functionMetadata.name).toBe('getUser');
      expect(functionMetadata.api).toBe(mockApiMetadata);
      expect(functionMetadata.endpoint).toBe(mockEndpointMetadata);
      expect(functionMetadata.parameters).toBe(mockParameterMetadata);
    });
  });

  describe('fetcher', () => {
    it('should return endpoint fetcher when defined', () => {
      const endpointFetcher = new MockFetcher();
      const apiFetcher = new MockFetcher();

      const functionMetadata = new FunctionMetadata(
        'test',
        { ...mockApiMetadata, fetcher: apiFetcher },
        { ...mockEndpointMetadata, fetcher: endpointFetcher },
        mockParameterMetadata,
      );

      expect(functionMetadata.fetcher).toBe(endpointFetcher);
    });

    it('should return api fetcher when endpoint fetcher is not defined', () => {
      const apiFetcher = new MockFetcher();

      const functionMetadata = new FunctionMetadata(
        'test',
        { ...mockApiMetadata, fetcher: apiFetcher },
        { ...mockEndpointMetadata, fetcher: undefined },
        mockParameterMetadata,
      );

      expect(functionMetadata.fetcher).toBe(apiFetcher);
    });

    it('should return default fetcher when neither endpoint nor api fetcher is defined', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { ...mockApiMetadata, fetcher: undefined },
        { ...mockEndpointMetadata, fetcher: undefined },
        mockParameterMetadata,
      );

      expect(functionMetadata.fetcher).toBe(fetcher);
    });
  });

  describe('resolvePath', () => {
    it('should combine base path and endpoint path', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { basePath: '/api/v1' },
        { path: '/users' },
        new Map(),
      );

      const path = functionMetadata.resolvePath();
      expect(path).toBe('/api/v1/users');
    });

    it('should use parameter path when provided', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { basePath: '/api/v1' },
        { path: '/users' },
        new Map(),
      );

      const path = functionMetadata.resolvePath('/custom/path');
      expect(path).toBe('/api/v1/custom/path');
    });

    it('should handle empty paths', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        {},
        {},
        new Map(),
      );

      const path = functionMetadata.resolvePath();
      expect(path).toBe('');
    });

    it('should prioritize endpoint base path over api base path', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { basePath: '/api/v1' },
        { basePath: '/api/v2', path: '/users' },
        new Map(),
      );

      const path = functionMetadata.resolvePath();
      expect(path).toBe('/api/v2/users');
    });
  });

  describe('resolveTimeout', () => {
    it('should return endpoint timeout when defined', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { timeout: 5000 },
        { timeout: 3000 },
        new Map(),
      );

      const timeout = functionMetadata.resolveTimeout();
      expect(timeout).toBe(3000);
    });

    it('should return api timeout when endpoint timeout is not defined', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { timeout: 5000 },
        { timeout: undefined },
        new Map(),
      );

      const timeout = functionMetadata.resolveTimeout();
      expect(timeout).toBe(5000);
    });

    it('should return undefined when neither endpoint nor api timeout is defined', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { timeout: undefined },
        { timeout: undefined },
        new Map(),
      );

      const timeout = functionMetadata.resolveTimeout();
      expect(timeout).toBeUndefined();
    });
  });

  describe('resolveResultExtractor', () => {
    it('should return endpoint result extractor when defined', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { resultExtractor: JsonResultExtractor },
        { resultExtractor: ExchangeResultExtractor },
        new Map(),
      );

      const extractor = functionMetadata.resolveResultExtractor();
      expect(extractor).toBe(ExchangeResultExtractor);
    });

    it('should return api result extractor when endpoint result extractor is not defined', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { resultExtractor: JsonResultExtractor },
        { resultExtractor: undefined },
        new Map(),
      );

      const extractor = functionMetadata.resolveResultExtractor();
      expect(extractor).toBe(JsonResultExtractor);
    });

    it('should return default result extractor when neither endpoint nor api result extractor is defined', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { resultExtractor: undefined },
        { resultExtractor: undefined },
        new Map(),
      );

      const extractor = functionMetadata.resolveResultExtractor();
      expect(extractor).toBe(ResultExtractors.DEFAULT);
    });
  });

  describe('resolveAttributes', () => {
    it('should merge api and endpoint attributes', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { attributes: { apiAttr: 'api-value', shared: 'api' } },
        { attributes: { endpointAttr: 'endpoint-value', shared: 'endpoint' } },
        new Map(),
      );

      const attributes = functionMetadata.resolveAttributes();
      expect(attributes).toEqual({
        apiAttr: 'api-value',
        endpointAttr: 'endpoint-value',
        shared: 'endpoint', // endpoint should override api
      });
    });

    it('should handle missing attributes', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        {},
        {},
        new Map(),
      );

      const attributes = functionMetadata.resolveAttributes();
      expect(attributes).toEqual({});
    });

    it('should handle partial attributes', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { attributes: { apiAttr: 'api-value' } },
        {},
        new Map(),
      );

      const attributes = functionMetadata.resolveAttributes();
      expect(attributes).toEqual({ apiAttr: 'api-value' });
    });
  });

  describe('resolveExchangeInit', () => {
    it('should process path parameters correctly', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        {},
        { method: HttpMethod.GET },
        new Map([[0, { type: ParameterType.PATH, name: 'id', index: 0 }]]),
      );

      const result = functionMetadata.resolveExchangeInit(['123']);
      expect(result.request.urlParams?.path).toEqual({ id: '123' });
    });

    it('should process query parameters correctly', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        {},
        { method: HttpMethod.GET },
        new Map([[0, { type: ParameterType.QUERY, name: 'filter', index: 0 }]]),
      );

      const result = functionMetadata.resolveExchangeInit(['active']);
      expect(result.request.urlParams?.query).toEqual({ filter: 'active' });
    });

    it('should process header parameters correctly', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        {},
        { method: HttpMethod.GET },
        new Map([[0, { type: ParameterType.HEADER, name: 'Authorization', index: 0 }]]),
      );

      const result = functionMetadata.resolveExchangeInit(['Bearer token']);
      expect(result.request.headers).toEqual({ Authorization: 'Bearer token' });
    });

    it('should process body parameter correctly', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        {},
        { method: HttpMethod.POST },
        new Map([[0, { type: ParameterType.BODY, index: 0 }]]),
      );

      const bodyData = { name: 'test' };
      const result = functionMetadata.resolveExchangeInit([bodyData]);
      expect(result.request.body).toBe(bodyData);
    });

    it('should process request parameter correctly', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        {},
        { method: HttpMethod.POST },
        new Map([[0, { type: ParameterType.REQUEST, index: 0 }]]),
      );

      const requestData = {
        headers: { 'X-Custom': 'value' },
        timeout: 1000,
      };

      const result = functionMetadata.resolveExchangeInit([requestData]);
      expect(result.request.headers).toEqual({ 'X-Custom': 'value' });
      expect(result.request.timeout).toBe(1000);
    });

    it('should process attribute parameter correctly', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        {},
        { method: HttpMethod.GET },
        new Map([[0, { type: ParameterType.ATTRIBUTE, name: 'userId', index: 0 }]]),
      );

      const result = functionMetadata.resolveExchangeInit(['user123']);
      expect(result.attributes).toEqual({ userId: 'user123' });
    });

    it('should process attributes parameter correctly', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        {},
        { method: HttpMethod.GET },
        new Map([[0, { type: ParameterType.ATTRIBUTES, index: 0 }]]),
      );

      const attrs = { attr1: 'value1', attr2: 'value2' };
      const result = functionMetadata.resolveExchangeInit([attrs]);
      expect(result.attributes).toEqual(attrs);
    });

    it('should handle AbortSignal parameter', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        {},
        { method: HttpMethod.GET },
        new Map(),
      );

      // Create an AbortSignal using AbortController
      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      const result = functionMetadata.resolveExchangeInit([abortSignal]);
      expect(result.request.signal).toBe(abortSignal);
    });

    it('should handle AbortController parameter', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        {},
        { method: HttpMethod.GET },
        new Map(),
      );

      const abortController = new AbortController();
      const result = functionMetadata.resolveExchangeInit([abortController]);
      expect(result.request.abortController).toBe(abortController);
    });

    it('should merge api and endpoint headers', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { headers: { 'X-API': 'api-value' } },
        { method: HttpMethod.GET, headers: { 'X-Endpoint': 'endpoint-value' } },
        new Map(),
      );

      const result = functionMetadata.resolveExchangeInit([]);
      expect(result.request.headers).toEqual({
        'X-API': 'api-value',
        'X-Endpoint': 'endpoint-value',
      });
    });

    it('should resolve timeout from metadata', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { timeout: 5000 },
        { method: HttpMethod.GET },
        new Map(),
      );

      const result = functionMetadata.resolveExchangeInit([]);
      expect(result.request.timeout).toBe(5000);
    });

    it('should resolve complete URL', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        { basePath: '/api/v1' },
        { method: HttpMethod.GET, path: '/users' },
        new Map(),
      );

      const result = functionMetadata.resolveExchangeInit([]);
      expect(result.request.url).toBe('/api/v1/users');
    });
  });

  describe('processAttributesParam', () => {
    it('should throw error when attributes parameter is not an object', () => {
      const functionMetadata = new FunctionMetadata(
        'test',
        {},
        { method: HttpMethod.GET },
        new Map([[0, { type: ParameterType.ATTRIBUTES, index: 0 }]]),
      );

      expect(() => {
        functionMetadata.resolveExchangeInit(['not-an-object']);
      }).toThrow('@attributes() parameter must be an object');
    });
  });
});