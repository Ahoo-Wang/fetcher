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

import { cellRegistry } from './cellRegistry';
import type * as React from 'react';

export type CellType = string


export type TypedCellRenderer<RecordType = any> = (value: any,
                                                   record: RecordType,
                                                   index: number) => React.ReactNode | Promise<React.ReactNode>;

export function typedCellRender<RecordType = any, Attributes = any>(type: CellType, attributes?: Attributes): TypedCellRenderer<RecordType> | undefined {
  const CellComponent = cellRegistry.get(type);
  if (!CellComponent) {
    return undefined;
  }
  return (value: any, record: RecordType, index: number) => {
    return CellComponent({
      attributes,
      value,
      record,
      index,
    });
  };
}
