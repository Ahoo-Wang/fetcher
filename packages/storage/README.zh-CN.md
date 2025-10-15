# @ahoo-wang/fetcher-storage

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-storage.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-storage.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-storage.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-storage)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

一个轻量级的跨环境存储库，具有基于键的存储和自动环境检测功能。为浏览器 localStorage 和内存存储提供一致的 API，并支持变更通知。

## 特性

- 🌐 跨环境支持（浏览器和 Node.js）
- 📦 超轻量级（~1KB gzip）
- 🔔 存储变更事件监听
- 🔄 自动环境检测和降级处理
- 🛠️ 基于键的存储、缓存和序列化
- 🔧 自定义序列化支持
- 📝 完整的 TypeScript 支持

## 安装

```bash
npm install @ahoo-wang/fetcher-storage
```

## 使用方法

### 环境检测和存储选择

```typescript
import { getStorage, isBrowser } from '@ahoo-wang/fetcher-storage';

// 检查是否在浏览器环境中运行
console.log('是否为浏览器:', isBrowser());

// 获取当前环境的合适存储
const storage = getStorage(); // 浏览器中使用 localStorage，Node.js 中使用 InMemoryStorage

// 像标准 Storage API 一样使用
storage.setItem('key', 'value');
const value = storage.getItem('key');
```

### 基于键的存储和缓存

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

// 为特定键创建类型化的存储
const userStorage = new KeyStorage<{ name: string; age: number }>({
  key: 'user',
});

// 设置和获取值，自动缓存
userStorage.set({ name: 'John', age: 30 });
const user = userStorage.get(); // {name: 'John', age: 30}

// 监听此特定键的变更
const removeListener = userStorage.addListener(event => {
  console.log('用户变更:', event.newValue, '来自:', event.oldValue);
});

// 使用完毕后清理
removeListener();
```

### 自定义序列化

```typescript
import { KeyStorage, JsonSerializer } from '@ahoo-wang/fetcher-storage';

// 使用 JSON 序列化（默认）
const jsonStorage = new KeyStorage<any>({
  key: 'data',
  serializer: new JsonSerializer(),
});

jsonStorage.set({ message: 'Hello World', timestamp: Date.now() });
const data = jsonStorage.get(); // {message: 'Hello World', timestamp: 1234567890}
```

### 内存存储

```typescript
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';

// 创建内存存储（在任何环境中都能工作）
const memoryStorage = new InMemoryStorage();

// 像标准 Storage API 一样使用
memoryStorage.setItem('temp', 'data');
console.log(memoryStorage.getItem('temp')); // 'data'
console.log(memoryStorage.length); // 1
```

### 高级配置

```typescript
import { KeyStorage, InMemoryStorage } from '@ahoo-wang/fetcher-storage';

// 自定义存储和事件总线
const customStorage = new KeyStorage<string>({
  key: 'custom',
  storage: new InMemoryStorage(), // 使用内存存储而不是 localStorage
  // eventBus: customEventBus, // 自定义事件总线用于通知
});

// 自定义序列化器处理复杂数据类型
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

## 🚀 高级用法示例

### 与 RxJS 集成的响应式存储

创建与 RxJS 可观察对象集成的响应式存储：

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

  // 重写 set 以发出变更
  set(value: T): void {
    super.set(value);
    this.subject.next(value);
  }

  // 获取可观察对象以进行响应式更新
  asObservable(): Observable<T | null> {
    return this.subject.asObservable();
  }

  // 获取特定属性的可观察对象
  select<R>(selector: (value: T | null) => R): Observable<R> {
    return this.subject.pipe(map(selector), distinctUntilChanged());
  }
}

// 使用
const userStorage = new ReactiveKeyStorage<{ name: string; theme: string }>({
  key: 'user-preferences',
});

// 对所有变更做出响应
userStorage.asObservable().subscribe(preferences => {
  console.log('用户偏好已变更:', preferences);
});

// 对特定属性变更做出响应
userStorage
  .select(prefs => prefs?.theme)
  .subscribe(theme => {
    document.body.className = `theme-${theme}`;
  });

// 更新存储（将触发观察者）
userStorage.set({ name: 'John', theme: 'dark' });
```

### 使用 Web Crypto API 的加密存储

为敏感数据实现安全的加密存储：

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

    // 合并 IV 和加密数据
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

// 使用（仅在安全上下文 - HTTPS 中工作）
const secureStorage = new KeyStorage<any>({
  key: 'sensitive-data',
  serializer: new EncryptedSerializer('user-password'),
});

// 存储加密数据
secureStorage.set({ apiKey: 'secret-key', tokens: ['token1', 'token2'] });

// 检索解密数据
const data = secureStorage.get();
console.log(data); // { apiKey: 'secret-key', tokens: [...] }
```

### 存储迁移和版本控制

