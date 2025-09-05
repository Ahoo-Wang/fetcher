import { describe, it, expect, vi } from 'vitest';
import { fetcherRegistrar, NamedFetcher } from '@ahoo-wang/fetcher';
import { getFetcher } from '../src';

describe('getFetcher', () => {
  it('should return undefined when no fetcher is provided', () => {
    const result = getFetcher();
    expect(result).toBeUndefined();
  });

  it('should return undefined when fetcher is explicitly undefined', () => {
    const result = getFetcher(undefined);
    expect(result).toBeUndefined();
  });

  it('should return undefined when fetcher is null', () => {
    const result = getFetcher(null as any);
    expect(result).toBeUndefined();
  });

  it('should return the fetcher directly when it is already a Fetcher instance', () => {
    const fetcherInstance = new NamedFetcher('test-fetcher');
    const result = getFetcher(fetcherInstance);
    expect(result).toBe(fetcherInstance);
  });

  it('should resolve fetcher through registrar when fetcher is a string', () => {
    const mockFetcher = new NamedFetcher('resolved-fetcher');

    // Mock the fetcherRegistrar.requiredGet method
    const requiredGetSpy = vi.spyOn(fetcherRegistrar, 'requiredGet').mockReturnValue(mockFetcher);

    const result = getFetcher('test-fetcher');

    expect(result).toBe(mockFetcher);
    expect(requiredGetSpy).toHaveBeenCalledWith('test-fetcher');

    // Clean up spy
    requiredGetSpy.mockRestore();
  });

  it('should handle errors from fetcherRegistrar.requiredGet', () => {
    // Mock the fetcherRegistrar.requiredGet method to throw an error
    const requiredGetSpy = vi.spyOn(fetcherRegistrar, 'requiredGet').mockImplementation(() => {
      throw new Error('Fetcher not found');
    });

    expect(() => getFetcher('non-existent-fetcher')).toThrow('Fetcher not found');

    // Clean up spy
    requiredGetSpy.mockRestore();
  });
});