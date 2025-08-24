import { describe, it, expect, vi } from 'vitest';
import {
  api,
  get,
  post,
  put,
  del,
  patch,
  path,
  query,
  body,
  header,
} from '../../src';
import { fetcherRegistrar } from '@ahoo-wang/fetcher';
import { Fetcher } from '@ahoo-wang/fetcher';
import 'reflect-metadata';

describe('decorators integration tests', () => {
  it('should execute decorated methods and make actual HTTP calls', async () => {
    // Mock fetch implementation
    const mockResponse = new Response('{"id": 1, "name": "test"}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    // Create and register a mock fetcher
    const mockFetcher = {
      fetch: mockFetch,
      timeout: 5000,
    } as unknown as Fetcher;

    fetcherRegistrar.register('default', mockFetcher);

    @api('/api/v1')
    class UserService {
      @get('/users/{id}')
      getUser(@path('id') id: number, @query('include') include: string) {
        throw new Error('Implementation will be generated automatically.');
      }

      @post('/users')
      createUser(@body() user: any) {
        throw new Error('Implementation will be generated automatically.');
      }
    }

    const service = new UserService();

    // Test GET request
    const getResponse = await service.getUser(123, 'profile');
    expect(getResponse).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/{id}', {
      method: 'GET',
      headers: undefined,
      pathParams: { id: 123 },
      queryParams: { include: 'profile' },
      body: undefined,
      timeout: 5000,
    });

    // Reset mock
    mockFetch.mockClear();

    // Test POST request
    const postResponse = await service.createUser({ name: 'test' });
    expect(postResponse).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/users', {
      method: 'POST',
      headers: undefined,
      pathParams: undefined,
      queryParams: undefined,
      body: { name: 'test' },
      timeout: 5000,
    });
  });

  it('should handle custom fetcher and timeout settings', async () => {
    // Mock fetch implementation
    const mockResponse = new Response('{"success": true}', { status: 200 });
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    // Create and register a mock fetcher with custom timeout
    const mockFetcher = {
      fetch: mockFetch,
      timeout: 10000,
    } as unknown as Fetcher;

    fetcherRegistrar.register('custom', mockFetcher);

    @api('/api/v2', { fetcher: 'custom', timeout: 8000 })
    class ProductService {
      @put('/products/{id}', { timeout: 6000 })
      updateProduct(@path('id') id: number, @body() product: any) {
        throw new Error('Implementation will be generated automatically.');
      }

      @del('/products/{id}')
      deleteProduct(@path('id') id: number) {
        throw new Error('Implementation will be generated automatically.');
      }
    }

    const service = new ProductService();

    // Test PUT request with custom timeout
    const putResponse = await service.updateProduct(456, { name: 'updated' });
    expect(putResponse).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith('/api/v2/products/{id}', {
      method: 'PUT',
      headers: undefined,
      pathParams: { id: 456 },
      queryParams: undefined,
      body: { name: 'updated' },
      timeout: 6000, // Method-level timeout should take precedence
    });

    // Reset mock
    mockFetch.mockClear();

    // Test DELETE request with class-level timeout
    const delResponse = await service.deleteProduct(456);
    expect(delResponse).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith('/api/v2/products/{id}', {
      method: 'DELETE',
      headers: undefined,
      pathParams: { id: 456 },
      queryParams: undefined,
      body: undefined,
      timeout: 8000, // Class-level timeout should be used
    });
  });

  it('should handle header parameters', async () => {
    // Mock fetch implementation
    const mockResponse = new Response('{"data": "success"}', { status: 200 });
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    // Create and register a mock fetcher
    const mockFetcher = {
      fetch: mockFetch,
      timeout: 5000,
    } as unknown as Fetcher;

    fetcherRegistrar.register('default', mockFetcher);

    @api('/api/v3')
    class AuthService {
      @patch('/users/{id}', { headers: { 'Content-Type': 'application/json' } })
      updateUser(
        @path('id') id: number,
        @body() user: any,
        @header('Authorization') auth: string,
        @header('X-Custom-Header') customHeader: string,
      ) {
        throw new Error('Implementation will be generated automatically.');
      }
    }

    const service = new AuthService();

    // Test PATCH request with headers
    const response = await service.updateUser(
      789,
      { name: 'updated' },
      'Bearer token',
      'custom-value',
    );
    expect(response).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith('/api/v3/users/{id}', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
        'X-Custom-Header': 'custom-value',
      },
      pathParams: { id: 789 },
      queryParams: undefined,
      body: { name: 'updated' },
      timeout: 5000,
    });
  });

  it('should handle methods without endpoint metadata', async () => {
    @api('/api/v4')
    class TestService {
      // This method has no decorator, so it should still throw the auto-generated error
      someMethod() {
        throw new Error('Implementation will be generated automatically.');
      }
    }

    const service = new TestService();

    // This should throw the auto-generated error because there's no endpoint metadata
    expect(() => service.someMethod()).toThrow(
      'Implementation will be generated automatically.',
    );
  });
});
