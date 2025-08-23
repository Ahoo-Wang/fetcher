import { describe, it, expect, vi } from 'vitest';
import { Fetcher } from '../src';

describe('Fetcher Branch Coverage', () => {
  it('should handle empty headers object (covers line 101)', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://api.example.com',
      headers: {}, // Empty headers object
    });

    // Mock fetch to return a response
    const mockFetch = vi.fn().mockResolvedValue(new Response('OK'));
    globalThis.fetch = mockFetch;

    await fetcher.get('/test');

    // Verify that fetch was called with undefined headers (empty object should result in undefined)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'GET',
        headers: undefined,
      }),
    );
  });

  it('should handle falsy headers (covers line 108)', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://api.example.com',
    });

    // Explicitly set headers to undefined to test the falsy branch
    (fetcher as any).headers = undefined;

    // Mock fetch to return a response
    const mockFetch = vi.fn().mockResolvedValue(new Response('OK'));
    globalThis.fetch = mockFetch;

    await fetcher.get('/test', {
      headers: undefined, // Also undefined request headers
    });

    // Verify that fetch was called
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });
});
