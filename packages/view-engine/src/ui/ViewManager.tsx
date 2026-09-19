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

import { useState } from 'react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  PencilIcon,
  StarIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import {
  audienceOf,
  isSystemScope,
  type ViewAudience,
  type ViewInstanceSummary,
} from '../model/index.js';
import type { WriteState } from '../runtime/index.js';
import {
  PREFERENCES_KEY,
  type ViewListState,
  type ViewManagerController,
} from '../react/index.js';
import { Badge } from './components/badge.js';
import { Button } from './components/button.js';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './components/dialog.js';
import { Input } from './components/input.js';
import { KIND_ICON } from './kinds.js';
import { useViewMessages } from './MessagesProvider.js';
import { DialogContent } from './popups.js';

export interface ViewManagerProps {
  manager: ViewManagerController;
  list: ViewListState;
  open: boolean;
  onOpenChange(open: boolean): void;
  /**
   * The open view, when it has edits that were never saved. Deleting that one
   * takes them with it, which is worth saying in the confirmation and cannot
   * be worked out from the list.
   */
  openDirtyId?: string | null;
}

/** The order the manager shows the two groups in, as the sidebar does. */
const GROUPS: readonly ViewAudience[] = ['personal', 'shared'];

/**
 * Managing the views rather than looking at one: rename, delete, reorder and
 * choose which one opens first.
 *
 * It is a dialog rather than a mode of the sidebar because none of it is
 * navigation — every button here writes. Each one exists only where it is
 * permitted: a row the user may not rename has no rename button, not a
 * greyed one, so what the list offers is exactly what the store will take.
 */
