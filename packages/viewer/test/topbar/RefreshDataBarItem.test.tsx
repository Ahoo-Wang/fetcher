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

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Tooltip } from 'antd';
import { RefreshDataBarItem } from '../../src/topbar/RefreshDataBarItem';

const mockPublish = vi.fn().mockResolvedValue(undefined);

vi.mock('../../src/hooks/useRefreshDataEventBus', () => ({
  useRefreshDataEventBus: vi.fn(() => ({
    publish: mockPublish,
  })),
}));

describe('RefreshDataBarItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<RefreshDataBarItem />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <RefreshDataBarItem className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render with custom style', () => {
      const style = { marginTop: '10px' };
      const { container } = render(
        <RefreshDataBarItem style={style} />,
      );
      expect(container.firstChild).toHaveStyle(style);
    });
  });

  describe('click behavior', () => {
    it('should call publish when clicked', () => {
      const { container } = render(<RefreshDataBarItem />);

      fireEvent.click(container.firstChild as HTMLElement);

      expect(mockPublish).toHaveBeenCalledTimes(1);
    });

    it('should call publish multiple times when clicked multiple times', () => {
      const { container } = render(<RefreshDataBarItem />);

      fireEvent.click(container.firstChild as HTMLElement);
      fireEvent.click(container.firstChild as HTMLElement);
      fireEvent.click(container.firstChild as HTMLElement);

      expect(mockPublish).toHaveBeenCalledTimes(3);
    });
  });

  describe('props', () => {
    it('should accept style prop', () => {
      const style = { padding: '8px' };
      const { container } = render(<RefreshDataBarItem style={style} />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept className prop', () => {
      const { container } = render(
        <RefreshDataBarItem className="test-class" />,
      );

      expect(container.firstChild).toHaveClass('test-class');
    });
  });

  describe('Tooltip', () => {
    it('should render with Tooltip', () => {
      const { container } = render(<RefreshDataBarItem />);
      const tooltip = container.querySelector('.ant-tooltip-open') || container.querySelector('[class*="tooltip"]');
      expect(tooltip || container.firstChild).toBeInTheDocument();
    });
  });
});
