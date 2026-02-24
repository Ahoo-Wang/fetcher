import { Collapse, CollapseProps, Flex, Space } from 'antd';
import { BarItem, GetRecordCountActionCapable } from '../../';
import {
  MenuFoldOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { ViewState, ViewType } from '../';

import styles from './ViewPanel.module.less';
import { useMemo, useState, MouseEvent } from 'react';
import { ViewManageModal, SaveViewModal, ViewItemGroup } from './';
import type * as React from 'react';

export interface ViewPanelProps extends GetRecordCountActionCapable {
  name: string;
  views: ViewState[];
  activeView: ViewState;
  countUrl: string;
  onSwitchView: (view: ViewState) => void;

  onShowViewPanelChange: (showViewPanel: boolean) => void;

  onCreateView: (view: ViewState, onSuccess?: () => void) => void;
  onUpdateView: (view: ViewState, onSuccess?: () => void) => void;
  onDeleteView: (view: ViewState, onSuccess?: () => void) => void;
}

export function ViewPanel(props: ViewPanelProps) {
  const {
    name,
    views,
    activeView,
    countUrl,
    onSwitchView,
    onShowViewPanelChange,
    onCreateView,
    onUpdateView,
    onDeleteView,
    onGetRecordCount
  } = props;

  const personalViews = useMemo(() => {
    return views.filter(v => v.type === 'PERSONAL');
  }, [views]);
  const sharedViews = useMemo(() => {
    return views.filter(v => v.type === 'SHARED');
  }, [views]);

  const [personalViewManageOpened, setPersonalViewManageOpened] =
    useState(false);
  const [sharedViewManageOpened, setSharedViewManageOpened] = useState(false);
  const [saveViewModalType, setSaveViewModalType] = useState<
    'Create' | 'SaveAs'
  >('Create');
  const [saveViewModalOpened, setSaveViewModalOpened] = useState(false);
  const [defaultCreateViewType, setDefaultCreateViewType] =
    useState<ViewType>('PERSONAL');

  const handleOpenViewManage = (e: MouseEvent, type: ViewType) => {
    e.preventDefault();
    e.stopPropagation();
    switch (type) {
      case 'PERSONAL':
        setPersonalViewManageOpened(true);
        break;
      case 'SHARED':
        setSharedViewManageOpened(true);
        break;
    }
  };

  const handleCreateView = (e: MouseEvent, type: ViewType) => {
    e.stopPropagation();
    setDefaultCreateViewType(type);
    setSaveViewModalType('Create');
    setSaveViewModalOpened(true);
  };

  const handleCreateViewConfirmed = (name: string, type: ViewType) => {
    onCreateView?.(
      {
        ...activeView,
        name,
        type,
        source: 'CUSTOM',
      },
      () => {
        setSaveViewModalOpened(false);
      },
    );
  };

  const handleEditViewName = (view: ViewState, onSuccess?: () => void) => {
    onUpdateView?.(view, onSuccess);
  };

  const handleDeleteView = (view: ViewState) => {
    onDeleteView?.(view);
  };

  const genExtra = (type: ViewType) => (
    <Space>
      <SettingOutlined onClick={e => handleOpenViewManage(e, type)} />
      <PlusOutlined onClick={e => handleCreateView(e, type)} />
    </Space>
  );

  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: '个人',
      children: (
        <ViewItemGroup
          views={personalViews}
          activeView={activeView}
          countUrl={countUrl}
          onSwitchView={view => onSwitchView(view)}
          onGetRecordCount={onGetRecordCount}
        />
      ),
      extra: genExtra('PERSONAL'),
    },
    {
      key: '2',
      label: '公共', // "Public" in Chinese
      children: (
        <ViewItemGroup
          views={sharedViews}
          activeView={activeView}
          countUrl={countUrl}
          onSwitchView={view => onSwitchView(view)}
          onGetRecordCount={onGetRecordCount}
        />
      ),
      extra: genExtra('SHARED'),
    },
  ];

  return (
    <>
      <Flex vertical gap="16px">
        <Flex align="center" justify="space-between" className={styles.top}>
          <div className={styles.title}>{name}</div>
          <div
            onClick={() => {
              onShowViewPanelChange(false);
            }}
          >
            <BarItem icon={<MenuFoldOutlined />} active={false} />
          </div>
        </Flex>
        <Collapse
          items={items}
          defaultActiveKey={['1', '2']}
          className={styles.customCollapse}
        />
      </Flex>
      <ViewManageModal
        viewType="PERSONAL"
        views={personalViews}
        open={personalViewManageOpened}
        onCancel={() => setPersonalViewManageOpened(false)}
        onEditViewName={handleEditViewName}
        onDeleteView={handleDeleteView}
      />
      <ViewManageModal
        viewType="SHARED"
        views={sharedViews}
        open={sharedViewManageOpened}
        onCancel={() => setSharedViewManageOpened(false)}
        onEditViewName={handleEditViewName}
        onDeleteView={handleDeleteView}
      />
      <SaveViewModal
        mode={saveViewModalType}
        open={saveViewModalOpened}
        defaultViewType={defaultCreateViewType}
        onSaveView={handleCreateViewConfirmed}
        onCancel={() => setSaveViewModalOpened(false)}
      />
    </>
  );
}
