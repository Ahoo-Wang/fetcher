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

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextCell } from '../../../src/table/cell/TextCell';
import { DateTimeCell } from '../../../src/table/cell/DateTimeCell';

describe('Cell 边界情况', () => {
  describe('TextCell', () => {
    it('value 为 0 时应显示 "0"', () => {
      render(<TextCell data={{ value: 0 as any, record: {}, index: 0 }} attributes={{}} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('value 为 false 时应显示 "false"', () => {
      render(<TextCell data={{ value: false as any, record: {}, index: 0 }} attributes={{}} />);
      expect(screen.getByText('false')).toBeInTheDocument();
    });

    it('value 为空字符串时应显示 "-"', () => {
      render(<TextCell data={{ value: '', record: {}, index: 0 }} attributes={{}} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('value 为 null 时应显示 "-"', () => {
      render(<TextCell data={{ value: null as any, record: {}, index: 0 }} attributes={{}} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('value 为 undefined 时应显示 "-"', () => {
      render(<TextCell data={{ value: undefined as any, record: {}, index: 0 }} attributes={{}} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('DateTimeCell', () => {
    it('解析无效日期时应显示 "-" 而不是崩溃', () => {
      const { container } = render(
        <DateTimeCell data={{ value: 'not-a-date', record: {}, index: 0 }} attributes={{}} />
      );
      expect(container.querySelector('.ant-typography')?.textContent).toBe('-');
    });
  });
});
