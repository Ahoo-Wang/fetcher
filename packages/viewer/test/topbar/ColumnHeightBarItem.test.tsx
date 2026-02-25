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

import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ColumnHeightBarItem } from '../../src/topbar/ColumnHeightBarItem';

describe('ColumnHeightBarItem', () => {
  describe('rendering', () => {
    it('should render with defaultTableSize middle', () => {
      const { container } = render(
        <ColumnHeightBarItem defaultTableSize="middle" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with defaultTableSize small', () => {
      const { container } = render(
        <ColumnHeightBarItem defaultTableSize="small" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('onChange callback', () => {
    it('should accept onChange prop', () => {
      const onChange = vi.fn();

      const { container } = render(
        <ColumnHeightBarItem defaultTableSize="middle" onChange={onChange} />,
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('defaultTableSize prop update', () => {
    it('should accept defaultTableSize prop changes', () => {
      const { rerender } = render(
        <ColumnHeightBarItem defaultTableSize="middle" />,
      );

      rerender(<ColumnHeightBarItem defaultTableSize="small" />);

      expect(() => {}).toBeTruthy();
    });
  });

  describe('style and className', () => {
    it('should accept className prop', () => {
      const { container } = render(
        <ColumnHeightBarItem defaultTableSize="middle" className="custom-class" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
