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

/**
 * antd types the root entry does not export by name, derived from what it
 * does export. antd has no `exports` map, so a deep path such as
 * 'antd/es/config-provider/SizeContext' does not resolve for an ES module
 * consumer under node16/nodenext; the published declarations import only
 * 'antd'.
 */

import type {
  ConfigProviderProps,
  GetProps,
  Image,
  MenuProps,
  SelectProps,
  TableColumnType,
  TableProps,
  Typography,
} from 'antd';

/** antd's `SizeType` (includes `undefined`). */
export type SizeType = ConfigProviderProps['componentSize'];

/** antd's table `SortOrder`: `'ascend' | 'descend' | null`. */
export type SortOrder = Exclude<TableColumnType<any>['sortOrder'], undefined>;

/** antd's table `SorterResult`. */
export type SorterResult<RecordType = any> = Exclude<
  Parameters<NonNullable<TableProps<RecordType>['onChange']>>[2],
  unknown[]
>;

/** antd's `Typography.Text` props. */
export type TextProps = GetProps<typeof Typography.Text>;

/** antd's `Typography.Link` props. */
export type LinkProps = GetProps<typeof Typography.Link>;

/** antd's `Image.PreviewGroup` props. */
export type PreviewGroupProps = GetProps<typeof Image.PreviewGroup>;

/** antd's menu `ItemType`. */
export type ItemType = NonNullable<MenuProps['items']>[number];

/** antd's select `DefaultOptionType`. */
export type DefaultOptionType = NonNullable<SelectProps['options']>[number];

/** antd's select `BaseOptionType`, the option constraint of `SelectProps`. */
export type BaseOptionType = Pick<
  DefaultOptionType,
  'disabled' | 'className' | 'title'
> & { [name: string]: any };
