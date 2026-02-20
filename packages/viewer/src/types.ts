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

import React, { Key } from 'react';
import { ButtonProps } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';

export type Optional<T = any> = T | undefined;

export interface DataSourceCapable<RecordType = any> {
  list: RecordType[];
  total: number;
}

export interface StyleCapable {
  style?: React.CSSProperties;
  className?: string;
}

export interface AttributesCapable<Attributes = any> {
  attributes?: Attributes;
}

export interface PrimaryKeyClickHandlerCapable<RecordType = any> {
  onClickPrimaryKey?: (id: any, record: RecordType) => void;
}

export interface ViewTableSetting {
  title?: string
}

export interface ViewTableSettingCapable {
  viewTableSetting?: false | ViewTableSetting
}

export interface TableSizeCapable {
  tableSize?: SizeType;
}

export interface KeyCapable {
  key: Key;
}

export interface ReducerActionCapable<TYPE = any> {
  type: TYPE;
  payload: any;
}

export type TableRecordType<RecordType> = RecordType & KeyCapable;

export interface ActionItem<RecordType> extends AttributesCapable<
  Omit<ButtonProps, 'onClick'>
> {
  title: string;
  onClick: (records: RecordType[]) => void;
  render?: (records: RecordType[]) => React.ReactNode;
}


export type SaveViewMethod = 'Update' | 'SaveAs'

