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
import { Component, useState, type ReactNode } from 'react';
import { AnalysisResult } from '../analysis/AnalysisResultView.js';
import { RecordContent } from '../record/RecordContent.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import { describeFilter } from '../filter/filterSummary.js';
import { sameFilterQuery } from '../filter/filterTree.js';
import type { FilterCompilerRegistry } from '../filter/filterModel.js';
import type { ViewExtensions } from '../view/viewReactTypes.js';
import type { DashboardPanelSnapshot } from './DashboardRuntime.js';

export class DashboardPanelBoundary extends Component<
  { children: ReactNode; panelId: string },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div role="alert" className="fve:p-4">
        <p>面板内容无法显示。</p>
        <Button
          variant="outline"
          onClick={() => this.setState({ error: false })}
        >
          重试显示面板
        </Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function DashboardPanelContent({
  panel,
  positionLabel,
  extensions,
  compilers,
  onRefresh,
  onReload,
  onRepair,
  onOpenOriginal,
}: {
  panel: DashboardPanelSnapshot;
  positionLabel?: string;
  extensions?: ViewExtensions;
  compilers: FilterCompilerRegistry;
  onRefresh(): void | Promise<void>;
  onReload(): void | Promise<void>;
  onRepair?(): void;
  onOpenOriginal?(): void | Promise<void>;
}) {
  const [mode, setMode] = useState<'analysis' | 'table' | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  function run(action: () => void | Promise<void>) {
    setLocalError(null);
    try {
      void Promise.resolve(action()).catch(error =>
        setLocalError(error instanceof Error ? error.message : '操作失败'),
      );
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : '操作失败');
    }
  }
  const position = panel.position;
  const session = position?.getSnapshot();
  const definition = panel.definition;
  const title = panel.instance?.title ?? '视图面板';
  const querying =
    session?.queryStatus === 'loading' || session?.queryStatus === 'waiting';
  const stale =
    !!session?.result &&
    (session.queryStatus === 'error' ||
      (session.kind === 'record'
        ? !sameFilterQuery(session.result.filter, session.appliedFilter)
        : !sameFilterQuery(
            session.result.plan.query.filter,
            session.compilation.plan?.query.filter,
          )));
  const resultFilter =
    session?.kind === 'record'
      ? session.result?.filter
      : session?.result?.plan.query.filter;
  return (
    <>
      <header className="fve:flex fve:flex-wrap fve:items-start fve:justify-between fve:gap-3 fve:p-4">
        <div className="fve:min-w-0 fve:flex-1">
          <h2 className="fve:break-words fve:font-semibold">{title}</h2>
          {definition && (
            <p className="fve:break-words fve:text-xs fve:text-muted-foreground">
              {definition.title}
            </p>
          )}
          {session?.result && (
            <p className="fve:text-xs fve:text-muted-foreground">
              本地接收：
              {new Date(session.result.receivedAt).toLocaleString('zh-CN')}
            </p>
          )}
        </div>
        <div className="fve:flex fve:flex-wrap fve:items-center fve:gap-2">
          {session?.queryStatus === 'waiting' && (
            <Badge variant="secondary">等待查询</Badge>
          )}
          {session?.queryStatus === 'loading' && (
            <Badge variant="secondary">正在查询</Badge>
          )}
          {stale && <Badge variant="outline">上次成功结果</Badge>}
          {position && (
            <Button
              variant="outline"
              size="sm"
              disabled={querying}
              onClick={() => run(onRefresh)}
              aria-label={`刷新${title}`}
            >
              刷新
            </Button>
          )}
          {onOpenOriginal && panel.instance && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => run(onOpenOriginal)}
            >
              编辑原视图
            </Button>
          )}
        </div>
      </header>
      {resultFilter && definition && (
        <p className="fve:mx-4 fve:mb-3 fve:break-words fve:text-xs fve:text-muted-foreground">
          结果筛选口径：{describeFilter(resultFilter, definition.fields).text}
        </p>
      )}
      {panel.status === 'loading' && (
        <p role="status" className="fve:p-4">
          正在加载视图引用…
        </p>
      )}
      {(panel.error || localError) && (
        <div
          role="alert"
          className="fve:m-4 fve:rounded-md fve:border fve:border-destructive/40 fve:p-3"
        >
          <p>{panel.error ?? localError}</p>
          <div className="fve:mt-2 fve:flex fve:flex-wrap fve:gap-2">
            {panel.blocked && onRepair && (
              <Button variant="outline" size="sm" onClick={onRepair}>
                修复绑定
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => run(onReload)}>
              重新加载引用
            </Button>
          </div>
        </div>
      )}
      {!panel.error && !panel.loading && !position && (
        <p role="status" className="fve:p-4">
          面板待配置，请完成筛选绑定后查询。
        </p>
      )}
      {session?.kind === 'record' &&
        position?.kind === 'record' &&
        definition?.record && (
          <RecordContent
            paginationLabel={`${positionLabel ?? title}记录分页`}
            session={session}
            definition={{ ...definition, record: definition.record }}
            commands={position.commands}
            getSnapshot={() => {
              try {
                return position.getSnapshot();
              } catch {
                return undefined;
              }
            }}
            extensions={extensions}
            selectable
            configurable={false}
          />
        )}
      {session?.kind === 'analysis' &&
        position?.kind === 'analysis' &&
        definition && (
          <AnalysisResult
            active
            session={session}
            definition={definition}
            compilers={compilers}
            mode={
              mode ??
              (session.instance.config.presentation.layout === 'table'
                ? 'table'
                : 'analysis')
            }
            canRun={!querying && session.queryValid}
            onRun={() => run(onRefresh)}
            onSortChange={sort => run(() => position.commands.setSort(sort))}
            onModeChange={setMode}
          />
        )}
    </>
  );
}
