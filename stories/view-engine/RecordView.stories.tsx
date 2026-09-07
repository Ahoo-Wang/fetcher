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

import type { Meta } from '@storybook/react-vite';
import type { DemoArgs, Story } from './record-view/demoTypes.js';
import { Scenario } from './record-view/Scenario.js';
import {
  ResponsiveWorkbench,
  ThemeSwitchingRecords,
  renderLoadingSummaries,
} from './record-view/ScenarioVariants.js';
import {
  playBusinessRecords,
  playRestoreFocus,
} from './record-view/persistence.play.js';
import { playCompactWorkbench } from './record-view/workbench.play.js';
import {
  playResponsiveColumns,
  playNarrowRecords,
} from './record-view/responsiveLayout.play.js';
import {
  playCursorRecords,
  playEmptyRecords,
  playQueryFailure,
  playLocalDefinitions,
} from './record-view/querying.play.js';
import {
  playDarkRecords,
  playThemeSwitching,
} from './record-view/themes.play.js';
import {
  playSummaries,
  playLoadingSummaries,
  playSummaryFailure,
  playEmptySummary,
} from './record-view/summaries.play.js';
import { playPinnedColumns } from './record-view/pinnedColumns.play.js';
import { playManageViews } from './record-view/management.play.js';
import { playRuntimeTools } from './record-view/runtimeTools.play.js';
import '@ahoo-wang/fetcher-view-engine/styles.css';

const meta = {
  title: 'View Engine/Record View',
  args: { appearance: 'light' },
  argTypes: {
    appearance: { control: 'inline-radio', options: ['light', 'dark'] },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '以 definitionId 打开订单页。个人、系统与共享视图复用同一 ViewDefinition；每个实例独立保留筛选草稿与已应用配置。演示通过公开包入口接入 ViewHost、Wow paged/cursor 查询与自定义操作、单元格。',
      },
    },
  },
} satisfies Meta<DemoArgs>;
export default meta;

export const BusinessRecords: Story = {
  name: '订单工作台 · 查询与保存',
  render: args => <Scenario {...args} />,
  play: playBusinessRecords,
};

export const CompactWorkbench: Story = {
  name: '紧凑工作台 · 工具栏与筛选收起',
  render: args => <Scenario {...args} summaries pageSize={15} />,
  play: playCompactWorkbench,
};

export const ResponsiveColumns: Story = {
  name: '业务工作台 · 自动列宽与更多记录',
  render: args => <ResponsiveWorkbench {...args} />,
  play: playResponsiveColumns,
};

export const CursorRecords: Story = {
  name: '游标查询 · 只向后翻页',
  render: args => <Scenario {...args} mode="cursor" summaries />,
  play: playCursorRecords,
};

export const EmptyRecords: Story = {
  name: '空列表 · 保留创建入口',
  render: args => <Scenario {...args} empty />,
  play: playEmptyRecords,
};

export const QueryFailure: Story = {
  name: '查询失败 · 保留草稿重试',
  render: args => <Scenario {...args} failFirstQuery />,
  play: playQueryFailure,
};

export const DarkRecords: Story = {
  name: '深色 · 订单工作台',
  args: { appearance: 'dark' },
  render: args => <Scenario {...args} />,
  play: playDarkRecords,
};

export const ThemeSwitching: Story = {
  name: '主题切换 · 保存弹层',
  render: args => <ThemeSwitchingRecords {...args} />,
  play: playThemeSwitching,
};

export const RestoreFocus: Story = {
  name: '仅保存权限 · 还原焦点',
  render: args => <Scenario {...args} saveOnly />,
  play: playRestoreFocus,
};

export const NarrowRecords: Story = {
  name: '窄容器 · 实例选择与表格滚动',
  render: args => (
    <div data-testid="narrow-record-host" style={{ maxWidth: 414 }}>
      <Scenario {...args} />
    </div>
  ),
  play: playNarrowRecords,
};

export const LocalDefinitions: Story = {
  name: '本地定义 · 自定义订单操作',
  render: args => <Scenario {...args} local />,
  play: playLocalDefinitions,
};

export const Summaries: Story = {
  name: '汇总 · 本页与所有同时展示',
  render: args => <Scenario {...args} summaries />,
  play: playSummaries,
};

export const LoadingSummaries: Story = {
  name: '加载状态 · Spin 与汇总',
  render: renderLoadingSummaries,
  play: playLoadingSummaries,
};

export const SummaryFailure: Story = {
  name: '汇总失败 · 保留本页与独立重试',
  render: args => <Scenario {...args} summaries failFirstSummary />,
  play: playSummaryFailure,
};

export const PinnedColumns: Story = {
  name: '固定列 · 主键在左操作在右',
  render: args => (
    <div style={{ maxWidth: 900 }}>
      <Scenario {...args} summaries />
    </div>
  ),
  play: playPinnedColumns,
};

export const EmptySummary: Story = {
  name: '空集汇总 · 保留空值',
  render: args => <Scenario {...args} summaries empty />,
  play: playEmptySummary,
};

export const ManageViews: Story = {
  name: '管理视图 · 改名、排序与删除',
  render: args => <Scenario {...args} failFirstDelete sidebarCollapsed />,
  play: playManageViews,
};

export const RuntimeTools: Story = {
  name: '自动刷新与页面展开',
  render: args => (
    <div style={{ maxWidth: 900 }}>
      <Scenario {...args} />
    </div>
  ),
  play: playRuntimeTools,
};
