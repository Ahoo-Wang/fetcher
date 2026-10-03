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

import { useState } from 'react';
import { dequal } from 'dequal';

/**
 * Returns `value`, but keeps the previous reference while the content is
 * deeply equal, so an inline object can drive an effect without re-running
 * it on every render.
 */
export function useStableValue<T>(value: T): T {
  const [stable, setStable] = useState(value);
  if (stable !== value && !dequal(stable, value)) {
    // Adjusting state from the previous render: React re-renders at once.
    setStable(() => value);
    return value;
  }
  return stable;
}
