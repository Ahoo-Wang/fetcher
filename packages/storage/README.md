# @ahoo-wang/fetcher-storage

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-storage.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-storage.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-storage.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-storage)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

A lightweight, cross-environment storage library with key-based storage and automatic environment detection. Provides
consistent API for browser localStorage and in-memory storage with change notifications.

## Features

- 🌐 Cross-environment support (Browser & Node.js)
- 📦 Ultra-lightweight (~1KB gzip)
- 🔔 Storage change event listening
- 🔄 Automatic environment detection with fallback
- 🛠️ Key-based storage with caching and serialization
- 🔧 Custom serialization support
- 📝 Full TypeScript support

## Installation

```bash
npm install @ahoo-wang/fetcher-storage
```

## Usage

### Environment Detection and Storage Selection

```typescript
import { getStorage, isBrowser } from '@ahoo-wang/fetcher-storage';

// Check if running in browser
console.log('Is browser:', isBrowser());

// Get appropriate storage for current environment
const storage = getStorage(); // localStorage in browser, InMemoryStorage in Node.js

// Use like standard Storage API
storage.setItem('key', 'value');
const value = storage.getItem('key');
```

### Key-based Storage with Caching

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

// Create typed storage for a specific key
const userStorage = new KeyStorage<{ name: string; age: number }>({
  key: 'user',
});

// Set and get values with automatic caching
userStorage.set({ name: 'John', age: 30 });
const user = userStorage.get(); // {name: 'John', age: 30}

// Listen for changes to this specific key
const removeListener = userStorage.addListener(event => {
  console.log('User changed:', event.newValue, 'from:', event.oldValue);
});

// Clean up when done
removeListener();
```

### Custom Serialization

```typescript
import { KeyStorage, JsonSerializer } from '@ahoo-wang/fetcher-storage';

// Use JSON serialization (default)
const jsonStorage = new KeyStorage<any>({
  key: 'data',
  serializer: new JsonSerializer(),
});

jsonStorage.set({ message: 'Hello World', timestamp: Date.now() });
const data = jsonStorage.get(); // {message: 'Hello World', timestamp: 1234567890}
```

### In-Memory Storage

```typescript
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';

// Create in-memory storage (works in any environment)
const memoryStorage = new InMemoryStorage();

// Use like standard Storage API
memoryStorage.setItem('temp', 'data');
console.log(memoryStorage.getItem('temp')); // 'data'
console.log(memoryStorage.length); // 1
```

### Advanced Configuration

```typescript
import { KeyStorage, InMemoryStorage } from '@ahoo-wang/fetcher-storage';

// Custom storage and event bus
const customStorage = new KeyStorage<string>({
  key: 'custom',
  storage: new InMemoryStorage(), // Use in-memory instead of localStorage
  // eventBus: customEventBus, // Custom event bus for notifications
});

// Custom serializer for complex data types
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

class DateSerializer {
  serialize(value: any): string {
    return JSON.stringify(value, (key, val) =>
      val instanceof Date ? { __type: 'Date', value: val.toISOString() } : val,
    );
  }

  deserialize(value: string): any {
    return JSON.parse(value, (key, val) =>
      val && typeof val === 'object' && val.__type === 'Date'
        ? new Date(val.value)
        : val,
    );
  }
}

const dateStorage = new KeyStorage<{ createdAt: Date; data: string }>({
  key: 'date-data',
  serializer: new DateSerializer(),
});
```

## API Reference

### Environment Utilities

#### `isBrowser(): boolean`

Checks if the current environment is a browser.

#### `getStorage(): Storage`

Returns the appropriate storage implementation:

- Browser: `window.localStorage` (with availability check)
- Non-browser: `InMemoryStorage` instance

### KeyStorage

A storage wrapper for managing typed values with caching and change notifications.

```typescript
new KeyStorage<T>(options
:
KeyStorageOptions<T>
)
```

#### Options

- `key: string` - Storage key
- `serializer?: Serializer<string, T>` - Custom serializer (default: JsonSerializer)
- `storage?: Storage` - Custom storage (default: getStorage())
- `eventBus?: TypedEventBus<StorageEvent<T>>` - Custom event bus

#### Methods

- `get(): T | null` - Get cached value
- `set(value: T): void` - Set value with caching and notification
- `remove(): void` - Remove value and clear cache
- `addListener(handler: EventHandler<StorageEvent<T>>): RemoveStorageListener` - Add change listener

### InMemoryStorage

In-memory implementation of the Storage interface.

```typescript
new InMemoryStorage();
```

Implements all standard Storage methods with Map-based storage.

### Serializers

#### `JsonSerializer`

Serializes values to/from JSON strings.

#### `typedIdentitySerializer<T>()`

Identity serializer that passes values through unchanged.

## Real-World Examples

### User Session Management

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

interface UserSession {
  userId: string;
  token: string;
  expiresAt: Date;
  preferences: Record<string, any>;
}

class SessionManager {
  private sessionStorage = new KeyStorage<UserSession>({
    key: 'user-session',
  });

  async login(credentials: LoginCredentials): Promise<UserSession> {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const session = await response.json();

    this.sessionStorage.set(session);
    return session;
  }

  getCurrentSession(): UserSession | null {
    const session = this.sessionStorage.get();
    if (!session) return null;

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      this.logout();
      return null;
    }

    return session;
  }

  logout(): void {
    this.sessionStorage.remove();
  }

  updatePreferences(preferences: Record<string, any>): void {
    const session = this.getCurrentSession();
    if (session) {
      this.sessionStorage.set({
        ...session,
        preferences: { ...session.preferences, ...preferences },
      });
    }
  }
}
```

