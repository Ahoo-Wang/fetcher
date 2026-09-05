/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Button, Spin } from 'antd';
import type { PaginationProps } from 'antd';
import type {
  ViewTableSettingCapable,
  ViewTableActionColumn,
  ViewState,
  ViewDefinition,
  TopbarActionsCapable,
  ViewerRef,
} from '../';
import { Viewer, useRefreshDataEventBus } from '../';
import { EmptyViewer } from '../viewer/EmptyViewer';
import type { CreateView, EditView } from './';
import {
  useViewerDefinition,
  useViewerViews,
  useFetchData,
  ViewCommandClient,
} from './';
import type { RefAttributes } from 'react';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  CommandResult,
  AggregateId,
  ErrorInfo,
  Condition,
  FieldSort,
  PagedList,
  PagedQuery,
} from '@ahoo-wang/fetcher-wow';
import {
  all,
  CommandHeaders,
  CommandStage,
  ErrorCodes,
} from '@ahoo-wang/fetcher-wow';
import { fetcherRegistrar, TextResultExtractor } from '@ahoo-wang/fetcher';
import { useKeyStorage, useLatest } from '@ahoo-wang/fetcher-react';
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
    false | Omit<PaginationProps, 'onChange' | 'onShowSizeChange' | 'total'>;
  actionColumn?: ViewTableActionColumn<RecordType>;

  onClickPrimaryKey?: (id: any, record: RecordType) => void;
  enableRowSelection?: boolean;

  enhanceDataSource?: (
    data: RecordType[],
  ) => RecordType[] | Promise<RecordType[]>;
  onSwitchView?: (view: ViewState) => void;
}

const viewCommandClient = new ViewCommandClient();

// useKeyStorage requires a stable KeyStorage reference (see its docstring);
// keep the instance at module scope instead of constructing it per render.
const localDefaultViewIdStorage = new KeyStorage<string | undefined>({
  key: 'fetcher-viewer-local-default-view-id',
  defaultValue: undefined,
});

export function FetcherViewer<RecordType = any>(
  props: FetcherViewerProps<RecordType>,
) {
  return (
    <FetcherViewerContent<RecordType>
      key={JSON.stringify([
        props.viewerDefinitionId,
        props.tenantId ?? '(0)',
        props.ownerId ?? '(0)',
      ])}
      {...props}
    />
  );
}

