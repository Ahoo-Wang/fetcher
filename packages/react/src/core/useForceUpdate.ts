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

import { useCallback, useReducer } from 'react';
import { useMounted } from './useMounted';

/**
 * A React hook that returns a function to force a component to re-render.
 * This is useful when you need to trigger a re-render imperatively, such as
 * when dealing with external state changes or imperative updates.
 *
 * @returns A function that when called, forces the component to re-render
 *
 * @example
 * ```typescript
 * import { useForceUpdate } from '@ahoo-wang/fetcher-react';
 *
 * const MyComponent = () => {
 *   const forceUpdate = useForceUpdate();
 *
 *   const handleExternalChange = () => {
 *     // Some external state change that doesn't trigger React re-render
 *     externalLibrary.updateSomething();
 *     forceUpdate(); // Force re-render to reflect changes
 *   };
 *
 *   return (
 *     <div>
 *       <p>Component state: {someValue}</p>
 *       <button onClick={handleExternalChange}>Update External State</button>
 *     </div>
 *   );
 * };
 * ```
 */
export function useForceUpdate(): () => void {
  const isMounted = useMounted();
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  return useCallback(() => {
    if (isMounted()) {
      forceUpdate();
    }
  }, [isMounted, forceUpdate]);
}
