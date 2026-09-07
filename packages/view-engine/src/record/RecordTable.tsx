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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  InboxIcon,
  CircleAlertIcon,
  EllipsisIcon,
} from 'lucide-react';
import { SortDirection } from '@ahoo-wang/fetcher-wow';
import {
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  functionalUpdate,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type Column,
} from '@tanstack/react-table';
import { Button } from '../components/ui/button.js';
import { Checkbox } from '../components/ui/checkbox.js';
import { Spinner } from '../components/ui/spinner.js';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from '../components/ui/popover.js';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '../components/ui/tooltip.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableFooter,
  TableRow,
} from '../components/ui/table.js';
import { cn } from '../lib/utils.js';
import {
  RECORD_COLUMN_DEFAULT_WIDTH,
  RECORD_COLUMN_MAX_WIDTH,
  RECORD_COLUMN_MIN_WIDTH,
  RECORD_SUMMARY_LABELS,
  formatRecordNumber,
  type RecordSummaryFunction,
  getRecordColumnPinning,
  orderRecordColumns,
  type RecordColumn,
  type RecordData,
  type RecordKey,
  type RecordSummaryResult,
  type ViewFieldDefinition,
} from './recordModel.js';
import type { RecordTableProps } from './recordReactTypes.js';
import { getRecordKey, readRecordValue } from './recordValidation.js';
import { RecordRendererBoundary } from './RecordRendererBoundary.js';

const summaryOrder = Object.keys(
  RECORD_SUMMARY_LABELS,
) as RecordSummaryFunction[];

const features = tableFeatures({
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  rowSortingFeature,
});

function displayValue(value: unknown, field: ViewFieldDefinition): string {
  if (value === null || value === undefined) return '—';
  const option = field.options?.find(option => Object.is(option.value, value));
  if (option) return option.label;
  if (
    (field.type === 'date' || field.type === 'datetime') &&
    (typeof value === 'string' ||
      typeof value === 'number' ||
      value instanceof Date)
  ) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
      return value;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isFinite(date.getTime()))
      return new Intl.DateTimeFormat('zh-CN', {
        timeZone: field.timeZone,
        dateStyle: 'medium',
        ...(field.type === 'datetime' ? { timeStyle: 'medium' } : {}),
      }).format(date);
  }
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (typeof value === 'number') return formatRecordNumber(value, field);
  if (typeof value === 'object') return JSON.stringify(value) ?? '—';
  return String(value);
}

