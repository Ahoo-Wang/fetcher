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
import { renderLoadingSummaries } from './ScenarioVariants.js';
import { recordViewMeta } from './meta.js';

const meta = {
  ...recordViewMeta,
  parameters: {
    ...recordViewMeta.parameters,
    docs: {
      ...recordViewMeta.parameters.docs,
      description: {
        component:
          '表格与汇总：比较本页与所有汇总、加载、空集、失败重试及固定列。错误与恢复操作位于所属汇总范围。',
      },
    },
  },
  title: 'View Engine/Record View/表格与汇总',
};

export default meta;

export const Summaries: Story = {
  name: '汇总 · 本页与所有同时展示',
  render: args => <Scenario {...args} summaries />,
};

export const LoadingSummaries: Story = {
  name: '加载状态 · Spin 与汇总',
  render: renderLoadingSummaries,
};

export const SummaryFailure: Story = {
  name: '汇总失败 · 保留本页与独立重试',
  render: args => <Scenario {...args} summaries failFirstSummary />,
};

export const PinnedColumns: Story = {
  name: '固定列 · 主键在左操作在右',
  render: args => (
    <div style={{ maxWidth: 900 }}>
      <Scenario {...args} summaries />
    </div>
  ),
};

export const EmptySummary: Story = {
  name: '空集汇总 · 保留空值',
  render: args => <Scenario {...args} summaries empty />,
};
