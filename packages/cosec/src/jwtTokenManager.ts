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

import type { TokenStorage } from './tokenStorage.js';
import {
  CoSecTokenRefresher,
  type CompositeToken,
  type TokenRefresher,
} from './tokenRefresher.js';
import {
  JwtCompositeToken,
  type RefreshTokenStatusCapable,
} from './jwtToken.js';
import type { FetchExchange } from '@ahoo-wang/fetcher';
import {
  TOKEN_SESSION_ATTRIBUTE,
  UNAUTHORIZED_ERROR_INTERCEPTOR_NAME,
} from './constants.js';
import {
  assertTokenSession,
  isSameToken,
  isSameTokenSession,
} from './refreshSession.js';
import { RefreshSessionChangedError, RefreshTokenError } from './errors.js';
import { withRefreshLock } from './refreshLock.js';

export { RefreshSessionChangedError, RefreshTokenError } from './errors.js';

function isCompositeToken(token: unknown): token is CompositeToken {
  return (
    typeof token === 'object' &&
    token !== null &&
    typeof (token as CompositeToken).accessToken === 'string' &&
    typeof (token as CompositeToken).refreshToken === 'string'
  );
}

/**
 * Manages JWT token refreshing operations and provides status information
 */
export class JwtTokenManager implements RefreshTokenStatusCapable {
  private refreshInProgress?: {
    token: JwtCompositeToken;
    promise: Promise<JwtCompositeToken>;
    notification: { hasHandler: boolean; handled: boolean };
  };

  /**
   * Creates a new JwtTokenManager instance
   * @param tokenStorage The storage used to persist tokens
   * @param tokenRefresher The refresher used to refresh expired tokens
   */
  constructor(
    public readonly tokenStorage: TokenStorage,
    public readonly tokenRefresher: TokenRefresher,
  ) {}

  /**
   * Gets the current JWT composite token from storage
   * @returns The current token or null if none exists
   */
  get currentToken(): JwtCompositeToken | null {
    return this.tokenStorage.get();
  }

  /**
   * Refreshes the JWT token
   * @param exchange Optional originating request used to select the unauthorized notification owner
   * @returns Promise that resolves when refresh is complete
   * @throws Error if no token is found or refresh fails
   * @throws RefreshSessionChangedError if the session changes while refreshing
   */
  async refresh(exchange?: FetchExchange): Promise<void> {
    const jwtToken = this.currentToken;
    if (!jwtToken) {
      throw new Error('No token found');
    }
    if (exchange) {
      const previousToken = exchange.attributes.get(TOKEN_SESSION_ATTRIBUTE);
      assertTokenSession(exchange, jwtToken);
      exchange.attributes.set(TOKEN_SESSION_ATTRIBUTE, jwtToken);
      if (
        exchange.attributes.get(UNAUTHORIZED_ERROR_INTERCEPTOR_NAME) !== true
      ) {
        exchange.attributes.set(
          UNAUTHORIZED_ERROR_INTERCEPTOR_NAME,
          () =>
            this.currentToken ===
            exchange.attributes.get(TOKEN_SESSION_ATTRIBUTE),
        );
      }
      if (previousToken && previousToken !== jwtToken) {
        return;
      }
    }
    const inProgress =
      this.refreshInProgress?.token === jwtToken
        ? this.refreshInProgress
        : undefined;
    const notification = inProgress?.notification ?? {
      hasHandler: false,
      handled: false,
    };
    notification.hasHandler ||=
      this.tokenRefresher instanceof CoSecTokenRefresher &&
      (exchange?.fetcher.interceptors.error.interceptors.some(
        interceptor => interceptor.name === UNAUTHORIZED_ERROR_INTERCEPTOR_NAME,
      ) ??
        false);
    let promise = inProgress?.promise;
    if (!promise) {
      const refreshAndStore = (): Promise<JwtCompositeToken> =>
        (this.tokenRefresher instanceof CoSecTokenRefresher
          ? this.tokenRefresher.refresh(jwtToken.token, () => {
              if (
                !isSameToken(jwtToken, this.currentToken) ||
                notification.hasHandler
              )
                return false;
              notification.handled = true;
              return true;
            })
          : this.tokenRefresher.refresh(jwtToken.token)
        )
          .then(newToken => {
            const currentToken = this.currentToken;
            if (!currentToken || !isSameTokenSession(jwtToken, currentToken)) {
              throw new RefreshSessionChangedError();
            }
            if (!isSameToken(jwtToken, currentToken)) return currentToken;
            // A malformed response must not be stored as the session token.
            if (!isCompositeToken(newToken)) {
              throw new Error(
                'The refresh response has no accessToken and refreshToken.',
              );
            }
            const refreshedToken = new JwtCompositeToken(
              newToken,
              this.tokenStorage.earlyPeriod,
              jwtToken.sessionId,
            );
            this.tokenStorage.set(refreshedToken);
            return refreshedToken;
          })
          .catch(error => {
            if (error instanceof RefreshSessionChangedError) {
              throw error;
            }
            // Another tab may already have refreshed this session with a
            // one-time refresh token (so ours failed) and written the new
            // token, before its change event reached this tab: read storage,
            // not the cache, so its token is reused instead of removed.
            const currentToken = this.tokenStorage.reload();
            if (
              currentToken &&
              !isSameToken(jwtToken, currentToken) &&
              isSameTokenSession(jwtToken, currentToken)
            ) {
              return currentToken;
            }
            // The refresh client's own notification may have signed out this session.
            if (
              !isSameToken(jwtToken, currentToken) &&
              (currentToken !== null || !notification.handled)
            ) {
              throw new RefreshSessionChangedError(error);
            }
            if (isSameToken(jwtToken, currentToken)) {
              this.tokenStorage.remove();
            }
            throw new RefreshTokenError(jwtToken, error);
          });
      // Tabs sharing the storage refresh one at a time (Web Locks): the one
      // that waited reads the token the other stored instead of spending the
      // already used refresh token, and so never signs that session out.
      promise = withRefreshLock(this.tokenStorage, async locked => {
        if (locked) {
          const storedToken = this.tokenStorage.reload();
          if (!isSameToken(jwtToken, storedToken)) {
            if (storedToken && isSameTokenSession(jwtToken, storedToken)) {
              return storedToken;
            }
            throw new RefreshSessionChangedError();
          }
        }
        return refreshAndStore();
      }).finally(() => {
        if (this.refreshInProgress?.promise === promise) {
          this.refreshInProgress = undefined;
        }
      });

      this.refreshInProgress = { token: jwtToken, promise, notification };
    }
    try {
      const refreshedToken = await promise;
      exchange?.attributes.set(TOKEN_SESSION_ATTRIBUTE, refreshedToken);
      if (!isSameTokenSession(refreshedToken, this.currentToken)) {
        throw new RefreshSessionChangedError();
      }
    } catch (error) {
      if (error instanceof RefreshTokenError && exchange) {
        exchange.attributes.set(TOKEN_SESSION_ATTRIBUTE, null);
        if (
          exchange.attributes.get(UNAUTHORIZED_ERROR_INTERCEPTOR_NAME) !== true
        ) {
          exchange.attributes.set(UNAUTHORIZED_ERROR_INTERCEPTOR_NAME, () => {
            if (this.currentToken !== null || notification.handled)
              return false;
            notification.handled = true;
            return true;
          });
        }
      }
      throw error;
    }
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
