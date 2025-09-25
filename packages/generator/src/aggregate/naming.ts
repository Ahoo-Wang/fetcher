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

import { AggregateDefinition, TagAliasAggregate } from '@/aggregate/aggregate.ts';
import { Tag } from '@ahoo-wang/fetcher-openapi';
import { PartialBy } from '@ahoo-wang/fetcher';

export function isAliasAggregate(tagName: string): [string, string] | null {
  const parts = tagName.split('.');
  if (parts.length != 2) {
    return null;
  }
  return parts as [string, string];
}

export function tagToAggregate(tag: Tag): TagAliasAggregate | null {
  const parts = isAliasAggregate(tag.name);
  if (!parts) {
    return null;
  }

  return {
    tag,
    contextAlias: parts[0],
    aggregateName: parts[1],
  };
}

export function tagsToAggregates(tags?: Tag[]): Map<string, PartialBy<AggregateDefinition, 'state' | 'fields'>> {
  const tagAliasAggregates = tags?.map(tag => tagToAggregate(tag))
    .filter(tag => tag !== null);
  if (!tagAliasAggregates) {
    return new Map();
  }
  const aggregates = new Map<string, PartialBy<AggregateDefinition, 'state' | 'fields'>>();
  tagAliasAggregates.forEach(tagAliasAggregate => {
    aggregates.set(tagAliasAggregate.tag.name, {
      aggregate: tagAliasAggregate,
      commands: new Map(),
      events: new Map(),
    });
  });
  return aggregates;
}

export function operationIdToCommandName(operationId?: string): string | null {
  if (!operationId) {
    return null;
  }
  const parts = operationId.split('.');
  if (parts.length != 3) {
    return null;
  }
  return parts[2];
}