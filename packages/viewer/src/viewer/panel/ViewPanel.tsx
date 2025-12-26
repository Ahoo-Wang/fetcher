import { Collapse, CollapseProps, Flex } from 'antd';
import { BarItem } from '../../topbar';
import { MenuFoldOutlined } from '@ant-design/icons';
import { View } from '../types';
import { ViewItemGroup } from './ViewItemGroup';

import styles from './ViewPanel.module.less';

/**
 * Props for the ViewPanel component.
 *
 * @interface ViewPanelProps
 */
export interface ViewPanelProps {
  /** Name of the aggregate/entity being viewed (displayed as panel title) */
  aggregateName: string;
  /** Array of all available views (both personal and public) */
  views: View[];
  /** The currently active/selected view */
  activeView: View;
  /** API endpoint URL for fetching record counts for views */
  countUrl: string;
  /** Callback function called when user selects a different view */
  onViewChange: (view: View) => void;

  /** Whether the view panel is currently visible (used for fold/unfold logic) */
  showViewPanel: boolean;
  /** Callback function called when user clicks the fold/unfold button */
  onViewPanelFold: () => void;
}

/**
 * ViewPanel Component
 *
 * A comprehensive panel component that organizes and displays data views in a collapsible,
 * categorized interface. Views are separated into "Personal" (个人) and "Public" (公共)
 * sections, allowing users to easily manage their own views while accessing shared ones.
 * The panel includes a header with the aggregate name and a fold/unfold control.
 *
 * @param props - The properties for configuring the view panel
 * @param props.aggregateName - Display name for the data entity being viewed
 * @param props.views - Complete array of available views (mixed personal/public)
 * @param props.activeView - Currently selected view for highlighting
 * @param props.countUrl - API endpoint for fetching view record counts
 * @param props.onViewChange - Callback when user selects a different view
 * @param props.showViewPanel - Current visibility state of the panel
 * @param props.onViewPanelFold - Callback when user toggles panel visibility
 *
 * @example
 * ```tsx
 * import { ViewPanel } from './ViewPanel';
 * import type { View } from '../types';
 *
 * const userViews: View[] = [
 *   {
 *     id: 'personal-1',
 *     name: 'My Active Users',
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
 *     sortId: 1
 *   },
 *   {
 *     id: 'public-1',
 *     name: 'All Team Members',
 *     viewType: 'PUBLIC',
 *     viewSource: 'CUSTOM',
 *     isDefault: true,
 *     filters: [],
 *     columns: [
 *       { dataIndex: 'id', fixed: false, visible: true },
 *       { dataIndex: 'name', fixed: false, visible: true },
 *       { dataIndex: 'department', fixed: false, visible: true }
 *     ],
 *     tableSize: 'middle',
 *     condition: {},
 *     pageSize: 25,
 *     sortId: 2
 *   },
 *   {
 *     id: 'system-1',
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
 * function DataViewer() {
 *   const [activeView, setActiveView] = useState(userViews[1]); // Default to public view
 *   const [showPanel, setShowPanel] = useState(true);
 *
 *   const handleViewChange = (view: View) => {
 *     setActiveView(view);
 *     // Update table data, filters, sorting based on new view
 *     console.log('Switched to view:', view.name);
 *   };
 *
 *   const handlePanelToggle = () => {
 *     setShowPanel(!showPanel);
 *   };
 *
 *   return (
 *     <div className="data-viewer">
 *       <ViewPanel
 *         aggregateName="用户管理" // "User Management" in Chinese
 *         views={userViews}
 *         activeView={activeView}
 *         countUrl="/api/users/count"
 *         onViewChange={handleViewChange}
 *         showViewPanel={showPanel}
 *         onViewPanelFold={handlePanelToggle}
 *       />
 *     </div>
 *   );
 * }
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Integration with routing and URL state
 * function RoutedViewPanel({ views, currentViewId }) {
 *   const activeView = views.find(v => v.id === currentViewId) || views[0];
 *
 *   const handleViewChange = (view: View) => {
 *     // Update URL with new view ID
 *     navigate(`/data?view=${view.id}`);
 *   };
 *
 *   return (
 *     <ViewPanel
 *       aggregateName="数据视图"
 *       views={views}
 *       activeView={activeView}
 *       countUrl="/api/records/count"
 *       onViewChange={handleViewChange}
 *       showViewPanel={true}
 *       onViewPanelFold={() => handlePanelToggle()}
 *     />
 *   );
 * }
 * ```
 */
export function ViewPanel(props: ViewPanelProps) {
  // Extract props for cleaner code
  const {
    aggregateName,
    views,
    activeView,
    countUrl,
    onViewChange,
    onViewPanelFold,
  } = props;

  /**
   * Separate views into personal and public categories.
   * Personal views are user-specific, public views are shared across users.
   * This categorization drives the collapsible sections in the UI.
   */
  const personalViews = views.filter(v => v.type === 'PERSONAL');
  const publicViews = views.filter(v => v.type === 'SHARED');

  /**
   * Configuration for the collapsible sections.
   * Each section contains a ViewItemGroup with the filtered views.
   * Both sections are expanded by default for better user experience.
   */
  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: '个人', // "Personal" in Chinese
      children: (
        <ViewItemGroup
          views={personalViews}
          activeView={activeView}
          countUrl={countUrl}
          onViewChange={view => onViewChange(view)}
        />
      ),
    },
    {
      key: '2',
      label: '公共', // "Public" in Chinese
      children: (
        <ViewItemGroup
          views={publicViews}
          activeView={activeView}
          countUrl={countUrl}
          onViewChange={view => onViewChange(view)}
        />
      ),
    },
  ];

  return (
    <Flex vertical gap="16px">
      <Flex align="center" justify="space-between" className={styles.top}>
        <div className={styles.title}>{aggregateName}</div>
        <div onClick={onViewPanelFold}>
          <BarItem icon={<MenuFoldOutlined />} active={false} />
        </div>
      </Flex>
      <Collapse
        items={items}
        defaultActiveKey={['1', '2']}
        className={styles.customCollapse}
      />
    </Flex>
  );
}
