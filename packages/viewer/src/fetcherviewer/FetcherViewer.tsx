import { Spin } from 'antd';
import { PaginationProps } from 'antd';
import {
  ViewTableSettingCapable,
  ViewTableActionColumn,
  ViewState,
  ViewDefinition,
  Viewer,
  useRefreshDataEventBus,
  TopbarActionsCapable,
  ViewerRef,
} from '../';
import {
  useViewerDefinition,
  useViewerViews,
  useFetchData,
  CreateView,
  EditView,
  ViewCommandClient,
} from './';
import {
  RefAttributes,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CommandResult,
  Condition,
  FieldSort,
  PagedList,
  PagedQuery,
} from '@ahoo-wang/fetcher-wow';
import { fetcherRegistrar, TextResultExtractor } from '@ahoo-wang/fetcher';
import { useKeyStorage } from '@ahoo-wang/fetcher-react';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

export interface FetcherViewerRef {
  refreshData: () => void;
  clearSelectedRowKeys: () => void;
  getPageQuery: () => PagedQuery | undefined;
  getActiveView: () => ViewState | undefined;
  getViewerDefinition: () => ViewDefinition | undefined;
}

export interface FetcherViewerProps<RecordType>
  extends
    ViewTableSettingCapable,
    RefAttributes<FetcherViewerRef>,
    TopbarActionsCapable<RecordType> {
  viewerDefinitionId: string;
  ownerId?: string;
  tenantId?: string;

  defaultViewId?: string;

  pagination:
    | false
    | Omit<PaginationProps, 'onChange' | 'onShowSizeChange' | 'total'>;
  actionColumn?: ViewTableActionColumn<RecordType>;

  onClickPrimaryKey?: (id: any, record: RecordType) => void;
  enableRowSelection?: boolean;

  enhanceDataSource?: (
    data: RecordType[],
  ) => RecordType[] | Promise<RecordType[]>;
  onSwitchView?: (view: ViewState) => void;
}

const viewCommandClient = new ViewCommandClient();

