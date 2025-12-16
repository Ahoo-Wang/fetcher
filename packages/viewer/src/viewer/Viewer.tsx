import { ViewTable, ViewTableActionColumn } from '../table';
import { Layout, Pagination, PaginationProps, Space } from 'antd';
import {
  EditableFilterPanel,
  EditableFilterPanelProps,
  FilterPanelRef,
} from '../filter';
import { View, ViewColumn, ViewDefinition } from './';
import styles from './Viewer.module.css';
import { StyleCapable } from '../types';
import { ViewerSharedValueProvider } from './ViewerSharedValueContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import { all, Condition, PagedList, PagedQuery } from '@ahoo-wang/fetcher-wow';
import { useDebouncedFetcherQuery } from '@ahoo-wang/fetcher-react';
import { FetcherError } from '@ahoo-wang/fetcher';
import {
  TopBar,
  COLUMN_HEIGHT_BAR_ITEM_TYPE,
  FILTER_BAR_ITEM_TYPE,
  REFRESH_DATA_BAR_ITEM_TYPE,
} from '../topbar';
import { SizeType } from 'antd/es/config-provider/SizeContext';

const { Header, Footer, Sider, Content } = Layout;

export interface ViewerProps<RecordType> extends StyleCapable {
  name: string;
  view: View;
  definition: ViewDefinition;
  actionColumn: ViewTableActionColumn<RecordType>;

  paginationProps?: Omit<PaginationProps, 'total'>;
}

export function Viewer<RecordType>(props: ViewerProps<RecordType>) {
  const { view, definition, actionColumn, paginationProps } = props;

  const { result, getQuery, setQuery, run } = useDebouncedFetcherQuery<
    PagedQuery,
    PagedList<RecordType>
  >({
    url: definition.dataSourceUrl,
    debounce: {
      delay: 300,
      leading: true,
    },
    onError: (error: FetcherError) => {
      console.log(error);
    },
  });

  const filterPanelRef = useRef<FilterPanelRef>(null);
  useEffect(() => {
    filterPanelRef?.current?.search();
  }, []);

  const [viewColumns, setViewColumns] = useState<ViewColumn[]>(view.columns);
  const updateViewColumns = (newColumns: ViewColumn[]) => {
    setViewColumns(newColumns);
  };

  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const updateShowFilterPanel = (newShowFilterPanel: boolean) => {
    setShowFilterPanel(newShowFilterPanel);
  };

  const [viewTableSize, setViewTableSize] = useState<SizeType>(
    view.tableSize || 'middle',
  );
  const updateTableSize = (newTableSize: SizeType) => {
    setViewTableSize(newTableSize);
  };

  const editableFilterPanelProps: EditableFilterPanelProps = {
    filters: view.filters,
    availableFilters: definition.availableFilters,
  };

  const onSearch = useCallback(
    (condition: Condition) => {
      setQuery({
        ...getQuery(),
        condition: condition,
        pagination: { index: 1, size: definition.defaultPageSize },
      });
      run();
    },
    [getQuery, setQuery, run, definition],
  );

  const onPaginationChange = useCallback(
    (page: number, pageSize: number) => {
      setQuery({
        ...(getQuery() || { condition: all() }),
        pagination: { index: page, size: pageSize },
      });
      run();
    },
    [getQuery, setQuery, run],
  );

  const refreshData = useCallback(() => {
    run();
  }, [run]);

  return (
    <ViewerSharedValueProvider
      aggregateName={definition.name}
      viewName={view.name}
      viewColumns={viewColumns}
      setViewColumns={updateViewColumns}
      showFilterPanel={showFilterPanel}
      setShowFilterPanel={updateShowFilterPanel}
      refreshData={refreshData}
      tableSize={viewTableSize}
      setTableSize={updateTableSize}
    >
      <Layout className={props.className} style={props.style}>
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
                <TopBar
                  barItems={[
                    FILTER_BAR_ITEM_TYPE,
                    REFRESH_DATA_BAR_ITEM_TYPE,
                    COLUMN_HEIGHT_BAR_ITEM_TYPE,
                  ]}
                />
              </Header>
              {showFilterPanel && (
                <div className={styles.filterPanel}>
                  <EditableFilterPanel
                    ref={filterPanelRef}
                    {...editableFilterPanelProps}
                    onSearch={onSearch}
                  />
                </div>
              )}
              <ViewTable
                dataSource={result?.list || []}
                viewDefinition={definition}
                actionColumn={actionColumn}
                attributes={{ pagination: false }}
              ></ViewTable>
              <Footer className={styles.pagination}>
                <span>已选择 n 条数据</span>
                <Pagination
                  total={result?.total || 0}
                  showTotal={total => `total ${total} items`}
                  defaultPageSize={definition.defaultPageSize}
                  defaultCurrent={1}
                  pageSizeOptions={['10', '20', '50', '100', '200']}
                  onChange={onPaginationChange}
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
