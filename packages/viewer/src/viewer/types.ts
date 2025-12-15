import { ActiveFilter, AvailableFilter, AvailableFilterGroup } from '../filter';
import { TypeCapable } from '../registry';
import { AttributesCapable } from '../types';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { SortOrder } from 'antd/es/table/interface';
import { SizeType } from 'antd/es/config-provider/SizeContext';

export interface ViewDefinition {
  name: string;
  columns: ViewColumnDefinition[];
  availableFilters: AvailableFilterGroup[];
  dataSourceUrl: string;
  defaultPageSize: number;
}

export interface ViewColumnDefinition extends TypeCapable, AttributesCapable {
  title: string;
  dataIndex: string;
  primaryKey: boolean;
  sorter: boolean | { multiple: number};
}

export interface View {
  id: string;
  name: string;
  tableSize?: SizeType;
  filters: ActiveFilter[];
  columns: ViewColumn[];
}

const availableFilter: AvailableFilter = {
  field: {
    name: '',
    label: '',
    type: '',
    format: '',
  },
  component: 'text',
};

const a: ActiveFilter = {
  key: 'name',
  type: 'text',
  field: {
    name: '',
    label: '',
    type: '',
    format: '',
  },
  value: {
    defaultValue: '',
    placeholder: '',
  },
  operator: {
    defaultValue: Operator.EQ
  }
};

export interface ViewColumn {
  dataIndex: string;
  fixed: boolean;
  visible: boolean;
  width?: string;
  sortOrder?: SortOrder
}
