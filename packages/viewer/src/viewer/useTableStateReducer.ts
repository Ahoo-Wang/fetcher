import { ViewColumn } from './types';
import { ReducerActionCapable } from '../types';
import { useCallback, useReducer } from 'react';
import { SizeType } from 'antd/es/config-provider/SizeContext';

export interface TableState {
  columns: ViewColumn[];
  tableSize: SizeType;
}

export type TableStateReducerActionType =
  | 'UPDATE_COLUMNS'
  | 'UPDATE_TABLE_SIZE';

export interface TableStateReducerAction extends ReducerActionCapable<TableStateReducerActionType> {}

export interface UseTableStateReducerReturn {
  columns: ViewColumn[];
  tableSize: SizeType;
  updateColumns: (columns: ViewColumn[]) => void;
  updateTableSize: (tableSize: SizeType) => void;
}

const tableStateReducer = (
  state: TableState,
  action: TableStateReducerAction,
) => {
  switch (action.type) {
    case 'UPDATE_COLUMNS':
      return { ...state, columns: action.payload };
    case 'UPDATE_TABLE_SIZE':
      return { ...state, tableSize: action.payload };
    default:
      return state;
  }
};

export function useTableStateReducer(
  state: TableState,
): UseTableStateReducerReturn {
  const [tableState, dispatch] = useReducer<
    TableState,
    [TableStateReducerAction]
  >(tableStateReducer, state);

  const updateColumns = useCallback((columns: ViewColumn[]) => {
    dispatch({ type: 'UPDATE_COLUMNS', payload: columns });
  }, []);

  const updateTableSize = useCallback((tableSize: SizeType) => {
    dispatch({ type: 'UPDATE_TABLE_SIZE', payload: tableSize });
  }, []);

  return {
    columns: tableState.columns,
    tableSize: tableState.tableSize,
    updateColumns,
    updateTableSize,
  };
}
