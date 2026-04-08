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

import type { ReactNode} from 'react';
import { createContext, useContext, useRef } from 'react';
import type { UseFullscreenOptions, UseFullscreenReturn } from './useFullscreen';
import { useFullscreen } from './useFullscreen';

export type FullscreenContextValue = UseFullscreenReturn;

export const FullscreenContext = createContext<
  FullscreenContextValue | undefined
>(undefined);

export interface FullscreenProviderProps extends UseFullscreenOptions {
  children: ReactNode;
}

export function FullscreenProvider(props: FullscreenProviderProps) {
  const { children, target: targetProp, ...options } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const target = targetProp ?? containerRef;
  const fullscreen = useFullscreen({ target, ...options });
  return (
    <FullscreenContext.Provider value={fullscreen}>
      <div ref={targetProp ? undefined : containerRef}>{children}</div>
    </FullscreenContext.Provider>
  );
}

export function useFullscreenContext(): FullscreenContextValue | undefined {
  return useContext(FullscreenContext);
}
