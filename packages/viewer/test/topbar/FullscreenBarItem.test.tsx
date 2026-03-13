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
import { render, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { FullscreenBarItem } from '../../src/topbar/FullscreenBarItem';

vi.mock('@ahoo-wang/fetcher-react', () => ({
  useFullscreenContext: vi.fn(),
}));

import { useFullscreenContext } from '@ahoo-wang/fetcher-react';

const mockUseFullscreenContext = vi.mocked(useFullscreenContext);

describe('FullscreenBarItem', () => {
  let mockToggle: () => Promise<void>;

  beforeEach(() => {
    mockToggle = vi.fn().mockResolvedValue(undefined);

    mockUseFullscreenContext.mockReturnValue({
      isFullscreen: false,
      toggle: mockToggle,
      enter: vi.fn(),
      exit: vi.fn(),
      getTarget: vi.fn().mockReturnValue(document.documentElement),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<FullscreenBarItem />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should call toggle when clicked', async () => {
    const { container } = render(<FullscreenBarItem />);

    fireEvent.click(container.querySelector('div')!);

    expect(mockToggle).toHaveBeenCalledTimes(1);
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

  it('should use context value correctly', () => {
    mockUseFullscreenContext.mockReturnValue({
      isFullscreen: true,
      toggle: mockToggle,
      enter: vi.fn(),
      exit: vi.fn(),
      getTarget: vi.fn().mockReturnValue(document.documentElement),
    });

    const { container } = render(<FullscreenBarItem />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });
});
