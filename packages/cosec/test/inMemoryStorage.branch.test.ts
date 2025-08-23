import { describe, it, expect, vi } from 'vitest';
import { getStorage, InMemoryStorage } from '../src';

describe('InMemoryStorage Branch Coverage', () => {
  it('should return InMemoryStorage instance when window is undefined', () => {
    // Save original window object
    const originalWindow = (globalThis as any).window;

    // Mock window as undefined
    (globalThis as any).window = undefined;

    const storage = getStorage();
    expect(storage).toBeInstanceOf(InMemoryStorage);

    // Restore original window
    (globalThis as any).window = originalWindow;
  });

  it('should return InMemoryStorage instance when window.localStorage is undefined', () => {
    // Save original window object
    const originalWindow = (globalThis as any).window;

    // Mock window object without localStorage
    (globalThis as any).window = {
      localStorage: undefined,
    };

    const storage = getStorage();
    expect(storage).toBeInstanceOf(InMemoryStorage);

    // Restore original window
    (globalThis as any).window = originalWindow;
  });

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

    // Save original window object
    const originalWindow = (globalThis as any).window;

    // Mock window object with localStorage
    (globalThis as any).window = {
      localStorage: mockLocalStorage,
    };

    const storage = getStorage();
    expect(storage).toBe(mockLocalStorage);

    // Restore original window
    (globalThis as any).window = originalWindow;
  });

  it('should return InMemoryStorage as fallback', () => {
    const storage = getStorage();
    expect(storage).toBeInstanceOf(InMemoryStorage);
  });
});
