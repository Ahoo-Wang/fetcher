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

import { InMemoryStorage, KeyStorage } from '../src';

describe('persisted state heals', () => {
  let storage: InMemoryStorage;
  beforeEach(() => {
    storage = new InMemoryStorage();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('reads a corrupt value as absent and removes it', () => {
    storage.setItem('token', '{bad');
    const keyStorage = new KeyStorage<{ a: number }>({
      key: 'token',
      storage,
      defaultValue: { a: 0 },
    });
    expect(keyStorage.get()).toEqual({ a: 0 });
    expect(storage.getItem('token')).toBeNull();
  });

  it('still sets and removes over a corrupt value', () => {
    storage.setItem('token', '{bad');
    const keyStorage = new KeyStorage<{ a: number }>({ key: 'token', storage });
    expect(() => keyStorage.set({ a: 1 })).not.toThrow();
    expect(keyStorage.get()).toEqual({ a: 1 });

    storage.setItem('token', '{bad');
    const fresh = new KeyStorage<{ a: number }>({ key: 'token', storage });
    expect(() => fresh.remove()).not.toThrow();
    expect(storage.getItem('token')).toBeNull();
  });

  it('removes the value on set(undefined) instead of storing the text "undefined"', () => {
    const keyStorage = new KeyStorage<string | undefined>({
      key: 'name',
      storage,
    });
    keyStorage.set('a');
    keyStorage.set(undefined);
    expect(storage.getItem('name')).toBeNull();
    expect(new KeyStorage({ key: 'name', storage }).get()).toBeNull();
  });

  it('stores text in InMemoryStorage, as Web Storage does', () => {
    storage.setItem('n', 1 as unknown as string);
    expect(storage.getItem('n')).toBe('1');
  });
});

describe('event bus ownership', () => {
  it('closes the bus it created, and leaves a bus it was given', () => {
    const own = new KeyStorage<string>({ key: 'own' });
    const destroyOwn = vi.spyOn(own.eventBus, 'destroy');
    own.destroy();
    expect(destroyOwn).toHaveBeenCalled();

    const given = new KeyStorage<string>({ key: 'given' }).eventBus;
    const destroyGiven = vi.spyOn(given, 'destroy');
    new KeyStorage<string>({ key: 'given', eventBus: given }).destroy();
    expect(destroyGiven).not.toHaveBeenCalled();
  });
});
