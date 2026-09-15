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

import { PanelLeftCloseIcon, Settings2Icon } from 'lucide-react';
import { useState, type RefObject } from 'react';
import { Button } from '../components/ui/button.js';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import {
  summaryOf,
  type ViewInstance,
  type ViewInstanceSummary,
  type ViewSession,
  type ViewEngineState,
} from '../contracts/viewModel.js';
import { ViewKindIcon } from './ViewKindIcon.js';

const GROUPS = [
  { id: 'personal', label: '个人视图' },
  { id: 'public', label: '公共视图' },
] as const;

/** One navigable saved instance: always a catalog summary, plus its session once opened. */
export interface InstanceEntry {
  id: string;
  summary: ViewInstanceSummary;
  session?: ViewSession;
}
/** Working title and unsaved markers come from the session; the summary is the saved identity. */
export function entryTitle(entry: InstanceEntry): string {
  return entry.session?.instance.title ?? entry.summary.title;
}
function instanceLabel(entry: InstanceEntry, showPending = true) {
  const session = entry.session;
  return `${entryTitle(entry)}${showPending && session?.dirty ? ' · 已编辑' : ''}${showPending && session?.kind === 'record' && session.filterPending ? ' · 待查询' : ''}`;
}
function kindDescription(kind: ViewInstanceSummary['kind']) {
  return kind === 'dashboard'
    ? '仪表盘'
    : kind === 'analysis'
      ? '分析视图'
      : '数据视图';
}
function ViewInstanceLabel({
  entry,
  showPending,
}: {
  entry: InstanceEntry;
  showPending: boolean;
}) {
  return (
    <span className="fve:flex fve:w-full fve:min-w-0 fve:items-center fve:gap-2">
      <ViewKindIcon kind={entry.summary.kind} />
      <span className="fve:min-w-0 fve:flex-1">
        {instanceLabel(entry, showPending)}
      </span>
      {entry.summary.scope.type === 'public' &&
        entry.summary.scope.source === 'system' && (
          <span className="fve:inline-flex fve:h-5 fve:shrink-0 fve:items-center fve:justify-center fve:rounded-4xl fve:border fve:border-border fve:px-2 fve:py-0.5 fve:text-xs fve:font-medium fve:whitespace-nowrap fve:text-foreground">
            系统
          </span>
        )}
    </span>
  );
}

export type InstanceGroup = {
  id: 'personal' | 'public' | 'draft';
  label: string;
  entries: InstanceEntry[];
};

/** Own-property read; instance IDs such as `constructor` must not resolve through the prototype. */
function own<T>(
  record: Readonly<Record<string, T>>,
  key: string,
): T | undefined {
  return Object.prototype.hasOwnProperty.call(record, key)
    ? record[key]
    : undefined;
}

export function groupViewInstances(state: ViewEngineState): InstanceGroup[] {
  const entries: InstanceEntry[] = state.instanceIds.flatMap(id => {
    const session = own(state.sessions, id);
    const summary =
      own(state.catalog.summaries, id) ??
      (session ? summaryOf(session.instance as ViewInstance) : undefined);
    return summary ? [{ id, summary, session }] : [];
  });
  const groups: InstanceGroup[] = GROUPS.map(group => ({
    ...group,
    entries: entries.filter(entry => entry.summary.scope.type === group.id),
  })).filter(group => group.entries.length);
  const drafts = Object.entries(state.sessions).flatMap(([id, session]) =>
    session.kind === 'dashboard' && !session.persisted
      ? [{ id, summary: summaryOf(session.instance as ViewInstance), session }]
      : [],
  );
  if (drafts.length)
    groups.unshift({ id: 'draft', label: '未保存草稿', entries: drafts });
  return groups;
}

interface NavigationProps {
  groups: InstanceGroup[];
  selectedId: string | null;
  onSelect(id: string): void;
  onManage(trigger: HTMLElement | null): void;
}

