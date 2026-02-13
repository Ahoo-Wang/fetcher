import { Pagination, PaginationProps, Space } from 'antd';
import styles from '../viewer/Viewer.module.css';
import {
  ActiveFilter,
  AvailableFilterGroup,
  EditableFilterPanel,
  FilterPanel,
  FilterPanelRef,
} from '../filter';
import type * as React from 'react';
import { Condition, PagedList } from '@ahoo-wang/fetcher-wow';
import { RefAttributes, useImperativeHandle, useRef } from 'react';
import { FieldDefinition, ViewColumn } from '../viewer';
import { ViewTable, ViewTableActionColumn, ViewTableRef } from '../table';
import {
  PrimaryKeyClickHandlerCapable,
  ViewTableSettingCapable,
} from '../types';
import type { SorterResult } from 'antd/es/table/interface';
import { useViewState, ViewChangeAction } from './';
import { SizeType } from 'antd/es/config-provider/SizeContext';

export interface ViewRef extends ViewTableRef {
  updateTableSize: (size: SizeType) => void;
  reset: () => void;
}

export type FilterMode = 'none' | 'normal' | 'editable';

export interface ViewProps<RecordType>
  extends
    PrimaryKeyClickHandlerCapable<RecordType>,
    ViewTableSettingCapable,
    RefAttributes<ViewRef> {
  fields: FieldDefinition[];
  availableFilters: AvailableFilterGroup[];
  // 外部State
  dataSource: PagedList<RecordType>;
  // 外部State
  showFilter: boolean;
  filterMode: FilterMode;

  defaultActiveFilters?: ActiveFilter[];
  externalActiveFilters?: ActiveFilter[];
  externalUpdateActiveFilters?: (filters: ActiveFilter[]) => void;
  defaultColumns: ViewColumn[];
  externalColumns?: ViewColumn[];
  externalUpdateColumns?: (columns: ViewColumn[]) => void;

  defaultPage?: number;
  externalPage?: number;
  externalUpdatePage?: (page: number) => void;
  defaultPageSize: number;
  externalPageSize?: number;
  externalUpdatePageSize?: (pageSize: number) => void;
  defaultTableSize: SizeType;
  externalTableSize?: SizeType;
  externalUpdateTableSize?: (size: SizeType) => void;
  defaultSorter?: SorterResult<RecordType>[];
  externalSorter?: SorterResult<RecordType>[];
  externalUpdateSorter?: (sorter: SorterResult<RecordType>[]) => void;
  defaultCondition?: Condition;
  externalCondition?: Condition;
  externalUpdateCondition?: (condition: Condition) => void;

  actionColumn?: ViewTableActionColumn<RecordType>;

  pagination:
    | false
    | Omit<PaginationProps, 'onChange' | 'onShowSizeChange' | 'total'>;

  enableRowSelection: boolean;
  onChange?: ViewChangeAction<RecordType>;
  onSelectedDataChange?: (data: RecordType[]) => void;
}

export function View<RecordType>({
  ref,
  fields,
  availableFilters,
  dataSource,
  actionColumn,
  showFilter,
  filterMode,
  pagination,
  enableRowSelection,
  viewTableSetting,
  onClickPrimaryKey,
  onSelectedDataChange,
  ...viewState
}: ViewProps<RecordType>) {
  const {
    page,
    setPage,
    activeFilters,
    setActiveFilters,
    columns,
    setColumns,
    pageSize,
    setPageSize,
    tableSize,
    setTableSize,
    setCondition,
    setSorter,
    selectedCount,
    updateSelectedCount,
    reset,
  } = useViewState<RecordType>(viewState);

  const handleSearch = (condition: Condition) => {
    setCondition(condition);
  };

  const handlePaginationChange = (
    currentPage: number,
    currentPageSize: number,
  ) => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
    if (pageSize !== currentPageSize) {
      setPageSize(currentPageSize);
    }
  };

  const handleTableSelectedDataChange = (data: RecordType[]) => {
    onSelectedDataChange?.(data);
    updateSelectedCount(data.length);
  };

  const handleSortChanged = (
    sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
  ) => {
    if (Array.isArray(sorter)) {
      setSorter(sorter.map(it => ({ ...it })));
    } else {
      setSorter([{ ...sorter }]);
    }
  };

  const editableFilterPanelRef = useRef<FilterPanelRef | null>(null);
  const viewTableRef = useRef<ViewTableRef | null>(null);

  const resetFn = () => {
    reset();
    editableFilterPanelRef.current?.reset();
    viewTableRef.current?.reset();
  };

  const clearSelectedRowKeysFn = () => {
    viewTableRef.current?.clearSelectedRowKeys();
  };

  useImperativeHandle<ViewRef, ViewRef>(ref, () => ({
    clearSelectedRowKeys: clearSelectedRowKeysFn,
    updateTableSize: setTableSize,
    reset: resetFn,
  }));

  return (
    <Space orientation="vertical" style={{ display: 'flex' }} size="small">
      {filterMode === 'editable' && (
        <div
          className={styles.filterPanel}
          style={{ display: showFilter ? 'block' : 'none' }}
        >
          <EditableFilterPanel
            ref={editableFilterPanelRef}
            filters={activeFilters}
            availableFilters={availableFilters}
            resetButton={false}
            onSearch={handleSearch}
            onChange={setActiveFilters}
          />
        </div>
      )}
      {filterMode === 'normal' && (
        <div
          className={styles.filterPanel}
          style={{ display: showFilter ? 'block' : 'none' }}
        >
          <FilterPanel
            ref={editableFilterPanelRef}
            filters={activeFilters}
            resetButton={false}
            onSearch={handleSearch}
          />
        </div>
      )}
      <ViewTable<RecordType>
        ref={viewTableRef}
        dataSource={dataSource.list}
        fields={fields}
        columns={columns}
        onColumnsChange={setColumns}
        tableSize={tableSize}
        actionColumn={actionColumn}
        onSortChanged={handleSortChanged}
        onSelectChange={handleTableSelectedDataChange}
        attributes={{ pagination: false }}
        enableRowSelection={enableRowSelection}
        onClickPrimaryKey={onClickPrimaryKey}
        viewTableSetting={viewTableSetting || false}
      ></ViewTable>
      {(pagination !== false || enableRowSelection) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{selectedCount ? `已选择 ${selectedCount} 条数据` : ''}</span>
          <Pagination
            showTotal={total => `共 ${total} 条数据`}
            defaultCurrent={page}
            current={page}
            pageSize={pageSize || 10}
            total={dataSource.total}
            pageSizeOptions={['10', '20', '50', '100']}
            {...pagination}
            onChange={handlePaginationChange}
          />
        </div>
      )}
    </Space>
  );
}
