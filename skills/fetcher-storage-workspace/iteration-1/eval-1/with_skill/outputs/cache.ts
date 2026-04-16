import { isBrowser, getStorage, InMemoryStorage } from '@ahoo-wang/fetcher-storage';

interface CacheEntry<T> {
  data: T;
  expiry: number | null;
}

class Cache {
  private storage: Storage;
  private inMemoryFallback: InMemoryStorage;

  constructor() {
    if (isBrowser()) {
      this.storage = getStorage();
      this.inMemoryFallback = new InMemoryStorage();
    } else {
      this.inMemoryFallback = new InMemoryStorage();
      this.storage = this.inMemoryFallback;
    }
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      expiry: ttl != null ? Date.now() + ttl : null,
    };
    const serialized = JSON.stringify(entry);
    this.storage.setItem(key, serialized);
  }

  get<T>(key: string): T | null {
    const serialized = this.storage.getItem(key);
    if (serialized == null) {
      return null;
    }
    try {
      const entry: CacheEntry<T> = JSON.parse(serialized);
      if (entry.expiry != null && Date.now() > entry.expiry) {
        this.invalidate(key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  invalidate(key: string): void {
    this.storage.removeItem(key);
  }
}

export const cache = new Cache();
