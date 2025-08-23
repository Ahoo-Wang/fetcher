import { describe, it, expect, beforeEach } from 'vitest';
import { FetcherRegistrar, fetcherRegistrar } from '../src';
import { Fetcher } from '../src';

describe('FetcherRegistrar', () => {
  let registrar: FetcherRegistrar;
  let fetcher: Fetcher;

  beforeEach(() => {
    registrar = new FetcherRegistrar();
    fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
  });

  it('should register and retrieve fetcher', () => {
    registrar.register('test-fetcher', fetcher);

    const retrievedFetcher = registrar.get('test-fetcher');
    expect(retrievedFetcher).toBe(fetcher);
  });

  it('should return undefined for non-existent fetcher', () => {
    const retrievedFetcher = registrar.get('non-existent');
    expect(retrievedFetcher).toBeUndefined();
  });

  it('should unregister fetcher', () => {
    registrar.register('test-fetcher', fetcher);

    const result = registrar.unregister('test-fetcher');
    expect(result).toBe(true);

    const retrievedFetcher = registrar.get('test-fetcher');
    expect(retrievedFetcher).toBeUndefined();
  });

  it('should return false when unregistering non-existent fetcher', () => {
    const result = registrar.unregister('non-existent');
    expect(result).toBe(false);
  });

  it('should throw error when requiredGet is called for non-existent fetcher', () => {
    expect(() => {
      registrar.requiredGet('non-existent');
    }).toThrow('Fetcher non-existent not found');
  });

  it('should return fetcher when requiredGet is called for existing fetcher', () => {
    registrar.register('test-fetcher', fetcher);

    const retrievedFetcher = registrar.requiredGet('test-fetcher');
    expect(retrievedFetcher).toBe(fetcher);
  });

  it('should return default fetcher', () => {
    registrar.register('default', fetcher);

    const defaultFetcherResult = registrar.default;
    expect(defaultFetcherResult).toBe(fetcher);
  });

  it('should throw error when default fetcher is not registered', () => {
    expect(() => {
      registrar.default;
    }).toThrow('Fetcher default not found');
  });

  it('should return a copy of all fetchers', () => {
    const fetcher1 = new Fetcher({ baseURL: 'https://api1.example.com' });
    const fetcher2 = new Fetcher({ baseURL: 'https://api2.example.com' });

    registrar.register('fetcher1', fetcher1);
    registrar.register('fetcher2', fetcher2);

    const fetchers = registrar.fetchers;
    expect(fetchers).toBeInstanceOf(Map);
    expect(fetchers.get('fetcher1')).toBe(fetcher1);
    expect(fetchers.get('fetcher2')).toBe(fetcher2);

    // Verify it's a copy by modifying the returned map
    fetchers.set('new-fetcher', fetcher);
    expect(registrar.get('new-fetcher')).toBeUndefined();
  });

  it('should handle empty registrar', () => {
    const retrievedFetcher = registrar.get('any-name');
    expect(retrievedFetcher).toBeUndefined();

    const fetchers = registrar.fetchers;
    expect(Object.keys(fetchers)).toHaveLength(0);
  });

  it('should overwrite existing fetcher when registering with same name', () => {
    const fetcher1 = new Fetcher({ baseURL: 'https://api1.example.com' });
    const fetcher2 = new Fetcher({ baseURL: 'https://api2.example.com' });

    registrar.register('test-fetcher', fetcher1);
    registrar.register('test-fetcher', fetcher2);

    const retrievedFetcher = registrar.get('test-fetcher');
    expect(retrievedFetcher).toBe(fetcher2);
    expect(retrievedFetcher).not.toBe(fetcher1);
  });

  it('should set and get default fetcher using setter', () => {
    const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

    // Set default fetcher using setter
    registrar.default = fetcher;

    // Get default fetcher
    const defaultFetcher = registrar.default;
    expect(defaultFetcher).toBe(fetcher);
  });

  it('should work with global fetcherRegistrar instance', () => {
    const testFetcher = new Fetcher({ baseURL: 'https://test.api.com' });

    // Register fetcher
    fetcherRegistrar.register('global-test', testFetcher);

    // Retrieve fetcher
    const retrievedFetcher = fetcherRegistrar.get('global-test');
    expect(retrievedFetcher).toBe(testFetcher);

    // Unregister fetcher
    const result = fetcherRegistrar.unregister('global-test');
    expect(result).toBe(true);

    // Verify it's unregistered
    const unregisteredFetcher = fetcherRegistrar.get('global-test');
    expect(unregisteredFetcher).toBeUndefined();
  });
});
