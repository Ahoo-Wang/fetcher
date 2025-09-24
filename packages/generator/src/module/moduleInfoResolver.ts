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

import { ModuleInfo } from '@/module/moduleDefinition.ts';

export class ModuleInfoResolver {
  resolve(key: string): ModuleInfo {
    if (key === '') {
      throw new Error('Module key name cannot be empty');
    }
    const parts = key.split('.');
    let moduleName = '';
    let modulePath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const firstChar = part[0];

      if (
        firstChar === firstChar.toUpperCase() &&
        firstChar !== firstChar.toLowerCase()
      ) {
        // Found the type name (starts with uppercase)
        moduleName = part;
        break;
      }

      // Build path with leading slash
      if (modulePath === '') {
        modulePath = part;
      } else {
        modulePath = modulePath + '/' + part;
      }
    }

    // If no uppercase part found, use the last part as module name
    if (moduleName === '') {
      moduleName = parts[parts.length - 1];
    }

    return {
      name: moduleName,
      path: modulePath,
    };
  }
}
