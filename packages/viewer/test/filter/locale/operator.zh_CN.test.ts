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
import { describe, expect, it } from 'vitest';
import { OPERATOR_zh_CN } from '../../../src';
import { Operator } from '@ahoo-wang/fetcher-wow';

describe('OPERATOR_zh_CN', () => {
  it('should be an object', () => {
    expect(typeof OPERATOR_zh_CN).toBe('object');
    expect(OPERATOR_zh_CN).not.toBeNull();
  });

  it('should contain all operator translations', () => {
    const operators = Object.values(Operator);
    operators.forEach(operator => {
      expect(OPERATOR_zh_CN).toHaveProperty(operator);
      expect(typeof OPERATOR_zh_CN[operator]).toBe('string');
      expect(OPERATOR_zh_CN[operator].length).toBeGreaterThan(0);
    });
  });

  it('should have correct translations for logical operators', () => {
    expect(OPERATOR_zh_CN.AND).toBe('与');
    expect(OPERATOR_zh_CN.OR).toBe('或');
    expect(OPERATOR_zh_CN.NOR).toBe('非或');
  });

  it('should have correct translations for comparison operators', () => {
    expect(OPERATOR_zh_CN.EQ).toBe('等于');
    expect(OPERATOR_zh_CN.NE).toBe('不等于');
    expect(OPERATOR_zh_CN.GT).toBe('大于');
    expect(OPERATOR_zh_CN.LT).toBe('小于');
    expect(OPERATOR_zh_CN.GTE).toBe('大于等于');
    expect(OPERATOR_zh_CN.LTE).toBe('小于等于');
  });

  it('should have correct translations for containment operators', () => {
    expect(OPERATOR_zh_CN.CONTAINS).toBe('包含');
    expect(OPERATOR_zh_CN.IN).toBe('包含');
    expect(OPERATOR_zh_CN.NOT_IN).toBe('不包含');
    expect(OPERATOR_zh_CN.BETWEEN).toBe('在范围内');
    expect(OPERATOR_zh_CN.ALL_IN).toBe('全部包含');
  });

  it('should have correct translations for string operators', () => {
    expect(OPERATOR_zh_CN.STARTS_WITH).toBe('以...开头');
    expect(OPERATOR_zh_CN.ENDS_WITH).toBe('以...结尾');
  });

  it('should have correct translations for null and boolean operators', () => {
    expect(OPERATOR_zh_CN.NULL).toBe('为空');
    expect(OPERATOR_zh_CN.NOT_NULL).toBe('不为空');
    expect(OPERATOR_zh_CN.TRUE).toBe('为真');
    expect(OPERATOR_zh_CN.FALSE).toBe('为假');
    expect(OPERATOR_zh_CN.EXISTS).toBe('存在');
  });

  it('should have correct translations for date operators', () => {
    expect(OPERATOR_zh_CN.TODAY).toBe('今天');
    expect(OPERATOR_zh_CN.BEFORE_TODAY).toBe('今天之前');
    expect(OPERATOR_zh_CN.TOMORROW).toBe('明天');
    expect(OPERATOR_zh_CN.THIS_WEEK).toBe('本周');
    expect(OPERATOR_zh_CN.NEXT_WEEK).toBe('下周');
    expect(OPERATOR_zh_CN.LAST_WEEK).toBe('上周');
    expect(OPERATOR_zh_CN.THIS_MONTH).toBe('本月');
    expect(OPERATOR_zh_CN.LAST_MONTH).toBe('上月');
    expect(OPERATOR_zh_CN.RECENT_DAYS).toBe('最近几天');
    expect(OPERATOR_zh_CN.EARLIER_DAYS).toBe('几天前');
  });

  it('should have correct translations for special operators', () => {
    expect(OPERATOR_zh_CN.ALL).toBe('全部');
    expect(OPERATOR_zh_CN.RAW).toBe('原始查询');
    expect(OPERATOR_zh_CN.ELEM_MATCH).toBe('元素匹配');
  });

  it('should have correct translations for ID-related operators', () => {
    expect(OPERATOR_zh_CN.ID).toBe('等于');
    expect(OPERATOR_zh_CN.IDS).toBe('包含');
    expect(OPERATOR_zh_CN.AGGREGATE_ID).toBe('等于');
    expect(OPERATOR_zh_CN.AGGREGATE_IDS).toBe('包含');
    expect(OPERATOR_zh_CN.TENANT_ID).toBe('等于');
    expect(OPERATOR_zh_CN.OWNER_ID).toBe('等于');
    expect(OPERATOR_zh_CN.DELETED).toBe('已删除');
  });
});
