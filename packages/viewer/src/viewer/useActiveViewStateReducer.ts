import { View, ViewColumn } from './types';
import { ReducerActionCapable } from '../types';
import { Condition } from '@ahoo-wang/fetcher-wow';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { ActiveFilter } from '../filter';
import { useEffect, useReducer, useRef, useState } from 'react';
import { deepEqual } from '../utils';

export interface ActiveViewState extends View {}

export type ActiveViewStateReducerActionType =
  | 'UPDATE_FILTERS'
  | 'UPDATE_COLUMNS'
  | 'UPDATE_TABLE_SIZE'
  | 'UPDATE_CONDITIONS'
  | 'UPDATE_PAGE_SIZE'
  | 'RESET'
  | 'SWITCH_VIEW';

export interface ActiveViewStateReducerAction extends ReducerActionCapable<ActiveViewStateReducerActionType> {}

export interface ActiveViewStateReducerReturn {
  activeView: ActiveViewState;
  changed: boolean;
  updateFilters: (filters: ActiveFilter[]) => void;
  updateColumns: (columns: ViewColumn[]) => void;
  updateTableSize: (size: SizeType) => void;
  updateConditions: (conditions: Condition) => void;
  updatePageSize: (pageSize: number) => void;
  reset: () => ActiveViewState;
  switchView: (view: View) => void;
}

const activeViewStateReducer = (
  state: ActiveViewState,
  action: ActiveViewStateReducerAction,
): ActiveViewState => {
  switch (action.type) {
    case 'UPDATE_FILTERS':
      return { ...state, filters: action.payload };
    case 'UPDATE_COLUMNS':
      return { ...state, columns: action.payload };
    case 'UPDATE_TABLE_SIZE':
      return { ...state, tableSize: action.payload };
    case 'UPDATE_CONDITIONS':
      return {
        ...state,
        pagedQuery: { ...state.pagedQuery, condition: action.payload },
      };
    case 'UPDATE_PAGE_SIZE':
      return {
        ...state,
        pagedQuery: {
          ...state.pagedQuery,
          pagination: {
            index: state.pagedQuery.pagination?.index || 1,
            size: action.payload,
          },
        },
        pageSize: action.payload,
      };
    case 'RESET':
      return { ...action.payload };
    case 'SWITCH_VIEW':
      return { ...action.payload };
    default:
      return state;
  }
};

export function useActiveViewStateReducer(
  state: ActiveViewState,
): ActiveViewStateReducerReturn {
  const originalStateRef = useRef<ActiveViewState>(state);

  const [changed, setChanged] = useState(false);

  useEffect(() => {
    originalStateRef.current = state;
  }, [state]);

  const [activeView, dispatch] = useReducer<
    ActiveViewState,
    [ActiveViewStateReducerAction]
  >(activeViewStateReducer, { ...state });

  const updateFilters = (filters: ActiveFilter[]) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  };

  const updateColumns = (columns: ViewColumn[]) => {
    dispatch({ type: 'UPDATE_COLUMNS', payload: columns });
  };

  const updateTableSize = (size: SizeType) => {
    dispatch({ type: 'UPDATE_TABLE_SIZE', payload: size });
  };

  const updateConditions = (conditions: Condition) => {
    dispatch({ type: 'UPDATE_CONDITIONS', payload: conditions });
  };

  const updatePageSize = (pageSize: number) => {
    dispatch({ type: 'UPDATE_PAGE_SIZE', payload: pageSize });
  };

  const reset = () => {
    dispatch({ type: 'RESET', payload: { ...originalStateRef.current } });
    return originalStateRef.current
  };

  const switchView = (view: View) => {
    originalStateRef.current = { ...view };
    dispatch({ type: 'SWITCH_VIEW', payload: { ...view } });
  };

  useEffect(() => {
    setChanged(!deepEqual(originalStateRef.current, activeView));
  }, [activeView]);

  return {
    activeView,
    changed,
    updateFilters,
    updateColumns,
    updateTableSize,
    updateConditions,
    updatePageSize,
    reset,
    switchView,
  };
}
