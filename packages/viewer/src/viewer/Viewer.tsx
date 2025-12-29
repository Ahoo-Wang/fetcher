import { ViewTable, ViewTableActionColumn } from '../table';
import { Layout, Modal, Pagination, PaginationProps, Space } from 'antd';
import { EditableFilterPanel } from '../filter';
import { View, ViewDefinition, ViewPanel } from './';
import styles from './Viewer.module.css';
import { ActionItem } from '../types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Condition, Operator } from '@ahoo-wang/fetcher-wow';
import { BarItemType, TopBar } from '../topbar';
import type { SorterResult } from 'antd/es/table/interface';
import type * as React from 'react';
import { useTableStateReducer } from './useTableStateReducer';
import { useFilterStateReducer } from './useFilterStateReducer';
import { TableStateContextProvider } from './TableStateContext';
import { FilterStateContextProvider } from './FilterStateContext';

const { Header, Footer, Sider, Content } = Layout;

/**
 * Ref interface for the Viewer component.
 *
 * Provides imperative methods to control the viewer from parent components.
 */
export interface ViewerRef {
  /** Refreshes the data by re-executing the current query */
  refreshData: () => void;
}

export type ViewManagement =
  | {
      enabled: false;
    }
  | {
      enabled: true;
      onCreateView?: (view: View) => void;
      onDeleteView?: (view: View) => void;
      onUpdateView?: (view: View) => void;
    };

export interface BatchOperationConfig<RecordType> {
  enabled: boolean;
  title: string;
  key: string;
  actions: ActionItem<RecordType>[];
}

export interface ViewerProps<RecordType> {
  views: View[];
  defaultView?: View;
  definition: ViewDefinition;
  actionColumn?: ViewTableActionColumn<RecordType>;
  paginationProps?: Omit<PaginationProps, 'onChange' | 'onShowSizeChange'>;

  dataSource: RecordType[];

  viewManagement: ViewManagement;

  supportedTopbarItems: BarItemType[];

  batchOperationConfig?: BatchOperationConfig<RecordType>;

  primaryAction?: ActionItem<RecordType>;
  secondaryActions?: ActionItem<RecordType>[];

  // click primary key
  onClickPrimaryKey?: (id: any, record: RecordType) => void;

  // data change callbacks
  onRefreshData?: () => void;
  onFilterChange?: (condition: Condition) => void;
  onSortChange?: (
    sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
  ) => void;
  onPageChange?: (page: number, pageSize: number) => void;
  onViewChange?: (view: View) => void;
}

