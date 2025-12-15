import { TypedComponentRegistry } from '../registry';
import { BarItemType } from './TypedBarItem';
import { TopBarItemProps } from './types';
import { FILTER_BAR_ITEM_TYPE, FilterBarItem } from './FilterBarItem';
import {
  REFRESH_DATA_BAR_ITEM_TYPE,
  RefreshDataBarItem,
} from './RefreshDataBarItem';
import {
  COLUMN_HEIGHT_BAR_ITEM_TYPE,
  ColumnHeightBarItem,
} from './ColumnHeightBarItem';
import { SHARE_LINK_BAR_ITEM_TYPE, ShareLinkBarItem } from './ShareLinkBarItem';

export const barItemRegistry = TypedComponentRegistry.create<
  BarItemType,
  TopBarItemProps
>([
  [FILTER_BAR_ITEM_TYPE, FilterBarItem],
  [REFRESH_DATA_BAR_ITEM_TYPE, RefreshDataBarItem],
  [COLUMN_HEIGHT_BAR_ITEM_TYPE, ColumnHeightBarItem],
  [SHARE_LINK_BAR_ITEM_TYPE, ShareLinkBarItem],
]);
