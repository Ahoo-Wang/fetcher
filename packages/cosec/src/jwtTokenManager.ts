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

import type { TokenStorage } from './tokenStorage';
import { CoSecTokenRefresher, type TokenRefresher } from './tokenRefresher';
import { JwtCompositeToken, type RefreshTokenStatusCapable } from './jwtToken';
import { FetcherError, type FetchExchange } from '@ahoo-wang/fetcher';
import { UNAUTHORIZED_ERROR_INTERCEPTOR_NAME } from './unauthorizedErrorInterceptor';
import {
  assertTokenSession,
  isSameTokenSession,
  TOKEN_SESSION_ATTRIBUTE,
} from './refreshSession';

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

/** The session changed while refreshing; the original request must stop. */
export class RefreshSessionChangedError extends FetcherError {
  constructor(cause?: unknown) {
    super('The token session changed during refresh.', cause);
    this.name = 'RefreshSessionChangedError';
    Object.setPrototypeOf(this, RefreshSessionChangedError.prototype);
  }
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
      const refresh =
        this.tokenRefresher instanceof CoSecTokenRefresher
          ? this.tokenRefresher.refresh(jwtToken.token, () => {
              if (this.currentToken !== jwtToken || notification.hasHandler)
                return false;
              notification.handled = true;
              return true;
            })
          : this.tokenRefresher.refresh(jwtToken.token);
      promise = refresh
        .then(newToken => {
          const currentToken = this.currentToken;
          if (!currentToken || !isSameTokenSession(jwtToken, currentToken)) {
            throw new RefreshSessionChangedError();
          }
          if (currentToken !== jwtToken) return currentToken;
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
          const currentToken = this.currentToken;
          if (
            currentToken &&
            currentToken !== jwtToken &&
            isSameTokenSession(jwtToken, currentToken)
          ) {
            return currentToken;
          }
          // The refresh client's own notification may have signed out this session.
          if (
            currentToken !== jwtToken &&
            (currentToken !== null || !notification.handled)
          ) {
            throw new RefreshSessionChangedError(error);
          }
          if (currentToken === jwtToken) {
            this.tokenStorage.remove();
          }
          throw new RefreshTokenError(jwtToken, error);
        })
        .finally(() => {
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