function RecordCell({
  column,
  record,
  rowKey,
  index,
  definition,
  instance,
  extensions,
  refresh,
  compact = false,
}: Pick<
  RecordTableProps,
  'definition' | 'instance' | 'extensions' | 'refresh'
> & {
  column: RecordColumn;
  record: RecordData;
  rowKey: RecordKey;
  index: number;
  compact?: boolean;
}) {
  if (column.kind === 'actions') {
    const reference = column.renderer ?? definition.recordActions?.row;
    const Renderer = reference && extensions?.rowActions?.[reference.name];
    if (!Renderer)
      return (
        <span role="alert">
          {reference
            ? `未注册行操作渲染器：${reference.name}`
            : '操作列未配置渲染器'}
        </span>
      );
    const actions = (
      <Renderer
        definition={definition}
        instance={instance}
        filter={instance.config.filter}
        sort={instance.config.sort}
        options={reference?.options}
        refresh={refresh}
        record={record}
        rowKey={rowKey}
      />
    );
    if (!compact) return actions;
    const label = `记录 ${rowKey} ${column.title ?? '操作'}`;
    return (
      <Popover>
        <PopoverTrigger
          aria-label={label}
          render={<Button type="button" variant="ghost" size="icon-sm" />}
        >
          <EllipsisIcon aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent align="end">
          <PopoverTitle>{label}</PopoverTitle>
          <div className="fve:flex fve:flex-wrap fve:items-center fve:gap-2">
            {actions}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
  const field = definition.fields.find(field => field.field === column.field);
  if (!field) return <span role="alert">未知字段：{column.field}</span>;
  const value = readRecordValue(record, column.field);
  const reference = column.renderer ?? field.cellRenderer;
  if (reference) {
    const Renderer = extensions?.cells?.[reference.name];
    if (!Renderer)
      return <span role="alert">未注册单元格渲染器：{reference.name}</span>;
    return (
      <Renderer
        value={value}
        record={record}
        rowKey={rowKey}
        index={index}
        field={field}
        column={column}
        definition={definition}
        instance={instance}
        options={reference.options}
      />
    );
  }
  const text = displayValue(value, field);
  if (compact && column.field === definition.rowKey) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={<span tabIndex={0} />}
            aria-label={text}
            className="fve:flex fve:min-w-0 fve:outline-none fve:focus-visible:ring-2 fve:focus-visible:ring-ring"
          >
            {text.length > 6 ? (
              <>
                <span className="fve:min-w-0 fve:truncate">
                  {text.slice(0, -4)}
                </span>
                <span className="fve:shrink-0">{text.slice(-4)}</span>
              </>
            ) : (
              text
            )}
          </TooltipTrigger>
          <TooltipContent>{text}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return (
    <span className="fve:break-words" title={text}>
      {text}
    </span>
  );
}

function SummaryError({
  label,
  error,
  onRetry,
  fallback,
}: {
  label: string;
  error: string;
  onRetry?: () => void;
  fallback: RefObject<HTMLSpanElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <span role="alert" className="fve:sr-only">
        {label}汇总失败
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          ref={trigger}
          aria-label={`${label}汇总失败，查看详情`}
          title={`${label}汇总失败`}
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="fve:h-6 fve:gap-0.5 fve:px-0 fve:text-xs fve:text-destructive"
            />
          }
        >
          {label}
          <CircleAlertIcon aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="fve:w-80 fve:max-w-[calc(100vw-2rem)]"
          finalFocus={() => trigger.current ?? fallback.current ?? false}
        >
          <PopoverHeader>
            <PopoverTitle>{label}汇总失败</PopoverTitle>
            <PopoverDescription className="fve:break-words">
              {error}
            </PopoverDescription>
          </PopoverHeader>
          {onRetry && (
            <Button
              type="button"
              size="sm"
              className="fve:self-start"
              onClick={() => {
                setOpen(false);
                onRetry();
              }}
            >
              重试汇总
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}

function SummaryScope({
  label,
  result,
  onRetry,
}: {
  label: string;
  result?: RecordSummaryResult;
  onRetry?: () => void;
}) {
  const scope = useRef<HTMLSpanElement>(null);
  return (
    <span
      ref={scope}
      tabIndex={-1}
      aria-label={`${label}汇总状态`}
      title={label === '所有' ? '当前已查询条件下的所有记录' : '当前页记录'}
      className="fve:flex fve:h-6 fve:items-center fve:justify-center fve:gap-0.5 fve:text-xs fve:leading-5 fve:text-muted-foreground fve:outline-none fve:focus-visible:ring-2 fve:focus-visible:ring-ring"
    >
      {result?.status === 'error' ? (
        <SummaryError
          label={label}
          error={result.error ?? '暂时无法完成汇总。'}
          onRetry={onRetry}
          fallback={scope}
        />
      ) : (
        <>
          {label}
          {result?.status === 'loading' && (
            <Spinner
              className="fve:size-3 fve:shrink-0"
              aria-label={`${label}汇总加载中`}
            />
          )}
        </>
      )}
    </span>
  );
}

export function RecordTable({
  definition,
  instance,
  rows,
  extensions,
  querying,
  queryError,
  onQueryRetry,
  pageSummary,
  allSummary,
  onSummaryRetry,
  selectable = false,
  selectedRowKeys,
  onSelectionChange,
  onColumnsChange,
  onSortChange,
  refresh,
  className,
}: RecordTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) =>
      setAvailableWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const columns = useMemo(
    () =>
      orderRecordColumns(
        instance.config.presentation.table.columns,
        definition.rowKey,
      ),
    [instance.config.presentation.table.columns, definition.rowKey],
  );
  const byId = new Map(
    columns.map(column => [JSON.stringify(column.id), column]),
  );
  const columnDefs = useMemo<ColumnDef<typeof features, RecordData>[]>(
    () =>
      columns.map(column => ({
        id: JSON.stringify(column.id),
        ...(column.kind === 'field'
          ? {
              accessorFn: (record: RecordData) =>
                readRecordValue(record, column.field),
            }
          : {}),
        enableSorting:
          column.kind === 'field' &&
          definition.fields.some(
            field => field.field === column.field && field.sortable === true,
          ),
        minSize: RECORD_COLUMN_MIN_WIDTH,
        maxSize: RECORD_COLUMN_MAX_WIDTH,
        size: column.width ?? RECORD_COLUMN_DEFAULT_WIDTH,
      })),
    [columns, definition.fields],
  );
  const sortColumnIds = new Map<string, string>();
  for (const column of columns)
    if (column.kind === 'field' && !sortColumnIds.has(column.field))
      sortColumnIds.set(column.field, JSON.stringify(column.id));
  const sorting = instance.config.sort.map(sort => ({
    id: sortColumnIds.get(sort.field) ?? JSON.stringify([sort.field]),
    desc: sort.direction === SortDirection.DESC,
  }));
  const sortFields = new Map(
    sorting.map((sort, index) => [sort.id, instance.config.sort[index].field]),
  );
  for (const column of columns)
    if (column.kind === 'field')
      sortFields.set(JSON.stringify(column.id), column.field);
  const columnSizing = Object.fromEntries(
    columns.map(column => [
      JSON.stringify(column.id),
      column.width ?? RECORD_COLUMN_DEFAULT_WIDTH,
    ]),
  );
  const visibleConfigured = columns.filter(column => column.visible !== false);
  const centerMinimum = visibleConfigured.some(
    column => column.kind === 'field' && column.field !== definition.rowKey,
  )
    ? 128
    : 0;
  const pinnedWidth = visibleConfigured.reduce(
    (total, column) =>
      total +
      (getRecordColumnPinning(column, definition.rowKey)
        ? columnSizing[JSON.stringify(column.id)]
        : 0),
    selectable ? 48 : 0,
  );
  const compact =
    availableWidth > 0 && pinnedWidth + centerMinimum > availableWidth;
  function effectivePinning(column: RecordColumn) {
    if (
      compact &&
      column.kind === 'field' &&
      column.field !== definition.rowKey
    )
      return false;
    return getRecordColumnPinning(column, definition.rowKey);
  }
  if (compact) {
    const actions = visibleConfigured.filter(
      column => column.kind === 'actions',
    );
    const keys = visibleConfigured.filter(
      column => column.kind === 'field' && column.field === definition.rowKey,
    );
    const keyBudget =
      (availableWidth -
        (selectable ? 48 : 0) -
        actions.length * RECORD_COLUMN_MIN_WIDTH -
        centerMinimum) /
      Math.max(1, keys.length);
    for (const column of actions)
      columnSizing[JSON.stringify(column.id)] = RECORD_COLUMN_MIN_WIDTH;
    for (const column of keys)
      columnSizing[JSON.stringify(column.id)] = Math.max(
        RECORD_COLUMN_MIN_WIDTH,
        Math.min(
          columnSizing[JSON.stringify(column.id)],
          Math.floor(keyBudget),
        ),
      );
  }
  const automatic = visibleConfigured.filter(
    column =>
      column.kind === 'field' &&
      column.width === undefined &&
      !getRecordColumnPinning(column, definition.rowKey) &&
      !definition.fields.find(field => field.field === column.field)?.options
        ?.length &&
      definition.fields.find(field => field.field === column.field)?.type ===
        'string',
  );
  const minimumWidth = visibleConfigured.reduce(
    (total, column) => total + columnSizing[JSON.stringify(column.id)],
    selectable ? 48 : 0,
  );
  const extraPerColumn = automatic.length
    ? Math.max(0, availableWidth - minimumWidth) / automatic.length
    : 0;
  for (const column of automatic)
    columnSizing[JSON.stringify(column.id)] = Math.min(
      480,
      RECORD_COLUMN_DEFAULT_WIDTH + extraPerColumn,
    );
  const rowSelection = Object.fromEntries(
    selectedRowKeys.map(key => [JSON.stringify(key), true as const]),
  );
  const columnPinning = {
    start: columns
      .filter(column => effectivePinning(column) === 'left')
      .map(column => JSON.stringify(column.id)),
    end: columns
      .filter(column => effectivePinning(column) === 'right')
      .map(column => JSON.stringify(column.id)),
  };
  const table = useTable({
    features,
    columns: columnDefs,
    data: rows,
    getRowId: record => JSON.stringify(getRecordKey(record, definition.rowKey)),
    manualSorting: true,
    sortDescFirst: false,
    enableMultiSort: true,
    enableRowSelection: selectable,
    enableSubRowSelection: false,
    columnResizeMode: 'onEnd',
    state: {
      sorting,
      rowSelection,
      columnSizing,
      columnPinning,
      columnOrder: columns.map(column => JSON.stringify(column.id)),
      columnVisibility: Object.fromEntries(
        columns.map(column => [
          JSON.stringify(column.id),
          column.visible !== false,
        ]),
      ),
    },
    onSortingChange: updater =>
      onSortChange(
        functionalUpdate(updater, sorting).map(sort => ({
          field: sortFields.get(sort.id)!,
          direction: sort.desc ? SortDirection.DESC : SortDirection.ASC,
        })),
      ),
    onRowSelectionChange: updater => {
      const next = functionalUpdate(updater, rowSelection);
      const keys = new Map(
        rows.map(record => {
          const key = getRecordKey(record, definition.rowKey);
          return [JSON.stringify(key), key] as const;
        }),
      );
      onSelectionChange(
        [...keys].filter(([id]) => next[id]).map(([, key]) => key),
      );
    },
    onColumnSizingChange: updater => {
      const resizing = table.state.columnResizing;
      const next = functionalUpdate(updater, columnSizing);
      // The transient delta can lag mouseup inside TanStack's batch; compare the final sizes.
      if (
        resizing.isResizingColumn &&
        resizing.columnSizingStart.length &&
        resizing.columnSizingStart.every(
          ([id, width]) =>
            Math.round((next[id] ?? width) * 100) === Math.round(width * 100),
        )
      )
        return;
      const changed = columns.map(column => {
        const width = Math.min(
          RECORD_COLUMN_MAX_WIDTH,
          Math.max(
            RECORD_COLUMN_MIN_WIDTH,
            next[JSON.stringify(column.id)] ?? RECORD_COLUMN_DEFAULT_WIDTH,
          ),
        );
        // TanStack rounds mouse resize output to two decimals, including zero-distance drags.
        return Math.round(width * 100) ===
          Math.round(columnSizing[JSON.stringify(column.id)] * 100)
          ? column
          : { ...column, width };
      });
      if (changed.some((column, index) => column !== columns[index]))
        onColumnsChange(changed);
    },
  });
  const visibleColumns = [
    ...table.getStartVisibleLeafColumns(),
    ...table.getCenterVisibleLeafColumns(),
    ...table.getEndVisibleLeafColumns(),
  ];
  const contentWidth = table.getTotalSize() + (selectable ? 48 : 0);
  const compactPinnedWidth = visibleColumns.reduce(
    (total, column) => total + (column.getIsPinned() ? column.getSize() : 0),
    selectable ? 48 : 0,
  );
  const insufficientWidth =
    compact && availableWidth - compactPinnedWidth < centerMinimum;
  const relaxedPinning =
    compact &&
    visibleConfigured.some(
      column =>
        column.kind === 'field' &&
        column.field !== definition.rowKey &&
        getRecordColumnPinning(column, definition.rowKey),
    );
  const fillerWidth = Math.max(0, availableWidth - contentWidth);
  const firstEnd = visibleColumns.findIndex(
    column => column.getIsPinned() === 'end',
  );
  // Unused space stays before right-pinned columns when every field has an explicit width.
  function withFiller<T>(items: T[]): (T | null)[] {
    if (fillerWidth < 1) return items;
    const index = firstEnd < 0 ? items.length : firstEnd;
    return [...items.slice(0, index), null, ...items.slice(index)];
  }
  function columnStyle(
    column: Column<typeof features, RecordData>,
  ): CSSProperties {
    const pinned = column.getIsPinned();
    const configured = byId.get(column.id)!;
    const numeric =
      configured.kind === 'field' &&
      definition.fields.some(
        field => field.field === configured.field && field.type === 'number',
      );
    return {
      width: column.getSize(),
      textAlign: numeric ? 'right' : undefined,
      fontVariantNumeric: numeric ? 'tabular-nums' : undefined,
      left:
        pinned === 'start'
          ? column.getStart('start') + (selectable ? 48 : 0)
          : undefined,
      right: pinned === 'end' ? column.getAfter('end') : undefined,
    };
  }
  const hasSummary = visibleColumns.some(column => {
    const configured = byId.get(column.id);
    return configured?.kind === 'field' && !!configured.summary?.length;
  });
  const summaryLabelColumns = [];
  for (const column of visibleColumns) {
    const configured = byId.get(column.id)!;
    if (
      column.getIsPinned() !== 'start' ||
      (configured.kind === 'field' && configured.summary?.length)
    )
      break;
    summaryLabelColumns.push(column);
  }
  const summaryLabelSpan = summaryLabelColumns.length + (selectable ? 1 : 0);
  const summaryLabelWidth = summaryLabelColumns.reduce(
    (width, column) => width + column.getSize(),
    selectable ? 48 : 0,
  );
  const summaries = [
    { label: '本页', result: pageSummary },
    { label: '所有', result: allSummary },
  ];
  const failure =
    !querying && queryError ? (
      <div
        role="alert"
        aria-label="查询失败"
        className="fve:flex fve:flex-wrap fve:items-center fve:justify-center fve:gap-2 fve:p-3 fve:text-sm fve:text-destructive"
      >
        <CircleAlertIcon
          aria-hidden="true"
          className="fve:size-5 fve:shrink-0"
        />
        <span className="fve:break-words">{queryError}</span>
        {rows.length > 0 && (
          <span className="fve:text-muted-foreground">显示上次查询结果</span>
        )}
        {onQueryRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              containerRef.current?.focus();
              onQueryRetry();
            }}
          >
            重试查询
          </Button>
        )}
      </div>
    ) : null;
  const statusStyle: CSSProperties = {
    width: availableWidth ? Math.max(0, availableWidth - 24) : undefined,
  };
  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      aria-label="记录结果"
      className={cn(
        'fve-root fve:isolate fve:min-w-0 fve:max-w-full fve:overflow-hidden fve:rounded-lg fve:border fve:outline-none fve:focus-visible:ring-2 fve:focus-visible:ring-inset fve:focus-visible:ring-ring',
        className,
      )}
      aria-busy={querying || undefined}
    >
      {insufficientWidth ? (
        <p
          role="status"
          className="fve:m-0 fve:px-3 fve:py-2 fve:text-xs fve:text-muted-foreground"
        >
          空间不足，请展开视图或减少显示列。
        </p>
      ) : relaxedPinning ? (
        <p
          role="status"
          className="fve:m-0 fve:px-3 fve:py-2 fve:text-xs fve:text-muted-foreground"
        >
          空间有限，仅固定主键和操作列；其他固定设置在宽度恢复后生效。
        </p>
      ) : null}
      <Table
        className="fve-record-table fve:table-fixed fve:border-separate fve:border-spacing-0"
        style={{ width: contentWidth + (fillerWidth >= 1 ? fillerWidth : 0) }}
        aria-label={instance.title}
      >
        <colgroup>
          {selectable && <col style={{ width: 48 }} />}
          {withFiller(visibleColumns).map(column =>
            column ? (
              <col key={column.id} style={{ width: column.getSize() }} />
            ) : (
              <col key="space" style={{ width: fillerWidth }} />
            ),
          )}
        </colgroup>
        <TableHeader>
          {table.getHeaderGroups().map(group => (
            <TableRow key={group.id}>
              {selectable && (
                <TableHead scope="col" data-pinned="start" style={{ left: 0 }}>
                  <Checkbox
                    aria-label="选择当前页"
                    checked={table.getIsAllPageRowsSelected()}
                    indeterminate={
                      table.getIsSomePageRowsSelected() &&
                      !table.getIsAllPageRowsSelected()
                    }
                    disabled={!rows.length}
                    onCheckedChange={checked =>
                      table.toggleAllPageRowsSelected(checked)
                    }
                  />
                </TableHead>
              )}
              {withFiller(group.headers).map(header => {
                if (!header)
                  return <TableHead key="space" aria-hidden="true" />;
                const column = byId.get(header.column.id)!;
                const field =
                  column.kind === 'field'
                    ? definition.fields.find(
                        field => field.field === column.field,
                      )
                    : undefined;
                const title =
                  column.title ??
                  field?.label ??
                  (column.kind === 'field' ? column.field : '操作');
                const sortingColumn =
                  column.kind === 'field'
                    ? table.getColumn(sortColumnIds.get(column.field)!)
                    : undefined;
                const direction = sortingColumn?.getIsSorted();
                const Icon =
                  direction === 'asc'
                    ? ArrowUpIcon
                    : direction === 'desc'
                      ? ArrowDownIcon
                      : ArrowUpDownIcon;
                return (
                  <TableHead
                    key={header.id}
                    scope="col"
                    className="fve:relative fve:whitespace-normal fve:pr-3"
                    style={columnStyle(header.column)}
                    data-pinned={header.column.getIsPinned() || undefined}
                    aria-sort={
                      direction === 'asc'
                        ? 'ascending'
                        : direction === 'desc'
                          ? 'descending'
                          : undefined
                    }
                  >
                    {header.column.getCanSort() ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'fve:h-auto fve:w-full fve:min-w-0 fve:px-0 fve:py-1',
                          field?.type === 'number'
                            ? 'fve:justify-end'
                            : 'fve:justify-start',
                        )}
                        aria-label={`${title}排序：${direction === 'asc' ? '升序' : direction === 'desc' ? '降序' : '未排序'}`}
                        title="点击排序，按住 Shift 添加排序"
                        onClick={sortingColumn?.getToggleSortingHandler()}
                      >
                        <span className="fve:min-w-0 fve:whitespace-normal fve:break-words fve:text-left">
                          {title}
                        </span>
                        <Icon data-icon="inline-end" />
                        {direction && sorting.length > 1 && (
                          <span aria-hidden="true">
                            {sortingColumn!.getSortIndex() + 1}
                          </span>
                        )}
                      </Button>
                    ) : (
                      <span className="fve:break-words">{title}</span>
                    )}
                    {!(
                      compact &&
                      (column.kind === 'actions' ||
                        column.field === definition.rowKey)
                    ) && (
                      <div
                        role="separator"
                        aria-label={`调整${title}列宽`}
                        aria-orientation="vertical"
                        aria-valuemin={RECORD_COLUMN_MIN_WIDTH}
                        aria-valuemax={RECORD_COLUMN_MAX_WIDTH}
                        aria-valuenow={header.getSize()}
                        tabIndex={0}
                        className={cn(
                          'fve:absolute fve:inset-y-0 fve:right-0 fve:w-2 fve:cursor-col-resize fve:touch-none fve:border-border fve:select-none fve:hover:bg-accent fve:focus-visible:outline-2 fve:focus-visible:outline-ring',
                          // Left-pinned cells already draw their right separator; only add the moving guide during resizing.
                          (header.column.getIsPinned() !== 'start' ||
                            header.column.getIsResizing()) &&
                            'fve:border-r',
                        )}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onKeyDown={event => {
                          const delta =
                            event.key === 'ArrowLeft'
                              ? -10
                              : event.key === 'ArrowRight'
                                ? 10
                                : 0;
                          if (delta) {
                            event.preventDefault();
                            table.setColumnSizing(old => ({
                              ...old,
                              [header.column.id]: header.getSize() + delta,
                            }));
                          }
                        }}
                        style={
                          header.column.getIsResizing()
                            ? {
                                transform: `translateX(${table.state.columnResizing.deltaOffset ?? 0}px)`,
                              }
                            : undefined
                        }
                      />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length > 0 && failure && (
            <TableRow>
              <TableCell
                colSpan={
                  withFiller(visibleColumns).length + (selectable ? 1 : 0)
                }
              >
                <div
                  className="fve:sticky fve:left-0 fve:max-w-full"
                  style={statusStyle}
                >
                  {failure}
                </div>
              </TableCell>
            </TableRow>
          )}
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
              >
                {selectable && (
                  <TableCell data-pinned="start" style={{ left: 0 }}>
                    <Checkbox
                      aria-label={`选择记录 ${String(getRecordKey(row.original, definition.rowKey))}`}
                      checked={row.getIsSelected()}
                      onCheckedChange={checked => row.toggleSelected(checked)}
                    />
                  </TableCell>
                )}
                {withFiller(row.getVisibleCells()).map(cell => {
                  if (!cell)
                    return <TableCell key="space" aria-hidden="true" />;
                  const column = byId.get(cell.column.id)!;
                  return (
                    <TableCell
                      key={cell.id}
                      className="fve:overflow-hidden fve:whitespace-normal fve:break-words"
                      style={columnStyle(cell.column)}
                      data-pinned={cell.column.getIsPinned() || undefined}
                    >
                      <RecordRendererBoundary
                        label={
                          column.title ??
                          (column.kind === 'actions' ? '行操作' : column.field)
                        }
                        resetKey={[
                          row.original,
                          column,
                          definition,
                          instance,
                          extensions,
                        ]}
                      >
                        <RecordCell
                          column={column}
                          record={row.original}
                          rowKey={getRecordKey(row.original, definition.rowKey)}
                          index={row.index}
                          definition={definition}
                          instance={instance}
                          extensions={extensions}
                          refresh={refresh}
                          compact={compact}
                        />
                      </RecordRendererBoundary>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={
                  withFiller(visibleColumns).length + (selectable ? 1 : 0)
                }
                className="fve:h-24 fve:text-center"
              >
                <div
                  className="fve:sticky fve:left-0 fve:flex fve:max-w-full fve:justify-center"
                  style={statusStyle}
                >
                  {querying ? (
                    <Spinner aria-label="正在加载记录" />
                  ) : failure ? (
                    failure
                  ) : (
                    <InboxIcon
                      role="img"
                      aria-label="暂无记录"
                      className="fve:size-6 fve:text-muted-foreground"
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {hasSummary && (
          <TooltipProvider>
            <TableFooter aria-label="汇总">
              {summaries.map(({ label, result }) => (
                <TableRow
                  key={label}
                  aria-label={`${label}汇总`}
                  aria-busy={result?.status === 'loading' || undefined}
                >
                  {summaryLabelSpan > 0 && (
                    <TableHead
                      scope="row"
                      aria-label={label}
                      colSpan={summaryLabelSpan}
                      data-pinned="start"
                      style={{ left: 0, width: summaryLabelWidth }}
                      className="fve:h-auto fve:px-1 fve:py-2 fve:align-middle fve:text-xs fve:leading-5 fve:font-normal fve:text-muted-foreground"
                    >
                      <SummaryScope
                        label={label}
                        result={result}
                        onRetry={label === '所有' ? onSummaryRetry : undefined}
                      />
                    </TableHead>
                  )}
                  {withFiller(visibleColumns).map((column, index) => {
                    if (index < summaryLabelColumns.length) return null;
                    if (!column)
                      return <TableCell key="space" aria-hidden="true" />;
                    const configured = byId.get(column.id)!;
                    const field =
                      configured.kind === 'field'
                        ? definition.fields.find(
                            field => field.field === configured.field,
                          )
                        : undefined;
                    const scopeCell =
                      !summaryLabelSpan && column.id === visibleColumns[0]?.id;
                    const Cell = scopeCell ? TableHead : TableCell;
                    return (
                      <Cell
                        key={column.id}
                        scope={scopeCell ? 'row' : undefined}
                        aria-label={scopeCell ? label : undefined}
                        className={cn(
                          'fve:h-auto fve:py-2 fve:font-normal',
                          scopeCell ? 'fve:align-middle' : 'fve:align-top',
                        )}
                        style={columnStyle(column)}
                        data-pinned={column.getIsPinned() || undefined}
                      >
                        {scopeCell && (
                          <SummaryScope
                            label={label}
                            result={result}
                            onRetry={
                              label === '所有' ? onSummaryRetry : undefined
                            }
                          />
                        )}
                        {configured.kind === 'field' &&
                          field &&
                          summaryOrder
                            .filter(summary =>
                              configured.summary?.includes(summary),
                            )
                            .map(summary => {
                              const value =
                                result?.values[configured.id]?.[summary];
                              const success =
                                result?.status === 'success' &&
                                typeof value === 'number';
                              const metricLabel = `${configured.title ?? field.label}${RECORD_SUMMARY_LABELS[summary]}`;
                              const formatted = success
                                ? formatRecordNumber(value, field)
                                : undefined;
                              return (
                                <div
                                  key={summary}
                                  role="group"
                                  aria-label={metricLabel}
                                  className="fve:grid fve:grid-cols-[auto_minmax(0,1fr)] fve:items-baseline fve:gap-2 fve:leading-5"
                                >
                                  <span className="fve:whitespace-nowrap fve:text-xs fve:font-normal fve:text-muted-foreground">
                                    {RECORD_SUMMARY_LABELS[summary]}
                                  </span>
                                  {success ? (
                                    <Tooltip>
                                      <TooltipTrigger
                                        render={<span tabIndex={0} />}
                                        aria-label={`${label}${metricLabel}：${formatted}`}
                                        className="fve:min-w-0 fve:truncate fve:text-right fve:font-medium fve:tabular-nums fve:outline-none fve:focus-visible:ring-2 fve:focus-visible:ring-ring"
                                      >
                                        {formatted}
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        原值：{String(value)}
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span className="fve:min-w-0 fve:truncate fve:text-right fve:font-medium fve:tabular-nums">
                                      {result?.status === 'loading'
                                        ? null
                                        : '—'}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                      </Cell>
                    );
                  })}
                </TableRow>
              ))}
            </TableFooter>
          </TooltipProvider>
        )}
      </Table>
    </div>
  );
}
