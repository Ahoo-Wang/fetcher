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
import { AvailableFilterSelectModal } from '../AvailableFilterSelectModal';
import type { AvailableFilterGroup } from '../AvailableFilterSelect';

const meta: Meta<typeof AvailableFilterSelectModal> = {
  title: 'Viewer/Filters/Panel/AvailableFilterSelectModal',
  component: AvailableFilterSelectModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

const mockFilters: AvailableFilterGroup[] = [
  {
    label: '基本筛选',
    filters: [
      {
        key: 'name',
        field: { name: 'name', label: '姓名', type: 'string' },
        component: 'text',
      },
      {
        key: 'age',
        field: { name: 'age', label: '年龄', type: 'number' },
        component: 'number',
      },
    ],
  },
  {
    label: '高级筛选',
    filters: [
      {
        key: 'status',
        field: { name: 'status', label: '状态', type: 'string' },
        component: 'select',
      },
      {
        key: 'date',
        field: { name: 'date', label: '日期', type: 'date' },
        component: 'date',
      },
    ],
  },
];

export const Default: Story = {
  args: {
    open: true,
    title: '选择筛选条件',
    availableFilters: { filters: mockFilters },
    onSave: filters => console.log('保存的筛选条件:', filters),
  },
};
