import { ViewTableActionColumn } from '../table';
import { Layout, Modal, PaginationProps, Space } from 'antd';
import {
  SaveViewModal,
  ViewState,
  ViewDefinition,
  ViewPanel,
  ViewType,
  useViewerState,
} from './';
import styles from './Viewer.module.css';
import { ActionItem, SaveViewMethod, ViewTableSettingCapable } from '../types';
import { useRef, useState } from 'react';
import { Condition, PagedList } from '@ahoo-wang/fetcher-wow';
import { TopBar } from '../topbar';
import type * as React from 'react';
import { useRefreshDataEventBus, ViewChangeAction, View, ViewRef } from '../';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { SorterResult } from 'antd/es/table/interface';

const { Header, Sider, Content } = Layout;

export interface ViewManagement {
  enabled: boolean;
  onCreateView?: (
    view: ViewState,
    onSuccess?: (newView: ViewState) => void,
  ) => void;
  onDeleteView?: (view: ViewState, onSuccess?: () => void) => void;
  onUpdateView?: (
    view: ViewState,
    onSuccess?: (newView: ViewState) => void,
  ) => void;
}

export interface BatchOperationConfig<RecordType> {
  enabled: boolean;
  title: string;
  actions: ActionItem<RecordType>[];
}

export interface ViewerProps<RecordType> extends ViewTableSettingCapable {
  views: ViewState[];
  defaultViewId?: string;
  definition: ViewDefinition;

  viewManagement: ViewManagement;

  // for view
  dataSource: PagedList<RecordType>;
  pagination:
    | false
    | Omit<PaginationProps, 'onChange' | 'onShowSizeChange' | 'total'>;
  actionColumn?: ViewTableActionColumn<RecordType>;
  onClickPrimaryKey?: (id: any, record: RecordType) => void;
  enableRowSelection?: boolean;

  // for topbar
  batchOperation: false | BatchOperationConfig<RecordType>;
  primaryAction?: ActionItem<RecordType>;
  secondaryActions?: ActionItem<RecordType>[];

  // callbacks
  onLoadData?: ViewChangeAction<RecordType>;
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
    views,
    defaultViewId,
    definition,
    viewManagement,
    onLoadData,
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
    reset,
  } = useViewerState({
    views,
    defaultViewId,
    definition,
  });

  const [saveViewModalOpen, setSaveViewModalOpen] = useState(false);
  const [saveViewModalMode, setSaveViewModalMode] = useState<
    'Create' | 'SaveAs'
  >('Create');
  const [modal, contextHolder] = Modal.useModal();
  const [defaultViewType, setDefaultViewType] = useState<ViewType>('PERSONAL');
  const [tableSelectedData, setTableSelectedData] = useState<RecordType[]>([]);

  const viewRef = useRef<ViewRef | null>(null);

  const handleCreateView = (type: ViewType) => {
    setDefaultViewType(type);
    setSaveViewModalMode('Create');
    setSaveViewModalOpen(true);
  };

  const onSaveView = (method: SaveViewMethod) => {
    switch (method) {
      case 'Update':
        modal.confirm({
          title: '确认覆盖当前视图？',
          icon: <ExclamationCircleOutlined />,
          content: '确认后将覆盖原筛选条件',
          okText: '确认',
          cancelText: '取消',
          onOk: () => {
            viewManagement.onUpdateView?.(activeView, result => {
              onSwitchView(result);
            });
          },
        });
        break;
      case 'SaveAs':
        setSaveViewModalOpen(true);
        setSaveViewModalMode('SaveAs');
        break;
    }
  };

  const handleSaveViewModalConfirm = (name: string, type: ViewType) => {
    const newView = { ...activeView, name, type };
    viewManagement.onCreateView?.(newView, result => {
      onSwitchView(result);
      setSaveViewModalOpen(false);
    });
  };

  const handleEditViewName = (view: ViewState, onSuccess?: () => void) => {
    viewManagement.onUpdateView?.(view, onSuccess);
  };

  const handleDeleteView = (view: ViewState, onSuccess?: () => void) => {
    viewManagement.onDeleteView?.(view, onSuccess);
  };

  const handleViewPanelFold = () => {
    setShowViewPanel(!showViewPanel);
  };

  const handleViewChange = (view: ViewState) => {
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

  const handleSearch = (
    condition: Condition,
    page: number,
    pageSize: number,
    sorter?: SorterResult<RecordType>[],
  ) => {
    onLoadData?.(condition, page, pageSize, sorter);
  };

  return (
    <Layout>
      {showViewPanel && (
        <Sider className={styles.userViews} width={220}>
          <ViewPanel
            aggregateName={definition.name}
            views={views}
            activeView={activeView}
            countUrl={definition.countUrl}
            onViewChange={handleViewChange}
            showViewPanel={showViewPanel}
            onViewPanelFold={handleViewPanelFold}
            onCreateView={handleCreateView}
            onEditViewName={handleEditViewName}
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
                {...(otherProps.batchOperation !== false && {
                  batchOperationConfig: otherProps.batchOperation,
                })}
                viewChanged={viewChanged}
                viewManagement={viewManagement}
                onSaveAsView={onSaveView}
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
              onChange={handleSearch}
            />
          </Space>
        </Content>
      </Layout>
      <SaveViewModal
        mode={saveViewModalMode}
        open={saveViewModalOpen}
        defaultViewType={defaultViewType}
        onSaveView={handleSaveViewModalConfirm}
        onCancel={() => setSaveViewModalOpen(false)}
      />
      {contextHolder}
    </Layout>
  );
}
