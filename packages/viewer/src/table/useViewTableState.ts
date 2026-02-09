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

import { Key, useEffect, useState } from 'react';
import { SizeType } from 'antd/es/config-provider/SizeContext';

/**
 * Options for configuring the view table state.
 * @template RecordType - The type of records in the data table.
 */
export interface ViewTableStateOptions {
  /** Default table size (small, middle, large) */
  defaultTableSize: SizeType;
}

/**
 * Return type from the useViewTableState hook containing managed state and control functions.
 * @template RecordType - The type of records in the data table.
 */
export interface ViewTableStateReturn {
  /** Current table size (small, middle, large) */
  tableSize: SizeType;
  setTableSize: (size: SizeType) => void;
  /** Currently selected row keys for batch operations */
  selectedRowKeys: Key[];
  setSelectedRowKeys: (keys: Key[]) => void;

  /** Clears all selected row keys */
  clearSelectedRowKeys: () => void;
  /** Resets table state to default values */
  reset: () => void;
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
export function useViewTableState({
  defaultTableSize = 'middle'
}: ViewTableStateOptions): ViewTableStateReturn {
  /** Current table size state */
  const [tableSize, setTableSize] = useState<SizeType>(defaultTableSize);
  /** Selected row keys for batch operations */
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  /**
   * Synchronizes table size with default value when it changes.
   * This ensures the table size resets to the configured default
   * when the view definition changes.
   */
  useEffect(() => {
    setTableSize(defaultTableSize);
  }, [defaultTableSize]);

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
    setTableSize(defaultTableSize);
    clearSelectedRowKeysFn();
  };

  return {
    tableSize,
    setTableSize,
    selectedRowKeys,
    setSelectedRowKeys,
    reset: resetFn,
    clearSelectedRowKeys: clearSelectedRowKeysFn,
  };
}
