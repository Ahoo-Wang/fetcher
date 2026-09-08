/// <reference types="vite/client" />
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
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { OrderExample } from '../../packages/view-engine/examples/react/OrderExample.js';
import type { OrderEvent } from '../../packages/view-engine/examples/react/orderService.js';

import exampleSource from '../../packages/view-engine/examples/react/OrderExample.tsx?raw';

const meta = {
  title: 'View Engine/快速开始',
  component: OrderExample,
  parameters: {
    layout: 'fullscreen',
    docs: {
      source: { code: exampleSource, language: 'tsx' },
      description: {
        component:
          '复制 packages/view-engine/examples/react 目录即可运行此示例。OrderExample 将 ViewHost、访问范围与扩展传给 ViewPage。代码面板展示实际示例源码；库导入仍解析到构建产物。',
      },
    },
  },
} satisfies Meta<typeof OrderExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FiveExtensions: Story = {
  name: '公共包 · 五类扩展与手动查询',
  args: { onEvent: fn<(event: OrderEvent) => void>() },
};

export const NarrowDark: Story = {
  name: '公共包 · 深色窄容器与弹层',
  args: { appearance: 'dark', onEvent: fn<(event: OrderEvent) => void>() },
  render: args => (
    <div data-testid="library-delivery-container" style={{ maxWidth: 392 }}>
      <OrderExample {...args} />
    </div>
  ),
};
