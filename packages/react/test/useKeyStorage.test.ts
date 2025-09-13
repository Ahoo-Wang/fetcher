import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyStorage } from '../src';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { InMemoryListenableStorage } from '@ahoo-wang/fetcher-storage';

describe('useKeyStorage', () => {
  let listenableStorage: InMemoryListenableStorage;
  let keyStorage: KeyStorage<string>;

  beforeEach(() => {
    listenableStorage = new InMemoryListenableStorage();
    keyStorage = new KeyStorage<string>({
      key: 'test-key',
      storage: listenableStorage,
    });
  });

  it('should return initial value as null when no value is set', () => {
    const { result } = renderHook(() => useKeyStorage(keyStorage));

    expect(result.current[0]).toBeNull();
  });

  it('should return the current value from storage', () => {
    keyStorage.set('test-value');

    const { result } = renderHook(() => useKeyStorage(keyStorage));

    expect(result.current[0]).toBe('test-value');
  });

  it('should update the value when setter is called', () => {
    const { result } = renderHook(() => useKeyStorage(keyStorage));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
  });

  it('should update when storage changes externally', () => {
    const { result } = renderHook(() => useKeyStorage(keyStorage));

    // Simulate external change
    act(() => {
      listenableStorage.setItem('test-key', 'external-value');
    });

    expect(result.current[0]).toBe('external-value');
  });

  it('should work with different value types', () => {
    const numberKeyStorage = new KeyStorage<number>({
      key: 'number-key',
      storage: listenableStorage,
    });
    numberKeyStorage.set(42);

    const { result } = renderHook(() => useKeyStorage(numberKeyStorage));

    expect(result.current[0]).toBe(42);

    act(() => {
      result.current[1](100);
    });
    
    expect(result.current[0]).toBe(100);
  });
});