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

import {
  LocalStorageViewHost,
  type LocalStorageViewHostOptions,
} from './LocalStorageViewHost.js';
import {
  ViewServiceError,
  type ViewStorageLock,
} from './viewServiceContract.js';
import { message } from '../lib/snapshot.js';

export interface IndexedDBViewHostOptions extends Omit<
  LocalStorageViewHostOptions,
  'storage' | 'lock'
> {
  databaseName?: string;
  /** Optional one-time import of an existing fixture snapshot. */
  legacyStorage?: Pick<LocalStorageViewHostOptions['storage'], 'getItem'>;
}

/** Browser view storage with atomic read/CAS/write and create receipts across tabs. */
export class IndexedDBViewHost extends LocalStorageViewHost {
  constructor({
    databaseName = 'fve-view-state',
    legacyStorage,
    ...options
  }: IndexedDBViewHostOptions) {
    let active:
      { key: string; value: string | null; dirty: boolean } | undefined;
    const current = (key: string) => {
      if (!active || active.key !== key)
        throw new Error('View storage accessed outside its transaction');
      return active;
    };
    const storage: LocalStorageViewHostOptions['storage'] = {
      getItem: key => current(key).value,
      setItem: (key, value) => {
        Object.assign(current(key), { value, dirty: true });
      },
      removeItem: key => {
        Object.assign(current(key), { value: null, dirty: true });
      },
    };
    const lock: ViewStorageLock = (key, operation, signal) =>
      new Promise((resolve, reject) => {
        let db: IDBDatabase | undefined;
        let transaction: IDBTransaction | undefined;
        let settled = false;
        const finish = (
          error?: unknown,
          result?: ReturnType<typeof operation>,
        ) => {
          if (settled) return;
          settled = true;
          signal?.removeEventListener('abort', abort);
          db?.close();
          if (error !== undefined) reject(error);
          else resolve(result!);
        };
        const abort = () => {
          if (transaction) {
            try {
              transaction.abort();
            } catch {
              /* Commit may already have completed; oncomplete owns the result. */
            }
          } else
            finish(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
        };
        if (signal?.aborted) {
          abort();
          return;
        }
        signal?.addEventListener('abort', abort, { once: true });
        try {
          const request = indexedDB.open(databaseName, 1);
          request.onupgradeneeded = () =>
            request.result.createObjectStore('states');
          request.onerror = () =>
            finish(new ViewServiceError('UNAVAILABLE', message(request.error)));
          request.onblocked = () =>
            finish(
              new ViewServiceError(
                'UNAVAILABLE',
                '视图数据库被旧连接阻塞，请关闭旧页面后重试',
              ),
            );
          request.onsuccess = () => {
            db = request.result;
            if (settled) {
              db.close();
              return;
            }
            db.onversionchange = () => db?.close();
            let result: ReturnType<typeof operation>;
            let failure: unknown;
            try {
              // ponytail: one object store serializes view updates; use separate databases if write contention becomes material.
              transaction = db.transaction('states', 'readwrite');
              transaction.oncomplete = () => finish(undefined, result);
              transaction.onabort = () =>
                finish(
                  failure ??
                    (signal?.aborted
                      ? signal.reason
                      : new ViewServiceError(
                          'UNAVAILABLE',
                          message(transaction?.error),
                        )),
                );
              const store = transaction.objectStore('states');
              const read = store.get(key);
              read.onsuccess = () => {
                try {
                  signal?.throwIfAborted();
                  let value: string | null = read.result;
                  if (value === undefined) {
                    try {
                      value = legacyStorage?.getItem(key) ?? null;
                    } catch (error) {
                      throw new ViewServiceError('UNAVAILABLE', message(error));
                    }
                  }
                  active = {
                    key,
                    value,
                    dirty: read.result === undefined,
                  };
                  result = operation();
                  // A null tombstone prevents reset from importing an obsolete legacy snapshot again.
                  if (active.dirty) {
                    try {
                      store.put(active.value, key);
                    } catch (error) {
                      throw new ViewServiceError('UNAVAILABLE', message(error));
                    }
                  }
                } catch (error) {
                  failure = error;
                  transaction!.abort();
                } finally {
                  active = undefined;
                }
              };
            } catch (error) {
              finish(new ViewServiceError('UNAVAILABLE', message(error)));
            }
          };
        } catch (error) {
          finish(new ViewServiceError('UNAVAILABLE', message(error)));
        }
      });
    super({ ...options, storage, lock });
  }
}
