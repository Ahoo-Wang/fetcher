import { ViewState } from '../types';
import { Button, Flex, Input, Popconfirm, Space, Tag } from 'antd';
import { DeleteOutlined, DragOutlined, EditOutlined } from '@ant-design/icons';
import { useState } from 'react';

export interface ViewManageItemProps {
  view: ViewState;
  editing: boolean;
  onEdit: (view: ViewState) => void;
  onCancel: () => void;
  onSave: (view: ViewState) => void;
  onDelete: (view: ViewState) => void;
}

export function ViewManageItem(props: ViewManageItemProps) {
  const { view, editing, onEdit, onCancel, onSave, onDelete } = props;

  const [viewName, setViewName] = useState(view.name);

  const handleCancel = () => {
    setViewName(view.name);
    onCancel();
  };

  const handleSave = () => {
    onSave({ ...view, name: viewName });
  };

  return (
    <>
      {editing ? (
        <Flex
          align="center"
          justify="space-between"
          gap={12}
          style={{ width: '100%' }}
        >
          <Input value={viewName} onChange={e => setViewName(e.target.value)} />
          <Space orientation="horizontal">
            <Button type="default" size="small" onClick={handleCancel}>
              取消
            </Button>
            <Button type="primary" size="small" onClick={handleSave}>
              保存
            </Button>
          </Space>
        </Flex>
      ) : (
        <Flex
          align="center"
          justify="space-between"
          gap={12}
          style={{ width: '100%' }}
        >
          <DragOutlined
            style={{
              color: view.source === 'SYSTEM' ? 'rgba(0,0,0,0.25)' : '',
            }}
          />
          <span style={{ width: '100%', textAlign: 'left' }}>{viewName}</span>
          {view.source === 'CUSTOM' ? (
            <Space orientation="horizontal">
              <EditOutlined onClick={() => onEdit(view)} />
              <Popconfirm
                title="确认删除此视图？"
                description="视图删除后不可恢复，其数据不受影响，是否确认删除？"
                onConfirm={() => onDelete(view)}
                okText="确认"
                cancelText="取消"
              >
                <DeleteOutlined />
              </Popconfirm>
            </Space>
          ) : (
            <Tag>系统</Tag>
          )}
        </Flex>
      )}
    </>
  );
}
