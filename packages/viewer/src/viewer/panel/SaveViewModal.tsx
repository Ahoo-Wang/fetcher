import { Modal, Form, Radio, Input } from 'antd';
import { ViewState, ViewType } from '../types';
import { useEffect, useRef } from 'react';
import type { FormInstance } from 'antd/es/form/hooks/useForm';

export interface SaveViewModalProps {
  mode: 'Create' | 'SaveAs';
  open?: boolean;
  defaultViewType?: ViewType;
  defaultViewName?: string;

  onSaveView?: (name: string, type: ViewType) => void;
  onCancel?: () => void;
}

export function SaveViewModal(props: SaveViewModalProps) {
  const { mode, open, defaultViewType, defaultViewName, onSaveView, onCancel } =
    props;

  const handleOk = () => {
    formRef.current?.submit();
  };

  useEffect(() => {
    formRef.current?.setFieldValue('type', defaultViewType || 'PERSONAL');
    formRef.current?.setFieldValue('name', defaultViewName || '');
  }, [defaultViewType, defaultViewName]);

  const handleCancel = () => {
    onCancel?.();
  };

  const options = [
    {
      label: '个人视图',
      value: 'PERSONAL',
    },
    {
      label: '公共视图',
      value: 'SHARED',
    },
  ];

  const formRef = useRef<FormInstance>(null);

  const onFinish = (values: any) => {
    onSaveView?.(values.name, values.type);
  };

  return (
    <Modal
      title={mode === 'Create' ? '创建视图' : '另存为新视图'}
      open={open}
      onOk={handleOk}
      okText="确认"
      onCancel={handleCancel}
      cancelText="取消"
    >
      <Form
        ref={formRef}
        name="basic"
        labelCol={{ span: 5 }}
        initialValues={{ type: defaultViewType || 'PERSONAL' }}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item<ViewState>
          label="视图类型"
          name="type"
          rules={[{ required: true }]}
        >
          <Radio.Group options={options} optionType="button" />
        </Form.Item>
        <Form.Item<ViewState>
          label="视图名称"
          name="name"
          rules={[
            { required: true, message: '请输入视图名称' },
            { type: 'string', min: 1, message: '请输入视图名称' },
          ]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
