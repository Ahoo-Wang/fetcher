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

import { Named } from '@ahoo-wang/fetcher-wow';

/**
 * Data Model Info
 */
export interface ModelInfo extends Named {
  name: string;
  path: string;
}

/**
 * Resolves model information from a schema key.
 *
 * This function parses a dot-separated schema key and extracts the model name and path.
 * It assumes that the model name is the first part that starts with an uppercase letter.
 * All parts before the model name are treated as the path.
 * 
 * @example
 *
 * - "wow.api.BindingError" -> {path:'/wow/api',name:'BindingError'}
 * - "compensation.ApiVersion" -> {path:'/compensation',name:'ApiVersion'}
 * - "ai.AiMessage.Assistant" -> {path:'/ai',name:'AiMessageAssistant'}
 * - "Result" -> {path:'/',name:'Result'}
 *
 * @param schemaKey - The dot-separated schema key (e.g., "com.example.User")
 * @returns ModelInfo object containing the parsed name and path
 */
export function resolveModelInfo(schemaKey: string): ModelInfo {
  if (!schemaKey) {
    return { name: '', path: '/' };
  }
  
  const parts = schemaKey.split('.');
  let name = '';
  const pathParts: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const firstChar = part[0];

    if (
      firstChar === firstChar.toUpperCase() &&
      firstChar !== firstChar.toLowerCase()
    ) {
      // Found the type name (starts with uppercase)
      name = part;
      break;
    }

    // Collect path parts
    pathParts.push(part);
  }

  // If no uppercase part found, use the last part as module name
  if (name === '') {
    name = parts[parts.length - 1];
  }

  // Build path with leading slash
  const path = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';

  return {
    name: name,
    path: path,
  };
}

/**
 * Converts a string to PascalCase format.
 *
 * This function takes a string and converts it to PascalCase by:
 * 1. Splitting on common separators (_, -, ., or whitespace)
 * 2. Capitalizing the first letter of each part
 * 3. Joining all parts together
 *
 * @param name - The string to convert to PascalCase
 * @returns The PascalCase formatted string
 */
export function pascalCase(name: string): string {
  if (!name) {
    return '';
  }

  return name
    .split(/[-_\s.]+/) // Split on hyphens, underscores, periods, or whitespace
    .map(part => {
      if (part.length === 0) return '';
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join('');
}
