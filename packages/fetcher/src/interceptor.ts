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

import { Fetcher, FetcherRequest } from './fetcher';

export interface FetchExchange {
  fetcher: Fetcher;
  url: string;
  request: FetcherRequest;
  response: Response | undefined;
  error: Error | any | undefined;
}

/**
 * 拦截器接口，定义了拦截器的基本结构
 * @template T - 拦截器处理的数据类型
 */
export interface Interceptor {
  /**
   * 拦截并处理数据
   * @param exchange - 需要处理的数据
   * @returns 处理后的数据，可以是同步或异步返回
   */
  intercept(exchange: FetchExchange): FetchExchange | Promise<FetchExchange>;
}

/**
 * 拦截器管理器类，用于管理同一类型的多个拦截器
 */
export class InterceptorManager implements Interceptor {
  private interceptors: Array<Interceptor | null> = [];

  /**
   * 添加拦截器到管理器中
   * @param interceptor - 要添加的拦截器
   * @returns 拦截器在管理器中的索引位置
   */
  use(interceptor: Interceptor): number {
    const index = this.interceptors.length;
    this.interceptors.push(interceptor);
    return index;
  }

  /**
   * 根据索引移除拦截器
   * @param index - 要移除的拦截器索引
   */
  eject(index: number): void {
    if (this.interceptors[index]) {
      this.interceptors[index] = null;
    }
  }

  /**
   * 清空所有拦截器
   */
  clear(): void {
    this.interceptors = [];
  }

  /**
   * 依次执行所有拦截器对数据的处理
   * @param exchange - 需要处理的数据
   * @returns 经过所有拦截器处理后的数据
   */
  async intercept(exchange: FetchExchange): Promise<FetchExchange> {
    let processedExchange = exchange;
    for (const interceptor of this.interceptors) {
      if (interceptor) {
        // 每个拦截器处理前一个拦截器的输出结果
        processedExchange = await interceptor.intercept(processedExchange);
      }
    }
    return processedExchange;
  }
}

/**
 * Fetcher拦截器集合类，包含请求、响应和错误拦截器管理器
 */
export class FetcherInterceptors {
  /**
   * 请求拦截器管理器
   */
  request: InterceptorManager = new InterceptorManager();

  /**
   * 响应拦截器管理器
   */
  response: InterceptorManager = new InterceptorManager();

  /**
   * 错误拦截器管理器
   */
  error: InterceptorManager = new InterceptorManager();
}
