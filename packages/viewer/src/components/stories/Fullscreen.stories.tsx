/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState, useRef, useEffect } from 'react';
import { Fullscreen } from '../fullscreen';
import { Space, Card, Typography } from 'antd';
import {
  ExpandOutlined,
  CompressOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const meta: Meta<typeof Fullscreen> = {
  title: 'Viewer/Components/FullScreen',
  component: Fullscreen,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A button component that toggles fullscreen mode. Supports custom target elements, custom icons, and change callbacks. Works across different browsers with proper fallbacks.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    return (
      <Space>
        <Fullscreen />
        <span>Click to toggle fullscreen mode</span>
      </Space>
    );
  },
};

export const WithChangeCallback: Story = {
  render: () => {
    const [message, setMessage] = useState('Not in fullscreen');
    return (
      <Space direction="vertical">
        <Fullscreen
          onChange={isFullScreen => {
            setMessage(
              isFullScreen
                ? 'Entered fullscreen mode'
                : 'Exited fullscreen mode',
            );
          }}
        />
        <Typography.Text>{message}</Typography.Text>
      </Space>
    );
  },
};

export const PrimaryButton: Story = {
  render: () => {
    return (
      <Space>
        <Fullscreen type="primary" />
        <span>Primary button style</span>
      </Space>
    );
  },
};

export const DefaultButton: Story = {
  render: () => {
    return (
      <Space>
        <Fullscreen type="default" />
        <span>Default button style</span>
      </Space>
    );
  },
};

export const DashedButton: Story = {
  render: () => {
    return (
      <Space>
        <Fullscreen type="dashed" />
        <span>Dashed button style</span>
      </Space>
    );
  },
};

export const TextButton: Story = {
  render: () => {
    return (
      <Space>
        <Fullscreen type="text" />
        <span>Text button style</span>
      </Space>
    );
  },
};

export const LinkButton: Story = {
  render: () => {
    return (
      <Space>
        <Fullscreen type="link" />
        <span>Link button style</span>
      </Space>
    );
  },
};

export const CustomIcons: Story = {
  render: () => {
    return (
      <Space>
        <Fullscreen
          enterIcon={<ExpandOutlined />}
          exitIcon={<CompressOutlined />}
        />
        <span>Custom enter/exit icons</span>
      </Space>
    );
  },
};

export const ZoomIcons: Story = {
  render: () => {
    return (
      <Space>
        <Fullscreen
          enterIcon={<ZoomInOutlined />}
          exitIcon={<ZoomOutOutlined />}
        />
        <span>Zoom in/out style icons</span>
      </Space>
    );
  },
};

export const DifferentSizes: Story = {
  render: () => {
    return (
      <Space>
        <Fullscreen size="small" />
        <Fullscreen size="middle" />
        <Fullscreen size="large" />
      </Space>
    );
  },
};

export const Disabled: Story = {
  render: () => {
    return (
      <Space>
        <Fullscreen disabled />
        <span>Disabled button</span>
      </Space>
    );
  },
};

export const WithTargetElement: Story = {
  render: () => {
    const WithTargetElementComponent = () => {
      const cardRef = useRef<HTMLDivElement>(null);
      return (
        <Card
          ref={cardRef}
          title="Target Element Card"
          extra={<Fullscreen target={cardRef} />}
          style={{ width: 400 }}
        >
          <Paragraph>
            This card can be made fullscreen by clicking the button in the top
            right corner.
          </Paragraph>
          <Paragraph>
            When in fullscreen mode, only this card will be displayed, not the
            entire page.
          </Paragraph>
        </Card>
      );
    };

    return <WithTargetElementComponent />;
  },
};

export const InToolbar: Story = {
  render: () => {
    return (
      <Card
        title="Document Viewer"
        extra={
          <Space>
            <Fullscreen type="text" size="small" />
          </Space>
        }
      >
        <Title level={4}>Sample Document</Title>
        <Paragraph>
          This is a sample document viewer with a fullscreen button in the
          toolbar.
        </Paragraph>
        <Paragraph>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </Paragraph>
      </Card>
    );
  },
};

export const MultipleButtons: Story = {
  render: () => {
    const [status1, setStatus1] = useState('Ready');
    const [status2, setStatus2] = useState('Ready');

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Card
          title="Section 1"
          extra={
            <Fullscreen
              type="text"
              onChange={isFullScreen =>
                setStatus1(isFullScreen ? 'FullScreen' : 'Normal')
              }
            />
          }
        >
          <Paragraph>Status: {status1}</Paragraph>
          <Paragraph>
            Click the fullscreen button to toggle fullscreen mode for this
            section.
          </Paragraph>
        </Card>
        <Card
          title="Section 2"
          extra={
            <Fullscreen
              type="text"
              onChange={isFullScreen =>
                setStatus2(isFullScreen ? 'FullScreen' : 'Normal')
              }
            />
          }
        >
          <Paragraph>Status: {status2}</Paragraph>
          <Paragraph>
            Each button can independently toggle fullscreen for its own section.
          </Paragraph>
        </Card>
      </Space>
    );
  },
};

export const WithCustomStyling: Story = {
  render: () => {
    return (
      <Space>
        <Fullscreen
          type="primary"
          shape="circle"
          style={{ backgroundColor: '#1890ff' }}
        />
        <Fullscreen
          type="primary"
          shape="round"
          style={{ backgroundColor: '#52c41a' }}
        />
        <Fullscreen
          type="dashed"
          danger
          style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}
        />
      </Space>
    );
  },
};
