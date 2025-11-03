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
import { PartialBy } from '@ahoo-wang/fetcher';
import { BroadcastTypedEventBus, SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

export const DEFAULT_COSEC_TOKEN_KEY = 'cosec-token';

export interface TokenStorageOptions extends Omit<KeyStorageOptions<JwtCompositeToken>, 'serializer'>, PartialBy<EarlyPeriodCapable, 'earlyPeriod'> {

}

/**
 * Storage class for managing access and refresh tokens.
 */
export class TokenStorage
  extends KeyStorage<JwtCompositeToken>
  implements EarlyPeriodCapable {
  public readonly earlyPeriod: number;

  constructor(
    options: TokenStorageOptions = {
      key: DEFAULT_COSEC_TOKEN_KEY,
      eventBus: new BroadcastTypedEventBus({ delegate: new SerialTypedEventBus(DEFAULT_COSEC_TOKEN_KEY) }),
    },
  ) {
    super({
      serializer: new JwtCompositeTokenSerializer(options.earlyPeriod),
      ...options,
    });
    this.earlyPeriod = options.earlyPeriod ?? 0;
  }

  setCompositeToken(compositeToken: CompositeToken) {
    this.set(new JwtCompositeToken(compositeToken, this.earlyPeriod));
  }
}