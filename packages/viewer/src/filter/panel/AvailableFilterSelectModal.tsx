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

import { Modal, ModalProps } from 'antd';
import {
  AvailableFilter,
  AvailableFilterSelect,
  AvailableFilterSelectProps,
  AvailableFilterSelectRef,
} from './AvailableFilterSelect';
import React, { useRef } from 'react';

export interface AvailableFiltersModalProps extends Omit<ModalProps, 'onOk'> {
  availableFilters: Omit<AvailableFilterSelectProps, 'ref'>;
  onSave?: (filters: AvailableFilter[]) => void;
}

export function AvailableFilterSelectModal(props: AvailableFiltersModalProps) {
  const availableFilterSelectRef = useRef<AvailableFilterSelectRef>(null);
  const handleOk = () => {
    props?.onSave?.(availableFilterSelectRef.current?.getValue() ?? []);
  };
  return (
    <Modal {...props} onOk={handleOk} width={880}>
      <AvailableFilterSelect
        {...props.availableFilters}
        ref={availableFilterSelectRef}
      />
    </Modal>
  );
}
