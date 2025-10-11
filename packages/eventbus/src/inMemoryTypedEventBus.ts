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
import { toSorted } from '@ahoo-wang/fetcher';

export class InMemoryTypedEventBus<EVENT> implements TypedEventBus<EVENT> {
  private sortedHandlers: EventHandler<EVENT>[] = [];

  constructor(public readonly type: EventType) {
  }

  get handlers(): EventHandler<EVENT>[] {
    return [...this.sortedHandlers];
  }

  async emit(event: EVENT): Promise<void> {
    const onceHandlers: EventHandler<EVENT>[] = [];
    for (const handler of this.sortedHandlers) {
      try {
        await handler.handle(event);
      } catch (e) {
        console.warn(`Event handler error for ${handler.name}:`, e);
      } finally {
        if (handler.once) {
          onceHandlers.push(handler);
        }
      }
    }
    if (onceHandlers.length > 0) {
      this.sortedHandlers = toSorted(this.sortedHandlers.filter(item => !onceHandlers.includes(item)));
    }
  }

  off(name: string): boolean {
    const original = this.sortedHandlers;
    if (!original.some(item => item.name === name)) {
      return false;
    }
    this.sortedHandlers = toSorted(original, item => item.name !== name);
    return true;
  }

  on(handler: EventHandler<EVENT>): boolean {
    const original = this.sortedHandlers;
    if (original.some(item => item.name === handler.name)) {
      return false;
    }
    this.sortedHandlers = toSorted([...original, handler]);
    return true;
  }
}