export function Viewer<RecordType>(props: ViewerProps<RecordType>) {
  // Extract props for cleaner code
  const {
    views,
    defaultView,
    definition,
    actionColumn,
    paginationProps,
    dataSource,
    viewManagement,
    supportedTopbarItems,
    batchOperationConfig,
    primaryAction,
    secondaryActions,
    onClickPrimaryKey,
    onRefreshData,
    onFilterChange,
    onSortChange,
    onPageChange,
    onViewChange,
  } = props;
  /**
   * Determine the initial active view based on configuration.
   * Priority: defaultViewId > isDefault flag > first view in array.
   */
  const initialActiveView = useMemo<View>(() => {
    let temp;
    if (defaultView) {
      temp = defaultView;
    } else {
      temp = views.find(v => v.isDefault);
    }
    if (!temp) {
      temp = views[0];
    }
    return temp;
  }, [defaultView, views]);

  // Current active view state
  const [activeView, setActiveView] = useState<View>(initialActiveView);

  // Table row selection state
  const [tableSelectedData, setTableSelectedData] = useState<RecordType[]>([]);

  /**
   * Table state management using reducer pattern.
   * Manages column configurations and table sizing preferences.
   */
  const { columns, tableSize, updateColumns, updateTableSize } =
    useTableStateReducer({
      columns: activeView.columns,
      tableSize: activeView.tableSize,
    });

  /**
   * Filter state management using reducer pattern.
   * Manages active filters, query conditions, and filter panel visibility.
   */
  const {
    activeFilters,
    updateActiveFilters,
    queryCondition,
    updateQueryCondition,
    showFilterPanel,
    updateShowFilterPanel,
  } = useFilterStateReducer({
    activeFilters: activeView.filters,
    queryCondition: activeView.pagedQuery.condition,
    showFilterPanel: true,
  });

  // page size
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    activeView.pagedQuery.pagination?.size || 10,
  );

  const [showViewPanel, setShowViewPanel] = useState(true);

  const onViewPanelFold = useCallback(() => {
    setShowViewPanel(false);
  }, [setShowViewPanel]);

  const onViewPanelUnfold = useCallback(() => {
    setShowViewPanel(true);
  }, [setShowViewPanel]);

  const onSearch = (condition: Condition) => {
    const newActiveFilters = activeFilters.map(af => {
      if (condition.operator === Operator.AND) {
        const queriedCondition = condition.children?.find(
          c => c.field === af.field.name,
        );
        if (queriedCondition) {
          return {
            ...af,
            value: { defaultValue: queriedCondition.value },
            operator: { defaultValue: queriedCondition.operator },
          };
        }
        return {
          ...af,
          value: { defaultValue: undefined },
          operator: { defaultValue: undefined },
        };
      } else if (condition.field === af.field.name) {
        return {
          ...af,
          value: { defaultValue: condition.value },
          operator: { defaultValue: condition.operator },
        };
      } else {
        return {
          ...af,
          value: { defaultValue: undefined },
          operator: { defaultValue: undefined },
        };
      }
    });
    updateActiveFilters(newActiveFilters);
    updateQueryCondition(condition);

    setCurrentPage(1);
    onFilterChange?.(condition);
  };

  const onPaginationChange = useCallback(
    (page: number, pageSize: number) => {
      if (pageSize !== activeView.pageSize) {
        setPageSize(pageSize);
      }
      onPageChange?.(page, pageSize);
    },
    [setPageSize, onPageChange, activeView],
  );

  const onSortChanged = (
    sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
  ) => {
    onSortChange?.(sorter);
  };

  // endregion

  const onViewChanged = useCallback(
    (activeView: View) => {
      setActiveView(activeView);
      updateColumns(activeView.columns);
      updateTableSize(activeView.tableSize);
      updateActiveFilters(activeView.filters);
      updateQueryCondition(activeView.pagedQuery.condition);
      setPageSize(activeView.pagedQuery.pagination?.size || 10);
    },
    [
      setActiveView,
      updateColumns,
      updateTableSize,
      updateActiveFilters,
      updateQueryCondition,
      setPageSize,
    ],
  );

  const onTableSelectedDataChange = useCallback(
    (selectedData: RecordType[]) => {
      setTableSelectedData(selectedData);
    },
    [setTableSelectedData],
  );

  useEffect(() => {
    return () => {
      Modal.destroyAll();
    };
  }, []);

  return (
    <TableStateContextProvider
      columns={columns}
      tableSize={tableSize}
      updateColumns={updateColumns}
      updateTableSize={updateTableSize}
      refreshData={onRefreshData}
    >
      <FilterStateContextProvider
        activeFilters={activeFilters}
        queryCondition={queryCondition}
        showFilterPanel={showFilterPanel}
        updateActiveFilters={updateActiveFilters}
        updateQueryCondition={updateQueryCondition}
        updateShowFilterPanel={updateShowFilterPanel}
      >
        <Layout>
          {showViewPanel && (
            <Sider className={styles.userViews} width={220}>
              <ViewPanel
                aggregateName={definition.name}
                views={views}
                activeView={activeView}
                countUrl={definition.countUrl}
                onViewChange={onViewChanged}
                showViewPanel={showViewPanel}
                onViewPanelFold={onViewPanelFold}
              />
            </Sider>
          )}
          <Layout className={styles.container}>
            <Content>
              <Space
                orientation="vertical"
                style={{ display: 'flex' }}
                size="small"
              >
                <Header className={styles.topBar}>
                  <TopBar
                    tableSelectedItems={tableSelectedData}
                    title={definition.name}
                    viewName={activeView.name}
                    showViewPanel={showViewPanel}
                    onViewPanelUnfold={onViewPanelUnfold}
                    primaryAction={primaryAction}
                    secondaryActions={secondaryActions}
                    barItems={supportedTopbarItems}
                    batchOperationConfig={batchOperationConfig}
                  />
                </Header>
                {showFilterPanel && (
                  <div className={styles.filterPanel}>
                    <EditableFilterPanel
                      filters={activeFilters}
                      availableFilters={definition.availableFilters}
                      onSearch={onSearch}
                      onChange={updateActiveFilters}
                    />
                  </div>
                )}
                <ViewTable<RecordType>
                  dataSource={dataSource}
                  viewDefinition={definition}
                  actionColumn={actionColumn}
                  onSortChanged={onSortChanged}
                  onSelectChange={onTableSelectedDataChange}
                  attributes={{ pagination: false }}
                  enableBatchOperation={batchOperationConfig?.enabled || false}
                ></ViewTable>
                {(paginationProps || batchOperationConfig?.enabled) && (
                  <Footer className={styles.pagination}>
                    <span>
                      {tableSelectedData.length
                        ? `已选择 ${tableSelectedData.length} 条数据`
                        : ''}
                    </span>
                    <Pagination
                      showTotal={total => `total ${total} items`}
                      defaultPageSize={pageSize}
                      defaultCurrent={currentPage}
                      current={currentPage}
                      pageSizeOptions={['10', '20', '50', '100', '200']}
                      {...paginationProps}
                      onChange={onPaginationChange}
                    />
                  </Footer>
                )}
              </Space>
            </Content>
          </Layout>
        </Layout>
      </FilterStateContextProvider>
    </TableStateContextProvider>
  );
}
