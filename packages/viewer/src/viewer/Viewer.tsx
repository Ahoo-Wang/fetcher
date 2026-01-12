import { ViewTable, ViewTableActionColumn } from '../table';
import { Layout, Modal, Pagination, PaginationProps, Space } from 'antd';
import { EditableFilterPanel, FilterPanelRef } from '../filter';
import {
  SaveViewModal,
  ViewState,
  ViewDefinition,
  ViewPanel,
  ViewType,
  useFilterStateReducer,
  FilterStateContextProvider,
  useActiveViewStateReducer,
  ActiveViewStateContextProvider,
} from './';
import styles from './Viewer.module.css';
import { ActionItem, SaveViewMethod, TableRecordType } from '../types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Condition, Operator, PagedQuery } from '@ahoo-wang/fetcher-wow';
import { BarItemType, TopBar } from '../topbar';
import type { SorterResult } from 'antd/es/table/interface';
import type * as React from 'react';
import { useRefreshDataEventBus } from '../';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { mapToTableRecord } from '../utils';

const { Header, Footer, Sider, Content } = Layout;

export interface ViewManagement {
  enabled: boolean;
  onCreateView?: (view: ViewState, onSuccess?: (newView: ViewState) => void) => void;
  onDeleteView?: (view: ViewState, onSuccess?: () => void) => void;
  onUpdateView?: (view: ViewState, onSuccess?: (newView: ViewState) => void) => void;
}

export interface BatchOperationConfig<RecordType> {
  enabled: boolean;
  title: string;
  actions: ActionItem<RecordType>[];
}

export interface ViewerProps<RecordType> {
  views: ViewState[];
  defaultView: ViewState;
  definition: ViewDefinition;
  actionColumn?: ViewTableActionColumn<TableRecordType<RecordType>>;
  paginationProps?: Omit<PaginationProps, 'onChange' | 'onShowSizeChange'>;

  dataSource: RecordType[];

  viewManagement: ViewManagement;

  supportedTopbarItems: BarItemType[];

  batchOperation: false | BatchOperationConfig<RecordType>;

  primaryAction?: ActionItem<RecordType>;
  secondaryActions?: ActionItem<RecordType>[];

  // click primary key
  onClickPrimaryKey?: (id: any, record: RecordType) => void;

  // data change callbacks
  onLoadData: (pagedQuery: PagedQuery) => void;

  onViewChange?: (view: ViewState) => void;
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
    batchOperation,
    primaryAction,
    secondaryActions,
    onClickPrimaryKey,
    onLoadData,
    onViewChange,
  } = props;
  // Table row selection state
  const [tableSelectedData, setTableSelectedData] = useState<RecordType[]>([]);
  const {
    activeView,
    changed,
    updateFilters,
    updateColumns,
    updateTableSize,
    updateConditions,
    updatePageSize,
    reset,
    switchView,
  } = useActiveViewStateReducer(defaultView);

  /**
   * Filter state management using reducer pattern.
   * Manages active filters, query conditions, and filter panel visibility.
   */
  const { showFilterPanel, updateShowFilterPanel } = useFilterStateReducer({
    showFilterPanel: true,
  });

  // page size
  const [currentPage, setCurrentPage] = useState(1);
  const [showViewPanel, setShowViewPanel] = useState(true);

  const onViewPanelFold = useCallback(() => {
    setShowViewPanel(false);
  }, [setShowViewPanel]);

  const onViewPanelUnfold = useCallback(() => {
    setShowViewPanel(true);
  }, [setShowViewPanel]);

  const onSearch = (condition: Condition) => {
    const newActiveFilters = activeView.filters.map(af => {
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
    updateFilters(newActiveFilters);
    updateConditions(condition);

    setCurrentPage(1);
    onLoadData?.({
      ...activeView.pagedQuery,
      condition,
      pagination: {
        index: 1,
        size: activeView.pageSize,
      },
    });
  };

  const onPaginationChange = useCallback(
    (page: number, pageSize: number) => {
      updatePageSize(pageSize);
      setCurrentPage(page);

      onLoadData?.({
        ...activeView.pagedQuery,
        pagination: {
          index: page,
          size: pageSize,
        },
      });
    },
    [updatePageSize, setCurrentPage, onLoadData, activeView],
  );

  const onSortChanged = (
    sorter:
      | SorterResult<TableRecordType<RecordType>>
      | SorterResult<TableRecordType<RecordType>>[],
  ) => {
    console.log('viewer sort changed', sorter);
  };
  const editableFilterPanelRef = useRef<FilterPanelRef | null>(null);

  const onViewChanged = useCallback(
    (activeView: ViewState) => {
      onViewChange?.(activeView);
      switchView(activeView);
    },
    [onViewChange, switchView],
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
    <ActiveViewStateContextProvider
      activeView={activeView}
      changed={changed}
      updateColumns={updateColumns}
      updateFilters={updateFilters}
      updateTableSize={updateTableSize}
      updateConditions={updateConditions}
      updatePageSize={updatePageSize}
      switchView={switchView}
      reset={reset}
    >
      <FilterStateContextProvider
        showFilterPanel={showFilterPanel}
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
                  <TopBar
                    tableSelectedItems={tableSelectedData}
                    title={definition.name}
                    viewName={activeView.name}
                    viewSource={activeView.source}
                    showViewPanel={showViewPanel}
                    onViewPanelUnfold={onViewPanelUnfold}
                    primaryAction={primaryAction}
                    secondaryActions={secondaryActions}
                    barItems={supportedTopbarItems}
                    batchOperationConfig={batchOperation || undefined}
                    viewChanged={changed}
                    viewManagement={viewManagement}
                    onSaveAsView={onSaveView}
                    onReset={onReset}
                  />
                </Header>
                {showFilterPanel && (
                  <div className={styles.filterPanel}>
                    <EditableFilterPanel
                      ref={editableFilterPanelRef}
                      filters={activeView.filters}
                      availableFilters={definition.availableFilters}
                      onSearch={onSearch}
                      onChange={updateFilters}
                    />
                  </div>
                )}
                <ViewTable<TableRecordType<RecordType>>
                  dataSource={mapToTableRecord(dataSource)}
                  fields={definition.fields}
                  columns={activeView.columns}
                  defaultTableSize={activeView.tableSize}
                  actionColumn={actionColumn}
                  onSortChanged={onSortChanged}
                  onSelectChange={onTableSelectedDataChange}
                  attributes={{ pagination: false }}
                  enableRowSelection={batchOperation && true}
                  onClickPrimaryKey={onClickPrimaryKey}
                ></ViewTable>
                {(paginationProps || batchOperation) && (
                  <Footer className={styles.pagination}>
                    <span>
                      {tableSelectedData.length
                        ? `已选择 ${tableSelectedData.length} 条数据`
                        : ''}
                    </span>
                    <Pagination
                      showTotal={total => `total ${total} items`}
                      defaultPageSize={
                        activeView.pagedQuery?.pagination?.size || 10
                      }
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
          <SaveViewModal
            mode={saveViewModalMode}
            open={saveViewModalOpen}
            defaultViewType={defaultViewType}
            onSaveView={handleSaveViewModalConfirm}
            onCancel={() => setSaveViewModalOpen(false)}
          />
          {contextHolder}
        </Layout>
      </FilterStateContextProvider>
    </ActiveViewStateContextProvider>
  );
}
