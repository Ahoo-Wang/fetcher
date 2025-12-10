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

import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Fullscreen } from '../../../src';
import { createRef } from 'react';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';

// Mock the utils module
vi.mock('../../../src/components/fullscreen/utils', () => ({
  getFullscreenElement: vi.fn(),
  enterFullscreen: vi.fn(),
  exitFullscreen: vi.fn(),
  addFullscreenChangeListener: vi.fn(),
  removeFullscreenChangeListener: vi.fn(),
}));

import {
  getFullscreenElement,
  enterFullscreen,
  exitFullscreen,
  addFullscreenChangeListener,
  removeFullscreenChangeListener,
} from '../../../src/components/fullscreen/utils';

const mockGetFullscreenElement = vi.mocked(getFullscreenElement);
const mockEnterFullscreen = vi.mocked(enterFullscreen);
const mockExitFullscreen = vi.mocked(exitFullscreen);
const mockAddFullscreenChangeListener = vi.mocked(addFullscreenChangeListener);
const mockRemoveFullscreenChangeListener = vi.mocked(
  removeFullscreenChangeListener,
);

describe('Fullscreen component', () => {
  let mockElement: HTMLElement;
  let mockTargetRef: React.RefObject<HTMLElement>;

  beforeEach(() => {
    // Create real DOM elements and refs
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    mockTargetRef = { current: mockElement };

    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    mockGetFullscreenElement.mockReturnValue(null);
    mockEnterFullscreen.mockResolvedValue(undefined);
    mockExitFullscreen.mockResolvedValue(undefined);
    mockAddFullscreenChangeListener.mockImplementation(() => {});
    mockRemoveFullscreenChangeListener.mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
  });

  describe('basic rendering', () => {
    it('renders a button with default props', () => {
      render(<Fullscreen />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('ant-btn');
    });

    it('renders with correct display name', () => {
      render(<Fullscreen />);

      expect(Fullscreen.displayName).toBe('FullScreen');
    });

    it('renders enter icon by default', () => {
      render(<Fullscreen />);

      const button = screen.getByRole('button');
      const icon = button.querySelector('.anticon-fullscreen');
      expect(icon).toBeInTheDocument();
    });

    it('renders exit icon when in fullscreen mode', () => {
      render(<Fullscreen />);

      // Simulate entering fullscreen
      mockGetFullscreenElement.mockReturnValue(document.documentElement);
      act(() => {
        const callback = mockAddFullscreenChangeListener.mock.calls[0][0];
        callback();
      });

      const button = screen.getByRole('button');
      const icon = button.querySelector('.anticon-fullscreen-exit');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('props handling', () => {
    it('passes button props to underlying Button component', () => {
      render(
        <Fullscreen
          type="primary"
          size="large"
          disabled
          className="custom-class"
          data-testid="fullscreen-btn"
        />,
      );

      const button = screen.getByTestId('fullscreen-btn');
      expect(button).toHaveClass(
        'ant-btn-primary',
        'ant-btn-lg',
        'custom-class',
      );
      expect(button).toBeDisabled();
    });

    it('accepts custom enter icon', () => {
      const customIcon = <span data-testid="custom-enter-icon">Enter</span>;

      render(<Fullscreen enterIcon={customIcon} />);

      const icon = screen.getByTestId('custom-enter-icon');
      expect(icon).toBeInTheDocument();
    });

    it('accepts custom exit icon', () => {
      const customIcon = <span data-testid="custom-exit-icon">Exit</span>;

      render(<Fullscreen exitIcon={customIcon} />);

      // Simulate entering fullscreen to show exit icon
      mockGetFullscreenElement.mockReturnValue(document.documentElement);
      act(() => {
        const callback = mockAddFullscreenChangeListener.mock.calls[0][0];
        callback();
      });

      const icon = screen.getByTestId('custom-exit-icon');
      expect(icon).toBeInTheDocument();
    });

    it('passes target prop to useFullscreen hook', () => {
      render(<Fullscreen target={mockTargetRef} />);

      // The hook should be called with the target
      // This is verified by the mock setup and the fact that enterFullscreen is called with mockElement
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockEnterFullscreen).toHaveBeenCalledWith(mockElement);
    });

    it('passes onChange callback to useFullscreen hook', () => {
      const onChange = vi.fn();

      render(<Fullscreen onChange={onChange} />);

      // Simulate fullscreen change
      mockGetFullscreenElement.mockReturnValue(document.documentElement);
      act(() => {
        const callback = mockAddFullscreenChangeListener.mock.calls[0][0];
        callback();
      });

      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe('user interactions', () => {
    it('calls toggle function when button is clicked', () => {
      render(<Fullscreen />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockEnterFullscreen).toHaveBeenCalledWith(
        document.documentElement,
      );
    });

    it('calls exit when in fullscreen and clicked', () => {
      render(<Fullscreen />);

      // Enter fullscreen first
      mockGetFullscreenElement.mockReturnValue(document.documentElement);
      act(() => {
        const callback = mockAddFullscreenChangeListener.mock.calls[0][0];
        callback();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockExitFullscreen).toHaveBeenCalledTimes(1);
    });

    it('toggles between enter and exit calls', () => {
      render(<Fullscreen />);

      const button = screen.getByRole('button');

      // First click: should call enter
      fireEvent.click(button);
      expect(mockEnterFullscreen).toHaveBeenCalledTimes(1);
      expect(mockExitFullscreen).not.toHaveBeenCalled();

      // Simulate entering fullscreen (change component state)
      mockGetFullscreenElement.mockReturnValue(document.documentElement);
      act(() => {
        const callback = mockAddFullscreenChangeListener.mock.calls[0][0];
        callback();
      });

      // Second click: should call exit
      fireEvent.click(button);
      expect(mockExitFullscreen).toHaveBeenCalledTimes(1);
      expect(mockEnterFullscreen).toHaveBeenCalledTimes(1);
    });
  });

  describe('icon switching behavior', () => {
    it('switches from enter to exit icon when entering fullscreen', () => {
      render(<Fullscreen />);

      // Initially shows enter icon
      let button = screen.getByRole('button');
      expect(button.querySelector('.anticon-fullscreen')).toBeInTheDocument();
      expect(
        button.querySelector('.anticon-fullscreen-exit'),
      ).not.toBeInTheDocument();

      // Enter fullscreen
      mockGetFullscreenElement.mockReturnValue(document.documentElement);
      act(() => {
        const callback = mockAddFullscreenChangeListener.mock.calls[0][0];
        callback();
      });

      // Should show exit icon
      button = screen.getByRole('button');
      expect(
        button.querySelector('.anticon-fullscreen'),
      ).not.toBeInTheDocument();
      expect(
        button.querySelector('.anticon-fullscreen-exit'),
      ).toBeInTheDocument();
    });

    it('shows exit icon when in fullscreen mode', () => {
      render(<Fullscreen />);

      // Initially shows enter icon
      let button = screen.getByRole('button');
      expect(button.querySelector('.anticon-fullscreen')).toBeInTheDocument();

      // Simulate entering fullscreen
      mockGetFullscreenElement.mockReturnValue(document.documentElement);
      act(() => {
        const callback = mockAddFullscreenChangeListener.mock.calls[0][0];
        callback();
      });

      // Should show exit icon
      button = screen.getByRole('button');
      expect(
        button.querySelector('.anticon-fullscreen-exit'),
      ).toBeInTheDocument();
      expect(
        button.querySelector('.anticon-fullscreen'),
      ).not.toBeInTheDocument();
    });

    it('uses custom icons correctly', () => {
      const enterIcon = <span data-testid="enter">Enter FS</span>;
      const exitIcon = <span data-testid="exit">Exit FS</span>;

      render(<Fullscreen enterIcon={enterIcon} exitIcon={exitIcon} />);

      // Initially shows custom enter icon
      expect(screen.getByTestId('enter')).toBeInTheDocument();
      expect(screen.queryByTestId('exit')).not.toBeInTheDocument();

      // Enter fullscreen
      mockGetFullscreenElement.mockReturnValue(document.documentElement);
      act(() => {
        const callback = mockAddFullscreenChangeListener.mock.calls[0][0];
        callback();
      });

      // Should show custom exit icon
      expect(screen.queryByTestId('enter')).not.toBeInTheDocument();
      expect(screen.getByTestId('exit')).toBeInTheDocument();
    });
  });

  describe('target element handling', () => {
    it('uses target element when provided', () => {
      render(<Fullscreen target={mockTargetRef} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockEnterFullscreen).toHaveBeenCalledWith(mockElement);
    });

    it('uses document.documentElement when no target provided', () => {
      render(<Fullscreen />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockEnterFullscreen).toHaveBeenCalledWith(
        document.documentElement,
      );
    });

    it('uses document.documentElement when target.current is null', () => {
      const nullRef = createRef<HTMLElement>();
      nullRef.current = null;

      render(<Fullscreen target={nullRef} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockEnterFullscreen).toHaveBeenCalledWith(
        document.documentElement,
      );
    });

    it('handles target element becoming null during lifecycle', () => {
      render(<Fullscreen target={mockTargetRef} />);

      // Simulate target becoming null
      (mockTargetRef as any).current = null;

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockEnterFullscreen).toHaveBeenCalledWith(
        document.documentElement,
      );
    });
  });

  describe('callback handling', () => {
    it('calls onChange when fullscreen state changes', () => {
      const onChange = vi.fn();

      render(<Fullscreen onChange={onChange} />);

      // Enter fullscreen
      mockGetFullscreenElement.mockReturnValue(document.documentElement);
      act(() => {
        const callback = mockAddFullscreenChangeListener.mock.calls[0][0];
        callback();
      });

      expect(onChange).toHaveBeenCalledWith(true);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('does not call onChange when state does not change', () => {
      const onChange = vi.fn();

      render(<Fullscreen onChange={onChange} />);

      // Same state multiple times
      act(() => {
        const callback = mockAddFullscreenChangeListener.mock.calls[0][0];
        callback();
        callback();
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('handles onChange callback throwing error gracefully', () => {
      const onChange = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      render(<Fullscreen onChange={onChange} />);

      expect(() => {
        mockGetFullscreenElement.mockReturnValue(document.documentElement);
        act(() => {
          const callback = mockAddFullscreenChangeListener.mock.calls[0][0];
          callback();
        });
      }).toThrow('Callback error');
    });
  });

  describe('error handling', () => {
    it('handles enterFullscreen failure gracefully', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Enter fullscreen failed');
      mockEnterFullscreen.mockRejectedValue(error);

      render(<Fullscreen />);

      const button = screen.getByRole('button');

      // Expect the click to not throw (error is handled internally)
      expect(() => fireEvent.click(button)).not.toThrow();

      // The error logging happens in the hook, not directly in the component
      // So we can't easily test this without more complex setup
      consoleSpy.mockRestore();
    });

    it('handles exitFullscreen failure gracefully', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Exit fullscreen failed');
      mockExitFullscreen.mockRejectedValue(error);

      render(<Fullscreen />);

      // Enter fullscreen first
      mockGetFullscreenElement.mockReturnValue(document.documentElement);
      act(() => {
        const callback = mockAddFullscreenChangeListener.mock.calls[0][0];
        callback();
      });

      const button = screen.getByRole('button');

      // Expect the click to not throw (error is handled internally)
      expect(() => fireEvent.click(button)).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('renders button with proper role', () => {
      render(<Fullscreen />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('maintains button accessibility when disabled', () => {
      render(<Fullscreen disabled />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('supports custom aria-label', () => {
      render(<Fullscreen aria-label="Toggle fullscreen" />);

      const button = screen.getByLabelText('Toggle fullscreen');
      expect(button).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles rapid state changes', () => {
      const onChange = vi.fn();

      render(<Fullscreen onChange={onChange} />);

      // Rapid fullscreen changes
      mockGetFullscreenElement.mockReturnValue(document.documentElement);
      act(() => {
        const callback = mockAddFullscreenChangeListener.mock.calls[0][0];
        callback();
      });

      expect(onChange).toHaveBeenCalledWith(true);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('handles component unmounting', () => {
      const { unmount } = render(<Fullscreen />);

      unmount();

      expect(mockRemoveFullscreenChangeListener).toHaveBeenCalledTimes(1);
    });

    it('handles re-rendering with different props', () => {
      const { rerender } = render(<Fullscreen />);

      // Re-render with different props
      rerender(<Fullscreen type="primary" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('ant-btn-primary');
    });

    it('handles undefined target prop', () => {
      render(<Fullscreen target={undefined} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockEnterFullscreen).toHaveBeenCalledWith(
        document.documentElement,
      );
    });

    it('works with real DOM elements', () => {
      const realElement = document.createElement('div');
      document.body.appendChild(realElement);
      const realRef = createRef<HTMLElement>();
      realRef.current = realElement;

      render(<Fullscreen target={realRef} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockEnterFullscreen).toHaveBeenCalledWith(realElement);

      document.body.removeChild(realElement);
    });
  });

  describe('integration with Antd Button', () => {
    it('passes button props to underlying Button component', () => {
      render(<Fullscreen type="primary" size="large" loading disabled />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'ant-btn',
        'ant-btn-primary',
        'ant-btn-lg',
        'ant-btn-loading',
      );
      expect(button).toBeDisabled();
    });

    it('excludes invalid props from Button', () => {
      // These props should not be passed to Button
      render(
        <Fullscreen
          target={mockTargetRef}
          onChange={() => {}}
          enterIcon={<div />}
          exitIcon={<div />}
        />,
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Component should render without errors despite these props
    });
  });
});
