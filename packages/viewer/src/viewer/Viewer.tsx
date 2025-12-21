import { ViewTable, ViewTableActionColumn } from '../table';
import { Layout, Pagination, PaginationProps, Space } from 'antd';
import {
  ActiveFilter,
  EditableFilterPanel,
  EditableFilterPanelProps,
} from '../filter';
import {
  View,
  ViewColumn,
  ViewDefinition,
  ViewerSharedValue,
} from './';
import styles from './Viewer.module.css';
import { StyleCapable, TableRecordType } from '../types';
import { ViewerSharedValueProvider } from './ViewerSharedValueContext';
import {
  RefAttributes,
  useCallback,
  useImperativeHandle,
  useMemo,
  useReducer, useRef,
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
import { SizeType } from 'antd/es/config-provider/SizeContext';
import type { SorterResult } from 'antd/es/table/interface';
import type * as React from 'react';

const { Header, Footer, Sider, Content } = Layout;

type ViewReducerActionType =
  | 'updateColumns'
  | 'updateActiveFilters'
  | 'updateTableSize'
  | 'updatePageSize'
  | 'updateCondition'
  | 'updateSort';

interface ViewReducerAction {
  type: ViewReducerActionType;
  update: any;
}

export interface ViewActions {
  updateColumns: (columns: ViewColumn[]) => void;
  updateActiveFilters: (activeFilters: ActiveFilter[]) => void;
  updateTableSize: (tableSize: SizeType) => void;
  updatePageSize: (pageSize: number) => void;
  updateCondition: (condition: Condition) => void;
  updateSort: (sort?: FieldSort[]) => void;
}

const viewReducer = (state: View, action: ViewReducerAction) => {
  switch (action.type) {
    case 'updateColumns':
      return { ...state, columns: action.update };
    case 'updateActiveFilters':
      return { ...state, filters: action.update };
    case 'updateTableSize':
      return { ...state, tableSize: action.update };
    case 'updatePageSize':
      return { ...state, pageSize: action.update };
    case 'updateCondition':
      return { ...state, condition: action.update };
    case 'updateSort':
      return { ...state, sort: action.update };
    default:
      return state;
  }
};

export interface ViewerRef {
  refreshData: () => void;
}

export interface ViewerProps<RecordType>
  extends
    TopBarPropsCapable<RecordType>,
    StyleCapable,
    RefAttributes<ViewerRef> {
  name: string;
  view: View;
  definition: ViewDefinition;
  actionColumn: ViewTableActionColumn<TableRecordType<RecordType>>;


  paginationProps?: Omit<PaginationProps, 'total'>;
}

export function Viewer<RecordType>(props: ViewerProps<RecordType>) {
  const { ref, view, definition, actionColumn, topBar, paginationProps } =
    props;

  const [tableSelectedData, setTableSelectedData] = useState<RecordType[]>([]);

  const onTableSelectedDataChange = useCallback(
    (selectedData: RecordType[]) => {
      setTableSelectedData(selectedData);
    },
    [setTableSelectedData],
  );

  const { result, getQuery, setQuery, run } = useDebouncedFetcherQuery<
    PagedQuery,
    PagedList<RecordType>
  >({
    url: definition.dataSourceUrl,
    initialQuery: {
      condition: view.condition,
      pagination: { index: 1, size: view.pageSize },
      sort: view.sort,
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

  const [viewState, dispatch] = useReducer<View, [ViewReducerAction]>(
    viewReducer,
    view,
  );

  const updateViewColumns = useCallback((newColumns: ViewColumn[]) => {
    dispatch({ type: 'updateColumns', update: newColumns });
  }, []);

  const updateActiveFilters = useCallback(
    (newActiveFilters: ActiveFilter[]) => {
      dispatch({ type: 'updateActiveFilters', update: newActiveFilters });
    },
    [],
  );

  const updateTableSize = useCallback((newTableSize: SizeType) => {
    dispatch({ type: 'updateTableSize', update: newTableSize });
  }, []);

  const updatePageSize = useCallback((newPageSize: number) => {
    dispatch({ type: 'updatePageSize', update: newPageSize });
  }, []);

  const updateCondition = useCallback((newCondition: Condition) => {
    dispatch({ type: 'updateCondition', update: newCondition });
  }, []);

  const updateSort = useCallback(
    (newSort?: FieldSort[]) => {
      dispatch({ type: 'updateSort', update: newSort });
      setQuery({
        ...(getQuery() || { condition: all() }),
        pagination: { index: 1, size: viewState.pageSize },
        sort: newSort,
      });
    },
    [viewState, setQuery, getQuery],
  );

  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const updateShowFilterPanel = useCallback(
    (newShowFilterPanel: boolean) => {
      setShowFilterPanel(newShowFilterPanel);
    },
    [setShowFilterPanel],
  );

  const refreshData = useCallback(() => {
    run();
  }, [run]);

  const editableFilterPanelProps: EditableFilterPanelProps = {
    filters: viewState.filters,
    availableFilters: definition.availableFilters,
  };

  const onSearch = useCallback(
    (condition: Condition) => {
      const query: PagedQuery = {
        ...getQuery(),
        condition: condition,
        pagination: { index: 1, size: viewState.pageSize },
      };
      setQuery(query);

      const newActiveFilters = viewState.filters.map(af => {
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
      updateCondition(query.condition);
    },
    [getQuery, setQuery, viewState, updateActiveFilters, updateCondition],
  );

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
      updatePageSize(size);
    },
    [updatePageSize],
  );

  const onSortChanged = useCallback(
    (
      sorter:
        | SorterResult<TableRecordType<RecordType>>
        | SorterResult<TableRecordType<RecordType>>[],
    ) => {
      let fieldSorts: FieldSort[] = [];
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
              sorter.order === 'ascend'
                ? SortDirection.ASC
                : SortDirection.DESC,
          },
        ];
      }
      updateSort(fieldSorts);
    },
    [updateSort],
  );

  const contextValue = useMemo<ViewerSharedValue>(
    () => ({
      aggregateName: definition.name,
      view: viewState,
      actions: {
        updateColumns: updateViewColumns,
        updateActiveFilters: updateActiveFilters,
        updateTableSize: updateTableSize,
        updatePageSize: updatePageSize,
        updateCondition: updateCondition,
        updateSort: updateSort,
      },
      showFilterPanel: showFilterPanel,
      setShowFilterPanel: updateShowFilterPanel,
      refreshData: refreshData,
    }),
    [
      definition.name,
      viewState,
      updateViewColumns,
      updateActiveFilters,
      updateTableSize,
      updatePageSize,
      updateCondition,
      updateSort,
      showFilterPanel,
      updateShowFilterPanel,
      refreshData,
    ],
  );

  const tableDataSource = useMemo(() => {
    if (result) {
      return result.list.map((record, index) => ({
        ...record,
        key: index,
      }));
    }
    return [];
  }, [result]);

  useImperativeHandle<ViewerRef, ViewerRef>(ref, () => ({
    refreshData: refreshData,
  }));

  const fullscreenElementRef = useRef<HTMLElement>(null);


  return (
    <ViewerSharedValueProvider {...contextValue}>
      <Layout className={props.className} style={props.style} ref={fullscreenElementRef}>
        <Sider className={styles.personalViews}>
          Here is the personal view list.
        </Sider>
        <Layout className={styles.container}>
          <Content>
            <Space
              orientation="vertical"
              style={{ display: 'flex' }}
              size="small"
            >
              <Header className={styles.topBar}>
                <TopBar {...topBar} tableSelectedItems={tableSelectedData} fullscreenTarget={fullscreenElementRef} />
              </Header>
              {showFilterPanel && (
                <div className={styles.filterPanel}>
                  <EditableFilterPanel
                    {...editableFilterPanelProps}
                    onSearch={onSearch}
                    onChange={updateActiveFilters}
                  />
                </div>
              )}
              <ViewTable<TableRecordType<RecordType>>
                view={viewState}
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
                  defaultPageSize={view.pageSize}
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
    </ViewerSharedValueProvider>
  );
}
