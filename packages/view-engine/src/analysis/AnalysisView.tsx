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
  Component,
  lazy,
  Suspense,
  useMemo,
  useCallback,
  useContext,
  useRef,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDownIcon,
  PlayIcon,
  Settings2Icon,
  Maximize2Icon,
  Minimize2Icon,
} from 'lucide-react';
import type { ViewEngine } from '../engine/ViewEngine.js';
import type { FilterExtensions } from '../filter/filterReactTypes.js';
import { FilterPanel } from '../filter/FilterPanel.js';
import { FilterSelect } from '../filter/FilterSelect.js';
import { describeConfiguredFilter } from '../filter/describeConfiguredFilter.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog.js';
import { ViewRefreshControls } from '../view/ViewRefreshControls.js';
import {
  useViewExpansion,
  ViewExpansionContext,
} from '../view/viewExpansion.js';
import { ViewInstanceActions } from '../view/ViewInstanceActions.js';
import { sameJsonState } from '../lib/snapshot.js';
import { cn } from '../lib/utils.js';
import { OverlayScope } from '../lib/OverlayScope.js';
import { analysisQueryPolicy } from './analysisQueryPolicy.js';
import { AnalysisEditor } from './AnalysisEditor.js';
import { AnalysisTable } from './AnalysisTable.js';
import { AnalysisResultTabs } from './AnalysisResultTabs.js';
import { AnalysisPresentationEditor } from './AnalysisPresentationEditor.js';
import { projectAnalysis } from './analysisProjection.js';
import type { AnalysisCompileContext } from './analysisModel.js';
import type { AnalysisPresentation } from './analysisPresentation.js';
import type { AnalysisExtensions } from './analysisReactTypes.js';

/** One instance-local validity gate: a valid root cannot overwrite an invalid element. */
function AnalysisFilterValidity({
  scopeKey,
  onChange,
  children,
}: {
  scopeKey: string;
  onChange(valid: boolean): void;
  children(
    root: (valid: boolean) => void,
    scope: (valid: boolean) => void,
  ): ReactNode;
}) {
  const [root, setRoot] = useState(true);
  const [scopes, setScopes] = useState(() => new Map<string, boolean>());
  const valid = root && (scopes.get(scopeKey) ?? true);
  useEffect(() => {
    onChange(valid);
  }, [valid, onChange]);
  return children(setRoot, valid =>
    setScopes(previous =>
      previous.get(scopeKey) === valid
        ? previous
        : new Map(previous).set(scopeKey, valid),
    ),
  );
}