function FetcherViewerContent<RecordType>({
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
  const [localDefaultViewId, setLocalDefaultViewId] = useKeyStorage<
    string | undefined
  >(localDefaultViewIdStorage);

  const {
    viewerDefinition: loadedDefinition,
    loading: definitionLoading,
    error: definitionError,
  } = useViewerDefinition(viewerDefinitionId);

  const {
    views: loadedViews,
    snapshots: viewSnapshots,
    loading: viewsLoading,
    error: viewsError,
    execute: loadViews,
  } = useViewerViews(viewerDefinitionId, tenantId, ownerId);

  const viewerDefinition =
    loadedDefinition?.id === viewerDefinitionId ? loadedDefinition : undefined;
  const views = useMemo(
    () => loadedViews?.filter(view => view.definitionId === viewerDefinitionId),
    [loadedViews, viewerDefinitionId],
  );

  const defaultView = useMemo(
    () => getDefaultView(views, localDefaultViewId, defaultViewId),
    [views, defaultViewId, localDefaultViewId],
  );
  const [selectedView, setSelectedView] = useState<ViewState | undefined>(
    defaultView,
  );
  const [pendingView, setPendingView] = useState<{
    aggregate: AggregateId;
    ownerId: string;
    aggregateVersion: number | undefined;
    previousViews: ViewState[] | undefined;
    action: '创建' | '更新';
    commandError?: ErrorInfo;
  }>();
  const latestViewsRef = useLatest(loadedViews);
  const mutationSuccess = useRef<((view: ViewState) => void) | undefined>(
    undefined,
  );
  const targetVersion = pendingView?.aggregateVersion;
  const hasTargetVersion =
    typeof targetVersion === 'number' && Number.isFinite(targetVersion);
  const confirmedView =
    pendingView &&
    !pendingView.commandError &&
    hasTargetVersion &&
    loadedViews !== pendingView.previousViews
      ? viewSnapshots?.find(
          snapshot =>
            snapshot.aggregateId === pendingView.aggregate.aggregateId &&
            snapshot.tenantId === pendingView.aggregate.tenantId &&
            snapshot.contextName === pendingView.aggregate.contextName &&
            snapshot.aggregateName === pendingView.aggregate.aggregateName &&
            snapshot.ownerId === pendingView.ownerId &&
            snapshot.state.definitionId === viewerDefinitionId &&
            Number.isFinite(snapshot.version) &&
            snapshot.version >= targetVersion,
        )?.state
      : undefined;
  const [previousViews, setPreviousViews] = useState(views);
  if (previousViews !== views) {
    setPreviousViews(views);
    setSelectedView(
      views?.find(
        view =>
          view.id === (pendingView?.aggregate.aggregateId ?? selectedView?.id),
      ) ?? defaultView,
    );
  }
  const updateCommandError =
    pendingView?.action === '更新' ? pendingView.commandError : undefined;
  const activeView =
    pendingView && !updateCommandError
      ? confirmedView
      : (selectedView ?? defaultView);

  const {
    dataSource,
    loading: fetchLoading,
    setQuery,
    reload,
    getPageQuery,
  } = useFetchData<RecordType>({
    viewerDefinition,
    defaultView: activeView,
  });

  const [enhancement, setEnhancement] = useState<{
    view: ViewState | undefined;
    source: PagedList<RecordType> | undefined;
    data?: PagedList<RecordType>;
    error?: Error;
  }>();
  const currentEnhancement =
    enhancement?.view === activeView && enhancement?.source === dataSource
      ? enhancement
      : undefined;
  const enhancedDataSource = currentEnhancement?.data ?? { list: [], total: 0 };
  const enhancementError = currentEnhancement?.error;

  useEffect(() => {
    let current = true;
    const asyncFn = async () => {
      const result =
        (await enhanceDataSource?.(dataSource?.list || [])) || dataSource?.list;

      if (current) {
        setEnhancement({
          view: activeView,
          source: dataSource,
          data: {
            list: result || [],
            total: dataSource?.total || 0,
          },
        });
      }
    };
    asyncFn().catch((error: unknown) => {
      if (current) {
        setEnhancement({
          view: activeView,
          source: dataSource,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    });
    return () => {
      current = false;
    };
  }, [activeView, dataSource, enhanceDataSource]);

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
      setSelectedView(view);
      setPendingView(undefined);
      onSwitchView?.(view);
      setLocalDefaultViewId(view.id);
    },
    [onSwitchView, setLocalDefaultViewId],
  );

  useEffect(() => {
    if (!confirmedView) return;
    const onSuccess = mutationSuccess.current;
    mutationSuccess.current = undefined;
    if (onSuccess) onSuccess(confirmedView);
    else handleSwitchView(confirmedView);
  }, [confirmedView, handleSwitchView]);

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
    (view: Omit<ViewState, 'id'>, onSuccess?: (newView: ViewState) => void) => {
      const command: CreateView = {
        ...view,
      };
      Reflect.deleteProperty(command, 'id');

      const commandOwnerId = view.type === 'SHARED' ? '(shared)' : ownerId;

      viewCommandClient
        .createView(view.type, {
          body: command,
          headers: { [CommandHeaders.WAIT_STAGE]: CommandStage.PROCESSED },
          urlParams: { path: { ownerId: commandOwnerId } },
        })
        .then((result: CommandResult) => {
          const succeeded = ErrorCodes.isSucceeded(result.errorCode);
          mutationSuccess.current = succeeded ? onSuccess : undefined;
          setPendingView({
            aggregate: result,
            ownerId: commandOwnerId,
            aggregateVersion: result.aggregateVersion,
            previousViews: latestViewsRef.current,
            action: '创建',
            commandError: succeeded ? undefined : result,
          });
          if (succeeded) loadViews();
        });
    },
    [loadViews, latestViewsRef, ownerId],
  );

  const handleUpdateView = useCallback(
    (view: ViewState, onSuccess?: (newView: ViewState) => void) => {
      const command: EditView = {
        ...view,
      };
      const commandOwnerId = view.type === 'SHARED' ? '(shared)' : ownerId;
      viewCommandClient
        .editView(view.type, view.id, {
          body: command,
          headers: { [CommandHeaders.WAIT_STAGE]: CommandStage.PROCESSED },
          urlParams: { path: { ownerId: commandOwnerId } },
        })
        .then((result: CommandResult) => {
          const succeeded = ErrorCodes.isSucceeded(result.errorCode);
          mutationSuccess.current = succeeded ? onSuccess : undefined;
          setPendingView({
            aggregate: result,
            ownerId: commandOwnerId,
            aggregateVersion: result.aggregateVersion,
            previousViews: latestViewsRef.current,
            action: '更新',
            commandError: succeeded ? undefined : result,
          });
          if (succeeded) loadViews();
        });
    },
    [loadViews, latestViewsRef, ownerId],
  );

  const handleDeleteView = useCallback(
    (view: ViewState, onSuccess?: (newView: ViewState) => void) => {
      viewCommandClient
        .defaultDeleteAggregate(view.id, {
          body: {},
        })
        .then(() => {
          loadViews();
          onSuccess?.(view);
        });
    },
    [loadViews],
  );

  const { publish, subscribe } = useRefreshDataEventBus(viewerDefinitionId);
  const reloadRef = useRef(reload);

  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

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

  useEffect(() => {
    subscribe(
      {
        name: 'Viewer-Refresh-Data',
        handle: async () => {
          await reloadRef.current();
        },
      },
      viewerDefinitionId,
    );
  }, [subscribe, viewerDefinitionId]);

  if (pendingView && !confirmedView && !updateCommandError) {
    return (
      <div
        role={
          pendingView.commandError || viewsError || !hasTargetVersion
            ? 'alert'
            : 'status'
        }
        style={{ padding: 24 }}
      >
        <p>
          {pendingView.commandError ? (
            <>
              {pendingView.action}失败：
              {pendingView.commandError.errorMsg ||
                pendingView.commandError.errorCode}
            </>
          ) : !hasTargetVersion ? (
            '命令未返回有效版本，无法确认保存结果。'
          ) : (
            <>
              视图已{pendingView.action}，
              {viewsLoading
                ? '正在加载…'
                : viewsError
                  ? '加载失败，请重试。'
                  : '尚未确认，请重试。'}
            </>
          )}
        </p>
        <Button
          loading={viewsLoading}
          onClick={() => {
            if (pendingView.commandError || !hasTargetVersion) {
              mutationSuccess.current = undefined;
              setPendingView(undefined);
            }
            loadViews();
          }}
        >
          {hasTargetVersion && !pendingView.commandError
            ? '重试'
            : '重新加载视图'}
        </Button>
      </div>
    );
  }

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
      <div style={{ padding: 24, color: '#a8071a' }}>
        加载视图定义失败: {definitionError.message}
      </div>
    );
  }

  if (!viewerDefinition) {
    return <div style={{ padding: 24 }}>未找到视图定义</div>;
  }

  if (views && views.length === 0) {
    return (
      <EmptyViewer
        onCreateView={(name, type, onSuccess) => {
          handleCreateView(
            {
              name,
              type,
              definitionId: viewerDefinition.id,
              source: 'CUSTOM',
              isDefault: false,
              columns: [],
              filters: [],
              condition: all(),
              pageSize: 10,
              tableSize: 'middle',
              sorter: [],
            },
            newView => {
              handleSwitchView(newView);
              onSuccess();
            },
          );
        }}
      />
    );
  }

  if (views && views.length > 0 && activeView) {
    return (
      <>
        {updateCommandError && (
          <div role="alert" style={{ padding: 24, color: '#a8071a' }}>
            更新失败：
            {updateCommandError.errorMsg || updateCommandError.errorCode}
          </div>
        )}
        {enhancementError && (
          <div role="alert" style={{ padding: 24, color: '#a8071a' }}>
            处理视图数据失败: {enhancementError.message}
          </div>
        )}
        <Viewer<RecordType>
          ref={viewerRef}
          defaultViews={views}
          defaultView={activeView}
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
      </>
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
