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

export type EventType = string;

/**
 * A handler registered with a TypedEventBus.
 *
 * `name` and `order` match `NamedCapable` and `OrderedCapable` from
 * `@ahoo-wang/fetcher`, declared here so this package has no dependency on it.
 */
export interface EventHandler<EVENT> {
  /** Unique name of the handler on its bus; `off(name)` removes it. */
  name: string;

  /**
   * Run order on a SerialTypedEventBus: lower values run first, equal values
   * keep registration order. Defaults to 0. ParallelTypedEventBus ignores it.
   */
  order?: number;

  /** Removes the handler after the first event dispatched to it. */
  once?: boolean;

  handle(event: EVENT): void | Promise<void>;
}
