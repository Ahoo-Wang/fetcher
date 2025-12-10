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

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLatest } from '@ahoo-wang/fetcher-react';

export interface UseFullScreenOptions {
  /**
   * Target element to make fullscreen. If not provided, uses the document root element.
   */
  target?: HTMLElement | null;
  /**
   * Callback when fullscreen state changes
   */
  onChange?: (isFullScreen: boolean) => void;
}

export interface UseFullScreenReturn {
  /**
   * Whether the target element is currently in fullscreen mode
   */
  isFullScreen: boolean;
  /**
   * Toggle fullscreen mode on/off
   */
  toggle: () => Promise<void>;
  /**
   * Enter fullscreen mode
   */
  enter: () => Promise<void>;
  /**
   * Exit fullscreen mode
   */
  exit: () => Promise<void>;
}

/**
 * React hook for managing fullscreen state and actions.
 * Provides cross-browser fullscreen API support with automatic state tracking.
 */
export function useFullScreen(
  options: UseFullScreenOptions = {},
): UseFullScreenReturn {
  const { target, onChange } = options;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const targetRef =useLatest(target)

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;

      const newIsFullscreen = !!fullscreenElement;
      setIsFullscreen(newIsFullscreen);
      onChange?.(newIsFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange,
      );
      document.removeEventListener(
        'mozfullscreenchange',
        handleFullscreenChange,
      );
      document.removeEventListener(
        'MSFullscreenChange',
        handleFullscreenChange,
      );
    };
  }, [onChange]);

  const enterFullscreen = useCallback(async () => {
    try {
      const element = targetRef.current || document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullScreen: isFullscreen,
    toggle: toggleFullscreen,
    enter: enterFullscreen,
    exit: exitFullscreen,
  };
}
