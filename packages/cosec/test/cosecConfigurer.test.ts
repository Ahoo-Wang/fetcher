
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer, TokenRefresher } from '../src';

describe('CoSecConfigurer', () => {
  let fetcher: Fetcher;
  let tokenRefresher: TokenRefresher;
  let configurer: CoSecConfigurer;

  beforeEach(() => {
    fetcher = new Fetcher({
      baseURL: 'https://api.example.com',
    });

    tokenRefresher = {
      refresh: vi.fn(),
    };

    configurer = new CoSecConfigurer({
      appId: 'test-app-001',
      tokenRefresher,
    });
  });

  describe('constructor', () => {
    it('should create instance with required config', () => {
      expect(configurer).toBeDefined();
      expect(configurer.tokenStorage).toBeDefined();
      expect(configurer.deviceIdStorage).toBeDefined();
      expect(configurer.tokenManager).toBeDefined();
    });

    it('should use default values for optional config', () => {
      const configurerWithDefaults = new CoSecConfigurer({
        appId: 'test-app',
        tokenRefresher,
      });

      expect(configurerWithDefaults).toBeDefined();
    });
  });

  describe('applyTo', () => {
    it('should add request and response interceptors', () => {
      const initialRequestCount =
        fetcher.interceptors.request.interceptors.length;
      const initialResponseCount =
        fetcher.interceptors.response.interceptors.length;

      configurer.applyTo(fetcher);

      expect(fetcher.interceptors.request.interceptors.length).toBe(
        initialRequestCount + 3,
      );
      expect(fetcher.interceptors.response.interceptors.length).toBe(
        initialResponseCount + 1,
      );
    });

    it('should add interceptors with correct names', () => {
      configurer.applyTo(fetcher);

      const requestInterceptors = fetcher.interceptors.request.interceptors;
      const responseInterceptors = fetcher.interceptors.response.interceptors;

      const requestNames = requestInterceptors.map(i => i.name);
      const responseNames = responseInterceptors.map(i => i.name);

      expect(requestNames).toContain('CoSecRequestInterceptor');
      expect(requestNames).toContain('AuthorizationRequestInterceptor');
      expect(requestNames).toContain('ResourceAttributionRequestInterceptor');

      expect(responseNames).toContain('AuthorizationResponseInterceptor');
    });

    it('should conditionally add error interceptors', () => {
      // Test with unauthorized handler only
      const configurerWithUnauthorized = new CoSecConfigurer({
        appId: 'test-app',
        tokenRefresher,
        onUnauthorized: vi.fn(),
      });

      const fetcher1 = new Fetcher();
      const initialErrorCount1 =
        fetcher1.interceptors.error.interceptors.length;
      configurerWithUnauthorized.applyTo(fetcher1);

      expect(fetcher1.interceptors.error.interceptors.length).toBe(
        initialErrorCount1 + 1,
      );

      // Test with forbidden handler only
      const configurerWithForbidden = new CoSecConfigurer({
        appId: 'test-app',
        tokenRefresher,
        onForbidden: vi.fn(),
      });

      const fetcher2 = new Fetcher();
      const initialErrorCount2 =
        fetcher2.interceptors.error.interceptors.length;
      configurerWithForbidden.applyTo(fetcher2);

      expect(fetcher2.interceptors.error.interceptors.length).toBe(
        initialErrorCount2 + 1,
      );

      // Test with both handlers
      const configurerWithBoth = new CoSecConfigurer({
        appId: 'test-app',
        tokenRefresher,
        onUnauthorized: vi.fn(),
        onForbidden: vi.fn(),
      });

      const fetcher3 = new Fetcher();
      const initialErrorCount3 =
        fetcher3.interceptors.error.interceptors.length;
      configurerWithBoth.applyTo(fetcher3);

      expect(fetcher3.interceptors.error.interceptors.length).toBe(
        initialErrorCount3 + 2,
      );

      // Test with no error handlers
      const configurerWithNone = new CoSecConfigurer({
        appId: 'test-app',
        tokenRefresher,
      });

      const fetcher4 = new Fetcher();
      const initialErrorCount4 =
        fetcher4.interceptors.error.interceptors.length;
      configurerWithNone.applyTo(fetcher4);

      expect(fetcher4.interceptors.error.interceptors.length).toBe(
        initialErrorCount4,
      );
    });
  });

  describe('getters', () => {
    it('should return token storage instance', () => {
      const storage = configurer.tokenStorage;
      expect(storage).toBeDefined();
      expect(typeof storage.get).toBe('function');
    });

    it('should return device ID storage instance', () => {
      const storage = configurer.deviceIdStorage;
      expect(storage).toBeDefined();
      expect(typeof storage.getOrCreate).toBe('function');
    });

    it('should return token manager instance', () => {
      const manager = configurer.tokenManager;
      expect(manager).toBeDefined();
      expect(manager.currentToken).toBeNull();
    });
  });
});