export function FetcherViewer<RecordType = any>({
  ownerId = '(0)',
  tenantId = '(0)',
  ...props
}: FetcherViewerProps<RecordType>) {
  const {
    ref,
    viewerDefinitionId,
    defaultViewId,
    pagination,
    actionColumn,
    onClickPrimaryKey,
    enableRowSelection,
    enhanceDataSource,
    onSwitchView,
    viewTableSetting,
    primaryAction,
    secondaryActions,
    batchActions,
  } = props;
  const localDefaultViewIdStorage = new KeyStorage<string | undefined>({
    key: 'fetcher-viewer-local-default-view-id',
    defaultValue: undefined,
  });
  const [localDefaultViewId, setLocalDefaultViewId] = useKeyStorage<
    string | undefined
  >(localDefaultViewIdStorage);

  const {
    viewerDefinition,
    loading: definitionLoading,
    error: definitionError,
  } = useViewerDefinition(viewerDefinitionId);

  const { views, loading: viewsLoading } = useViewerViews(
    viewerDefinitionId,
    tenantId,
    ownerId,
  );

  const defaultView = useMemo(
    () => getDefaultView(views, localDefaultViewId, defaultViewId),
    [views, defaultViewId, localDefaultViewId],
  );

  const {
    dataSource,
    loading: fetchLoading,
    setQuery,
    reload,
    getPageQuery,
  } = useFetchData<RecordType>({
    viewerDefinition,
    defaultView,
  });

  const [enhancedDataSource, setEnhancedDataSource] = useState<
    PagedList<RecordType>
  >({
    list: [],
    total: 0,
  });

  useEffect(() => {
    const asyncFn = async () => {
      const result =
        (await enhanceDataSource?.(dataSource?.list || [])) || dataSource?.list;

      setEnhancedDataSource({
        list: result || [],
        total: dataSource?.total || 0,
      });
    };
    asyncFn();
  }, [dataSource, enhanceDataSource, setEnhancedDataSource]);

  const viewerRef = useRef<ViewerRef | null>(null);

  const handleLoadData = useCallback(
    (
      condition: Condition,
      page: number,
      pageSize: number,
      sorter?: FieldSort[],
    ) => {
      setQuery?.(condition, page, pageSize, sorter);
    },
    [setQuery],
  );

  const handleSwitchView = useCallback(
    (view: ViewState) => {
      onSwitchView?.(view);
      setLocalDefaultViewId(view.id);
    },
    [onSwitchView, setLocalDefaultViewId],
  );

  const onGetRecordCount = useCallback(
    (countUrl: string, condition: Condition): Promise<number> => {
      const fetcher = fetcherRegistrar.default;

      return fetcher.post(
        countUrl,
        {
          body: condition,
        },
        {
          resultExtractor: TextResultExtractor,
        },
      );
    },
    [],
  );

  const handleCreateView = useCallback(
    (view: ViewState, onSuccess?: (newView: ViewState) => void) => {
      const command: CreateView = {
        ...view,
      };
      viewCommandClient
        .createView(view.type, {
          body: command,
        })
        .then((result: CommandResult) => {
          const newView = {
            ...view,
            id: result.aggregateId,
          };
          onSuccess?.(newView);
        });
    },
    [],
  );

  const handleUpdateView = useCallback(
    (view: ViewState, onSuccess?: (newView: ViewState) => void) => {
      const command: EditView = {
        ...view,
      };
      viewCommandClient
        .editView(view.type, view.id, {
          body: command,
        })
        .then(() => {
          onSuccess?.(view);
        });
    },
    [],
  );

  const handleDeleteView = useCallback(
    (view: ViewState, onSuccess?: (newView: ViewState) => void) => {
      viewCommandClient
        .defaultDeleteAggregate(view.id, {
          body: {},
        })
        .then(() => {
          onSuccess?.(view);
        });
    },
    [],
  );

  const { publish, subscribe } = useRefreshDataEventBus(viewerDefinitionId);

  useImperativeHandle<FetcherViewerRef, FetcherViewerRef>(ref, () => ({
    refreshData: () => publish(viewerDefinitionId),
    // 现有组件在refreshData事件触发时，视图中的数据未与已选中行的数据保持一致
    // 暴露 clearSelectedRowKeys 方法让外部使用者手动清除选中行
    clearSelectedRowKeys: () => {
      viewerRef.current?.clearSelectedRowKeys();
    },
    getPageQuery: () => getPageQuery(),
    // 暴露 getActiveView 方法让外部使用者可获取当前激活视图
    getActiveView: () => viewerRef.current?.getActiveView(),
    // 暴露 getViewerDefinition 方法让外部使用者可获取当前视图定义
    getViewerDefinition: () => viewerDefinition,
  }));

  subscribe(
    {
      name: 'Viewer-Refresh-Data',
      handle: async () => {
        await reload();
      },
    },
    viewerDefinitionId,
  );

  if (definitionLoading || viewsLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (definitionError) {
    return (
      <div style={{ padding: 24, color: '#ff4d4f' }}>
        加载视图定义失败: {definitionError.message}
      </div>
    );
  }

  if (!viewerDefinition) {
    return <div style={{ padding: 24 }}>未找到视图定义</div>;
  }

  if (views && views.length === 0) {
    return <div style={{ padding: 24 }}>未找到视图</div>;
  }

  if (views && views.length > 0 && defaultView) {
    return (
      <Viewer<RecordType>
        ref={viewerRef}
        defaultViews={views}
        defaultView={defaultView}
        definition={viewerDefinition}
        loading={fetchLoading}
        dataSource={enhancedDataSource}
        pagination={pagination}
        actionColumn={actionColumn}
        onClickPrimaryKey={onClickPrimaryKey}
        enableRowSelection={enableRowSelection}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
        batchActions={batchActions}
        onGetRecordCount={onGetRecordCount}
        onSwitchView={handleSwitchView}
        onLoadData={handleLoadData}
        viewTableSetting={viewTableSetting}
        onCreateView={handleCreateView}
        onUpdateView={handleUpdateView}
        onDeleteView={handleDeleteView}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <Spin size="large" />
    </div>
  );
}

function getDefaultView(
  views: ViewState[] | undefined,
  localDefaultViewId?: string | null,
  defaultViewId?: string,
): ViewState | undefined {
  if (!views || views.length === 0) return undefined;

  let activeView: ViewState | undefined;
  if (defaultViewId) {
    activeView = views.find(view => view.id === defaultViewId);
    if (activeView) {
      return activeView;
    }
  }

  if (localDefaultViewId) {
    activeView = views.find(view => view.id === localDefaultViewId);
    if (activeView) {
      return activeView;
    }
  }

  activeView = views.find(view => view.isDefault);
  if (activeView) {
    return activeView;
  }

  return views[0];
}
