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

import { Select, SelectProps } from 'antd';
import { useFetcher } from '@ahoo-wang/fetcher-react';
import { FetchRequest } from '@ahoo-wang/fetcher';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleCapable } from '../types';

export interface RemoteSelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface RemoteSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType>, 'options' | 'loading' | 'onSearch'>,
    StyleCapable {
  /**
   * The fetch request configuration for loading options
   */
  fetchRequest: FetchRequest;
  /**
   * Function to transform the fetch result into Select options
   * @param data - The raw data from the fetch response
   * @returns Array of Select options
   */
  dataTransformer?: (data: any) => RemoteSelectOption[];
  /**
   * Whether to fetch options automatically on mount
   * @default true
   */
  autoFetch?: boolean;
  /**
   * Custom error message to display when fetch fails
   */
  errorMessage?: string;
  /**
   * Callback when fetch fails
   */
  onFetchError?: (error: any) => void;
  /**
   * Name of the query parameter to use for search
   * @default 'search'
   */
  searchParamName?: string;
  /**
   * Debounce delay in milliseconds for search requests
   * @default 300
   */
  searchDebounceDelay?: number;
  /**
   * Minimum search length to trigger a request
   * @default 1
   */
  minSearchLength?: number;
}

/**
 * A Select component that loads options from a remote API.
 * Supports automatic fetching, loading states, and error handling.
 */
export function RemoteSelect<ValueType = any>(
  props: RemoteSelectProps<ValueType>,
) {
  const {
    fetchRequest,
    dataTransformer = (data: any) => {
      if (Array.isArray(data)) {
        return data.map((item, index) => ({
          label: item.label || item.name || item.title || `Option ${index + 1}`,
          value: item.value || item.id || item.key || index,
          disabled: item.disabled || false,
        }));
      }
      return [];
    },
    autoFetch = true,
    errorMessage,
    onFetchError,
    searchParamName = 'search',
    searchDebounceDelay = 300,
    minSearchLength = 1,
    placeholder = '请选择...',
    allowClear = true,
    showSearch = true,
    filterOption,
    ...selectProps
  } = props;

  const { loading, error, result, execute } = useFetcher<any>({
    onError: err => {
      onFetchError?.(err);
    },
  });

  const debounceTimerRef = useRef<number | null>(null);

  const fetchOptions = useCallback(
    async (search?: string) => {
      const requestWithSearch = { ...fetchRequest };

      if (search && search.length >= minSearchLength) {
        // Add search parameter to the request
        if (requestWithSearch.url.includes('?')) {
          requestWithSearch.url += `&${searchParamName}=${encodeURIComponent(search)}`;
        } else {
          requestWithSearch.url += `?${searchParamName}=${encodeURIComponent(search)}`;
        }
      }

      await execute(requestWithSearch);
    },
    [execute, fetchRequest, searchParamName, minSearchLength],
  );

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        fetchOptions(value);
      }, searchDebounceDelay);
    },
    [fetchOptions, searchDebounceDelay],
  );

  const handleSearch = useCallback(
    (value: string) => {
      if (value.length >= minSearchLength || value.length === 0) {
        debouncedSearch(value);
      }
    },
    [debouncedSearch, minSearchLength],
  );

  useEffect(() => {
    if (autoFetch) {
      fetchOptions();
    }
  }, [autoFetch, fetchOptions]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (error && errorMessage) {
      // Could show a notification here if needed
      console.error('RemoteSelect fetch error:', error);
    }
  }, [error, errorMessage]);

  const transformedOptions = useMemo(() => {
    if (result) {
      return dataTransformer(result);
    }
    return [];
  }, [result, dataTransformer]);

  return (
    <Select<ValueType>
      {...selectProps}
      placeholder={placeholder}
      allowClear={allowClear}
      showSearch={showSearch}
      filterOption={filterOption}
      options={transformedOptions}
      loading={loading}
      status={error ? 'error' : undefined}
      onSearch={handleSearch}
    />
  );
}

RemoteSelect.displayName = 'RemoteSelect';
