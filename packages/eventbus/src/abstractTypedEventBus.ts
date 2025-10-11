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

import { TypedEventBus } from './typedEventBus';
import { EventHandler, EventType } from './types';

export abstract class AbstractTypedEventBus<EVENT> implements TypedEventBus<EVENT> {
  protected eventHandlers: EventHandler<EVENT>[] = [];
  abstract type: EventType;

  /**
   * Gets a copy of all registered event handlers, sorted by order
   */
  get handlers(): EventHandler<EVENT>[] {
    return [...this.eventHandlers];
  }

  destroy() {
    this.eventHandlers = [];
  }

  protected async handleEvent(handler: EventHandler<EVENT>, event: EVENT): Promise<void> {
    try {
      handler.handle(event);
    } catch (e) {
      console.warn(`Event handler error for ${handler.name}:`, e);
    }
  }

  abstract emit(event: EVENT): Promise<void>;

  abstract off(name: string): boolean;

  abstract on(handler: EventHandler<EVENT>): boolean;
}