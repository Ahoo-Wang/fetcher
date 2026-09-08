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
          '本地定义扩展：宿主提供视图定义，自定义操作与单元格经公开注册接口接入。',
      },
    },
  },
  title: 'View Engine/扩展接入/本地定义',
};

export default meta;

export const LocalDefinitions: Story = {
  name: '本地定义 · 自定义订单操作',
  render: args => <Scenario {...args} local />,
};
