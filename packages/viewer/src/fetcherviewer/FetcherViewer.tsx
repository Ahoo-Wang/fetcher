import { Spin } from 'antd';
import { PaginationProps } from 'antd';
import {
  ViewTableSettingCapable,
  ViewTableActionColumn,
  ViewState,
  Viewer,
  useRefreshDataEventBus,
  TopbarActionsCapable,
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
  useImperativeHandle,
  useMemo,
} from 'react';
import { CommandResult, Condition, FieldSort } from '@ahoo-wang/fetcher-wow';
import { fetcherRegistrar, TextResultExtractor } from '@ahoo-wang/fetcher';
import { useKeyStorage } from '@ahoo-wang/fetcher-react';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

export interface FetcherViewerRef {
  refreshData: () => void;
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
  } = useFetchData<RecordType>({
    viewerDefinition,
    defaultView,
  });

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

  const { publish, subscribe } = useRefreshDataEventBus();

  useImperativeHandle<FetcherViewerRef, FetcherViewerRef>(ref, () => ({
    refreshData: publish,
  }));

  subscribe({
    name: 'Viewer-Refresh-Data',
    handle: async () => {
      await reload();
    },
  });

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
        defaultViews={views}
        defaultView={defaultView}
        definition={viewerDefinition}
        loading={fetchLoading}
        dataSource={dataSource || { list: [], total: 0 }}
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
