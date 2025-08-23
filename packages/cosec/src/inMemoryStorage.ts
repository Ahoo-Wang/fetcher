/**
 * In-memory storage fallback for environments without localStorage
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
    return this.store.get(key) || null;
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

export function getStorage(): Storage {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  } else {
    // Use in-memory storage as fallback
    return new InMemoryStorage();
  }
}
