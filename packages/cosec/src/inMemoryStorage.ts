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

/**
 * In-memory storage fallback for environments without localStorage.
 */
export class InMemoryStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    const value = this.store.get(key);
    return value !== undefined ? value : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }

  removeItem(key: string): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    }
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

import { isBrowser } from './env';

export function getStorage(): Storage {
  if (isBrowser() && window.localStorage) {
    return window.localStorage;
  } else {
    // Use in-memory storage as fallback
    return new InMemoryStorage();
  }
}
