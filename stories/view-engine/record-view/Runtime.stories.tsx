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
          '运行时工具：在全局工具栏启用自动刷新或展开页面，观察倒计时和退出后的布局恢复。',
      },
    },
  },
  title: 'View Engine/Record View/运行时工具',
};

export default meta;

export const RuntimeTools: Story = {
  name: '自动刷新与页面展开',
  render: args => (
    <div style={{ maxWidth: 900 }}>
      <Scenario {...args} />
    </div>
  ),
};
