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
import {
  UseDebouncedCallbackOptions,
  useDebouncedExecutePromise,
} from '@ahoo-wang/fetcher-react';
import { StyleCapable } from '../types';

export type DefaultRemoteSelectValueType = string | number;

export interface RemoteSelectOption<ValueType = DefaultRemoteSelectValueType> {
  label: string;
  value: ValueType;
  disabled?: boolean;
}

export interface RemoteSelectProps<ValueType = DefaultRemoteSelectValueType>
  extends Omit<SelectProps<ValueType, RemoteSelectOption<ValueType>>, 'options' | 'loading' | 'onSearch'>,
    StyleCapable {
  debounce?: UseDebouncedCallbackOptions;
  search: (search: string) => Promise<RemoteSelectOption<ValueType>[]>;
}

const DEFAULT_DEBOUNCE = {
  delay: 300,
  leading: false,
  trailing: true,
};

/**
 * A Select component that loads options from a remote API.
 * Supports automatic fetching, loading states, and error handling.
 */
export function RemoteSelect<ValueType = DefaultRemoteSelectValueType>(
  props: RemoteSelectProps<ValueType>,
) {
  const { debounce = DEFAULT_DEBOUNCE, search, ...selectProps } = props;
  const { loading, result, run } = useDebouncedExecutePromise<RemoteSelectOption<ValueType>[]>({ debounce: debounce });
  const onSearchHandler = (value: string) => {
    if (value.trim() === '' && result) {
      return;
    }
    run(() => {
      return search(value);
    });
  };
  return (
    <Select<ValueType, RemoteSelectOption<ValueType>>
      showSearch={true}
      loading={loading}
      onSearch={onSearchHandler}
      options={result}
      {...selectProps}
    />
  );
}

RemoteSelect.displayName = 'RemoteSelect';
