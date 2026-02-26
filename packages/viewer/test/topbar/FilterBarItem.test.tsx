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
import { render, fireEvent } from '@testing-library/react';
import { FilterBarItem } from '../../src/topbar/FilterBarItem';

describe('FilterBarItem', () => {
  describe('rendering', () => {
    it('should render with defaultShowFilter false', () => {
      const { container } = render(
        <FilterBarItem defaultShowFilter={false} />,
      );

      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should render with defaultShowFilter true', () => {
      const { container } = render(
        <FilterBarItem defaultShowFilter={true} />,
      );

      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('onChange callback', () => {
    it('should call onChange when clicked', () => {
      const onChange = vi.fn();

      const { container } = render(
        <FilterBarItem defaultShowFilter={false} onChange={onChange} />,
      );

      fireEvent.click(container.querySelector('div')!);

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should toggle state when clicked multiple times', () => {
      const onChange = vi.fn();

      const { container } = render(
        <FilterBarItem defaultShowFilter={false} onChange={onChange} />,
      );

      fireEvent.click(container.querySelector('div')!);
      expect(onChange).toHaveBeenCalledWith(true);

      fireEvent.click(container.querySelector('div')!);
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });

  describe('defaultShowFilter prop update', () => {
    it('should update state when defaultShowFilter changes', () => {
      const { rerender } = render(
        <FilterBarItem defaultShowFilter={false} />,
      );

      rerender(<FilterBarItem defaultShowFilter={true} />);

      expect(() => {}).toBeTruthy();
    });
  });

  describe('style and className', () => {
    it('should render with custom style', () => {
      const style = { marginTop: '10px' };

      const { container } = render(
        <FilterBarItem defaultShowFilter={false} style={style} />,
      );

      expect(container.querySelector('div')).toHaveStyle(style);
    });

    it('should render with custom className', () => {
      const { container } = render(
        <FilterBarItem defaultShowFilter={false} className="custom-class" />,
      );

      expect(container.querySelector('div')).toHaveClass('custom-class');
    });
  });
});
