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

import { InMemoryListenableStorage } from './inMemoryListenableStorage';
import { BrowserListenableStorage } from './browserListenableStorage';
import { isBrowser } from '../env';

/**
 * The type of storage event used for listening to storage changes.
 */
export const STORAGE_EVENT_TYPE = 'storage';

/**
 * A function that handles storage change events.
 */
export type StorageListener = (event: StorageEventInit) => void;

/**
 * A function that removes a storage listener when called.
 */
export type RemoveStorageListener = () => void;

export interface StorageListenable {
  /**
   * Adds a listener for storage changes.
   * @param listener - The listener function to be called when storage changes
   * @returns A function that can be called to remove the listener
   */
  addListener(listener: StorageListener): RemoveStorageListener;
}

/**
 * An interface that extends the native Storage interface with the ability to listen for storage changes.
 */
export interface ListenableStorage extends Storage, StorageListenable {

}

/**
 * Factory function to get an appropriate ListenableStorage implementation based on the environment.
 * In a browser environment, it returns a BrowserListenableStorage wrapping localStorage.
 * In other environments, it returns an InMemoryListenableStorage.
 * @returns A ListenableStorage instance suitable for the current environment
 */
export const createListenableStorage = (): ListenableStorage => {
  if (isBrowser()) {
    return new BrowserListenableStorage(window.localStorage);
  }
  return new InMemoryListenableStorage();
};