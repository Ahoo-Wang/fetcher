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

import { Button, ButtonProps } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { useState, useCallback, useEffect, useRef } from 'react';

export interface FullscreenProps extends Omit<ButtonProps, 'icon' | 'onClick' | 'onChange' | 'target'> {
  /**
   * Target element to make fullscreen. If not provided, uses the document body.
   */
  target?: HTMLElement | null;
  /**
   * Callback when fullscreen state changes
   */
  onChange?: (isFullscreen: boolean) => void;
  /**
   * Custom icon for entering fullscreen
   */
  enterIcon?: React.ReactNode;
  /**
   * Custom icon for exiting fullscreen
   */
  exitIcon?: React.ReactNode;
}

/**
 * A button component that toggles fullscreen mode.
 * Follows the existing component patterns in the viewer package.
 */
export function Fullscreen(props: FullscreenProps) {
  const {
    target,
    onChange,
    enterIcon = <FullscreenOutlined />,
    exitIcon = <FullscreenExitOutlined />,
    ...buttonProps
  } = props;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const targetRef = useRef<HTMLElement | null>(target || null);

  // Update target ref when prop changes
  useEffect(() => {
    targetRef.current = target || null;
  }, [target]);

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

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!isFullscreen) {
        // Enter fullscreen
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
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  }, [isFullscreen]);

  return (
    <Button
      {...buttonProps}
      icon={isFullscreen ? exitIcon : enterIcon}
      onClick={toggleFullscreen}
    />
  );
}

Fullscreen.displayName = 'Fullscreen';
