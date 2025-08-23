/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
