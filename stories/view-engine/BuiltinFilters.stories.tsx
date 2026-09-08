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
/// <reference types="vite/client" />
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuiltinFiltersExample } from '../../packages/view-engine/examples/react/BuiltinFiltersExample.js';
import source from '../../packages/view-engine/examples/react/BuiltinFiltersExample.tsx?raw';
const meta = {
  title: 'View Engine/过滤器/内置组件',
  component: BuiltinFiltersExample,
  parameters: {
    layout: 'fullscreen',
    docs: {
      source: { code: source, language: 'tsx' },
      description: {
        component:
          '本地多选、远程单选/多选、多值文本和日期时间区间。候选经 Fetcher 读取，分页复用 CursorPage，保存只包含组件属性。',
      },
    },
  },
} satisfies Meta<typeof BuiltinFiltersExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Workbench: Story = { name: '内置组件 · 查询与恢复' };
export const NextPageFailure: Story = {
  name: '远程分页 · 保留已有候选并重试',
  args: { failNextPage: true },
};
export const ResolveFailure: Story = {
  name: '标签回填 · 保留保存名称并重试',
  args: { failResolve: true },
};
export const DarkNarrow: Story = {
  name: '深色 · 窄容器',
  args: { appearance: 'dark' },
  render: args => (
    <div style={{ maxWidth: 414 }}>
      <BuiltinFiltersExample {...args} />
    </div>
  ),
};
export const BrowserStorage: Story = {
  name: '开发验证 · 刷新后恢复',
  args: { persist: true, scopeKey: 'builtin-browser' },
};
