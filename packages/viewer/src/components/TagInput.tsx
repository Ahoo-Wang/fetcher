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

import { RefSelectProps, Select, SelectProps } from 'antd';
import { RefObject } from 'react';

/**
 * Props for the TagInput component.
 * Extends SelectProps from Antd, excluding 'mode', 'open', and 'suffixIcon' as they are fixed.
 */
export interface TagInputProps<ValueType = any>
  extends Omit<SelectProps<ValueType>, 'mode' | 'open' | 'suffixIcon'> {
  ref?: RefObject<RefSelectProps>;
}

/**
 * Default token separators for splitting input into tags.
 * Includes common separators like comma, semicolon, and space.
 */
const DEFAULT_TOKEN_SEPARATORS = [',', '，', ';', '；', ' '];

/**
 * A tag input component based on Antd's Select in tags mode.
 * Allows users to input multiple tags separated by specified token separators.
 * @param props - The props for the TagInput component.
 * @returns The rendered TagInput component.
 */
export function TagInput<ValueType = any>(props: TagInputProps<ValueType>) {
  const {
    tokenSeparators = DEFAULT_TOKEN_SEPARATORS,
    allowClear = true,
    ...restProps
  } = props;

  return (
    <Select<ValueType>
      {...restProps}
      mode={'tags'}
      open={false}
      suffixIcon={null}
      allowClear={allowClear}
      tokenSeparators={tokenSeparators}
    />
  );
}

TagInput.displayName = 'TagInput';
