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
import { renderHook, act } from '@testing-library/react';
import { useFullscreen } from '../../../src';

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
} from '../../../src';

describe('useFullscreen hook', () => {
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
    (getFullscreenElement as any).mockReturnValue(null);
    (enterFullscreen as any).mockResolvedValue(undefined);
    (exitFullscreen as any).mockResolvedValue(undefined);
    (addFullscreenChangeListener as any).mockImplementation(() => {});
    (removeFullscreenChangeListener as any).mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
  });

  describe('initialization', () => {
    it('should initialize with isFullscreen false', () => {
      const { result } = renderHook(() => useFullscreen());

      expect(result.current.isFullscreen).toBe(false);
    });

    it('should add fullscreen change listener on mount', () => {
      renderHook(() => useFullscreen());

      expect(addFullscreenChangeListener).toHaveBeenCalledTimes(1);
      expect(addFullscreenChangeListener).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('should remove fullscreen change listener on unmount', () => {
      const { unmount } = renderHook(() => useFullscreen());

      unmount();

      expect(removeFullscreenChangeListener).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined options gracefully', () => {
      const { result } = renderHook(() => useFullscreen(undefined));

      expect(result.current.isFullscreen).toBe(false);
    });
  });

  describe('fullscreen state tracking', () => {
    it('should update isFullscreen when target element becomes fullscreen', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useFullscreen({ target: mockTargetRef, onChange }),
      );

      // Simulate fullscreen change
      (getFullscreenElement as any).mockReturnValue(mockElement);
      act(() => {
        const callback = (addFullscreenChangeListener as any).mock.calls[0][0];
        callback();
      });

      expect(result.current.isFullscreen).toBe(true);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should update isFullscreen when document element becomes fullscreen (no target)', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useFullscreen({ onChange }));

      (getFullscreenElement as any).mockReturnValue(document.documentElement);
      act(() => {
        const callback = (addFullscreenChangeListener as any).mock.calls[0][0];
        callback();
      });

      expect(result.current.isFullscreen).toBe(true);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should update isFullscreen to false when exiting fullscreen', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useFullscreen({ target: mockTargetRef, onChange }),
      );

      // Enter fullscreen first
      (getFullscreenElement as any).mockReturnValue(mockElement);
      act(() => {
        const callback = (addFullscreenChangeListener as any).mock.calls[0][0];
        callback();
      });

      // Exit fullscreen
      (getFullscreenElement as any).mockReturnValue(null);
      act(() => {
        const callback = (addFullscreenChangeListener as any).mock.calls.slice(
          -1,
        )[0][0];
        callback();
      });

      expect(result.current.isFullscreen).toBe(false);
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenLastCalledWith(false);
    });

    it('should not call onChange when state does not change', () => {
      const onChange = vi.fn();
      renderHook(() => useFullscreen({ target: mockTargetRef, onChange }));

      // Same state
      act(() => {
        const callback = (addFullscreenChangeListener as any).mock.calls[0][0];
        callback();
        callback();
      });

      expect(onChange).toHaveBeenCalledTimes(0);
    });
  });

  describe('enter function', () => {
    it('should call enterFullscreen with target element', async () => {
      const { result } = renderHook(() =>
        useFullscreen({ target: mockTargetRef }),
      );

      await act(async () => {
        await result.current.enter();
      });

      expect(enterFullscreen).toHaveBeenCalledWith(mockElement);
    });

    it('should call enterFullscreen with document.documentElement when no target', async () => {
      const { result } = renderHook(() => useFullscreen());

      await act(async () => {
        await result.current.enter();
      });

      expect(enterFullscreen).toHaveBeenCalledWith(document.documentElement);
    });

    it('should call enterFullscreen with document.documentElement when target.current is null', async () => {
      const nullRef = { current: null };
      const { result } = renderHook(() => useFullscreen({ target: nullRef }));

      await act(async () => {
        await result.current.enter();
      });

      expect(enterFullscreen).toHaveBeenCalledWith(document.documentElement);
    });

    it('should throw error when enterFullscreen fails', async () => {
      const error = new Error('Enter failed');
      (enterFullscreen as any).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useFullscreen({ target: mockTargetRef }),
      );

      await expect(
        act(async () => {
          await result.current.enter();
        }),
      ).rejects.toThrow('Enter failed');
    });
  });

  describe('exit function', () => {
    it('should call exitFullscreen', async () => {
      const { result } = renderHook(() => useFullscreen());

      await act(async () => {
        await result.current.exit();
      });

      expect(exitFullscreen).toHaveBeenCalledTimes(1);
    });

    it('should throw error when exitFullscreen fails', async () => {
      const error = new Error('Exit failed');
      (exitFullscreen as any).mockRejectedValue(error);

      const { result } = renderHook(() => useFullscreen());

      await expect(
        act(async () => {
          await result.current.exit();
        }),
      ).rejects.toThrow('Exit failed');
    });
  });

  describe('toggle function', () => {
    it('should call exit when currently in fullscreen', async () => {
      const { result } = renderHook(() =>
        useFullscreen({ target: mockTargetRef }),
      );

      // Set fullscreen state
      (getFullscreenElement as any).mockReturnValue(mockElement);
      act(() => {
        const callback = (addFullscreenChangeListener as any).mock.calls[0][0];
        callback();
      });

      await act(async () => {
        await result.current.toggle();
      });

      expect(exitFullscreen).toHaveBeenCalledTimes(1);
      expect(enterFullscreen).not.toHaveBeenCalled();
    });

    it('should call enter when not in fullscreen', async () => {
      const { result } = renderHook(() =>
        useFullscreen({ target: mockTargetRef }),
      );

      await act(async () => {
        await result.current.toggle();
      });

      expect(enterFullscreen).toHaveBeenCalledWith(mockElement);
      expect(exitFullscreen).not.toHaveBeenCalled();
    });

    it('should handle sequential toggle calls', async () => {
      const { result } = renderHook(() =>
        useFullscreen({ target: mockTargetRef }),
      );

      // First toggle: enter
      await act(async () => {
        await result.current.toggle();
      });
      // Simulate fullscreen entered
      (getFullscreenElement as any).mockReturnValue(mockElement);
      act(() => {
        const callback = (addFullscreenChangeListener as any).mock.calls.slice(
          -1,
        )[0][0];
        callback();
      });

      // Second toggle: exit
      await act(async () => {
        await result.current.toggle();
      });
      // Simulate fullscreen exited
      (getFullscreenElement as any).mockReturnValue(null);
      act(() => {
        const callback = (addFullscreenChangeListener as any).mock.calls.slice(
          -1,
        )[0][0];
        callback();
      });

      // Third toggle: enter
      await act(async () => {
        await result.current.toggle();
      });

      expect(enterFullscreen).toHaveBeenCalledTimes(2);
      expect(exitFullscreen).toHaveBeenCalledTimes(1);
    });
  });

  describe('callback stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() =>
        useFullscreen({ target: mockTargetRef }),
      );

      const initialFunctions = {
        enter: result.current.enter,
        exit: result.current.exit,
        toggle: result.current.toggle,
      };

      rerender();

      expect(result.current.enter).toBe(initialFunctions.enter);
      expect(result.current.exit).toBe(initialFunctions.exit);
      expect(result.current.toggle).toBe(initialFunctions.toggle);
    });

    it('should update functions when target changes', () => {
      const { result, rerender } = renderHook(
        ({ target }) => useFullscreen({ target }),
        { initialProps: { target: mockTargetRef } },
      );

      const initialEnter = result.current.enter;

      const newElement = document.createElement('div');
      document.body.appendChild(newElement);
      const newRef = { current: newElement };

      rerender({ target: newRef });

      expect(result.current.enter).not.toBe(initialEnter);

      document.body.removeChild(newElement);
    });

    it('should update functions when onChange changes', () => {
      const onChange1 = vi.fn();
      const onChange2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ onChange }) => useFullscreen({ onChange }),
        { initialProps: { onChange: onChange1 } },
      );

      const initialCallback = (addFullscreenChangeListener as any).mock
        .calls[0][0];

      rerender({ onChange: onChange2 });

      const newCallback = (addFullscreenChangeListener as any).mock.calls[1][0];
      expect(newCallback).not.toBe(initialCallback);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle target ref becoming null during execution', async () => {
      const { result } = renderHook(() =>
        useFullscreen({ target: mockTargetRef }),
      );

      // Simulate target becoming null
      (mockTargetRef as any).current = null;

      await act(async () => {
        await result.current.enter();
      });

      expect(enterFullscreen).toHaveBeenCalledWith(document.documentElement);
    });

    it('should handle onChange callback throwing error', () => {
      const onChange = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      renderHook(() => useFullscreen({ target: mockTargetRef, onChange }));

      (getFullscreenElement as any).mockReturnValue(mockElement);

      expect(() => {
        act(() => {
          const callback = (addFullscreenChangeListener as any).mock
            .calls[0][0];
          callback();
        });
      }).toThrow('Callback error');
    });

    it('should handle multiple fullscreen change events', () => {
      const onChange = vi.fn();
      renderHook(() => useFullscreen({ target: mockTargetRef, onChange }));

      (getFullscreenElement as any).mockReturnValue(mockElement);

      act(() => {
        const callback = (addFullscreenChangeListener as any).mock.calls[0][0];
        callback();
        callback();
        callback();
      });

      expect(onChange).toHaveBeenCalledTimes(3);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should handle listener cleanup on re-render with changed target', () => {
      const newElement = document.createElement('div');
      document.body.appendChild(newElement);
      const newRef = { current: newElement };

      const { rerender } = renderHook(
        ({ target }) => useFullscreen({ target }),
        { initialProps: { target: mockTargetRef } },
      );

      expect(removeFullscreenChangeListener).not.toHaveBeenCalled();

      rerender({ target: newRef });

      expect(removeFullscreenChangeListener).toHaveBeenCalledTimes(1);
      expect(addFullscreenChangeListener).toHaveBeenCalledTimes(2);

      document.body.removeChild(newElement);
    });

    it('should handle undefined target ref', () => {
      const { result } = renderHook(() => useFullscreen({ target: undefined }));

      expect(result.current.isFullscreen).toBe(false);
    });

    it('should handle target ref with null current', () => {
      const nullRef = { current: null };
      const { result } = renderHook(() => useFullscreen({ target: nullRef }));

      expect(result.current.isFullscreen).toBe(false);
    });
  });

  describe('integration with real DOM', () => {
    it('should work with real DOM elements', async () => {
      const realElement = document.createElement('div');
      document.body.appendChild(realElement);
      const realRef = { current: realElement };

      const { result } = renderHook(() => useFullscreen({ target: realRef }));

      await act(async () => {
        await result.current.enter();
      });

      expect(enterFullscreen).toHaveBeenCalledWith(realElement);

      document.body.removeChild(realElement);
    });

    it('should handle document.documentElement as fallback', async () => {
      const nullRef = { current: null };
      const { result } = renderHook(() => useFullscreen({ target: nullRef }));

      await act(async () => {
        await result.current.enter();
      });

      expect(enterFullscreen).toHaveBeenCalledWith(document.documentElement);
    });
  });
});
