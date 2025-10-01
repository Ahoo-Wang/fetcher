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

import { useRef, useEffect, useCallback } from 'react';

/**
 * A React hook that returns a function to check if the component is mounted.
 *
 * @returns A function that returns true if the component is mounted, false otherwise
 *
 * @example
 * ```typescript
 * import { useMounted } from '@ahoo-wang/fetcher-react';
 *
 * const MyComponent = () => {
 *   const isMounted = useMounted();
 *
 *   useEffect(() => {
 *     someAsyncOperation().then(() => {
 *       if (isMounted()) {
 *         setState(result);
 *       }
 *     });
 *   }, []);
 *
 *   return <div>My Component</div>;
 * };
 * ```
 */
export function useMounted() {
  const isMountedRef = useRef(false);
  const isMounted = useCallback(() => isMountedRef.current, []);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMounted;
}
