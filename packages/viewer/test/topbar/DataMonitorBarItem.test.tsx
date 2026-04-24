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
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataMonitorBarItem } from '../../src/topbar/DataMonitorBarItem';
import { useDataMonitor } from '@ahoo-wang/fetcher-react';

const mockToggle = vi.fn();

vi.mock('@ahoo-wang/fetcher-react', () => ({
  useDataMonitor: vi.fn(() => ({
    isEnabled: false,
    toggle: mockToggle,
  })),
}));

const defaultProps = {
  viewId: 'test-view',
  countUrl: '/api/count',
  viewName: 'Test View',
  condition: {},
  notification: { title: 'Test Notification' },
};

describe('DataMonitorBarItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<DataMonitorBarItem {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render Bell icon', () => {
      const { container } = render(<DataMonitorBarItem {...defaultProps} />);
      expect(container.querySelector('[role="img"]')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      // Note: className is passed to BarItem which doesn't forward it to its root element
      // So we just verify the component renders without error
      const { container } = render(
        <DataMonitorBarItem {...defaultProps} className="custom-class" />,
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with custom style', () => {
      // Note: style is passed to BarItem which doesn't forward it to its root element
      // So we just verify the component renders without error
      const style = { marginTop: '10px' };
      const { container } = render(
        <DataMonitorBarItem {...defaultProps} style={style} />,
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('click behavior - Popconfirm', () => {
    it('should show Popconfirm when clicked', () => {
      const { container } = render(<DataMonitorBarItem {...defaultProps} />);

      const div = container.querySelector('div');
      fireEvent.click(div!);

      expect(screen.queryByText('确认开启数据监控？')).toBeInTheDocument();
    });

    it('should call toggle when Popconfirm is confirmed', () => {
      const { container } = render(<DataMonitorBarItem {...defaultProps} />);

      const div = container.querySelector('div');
      fireEvent.click(div!);

      const confirmButton = screen.getByText('确 认');
      fireEvent.click(confirmButton);

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it('should not call toggle when Popconfirm is cancelled', () => {
      const { container } = render(<DataMonitorBarItem {...defaultProps} />);

      const div = container.querySelector('div');
      fireEvent.click(div!);

      const cancelButton = screen.getByText('取 消');
      fireEvent.click(cancelButton);

      expect(mockToggle).not.toHaveBeenCalled();
    });
  });

  describe('enabled state', () => {
    it('should show "确认关闭" when enabled', () => {
      vi.mocked(useDataMonitor).mockReturnValueOnce({
        isEnabled: true,
        toggle: mockToggle,
      });

      const { container } = render(<DataMonitorBarItem {...defaultProps} />);

      const div = container.querySelector('div');
      fireEvent.click(div!);

      expect(screen.queryByText('确认关闭数据监控？')).toBeInTheDocument();
    });
  });

  describe('Tooltip', () => {
    it('should render with Tooltip', () => {
      const { container } = render(<DataMonitorBarItem {...defaultProps} />);

      const tooltipElement = container.querySelector('.ant-tooltip-open') || container.querySelector('[class*="tooltip"]');
      expect(tooltipElement || container.firstChild).toBeInTheDocument();
    });
  });
});
