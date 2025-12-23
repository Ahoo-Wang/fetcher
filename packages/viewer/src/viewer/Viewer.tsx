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

export interface ViewerRef {
  refreshData: () => void;
}

export interface ViewerProps<RecordType>
  extends
    TopBarPropsCapable<RecordType>,
    StyleCapable,
    RefAttributes<ViewerRef> {
  name: string;
  views: View[];
  defaultViewId?: string;
  definition: ViewDefinition;
  actionColumn: ViewTableActionColumn<TableRecordType<RecordType>>;

  paginationProps?: Omit<PaginationProps, 'total'>;
}

export function Viewer<RecordType>(props: ViewerProps<RecordType>) {
  const {
    ref,
    views,
    defaultViewId,
    definition,
    actionColumn,
    topBar,
    paginationProps,
  } = props;

  // get default view
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

  const [activeView, setActiveView] = useState<View>(initialActiveView);

  const [tableSelectedData, setTableSelectedData] = useState<RecordType[]>([]);

  const { columns, tableSize, updateColumns, updateTableSize } =
    useTableStateReducer({
      columns: activeView.columns,
      tableSize: activeView.tableSize,
    });

  const {
    activeFilters,
    updateActiveFilters,
    queryCondition,
    updateQueryCondition,
    showFilterPanel,
    updateShowFilterPanel,
  } = useFilterStateReducer({
    activeFilters: activeView.filters,
    queryCondition: activeView.condition,
    showFilterPanel: true,
  });

  const [pageSize, setPageSize] = useState(activeView.pageSize);

  const [querySort, setQuerySort] = useState<FieldSort[]>(
    activeView.sort || [],
  );

  // region init query
  const { result, getQuery, setQuery, run } = useDebouncedFetcherQuery<
    PagedQuery,
    PagedList<RecordType>
  >({
    url: definition.dataSourceUrl,
    initialQuery: {
      condition: queryCondition,
      pagination: { index: 1, size: activeView.pageSize },
      sort: querySort,
    },
    debounce: {
      delay: 300,
      leading: true,
    },
    autoExecute: true,
    onError: (error: FetcherError) => {
      console.log(error);
    },
  });

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
    setQuerySort(fieldSorts);
  };

  // endregion

  const onViewChanged = useCallback(
    (activeView: View) => {
      setActiveView(activeView);
      updateColumns(activeView.columns);
      updateTableSize(activeView.tableSize);
      updateActiveFilters(activeView.filters);
      updateQueryCondition(activeView.condition);
    },
    [
      setActiveView,
      updateColumns,
      updateTableSize,
      updateActiveFilters,
      updateQueryCondition,
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

  console.log('activeFilters => ', activeFilters);
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
          <Sider className={styles.userViews} width={220}>
            <ViewPanel
              aggregateName={definition.name}
              views={views}
              activeView={activeView}
              countUrl={definition.countUrl}
              onViewChange={onViewChanged}
            />
          </Sider>
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
