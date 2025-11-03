# @ahoo-wang/fetcher-storage

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-storage.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-storage.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-storage.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-storage)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)
[![Storybook](https://img.shields.io/badge/Storybook-Interactive%20Docs-FF4785)](https://fetcher.ahoo.me/?path=/docs/storage-introduction--docs)

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

## 🚀 Advanced Usage Examples

### Reactive Storage with RxJS Integration

Create reactive storage that integrates with RxJS observables:

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

class ReactiveKeyStorage<T> extends KeyStorage<T> {
  private subject: BehaviorSubject<T | null>;

  constructor(options: any) {
    super(options);
    this.subject = new BehaviorSubject<T | null>(this.get());
  }

  // Override set to emit changes
  set(value: T): void {
    super.set(value);
    this.subject.next(value);
  }

  // Get observable for reactive updates
  asObservable(): Observable<T | null> {
    return this.subject.asObservable();
  }

  // Get observable for specific property
  select<R>(selector: (value: T | null) => R): Observable<R> {
    return this.subject.pipe(map(selector), distinctUntilChanged());
  }
}

// Usage
const userStorage = new ReactiveKeyStorage<{ name: string; theme: string }>({
  key: 'user-preferences',
});

// React to all changes
userStorage.asObservable().subscribe(preferences => {
  console.log('User preferences changed:', preferences);
});

// React to specific property changes
userStorage
  .select(prefs => prefs?.theme)
  .subscribe(theme => {
    document.body.className = `theme-${theme}`;
  });

// Update storage (will trigger observers)
userStorage.set({ name: 'John', theme: 'dark' });
```

### Encrypted Storage with Web Crypto API

Implement secure encrypted storage for sensitive data:

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

class EncryptedSerializer {
  private keyPromise: Promise<CryptoKey>;

  constructor(password: string) {
    this.keyPromise = this.deriveKey(password);
  }

  private async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey'],
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('fetcher-storage-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  async serialize(value: any): Promise<string> {
    const key = await this.keyPromise;
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(value));

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data,
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  async deserialize(value: string): Promise<any> {
    const key = await this.keyPromise;
    const combined = new Uint8Array(
      atob(value)
        .split('')
        .map(c => c.charCodeAt(0)),
    );

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted,
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }
}

// Usage (only works in secure contexts - HTTPS)
const secureStorage = new KeyStorage<any>({
  key: 'sensitive-data',
  serializer: new EncryptedSerializer('user-password'),
});

// Store encrypted data
secureStorage.set({ apiKey: 'secret-key', tokens: ['token1', 'token2'] });

// Retrieve decrypted data
const data = secureStorage.get();
console.log(data); // { apiKey: 'secret-key', tokens: [...] }
```

### Storage Migration and Versioning

Handle storage schema migrations across app versions:

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

interface StorageVersion {
  version: number;
  migrate: (data: any) => any;
}

class VersionedKeyStorage<T> extends KeyStorage<T> {
  private migrations: StorageVersion[] = [];

  constructor(options: any, migrations: StorageVersion[] = []) {
    super(options);
    this.migrations = migrations.sort((a, b) => a.version - b.version);
  }

  get(): T | null {
    const rawData = super.get();
    if (!rawData) return null;

    return this.migrateData(rawData);
  }

  private migrateData(data: any): T {
    const currentVersion = data.__version || 0;
    let migratedData = { ...data };

    // Remove version marker for clean data
    delete migratedData.__version;

    // Apply migrations in order
    for (const migration of this.migrations) {
      if (currentVersion < migration.version) {
        migratedData = migration.migrate(migratedData);
        migratedData.__version = migration.version;
      }
    }

    // Save migrated data
    if (migratedData.__version !== currentVersion) {
      super.set(migratedData);
    }

    delete migratedData.__version;
    return migratedData;
  }
}

// Define migrations
const migrations: StorageVersion[] = [
  {
    version: 1,
    migrate: data => ({
      ...data,
      // Add default theme if missing
      theme: data.theme || 'light',
    }),
  },
  {
    version: 2,
    migrate: data => ({
      ...data,
      // Rename property
      preferences: data.settings || {},
      settings: undefined,
    }),
  },
  {
    version: 3,
    migrate: data => ({
      ...data,
      // Add timestamps
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  },
];

// Usage
const userPrefsStorage = new VersionedKeyStorage<{
  name: string;
  theme: string;
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}>(
  {
    key: 'user-preferences',
  },
  migrations,
);

// Data will be automatically migrated when accessed
const prefs = userPrefsStorage.get();
```

### Cross-Tab Communication with Shared Storage

Implement cross-tab communication using storage events:

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

interface TabMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  sourceTab: string;
}

class CrossTabMessenger {
  private storage: KeyStorage<TabMessage[]>;
  private tabId: string;
  private listeners: Map<string, (message: TabMessage) => void> = new Map();

  constructor(channelName: string = 'cross-tab-messages') {
    this.tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.storage = new KeyStorage<TabMessage[]>({
      key: channelName,
    });

    // Listen for storage changes
    this.storage.subscribe(messages => {
      if (!messages) return;

      // Process new messages
      messages.forEach(message => {
        if (message.sourceTab !== this.tabId) {
          this.notifyListeners(message.type, message);
        }
      });
    });

    // Initialize storage if empty
    if (!this.storage.get()) {
      this.storage.set([]);
    }
  }

  // Send message to other tabs
  broadcast(type: string, payload: any) {
    const messages = this.storage.get() || [];
    const message: TabMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      sourceTab: this.tabId,
    };

    // Add message and keep only recent messages
    const updatedMessages = [...messages, message].slice(-50);
    this.storage.set(updatedMessages);
  }

  // Listen for messages
  on(type: string, callback: (message: TabMessage) => void) {
    this.listeners.set(type, callback);
  }

  // Remove listener
  off(type: string) {
    this.listeners.delete(type);
  }

  private notifyListeners(type: string, message: TabMessage) {
    const listener = this.listeners.get(type);
    if (listener) {
      listener(message);
    }
  }

  // Get current tab ID
  getTabId(): string {
    return this.tabId;
  }
}

// Usage
const messenger = new CrossTabMessenger('app-messages');

// Listen for user login events
messenger.on('user-logged-in', message => {
  console.log('User logged in from another tab:', message.payload);
  // Update current tab's state
  updateUserState(message.payload.user);
});

// Broadcast user actions
function onUserLogin(user: any) {
  messenger.broadcast('user-logged-in', { user, tabId: messenger.getTabId() });
}
```

### Performance Monitoring and Analytics

Add performance tracking to storage operations:

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class MonitoredKeyStorage<T> extends KeyStorage<T> {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 100;

  constructor(options: any) {
    super(options);
  }

  set(value: T): void {
    const startTime = performance.now();
    try {
      super.set(value);
      this.recordMetric('set', performance.now() - startTime, true);
    } catch (error) {
      this.recordMetric(
        'set',
        performance.now() - startTime,
        false,
        String(error),
      );
      throw error;
    }
  }

  get(): T | null {
    const startTime = performance.now();
    try {
      const result = super.get();
      this.recordMetric('get', performance.now() - startTime, true);
      return result;
    } catch (error) {
      this.recordMetric(
        'get',
        performance.now() - startTime,
        false,
        String(error),
      );
      throw error;
    }
  }

  private recordMetric(
    operation: string,
    duration: number,
    success: boolean,
    error?: string,
  ) {
    this.metrics.push({
      operation,
      duration,
      timestamp: Date.now(),
      success,
      error,
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Get performance statistics
  getPerformanceStats() {
    const total = this.metrics.length;
    const successful = this.metrics.filter(m => m.success).length;
    const failed = total - successful;

    const avgDuration =
      this.metrics.reduce((sum, m) => sum + m.duration, 0) / total;
    const maxDuration = Math.max(...this.metrics.map(m => m.duration));
    const minDuration = Math.min(...this.metrics.map(m => m.duration));

    return {
      total,
      successful,
      failed,
      successRate: successful / total,
      avgDuration,
      maxDuration,
      minDuration,
      recentErrors: this.metrics
        .filter(m => !m.success)
        .slice(-5)
        .map(m => ({
          operation: m.operation,
          error: m.error,
          timestamp: m.timestamp,
        })),
    };
  }

  // Export metrics for analysis
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }
}

// Usage
const monitoredStorage = new MonitoredKeyStorage<any>({
  key: 'app-data',
});

// Use normally
monitoredStorage.set({ user: 'john', settings: {} });
const data = monitoredStorage.get();

// Get performance insights
const stats = monitoredStorage.getPerformanceStats();
console.log('Storage Performance:', stats);

// Export for further analysis
const metrics = monitoredStorage.exportMetrics();
```

### Integration with State Management Libraries

Examples of integrating storage with popular state management solutions:

#### With Redux

```typescript
import { createStore, combineReducers } from 'redux';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

// Storage-backed reducer
function createPersistentReducer(reducer: any, storageKey: string) {
  const storage = new KeyStorage({
    key: storageKey,
  });

  // Load initial state from storage
  const initialState = storage.get() || reducer(undefined, { type: '@@INIT' });

  return (state = initialState, action: any) => {
    const newState = reducer(state, action);

    // Persist state changes (debounced)
    if (action.type !== '@@INIT') {
      setTimeout(() => storage.set(newState), 100);
    }

    return newState;
  };
}

// Usage
const userReducer = (state = { name: '', loggedIn: false }, action: any) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, name: action.payload.name, loggedIn: true };
    case 'LOGOUT':
      return { ...state, name: '', loggedIn: false };
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  user: createPersistentReducer(userReducer, 'redux-user-state'),
});

const store = createStore(rootReducer);

// State is automatically persisted and restored
```

#### With Zustand

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

interface AppState {
  user: { name: string; email: string } | null;
  theme: 'light' | 'dark';
  login: (user: { name: string; email: string }) => void;
  logout: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const storage = new KeyStorage<AppState['user']>({
  key: 'zustand-user',
});

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    user: storage.get(),
    theme: 'light',

    login: user => {
      set({ user });
      storage.set(user);
    },

    logout: () => {
      set({ user: null });
      storage.set(null);
    },

    setTheme: theme => set({ theme }),
  })),
);

// Auto-persist theme changes
useAppStore.subscribe(
  state => state.theme,
  theme => {
    const themeStorage = new KeyStorage({ key: 'app-theme' });
    themeStorage.set(theme);
  },
);
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
