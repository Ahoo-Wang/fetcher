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

export interface IJwtToken<Payload extends JwtPayload> {
  readonly token: string;
  readonly payload: Payload;

  isExpired(): boolean;
}

export class JwtToken<Payload extends JwtPayload> implements IJwtToken<Payload> {
  public readonly payload: Payload;

  constructor(
    public readonly token: string,
  ) {
    this.payload = parseJwtPayload(token) as Payload;
  }

  isExpired(): boolean {
    return isTokenExpired(this.payload);
  }
}

export class JwtCompositeToken {
  constructor(public readonly access: JwtToken<CoSecJwtPayload>,
              public readonly refresh: JwtToken<JwtPayload>,
  ) {
  }
}

export class JwtCompositeTokenSerializer implements Serializer<string, JwtCompositeToken> {
  deserialize(value: string): JwtCompositeToken {
    const compositeToken = JSON.parse(value) as CompositeToken;
    return new JwtCompositeToken(
      new JwtToken(compositeToken.accessToken),
      new JwtToken(compositeToken.refreshToken),
    );
  }

  serialize(value: JwtCompositeToken): string {
    const compositeToken = {
      accessToken: value.access.token,
      refreshToken: value.refresh.token,
    };
    return JSON.stringify(compositeToken);
  }
}

export const jwtCompositeTokenSerializer = new JwtCompositeTokenSerializer();