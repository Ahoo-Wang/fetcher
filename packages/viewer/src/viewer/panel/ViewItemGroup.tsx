import { View } from '../types';
import { Flex } from 'antd';
import { ViewItem } from './ViewItem';

export interface ViewItemGroupProps {
  views: View[];
  activeView: View;
  countUrl: string;
  onViewChange: (view: View) => void;
}

export function ViewItemGroup(props: ViewItemGroupProps) {
  const { views, activeView, countUrl, onViewChange } = props;

  return (
    <Flex vertical align="start">
      {views.map(view => (
        <div onClick={() => onViewChange(view)} style={{ width: '100%' }}>
          <ViewItem
            active={view.id === activeView.id}
            countUrl={countUrl}
            view={view}
          ></ViewItem>
        </div>
      ))}
    </Flex>
  );
}
