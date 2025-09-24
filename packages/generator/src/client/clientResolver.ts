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

import { Paths, Operation, HTTPMethod, Schema } from '@ahoo-wang/fetcher-openapi';
import { ClientDefinition, EndpointDefinition } from '@/client/clientDefinition.ts';
import { ModelResolver } from '@/model/modelResolver.ts';
import { isReference } from '@/utils.ts';

export class ClientResolver {
  constructor(private readonly modelResolver: ModelResolver) {
  }

  resolve(paths: Paths): ClientDefinition[] {
    const clientsByTag = new Map<string, ClientDefinition>();

    for (const [path, pathItem] of Object.entries(paths)) {
      const operations: Array<{ method: HTTPMethod; operation: Operation }> = [
        { method: 'get', operation: pathItem.get },
        { method: 'put', operation: pathItem.put },
        { method: 'post', operation: pathItem.post },
        { method: 'delete', operation: pathItem.delete },
        { method: 'options', operation: pathItem.options },
        { method: 'head', operation: pathItem.head },
        { method: 'patch', operation: pathItem.patch },
        { method: 'trace', operation: pathItem.trace },
      ].filter(({ operation }) => operation !== undefined) as Array<{ method: HTTPMethod; operation: Operation }>;

      for (const { method, operation } of operations) {
        if (!operation.tags || operation.tags.length === 0) {
          continue;
        }

        const primaryTag = operation.tags[0];
        const operationId = operation.operationId;

        if (!operationId) {
          continue;
        }

        // Extract method name from operationId (remove tag prefix and sanitize)
        let methodName = operationId;
        if (operationId.startsWith(`${primaryTag}.`)) {
          methodName = operationId.substring(primaryTag.length + 1);
        }
        // Sanitize method name (replace dots and other invalid characters)
        methodName = methodName.replace(/[^a-zA-Z0-9_$]/g, '_');

        // Get or create client for this tag
        let client = clientsByTag.get(primaryTag);
        if (!client) {
          client = {
            name: this.tagToClientName(primaryTag),
            tag: primaryTag,
            endpoints: [],
          };
          clientsByTag.set(primaryTag, client);
        }

        // Create endpoint definition
        const endpoint: EndpointDefinition = {
          name: methodName,
          method,
          path,
          summary: operation.summary,
          description: operation.description,
          dependencies: [],
        };

        // Handle request body
        if (operation.requestBody && typeof operation.requestBody === 'object' && 'content' in operation.requestBody) {
          const content = operation.requestBody.content;
          if (content && content['application/json']?.schema) {
            const schema = content['application/json'].schema;
            if (!isReference(schema)) {
              const model = this.modelResolver.resolve(`${primaryTag}.${methodName}Request`, schema as Schema);
              endpoint.requestBody = model;
              endpoint.dependencies.push(...model.dependencies);
            }
          }
        }

        // Handle response (use 200 response as default)
        if (operation.responses && operation.responses['200'] && typeof operation.responses['200'] === 'object' && 'content' in operation.responses['200']) {
          const response = operation.responses['200'];
          const content = response.content;
          if (content && content['application/json']?.schema) {
            const schema = content['application/json'].schema;
            if (!isReference(schema)) {
              const model = this.modelResolver.resolve(`${primaryTag}.${methodName}Response`, schema as Schema);
              endpoint.response = model;
              endpoint.dependencies.push(...model.dependencies);
            }
          }
        }

        client.endpoints.push(endpoint);
      }
    }

    return Array.from(clientsByTag.values());
  }

  private tagToClientName(tag: string): string {
    // Convert tag like "example.cart" to "CartClient"
    const parts = tag.split('.');
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1) + 'Client';
  }
}