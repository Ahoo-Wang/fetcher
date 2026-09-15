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

import type { RefObject } from 'react';
import type { ViewEngine } from '../engine/ViewEngine.js';
import type { ExecuteViewManagerAction } from './useViewManagerAction.js';
import { ViewManagerRow } from './ViewManagerRow.js';
import { groupViewInstances, type InstanceGroup } from './ViewNavigation.js';
import { useViewCapabilities } from './useViewCapabilities.js';
import { ListOrder } from '../lib/ListOrder.js';

export function ViewManagerGroup({
  engine,
  group,
  busy,
  busyRef,
  execute,
  fallbackFocus,
  onDelete,
}: {
  engine: ViewEngine;
  group: InstanceGroup;
  busy: boolean;
  busyRef: RefObject<boolean>;
  execute: ExecuteViewManagerAction;
  fallbackFocus: RefObject<HTMLElement | null>;
  onDelete(id: string, trigger: HTMLButtonElement): void;
}) {
  const capabilities = useViewCapabilities(engine);
  const items = group.entries.map(entry => ({ id: entry.id, entry }));
  return (
    <section aria-label={group.label}>
      <h3 className="fve:mb-2 fve:text-xs fve:font-medium fve:text-muted-foreground">
        {group.label}
      </h3>
      <ListOrder
        items={items}
        owner={engine}
        disabled={busy || !capabilities.reorder}
        titleOf={item => item.entry.summary.title}
        onChange={async next => {
          if (busyRef.current || !engine.canReorderInstances()) return false;
          const state = engine.getSnapshot();
          const current =
            groupViewInstances(state).find(item => item.id === group.id)
              ?.entries ?? [];
          if (
            current.length !== items.length ||
            current.some((entry, i) => entry.id !== items[i].id)
          )
            return false;
          // Only this group's slots move; other groups keep their positions in the catalog.
          let succeeded = false;
          await execute(
            () =>
              engine.reorderInstances(
                next.map(item => item.id),
                items.map(item => item.id),
              ),
            () => {
              succeeded = true;
            },
          );
          return succeeded;
        }}
      >
        <ol
          aria-label={`${group.label}顺序`}
          className="fve:m-0 fve:flex fve:list-none fve:flex-col fve:gap-2 fve:p-1"
        >
          {group.entries.map(entry => (
            <ViewManagerRow
              key={entry.id}
              engine={engine}
              entry={entry}
              busy={busy}
              execute={execute}
              fallbackFocus={fallbackFocus}
              onDelete={trigger => onDelete(entry.id, trigger)}
            />
          ))}
        </ol>
      </ListOrder>
    </section>
  );
}
