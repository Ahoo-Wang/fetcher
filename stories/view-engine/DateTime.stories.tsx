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
import '@ahoo-wang/fetcher-view-engine/styles.css';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  DatePickerDemo,
  DateTimeFilterDemo,
  TimeInputDemo,
  type DemoArgs,
} from './DateTimeExamples.js';

const meta = {
  title: 'View Engine/基础组件/日期时间',
  args: { appearance: 'light', disabled: false },
  argTypes: {
    appearance: { control: 'inline-radio', options: ['light', 'dark'] },
    disabled: { control: 'boolean' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '使用独立 view-engine 包的实际组件。组合演示由宿主在点击查询后应用 Wow 表达式，不连接业务服务；示例按浏览器本地时区组合日期与时间。',
      },
    },
  },
} satisfies Meta<DemoArgs>;

export default meta;

type Story = StoryObj<DemoArgs>;

export const DateTimeFilter: Story = {
  name: '字段组合 · 手动查询',
  render: args => <DateTimeFilterDemo {...args} />,
};

export const DatePicker: Story = {
  name: '日期选择',
  render: args => <DatePickerDemo {...args} />,
};

export const TimeInput: Story = {
  name: '时间输入 · 保留精度',
  render: args => <TimeInputDemo {...args} />,
};

export const IncompleteTime: Story = {
  name: '未完成时间输入',
  render: args => <TimeInputDemo {...args} initial="12:" />,
};

export const UnsetValue: Story = {
  name: '未设置值 · 不参与筛选',
  render: args => <DateTimeFilterDemo {...args} unset />,
};

export const DarkDateTimeFilter: Story = {
  ...DateTimeFilter,
  name: '深色 · 字段组合',
  args: { appearance: 'dark' },
};
