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
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  FieldFilter,
  FilterSelect,
} from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

interface DemoArgs {
  appearance: 'light' | 'dark';
  disabled: boolean;
}

function SelectDemo({ appearance, disabled }: DemoArgs) {
  const [value, setValue] = useState<string | null>('pending');
  return (
    <section
      className="fve-root"
      data-theme={appearance}
      aria-label="可清空的值选择器"
      style={{
        padding: 24,
        background: 'var(--fve-background)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <FieldFilter
        field={{ field: 'status', label: '订单状态' }}
        operator="EQ"
        operators={[{ value: 'EQ', label: '等于' }]}
        onOperatorChange={() => {}}
        disabled={disabled}
      >
        <FilterSelect
          label="订单状态值"
          value={value}
          options={[
            { value: 'pending', label: '待处理' },
            { value: 'done', label: '已完成' },
          ]}
          onValueChange={setValue}
          onClear={() => setValue(null)}
          placeholder="不限"
          inline
          disabled={disabled}
        />
      </FieldFilter>
      <output aria-label="当前值">
        {value === null
          ? '未设置值'
          : value === 'pending'
            ? '待处理'
            : '已完成'}
      </output>
    </section>
  );
}

const meta = {
  title: 'View Engine/基础组件/Select',
  args: { appearance: 'light', disabled: false },
  argTypes: {
    appearance: { control: 'inline-radio', options: ['light', 'dark'] },
    disabled: { control: 'boolean' },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<DemoArgs>;

export default meta;

type Story = StoryObj<DemoArgs>;

export const Clearable: Story = {
  name: '选择、清空与重新选择',
  render: args => <SelectDemo {...args} />,
};
