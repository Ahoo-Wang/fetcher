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

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { BarItem } from '../../src/topbar/BarItem';
import { ReloadOutlined } from '@ant-design/icons';

describe('BarItem', () => {
  describe('rendering', () => {
    it('should render icon', () => {
      const { container } = render(
        <BarItem icon={<ReloadOutlined />} active={false} />,
      );

      expect(container.querySelector('.anticon')).toBeInTheDocument();
    });

    it('should render with active false', () => {
      const { container } = render(
        <BarItem icon={<ReloadOutlined />} active={false} />,
      );

      const item = container.querySelector('div');
      expect(item).toBeInTheDocument();
    });

    it('should render with active true', () => {
      const { container } = render(
        <BarItem icon={<ReloadOutlined />} active={true} />,
      );

      const item = container.querySelector('div');
      expect(item).toBeInTheDocument();
    });
  });
});