跨应用版本处理存储模式迁移：

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

    // 为干净数据移除版本标记
    delete migratedData.__version;

    // 按顺序应用迁移
    for (const migration of this.migrations) {
      if (currentVersion < migration.version) {
        migratedData = migration.migrate(migratedData);
        migratedData.__version = migration.version;
      }
    }

    // 保存迁移数据
    if (migratedData.__version !== currentVersion) {
      super.set(migratedData);
    }

    delete migratedData.__version;
    return migratedData;
  }
}

// 定义迁移
const migrations: StorageVersion[] = [
  {
    version: 1,
    migrate: data => ({
      ...data,
      // 如果缺失则添加默认主题
      theme: data.theme || 'light',
    }),
  },
  {
    version: 2,
    migrate: data => ({
      ...data,
      // 重命名属性
      preferences: data.settings || {},
      settings: undefined,
    }),
  },
  {
    version: 3,
    migrate: data => ({
      ...data,
      // 添加时间戳
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  },
];

// 使用
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

// 数据将被自动迁移时访问
const prefs = userPrefsStorage.get();
```

### 使用存储事件的跨标签页通信

使用存储事件实现跨标签页通信：

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

    // 监听存储变更
    this.storage.addListener(messages => {
      if (!messages) return;

      // 处理新消息
      messages.forEach(message => {
        if (message.sourceTab !== this.tabId) {
          this.notifyListeners(message.type, message);
        }
      });
    });

    // 如果为空则初始化存储
    if (!this.storage.get()) {
      this.storage.set([]);
    }
  }

  // 向其他标签页广播消息
  broadcast(type: string, payload: any) {
    const messages = this.storage.get() || [];
    const message: TabMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      sourceTab: this.tabId,
    };

    // 添加消息并保留最近消息
    const updatedMessages = [...messages, message].slice(-50);
    this.storage.set(updatedMessages);
  }

  // 监听消息
  on(type: string, callback: (message: TabMessage) => void) {
    this.listeners.set(type, callback);
  }

  // 移除监听器
  off(type: string) {
    this.listeners.delete(type);
  }

  private notifyListeners(type: string, message: TabMessage) {
    const listener = this.listeners.get(type);
    if (listener) {
      listener(message);
    }
  }

  // 获取当前标签页 ID
  getTabId(): string {
    return this.tabId;
  }
}

// 使用
const messenger = new CrossTabMessenger('app-messages');

// 监听来自其他标签页的用户登录事件
messenger.on('user-logged-in', message => {
  console.log('用户从另一个标签页登录:', message.payload);
  // 更新当前标签页的状态
  updateUserState(message.payload.user);
});

// 广播用户操作
function onUserLogin(user: any) {
  messenger.broadcast('user-logged-in', { user, tabId: messenger.getTabId() });
}
```

### 性能监控和分析

为存储操作添加性能跟踪：

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

    // 保留最近的指标
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // 获取性能统计
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

  // 导出指标以进行分析
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // 清除指标
  clearMetrics() {
    this.metrics = [];
  }
}

// 使用
const monitoredStorage = new MonitoredKeyStorage<any>({
  key: 'app-data',
});

// 正常使用
monitoredStorage.set({ user: 'john', settings: {} });
const data = monitoredStorage.get();

// 获取性能洞察
const stats = monitoredStorage.getPerformanceStats();
console.log('存储性能:', stats);

// 导出以进行进一步分析
const metrics = monitoredStorage.exportMetrics();
```

### 与状态管理库集成

集成存储与流行状态管理解决方案的示例：

#### 与 Redux 集成

```typescript
import { createStore, combineReducers } from 'redux';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

// 存储支持的 reducer
function createPersistentReducer(reducer: any, storageKey: string) {
  const storage = new KeyStorage({
    key: storageKey,
  });

  // 从存储加载初始状态
  const initialState = storage.get() || reducer(undefined, { type: '@@INIT' });

  return (state = initialState, action: any) => {
    const newState = reducer(state, action);

    // 持久化状态变更（防抖）
    if (action.type !== '@@INIT') {
      setTimeout(() => storage.set(newState), 100);
    }

    return newState;
  };
}

// 使用
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

// 状态将自动持久化和恢复
```

#### 与 Zustand 集成

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

// 自动持久化主题变更
useAppStore.subscribe(
  state => state.theme,
  theme => {
    const themeStorage = new KeyStorage({ key: 'app-theme' });
    themeStorage.set(theme);
  },
);
```

## 实际示例

### 用户会话管理

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

    // 检查会话是否过期
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

### 跨标签页应用状态

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
    // 使用广播事件总线进行跨标签页同步
    const eventBus = new BroadcastTypedEventBus(
      new SerialTypedEventBus('app-state'),
    );

    this.stateStorage = new KeyStorage<AppState>({
      key: 'app-state',
      eventBus,
    });

    // 监听来自其他标签页的状态变更
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
    // 根据状态更新 UI 组件
  }
}
```

### 表单自动保存

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

  // 挂载时加载保存的数据
  useEffect(() => {
    const saved = formStorage.get();
    if (saved) {
      setFormData(saved);
      setLastSaved(saved.lastSaved || null);
    }
  }, [formStorage]);

  // 变更时自动保存
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

// 在组件中使用
function ArticleEditor({ articleId }: { articleId: string }) {
  const { formData, setFormData, lastSaved, clearAutoSave } = useAutoSaveForm(articleId);

  return (
    <div>
      {lastSaved && (
        <div className="autosave-indicator">
          自动保存于 {lastSaved.toLocaleTimeString()}
        </div>
      )}

      <input
        value={formData.title || ''}
        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
        placeholder="文章标题"
      />

      <textarea
        value={formData.content || ''}
        onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
        placeholder="文章内容"
      />

      <button onClick={clearAutoSave}>清除自动保存</button>
    </div>
  );
}
```

