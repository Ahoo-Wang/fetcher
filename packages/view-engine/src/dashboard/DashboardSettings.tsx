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

import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog.js';
import type { DashboardCandidate } from '../contracts/ViewHost.js';
import type {
  DashboardRuntime,
  DashboardSnapshot,
} from './DashboardRuntime.js';
import { message } from '../lib/snapshot.js';

export function DashboardSettings({
  runtime,
  snapshot,
  editing,
}: {
  runtime: DashboardRuntime;
  snapshot: DashboardSnapshot;
  editing: boolean;
}) {
  const [selection, setSelection] = useState<{ panelId?: string } | null>(null);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState<string>();
  const [retry, setRetry] = useState(0);
  const [items, setItems] = useState<DashboardCandidate[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controls = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const opened = selection !== null;
  useEffect(() => {
    if (!opened) return;
    const controller = new AbortController();
    void runtime.searchCandidates({ query, cursor }, controller.signal).then(
      result => {
        if (controller.signal.aborted) return;
        setItems(previous =>
          cursor
            ? [
                ...previous,
                ...result.items.filter(
                  item => !previous.some(old => old.id === item.id),
                ),
              ]
            : result.items,
        );
        setNextCursor(result.nextCursor);
        setError(null);
        setLoading(false);
      },
      reason => {
        if (controller.signal.aborted) return;
        setError(message(reason));
        setLoading(false);
      },
    );
    return () => controller.abort();
  }, [runtime, opened, query, cursor, retry]);
  function choose(panelId?: string) {
    setSelection({ panelId });
    setQuery('');
    setCursor(undefined);
    setItems([]);
    setNextCursor(null);
    setError(null);
    setLoading(true);
  }
  function select(candidate: DashboardCandidate) {
    try {
      runtime.edit(config => ({
        ...config,
        panels: selection?.panelId
          ? config.panels.map(panel =>
              panel.id === selection.panelId
                ? { ...panel, instanceId: candidate.id }
                : panel,
            )
          : [
              ...config.panels,
              {
                id: crypto.randomUUID(),
                instanceId: candidate.id,
                layout: {
                  x: 0,
                  y: Math.max(
                    0,
                    ...config.panels.map(
                      panel => panel.layout.y + panel.layout.h,
                    ),
                  ),
                  w: 6,
                  h: 18,
                },
              },
            ],
      }));
      setSelection(null);
    } catch (reason) {
      setError(message(reason));
    }
  }
  if (!snapshot.editable) return null;
  return (
    <div
      className="fve:flex fve:flex-col fve:gap-3"
      ref={controls}
      tabIndex={-1}
    >
      {runtime.canDiscover && (
        <Button
          ref={addRef}
          variant="outline"
          className="fve:self-start"
          onClick={() => choose()}
        >
          添加面板
        </Button>
      )}
      {editing &&
        snapshot.config.panels.map((panel, index) => (
          <div
            key={panel.id}
            className="fve:flex fve:min-w-0 fve:flex-wrap fve:items-center fve:gap-2"
          >
            <span className="fve:min-w-0 fve:flex-1 fve:break-words fve:text-sm">
              {snapshot.panels[panel.id]?.instance?.title ?? panel.instanceId} ·{' '}
              {snapshot.panels[panel.id]?.definition?.title ?? '引用尚未加载'}
            </span>
            {runtime.canDiscover && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => choose(panel.id)}
                aria-label={`替换面板${index + 1}`}
              >
                替换引用
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              data-remove-panel={panel.id}
              onClick={() => {
                const buttons =
                  controls.current?.querySelectorAll<HTMLButtonElement>(
                    '[data-remove-panel]',
                  );
                const focus =
                  buttons?.[index + 1] ??
                  buttons?.[index - 1] ??
                  addRef.current ??
                  controls.current;
                try {
                  runtime.edit(config => ({
                    ...config,
                    panels: config.panels.filter(item => item.id !== panel.id),
                  }));
                  focus?.focus();
                } catch (reason) {
                  setError(message(reason));
                }
              }}
              aria-label={`移除面板${index + 1}`}
            >
              移除
            </Button>
          </div>
        ))}
      {error && !opened && <p role="alert">{error}</p>}
      <Dialog
        open={opened}
        onOpenChange={open => {
          if (!open) setSelection(null);
        }}
      >
        <DialogContent className="fve:sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selection?.panelId ? '替换面板引用' : '添加面板'}
            </DialogTitle>
            <DialogDescription>
              选择已保存的记录或分析视图。替换引用后需要重新确认全局筛选绑定。
            </DialogDescription>
          </DialogHeader>
          <label className="fve:flex fve:flex-col fve:gap-2">
            搜索视图
            <Input
              value={query}
              onChange={event => {
                setQuery(event.target.value);
                setCursor(undefined);
                setItems([]);
                setNextCursor(null);
                setLoading(true);
                setError(null);
              }}
            />
          </label>
          {loading && <p role="status">正在搜索视图…</p>}
          {error && (
            <div role="alert">
              <p>{error}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  setRetry(value => value + 1);
                }}
              >
                重试搜索
              </Button>
            </div>
          )}
          <ul className="fve:flex fve:max-h-80 fve:flex-col fve:gap-2 fve:overflow-auto">
            {items.map(candidate => (
              <li key={candidate.id}>
                <Button
                  variant="outline"
                  className="fve:h-auto fve:w-full fve:justify-start fve:whitespace-normal fve:py-3 fve:text-left"
                  onClick={() => select(candidate)}
                >
                  <span className="fve:min-w-0 fve:break-words">
                    {candidate.title}
                    <span className="fve:block fve:text-xs fve:text-muted-foreground">
                      {candidate.definitionId} ·{' '}
                      {candidate.kind === 'record' ? '记录' : '分析'}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
          {!loading && !error && !items.length && (
            <p>没有匹配的可用视图，请调整搜索条件。</p>
          )}
          {nextCursor && (
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => {
                setCursor(nextCursor);
                setLoading(true);
              }}
            >
              加载更多视图
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
