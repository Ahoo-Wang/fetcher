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

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import {
  CheckIcon,
  PencilIcon,
  XIcon,
  GripVerticalIcon,
  Trash2Icon,
} from 'lucide-react';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.js';
import { cn } from '../lib/utils.js';
import type { ViewEngine } from './ViewEngine.js';
import type { RecordSession } from './recordModel.js';

type InstanceGroup = {
  id: 'personal' | 'public';
  label: string;
  sessions: RecordSession[];
};

/** Manages instance metadata and this user's ordering without submitting record-view drafts. */
export function ViewManager({
  engine,
  groups,
  open,
  onOpenChange,
  finalFocus,
}: {
  engine: ViewEngine;
  groups: InstanceGroup[];
  open: boolean;
  onOpenChange(open: boolean): void;
  finalFocus(): HTMLElement | null;
}) {
  const [names, setNames] = useState(() => new Map<string, string>());
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [dragged, setDragged] = useState<{ id: string; group: string } | null>(
    null,
  );
  const [drop, setDrop] = useState<{ group: string; boundary: number } | null>(
    null,
  );
  const [announcement, setAnnouncement] = useState('');
  const instructions = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  const dragFocus = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const nameInputs = useRef(new Map<string, HTMLInputElement>());
  const editButtons = useRef(new Map<string, HTMLButtonElement>());
  const nameFocus = useRef<{ id: string; editing: boolean } | null>(null);
  const target = groups
    .flatMap(group => group.sessions)
    .find(session => session.instance.id === confirmId);
  useLayoutEffect(() => {
    if (!busy && nameFocus.current) {
      const { id, editing } = nameFocus.current;
      const element = editing
        ? nameInputs.current.get(id)
        : editButtons.current.get(id);
      (element ?? titleRef.current)?.focus();
      if (editing && element instanceof HTMLInputElement) element.select();
      nameFocus.current = null;
    } else if (!busy && restoreFocus.current) {
      (restoreFocus.current.isConnected
        ? restoreFocus.current
        : titleRef.current
      )?.focus();
      restoreFocus.current = null;
    }
  }, [busy, groups, names]);

  async function execute(action: () => Promise<void>, after?: () => void) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
      after?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : '操作失败，请重试');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function clearName(id: string) {
    setNames(current => {
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  }
  function finishName(id: string) {
    nameFocus.current = { id, editing: false };
    clearName(id);
  }
  function rename(session: RecordSession) {
    const id = session.instance.id;
    if (busyRef.current) return;
    nameFocus.current = { id, editing: true };
    void execute(
      () => engine.renameInstance(names.get(id) ?? session.baseline.title, id),
      () => finishName(id),
    );
  }
  function endDrag() {
    setDragged(null);
    setDrop(null);
  }
  function resolveDrop(
    event: DragEvent<HTMLOListElement>,
    group: InstanceGroup,
  ) {
    if (
      busyRef.current ||
      !engine.canReorderInstances() ||
      dragged?.group !== group.id
    )
      return null;
    const source = group.sessions.findIndex(
      session => session.instance.id === dragged.id,
    );
    if (source < 0) return null;
    const bounds = Array.from(event.currentTarget.children, row =>
      row.getBoundingClientRect(),
    );
    const before = bounds.findIndex(
      row => event.clientY < row.top + row.height / 2,
    );
    const boundary = before < 0 ? bounds.length : before;
    return {
      source,
      boundary,
      target: boundary > source ? boundary - 1 : boundary,
    };
  }
  function move(
    group: InstanceGroup,
    source: number,
    target: number,
    focus: HTMLButtonElement | null,
  ) {
    if (
      busyRef.current ||
      !engine.canReorderInstances() ||
      source === target ||
      !group.sessions[source] ||
      !group.sessions[target]
    )
      return;
    const ids = [...engine.getSnapshot().instanceIds];
    const from = ids.indexOf(group.sessions[source].instance.id);
    const to = ids.indexOf(group.sessions[target].instance.id);
    if (from < 0 || to < 0) return;
    const [id] = ids.splice(from, 1);
    ids.splice(to, 0, id);
    restoreFocus.current = focus;
    void execute(
      () => engine.reorderInstances(ids),
      () => setAnnouncement(`已移至${group.label}第 ${target + 1} 项`),
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (busyRef.current) return;
        onOpenChange(next);
        if (!next) {
          nameFocus.current = null;
          setNames(new Map());
          setConfirmId(null);
          setError(null);
          endDrag();
        }
      }}
    >
      <DialogContent
        className="fve:sm:max-w-xl"
        initialFocus={titleRef}
        finalFocus={finalFocus}
        showCloseButton={!busy}
      >
        <DialogHeader>
          <DialogTitle ref={titleRef} tabIndex={-1}>
            管理视图
          </DialogTitle>
          <DialogDescription>
            点击编辑图标修改名称；拖动手柄调整组内顺序，排序仅对你生效。
          </DialogDescription>
        </DialogHeader>
        <p id={instructions} className="fve:sr-only">
          拖动调整顺序，或聚焦手柄后按上、下方向键移动。
        </p>
        <span role="status" aria-live="polite" className="fve:sr-only">
          {busy ? '正在保存…' : announcement}
        </span>
        {error && !target && (
          <p role="alert" className="fve:text-sm fve:text-destructive">
            {error}
          </p>
        )}
        <div className="fve:flex fve:max-h-[60vh] fve:flex-col fve:gap-4 fve:overflow-y-auto">
          {!groups.length && (
            <p className="fve:text-sm fve:text-muted-foreground">暂无视图</p>
          )}
          {groups.map(group => (
            <section key={group.id} aria-label={group.label}>
              <h3 className="fve:mb-2 fve:text-xs fve:font-medium fve:text-muted-foreground">
                {group.label}
              </h3>
              <ol
                aria-label={`${group.label}顺序`}
                className="fve:m-0 fve:flex fve:list-none fve:flex-col fve:gap-2 fve:p-1"
                onDragOver={event => {
                  const next = resolveDrop(event, group);
                  setDrop(
                    next && next.source !== next.target
                      ? { group: group.id, boundary: next.boundary }
                      : null,
                  );
                  event.dataTransfer.dropEffect = next ? 'move' : 'none';
                  if (next) event.preventDefault();
                }}
                onDragLeave={event => {
                  if (
                    !(event.relatedTarget instanceof Node) ||
                    !event.currentTarget.contains(event.relatedTarget)
                  )
                    setDrop(null);
                }}
                onDrop={event => {
                  const next = resolveDrop(event, group);
                  if (next) {
                    event.preventDefault();
                    move(group, next.source, next.target, dragFocus.current);
                  }
                  endDrag();
                }}
              >
                {group.sessions.map((session, index) => {
                  const { id, scope } = session.instance;
                  const title = session.baseline.title;
                  const permissions = engine.getPermissions(id);
                  const system =
                    scope.type === 'public' && scope.source === 'system';
                  const writing =
                    busy ||
                    session.writeStatus !== 'idle' ||
                    session.requiresReload;
                  const movable =
                    !busy &&
                    engine.canReorderInstances() &&
                    group.sessions.length > 1;
                  const name = names.get(id) ?? title;
                  const changed = name.trim() !== title;
                  return (
                    <li
                      key={id}
                      aria-label={title}
                      className="fve:relative fve:flex fve:min-h-9 fve:items-center fve:gap-2 fve:data-dragging:opacity-50"
                      data-dragging={dragged?.id === id || undefined}
                    >
                      {drop?.group === group.id &&
                        (drop.boundary === index ||
                          (drop.boundary === group.sessions.length &&
                            index === group.sessions.length - 1)) && (
                          <span
                            data-slot="view-drop-indicator"
                            aria-hidden="true"
                            className={cn(
                              'fve:pointer-events-none fve:absolute fve:inset-x-0 fve:border-t-2 fve:border-primary',
                              drop.boundary === index
                                ? 'fve:-top-1'
                                : 'fve:-bottom-1',
                            )}
                          />
                        )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="fve:cursor-grab fve:active:cursor-grabbing"
                        aria-label={`拖动调整${title}顺序`}
                        aria-describedby={instructions}
                        draggable={movable}
                        disabled={!movable}
                        onDragStart={event => {
                          if (!movable) {
                            event.preventDefault();
                            return;
                          }
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData('text/plain', id);
                          dragFocus.current = event.currentTarget;
                          setDragged({ id, group: group.id });
                        }}
                        onDragEnd={endDrag}
                        onKeyDown={event => {
                          if (
                            event.key !== 'ArrowUp' &&
                            event.key !== 'ArrowDown'
                          )
                            return;
                          event.preventDefault();
                          move(
                            group,
                            index,
                            index + (event.key === 'ArrowUp' ? -1 : 1),
                            event.currentTarget,
                          );
                        }}
                      >
                        <GripVerticalIcon aria-hidden="true" />
                      </Button>
                      {permissions.rename && names.has(id) ? (
                        <>
                          <Input
                            ref={element => {
                              if (element) nameInputs.current.set(id, element);
                              else nameInputs.current.delete(id);
                            }}
                            aria-label={`${title}名称`}
                            value={name}
                            disabled={writing}
                            onChange={event =>
                              setNames(current =>
                                new Map(current).set(id, event.target.value),
                              )
                            }
                            onKeyDown={event => {
                              if (event.key === 'Escape') {
                                event.preventDefault();
                                event.stopPropagation();
                                finishName(id);
                              } else if (event.key === 'Enter' && name.trim()) {
                                event.preventDefault();
                                if (changed) rename(session);
                                else finishName(id);
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`保存${title}名称`}
                            title="保存名称"
                            disabled={writing || !changed || !name.trim()}
                            onClick={() => rename(session)}
                          >
                            <CheckIcon aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`取消编辑${title}名称`}
                            title="取消编辑"
                            disabled={writing}
                            onClick={() => finishName(id)}
                          >
                            <XIcon aria-hidden="true" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="fve:min-w-0 fve:flex-1 fve:break-words fve:text-sm">
                            {title}
                          </span>
                          {permissions.rename && (
                            <Button
                              ref={element => {
                                if (element)
                                  editButtons.current.set(id, element);
                                else editButtons.current.delete(id);
                              }}
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`编辑${title}名称`}
                              title="编辑名称"
                              disabled={writing}
                              onClick={() => {
                                nameFocus.current = { id, editing: true };
                                setNames(current =>
                                  new Map(current).set(id, title),
                                );
                              }}
                            >
                              <PencilIcon aria-hidden="true" />
                            </Button>
                          )}
                        </>
                      )}
                      {system && (
                        <span className="fve:inline-flex fve:h-5 fve:shrink-0 fve:items-center fve:rounded-4xl fve:border fve:border-border fve:px-2 fve:text-xs fve:font-medium">
                          系统
                        </span>
                      )}
                      {permissions.delete && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`删除${title}`}
                          title="删除视图"
                          disabled={writing}
                          onClick={event => {
                            deleteTrigger.current = event.currentTarget;
                            setError(null);
                            setConfirmId(id);
                          }}
                        >
                          <Trash2Icon aria-hidden="true" />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
        <DialogFooter>
          <div className="fve:flex fve:justify-end">
            <DialogClose render={<Button variant="outline" disabled={busy} />}>
              完成
            </DialogClose>
            <Dialog
              open={Boolean(target)}
              onOpenChange={next => {
                if (!next && !busyRef.current) {
                  setConfirmId(null);
                  setError(null);
                }
              }}
            >
              <DialogContent
                initialFocus={cancelRef}
                finalFocus={() =>
                  deleteTrigger.current?.isConnected
                    ? deleteTrigger.current
                    : titleRef.current
                }
                showCloseButton={!busy}
              >
                <DialogHeader>
                  <DialogTitle>删除视图</DialogTitle>
                  <DialogDescription>
                    删除“{target?.instance.title}
                    ”？这只会删除视图配置，不会删除业务数据。
                    {target?.instance.scope.type === 'public' &&
                      '其他使用者也将无法使用此公共视图。'}
                    {(target?.dirty || target?.filterPending) &&
                      '未保存或待查询的修改也会丢弃。'}
                  </DialogDescription>
                </DialogHeader>
                {error && (
                  <p role="alert" className="fve:text-sm fve:text-destructive">
                    {error}
                  </p>
                )}
                <DialogFooter>
                  <DialogClose
                    render={
                      <Button
                        ref={cancelRef}
                        variant="outline"
                        disabled={busy}
                      />
                    }
                  >
                    取消
                  </DialogClose>
                  <Button
                    variant="destructive"
                    disabled={
                      busy ||
                      !target ||
                      !engine.getPermissions(target.instance.id).delete
                    }
                    onClick={() => {
                      if (target)
                        void execute(
                          () => engine.deleteInstance(target.instance.id),
                          () => {
                            clearName(target.instance.id);
                            setConfirmId(null);
                          },
                        );
                    }}
                  >
                    {busy ? '删除中…' : '删除视图'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
