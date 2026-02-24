import { Modal, Space } from 'antd';
import { ViewState, ViewType } from '../types';
import { useState } from 'react';
import { ViewManageItem } from './ViewManageItem';

export interface ViewManageModalProps {
  viewType: ViewType;
  views: ViewState[];
  open?: boolean;
  onCancel?: () => void;
  onDeleteView?: (view: ViewState, onSuccess?: () => void) => void;
  onEditViewName?: (view: ViewState, onSuccess?: () => void) => void;
}

export function ViewManageModal(props: ViewManageModalProps) {
  const { viewType, views, open, onCancel, onEditViewName, onDeleteView } = props;

  const [editingView, setEditingView] = useState<ViewState | null>(null);

  const isEditing = (view: ViewState) => {
    return editingView?.id === view.id;
  };

  const handleOk = () => {};

  const handleCancel = () => {
    onCancel?.();
  };

  const handleCancelEdit = () => {
    setEditingView(null);
  };

  const handleStartEdit = (view: ViewState) => {
    setEditingView(view);
  };

  const handleDeleteView = (view: ViewState) => {
    onDeleteView?.(view, () => {
      setEditingView(null);
    });
  };

  const handleSaveView = (view: ViewState) => {
    onEditViewName?.(view, () => {
      setEditingView(null);
    });
  };

  return (
    <Modal
      title={`${viewType === 'PERSONAL' ? '个人' : '公共'}视图`}
      open={open}
      onOk={handleOk}
      okText="确认"
      cancelText="取消"
      onCancel={handleCancel}
    >
      <Space orientation="vertical" size={12} style={{width: '100%'}}>
        {views.map(view => (
          <ViewManageItem
            editing={isEditing(view)}
            onCancel={handleCancelEdit}
            onDelete={handleDeleteView}
            onEdit={handleStartEdit}
            onSave={handleSaveView}
            view={view}
          />
        ))}
      </Space>

    </Modal>
  );
}
