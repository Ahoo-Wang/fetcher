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
import {
  BuiltinCellsExample,
  StandaloneCellsExample,
} from '../../packages/view-engine/examples/react/BuiltinCellsExample.js';
import source from '../../packages/view-engine/examples/react/BuiltinCellsExample.tsx?raw';
const meta = {
  title: 'View Engine/单元格/内置组件',
  component: BuiltinCellsExample,
  parameters: {
    layout: 'fullscreen',
    docs: {
      source: { code: source, language: 'tsx' },
      description: {
        component:
          '文本、标签、状态、链接、日期时间、数字。仅配置 renderer 即可使用；独立组件可直接组合，金额与百分比复用字段数值格式。',
      },
    },
  },
} satisfies Meta<typeof BuiltinCellsExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Workbench: Story = { name: '内置单元格 · 视图配置' };
export const Standalone: Story = {
  name: '独立组合 · 常用展示',
  render: args => <StandaloneCellsExample appearance={args.appearance} />,
};
export const DarkNarrow: Story = {
  name: '深色 · 窄容器',
  args: { appearance: 'dark' },
  render: args => (
    <div style={{ maxWidth: 414 }}>
      <StandaloneCellsExample appearance={args.appearance} />
    </div>
  ),
};
export const InvalidData: Story = {
  name: '异常数据 · 占位与安全链接',
  args: { invalidData: true },
};
export const BrowserStorage: Story = {
  name: '开发验证 · 刷新后恢复',
  args: { persist: true, scopeKey: 'builtin-cells-browser' },
};
