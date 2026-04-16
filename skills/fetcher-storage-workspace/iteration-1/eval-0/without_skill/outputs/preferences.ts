import { KeyStorage, getStorage, TypedEventBus, StorageEvent } from '@ahoo-wang/fetcher-storage';

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

type RemoveListener = () => void;

class PreferencesStorage {
  private storage: KeyStorage<UserPreferences>;

  constructor() {
    this.storage = new KeyStorage<UserPreferences>({
      key: 'user-preferences',
      storage: getStorage(),
    });
  }

  getTheme(): 'light' | 'dark' | null {
    const prefs = this.storage.get();
    return prefs?.theme ?? null;
  }

  setTheme(theme: 'light' | 'dark'): void {
    const current = this.storage.get() ?? { theme: 'light', language: 'en', notifications: true };
    this.storage.set({ ...current, theme });
  }

  getLanguage(): string | null {
    const prefs = this.storage.get();
    return prefs?.language ?? null;
  }

  setLanguage(language: string): void {
    const current = this.storage.get() ?? { theme: 'light', language: 'en', notifications: true };
    this.storage.set({ ...current, language });
  }

  getNotifications(): boolean | null {
    const prefs = this.storage.get();
    return prefs?.notifications ?? null;
  }

  setNotifications(notifications: boolean): void {
    const current = this.storage.get() ?? { theme: 'light', language: 'en', notifications: true };
    this.storage.set({ ...current, notifications });
  }

  addPreferencesListener(handler: (event: StorageEvent<UserPreferences>) => void): RemoveListener {
    return this.storage.addListener(handler);
  }
}

export const preferencesStorage = new PreferencesStorage();

export function getTheme(): 'light' | 'dark' | null {
  return preferencesStorage.getTheme();
}

export function setTheme(theme: 'light' | 'dark'): void {
  preferencesStorage.setTheme(theme);
}

export function getLanguage(): string | null {
  return preferencesStorage.getLanguage();
}

export function setLanguage(language: string): void {
  preferencesStorage.setLanguage(language);
}

export function getNotifications(): boolean | null {
  return preferencesStorage.getNotifications();
}

export function setNotifications(notifications: boolean): void {
  preferencesStorage.setNotifications(notifications);
}

export function addPreferencesListener(handler: (event: StorageEvent<UserPreferences>) => void): RemoveListener {
  return preferencesStorage.addPreferencesListener(handler);
}
