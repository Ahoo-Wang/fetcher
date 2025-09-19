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

import { Logger } from '../../utils/logger';
import { OpenAPI } from '@ahoo-wang/fetcher-openapi';

export class ReferenceResolver {
  static resolveRef(openApi: OpenAPI, ref: string): any {
    if (!ref.startsWith('#/')) {
      Logger.warn(`External references not supported: ${ref}`);
      return null;
    }

    const path = ref.substring(2).split('/');
    let current: any = openApi;

    for (const part of path) {
      if (current && current[part] !== undefined) {
        current = current[part];
      } else {
        Logger.warn(`Reference not found: ${ref}`);
        return null;
      }
    }

    return current;
  }

  static resolveSchema(openApi: OpenAPI, schema: any): any {
    if (!schema) return schema;

    if (schema.$ref) {
      return this.resolveRef(openApi, schema.$ref);
    }

    if (schema.properties) {
      const resolvedProperties: Record<string, any> = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        resolvedProperties[key] = this.resolveSchema(openApi, value);
      }
      return { ...schema, properties: resolvedProperties };
    }

    if (schema.items) {
      return { ...schema, items: this.resolveSchema(openApi, schema.items) };
    }

    if (schema.allOf) {
      return { ...schema, allOf: schema.allOf.map((s: any) => this.resolveSchema(openApi, s)) };
    }

    if (schema.anyOf) {
      return { ...schema, anyOf: schema.anyOf.map((s: any) => this.resolveSchema(openApi, s)) };
    }

    if (schema.oneOf) {
      return { ...schema, oneOf: schema.oneOf.map((s: any) => this.resolveSchema(openApi, s)) };
    }

    return schema;
  }
}