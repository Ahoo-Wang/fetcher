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

import { CoSecJwtPayload, isTokenExpired, JwtPayload, parseJwtPayload } from './jwts';
import { Serializer } from './serializer';
import { CompositeToken } from './tokenRefresher';

/**
 * Interface for JWT token with typed payload
 * @template Payload The type of the JWT payload
 */
export interface IJwtToken<Payload extends JwtPayload> {
  readonly token: string;
  readonly payload: Payload;

  isExpired: boolean;
}

/**
 * Class representing a JWT token with typed payload
 * @template Payload The type of the JWT payload
 */
export class JwtToken<Payload extends JwtPayload> implements IJwtToken<Payload> {
  public readonly payload: Payload;

  /**
   * Creates a new JwtToken instance
   * @param token The JWT token string
   */
  constructor(
    public readonly token: string,
  ) {
    this.payload = parseJwtPayload(token) as Payload;
  }

  /**
   * Checks if the token is expired
   * @returns true if the token is expired, false otherwise
   */
  get isExpired(): boolean {
    return isTokenExpired(this.payload);
  }
}

/**
 * Class representing a composite token containing both access and refresh tokens
 */
export class JwtCompositeToken {
  /**
   * Creates a new JwtCompositeToken instance
   * @param access The access token
   * @param refresh The refresh token
   */
  constructor(public readonly access: JwtToken<CoSecJwtPayload>,
              public readonly refresh: JwtToken<JwtPayload>,
  ) {
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
export class JwtCompositeTokenSerializer implements Serializer<string, JwtCompositeToken> {
  /**
   * Deserializes a JSON string to a JwtCompositeToken
   * @param value The JSON string representation of a composite token
   * @returns A JwtCompositeToken instance
   */
  deserialize(value: string): JwtCompositeToken {
    const compositeToken = JSON.parse(value) as CompositeToken;
    return new JwtCompositeToken(
      new JwtToken(compositeToken.accessToken),
      new JwtToken(compositeToken.refreshToken),
    );
  }

  /**
   * Serializes a JwtCompositeToken to a JSON string
   * @param value The JwtCompositeToken to serialize
   * @returns A JSON string representation of the composite token
   */
  serialize(value: JwtCompositeToken): string {
    const compositeToken = {
      accessToken: value.access.token,
      refreshToken: value.refresh.token,
    };
    return JSON.stringify(compositeToken);
  }
}

/**
 * Global instance of JwtCompositeTokenSerializer
 */
export const jwtCompositeTokenSerializer = new JwtCompositeTokenSerializer();