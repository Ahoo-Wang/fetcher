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

import { lazy, Suspense, useState, useSyncExternalStore } from 'react';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import { cn } from '../lib/utils.js';
import { message } from '../lib/snapshot.js';
import { describeConfiguredFilter } from '../filter/describeConfiguredFilter.js';
import {
  DashboardPanelBoundary,
  DashboardPanelContent,
} from './DashboardPanelContent.js';
import { DashboardContent } from './DashboardContent.js';
import { DashboardSettings } from './DashboardSettings.js';
import { DashboardFilterSettings } from './DashboardFilterSettings.js';
import { restorePanelLayouts } from './dashboardLayout.js';
import type { DashboardPanel } from './dashboardModel.js';
import type { DeepReadonly } from '../lib/types.js';
import type { DashboardViewProps } from './dashboardReactTypes.js';

const DashboardLayout = lazy(() =>
  import('./DashboardGrid.js').then(module => ({
    default: module.DashboardLayout,
  })),
);
/** A caller-owned runtime controls navigation and queries independently of this presentation. */
export function DashboardView({
  runtime,
  extensions,
  filterContext,
  toolbarStart,
  className,
}: DashboardViewProps) {
  const snapshot = useSyncExternalStore(
    runtime.subscribe,
    runtime.getSnapshot,
    runtime.getSnapshot,
  );
  type Panels = readonly DeepReadonly<DashboardPanel>[];
  const [layoutEdit, setLayoutEdit] = useState<{
    id: string;
    initial: Panels;
    past: Panels[];
    future: Panels[];
  } | null>(null);
  const editing = layoutEdit?.id === runtime.identity && snapshot.editable;
  function commitLayout(panels: Panels) {
    if (!editing || !layoutEdit || panels === snapshot.config.panels) return;
    runtime.edit(config => ({ ...config, panels }));
    setLayoutEdit({
      ...layoutEdit,
      past: [...layoutEdit.past, snapshot.config.panels].slice(-50),
      future: [],
    });
  }
  function travelLayout(direction: 'past' | 'future') {
    if (!editing || !layoutEdit) return;
    const target = layoutEdit[direction][layoutEdit[direction].length - 1];
    if (!target) return;
    runtime.edit(config => ({
      ...config,
      panels: restorePanelLayouts(config.panels, target),
    }));
    setLayoutEdit({
      ...layoutEdit,
      past:
        direction === 'past'
          ? layoutEdit.past.slice(0, -1)
          : [...layoutEdit.past, snapshot.config.panels].slice(-50),
      future:
        direction === 'future'
          ? layoutEdit.future.slice(0, -1)
          : [...layoutEdit.future, snapshot.config.panels].slice(-50),
    });
  }
  const [configuring, setConfiguring] = useState(false);
  const [repair, setRepair] = useState<{
    panelId: string;
    filterId?: string;
    version: number;
  }>();
  const [error, setError] = useState<string | null>(null);
  function run(action: () => void | Promise<void>) {
    setError(null);
    try {
      void Promise.resolve(action()).catch(reason => setError(message(reason)));
    } catch (reason) {
      setError(message(reason));
    }
  }
  const invalid =
    snapshot.validation.length > 0 ||
    Object.values(snapshot.session.editorValidity).some(valid => !valid);
  return (
    <div
      className={cn(
        'fve-root fve:flex fve:min-w-0 fve:flex-col fve:gap-4',
        className,
      )}
    >
      <header className="fve:flex fve:flex-wrap fve:items-center fve:justify-between fve:gap-3">
        {toolbarStart ?? (
          <h1 className="fve:min-w-0 fve:break-words fve:text-lg fve:font-semibold">
            {snapshot.session.instance.title}
          </h1>
        )}
        <div className="fve:flex fve:flex-wrap fve:items-center fve:gap-2">
          {snapshot.session.dirty && <Badge variant="outline">未保存</Badge>}
          {snapshot.pending && <Badge variant="secondary">待查询</Badge>}
          <Button
            disabled={invalid || !snapshot.active}
            onClick={() => run(() => runtime.apply())}
          >
            查询
          </Button>
          <Button
            variant="outline"
            disabled={!snapshot.active}
            onClick={() => run(() => runtime.refresh())}
          >
            刷新全部
          </Button>
          {snapshot.editable && (
            <>
              <Button
                variant="outline"
                aria-pressed={configuring}
                onClick={() => setConfiguring(value => !value)}
              >
                全局筛选设置
              </Button>
              <Button
                variant="outline"
                aria-pressed={editing}
                onClick={() =>
                  setLayoutEdit(
                    editing
                      ? null
                      : {
                          id: runtime.identity,
                          initial: snapshot.config.panels,
                          past: [],
                          future: [],
                        },
                  )
                }
              >
                {editing ? '完成布局' : '编辑布局'}
              </Button>
            </>
          )}
        </div>
      </header>
      {editing && layoutEdit && (
        <div
          className="fve:flex fve:flex-wrap fve:items-center fve:gap-2"
          role="group"
          aria-label="布局编辑"
        >
          <Button
            variant="outline"
            disabled={!layoutEdit.past.length}
            onClick={() => run(() => travelLayout('past'))}
          >
            撤销布局
          </Button>
          <Button
            variant="outline"
            disabled={!layoutEdit.future.length}
            onClick={() => run(() => travelLayout('future'))}
          >
            重做布局
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              run(() => {
                runtime.edit(config => ({
                  ...config,
                  panels: restorePanelLayouts(
                    config.panels,
                    layoutEdit.initial,
                  ),
                }));
                setLayoutEdit(null);
              })
            }
          >
            取消布局编辑
          </Button>
          <span className="fve:text-xs fve:text-muted-foreground">
            拖动卡片移动，右下角调整宽高；Escape取消当前拖动。聚焦移动或尺寸按钮后，可用方向键调整。
          </span>
        </div>
      )}
      <p className="fve:text-xs fve:text-muted-foreground">
        查询应用全局筛选草稿；刷新全部使用已应用条件；保存只保存仪表盘配置。各面板独立取数。
      </p>
      {(snapshot.validation.length > 0 || error || snapshot.error) && (
        <div
          role="alert"
          className="fve:rounded-md fve:border fve:border-destructive/40 fve:p-3 fve:text-sm"
        >
          <p>{error ?? snapshot.error}</p>
          {snapshot.validation.map((issue, index) => (
            <p key={`${issue.id}:${index}`}>{issue.message}</p>
          ))}
          {snapshot.editable && invalid && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfiguring(true)}
            >
              检查筛选绑定
            </Button>
          )}
        </div>
      )}
      {!snapshot.editable && (
        <p className="fve:text-xs fve:text-muted-foreground">
          你可以调整临时筛选；布局和绑定需保存或另存权限。引用或绑定错误请联系视图维护者。
        </p>
      )}
      <DashboardFilterSettings
        runtime={runtime}
        snapshot={snapshot}
        extensions={extensions}
        filterContext={filterContext}
        configuring={configuring}
        repair={repair}
      />
      <DashboardSettings
        key={`${runtime.identity}:${snapshot.session.editorEpoch}`}
        runtime={runtime}
        snapshot={snapshot}
        editing={editing}
      />
      {!snapshot.config.panels.length && (
        <div className="fve:rounded-lg fve:border fve:border-dashed fve:p-8 fve:text-center">
          <h2 className="fve:font-medium">仪表盘还没有面板</h2>
          <p className="fve:mt-2 fve:text-sm fve:text-muted-foreground">
            {snapshot.editable
              ? runtime.canDiscover
                ? '添加已保存的视图、Markdown、链接或图片，组成你的业务概览。'
                : '添加 Markdown、链接或图片，组成你的业务概览。'
              : '请联系视图维护者添加面板。'}
          </p>
        </div>
      )}
      {!!snapshot.config.panels.length && (
        <Suspense fallback={<p role="status">正在加载仪表盘布局…</p>}>
          <DashboardLayout
            panels={snapshot.config.panels}
            enabled={editing && snapshot.editable}
            onCommit={panels => run(() => commitLayout(panels))}
            title={id => {
              const panel = snapshot.config.panels.find(item => item.id === id);
              return panel?.kind === 'view'
                ? (snapshot.panels[id]?.instance?.title ?? panel.instanceId)
                : (panel?.title ?? '面板');
            }}
          >
            {panel =>
              panel.kind !== 'view' ? (
                <DashboardContent panel={panel} />
              ) : (
                <DashboardPanelBoundary panelId={panel.id}>
                  <div
                    className="fve:px-4 fve:pt-3 fve:text-xs fve:text-muted-foreground"
                    aria-label="已应用全局筛选"
                  >
                    {!snapshot.applied.filters.length
                      ? '已应用全局筛选：无'
                      : snapshot.applied.filters.map((item, index) => (
                          <p key={item.id} className="fve:break-words">
                            筛选 {index + 1}：
                            {!snapshot.applied.panels.some(
                              applied =>
                                applied.kind === 'view' &&
                                applied.id === panel.id &&
                                applied.instanceId === panel.instanceId,
                            )
                              ? '尚未应用到此引用'
                              : item.excludedPanelIds.includes(panel.id)
                                ? '不参与'
                                : item.bindings.some(
                                      binding => binding.panelId === panel.id,
                                    )
                                  ? (describeConfiguredFilter(
                                      item.filters.root,
                                      runtime.definition.fields,
                                      runtime.definition.allowedOperators,
                                      runtime.filterCompilers,
                                      runtime.definition.timeZone,
                                    )?.text ?? '已应用条件')
                                  : '尚未应用到此面板'}
                          </p>
                        ))}
                    {snapshot.pending && (
                      <p>新草稿尚未应用，当前结果仍使用上次查询口径。</p>
                    )}
                  </div>
                  {snapshot.panels[panel.id] && (
                    <DashboardPanelContent
                      panel={snapshot.panels[panel.id]}
                      positionLabel={`面板 ${[...snapshot.config.panels].sort((a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x).findIndex(item => item.id === panel.id) + 1}：${snapshot.panels[panel.id]?.instance?.title ?? panel.instanceId}`}
                      extensions={extensions}
                      compilers={runtime.filterCompilers}
                      onRefresh={() => runtime.refresh(panel.id)}
                      onReload={() => runtime.reloadReference(panel.id)}
                      onRepair={
                        snapshot.editable
                          ? () => {
                              setConfiguring(true);
                              setRepair(value => ({
                                panelId: panel.id,
                                filterId: snapshot.panels[panel.id]?.filterId,
                                version: (value?.version ?? 0) + 1,
                              }));
                            }
                          : undefined
                      }
                      onOpenOriginal={
                        runtime.canOpenOriginal
                          ? () => runtime.openOriginal(panel.id)
                          : undefined
                      }
                    />
                  )}
                </DashboardPanelBoundary>
              )
            }
          </DashboardLayout>
        </Suspense>
      )}
    </div>
  );
}
