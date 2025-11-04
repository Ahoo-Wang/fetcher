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

import { TokenStorage } from './tokenStorage';
import { TokenRefresher } from './tokenRefresher';
import { JwtCompositeToken, RefreshTokenStatusCapable } from './jwtToken';
import { FetcherError } from '@ahoo-wang/fetcher';

export class RefreshTokenError extends FetcherError {
  constructor(
    public readonly token: JwtCompositeToken,
    cause?: Error | any,
  ) {
    super(`Refresh token failed.`, cause);
    this.name = 'RefreshTokenError';
    Object.setPrototypeOf(this, RefreshTokenError.prototype);
  }
}

/**
 * Manages JWT token refreshing operations and provides status information
 */
export class JwtTokenManager implements RefreshTokenStatusCapable {
  private refreshInProgress?: Promise<void>;

  /**
   * Creates a new JwtTokenManager instance
   * @param tokenStorage The storage used to persist tokens
   * @param tokenRefresher The refresher used to refresh expired tokens
   */
  constructor(
    public readonly tokenStorage: TokenStorage,
    public readonly tokenRefresher: TokenRefresher,
  ) {
  }

  /**
   * Gets the current JWT composite token from storage
   * @returns The current token or null if none exists
   */
  get currentToken(): JwtCompositeToken | null {
    return this.tokenStorage.get();
  }

  /**
   * Refreshes the JWT token
   * @returns Promise that resolves when refresh is complete
   * @throws Error if no token is found or refresh fails
   */
  async refresh(): Promise<void> {
    const jwtToken = this.currentToken;
    if (!jwtToken) {
      throw new Error('No token found');
    }
    if (this.refreshInProgress) {
      return this.refreshInProgress;
    }

    this.refreshInProgress = this.tokenRefresher
      .refresh(jwtToken.token)
      .then(newToken => {
        this.tokenStorage.setCompositeToken(newToken);
      })
      .catch(error => {
        this.tokenStorage.remove();
        throw new RefreshTokenError(jwtToken, error);
      })
      .finally(() => {
        this.refreshInProgress = undefined;
      });

    return this.refreshInProgress;
  }

  /**
   * Indicates if the current token needs to be refreshed
   * @returns true if the access token is expired and needs refresh, false otherwise
   */
  get isRefreshNeeded(): boolean {
    if (!this.currentToken) {
      return false;
    }
    return this.currentToken.isRefreshNeeded;
  }

  /**
   * Indicates if the current token can be refreshed
   * @returns true if the refresh token is still valid, false otherwise
   */
  get isRefreshable(): boolean {
    if (!this.currentToken) {
      return false;
    }
    return this.currentToken.isRefreshable;
  }
}