export function ViewInstanceSwitcher({
  groups,
  selectedId,
  onSelect,
  onManage,
  triggerRef,
  managerOpen,
}: NavigationProps & {
  triggerRef: RefObject<HTMLButtonElement | null>;
  managerOpen: boolean;
}) {
  const [open, setOpen] = useState(false);
  const entries = groups.flatMap(group => group.entries);
  const selected = entries.find(entry => entry.id === selectedId);
  const selectedTitle = selected ? entryTitle(selected) : undefined;
  return (
    <Select<string | null>
      open={open}
      onOpenChange={setOpen}
      value={selectedId}
      items={entries.map(entry => ({
        value: entry.id,
        label: instanceLabel(entry, entry.id !== selectedId),
      }))}
      onValueChange={next => {
        setOpen(false);
        if (next !== null) onSelect(next);
      }}
    >
      <SelectTrigger
        ref={triggerRef}
        aria-label="选择视图实例"
        aria-description={
          selected ? kindDescription(selected.summary.kind) : undefined
        }
      >
        <SelectValue placeholder="选择视图">
          {selectedTitle === undefined ? undefined : (
            <span className="fve:flex fve:min-w-0 fve:items-center fve:gap-2">
              <ViewKindIcon kind={selected!.summary.kind} />
              <span className="fve:truncate" title={selectedTitle}>
                {selectedTitle}
              </span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        align="start"
        finalFocus={!managerOpen}
        footer={
          <Button
            variant="ghost"
            size="sm"
            className="fve:w-full fve:justify-start"
            onClick={() => {
              setOpen(false);
              onManage(triggerRef.current);
            }}
          >
            <Settings2Icon aria-hidden="true" />
            管理视图
          </Button>
        }
      >
        {groups.map(group => (
          <SelectGroup key={group.id}>
            <SelectLabel>{group.label}</SelectLabel>
            {group.entries.map(entry => (
              <SelectItem
                key={entry.id}
                value={entry.id}
                aria-description={kindDescription(entry.summary.kind)}
              >
                <ViewInstanceLabel
                  entry={entry}
                  showPending={entry.id !== selectedId}
                />
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ViewSidebar({
  title,
  groups,
  selectedId,
  onSelect,
  onManage,
  onCollapse,
  toggleRef,
  catalog,
}: NavigationProps & {
  title: string;
  toggleRef: RefObject<HTMLButtonElement | null>;
  onCollapse(): void;
  /** Paged catalog affordances; absent when the host catalog is complete. */
  catalog?: {
    loading: boolean;
    hasMore: boolean;
    error: string | null;
    onLoadMore(): void;
  };
}) {
  return (
    <aside
      aria-label="视图列表"
      className="fve:hidden fve:w-52 fve:shrink-0 fve:flex-col fve:gap-3 fve:border-r fve:pr-3 fve:@min-[64rem]/view-page:flex"
    >
      <div className="fve:flex fve:items-center fve:justify-between fve:gap-2">
        <h1 className="fve:min-w-0 fve:truncate fve:font-medium" title={title}>
          {title}
        </h1>
        <div className="fve:flex fve:items-center fve:gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="管理视图"
            title="管理视图"
            onClick={event => onManage(event.currentTarget)}
          >
            <Settings2Icon aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="收起视图列表"
            ref={toggleRef}
            onClick={onCollapse}
          >
            <PanelLeftCloseIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
      {groups.map(group => (
        <section key={group.id} className="fve:flex fve:flex-col fve:gap-1">
          <h2 className="fve:px-2 fve:py-1 fve:text-xs fve:font-medium fve:text-muted-foreground">
            {group.label}
          </h2>
          {group.entries.map(entry => (
            <Button
              key={entry.id}
              variant={selectedId === entry.id ? 'secondary' : 'ghost'}
              className="fve:h-auto fve:min-h-8 fve:justify-start fve:whitespace-normal fve:break-words fve:text-left"
              aria-current={selectedId === entry.id ? 'page' : undefined}
              aria-description={kindDescription(entry.summary.kind)}
              onClick={() => onSelect(entry.id)}
            >
              <ViewInstanceLabel
                entry={entry}
                showPending={entry.id !== selectedId}
              />
            </Button>
          ))}
        </section>
      ))}
      {catalog?.error && (
        <p role="alert" className="fve:px-2 fve:text-xs fve:text-destructive">
          {catalog.error}
        </p>
      )}
      {catalog?.hasMore && (
        <Button
          variant="ghost"
          size="sm"
          disabled={catalog.loading}
          onClick={catalog.onLoadMore}
        >
          {catalog.loading ? '正在加载目录…' : '加载更多视图'}
        </Button>
      )}
    </aside>
  );
}
