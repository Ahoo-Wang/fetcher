import { Layout, PaginationProps, Space } from 'antd';
import {
  ViewState,
  ViewDefinition,
  ViewPanel,
  useViewerState,
  ViewMutationActionsCapable,
  TopbarActionsCapable,
} from './';
import styles from './Viewer.module.css';
import {
  TopBar,
  ViewTableSettingCapable,
  useRefreshDataEventBus,
  ViewChangeAction,
  View,
  ViewRef,
  ViewTableActionColumn,
} from '../';
import { useRef, useState } from 'react';
import { PagedList } from '@ahoo-wang/fetcher-wow';
import type * as React from 'react';

const { Header, Sider, Content } = Layout;

export interface ViewerProps<RecordType>
  extends
    ViewTableSettingCapable,
    ViewMutationActionsCapable,
    TopbarActionsCapable<RecordType> {
  defaultViews: ViewState[];
  defaultViewId?: string;
  definition: ViewDefinition;

  // for view
  dataSource: PagedList<RecordType>;
  pagination:
    | false
    | Omit<PaginationProps, 'onChange' | 'onShowSizeChange' | 'total'>;
  actionColumn?: ViewTableActionColumn<RecordType>;
  onClickPrimaryKey?: (id: any, record: RecordType) => void;
  enableRowSelection?: boolean;

  // callbacks
  onLoadData?: ViewChangeAction;
  onViewChange?: (view: ViewState) => void;
}

/**
 * 管理并渲染视图
 * 不负责数据加载，不负责视图远程持久化
 *
 * @param searchDataConverter
 * @param props
 * @constructor
 */
export function Viewer<RecordType>({ ...props }: ViewerProps<RecordType>) {
  const {
    defaultViews,
    defaultViewId,
    definition,
    onLoadData,
    onCreateView,
    onUpdateView,
    onDeleteView,
    ...otherProps
  } = props;

  const {
    activeView,
    showFilter,
    setShowFilter,
    showViewPanel,
    setShowViewPanel,
    viewChanged,
    columns,
    setColumns,
    activeFilters,
    setActiveFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    tableSize,
    setTableSize,
    condition,
    setCondition,
    sorter,
    setSorter,
    onSwitchView,
    views,
    setViews,
    reset,
  } = useViewerState({
    views: defaultViews,
    defaultViewId,
    definition,
  });

  const [tableSelectedData, setTableSelectedData] = useState<RecordType[]>([]);

  const viewRef = useRef<ViewRef | null>(null);

  // const onSaveView = (method: SaveViewMethod) => {
  //   switch (method) {
  //     case 'Update':
  //       modal.confirm({
  //         title: '确认覆盖当前视图？',
  //         icon: <ExclamationCircleOutlined />,
  //         content: '确认后将覆盖原筛选条件',
  //         okText: '确认',
  //         cancelText: '取消',
  //         onOk: () => {
  //           onUpdateView?.(activeView, newView => {
  //             onSwitchView(newView);
  //           });
  //         },
  //       });
  //       break;
  //     case 'SaveAs':
  //       setSaveViewModalOpen(true);
  //       setSaveViewModalMode('SaveAs');
  //       break;
  //   }
  // };

  const handleCreateView = (view: ViewState, onSuccess?: () => void) => {
    console.log('onCreateView', view);
    onCreateView?.(view, (newView: ViewState) => {
      setViews([...views, newView]);
      onSwitchView(newView);
      onSuccess?.();
    });
  };

  const handleUpdateView = (view: ViewState, onSuccess?: () => void) => {
    console.log('onUpdateView', view);
    onUpdateView?.(view, (newView: ViewState) => {
      setViews(
        views.map(it => {
          if (it.id === newView.id) {
            return newView;
          }
          return it;
        }),
      );
      onSwitchView(newView);
      onSuccess?.();
    });
  };

  const handleDeleteView = (view: ViewState, onSuccess?: () => void) => {
    console.log('onDeleteView', view);
    onDeleteView?.(view, (deletedView: ViewState) => {
      setViews(views.filter(it => it.id !== deletedView.id));
      if (activeView.id === deletedView.id) {
        onSwitchView(views[0]);
      }
      onSuccess?.();
    });
  };

  const handleShowViewPanelChange = (val: boolean) => {
    setShowViewPanel(val);
  };

  const handleSwitchView = (view: ViewState) => {
    onSwitchView(view);
  };

  const handleReset = () => {
    reset();
    // Reset logic handled by View component internally
  };

  const { subscribe } = useRefreshDataEventBus();
  subscribe({
    name: 'Viewer-Refresh-Data',
    handle(): void {
      onLoadData?.(condition, page, pageSize, sorter);
    },
  });

  return (
    <Layout>
      {showViewPanel && (
        <Sider className={styles.userViews} width={220}>
          <ViewPanel
            name={definition.name}
            views={views}
            activeView={activeView}
            countUrl={definition.countUrl}
            onSwitchView={handleSwitchView}
            onShowViewPanelChange={handleShowViewPanelChange}
            onCreateView={handleCreateView}
            onUpdateView={handleUpdateView}
            onDeleteView={handleDeleteView}
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
              <TopBar<RecordType>
                tableSelectedItems={tableSelectedData}
                title={definition.name}
                viewName={activeView.name}
                viewSource={activeView.source}
                defaultTableSize={activeView.tableSize}
                primaryAction={otherProps.primaryAction}
                secondaryActions={otherProps.secondaryActions}
                batchActions={otherProps.batchActions}
                viewChanged={viewChanged}
                onReset={handleReset}
                showViewPanel={showViewPanel}
                showFilter={showFilter}
                onShowFilterChange={setShowFilter}
                onShowViewPanelChange={setShowViewPanel}
                onTableSizeChange={setTableSize}
              />
            </Header>
            <View<RecordType>
              ref={viewRef}
              fields={definition.fields}
              availableFilters={definition.availableFilters}
              dataSource={otherProps.dataSource}
              enableRowSelection={otherProps.enableRowSelection ?? true}
              filterMode={'editable'}
              pagination={otherProps.pagination}
              showFilter={showFilter}
              viewTableSetting={otherProps.viewTableSetting}
              actionColumn={otherProps.actionColumn}
              onClickPrimaryKey={otherProps.onClickPrimaryKey}
              onSelectedDataChange={setTableSelectedData}
              defaultActiveFilters={activeFilters}
              externalActiveFilters={activeFilters}
              externalUpdateActiveFilters={setActiveFilters}
              defaultColumns={columns}
              externalColumns={columns}
              externalUpdateColumns={setColumns}
              defaultPage={page}
              externalPage={page}
              externalUpdatePage={setPage}
              defaultPageSize={pageSize}
              externalPageSize={pageSize}
              externalUpdatePageSize={setPageSize}
              defaultTableSize={tableSize}
              externalTableSize={tableSize}
              externalUpdateTableSize={setTableSize}
              defaultCondition={condition}
              externalCondition={condition}
              externalUpdateCondition={setCondition}
              defaultSorter={sorter}
              externalSorter={sorter}
              externalUpdateSorter={setSorter}
              onChange={onLoadData}
            />
          </Space>
        </Content>
      </Layout>
    </Layout>
  );
}
