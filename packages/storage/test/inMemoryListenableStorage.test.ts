import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  InMemoryListenableStorage,
} from '../src';
import type { StorageListener } from '../src';

describe('InMemoryListenableStorage', () => {
  // Mock window and localStorage for testing
  const mockWindowLocation = {
    href: 'http://localhost',
  };

  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();

    // Mock StorageEvent
    (global as any).StorageEvent = class StorageEvent extends Event {
      key: string | null;
      oldValue: string | null;
      newValue: string | null;
      url: string;
      storageArea: Storage | null;

      constructor(type: string, eventInitDict?: StorageEventInit) {
        super(type, eventInitDict);
        this.key = eventInitDict?.key ?? null;
        this.oldValue = eventInitDict?.oldValue ?? null;
        this.newValue = eventInitDict?.newValue ?? null;
        this.url = eventInitDict?.url ?? '';
        this.storageArea = eventInitDict?.storageArea ?? null;
      }
    };

    // Setup window mock
    (global as any).window = {
      location: mockWindowLocation,
      addEventListener: vi.fn((event, handler) => {
        (global as any).window.eventListeners = (global as any).window.eventListeners || {};
        (global as any).window.eventListeners[event] = (global as any).window.eventListeners[event] || [];
        (global as any).window.eventListeners[event].push(handler);
      }),
      removeEventListener: vi.fn((event, handler) => {
        if ((global as any).window.eventListeners && (global as any).window.eventListeners[event]) {
          const index = (global as any).window.eventListeners[event].indexOf(handler);
          if (index > -1) {
            (global as any).window.eventListeners[event].splice(index, 1);
          }
        }
      }),
      dispatchEvent: vi.fn((event) => {
        if ((global as any).window.eventListeners && (global as any).window.eventListeners[event.type]) {
          (global as any).window.eventListeners[event.type].forEach((handler: Function) => {
            handler(event);
          });
        }
        return true;
      }),
    };
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
    delete (global as any).window;
    delete (global as any).StorageEvent;
  });

  let storage: InMemoryListenableStorage;

  beforeEach(() => {
    storage = new InMemoryListenableStorage();
  });

  it('should set and get item correctly', () => {
    storage.setItem('key1', 'value1');
    expect(storage.getItem('key1')).toBe('value1');
    expect(storage.length).toBe(1);
  });

  it('should return null for non-existent items', () => {
    expect(storage.getItem('non-existent')).toBeNull();
  });

  it('should remove item correctly', () => {
    storage.setItem('key1', 'value1');
    storage.removeItem('key1');
    expect(storage.getItem('key1')).toBeNull();
    expect(storage.length).toBe(0);
  });

  it('should clear all items', () => {
    storage.setItem('key1', 'value1');
    storage.setItem('key2', 'value2');
    storage.clear();
    expect(storage.length).toBe(0);
    expect(storage.getItem('key1')).toBeNull();
    expect(storage.getItem('key2')).toBeNull();
  });

  it('should get key by index', () => {
    storage.setItem('key1', 'value1');
    storage.setItem('key2', 'value2');
    expect(storage.key(0)).toBe('key1');
    expect(storage.key(1)).toBe('key2');
    expect(storage.key(2)).toBeNull();
  });

  it('should notify listeners when item is set', () => {
    const listener = vi.fn();
    storage.addListener(listener);

    storage.setItem('key1', 'value1');

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as StorageEvent;
    expect(event.key).toBe('key1');
    expect(event.newValue).toBe('value1');
    expect(event.oldValue).toBeNull();
    expect(event.storageArea).toBe(storage);
    expect(event.url).toBe('http://localhost');
  });

  it('should notify listeners when item is updated', () => {
    storage.setItem('key1', 'value1');
    const listener = vi.fn();
    storage.addListener(listener);

    storage.setItem('key1', 'value2');

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as StorageEvent;
    expect(event.key).toBe('key1');
    expect(event.newValue).toBe('value2');
    expect(event.oldValue).toBe('value1');
  });

  it('should notify listeners when item is removed', () => {
    storage.setItem('key1', 'value1');
    const listener = vi.fn();
    storage.addListener(listener);

    storage.removeItem('key1');

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as StorageEvent;
    expect(event.key).toBe('key1');
    expect(event.newValue).toBeNull();
    expect(event.oldValue).toBe('value1');
  });

  it('should handle listener errors gracefully', () => {
    const errorListener: StorageListener = () => {
      throw new Error('Test error');
    };
    const normalListener = vi.fn();

    storage.addListener(errorListener);
    storage.addListener(normalListener);

    // Should not throw
    expect(() => storage.setItem('key1', 'value1')).not.toThrow();
    expect(normalListener).toHaveBeenCalled();
  });

  it('should remove listener correctly', () => {
    const listener = vi.fn();
    const removeListener = storage.addListener(listener);

    storage.setItem('key1', 'value1');
    expect(listener).toHaveBeenCalledTimes(1);

    removeListener();
    storage.setItem('key2', 'value2');
    expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
  });
});