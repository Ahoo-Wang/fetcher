import { ViewTable, ViewTableActionColumn } from '../table';
import { Layout, Pagination, PaginationProps, Space } from 'antd';
import { EditableFilterPanel } from '../filter';
import { View, ViewDefinition, ViewPanel } from './';
import styles from './Viewer.module.css';
import { StyleCapable, TableRecordType } from '../types';
import {
  RefAttributes,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  all,
  Condition,
  FieldSort,
  Operator,
  PagedList,
  PagedQuery,
  SortDirection,
} from '@ahoo-wang/fetcher-wow';
import { useDebouncedFetcherQuery } from '@ahoo-wang/fetcher-react';
import { FetcherError } from '@ahoo-wang/fetcher';
import { TopBar, TopBarPropsCapable } from '../topbar';
import type { SorterResult } from 'antd/es/table/interface';
import type * as React from 'react';
import { useTableStateReducer } from './useTableStateReducer';
import { useFilterStateReducer } from './useFilterStateReducer';
import { TableStateContextProvider } from './TableStateContext';
import { FilterStateContextProvider } from './FilterStateContext';
import { mapToTableRecord } from '../utils';

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

/**
 * Props for the Viewer component.
 *
 * The Viewer is a comprehensive data viewing component that provides:
 * - Multiple view management with persistent configurations
 * - Advanced filtering with editable filter panels
 * - Table display with sorting, selection, and pagination
 * - State management for table and filter configurations
 * - Responsive layout with collapsible panels
 */
export interface ViewerProps<RecordType>
  extends
    TopBarPropsCapable<RecordType>,
    StyleCapable,
    RefAttributes<ViewerRef> {
  /** Display name for the viewer instance */
  name: string;
  /** Array of available views for switching between different data perspectives */
  views: View[];
  /** Optional ID of the default view to select on initialization */
  defaultViewId?: string;
  /** View definition containing column configurations and data source information */
  definition: ViewDefinition;
  /** Action column configuration for table row actions */
  actionColumn: ViewTableActionColumn<TableRecordType<RecordType>>;
  /** Additional pagination props (excluding total which is managed internally) */
  paginationProps?: Omit<PaginationProps, 'total'>;
}

/**
 * Viewer Component
 *
 * A comprehensive data viewing component that provides a complete data management interface.
 * It integrates views, filters, table display, and pagination into a cohesive user experience.
 *
 * Key features:
 * - Multiple view management with persistent configurations
 * - Advanced filtering with editable filter panels
 * - Sortable, selectable table with customizable columns
 * - Responsive layout with collapsible side panels
 * - State management for all viewer configurations
 * - Debounced queries for optimal performance
 *
 * @template RecordType - The type of data records being displayed
 * @param props - Viewer configuration and data
 * @param props.name - Display name for the viewer
 * @param props.views - Available views for data perspective switching
 * @param props.defaultViewId - Optional default view selection
 * @param props.definition - Column and data source configuration
 * @param props.actionColumn - Row action column configuration
 * @param props.paginationProps - Additional pagination settings
 * @param props.topBar - Top bar configuration and actions
 * @param props.className - CSS class for styling
 * @param props.style - Inline styles
 * @param props.ref - Ref for imperative methods
 *
 * @example
 * ```tsx
 * import { Viewer } from './Viewer';
 * import type { View, ViewDefinition } from './types';
 *
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 *   status: 'active' | 'inactive';
 * }
 *
 * const userViews: View[] = [
 *   {
 *     id: 'all-users',
 *     name: 'All Users',
 *     viewType: 'PUBLIC',
 *     viewSource: 'CUSTOM',
 *     isDefault: true,
 *     filters: [],
 *     columns: [
 *       { dataIndex: 'id', fixed: false, visible: true },
 *       { dataIndex: 'name', fixed: false, visible: true },
 *       { dataIndex: 'email', fixed: false, visible: true },
 *       { dataIndex: 'status', fixed: false, visible: true }
 *     ],
 *     tableSize: 'middle',
 *     condition: {},
 *     pageSize: 20
 *   }
 * ];
 *
 * const userDefinition: ViewDefinition = {
 *   name: 'User Management',
 *   columns: [
 *     {
 *       title: 'ID',
 *       dataIndex: 'id',
 *       type: 'number',
 *       primaryKey: true,
 *       sorter: true
 *     },
 *     {
 *       title: 'Name',
 *       dataIndex: 'name',
 *       type: 'text',
 *       sorter: true
 *     }
 *   ],
 *   availableFilters: [],
 *   dataUrl: '/api/users',
 *   countUrl: '/api/users/count',
 *   checkable: true
 * };
 *
 * const actionColumn: ViewTableActionColumn<User> = {
 *   title: 'Actions',
 *   configurable: true,
 *   actions: (record) => ({
 *     primaryAction: {
 *       data: { value: 'Edit', record, index: 0 },
 *       attributes: { onClick: () => handleEdit(record) }
 *     }
 *   })
 * };
 *
 * function UserManagement() {
 *   const viewerRef = useRef<ViewerRef>(null);
 *
 *   return (
 *     <Viewer<User>
 *       ref={viewerRef}
 *       name="User Management"
 *       views={userViews}
 *       definition={userDefinition}
 *       actionColumn={actionColumn}
 *     />
 *   );
 * }
 * ```
 */