export function ViewManager({
  manager,
  list,
  open,
  onOpenChange,
  openDirtyId = null,
}: ViewManagerProps) {
  const messages = useViewMessages();
  const preferences = manager.outcomes.get(PREFERENCES_KEY);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{messages.label('label.manage.heading')}</DialogTitle>
          <DialogDescription>
            {messages.label('label.manage.description')}
          </DialogDescription>
        </DialogHeader>

        {/* The order and the default are one record, so their outcome belongs
            to the list rather than to any row that moved. */}
        {preferences && (
          <OutcomeLine
            state={preferences}
            manager={manager}
            list={list}
            outcomeKey={PREFERENCES_KEY}
          />
        )}

        <div data-slot="view-manager" className="flex flex-col gap-3">
          {GROUPS.map(audience => {
            const items = list.items.filter(
              item => audienceOf(item.scope) === audience,
            );
            return items.length === 0 ? null : (
              <div key={audience} className="flex flex-col gap-1">
                <span className="text-muted-foreground px-1 text-xs">
                  {messages.label(`label.scope.group.${audience}`)}
                </span>
                {items.map(item => (
                  <ManagedRow
                    key={item.id}
                    item={item}
                    manager={manager}
                    list={list}
                    openDirtyId={openDirtyId}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ManagedRow({
  item,
  manager,
  list,
  openDirtyId,
}: {
  item: ViewInstanceSummary;
  manager: ViewManagerController;
  list: ViewListState;
  openDirtyId: string | null;
}) {
  const messages = useViewMessages();
  const [renaming, setRenaming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const Kind = KIND_ICON[item.kind];
  const can = manager.can.instance(item.id);
  const outcome = manager.outcomes.get(item.id);
  const busy = manager.pending !== null;
  // Reordering acts on the whole stored order, not on the group the row is
  // drawn in, so the ends that have nowhere to go are the list's own ends.
  const index = list.items.findIndex(other => other.id === item.id);
  const isDefault = list.preferences?.defaultInstanceId === item.id;

  return (
    <div data-slot="view-manager-row" className="flex flex-col gap-1">
      <div className="flex min-w-0 items-center gap-2">
        <Kind className="text-muted-foreground size-4 shrink-0" aria-hidden />

        {renaming === null ? (
          <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
        ) : (
          <Input
            className="h-7 min-w-0 flex-1"
            aria-label={messages.label('label.save.title')}
            value={renaming}
            autoFocus
            onChange={event => setRenaming(event.target.value)}
          />
        )}

        {isSystemScope(item.scope) && (
          <Badge variant="secondary" className="shrink-0">
            {messages.label('label.scope.tag.system')}
          </Badge>
        )}
        {isDefault && (
          <Badge variant="outline" className="shrink-0">
            {messages.label('label.manage.default')}
          </Badge>
        )}

        <div className="flex shrink-0 items-center gap-0.5">
          {renaming !== null ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={messages.label('label.manage.rename-confirm')}
                disabled={busy || renaming.trim().length === 0}
                onClick={() => {
                  void manager.rename(item.id, renaming.trim());
                  setRenaming(null);
                }}
              >
                <CheckIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={messages.label('label.manage.rename-cancel')}
                onClick={() => setRenaming(null)}
              >
                <XIcon />
              </Button>
            </>
          ) : (
            <>
              {manager.can.reorder && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={messages.label('label.manage.move-up')}
                    disabled={busy || index <= 0}
                    onClick={() => void manager.move(item.id, 'up')}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={messages.label('label.manage.move-down')}
                    disabled={busy || index >= list.items.length - 1}
                    onClick={() => void manager.move(item.id, 'down')}
                  >
                    <ArrowDownIcon />
                  </Button>
                </>
              )}
              {manager.can.setDefault && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={messages.label(
                    isDefault
                      ? 'label.manage.unset-default'
                      : 'label.manage.set-default',
                  )}
                  disabled={busy}
                  onClick={() =>
                    void manager.setDefault(isDefault ? null : item.id)
                  }
                >
                  <StarIcon data-default={isDefault || undefined} />
                </Button>
              )}
              {can.rename && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={messages.label('label.manage.rename')}
                  disabled={busy}
                  onClick={() => setRenaming(item.title)}
                >
                  <PencilIcon />
                </Button>
              )}
              {can.delete && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={messages.label('label.manage.delete')}
                  disabled={busy}
                  onClick={() => setDeleting(true)}
                >
                  <TrashIcon />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {outcome && (
        <OutcomeLine
          state={outcome}
          manager={manager}
          list={list}
          outcomeKey={item.id}
        />
      )}

      <DeleteDialog
        open={deleting}
        onOpenChange={setDeleting}
        item={item}
        dirty={openDirtyId === item.id}
        onConfirm={() => {
          void manager.delete(item.id);
          setDeleting(false);
        }}
      />
    </div>
  );
}

/**
 * What a write that no open view owns came to, under the row that started it.
 *
 * Reloading a preference conflict does not replay the intent (design §7.3):
 * the list comes back at the stored revision and the user presses again, so
 * the line stays until they do something with it.
 */
function OutcomeLine({
  state,
  manager,
  list,
  outcomeKey,
}: {
  state: WriteState;
  manager: ViewManagerController;
  list: ViewListState;
  outcomeKey: string;
}) {
  const messages = useViewMessages();

  if (state.kind === 'conflict')
    return (
      <p
        role="alert"
        className="text-destructive flex flex-wrap items-center gap-2 text-xs"
      >
        <span className="min-w-0 flex-1">
          {messages.label('label.write.conflict')}
        </span>
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            void manager.resolveConflict(outcomeKey, 'reload');
            list.reload();
          }}
        >
          {messages.label('label.manage.reload')}
        </Button>
        <Button
          size="xs"
          onClick={() => void manager.resolveConflict(outcomeKey, 'overwrite')}
        >
          {messages.label('label.conflict.mine')}
        </Button>
      </p>
    );

  if (state.kind === 'unknown')
    return (
      <p
        role="status"
        className="text-warning flex flex-wrap items-center gap-2 text-xs"
      >
        <span className="min-w-0 flex-1">
          {messages.label('label.write.unknown')}
        </span>
        <Button size="xs" onClick={() => void manager.retry(outcomeKey)}>
          {messages.label('label.unknown.retry')}
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={() => manager.abandon(outcomeKey)}
        >
          {messages.label('label.unknown.leave')}
        </Button>
      </p>
    );

  return (
    <p role="alert" className="text-destructive text-xs">
      {messages.issue(state.issue)}
    </p>
  );
}

/**
 * Deleting says what it costs, and only what it costs: the base sentence
 * always, and the two that depend on this view only when they apply.
 */
function DeleteDialog({
  open,
  onOpenChange,
  item,
  dirty,
  onConfirm,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  item: ViewInstanceSummary;
  /** True when this is the open view and it has unsaved edits. */
  dirty: boolean;
  onConfirm(): void;
}) {
  const messages = useViewMessages();
  const consequences = [messages.label('label.delete.consequence')];
  if (audienceOf(item.scope) === 'shared')
    consequences.push(messages.label('label.delete.shared-consequence'));
  if (dirty)
    consequences.push(messages.label('label.delete.dirty-consequence'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.label('label.delete.confirm')}</DialogTitle>
          <DialogDescription>{consequences.join(' ')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {messages.label('label.delete.keep')}
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm}>
            {messages.label('label.manage.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
