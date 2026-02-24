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

import { TypedFilter, TypedFilterProps } from '../TypedFilter';
import { MinusOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import React, { useState } from 'react';

import styles from './RemovableTypedFilter.module.css';

export interface RemovableTypedFilterProps extends TypedFilterProps {
  onRemove?: () => void;
}

export function RemovableTypedFilter(props: RemovableTypedFilterProps) {
  const { onRemove, ...rest } = props;
  const [showRemove, setShowRemove] = useState(false);
  if (!onRemove) {
    return <TypedFilter {...rest} />;
  }
  return (
    <Space
      onMouseOver={() => setShowRemove(true)}
      onMouseOut={() => setShowRemove(false)}
      style={{ width: '100%' }}
      className={styles.fullWidthItem}
    >
      <TypedFilter {...rest} />
      {showRemove && (
        <Button
          type="dashed"
          shape="circle"
          size={'small'}
          onClick={onRemove}
          icon={<MinusOutlined />}
        ></Button>
      )}
    </Space>
  );
}
