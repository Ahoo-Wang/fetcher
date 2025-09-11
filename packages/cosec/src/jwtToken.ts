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

import { CoSecJwtPayload, EarlyPeriodCapable, isTokenExpired, JwtPayload, parseJwtPayload } from './jwts';
import { CompositeToken } from './tokenRefresher';
import { Serializer } from '@ahoo-wang/fetcher-storage';


/**
 * Interface for JWT token with typed payload
 * @template Payload The type of the JWT payload
 */
export interface IJwtToken<Payload extends JwtPayload> extends EarlyPeriodCapable {
  readonly token: string;
  readonly payload: Payload | null;

  isExpired: boolean;
}

/**
 * Class representing a JWT token with typed payload
 * @template Payload The type of the JWT payload
 */
export class JwtToken<Payload extends JwtPayload> implements IJwtToken<Payload> {
  public readonly payload: Payload | null;

  /**
   * Creates a new JwtToken instance
   */
  constructor(
    public readonly token: string,
    public readonly earlyPeriod: number = 0,
  ) {
    this.payload = parseJwtPayload<Payload>(token);
  }

  /**
   * Checks if the token is expired
   * @returns true if the token is expired, false otherwise
   */
  get isExpired(): boolean {
    if (!this.payload) {
      return true;
    }
    return isTokenExpired(this.payload, this.earlyPeriod);
  }
}

export interface RefreshTokenStatusCapable {
  /**
   * Checks if the access token needs to be refreshed
   * @returns true if the access token is expired, false otherwise
   */
  readonly isRefreshNeeded: boolean;
  /**
   * Checks if the refresh token is still valid and can be used to refresh the access token
   * @returns true if the refresh token is not expired, false otherwise
   */
  readonly isRefreshable: boolean;
}

/**
 * Class representing a composite token containing both access and refresh tokens
 */
export class JwtCompositeToken implements EarlyPeriodCapable, RefreshTokenStatusCapable {
  public readonly access: JwtToken<CoSecJwtPayload>;
  public readonly refresh: JwtToken<JwtPayload>;

  /**
   * Creates a new JwtCompositeToken instance
   */
  constructor(public readonly token: CompositeToken, public readonly earlyPeriod: number = 0) {
    this.access = new JwtToken(token.accessToken, earlyPeriod);
    this.refresh = new JwtToken(token.refreshToken, earlyPeriod);
  }

  /**
   * Checks if the access token needs to be refreshed
   * @returns true if the access token is expired, false otherwise
   */
  get isRefreshNeeded(): boolean {
    return this.access.isExpired;
  }

  /**
   * Checks if the refresh token is still valid and can be used to refresh the access token
   * @returns true if the refresh token is not expired, false otherwise
   */
  get isRefreshable(): boolean {
    return !this.refresh.isExpired;
  }

}

/**
 * Serializer for JwtCompositeToken that handles conversion to and from JSON strings
 */
export class JwtCompositeTokenSerializer implements Serializer<string, JwtCompositeToken>, EarlyPeriodCapable {
  constructor(public readonly earlyPeriod: number = 0) {
  }

  /**
   * Deserializes a JSON string to a JwtCompositeToken
   * @param value The JSON string representation of a composite token
   * @returns A JwtCompositeToken instance
   */
  deserialize(value: string): JwtCompositeToken {
    const compositeToken = JSON.parse(value) as CompositeToken;
    return new JwtCompositeToken(compositeToken, this.earlyPeriod);
  }

  /**
   * Serializes a JwtCompositeToken to a JSON string
   * @param value The JwtCompositeToken to serialize
   * @returns A JSON string representation of the composite token
   */
  serialize(value: JwtCompositeToken): string {
    return JSON.stringify(value.token);
  }
}

export const jwtCompositeTokenSerializer = new JwtCompositeTokenSerializer();