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

import { OpenAPI, Operation, Reference, RequestBody, Schema } from '@ahoo-wang/fetcher-openapi';
import { AggregateDefinition, EventDefinition } from './aggregate.ts';
import { operationIdToCommandName, tagsToAggregates } from '@/aggregate/naming.ts';
import { isReference } from '@/utils.ts';
import { ContentTypeValues, PartialBy } from '@ahoo-wang/fetcher';
import {
  extractOkResponse, extractOperationOkResponseJsonSchema,
  extractOperations,
  MethodOperation,
} from '@/aggregate/operationExtractor.ts';
import { extractRequestBody, extractSchema } from '@/aggregate/referenceExtractor.ts';
import { EventStreamSchema } from '@/aggregate/types.ts';


const CommandOkResponseRef = '#/components/responses/wow.CommandOk';

export class AggregateResolver {
  private readonly aggregates: Map<string, PartialBy<AggregateDefinition, 'state' | 'fields'>>;

  constructor(private readonly openAPI: OpenAPI) {
    this.aggregates = tagsToAggregates(openAPI.tags);
    this.build();
  }

  private build() {
    for (const [path, pathItem] of Object.entries(this.openAPI.paths)) {
      const methodOperations = extractOperations(pathItem);
      for (const methodOperation of methodOperations) {
        this.commands(path, methodOperation);
        this.state(methodOperation.operation);
        this.events(methodOperation.operation);
        this.fields(methodOperation.operation);
      }
    }
  }

  resolve() {
    return this.aggregates as Map<string, AggregateDefinition>;
  }

  commands(path: string, methodOperation: MethodOperation) {
    const commandName = operationIdToCommandName(methodOperation.operation.operationId);
    if (!commandName) {
      return;
    }
    const okResponse = extractOkResponse(methodOperation.operation);
    if (!okResponse) {
      return;
    }
    if (!isReference(okResponse)) {
      return;
    }
    if (okResponse.$ref !== CommandOkResponseRef) {
      return;
    }
    methodOperation.operation.tags?.forEach((tag) => {
      const aggregate = this.aggregates.get(tag);
      if (!aggregate) {
        return;
      }
      aggregate.commands.set(commandName, {
        name: commandName,
        path,
        method: methodOperation.method,
        operation: methodOperation.operation,
      });
    });
  }

  state(operation: Operation) {
    if (!operation.operationId?.endsWith('.snapshot_state.single')) {
      return;
    }
    const state = extractOperationOkResponseJsonSchema(operation);
    if (!isReference(state)) {
      return;
    }
    operation.tags?.forEach((tag) => {
      const aggregate = this.aggregates.get(tag);
      if (!aggregate) {
        return;
      }
      aggregate.state = state;
    });
  }

  events(operation: Operation) {
    if (!this.openAPI.components) {
      return;
    }
    if (!operation.operationId?.endsWith('.event.list_query')) {
      return;
    }
    const eventStreamArraySchema = extractOperationOkResponseJsonSchema(operation);
    if (isReference(eventStreamArraySchema)) {
      return;
    }
    const eventStreamRefSchema = eventStreamArraySchema?.items;
    if (!isReference(eventStreamRefSchema)) {
      return;
    }
    const eventStreamSchema = extractSchema(eventStreamRefSchema, this.openAPI.components) as EventStreamSchema;

    const events: EventDefinition[] = eventStreamSchema.properties.body.items.anyOf.map((domainEventSchema) => {
      const eventTitle = domainEventSchema.title;
      const eventName = domainEventSchema.properties.name.const;
      const eventBodySchema = domainEventSchema.properties.body;
      return {
        title: eventTitle,
        name: eventName,
        schema: eventBodySchema,
      };
    });

    operation.tags?.forEach((tag) => {
      const aggregate = this.aggregates.get(tag);
      if (!aggregate) {
        return;
      }
      events.forEach((event) => {
        aggregate.events.set(event.name, event);
      });
    });
  }

  fields(operation: Operation): void {
    if (!this.openAPI.components) {
      return;
    }
    if (!operation.operationId?.endsWith('.snapshot.count')) {
      return;
    }
    const requestBody = extractRequestBody(operation.requestBody as Reference, this.openAPI.components) as RequestBody;
    const conditionRefSchema = requestBody.content[ContentTypeValues.APPLICATION_JSON].schema as Reference;
    const conditionSchema = extractSchema(conditionRefSchema, this.openAPI.components) as Schema;
    const fieldRefSchema = conditionSchema.properties?.field as Reference;
    operation.tags?.forEach((tag) => {
      const aggregate = this.aggregates.get(tag);
      if (!aggregate) {
        return;
      }
      aggregate.fields = fieldRefSchema;
    });
  }
}







