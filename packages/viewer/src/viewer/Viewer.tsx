import { ViewTable, ViewTableActionColumn } from '../table';
import { Layout, Modal, Pagination, PaginationProps, Space } from 'antd';
import { EditableFilterPanel, FilterPanelRef } from '../filter';
import {
  SaveViewModal,
  ViewState,
  ViewDefinition,
  ViewPanel,
  ViewType,
  SearchDataConverterCapable,
  useViewerState,
} from './';
import styles from './Viewer.module.css';
import {
  ActionItem,
  SaveViewMethod,
  TableRecordType,
  ViewTableSettingCapable,
} from '../types';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  active,
  Condition,
  Operator,
  PagedList,
  PagedQuery,
} from '@ahoo-wang/fetcher-wow';
import { BarItemType, TopBar } from '../topbar';
import type { SorterResult } from 'antd/es/table/interface';
import type * as React from 'react';
import { useRefreshDataEventBus } from '../';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { mapToTableRecord } from '../utils';
import { View } from '../view';

const { Header, Footer, Sider, Content } = Layout;

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

export interface ViewerProps<RecordType, SearchBody>
  extends SearchDataConverterCapable<SearchBody>, ViewTableSettingCapable {
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
  onLoadData: (searchBody: SearchBody) => void;
  onViewChange?: (view: ViewState) => void;
}

/**
 * 管理并渲染视图
 * 不负责数据加载，不负责视图远程持久化
 *
 * @param views
 * @param defaultViewId
 * @param definition
 * @param viewManagement
 * @param otherProps
 * @constructor
 */
export function Viewer<RecordType, SearchBody>({
  views,
  defaultViewId,
  definition,
  viewManagement,
  ...otherProps
}: ViewerProps<RecordType, SearchBody>) {
  const {
    activeView,
    showFilter,
    setShowFilter,
    showViewPanel,
    setShowViewPanel,
    setTableSize,
  } = useViewerState<RecordType>({
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
              switchView(result);
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
      switchView(result);
      setSaveViewModalOpen(false);
    });
  };

  const handleEditViewName = (view: ViewState, onSuccess?: () => void) => {
    viewManagement.onUpdateView?.(view, onSuccess);
  };

  const handleDeleteView = (view: ViewState, onSuccess?: () => void) => {
    viewManagement.onDeleteView?.(view, onSuccess);
  };

  const onReset = () => {
    const originView = reset();
    editableFilterPanelRef.current?.reset();
    onLoadData?.(originView.pagedQuery);
  };

  const { subscribe } = useRefreshDataEventBus();
  subscribe({
    name: 'Fetcher-Viewer-Refresh-Data',
    handle(): void {
      onLoadData?.(activeView.pagedQuery);
    },
  });

  return (
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
                batchOperationConfig={otherProps.batchOperation || undefined}
                viewChanged={changed}
                viewManagement={viewManagement}
                onSaveAsView={onSaveView}
                onReset={onReset}
                showViewPanel={showViewPanel}
                showFilter={showFilter}
                onShowFilterChange={setShowFilter}
                onShowViewPanelChange={setShowViewPanel}
              />
            </Header>
            <View<RecordType>
              fields={definition.fields}
              activeFilters={activeView.filters}
              availableFilters={definition.availableFilters}
              dataSource={otherProps.dataSource}
              defaultColumns={activeView.columns}
              defaultPageSize={activeView.pageSize}
              enableRowSelection={otherProps.enableRowSelection || true}
              pagination={otherProps.pagination}
              showFilter={showFilter}
              tableSize={activeView.tableSize}
              viewTableSetting={otherProps.viewTableSetting}
              actionColumn={otherProps.actionColumn}
            ></View>
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
