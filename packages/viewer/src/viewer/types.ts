import type {
  TypeCapable,
  ActiveFilter,
  AvailableFilterGroup,
  ActionItem,
  AttributesCapable,
  KeyCapable,
} from '../';
import type { SortOrder } from 'antd/es/table/interface';
import type { SizeType } from 'antd/es/config-provider/SizeContext';
import type { Condition, FieldSort } from '@ahoo-wang/fetcher-wow';
import type React from 'react';
import type { NamedCapable } from '@ahoo-wang/fetcher';

export interface ViewDefinition {
  id: string;
  name: string;
  fields: FieldDefinition[];
  availableFilters: AvailableFilterGroup[];
  dataUrl: string;
  countUrl: string;
}

export interface FieldDefinition
  extends NamedCapable, TypeCapable, AttributesCapable {
  label: string;
  primaryKey: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  sorter?: boolean | { multiple: number } | null;
}

export type ViewType = 'PERSONAL' | 'SHARED';
export type ViewSource = 'SYSTEM' | 'CUSTOM';

export interface ViewState {
  id: string;
  name: string;
  definitionId: string;
  type: ViewType;
  source: ViewSource;
  isDefault: boolean;
  filters: ActiveFilter[];
  columns: ViewColumn[];
  tableSize: SizeType;
  pageSize: number;
  condition: Condition;
  internalCondition?: Condition;
  sorter: FieldSort[];
}

export interface ViewColumn extends NamedCapable, KeyCapable {
  fixed: boolean;
  hidden: boolean;
  width?: string;
  sortOrder?: SortOrder;
}

export interface TopBarActionItem<RecordType> extends ActionItem<RecordType> {}

export type GetRecordCountAction = (
  countUrl: string,
  condition: Condition,
) => Promise<number>;

export type ViewMutationAction = (
  view: ViewState,
  onSuccess?: (newView: ViewState) => void,
) => void;

export interface BatchActionsConfig<RecordType> {
  enabled: boolean;
  title: string;
  actions: TopBarActionItem<RecordType>[];
}

export interface TopbarActionsCapable<RecordType> {
  primaryAction?: TopBarActionItem<RecordType>;
  secondaryActions?: TopBarActionItem<RecordType>[];
  batchActions?: BatchActionsConfig<RecordType>;
}

export interface GetRecordCountActionCapable {
  onGetRecordCount?: GetRecordCountAction;
}

export interface ViewMutationActionsCapable {
  onCreateView?: ViewMutationAction;
  onUpdateView?: ViewMutationAction;
  onDeleteView?: ViewMutationAction;
}
