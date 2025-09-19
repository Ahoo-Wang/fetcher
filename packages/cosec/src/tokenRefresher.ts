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

import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import { IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY } from './cosecRequestInterceptor';

/**
 * Interface for access tokens.
 */
export interface AccessToken {
  accessToken: string;
}

/**
 * Interface for refresh tokens.
 */
export interface RefreshToken {
  refreshToken: string;
}

/**
 * Composite token interface that contains both access and refresh tokens.
 *
 * accessToken and refreshToken always appear in pairs, no need to split them.
 */
export interface CompositeToken extends AccessToken, RefreshToken {
}

/**
 * Interface for token refreshers.
 *
 * Provides a method to refresh tokens.
 */
export interface TokenRefresher {
  /**
   * Refresh the given token and return a new CompositeToken.
   *
   * @param token The token to refresh
   * @returns A Promise that resolves to a new CompositeToken
   */
  refresh(token: CompositeToken): Promise<CompositeToken>;
}

export interface CoSecTokenRefresherOptions {
  fetcher: Fetcher;
  endpoint: string;
}

/**
 * CoSecTokenRefresher is a class that implements the TokenRefresher interface
 * for refreshing composite tokens through a configured endpoint.
 */
export class CoSecTokenRefresher implements TokenRefresher {
  /**
   * Creates a new instance of CoSecTokenRefresher.
   *
   * @param options The configuration options for the token refresher including fetcher and endpoint
   */
  constructor(public readonly options: CoSecTokenRefresherOptions) {
  }

  /**
   * Refresh the given token and return a new CompositeToken.
   *
   * @param token The token to refresh
   * @returns A Promise that resolves to a new CompositeToken
   */
  refresh(token: CompositeToken): Promise<CompositeToken> {
    // Send a POST request to the configured endpoint with the token as body
    // and extract the response as JSON to return a new CompositeToken

    return this.options.fetcher.post<CompositeToken>(
      this.options.endpoint,
      {
        body: token,
      },
      {
        resultExtractor: ResultExtractors.Json,
        attributes: new Map([[IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY, true]]),
      },
    );
  }
}
