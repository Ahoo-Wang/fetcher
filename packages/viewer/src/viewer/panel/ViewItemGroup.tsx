import { View } from '../types';
import { Flex } from 'antd';
import { ViewItem } from './ViewItem';

/**
 * Props for the ViewItemGroup component.
 *
 * @interface ViewItemGroupProps
 */
export interface ViewItemGroupProps {
  /** Array of view configurations to display in the group */
  views: View[];
  /** The currently active/selected view */
  activeView: View;
  /** API endpoint URL for fetching record counts for each view */
  countUrl: string;
  /** Callback function called when a view is selected/clicked */
  onViewChange: (view: View) => void;
}

/**
 * ViewItemGroup Component
 *
 * A container component that displays a vertical list of view items, allowing users to
 * switch between different views. Each view item shows the view name, system tag (if applicable),
 * and record count. The component handles click events to change the active view and
 * provides visual feedback for the currently selected view.
 *
 * @param props - The properties for configuring the view item group
 * @param props.views - Array of view objects to display as selectable items
 * @param props.activeView - The currently active view (used for visual highlighting)
 * @param props.countUrl - API endpoint for fetching record counts for each view
 * @param props.onViewChange - Callback fired when user clicks on a different view
 *
 * @example
 * ```tsx
 * import { ViewItemGroup } from './ViewItemGroup';
 * import type { View } from '../types';
 *
 * const views: View[] = [
 *   {
 *     id: 'all-users',
 *     name: 'All Users',
 *     viewType: 'PUBLIC',
 *     viewSource: 'CUSTOM',
 *     isDefault: true,
 *     filters: [],
 *     columns: [
 *       { dataIndex: 'id', fixed: false, visible: true },
 *       { dataIndex: 'name', fixed: false, visible: true },
 *       { dataIndex: 'email', fixed: false, visible: true }
 *     ],
 *     tableSize: 'middle',
 *     condition: {},
 *     pageSize: 20,
 *     sortId: 1
 *   },
 *   {
 *     id: 'active-users',
 *     name: 'Active Users',
 *     viewType: 'PERSONAL',
 *     viewSource: 'CUSTOM',
 *     isDefault: false,
 *     filters: [],
 *     columns: [
 *       { dataIndex: 'id', fixed: false, visible: true },
 *       { dataIndex: 'name', fixed: false, visible: true },
 *       { dataIndex: 'status', fixed: false, visible: true }
 *     ],
 *     tableSize: 'middle',
 *     condition: { status: 'active' },
 *     pageSize: 20,
 *     sortId: 2
 *   },
 *   {
 *     id: 'admin-users',
 *     name: 'Admin Users',
 *     viewType: 'PUBLIC',
 *     viewSource: 'SYSTEM',
 *     isDefault: false,
 *     filters: [],
 *     columns: [
 *       { dataIndex: 'id', fixed: false, visible: true },
 *       { dataIndex: 'name', fixed: false, visible: true },
 *       { dataIndex: 'role', fixed: false, visible: true }
 *     ],
 *     tableSize: 'middle',
 *     condition: { role: 'admin' },
 *     pageSize: 10,
 *     sortId: 3
 *   }
 * ];
 *
 * function ViewSelector() {
 *   const [activeView, setActiveView] = useState(views[0]);
 *
 *   const handleViewChange = (view: View) => {
 *     setActiveView(view);
 *     // Update table data, filters, etc. based on new view
 *     console.log('Switched to view:', view.name);
 *   };
 *
 *   return (
 *     <ViewItemGroup
 *       views={views}
 *       activeView={activeView}
 *       countUrl="/api/users/count"
 *       onViewChange={handleViewChange}
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Integration with data fetching
 * function ViewPanel({ views, onViewSelect }) {
 *   return (
 *     <div className="view-panel">
 *       <h3>Available Views</h3>
 *       <ViewItemGroup
 *         views={views}
 *         activeView={views.find(v => v.isDefault) || views[0]}
 *         countUrl="/api/records/count"
 *         onViewChange={(view) => {
 *           onViewSelect(view);
 *           // Could trigger data refetch with new view's condition
 *         }}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function ViewItemGroup(props: ViewItemGroupProps) {
  const { views, activeView, countUrl, onViewChange } = props;

  return (
    <Flex vertical align="start">
      {views.map(view => (
        <div
          key={view.id}
          onClick={() => onViewChange(view)}
          style={{ width: '100%', cursor: 'pointer' }}
        >
          <ViewItem
            active={view.id === activeView.id}
            countUrl={countUrl}
            view={view}
          />
        </div>
      ))}
    </Flex>
  );
}
