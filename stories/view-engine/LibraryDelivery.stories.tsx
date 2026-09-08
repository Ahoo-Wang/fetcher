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
import { FilterPersistenceExample } from '../../packages/view-engine/examples/react/FilterPersistenceExample.js';
import type { OrderEvent } from '../../packages/view-engine/examples/react/orderService.js';
import {
  playExtensions,
  playFailureAndScope,
  playRefreshRecovery,
  playNarrowDark,
} from './libraryDelivery.play.js';
import { playFilterPersistence } from './filterPersistence.play.js';

const meta = {
  title: 'View Engine/Library Delivery',
  component: OrderExample,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '可复制的公共包接入示例：本地订单服务与五类独立扩展。所有 View Engine 导入均解析到构建产物。',
      },
    },
  },
} satisfies Meta<typeof OrderExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FiveExtensions: Story = {
  name: '公共包 · 五类扩展与手动查询',
  args: { onEvent: fn<(event: OrderEvent) => void>() },
  play: playExtensions,
};
export const FilterPersistence: Story = {
  name: '公共包 · 组件配置 JSON 保存与重新打开',
  render: args => <FilterPersistenceExample appearance={args.appearance} />,
  play: playFilterPersistence,
};
export const FailureAndScopedRefresh: Story = {
  name: '公共包 · 失败恢复与异步作用域',
  args: {
    failFirstRead: true,
    failFirstWrite: true,
    onEvent: fn<(event: OrderEvent) => void>(),
  },
  play: playFailureAndScope,
};
export const RefreshRecovery: Story = {
  name: '公共包 · 刷新重试不重复写入',
  args: {
    failRefreshAfterWrite: true,
    onEvent: fn<(event: OrderEvent) => void>(),
  },
  play: playRefreshRecovery,
};
export const NarrowDark: Story = {
  name: '公共包 · 深色窄容器与弹层',
  args: { appearance: 'dark', onEvent: fn<(event: OrderEvent) => void>() },
  render: args => (
    <div data-testid="library-delivery-container" style={{ maxWidth: 392 }}>
      <OrderExample {...args} />
    </div>
  ),
  play: playNarrowDark,
};

export const LocalStorageViews: Story = {
  name: '开发验证 · 浏览器本地视图',
  args: {
    persistViews: true,
    scopeKey: 'storybook:local-view-host',
    initialSidebarCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          '保存、另存、改名、删除及排序写入 localStorage。可以刷新浏览器或重新打开视图验证恢复；重置仅清除此示例的视图配置。',
      },
    },
  },
};

export const HttpViewService: Story = {
  name: '契约验证 · HTTP 视图服务',
  tags: ['!test'],
  args: {
    scopeKey: 'tenant:alice',
    accessToken: 'alice-token',
    viewServiceTimeoutMs: 1000,
    initialSidebarCollapsed: false,
  },
  render: args => (
    <OrderExample
      {...args}
      viewServiceUrl={
        new URLSearchParams(location.search).get('viewService') ??
        'http://127.0.0.1:6010/view-service/'
      }
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          '运行 verify-http-view-host.mjs --serve 启动测试服务。所有视图读写通过 HTTP；五类组件扩展留在前端。',
      },
    },
  },
};
