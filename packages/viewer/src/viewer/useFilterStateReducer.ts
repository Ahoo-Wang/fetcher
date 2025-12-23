import { ActiveFilter } from '../filter';
import { ReducerActionCapable } from '../types';
import { useCallback, useReducer } from 'react';
import { Condition } from '@ahoo-wang/fetcher-wow';

export interface FilterState {
  activeFilters: ActiveFilter[];
  queryCondition: Condition;
  showFilterPanel: boolean;
}

export type FilterStateReducerActionType =
  | 'UPDATE_ACTIVE_FILTERS'
  | 'UPDATE_SHOW_FILTER_PANEL'
  | 'UPDATE_QUERY_CONDITION';

export interface FilterStateReducerAction extends ReducerActionCapable<FilterStateReducerActionType> {}

export interface FilterStateReducerReturn {
  activeFilters: ActiveFilter[];
  showFilterPanel: boolean;
  queryCondition: Condition;
  updateActiveFilters: (activeFilters: ActiveFilter[]) => void;
  updateShowFilterPanel: (showFilterPanel: boolean) => void;
  updateQueryCondition: (condition: Condition) => void;
}

const filterStateReducer = (
  state: FilterState,
  action: FilterStateReducerAction,
) => {
  switch (action.type) {
    case 'UPDATE_ACTIVE_FILTERS':
      return { ...state, activeFilters: action.payload };
    case 'UPDATE_SHOW_FILTER_PANEL':
      return { ...state, showFilterPanel: action.payload };
    case 'UPDATE_QUERY_CONDITION':
      return { ...state, queryCondition: action.payload };
    default:
      return state;
  }
};

export function useFilterStateReducer(
  state: FilterState,
): FilterStateReducerReturn {
  const [filterState, dispatch] = useReducer<
    FilterState,
    [FilterStateReducerAction]
  >(filterStateReducer, state);

  const updateActiveFilters = useCallback((activeFilters: ActiveFilter[]) => {
    dispatch({ type: 'UPDATE_ACTIVE_FILTERS', payload: activeFilters });
  }, []);

  const updateShowFilterPanel = useCallback((showFilterPanel: boolean) => {
    dispatch({ type: 'UPDATE_SHOW_FILTER_PANEL', payload: showFilterPanel });
  }, []);

  const updateQueryCondition = useCallback((condition: Condition) => {
    dispatch({ type: 'UPDATE_QUERY_CONDITION', payload: condition });
  }, []);

  return {
    activeFilters: filterState.activeFilters,
    showFilterPanel: filterState.showFilterPanel,
    queryCondition: filterState.queryCondition,
    updateActiveFilters,
    updateShowFilterPanel,
    updateQueryCondition,
  };
}
