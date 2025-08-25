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
 * 具备排序能力的接口
 *
 * 实现该接口的类型需要提供一个排序属性，用于确定执行顺序。
 * 数值越小优先级越高，相同数值的元素保持原有相对顺序。
 */
export interface OrderedCapable {
  /**
   * 排序值
   *
   * 数值越小优先级越高。负数、零和正数都支持。
   * 当多个元素具有相同的order值时，它们的相对顺序将保持不变（稳定排序）。
   */
  order: number;
}

/**
 * 对实现了OrderedCapable接口的数组进行排序
 *
 * 该函数创建并返回一个新的排序数组，不会修改原始数组。
 * 支持可选的过滤函数来筛选需要排序的元素。
 *
 * @template T - 数组元素类型，必须实现OrderedCapable接口
 * @param array - 需要排序的数组
 * @param filter - 可选的过滤函数，用于筛选需要参与排序的元素
 * @returns 排序后的新数组，按照order值升序排列
 *
 * @example
 * ```typescript
 * const items: OrderedCapable[] = [
 *   { order: 10 },
 *   { order: 5 },
 *   { order: 1 },
 * ];
 *
 * const sortedItems = toSorted(items);
 * // 结果: [{ order: 1 }, { order: 5 }, { order: 10 }]
 *
 * // 使用过滤函数
 * const filteredAndSorted = toSorted(items, item => item.order > 3);
 * // 结果: [{ order: 5 }, { order: 10 }]
 * ```
 */
export function toSorted<T extends OrderedCapable>(
  array: T[],
  filter?: (item: T) => boolean,
): T[] {
  if (filter) {
    return array.filter(filter).sort((a, b) => a.order - b.order);
  }
  return [...array].sort((a, b) => a.order - b.order);
}
