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
import type { Story } from './demoTypes.js';
import { Scenario } from './Scenario.js';
import {
  ResponsiveWorkbench,
  ThemeSwitchingRecords,
} from './ScenarioVariants.js';
import { recordViewMeta } from './meta.js';

const meta = {
  ...recordViewMeta,
  parameters: {
    ...recordViewMeta.parameters,
    docs: {
      ...recordViewMeta.parameters.docs,
      description: {
        component:
          '布局与主题：操作紧凑工作台、响应式列宽、窄容器与深色弹层；通过按钮切换主题或容器宽度。',
      },
    },
  },
  title: 'View Engine/Record View/布局与主题',
};

export default meta;

export const CompactWorkbench: Story = {
  name: '紧凑工作台 · 工具栏与筛选收起',
  render: args => <Scenario {...args} summaries pageSize={15} />,
};

export const ResponsiveColumns: Story = {
  name: '业务工作台 · 自动列宽与更多记录',
  render: args => <ResponsiveWorkbench {...args} />,
};

export const DarkRecords: Story = {
  name: '深色 · 订单工作台',
  args: { appearance: 'dark' },
  render: args => <Scenario {...args} />,
};

export const ThemeSwitching: Story = {
  name: '主题切换 · 保存弹层',
  render: args => <ThemeSwitchingRecords {...args} />,
};

export const NarrowRecords: Story = {
  name: '窄容器 · 实例选择与表格滚动',
  render: args => (
    <div data-testid="narrow-record-host" style={{ maxWidth: 414 }}>
      <Scenario {...args} />
    </div>
  ),
};