const Chart = lazy(() =>
  import('./AnalysisChart.js').then(module => ({
    default: module.AnalysisChart,
  })),
);
class ChartBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p role="alert">图表暂时无法显示，请切换到下方“数据表”查看结果。</p>
    ) : (
      this.props.children
    );
  }
}
const narrowQuery = '(max-width: 767px)';
function subscribeNarrow(listener: () => void) {
  const query =
    typeof window.matchMedia === 'function'
      ? window.matchMedia(narrowQuery)
      : undefined;
  query?.addEventListener('change', listener);
  return () => query?.removeEventListener('change', listener);
}
const narrowSnapshot = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(narrowQuery).matches;
const serverNarrow = () => false;
const tablePresentation: AnalysisPresentation = {
  layout: 'table',
  columns: [],
};
export interface AnalysisViewProps {
  engine: ViewEngine;
  extensions?: FilterExtensions & AnalysisExtensions;
  filterContext?: unknown;
  toolbarStart?: ReactNode;
  configurationOpen?: boolean;
  onConfigurationOpenChange?(open: boolean): void;
  className?: string;
}
/** Own editor subscriptions separately from result and dialog presentation. */
function AnalysisConfiguration({
  engine,
  context,
  extensions,
  filterContext,
  narrow,
  visible,
  filterSummary,
}: Pick<AnalysisViewProps, 'engine' | 'extensions' | 'filterContext'> & {
  context: AnalysisCompileContext;
  narrow: boolean;
  visible: boolean;
  filterSummary: string;
}) {
  const state = useSyncExternalStore(
    engine.subscribe,
    engine.getSnapshot,
    engine.getSnapshot,
  );
  const selected = state.selectedInstanceId
    ? state.sessions[state.selectedInstanceId]
    : undefined;
  const session = selected?.kind === 'analysis' ? selected : undefined;
  const id = session?.instance.id;
  const commands = useMemo(
    () =>
      id && session?.editorEpoch !== undefined ? engine.analysis(id) : null,
    [engine, id, session?.editorEpoch],
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersVisited, setFiltersVisited] = useState(false);
  if (!filtersVisited && (filtersOpen || session?.filterValid === false))
    setFiltersVisited(true);
  const definition = state.definition;
  if (!session || !definition || !commands) return null;
  const { instance } = session;
  return (
    <AnalysisFilterValidity
      key={`${instance.id}:${session.editorEpoch}`}
      scopeKey={instance.config.scope?.id ?? 'root'}
      onChange={commands.setFilterValidity}
    >
      {(rootValidity, scopeValidity) => (
        <div className="fve:[&_p]:m-0 fve:flex fve:min-w-0 fve:flex-col fve:gap-3">
          {!narrow && (
            <div className="fve:flex fve:flex-wrap fve:items-baseline fve:gap-x-3 fve:gap-y-1">
              <h2 className="fve:font-semibold">查询配置</h2>
              <p className="fve:text-xs fve:text-muted-foreground">
                修改后运行以更新结果；保存仅保存配置。
              </p>
            </div>
          )}
          <details
            className="fve:group fve:rounded-lg fve:border"
            open={filtersOpen || session.filterValid === false}
          >
            <summary
              className="fve:flex fve:cursor-pointer fve:list-none fve:items-center fve:justify-between fve:gap-2 fve:px-3 fve:py-2 fve:text-sm fve:focus-visible:ring-2 fve:focus-visible:ring-ring fve:[&::-webkit-details-marker]:hidden"
              onClick={event => {
                event.preventDefault();
                setFiltersVisited(true);
                setFiltersOpen(!filtersOpen);
              }}
            >
              <span className="fve:flex fve:min-w-0 fve:items-center fve:gap-3">
                <span className="fve:font-medium">筛选条件</span>
                <span
                  className="fve:truncate fve:text-xs fve:text-muted-foreground"
                  title={filterSummary}
                >
                  {session.filterValid === false ? '条件待完善' : filterSummary}
                </span>
              </span>
              <ChevronDownIcon
                aria-hidden="true"
                className="fve:size-4 fve:shrink-0 fve:group-open:rotate-180"
              />
            </summary>
            <div
              className="fve:border-t fve:p-3"
              onFocus={() => setFiltersOpen(true)}
            >
              {(filtersVisited || filtersOpen || !session.filterValid) && (
                <FilterPanel
                  renderToolbar={toolbar => (
                    <FilterSelect
                      label="筛选模式"
                      value={toolbar.mode}
                      options={toolbar.options}
                      disabled={toolbar.disabled}
                      onValueChange={toolbar.onModeChange}
                    />
                  )}
                  value={instance.config.filters}
                  appliedValue={
                    (session.result?.config ?? session.baseline.config).filters
                  }
                  fields={definition.fields}
                  timeZone={definition.timeZone}
                  allowedOperators={definition.allowedOperators}
                  editors={definition.filterEditors}
                  extensions={extensions}
                  context={filterContext}
                  showQueryAction={false}
                  onApply={() => commands.run()}
                  onChange={filters =>
                    commands.edit(config => ({ ...config, filters }))
                  }
                  onValidityChange={rootValidity}
                />
              )}
            </div>
          </details>
          <AnalysisEditor
            key={instance.id}
            value={instance.config}
            appliedValue={session.result?.config ?? session.baseline.config}
            context={context}
            errors={session.validation}
            visible={visible}
            extensions={extensions}
            filterContext={filterContext}
            onFilterValidityChange={scopeValidity}
            onChange={next => commands.edit(() => next)}
          />
        </div>
      )}
    </AnalysisFilterValidity>
  );
}

