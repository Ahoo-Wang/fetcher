import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  BrowserListenableStorage,
} from '../../src';
import {
  InMemoryListenableStorage,
} from '../../src';
import {
  createListenableStorage,
} from '../../src';

describe('createListenableStorage', () => {
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
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
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

  it('should create BrowserListenableStorage when window is available', () => {
    (global as any).window.localStorage = mockLocalStorage;
    const storage = createListenableStorage();
    expect(storage).toBeInstanceOf(BrowserListenableStorage);
  });

  it('should create InMemoryListenableStorage when window is not available', () => {
    // Temporarily remove window to simulate non-browser environment
    const originalWindow = (global as any).window;
    delete (global as any).window;

    const storage = createListenableStorage();
    expect(storage).toBeInstanceOf(InMemoryListenableStorage);

    // Restore window
    (global as any).window = originalWindow;
  });
});