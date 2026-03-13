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
import { RefObject } from 'react';
import { FullscreenBarItem } from '../../src/topbar/FullscreenBarItem';

vi.mock('@ahoo-wang/fetcher-react', () => ({
  useFullscreen: vi.fn(),
}));

import { useFullscreen } from '@ahoo-wang/fetcher-react';

const mockUseFullscreen = vi.mocked(useFullscreen);

describe('FullscreenBarItem', () => {
  let mockToggle: () => Promise<void>;
  let mockTargetRef: RefObject<HTMLElement>;

  beforeEach(() => {
    mockToggle = vi.fn().mockResolvedValue(undefined);
    mockTargetRef = { current: document.createElement('div') };

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

  it('should render without crashing', () => {
    const { container } = render(<FullscreenBarItem />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should render with target prop', () => {
    const { container } = render(<FullscreenBarItem target={mockTargetRef} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should call toggle when clicked', async () => {
    const { container } = render(<FullscreenBarItem target={mockTargetRef} />);
    
    fireEvent.click(container.querySelector('div')!);
    
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('should pass target to useFullscreen hook', () => {
    render(<FullscreenBarItem target={mockTargetRef} />);
    
    expect(mockUseFullscreen).toHaveBeenCalledWith({
      target: mockTargetRef,
      onChange: undefined,
    });
  });

  it('should pass onChange callback to useFullscreen hook', () => {
    const onChange = vi.fn();
    
    render(<FullscreenBarItem onChange={onChange} />);
    
    expect(mockUseFullscreen).toHaveBeenCalledWith({
      target: undefined,
      onChange,
    });
  });

  it('should handle onChange callback when fullscreen state changes', () => {
    const onChange = vi.fn();
    
    render(<FullscreenBarItem target={mockTargetRef} onChange={onChange} />);
    
    expect(mockUseFullscreen).toHaveBeenCalledWith({
      target: mockTargetRef,
      onChange,
    });
  });

  it('should render with custom className', () => {
    const { container } = render(
      <FullscreenBarItem className="custom-fullscreen-class" />,
    );
    
    expect(container.querySelector('div')).toHaveClass('custom-fullscreen-class');
  });

  it('should render with custom style', () => {
    const style = { marginRight: '8px' };
    
    const { container } = render(
      <FullscreenBarItem style={style} />,
    );
    
    expect(container.querySelector('div')).toHaveStyle(style);
  });

  it('should handle undefined target gracefully', () => {
    render(<FullscreenBarItem target={undefined} />);
    
    expect(mockUseFullscreen).toHaveBeenCalledWith({
      target: undefined,
      onChange: undefined,
    });
  });

  it('should handle null target ref gracefully', () => {
    const nullRef = { current: null };
    
    render(<FullscreenBarItem target={nullRef} />);
    
    expect(mockUseFullscreen).toHaveBeenCalledWith({
      target: nullRef,
      onChange: undefined,
    });
  });
});