/** Query editing and executed results share an instance, not a mutable data meaning. */
export function AnalysisView({
  engine,
  extensions,
  filterContext,
  toolbarStart,
  configurationOpen,
  onConfigurationOpenChange,
  className,
}: AnalysisViewProps) {
  const state = useSyncExternalStore(
    engine.subscribe,
    engine.getSnapshot,
    engine.getSnapshot,
  );
  const viewportNarrow = useSyncExternalStore(
    subscribeNarrow,
    narrowSnapshot,
    serverNarrow,
  );
  const containerRef = useRef<HTMLElement>(null);
  const [editorElement] = useState(() =>
    typeof document === 'undefined' ? null : document.createElement('div'),
  );
  // Move only the stable portal container; React keeps extension-local drafts mounted.
  const attachEditor = (target: HTMLDivElement | null, active: boolean) => {
    if (
      active &&
      target &&
      editorElement &&
      editorElement.parentNode !== target
    )
      target.appendChild(editorElement);
  };
  const [containerNarrow, setContainerNarrow] = useState(false);
  const narrow = viewportNarrow || containerNarrow;
  const [localOpen, setLocalOpen] = useState<boolean>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localError, setLocalError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const current = state.selectedInstanceId
    ? state.sessions[state.selectedInstanceId]
    : undefined;
  const session = current?.kind === 'analysis' ? current : undefined;
  const id = session?.instance.id;
  const inheritedExpansion = useContext(ViewExpansionContext);
  const localExpansion = useViewExpansion(
    containerRef,
    !!session && !inheritedExpansion,
  );
  const expansion = inheritedExpansion ?? localExpansion;
  const autoRefresh = useCallback(async () => {
    if (id) await engine.analysis(id).refresh();
  }, [engine, id]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width > 0) setContainerNarrow(width < 640);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [id]);
  const commands = useMemo(
    () =>
      id && session?.editorEpoch !== undefined ? engine.analysis(id) : null,
    [engine, id, session?.editorEpoch],
  );
  const definition = state.definition;
  const context = useMemo<AnalysisCompileContext | null>(
    () =>
      definition?.analysis
        ? {
            fields: definition.fields,
            capability: definition.analysis,
            timeZone: definition.timeZone,
            allowedOperators: definition.allowedOperators,
            filterCompilers: engine.filterCompilers,
            compilers: engine.analysisCompilers,
          }
        : null,
    [definition, engine],
  );
  const config = session?.instance.config;
  const compiled = session?.compilation ?? null;
  const open = configurationOpen ?? localOpen ?? !compiled?.plan;
  const result = session?.result;
  const querying = session?.queryStatus === 'loading';
  const samePendingQuery =
    querying &&
    sameJsonState(compiled?.plan?.query, session?.pendingQuery?.query);
  const stale =
    !!result &&
    (!compiled?.plan || !sameJsonState(compiled.plan.query, result.plan.query));
  const presentation =
    config?.presentation && typeof config.presentation === 'object'
      ? config.presentation
      : tablePresentation;
  const executedPresentation =
    result?.config.presentation &&
    typeof result.config.presentation === 'object'
      ? result.config.presentation
      : tablePresentation;
  const resultPresentation =
    stale || sameJsonState(presentation, executedPresentation)
      ? executedPresentation
      : presentation;
  // Keep unchanged results stable across query-only drafts, including local table pagination.
  const resultPlan =
    !stale &&
    compiled?.plan &&
    (!sameJsonState(compiled.plan.schema, result?.plan.schema) ||
      compiled.plan.timeZone !== result?.plan.timeZone)
      ? compiled.plan
      : result?.plan;
  const projectedResult = useMemo(
    () =>
      result && resultPlan
        ? projectAnalysis(resultPlan, result.rows, resultPresentation)
        : undefined,
    [result, resultPlan, resultPresentation],
  );
  const tablePlan = projectedResult?.plan;
  if (!session || !commands || !context || !definition) return null;
  const { instance } = session;
  function run(action: () => void | Promise<void>) {
    const actionId = instance.id;
    setLocalError(null);
    const failed = () => {
      const current = engine.getSnapshot().sessions[actionId];
      setLocalError({
        id: actionId,
        message:
          current?.queryError || current?.writeError || '操作失败，请重试',
      });
    };
    try {
      void Promise.resolve(action()).catch(failed);
    } catch {
      failed();
    }
  }
  function toggleConfiguration(next: boolean) {
    if (narrow) setMobileOpen(next);
    setLocalOpen(next);
    onConfigurationOpenChange?.(next);
  }
  const canRun = analysisQueryPolicy(session, 'manual');
  const runButton = (
    <Button disabled={!canRun} onClick={() => run(() => commands.run())}>
      <PlayIcon data-icon="inline-start" aria-hidden="true" />
      {samePendingQuery ? '运行中' : '运行分析'}
    </Button>
  );
  const draftFilterSummary = compiled?.plan
    ? (describeConfiguredFilter(
        instance.config.filters.root,
        definition.fields,
        definition.allowedOperators,
        engine.filterCompilers,
        definition.timeZone,
      )?.text ?? '全部记录')
    : '筛选草稿待检查';
  const editor = (
    <OverlayScope visible={narrow ? mobileOpen : open}>
      <AnalysisConfiguration
        engine={engine}
        context={context}
        extensions={extensions}
        filterContext={filterContext}
        narrow={narrow}
        visible={narrow ? mobileOpen : open}
        filterSummary={draftFilterSummary}
      />
    </OverlayScope>
  );

  const error =
    session.writeError ||
    session.queryError ||
    (localError?.id === instance.id ? localError.message : null);
  const table =
    result && tablePlan ? (
      <AnalysisTable
        key={instance.id}
        plan={tablePlan}
        rows={result.rows}
        sort={instance.config.sort}
        stale={stale}
        querying={querying}
        sortDisabled={!session.queryValid}
        maxSort={definition.analysis?.limits?.maxSort}
        onSortChange={sort => run(() => commands.setSort(sort))}
      />
    ) : null;
  const scopeLabel = result?.config.scope
    ? (definition.analysis?.scopes?.find(
        scope => scope.id === result.config.scope?.id,
      )?.label ?? result.config.scope.id)
    : '根记录';
  const resultScope = definition.analysis?.scopes?.find(
    scope => scope.id === result?.config.scope?.id,
  );
  const filterSummary = result
    ? (describeConfiguredFilter(
        result.config.filters.root,
        definition.fields,
        definition.allowedOperators,
        engine.filterCompilers,
        result.plan.timeZone,
      )?.text ?? '全部记录')
    : '';
  const querySummary = [
    instance.config.scope
      ? (definition.analysis?.scopes?.find(
          scope => scope.id === instance.config.scope?.id,
        )?.label ?? instance.config.scope.id)
      : '根记录',
    draftFilterSummary,
    instance.config.dimensions.length
      ? `按 ${instance.config.dimensions.map(item => item.title).join('、')} 分组`
      : '不分组',
    `统计 ${instance.config.metrics.map(item => item.title).join('、') || '未设置指标'}`,
  ].join(' · ');
  return (
    <section
      className={cn(
        'fve-root fve:[&_p]:m-0 fve:@container fve:flex fve:min-w-0 fve:flex-col fve:gap-4',
        className,
      )}
      ref={containerRef}
      aria-label="分析视图"
      data-slot="analysis-view"
    >
      <header className="fve:flex fve:flex-wrap fve:items-center fve:justify-between fve:gap-3 fve:rounded-xl fve:border fve:bg-background fve:p-3">
        {toolbarStart ?? (
          <div className="fve:flex fve:flex-wrap fve:items-center fve:gap-2">
            <h1 className="fve:text-lg fve:font-semibold">{instance.title}</h1>
            <ViewInstanceActions engine={engine} session={session} run={run} />
          </div>
        )}
        <div className="fve:flex fve:items-center fve:gap-2">
          <Button
            variant="outline"
            aria-expanded={narrow ? mobileOpen : open}
            onClick={() => toggleConfiguration(!(narrow ? mobileOpen : open))}
          >
            <Settings2Icon data-icon="inline-start" aria-hidden="true" />
            配置分析
          </Button>
          <ViewRefreshControls
            key={`refresh:${instance.id}`}
            engine={engine}
            id={instance.id}
            root={containerRef}
            querying={querying}
            pauseReason={
              session.requiresReload
                ? '视图已变化，重新加载后恢复。'
                : session.queryError
                  ? '查询失败，重试成功后恢复。'
                  : session.writeStatus !== 'idle'
                    ? '正在保存视图，完成后恢复。'
                    : stale || !session.filterValid
                      ? '配置尚未运行，运行或撤销修改后恢复。'
                      : !result
                        ? '运行分析后可开启自动刷新。'
                        : null
            }
            manualDisabled={
              !canRun ||
              stale ||
              !session.filterValid ||
              session.requiresReload ||
              session.writeStatus !== 'idle'
            }
            onRefresh={() => run(() => commands.run())}
            onAutoRefresh={autoRefresh}
          />
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={expansion.expanded ? '收起视图' : '展开视图'}
            data-slot="view-expand"
            title={expansion.expanded ? '收起视图（Esc）' : '展开视图'}
            aria-pressed={expansion.expanded}
            onClick={expansion.toggle}
          >
            {expansion.expanded ? (
              <Minimize2Icon aria-hidden="true" />
            ) : (
              <Maximize2Icon aria-hidden="true" />
            )}
          </Button>
          {runButton}
        </div>
      </header>
      {(narrow || !open) && (
        <Button
          variant="outline"
          aria-label="展开查询配置"
          className="fve:h-auto fve:min-h-10 fve:min-w-0 fve:justify-between fve:gap-3 fve:text-left"
          onClick={() => toggleConfiguration(true)}
        >
          <span
            className="fve:min-w-0 fve:truncate fve:text-sm fve:font-normal"
            title={querySummary}
          >
            {querySummary}
          </span>
          <span className="fve:shrink-0 fve:text-xs">
            {!compiled?.plan || !session.filterValid ? '配置待完善 · ' : ''}
            编辑查询
          </span>
        </Button>
      )}
      <div className="fve:flex fve:min-w-0 fve:flex-col fve:gap-4">
        {!narrow && (
          <div
            ref={node => attachEditor(node, !narrow)}
            hidden={!open}
            aria-label="分析配置面板"
            className="fve:min-w-0 fve:rounded-xl fve:border fve:bg-background fve:p-4"
          />
        )}
        <div
          aria-label="分析结果区"
          className="fve:flex fve:min-w-0 fve:flex-col fve:gap-4 fve:rounded-xl fve:border fve:bg-background fve:p-4"
        >
          <div className="fve:flex fve:flex-col fve:gap-3">
            <div className="fve:flex fve:flex-wrap fve:items-center fve:justify-between fve:gap-2">
              <h2 className="fve:font-semibold">分析结果</h2>
              <div className="fve:flex fve:items-center fve:gap-2">
                {querying && <Badge variant="secondary">正在查询</Badge>}
                {stale && <Badge variant="outline">配置尚未运行</Badge>}
              </div>
            </div>
            {result && (
              <section
                aria-label="执行口径"
                className="fve:flex fve:flex-col fve:gap-1 fve:rounded-md fve:bg-muted/50 fve:p-3 fve:text-xs fve:text-muted-foreground"
              >
                <details>
                  <summary className="fve:cursor-pointer">
                    已返回 {result.rows.length} 行 · {filterSummary} ·
                    查看执行口径
                  </summary>
                  <p>
                    来源：{definition.title} · 统计对象：{scopeLabel} ·{' '}
                    {(result.plan.query.groupBy ?? []).length} 个维度 ·{' '}
                    {
                      result.plan.schema.filter(
                        column => column.role === 'metric' && !column.labelFor,
                      ).length
                    }{' '}
                    个指标
                  </p>
                  <p>筛选：{filterSummary}</p>
                  {result.plan.query.elements?.map(
                    (element, index) =>
                      element.filter && (
                        <p key={index}>
                          元素 {index + 1}：
                          {(result.config.scope?.filters[index]
                            ? describeConfiguredFilter(
                                result.config.scope.filters[index].root,
                                resultScope?.elements[index]?.fields ?? [],
                                definition.allowedOperators,
                                engine.filterCompilers,
                                result.plan.timeZone,
                              )?.text
                            : undefined) ?? '全部记录'}
                        </p>
                      ),
                  )}
                  <p>
                    已返回 {result.rows.length} 行 · 最多{' '}
                    {result.plan.query.limit ?? 100} 行 · 时区{' '}
                    {result.plan.timeZone ?? 'UTC'} · 接收于{' '}
                    {new Date(result.receivedAt).toLocaleString('zh-CN')}
                  </p>
                  {!!result.plan.query.groupBy?.length &&
                    result.rows.length === (result.plan.query.limit ?? 100) && (
                      <p>结果达到返回上限，可能还有其他分组。</p>
                    )}
                </details>
              </section>
            )}
            {stale && (
              <p
                role="status"
                className="fve:text-sm fve:text-muted-foreground"
              >
                图形和数据仍对应上次运行。运行当前配置后再调整新结果的展示。
              </p>
            )}
          </div>
          <AnalysisPresentationEditor
            showIssues={!result || resultPresentation.layout === 'table'}
            value={resultPresentation}
            plan={resultPlan}
            disabled={!result || stale}
            onChange={presentation =>
              commands.edit(config => ({ ...config, presentation }))
            }
          />
          {error && (
            <div
              role="alert"
              className="fve:flex fve:flex-wrap fve:items-center fve:justify-between fve:gap-2 fve:rounded-md fve:border fve:border-destructive/30 fve:p-3 fve:text-destructive"
            >
              <span>{error}</span>
              {session.queryError && (
                <Button
                  variant="outline"
                  disabled={!canRun}
                  onClick={() => run(() => commands.run())}
                >
                  重试查询
                </Button>
              )}
            </div>
          )}
          {result && resultPlan ? (
            resultPresentation.layout === 'table' ? (
              table
            ) : (
              <AnalysisResultTabs
                key={instance.id}
                table={table}
                issues={projectedResult?.issues}
              >
                <ChartBoundary
                  key={`${instance.id}:${result.receivedAt}:${JSON.stringify(resultPresentation)}`}
                >
                  <Suspense
                    fallback={
                      <p role="status" className="fve:p-8 fve:text-center">
                        正在加载图表…
                      </p>
                    }
                  >
                    <Chart
                      plan={resultPlan}
                      rows={result.rows}
                      presentation={resultPresentation}
                    />
                  </Suspense>
                </ChartBoundary>
              </AnalysisResultTabs>
            )
          ) : (
            <div
              role="status"
              className="fve:flex fve:min-h-64 fve:flex-col fve:items-center fve:justify-center fve:gap-2 fve:text-center fve:text-muted-foreground"
            >
              <p>
                {querying
                  ? '正在获取分析结果…'
                  : session.queryStatus === 'success'
                    ? '分析结果缓存已释放'
                    : '从一个业务问题开始'}
              </p>
              <p className="fve:text-sm">
                {session.queryStatus === 'success'
                  ? '查询配置仍已保留，点击上方“运行分析”重新获取结果。'
                  : '选择统计对象、维度和指标，然后运行分析。'}
              </p>
            </div>
          )}
        </div>
      </div>
      <Dialog open={narrow && mobileOpen} onOpenChange={toggleConfiguration}>
        <DialogContent
          keepMounted
          className="fve:flex fve:max-h-[90dvh] fve:flex-col"
        >
          <DialogHeader>
            <DialogTitle>配置分析</DialogTitle>
            <DialogDescription>
              修改查询配置，关闭后继续查看结果。保存和运行相互独立。
            </DialogDescription>
          </DialogHeader>
          <div
            ref={node => attachEditor(node, narrow)}
            className="fve:min-h-0 fve:overflow-y-auto"
          />
          {editorElement && createPortal(editor, editorElement)}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => toggleConfiguration(false)}
            >
              查看结果
            </Button>
            {runButton}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
