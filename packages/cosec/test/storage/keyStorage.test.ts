import { describe, it, expect, beforeEach } from 'vitest';
import { KeyStorage } from '../../src';
import { InMemoryListenableStorage } from '../../src';
import { JsonSerializer } from '../../src';

describe('KeyStorage', () => {
  const TEST_KEY = 'test-key';
  let storage: InMemoryListenableStorage;

  beforeEach(() => {
    storage = new InMemoryListenableStorage();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const keyStorage = new KeyStorage<string>({ key: TEST_KEY });
      expect(keyStorage).toBeInstanceOf(KeyStorage);
    });

    it('should create instance with custom storage', () => {
      const keyStorage = new KeyStorage<string>({
        key: TEST_KEY,
        storage,
      });
      expect(keyStorage).toBeInstanceOf(KeyStorage);
    });

    it('should create instance with custom serializer', () => {
      const keyStorage = new KeyStorage<string>({
        key: TEST_KEY,
        serializer: new JsonSerializer(),
      });
      expect(keyStorage).toBeInstanceOf(KeyStorage);
    });
  });

  describe('get', () => {
    it('should return null when no value is stored', () => {
      const keyStorage = new KeyStorage<string>({ key: TEST_KEY, storage });
      expect(keyStorage.get()).toBeNull();
    });

    it('should return stored value', () => {
      const testValue = 'test-value';
      storage.setItem(TEST_KEY, testValue);
      const keyStorage = new KeyStorage<string>({ key: TEST_KEY, storage });
      expect(keyStorage.get()).toBe(testValue);
    });

    it('should use cache when available', () => {
      const testValue = 'test-value';
      storage.setItem(TEST_KEY, testValue);
      const keyStorage = new KeyStorage<string>({ key: TEST_KEY, storage });

      // First call retrieves from storage
      const value1 = keyStorage.get();
      expect(value1).toBe(testValue);

      // Second call should use cache
      const value2 = keyStorage.get();
      expect(value2).toBe(testValue);
      expect(value1).toBe(value2);
    });

    it('should deserialize complex objects with custom serializer', () => {
      const testObj = { name: 'test', value: 123 };
      const keyStorage = new KeyStorage<typeof testObj>({
        key: TEST_KEY,
        storage,
        serializer: new JsonSerializer(),
      });

      keyStorage.set(testObj);
      const retrieved = keyStorage.get();
      expect(retrieved).toEqual(testObj);
    });
  });

  describe('set', () => {
    it('should store value in storage', () => {
      const testValue = 'test-value';
      const keyStorage = new KeyStorage<string>({ key: TEST_KEY, storage });
      keyStorage.set(testValue);

      expect(storage.getItem(TEST_KEY)).toBe(testValue);
    });

    it('should update cache', () => {
      const testValue = 'test-value';
      const keyStorage = new KeyStorage<string>({ key: TEST_KEY, storage });
      keyStorage.set(testValue);

      expect(keyStorage.get()).toBe(testValue);
    });

    it('should serialize complex objects with custom serializer', () => {
      const testObj = { name: 'test', value: 123 };
      const keyStorage = new KeyStorage<typeof testObj>({
        key: TEST_KEY,
        storage,
        serializer: new JsonSerializer(),
      });

      keyStorage.set(testObj);
      expect(storage.getItem(TEST_KEY)).toBe(JSON.stringify(testObj));
    });
  });

  describe('remove', () => {
    it('should remove value from storage', () => {
      const testValue = 'test-value';
      storage.setItem(TEST_KEY, testValue);

      const keyStorage = new KeyStorage<string>({ key: TEST_KEY, storage });
      keyStorage.remove();

      expect(storage.getItem(TEST_KEY)).toBeNull();
    });

    it('should clear cache', () => {
      const testValue = 'test-value';
      const keyStorage = new KeyStorage<string>({ key: TEST_KEY, storage });
      keyStorage.set(testValue);

      expect(keyStorage.get()).toBe(testValue);

      keyStorage.remove();
      expect(keyStorage.get()).toBeNull();
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate cache when storage changes', () => {
      const testValue1 = 'value-1';
      const testValue2 = 'value-2';

      const keyStorage = new KeyStorage<string>({ key: TEST_KEY, storage });
      keyStorage.set(testValue1);

      // Verify initial value and caching
      expect(keyStorage.get()).toBe(testValue1);

      // Update storage directly (simulating external change)
      // This will trigger the storage listener which invalidates the cache
      storage.setItem(TEST_KEY, testValue2);

      // Cache should be invalidated by the storage event and return new value
      expect(keyStorage.get()).toBe(testValue2);
    });

    it('should not invalidate cache for different keys', () => {
      const OTHER_KEY = 'other-key';
      const testValue1 = 'value-1';
      const testValue2 = 'value-2';

      const keyStorage = new KeyStorage<string>({ key: TEST_KEY, storage });
      keyStorage.set(testValue1);

      // Verify initial value
      expect(keyStorage.get()).toBe(testValue1);

      // Change different key - this should not affect our key storage
      storage.setItem(OTHER_KEY, testValue2);

      // Should still return original value
      expect(keyStorage.get()).toBe(testValue1);
    });

    it('should clear cache when storage value is removed', () => {
      const testValue = 'test-value';
      
      const keyStorage = new KeyStorage<string>({ key: TEST_KEY, storage });
      keyStorage.set(testValue);

      expect(keyStorage.get()).toBe(testValue);

      // Remove item - this will trigger the storage listener which invalidates the cache
      storage.removeItem(TEST_KEY);

      expect(keyStorage.get()).toBeNull();
    });
  });
});