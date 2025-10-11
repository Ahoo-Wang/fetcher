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

import { describe, it, expect } from 'vitest';
import { isBrowser } from '../src';

describe('env', () => {
  it('should export isBrowser as true in browser environment', () => {
    // Mock window object to simulate browser environment
    const originalWindow = global.window;
    global.window = {} as any;
    expect(isBrowser()).toBe(true);
    // Restore original window
    global.window = originalWindow;
  });

  it('should have isBrowser as false in Node.js environment', () => {
    // In Node.js environment, window is undefined
    expect(isBrowser()).toBe(false);
  });
});
