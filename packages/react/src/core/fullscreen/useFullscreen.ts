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

import type { RefObject } from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getFullscreenElement,
  enterFullscreen,
  exitFullscreen,
  addFullscreenChangeListener,
  removeFullscreenChangeListener,
} from './utils';

export interface UseFullscreenOptions {
  /**
   * Target element to make fullscreen. If not provided, uses the document root element.
   */
  target?: RefObject<HTMLElement | null>;
}

export interface UseFullscreenReturn {
  /**
   * Whether the target element is currently in fullscreen mode
   */
  fullscreen: boolean;
  /**
   * Get the current target element. Returns the element from dynamicTargetRef, ref, or document.documentElement.
   */
  getTarget: () => HTMLElement;
  /**
   * Toggle fullscreen mode on/off
   * @param target - Optional target element. Uses getTarget() if not provided.
   */
  toggle: (target?: HTMLElement | null) => Promise<void>;
  /**
   * Enter fullscreen mode
   * @param target - Optional target element. Uses getTarget() if not provided.
   */
  enter: (target?: HTMLElement | null) => Promise<void>;
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
  const { target: targetRef } = options;

  const dynamicTargetRef = useRef<HTMLElement>(null);

  const getTarget = useCallback(() => {
    return dynamicTargetRef.current ?? targetRef?.current ?? document.documentElement;
  }, [targetRef]);

  const [fullscreen, setFullscreen] = useState(false);

  const handleFullscreenChange = useCallback(() => {
    const fullscreen = getFullscreenElement() === getTarget();
    setFullscreen(fullscreen);
  }, [getTarget, setFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    addFullscreenChangeListener(handleFullscreenChange);
    return () => {
      removeFullscreenChangeListener(handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  const enterFullscreenFn = useCallback(async (target?: HTMLElement | null) => {
    if (target !== undefined) {
      dynamicTargetRef.current = target;
    }
    const element = getTarget();
    await enterFullscreen(element);
  }, [dynamicTargetRef, getTarget]);

  const exitFullscreenFn = useCallback(async () => {
    await exitFullscreen();
  }, []);

  const toggleFullscreenFn = useCallback(async (target?: HTMLElement | null) => {
    if (fullscreen) {
      await exitFullscreenFn();
    } else {
      await enterFullscreenFn(target);
    }
  }, [fullscreen, enterFullscreenFn, exitFullscreenFn]);

  return {
    fullscreen: fullscreen,
    getTarget,
    toggle: toggleFullscreenFn,
    enter: enterFullscreenFn,
    exit: exitFullscreenFn,
  };
}
