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

import { useState, useCallback, useEffect, Ref } from 'react';
import {
  getFullscreenElement,
  enterFullscreen as enterFullscreenUtil,
  exitFullscreen as exitFullscreenUtil,
  addFullscreenChangeListener,
  removeFullscreenChangeListener,
} from './utils';

export interface UseFullscreenOptions {
  /**
   * Target element to make fullscreen. If not provided, uses the document root element.
   */
  target?: Ref<HTMLElement>;
  /**
   * Callback when fullscreen state changes
   */
  onChange?: (isFullscreen: boolean) => void;
}

export interface UseFullscreenReturn {
  /**
   * Whether the target element is currently in fullscreen mode
   */
  isFullscreen: boolean;
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
export function useFullscreen(
  options: UseFullscreenOptions = {},
): UseFullscreenReturn {
  const { target, onChange } = options;

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = getFullscreenElement();
      const newIsFullscreen =
        fullscreenElement === (target?.current || document.documentElement);
      setIsFullscreen(newIsFullscreen);
      onChange?.(newIsFullscreen);
    };

    addFullscreenChangeListener(handleFullscreenChange);

    return () => {
      removeFullscreenChangeListener(handleFullscreenChange);
    };
  }, [onChange, target]);

  const enterFullscreen = useCallback(async () => {
    const element = target?.current || document.documentElement;
    await enterFullscreenUtil(element);
  }, [target]);

  const exitFullscreen = useCallback(async () => {
    await exitFullscreenUtil();
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen: isFullscreen,
    toggle: toggleFullscreen,
    enter: enterFullscreen,
    exit: exitFullscreen,
  };
}
