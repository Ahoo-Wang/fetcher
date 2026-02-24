import { GetRecordCountActionCapable, ViewState } from '../';
import { Flex, Tag } from 'antd';
import styles from './ViewPanel.module.less';
import { useEffect, useState } from 'react';
import { all } from '@ahoo-wang/fetcher-wow';

/**
 * Props for the ViewItem component.
 *
 * @interface ViewItemProps
 */
export interface ViewItemProps extends GetRecordCountActionCapable {
  /** The view configuration containing name, type, filters, and other metadata */
  view: ViewState;
  /** API endpoint URL for fetching the count of records matching this view's condition */
  countUrl: string;
  /** Whether this view item is currently active/selected */
  active: boolean;
}

/**
 * ViewItem Component
 *
 * A compact component that displays a view item in a list or panel. It shows the view name,
 * a system tag for system views, and the record count (when not active). The component
 * automatically fetches and displays the count of records that match the view's condition
 * using a debounced query to avoid excessive API calls.
 *
 * @param props - The properties for configuring the view item
 * @param props.view - The view configuration with name, type, condition, and metadata
 * @param props.countUrl - API endpoint for fetching record count
 * @param props.active - Whether this view is currently selected/active
 *
 * @example
 * ```tsx
 * import { ViewItem } from './ViewItem';
 * import type { View } from '../types';
 *
 * const userView: View = {
 *   id: 'user-list',
 *   name: 'All Users',
 *   viewType: 'PUBLIC',
 *   viewSource: 'CUSTOM',
 *   isDefault: true,
 *   filters: [],
 *   columns: [
 *     { dataIndex: 'id', fixed: false, visible: true },
 *     { dataIndex: 'name', fixed: false, visible: true },
 *     { dataIndex: 'email', fixed: false, visible: true }
 *   ],
 *   tableSize: 'middle',
 *   condition: { status: 'active' },
 *   pageSize: 20,
 *   sortId: 1
 * };
 *
 * function ViewList() {
 *   return (
 *     <div>
 *       <ViewItem
 *         view={userView}
 *         countUrl="/api/users/count"
 *         active={false}
 *       />
 *       <ViewItem
 *         view={systemView}
 *         countUrl="/api/users/count"
 *         active={true}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // System view with special styling
 * const systemView: View = {
 *   id: 'system-admin',
 *   name: 'Admin Users',
 *   viewType: 'PUBLIC',
 *   viewSource: 'SYSTEM', // This will show a "系统" tag
 *   isDefault: false,
 *   filters: [],
 *   columns: [],
 *   tableSize: 'middle',
 *   condition: { role: 'admin' },
 *   pageSize: 10,
 *   sortId: 2
 * };
 * ```
 */
export function ViewItem(props: ViewItemProps) {
  // Extract props for cleaner code
  const { view, countUrl, active, onGetRecordCount } = props;

  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    if (onGetRecordCount) {
      onGetRecordCount(countUrl, view.condition || all()).then(recordCount => {
        setRecordCount(recordCount || 0);
      });
    }
  }, [countUrl, onGetRecordCount, view.condition]);

  return (
    <Flex
      align="center"
      justify="space-between"
      className={`${styles.viewItem} ${active ? styles.active : ''}`}
    >
      <div className={styles.viewName}>
        <span className={styles.viewNameText} data-tooltip={view.name}>
          {view.name}
        </span>
        {view.source === 'SYSTEM' && (
          <Tag className={styles.viewNameTag}>系统</Tag>
        )}
      </div>
      {!active && (
        <div>
          {recordCount && recordCount > 999 ? '999+' : recordCount || 0}
        </div>
      )}
    </Flex>
  );
}
