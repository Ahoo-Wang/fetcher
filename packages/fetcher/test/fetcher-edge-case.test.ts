import { describe, it, expect, vi } from 'vitest';
import { Fetcher } from '../src';
import { FetchExchange } from '../src';

describe('Fetcher Edge Cases', () => {
  it('should handle case where exchange has no response (covers lines 84-85)', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Mock the request method to return an exchange without response
    const mockRequest = vi.spyOn(fetcher as any, 'request').mockResolvedValue({
      fetcher,
      url: 'https://api.example.com/test',
      request: {},
      response: undefined, // No response
      error: undefined,
    } as FetchExchange);

    await expect(fetcher.fetch('/test')).rejects.toThrow(
      'Request to https://api.example.com/test failed with no response',
    );

    mockRequest.mockRestore();
  });
});
