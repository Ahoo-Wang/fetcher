/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSecurity } from '../../src/cosec/useSecurity';
import { TokenStorage } from '@ahoo-wang/fetcher-cosec';
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';

// Valid JWT tokens for testing
// Header: {"alg":"HS256","typ":"JWT"}
// Payload: {"sub":"user123","exp":2000000000}
// Signature: dummy
const validAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjoyMDAwMDAwMDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const validRefreshToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjoyMDAwMDAwMDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// Invalid JWT token
const invalidToken = 'invalid.jwt.token';

// JWT with null sub
const nullSubToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOm51bGwsImV4cCI6MjAwMDAwMDAwMH0.nullsub';

// Composite token for testing
const validCompositeToken = {
  accessToken: validAccessToken,
  refreshToken: validRefreshToken,
};

const invalidCompositeToken = {
  accessToken: invalidToken,
  refreshToken: invalidToken,
};

describe('useSecurity', () => {
  let storage: InMemoryStorage;
  let tokenStorage: TokenStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
    tokenStorage = new TokenStorage({
      key: 'test-cosec-token',
      storage: storage,
    });
  });

  afterEach(() => {
    storage.clear();
    tokenStorage.destroy();
  });

  describe('initial state', () => {
    it('should return null currentUser and false authenticated when no token is stored', () => {
      const { result } = renderHook(() => useSecurity(tokenStorage));

      expect(result.current.currentUser).toBeNull();
      expect(result.current.authenticated).toBe(false);
    });

    it('should return currentUser and true authenticated when token is stored', () => {
      tokenStorage.signIn(validCompositeToken);

      const { result } = renderHook(() => useSecurity(tokenStorage));

      expect(result.current.currentUser).toEqual({
        sub: 'user123',
        exp: 2000000000,
      });
      expect(result.current.authenticated).toBe(true);
    });
  });

  describe('signIn functionality', () => {
    it('should update state when signIn is called with valid token', async () => {
      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        result.current.signIn(validCompositeToken);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual({
          sub: 'user123',
          exp: 2000000000,
        });
        expect(result.current.authenticated).toBe(true);
      });
    });

    it('should handle signIn with invalid token gracefully', async () => {
      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        result.current.signIn(invalidCompositeToken);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toBeNull();
        expect(result.current.authenticated).toBe(false);
      });
    });

    it('should update state reactively when token is signed in externally', async () => {
      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        tokenStorage.signIn(validCompositeToken);
      });

      await waitFor(() => {
        expect(result.current.currentUser?.sub).toBe('user123');
        expect(result.current.authenticated).toBe(true);
      });
    });
  });

  describe('signOut functionality', () => {
    it('should clear user state when signOut is called', async () => {
      tokenStorage.signIn(validCompositeToken);
      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        result.current.signOut();
      });

      await waitFor(() => {
        expect(result.current.currentUser).toBeNull();
        expect(result.current.authenticated).toBe(false);
      });
    });

    it('should handle signOut when no token is present', () => {
      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        result.current.signOut();
      });

      expect(result.current.currentUser).toBeNull();
      expect(result.current.authenticated).toBe(false);
    });

    it('should update state reactively when token is signed out externally', async () => {
      tokenStorage.signIn(validCompositeToken);
      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        tokenStorage.signOut();
      });

      await waitFor(() => {
        expect(result.current.currentUser).toBeNull();
        expect(result.current.authenticated).toBe(false);
      });
    });
  });

  describe('reactive updates', () => {
    it('should sync state between multiple hook instances', async () => {
      const { result: result1 } = renderHook(() => useSecurity(tokenStorage));
      const { result: result2 } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        result1.current.signIn(validCompositeToken);
      });

      await waitFor(() => {
        expect(result1.current.authenticated).toBe(true);
        expect(result2.current.authenticated).toBe(true);
        expect(result1.current.currentUser?.sub).toBe('user123');
        expect(result2.current.currentUser?.sub).toBe('user123');
      });

      act(() => {
        result1.current.signOut();
      });

      await waitFor(() => {
        expect(result1.current.authenticated).toBe(false);
        expect(result2.current.authenticated).toBe(false);
        expect(result1.current.currentUser).toBeNull();
        expect(result2.current.currentUser).toBeNull();
      });
    });

    it('should handle rapid signIn/signOut operations', async () => {
      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        result.current.signIn(validCompositeToken);
      });

      act(() => {
        result.current.signOut();
      });

      act(() => {
        result.current.signIn(validCompositeToken);
      });

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true);
        expect(result.current.currentUser?.sub).toBe('user123');
      });
    });
  });

  describe('function stability', () => {
    it('should return stable signIn function reference across renders', () => {
      const { result, rerender } = renderHook(() => useSecurity(tokenStorage));

      const initialSignIn = result.current.signIn;

      rerender();

      expect(result.current.signIn).toBe(initialSignIn);
    });

    it('should return stable signOut function reference across renders', () => {
      const { result, rerender } = renderHook(() => useSecurity(tokenStorage));

      const initialSignOut = result.current.signOut;

      rerender();

      expect(result.current.signOut).toBe(initialSignOut);
    });

    it('should update functions when tokenStorage changes', () => {
      const { result, rerender } = renderHook(
        ({ storage }) => useSecurity(storage),
        { initialProps: { storage: tokenStorage } },
      );

      const initialSignIn = result.current.signIn;
      const newTokenStorage = new TokenStorage({
        key: 'new-test-key',
        storage: storage,
      });

      rerender({ storage: newTokenStorage });

      expect(result.current.signIn).not.toBe(initialSignIn);

      newTokenStorage.destroy();
    });
  });

  describe('edge cases', () => {
    it('should handle empty composite token', async () => {
      const emptyToken = { accessToken: '', refreshToken: '' };
      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        result.current.signIn(emptyToken);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toBeNull();
        expect(result.current.authenticated).toBe(false);
      });
    });

    it('should handle composite token with only access token', async () => {
      const partialToken = { accessToken: validAccessToken, refreshToken: '' };
      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        result.current.signIn(partialToken);
      });

      await waitFor(() => {
        expect(result.current.currentUser?.sub).toBe('user123');
        expect(result.current.authenticated).toBe(true);
      });
    });

    it('should handle composite token with only refresh token', async () => {
      const partialToken = { accessToken: '', refreshToken: validRefreshToken };
      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        result.current.signIn(partialToken);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toBeNull();
        expect(result.current.authenticated).toBe(false);
      });
    });

    it('should handle malformed JWT tokens gracefully', async () => {
      const malformedToken = {
        accessToken: 'malformed',
        refreshToken: 'malformed',
      };
      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        result.current.signIn(malformedToken);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toBeNull();
        expect(result.current.authenticated).toBe(false);
      });
    });

    it('should handle JWT with expired token', async () => {
      // JWT with exp in the past
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjoxMDAwMDAwMDAwfQ.expired';
      const expiredCompositeToken = {
        accessToken: expiredToken,
        refreshToken: validRefreshToken,
      };

      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        result.current.signIn(expiredCompositeToken);
      });

      await waitFor(() => {
        // Even with expired token, the payload is still parsed
        expect(result.current.currentUser?.sub).toBe('user123');
        expect(result.current.authenticated).toBe(false); // Token is expired, so not authenticated
      });
    });
  });

  describe('error handling', () => {
    it('should handle storage read errors gracefully', () => {
      // Create storage that throws on getItem
      const errorStorage = Object.assign(new InMemoryStorage(), {
        getItem: () => {
          throw new Error('Storage read error');
        },
      });

      const errorTokenStorage = new TokenStorage({
        key: 'error-key',
        storage: errorStorage,
      });

      expect(() => {
        renderHook(() => useSecurity(errorTokenStorage));
      }).toThrow('Storage read error');

      errorTokenStorage.destroy();
    });

    it('should handle storage write errors during signIn', async () => {
      const errorStorage = Object.assign(new InMemoryStorage(), {
        setItem: () => {
          throw new Error('Storage write error');
        },
      });

      const errorTokenStorage = new TokenStorage({
        key: 'error-key',
        storage: errorStorage,
      });

      const { result } = renderHook(() => useSecurity(errorTokenStorage));

      expect(() => {
        act(() => {
          result.current.signIn(validCompositeToken);
        });
      }).toThrow('Storage write error');

      errorTokenStorage.destroy();
    });

    it('should handle storage remove errors during signOut', async () => {
      tokenStorage.signIn(validCompositeToken);
      const errorStorage = Object.assign(new InMemoryStorage(), {
        removeItem: () => {
          throw new Error('Storage remove error');
        },
      });

      // Replace the storage after sign in
      const errorTokenStorage = new TokenStorage({
        key: 'error-key',
        storage: errorStorage,
      });
      errorTokenStorage.signIn(validCompositeToken);

      const { result } = renderHook(() => useSecurity(errorTokenStorage));

      expect(() => {
        act(() => {
          result.current.signOut();
        });
      }).toThrow('Storage remove error');

      errorTokenStorage.destroy();
    });
  });

  describe('type safety', () => {
    it('should work with custom payload properties', async () => {
      // JWT with additional properties
      const customToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwicm9sZXMiOlsiYWRtaW4iXSwidGVuYW50SWQiOiJ0ZW5hbnQxIiwiZXhwIjoyMDAwMDAwMDAwfQ.custom';
      const customCompositeToken = {
        accessToken: customToken,
        refreshToken: validRefreshToken,
      };

      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        result.current.signIn(customCompositeToken);
      });

      await waitFor(() => {
        expect(result.current.currentUser?.sub).toBe('user123');
        expect(result.current.currentUser?.roles).toEqual(['admin']);
        expect(result.current.currentUser?.tenantId).toBe('tenant1');
        expect(result.current.authenticated).toBe(true);
      });
    });

    it('should handle null and undefined values in payload', async () => {
      const nullCompositeToken = {
        accessToken: nullSubToken,
        refreshToken: validRefreshToken,
      };

      const { result } = renderHook(() => useSecurity(tokenStorage));

      act(() => {
        result.current.signIn(nullCompositeToken);
      });

      await waitFor(() => {
        expect(result.current.currentUser?.sub).toBeNull();
        expect(result.current.currentUser?.name).toBeUndefined();
        expect(result.current.authenticated).toBe(true);
      });
    });
  });
});
