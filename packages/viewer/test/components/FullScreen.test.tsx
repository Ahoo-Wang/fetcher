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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Fullscreen } from '../../src';

describe('FullScreen', () => {
  let mockRequestFullScreen: any;
  let mockExitFullScreen: any;
  let fullscreenElement: any;

  beforeEach(() => {
    // Mock fullscreen API
    mockRequestFullScreen = vi.fn().mockResolvedValue(undefined);
    mockExitFullScreen = vi.fn().mockResolvedValue(undefined);
    fullscreenElement = null;

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    });

    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: mockRequestFullScreen,
    });

    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: mockExitFullScreen,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<Fullscreen />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders as a button', () => {
    render(<Fullscreen />);
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
  });

  it('displays enter fullscreen icon by default', () => {
    const { container } = render(<Fullscreen />);
    const icon = container.querySelector('.anticon-fullscreen');
    expect(icon).toBeTruthy();
  });

  it('calls requestFullscreen when clicked', async () => {
    render(<Fullscreen />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockRequestFullScreen).toHaveBeenCalledTimes(1);
    });
  });

  it('calls exitFullscreen when in fullscreen mode', async () => {
    const { container } = render(<Fullscreen />);
    const button = screen.getByRole('button');

    // Enter fullscreen
    fireEvent.click(button);
    await waitFor(() => {
      expect(mockRequestFullScreen).toHaveBeenCalled();
    });

    // Simulate fullscreen change
    fullscreenElement = document.documentElement;
    fireEvent(document, new Event('fullscreenchange'));

    await waitFor(() => {
      const exitIcon = container.querySelector('.anticon-fullscreen-exit');
      expect(exitIcon).toBeTruthy();
    });

    // Exit fullscreen
    fireEvent.click(button);
    await waitFor(() => {
      expect(mockExitFullScreen).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onChange callback when fullscreen state changes', async () => {
    const onChange = vi.fn();
    render(<Fullscreen onChange={onChange} />);

    // Simulate entering fullscreen
    fullscreenElement = document.documentElement;
    fireEvent(document, new Event('fullscreenchange'));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(true);
    });

    // Simulate exiting fullscreen
    fullscreenElement = null;
    fireEvent(document, new Event('fullscreenchange'));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });

  it('accepts custom enter icon', () => {
    const customIcon = <span data-testid="custom-enter-icon">Enter</span>;
    render(<Fullscreen enterIcon={customIcon} />);
    expect(screen.getByTestId('custom-enter-icon')).toBeTruthy();
  });

  it('accepts custom exit icon', async () => {
    const customExitIcon = <span data-testid="custom-exit-icon">Exit</span>;
    const { rerender } = render(<Fullscreen exitIcon={customExitIcon} />);

    // Simulate entering fullscreen
    fullscreenElement = document.documentElement;
    fireEvent(document, new Event('fullscreenchange'));

    await waitFor(() => {
      rerender(<Fullscreen exitIcon={customExitIcon} />);
      expect(screen.getByTestId('custom-exit-icon')).toBeTruthy();
    });
  });

  it('passes through button props', () => {
    render(<Fullscreen type="primary" size="large" disabled={false} />);
    const button = screen.getByRole('button');
    expect(button.classList.contains('ant-btn-primary')).toBe(true);
    expect(button.classList.contains('ant-btn-lg')).toBe(true);
  });

  it('can be disabled', () => {
    render(<Fullscreen disabled />);
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('uses target element when provided', async () => {
    const targetElement = document.createElement('div');
    const targetRequestFullScreen = vi
      .fn()
      .mockResolvedValue(undefined);
    (targetElement as any).requestFullscreen = targetRequestFullScreen;

    render(<Fullscreen target={targetElement} />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(targetRequestFullScreen).toHaveBeenCalledTimes(1);
    });
  });

  it('handles requestFullscreen errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRequestFullScreen.mockRejectedValue(new Error('FullScreen not allowed'));

    render(<Fullscreen />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it('handles exitFullscreen errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockExitFullScreen.mockRejectedValue(new Error('Exit not allowed'));

    const { container } = render(<Fullscreen />);

    // Simulate being in fullscreen
    fullscreenElement = document.documentElement;
    fireEvent(document, new Event('fullscreenchange'));

    await waitFor(() => {
      const exitIcon = container.querySelector('.anticon-fullscreen-exit');
      expect(exitIcon).toBeTruthy();
    });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  describe('Cross-browser support', () => {
    it('uses webkitRequestFullscreen if available', async () => {
      const webkitRequestFullscreen = vi.fn().mockResolvedValue(undefined);
      delete (document.documentElement as any).requestFullscreen;
      (document.documentElement as any).webkitRequestFullscreen =
        webkitRequestFullscreen;

      render(<Fullscreen />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(webkitRequestFullscreen).toHaveBeenCalledTimes(1);
      });
    });

    it('listens to webkitfullscreenchange event', async () => {
      const onChange = vi.fn();
      render(<Fullscreen onChange={onChange} />);

      fullscreenElement = document.documentElement;
      fireEvent(document, new Event('webkitfullscreenchange'));

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(true);
      });
    });

    it('listens to mozfullscreenchange event', async () => {
      const onChange = vi.fn();
      render(<Fullscreen onChange={onChange} />);

      fullscreenElement = document.documentElement;
      fireEvent(document, new Event('mozfullscreenchange'));

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Component lifecycle', () => {
    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(<Fullscreen />);
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'fullscreenchange',
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'webkitfullscreenchange',
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mozfullscreenchange',
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'MSFullscreenChange',
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });

    it('updates target when prop changes', async () => {
      const firstTarget = document.createElement('div');
      const secondTarget = document.createElement('div');
      const firstRequestFullScreen = vi.fn().mockResolvedValue(undefined);
      const secondRequestFullScreen = vi.fn().mockResolvedValue(undefined);
      (firstTarget as any).requestFullscreen = firstRequestFullScreen;
      (secondTarget as any).requestFullscreen = secondRequestFullScreen;

      const { rerender } = render(<Fullscreen target={firstTarget} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      await waitFor(() => {
        expect(firstRequestFullScreen).toHaveBeenCalledTimes(1);
      });

      rerender(<Fullscreen target={secondTarget} />);
      fireEvent.click(button);
      await waitFor(() => {
        expect(secondRequestFullScreen).toHaveBeenCalledTimes(1);
      });
    });
  });
});
