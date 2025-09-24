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


import { Operation, Schema } from '@ahoo-wang/fetcher-openapi';
import { HttpMethod } from '@ahoo-wang/fetcher';
import { NamedAggregate, type NamedBoundedContext } from '@ahoo-wang/fetcher-wow';

export interface CommandDefinition {
  path: string;
  method: HttpMethod;
  operation: Operation;
}

export interface AggregateDefinition {
  aggregate: NamedAggregate;
  /**
   * State Aggregate Root Schema
   */
  state: Schema;
  /**
   * state aggregate fields for query
   */
  fields: Schema;
  /**
   * command name -> command definition
   */
  commands: Map<string, CommandDefinition>;
  /**
   * event type name -> event schema
   */
  events: Map<string, Schema>;
}

export interface BoundedContextDefinition extends NamedBoundedContext {
  contextAlias: string;
  /**
   * aggregate name -> aggregate definition
   */
  aggregates: Map<string, AggregateDefinition>;
}