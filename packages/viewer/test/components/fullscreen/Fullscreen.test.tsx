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
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { RefObject, ReactNode } from 'react';
import { Fullscreen } from '../../../src';

// Mock the useFullscreen hook
vi.mock('@ahoo-wang/fetcher-react', () => ({
  useFullscreen: vi.fn(),
}));

import { useFullscreen } from '@ahoo-wang/fetcher-react';

const mockUseFullscreen = vi.mocked(useFullscreen);

describe('Fullscreen', () => {
  let mockToggle: () => Promise<void>;
  let mockTargetRef: RefObject<HTMLElement>;

  beforeEach(() => {
    mockToggle = vi.fn().mockResolvedValue(undefined);
    mockTargetRef = { current: document.createElement('div') };

    // Default mock implementation
    mockUseFullscreen.mockReturnValue({
      isFullscreen: false,
      toggle: mockToggle,
      enter: vi.fn(),
      exit: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<Fullscreen />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders a Button component', () => {
    render(<Fullscreen />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('passes through button props correctly', () => {
    render(<Fullscreen type="primary" size="large" disabled />);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('ant-btn-primary');
    expect(button).toHaveClass('ant-btn-lg');
    expect(button).toBeDisabled();
  });

  it('displays enter icon when not in fullscreen', () => {
    mockUseFullscreen.mockReturnValue({
      isFullscreen: false,
      toggle: mockToggle,
      enter: vi.fn(),
      exit: vi.fn(),
    });

    render(<Fullscreen />);
    const button = screen.getByRole('button');

    // Check for fullscreen-outlined icon (default enter icon)
    expect(button.querySelector('.anticon-fullscreen')).toBeInTheDocument();
  });

  it('displays exit icon when in fullscreen', () => {
    mockUseFullscreen.mockReturnValue({
      isFullscreen: true,
      toggle: mockToggle,
      enter: vi.fn(),
      exit: vi.fn(),
    });

    render(<Fullscreen />);
    const button = screen.getByRole('button');

    // Check for fullscreen-exit-outlined icon (default exit icon)
    expect(
      button.querySelector('.anticon-fullscreen-exit'),
    ).toBeInTheDocument();
  });

  it('uses custom enter icon', () => {
    const customEnterIcon = <span data-testid="custom-enter">Enter</span>;

    mockUseFullscreen.mockReturnValue({
      isFullscreen: false,
      toggle: mockToggle,
      enter: vi.fn(),
      exit: vi.fn(),
    });

    render(<Fullscreen enterIcon={customEnterIcon} />);
    expect(screen.getByTestId('custom-enter')).toBeInTheDocument();
  });

  it('uses custom exit icon', () => {
    const customExitIcon = <span data-testid="custom-exit">Exit</span>;

    mockUseFullscreen.mockReturnValue({
      isFullscreen: true,
      toggle: mockToggle,
      enter: vi.fn(),
      exit: vi.fn(),
    });

    render(<Fullscreen exitIcon={customExitIcon} />);
    expect(screen.getByTestId('custom-exit')).toBeInTheDocument();
  });

  it('calls toggle function when button is clicked', async () => {
    render(<Fullscreen />);

    const button = screen.getByRole('button');
    await fireEvent.click(button);

    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('passes target and onChange to useFullscreen hook', () => {
    const onChange = vi.fn();

    render(<Fullscreen target={mockTargetRef} onChange={onChange} />);

    expect(mockUseFullscreen).toHaveBeenCalledWith({
      target: mockTargetRef,
      onChange,
    });
  });

  it('handles undefined target gracefully', () => {
    render(<Fullscreen target={undefined} />);

    expect(mockUseFullscreen).toHaveBeenCalledWith({
      target: undefined,
      onChange: undefined,
    });
  });

  it('handles null target ref gracefully', () => {
    const nullRef = { current: null };

    render(<Fullscreen target={nullRef} />);

    expect(mockUseFullscreen).toHaveBeenCalledWith({
      target: nullRef,
      onChange: undefined,
    });
  });

  it('passes onChange callback correctly', () => {
    const onChange = vi.fn();

    render(<Fullscreen onChange={onChange} />);

    expect(mockUseFullscreen).toHaveBeenCalledWith({
      target: undefined,
      onChange,
    });
  });

  it('does not pass excluded props to Button', () => {
    render(
      <Fullscreen
        icon={<span />}
        onClick={() => {}}
        onChange={() => {}}
        target={mockTargetRef}
      />,
    );

    const button = screen.getByRole('button');

    // These props should not be passed to Button
    expect(button).not.toHaveAttribute('icon');
    expect(button).not.toHaveAttribute('onClick');
    expect(button).not.toHaveAttribute('onChange');
    expect(button).not.toHaveAttribute('target');
  });

  it('handles multiple prop combinations', () => {
    const onChange = vi.fn();
    const customEnterIcon = <span>Custom Enter</span>;
    const customExitIcon = <span>Custom Exit</span>;

    mockUseFullscreen.mockReturnValue({
      isFullscreen: false,
      toggle: mockToggle,
      enter: vi.fn(),
      exit: vi.fn(),
    });

    render(
      <Fullscreen
        target={mockTargetRef}
        onChange={onChange}
        enterIcon={customEnterIcon}
        exitIcon={customExitIcon}
        type="primary"
        size="small"
        className="custom-class"
      />,
    );

    const button = screen.getByRole('button');

    expect(button).toHaveClass('ant-btn-primary');
    expect(button).toHaveClass('ant-btn-sm');
    expect(button).toHaveClass('custom-class');
    expect(screen.getByText('Custom Enter')).toBeInTheDocument();

    expect(mockUseFullscreen).toHaveBeenCalledWith({
      target: mockTargetRef,
      onChange,
    });
  });

  it('maintains button functionality with various states', async () => {
    // Test with fullscreen true
    mockUseFullscreen.mockReturnValue({
      isFullscreen: true,
      toggle: mockToggle,
      enter: vi.fn(),
      exit: vi.fn(),
    });

    const { rerender } = render(<Fullscreen />);
    let button = screen.getByRole('button');

    expect(
      button.querySelector('.anticon-fullscreen-exit'),
    ).toBeInTheDocument();

    await fireEvent.click(button);
    expect(mockToggle).toHaveBeenCalledTimes(1);

    // Test with fullscreen false
    mockUseFullscreen.mockReturnValue({
      isFullscreen: false,
      toggle: mockToggle,
      enter: vi.fn(),
      exit: vi.fn(),
    });

    rerender(<Fullscreen />);
    button = screen.getByRole('button');

    expect(button.querySelector('.anticon-fullscreen')).toBeInTheDocument();
  });

  it('handles async toggle function', async () => {
    mockToggle.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 10)),
    );

    render(<Fullscreen />);

    const button = screen.getByRole('button');
    await fireEvent.click(button);

    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('handles toggle function throwing error', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockToggle.mockRejectedValue(new Error('Fullscreen failed'));

    render(<Fullscreen />);

    const button = screen.getByRole('button');
    await fireEvent.click(button);

    expect(mockToggle).toHaveBeenCalledTimes(1);
    // Error should be handled by the hook, not bubble up

    consoleErrorSpy.mockRestore();
  });

  it('has correct displayName', () => {
    expect(Fullscreen.displayName).toBe('FullScreen');
  });

  // Edge cases and error conditions
  it('handles undefined enterIcon gracefully', () => {
    mockUseFullscreen.mockReturnValue({
      isFullscreen: false,
      toggle: mockToggle,
      enter: vi.fn(),
      exit: vi.fn(),
    });

    render(<Fullscreen enterIcon={undefined} />);

    const button = screen.getByRole('button');
    expect(button.querySelector('.anticon-fullscreen')).toBeInTheDocument();
  });

  it('handles undefined exitIcon gracefully', () => {
    mockUseFullscreen.mockReturnValue({
      isFullscreen: true,
      toggle: mockToggle,
      enter: vi.fn(),
      exit: vi.fn(),
    });

    render(<Fullscreen exitIcon={undefined} />);

    const button = screen.getByRole('button');
    expect(
      button.querySelector('.anticon-fullscreen-exit'),
    ).toBeInTheDocument();
  });

  it('handles null onChange callback', () => {
    render(<Fullscreen onChange={null as any} />);

    expect(mockUseFullscreen).toHaveBeenCalledWith({
      target: undefined,
      onChange: null,
    });
  });

  it('renders with minimal props', () => {
    render(<Fullscreen />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button).toHaveClass('ant-btn');
  });

  it('maintains accessibility', () => {
    render(<Fullscreen aria-label="Toggle fullscreen" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Toggle fullscreen');
  });
});
