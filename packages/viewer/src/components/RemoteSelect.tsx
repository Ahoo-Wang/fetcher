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
import { RefAttributes, useCallback, useMemo } from 'react';
import { BaseOptionType, DefaultOptionType } from 'antd/lib/select';

export interface RemoteSelectProps<
  ValueType = any,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>
  extends Omit<SelectProps<ValueType, OptionType>, 'loading' | 'onSearch'>,
    RefAttributes<RefSelectProps>,
    StyleCapable {
  debounce?: UseDebouncedCallbackOptions;
  search: (search: string) => Promise<OptionType[]>;
  /**
   * 初始 Options 数据
   */
  options?: OptionType[];
  /**
   * 额外的 Options 数据，始终追加 到 options 中
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
 * A Select component that loads options from a remote API.
 * Supports automatic fetching, loading states, and error handling.
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
