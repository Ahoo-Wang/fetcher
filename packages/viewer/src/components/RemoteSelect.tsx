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

import { Select, SelectProps, RefSelectProps, Flex, Empty, Spin } from 'antd';
import {
  UseDebouncedCallbackOptions,
  useDebouncedExecutePromise,
} from '@ahoo-wang/fetcher-react';
import { StyleCapable } from '../types';
import { RefAttributes, useMemo } from 'react';
import { BaseOptionType, DefaultOptionType } from 'antd/lib/select';

/**
 * Props for the RemoteSelect component.
 *
 * @template ValueType - The type of the value(s) selected in the Select
 * @template OptionType - The type of option objects, defaults to antd's DefaultOptionType
 */
export interface RemoteSelectProps<
  ValueType = any,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>
  extends Omit<SelectProps<ValueType, OptionType>, 'loading' | 'onSearch'>,
    RefAttributes<RefSelectProps>,
    StyleCapable {
  /** Debounce options for controlling the search delay */
  debounce?: UseDebouncedCallbackOptions;
  /**
   * Callback function to fetch options from remote API.
   * Called with the current search string when user types.
   *
   * @param search - The current search input value
   * @returns Promise resolving to array of options
   * @throws Error when the remote API request fails
   */
  search: (search: string) => Promise<OptionType[]>;
  /** Initial options displayed before any search is performed */
  options?: OptionType[];
  /**
   * Additional options that are always appended to the options list.
   * These appear after the remote search results or initial options.
   */
  additionalOptions?: OptionType[];
}

const DEFAULT_DEBOUNCE = {
  delay: 300,
  leading: false,
  trailing: true,
};
const DEFAULT_INITIAL_OPTIONS: any[] = [];
const DEFAULT_ADDITIONAL_OPTIONS: any[] = [];

/**
 * A Select component with built-in remote search functionality.
 * Supports debounced search, loading states, and combining remote results with static options.
 *
 * @example
 * ```tsx
 * import { RemoteSelect } from '@ahoo-wang/fetcher-viewer';
 *
 * // Basic usage with remote search
 * const UserSelect = () => (
 *   <RemoteSelect
 *     search={async (keyword) => {
 *       const response = await fetch(`/api/users?q=${keyword}`);
 *       return response.json();
 *     }}
 *     placeholder="Search users..."
 *   />
 * );
 *
 * // With initial options and additional options
 * const StatusSelect = () => (
 *   <RemoteSelect
 *     search={async (keyword) => fetchOptions(keyword)}
 *     options={[{ label: 'Pending', value: 'pending' }]}
 *     additionalOptions={[{ label: 'Unknown', value: 'unknown' }]}
 *   />
 * );
 * ```
 *
 * @template ValueType - The type of value(s) selected
 * @template OptionType - The option object type
 * @param props - Component props extending antd SelectProps
 * @returns A Select component with remote search capability
 */
export function RemoteSelect<
  ValueType = any,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>(props: RemoteSelectProps<ValueType, OptionType>) {
  const {
    debounce = DEFAULT_DEBOUNCE,
    search,
    options = DEFAULT_INITIAL_OPTIONS,
    additionalOptions = DEFAULT_ADDITIONAL_OPTIONS,
    ...selectProps
  } = props;
  const { loading, result, run } = useDebouncedExecutePromise<OptionType[]>({
    debounce: debounce,
  });
  const handleSearch = (value: string) => {
    if (value.trim() === '' && result) {
      return;
    }
    run(() => {
      return search(value);
    });
  };
  const mergedOptions = useMemo(
    () => [...(result ?? options), ...additionalOptions],
    [result, options, additionalOptions],
  );
  return (
    <Select<ValueType, OptionType>
      showSearch={{
        filterOption: false,
        onSearch: handleSearch,
      }}
      loading={loading}
      notFoundContent={
        loading ? (
          <Flex align={'center'} gap={4}>
            <Spin
              size="small"
              styles={{
                indicator: {
                  color: 'rgba(0, 0, 0, 0.25)',
                },
              }}
            />
            <span>数据加载中...</span>
          </Flex>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )
      }
      options={loading ? [] : mergedOptions}
      {...selectProps}
    />
  );
}

RemoteSelect.displayName = 'RemoteSelect';
