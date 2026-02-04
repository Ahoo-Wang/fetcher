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
import { KeyStorage, KeyStorageOptions, typedIdentitySerializer } from '@ahoo-wang/fetcher-storage';
import { BroadcastTypedEventBus, SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';
import { FetchExchange } from '@ahoo-wang/fetcher';

type SpaceId = string;

export interface SpaceIdProvider {
  resolveSpaceId(exchange: FetchExchange): SpaceId | null;
}

export const NoneSpaceIdProvider: SpaceIdProvider = {
  resolveSpaceId: () => null,
};

export const DEFAULT_COSEC_SPACE_ID_KEY = 'cosec-space-id';

export interface SpaceIdStorageOptions extends Partial<KeyStorageOptions<SpaceId>> {
}

export class SpaceIdStorage extends KeyStorage<SpaceId> {
  constructor({
                key = DEFAULT_COSEC_SPACE_ID_KEY,
                eventBus = new BroadcastTypedEventBus({
                  delegate: new SerialTypedEventBus(DEFAULT_COSEC_SPACE_ID_KEY),
                }),
                ...reset
              }: SpaceIdStorageOptions = {}) {
    super({ key, eventBus, ...reset, serializer: typedIdentitySerializer() });
  }
}

export interface SpacedResourcePredicate {

  test(exchange: FetchExchange): boolean;

}

export interface SpaceIdProviderOptions {
  spacedResourcePredicate: SpacedResourcePredicate;
  spaceIdStorage: SpaceIdStorage;
}

export class DefaultSpaceIdProvider implements SpaceIdProvider {

  constructor(private options: SpaceIdProviderOptions) {

  }

  resolveSpaceId(exchange: FetchExchange): SpaceId | null {
    if (!this.options.spacedResourcePredicate.test(exchange)) {
      return null;
    }
    return this.options.spaceIdStorage.get();
  }
}