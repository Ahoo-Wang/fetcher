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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  FullscreenProvider,
  useFullscreenContext,
} from '../../../src/core/fullscreen/FullscreenContext';

// Mock the utils module
vi.mock('../../../src/core/fullscreen/utils', () => ({
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
} from '../../../src';

describe('FullscreenContext', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);

    vi.clearAllMocks();

    (getFullscreenElement as any).mockReturnValue(null);
    (enterFullscreen as any).mockResolvedValue(undefined);
    (exitFullscreen as any).mockResolvedValue(undefined);
    (window.addEventListener as any) = vi.fn();
    (window.removeEventListener as any) = vi.fn();
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
  });

  describe('FullscreenProvider', () => {
    it('should render children', () => {
      const { getByText } = render(
        <FullscreenProvider>
          <div>Child Content</div>
        </FullscreenProvider>,
      );

      expect(getByText('Child Content')).toBeTruthy();
    });

    it('should provide fullscreen context to children', () => {
      function TestComponent() {
        const context = useFullscreenContext();
        expect(context).toBeDefined();
        expect(context.isFullscreen).toBe(false);
        expect(typeof context.toggle).toBe('function');
        expect(typeof context.enter).toBe('function');
        expect(typeof context.exit).toBe('function');
        expect(typeof context.getTarget).toBe('function');
        return null;
      }

      render(
        <FullscreenProvider>
          <TestComponent />
        </FullscreenProvider>,
      );
    });

    it('should use internal ref when no target provided', () => {
      function TestComponent() {
        const { getTarget } = useFullscreenContext();
        const target = getTarget();
        expect(target).toBeTruthy();
        return null;
      }

      render(
        <FullscreenProvider>
          <TestComponent />
        </FullscreenProvider>,
      );
    });

    it('should use provided target ref', () => {
      const targetRef = { current: mockElement };

      function TestComponent() {
        const { getTarget } = useFullscreenContext();
        expect(getTarget()).toBe(mockElement);
        return null;
      }

      render(
        <FullscreenProvider target={targetRef}>
          <TestComponent />
        </FullscreenProvider>,
      );
    });
  });

  describe('useFullscreenContext', () => {
    it('should throw error when used outside provider', () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        const TestComponent = () => {
          useFullscreenContext();
          return null;
        };
        render(<TestComponent />);
      }).toThrow('useFullscreenContext must be used within FullscreenProvider');

      consoleError.mockRestore();
    });

    it('should return context value with all required properties', () => {
      function TestComponent() {
        const context = useFullscreenContext();
        expect(context.isFullscreen).toBe(false);
        expect(typeof context.toggle).toBe('function');
        expect(typeof context.enter).toBe('function');
        expect(typeof context.exit).toBe('function');
        expect(typeof context.getTarget).toBe('function');
        return null;
      }

      render(
        <FullscreenProvider>
          <TestComponent />
        </FullscreenProvider>,
      );
    });
  });
});
