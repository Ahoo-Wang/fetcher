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


import { HTTPMethod, Operation, Reference, Tag } from '@ahoo-wang/fetcher-openapi';
import { AliasAggregate, Named } from '@ahoo-wang/fetcher-wow';

export interface CommandDefinition extends Named {
  /**
   * command name
   */
  name: string;
  /**
   * command endpoint path
   */
  path: string;
  /**
   * command http method
   */
  method: HTTPMethod;
  operation: Operation;
}

export interface EventDefinition extends Named {
  /**
   * event name
   */
  name: string;
  /**
   * event title
   */
  title: string;

  schema: Reference;
}

export interface TagAliasAggregate extends AliasAggregate {
  tag: Tag;
}


export interface AggregateDefinition {
  aggregate: TagAliasAggregate;
  /**
   * State Aggregate Root Schema
   */
  state: Reference;
  /**
   * state aggregate fields for query
   */
  fields: Reference;
  /**
   * command name -> command definition
   */
  commands: Map<string, CommandDefinition>;
  /**
   * event name -> event schema
   */
  events: Map<string, EventDefinition>;
}