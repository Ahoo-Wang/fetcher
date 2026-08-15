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

// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

// Regression test: this module registers a beforeunload handler at module
// scope. That side effect must be guarded so importing the package in a
// Node/SSR environment (no window global) does not throw ReferenceError.
describe('notificationCenter SSR import', () => {
  it('should import without window defined', async () => {
    expect(typeof window).toBe('undefined');

    class MockBroadcastChannel {
      postMessage(): void {}
      close(): void {}
      onmessage = null;
      constructor(_name: string) {}
    }
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);

    const module = await import('../../src/notification/notificationCenter');

    expect(module.notificationCenter).toBeDefined();
    expect(module.NotificationCenter).toBeDefined();
  });
});
