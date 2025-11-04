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

import { describe, expect, it } from 'vitest';
import { NamedCapable, RemoveReadonlyFields } from '../src';

describe('types.ts', () => {
  it('should define NamedCapable interface', () => {
    // This is a type-only interface, so we just verify it compiles
    const namedObject: NamedCapable = {
      name: 'test-name',
    };
    expect(namedObject.name).toBe('test-name');
  });

  it('should extend Response interface with typed json method', async () => {
    // Create a mock response to test the extended interface
    const mockResponse = new Response(JSON.stringify({ test: 'value' }));

    // The json<T>() method should be available on the Response object
    // This test verifies that the global declaration is properly recognized
    const result = await mockResponse.json<{ test: string }>();
    expect(result.test).toBe('value');
  });

  it('should remove readonly fields from type', () => {
    interface TestType {
      readonly id: number;
      name: string;
      readonly createdAt: Date;
      email: string;
    }

    type MutableType = RemoveReadonlyFields<TestType>;

    const mutable: MutableType = { name: 'test', email: 'test@example.com' };
    expect(mutable.name).toBe('test');
    expect(mutable.email).toBe('test@example.com');
    expect(Object.keys(mutable)).toEqual(['name', 'email']);
  });
});
