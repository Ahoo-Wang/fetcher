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

import type { ButtonProps } from 'antd';
import { Button } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import type { RefObject, ReactNode } from 'react';
import { useFullscreen } from '@ahoo-wang/fetcher-react';

export interface FullScreenProps extends Omit<
  ButtonProps,
  'icon' | 'onClick' | 'onChange' | 'target'
> {
  /**
   * Target element to make fullscreen. If not provided, uses the document root element.
   */
  target?: RefObject<HTMLElement | null>;
  /**
   * Custom icon for entering fullscreen
   */
  enterIcon?: ReactNode;
  /**
   * Custom icon for exiting fullscreen
   */
  exitIcon?: ReactNode;
}

/**
 * A button component that toggles fullscreen mode.
 * Follows the existing component patterns in the viewer package.
 */
export function Fullscreen(props: FullScreenProps) {
  const {
    target,
    enterIcon = <FullscreenOutlined />,
    exitIcon = <FullscreenExitOutlined />,
    ...buttonProps
  } = props;

  const { fullscreen, toggle } = useFullscreen({
    target,
  });

  return (
    <Button
      {...buttonProps}
      icon={fullscreen ? exitIcon : enterIcon}
      onClick={() => toggle()}
    />
  );
}

Fullscreen.displayName = 'FullScreen';
