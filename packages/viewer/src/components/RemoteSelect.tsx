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
import { UseDebouncedCallbackOptions, useDebouncedExecutePromise } from '@ahoo-wang/fetcher-react';
import { StyleCapable } from '../types';

export interface RemoteSelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface RemoteSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType>, 'options' | 'loading' | 'onSearch'>,
    StyleCapable {
  debounce?: UseDebouncedCallbackOptions;
  fetch: (search: string) => Promise<RemoteSelectOption[]>;
}

const DEFAULT_DEBOUNCE = {
  delay: 300,
  leading: true,
  trailing: true,
};

/**
 * A Select component that loads options from a remote API.
 * Supports automatic fetching, loading states, and error handling.
 */
export function RemoteSelect<ValueType = any>(
  props: RemoteSelectProps<ValueType>,
) {
  const debounce = props.debounce || DEFAULT_DEBOUNCE;
  const {
    loading,
    result,
    error,
    status,
    run,
  } = useDebouncedExecutePromise<RemoteSelectOption[]>({ debounce: debounce });
  const onSearchHandler = (value: string) => {
    run(() => {
      return props.fetch(value);
    });
  };
  return (
    <Select<ValueType>
      loading={loading}
      onSearch={onSearchHandler}
      options={result}
      {...props}
    />
  );
}

RemoteSelect.displayName = 'RemoteSelect';
