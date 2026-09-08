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
import { recordViewMeta } from './meta.js';

const meta = {
  ...recordViewMeta,
  parameters: {
    ...recordViewMeta.parameters,
    docs: {
      ...recordViewMeta.parameters.docs,
      description: {
        component:
          '视图管理：演示保存权限、焦点恢复、改名、排序和删除。系统视图的名称与删除权限受宿主约束。',
      },
    },
  },
  title: 'View Engine/Record View/视图管理',
};

export default meta;

export const RestoreFocus: Story = {
  name: '仅保存权限 · 还原焦点',
  render: args => <Scenario {...args} saveOnly />,
};

export const ManageViews: Story = {
  name: '管理视图 · 改名、排序与删除',
  render: args => <Scenario {...args} failFirstDelete sidebarCollapsed />,
};
