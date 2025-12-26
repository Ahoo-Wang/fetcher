import { ActiveFilter, AvailableFilterGroup } from '../filter';
import { TypeCapable } from '../registry';
import { AttributesCapable } from '../types';
import { SortOrder } from 'antd/es/table/interface';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Condition, FieldSort, PagedQuery } from '@ahoo-wang/fetcher-wow';
import React from 'react';
import { ButtonProps } from 'antd';
import { NamedCapable } from '@ahoo-wang/fetcher';

export interface ViewDefinition {
  name: string;
  fields: ViewColumnDefinition[];
  availableFilters: AvailableFilterGroup[];
  dataUrl: string;
  countUrl: string;
  internalCondition?: Condition;
  checkable?: boolean;
}

export interface ViewColumnDefinition
  extends NamedCapable, TypeCapable, AttributesCapable {
  label: string;
  primaryKey: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  sorter: boolean | { multiple: number };
}

export type ViewType = 'PERSONAL' | 'SHARED';
export type ViewSource = 'SYSTEM' | 'CUSTOM';

export interface View {
  id: string;
  name: string;
  type: ViewType;
  source: ViewSource;
  isDefault: boolean;
  filters: ActiveFilter[];
  columns: ViewColumn[];
  tableSize: SizeType;
  condition: Condition;
  pageSize: number;
  sort?: FieldSort[];
  sortId: number;
  pagedQuery: PagedQuery;
}

export interface ViewColumn extends NamedCapable {
  fixed: boolean;
  visible: boolean;
  width?: string;
  sortOrder?: SortOrder;
}

export interface TopBarActionItem<RecordType> extends AttributesCapable<
  Omit<ButtonProps, 'onClick'>
> {
  title: string;
  onClick?: (items: RecordType[]) => void;
  render?: (items: RecordType[]) => React.ReactNode;
}
