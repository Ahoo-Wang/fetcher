import { ActiveFilter, AvailableFilterGroup } from '../filter';
import { TypeCapable } from '../registry';
import { AttributesCapable } from '../types';
import { SortOrder } from 'antd/es/table/interface';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Condition, FieldSort } from '@ahoo-wang/fetcher-wow';
import React from 'react';
import { ButtonProps } from 'antd';

export interface ViewDefinition {
  name: string;
  columns: ViewColumnDefinition[];
  availableFilters: AvailableFilterGroup[];
  dataSourceUrl: string;
  internalCondition?: Condition;
  checkable?: boolean;
}

export interface ViewColumnDefinition extends TypeCapable, AttributesCapable {
  title: string;
  dataIndex: string;
  primaryKey: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  sorter: boolean | { multiple: number};
}

export interface View {
  id: string;
  name: string;
  filters: ActiveFilter[];
  columns: ViewColumn[];
  tableSize: SizeType;
  condition: Condition;
  pageSize: number;
  sort?: FieldSort[];
}

export interface ViewColumn {
  dataIndex: string;
  fixed: boolean;
  visible: boolean;
  width?: string;
  sortOrder?: SortOrder
}


export interface TopBarActionItem<RecordType> extends AttributesCapable<Omit<ButtonProps, 'onClick'>> {
  title: string;
  onClick?: (items: RecordType[]) => void;
  render?: (items: RecordType[]) => React.ReactNode;
}
