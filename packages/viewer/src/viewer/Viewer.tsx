import { Layout, PaginationProps, Space } from 'antd';
import type { RefObject } from 'react';
import {
  ViewState,
  ViewDefinition,
  ViewPanel,
  useViewerState,
  ViewMutationActionsCapable,
  TopbarActionsCapable,
  GetRecordCountActionCapable,
} from './';
import styles from './Viewer.module.css';
import {
  TopBar,
  ViewTableSettingCapable,
  ViewChangeAction,
  View,
  ViewRef,
  ViewTableActionColumn,
  FilterPanelConditionCapableRef,
} from '../';
import {
  RefAttributes,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Condition, FieldSort, PagedList } from '@ahoo-wang/fetcher-wow';
import type * as React from 'react';

const { Header, Sider, Content } = Layout;

export interface ViewerRef extends FilterPanelConditionCapableRef {
  clearSelectedRowKeys: () => void;
}

export interface ViewerProps<RecordType>
  extends
    ViewTableSettingCapable,
    GetRecordCountActionCapable,
    ViewMutationActionsCapable,
    RefAttributes<ViewerRef>,
    TopbarActionsCapable<RecordType> {
  defaultViews: ViewState[];
  defaultView: ViewState;
  definition: ViewDefinition;

  // for view
  dataSource: PagedList<RecordType>;
  pagination:
    | false
    | Omit<PaginationProps, 'onChange' | 'onShowSizeChange' | 'total'>;
  actionColumn?: ViewTableActionColumn<RecordType>;
  onClickPrimaryKey?: (id: any, record: RecordType) => void;
  enableRowSelection?: boolean;
  loading?: boolean;
  // callbacks
  onLoadData?: ViewChangeAction;
  onSwitchView?: (view: ViewState) => void;
  /**
   * 全屏目标元素
   * - undefined: 使用 document.documentElement（默认，整个页面全屏）
   * - HTMLElement: 使用指定的元素进行全屏
   * - RefObject<HTMLElement>: 使用 ref 引用的元素进行全屏
   * - false: 不向外获取内容，自动挂载在内部视图容器（使用 viewRef）
   */
  getFullscreenTarget?: HTMLElement | RefObject<HTMLElement | null> | false;
}

/**
 * 管理并渲染视图
 * 不负责数据加载，不负责视图远程持久化
 *
 * @param searchDataConverter
 * @param props
 * @constructor
 */
export function Viewer<RecordType = any>({
  ...props
}: ViewerProps<RecordType>) {
  const {
    ref,
    defaultViews,
    defaultView,
    definition,
    getFullscreenTarget,
    onLoadData,
    onGetRecordCount,
    onCreateView,
    onUpdateView,
    onDeleteView,
    onSwitchView,
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
    onSwitchView: switchView,
    views,
    setViews,
    reset,
  } = useViewerState({
    views: defaultViews,
    defaultView,
    definition,
  });

  const [tableSelectedData, setTableSelectedData] = useState<RecordType[]>([]);

  const viewRef = useRef<ViewRef | null>(null);
  const viewerRef = useRef<HTMLElement | null>(null);

  const handleCreateView = (view: ViewState, onSuccess?: () => void) => {
    onCreateView?.(view, (newView: ViewState) => {
      setViews([...views, newView]);
      switchView(newView);
      onSwitchView?.(newView);
      onSuccess?.();
    });
  };

  const handleUpdateView = (view: ViewState, onSuccess?: () => void) => {
    onUpdateView?.(view, (newView: ViewState) => {
      setViews(
        views.map(it => {
          if (it.id === newView.id) {
            return newView;
          }
          return it;
        }),
      );
      switchView(newView);
      onSuccess?.();
    });
  };

  const handleDeleteView = (view: ViewState, onSuccess?: () => void) => {
    onDeleteView?.(view, (deletedView: ViewState) => {
      setViews(views.filter(it => it.id !== deletedView.id));
      if (activeView.id === deletedView.id) {
        switchView(views[0]);
        onSwitchView?.(views[0]);
      }
      onSuccess?.();
    });
  };

  const handleShowViewPanelChange = (val: boolean) => {
    setShowViewPanel(val);
  };

  const handleSwitchView = (view: ViewState) => {
    switchView(view);
    onSwitchView?.(view);
  };

  const handleReset = () => {
    const resetView = reset();
    viewRef.current?.reset();
    onLoadData?.(resetView.condition, 1, resetView.pageSize, resetView.sorter);
    // Reset logic handled by View component internally
  };

  const handleChange = useCallback(
    (
      condition: Condition,
      index: number,
      size: number,
      sorter?: FieldSort[],
    ) => {
      onLoadData?.(condition, index, size, sorter);
      viewRef.current?.clearSelectedRowKeys();
    },
    [onLoadData],
  );

  /**
   * 处理全屏目标元素的逻辑
   * - undefined: 默认使用 document.documentElement（整个页面全屏）
   * - false: 不向外获取内容，使用内部视图容器（返回函数，在组件挂载后使用 viewerRef）
   * - HTMLElement: 直接使用指定的元素
   * - RefObject<HTMLElement>: 从 ref.current 获取元素
   */
  const internalFullScreenTarget = useMemo(() => {
    if (getFullscreenTarget === undefined) {
      return document.documentElement;
    }

    if (getFullscreenTarget === false) {
      return () => viewerRef.current || document.documentElement;
    }

    // 处理 RefObject 类型
    if ('current' in getFullscreenTarget) {
      return () => getFullscreenTarget.current || document.documentElement;
    }

    return getFullscreenTarget;
  }, [getFullscreenTarget]);

  useImperativeHandle(ref, () => {
    return {
      clearSelectedRowKeys: () => {
        viewRef.current?.clearSelectedRowKeys();
      },
      getCondition: () => viewRef.current?.getCondition(),
    };
  });

  return (
    <Layout ref={viewerRef}>
      {showViewPanel && (
        <Sider className={styles.userViews} width={220}>
          <ViewPanel
            name={definition.name}
            views={views}
            activeView={activeView}
            countUrl={definition.countUrl}
            onSwitchView={handleSwitchView}
            onShowViewPanelChange={handleShowViewPanelChange}
            onGetRecordCount={onGetRecordCount}
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
                activeView={activeView}
                views={views}
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
                onCreateView={handleCreateView}
                onUpdateView={handleUpdateView}
                onDeleteView={handleDeleteView}
                fullscreenTarget={internalFullScreenTarget}
              />
            </Header>
            <View<RecordType>
              ref={viewRef}
              key={activeView.id}
              fields={definition.fields}
              availableFilters={definition.availableFilters}
              dataSource={otherProps.dataSource}
              enableRowSelection={otherProps.enableRowSelection ?? true}
              loading={otherProps.loading}
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
              onChange={handleChange}
            />
          </Space>
        </Content>
      </Layout>
    </Layout>
  );
}
