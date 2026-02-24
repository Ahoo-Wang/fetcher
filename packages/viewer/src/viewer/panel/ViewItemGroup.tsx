import { ViewState, GetRecordCountActionCapable } from '../';
import { Flex } from 'antd';
import { ViewItem } from './';

/**
 * Props for the ViewItemGroup component.
 *
 * @interface ViewItemGroupProps
 */
export interface ViewItemGroupProps extends GetRecordCountActionCapable {
  /** Array of view configurations to display in the group */
  views: ViewState[];
  /** The currently active/selected view */
  activeView: ViewState;
  /** API endpoint URL for fetching record counts for each view */
  countUrl: string;
  /** Callback function called when a view is selected/clicked */
  onSwitchView: (view: ViewState) => void;
}

export function ViewItemGroup(props: ViewItemGroupProps) {
  const { views, activeView, countUrl, onSwitchView, onGetRecordCount } = props;

  return (
    <Flex vertical align="start">
      {views.map(view => (
        <div
          key={view.id}
          onClick={() => onSwitchView(view)}
          style={{ width: '100%', cursor: 'pointer' }}
        >
          <ViewItem
            active={view.id === activeView.id}
            countUrl={countUrl}
            view={view}
            onGetRecordCount={onGetRecordCount}
          />
        </div>
      ))}
    </Flex>
  );
}