### Cross-Tab Application State

```typescript
import {
  KeyStorage,
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-storage';

interface AppState {
  theme: 'light' | 'dark';
  language: string;
  sidebarCollapsed: boolean;
}

class AppStateManager {
  private stateStorage: KeyStorage<AppState>;

  constructor() {
    // Use broadcast event bus for cross-tab synchronization
    const eventBus = new BroadcastTypedEventBus(
      new SerialTypedEventBus('app-state'),
    );

    this.stateStorage = new KeyStorage<AppState>({
      key: 'app-state',
      eventBus,
    });

    // Listen for state changes from other tabs
    this.stateStorage.addListener(event => {
      if (event.newValue) {
        this.applyStateToUI(event.newValue);
      }
    });
  }

  getState(): AppState {
    return (
      this.stateStorage.get() || {
        theme: 'light',
        language: 'en',
        sidebarCollapsed: false,
      }
    );
  }

  updateState(updates: Partial<AppState>): void {
    const currentState = this.getState();
    const newState = { ...currentState, ...updates };
    this.stateStorage.set(newState);
    this.applyStateToUI(newState);
  }

  private applyStateToUI(state: AppState): void {
    document.documentElement.setAttribute('data-theme', state.theme);
    // Update UI components based on state
  }
}
```

### Form Auto-Save

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { useEffect, useState } from 'react';

interface FormData {
  title: string;
  content: string;
  tags: string[];
  lastSaved: Date;
}

function useAutoSaveForm(formId: string) {
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const formStorage = new KeyStorage<Partial<FormData>>({
    key: `form-autosave-${formId}`
  });

  // Load saved data on mount
  useEffect(() => {
    const saved = formStorage.get();
    if (saved) {
      setFormData(saved);
      setLastSaved(saved.lastSaved || null);
    }
  }, [formStorage]);

  // Auto-save on changes
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      const dataToSave = {
        ...formData,
        lastSaved: new Date(),
      };
      formStorage.set(dataToSave);
      setLastSaved(dataToSave.lastSaved);
    }
  }, [formData, formStorage]);

  const clearAutoSave = () => {
    formStorage.remove();
    setFormData({});
    setLastSaved(null);
  };

  return {
    formData,
    setFormData,
    lastSaved,
    clearAutoSave,
  };
}

// Usage in component
function ArticleEditor({ articleId }: { articleId: string }) {
  const { formData, setFormData, lastSaved, clearAutoSave } = useAutoSaveForm(articleId);

  return (
    <div>
      {lastSaved && (
        <div className="autosave-indicator">
          Auto-saved at {lastSaved.toLocaleTimeString()}
        </div>
      )}

      <input
        value={formData.title || ''}
        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
        placeholder="Article title"
      />

      <textarea
        value={formData.content || ''}
        onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
        placeholder="Article content"
      />

      <button onClick={clearAutoSave}>Clear Auto-save</button>
    </div>
  );
}
```

## TypeScript Support

Full TypeScript support with generics and type inference:

```typescript
// Typed storage
const userStorage = new KeyStorage<User>({ key: 'user' });

// Type-safe operations
userStorage.set({ id: 1, name: 'John' });
const user = userStorage.get(); // User | null
```

## Troubleshooting

### Common Issues

#### Storage Quota Exceeded

```typescript
// Handle storage quota errors
try {
  userStorage.set(largeData);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Fallback to in-memory storage or compress data
    console.warn('Storage quota exceeded, using fallback');
    // Implement fallback logic
  }
}
```

#### Cross-Tab Synchronization Not Working

```typescript
// Ensure BroadcastChannel is supported
if ('BroadcastChannel' in window) {
  const eventBus = new BroadcastTypedEventBus(
    new SerialTypedEventBus('my-app'),
  );
  // Use with KeyStorage
} else {
  console.warn(
    'BroadcastChannel not supported, falling back to local-only storage',
  );
}
```

#### Serialization Errors

```typescript
// Handle circular references and complex objects
class SafeJsonSerializer implements Serializer<string, any> {
  serialize(value: any): string {
    // Remove circular references or handle special cases
    const safeValue = this.makeSerializable(value);
    return JSON.stringify(safeValue);
  }

  deserialize(value: string): any {
    return JSON.parse(value);
  }

  private makeSerializable(obj: any, seen = new WeakSet()): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return '[Circular]';

    seen.add(obj);
    const result: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = this.makeSerializable(obj[key], seen);
      }
    }

    seen.delete(obj);
    return result;
  }
}
```

#### Memory Leaks

```typescript
// Always clean up listeners
class ComponentWithStorage {
  private storage: KeyStorage<any>;
  private removeListener: () => void;

  constructor() {
    this.storage = new KeyStorage({ key: 'component-data' });
    this.removeListener = this.storage.addListener(event => {
      // Handle changes
    });
  }

  destroy() {
    // Clean up when component is destroyed
    this.removeListener();
    this.storage.destroy?.(); // If available
  }
}
```

### Performance Tips

- **Use appropriate serializers**: JSON for simple objects, custom serializers for complex data
- **Batch operations**: Group multiple storage operations when possible
- **Monitor storage size**: Implement size limits and cleanup strategies
- **Use memory storage for temporary data**: Avoid persisting unnecessary data
- **Debounce frequent updates**: Prevent excessive storage writes

### Browser Compatibility

- **localStorage**: IE 8+, all modern browsers
- **BroadcastChannel**: Chrome 54+, Firefox 38+, Safari 15.4+
- **Fallback handling**: Always provide fallbacks for unsupported features

## License

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/master/LICENSE)
