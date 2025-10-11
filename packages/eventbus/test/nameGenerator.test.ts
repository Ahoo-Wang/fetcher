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
import { DefaultNameGenerator, nameGenerator } from '../src';

describe('DefaultNameGenerator', () => {
  it('should generate names with prefix and incrementing counter', () => {
    const generator = new DefaultNameGenerator();
    expect(generator.generate('test')).toBe('test_1');
    expect(generator.generate('test')).toBe('test_2');
    expect(generator.generate('other')).toBe('other_3');
  });

  it('should maintain separate counters for different instances', () => {
    const gen1 = new DefaultNameGenerator();
    const gen2 = new DefaultNameGenerator();
    expect(gen1.generate('prefix')).toBe('prefix_1');
    expect(gen2.generate('prefix')).toBe('prefix_1');
    expect(gen1.generate('prefix')).toBe('prefix_2');
  });
});

describe('nameGenerator instance', () => {
  it('should be a DefaultNameGenerator instance', () => {
    expect(nameGenerator).toBeInstanceOf(DefaultNameGenerator);
  });

  it('should generate names using the exported instance', () => {
    expect(nameGenerator.generate('global')).toBe('global_1');
    expect(nameGenerator.generate('global')).toBe('global_2');
  });
});
