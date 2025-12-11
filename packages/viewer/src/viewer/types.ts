import { ActiveFilter, AvailableFilter, AvailableFilterGroup } from '../filter';
import { TypeCapable } from '../registry';
import { AttributesCapable } from '../types';
import { FetchRequest } from '@ahoo-wang/fetcher';

export interface ViewDefinition {
  name: string;
  columns: ViewColumnDefinition[];
  availableFilters: AvailableFilterGroup[];
  fetchRequest: Omit<FetchRequest, 'body'>;
}

export interface ViewColumnDefinition extends TypeCapable, AttributesCapable {
  title: string;
  dataIndex: string;
  primaryKey: boolean;
  sortable: boolean;
}

export interface View {
  id: string;
  name: string;
  filters: ActiveFilter[];
  columns: ViewColumn[];
}

export interface ViewColumn {
  dataIndex: string;
  fixed: boolean;
  visible: boolean;
  width?: string;
}
