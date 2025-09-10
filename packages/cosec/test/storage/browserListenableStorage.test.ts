import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  BrowserListenableStorage,
} from '../../src';
import {
  STORAGE_EVENT_TYPE,
} from '../../src';

describe('BrowserListenableStorage', () => {
  // Mock window and localStorage for testing
  const mockWindowLocation = {
    href: 'http://localhost',
  };

  const mockLocalStorage = {
    length: 0,
    clear: vi.fn(),
    getItem: vi.fn(),
    key: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn(),
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

    // Setup localStorage mock
    mockLocalStorage.clear.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.key.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.length = 0;
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
    delete (global as any).window;
    delete (global as any).StorageEvent;
  });

  beforeEach(() => {
    mockLocalStorage.clear.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.key.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.length = 0;
  });

  it('should delegate to the wrapped storage', () => {
    const storage = new BrowserListenableStorage(mockLocalStorage as any);

    storage.setItem('key1', 'value1');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('key1', 'value1');

    mockLocalStorage.getItem.mockReturnValue('value1');
    expect(storage.getItem('key1')).toBe('value1');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('key1');

    storage.removeItem('key1');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('key1');

    storage.clear();
    expect(mockLocalStorage.clear).toHaveBeenCalled();

    mockLocalStorage.key.mockReturnValue('key1');
    expect(storage.key(0)).toBe('key1');
    expect(mockLocalStorage.key).toHaveBeenCalledWith(0);

    mockLocalStorage.length = 1;
    expect(storage.length).toBe(1);
  });

  it('should add and remove event listeners', () => {
    const storage = new BrowserListenableStorage(mockLocalStorage as any);
    const listener = vi.fn();

    const removeListener = storage.addListener(listener);
    expect(window.addEventListener).toHaveBeenCalledWith(STORAGE_EVENT_TYPE, expect.any(Function));

    removeListener();
    expect(window.removeEventListener).toHaveBeenCalledWith(STORAGE_EVENT_TYPE, expect.any(Function));
  });

  it('should only call listener for events from the wrapped storage', () => {
    const storage = new BrowserListenableStorage(mockLocalStorage as any);
    const listener = vi.fn();
    storage.addListener(listener);

    // Event from the wrapped storage
    const eventFromStorage = new StorageEvent(STORAGE_EVENT_TYPE, { storageArea: mockLocalStorage });
    window.dispatchEvent(eventFromStorage);
    expect(listener).toHaveBeenCalledWith(eventFromStorage);

    // Event from another storage
    listener.mockClear();
    const otherStorage = { ...mockLocalStorage };
    const eventFromOtherStorage = new StorageEvent(STORAGE_EVENT_TYPE, { storageArea: otherStorage });
    window.dispatchEvent(eventFromOtherStorage);
    expect(listener).not.toHaveBeenCalled();
  });
});