import { Spin } from 'antd';
import { PaginationProps } from 'antd';
import { ViewTableActionColumn } from '../table';
import { ViewState, Viewer, ViewMutationActionsCapable } from '../viewer';
import { ViewTableSettingCapable } from '../types';
import { useViewerDefinition, useViewerViews } from './hooks';
import { useCallback, useMemo } from 'react';
import { Condition, FieldSort } from '@ahoo-wang/fetcher-wow';
import { useFetchData } from './hooks/useFetchData';
import { fetcherRegistrar, TextResultExtractor } from '@ahoo-wang/fetcher';

export interface FetcherViewerProps<RecordType>
  extends ViewTableSettingCapable, ViewMutationActionsCapable {
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

export function FetcherViewer<RecordType = any>({
  ownerId = '(0)',
  tenantId = '(0)',
  ...props
}: FetcherViewerProps<RecordType>) {
  const {
    viewerDefinitionId,
    defaultViewId,
    pagination,
    actionColumn,
    onClickPrimaryKey,
    enableRowSelection,
    onSwitchView,
    viewTableSetting,
    onCreateView,
    onUpdateView,
    onDeleteView,
  } = props;

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
    () => getDefaultView(views, defaultViewId),
    [views, defaultViewId],
  );

  const { dataSource, setQuery } = useFetchData<RecordType>({
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
    },
    [onSwitchView],
  );

  const onGetRecordCount = useCallback(
    (countUrl: string, condition: Condition): Promise<number> => {
      const fetcher = fetcherRegistrar.default;

      return fetcher.post(countUrl, {
        body: condition,
      },{
        resultExtractor: TextResultExtractor
      });
    },
    [],
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
        defaultViews={views}
        defaultView={defaultView}
        definition={viewerDefinition}
        dataSource={dataSource || { list: [], total: 0 }}
        pagination={pagination}
        actionColumn={actionColumn}
        onClickPrimaryKey={onClickPrimaryKey}
        enableRowSelection={enableRowSelection}
        onGetRecordCount={onGetRecordCount}
        onSwitchView={handleSwitchView}
        onLoadData={handleLoadData}
        viewTableSetting={viewTableSetting}
        onCreateView={onCreateView}
        onUpdateView={onUpdateView}
        onDeleteView={onDeleteView}
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

  activeView = views.find(view => view.isDefault);
  if (activeView) {
    return activeView;
  }

  return views[0];
}
