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
 * Interface for generating unique names with a prefix
 */
export interface NameGenerator {
  generate(prefix: string): string;
}

/**
 * Default implementation of NameGenerator that generates names with incrementing counters
 */
export class DefaultNameGenerator implements NameGenerator {
  private namingCounter: number = 0;

  /**
   * Generates a unique name by appending an incrementing counter to the prefix
   * @param prefix - The prefix for the generated name
   * @returns The generated unique name
   */
  generate(prefix: string): string {
    this.namingCounter++;
    return `${prefix}_${this.namingCounter}`;
  }
}

/**
 * Default instance of NameGenerator
 */
export const nameGenerator = new DefaultNameGenerator();
