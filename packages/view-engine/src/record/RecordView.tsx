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
  useContext,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListFilterIcon,
  Maximize2Icon,
  Minimize2Icon,
} from 'lucide-react';
import { Button } from '../components/ui/button.js';
import { ButtonGroup } from '../components/ui/button-group.js';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip.js';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../components/ui/dropdown-menu.js';
import { FilterPanel } from '../filter/FilterPanel.js';
import { FilterSelect } from '../filter/FilterSelect.js';
import { cn } from '../lib/utils.js';
import type { ViewEngine } from './ViewEngine.js';
import type { ViewExtensions } from './recordReactTypes.js';
import { RecordRefreshControls } from './RecordRefreshControls.js';
import { useViewExpansion, ViewExpansionContext } from './viewExpansion.js';
import { RecordTable } from './RecordTable.js';
import { RecordColumnSettings } from './RecordColumnSettings.js';
import { RecordRendererBoundary } from './RecordRendererBoundary.js';
import { describeRecordFilter } from './recordFilterSummary.js';

export interface RecordViewProps {
  engine: ViewEngine;
  extensions?: ViewExtensions;
  filterContext?: unknown;
  selectable?: boolean;
  /** Pause periodic reads while the host performs an external business action. */
  autoRefreshPaused?: boolean;
  /** Leading content in the global toolbar, used by ViewPage for saving and instance navigation. */
  toolbarStart?: ReactNode;
  className?: string;
}
/** Renders the selected instance. The caller owns engine.load()/dispose(). */
export function RecordView({
  engine,
  extensions,
  filterContext,
  selectable = false,
  autoRefreshPaused = false,
  className,
  toolbarStart,
}: RecordViewProps) {
  const state = useSyncExternalStore(
    engine.subscribe,
    engine.getSnapshot,
    engine.getSnapshot,
  );
  const [filtersOpen, setFiltersOpen] = useState(true);
  const tableToolbarRef = useRef<HTMLDivElement>(null);
  const [localError, setLocalError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const id = state.selectedInstanceId;
  const session = id ? state.sessions[id] : undefined;
  const definition = state.definition;
  const rootRef = useRef<HTMLElement>(null);
  const inheritedExpansion = useContext(ViewExpansionContext);
  const localExpansion = useViewExpansion(
    rootRef,
    Boolean(session && definition && !inheritedExpansion),
  );
  const expansion = inheritedExpansion ?? localExpansion;
  if (!id || !session || !definition) return null;
  const { instance } = session;
  const appliedFilter = describeRecordFilter(
    instance.config.filter,
    definition.fields,
  );
  const querying = session.queryStatus === 'loading';
  const paged = instance.config.pagination.mode === 'paged';
  const pageCount =
    session.total === null
      ? null
      : Math.max(1, Math.ceil(session.total / instance.config.pagination.size));
  function run(action: () => void | Promise<void>) {
    setLocalError(null);
    try {
      void Promise.resolve(action()).catch(error =>
        setLocalError({
          id: instance.id,
          message: error instanceof Error ? error.message : '操作失败',
        }),
      );
    } catch (error) {
      setLocalError({
        id: instance.id,
        message: error instanceof Error ? error.message : '操作失败',
      });
    }
  }
  const error =
    !session.queryError && localError?.id === id ? localError.message : null;
  const refresh = () => engine.refresh(id);
  function renderActions(kind: 'global' | 'table') {
    const reference = definition?.recordActions?.[kind];
    if (!reference) return null;
    const Actions = (
      kind === 'global' ? extensions?.globalActions : extensions?.tableActions
    )?.[reference.name];
    const label = kind === 'global' ? '全局操作' : '表格操作';
    return (
      <div
        role="group"
        aria-label={label}
        key={`${kind}:${id}`}
        className="fve:flex fve:flex-wrap fve:items-center fve:gap-2"
      >
        {Actions ? (
          <RecordRendererBoundary
            label={label}
            resetKey={[Actions, instance, reference.options]}
          >
            <Actions
              definition={definition!}
              instance={instance}
              filter={instance.config.filter}
              sort={instance.config.sort}
              selectedRowKeys={session!.selectedRowKeys}
              querying={querying}
              options={reference.options}
              refresh={refresh}
            />
          </RecordRendererBoundary>
        ) : (
          <p role="alert" className="fve:text-sm fve:text-destructive">
            未注册{label}：{reference.name}
          </p>
        )}
      </div>
    );
  }
  return (
    <section
      ref={rootRef}
      className={cn(
        'fve-root fve:flex fve:min-w-0 fve:flex-col fve:rounded-lg fve:border fve:bg-background',
        className,
      )}
      aria-label="数据视图"
    >
      <FilterPanel
        key={`filter:${id}`}
        value={instance.config.filter}
        fields={definition.fields}
        onApply={filter => run(() => engine.applyFilter(filter, id))}
        draft={session.filterDraft}
        onDraftChange={draft => engine.setFilterDraft(draft, id)}
        mode={session.filterMode}
        onModeChange={mode => engine.setFilterMode(mode, id)}
        onPendingChange={pending => engine.setFilterPending(pending, id)}
        allowedOperators={definition.allowedOperators}
        editors={definition.filterEditors}
        extensions={extensions}
        context={filterContext}
        querying={querying}
        collapsed={!filtersOpen}
        className="fve:border-t fve:p-3"
        renderToolbar={({
          panelId,
          mode,
          options,
          pending,
          disabled,
          onModeChange,
        }) => (
          <header
            role="group"
            aria-label="全局工具栏"
            className="fve:flex fve:flex-wrap fve:items-center fve:justify-between fve:gap-2 fve:px-3 fve:py-2"
          >
            <div className="fve:flex fve:min-w-0 fve:flex-wrap fve:items-center fve:gap-2">
              {toolbarStart === undefined ? (
                <h1 className="fve:text-lg fve:font-semibold">
                  {definition.title}
                </h1>
              ) : (
                toolbarStart
              )}
            </div>
            <div className="fve:ml-auto fve:flex fve:flex-wrap fve:items-center fve:gap-2">
              <TooltipProvider>
                <Tooltip>
                  <DropdownMenu>
                    <ButtonGroup aria-label="筛选控制">
                      <TooltipTrigger
                        render={<Button variant="outline" size="sm" />}
                        aria-label={filtersOpen ? '收起筛选' : '展开筛选'}
                        aria-expanded={filtersOpen}
                        aria-controls={panelId}
                        aria-describedby={
                          !filtersOpen && pending
                            ? `${panelId}-pending`
                            : undefined
                        }
                        onClick={() => setFiltersOpen(open => !open)}
                      >
                        <ListFilterIcon
                          data-icon="inline-start"
                          aria-hidden="true"
                        />
                        筛选 · {mode === 'simple' ? '简单' : '高级'}
                        {appliedFilter.count > 0 && (
                          <>
                            {' '}
                            ·{' '}
                            <span
                              aria-label={`已应用 ${appliedFilter.count} 项筛选`}
                            >
                              {appliedFilter.count}
                            </span>
                          </>
                        )}
                        {!filtersOpen && pending && (
                          <span id={`${panelId}-pending`}>· 待查询</span>
                        )}
                      </TooltipTrigger>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label="筛选模式"
                            disabled={disabled}
                          />
                        }
                      >
                        <ChevronDownIcon aria-hidden="true" />
                      </DropdownMenuTrigger>
                    </ButtonGroup>
                    <DropdownMenuContent align="end">
                      <DropdownMenuRadioGroup
                        value={mode}
                        onValueChange={next => {
                          if (next !== 'simple' && next !== 'advanced') return;
                          if (
                            options.find(option => option.value === next)
                              ?.disabled
                          )
                            return;
                          onModeChange(next);
                          setFiltersOpen(true);
                        }}
                      >
                        {options.map(option => (
                          <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            closeOnClick
                          >
                            {option.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <TooltipContent className="fve:max-w-md fve:whitespace-pre-wrap">
                    {appliedFilter.count
                      ? `已应用筛选：${appliedFilter.text.length > 600 ? `${appliedFilter.text.slice(0, 600)}…（展开筛选查看全部）` : appliedFilter.text}`
                      : '当前视图未设置额外筛选条件。'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <RecordRefreshControls
                key={`refresh:${id}`}
                engine={engine}
                session={session}
                root={rootRef}
                paused={autoRefreshPaused}
                onRefresh={() => run(refresh)}
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
              {renderActions('global')}
            </div>
          </header>
        )}
      />
      <div
        role="group"
        aria-label="表格工具栏"
        ref={tableToolbarRef}
        tabIndex={-1}
        className="fve:flex fve:flex-wrap fve:items-center fve:justify-between fve:gap-2 fve:border-t fve:px-3 fve:py-2"
      >
        <div className="fve:flex fve:flex-wrap fve:items-center fve:gap-3">
          {selectable && session.selectedRowKeys.length > 0 && (
            <>
              <span
                role="status"
                className="fve:text-sm fve:text-muted-foreground"
              >
                已选本页 {session.selectedRowKeys.length} 条
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  run(() => engine.setSelection([], id));
                  tableToolbarRef.current?.focus();
                }}
              >
                取消选择
              </Button>
            </>
          )}
        </div>
        <div className="fve:ml-auto fve:flex fve:flex-wrap fve:items-center fve:gap-2">
          {renderActions('table')}
          <RecordColumnSettings
            key={id}
            definition={definition}
            columns={instance.config.presentation.table.columns}
            onChange={columns => run(() => engine.setColumns(columns, id))}
          />
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="fve:mx-3 fve:mb-3 fve:flex fve:flex-wrap fve:items-center fve:gap-2 fve:rounded-lg fve:border fve:border-destructive/30 fve:p-3 fve:text-sm fve:text-destructive"
        >
          <span>{error}</span>
        </div>
      )}
      <RecordTable
        key={`table:${id}`}
        className="fve:rounded-none fve:border-x-0 fve:border-b-0"
        definition={definition}
        instance={instance}
        rows={session.rows}
        queryError={session.queryError}
        onQueryRetry={() => run(refresh)}
        pageSummary={session.pageSummary}
        allSummary={session.allSummary}
        onSummaryRetry={() => {
          void engine.refreshSummary(id).catch(() => {});
        }}
        extensions={extensions}
        querying={querying}
        selectable={selectable}
        selectedRowKeys={session.selectedRowKeys}
        onSelectionChange={keys => run(() => engine.setSelection(keys, id))}
        onColumnsChange={columns => run(() => engine.setColumns(columns, id))}
        onSortChange={sort => run(() => engine.setSort(sort, id))}
        refresh={refresh}
      />
      {!session.queryError && (
        <nav
          aria-label="记录分页"
          className="fve:flex fve:flex-wrap fve:items-center fve:justify-between fve:gap-x-4 fve:gap-y-2 fve:border-t fve:px-3 fve:py-2 fve:text-sm"
        >
          <div
            role="status"
            aria-busy={querying || undefined}
            className="fve:min-h-5 fve:text-muted-foreground"
          >
            {querying
              ? null
              : session.total !== null
                ? `共 ${session.total} 条记录`
                : `本页 ${session.rows.length} 条记录`}
          </div>
          <div className="fve:ml-auto fve:flex fve:flex-wrap fve:items-center fve:gap-x-4 fve:gap-y-2">
            <div className="fve:flex fve:items-center fve:gap-2">
              <span>每页</span>
              <FilterSelect
                label="每页记录数"
                value={String(instance.config.pagination.size)}
                onValueChange={size =>
                  run(() => engine.setPageSize(Number(size), id))
                }
                disabled={querying}
                options={[
                  ...new Set([
                    10,
                    20,
                    50,
                    100,
                    instance.config.pagination.size,
                  ]),
                ]
                  .sort((a, b) => a - b)
                  .map(size => ({ value: String(size), label: `${size} 条` }))}
              />
            </div>
            <div className="fve:flex fve:items-center fve:gap-2">
              <span>
                {paged
                  ? `第 ${session.page} / ${pageCount ?? '–'} 页`
                  : `第 ${session.page} 页`}
              </span>
              {paged && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="上一页"
                  disabled={querying || session.page <= 1}
                  onClick={() =>
                    run(() => engine.setPage(session.page - 1, id))
                  }
                >
                  <ChevronLeftIcon aria-hidden="true" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="下一页"
                disabled={
                  querying ||
                  session.queryStatus !== 'success' ||
                  (paged
                    ? pageCount === null || session.page >= pageCount
                    : session.nextCursor === null)
                }
                onClick={() =>
                  run(() =>
                    paged
                      ? engine.setPage(session.page + 1, id)
                      : engine.nextPage(id),
                  )
                }
              >
                <ChevronRightIcon aria-hidden="true" />
              </Button>
            </div>
          </div>
        </nav>
      )}
    </section>
  );
}
