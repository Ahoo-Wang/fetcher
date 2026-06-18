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

import { act } from '@testing-library/react';

/**
 * Wait for all pending microtasks (settled promises, async state updates)
 * to flush. Many React hook tests need this between act() and assertions.
 * Centralized here to avoid repeating the same `await new Promise(r =>
 * setTimeout(r, 0))` boilerplate across 35+ test files.
 */
export function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Run a callback inside act() and then flush microtasks. Common pattern for
 * "trigger async action, then assert settled state".
 */
export async function actAndFlush(fn: () => void): Promise<void> {
  await act(async () => {
    fn();
    await flushMicrotasks();
  });
}
