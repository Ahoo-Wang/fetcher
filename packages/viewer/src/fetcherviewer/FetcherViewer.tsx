import { ViewTableActionColumn } from '../table';
import { PaginationProps } from 'antd';
import { BarItemType } from '../topbar';
import {
  BatchOperationConfig,
  Viewer,
  View,
  ViewDefinition,
  ViewManagement,
} from '../viewer';
import { ActionItem, TableRecordType } from '../types';
import { and, eq, isIn, PagedList, PagedQuery } from '@ahoo-wang/fetcher-wow';
import {
  CreateView,
  EditView,
  ViewAggregatedFields,
  viewerDefinitionQueryClientFactory,
  viewQueryClientFactory,
} from './client';
import { useEffect, useState } from 'react';
import { useFetcher } from '@ahoo-wang/fetcher-react';
import { ResultExtractors } from '@ahoo-wang/fetcher';
import { ViewCommandClient } from './client/view/commandClient';

const viewCommandClient = new ViewCommandClient();

export interface FetcherViewerProps<RecordType> {
  definitionId: string;
  ownerId: string;
  defaultViewId?: string;
  actionColumn?: ViewTableActionColumn<TableRecordType<RecordType>>;
  paginationProps?: Omit<PaginationProps, 'onChange' | 'onShowSizeChange'>;

  supportedTopbarItems: BarItemType[];

  batchOperationConfig?: BatchOperationConfig<RecordType>;
  primaryAction?: ActionItem<RecordType>;
  secondaryActions?: ActionItem<RecordType>[];

  // click primary key
  onClickPrimaryKey?: (id: any, record: RecordType) => void;

  // data change callbacks
  onViewChange?: (view: View) => void;
}

export function FetcherViewer<RecordType>(
  props: FetcherViewerProps<RecordType>,
) {
  const {
    definitionId,
    ownerId,
    defaultViewId,
    actionColumn,
    paginationProps,
    supportedTopbarItems,
    batchOperationConfig,
    primaryAction,
    secondaryActions,
    onClickPrimaryKey,
    onViewChange,
  } = props;

  const [definition, setDefinition] = useState<ViewDefinition>();
  const [views, setViews] = useState<View[]>([]);
  const [defaultView, setDefaultView] = useState<View>();

  const { result: dataResult, execute } = useFetcher<PagedList<RecordType>>({
    resultExtractor: ResultExtractors.Json,
  });

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        const [viewDefinition, viewList] = await Promise.all([
          viewerDefinitionQueryClientFactory
            .createSnapshotQueryClient()
            .getStateById(definitionId, { abortController }),
          viewQueryClientFactory.createSnapshotQueryClient().listState(
            {
              condition: and(
                eq(ViewAggregatedFields.STATE_DEFINITION_ID, definitionId),
                isIn(ViewAggregatedFields.OWNER_ID, ownerId, '(shared)'),
              ),
            },
            { abortController },
          ),
        ]);
        setDefinition(viewDefinition);
        setViews(viewList);

        let initialActiveView: View | undefined;
        if (defaultViewId) {
          initialActiveView = viewList.find(v => v.id === defaultViewId);
        } else {
          initialActiveView = viewList.find(v => v.isDefault);
        }
        if (!initialActiveView) {
          initialActiveView = viewList[0];
        }
        setDefaultView(initialActiveView);

        await execute({
          url: viewDefinition.dataUrl,
          method: 'POST',
          body: initialActiveView.pagedQuery,
          abortController: abortController,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    void fetchData();

    return () => {
      abortController.abort();
    };
  }, [defaultViewId, definitionId, execute, ownerId]);

  const onLoadData = (pagedQuery: PagedQuery) => {
    void execute({
      url: definition!.dataUrl,
      method: 'POST',
      body: pagedQuery,
    });
  };

  const viewManagement: ViewManagement = {
    enabled: true,
    onCreateView: (view: View, onSuccess?: (newView: View) => void) => {
      const createViewCommand: CreateView = {
        ...view,
        source: 'CUSTOM',
      };

      viewCommandClient
        .createView(view.type, {
          body: createViewCommand,
        })
        .then(result => {
          const newView: View = {
            ...view,
            id: result.aggregateId,
            source: 'CUSTOM',
          };
          setViews([...views, newView]);
          onSuccess?.(newView);
        });
    },
    onUpdateView: (view: View, onSuccess?: (newView: View) => void) => {
      const editViewCommand: EditView = {
        ...view,
      };

      viewCommandClient
        .editView(view.type, view.id, {
          body: editViewCommand,
        })
        .then(() => {
          setViews(views.map(v => (v.id === view.id ? { ...view } : v)));
          onSuccess?.(view);
        });
    },
    onDeleteView: (view: View, onSuccess?: () => void) => {
      viewCommandClient
        .defaultDeleteAggregate(view.id, {
          body: {},
        })
        .then(() => {
          setViews(views.filter(v => v.id !== view.id));
          onSuccess?.();
        });
    },
  };

  return (
    <>
      {views && defaultView && definition && (
        <Viewer<RecordType>
          views={views}
          defaultView={defaultView}
          definition={definition}
          actionColumn={actionColumn}
          paginationProps={{
            ...paginationProps,
            total: dataResult?.total || 0,
          }}
          dataSource={dataResult?.list || []}
          viewManagement={viewManagement}
          supportedTopbarItems={supportedTopbarItems}
          batchOperationConfig={batchOperationConfig}
          primaryAction={primaryAction}
          secondaryActions={secondaryActions}
          onClickPrimaryKey={onClickPrimaryKey}
          onLoadData={onLoadData}
          onViewChange={onViewChange}
        ></Viewer>
      )}
    </>
  );
}