export function Viewer<RecordType>(props: ViewerProps<RecordType>) {
  // Extract props for cleaner code
  const {
    ref,
    views,
    defaultViewId,
    definition,
    actionColumn,
    topBar,
    paginationProps,
  } = props;

  /**
   * Determine the initial active view based on configuration.
   * Priority: defaultViewId > isDefault flag > first view in array.
   */
  const initialActiveView = useMemo<View>(() => {
    let temp;
    if (defaultViewId) {
      temp = views.find(v => v.id === defaultViewId);
    } else {
      temp = views.find(v => v.isDefault);
    }
    if (!temp) {
      temp = views[0];
    }
    return temp;
  }, [defaultViewId, views]);

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

  /**
   * Data fetching with debounced queries.
   * Automatically fetches paginated, filtered, and sorted data from the API.
   * Uses debouncing to prevent excessive API calls during rapid state changes.
   */
  const { result, getQuery, setQuery, run } = useDebouncedFetcherQuery<
    PagedQuery,
    PagedList<RecordType>
  >({
    url: definition.dataUrl,
    initialQuery: activeView.pagedQuery,
    debounce: {
      delay: 300, // 300ms debounce delay
      leading: true, // Execute immediately on first change
    },
    autoExecute: true, // Start fetching immediately on mount
    onError: (error: FetcherError) => {
      console.log(error); // Log errors for debugging
    },
  });

  /**
   * Refresh data callback.
   * Re-executes the current query to refresh table data.
   * Exposed via ref for external control.
   */
  const refreshData = useCallback(() => {
    run();
  }, [run]);

  const onSearch = (condition: Condition) => {
    const query: PagedQuery = {
      ...getQuery(),
      condition: condition,
      pagination: { index: 1, size: pageSize },
    };
    setQuery(query);

    const newActiveFilters = activeFilters.map(af => {
      if (query.condition.operator === Operator.AND) {
        const queriedCondition = query.condition.children?.find(
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
      } else if (query.condition.field === af.field.name) {
        return {
          ...af,
          value: { defaultValue: query.condition.value },
          operator: { defaultValue: query.condition.operator },
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
    updateQueryCondition(query.condition);
  };

  const onPaginationChange = useCallback(
    (page: number, pageSize: number) => {
      setQuery({
        ...(getQuery() || { condition: all() }),
        pagination: { index: page, size: pageSize },
      });
    },
    [getQuery, setQuery],
  );

  const onPageSizeChange = useCallback(
    (_current: number, size: number) => {
      setPageSize(size);
    },
    [setPageSize],
  );

  const onSortChanged = (
    sorter:
      | SorterResult<TableRecordType<RecordType>>
      | SorterResult<TableRecordType<RecordType>>[],
  ) => {
    let fieldSorts: FieldSort[];
    if (Array.isArray(sorter)) {
      fieldSorts = sorter
        .filter(s => s)
        .map(s => ({
          field: String(s.field).split(',').join('.'),
          direction:
            s.order === 'ascend' ? SortDirection.ASC : SortDirection.DESC,
        }));
    } else {
      fieldSorts = [
        {
          field: String(sorter.field).split(',').join('.'),
          direction:
            sorter.order === 'ascend' ? SortDirection.ASC : SortDirection.DESC,
        },
      ];
    }
    setQuery({
      ...(getQuery() || { condition: all() }),
      pagination: { index: 1, size: pageSize },
      sort: fieldSorts,
    });
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

  const tableDataSource = useMemo(() => {
    return mapToTableRecord<RecordType>(result?.list);
  }, [result]);

  useImperativeHandle<ViewerRef, ViewerRef>(ref, () => ({
    refreshData: refreshData,
  }));

  const onTableSelectedDataChange = useCallback(
    (selectedData: RecordType[]) => {
      setTableSelectedData(selectedData);
    },
    [setTableSelectedData],
  );

  return (
    <TableStateContextProvider
      columns={columns}
      tableSize={tableSize}
      updateColumns={updateColumns}
      updateTableSize={updateTableSize}
      refreshData={refreshData}
    >
      <FilterStateContextProvider
        activeFilters={activeFilters}
        queryCondition={queryCondition}
        showFilterPanel={showFilterPanel}
        updateActiveFilters={updateActiveFilters}
        updateQueryCondition={updateQueryCondition}
        updateShowFilterPanel={updateShowFilterPanel}
      >
        <Layout className={props.className} style={props.style}>
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
                    {...topBar}
                    tableSelectedItems={tableSelectedData}
                    aggregateName={definition.name}
                    viewName={activeView.name}
                    showViewPanel={showViewPanel}
                    onViewPanelUnfold={onViewPanelUnfold}
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
                <ViewTable<TableRecordType<RecordType>>
                  dataSource={tableDataSource}
                  viewDefinition={definition}
                  actionColumn={actionColumn}
                  onSortChanged={onSortChanged}
                  onSelectChange={onTableSelectedDataChange}
                  attributes={{ pagination: false }}
                ></ViewTable>
                <Footer className={styles.pagination}>
                  <span>
                    {tableSelectedData.length
                      ? `已选择 ${tableSelectedData.length} 条数据`
                      : ''}
                  </span>
                  <Pagination
                    total={result?.total || 0}
                    showTotal={total => `total ${total} items`}
                    defaultPageSize={pageSize}
                    defaultCurrent={1}
                    pageSizeOptions={['10', '20', '50', '100', '200']}
                    onChange={onPaginationChange}
                    onShowSizeChange={onPageSizeChange}
                    {...paginationProps}
                  />
                </Footer>
              </Space>
            </Content>
          </Layout>
        </Layout>
      </FilterStateContextProvider>
    </TableStateContextProvider>
  );
}
