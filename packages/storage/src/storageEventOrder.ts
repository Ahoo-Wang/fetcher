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

/**
 * The order of KeyStorage changes. Internal; not exported from the package.
 *
 * Every change a KeyStorage emits is stamped from a hybrid logical clock:
 * the time of the change, a counter for changes within the same instant, and
 * the realm that made it. A bus may deliver changes out of order (a
 * ParallelTypedEventBus runs a re-entrant change before the rest of the
 * outer one, and a broadcast waits for the sender's local listeners), so a
 * cache keeps the latest stamp it applied and ignores older changes. The
 * stamp travels with the automatic broadcast codec; a received stamp moves
 * this realm's clock past it, so a change made after seeing another is
 * always ordered after it.
 */

import { sharedState } from './sharedState.js';

export interface StorageEventStamp {
  time: number;
  counter: number;
  source: string;
}

const state = sharedState('event-order', () => ({
  clock: {
    time: 0,
    counter: 0,
    source:
      Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
  } as StorageEventStamp,
  stamps: new WeakMap<object, StorageEventStamp>(),
}));

function now(): number {
  const performance = globalThis.performance;
  return typeof performance?.now === 'function' &&
    typeof performance.timeOrigin === 'number'
    ? performance.timeOrigin + performance.now()
    : Date.now();
}

/** Orders two stamps: negative when `a` is the older change. */
export function compareStamps(
  a: StorageEventStamp,
  b: StorageEventStamp,
): number {
  if (a.time !== b.time) return a.time < b.time ? -1 : 1;
  if (a.counter !== b.counter) return a.counter - b.counter;
  return a.source < b.source ? -1 : a.source > b.source ? 1 : 0;
}

/** Stamps a change this realm is about to emit. */
export function stampStorageEvent(event: object): StorageEventStamp {
  const clock = state.clock;
  const time = now();
  if (time > clock.time) {
    clock.time = time;
    clock.counter = 0;
  } else {
    clock.counter++;
  }
  const stamp = { ...clock };
  state.stamps.set(event, stamp);
  return stamp;
}

/** The stamp of a change, if it has one. */
export function storageEventStamp(
  event: unknown,
): StorageEventStamp | undefined {
  return typeof event === 'object' && event !== null
    ? state.stamps.get(event)
    : undefined;
}

/**
 * Gives a change received from another realm the stamp it carried, and moves
 * this realm's clock past it. A missing or malformed stamp is ignored.
 */
export function receiveStorageEventStamp(event: object, stamp: unknown): void {
  if (
    typeof stamp !== 'object' ||
    stamp === null ||
    !('time' in stamp) ||
    !('counter' in stamp) ||
    !('source' in stamp) ||
    !Number.isFinite(stamp.time) ||
    !Number.isFinite(stamp.counter) ||
    typeof stamp.source !== 'string'
  ) {
    return;
  }
  const received: StorageEventStamp = {
    time: stamp.time as number,
    counter: stamp.counter as number,
    source: stamp.source,
  };
  state.stamps.set(event, received);
  const clock = state.clock;
  if (
    received.time > clock.time ||
    (received.time === clock.time && received.counter > clock.counter)
  ) {
    clock.time = received.time;
    clock.counter = received.counter;
  }
}
