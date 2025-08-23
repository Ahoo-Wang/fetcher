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

import { FetcherRequest } from './fetcher';
import { FetchExchange } from './interceptor';

/**
 * 定义具有超时能力的接口
 */
export interface TimeoutCapable {
  /**
   * 请求超时
   * 当值为0时，表示不设置超时，默认值为 undefined
   */
  timeout?: number;
}

/**
 * 解析请求超时设置，优先使用请求级别的超时设置
 *
 * @param requestTimeout - 请求级别的超时设置
 * @param optionsTimeout - 配置级别的超时设置
 * @returns 解析后的超时设置
 */
export function resolveTimeout(
  requestTimeout?: number,
  optionsTimeout?: number,
): number | undefined {
  if (typeof requestTimeout !== 'undefined') {
    return requestTimeout;
  }
  return optionsTimeout;
}

/**
 * FetchTimeoutError 异常类
 * 当HTTP请求超时时抛出此异常
 */
export class FetchTimeoutError extends Error {
  exchange: FetchExchange;

  constructor(exchange: FetchExchange, timeout: number) {
    const method = exchange.request?.method || 'GET';
    const message = `Request timeout of ${timeout}ms exceeded for ${method} ${exchange.url}`;
    super(message);
    this.name = 'FetchTimeoutError';
    this.exchange = exchange;

    // 修复原型链
    Object.setPrototypeOf(this, FetchTimeoutError.prototype);
  }
}
