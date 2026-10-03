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

import type { StorageEvent } from '@ahoo-wang/fetcher-storage';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
  type TypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

/**
 * The event bus a CoSec storage uses: the given one, or a new cross-tab bus
 * whose channel name is the storage key, so that storages for different keys
 * never cross-talk over the same channel. A storage that gets a new bus owns
 * it (`ownEventBus()`), and closes it on destroy.
 */
export function storageEventBus<T>(
  key: string,
  eventBus?: TypedEventBus<StorageEvent<T>>,
): TypedEventBus<StorageEvent<T>> {
  return (
    eventBus ??
    new BroadcastTypedEventBus({
      delegate: new SerialTypedEventBus<StorageEvent<T>>(key),
    })
  );
}
