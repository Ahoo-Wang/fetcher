import { ViewTable, ViewTableActionColumn } from '../table';
import { Layout, Pagination, PaginationProps, Space } from 'antd';
import {
  ActiveFilter,
  EditableFilterPanel,
  EditableFilterPanelProps,
} from '../filter';
import { View, ViewColumn, ViewDefinition } from './types';
import styles from './Viewer.module.css';
import { DataSourceCapable, StyleCapable } from '../types';
import ViewerSharedValueContext from './ViewerSharedValueContext';
import { useEffect, useState } from 'react';
import { all, Operator, PagedList, PagedQuery } from '@ahoo-wang/fetcher-wow';
import { useFetcher } from '@ahoo-wang/fetcher-react';

const { Header, Footer, Sider, Content } = Layout;

export interface ViewerProps<RecordType> extends StyleCapable {
  name: string;
  view: View;
  definition: ViewDefinition;
  actionColumn: ViewTableActionColumn<RecordType>;

  paginationProps?: Omit<PaginationProps, 'total'>;
}

export function Viewer<RecordType>(props: ViewerProps<RecordType>) {
  const { name, view, definition, actionColumn, paginationProps } = props;

  const { execute, result } = useFetcher<PagedList<RecordType>>();

  const [viewColumns, setViewColumns] = useState<ViewColumn[]>(view.columns);
  const updateViewColumns = (newColumns: ViewColumn[]) => {
    setViewColumns(newColumns);
  };

  const filter: ActiveFilter = {
    type: 'text',
    key: 'filter',
    field: {
      name: 'aa',
      label: 'bb',
    },
    value: {
      defaultValue: 'abc',
    },
    operator: {
      defaultValue: Operator.EQ,
    },
  };

  const editableFilterPanelProps: EditableFilterPanelProps = {
    filters: view.filters,
    availableFilters: definition.availableFilters,
  };

  const handleFetch = async () => {
    await execute({ ...definition.fetchRequest, body: {} });
  };

  return (
    <ViewerSharedValueContext.Provider
      value={{ viewColumns: viewColumns, setViewColumns: updateViewColumns }}
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
              <Header className={styles.titleBar}>
                {name} * {view.name}
              </Header>
              <div className={styles.filterPanel}>
                <EditableFilterPanel {...editableFilterPanelProps} />
              </div>
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
                  defaultPageSize={20}
                  defaultCurrent={1}
                  pageSizeOptions={['20', '50', '100', '200']}
                  {...paginationProps}
                />
              </Footer>
            </Space>
          </Content>
        </Layout>
      </Layout>
    </ViewerSharedValueContext.Provider>
  );
}
