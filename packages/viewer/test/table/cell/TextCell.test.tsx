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
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextCell, TEXT_CELL_TYPE } from '../../../src';

describe('TextCell', () => {
  describe('TEXT_CELL_TYPE', () => {
    it('should be "text"', () => {
      expect(TEXT_CELL_TYPE).toBe('text');
    });
  });

  describe('TextCell component', () => {
    it('should render text content', () => {
      const props = {
        data: {
          value: 'Hello World',
          record: { id: 1 },
          index: 0,
        },
        attributes: undefined,
      };

      const { getByText } = render(<TextCell {...props} />);
      expect(getByText('Hello World')).toBeInTheDocument();
    });

    it('should render with custom attributes', () => {
      const props = {
        data: {
          value: 'Test Text',
          record: { id: 2 },
          index: 1,
        },
        attributes: {
          ellipsis: true,
        },
      };

      const { container } = render(<TextCell {...props} />);
      const textElement = container.querySelector('.ant-typography');
      expect(textElement).toBeInTheDocument();
      expect(textElement).toHaveClass('ant-typography-ellipsis');
    });

    it('should handle empty string value', () => {
      const props = {
        data: {
          value: '',
          record: { id: 3 },
          index: 2,
        },
        attributes: undefined,
      };

      const { container } = render(<TextCell {...props} />);
      const textElement = container.querySelector('.ant-typography');
      expect(textElement).toBeInTheDocument();
      expect(textElement).toHaveTextContent('');
    });

    it('should handle null value', () => {
      const props = {
        data: {
          value: null as any,
          record: { id: 4 },
          index: 3,
        },
        attributes: undefined,
      };

      const { container } = render(<TextCell {...props} />);
      const textElement = container.querySelector('.ant-typography');
      expect(textElement).toBeInTheDocument();
      expect(textElement).toHaveTextContent('');
    });

    it('should handle undefined value', () => {
      const props = {
        data: {
          value: undefined as any,
          record: { id: 5 },
          index: 4,
        },
        attributes: undefined,
      };

      const { container } = render(<TextCell {...props} />);
      const textElement = container.querySelector('.ant-typography');
      expect(textElement).toBeInTheDocument();
      expect(textElement).toHaveTextContent('');
    });

    it('should handle empty attributes', () => {
      const props = {
        data: {
          value: 'Test',
          record: { id: 6 },
          index: 5,
        },
        attributes: {},
      };

      const { getByText } = render(<TextCell {...props} />);
      expect(getByText('Test')).toBeInTheDocument();
    });
  });
});
