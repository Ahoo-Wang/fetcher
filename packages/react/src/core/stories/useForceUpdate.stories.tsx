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
import React from 'react';
import { useForceUpdate } from '../useForceUpdate';
import { Button, Card, Typography, Space, Alert, Statistic } from 'antd';

const { Text } = Typography;

// Component that demonstrates useForceUpdate
function ForceUpdateDemo() {
  const forceUpdate = useForceUpdate();
  const [renderCount, setRenderCount] = React.useState(0);

  // Increment render count on each render
  React.useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, []);

  const handleForceUpdate = () => {
    forceUpdate();
  };

  const handleReset = () => {
    setRenderCount(0);
    forceUpdate();
  };

  return (
    <Card title="useForceUpdate Demo" style={{ width: 500 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Statistic
          title="Component Render Count"
          value={renderCount}
          valueStyle={{ color: '#3f8600' }}
        />

        <Space>
          <Button onClick={handleForceUpdate} type="primary">
            Force Update
          </Button>
          <Button onClick={handleReset}>Reset Counter</Button>
        </Space>

        <Alert
          message="How it works"
          description="Click 'Force Update' to trigger a re-render without changing any state. The render count will increase, demonstrating that the component re-renders."
          type="info"
          showIcon
        />

        <Text type="secondary">
          This demonstrates the useForceUpdate hook for imperatively triggering
          component re-renders when needed.
        </Text>
      </Space>
    </Card>
  );
}

const meta: Meta<typeof ForceUpdateDemo> = {
  title: 'React/Hooks/useForceUpdate',
  component: ForceUpdateDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A React hook that returns a function to force a component to re-render. Useful for imperative updates when external state changes.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
