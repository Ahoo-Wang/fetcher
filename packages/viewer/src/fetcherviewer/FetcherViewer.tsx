import { Spin } from 'antd';
import { PaginationProps } from 'antd';
import { SorterResult } from 'antd/es/table/interface';
import { ViewTableActionColumn } from '../table';
import { ViewState, Viewer, ViewMutationActionsCapable } from '../viewer';
import { ViewTableSettingCapable } from '../types';
import { useViewerDefinition, useViewerViews } from './hooks';
import { useCallback } from 'react';
import { Condition, pagedList } from '@ahoo-wang/fetcher-wow';

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

export function FetcherViewer<RecordType = any>(
  props: FetcherViewerProps<RecordType>,
) {
  const {
    viewerDefinitionId,
    ownerId,
    tenantId,
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
    definition,
    loading: definitionLoading,
    error: definitionError,
  } = useViewerDefinition(viewerDefinitionId);

  const { views, loading: viewsLoading } = useViewerViews(
    viewerDefinitionId,
    tenantId,
    ownerId,
  );

  const handleLoadData = useCallback(
    (
      condition?: Condition,
      page?: number,
      pageSize?: number,
      sorter?: SorterResult[],
    ) => {
      // TODO: 实现数据加载逻辑
      console.log('Load data:', { condition, page, pageSize, sorter });
    },
    [],
  );

  const handleSwitchView = useCallback(
    (view: ViewState) => {
      onSwitchView?.(view);
    },
    [onSwitchView],
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

  if (!definition) {
    return <div style={{ padding: 24 }}>未找到视图定义</div>;
  }

  const defaultViews =
    views.length > 0
      ? views
      : [
          {
            id: 'default',
            name: '默认视图',
            definitionId: viewerDefinitionId,
            type: 'PERSONAL' as const,
            source: 'SYSTEM' as const,
            isDefault: true,
            filters: [],
            columns: definition.fields.map(field => ({
              name: field.name,
              key: field.name,
              fixed: false,
              hidden: false,
            })),
            tableSize: 'middle' as const,
            pageSize:
              pagination === false ? 0 : (pagination?.defaultPageSize ?? 20),
            condition: {},
            internalCondition: {},
          },
        ];

  return (
    <Viewer<RecordType>
      defaultViews={defaultViews}
      defaultViewId={defaultViewId}
      definition={definition}
      dataSource={pagedList<RecordType>({
        total: 0,
        list: [],
      })}
      pagination={pagination}
      actionColumn={actionColumn}
      onClickPrimaryKey={onClickPrimaryKey}
      enableRowSelection={enableRowSelection}
      onSwitchView={handleSwitchView}
      onLoadData={handleLoadData}
      viewTableSetting={viewTableSetting}
      onCreateView={onCreateView}
      onUpdateView={onUpdateView}
      onDeleteView={onDeleteView}
    />
  );
}
