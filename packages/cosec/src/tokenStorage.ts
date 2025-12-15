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

import { JwtCompositeToken, JwtCompositeTokenSerializer } from './jwtToken';
import { CompositeToken } from './tokenRefresher';
import { CoSecJwtPayload, EarlyPeriodCapable } from './jwts';
import { KeyStorage, KeyStorageOptions } from '@ahoo-wang/fetcher-storage';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

/**
 * Default key used for storing CoSec tokens in storage.
 */
export const DEFAULT_COSEC_TOKEN_KEY = 'cosec-token';

/**
 * Options for configuring TokenStorage.
 * Extends KeyStorageOptions excluding 'serializer' and includes EarlyPeriodCapable properties.
 */
export interface TokenStorageOptions
  extends
    Partial<Omit<KeyStorageOptions<JwtCompositeToken>, 'serializer'>>,
    Partial<EarlyPeriodCapable> {}

/**
 * Storage class for managing access and refresh tokens in CoSec authentication.
 * Provides methods to store, retrieve, and manage JWT composite tokens with early period support.
 * Extends KeyStorage to handle persistence and implements EarlyPeriodCapable for token refresh timing.
 */
export class TokenStorage
  extends KeyStorage<JwtCompositeToken>
  implements EarlyPeriodCapable
{
  /**
   * The early period in milliseconds for token refresh timing.
   */
  public readonly earlyPeriod: number;

  /**
   * Creates a new TokenStorage instance.
   * @param options - Configuration options for the token storage.
   * @param options.key - The storage key for tokens. Defaults to DEFAULT_COSEC_TOKEN_KEY.
   * @param options.eventBus - Event bus for token change notifications. Defaults to a BroadcastTypedEventBus with SerialTypedEventBus delegate.
   * @param options.earlyPeriod - Early period for token refresh in milliseconds. Defaults to 0.
   * @param reset - Additional options passed to KeyStorage.
   */
  constructor({
    key = DEFAULT_COSEC_TOKEN_KEY,
    eventBus = new BroadcastTypedEventBus({
      delegate: new SerialTypedEventBus(DEFAULT_COSEC_TOKEN_KEY),
    }),
    earlyPeriod = 0,
    ...reset
  }: TokenStorageOptions = {}) {
    super({
      key,
      eventBus,
      ...reset,
      serializer: new JwtCompositeTokenSerializer(earlyPeriod),
    });
    this.earlyPeriod = earlyPeriod;
  }

  /**
   * Sets a composite token in storage.
   * Converts the composite token to a JwtCompositeToken and stores it.
   * @deprecated Use signIn() instead for better semantic clarity.
   * @param compositeToken - The composite token containing access and refresh tokens.
   */
  setCompositeToken(compositeToken: CompositeToken) {
    this.signIn(compositeToken);
  }

  /**
   * Signs in by storing the composite token.
   * @param compositeToken - The composite token to store for authentication.
   */
  signIn(compositeToken: CompositeToken): void {
    this.set(new JwtCompositeToken(compositeToken, this.earlyPeriod));
  }

  /**
   * Signs out by removing the stored token.
   * Clears the token from storage.
   */
  signOut(): void {
    this.remove();
  }

  /**
   * Checks if the user is authenticated.
   * @returns true if a valid token is present and authenticated, false otherwise.
   */
  get authenticated(): boolean {
    return this.get()?.authenticated === true;
  }

  /**
   * Gets the current user's JWT payload.
   * @returns The JWT payload of the current user if authenticated, null otherwise.
   */
  get currentUser(): CoSecJwtPayload | null {
    if (!this.authenticated) {
      return null;
    }
    return this.get()?.access.payload ?? null;
  }
}
