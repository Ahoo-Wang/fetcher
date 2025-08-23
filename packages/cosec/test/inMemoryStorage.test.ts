import { describe, it, expect } from 'vitest';
import { InMemoryStorage } from '../src';

describe('InMemoryStorage', () => {
  it('should store and retrieve items', () => {
    const storage = new InMemoryStorage();

    storage.setItem('key1', 'value1');
    storage.setItem('key2', 'value2');

    expect(storage.getItem('key1')).toBe('value1');
    expect(storage.getItem('key2')).toBe('value2');
    expect(storage.getItem('nonexistent')).toBeNull();
  });

  it('should update existing items', () => {
    const storage = new InMemoryStorage();

    storage.setItem('key', 'initial-value');
    expect(storage.getItem('key')).toBe('initial-value');

    storage.setItem('key', 'updated-value');
    expect(storage.getItem('key')).toBe('updated-value');
  });

  it('should remove items', () => {
    const storage = new InMemoryStorage();

    storage.setItem('key', 'value');
    expect(storage.getItem('key')).toBe('value');

    storage.removeItem('key');
    expect(storage.getItem('key')).toBeNull();
  });

  it('should clear all items', () => {
    const storage = new InMemoryStorage();

    storage.setItem('key1', 'value1');
    storage.setItem('key2', 'value2');
    expect(storage.length).toBe(2);

    storage.clear();
    expect(storage.length).toBe(0);
    expect(storage.getItem('key1')).toBeNull();
    expect(storage.getItem('key2')).toBeNull();
  });

  it('should return keys by index', () => {
    const storage = new InMemoryStorage();

    storage.setItem('key1', 'value1');
    storage.setItem('key2', 'value2');

    expect(storage.key(0)).toBe('key1');
    expect(storage.key(1)).toBe('key2');
    expect(storage.key(2)).toBeNull();
  });

  it('should return correct length', () => {
    const storage = new InMemoryStorage();

    expect(storage.length).toBe(0);

    storage.setItem('key1', 'value1');
    expect(storage.length).toBe(1);

    storage.setItem('key2', 'value2');
    expect(storage.length).toBe(2);

    storage.removeItem('key1');
    expect(storage.length).toBe(1);

    storage.clear();
    expect(storage.length).toBe(0);
  });
});
