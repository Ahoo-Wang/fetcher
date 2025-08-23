import { describe, it, expect } from 'vitest';
import { InMemoryStorage } from '../src';

describe('InMemoryStorage Enhanced Tests', () => {
  it('should handle edge cases in key method', () => {
    const storage = new InMemoryStorage();

    // Test key method with negative index
    expect(storage.key(-1)).toBeNull();

    // Test key method with index beyond length
    storage.setItem('key1', 'value1');
    expect(storage.key(5)).toBeNull();

    // Test key method with valid indices
    expect(storage.key(0)).toBe('key1');
  });

  it('should handle removeItem for non-existent key', () => {
    const storage = new InMemoryStorage();

    // This should not throw an error
    expect(() => storage.removeItem('non-existent-key')).not.toThrow();

    // Verify storage is still empty
    expect(storage.length).toBe(0);
  });

  it('should handle removeItem for existing key', () => {
    const storage = new InMemoryStorage();

    storage.setItem('key1', 'value1');
    storage.setItem('key2', 'value2');

    expect(storage.length).toBe(2);
    expect(storage.getItem('key1')).toBe('value1');

    storage.removeItem('key1');

    expect(storage.length).toBe(1);
    expect(storage.getItem('key1')).toBeNull();
    expect(storage.getItem('key2')).toBe('value2');
  });

  it('should handle clear method', () => {
    const storage = new InMemoryStorage();

    storage.setItem('key1', 'value1');
    storage.setItem('key2', 'value2');

    expect(storage.length).toBe(2);

    storage.clear();

    expect(storage.length).toBe(0);
    expect(storage.getItem('key1')).toBeNull();
    expect(storage.getItem('key2')).toBeNull();
  });

  it('should handle getItem for non-existent key', () => {
    const storage = new InMemoryStorage();

    expect(storage.getItem('non-existent-key')).toBeNull();
  });

  it('should handle setItem and getItem with empty string values', () => {
    const storage = new InMemoryStorage();

    storage.setItem('empty-key', '');
    expect(storage.getItem('empty-key')).toBe('');
  });

  it('should handle setItem with special characters in keys and values', () => {
    const storage = new InMemoryStorage();

    const key = 'special!@#$%^&*()_+-=[]{}|;:,.<>?`~';
    const value = 'special-value!@#$%^&*()_+-=[]{}|;:,.<>?`~';

    storage.setItem(key, value);
    expect(storage.getItem(key)).toBe(value);
  });

  it('should maintain correct length after various operations', () => {
    const storage = new InMemoryStorage();

    expect(storage.length).toBe(0);

    storage.setItem('key1', 'value1');
    expect(storage.length).toBe(1);

    storage.setItem('key2', 'value2');
    expect(storage.length).toBe(2);

    storage.setItem('key1', 'new-value1'); // Update existing key
    expect(storage.length).toBe(2); // Length should remain the same

    storage.removeItem('key1');
    expect(storage.length).toBe(1);

    storage.clear();
    expect(storage.length).toBe(0);
  });
});
