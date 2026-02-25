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

import { Key, useState } from 'react';

/**
 * Return type from the useViewTableState hook containing managed state and control functions.
 * @template RecordType - The type of records in the data table.
 */
export interface ViewTableStateReturn {
  /** Currently selected row keys for batch operations */
  selectedRowKeys: Key[];
  setSelectedRowKeys: (keys: Key[]) => void;

  /** Resets table state to default values */
  reset: () => void;
  /** Clears all selected row keys */
  clearSelectedRowKeys: () => void;
}

/**
 * Hook for managing ViewTable component state.
 *
 * This hook provides a unified state management solution for table-level features
 * including table size, row selection, and state reset functionality. It integrates
 * with the ActiveViewStateContext to persist and synchronize table state changes.
 *
 * @template RecordType - The type of records in the data table.
 * @param options - Configuration options including fields, columns, action column, and default table size.
 * @returns State object and control functions for the view table.
 *
 * @example
 * ```tsx
 * const { tableSize, selectedRowKeys, clearSelectedRowKeys, reset } = useViewTableState<User>({
 *   fields: userFields,
 *   columns: userColumns,
 *   defaultTableSize: 'middle',
 * });
 * ```
 */
export function useViewTableState(): ViewTableStateReturn {
  /** Selected row keys for batch operations */
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  /**
   * Clears all selected row keys.
   * Used after batch operations or when the selection should be discarded.
   */
  const clearSelectedRowKeysFn = () => {
    setSelectedRowKeys([]);
  };

  /**
   * Resets the table state to default values.
   * This includes table size and clears row selections.
   * Typically used when switching views or resetting user preferences.
   */
  const resetFn = () => {
    clearSelectedRowKeysFn();
  };

  return {
    selectedRowKeys,
    setSelectedRowKeys,
    clearSelectedRowKeys: clearSelectedRowKeysFn,
    reset: resetFn,
  };
}
