import { Collapse, CollapseProps, Flex } from 'antd';
import { BarItem } from '../../topbar';
import { MenuFoldOutlined } from '@ant-design/icons';
import { View } from '../types';
import { ViewItemGroup } from './ViewItemGroup';

import styles from './ViewPanel.module.less';

export interface ViewPanelProps {
  aggregateName: string;
  views: View[];
  activeView: View;
  countUrl: string;
  onViewChange: (view: View) => void;

  showViewPanel: boolean;
  onViewPanelFold: () => void;
}

export function ViewPanel(props: ViewPanelProps) {
  const { aggregateName, views, activeView, countUrl, onViewChange, onViewPanelFold } = props;

  const personalViews = views.filter(v => v.viewType === 'PERSONAL');
  const publicViews = views.filter(v => v.viewType === 'PUBLIC');

  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: '个人',
      children: (
        <ViewItemGroup
          views={personalViews}
          activeView={activeView}
          countUrl={countUrl}
          onViewChange={view => onViewChange(view)}
        ></ViewItemGroup>
      ),
    },
    {
      key: '2',
      label: '公共',
      children: (
        <ViewItemGroup
          views={publicViews}
          activeView={activeView}
          countUrl={countUrl}
          onViewChange={view => onViewChange(view)}
        ></ViewItemGroup>
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
