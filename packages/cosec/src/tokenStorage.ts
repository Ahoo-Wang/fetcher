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
import { EarlyPeriodCapable } from './jwts';
import {
  KeyStorage, KeyStorageOptions,
} from '@ahoo-wang/fetcher-storage';
import { BroadcastTypedEventBus, SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

export const DEFAULT_COSEC_TOKEN_KEY = 'cosec-token';

export interface TokenStorageOptions extends Partial<Omit<KeyStorageOptions<JwtCompositeToken>, 'serializer'>>, Partial<EarlyPeriodCapable> {

}

/**
 * Storage class for managing access and refresh tokens.
 */
export class TokenStorage
  extends KeyStorage<JwtCompositeToken>
  implements EarlyPeriodCapable {
  public readonly earlyPeriod: number;

  constructor(
    {
      key = DEFAULT_COSEC_TOKEN_KEY,
      eventBus = new BroadcastTypedEventBus({ delegate: new SerialTypedEventBus(DEFAULT_COSEC_TOKEN_KEY) }),
      earlyPeriod = 0,
      ...reset
    }: TokenStorageOptions = {},
  ) {
    super({
      key, eventBus,
      ...reset,
      serializer: new JwtCompositeTokenSerializer(earlyPeriod),
    });
    this.earlyPeriod = earlyPeriod;
  }

  setCompositeToken(compositeToken: CompositeToken) {
    this.set(new JwtCompositeToken(compositeToken, this.earlyPeriod));
  }
}