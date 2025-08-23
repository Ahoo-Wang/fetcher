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

/**
 * Access token interface
 */
export interface AccessToken {
  accessToken: string;
}

/**
 * Refresh token interface
 */
export interface RefreshToken {
  refreshToken: string;
}

/**
 * Composite token interface that contains both access and refresh tokens
 * accessToken and refreshToken always appear in pairs, no need to split them
 */
export interface CompositeToken extends AccessToken, RefreshToken {
}

/**
 * Token refresher interface
 * Provides a method to refresh tokens
 */
export interface TokenRefresher {
  /**
   * Refresh the given token and return a new CompositeToken
   * @param token The token to refresh
   * @returns A Promise that resolves to a new CompositeToken
   */
  refresh(token: CompositeToken): Promise<CompositeToken>;
}
