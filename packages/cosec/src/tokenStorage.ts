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

import { getStorage } from './inMemoryStorage';
import { CompositeToken } from './tokenRefresher';

export const DEFAULT_COSEC_TOKEN_KEY = 'cosec-token';

/**
 * Token storage class for managing access and refresh tokens
 */
export class TokenStorage {
  private readonly tokenKey: string;
  private storage: Storage;

  constructor(
    tokenKey: string = DEFAULT_COSEC_TOKEN_KEY,
    storage: Storage = getStorage(),
  ) {
    this.tokenKey = tokenKey;
    this.storage = storage;
  }

  /**
   * Get the current access token
   */
  get(): CompositeToken | null {
    const tokenStr = this.storage.getItem(this.tokenKey);
    return tokenStr ? JSON.parse(tokenStr) : null;
  }

  /**
   * Store a composite token
   */
  set(token: CompositeToken): void {
    const tokenStr = JSON.stringify(token);
    this.storage.setItem(this.tokenKey, tokenStr);
  }

  /**
   * Clear all tokens
   */
  clear(): void {
    this.storage.removeItem(this.tokenKey);
  }
}
