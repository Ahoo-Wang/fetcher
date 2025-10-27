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

import { RefObject, useRef } from 'react';

/**
 * A React hook that returns a ref containing the latest value, useful for accessing the current value in async callbacks.
 *
 * @template T - The type of the value
 * @param value - The value to track
 * @returns A ref object containing the latest value
 *
 * @example
 * ```typescript
 * import { useLatest } from '@ahoo-wang/fetcher-react';
 *
 * const MyComponent = () => {
 *   const [count, setCount] = useState(0);
 *   const latestCount = useLatest(count);
 *
 *   const handleAsync = async () => {
 *     await someAsyncOperation();
 *     console.log('Latest count:', latestCount.current); // Always the latest
 *   };
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => setCount(c => c + 1)}>Increment</button>
 *       <button onClick={handleAsync}>Async Log</button>
 *     </div>
 *   );
 * };
 * ```
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  /* eslint-disable react-hooks/refs */
  ref.current = value;
  return ref;
}