## 故障排除

### 常见问题

#### 存储配额超出

```typescript
// 处理存储配额错误
try {
  userStorage.set(largeData);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // 降级到内存存储或压缩数据
    console.warn('存储配额超出，使用降级方案');
    // 实现降级逻辑
  }
}
```

#### 跨标签页同步不工作

```typescript
// 确保 BroadcastChannel 被支持
if ('BroadcastChannel' in window) {
  const eventBus = new BroadcastTypedEventBus(
    new SerialTypedEventBus('my-app'),
  );
  // 与 KeyStorage 一起使用
} else {
  console.warn('BroadcastChannel 不被支持，降级到仅本地存储');
}
```

#### 序列化错误

```typescript
// 处理循环引用和复杂对象
class SafeJsonSerializer implements Serializer<string, any> {
  serialize(value: any): string {
    // 移除循环引用或处理特殊情况
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

#### 内存泄漏

```typescript
// 始终清理监听器
class ComponentWithStorage {
  private storage: KeyStorage<any>;
  private removeListener: () => void;

  constructor() {
    this.storage = new KeyStorage({ key: 'component-data' });
    this.removeListener = this.storage.addListener(event => {
      // 处理变更
    });
  }

  destroy() {
    // 组件销毁时清理
    this.removeListener();
    this.storage.destroy?.(); // 如果可用
  }
}
```

### 性能提示

- **使用合适的序列化器**：简单对象使用 JSON，复杂数据使用自定义序列化器
- **批量操作**：尽可能将多个存储操作分组
- **监控存储大小**：实施大小限制和清理策略
- **临时数据使用内存存储**：避免持久化不必要的数据
- **防抖频繁更新**：防止过度存储写入

### 浏览器兼容性

- **localStorage**：IE 8+，所有现代浏览器
- **BroadcastChannel**：Chrome 54+，Firefox 38+，Safari 15.4+
- **降级处理**：始终为不支持的功能提供降级方案

## API 参考

### 环境工具

#### `isBrowser(): boolean`

检查当前环境是否为浏览器。

#### `getStorage(): Storage`

返回合适的存储实现：

- 浏览器：`window.localStorage`（带可用性检查）
- 非浏览器：`InMemoryStorage` 实例

### KeyStorage

用于管理类型化值、缓存和变更通知的存储包装器。

```typescript
new KeyStorage<T>(options: KeyStorageOptions<T>)
```

#### 选项

- `key: string` - 存储键
- `serializer?: Serializer<string, T>` - 自定义序列化器（默认：JsonSerializer）
- `storage?: Storage` - 自定义存储（默认：getStorage()）
- `eventBus?: TypedEventBus<StorageEvent<T>>` - 自定义事件总线

#### 方法

- `get(): T | null` - 获取缓存的值
- `set(value: T): void` - 设置值并缓存和通知
- `remove(): void` - 移除值并清除缓存
- `addListener(handler: EventHandler<StorageEvent<T>>): RemoveStorageListener` - 添加变更监听器

### InMemoryStorage

Storage 接口的内存实现。

```typescript
new InMemoryStorage();
```

使用 Map 实现所有标准 Storage 方法。

### 序列化器

#### `JsonSerializer`

将值序列化为 JSON 字符串。

#### `typedIdentitySerializer<T>()`

恒等序列化器，直接传递值而不修改。

## 🧪 测试

```bash
# 运行测试
pnpm test

# 运行带覆盖率的测试
pnpm test --coverage
```

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](https://github.com/Ahoo-Wang/fetcher/blob/main/CONTRIBUTING.md) 了解更多详情。

## TypeScript 支持

完整的 TypeScript 支持，包括泛型和类型推断：

```typescript
// 类型化存储
const userStorage = new KeyStorage<User>({ key: 'user' });

// 类型安全操作
userStorage.set({ id: 1, name: 'John' });
const user = userStorage.get(); // User | null
```

## 📄 许可证

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/master/LICENSE)

---

<p align="center">
  Fetcher 生态系统的一部分
</p>
