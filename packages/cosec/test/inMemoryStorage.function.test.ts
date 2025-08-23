import { describe, it, expect, vi } from 'vitest';
import { getStorage, InMemoryStorage } from '../src';

describe('getStorage Function Tests', () => {
  it('should return window.localStorage when available', () => {
    // Mock window.localStorage
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };

    // @ts-ignore - we're mocking window for testing purposes
    const originalWindow = global.window;
    // @ts-ignore
    global.window = {
      localStorage: mockLocalStorage,
    };

    const storage = getStorage();
    expect(storage).toBe(mockLocalStorage);

    // Restore original window
    // @ts-ignore
    global.window = originalWindow;
  });

  it('should return InMemoryStorage when window is undefined', () => {
    // @ts-ignore - we're mocking window for testing purposes
    const originalWindow = global.window;
    // @ts-ignore
    global.window = undefined;

    const storage = getStorage();
    expect(storage).toBeInstanceOf(InMemoryStorage);

    // Restore original window
    // @ts-ignore
    global.window = originalWindow;
  });

  it('should return InMemoryStorage when window.localStorage is undefined', () => {
    // @ts-ignore - we're mocking window for testing purposes
    const originalWindow = global.window;
    // @ts-ignore
    global.window = {
      localStorage: undefined,
    };

    const storage = getStorage();
    expect(storage).toBeInstanceOf(InMemoryStorage);

    // Restore original window
    // @ts-ignore
    global.window = originalWindow;
  });
});
