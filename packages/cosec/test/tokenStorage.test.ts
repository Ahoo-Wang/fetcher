import { describe, it, expect } from 'vitest';
import { TokenStorage } from '../src';
import { InMemoryStorage } from '../src';

describe('TokenStorage', () => {
  it('should get existing token', () => {
    const storage = new InMemoryStorage();
    const tokenStorage = new TokenStorage('test-token', storage);

    const token = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    };

    storage.setItem('test-token', JSON.stringify(token));

    const retrievedToken = tokenStorage.get();
    expect(retrievedToken).toEqual(token);
  });

  it('should return null when no token exists', () => {
    const storage = new InMemoryStorage();
    const tokenStorage = new TokenStorage('test-token', storage);

    const token = tokenStorage.get();
    expect(token).toBeNull();
  });

  it('should set token', () => {
    const storage = new InMemoryStorage();
    const tokenStorage = new TokenStorage('test-token', storage);

    const token = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    };

    tokenStorage.set(token);

    const storedToken = storage.getItem('test-token');
    expect(storedToken).toBe(JSON.stringify(token));
  });

  it('should clear stored token', () => {
    const storage = new InMemoryStorage();
    const tokenStorage = new TokenStorage('test-token', storage);

    const token = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    };

    tokenStorage.set(token);
    expect(tokenStorage.get()).toEqual(token);

    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
  });
});
